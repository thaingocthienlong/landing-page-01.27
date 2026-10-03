/**
 * Learner-care chat for the landing page. Each question is first looked up in the staff-kept FAQ
 * tab (Faq.gs); a clear match is answered with the approved wording. Other questions go to a
 * chain of low-cost models (Google Gemini by default, then optional OpenAI-compatible hosts such
 * as Cloudflare Workers AI or the office PC), grounded in CHAT_SYSTEM_PROMPT (Knowledge.gs) and
 * the closest FAQ rows. Every exchange is logged to the 'Hỏi đáp' sheet. doPost in Code.gs
 * routes requests with action 'chat' here.
 *
 * Setup (full steps in README.md): add the .gs files to the Apps Script project that holds
 * Code.gs, run setupFaq once, set the CHAT_API_KEY script property to a Google AI Studio key,
 * run chatSelfTest, then deploy a new version of the existing web app so the /exec URL in
 * dist/index.html keeps working.
 */

var CHAT_SHEET_NAME = 'Hỏi đáp';
var CHAT_HEADERS = ['Thời gian', 'Phiên', 'Câu hỏi', 'Trả lời', 'Trạng thái', 'Trang'];
// Model providers, tried in this order. Each reads <prefix>PROVIDER, API_KEY, MODELS, BASE_URL,
// EXTRA_BODY and HEADERS from the script properties; a provider without a key is skipped.
var CHAT_GROUPS = ['CHAT_', 'CHAT2_', 'CHAT3_'];
// Default models of the first provider; each Gemini model has its own free daily quota.
var CHAT_GEMINI_MODELS = 'gemini-3.5-flash-lite,gemini-3.1-flash-lite';
var CHAT_DEFAULT_MAX_PER_HOUR = 100;
var CHAT_MAX_PER_SESSION = 30;
var CHAT_HISTORY = 12;
var CHAT_MAX_QUESTION = 1000;
var CHAT_MAX_ANSWER = 6000;
var CHAT_MAX_OUTPUT = 1024;
// Seconds for all model attempts together; the page gives up waiting at 60.
var CHAT_TIME_BUDGET = 45;
var CHAT_CALL_MAX = 25;
// A host that cannot be reached (the office PC switched off) is skipped for this long.
var CHAT_DOWN_SECONDS = 180;
var CHAT_OWN_NUMBERS = ['02822426789', '0949761636', '0912114511'];
// Gemini finish reasons that mean a content filter stopped the answer; other stops are provider failures.
var CHAT_FILTER_STOPS = ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_SAFETY'];
var CHAT_CONTACTS = 'gọi (028) 2242 6789, hoặc gọi/Zalo Ms. Vy 0949 761 636, Ms. Thảo 0912 114 511';
var CHAT_REFUSAL_REPLY = 'Em chưa trả lời được câu này. Anh/chị vui lòng ' + CHAT_CONTACTS + ' để được tư vấn trực tiếp.';
var CHAT_SUGGEST_REPLY = 'Em chưa chắc anh/chị đang hỏi điều nào. Anh/chị chọn câu gần nhất bên dưới, hoặc ' + CHAT_CONTACTS + '.';
var CHAT_NO_ANSWER_REPLY = 'Em chưa có câu trả lời cho câu hỏi này. Anh/chị vui lòng ' + CHAT_CONTACTS + ' để được tư vấn trực tiếp.';

// Run from the editor after setup and after changing providers: it grants the external-request
// permission and logs, for each configured provider, which model answered and what it said.
function chatSelfTest() {
  var sample = 'Học phí Gói 1 là bao nhiêu?';
  var faq = faqLookup_(sample);
  Logger.log('FAQ: ' + (faq.answer ? 'faq:' + faq.answer.id : 'no confident match') + ' (' + faqRowsCount_() + ' rows)');
  var config = chatConfig_();
  if (!config.groups.length) {
    Logger.log('No AI provider configured: the chat answers from the FAQ only. Check CHAT_API_KEY, and CHAT_MODELS (required when CHAT_PROVIDER is openai), CHAT_BASE_URL, CHAT_EXTRA_BODY and CHAT_HEADERS if set (see README.md).');
    return;
  }
  config.groups.forEach(function (group) {
    CacheService.getScriptCache().remove('chat_down_' + group.name);
    var result = askModel_({ groups: [group] }, [{ role: 'user', content: sample }], []);
    Logger.log(group.name + ': ' + result.status + '\n' + (result.reply || ''));
  });
}

