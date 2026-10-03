// Runs Code.gs against an in-memory spreadsheet: node apps-script/attendance/check.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

function fakeSheet() {
  const data = [];
  const width = () => data.reduce((m, r) => Math.max(m, (r || []).length), 0);
  const cell = (r, c) => ((data[r] || [])[c] ?? '');
  const range = (row, col, rows = 1, cols = 1) => {
    const self = new Proxy({}, {
      get: (_, key) => {
        if (key === 'setValues') return (values) => {
          values.forEach((v, i) => {
            data[row - 1 + i] = data[row - 1 + i] || [];
            v.forEach((x, j) => { data[row - 1 + i][col - 1 + j] = x; });
          });
          return self;
        };
        if (key === 'setValue') return (v) => self.setValues([[v]]);
        if (key === 'getValues') return () => Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => cell(row - 1 + i, col - 1 + j)));
        return () => self;
      }
    });
    return self;
  };
  return {
    data,
    getLastRow: () => data.length,
    getLastColumn: () => width(),
    getMaxRows: () => 1000,
    getRange: range,
    getDataRange: () => ({ getValues: () => data.map((_, r) => Array.from({ length: width() }, (_, c) => cell(r, c))) }),
    clearContents: () => { data.length = 0; },
    setFrozenRows() {},
    setFrozenColumns() {}
  };
}

const sheets = {};
const book = {
  getSheetByName: (name) => sheets[name] || null,
  insertSheet: (name) => (sheets[name] = fakeSheet()),
  toast() {}
};
const ctx = vm.createContext({
  SpreadsheetApp: { getActiveSpreadsheet: () => book },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getActiveUser: () => ({ getEmail: () => 'letan@vienphuongnam.com.vn' }) },
  Utilities: {
    formatDate(date, tz, fmt) {
      const p = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
        .formatToParts(date).forEach((x) => { p[x.type] = x.value; });
      if (fmt === 'H') return String(Number(p.hour));
      return fmt.replace('dd', p.day).replace('MM', p.month).replace('yyyy', p.year).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
    }
  }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx);

const at = (iso) => new Date(iso + '+07:00');
const plain = (v) => JSON.parse(JSON.stringify(v));
const log = () => sheets['Lượt quét'].data.slice(1);

ctx.setup();
assert.strictEqual(sheets['Buổi'].data.length, 17, '16 sessions plus header');

sheets['Học viên'].getRange(2, 1, 3, 10).setValues([
  ['', 'Nguyễn Thị', 'Hương', 'Gói 1', 'Trực tiếp', '12/03/1988', '0909 123 636', '', 'Bệnh viện A', ''],
  ['', 'Trần Thị', 'Hương', 'Gói 5', 'Trực tiếp', '04/07/1992', '0912 000 111', '', 'Trường B', ''],
  ['', 'Lê Văn', 'Đức', '3', 'Trực tiếp', '01/01/1990', '0933 444 555', '', 'Sở C', '']
]);
assert.strictEqual(ctx.assignIds(), 3);
assert.strictEqual(ctx.assignIds(), 0, 'second run keeps existing codes');
assert.deepStrictEqual(sheets['Học viên'].data.slice(1).map((r) => r[0]), ['R27-001', 'R27-002', 'R27-003']);

let r = ctx.checkIn_('r27-001', 'QR', at('2027-01-08T08:20:00'));
assert.strictEqual(r.kind, 'ok');
assert.strictEqual(r.time, '08:20');
assert.strictEqual(r.count, 1);
assert.deepStrictEqual(plain(r.session), { course: 'K1', name: 'Phân tích dữ liệu với R cơ bản', day: '08/01/2027', part: 'Sáng' });
assert.deepStrictEqual(log()[0], ['08/01/2027', 'Sáng', '08:20:00', 'R27-001', 'Nguyễn Thị Hương', 'K1', 'QR', 'letan@vienphuongnam.com.vn']);

r = ctx.checkIn_('R27-001', 'QR', at('2027-01-08T08:25:00'));
assert.strictEqual(r.kind, 'again');
assert.strictEqual(r.time, '08:20');
assert.strictEqual(log().length, 1, 'rescan writes nothing');

r = ctx.checkIn_('R27-002', 'QR', at('2027-01-08T08:26:00'));
assert.strictEqual(r.kind, 'wrong-course');
assert.deepStrictEqual(plain(r.learner.courses), ['K2']);
assert.strictEqual(r.count, 1, 'rejected scan still reports the session count');
assert.strictEqual(ctx.checkIn_('R27-999', 'QR', at('2027-01-08T08:27:00')).kind, 'unknown');
assert.strictEqual(ctx.checkIn_('R27-001', 'QR', at('2027-01-11T09:00:00')).kind, 'no-session', '11/01 is a rest day');
assert.strictEqual(log().length, 1, 'rejected scans write nothing');

assert.strictEqual(ctx.checkIn_('R27-003', 'QR', at('2027-01-08T08:31:00')).count, 2);
r = ctx.checkIn_('R27-001', 'QR', at('2027-01-08T13:40:00'));
assert.strictEqual(r.session.part, 'Chiều');
assert.strictEqual(r.count, 1, 'afternoon counts separately');
assert.strictEqual(ctx.checkIn_('R27-003', 'Tra tên', at('2027-01-09T08:40:00')).kind, 'ok');

const ids = (q) => plain(ctx.search(q)).map((x) => x.id);
assert.deepStrictEqual(ids('huong'), ['R27-001', 'R27-002']);
assert.deepStrictEqual(ids('HUONG nguyen'), ['R27-001'], 'words in any order');
assert.deepStrictEqual(ids('duc'), ['R27-003'], 'đ folds to d');
assert.deepStrictEqual(ids('636'), ['R27-001'], 'last digits of phone');
assert.deepStrictEqual(ids('h'), []);
assert.strictEqual(ctx.search('huong')[0].birth, '12/03/1988');

// A paper-list row typed in by hand, with Sheets having turned the day into a Date.
sheets['Lượt quét'].data.push([at('2027-01-10T00:00:00'), 'Sáng', '', 'R27-003', '', 'K1', 'Giấy', '']);
r = ctx.checkIn_('R27-003', 'QR', at('2027-01-10T08:50:00'));
assert.strictEqual(r.kind, 'again', 'paper row blocks a second scan');
assert.strictEqual(r.time, '');

ctx.buildSummary();
const summary = sheets['Tổng hợp'].data;
const head = summary[0];
const row = (id) => summary.find((x) => x[0] === id);
const col = (name) => head.indexOf(name);
assert.strictEqual(head.length, 3 + 16 + 3 + 1);
assert.strictEqual(head[3], 'K1\n08/01 Sáng');
assert.deepStrictEqual([row('R27-001')[col('K1')], row('R27-001')[col('K2')], row('R27-001')[col('K3')]], ['2/6', '0/4', '0/6']);
assert.deepStrictEqual([row('R27-002')[3], row('R27-002')[col('K1')], row('R27-002')[col('K2')]], ['·', '', '0/4']);
assert.deepStrictEqual([row('R27-003')[3], row('R27-003')[4], row('R27-003')[col('K1')], row('R27-003')[col('Tra tên')]], ['✓', '', '3/6', 1]);

console.log('attendance check: all passed');
