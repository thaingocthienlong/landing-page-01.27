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
        if (key === 'getDisplayValue') return () => String(cell(row - 1, col - 1));
        if (key === 'getValues') return () => Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => cell(row - 1 + i, col - 1 + j)));
        return () => self;
      }
    });
    return self;
  };
  const all = () => data.map((_, r) => Array.from({ length: width() }, (_, c) => cell(r, c)));
  return {
    data,
    getLastRow: () => data.length,
    getLastColumn: () => width(),
    getMaxRows: () => 1000,
    getRange: range,
    getDataRange: () => ({ getValues: all, getDisplayValues: () => all().map((r) => r.map(String)) }),
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
const grid = () => sheets['Điểm danh'].data;
const log = () => sheets['Lượt quét'].data.slice(1);
// What Gate Keeper does when it admits someone from the Zoom waiting room.
const gatekeeperWrites = (row, col, value) => { grid()[row - 1][col] = value; };

ctx.setup();
assert.strictEqual(grid()[0].length, 11 + 16, '11 learner columns, 16 sessions');
assert.deepStrictEqual(grid()[0].slice(10, 14), ['Link QR', '08/01/2027', '', '09/01/2027']);
assert.deepStrictEqual(grid()[1].slice(10, 14), ['', 'Sáng', 'Chiều', 'Sáng']);
ctx.setup();
assert.strictEqual(grid().length, 2, 'a second setup leaves the grid alone');

sheets['Điểm danh'].getRange(3, 1, 6, 11).setValues([
  ['R27-001', 'Nguyễn Thị', 'Hương', 'Gói 1', 'Trực tiếp', '12/03/1988', '0909 123 636', '', 'Bệnh viện A', '', ''],
  ['R27-002', 'Trần Thị', 'Hương', 'Gói 5', 'Online', '04/07/1992', '0912 000 111', '', 'Trường B', 'Zoom: Huong Tran', ''],
  ['r27-003', 'Lê Văn', 'Đức', '3', 'Trực tiếp', '01/01/1990', '0933 444 555', '', 'Sở C', '', ''],
  ['R27-004', 'Phạm Minh', 'Tâm', 'Gói 4', 'Online', '', '0977 222 333', '', '', '', ''],
  ['', 'Võ', 'An', 'Gói 2', 'Trực tiếp', '', '', '', '', '', ''],
  ['R27-005', 'Đỗ', 'Bình', '', 'Trực tiếp', '', '0988 000 999', '', '', '', '']
]);

const g = ctx.grid_();
assert.strictEqual(g.sessions.length, 16);
assert.deepStrictEqual(plain(g.sessions[0]), { col: 11, day: '08/01', part: 'Sáng', course: 'K1' });
assert.deepStrictEqual(plain(g.sessions[15]), { col: 26, day: '17/01', part: 'Chiều', course: 'K3' });
assert.deepStrictEqual(plain(g.rows.map((r) => r.id)), ['R27-001', 'R27-002', 'R27-003', 'R27-004', 'R27-005'], 'rows without a code are skipped');
assert.deepStrictEqual(plain(g.rows[2].courses), ['K1', 'K3']);
assert.strictEqual(ctx.dayOf_('8/1/2027'), '08/01');

assert.strictEqual(ctx.makeQrLinks(), 0, 'no links before WEBAPP_URL is set');
ctx.WEBAPP_URL = 'https://script.google.com/a/macros/vienphuongnam.com.vn/s/X/exec';
assert.strictEqual(ctx.makeQrLinks(), 5);
assert.deepStrictEqual(grid().slice(2).map((r) => r[10]), [
  ctx.WEBAPP_URL + '?id=R27-001', ctx.WEBAPP_URL + '?id=R27-002', ctx.WEBAPP_URL + '?id=R27-003', ctx.WEBAPP_URL + '?id=R27-004', '', ctx.WEBAPP_URL + '?id=R27-005'
]);

// 08/01 morning, K1. Gate Keeper has already let R27-005 in from Zoom.
gatekeeperWrites(8, 11, 'ONL');
assert.deepStrictEqual(plain(ctx.status_(at('2027-01-08T08:00:00')).count), { total: 1, offline: 0, online: 1 });

let r = ctx.checkIn_('r27-001', 'QR', at('2027-01-08T08:20:00'));
assert.strictEqual(r.kind, 'ok');
assert.strictEqual(r.time, '08:20');
assert.deepStrictEqual(plain(r.count), { total: 2, offline: 1, online: 1 });
assert.deepStrictEqual(plain(r.session), { course: 'K1', name: 'Phân tích dữ liệu với R cơ bản', day: '08/01/2027', part: 'Sáng', col: 11 });
assert.strictEqual(grid()[2][11], 'OFF', 'OFF lands in the learner row, morning column');
assert.deepStrictEqual(log()[0], ['08/01/2027', 'Sáng', '08:20:00', 'R27-001', 'Nguyễn Thị Hương', 'K1', 'QR', 'letan@vienphuongnam.com.vn']);

r = ctx.checkIn_('R27-001', 'QR', at('2027-01-08T08:25:00'));
assert.deepStrictEqual([r.kind, r.mark, r.time], ['again', 'OFF', '08:20']);
assert.strictEqual(log().length, 1, 'rescan writes nothing');

r = ctx.checkIn_('R27-002', 'QR', at('2027-01-08T08:26:00'));
assert.strictEqual(r.kind, 'wrong-course');
assert.deepStrictEqual(plain(r.learner.courses), ['K2']);
assert.strictEqual(r.count.total, 2, 'rejected scan still reports the session count');
assert.strictEqual(ctx.checkIn_('R27-005', 'QR', at('2027-01-08T08:27:00')).kind, 'wrong-course', 'no package, no check-in');
assert.strictEqual(ctx.checkIn_('R27-999', 'QR', at('2027-01-08T08:27:00')).kind, 'unknown');
assert.strictEqual(ctx.checkIn_('R27-001', 'QR', at('2027-01-11T09:00:00')).kind, 'no-session', '11/01 is a rest day');
assert.strictEqual(log().length, 1, 'rejected scans write nothing');

assert.strictEqual(ctx.checkIn_('R27-003', 'Tra tên', at('2027-01-08T08:31:00')).kind, 'ok');
r = ctx.checkIn_('R27-001', 'QR', at('2027-01-08T13:40:00'));
assert.deepStrictEqual([r.kind, r.session.part, r.count.total], ['ok', 'Chiều', 1]);
assert.strictEqual(grid()[2][12], 'OFF');

// 12/01 morning, K2: Gate Keeper admitted R27-002 from Zoom before the badge was scanned.
gatekeeperWrites(4, 17, 'ONL');
r = ctx.checkIn_('R27-002', 'QR', at('2027-01-12T08:40:00'));
assert.deepStrictEqual([r.kind, r.mark, r.time], ['again', 'ONL', '']);
assert.strictEqual(grid()[3][17], 'ONL', 'a Zoom mark is never overwritten');

// The 30-minute list for 09/01 morning: K1 learners plus the row with no package.
let m = ctx.missing_(at('2027-01-09T09:00:00'));
assert.deepStrictEqual(plain(m.people.map((p) => p.id)), ['R27-001', 'R27-003', 'R27-005']);
assert.deepStrictEqual(plain(m.people[0]), { id: 'R27-001', name: 'Nguyễn Thị Hương', format: 'Trực tiếp', phone: '0909 123 636' });
m = ctx.missing_(at('2027-01-08T09:00:00'));
assert.deepStrictEqual(plain([m.people.map((p) => p.id), m.count.total]), [[], 3], 'R27-005 came in by Zoom');
assert.deepStrictEqual(plain(ctx.missing_(at('2027-01-11T09:00:00'))), { session: null, count: null, people: [] });

// A trial day outside the course calendar: any learner on the grid can check in.
grid()[0][27] = '20/10/2026';
grid()[1][27] = 'Sáng';
r = ctx.checkIn_('R27-002', 'QR', at('2026-10-20T08:05:00'));
assert.deepStrictEqual([r.kind, r.session.course, r.session.col], ['ok', '', 27]);

const ids = (q) => plain(ctx.search(q)).map((x) => x.id);
assert.deepStrictEqual(ids('huong'), ['R27-001', 'R27-002']);
assert.deepStrictEqual(ids('HUONG nguyen'), ['R27-001'], 'words in any order');
assert.deepStrictEqual(ids('duc'), ['R27-003'], 'đ folds to d');
assert.deepStrictEqual(ids('636'), ['R27-001'], 'last digits of phone');
assert.deepStrictEqual(ids('h'), []);
assert.strictEqual(ctx.search('huong')[0].birth, '12/03/1988');

console.log('attendance check: all passed');
