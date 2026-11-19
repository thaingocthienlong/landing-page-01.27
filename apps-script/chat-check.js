// Runs the learner-care chat (Chat.gs with Faq.gs, FaqSeed.gs, Knowledge.gs, Sync.gs, Leads.gs and LeadTabs.gs) against
// a fake spreadsheet and a fake model:
// node apps-script/chat-check.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');

// Apps Script runs every file of a project in one scope: a function defined in two files
// silently becomes whichever file loads last.
{
  const seen = {};
  fs.readdirSync(__dirname).filter((file) => file.endsWith('.gs')).forEach((file) => {
    (read(file).match(/^function [A-Za-z0-9_]+/gm) || []).forEach((line) => {
      const name = line.slice('function '.length);
      assert.ok(!seen[name], name + ' is defined in ' + seen[name] + ' and in ' + file);
      seen[name] = file;
    });
  });
}

const sheets = {};
const props = {};
const cache = new Map();
const logs = [];
// What the fake model answers, in order: the reply text, { code } for an HTTP failure,
// { finish } for a stop reason such as SAFETY, or { finish: 'MAX_TOKENS', text } for a cut-off answer.
// Anthropic's API (any URL on api.anthropic.com) answers in its own shape: { stop } is its
// stop_reason ('refusal', 'max_tokens'), { error } the error type of a failure.
const model = { replies: [], calls: [] };
const clock = { day: '16/11/2026' };
// The selected range and what the menus showed: alerts, and dialogs as [html, title].
const ui = { open: false, range: null, alerts: [], dialogs: [] };

function fakeSheet(name, rows) {
  const data = rows || [];
  const sheet = {
    data,
    getLastRow: () => data.length,
    getDataRange: () => ({ getValues: () => data.map((row) => row.slice()) }),
    // Array.from: a row built inside the vm belongs to another realm and would never deepStrictEqual.
    appendRow(values) { data.push(Array.from(values)); return sheet; },
    getRange: () => { const range = {}; ['setFontWeight', 'setBackground', 'setFontColor'].forEach((m) => { range[m] = () => range; }); return range; },
    setFrozenRows: () => sheet
  };
  sheets[name] = sheet;
  return sheet;
}

const book = {
  getSheetByName: (name) => sheets[name] || null,
  insertSheet: (name) => fakeSheet(name),
  getSpreadsheetTimeZone: () => 'Asia/Ho_Chi_Minh'
};
const ctx = vm.createContext({
  SpreadsheetApp: {
    getActiveSpreadsheet: () => book,
    getActiveRange: () => ui.range,
    // Like a run from the editor, there is no window until a test opens the Sheet (ui.open).
    getUi() {
      if (!ui.open) throw new Error('Cannot call SpreadsheetApp.getUi() from this context.');
      return { alert: (text) => { ui.alerts.push(text); }, showModalDialog: (output, title) => { ui.dialogs.push([output.html, title]); } };
    }
  },
  HtmlService: { createHtmlOutput(html) { const out = { html, setWidth: () => out, setHeight: () => out }; return out; } },
  CacheService: {
    getScriptCache: () => ({
      get: (key) => cache.get(key) ?? null,
      put: (key, value) => { cache.set(key, String(value)); },
      remove: (key) => { cache.delete(key); }
    })
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => props[key] ?? null }) },
  // The clock stands still on clock.day, so the date note and the FAQ rows' dates are fixed.
  Utilities: {
    formatDate(date, zone, format) {
      const [dd, mm, yyyy] = clock.day.split('/');
      return format.replace('yyyy', yyyy).replace('MM', mm).replace('dd', dd).replace('HH', '10').replace('mm', '00').replace('ss', '00');
    },
    sleep() {}
  },
  UrlFetchApp: {
    fetch(url, options) {
      const next = model.replies.length ? model.replies.shift() : 'Dạ, em chào anh/chị.';
      model.calls.push({ url, body: JSON.parse(options.payload), headers: options.headers });
      const text = typeof next === 'string' ? next : next.text;
      if (url.startsWith('https://api.anthropic.com/')) {
        const message = { type: 'message', role: 'assistant', model: JSON.parse(options.payload).model, stop_reason: next.stop || 'end_turn',
          content: [{ type: 'thinking', thinking: '', signature: 'sig' }].concat(text ? [{ type: 'text', text }] : []) };
        const failure = { type: 'error', error: { type: next.error || 'api_error', message: 'failed' } };
        return { getResponseCode: () => next.code || 200, getContentText: () => JSON.stringify(next.code ? failure : message) };
      }
      const candidate = { finishReason: next.finish || 'STOP' };
      if (text) candidate.content = { parts: [{ text }] };
      return { getResponseCode: () => next.code || 200, getContentText: () => JSON.stringify(next.code ? {} : { candidates: [candidate] }) };
    }
  },
  ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }) },
  Logger: { log: (text) => logs.push(String(text)) }
});
['Code.gs', 'Chat.gs', 'Knowledge.gs', 'Faq.gs', 'FaqSeed.gs', 'Sync.gs', 'Leads.gs', 'LeadTabs.gs'].forEach((file) => {
  vm.runInContext(read(file), ctx, { filename: path.join(__dirname, file) });
});

// Values made inside the vm belong to another realm: plain() before deepStrictEqual.
const plain = (value) => JSON.parse(JSON.stringify(value));
const SEED = plain(vm.runInContext('FAQ_SEED', ctx));
const HEAD = plain(vm.runInContext('FAQ_HEADERS', ctx));
const rowOf = (id) => SEED.find((row) => row.id === id);
const lines = (list) => list.join('\n');

// A fresh sheet with the FAQ tab; ai: false leaves no model configured.
function reset({ ai = true, faq = SEED } = {}) {
  Object.keys(sheets).forEach((name) => { delete sheets[name]; });
  Object.keys(props).forEach((key) => { delete props[key]; });
  cache.clear();
  logs.length = 0;
  model.replies.length = 0;
  model.calls.length = 0;
  clock.day = '16/11/2026';
  fakeSheet('FAQ', [HEAD].concat(faq.map((row) => [row.id, row.group, row.question, row.variants.join('\n'), row.answer, row.from, row.to, 'Có'])));
  if (ai) props.CHAT_API_KEY = 'test-key';
}

