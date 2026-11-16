/**
 * Learner-care chat for the landing page. Each message is first looked up in the staff-kept FAQ
 * tab (Faq.gs). The AI then talks the learner through it, a few short messages a turn, from the
 * prompt in Knowledge.gs (with the facts of the 'Thông tin thêm' tab) and the closest FAQ rows:
 * a chain of models: Claude (Anthropic) when its key is set, then Google Gemini, then optional
 * OpenAI-compatible hosts such as Cloudflare Workers AI or the office PC. An AI answer with a
 * figure the Institute's text does not support is dropped. When no model gives a usable answer, a message that asks something
 * and clearly matches a row gets that row's approved wording, as every clear match does while
 * no AI is set up. Every exchange is logged to the 'Hỏi đáp' sheet. doPost in Code.gs routes
 * requests with action 'chat' here.
 *
 * Setup (full steps in README.md): add the .gs files to the Apps Script project that holds
 * Code.gs, run setupFaq once, set the CLAUDE_API_KEY script property to an Anthropic API key
 * and/or CHAT_API_KEY to a Google AI Studio key, run chatSelfTest, then deploy a new version of
 * the existing web app so the /exec URL in dist/index.html keeps working.
 */

var CHAT_SHEET_NAME = 'Hỏi đáp';
var CHAT_HEADERS = ['Thời gian', 'Phiên', 'Câu hỏi', 'Trả lời', 'Trạng thái', 'Trang'];
// Model providers, tried in this order. Each reads <prefix>PROVIDER, API_KEY, MODELS, BASE_URL,
// EXTRA_BODY and HEADERS from the script properties; a provider without a key is skipped.
var CHAT_GROUPS = ['CLAUDE_', 'CHAT_', 'CHAT2_', 'CHAT3_'];
// Provider of each prefix when its PROVIDER property is empty; any other prefix is 'openai'.
var CHAT_GROUP_PROVIDERS = { CLAUDE_: 'anthropic', CHAT_: 'gemini' };
// Default models of CHAT_ when it is Gemini; each Gemini model has its own free daily quota.
var CHAT_GEMINI_MODELS = 'gemini-3.5-flash-lite,gemini-3.1-flash-lite';
// Default model of an Anthropic provider, and Anthropic's Messages API.
var CHAT_CLAUDE_MODELS = 'claude-opus-5-5';
var CHAT_CLAUDE_URL = 'https://api.anthropic.com/v1';
var CHAT_CLAUDE_VERSION = '2026-10-21';
// Current Claude models always think, and the thinking counts toward max_tokens; the replies
// themselves stay short (the prompt sets their length).
var CHAT_CLAUDE_MAX_TOKENS = 16000;
var CHAT_DEFAULT_MAX_PER_HOUR = 100;
// A consultation is many short turns (a tapped quick reply is one), so a visitor gets room.
var CHAT_MAX_PER_SESSION = 60;
// Messages the model reads (30 exchanges), so what the learner said about themselves early on
// is still there. More than CHAT_MAX_SENT messages in one request is refused.
var CHAT_HISTORY = 60;
var CHAT_MAX_SENT = 80;
var CHAT_MAX_QUESTION = 1000;
var CHAT_MAX_ANSWER = 6000;
// Room for a model that thinks before it answers; the answers themselves are short.
var CHAT_MAX_OUTPUT = 2048;
var CHAT_MAX_OPTIONS = 3;
var CHAT_MAX_OPTION_LENGTH = 40;
// Seconds for all model attempts together; the page gives up waiting at 60.
var CHAT_TIME_BUDGET = 45;
var CHAT_CALL_MAX = 25;
// A host that cannot be reached (the office PC switched off) is skipped for this long, and one
// that timed out (often its model still loading) for the shorter time.
var CHAT_DOWN_SECONDS = 180;
var CHAT_SLOW_SECONDS = 60;
var CHAT_OWN_NUMBERS = ['02822426789', '0949761636', '0912114511'];
// Gemini finish reasons that mean a content filter stopped the answer; other stops are provider failures.
var CHAT_FILTER_STOPS = ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_SAFETY'];
var CHAT_CONTACTS = 'gọi (028) 2242 6789, hoặc gọi/Zalo Ms. Vy 0949 761 636, Ms. Thảo 0912 114 511';
var CHAT_REFUSAL_REPLY = 'Dạ, câu này em chưa trả lời được ạ. Anh/chị vui lòng ' + CHAT_CONTACTS + ' để được tư vấn trực tiếp.';
var CHAT_SUGGEST_REPLY = 'Dạ, em chưa chắc anh/chị đang hỏi điều nào ạ. Anh/chị chọn câu gần nhất bên dưới, hoặc ' + CHAT_CONTACTS + '.';
var CHAT_NO_ANSWER_REPLY = 'Dạ, câu này em chưa có câu trả lời ạ. Anh/chị vui lòng ' + CHAT_CONTACTS + ' để được tư vấn trực tiếp.';

