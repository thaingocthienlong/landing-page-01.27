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

  const range = (row, col, rows = 1, cols = 1) => {
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
    getMaxRows: () => Math.max(1000, data.length),
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

console.log('apps-script check: all passed');
