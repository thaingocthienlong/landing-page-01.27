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
const lock = { waits: 0, held: 0, failAt: 0 };
const mail = { calls: [], failFor: new Set() };
const ui = { range: null, alerts: [] };
// The Sheet's owner as getOwner() reports it: email null is a shared-drive file (no owner), fails makes the call throw.
const sheetOwner = { email: OWNER, fails: false };

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
      getDataValidation: () => mark('validation', row, col, null),
      copyTo(dest) { const top = dest.getRow(); const left = dest.getColumn(); each((r, c) => write(top + r - row, left + c - col, (data[r - 1] || [])[c - 1] ?? '')); return self; }
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
  getSpreadsheetTimeZone: () => 'Asia/Ho_Chi_Minh',
  getOwner() {
    if (sheetOwner.fails) throw new Error('Service error: Drive');
    return sheetOwner.email === null ? null : { getEmail: () => sheetOwner.email };
  }
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
  // failAt: the n-th acquisition since reset() times out, like a lock another run holds for more than the wait.
  LockService: {
    getScriptLock: () => ({
      waitLock() {
        lock.waits++;
        if (lock.waits === lock.failAt) throw new Error('Lock timeout: another process was holding the lock for too long.');
        lock.held++;
      },
      releaseLock() { if (lock.held > 0) lock.held--; }
    })
  },
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
      return fmt.replace('dd', p.day).replace('MM', p.month).replace('yyyy', p.year).replace('yy', p.year.slice(2)).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
    }
  },
  Logger: { log() {} },
  // Chat.gs is not loaded; Code.gs only needs the call to be routed.
  handleChat_: () => textOutput('{"ok":true,"chat":true}')
});

for (const file of ['Code.gs', 'Ledger.gs', 'LedgerMail.gs', 'BotApi.gs', 'Leads.gs', 'LeadTabs.gs']) {
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
  lock.held = 0;
  lock.failAt = 0;
  mail.calls.length = 0;
  mail.failFor.clear();
  ui.range = null;
  ui.alerts.length = 0;
  sheetOwner.email = OWNER;
  sheetOwner.fails = false;
}

// Ledger tab helpers. File scope, not inside a block: the bot-feed tests reuse edit(). Columns are looked up by header name.
const colOf = (header) => ctx.ledgerCol_(header);
const cellAt = (row, header) => ((sheets['Đăng ký'].data[row - 1] || [])[colOf(header) - 1] ?? '');
const setCell = (row, header, value) => { sheets['Đăng ký'].getRange(row, colOf(header)).setValue(value); };
const noteAt = (row, header) => sheets['Đăng ký'].getRange(row, colOf(header)).getNote();
const bgAt = (row, header) => sheets['Đăng ký'].getRange(row, colOf(header)).getBackground();
const journalRows = () => (sheets['Nhật ký'] ? sheets['Nhật ký'].data.slice(1) : []);
// Pastes value over numRows cells of the column, then fires the installable trigger the way Sheets would.
const edit = (rowIndex, value, numRows = 1, header = 'Trạng thái') => {
  const range = fakeRange('Đăng ký', rowIndex, colOf(header), numRows, 1);
  range.setValues(Array.from({ length: numRows }, () => [value]));
  ctx.onLedgerEdit({ range });
};
const selectRows = (rowIndex, numRows) => { ui.range = fakeRange('Đăng ký', rowIndex, 1, numRows, ctx.HEADERS.length); };
const manualRow = ({ code = '', dot = '', ho = 'Phạm Thị', ten = 'Mai', page = 'https://vienphuongnam.com.vn/?utm_source=Zalo' } = {}) => {
  const row = { 'Thời gian': '02/10/2026 10:00:00', 'Mã gói': 'Gói 2', 'Gói đăng ký quan tâm': 'Gói 2 (2 khóa · 6.700.000 đồng)', 'Họ và chữ lót': ho,
    'Tên': ten, 'Email': 'mai@example.com', 'Số điện thoại': '0988000111', 'Trang gửi': page, 'Trạng thái': 'Mới', 'Mã học viên': code, 'Đợt': dot };
  return ctx.HEADERS.map((h) => row[h] ?? '');
};
const lastCodes = (n) => sheets['Đăng ký'].data.slice(-n).map((r) => r[colOf('Mã học viên') - 1]);

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
  assert.strictEqual(ctx.channelFromPage_('https://x.vn/'), 'trực tiếp', 'a page without utm_source is a direct visit');
  assert.strictEqual(ctx.channelFromPage_('https://x.vn/?utm_source='), 'trực tiếp', 'an empty utm_source is no source');
  assert.strictEqual(ctx.channelFromPage_(''), '', 'no page at all says nothing');
  assert.strictEqual(ctx.channelFromPage_(undefined), '');
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
  ['Lê &lt;b&gt;Văn&lt;/b&gt; Tâm &amp; Co', 'Phân tích định lượng với R', 'R27-001', 'Gói đã chọn: Gói 1</p>', 'Ms. Vy hoặc Ms. Thảo', 'Zalo', 'email',
    'xác nhận số tiền', 'chưa giữ chỗ', 'trước ngày 28/12/2026', '(028) 2242 6789', '0949 761 636 (Ms. Vy)', '0912 114 511 (Ms. Thảo)', 'vanphong@vienphuongnam.com.vn']
    .forEach((s) => assert.ok(html.includes(s), 'receipt mentions ' + s));
  assert.ok(!html.includes('<b>Văn'), 'learner-typed values are escaped');
  ['vietqr', 'STK', 'GOI1', 'Số tài khoản', 'đồng', '8.800.000'].forEach((s) => assert.ok(!html.includes(s), 'no payment details: ' + s));

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

  reset();
  ctx.setupLedger();
  mail.failFor.add(OWNER + ',vanphong@vienphuongnam.com.vn');
  assert.deepStrictEqual(post(FORM), { ok: true }, 'a failed staff mail does not fail the registration');
  assert.deepStrictEqual(post(FORM), { ok: true, duplicate: true });
  const journal = sheets['Nhật ký'].data.slice(1).map((x) => [x[2], x[3], x[4]]);
  assert.deepStrictEqual(journal.map((x) => x[1]), ['lỗi email', 'đăng ký', 'email xác nhận'], 'the registration is still journaled and the learner still gets the receipt');
  assert.deepStrictEqual(journal[0], ['R27-001', 'lỗi email', 'thông báo Viện: Invalid email: ' + OWNER + ',vanphong@vienphuongnam.com.vn']);
  assert.ok(mail.calls.some((m) => m.to === 'an@example.com'));
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