let turns = 0;
// One request as the page sends it: the conversation so far, ending on the learner's message.
const request = (said, session) => ({
  action: 'chat',
  session: session || 'session-' + String(++turns).padStart(4, '0'),
  messages: said.map((content, i) => ({ role: i % 2 ? 'assistant' : 'user', content })),
  page: 'https://example.test/'
});
const ask = (...said) => ctx.handleChat_(request(said));
const logged = () => sheets['Hỏi đáp'].data[sheets['Hỏi đáp'].data.length - 1];
const sentSystem = (call) => call.body.systemInstruction.parts.map((part) => part.text).join('');
const FEE = 'Học phí khóa học thế nào?';
const FEE_ROW = () => ctx.chatGreet_(rowOf('goi-hoc-phi').answer);
// An assistant turn that ends on a question, and one that does not.
const ASKED = 'Dạ, em chào anh/chị. Anh/chị đang làm lĩnh vực gì ạ?';
const TOLD = 'Dạ, em chào anh/chị. Chuỗi khóa học gồm 3 khóa ạ.';
const DOWN = [{ code: 500 }, { code: 500 }];

// With the AI on, the model answers every message, speaking from the matched row; its blank
// lines (one message each) and its quick replies reach the page.
{
  reset();
  model.replies.push(lines([
    'Dạ, em chào anh/chị. Học phí tính theo gói, từ 3.500.000 đến 8.800.000 đồng tùy anh/chị học mấy khóa ạ.',
    '',
    'Để em báo đúng gói và số tiền, anh/chị đã dùng R bao giờ chưa ạ?',
    '[[Chưa từng | Đã dùng cơ bản | Dùng thường xuyên]]'
  ]));
  const res = ask(FEE);
  assert.deepStrictEqual(res, {
    ok: true,
    reply: 'Dạ, em chào anh/chị. Học phí tính theo gói, từ 3.500.000 đến 8.800.000 đồng tùy anh/chị học mấy khóa ạ.\n\nĐể em báo đúng gói và số tiền, anh/chị đã dùng R bao giờ chưa ạ?',
    suggestions: ['Chưa từng', 'Đã dùng cơ bản', 'Dùng thường xuyên']
  });
  assert.strictEqual(model.calls.length, 1);
  const system = sentSystem(model.calls[0]);
  assert.ok(system.includes('# Thông tin Viện đã soạn') && system.includes('không chép nguyên văn'));
  assert.ok(system.includes('# Ngày hôm nay\nHôm nay là ngày 16/11/2026'));
  assert.strictEqual(model.calls[0].body.generationConfig.maxOutputTokens, 2048);
  assert.deepStrictEqual(logged().slice(2, 5), ["'" + FEE, "'" + res.reply, "'ok gemini-3.5-flash-lite"]);

  // A payment row is a source like any other: the model answers, with the row in front of it.
  model.replies.push('Dạ, số tài khoản của Viện là 2242 6789, Ngân hàng Phương Đông (OCB), chi nhánh Tân Thuận ạ.');
  const pay = ask('Số tài khoản của Viện là gì?');
  assert.strictEqual(pay.reply, 'Dạ, số tài khoản của Viện là 2242 6789, Ngân hàng Phương Đông (OCB), chi nhánh Tân Thuận ạ.');
  assert.ok(sentSystem(model.calls[1]).includes('Hỏi: ' + rowOf('thanh-toan').question));
}

// The matched row comes first among the rows sent along, three in all.
{
  reset();
  const look = ctx.faqLookup_('uu dai nhom');
  assert.deepStrictEqual([look.answer.id, look.candidates[0].id], ['uu-dai-nhom', 'cong-don-uu-dai'], 'a case where the matched row is not the closest by score');
  assert.deepStrictEqual(plain(ctx.chatSources_(look)).map((row) => row.id), ['uu-dai-nhom', 'cong-don-uu-dai', 'dang-ky-nhom']);
  const row = (id) => ({ id });
  assert.deepStrictEqual(plain(ctx.chatSources_({ answer: row('a'), candidates: [row('b'), row('c'), row('d')] })), [row('a'), row('b'), row('c')]);
  assert.deepStrictEqual(plain(ctx.chatSources_({ answer: null, candidates: [row('b'), row('c')] })), [row('b'), row('c')]);
  ask('uu dai nhom');
  const sent = sentSystem(model.calls[0]);
  const order = ['uu-dai-nhom', 'cong-don-uu-dai', 'dang-ky-nhom'].map((id) => sent.indexOf('Hỏi: ' + rowOf(id).question));
  assert.ok(order[0] !== -1 && order[0] < order[1] && order[1] < order[2], JSON.stringify(order));
}

// What a learner answers to the assistant's own question is never taken for an FAQ question,
// though each of these matches a row by its words: the model answers, with the conversation.
{
  const said = { 'rồi': 'xac-nhan-thanh-toan', 'em làm về điều trị': 'tu-van-y-khoa', 'em đang viết luận văn': 'ngoai-pham-vi', 'em đang học thạc sĩ': 'khoa-khac', 'Online': 'hinh-thuc' };
  Object.keys(said).forEach((answer) => {
    reset();
    assert.strictEqual(ctx.faqLookup_(answer).answer.id, said[answer], 'the table alone would answer "' + answer + '"');
    model.replies.push('Dạ, vậy Gói 3 hợp với anh/chị nhất ạ.');
    const res = ask(FEE, ASKED, answer);
    assert.strictEqual(res.reply, 'Dạ, vậy Gói 3 hợp với anh/chị nhất ạ.', answer);
    assert.deepStrictEqual(model.calls[0].body.contents.map((turn) => turn.role), ['user', 'model', 'user']);
    assert.ok(!('suggestions' in res));
    // And when no model answers, the visitor is asked to try again: no row, no list of questions.
    reset();
    model.replies.push(...DOWN);
    assert.deepStrictEqual(ask(FEE, ASKED, answer), { ok: false, error: 'busy' }, answer);
    assert.deepStrictEqual(logged().slice(3, 5), ["'", "'error-500 gemini-3.5-flash-lite; error-500 gemini-3.1-flash-lite"]);
  });
  // A message that asks something still gets its row when no model answers, without the greeting.
  reset();
  model.replies.push(...DOWN);
  assert.strictEqual(ask(FEE, ASKED, 'học phí bao nhiêu em?').reply, rowOf('goi-hoc-phi').answer);
  // So does any clear match after a turn that asked nothing.
  reset();
  model.replies.push(...DOWN);
  assert.strictEqual(ask(FEE, TOLD, 'Online').reply, rowOf('hinh-thuc').answer);
  const asks = (before, last) => ctx.chatAsks_([{ role: 'user', content: 'x' }, { role: 'assistant', content: before }, { role: 'user', content: last }]);
  assert.deepStrictEqual([asks(ASKED, 'rồi'), asks(ASKED, 'Học phí'), asks(ASKED, 'stk là gì em'), asks(ASKED, 'được chứ?'), asks(TOLD, 'rồi')], [false, false, true, true, true]);
  // "Không" and "chưa" ask at the end of a sentence and answer at its start, as a quick reply does.
  const table = { 'Chưa từng': false, 'chưa ạ': false, 'Không': false, 'Không vướng': false, 'không, em chưa học R bao giờ': false,
    'được không ạ': true, 'có giảm giá không em': true, 'em đăng ký được chưa': true, 'lịch học thế nào': true, 'học phí bao nhiêu': true };
  Object.keys(table).forEach((said) => assert.strictEqual(asks(ASKED, said), table[said], said));
  // So a tapped "Chưa từng" with no model to answer is asked to try again, not offered unrelated questions.
  reset();
  model.replies.push(...DOWN);
  assert.ok(ctx.faqLookup_('Chưa từng').candidates.length > 0, 'the table alone would offer questions');
  assert.deepStrictEqual(ask(FEE, ASKED, 'Chưa từng'), { ok: false, error: 'busy' });
  assert.strictEqual(ctx.chatAsks_([{ role: 'user', content: 'rồi' }]), true, 'a first message stands alone');
}

