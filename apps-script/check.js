// Runs the registration backend (Code.gs and the files after it) against an in-memory spreadsheet:
// node apps-script/check.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const OWNER = 'owner@example.com';
const sheets = {};
const cache = new Map();
const props = {};
const triggers = [];
const lock = { waits: 0 };
const mail = { calls: [], failFor: new Set() };
const ui = { range: null, alerts: [] };

function fakeSheet(name) {
  const data = [];
  const marks = { note: {}, background: {}, validation: {} };
  const mark = (kind, r, c, fallback) => marks[kind][r + ',' + c] ?? fallback;
  const filled = (v) => v !== '' && v !== undefined && v !== null;
  // Like Sheets, trailing blank rows and columns do not count.
  const lastRow = () => { let n = data.length; while (n > 0 && !(data[n - 1] || []).some(filled)) n--; return n; };
  const lastCol = () => data.reduce((m, r) => { let n = (r || []).length; while (n > 0 && !filled(r[n - 1])) n--; return Math.max(m, n); }, 0);
  const write = (r, c, v) => { data[r - 1] = data[r - 1] || []; data[r - 1][c - 1] = v; };
  // Like a real grid: a new tab has 1000 rows and a range past the last row throws until insertRowsAfter adds rows.
  let gridRows = 1000;

  const range = (row, col, rows = 1, cols = 1) => {
    if (row < 1 || row + rows - 1 > sheet.getMaxRows()) throw new Error('The coordinates of the range are outside the dimensions of the sheet.');
    const each = (fn) => { for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) fn(row + i, col + j); };
    const grid = (fn) => Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => fn(row + i, col + j)));
    const put = (kind, value) => each((r, c) => { if (value == null) delete marks[kind][r + ',' + c]; else marks[kind][r + ',' + c] = value; });
    const self = {
      getRow: () => row,
      getColumn: () => col,
      getNumRows: () => rows,
      getNumColumns: () => cols,
      getSheet: () => sheet,
      getValues: () => grid((r, c) => ((data[r - 1] || [])[c - 1] ?? '')),
      getValue: () => ((data[row - 1] || [])[col - 1] ?? ''),
      setValues(values) {
        if (values.length !== rows || values.some((v) => v.length !== cols)) {
          throw new Error('setValues: range is ' + rows + 'x' + cols + ', data is ' + values.length + 'x' + (values[0] || []).length);
        }
        values.forEach((v, i) => v.forEach((x, j) => write(row + i, col + j, x)));
        return self;
      },
      setValue(v) { each((r, c) => write(r, c, v)); return self; },
      clearContent() { each((r, c) => write(r, c, '')); return self; },
      setNote(text) { put('note', text); return self; },
      clearNote() { put('note', null); return self; },
      getNote: () => mark('note', row, col, ''),
      getNotes: () => grid((r, c) => mark('note', r, c, '')),
      setBackground(color) { put('background', color); return self; },
      getBackground: () => mark('background', row, col, '#ffffff'),
      setDataValidation(rule) { put('validation', rule); return self; },
      getDataValidation: () => mark('validation', row, col, null)
    };
    ['setFontWeight', 'setFontColor', 'setNumberFormat', 'setWrap', 'setHorizontalAlignment', 'setVerticalAlignment']
      .forEach((m) => { self[m] = () => self; });
    return self;
  };

  const sheet = {
    data,
    protections: [],
    getName: () => name,
    setName(next) { delete sheets[name]; name = next; sheets[name] = sheet; return sheet; },
    getLastRow: lastRow,
    getLastColumn: lastCol,
    getMaxRows: () => Math.max(gridRows, data.length),
    insertRowsAfter(after, count) { gridRows = Math.max(gridRows, data.length) + count; return sheet; },
    getRange: range,
    getDataRange: () => range(1, 1, Math.max(1, lastRow()), Math.max(1, lastCol())),
    appendRow(values) { data[lastRow()] = values.slice(); return sheet; },
    clearContents() { data.length = 0; return sheet; },
    protect() {
      const p = { warningOnly: false, setWarningOnly(on) { p.warningOnly = on; return p; } };
      sheet.protections.push(p);
      return p;
    }
  };
  ['setFrozenRows', 'setFrozenColumns', 'setColumnWidth', 'setColumnWidths'].forEach((m) => { sheet[m] = () => sheet; });
  sheets[name] = sheet;
  return sheet;
}

