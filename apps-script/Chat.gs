/**
 * Learner-care chat for the landing page. Answers questions about the course
 * series with a low-cost model (Google Gemini by default, or any
 * OpenAI-compatible API), grounded in CHAT_SYSTEM_PROMPT (Knowledge.gs), and
 * logs each exchange to the 'Hỏi đáp' sheet. doPost in Code.gs routes requests
 * with action 'chat' here.
 *
 * Setup (full steps in README.md): add Chat.gs and Knowledge.gs to the Apps
 * Script project that holds Code.gs, set the CHAT_API_KEY script property to a
 * Google AI Studio key, run chatSelfTest once, then deploy a new version of
 * the existing web app so the /exec URL in dist/index.html keeps working.
 */

var CHAT_SHEET_NAME = 'Hỏi đáp';
var CHAT_HEADERS = ['Thời gian', 'Phiên', 'Câu hỏi', 'Trả lời', 'Trạng thái', 'Trang'];
// Tried in order; each Gemini model has its own free daily quota.
var CHAT_GEMINI_MODELS = 'gemini-3.5-flash-lite,gemini-3.1-flash-lite';
var CHAT_DEFAULT_MAX_PER_HOUR = 100;
var CHAT_MAX_PER_SESSION = 30;
var CHAT_HISTORY = 12;
var CHAT_MAX_QUESTION = 1000;
var CHAT_MAX_ANSWER = 6000;
var CHAT_MAX_OUTPUT = 1024;
// Seconds for all model attempts together; the page gives up waiting at 60.
var CHAT_TIME_BUDGET = 45;
var CHAT_OWN_NUMBERS = ['02822426789', '0949761636', '0912114511'];
// Gemini finish reasons that mean a content filter stopped the answer; other stops are provider failures.
var CHAT_FILTER_STOPS = ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_SAFETY'];
var CHAT_REFUSAL_REPLY = 'Em chưa trả lời được câu này. Anh/chị vui lòng gọi (028) 2242 6789, hoặc gọi/Zalo Ms. Vy 0949 761 636, Ms. Thảo 0912 114 511 để được tư vấn trực tiếp.';

// Run once from the editor after setup: it grants the external-request permission and
// shows in the execution log which model answered and what it said.
function chatSelfTest() {
  var config = chatConfig_();
  if (!config) throw new Error('Chat is not configured: check CHAT_API_KEY and CHAT_MODELS (required when CHAT_PROVIDER is openai), and CHAT_PROVIDER, CHAT_BASE_URL and CHAT_EXTRA_BODY if set (see README.md).');
  var result = askModel_(config, [{ role: 'user', content: 'Học phí Gói 1 là bao nhiêu?' }]);
  Logger.log(result.status + '\n' + (result.reply || ''));
}

function handleChat_(data) {
  var config = chatConfig_();
  // CHAT_MAX_PER_HOUR = 0 pauses the chat; visitors see the same "not running" message.
  if (!config || config.perHour === 0) return json_({ ok: false, error: 'not-configured' });

  var session = String(data.session || '');
  var messages = chatMessages_(data.messages);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(session) || !messages) return json_({ ok: false, error: 'bad-request' });

  var limit = chatAllow_(session, config.perHour);
  if (limit) return json_({ ok: false, error: limit === 'session' ? 'rate-limited' : 'overloaded' });

  var result = askModel_(config, messages);
  logChat_([session, messages[messages.length - 1].content, result.reply || '', result.status, clean_(data.page)]);
  if (!result.reply) return json_({ ok: false, error: result.permanent ? 'unavailable' : 'busy' });
  return json_({ ok: true, reply: result.reply });
}

