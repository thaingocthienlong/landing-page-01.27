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
const alerts = [];
const book = {
  getSheetByName: (name) => sheets[name] || null,
  insertSheet: (name) => (sheets[name] = fakeSheet()),
  getSpreadsheetTimeZone: () => 'Asia/Ho_Chi_Minh',
  toast() {}
};
const ctx = vm.createContext({
  SpreadsheetApp: { getActiveSpreadsheet: () => book, getUi: () => ({ alert: (m) => alerts.push(m) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getActiveUser: () => ({ getEmail: () => 'letan@vienphuongnam.com.vn' }) },
  Utilities: {
    formatDate(date, tz, fmt) {
      const p = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
        .formatToParts(date).forEach((x) => { p[x.type] = x.value; });
      if (fmt === 'H') return String(Number(p.hour));
      return fmt.replace('dd', p.day).replace('MM', p.month).replace('yyyy', p.year).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
    },
    parseDate(text, tz, fmt) {
      assert.strictEqual(tz + fmt, 'Asia/Ho_Chi_Minhdd/MM/yyyy HH:mm');
      const [, d, m, y, hm] = text.match(/^(\d\d)\/(\d\d)\/(\d{4}) (\d\d:\d\d)$/);
      return new Date(`${y}-${m}-${d}T${hm}:00+07:00`);
    }
  }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx);

const at = (iso) => new Date(iso + '+07:00');
const plain = (v) => JSON.parse(JSON.stringify(v));
const log = () => sheets['Lượt quét'].data.slice(1);

ctx.setup();
assert.strictEqual(sheets['Buổi'].data.length, 17, '16 sessions plus header');

assert.ok(sheets['Zoom'], 'setup makes the Zoom tab');

sheets['Học viên'].getRange(2, 1, 5, 10).setValues([
  ['R27-001', 'Nguyễn Thị', 'Hương', 'Gói 1', 'Trực tiếp', '12/03/1988', '0909 123 636', 'Huong@example.com', 'Bệnh viện A', ''],
  ['R27-002', 'Trần Thị', 'Hương', 'Gói 5', 'Trực tiếp', '04/07/1992', '0912 000 111', 'tran@example.com', 'Trường B', ''],
  ['R27-003', 'Lê Văn', 'Đức', '3', 'Trực tiếp', '01/01/1990', '0933 444 555', 'duc@example.com', 'Sở C', ''],
  ['R27-004', 'Phạm Minh', 'Tâm', 'Gói 4', 'Online', '05/05/1985', '0977 222 333', 'tam@example.com', 'Viện D', ''],
  ['', 'Võ', 'An', 'Gói 2', 'Trực tiếp', '', '', '', '', '']
]);
assert.strictEqual(ctx.makeQrLinks(), 0, 'no links before WEBAPP_URL is set');
ctx.WEBAPP_URL = 'https://script.google.com/a/macros/vienphuongnam.com.vn/s/X/exec';
assert.strictEqual(ctx.makeQrLinks(), 4, 'rows without a code get no link');
assert.deepStrictEqual(sheets['Học viên'].data.slice(1).map((r) => r[9]), [
  ctx.WEBAPP_URL + '?id=R27-001', ctx.WEBAPP_URL + '?id=R27-002', ctx.WEBAPP_URL + '?id=R27-003', ctx.WEBAPP_URL + '?id=R27-004', ''
]);

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

// Zoom: the participant report for K2 on 12/01, with the meeting header rows left in.
const days = { '08/01/2027': true, '12/01/2027': true };
const iso = (d) => d && d.toISOString();
assert.strictEqual(iso(ctx.zoomTime_('01/12/2027 12:10:00 AM', days)), '2027-01-11T17:10:00.000Z', 'mm/dd, 12 AM is midnight');
assert.strictEqual(iso(ctx.zoomTime_('12/01/2027 08:00', days)), '2027-01-12T01:00:00.000Z', 'dd/mm');
assert.strictEqual(iso(ctx.zoomTime_('2027-01-08 13:05:09', days)), '2027-01-08T06:05:00.000Z', 'ISO');
assert.strictEqual(ctx.zoomTime_('03/04/2027 08:00 AM', days), null, 'not a class day');
assert.strictEqual(ctx.zoomTime_('Duration (Minutes)', days), null);

sheets['Zoom'].data.push(
  ['Meeting ID', 'Topic', 'Start Time', 'End Time', 'User Email', 'Duration (Minutes)', 'Participants'],
  ['812 3456 7890', 'Chi phí - hiệu quả', '01/12/2027 08:00:12 AM', '01/12/2027 05:05:40 PM', 'zoom@vienphuongnam.com.vn', '545', '6'],
  [],
  ['Name (Original Name)', 'User Email', 'Join Time', 'Leave Time', 'Duration (Minutes)', 'Guest'],
  ['Phạm Minh Tâm', 'tam@example.com', '01/12/2027 08:21:05 AM', '01/12/2027 05:01:10 PM', '520', 'No'],
  ['R27-001 Nguyễn Thị Hương', '', '01/12/2027 08:40:00 AM', '01/12/2027 11:58:00 AM', '198', 'Yes'],
  ['Nguyễn Thị Hương', 'huong@example.com', '2027-01-12 13:35:00', '2027-01-12 17:00:00', '205', 'No'],
  ['Phạm Minh Tâm', 'tam@example.com', '01/12/2027 10:02:00 AM', '01/12/2027 10:30:00 AM', '28', 'No'],
  // Sheets in a dd/mm locale read "01/12/2027 08:15 AM" as 1 December.
  ['Trần Thị Hương', 'tran@example.com', at('2027-12-01T08:15:00'), at('2027-12-01T11:50:00'), '215', 'No'],
  ['Lê Văn Đức', 'duc@example.com', '01/12/2027 08:30:00 AM', '01/12/2027 04:00:00 PM', '450', 'No'],
  ['GS.TS. Nguyễn Văn Tuấn', 'tuan@example.edu.au', '01/12/2027 08:25:00 AM', '01/12/2027 05:00:00 PM', '515', 'No']
);
const before = log().length;
r = ctx.importZoom();
assert.deepStrictEqual([r.ok, r.again], [5, 1]);
assert.deepStrictEqual(plain(r.skipped), {
  '812 3456 7890': 'không khớp học viên',
  'Lê Văn Đức': 'gói không có K2',
  'GS.TS. Nguyễn Văn Tuấn': 'không khớp học viên'
});
assert.deepStrictEqual(log().slice(before).map((x) => [x[3], x[1], x[2], x[6]]), [
  ['R27-004', 'Sáng', '08:21:00', 'Zoom'],
  ['R27-004', 'Chiều', '13:30:00', 'Zoom'],
  ['R27-001', 'Sáng', '08:40:00', 'Zoom'],
  ['R27-001', 'Chiều', '13:35:00', 'Zoom'],
  ['R27-002', 'Sáng', '08:15:00', 'Zoom']
]);
assert.match(alerts[0], /^Đã ghi 5 lượt\. Đã có từ trước: 1\./);
assert.strictEqual(ctx.importZoom().ok, 0, 'a second import writes nothing');

console.log('attendance check: all passed');