// Creates the sheet when the test names a tab that does not exist yet.
const fakeRange = (sheetName, row, col, numRows = 1, numCols = 1) =>
  (sheets[sheetName] || fakeSheet(sheetName)).getRange(row, col, numRows, numCols);

const book = {
  getSheetByName: (name) => sheets[name] || null,
  getSheets: () => Object.values(sheets),
  insertSheet(name) {
    if (sheets[name]) throw new Error('A sheet with the name "' + name + '" already exists.');
    return fakeSheet(name);
  },
  getSpreadsheetTimeZone: () => 'Asia/Ho_Chi_Minh'
};

const Button = { OK: 'OK', CANCEL: 'CANCEL', YES: 'YES', NO: 'NO' };
const textOutput = (text) => {
  const out = { getContent: () => text, setMimeType(type) { out.mimeType = type; return out; } };
  return out;
};

const ctx = vm.createContext({
  SpreadsheetApp: {
    getActiveSpreadsheet: () => book,
    getActiveRange: () => ui.range,
    newDataValidation() {
      const rule = {};
      const builder = {
        requireValueInList(list, dropdown) { rule.list = list; rule.dropdown = dropdown; return builder; },
        setAllowInvalid(allow) { rule.allowInvalid = allow; return builder; },
        build: () => ({ ...rule })
      };
      return builder;
    },
    getUi: () => ({
      alert(...args) { ui.alerts.push(args); return Button.YES; },
      ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL', YES_NO: 'YES_NO' },
      Button
    }),
    flush() {}
  },
  // Entries never expire: the ttl is ignored until reset().
  CacheService: {
    getScriptCache: () => ({
      get: (key) => cache.get(key) ?? null,
      put: (key, value) => { cache.set(key, String(value)); },
      remove: (key) => { cache.delete(key); }
    })
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) => props[key] ?? null,
      setProperty: (key, value) => { props[key] = String(value); }
    })
  },
  LockService: { getScriptLock: () => ({ waitLock() { lock.waits++; }, releaseLock() {} }) },
  Session: {
    getEffectiveUser: () => ({ getEmail: () => OWNER }),
    getActiveUser: () => ({ getEmail: () => OWNER })
  },
  MailApp: {
    sendEmail(opts) {
      mail.calls.push(opts);
      if (mail.failFor.has(opts.to)) throw new Error('Invalid email: ' + opts.to);
    }
  },
  ScriptApp: {
    getProjectTriggers: () => triggers.slice(),
    deleteTrigger(trigger) { const i = triggers.indexOf(trigger); if (i >= 0) triggers.splice(i, 1); },
    newTrigger(handler) {
      const trigger = { handler };
      // Non-enumerable, so a trigger still deepEquals a plain { handler }.
      Object.defineProperty(trigger, 'getHandlerFunction', { value: () => handler });
      const builder = { forSpreadsheet: () => builder, onEdit: () => builder, create: () => { triggers.push(trigger); return trigger; } };
      return builder;
    }
  },
  ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: textOutput },
  Utilities: {
    DigestAlgorithm: { MD5: 'md5' },
    // Apps Script digests are arrays of signed bytes.
    computeDigest: (algorithm, value) => Array.from(crypto.createHash(algorithm).update(Buffer.from(value)).digest(), (b) => (b << 24) >> 24),
    base64EncodeWebSafe: (value) => Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    formatDate(date, tz, fmt) {
      const p = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
        .formatToParts(date).forEach((x) => { p[x.type] = x.value; });
      if (fmt === 'H') return String(Number(p.hour));
      return fmt.replace('dd', p.day).replace('MM', p.month).replace('yyyy', p.year).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
    }
  },
  Logger: { log() {} },
  // Chat.gs is not loaded; Code.gs only needs the call to be routed.
  handleChat_: () => textOutput('{"ok":true,"chat":true}')
});