// No model configured, or the AI paused: the table answers every clear match as before.
{
  reset({ ai: false });
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'faq:goi-hoc-phi");
  assert.strictEqual(ask(FEE, ASKED, 'Hỏi giá').reply, rowOf('goi-hoc-phi').answer, 'no greeting after the first message');
  assert.strictEqual(ask(FEE, ASKED, 'rồi').reply, rowOf('xac-nhan-thanh-toan').answer, 'the table alone reads one message at a time');
  assert.strictEqual(model.calls.length, 0);

  const none = ask('Bitcoin tăng giá');
  assert.strictEqual(none.reply, ctx.CHAT_NO_ANSWER_REPLY);
  assert.deepStrictEqual(logged().slice(3, 5), ["'", "'no-ai"], 'logged without an answer');

  reset();
  props.CHAT_MAX_PER_HOUR = '0';
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'faq:goi-hoc-phi");
  assert.strictEqual(model.calls.length, 0);
}

// The models fail: a matched row is answered word for word; with no match the closest questions
// are offered; with nothing close the page is told to try again, or that the assistant is paused.
{
  reset();
  model.replies.push(...DOWN);
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'error-500 gemini-3.5-flash-lite; error-500 gemini-3.1-flash-lite; faq:goi-hoc-phi");

  reset();
  model.replies.push(...DOWN);
  const close = ask('Mình ở Huế, học phí với lịch học sao em, có gì khác không');
  assert.strictEqual(close.reply, ctx.CHAT_SUGGEST_REPLY);
  assert.ok(close.suggestions.length >= 1 && close.suggestions.length <= 3, JSON.stringify(close.suggestions));
  assert.ok(logged()[4].endsWith('; faq-suggest'));

  reset();
  model.replies.push(...DOWN);
  assert.deepStrictEqual(ask('Bitcoin tăng giá'), { ok: false, error: 'busy' });
  assert.strictEqual(logged()[3], "'");
  reset();
  model.replies.push({ code: 404 }, { code: 404 });
  assert.deepStrictEqual(ask('Bitcoin tăng giá'), { ok: false, error: 'unavailable' }, 'no model is worth another try');

  reset();
  props.CHAT_MAX_PER_HOUR = '1';
  ask('Bitcoin tăng giá');
  assert.strictEqual(ask(FEE).reply, FEE_ROW(), 'over the hourly cap the table still answers');
  assert.strictEqual(logged()[4], "'over-hour-cap; faq:goi-hoc-phi");
  assert.deepStrictEqual(ask('Bitcoin tăng giá'), { ok: false, error: 'overloaded' });
}

// A content-filter refusal or an answer cut off at the length cap never replaces an approved row.
{
  reset();
  model.replies.push({ finish: 'SAFETY' });
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'blocked-SAFETY gemini-3.5-flash-lite; faq:goi-hoc-phi");
  model.replies.push({ finish: 'MAX_TOKENS', text: 'Dạ, em chào anh/chị. Học phí tính theo gói, từ 3.500.000 đến' });
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'ok-truncated gemini-3.5-flash-lite; faq:goi-hoc-phi");
  // With no row to fall back on they are what there is: the refusal with the numbers to call, and
  // the cut-off answer without the brackets it was cut in.
  model.replies.push({ finish: 'SAFETY' });
  assert.strictEqual(ask('Bitcoin tăng giá').reply, ctx.CHAT_REFUSAL_REPLY);
  model.replies.push({ finish: 'MAX_TOKENS', text: 'Dạ, em chào anh/chị. Em chỉ hỗ trợ về chuỗi khóa học ạ.\n\nAnh/chị đã dùng R chưa ạ?\n[[Chưa từng | Đã dùng cơ' });
  assert.deepStrictEqual(ask('Bitcoin tăng giá'), { ok: true, reply: 'Dạ, em chào anh/chị. Em chỉ hỗ trợ về chuỗi khóa học ạ.\n\nAnh/chị đã dùng R chưa ạ?' });
}