// Trạng thái trigger: payment email with VietQR when staff choose Chờ CK, paid date, resend, code assignment and the trigger install.
{
  reset();
  ctx.setupLedger();
  ['an@example.com', 'b@example.com', 'c@example.com'].forEach((emailcontact) => assert.deepStrictEqual(post({ ...FORM, emailcontact }), { ok: true }));
  assert.deepStrictEqual(lastCodes(3), ['R27-001', 'R27-002', 'R27-003']);
  setCell(3, 'Hình thức', 'Online');

  // rows 2..4 = R27-001..R27-003; R27-001 has no amount yet
  mail.calls.length = 0;
  edit(2, 'Chờ CK');
  assert.strictEqual(mail.calls.length, 0);
  assert.ok(noteAt(2, 'Số tiền phải đóng').includes('Số tiền'), 'missing amount is flagged on the cell');
  assert.strictEqual(bgAt(2, 'Số tiền phải đóng'), '#f8d7da');

  setCell(2, 'Số tiền phải đóng', '6.700.000 đ');
  edit(2, 'Chờ CK');
  assert.strictEqual(mail.calls.length, 1);
  const m = mail.calls[0];
  assert.ok(m.htmlBody.includes('R27-001 GOI1'));
  assert.ok(m.htmlBody.includes('6.700.000'));
  assert.ok(m.htmlBody.includes('2242 6789'));
  const qr = m.htmlBody.match(/https:\/\/img\.vietqr\.io\/image\/[^"]+/)[0];
  assert.ok(qr.startsWith('https://img.vietqr.io/image/970448-22426789-compact2.png?'));
  assert.ok(qr.includes('amount=6700000') && qr.includes('addInfo=R27-001%20GOI1'));
  assert.ok(!qr.includes('0909123456') && !/Nguy/.test(decodeURIComponent(qr)), 'no learner data in the QR URL');
  assert.ok(cellAt(2, 'Email CK đã gửi'));
  assert.strictEqual(noteAt(2, 'Số tiền phải đóng'), '', 'flag cleared once valid');
  assert.strictEqual(bgAt(2, 'Số tiền phải đóng'), '#ffffff');

  assert.deepStrictEqual([m.to, m.replyTo, m.name], ['an@example.com', 'vanphong@vienphuongnam.com.vn', 'Viện Phương Nam']);
  assert.strictEqual(m.subject, 'Hướng dẫn chuyển khoản học phí – R27-001');
  ['Nguyễn Văn An', 'Gói 1', '6.700.000 đồng', 'VIEN PHAT TRIEN NGUON LUC XA HOI PHUONG NAM', 'Ngân hàng Phương Đông (OCB), chi nhánh Tân Thuận',
    'trước ngày 28/12/2026', 'phiếu thu', 'Zalo', '(028) 2242 6789', '0949 761 636 (Ms. Vy)', '0912 114 511 (Ms. Thảo)', 'vanphong@vienphuongnam.com.vn']
    .forEach((s) => assert.ok(m.htmlBody.includes(s), 'payment email mentions ' + s));
  assert.match(m.htmlBody, /quét bằng ứng dụng ngân hàng để điền sẵn số tiền và nội dung/i);
  assert.ok(!m.htmlBody.includes('Hình thức'), 'no format line when the cell is empty');
  assert.ok(!m.htmlBody.includes('—'), 'no em dash');
  assert.deepStrictEqual(plain(journalRows().slice(-2).map((j) => j.slice(2, 5))), [['R27-001', 'đổi trạng thái', 'Chờ CK'], ['R27-001', 'email CK', '6700000']]);
  assert.match(cellAt(2, 'Email CK đã gửi'), /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);

  edit(2, 'Chờ CK');
  assert.strictEqual(mail.calls.length, 1, 'never sent twice by the trigger');

  setCell(3, 'Số tiền phải đóng', '8800000');           // row 4 keeps no amount
  edit(2, 'Chờ CK', 3);                                  // pasted over rows 2..4
  assert.strictEqual(mail.calls.length, 2, 'only row 3 is new and complete');
  assert.ok(noteAt(4, 'Số tiền phải đóng'));
  assert.deepStrictEqual([mail.calls[1].to, mail.calls[1].htmlBody.includes('R27-002 GOI1'), mail.calls[1].htmlBody.includes('8.800.000 đồng'), mail.calls[1].htmlBody.includes('Online')], ['b@example.com', true, true, true]);

  edit(3, 'Đã đóng');
  assert.match(cellAt(3, 'Ngày đóng'), /^\d{2}\/\d{2}\/\d{4}$/);
  assert.deepStrictEqual(journalRows().slice(-1)[0].slice(2, 5), ['R27-002', 'đổi trạng thái', 'Đã đóng']);
  const paidCount = journalRows().filter((j) => j[4] === 'Đã đóng').length;
  edit(3, 'Đã đóng');
  assert.strictEqual(journalRows().filter((j) => j[4] === 'Đã đóng').length, paidCount, 'paid recorded once');

  const before = mail.calls.length;
  edit(2, 'ghi chú bất kỳ', 1, 'Ghi chú');
  assert.strictEqual(mail.calls.length, before, 'other columns do nothing');

  selectRows(2, 1);
  ctx.resendPaymentEmail();
  assert.strictEqual(mail.calls.length, before + 1, 'menu resend ignores the sent flag');
  assert.strictEqual(ui.alerts[0][1], 'YES_NO', 'asks before sending');

  selectRows(2, 3);                                      // rows 2..4: sent, paid, and Chờ CK without an amount
  ctx.resendPaymentEmail();
  assert.strictEqual(mail.calls.length, before + 2, 'only the Chờ CK row with an amount is sent; paid rows never get payment details');
  selectRows(3, 1);
  ctx.resendPaymentEmail();
  assert.strictEqual(mail.calls.length, before + 2, 'a row that is not in Chờ CK is skipped');
  const realUi = ctx.SpreadsheetApp.getUi;
  ctx.SpreadsheetApp.getUi = () => ({ ...realUi(), alert: () => 'NO' });
  selectRows(2, 1);
  ctx.resendPaymentEmail();
  ctx.SpreadsheetApp.getUi = realUi;
  assert.strictEqual(mail.calls.length, before + 2, 'answering No sends nothing');

  sheets['Đăng ký'].data.push(manualRow({ code: 'R27-020' }), manualRow({ code: '' }), manualRow({ code: '', dot: 'R27' })); // staff-typed rows
  const codeOf = (r) => Number(String(r[colOf('Mã học viên') - 1]).slice(4));
  const max = Math.max(...sheets['Đăng ký'].data.slice(1).map(codeOf));
  const pad = (n) => 'R27-' + String(n).padStart(3, '0');
  const journaled = journalRows().length;
  const waits = lock.waits;
  const n = ctx.assignMissingCodes();
  assert.strictEqual(n, 2);
  assert.deepStrictEqual(lastCodes(2), [pad(max + 1), pad(max + 2)], 'continue after the highest code, no duplicates');
  assert.strictEqual(max, 20);
  assert.ok(lock.waits > waits, 'takes the script lock so a registration cannot get the same code');
  assert.strictEqual(journalRows().length, journaled, 'never journals: legacy rows must not reach the staff feed');
  const end = sheets['Đăng ký'].data.length;
  assert.deepStrictEqual([cellAt(end, 'Đợt'), cellAt(end, 'Kênh'), cellAt(end - 1, 'Đợt'), cellAt(end - 1, 'Kênh')], ['R27', 'zalo', 'R27', 'zalo']);
  assert.strictEqual(ctx.assignMissingCodes(), 0);

  ctx.installLedgerTrigger(); ctx.installLedgerTrigger();
  assert.strictEqual(triggers.filter((t) => t.handler === 'onLedgerEdit').length, 1);
}

// Trạng thái trigger: bad data is flagged on the cell, a failed send is journaled and can be retried, and nothing throws out to the user.
{
  reset();
  ctx.setupLedger();
  post(FORM);
  setCell(2, 'Số tiền phải đóng', '6.700.000');
  setCell(2, 'Email', 'khong-hop-le');
  mail.calls.length = 0;
  edit(2, 'Chờ CK');
  assert.strictEqual(mail.calls.length, 0);
  assert.ok(noteAt(2, 'Email').includes('Email không hợp lệ'));
  assert.strictEqual(bgAt(2, 'Email'), '#f8d7da');
  assert.strictEqual(cellAt(2, 'Email CK đã gửi'), '');

  setCell(2, 'Email', 'an@example.com');
  mail.failFor.add('an@example.com');
  edit(2, 'Chờ CK');
  assert.strictEqual(cellAt(2, 'Email CK đã gửi'), '', 'a failed send is not recorded as sent');
  assert.deepStrictEqual(plain(journalRows().slice(-1)[0].slice(2, 5)), ['R27-001', 'lỗi email', 'email CK: Invalid email: an@example.com']);
  assert.ok(noteAt(2, 'Email CK đã gửi').includes('Invalid email'), 'staff see why on the sent cell');
  assert.strictEqual(noteAt(2, 'Email'), '', 'the email flag is cleared once valid');
  mail.failFor.clear();
  edit(2, 'Chờ CK');
  assert.ok(cellAt(2, 'Email CK đã gửi'), 'choosing Chờ CK again retries');
  assert.strictEqual(noteAt(2, 'Email CK đã gửi'), '');
  assert.strictEqual(mail.calls.length, 2, 'one failed attempt and one retry');

  // A long provider message is cut to 200 characters after the prefix.
  const longMail = 'a'.repeat(250) + '@example.com';
  sheets['Đăng ký'].data.push(manualRow({ code: 'R27-007', dot: 'R27' }));
  setCell(3, 'Email', longMail);
  setCell(3, 'Số tiền phải đóng', '3500000');
  mail.failFor.add(longMail);
  edit(3, 'Chờ CK');
  assert.strictEqual(journalRows().slice(-1)[0][4].length, 'email CK: '.length + 200);

  // A row with no learner code would give a transfer note nobody can match.
  sheets['Đăng ký'].data.push(manualRow({ code: '' }));
  setCell(4, 'Số tiền phải đóng', '3500000');
  const sent = mail.calls.length;
  edit(4, 'Chờ CK');
  assert.strictEqual(mail.calls.length, sent);
  assert.ok(noteAt(4, 'Mã học viên').includes('Mã học viên'));

  // Not our tab, not our column, the header row, or no range at all: ignored without a throw.
  const quiet = mail.calls.length;
  const events = journalRows().length;
  ctx.onLedgerEdit(undefined);
  ctx.onLedgerEdit({});
  ctx.onLedgerEdit({ range: fakeRange('Nhật ký', 2, colOf('Trạng thái')) });
  ctx.onLedgerEdit({ range: fakeRange('Đăng ký', 1, colOf('Trạng thái')) });
  ctx.onLedgerEdit({ range: fakeRange('Đăng ký', 2, 1, 3, colOf('Trạng thái') - 1) });
  assert.strictEqual(mail.calls.length, quiet);
  assert.strictEqual(journalRows().length, events);

  // A status the trigger only records: journaled, no mail.
  edit(2, 'Hủy');
  assert.deepStrictEqual(plain(journalRows().slice(-1)[0].slice(2, 5)), ['R27-001', 'đổi trạng thái', 'Hủy']);
  assert.strictEqual(mail.calls.length, sent);
}

// Payment email: values are escaped, and it still works on a sheet without the ledger tabs.
{
  reset();
  ctx.setupLedger();
  post({ ...FORM, ho_lot: 'Lê <b>Văn</b>', ten: 'Tâm & Co' });
  setCell(2, 'Số tiền phải đóng', '6700000');
  mail.calls.length = 0;
  edit(2, 'Chờ CK');
  const html = mail.calls[0].htmlBody;
  assert.ok(html.includes('Lê &lt;b&gt;Văn&lt;/b&gt; Tâm &amp; Co'));
  assert.ok(!html.includes('<b>Văn'), 'learner-typed values are escaped');
  assert.ok(html.includes('amount=6700000&amp;addInfo=R27-001%20GOI1&amp;accountName='), 'the QR address is HTML-escaped inside the attribute');
  assert.strictEqual(
    ctx.vietQrUrl_(6700000, 'R27-001 GOI1'),
    'https://img.vietqr.io/image/970448-22426789-compact2.png?amount=6700000&addInfo=R27-001%20GOI1&accountName=VIEN%20PHAT%20TRIEN%20NGUON%20LUC%20XA%20HOI%20PHUONG%20NAM'
  );

  sheets['Đợt học'].data[1][4] = '';
  setCell(2, 'Email CK đã gửi', '');
  edit(2, 'Chờ CK');
  assert.ok(!mail.calls[1].htmlBody.includes('trước ngày'), 'blank deadline leaves no dangling date');

  reset();
  ctx.setup();
  sheets['Đăng ký'].data.push(manualRow({ code: 'R27-001' }));
  setCell(2, 'Số tiền phải đóng', '6700000');
  edit(2, 'Chờ CK');
  assert.strictEqual(mail.calls.length, 1, 'no Đợt học and no Nhật ký tab: still sent');
  assert.ok(!mail.calls[0].htmlBody.includes('trước ngày'));
  assert.ok(cellAt(2, 'Email CK đã gửi'));
}

// assignMissingCodes: only rows with a name and a known intake, and the code counts each intake on its own.
{
  reset();
  ctx.setupLedger();
  post(FORM);
  sheets['Đợt học'].data.push(['S28', 'Khóa khác', 'S28-', '', '', '', 'Có']);
  const main = sheets['Đăng ký'];
  main.data.push(manualRow({ dot: 'S28' }), manualRow({ dot: 'R27' }), manualRow({ dot: '' }), manualRow({ dot: 'R27', ho: '', ten: '' }));
  setCell(3, 'Kênh', 'tay');
  const n = ctx.assignMissingCodes();
  assert.strictEqual(n, 2, 'two open intakes: a blank Đợt cannot be decided; a blank name gets nothing');
  assert.deepStrictEqual(lastCodes(4), ['S28-001', 'R27-002', '', '']);
  assert.strictEqual(cellAt(3, 'Kênh'), 'tay', 'an existing channel is kept');
  assert.strictEqual(cellAt(4, 'Kênh'), 'zalo');
  assert.ok(ui.alerts.length >= 1, 'tells staff what happened');

  main.data.length = 1;
  assert.strictEqual(ctx.assignMissingCodes(), 0, 'empty sheet');
}

// Trạng thái trigger: every row is decided on a fresh read under its own lock, and one failing row never stops the rows after it.
{
  // n registrations with an amount each, on rows 2..n+1, and no mail or lock counted yet.
  const fresh = (n) => {
    reset();
    ctx.setupLedger();
    for (let i = 0; i < n; i++) post({ ...FORM, emailcontact: 'p' + i + '@example.com' });
    for (let i = 0; i < n; i++) setCell(i + 2, 'Số tiền phải đóng', '6700000');
    mail.calls.length = 0;
    lock.waits = 0;
  };
  const sentTo = () => mail.calls.map((m) => m.to);
  const hookRange = (hook) => {
    const main = sheets['Đăng ký'];
    const real = main.getRange;
    main.getRange = (row, col, rows, cols) => hook(real(row, col, rows, cols), row, col, rows, cols);
    return () => { main.getRange = real; };
  };

  // A row cancelled while earlier rows are still being mailed gets nothing.
  fresh(3);
  const realSend = ctx.MailApp.sendEmail;
  ctx.MailApp.sendEmail = (opts) => { realSend(opts); if (opts.to === 'p0@example.com') setCell(3, 'Trạng thái', 'Hủy'); };
  edit(2, 'Chờ CK', 3);
  ctx.MailApp.sendEmail = realSend;
  assert.deepStrictEqual(sentTo(), ['p0@example.com', 'p2@example.com'], 'row 3 was cancelled before its turn');
  assert.strictEqual(cellAt(3, 'Email CK đã gửi'), '');
  assert.deepStrictEqual(plain(journalRows().filter((j) => j[2] === 'R27-002').slice(-1)[0].slice(3, 5)), ['đổi trạng thái', 'Hủy']);

  // One lock per row, each released before the next row.
  fresh(3);
  edit(2, 'Chờ CK', 3);
  assert.strictEqual(lock.waits, 3, 'a registration waits for one row, not for the whole paste');
  assert.strictEqual(lock.held, 0, 'every lock released');

  // A row that never gets the lock is flagged for staff, the rows around it are handled, and the resend menu finishes it.
  fresh(3);
  lock.failAt = 2;
  assert.doesNotThrow(() => edit(2, 'Chờ CK', 3));
  lock.failAt = 0;
  assert.deepStrictEqual(sentTo(), ['p0@example.com', 'p2@example.com']);
  assert.strictEqual(bgAt(3, 'Trạng thái'), '#f8d7da');
  assert.ok(noteAt(3, 'Trạng thái').includes('Gửi lại email CK'), 'the note points staff to the resend menu');
  assert.ok(!journalRows().some((j) => j[2] === 'R27-002' && j[3] === 'đổi trạng thái'), 'nothing is recorded for a row that was not processed');
  selectRows(3, 1);
  ctx.resendPaymentEmail();
  assert.deepStrictEqual(sentTo().slice(-1), ['p1@example.com']);
  assert.strictEqual(noteAt(3, 'Trạng thái'), '', 'the flag is cleared once the row is handled');

  // A row that cannot be read does not stop the rows after it, and staff see why.
  fresh(3);
  let restore = hookRange((range, row, col, rows, cols) => {
    if (row === 3 && cols === ctx.HEADERS.length) throw new Error('Service error: Spreadsheets');
    return range;
  });
  assert.doesNotThrow(() => edit(2, 'Chờ CK', 3));
  restore();
  assert.deepStrictEqual(sentTo(), ['p0@example.com', 'p2@example.com']);
  assert.ok(noteAt(3, 'Trạng thái').includes('Service error: Spreadsheets'));
  assert.deepStrictEqual(plain(journalRows().filter((j) => j[3] === 'lỗi email').map((j) => j[4])), ['email CK: Service error: Spreadsheets']);

  // Same when flagging the row is what throws.
  fresh(3);
  setCell(3, 'Số tiền phải đóng', '');
  restore = hookRange((range, row, col) => {
    if (row === 3 && col === colOf('Số tiền phải đóng')) range.setNote = () => { throw new Error('quota'); };
    return range;
  });
  assert.doesNotThrow(() => edit(2, 'Chờ CK', 3));
  restore();
  assert.deepStrictEqual(sentTo(), ['p0@example.com', 'p2@example.com']);
  assert.ok(noteAt(3, 'Trạng thái').includes('quota'));
  assert.deepStrictEqual(plain(journalRows().filter((j) => j[3] === 'lỗi email').map((j) => [j[2], j[4]])), [['R27-002', 'email CK: quota']]);

  // After a successful send the sent cell is written first: a journal that fails changes nothing.
  fresh(1);
  sheets['Nhật ký'].getRange = () => { throw new Error('boom'); };
  edit(2, 'Chờ CK');
  assert.ok(cellAt(2, 'Email CK đã gửi'), 'stamped although the journal failed');
  edit(2, 'Chờ CK');
  assert.deepStrictEqual(sentTo(), ['p0@example.com'], 'a second Chờ CK sends nothing');

  // If the stamp itself fails the email is already out: say so, so nobody sends it twice.
  fresh(1);
  restore = hookRange((range, row, col) => {
    if (col === colOf('Email CK đã gửi')) range.setNumberFormat = () => { throw new Error('quota'); };
    return range;
  });
  assert.doesNotThrow(() => edit(2, 'Chờ CK'));
  restore();
  assert.deepStrictEqual(sentTo(), ['p0@example.com']);
  assert.ok(noteAt(2, 'Trạng thái').includes('Email đã gửi nhưng chưa ghi được ngày gửi'));
  assert.deepStrictEqual(plain(journalRows().filter((j) => j[3] === 'lỗi email').map((j) => j[4])), ['email CK: Email đã gửi nhưng chưa ghi được ngày gửi: quota']);
}

// assignMissingCodes: the number of sheet writes does not grow with the number of legacy rows, and it holds the lock once.
{
  const run = (n) => {
    reset();
    ctx.setupLedger();
    const main = sheets['Đăng ký'];
    for (let i = 0; i < n; i++) main.data.push(manualRow(i === 1 ? { code: 'R27-009', dot: 'R27' } : {}));
    setCell(3, 'Kênh', 'tay');
    let writes = 0;
    const real = main.getRange;
    main.getRange = (...args) => {
      const range = real(...args);
      ['setValue', 'setValues'].forEach((m) => { const f = range[m]; range[m] = (...x) => { writes++; return f(...x); }; });
      return range;
    };
    lock.waits = 0;
    const done = ctx.assignMissingCodes();
    return { done, writes, waits: lock.waits, codes: main.data.slice(1).map((r) => r[colOf('Mã học viên') - 1]) };
  };
  const few = run(4);
  const many = run(60);
  assert.deepStrictEqual([few.done, many.done], [3, 59]);
  assert.ok(many.writes <= 3, 'one write per column');
  assert.strictEqual(many.writes, few.writes, 'writes do not grow with the rows');
  assert.deepStrictEqual([few.waits, many.waits], [1, 1]);
  assert.strictEqual(new Set(many.codes).size, 60, 'no duplicate codes');
  assert.deepStrictEqual([many.codes[0], many.codes[1], many.codes[59]], ['R27-010', 'R27-009', 'R27-068']);
  assert.deepStrictEqual([cellAt(3, 'Kênh'), cellAt(3, 'Đợt'), cellAt(2, 'Kênh'), cellAt(2, 'Đợt')], ['tay', 'R27', 'zalo', 'R27'], 'values the rows already had are kept');
}

// ledgerMenu_ adds the Sổ học viên menu, and onOpen in Sync.gs calls it after the Trợ lý AI menu.
{
  const calls = [];
  const menu = { addItem(label, fn) { calls.push([label, fn]); return menu; }, addToUi() { calls.push('addToUi'); return menu; } };
  ctx.ledgerMenu_({ createMenu(name) { calls.push(name); return menu; } });
  assert.deepStrictEqual(calls, ['Sổ học viên', ['Cấp mã cho dòng chưa có mã', 'assignMissingCodes'], ['Gửi lại email CK (dòng đang chọn)', 'resendPaymentEmail'],
    ['Bật gửi email tự động', 'installLedgerTrigger'], ['Cài đặt Sổ học viên', 'setupLedger'], 'addToUi']);
  calls.filter(Array.isArray).forEach(([, fn]) => assert.strictEqual(typeof ctx[fn], 'function', fn + ' exists'));
  assert.strictEqual(typeof ctx.onLedgerEdit, 'function');

  const seen = [];
  const uiApi = { createMenu(name) { seen.push(name); const m = { addItem() { return m; }, addToUi() { return m; } }; return m; } };
  const syncCtx = vm.createContext({ SpreadsheetApp: { getUi: () => uiApi }, ledgerMenu_: (given) => seen.push(given === uiApi ? 'ledger' : 'wrong ui') });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'Sync.gs'), 'utf8'), syncCtx);
  syncCtx.onOpen();
  assert.deepStrictEqual(seen, ['Trợ lý AI', 'ledger']);
}