function handleChat_(data) {
  var session = String(data.session || '');
  var messages = chatMessages_(data.messages);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(session) || !messages) return json_({ ok: false, error: 'bad-request' });
  if (!chatSessionAllow_(session)) return json_({ ok: false, error: 'rate-limited' });

  var question = messages[messages.length - 1].content;
  var log = function (reply, status) { logChat_([session, question, reply, status, clean_(data.page)]); };
  var faq = faqLookup_(question);
  if (faq.answer) {
    log(faq.answer.answer, 'faq:' + faq.answer.id);
    return json_({ ok: true, reply: faq.answer.answer });
  }

  // CHAT_MAX_PER_HOUR = 0 pauses the AI; the FAQ keeps answering.
  var config = chatConfig_();
  var result = { status: 'no-ai' };
  if (config.groups.length && config.perHour > 0) {
    result = chatHourAllow_(config.perHour) ? askModel_(config, messages, faq.candidates) : { status: 'over-hour-cap', busy: 'overloaded' };
  }
  if (result.reply) {
    log(result.reply, result.status);
    return json_({ ok: true, reply: result.reply });
  }
  // No model answered: offer the closest FAQ questions, or say plainly there is no answer.
  var suggestions = faq.candidates.map(function (row) { return row.question; });
  if (suggestions.length) {
    log(CHAT_SUGGEST_REPLY, result.status + '; faq-suggest');
    return json_({ ok: true, reply: CHAT_SUGGEST_REPLY, suggestions: suggestions });
  }
  log('', result.status);
  if (result.status === 'no-ai') return json_({ ok: true, reply: CHAT_NO_ANSWER_REPLY });
  return json_({ ok: false, error: result.busy || (result.permanent ? 'unavailable' : 'busy') });
}

// { groups: [providers to try, in order], perHour }. See CHAT_GROUPS; CHAT_MAX_PER_HOUR caps
// AI calls per clock hour across all visitors.
function chatConfig_() {
  var props = PropertiesService.getScriptProperties();
  var get = function (name) { return String(props.getProperty(name) || '').trim(); };
  var groups = [];
  CHAT_GROUPS.forEach(function (prefix, i) {
    var provider = (get(prefix + 'PROVIDER') || (i === 0 ? 'gemini' : 'openai')).toLowerCase();
    var models = (get(prefix + 'MODELS') || (i === 0 && provider === 'gemini' ? CHAT_GEMINI_MODELS : ''))
      .split(',')
      .map(function (model) { return model.trim(); })
      .filter(Boolean);
    var group = {
      name: prefix.slice(0, -1),
      provider: provider,
      apiKey: get(prefix + 'API_KEY'),
      models: models,
      baseUrl: get(prefix + 'BASE_URL').replace(/\/+$/, ''),
      extra: chatJson_(get(prefix + 'EXTRA_BODY')),
      headers: chatJson_(get(prefix + 'HEADERS'))
    };
    if (!group.apiKey || !models.length || group.extra === undefined || group.headers === undefined) return;
    if (provider === 'openai' ? !group.baseUrl : provider !== 'gemini') return;
    groups.push(group);
  });
  var cap = get('CHAT_MAX_PER_HOUR') === '' ? NaN : Number(get('CHAT_MAX_PER_HOUR'));
  return { groups: groups, perHour: isFinite(cap) && cap >= 0 ? Math.floor(cap) : CHAT_DEFAULT_MAX_PER_HOUR };
}

// Parsed JSON object, null when empty, undefined when it is not a JSON object (that provider is skipped).
function chatJson_(text) {
  if (!text) return null;
  try {
    var value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
  } catch (err) {
    return undefined;
  }
}

// Keeps the latest turns, which must alternate user/assistant and end on the user's question.
function chatMessages_(raw) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 40) return null;
  var list = raw.slice(-CHAT_HISTORY);
  if (list[0] && list[0].role === 'assistant') list = list.slice(1);
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i] || {};
    var role = i % 2 === 0 ? 'user' : 'assistant';
    var content = String(item.content === undefined || item.content === null ? '' : item.content).trim();
    if (item.role !== role || !content) return null;
    if (role === 'user' && content.length > CHAT_MAX_QUESTION) return null;
    out.push({ role: role, content: content.slice(0, CHAT_MAX_ANSWER) });
  }
  return out.length && out[out.length - 1].role === 'user' ? out : null;
}