// An AI answer with a figure the Institute's text does not have is dropped for the table's
// wording, and the status names the figure.
{
  reset();
  model.replies.push('Dạ, Gói 3 học phí 7.500.000 đồng, đi nhóm 3 người và hoàn tất sớm thì còn 6.412.500 đồng ạ.');
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'ok gemini-3.5-flash-lite; guard-number 6412500; faq:goi-hoc-phi");
  model.replies.push('[[Có | Không]]');
  assert.strictEqual(ask(FEE).reply, FEE_ROW(), 'buttons without a message are no answer');
  assert.strictEqual(logged()[4], "'ok gemini-3.5-flash-lite; guard-empty; faq:goi-hoc-phi");

  // What counts as known: the learner's own figure, a row sent along, and today's date.
  model.replies.push('Dạ, 7.000.000 đồng thì chưa đủ cho Gói 3 (7.500.000 đồng) ạ.');
  assert.ok(ask(FEE, TOLD, 'em chỉ có 7.000.000 đồng thôi').reply.startsWith('Dạ, 7.000.000 đồng'));
  model.replies.push('Dạ, 7.000.000 đồng thì chưa đủ cho Gói 3 (7.500.000 đồng) ạ.');
  assert.deepStrictEqual(ask(FEE, ASKED, 'em chỉ có chừng đó thôi'), { ok: false, error: 'busy' }, 'not a figure the learner gave');

  const postage = { id: 'phi-gui', group: 'Khác', question: 'Phí gửi tài liệu là bao nhiêu?', variants: ['phi gui tai lieu bao nhieu'], answer: 'Dạ, phí gửi tài liệu là 45.000 đồng ạ.', from: '', to: '' };
  reset({ faq: SEED.concat([postage]) });
  const POSTAGE = 'Dạ, em chào anh/chị. Gửi tài liệu qua bưu điện thì phí là 45.000 đồng ạ.';
  model.replies.push(POSTAGE, POSTAGE);
  assert.strictEqual(ask('Phí gửi tài liệu là bao nhiêu?').reply, POSTAGE, 'the row sent along has the amount');
  assert.strictEqual(ask(FEE).reply, FEE_ROW(), 'the same amount without that row is not known');

  // An amount from the assistant's own earlier turn is not the learner's: it cannot stand in a
  // sentence that carries on about another package.
  reset();
  model.replies.push('Dạ, Gói 3 gồm Khóa 1 và Khóa 3 ạ.\n\nHọc phí 6.700.000 đồng/học viên.');
  ask(FEE, 'Dạ, em chào anh/chị. Gói 2 học phí 6.700.000 đồng ạ.', 'còn Gói 3 thì sao em?');
  assert.ok(logged()[4].startsWith("'ok gemini-3.5-flash-lite; guard-number Gói 3: 6700000"), logged()[4]);

  // The prompt's example conversation is no source either: a figure found only there is not known.
  reset();
  const prompt = ctx.CHAT_SYSTEM_PROMPT;
  ctx.CHAT_SYSTEM_PROMPT = prompt + '\nHỏi: Phí giữ chỗ bao nhiêu?\nĐáp: Dạ, phí giữ chỗ là 1.234.000 đồng ạ.';
  model.replies.push('Dạ, phí giữ chỗ là 1.234.000 đồng ạ.');
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'ok gemini-3.5-flash-lite; guard-number 1234000; faq:goi-hoc-phi");
  ctx.CHAT_SYSTEM_PROMPT = prompt;

  reset();
  model.replies.push('Dạ, hôm nay là 16/11/2026, mốc ưu đãi 08/12/2026 chưa tới ạ.');
  assert.ok(ask(FEE).reply.startsWith('Dạ, hôm nay là 16/11/2026'));
  clock.day = '20/11/2026';
  model.replies.push('Dạ, hôm nay là 16/11/2026, mốc ưu đãi 08/12/2026 chưa tới ạ.');
  assert.strictEqual(ask(FEE).reply, FEE_ROW(), 'another day\'s date is not in today\'s note');
}