// Run from the editor after setup and after changing providers: it grants the external-request
// permission and logs, for each configured provider, which model answered and what it said.
function chatSelfTest() {
  var sample = 'Học phí Gói 1 là bao nhiêu?';
  var faq = faqLookup_(sample);
  Logger.log('FAQ: ' + (faq.answer ? 'faq:' + faq.answer.id : 'no confident match') + ' (' + faqRowsCount_() + ' rows)');
  var config = chatConfig_();
  if (!config.groups.length) {
    Logger.log('No AI provider configured: the chat answers from the FAQ only. Check CLAUDE_API_KEY or CHAT_API_KEY, and the MODELS (required when PROVIDER is openai), BASE_URL, EXTRA_BODY and HEADERS properties if set (see README.md).');
    return;
  }
  config.groups.forEach(function (group) {
    CacheService.getScriptCache().remove('chat_down_' + group.name);
    var result = askModel_({ groups: [group] }, [{ role: 'user', content: sample }], []);
    Logger.log(group.name + ': ' + result.status + '\n' + (result.reply || ''));
  });
}

// Run from the editor to read a whole consultation in the log: a scripted learner, the configured
// models and the same checks as the page.
function chatTalkTest() {
  var messages = [];
  ['Học phí khóa học thế nào?', 'chưa, mình là bác sĩ, có số ca bệnh theo tháng muốn dự báo', 'Học phí', 'thứ 6 mình trực thì sao em'].forEach(function (text) {
    messages.push({ role: 'user', content: text });
    var turn = chatTurn_(messages);
    Logger.log('HỌC VIÊN: ' + text + '\nTRỢ LÝ [' + turn.status + ']:\n' + (turn.reply || 'lỗi: ' + turn.error) +
      (turn.suggestions && turn.suggestions.length ? '\nNÚT: ' + turn.suggestions.join(' | ') : ''));
    messages.push({ role: 'assistant', content: turn.reply || '(không có câu trả lời)' });
  });
}

function handleChat_(data) {
  var session = String(data.session || '');
  var messages = chatMessages_(data.messages);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(session) || !messages) return json_({ ok: false, error: 'bad-request' });
  if (!chatSessionAllow_(session)) return json_({ ok: false, error: 'rate-limited' });

  var turn = chatTurn_(messages);
  // A question nothing answered is logged with an empty answer, so staff can find it.
  logChat_([session, messages[messages.length - 1].content, turn.error || turn.unanswered ? '' : turn.reply, turn.status, clean_(data.page)]);
  if (turn.error) return json_({ ok: false, error: turn.error });
  var out = { ok: true, reply: turn.reply };
  if (turn.suggestions && turn.suggestions.length) out.suggestions = turn.suggestions;
  return json_(out);
}

// One turn of the conversation: { reply, status, suggestions }, or { error, status } when there is
// nothing to say. suggestions are buttons under the reply: the model's quick replies, or the
// closest FAQ questions when no model answered.
function chatTurn_(messages) {
  var first = messages.length === 1;
  var faq = faqLookup_(messages[messages.length - 1].content);
  var row = faq.answer;
  // CHAT_MAX_PER_HOUR = 0 pauses the AI; the FAQ keeps answering.
  var config = chatConfig_();
  var ai = config.groups.length > 0 && config.perHour > 0;
  var result = { status: 'no-ai' };
  if (ai) {
    result = chatHourAllow_(config.perHour) ? chatAdvise_(config, messages, chatSources_(faq)) : { status: 'over-hour-cap', busy: 'overloaded' };
  }
  // The table reads one message with no memory of the conversation. That suits a message that
  // asks something. A short answer to the assistant's own question ("rồi", "em làm về điều trị")
  // matches rows by its words alone, so while the AI is on, such a message never gets the table.
  var alone = !ai || chatAsks_(messages);
  // A refusal or a cut-off answer is only the best there is when no approved row answers.
  if (result.reply && !(result.weak && row && alone)) {
    return { reply: result.reply, status: result.status, suggestions: result.options };
  }
  if (row && alone) {
    return { reply: first ? chatGreet_(row.answer) : row.answer, status: (ai ? result.status + '; ' : '') + 'faq:' + row.id };
  }
  var suggestions = alone ? faq.candidates.map(function (other) { return other.question; }) : [];
  if (suggestions.length) return { reply: CHAT_SUGGEST_REPLY, status: result.status + '; faq-suggest', suggestions: suggestions };
  if (result.status === 'no-ai') return { reply: CHAT_NO_ANSWER_REPLY, status: result.status, unanswered: true };
  return { error: result.busy || (result.permanent ? 'unavailable' : 'busy'), status: result.status };
}