// BotApi.gs: the keyed feed the chat bot polls for new registrations and payments.
{
  reset();
  ctx.setupLedger();
  assert.deepStrictEqual(post(FORM), { ok: true });
  assert.deepStrictEqual(post({ ...FORM, emailcontact: 'b@example.com', ten: 'Bình' }), { ok: true });
  assert.deepStrictEqual(lastCodes(2), ['R27-001', 'R27-002']);
  setCell(3, 'Số tiền phải đóng', '6.700.000');
  edit(3, 'Chờ CK');
  edit(3, 'Đã đóng');
  const lastJournalId = () => Number(sheets['Nhật ký'].data[sheets['Nhật ký'].getLastRow() - 1][0]);

  props.BOT_KEY = 'k'.repeat(43);
  assert.deepStrictEqual(post({ action: 'feed', key: 'wrong', after: 0 }), { ok: false, error: 'unauthorized' });
  delete props.BOT_KEY;
  assert.deepStrictEqual(post({ action: 'feed', key: '', after: 0 }), { ok: false, error: 'unauthorized' });
  assert.deepStrictEqual(post({ action: 'feed', after: 0 }), { ok: false, error: 'unauthorized' });
  props.BOT_KEY = 'k'.repeat(43);
  const feed = (after) => post({ action: 'feed', key: props.BOT_KEY, after });

  const locksBefore = lock.waits;
  const first = feed(null);
  assert.deepStrictEqual(first.events, [], 'no cursor yet: nothing is replayed');
  assert.strictEqual(first.last, lastJournalId());
  assert.strictEqual(lock.waits, locksBefore, 'feed never takes the registration lock');

  const all = feed(0);
  assert.deepStrictEqual(all.events[0], { id: 1, time: all.events[0].time, type: 'registered', code: 'R27-001', dot: 'R27',
    package: 'Gói 1', name: 'Nguyễn Văn An', phone: '0909123456', channel: 'facebook' });
  assert.ok(all.events.every((e) => e.type === 'registered' || e.type === 'paid'), 'mail and error rows are not events');
  assert.deepStrictEqual(all.events.filter((e) => e.type === 'paid').map((e) => e.code), ['R27-002']);
  const paid = all.events.filter((e) => e.type === 'paid')[0];
  assert.deepStrictEqual(paid, { id: paid.id, time: paid.time, type: 'paid', code: 'R27-002', name: 'Nguyễn Văn Bình' });
  assert.strictEqual(all.last, lastJournalId());
  assert.ok(journalRows().some((j) => j[3] === 'đổi trạng thái' && j[4] === 'Chờ CK'), 'a status change other than Đã đóng exists and is skipped');

  sheets['Đăng ký'].data.splice(1, sheets['Đăng ký'].data.length - 1, ...sheets['Đăng ký'].data.slice(1).reverse());
  assert.strictEqual(feed(0).events[0].name, 'Nguyễn Văn An', 'staff sorting rows does not change names');

  for (let i = 0; i < 60; i++) ctx.journal_('R27-001', 'đăng ký', 'Gói 1');
  const page1 = feed(all.last);
  assert.strictEqual(page1.events.length, 50);
  assert.strictEqual(page1.last, page1.events[49].id);
  const page2 = feed(page1.last);
  assert.strictEqual(page2.events.length, 10);
  assert.strictEqual(page2.last, lastJournalId());
  assert.deepStrictEqual(post({ action: 'nope', key: props.BOT_KEY }), { ok: false, error: 'bad-request' });
}