// chatUnknownFigure_ on its own. `official` is what the model is given, less the example
// conversation; the second argument here stands for the whole conversation and the learner's side.
{
  reset();
  const official = ctx.chatSystemPrompt_().split(ctx.CHAT_EXAMPLES_HEADING)[0] + ctx.chatDateNote_() +
    ctx.chatReferences_([rowOf('goi-hoc-phi'), rowOf('uu-dai-som'), rowOf('lich-tong-quat')]);
  assert.ok(!official.includes('[[Một mình') && official.includes('# Thông tin chuỗi khóa học'), 'the examples are cut off, the facts are not');
  const unknown = (reply, said) => ctx.chatUnknownFigure_(ctx.chatOptions_(reply).reply, official, said || '', said || '');
  const good = [
    'Dạ, Gói 3 học phí 7.500.000 đồng ạ.',
    'Hoàn tất học phí trước 08/12/2026 được giảm 10%: Gói 3 tạm tính còn 6.750.000 đồng, số tiền chính thức do Viện xác nhận.',
    'Học phí tính theo gói, từ 3.500.000 đến 8.800.000 đồng.',
    'Gói 2 và Gói 4 cùng mức 6.700.000 đồng ạ.',
    'Gói 5 hoặc 6 lần lượt là 3.500.000 và 4.500.000 đồng.',
    'Học viên cũ Gói 2 hoàn tất trước 08/12/2026 tạm tính còn 5.695.000 đồng.',
    'Dạ, Gói 3 gồm Khóa 1 và Khóa 3 ạ.\n\nHọc phí 7.500.000 đồng/học viên.\n\nHoàn tất trước 08/12/2026 thì tạm tính còn 6.750.000 đồng ạ.',
    'Dạ, Gói 3, 6 ngày học, học phí 7.500.000 đồng ạ.',
    'Dạ, vậy Gói 3 hợp với chị nhất ạ.\n\nNếu chị chỉ học Khóa 3 thì là 4.500.000 đồng.',
    'Dạ, Gói 3 học phí 7,5 triệu ạ.',
    'Dạ, Gói 2 học phí 6 triệu 7 ạ.',
    'Dạ, Gói 3 học phí 7tr5 ạ.',
    'Dạ, Gói 3 hoàn tất trước 08/12/2026 tạm tính còn 6 triệu 750 nghìn ạ.',
    'Dạ, Gói 1 cả 03 khóa, 8,8 triệu 8 ngày học ạ.',
    'Gói 1 đến Gói 4 hoàn tất trước 08/12/2026 được giảm 10% ạ.',
    'Gói 1: 8,8 triệu 08/12/2026 là hạn ưu đãi.',
    'CEAC cho biết xác suất một can thiệp cost-effective, ví dụ 80% ở một ngưỡng chi trả.',
    'Hello. Package 3 costs 7.500.000 VND; classes run 8:30 am to 11:30 am and 1:30 pm to 5 pm.',
    'Khóa 2 học ngày 12/01/2027 và 13/01/2027, thứ Ba và thứ Tư.',
    'Khóa 1 học 3 ngày: thứ Sáu 08/01, thứ Bảy 09/01 và Chủ nhật 10/01/2027 ạ.',
    'Dạ, thứ Bảy là ngày 09/01 của Khóa 1 và 16/01 của Khóa 3 ạ.',
    'Dạ, Gói 2 học 5 ngày: từ 08/01 đến 10/01/2027, rồi ngày 12/01 và 13/01/2027 ạ.',
    'Khóa 1 từ 08 đến 10/01, mỗi ngày 8:30–11:30 và 13h30 đến 17h.',
    'Anh/chị gọi (028) 2242 6789, hoặc Zalo Ms. Vy 0949 761 636 - 0912 114 511.',
    'Dạ, anh/chị gọi +84 949 761 636 hoặc (028) 22426789 nhé.',
    'Số tài khoản 2242 6789, Ngân hàng Phương Đông (OCB).',
    'GS. Tuấn có hơn 350 bài báo, thuộc nhóm 0,05% nhà khoa học có ảnh hưởng nhất hai năm liên tiếp 2025-2026.',
    'Dạ, nhóm từ 3 người trở lên được giảm 5% học phí ạ.',
    'Khoảng tin cậy 95% là khoảng giá trị mà ta tin tham số thật nằm trong đó.',
    'Được ạ, anh/chị học online 100% qua Zoom.',
    'Chưa biết R thì anh/chị chọn Gói 2/3 ạ.',
    'Dạ, anh/chị đã dùng R rồi thì xem Gói 5/6 ạ.',
    'Dạ, Khóa 1 khai giảng 08/01/2027, anh/chị hoàn tất học phí trước 08/12/2026 để được ưu đãi ạ.',
    'Please call +84 28 2242 6789, or Zalo Ms. Vy at (+84) 949 761 636, Ms. Thảo at +84 (0) 912 114 511.',
    'Dạ, Gói 3 (7 500 000 đồng) gồm Khóa 1 và Khóa 3 ạ.',
    'Dạ, trong R anh/chị lấy phần tử đầu của một list bằng x[[1]].'
  ];
  good.forEach((reply) => assert.strictEqual(unknown(reply), '', 'should pass: ' + reply));
  const bad = {
    'Gói 3 học phí 7.900.000 đồng ạ.': '7900000',                                   // in no table
    'Gói 3 học phí 6.700.000 đồng ạ.': 'Gói 3: 6700000',                            // Gói 2's fee
    'Gói 3 hoàn tất sớm còn 6.030.000 đồng.': 'Gói 3: 6030000',                     // Gói 2's discounted amount
    'Dạ, Gói 3 gồm Khóa 1 và Khóa 3 ạ.\nHọc phí 6.700.000 đồng/học viên.': 'Gói 3: 6700000',   // one sentence later
    'Dạ, Gói 3, 6 ngày học, học phí 6.700.000 đồng ạ.': 'Gói 3: 6700000',
    'Gói 3 học phí 6,700,000 đồng ạ.': 'Gói 3: 6700000',
    'Gói 3 học phí 6700000 đồng ạ.': 'Gói 3: 6700000',
    'Gói 3 học phí 6,7 triệu ạ.': 'Gói 3: 6700000',
    'Gói 3 học phí 9 900 000 đồng ạ.': '9900000',
    'Gói 3 (9 900 000 đồng) gồm Khóa 1 và Khóa 3 ạ.': '9900000',
    'Evening classes start at 7 pm.': '7 pm',
    'Gói 3 học phí chín triệu đồng ạ.': 'chín triệu',
    'Dạ, Gói 3 học phí 6tr7 ạ.': 'Gói 3: 6700000',
    'Gói 3 học phí 7 triệu 9 ạ.': '7900000',
    'Gói 3 đăng ký sớm được tặng thêm 20%.': '20%',
    'Đăng ký sớm được tặng 20% ạ.': '20%',
    'Nhóm 3 người được 25% ạ.': '25%',
    'Học viên cũ được bớt 30% ạ.': '30%',
    'Package 3 is 20% off for early registration.': '20%',
    'Gói 3 hoàn tất trước 08/12/2026 chỉ còn 80% ạ.': '80%',                      // a package named, no money word
    'Early registration gets 20% off.': '20%',
    'There is a 20% sale for groups.': '20%',
    'Hello. Package 3 (Course 1 + Course 3) costs 6.700.000 VND per learner.': 'Gói 3: 6700000',
    'Hello. Package 3 costs VND 9,900,000 and evening classes start at 7 pm.': '9900000',
    'Gói 6 (Khóa 3): 4.900.000 đồng': '4900000',
    'Hoàn tất trước 08/12/2026 được giảm 20% học phí.': '20%',
    'Viện hoàn lại 100% học phí nếu anh/chị hủy trước khai giảng.': '100%',
    'Ưu đãi sớm kéo dài đến 15/12/2026.': '15/12',
    'Khóa 1 học từ 08/01/2026.': '8/1/2026',                                         // right day, wrong year
    'Khóa 2 học ngày 15/01 và 17/01/2027 ạ.': 'Khóa 2: 15/1',                       // Khóa 3's days
    'Buổi sáng bắt đầu lúc 8h, có thêm lớp tối lúc 19h ạ.': '8h',
    'Lớp tối bắt đầu lúc 19:00.': '19:00',
    'Anh/chị gọi 0901 234 567 nhé.': '0901 234 567',
    'Anh/chị nhắn Zalo Ms. Vy 0849 761 636 nhé.': '0849 761 636',                  // one digit off
    'Số tài khoản 1234 5678.': '1234 5678'
  };
  Object.keys(bad).forEach((reply) => assert.strictEqual(unknown(reply), bad[reply], 'should be dropped: ' + reply));
  // A learner's own figure may be said back to them, but never in place of a package's fee.
  assert.strictEqual(unknown('Dạ, 7.000.000 đồng thì chưa đủ ạ.', 'em có 7.000.000 đồng thôi'), '');
  assert.strictEqual(unknown('Dạ, với 5.000.000 đồng thì Gói 6 vừa ạ: Gói 6 học phí 4.500.000 đồng.', 'chị chỉ có khoảng 5 triệu'), '');
  assert.strictEqual(unknown('Gói 3 học phí 7.500.000 đồng ạ, không phải 7.000.000 đồng.', 'Gói 3 giá 7.000.000 phải không em'), '');
  assert.strictEqual(unknown('Dạ đúng ạ, Gói 3 là 7.000.000 đồng.', 'Gói 3 giá 7.000.000 phải không em'), 'Gói 3: 7000000');
  assert.strictEqual(unknown('Dạ đúng ạ, Gói 3 là 1.000.000 đồng.', '- Gói 3: 1.000.000 đồng'), 'Gói 3: 1000000');
  assert.strictEqual(unknown('Dạ, 7.000.000 đồng thì chưa đủ ạ.'), '7000000');
  assert.strictEqual(unknown('Dạ, Gói 2 hợp với chị ạ. Học phí sáu triệu rưỡi đồng.', 'Mình có sáu triệu thôi'), 'sáu triệu rưỡi');
  assert.strictEqual(unknown('Dạ, Gói 3 hợp với chị ạ. Học phí 6 triệu 7 ạ.', 'em có 6 triệu'), 'Gói 3: 6700000');
  assert.strictEqual(unknown('Dạ, với sáu triệu rưỡi thì Gói 6 vừa ạ: Gói 6 học phí 4.500.000 đồng.', 'chị có sáu triệu rưỡi'), '');

  // Every approved answer of the table passes with its own row sent along.
  SEED.forEach((row) => {
    const text = ctx.chatSystemPrompt_().split(ctx.CHAT_EXAMPLES_HEADING)[0] + ctx.chatDateNote_() + ctx.chatReferences_([row]);
    assert.strictEqual(ctx.chatUnknownFigure_(row.answer, text, '', ''), '', row.id);
  });
  // So does every answer of the prompt's example conversation, whole, against the facts alone:
  // a slip in an example fails here instead of teaching the model a wrong figure.
  const examples = ctx.CHAT_SYSTEM_PROMPT.split(ctx.CHAT_EXAMPLES_HEADING)[1].split(/\nHỏi[^\n]*\nĐáp: /).slice(1);
  assert.strictEqual(examples.length, 8);
  const amounts = examples.reduce((count, answer) => count + ctx.chatAmounts_(answer).amounts.length, 0);
  assert.strictEqual(amounts, 10, 'the fee examples are read in full');
  examples.forEach((answer) => {
    const turn = ctx.chatOptions_(answer.trim());
    assert.strictEqual(ctx.chatUnknownFigure_(turn.reply, official, '', ''), '', answer);
    // And they keep to the length they teach: a message is at most about 30 words, a list aside.
    turn.reply.split(/\n\s*\n/).forEach((message) => assert.ok(/^- /m.test(message) || message.split(/\s+/).length <= 30, message));
  });
}