for (const file of ['Code.gs', 'Ledger.gs', 'LedgerMail.gs', 'BotApi.gs']) {
  const full = path.join(__dirname, file);
  if (fs.existsSync(full)) vm.runInContext(fs.readFileSync(full, 'utf8'), ctx, { filename: full });
}

// Objects made inside the vm belong to another realm: wrap them in plain() before deepStrictEqual.
const plain = (v) => JSON.parse(JSON.stringify(v));
const post = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent());
const FORM = { package_id: 'Gói 1', package: 'Gói 1 (3 khóa · 8.800.000 đồng)', ho_lot: 'Nguyễn Văn', ten: 'An',
  emailcontact: 'an@example.com', phoneregister: '0909123456', gioi_tinh: 'Nam', ngay_sinh: '01/01/1990',
  tinh_thanh: 'TP. Hồ Chí Minh', vi_tri: 'Bác sĩ', don_vi: 'Bệnh viện A', biet_qua: 'Zalo', agreement: true,
  page: 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/?utm_source=facebook&utm_medium=paid_social', elapsed: 30, dot: 'R27' };

function reset() {
  Object.keys(sheets).forEach((name) => { delete sheets[name]; });
  Object.keys(props).forEach((key) => { delete props[key]; });
  cache.clear();
  triggers.length = 0;
  lock.waits = 0;
  mail.calls.length = 0;
  mail.failFor.clear();
  ui.range = null;
  ui.alerts.length = 0;
}

// Registration as it behaves today.
reset();
assert.deepStrictEqual(post({ ...FORM, elapsed: 1 }), { ok: false, error: 'too-fast' });
assert.deepStrictEqual(post({ ...FORM, agreement: false }), { ok: false, error: 'no-consent' });
assert.deepStrictEqual(post(FORM), { ok: true });
assert.deepStrictEqual(post(FORM), { ok: true, duplicate: true });

// The fakes the blocks below lean on.
{
  reset();
  const app = ctx.SpreadsheetApp;
  const tab = app.getActiveSpreadsheet().insertSheet('Thử');
  tab.getRange(1, 1, 1, 2).setValues([['a', 'b']]);
  assert.deepStrictEqual(tab.getRange(1, 1, 2, 2).getValues(), [['a', 'b'], ['', '']]);
  assert.strictEqual(tab.getLastRow(), 1);
  assert.throws(() => tab.getRange(2, 1, 1, 2).setValues([['x']]), /range is 1x2, data is 1x1/);
  assert.throws(() => app.getActiveSpreadsheet().insertSheet('Thử'), /already exists/);

  const rule = app.newDataValidation().requireValueInList(['Có', 'Không'], true).setAllowInvalid(false).build();
  tab.getRange(2, 1, 2, 2).setNote('ghi chú').setBackground('#ff0000').setDataValidation(rule);
  const inside = fakeRange('Thử', 3, 2);
  assert.deepStrictEqual([inside.getNote(), inside.getBackground(), inside.getDataValidation()], ['ghi chú', '#ff0000', rule]);
  assert.deepStrictEqual(plain(rule), { list: ['Có', 'Không'], dropdown: true, allowInvalid: false });
  const outside = fakeRange('Thử', 1, 1);
  assert.deepStrictEqual([outside.getNote(), outside.getBackground(), outside.getDataValidation()], ['', '#ffffff', null]);
  assert.deepStrictEqual(fakeRange('Thử', 2, 1, 2, 2).getNotes(), [['ghi chú', 'ghi chú'], ['ghi chú', 'ghi chú']]);
  tab.protect().setWarningOnly(true);
  assert.strictEqual(tab.protections[0].warningOnly, true);

  const edit = fakeRange('Chưa có', 4, 2, 3, 1);
  assert.deepStrictEqual([edit.getSheet().getName(), edit.getRow(), edit.getColumn(), edit.getNumRows(), edit.getNumColumns()], ['Chưa có', 4, 2, 3, 1]);

  const made = ctx.ScriptApp.newTrigger('onEditLedger').forSpreadsheet(app.getActiveSpreadsheet()).onEdit().create();
  assert.deepStrictEqual(triggers, [{ handler: 'onEditLedger' }]);
  assert.strictEqual(ctx.ScriptApp.getProjectTriggers()[0].getHandlerFunction(), 'onEditLedger');

  mail.failFor.add('hong@example.com');
  ctx.MailApp.sendEmail({ to: 'tot@example.com' });
  assert.throws(() => ctx.MailApp.sendEmail({ to: 'hong@example.com' }), /hong@example.com/);
  assert.strictEqual(mail.calls.length, 2, 'a failed send is still recorded');

  ctx.LockService.getScriptLock().waitLock(1000);
  ctx.CacheService.getScriptCache().put('k', 1, 600);
  props.TOKEN = 'abc';
  assert.strictEqual(ctx.PropertiesService.getScriptProperties().getProperty('TOKEN'), 'abc');
  assert.strictEqual(ctx.PropertiesService.getScriptProperties().getProperty('NOPE'), null);
  const { Utilities } = ctx;
  assert.strictEqual(Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, 'a')), 'DMF1ucDxtqgxw5niaXcmYQ==');

  ctx.ScriptApp.deleteTrigger(made);
  assert.strictEqual(triggers.length, 0);
  triggers.push({ handler: 'x' });
  reset();
  assert.deepStrictEqual(
    [Object.keys(sheets), Object.keys(props), triggers, mail.calls, mail.failFor.size, lock.waits, ctx.CacheService.getScriptCache().get('k')],
    [[], [], [], [], 0, 0, null]
  );
}