// The rows the model speaks from: the matched one first, then the closest, three in all.
function chatSources_(faq) {
  var row = faq.answer;
  return (row ? [row] : []).concat(faq.candidates.filter(function (other) { return !row || other.id !== row.id; })).slice(0, 3);
}

// False for what is probably an answer to the assistant's own question: the turn before ended on
// a question and this message asks nothing itself. "Không" and "chưa" ask at the end of a
// sentence ("được không", "có lịch chưa") and answer at its start ("Không ạ", "Chưa từng").
function chatAsks_(messages) {
  var last = messages[messages.length - 1].content;
  var before = messages.length > 1 ? messages[messages.length - 2].content : '';
  if (!/\?\s*$/.test(before)) return true;
  if (last.indexOf('?') !== -1) return true;
  var words = faqTerms_(last).words;
  return words.some(function (word, i) {
    return FAQ_ASKING[word] && ((word !== 'khong' && word !== 'chua') || (i > 0 && i === words.length - 1));
  });
}

// The model's turn with its quick replies taken out of the text. An answer with a figure the
// Institute's text does not support is dropped (status "guard-number" and the figure), so the
// caller falls back to the FAQ wording. weak marks a content-filter refusal or an answer cut off
// at the length cap: used only when nothing better is at hand.
function chatAdvise_(config, messages, references) {
  var result = askModel_(config, messages, references);
  if (!result.reply) return result;
  if (result.reply === CHAT_REFUSAL_REPLY) return { status: result.status, reply: result.reply, options: [], weak: true };
  var cut = /(?:^|; )ok-truncated /.test(result.status);
  var turn = chatOptions_(result.reply);
  if (!turn.reply) return { status: result.status + '; guard-empty' };
  // The example conversation in the prompt is not a source: a slip there must not vouch for itself.
  var official = chatSystemPrompt_().split(CHAT_EXAMPLES_HEADING)[0] + chatDateNote_() + chatReferences_(references);
  var said = messages.map(function (message) { return message.content; }).join('\n');
  var learner = messages.filter(function (message) { return message.role === 'user'; })
    .map(function (message) { return message.content; }).join('\n');
  var unknown = chatUnknownFigure_(turn.reply, official, said, learner);
  if (unknown) return { status: result.status + '; guard-number ' + unknown };
  return { status: result.status, reply: turn.reply, options: cut ? [] : turn.options, weak: cut };
}