// Quick replies: taken out of the text wherever the model put them, at most three short ones.
{
  const options = (reply) => plain(ctx.chatOptions_(reply));
  const Q = 'Dạ, anh/chị đã dùng R chưa ạ?';
  const cases = [
    [Q + '\n[[A | B]]', Q, ['A', 'B']],
    [Q + ' [[A|B|C|D]]', Q, ['A', 'B', 'C']],
    ['Một.\n\n[[A | B]]\n\nHai.', 'Một.\n\nHai.', ['A', 'B']],
    [Q + '\n[[A | B]].', Q, ['A', 'B']],
    [Q + '\n**[[A | B]]**', Q, ['A', 'B']],
    [Q + '\n[[A]] [[B]] [[C]]', Q, ['A', 'B', 'C']],
    [Q + '\n[[A]]\n[[B]]', Q, ['A', 'B']],
    [Q + '\n[[A | B]]\n\n[[A | B]]', Q, ['A', 'B']],
    ['Dạ, em gửi lịch:', 'Dạ, em gửi lịch:', []],
    [Q + '\n- [[A | B]]', Q, ['A', 'B']],
    [Q + '\nLựa chọn: [[A | B]]', Q, ['A', 'B']],
    [Q + '\n[[A ｜ B]]', Q, ['A', 'B']],
    [Q + '\n[[A / B]]', Q, ['A', 'B']],
    [Q + '\n[[A | B', Q, ['A', 'B']],
    ['Dạ, anh/chị muốn nghe [[Học phí | Lịch học]] trước ạ?', 'Dạ, anh/chị muốn nghe Học phí, Lịch học trước ạ?', ['Học phí', 'Lịch học']],
    ['Dạ.\n[[' + 'x'.repeat(41) + ' | Được]]', 'Dạ.', ['Được']],
    ['Dạ, anh/chị có thể:\n- Điền phiếu\n- Gọi Viện', 'Dạ, anh/chị có thể:\n- Điền phiếu\n- Gọi Viện', []],
    ['Dạ, trong R lấy phần tử đầu bằng x[[1]]\n\nKhóa 1, Bài 1 dạy phần này ạ.', 'Dạ, trong R lấy phần tử đầu bằng x[[1]]\n\nKhóa 1, Bài 1 dạy phần này ạ.', []],
    ['Dạ, không có nút.', 'Dạ, không có nút.', []]
  ];
  cases.forEach(([reply, text, buttons]) => assert.deepStrictEqual(options(reply), { reply: text, options: buttons }, reply));
}

// Limits: the model reads the last 30 exchanges (60 messages), more than 80 messages sent at once
// is refused, and a visitor gets 60 messages an hour.
{
  reset();
  const said = Array.from({ length: 79 }, (_, i) => (i % 2 ? 'Dạ.' : 'Câu ' + i));
  assert.ok(ask(...said).ok);
  assert.strictEqual(model.calls[0].body.contents.length, 59, 'the last 60 messages, less a leading assistant turn');
  assert.strictEqual(model.calls[0].body.contents[0].parts[0].text, 'Câu 20');
  assert.deepStrictEqual(ask(...Array.from({ length: 81 }, (_, i) => (i % 2 ? 'Dạ.' : 'Câu ' + i))), { ok: false, error: 'bad-request' });
  for (let i = 0; i < 60; i++) assert.ok(ctx.handleChat_(request(['Bitcoin tăng giá'], 'one-visitor')).ok, 'message ' + (i + 1));
  assert.deepStrictEqual(ctx.handleChat_(request(['Bitcoin tăng giá'], 'one-visitor')), { ok: false, error: 'rate-limited' });
}