// BotApi.gs: the key, the cursor, and what the feed refuses to do.
{
  reset();
  ctx.setupLedger();
  post(FORM);
  const high = journalRows().length;
  const call = (body) => post({ action: 'feed', ...body });

  props.BOT_KEY = 'k'.repeat(43);
  [{ key: 'k'.repeat(42) }, { key: 'k'.repeat(44) }, { key: 0 }, { key: ['k'.repeat(43)] }, { key: null }, {}]
    .forEach((body) => assert.deepStrictEqual(call({ ...body, after: 0 }), { ok: false, error: 'unauthorized' }, JSON.stringify(body)));
  assert.deepStrictEqual(post({ action: 'nope', key: 'wrong' }), { ok: false, error: 'unauthorized' }, 'the key is checked before the action');
  props.BOT_KEY = '';
  [{ key: '' }, { key: 'x' }, {}].forEach((body) => assert.deepStrictEqual(call({ ...body, after: 0 }), { ok: false, error: 'unauthorized' }, 'empty BOT_KEY refuses all'));
  const refused = ctx.doPost({ postData: { contents: JSON.stringify({ action: 'feed', key: 'guess-123', after: 0 }) } }).getContent();
  assert.ok(!refused.includes('guess-123') && !refused.includes('R27'), 'a refusal echoes neither the key nor learner data');

  props.BOT_KEY = 'k'.repeat(43);
  const feed = (body) => call({ key: props.BOT_KEY, ...body });
  // Only a JSON number from 0 up is a cursor: null would read as 0 and replay the whole journal.
  [{}, { after: null }, { after: '0' }, { after: '1' }, { after: -1 }, { after: true }, { after: [0] }, { after: {} }]
    .forEach((body) => assert.deepStrictEqual(feed(body), { ok: true, last: high, events: [] }, JSON.stringify(body)));
  assert.strictEqual(feed({ after: 0 }).events.length, 1);
  assert.deepStrictEqual(feed({ after: high + 5 }), { ok: true, last: high, events: [] }, 'a cursor past the end comes back to the real last Id');

  // Ids may be text, and 10 is after 9.
  const t = '02/10/2026 10:00:00';
  sheets['Nhật ký'].data.push(['9', t, 'R27-001', 'đăng ký', 'Gói 1'], ['10', t, 'R27-001', 'đăng ký', 'Gói 1']);
  assert.deepStrictEqual(feed({ after: 2 }).events.map((e) => e.id), [9, 10]);
  assert.deepStrictEqual([feed({ after: 9 }).events.map((e) => e.id), feed({ after: 9 }).last], [[10], 10]);
  // Staff sorting the tab must not reorder or skip events.
  sheets['Nhật ký'].data.splice(1, sheets['Nhật ký'].data.length - 1, ...sheets['Nhật ký'].data.slice(1).reverse());
  assert.deepStrictEqual(feed({ after: 2 }).events.map((e) => e.id), [9, 10]);
  assert.deepStrictEqual(feed({ after: 0 }).events.map((e) => e.id), [1, 9, 10]);
  sheets['Nhật ký'].data.splice(1, sheets['Nhật ký'].data.length - 1, ...sheets['Nhật ký'].data.slice(1).reverse());
  sheets['Nhật ký'].data.pop();
  sheets['Nhật ký'].data.pop();

  // Read-only: no tab, row, mail or lock changes.
  const snapshot = () => JSON.stringify(Object.keys(sheets).map((name) => [name, sheets[name].data]));
  const before = [snapshot(), mail.calls.length, lock.waits];
  feed({ after: 0 });
  feed({});
  assert.deepStrictEqual([snapshot(), mail.calls.length, lock.waits], before);

  // A failure inside answers with a bare 'server'.
  const realRange = sheets['Nhật ký'].getRange;
  sheets['Nhật ký'].getRange = () => { throw new Error('quota for R27-001'); };
  const broken = ctx.doPost({ postData: { contents: JSON.stringify({ action: 'feed', key: props.BOT_KEY, after: 0 }) } }).getContent();
  sheets['Nhật ký'].getRange = realRange;
  assert.deepStrictEqual(JSON.parse(broken), { ok: false, error: 'server' });
  assert.ok(!broken.includes('R27-001'));
}