// Ledger.gs: learner-ledger columns, intake/package/journal tabs and the helpers on top of them.
{
  reset();
  const OLD = ctx.HEADERS.slice(0, 17);
  sheets['Đăng ký'] = fakeSheet('Đăng ký');
  sheets['Đăng ký'].data.push(OLD.slice(), ['01/10/2026 09:00:00', 'Gói 2', 'x', 'Trần Thị', 'Bình', 'b@example.com', '0912000111', 'Nữ', '', '', '', '', '', '', 'Có', '', 'Mới']);
  ctx.setupLedger();
  assert.strictEqual(ctx.HEADERS.length, 26);
  assert.deepStrictEqual(plain(sheets['Đăng ký'].data[0]), plain(ctx.HEADERS));
  assert.strictEqual(sheets['Đăng ký'].data[1][3], 'Trần Thị', 'old rows untouched');
  assert.deepStrictEqual(plain(sheets['Đợt học'].data[1]), ['R27', 'Phân tích định lượng với R', 'R27-', '08/12/2026', '28/12/2026', '08/01/2027', 'Có']);
  assert.deepStrictEqual(plain(sheets['Gói'].data.map((r) => r[3]).slice(1)), ['8800000', '6700000', '7500000', '6700000', '3500000', '4500000']);
  ctx.setupLedger();
  assert.strictEqual(sheets['Gói'].data.length, 7, 'second run adds nothing');
  assert.deepStrictEqual(plain(sheets['Nhật ký'].data[0]), ['Id', 'Thời gian', 'Mã học viên', 'Sự kiện', 'Chi tiết']);

  assert.strictEqual(ctx.ledgerIntake_('r27').prefix, 'R27-');
  assert.strictEqual(ctx.ledgerIntake_('').dot, 'R27', 'single open intake');
  assert.strictEqual(ctx.ledgerIntake_('X99').dot, 'R27', 'unknown code falls back to the single open intake');
  sheets['Đợt học'].data.push(['S28', 'Khóa khác', 'S28-', '', '', '', 'Có']);
  assert.strictEqual(ctx.ledgerIntake_(''), null, 'two open intakes and no code');
  assert.strictEqual(ctx.ledgerIntake_('S28').prefix, 'S28-');
  sheets['Đợt học'].data.pop();

  assert.strictEqual(ctx.nextLearnerCode_(['', 'R27-001', 'R27-009', 'S28-050', 'ghi tay'], 'R27-'), 'R27-010');
  assert.strictEqual(ctx.nextLearnerCode_([], 'R27-'), 'R27-001');
  assert.strictEqual(ctx.channelFromPage_('https://x.vn/?utm_source=Facebook&utm_medium=cpc'), 'facebook');
  assert.strictEqual(ctx.channelFromPage_('https://x.vn/'), '');
  assert.strictEqual(ctx.channelFromPage_(''), '');
  assert.strictEqual(ctx.transferNote_('R27-012', 'Gói 1'), 'R27-012 GOI1');
  assert.strictEqual(ctx.transferNote_('R27-012', ''), 'R27-012');
  [['6.700.000', 6700000], ['6.700.000 đ', 6700000], ['6,700,000', 6700000], ['6700000', 6700000], ['', 0], ['0', 0], ['abc', 0]]
    .forEach(([v, n]) => assert.strictEqual(ctx.parseAmount_(v), n, String(v)));
  assert.strictEqual(ctx.journal_('R27-001', 'đăng ký', 'Gói 1'), 1);
  assert.strictEqual(ctx.journal_('R27-002', 'đăng ký', 'Gói 2'), 2);
}