// Script properties: CHAT_API_KEY (required), CHAT_PROVIDER ('gemini' or 'openai'),
// CHAT_MODELS (comma-separated, tried in order), CHAT_BASE_URL (openai only),
// CHAT_EXTRA_BODY (JSON merged into each request), CHAT_MAX_PER_HOUR.
function chatConfig_() {
  var props = PropertiesService.getScriptProperties();
  var get = function (name) { return String(props.getProperty(name) || '').trim(); };
  var provider = (get('CHAT_PROVIDER') || 'gemini').toLowerCase();
  var models = (get('CHAT_MODELS') || (provider === 'gemini' ? CHAT_GEMINI_MODELS : ''))
    .split(',')
    .map(function (model) { return model.trim(); })
    .filter(Boolean);
  var cap = get('CHAT_MAX_PER_HOUR') === '' ? NaN : Number(get('CHAT_MAX_PER_HOUR'));
  var config = {
    provider: provider,
    apiKey: get('CHAT_API_KEY'),
    models: models,
    baseUrl: get('CHAT_BASE_URL').replace(/\/+$/, ''),
    extra: null,
    perHour: isFinite(cap) && cap >= 0 ? Math.floor(cap) : CHAT_DEFAULT_MAX_PER_HOUR
  };
  if (get('CHAT_EXTRA_BODY')) {
    try {
      config.extra = JSON.parse(get('CHAT_EXTRA_BODY'));
    } catch (err) {
      return null;
    }
  }
  if (!config.apiKey || !models.length) return null;
  if (provider === 'openai' ? !config.baseUrl : provider !== 'gemini') return null;
  return config;
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

// Returns '' when allowed, else which limit was hit. Both counters reset each clock hour.
// Cache counters are approximate under concurrency; they bound quota use, not exact limits.
function chatAllow_(session, perHour) {
  var cache = CacheService.getScriptCache();
  var stamp = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMddHH');
  var hourKey = 'chat_h_' + stamp;
  var sessionKey = 'chat_s_' + session + '_' + stamp;
  var hour = Number(cache.get(hourKey)) || 0;
  var mine = Number(cache.get(sessionKey)) || 0;
  if (mine >= CHAT_MAX_PER_SESSION) return 'session';
  if (hour >= perHour) return 'hour';
  cache.put(hourKey, String(hour + 1), 3700);
  cache.put(sessionKey, String(mine + 1), 3700);
  return '';
}

// Tries each configured model until one answers, within CHAT_TIME_BUDGET. A single model
// gets one retry on a transient failure. Key and billing failures stop at once because every
// model shares them. 'permanent' means no attempt is worth repeating soon (bad key, quota
// used up for the day, model gone), so the page can skip its "try again" button.
function askModel_(config, messages) {
  var sent = messages.map(function (turn) {
    return { role: turn.role, content: turn.role === 'user' ? maskPersonal_(turn.content) : turn.content };
  });
  var queue = config.models.length === 1 ? [config.models[0], config.models[0]] : config.models;
  var deadline = Date.now() + CHAT_TIME_BUDGET * 1000;
  var tried = [];
  var last = null;
  var permanent = true;
  for (var i = 0; i < queue.length; i++) {
    var repeat = i > 0 && queue[i] === queue[i - 1];
    if (repeat && !last.transient) break;
    var left = Math.floor((deadline - Date.now()) / 1000);
    if (left < (repeat ? 10 : 8)) {
      tried.push('skipped-time ' + queue[i]);
      permanent = false;
      break;
    }
    if (repeat) Utilities.sleep(1500);
    var timeout = Math.max(5, Math.floor((left - (repeat ? 2 : 0)) / (queue.length - i)));
    last = config.provider === 'gemini'
      ? askGemini_(config, queue[i], sent, timeout)
      : askOpenAI_(config, queue[i], sent, timeout);
    tried.push(last.status + ' ' + queue[i]);
    if (last.reply) return { status: tried.join('; '), reply: last.reply };
    if (last.transient) permanent = false;
    if (last.final) break;
  }
  return { status: tried.join('; '), permanent: permanent && tried.length > 0 };
}

function askGemini_(config, model, messages, timeout) {
  var generationConfig = { maxOutputTokens: CHAT_MAX_OUTPUT };
  var thinking = geminiThinking_(model);
  if (thinking) generationConfig.thinkingConfig = thinking;
  var body = mergeExtra_({
    // The date note is the last part, so the long prompt stays an identical, cacheable prefix.
    systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }, { text: chatDateNote_() }] },
    contents: messages.map(function (turn) {
      return { role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] };
    }),
    generationConfig: generationConfig
  }, config.extra);
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  var res = postJson_(url, { 'x-goog-api-key': config.apiKey }, body, timeout);
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

// Any host with an OpenAI-style /chat/completions endpoint (DeepSeek, Cloudflare Workers AI,
// Groq, OpenRouter). Host-specific switches, such as turning reasoning off, go in CHAT_EXTRA_BODY.
function askOpenAI_(config, model, messages, timeout) {
  var body = mergeExtra_({
    model: model,
    max_tokens: CHAT_MAX_OUTPUT,
    messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT + chatDateNote_() }].concat(messages)
  }, config.extra);
  var res = postJson_(config.baseUrl + '/chat/completions', { Authorization: 'Bearer ' + config.apiKey }, body, timeout);
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
    transient: !code || (code === 429 && !daily) || code >= 500
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