// BotApi.gs: a journal that is missing or empty, and events whose learner row is gone.
{
  reset();
  props.BOT_KEY = 'k'.repeat(43);
  const feed = (after) => post({ action: 'feed', key: props.BOT_KEY, after });
  assert.deepStrictEqual(feed(0), { ok: true, last: 0, events: [] }, 'no journal tab');
  assert.deepStrictEqual(Object.keys(sheets), [], 'the feed creates no tab');
  ctx.setupLedger();
  assert.deepStrictEqual(feed(0), { ok: true, last: 0, events: [] }, 'header-only journal');
  assert.deepStrictEqual(feed(null), { ok: true, last: 0, events: [] });

  post(FORM);
  post({ ...FORM, emailcontact: 'b@example.com', ten: 'Bình' });
  sheets['Đăng ký'].data.splice(1, 1);                   // R27-001 deleted by staff
  ctx.journal_('NOPE-9', 'đổi trạng thái', 'Đã đóng');
  const high = journalRows().length;
  const out = feed(0);
  assert.deepStrictEqual(out.events.map((e) => [e.type, e.code]), [['registered', 'R27-002']], 'rows without a learner are omitted, not thrown');
  assert.strictEqual(out.last, high, 'and they still move the cursor');

  // Omitted events do not count toward the page of 50.
  for (let i = 0; i < 55; i++) ctx.journal_('ZZ-001', 'đăng ký', 'Gói 1');
  ctx.journal_('R27-002', 'đăng ký', 'Gói 2');
  const big = feed(high);
  assert.deepStrictEqual([big.events.length, big.events[0].code, big.last], [1, 'R27-002', high + 56]);

  // One read of the registration tab per response, however many events.
  for (let i = 0; i < 60; i++) ctx.journal_('R27-002', 'đăng ký', 'Gói 2');
  const main = sheets['Đăng ký'];
  let reads = 0;
  const realRange = main.getRange;
  main.getRange = (...args) => { reads++; return realRange(...args); };
  assert.strictEqual(feed(0).events.length, 50);
  main.getRange = realRange;
  assert.strictEqual(reads, 1);

  delete sheets['Đăng ký'];
  assert.deepStrictEqual(feed(0).events, [], 'no registration tab: nothing to join');
  assert.ok(!sheets['Đăng ký'], 'and the feed does not create it');
}