// Ledger.gs: edges the happy path above skips.
{
  reset();
  assert.strictEqual(ctx.ledgerIntake_('R27'), null, 'no intake tab: unmigrated sheet keeps working');
  assert.strictEqual(ctx.journal_('R27-001', 'đăng ký', 'Gói 1'), 0, 'no journal tab: nothing written');
  fakeSheet('Đợt học');
  assert.strictEqual(ctx.ledgerIntake_('R27'), null, 'empty intake tab');
  sheets['Đợt học'].data.push(ctx.LEDGER_INTAKES.headers.slice());
  assert.strictEqual(ctx.ledgerIntake_('R27'), null, 'header-only intake tab');

  assert.deepStrictEqual(plain(ctx.LEDGER_STATUSES), ['Mới', 'Đã liên hệ', 'Chờ CK', 'Đã đóng', 'Hủy']);
  assert.deepStrictEqual(plain(ctx.LEDGER_FORMATS), ['Trực tiếp', 'Online']);

  // Sheets turns a typed date into a Date value; the deadline must still read dd/MM/yyyy.
  sheets['Đợt học'].data.push(['R27', 'Chuỗi R', 'R27-', new Date('2026-12-08T00:00:00+07:00'), '28/12/2026', '', 'có']);
  const intake = ctx.ledgerIntake_('');
  assert.deepStrictEqual([intake.earlyDeadline, intake.deadline, intake.start], ['08/12/2026', '28/12/2026', '']);

  assert.strictEqual(ctx.nextLearnerCode_(['R27-999'], 'R27-'), 'R27-1000');
  assert.strictEqual(ctx.nextLearnerCode_(['r27-020', ' R27-007 '], 'R27-'), 'R27-021', 'staff-typed codes count');
  assert.strictEqual(ctx.channelFromPage_('https://x.vn/?a=1&utm_source=' + 'z'.repeat(80)).length, 50);
  assert.strictEqual(ctx.channelFromPage_('https://x.vn/?utm_source=%E0%A4%A'), '%e0%a4%a', 'malformed escape does not throw');
  assert.strictEqual(ctx.parseAmount_(6700000), 6700000, 'numeric cell');
  assert.strictEqual(ctx.parseAmount_('999'), 0, 'under 1000 is not a fee');
  // A 1-2 digit decimal tail is cents, not x100; a phone-number-sized figure is refused (0), never sent as a fee.
  [['6700000.00', 6700000], ['6.700.000,00', 6700000], ['6,700,000.50', 6700000], ['6.700.000,5 đ', 6700000], ['6700000,00 đ', 6700000],
    ['0912000111', 0], ['100000000', 100000000], ['100000001', 0], ['6.7', 0]]
    .forEach(([v, n]) => assert.strictEqual(ctx.parseAmount_(v), n, String(v)));
}

