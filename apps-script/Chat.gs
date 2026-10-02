/**
 * Learner-care chat for the landing page. Answers questions about the course
 * series with Claude, grounded in CHAT_SYSTEM_PROMPT (Knowledge.gs), and logs
 * each exchange to the 'Hỏi đáp' sheet. doPost in Code.gs routes requests
 * with action 'chat' here.
 *
 * Setup (full steps in README.md): add Chat.gs and Knowledge.gs to the Apps
 * Script project that holds Code.gs, set the ANTHROPIC_API_KEY script
 * property, run chatSelfTest once, then deploy a new version of the existing
 * web app so the /exec URL in dist/index.html keeps working.
 */

var CHAT_SHEET_NAME = 'Hỏi đáp';
var CHAT_HEADERS = ['Thời gian', 'Phiên', 'Câu hỏi', 'Trả lời', 'Trạng thái', 'Trang'];
var CHAT_DEFAULT_MODEL = 'claude-opus-5-5';
var CHAT_DEFAULT_MAX_PER_HOUR = 200;
var CHAT_MAX_PER_SESSION = 30;
var CHAT_HISTORY = 12;
var CHAT_MAX_QUESTION = 1000;
var CHAT_MAX_ANSWER = 6000;
// Models that accept fallbacks: 'default' (beta server-side-fallback-2026-07-01).
var CHAT_FALLBACK_MODELS = ['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5'];
var CHAT_REFUSAL_REPLY = 'Em chưa trả lời được câu này. Anh/chị vui lòng gọi (028) 2242 6789, hoặc gọi/Zalo Ms. Vy 0949 761 636, Ms. Thảo 0912 114 511 để được tư vấn trực tiếp.';

// Run once from the editor after setup: it grants the external-request permission and
// shows in the execution log whether the key and model answer.
function chatSelfTest() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Set the ANTHROPIC_API_KEY script property first.');
  var result = askClaude_(apiKey, props.getProperty('CHAT_MODEL') || CHAT_DEFAULT_MODEL, [{ role: 'user', content: 'Học phí Gói 1 là bao nhiêu?' }]);
  Logger.log(result.status + '\n' + (result.reply || ''));
}

function handleChat_(data) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) return json_({ ok: false, error: 'not-configured' });

  var session = String(data.session || '');
  var messages = chatMessages_(data.messages);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(session) || !messages) return json_({ ok: false, error: 'bad-request' });

  var perHour = Number(props.getProperty('CHAT_MAX_PER_HOUR')) || CHAT_DEFAULT_MAX_PER_HOUR;
  if (!chatAllow_(session, perHour)) return json_({ ok: false, error: 'rate-limited' });

  var result = askClaude_(apiKey, props.getProperty('CHAT_MODEL') || CHAT_DEFAULT_MODEL, messages);
  logChat_([session, messages[messages.length - 1].content, result.reply || '', result.status, clean_(data.page)]);
  if (!result.reply) return json_({ ok: false, error: 'busy' });
  return json_({ ok: true, reply: result.reply });
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

// Cache counters are approximate under concurrency; they bound spend, not exact quotas.
function chatAllow_(session, perHour) {
  var cache = CacheService.getScriptCache();
  var hourKey = 'chat_h_' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMddHH');
  var sessionKey = 'chat_s_' + session;
  var hour = Number(cache.get(hourKey)) || 0;
  var mine = Number(cache.get(sessionKey)) || 0;
  if (hour >= perHour || mine >= CHAT_MAX_PER_SESSION) return false;
  cache.put(hourKey, String(hour + 1), 3700);
  cache.put(sessionKey, String(mine + 1), 3600);
  return true;
}

function askClaude_(apiKey, model, messages) {
  var today = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  var body = {
    model: model,
    max_tokens: 4096,
    system: [
      { type: 'text', text: CHAT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral', ttl: '1h' } },
      // After the cache breakpoint, so the date change does not invalidate the cached prompt.
      { type: 'text', text: 'Hôm nay là ngày ' + today + ' (giờ Việt Nam).' }
    ],
    messages: messages
  };
  var headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
  // Haiku 4.5 rejects the effort setting.
  if (!/^claude-haiku/.test(model)) body.output_config = { effort: 'low' };
  if (CHAT_FALLBACK_MODELS.indexOf(model) !== -1) {
    body.fallbacks = 'default';
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  }
  var request = {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  };

  var response;
  for (var attempt = 0; attempt < 2; attempt++) {
    try {
      response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', request);
    } catch (err) {
      return { status: 'error-network' };
    }
    var code = response.getResponseCode();
    if (code === 200) break;
    if (attempt === 0 && (code === 429 || code >= 500)) {
      Utilities.sleep(1500);
      continue;
    }
    return { status: 'error-' + code };
  }

  var message;
  try {
    message = JSON.parse(response.getContentText());
  } catch (err) {
    return { status: 'error-parse' };
  }
  if (message.stop_reason === 'refusal') return { status: 'refusal', reply: CHAT_REFUSAL_REPLY };

  // A server-side fallback leaves a 'fallback' block; only text after the last one is the answer.
  var blocks = message.content || [];
  var start = 0;
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].type === 'fallback') start = i + 1;
  }
  var reply = blocks.slice(start)
    .filter(function (block) { return block.type === 'text'; })
    .map(function (block) { return block.text; })
    .join('')
    .trim();
  if (!reply) return { status: 'error-empty' };
  return { status: message.stop_reason === 'max_tokens' ? 'ok-truncated' : 'ok', reply: reply };
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