// Ledger.gs: a journal staff sorted newest-first still numbers the next event from the highest Id, and the bot feed returns it.
{
  reset();
  ctx.setupLedger();
  props.BOT_KEY = 'k'.repeat(43);
  const feed = (after) => post({ action: 'feed', key: props.BOT_KEY, after });
  assert.deepStrictEqual(post(FORM), { ok: true });
  assert.deepStrictEqual(post({ ...FORM, emailcontact: 'b@example.com', ten: 'Bình' }), { ok: true });
  const journal = sheets['Nhật ký'];
  const cursor = feed(null).last;
  journal.data.splice(1, journal.data.length - 1, ...journal.data.slice(1).reverse());
  assert.strictEqual(Number(journal.data[journal.getLastRow() - 1][0]), 1, 'sorted newest-first: the last row holds Id 1');

  assert.strictEqual(ctx.journal_('R27-001', 'đổi trạng thái', 'Đã đóng'), cursor + 1, 'next Id is the highest plus one, not the last row plus one');
  assert.strictEqual(ctx.journal_('R27-002', 'đăng ký', 'Gói 1'), cursor + 2);
  const ids = journal.data.slice(1).map((r) => Number(r[0]));
  assert.strictEqual(new Set(ids).size, ids.length, 'no duplicate Id');
  assert.strictEqual(Math.max(...ids), cursor + 2);

  const out = feed(cursor);
  assert.deepStrictEqual(out.events.map((e) => [e.id, e.type, e.code]), [[cursor + 1, 'paid', 'R27-001'], [cursor + 2, 'registered', 'R27-002']]);
  assert.strictEqual(out.last, cursor + 2);
}

// installLedgerTrigger: a trigger runs and mails as the account that created it, so only the Sheet's owner may add it.
{
  reset();
  sheetOwner.email = 'staff@example.com';
  ctx.installLedgerTrigger();
  assert.strictEqual(triggers.length, 0, 'an editor who is not the owner creates no trigger');
  assert.deepStrictEqual(plain(ui.alerts), [['Chỉ chủ Sheet bật được gửi email tự động.']]);

  sheetOwner.email = OWNER;
  ctx.installLedgerTrigger();
  ctx.installLedgerTrigger();
  assert.deepStrictEqual(plain(triggers), [{ handler: 'onLedgerEdit' }], 'the owner creates it once');
  assert.match(ui.alerts[1][0], /Đã bật/);
  assert.match(ui.alerts[2][0], /đã bật từ trước/);

  // No owner (shared drive), an owner the script cannot read, or a failing lookup: no way to tell, so it proceeds as before.
  [[null, false], ['', false], [OWNER, true]].forEach(([email, fails]) => {
    reset();
    sheetOwner.email = email;
    sheetOwner.fails = fails;
    ctx.installLedgerTrigger();
    assert.strictEqual(triggers.length, 1, 'owner ' + JSON.stringify(email) + (fails ? ' (lookup throws)' : ''));
    assert.match(ui.alerts[0][0], /Đã bật/);
  });
}