// Counters reset each clock hour. They are approximate under concurrency; they bound quota
// use, not exact limits. A visitor's questions all count; the shared cap counts AI calls only.
function chatSessionAllow_(session) {
  return chatCount_('chat_s_' + session + '_', CHAT_MAX_PER_SESSION);
}

function chatHourAllow_(perHour) {
  return chatCount_('chat_h_', perHour);
}

function chatCount_(prefix, limit) {
  var cache = CacheService.getScriptCache();
  var key = prefix + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMddHH');
  var count = Number(cache.get(key)) || 0;
  if (count >= limit) return false;
  cache.put(key, String(count + 1), 3700);
  return true;
}

// Tries each provider's models in order until one answers, within CHAT_TIME_BUDGET. A lone
// model gets one retry on a transient failure. A key or billing failure skips the rest of that
// provider, and an unreachable OpenAI-compatible host is skipped for CHAT_DOWN_SECONDS.
// 'permanent' means no attempt is worth repeating soon (bad key, quota used up for the day,
// model gone), so the page can drop its "try again" button.
function askModel_(config, messages, references) {
  var sent = messages.map(function (turn) {
    return { role: turn.role, content: turn.role === 'user' ? maskPersonal_(turn.content) : turn.content };
  });
  var queue = [];
  config.groups.forEach(function (group) {
    group.models.forEach(function (model) { queue.push({ group: group, model: model }); });
  });
  if (queue.length === 1) queue.push(queue[0]);
  var system = chatReferences_(references || []);
  var cache = CacheService.getScriptCache();
  var deadline = Date.now() + CHAT_TIME_BUDGET * 1000;
  var tried = [];
  var last = null;
  var stopped = {};
  var permanent = true;
  for (var i = 0; i < queue.length; i++) {
    var entry = queue[i];
    var name = entry.group.name;
    var repeat = i > 0 && entry === queue[i - 1];
    if (repeat && !last.transient) break;
    if (stopped[name]) continue;
    if (entry.group.provider === 'openai' && cache.get('chat_down_' + name)) {
      tried.push('skipped-down ' + entry.model);
      stopped[name] = true;
      permanent = false;
      continue;
    }
    var left = Math.floor((deadline - Date.now()) / 1000);
    if (left < (repeat ? 10 : 8)) {
      tried.push('skipped-time ' + entry.model);
      permanent = false;
      break;
    }
    if (repeat) {
      Utilities.sleep(1500);
      left -= 2;
    }
    // Later attempts keep about 5 s each, so a hung first model cannot use up the whole budget.
    var timeout = Math.max(5, Math.min(CHAT_CALL_MAX, left - 5 * (queue.length - i - 1)));
    last = entry.group.provider === 'gemini'
      ? askGemini_(entry.group, entry.model, sent, timeout, system)
      : askOpenAI_(entry.group, entry.model, sent, timeout, system);
    tried.push(last.status + ' ' + entry.model);
    if (last.reply) return { status: tried.join('; '), reply: last.reply };
    if (last.transient) permanent = false;
    if (last.final) stopped[name] = true;
    if (last.unreachable && entry.group.provider === 'openai') {
      cache.put('chat_down_' + name, '1', CHAT_DOWN_SECONDS);
      stopped[name] = true;
    }
  }
  return { status: tried.join('; '), permanent: permanent && tried.length > 0 };
}

// The closest FAQ rows, sent after the cached prompt so the model can reuse staff wording.
function chatReferences_(rows) {
  if (!rows.length) return '';
  return '\n\n# Câu hỏi thường gặp gần nhất (Viện soạn; dùng nếu đúng ý người hỏi, không thì bỏ qua)\n' + rows.map(function (row) {
    return 'Hỏi: ' + row.question + '\nĐáp: ' + row.answer;
  }).join('\n');
}