// Claude (CLAUDE_ properties) comes first when its key is set: Anthropic's Messages API, the long
// prompt cached, low effort, server-side fallbacks on a safety decline. Gemini stays behind it.
{
  reset();
  props.CLAUDE_API_KEY = 'claude-key';
  model.replies.push('Dạ, em chào anh/chị. Học phí tính theo gói, từ 3.500.000 đến 8.800.000 đồng ạ.\n\nAnh/chị đã dùng R chưa ạ?\n[[Chưa từng | Đã dùng]]');
  const res = ask(FEE);
  assert.deepStrictEqual(res, { ok: true, reply: 'Dạ, em chào anh/chị. Học phí tính theo gói, từ 3.500.000 đến 8.800.000 đồng ạ.\n\nAnh/chị đã dùng R chưa ạ?', suggestions: ['Chưa từng', 'Đã dùng'] });
  assert.strictEqual(model.calls.length, 1);
  const call = model.calls[0];
  assert.strictEqual(call.url, 'https://api.anthropic.com/v1/messages');
  assert.deepStrictEqual(plain(call.headers), { 'anthropic-version': '2026-10-21', 'anthropic-beta': 'server-side-fallback-2026-07-01', 'x-api-key': 'claude-key' });
  assert.strictEqual(call.body.model, 'claude-opus-5-5');
  assert.strictEqual(call.body.max_tokens, 16000);
  assert.deepStrictEqual(call.body.output_config, { effort: 'low' });
  assert.strictEqual(call.body.fallbacks, 'default');
  assert.ok(!('thinking' in call.body) && !('temperature' in call.body), 'thinking left to the model, no sampling settings');
  assert.strictEqual(call.body.system.length, 2);
  assert.deepStrictEqual(call.body.system[0], { type: 'text', text: ctx.chatSystemPrompt_(), cache_control: { type: 'ephemeral' } });
  assert.ok(call.body.system[1].text.startsWith('\n\n# Ngày hôm nay') && call.body.system[1].text.includes('Hỏi: ' + rowOf('goi-hoc-phi').question));
  assert.ok(!('cache_control' in call.body.system[1]), 'what changes per message stays after the cached prompt');
  assert.deepStrictEqual(call.body.messages, [{ role: 'user', content: FEE }]);
  assert.strictEqual(logged()[4], "'ok claude-opus-5-5");

  // The conversation goes as user and assistant turns; a learner's phone number is masked.
  model.replies.push('Dạ, vậy Gói 3 hợp với anh/chị nhất ạ.');
  ask(FEE, ASKED, 'chưa, số em 0909 123 456');
  assert.deepStrictEqual(plain(model.calls[1].body.messages), [{ role: 'user', content: FEE }, { role: 'assistant', content: ASKED }, { role: 'user', content: 'chưa, số em [số điện thoại]' }]);

  // Model, effort and headers can be changed in the properties.
  props.CLAUDE_MODELS = 'claude-sonnet-5-5';
  props.CLAUDE_EXTRA_BODY = '{"output_config":{"effort":"medium"}}';
  ask(FEE);
  assert.strictEqual(model.calls[2].body.model, 'claude-sonnet-5-5');
  assert.deepStrictEqual(model.calls[2].body.output_config, { effort: 'medium' });
}
{
  // Claude busy (529) or rate-limited: Gemini answers.
  reset();
  props.CLAUDE_API_KEY = 'claude-key';
  model.replies.push({ code: 529, error: 'overloaded_error' }, 'Dạ, Gói 3 học phí 7.500.000 đồng ạ.');
  assert.strictEqual(ask(FEE).reply, 'Dạ, Gói 3 học phí 7.500.000 đồng ạ.');
  assert.strictEqual(logged()[4], "'error-529 claude-opus-5-5; ok gemini-3.5-flash-lite");
  assert.ok(model.calls[1].url.includes('generativelanguage.googleapis.com'));
  // A bad key or used-up credit skips Claude for the rest of the question.
  for (const failure of [{ code: 401, error: 'authentication_error' }, { code: 402, error: 'billing_error' }]) {
    reset();
    props.CLAUDE_API_KEY = 'claude-key';
    props.CLAUDE_MODELS = 'claude-opus-5-5,claude-sonnet-5-5';
    model.replies.push(failure, 'Dạ.');
    ask(FEE);
    assert.strictEqual(logged()[4], "'error-" + failure.code + " claude-opus-5-5; ok gemini-3.5-flash-lite", failure.error);
  }
  // Claude alone: one retry after a transient failure.
  reset({ ai: false });
  props.CLAUDE_API_KEY = 'claude-key';
  model.replies.push({ code: 529, error: 'overloaded_error' }, 'Dạ.');
  ask(FEE);
  assert.strictEqual(logged()[4], "'error-529 claude-opus-5-5; ok claude-opus-5-5");
  // A safety decline, after the fallbacks too, never replaces an approved row; a cut-off answer neither.
  reset({ ai: false });
  props.CLAUDE_API_KEY = 'claude-key';
  model.replies.push({ stop: 'refusal' }, { stop: 'max_tokens', text: 'Dạ, Gói 3 học phí' });
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'blocked-refusal claude-opus-5-5; faq:goi-hoc-phi");
  assert.strictEqual(ask(FEE).reply, FEE_ROW());
  assert.strictEqual(logged()[4], "'ok-truncated claude-opus-5-5; faq:goi-hoc-phi");
  // Thinking that used up max_tokens with no text: the next model is tried.
  reset();
  props.CLAUDE_API_KEY = 'claude-key';
  model.replies.push({ stop: 'max_tokens' }, 'Dạ.');
  ask(FEE);
  assert.strictEqual(logged()[4], "'error-thinking-length claude-opus-5-5; ok gemini-3.5-flash-lite");
  // chatSelfTest names the provider.
  reset({ ai: false });
  props.CLAUDE_API_KEY = 'claude-key';
  model.replies.push('Dạ, Gói 1 học phí 8.800.000 đồng ạ.');
  ctx.chatSelfTest();
  assert.ok(logs.some((line) => line.startsWith('CLAUDE: ok claude-opus-5-5')), JSON.stringify(logs));
}

// chatTalkTest plays its scripted learner through the same path and logs each turn.
{
  reset();
  model.replies.push('Dạ, em chào anh/chị. Anh/chị đã dùng R chưa ạ?\n[[Chưa từng | Đã dùng]]', 'Dạ, vậy Gói 3 hợp với anh/chị nhất ạ.', 'Dạ, Gói 3 học phí 7.500.000 đồng ạ.', 'Dạ, anh/chị xem lại bản ghi ạ.');
  ctx.chatTalkTest();
  assert.strictEqual(logs.length, 4);
  assert.ok(logs[0].includes('TRỢ LÝ [ok gemini-3.5-flash-lite]') && logs[0].includes('NÚT: Chưa từng | Đã dùng'), logs[0]);
  assert.strictEqual(model.calls[3].body.contents.length, 7);
}

// The update menu's log (Sync.gs) writes its cells as text through the chat's helper.
{
  reset();
  const message = 'Đã cập nhật từ trang web. ' + '=x'.repeat(400);
  ctx.syncLog_(book, '2026-11-16 abc1234', message);
  assert.deepStrictEqual(sheets['Lịch sử cập nhật'].data[1], ["'16/11/2026 10:00", "'2026-11-16 abc1234", "'" + message]);
}

// The greeting on the page asks about R with three buttons, and offers two questions. Each has an
// approved row, so the table answers them when no model does.
{
  reset({ ai: false });
  const first = { 'Chưa từng dùng R': 'can-biet-lap-trinh', 'Đã dùng R cơ bản': 'chon-goi', 'Dùng R thường xuyên': 'chon-goi',
    'Học phí và ưu đãi các gói thế nào?': 'goi-hoc-phi', 'Học online qua Zoom có khác học trực tiếp không?': 'online-khac-offline' };
  Object.keys(first).forEach((text) => {
    assert.strictEqual(ask(text).reply, ctx.chatGreet_(rowOf(first[text]).answer), text);
    assert.strictEqual(logged()[4], "'faq:" + first[text]);
  });
}

// The instructions carry the one button the page turns into its phone-number card, word for word
// (dist/app.js opens the card on that label), and the example that teaches it keeps it as a button.
{
  const prompt = ctx.CHAT_SYSTEM_PROMPT;
  const LABEL = 'Để lại số điện thoại';
  assert.ok(prompt.includes('đúng nguyên văn "' + LABEL + '"'));
  const taught = prompt.split(ctx.CHAT_EXAMPLES_HEADING)[1].split(/\nHỏi[^\n]*\nĐáp: /).slice(1).map((answer) => plain(ctx.chatOptions_(answer.trim()).options));
  assert.deepStrictEqual(taught.filter((options) => options.includes(LABEL)), [[LABEL, 'Lịch học']]);
  assert.ok(!/gõ số điện thoại vào (khung|đây) (này )?(nhé|ạ)/.test(prompt), 'the assistant never asks for the number in the text box');
}