// The model may offer ready answers in double square brackets, "[[Chưa từng | Đã dùng cơ bản]]",
// which the page shows as buttons. The brackets are taken out of the text wherever the model put
// them: on a line of their own, after a sentence, one pair per answer, in bold, or cut off by the
// length cap. Inside a sentence the answers stay as words. R code such as x[[1]] is left alone.
function chatOptions_(reply) {
  var options = [];
  var text = reply.replace(/(^|[^\p{L}\p{N}_)\]])\*{0,2}\[\[([^\[\]]*)(?:\]\]\*{0,2}|$)/gu, function (all, before, inside, offset, whole) {
    var found = inside.split(/\s*[|｜]\s*|\s+\/\s+/)
      .map(function (item) { return item.replace(/^[\s"'“”*]+|[\s"'“”*.]+$/g, ''); })
      .filter(function (item) { return item && item.length <= CHAT_MAX_OPTION_LENGTH; });
    found.forEach(function (item) { if (options.indexOf(item) === -1) options.push(item); });
    var rest = whole.slice(offset + all.length).split('\n')[0].replace(/\[\[[^\[\]]*\]\]/g, '');
    return before + (/[\p{L}\p{N}]/u.test(rest) ? found.join(', ') : '');
  });
  // What a line that only held brackets leaves behind: a bullet, a full stop, bold marks.
  var lines = text.split('\n').filter(function (line) { return !/^\s*(?:[-*•.]{1,4})\s*$/.test(line); });
  // And a short label before them ("Lựa chọn:"), when it now ends the turn.
  while (options.length && lines.length && /^\s*(?:[^.!?]{0,24}:)?\s*$/.test(lines[lines.length - 1])) lines.pop();
  return {
    reply: lines.join('\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim(),
    options: options.slice(0, CHAT_MAX_OPTIONS)
  };
}

// Amounts of money in a text as whole đồng: "7.500.000", "7,500,000", "7 500 000", "7500000",
// "7,5 triệu", "7 triệu rưỡi", "6 triệu 7" and "6tr7" (6.700.000: the digits after the unit are
// its next places), "500k". An amount in words ("bảy triệu", "sáu triệu rưỡi") is kept as its
// words, which only the same words match. rest is the text without the amounts, for the checks
// that follow.
function chatAmounts_(text) {
  var amounts = [];
  var rest = text
    // Dots or commas between the thousands, or spaces ("9 900 000", but not the groups of a phone
    // number: "0949 761 636", "+84 949 761 636", "(+84) 949 761 636").
    .replace(/(?<!\d|\d[.,])\d{1,3}(?:[.,]\d{3})+(?!\d|[.,]\d)|(?<!\d|\d[., ]|\)\s?)\d{1,3}(?: \d{3}){2}(?!\d|[., ]\d)/g, function (found) {
      amounts.push(String(Number(found.replace(/\D/g, ''))));
      return ' ';
    })
    .replace(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|củ|nghìn|ngàn|k)(?:(\s*rưỡi)|\s?(\d{1,3})(?!\d|[.,]\d|[\/:]|\s*(?:ngày|buổi|bài|khóa|người|tháng|năm|giờ|gói|học viên|%)))?(?![\p{L}\p{N}])/giu, function (found, number, unit, half, places) {
      var each = /^[nk]/i.test(unit) ? 1000 : 1000000;
      var whole = Number(number.replace(',', '.')) * each + (half ? each / 2 : 0) + (places ? Number(places) * each / Math.pow(10, places.length) : 0);
      amounts.push(String(Math.round(whole)));
      return ' ';
    })
    .replace(/(?:một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|chục|trăm|vài|mấy)\s+(?:triệu|nghìn|ngàn)(?:\s+(?:rưỡi|mốt|lăm|tư|một|hai|ba|bốn|năm|sáu|bảy|tám|chín)(?![\p{L}\p{N}])(?:\s+trăm)?)?/giu, function (found) {
      amounts.push(found.toLowerCase().replace(/\s+/g, ' '));
      return ' ';
    })
    .replace(/(?<!\d|\d[.,\/:])\d{6,7}(?!\d|[.,\/:]\d)/g, function (found) {
      amounts.push(String(Number(found)));
      return ' ';
    });
  return { amounts: amounts, rest: rest };
}

// Days in a text as { day, month, year } ("2/3" after Gói, Khóa or Bài is not a day). With
// `inside`, a range such as "từ 08/01 đến 10/01/2027" also gives the days between its ends.
function chatDates_(text, inside) {
  var dates = [];
  var match;
  var one = /(?<![\d\/])(?<!(?:gói|khóa|bài|package|course)\s?)(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?(?![\d\/])/giu;
  while ((match = one.exec(text))) dates.push({ day: Number(match[1]), month: Number(match[2]), year: match[3] || '' });
  var range = /(\d{1,2})\/(\d{1,2})(?:\/\d{4})?\s*(?:đến|tới|–|-)\s*(?:ngày\s*)?(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/giu;
  while (inside && (match = range.exec(text))) {
    if (Number(match[2]) !== Number(match[4])) continue;
    for (var day = Number(match[1]) + 1; day < Number(match[3]); day++) dates.push({ day: day, month: Number(match[2]), year: match[5] || '' });
  }
  return dates;
}

// The one package (or course) a sentence names: its number, '' when it names none, and null when
// it names several ("Gói 2 và Gói 4", "Gói 4, 5 hoặc 6", "Gói 2/3"), which no figure is tied to.
function chatNamed_(sentence, word) {
  var numbers = {};
  var match;
  var one = new RegExp('(?:' + word + ')\\s*(\\d)(?!\\d)', 'gi');
  while ((match = one.exec(sentence))) numbers[match[1]] = true;
  var list = Object.keys(numbers);
  if (!list.length) return '';
  var several = new RegExp('(?:' + word + ')\\s*\\d\\s*(?:,|\\/|\\+|và|hoặc|hay|đến|or|and|-|–)\\s*(?:(?:' + word + ')\\s*)?\\d(?!\\s*(?:ngày|buổi|bài|khóa|người|tháng|giờ|năm)|[\\d.,:%\\/])', 'i');
  return list.length > 1 || several.test(sentence) ? null : list[0];
}

// A model's usual slips with figures are a sum it worked out itself, a neighbouring row of the
// fee table and another course's days. This returns the first figure in an AI answer that the
// Institute's text does not support, or '' when every figure stands:
//   - an amount, a day, a clock time and a phone or account number must be in `official` (the
//     prompt without its example conversation, today's note, the FAQ rows sent along) or in
//     `said` (the conversation);
//   - a percentage likewise, in a sentence about money or a discount, or that names a package
//     ("khoảng tin cậy 95%" is none of these);
//   - an amount in a sentence that names one package, or that follows such a sentence, must be
//     one of that package's amounts in the fee tables. An amount the learner gave (`learner`:
//     their messages) may stand beside it, never in its place;
//   - a class day in a sentence that names one course must be one of that course's days.
function chatUnknownFigure_(reply, official, said, learner) {
  var figures = function (text, inside) {
    var found = {};
    var money = chatAmounts_(text);
    money.amounts.forEach(function (amount) { found['đ' + amount] = amount; });
    (text.match(/\d+(?:[.,]\d+)?\s?%/g) || []).forEach(function (percent) { found['%' + percent.replace(/\s/g, '').replace('.', ',')] = percent; });
    // A day and month must be known; with a year, that month of that year must be known too
    // (the notice writes "từ 08/01 đến 10/01/2027", so 08/01/2027 is right and 08/01/2026 is not).
    chatDates_(text, inside).forEach(function (date) {
      found['d' + date.day + '/' + date.month] = date.day + '/' + date.month;
      if (date.year) found['m' + date.month + '/' + date.year] = date.day + '/' + date.month + '/' + date.year;
    });
    // Clock times: "1:30 pm", then "8:30", "8h30" and "17h".
    var rest = money.rest.replace(/(?<!\d|\d[:.,\/])(\d{1,2})(?::(\d{2}))?\s?(am|pm)(?![\p{L}\p{N}])/giu, function (time, hour, minute, half) {
      found['t' + (Number(hour) % 12 + (/pm/i.test(half) ? 12 : 0)) + ':' + (minute || '00')] = time;
      return ' ';
    }).replace(/(?<!\d|\d[:.,\/])(\d{1,2})(?:[:h](\d{2})(?!\d)|h(?![\p{L}\p{N}]))/gu, function (time, hour, minute) {
      found['t' + Number(hour) + ':' + (minute || '00')] = time;
      return ' ';
    });
    // Phone and account numbers: eight digits or more, in groups or unbroken, compared by their
    // last nine digits, so "+84 949 761 636" is "0949 761 636" and "+84 28 2242 6789" is
    // "(028) 2242 6789". Two years ("2025-2026") are not a number.
    (rest.match(/(?<!\d|\d[.,\/:])\(?\+?\d{2,4}\)?(?:[ .\-]\d{2,8}){1,4}(?!\d|[\/:]\d)|(?<!\d|\d[.,\/:])\d{8,12}(?!\d|[.,\/:]\d)/g) || []).forEach(function (number) {
      var digits = number.replace(/\D/g, '');
      if (digits.length >= 8 && !/^(?:19|20)\d{2}\D+(?:19|20)\d{2}$/.test(number)) found['n' + digits.slice(-9)] = number;
    });
    return found;
  };
  var have = figures(official + '\n' + said, true);
  var mine = figures(reply, false);
  var unknown = Object.keys(mine).filter(function (key) { return key.charAt(0) !== '%' && !have[key]; })[0];
  if (unknown) return mine[unknown];

  // Package number -> its amounts, from the fee tables ("- Gói 3: ...", "- Gói 3 (7.500.000): ...").
  // Course number -> its class days ("1. Khóa 1, ...: từ 08/01 đến 10/01/2027", "- Khóa 2: ngày 12/01 ...").
  var fees = {};
  var days = {};
  var classDay = {};
  official.split('\n').forEach(function (line) {
    var pack = /^- Gói (\d)(?::| \()/.exec(line);
    if (pack) chatAmounts_(line).amounts.forEach(function (amount) { (fees[pack[1]] = fees[pack[1]] || {})[amount] = true; });
    var course = /^(?:\d\.|-) Khóa (\d)[,:]/.exec(line);
    if (course) {
      chatDates_(line, true).forEach(function (date) {
        (days[course[1]] = days[course[1]] || {})[date.day + '/' + date.month] = true;
        classDay[date.day + '/' + date.month] = true;
      });
    }
  });
  var echoed = {};
  chatAmounts_(learner || '').amounts.forEach(function (amount) { echoed[amount] = true; });

  var current = '';
  var sentences = reply.split(/\n|(?<=[.!?;…])\s+/);
  for (var i = 0; i < sentences.length; i++) {
    var sentence = sentences[i];
    var pack = chatNamed_(sentence, 'Gói|Package|Pack');
    if (pack !== '' || /giảm|ưu đãi|chiết khấu|khuyến mãi|học phí|học bổng|hoàn tiền|hoàn lại|hoàn trả|đặt cọc|thanh toán|đóng tiền|tặng|bớt|rẻ|voucher|(?:thêm|được) \d|discount|tuition|fee|refund|bonus|\boff\b|\bsale\b/i.test(sentence)) {
      var percent = (sentence.match(/\d+(?:[.,]\d+)?\s?%/g) || []).filter(function (found) { return !have['%' + found.replace(/\s/g, '').replace('.', ',')]; })[0];
      if (percent) return percent;
    }
    // Several packages, fees in general or another choice: the package named before no longer holds.
    if (pack === null || /các gói|mỗi gói|tùy gói|tuỳ gói|gói khác|6 gói|sáu gói|chỉ học|chỉ cần|hoặc|hay là|cả (?:ba|3|03) khóa|từ [\d.,]+ (?:đồng )?đến/i.test(sentence)) current = '';
    if (pack) current = pack;
    var amounts = chatAmounts_(sentence).amounts;
    if (current && fees[current] && amounts.length) {
      var wrong = amounts.filter(function (amount) { return !fees[current][amount] && !echoed[amount]; })[0];
      if (wrong || (pack && !amounts.some(function (amount) { return fees[current][amount]; }))) return 'Gói ' + current + ': ' + (wrong || amounts[0]);
    }
    var course = chatNamed_(sentence, 'Khóa|Course');
    if (course && days[course]) {
      var other = chatDates_(sentence, false).filter(function (date) {
        return classDay[date.day + '/' + date.month] && !days[course][date.day + '/' + date.month];
      })[0];
      if (other) return 'Khóa ' + course + ': ' + other.day + '/' + other.month;
    }
  }
  return '';
}

// { groups: [providers to try, in order], perHour }. See CHAT_GROUPS; CHAT_MAX_PER_HOUR caps
// AI calls per clock hour across all visitors.
function chatConfig_() {
  var props = PropertiesService.getScriptProperties();
  var get = function (name) { return String(props.getProperty(name) || '').trim(); };
  var groups = [];
  CHAT_GROUPS.forEach(function (prefix) {
    var provider = (get(prefix + 'PROVIDER') || CHAT_GROUP_PROVIDERS[prefix] || 'openai').toLowerCase();
    var fallback = provider === 'anthropic' ? CHAT_CLAUDE_MODELS : prefix === 'CHAT_' && provider === 'gemini' ? CHAT_GEMINI_MODELS : '';
    var models = (get(prefix + 'MODELS') || fallback)
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
    if (provider === 'openai' ? !group.baseUrl : provider !== 'gemini' && provider !== 'anthropic') return;
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
  if (!Array.isArray(raw) || !raw.length || raw.length > CHAT_MAX_SENT) return null;
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
// provider, and an OpenAI-compatible host that is unreachable or times out is skipped for a while.
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
    // last is null when the first try of a lone model was skipped (host flagged as down).
    if (repeat && (!last || !last.transient)) break;
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
    last = entry.group.provider === 'gemini' ? askGemini_(entry.group, entry.model, sent, timeout, system)
      : entry.group.provider === 'anthropic' ? askAnthropic_(entry.group, entry.model, sent, timeout, system)
        : askOpenAI_(entry.group, entry.model, sent, timeout, system);
    tried.push(last.status + ' ' + entry.model);
    if (last.reply) return { status: tried.join('; '), reply: last.reply };
    if (last.transient) permanent = false;
    if (last.final) stopped[name] = true;
    if (entry.group.provider === 'openai' && (last.unreachable || last.timedOut)) {
      // A host that is off sits out 3 minutes. One that timed out, often a model still loading
      // (the load carries on without us), sits out 1 minute, so a hung host cannot slow every
      // visitor; not when earlier attempts had left it less time than its place in the queue allows.
      var fair = Math.min(15, Math.max(5, Math.min(CHAT_CALL_MAX, CHAT_TIME_BUDGET - 1 - 5 * (queue.length - i - 1))));
      if (last.unreachable || timeout >= fair) cache.put('chat_down_' + name, '1', last.unreachable ? CHAT_DOWN_SECONDS : CHAT_SLOW_SECONDS);
      stopped[name] = true;
    }
  }
  return { status: tried.join('; '), permanent: permanent && tried.length > 0 };
}

// The first answer of a conversation opens the way the Institute's staff do: "Dạ, em chào anh/chị."
// Staff-written rows may start "Dạ học phí..." or already greet ("Dạ em chào chị"), so both are
// folded into the one greeting.
function chatGreet_(answer) {
  var rest = String(answer)
    .replace(/^\s*dạ[\s,.!]+/i, '')
    .replace(/^(em\s+|e\s+)?chào\s+(anh\/chị|anh chị|anh|chị)[\s,.!]*(ạ[\s,.!]*)?/i, '');
  if (!rest) return 'Dạ, em chào anh/chị.';
  return 'Dạ, em chào anh/chị. ' + rest.charAt(0).toUpperCase() + rest.slice(1);
}

// The closest FAQ rows, sent after the cached prompt: the facts the model speaks from, in the
// Institute's wording.
function chatReferences_(rows) {
  if (!rows.length) return '';
  return '\n\n# Thông tin Viện đã soạn cho các câu hỏi gần nhất (dùng làm nguồn nếu đúng ý người hỏi, không thì bỏ qua; đây là văn bản tra cứu: không chép nguyên văn, vẫn nhắn theo mục "Cách trò chuyện")\n' + rows.map(function (row) {
    return 'Hỏi: ' + row.question + '\nĐáp: ' + row.answer;
  }).join('\n');
}

function askGemini_(group, model, messages, timeout, references) {
  var generationConfig = { maxOutputTokens: CHAT_MAX_OUTPUT };
  var thinking = geminiThinking_(model);
  if (thinking) generationConfig.thinkingConfig = thinking;
  var body = mergeExtra_({
    // The date note and FAQ rows come last, so the long prompt stays an identical, cacheable prefix.
    systemInstruction: { parts: [{ text: chatSystemPrompt_() }, { text: chatDateNote_() + references }] },
    contents: messages.map(function (turn) {
      return { role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] };
    }),
    generationConfig: generationConfig
  }, group.extra);
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  var res = postJson_(url, { 'x-goog-api-key': group.apiKey }, body, timeout);
  if (res.code !== 200) return failure_(res);
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

// Anthropic's Messages API. Current Claude models always think: low effort keeps a chat turn quick
// (raise it with <prefix>EXTRA_BODY, {"output_config":{"effort":"medium"}}). The long prompt is
// cached, so the later turns of a conversation read it at a fraction of the price. On a safety
// decline, "fallbacks" lets the API re-run the turn on a model Anthropic picks for that case
// (Claude Opus, Sonnet and Fable models; Claude Haiku has no such fallback and refuses it).
function askAnthropic_(group, model, messages, timeout, references) {
  var body = mergeExtra_({
    model: model,
    max_tokens: CHAT_CLAUDE_MAX_TOKENS,
    // The date note and FAQ rows come after the cached prompt, so they never invalidate it.
    system: [
      { type: 'text', text: chatSystemPrompt_(), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: chatDateNote_() + references }
    ],
    messages: messages.map(function (turn) { return { role: turn.role, content: turn.content }; }),
    output_config: { effort: 'low' },
    fallbacks: 'default'
  }, group.extra);
  var headers = mergeExtra_({ 'anthropic-version': CHAT_CLAUDE_VERSION, 'anthropic-beta': 'server-side-fallback-2026-07-01' }, group.headers);
  headers['x-api-key'] = group.apiKey;
  var res = postJson_((group.baseUrl || CHAT_CLAUDE_URL) + '/messages', headers, body, timeout);
  if (res.code !== 200) return failure_(res);
  if (!res.json) return { status: 'error-parse', transient: true };
  var stop = res.json.stop_reason;
  if (stop === 'refusal') return refusal_('blocked-refusal');
  // Thinking blocks come back empty and are skipped; only the text blocks are the reply.
  var reply = (res.json.content || [])
    .filter(function (block) { return block.type === 'text' && block.text; })
    .map(function (block) { return block.text; })
    .join('')
    .trim();
  if (!reply) return { status: stop === 'max_tokens' ? 'error-thinking-length' : 'error-empty', transient: true };
  return { status: stop === 'max_tokens' ? 'ok-truncated' : 'ok', reply: reply };
}

// Any host with an OpenAI-style /chat/completions endpoint (Cloudflare Workers AI, the office PC
// running llama-server, DeepSeek, Groq, OpenRouter). Host-specific switches, such as turning
// reasoning off, go in <prefix>EXTRA_BODY; extra headers (a tunnel's access token) in <prefix>HEADERS.
function askOpenAI_(group, model, messages, timeout, references) {
  var body = mergeExtra_({
    model: model,
    max_tokens: CHAT_MAX_OUTPUT,
    messages: [{ role: 'system', content: chatSystemPrompt_() + chatDateNote_() + references }].concat(messages)
  }, group.extra);
  var headers = mergeExtra_({}, group.headers);
  headers.Authorization = 'Bearer ' + group.apiKey;
  var res = postJson_(group.baseUrl + '/chat/completions', headers, body, timeout);
  if (res.code !== 200) return failure_(res);
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
  var started = Date.now();
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
    // A call that used up its timeout reached a slow host (a model still loading), not a dead one.
    return { code: 0, json: null, timedOut: Date.now() - started >= (timeout - 1) * 1000 };
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
function failure_(res) {
  var code = res.code;
  var json = res.json;
  var error = (json && json.error) || {};
  var detail = JSON.stringify(error.details || []);
  var cloudflare = json && json.errors && json.errors[0] ? json.errors[0].code : null;
  var keyProblem = code === 400 && (/API_KEY_INVALID/.test(detail) || error.status === 'FAILED_PRECONDITION');
  var daily = code === 429 && (/PerDay/.test(detail) || cloudflare === 3036);
  return {
    status: code ? 'error-' + code + (daily ? '-daily' : '') : res.timedOut ? 'error-timeout' : 'error-network',
    final: code === 401 || code === 402 || code === 403 || keyProblem,
    transient: !code || (code === 429 && !daily) || code >= 500,
    // No connection, or a tunnel whose machine is off (Cloudflare answers 530, a proxy 502).
    unreachable: (!code && !res.timedOut) || code === 502 || code === 530,
    timedOut: !code && !!res.timedOut
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
    .replace(/(?<![\d.,])(?<!84\)?[\s.\-])\d{3,4}(?:[ \-]\d{3,4}){2,3}(?!\d|[.,]\d|[ \-]\d)/g, function (found) {
      var length = found.replace(/\D/g, '').length;
      return (length === 9 || length === 12) && !chatOwnTail_(found) ? '[số giấy tờ]' : found;
    })
    .replace(/(?<![\d.,])(?:\d{12}|\d{9})(?!\d|[.,]\d)/g, function (found) {
      return chatOwnTail_(found) ? found : '[số giấy tờ]';
    });
}

// True for the digits of an institute number written after a country code ("+84 (0) 949 761 636",
// "(+84)949761636", "+8428 2242 6789"), which the phone rule has already kept.
function chatOwnTail_(text) {
  var digits = text.replace(/\D/g, '');
  return CHAT_OWN_NUMBERS.indexOf('0' + digits) !== -1 || CHAT_OWN_NUMBERS.indexOf(digits.replace(/^840?/, '0')) !== -1;
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
    sheet.appendRow([when].concat(values).map(chatCell_));
  } catch (err) {
    // A failed log must not cost the learner their answer.
  }
}

// The leading apostrophe stores the value as text, so learner input is never run as a formula
// and the timestamp is not reparsed in the sheet's locale. (LeadTabs.gs has its own textCell_ for
// the staff tabs; two functions of one name in a project silently become one.)
function chatCell_(value) {
  return "'" + String(value === undefined || value === null ? '' : value).slice(0, 5000);
}