function askGemini_(group, model, messages, timeout, references) {
  var generationConfig = { maxOutputTokens: CHAT_MAX_OUTPUT };
  var thinking = geminiThinking_(model);
  if (thinking) generationConfig.thinkingConfig = thinking;
  var body = mergeExtra_({
    // The date note and FAQ rows come last, so the long prompt stays an identical, cacheable prefix.
    systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }, { text: chatDateNote_() + references }] },
    contents: messages.map(function (turn) {
      return { role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] };
    }),
    generationConfig: generationConfig
  }, group.extra);
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  var res = postJson_(url, { 'x-goog-api-key': group.apiKey }, body, timeout);
  if (res.code !== 200) return failure_(res.code, res.json);
  if (!res.json) return { status: 'error-parse', transient: true };

  var candidate = (res.json.candidates || [])[0];
  if (!candidate) {
    var blocked = (res.json.promptFeedback || {}).blockReason;
    return blocked ? refusal_('blocked-' + blocked) : { status: 'error-empty', transient: true };
  }
  var reason = candidate.finishReason || 'STOP';
  if (CHAT_FILTER_STOPS.indexOf(reason) !== -1) return refusal_('blocked-' + reason);
  if (reason !== 'STOP' && reason !== 'MAX_TOKENS') return { status: 'error-finish-' + reason, transient: true };
  var reply = ((candidate.content || {}).parts || [])
    .filter(function (part) { return part.text && !part.thought; })
    .map(function (part) { return part.text; })
    .join('')
    .trim();
  if (!reply) return { status: 'error-empty', transient: true };
  return { status: reason === 'MAX_TOKENS' ? 'ok-truncated' : 'ok', reply: reply };
}

// Gemini 3 and later cannot turn thinking off: Flash-Lite takes MINIMAL, larger models at least
// LOW. 2.5 models use the older budget field. Gemma 4 accepts only MINIMAL or HIGH and thinks
// unless told MINIMAL. Other models get no thinking setting.
function geminiThinking_(model) {
  if (/^gemma-4/.test(model)) return { thinkingLevel: 'MINIMAL' };
  var match = /^gemini-(\d+(?:\.\d+)?)-/.exec(model);
  if (!match) return null;
  if (Number(match[1]) < 3) return { thinkingBudget: 0 };
  return { thinkingLevel: /flash-lite/.test(model) ? 'MINIMAL' : 'LOW' };
}

// Any host with an OpenAI-style /chat/completions endpoint (Cloudflare Workers AI, the office PC
// running llama-server, DeepSeek, Groq, OpenRouter). Host-specific switches, such as turning
// reasoning off, go in <prefix>EXTRA_BODY; extra headers (a tunnel's access token) in <prefix>HEADERS.
function askOpenAI_(group, model, messages, timeout, references) {
  var body = mergeExtra_({
    model: model,
    max_tokens: CHAT_MAX_OUTPUT,
    messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT + chatDateNote_() + references }].concat(messages)
  }, group.extra);
  var headers = mergeExtra_({}, group.headers);
  headers.Authorization = 'Bearer ' + group.apiKey;
  var res = postJson_(group.baseUrl + '/chat/completions', headers, body, timeout);
  if (res.code !== 200) return failure_(res.code, res.json);
  var choice = res.json && res.json.choices && res.json.choices[0];
  if (!choice) return { status: 'error-parse', transient: true };
  if (choice.finish_reason === 'content_filter') return refusal_('blocked-content_filter');
  var reply = stripThinking_(String((choice.message && choice.message.content) || ''));
  if (!reply) return { status: choice.finish_reason === 'length' ? 'error-thinking-length' : 'error-empty', transient: true };
  return { status: choice.finish_reason === 'length' ? 'ok-truncated' : 'ok', reply: reply };
}

// Some hosts return a reasoning model's thinking inline. Drop complete <think> blocks, a block
// cut off by the length limit, and reasoning before a lone </think> (templates that prefill <think>).
function stripThinking_(text) {
  var reply = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '');
  var close = reply.lastIndexOf('</think>');
  if (close !== -1) reply = reply.slice(close + '</think>'.length);
  return reply.trim();
}