// Kênh: a page without utm_source reads trực tiếp, and a row with no page keeps an empty channel in doPost and in assignMissingCodes.
{
  reset();
  ctx.setupLedger();
  assert.deepStrictEqual(post({ ...FORM, page: 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/' }), { ok: true });
  assert.deepStrictEqual(post({ ...FORM, emailcontact: 'b@example.com', page: '' }), { ok: true });
  assert.deepStrictEqual([cellAt(2, 'Kênh'), cellAt(3, 'Kênh')], ['trực tiếp', '']);

  const main = sheets['Đăng ký'];
  main.data.push(manualRow({ page: 'https://vienphuongnam.com.vn/' }), manualRow({ page: '' }), manualRow({ page: 'https://vienphuongnam.com.vn/?utm_source=Zalo' }));
  assert.strictEqual(ctx.assignMissingCodes(), 3);
  assert.deepStrictEqual([cellAt(4, 'Kênh'), cellAt(5, 'Kênh'), cellAt(6, 'Kênh')], ['trực tiếp', '', 'zalo']);
  assert.deepStrictEqual(lastCodes(3), ['R27-003', 'R27-004', 'R27-005'], 'the row without a page still gets its code');
}

// The short consult form (Leads.gs): its own tab, a mail to the people on duty, and the ad fields on every form.
{
  reset();
  const UTM = { utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'ptdlr_012027', utm_content: 'k201', utm_term: '', fbclid: 'fb.1' };
  const LEAD = { form_type: 'tu_van', ho_ten: 'TEST QA', so_dien_thoai: '0909 123 456', huong_quan_tam: 'Khóa 2', hinh_thuc_hoc: 'Trực tuyến qua Zoom',
    agreement: true, page: 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/?utm_content=k201', elapsed: 12, ...UTM };
  assert.deepStrictEqual(post({ ...LEAD, elapsed: 1 }), { ok: false, error: 'too-fast' });
  assert.deepStrictEqual(post({ ...LEAD, agreement: false }), { ok: false, error: 'no-consent' });
  assert.deepStrictEqual(post({ ...LEAD, hinh_thuc_hoc: '' }), { ok: false, error: 'missing-hinh_thuc_hoc' });
  assert.deepStrictEqual(post({ ...LEAD, so_dien_thoai: '12345' }), { ok: false, error: 'bad-phone' });
  assert.deepStrictEqual(post({ ...LEAD, website: 'spam' }), { ok: true });
  assert.ok(!sheets['Lead web'], 'rejected and honeypot posts write nothing');
  assert.deepStrictEqual(post(LEAD), { ok: true });
  assert.deepStrictEqual(post(LEAD), { ok: true, duplicate: true });
  assert.deepStrictEqual(post({ ...LEAD, so_dien_thoai: '0909-123456' }), { ok: true, duplicate: true }, 'the same number spaced differently is one lead');
  const tab = sheets['Lead web'].data;
  assert.deepStrictEqual(plain(tab[0]), plain(ctx.LEAD_HEADERS));
  const row = Object.fromEntries(ctx.LEAD_HEADERS.map((h, i) => [h, tab[1][i]]));
  assert.deepStrictEqual([tab.length, row['Loại form'], row['Họ và tên'], row['Hình thức học'], row.utm_content, row.fbclid, row['Trạng thái']],
    [2, 'Tư vấn', 'TEST QA', 'Trực tuyến qua Zoom', 'k201', 'fb.1', 'Mới']);
  assert.ok(!sheets['Đăng ký'], 'the consult form never writes the registration tab');
  assert.strictEqual(mail.calls.length, 1);
  assert.strictEqual(mail.calls[0].to, 'tuyensinh@vienphuongnam.com.vn,vanphong@vienphuongnam.com.vn,quantrihethong@vienphuongnam.com.vn');
  assert.match(mail.calls[0].subject, /TEST QA – 0909 123 456 \(k201\)/);

  // A failed mail keeps the row and says so on it, and the learner still gets ok.
  mail.failFor.add(mail.calls[0].to);
  assert.deepStrictEqual(post({ ...LEAD, so_dien_thoai: '0909000111' }), { ok: true });
  assert.strictEqual(sheets['Lead web'].data[2][ctx.LEAD_HEADERS.length - 1], 'Mới (chưa gửi được email báo)');

  // The full registration adds its own Lead web row with the ad fields; the Đăng ký row is written as before.
  reset();
  assert.deepStrictEqual(post({ ...FORM, form_type: 'dang_ky', ...UTM }), { ok: true });
  const reg = Object.fromEntries(ctx.LEAD_HEADERS.map((h, i) => [h, sheets['Lead web'].data[1][i]]));
  assert.deepStrictEqual([reg['Loại form'], reg['Họ và tên'], reg['Số điện thoại'], reg['Hướng quan tâm'], reg.utm_content],
    ['Đăng ký', 'Nguyễn Văn An', '0909123456', 'Gói 1', 'k201']);
  assert.strictEqual(sheets['Đăng ký'].data.length, 2);
}

// LeadTabs.gs: the staff tabs "Theo dõi lead" and "Học viên - Học phí" get the input columns only.
{
  const TRACK = 'Theo dõi lead';
  const FEES = 'Học viên - Học phí';
  // Like the real tabs: every row already has formulas (D, E, Q, T) and an unticked checkbox (N), so getLastRow() is useless.
  const prefillTrack = (rows = 20) => {
    const t = fakeSheet(TRACK);
    t.data.push(['Thời gian nhận', 'Họ và tên', 'Số điện thoại', 'SĐT chuẩn', 'Trùng', 'Kênh', 'Nguồn', 'Mã nhóm', 'Mã QC', 'Hướng quan tâm', 'Hình thức học', 'Hợp lệ', 'Trạng thái', 'Đã từng', 'Phụ trách', 'Liên hệ', 'Phút', 'Gói', 'Ghi chú', 'Số']);
    for (let i = 0; i < rows; i++) t.data.push(['', '', '', '=D', '=E', '', '', '', '', '', '', '', '', 'FALSE', '', '', '=Q', '', '', '=T']);
    return t;
  };
  const prefillFees = (rows = 20) => {
    const t = fakeSheet(FEES);
    t.data.push(['Mã đăng ký', 'Số điện thoại', 'Họ và tên', 'Gói', 'Mã nhóm', 'Ưu đãi', 'G', 'H', 'I', 'Đã thu', 'Ngày đủ', 'Đã xác minh', 'M', 'N', 'Ghi chú', 'P']);
    for (let i = 0; i < rows; i++) t.data.push(['', '', '', '', '', '', '=G', '=H', '=I', '', '', 'FALSE', '=M', '=N', '', '=P']);
    return t;
  };
  const META = { utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'ptdlr_012027', utm_content: 'k1k301', utm_term: '', fbclid: '' };
  const LEAD = { form_type: 'tu_van', ho_ten: 'TEST QA', so_dien_thoai: '0912 114 511', huong_quan_tam: 'Khóa 1 + Khóa 3', hinh_thuc_hoc: 'Trực tiếp tại Viện',
    agreement: true, page: 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/', elapsed: 12, ...META };
  const row = (tab, n) => sheets[tab].data[n - 1];

  // The mappings.
  assert.deepStrictEqual(['+84 912 114 511', '912114511', '0912-114-511', ''].map((v) => ctx.normalizePhone_(v)), ['0912114511', '0912114511', '0912114511', '']);
  assert.deepStrictEqual(['k1k301', 'K201', 'gen02', 'k1', ''].map((v) => ctx.leadGroup_(v)), ['K1K3', 'K2', 'GEN', '', '']);
  assert.strictEqual(ctx.leadSource_(true, META), 'Quảng cáo Meta');
  assert.strictEqual(ctx.leadSource_(false, { utm_source: 'meta', utm_medium: 'messenger' }), 'Chưa rõ');
  assert.deepStrictEqual([ctx.leadChannel_(true), ctx.leadChannel_(false)], ['Web - form tư vấn', 'Web - form đăng ký']);
  assert.strictEqual(ctx.leadSource_(true, {}), 'Chưa rõ');
  assert.deepStrictEqual(['Email', 'Zalo', 'Hội nhóm Facebook', 'Website Viện Phương Nam', 'Người quen giới thiệu', 'Khác', ''].map((biet_qua) => ctx.leadSource_(false, { biet_qua })),
    ['Email/Zalo của Viện', 'Email/Zalo của Viện', 'Facebook tự nhiên', 'Website', 'Người quen giới thiệu', 'Khác', 'Chưa rõ']);
  assert.deepStrictEqual(['Gói 1', 'Gói 2', 'Gói 3', 'Gói 5', 'Gói 6'].map((package_id) => ctx.leadInterest_(false, { package_id })),
    ['Cả 3 khóa', '', 'Khóa 1 + Khóa 3', 'Khóa 2: Phân tích chi phí - hiệu quả trong y tế', '']);
  assert.strictEqual(ctx.leadInterest_(true, { huong_quan_tam: 'Khóa 2: Phân tích chi phí – hiệu quả trong y tế' }), 'Khóa 2: Phân tích chi phí - hiệu quả trong y tế', 'an en dash still maps');
  assert.strictEqual(ctx.leadInterest_(true, { huong_quan_tam: 'Gì đó' }), '');

  // A consult lead fills one row around the formulas and the checkbox, below a row staff already used.
  reset();
  prefillTrack();
  prefillFees();
  row(TRACK, 2)[1] = 'Lead Messenger nhập tay'; // an adviser's row with no time in A is still taken
  row(TRACK, 2)[2] = '0909000000';
  assert.deepStrictEqual(post(LEAD), { ok: true });
  assert.deepStrictEqual(plain(row(TRACK, 3)).slice(0, 20), [
    row(TRACK, 3)[0], 'TEST QA', '0912 114 511', '=D', '=E', 'Web - form tư vấn', 'Quảng cáo Meta', 'K1K3', 'k1k301', 'Khóa 1 + Khóa 3', 'Trực tiếp tại Viện',
    'Chờ kiểm', 'Mới', 'FALSE', '', '', '=Q', '', '', '=T']);
  assert.match(row(TRACK, 3)[0], /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
  assert.strictEqual(row(FEES, 2)[0], '', 'a consult lead adds no fee row');

  // The same number registers later: no second lead row, a note, Đã đăng ký, the package, and one fee row.
  cache.clear();
  assert.deepStrictEqual(post({ ...FORM, phoneregister: '84912114511', package_id: 'Gói 1', form_type: 'dang_ky', ...META }), { ok: true });
  assert.strictEqual(row(TRACK, 4)[0], '', 'no duplicate lead row');
  assert.match(row(TRACK, 3)[18], /^\d{2}\/\d{2} \d{2}:\d{2}: gửi thêm form đăng ký Gói 1$/);
  assert.deepStrictEqual([row(TRACK, 3)[12], row(TRACK, 3)[17]], ['Đã đăng ký', 'Gói 1']);
  const fee = plain(row(FEES, 2));
  assert.match(fee[0], /^DK-\d{6}-\d{6}$/);
  assert.deepStrictEqual(fee.slice(1, 14), ['84912114511', 'Nguyễn Văn An', 'Gói 1', '', '', '=G', '=H', '=I', '', '', 'FALSE', '=M', '=N']);
  assert.match(fee[14], /^Tự thêm từ form đăng ký \d{2}\/\d{2} \d{2}:\d{2}$/);
  assert.strictEqual(fee[15], '=P');

  // A repeat registration of the same package adds a note only; a paid lead keeps Đã thanh toán.
  cache.clear();
  row(TRACK, 3)[12] = 'Đã thanh toán';
  assert.deepStrictEqual(post({ ...FORM, phoneregister: '0912114511', package_id: 'Gói 1', form_type: 'dang_ky' }), { ok: true });
  assert.strictEqual(row(FEES, 3)[0], '', 'same phone and package: no second fee row');
  assert.strictEqual(row(TRACK, 3)[12], 'Đã thanh toán');
  assert.strictEqual(row(TRACK, 3)[18].split('\n').length, 2);

  // Someone new registers without UTM: source from "Biết đến qua", no group, interest from the package.
  cache.clear();
  assert.deepStrictEqual(post({ ...FORM, emailcontact: 'b@example.com', phoneregister: '0988777666', package_id: 'Gói 3', biet_qua: 'Website Viện Phương Nam', page: 'https://x/' }), { ok: true });
  assert.deepStrictEqual(plain(row(TRACK, 4)).slice(5, 13), ['Web - form đăng ký', 'Website', '', '', 'Khóa 1 + Khóa 3', '', 'Chờ kiểm', 'Đã đăng ký']);
  assert.strictEqual(row(FEES, 3)[3], 'Gói 3');

  // Visitor text that looks like a formula stays text.
  cache.clear();
  assert.deepStrictEqual(post({ ...LEAD, ho_ten: '=IMPORTXML("https://x","//a")', so_dien_thoai: '0966555444', utm_content: '+k201' }), { ok: true });
  const evil = sheets[TRACK].data.find((r) => r[2] === '0966555444');
  assert.deepStrictEqual([evil[1], evil[8]], ["'=IMPORTXML(\"https://x\",\"//a\")", "'+k201"]);
  assert.strictEqual(ctx.textCell_('An'), 'An');

  // Messenger: the form decides the channel; the source is Chưa rõ for the adviser to settle.
  cache.clear();
  assert.deepStrictEqual(post({ ...LEAD, so_dien_thoai: '0977111222', utm_medium: 'messenger', utm_content: '' }), { ok: true });
  assert.deepStrictEqual(plain(sheets[TRACK].data.find((r) => r[2] === '0977111222')).slice(5, 8), ['Web - form tư vấn', 'Chưa rõ', '']);

  // A full tab grows by one row copied from the last, and the copy's inputs are overwritten.
  reset();
  const full = prefillTrack(999);
  full.data.slice(1).forEach((r) => { r[0] = '01/11/2026 09:00:00'; r[2] = '0900000000'; });
  assert.deepStrictEqual(post(LEAD), { ok: true });
  assert.strictEqual(full.getMaxRows(), 1001);
  assert.deepStrictEqual([row(TRACK, 1001)[1], row(TRACK, 1001)[3], row(TRACK, 1001)[19]], ['TEST QA', '=D', '=T']);

  // A broken staff tab never costs the lead or the registration.
  reset();
  const broken = prefillTrack();
  broken.getMaxRows = () => { throw new Error('boom'); };
  assert.deepStrictEqual(post(LEAD), { ok: true });
  assert.strictEqual(sheets['Lead web'].data.length, 2);
  assert.deepStrictEqual(post({ ...FORM, form_type: 'dang_ky' }), { ok: true });
  assert.strictEqual(sheets['Đăng ký'].data.length, 2);

  // The one-off backfill takes the two named registrations, skips the test row, and is safe to run twice.
  reset();
  prefillTrack();
  prefillFees();
  ctx.setup();
  const reg = (stamp, pkg, ho, ten, phone, heard, page) => ctx.HEADERS.map((h) => ({ 'Thời gian': stamp, 'Mã gói': pkg, 'Họ và chữ lót': ho, 'Tên': ten,
    'Số điện thoại': phone, 'Biết đến qua': heard, 'Trang gửi': page })[h] ?? '');
  sheets['Đăng ký'].data.push(
    reg('07/11/2026 11:20:44', 'Gói 3', 'DANG THI', 'MY DUNG', '0917106920', 'Zalo', 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/'),
    reg('10/11/2026 08:39:05', 'Gói 1', 'ĐINH NGUYỄN THIÊN', 'KIM', '0903610025', 'Website Viện Phương Nam', 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/'),
    reg('12/11/2026 19:49:12', 'Gói 1', 'Thiên', 'Long', '0396291932', 'Email', 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/?utm_source=meta&utm_medium=messenger'));
  assert.deepStrictEqual(plain(ctx.backfillFromRegistrations()), ['07/11/2026 11:20:44', '10/11/2026 08:39:05']);
  const pick = (n) => [0, 1, 6, 9, 12].map((i) => row(TRACK, n)[i]);
  assert.deepStrictEqual([pick(2), pick(3), pick(4)], [
    ['07/11/2026 11:20:44', 'DANG THI MY DUNG', 'Email/Zalo của Viện', 'Khóa 1 + Khóa 3', 'Đã đăng ký'],
    ['10/11/2026 08:39:05', 'ĐINH NGUYỄN THIÊN KIM', 'Website', 'Cả 3 khóa', 'Đã đăng ký'],
    ['', '', '', '', '']]);
  assert.deepStrictEqual([row(FEES, 2)[0], row(FEES, 2)[3], row(FEES, 3)[0], row(FEES, 3)[3], row(FEES, 4)[0]], ['DK-261107-112044', 'Gói 3', 'DK-261110-083905', 'Gói 1', '']);
  assert.match(row(FEES, 2)[14], /07\/11 11:20$/);
  ctx.backfillFromRegistrations();
  assert.strictEqual(row(TRACK, 4)[0], '', 'running it twice adds no lead rows');
  assert.strictEqual(row(FEES, 4)[0], '', 'running it twice adds no fee rows');
}

// The learner's receipt (Leads.gs): sent while the ledger is not deployed, never twice, and a failure is marked on the Lead web row.
{
  const ledger = ctx.ledgerIntake_;
  reset();
  ctx.ledgerIntake_ = undefined; // the live project has no Ledger.gs
  try {
    assert.deepStrictEqual(post({ ...FORM, form_type: 'dang_ky', package: 'Gói 3 · Khóa 1 + Khóa 3 (06 ngày · 7.500.000 đồng)' }), { ok: true });
    const receipt = mail.calls.find((m) => m.to === FORM.emailcontact);
    assert.ok(receipt, 'the learner gets a receipt');
    assert.strictEqual(receipt.replyTo, 'vanphong@vienphuongnam.com.vn');
    assert.match(receipt.htmlBody, /Kính chào anh\/chị Nguyễn Văn An,/);
    assert.match(receipt.htmlBody, /Gói đã chọn: Gói 3 · Khóa 1 \+ Khóa 3</);
    assert.doesNotMatch(receipt.htmlBody, /7\.500\.000|2242 6789 –|Số tài khoản/, 'no price or bank details');
    assert.strictEqual(sheets['Lead web'].data[1][ctx.LEAD_HEADERS.length - 1], 'Mới');

    // A bounced address: the registration still succeeds and the Lead web row says so.
    cache.clear();
    mail.failFor.add('bad@example.com');
    assert.deepStrictEqual(post({ ...FORM, emailcontact: 'bad@example.com', form_type: 'dang_ky' }), { ok: true });
    assert.strictEqual(sheets['Lead web'].data[2][ctx.LEAD_HEADERS.length - 1], 'Mới (chưa gửi được email xác nhận)');
    assert.strictEqual(sheets['Đăng ký'].data.length, 3);
  } finally {
    ctx.ledgerIntake_ = ledger;
  }

  // With the ledger deployed it sends its own receipt, so Leads.gs sends none.
  reset();
  assert.deepStrictEqual(post({ ...FORM, form_type: 'dang_ky' }), { ok: true });
  assert.ok(!mail.calls.some((m) => m.to === FORM.emailcontact && /phiếu đăng ký – Phân tích định lượng với R/.test(m.subject)));
}

console.log('apps-script check: all passed');