// Ledger.gs: setupLedger on a sheet that already has a different header, and on a blank workbook.
{
  reset();
  sheets['Đăng ký'] = fakeSheet('Đăng ký');
  const header = ctx.HEADERS.slice(0, 17);
  header[19] = 'Khác';
  sheets['Đăng ký'].data.push(header);
  assert.throws(() => ctx.setupLedger(), /Khác/);
  assert.strictEqual(sheets['Đăng ký'].data[0][19], 'Khác', 'foreign header kept');
  assert.strictEqual(sheets['Đăng ký'].data[0][17], undefined, 'nothing written before the check passed');
  assert.deepStrictEqual(Object.keys(sheets), ['Đăng ký'], 'no tab created either');

  reset();
  const summary = ctx.setupLedger();
  assert.deepStrictEqual(plain(sheets['Đăng ký'].data[0]), plain(ctx.HEADERS), 'blank workbook gets the full header');
  assert.strictEqual(typeof summary, 'string');
  const main = sheets['Đăng ký'];
  const col = ctx.ledgerCol_;
  assert.deepStrictEqual([col('Trạng thái'), col('Mã học viên'), col('Hình thức'), col('Ghi chú')], [17, 18, 21, 26]);
  assert.deepStrictEqual(plain(main.getRange(2, col('Trạng thái')).getDataValidation()), { list: plain(ctx.LEDGER_STATUSES), dropdown: true, allowInvalid: false });
  assert.deepStrictEqual(plain(main.getRange(40, col('Hình thức')).getDataValidation()), { list: plain(ctx.LEDGER_FORMATS), dropdown: true, allowInvalid: false });
  assert.strictEqual(main.getRange(2, col('Tên')).getDataValidation(), null);
  assert.strictEqual(sheets['Nhật ký'].protections.length, 1);
  assert.strictEqual(sheets['Nhật ký'].protections[0].warningOnly, true);
  ctx.setupLedger();
  assert.strictEqual(sheets['Nhật ký'].protections.length, 1, 'second run does not stack protections');

  main.data.push(['01/10/2026 09:00:00', 'Gói 2', 'x', 'Trần Thị', 'Bình', 'b@example.com']);
  const row = plain(ctx.ledgerRow_(main, 2));
  assert.strictEqual(Object.keys(row).length, 26);
  assert.deepStrictEqual([row['Tên'], row['Email'], row['Mã học viên']], ['Bình', 'b@example.com', '']);

  ctx.journal_('', 'x', 'y');
  sheets['Nhật ký'].data.push(['10', '', '', 'tay', '']);
  assert.strictEqual(ctx.journal_('R27-001', 'đăng ký', 'Gói 1'), 11, 'text id on the last row still counts');
  const written = sheets['Nhật ký'].data[3];
  assert.deepStrictEqual([written[0], written[2], written[3], written[4]], [11, 'R27-001', 'đăng ký', 'Gói 1']);
  assert.match(written[1], /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
}

// Ledger.gs: the journal keeps accepting events after the 1000-row grid of a new tab is full.
{
  reset();
  const tab = fakeSheet('Thử lưới');
  assert.strictEqual(tab.getMaxRows(), 1000);
  assert.throws(() => tab.getRange(1001, 1), /outside the dimensions/);
  assert.strictEqual(tab.insertRowsAfter(1000, 1).getMaxRows(), 1001);
  tab.getRange(1001, 1).setValue('x');
  assert.throws(() => tab.getRange(1002, 1), /outside the dimensions/);
  delete sheets['Thử lưới'];

  ctx.setupLedger();
  const journal = sheets['Nhật ký'];
  const free = journal.getMaxRows() - journal.getLastRow();
  const ids = [];
  for (let i = 0; i < free + 5; i++) ids.push(ctx.journal_('R27-001', 'đăng ký', 'Gói ' + (i % 6 + 1)));
  assert.deepStrictEqual(ids, Array.from({ length: free + 5 }, (_, i) => i + 1), 'ids keep increasing past the grid');
  assert.ok(journal.getMaxRows() >= journal.getLastRow(), 'grid grew');
  assert.deepStrictEqual([journal.data[journal.getLastRow() - 1][0], journal.data[journal.getLastRow() - 1][4]], [free + 5, 'Gói ' + ((free + 4) % 6 + 1)]);
}

// Registration with the ledger: learner code, receipt email to the learner, and the journal.
{
  reset();
  ctx.setupLedger();
  const journalEvents = () => sheets['Nhật ký'].data.slice(1).map((r) => r[3]);
  const rowOf = (code) => { const s = sheets['Đăng ký']; const i = s.data.findIndex((r) => r[ctx.HEADERS.indexOf('Mã học viên')] === code); return ctx.ledgerRow_(s, i + 1); };
  assert.deepStrictEqual(post(FORM), { ok: true });
  let r = rowOf('R27-001');
  assert.strictEqual(r['Đợt'], 'R27');
  assert.strictEqual(r['Kênh'], 'facebook');
  assert.strictEqual(r['Trạng thái'], 'Mới');
  const learnerMail = mail.calls.find((m) => m.to === 'an@example.com');
  assert.ok(learnerMail.subject.includes('R27-001'));
  assert.ok(learnerMail.htmlBody.includes('28/12/2026'));
  assert.ok(!learnerMail.htmlBody.includes('img.vietqr.io'), 'no QR before staff confirm the amount');
  assert.strictEqual(learnerMail.replyTo, 'vanphong@vienphuongnam.com.vn');
  assert.deepStrictEqual(journalEvents().slice(-2), ['đăng ký', 'email xác nhận']);

  assert.deepStrictEqual(post({ ...FORM, emailcontact: 'c@example.com' }), { ok: true });
  assert.ok(rowOf('R27-002'), 'codes continue');

  mail.failFor.add('bad@example.com');
  assert.deepStrictEqual(post({ ...FORM, emailcontact: 'bad@example.com' }), { ok: true }, 'learner mail failure never fails the registration');
  assert.strictEqual(journalEvents().slice(-1)[0], 'lỗi email');

  sheets['Đợt học'].data.push(['S28', 'Khóa khác', 'S28-', '', '', '', 'Có']);
  assert.deepStrictEqual(post({ ...FORM, emailcontact: 'd@example.com', dot: '' }), { ok: true });
  assert.strictEqual(sheets['Đăng ký'].data.slice(-1)[0][ctx.HEADERS.indexOf('Mã học viên')], '', 'no code when the intake is ambiguous');
  assert.strictEqual(journalEvents().slice(-1)[0], 'lỗi đợt');
  assert.ok(!mail.calls.some((m) => m.to === 'd@example.com'));
  sheets['Đợt học'].data.pop();
}

// Registration: what the receipt says, and what it must not say.
{
  reset();
  ctx.setupLedger();
  assert.deepStrictEqual(post({ ...FORM, ho_lot: 'Lê <b>Văn</b>', ten: 'Tâm & Co' }), { ok: true });
  const m = mail.calls.find((x) => x.to === 'an@example.com');
  assert.strictEqual(m.subject, 'Viện Phương Nam đã nhận phiếu đăng ký – R27-001');
  assert.strictEqual(m.name, 'Viện Phương Nam');
  const html = m.htmlBody;
  ['Lê &lt;b&gt;Văn&lt;/b&gt; Tâm &amp; Co', 'Phân tích định lượng với R', 'R27-001', 'Gói 1 (3 khóa', 'Ms. Vy hoặc Ms. Thảo', 'Zalo', 'email',
    'xác nhận số tiền', 'chưa giữ chỗ', 'trước ngày 28/12/2026', '(028) 2242 6789', '0949 761 636 (Ms. Vy)', '0912 114 511 (Ms. Thảo)', 'vanphong@vienphuongnam.com.vn']
    .forEach((s) => assert.ok(html.includes(s), 'receipt mentions ' + s));
  assert.ok(!html.includes('<b>Văn'), 'learner-typed values are escaped');
  ['vietqr', 'STK', 'GOI1', 'Số tài khoản'].forEach((s) => assert.ok(!html.includes(s), 'no payment details: ' + s));

  sheets['Đợt học'].data[1][4] = '';
  post({ ...FORM, emailcontact: 'e@example.com' });
  assert.ok(!mail.calls.find((x) => x.to === 'e@example.com').htmlBody.includes('trước ngày'), 'blank deadline leaves no dangling date');
}

// Registration: a ledger problem never costs the learner the registration they already sent.
{
  reset();
  assert.deepStrictEqual(post(FORM), { ok: true });
  const old = sheets['Đăng ký'];
  assert.strictEqual(old.getLastRow(), 2);
  assert.strictEqual(old.data[1].length, ctx.HEADERS.length, 'a full-width row even without ledger tabs');
  assert.deepStrictEqual(plain(old.data[1].slice(17, 20)), ['', '', 'facebook']);
  assert.deepStrictEqual(mail.calls.map((m) => m.to), [OWNER + ',vanphong@vienphuongnam.com.vn'], 'unmigrated sheet: staff mail only, no learner mail');

  reset();
  ctx.setupLedger();
  sheets['Đợt học'].data[1][2] = '';
  assert.deepStrictEqual(post(FORM), { ok: true });
  assert.strictEqual(sheets['Đăng ký'].data[1][ctx.HEADERS.indexOf('Mã học viên')], '', 'blank prefix is no intake');
  assert.deepStrictEqual(sheets['Nhật ký'].data.slice(1).map((x) => [x[2], x[3], x[4]]), [['', 'lỗi đợt', 'R27']]);
  assert.ok(!mail.calls.some((m) => m.to === 'an@example.com'));

  reset();
  ctx.setupLedger();
  sheets['Nhật ký'].getRange = () => { throw new Error('boom'); };
  assert.deepStrictEqual(post(FORM), { ok: true }, 'a broken journal does not fail the registration');
  assert.deepStrictEqual(post(FORM), { ok: true, duplicate: true }, 'the duplicate guard was written before the ledger calls');
  assert.strictEqual(sheets['Đăng ký'].getLastRow(), 2);
  assert.ok(mail.calls.some((m) => m.to === 'an@example.com'), 'the learner still gets the receipt');
}

// Registration: the sheet keeps accepting rows after the 1000-row grid of a tab is full.
{
  reset();
  ctx.setupLedger();
  const main = sheets['Đăng ký'];
  while (main.data.length < main.getMaxRows()) main.data.push(['x']);
  assert.deepStrictEqual(post(FORM), { ok: true });
  assert.strictEqual(main.getLastRow(), 1001);
  assert.strictEqual(main.data[1000][ctx.HEADERS.indexOf('Mã học viên')], 'R27-001');
}

console.log('apps-script check: all passed');