// "Thống kê trợ lý": conversations from the log, and the forms that carry a conversation's id.
{
  reset();
  assert.match(ctx.chatStats_(), /Cuộc trò chuyện: 0 \(0 cuộc từ 3 câu hỏi trở lên\)\n- Để lại số điện thoại qua trợ lý: 0\n- Gửi phiếu đăng ký sau khi trò chuyện: 0/, 'no tab yet');
  const QUESTIONS = [FEE, 'Lịch học thế nào?', 'Đăng ký ra sao?', 'Học online được không?'];
  const talk = (session, questions) => questions.forEach((i) => ctx.handleChat_(request([QUESTIONS[i]], session)));
  talk('phien-mot-0001', [0, 1, 2]);
  talk('phien-hai-0002', [0]);
  talk('phien-ba-00003', [0, 1, 2, 3]);
  // Two questions, one of them sent three times (a retry logs a row each time): not three questions.
  talk('phien-bon-0004', [0, 1, 1, 1]);
  sheets['Hỏi đáp'].data.push(['ghi chú của nhân viên', '', '', '', '', '']); // a row without a session is no conversation
  const head = plain(ctx.LEAD_HEADERS);
  const lead = (kind, session) => head.map((h, i) => (i === 1 ? kind : 'x')).concat(session === undefined ? [] : [session, '']);
  // Staff put a column of their own before the assistant's two; a text cell may keep its apostrophe.
  fakeSheet('Lead web', [
    head.concat(['Người gọi', 'Phiên trợ lý', 'Ghi chú trợ lý']),
    lead('Tư vấn').concat(['Vy']),
    lead('Tư vấn').concat(['', 'phien-mot-0001', 'ghi chú']),
    lead('Tư vấn').concat(['', "'phien-mot-0001", '']),   // the same person leaves the number twice
    lead('Tư vấn').concat(['', 'phien-hai-0002', '']),
    lead('Đăng ký').concat(['', 'phien-mot-0001', '']),
    lead('Đăng ký').concat(['', '', ''])
  ]);
  const stats = ctx.chatStats_();
  assert.match(stats, /^Trợ lý AI, tính từ dòng đầu của tab "Hỏi đáp":\n- Cuộc trò chuyện: 4 \(2 cuộc từ 3 câu hỏi trở lên\)\n- Để lại số điện thoại qua trợ lý: 2\n- Gửi phiếu đăng ký sau khi trò chuyện: 1\n/);
  // A "Lead web" tab from before the assistant's columns counts nothing instead of failing.
  fakeSheet('Lead web', [head, lead('Tư vấn')]);
  assert.match(ctx.chatStats_(), /Cuộc trò chuyện: 4 .*\n- Để lại số điện thoại qua trợ lý: 0\n- Gửi phiếu đăng ký sau khi trò chuyện: 0/);
  // The menu shows it; run from the editor, where there is no window, it goes to the log.
  logs.length = 0;
  ctx.chatStats();
  assert.strictEqual(logs[0], ctx.chatStats_());
}

// "Xem hỏi đáp (dòng đang chọn)": the conversations of the person on the selected row, found by phone number through "Lead web".
{
  reset();
  const head = plain(ctx.LEAD_HEADERS).concat(['Phiên trợ lý', 'Ghi chú trợ lý']);
  const lead = (kind, name, phone, session) => head.map((h) => ({ 'Loại form': kind, 'Họ và tên': name, 'Số điện thoại': phone }[h] ?? '')).slice(0, -2).concat([session, '']);
  fakeSheet('Lead web', [head,
    lead('Tư vấn', 'Trần Bình', '0909 123 456', 'phien-binh-0001'),     // left the number in the chat
    lead('Đăng ký', 'Trần Bình', '84909123456', "'phien-binh-0002"),   // registered later from another conversation
    lead('Đăng ký', 'Lê Chi', '0912000111', ''),                       // never talked to the assistant
    lead('Tư vấn', 'Người khác', '0988777666', 'phien-khac-0003')]);
  const answer = 'Dạ, Gói 1 gồm 3 khóa.\n' + 'x'.repeat(700) + ' <script>';
  fakeSheet('Hỏi đáp', [plain(ctx.CHAT_HEADERS),
    ['16/11/2026 09:00:00', 'phien-binh-0001', 'Học phí gói 1?', answer, 'ok', ''],
    ['16/11/2026 09:01:00', 'phien-khac-0003', 'Câu của người khác', 'Không hiện', 'ok', ''],
    ['17/11/2026 20:00:00', "'phien-binh-0002", 'Còn ưu đãi không?', '', 'error-500', '']]);
  const reg = fakeSheet('Đăng ký', [['Thời gian', 'Họ và chữ lót', 'Tên', 'Số điện thoại'], ['17/11/2026 20:05:00', 'Trần', 'Bình', '0909.123.456'], ['', 'Lê', 'Chi', '0912 000 111'], ['', '', '', '']]);
  ui.open = true;
  const select = (sheet, row) => { ui.range = { getSheet: () => sheet, getRow: () => row }; ctx.showChat(); };

  select(reg, 2);
  const [html, title] = ui.dialogs.pop();
  assert.strictEqual(title, 'Hỏi đáp của Trần Bình');
  assert.ok(html.indexOf('Học phí gói 1?') < html.indexOf('Còn ưu đãi không?'), 'both conversations of that number, in log order');
  assert.ok(html.includes('Cuộc trò chuyện phien-binh-0001') && html.includes('Cuộc trò chuyện phien-binh-0002'));
  assert.ok(html.includes('x'.repeat(700) + ' &lt;script&gt;'), 'the whole answer, escaped');
  assert.ok(html.includes('(không có câu trả lời)'));
  assert.ok(!html.includes('Câu của người khác'), 'other people are left out');

  select(sheets['Lead web'], 2);
  assert.strictEqual(ui.dialogs.pop()[1], 'Hỏi đáp của Trần Bình', 'the same from a "Lead web" row');
  select(reg, 3);
  assert.match(ui.alerts.pop(), /^Lê Chi \(0912000111\) không có mã ở cột "Phiên trợ lý"/);
  select(reg, 4);
  assert.strictEqual(ui.alerts.pop(), 'Dòng này chưa có số điện thoại.');
  select(reg, 1);
  assert.match(ui.alerts.pop(), /^Chọn một ô trên dòng/, 'the header row is no person');
  select(sheets['Hỏi đáp'], 2);
  assert.match(ui.alerts.pop(), /^Chọn một ô trên dòng/, 'a tab without "Số điện thoại"');
  ui.range = null;
  ctx.showChat();
  assert.match(ui.alerts.pop(), /^Chọn một ô trên dòng/);
  sheets['Hỏi đáp'].data.splice(1);
  select(reg, 2);
  assert.strictEqual(ui.alerts.pop(), 'Không thấy mã phien-binh-0001, phien-binh-0002 ở cột "Phiên" của tab "Hỏi đáp".');
  assert.deepStrictEqual([ui.alerts.length, ui.dialogs.length], [0, 0]);
  ui.open = false;
}

console.log('apps-script chat check: all passed');