function postJson_(url, headers, body, timeout) {
  var response;
  try {
    response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: JSON.stringify(body),
      muteHttpExceptions: true,
      timeoutSeconds: timeout
    });
  } catch (err) {
    return { code: 0, json: null };
  }
  var json = null;
  try {
    json = JSON.parse(response.getContentText());
  } catch (err) {
    json = null;
  }
  return { code: response.getResponseCode(), json: json };
}

// Final: the key or billing is the problem (401/402/403, Gemini's API_KEY_INVALID or
// FAILED_PRECONDITION 400), so every model fails the same way. Transient: worth another model
// or one retry (network, 5xx, a per-minute 429). A daily quota (Gemini PerDay, Cloudflare 3036)
// still moves to the next model, which has its own quota, but is not retried on the same one.
function failure_(code, json) {
  var error = (json && json.error) || {};
  var detail = JSON.stringify(error.details || []);
  var cloudflare = json && json.errors && json.errors[0] ? json.errors[0].code : null;
  var keyProblem = code === 400 && (/API_KEY_INVALID/.test(detail) || error.status === 'FAILED_PRECONDITION');
  var daily = code === 429 && (/PerDay/.test(detail) || cloudflare === 3036);
  return {
    status: code ? 'error-' + code + (daily ? '-daily' : '') : 'error-network',
    final: code === 401 || code === 402 || code === 403 || keyProblem,
    transient: !code || (code === 429 && !daily) || code >= 500,
    // No connection, or a tunnel whose machine is off (Cloudflare answers 530, a proxy 502).
    unreachable: !code || code === 502 || code === 530
  };
}

function refusal_(status) {
  return { status: status, reply: CHAT_REFUSAL_REPLY };
}

function mergeExtra_(body, extra) {
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    for (var key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) body[key] = extra[key];
    }
  }
  return body;
}

// Free model tiers may keep prompts to improve the provider's products, so a learner's own
// email, phone and ID numbers are masked before the question leaves Apps Script. The sheet
// log keeps the original. The institute's own numbers pass through. Names are not detected.
function maskPersonal_(text) {
  return text
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]')
    // Phones: a leading 0 (area code may be bracketed) or a country code (+84, 84, (+84), with an
    // optional (0)), then digits with single spaces, dots or hyphens between them. The first two
    // digits must touch, so decimal lists such as "0.85 0.75" are left alone. Only 10 or 11
    // digit results are masked, so part of a grouped ID number is not taken for a phone.
    .replace(/(?<![\d.,])(?:(?:\(\+?84\)|\+84|84)[\s.\-]?(?:\(0\)[\s.\-]?)?|\(?0)\d(?:\)?[\s.\-]?\d){7,9}(?!\d|[.,]\d)/g, function (found) {
      var digits = found.replace(/\D/g, '').replace(/^840?/, '0');
      if (digits.length < 10 || digits.length > 11) return found;
      return CHAT_OWN_NUMBERS.indexOf(digits) !== -1 ? found : '[số điện thoại]';
    })
    // ID numbers (CCCD 12 digits, old CMND 9), unbroken or in groups of 3 or 4, never right
    // after a country code (that is one of the institute's numbers the phone rule kept).
    .replace(/(?<![\d.,])(?<!84\)?[\s.\-])\d{3,4}(?:[ \-]\d{3,4}){2,3}(?![\d.,]|[ \-]\d)/g, function (found) {
      var length = found.replace(/\D/g, '').length;
      return length === 9 || length === 12 ? '[số giấy tờ]' : found;
    })
    .replace(/(?<![\d.,])(?:\d{12}|\d{9})(?!\d|[.,]\d)/g, '[số giấy tờ]');
}

function logChat_(values) {
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = book.getSheetByName(CHAT_SHEET_NAME);
    if (!sheet) {
      sheet = book.insertSheet(CHAT_SHEET_NAME);
      sheet.appendRow(CHAT_HEADERS);
      sheet.getRange(1, 1, 1, CHAT_HEADERS.length).setFontWeight('bold').setBackground('#0a3d91').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    var when = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([when].concat(values).map(textCell_));
  } catch (err) {
    // A failed log must not cost the learner their answer.
  }
}

// The leading apostrophe stores the value as text, so learner input is never run as a formula
// and the timestamp is not reparsed in the sheet's locale.
function textCell_(value) {
  return "'" + String(value === undefined || value === null ? '' : value).slice(0, 5000);
}
