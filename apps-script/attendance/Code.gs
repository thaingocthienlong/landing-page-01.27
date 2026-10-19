/**
 * Attendance for the R series (01/2027), sharing the "Điểm danh" tab with Zoom Meeting Gate Keeper:
 * one row per learner, one column per session (a date header with Sáng/Chiều under it).
 * Gate Keeper writes ONL when it admits someone from the Zoom waiting room; a badge QR opens this
 * web app with ?id=<code> and writes OFF. "Lượt quét" keeps the time, source and staff member of each OFF.
 *
 * Deploy as Web app with Execute as: Me, Who has access: Anyone within
 * vienphuongnam.com.vn, so learners scanning their own badge hit a sign-in wall.
 * Setup steps for staff are in README.md next to this file.
 */

var TZ = 'Asia/Ho_Chi_Minh';
// Paste the /exec URL after deploying; "Chuẩn bị danh sách" builds the QR links from it.
var WEBAPP_URL = '';
var SOURCE_QR = 'QR';
var SOURCE_NAME = 'Tra tên';
// Gate Keeper reads OFF as attending in person and keeps the same name out of Zoom for that session,
// and keeps KĐK ("không đăng ký", a session outside the learner's package) out of Zoom too.
var MARK_OFFLINE = 'OFF';
var MARK_ONLINE = 'ONL';
var MARK_NOT_ENROLLED = 'KĐK';

var COURSES = {
  K1: { name: 'Phân tích dữ liệu với R cơ bản', days: ['08/01/2027', '09/01/2027', '10/01/2027'] },
  K2: { name: 'Phân tích chi phí - hiệu quả trong y tế', days: ['12/01/2027', '13/01/2027'] },
  K3: { name: 'Phân tích dữ liệu chuỗi thời gian', days: ['15/01/2027', '16/01/2027', '17/01/2027'] }
};
var PACKAGES = { 1: ['K1', 'K2', 'K3'], 2: ['K1', 'K2'], 3: ['K1', 'K3'], 4: ['K2', 'K3'], 5: ['K2'], 6: ['K3'] };
var COURSE_BY_DAY = {};
Object.keys(COURSES).forEach(function (course) {
  COURSES[course].days.forEach(function (day) { COURSE_BY_DAY[day.slice(0, 5)] = course; });
});
var PARTS = { sang: 'Sáng', chieu: 'Chiều' };

// Họ và tên lót, Tên and Ghi chú are the headers Gate Keeper matches Zoom names against; it ignores the rest.
var GRID = {
  name: 'Điểm danh',
  headers: ['Mã học viên', 'Họ và tên lót', 'Tên', 'Gói', 'Hình thức', 'Ngày sinh', 'Số điện thoại', 'Địa chỉ email', 'Đơn vị/ Cơ quan công tác', 'Ghi chú', 'Link QR']
};
var LOG = { name: 'Lượt quét', headers: ['Ngày', 'Buổi', 'Giờ', 'Mã', 'Họ tên', 'Khóa', 'Nguồn', 'Người ghi'] };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Điểm danh')
    .addItem('Tạo các trang tính', 'setup')
    .addItem('Chuẩn bị danh sách', 'prepareRoster')
    .addToUi();
}

function setup() {
  var grid = sheet_(GRID);
  if (grid.getLastRow() === 0) {
    var head = GRID.headers.slice();
    var parts = GRID.headers.map(function () { return ''; });
    Object.keys(COURSES).forEach(function (course) {
      COURSES[course].days.forEach(function (day) {
        head.push(day, '');
        parts.push('Sáng', 'Chiều');
      });
    });
    // Text format keeps 08/01/2027 a label and stops codes and phone numbers from turning into numbers.
    grid.getRange(1, 1, grid.getMaxRows(), head.length).setNumberFormat('@');
    grid.getRange(1, 1, 2, head.length).setValues([head, parts]).setFontWeight('bold');
    grid.setFrozenRows(2);
    grid.setFrozenColumns(3);
  }
  var log = sheet_(LOG);
  if (log.getLastRow() === 0) {
    log.getRange(1, 1, 1, LOG.headers.length).setValues([LOG.headers]).setFontWeight('bold');
    log.setFrozenRows(1);
  }
  log.getRange(2, 1, log.getMaxRows() - 1, LOG.headers.length).setNumberFormat('@');
}

// Run before the course and after adding or changing learners, not during a session: Gate Keeper may be
// writing ONL into the same columns. Fills QR links and KĐK in sessions outside each learner's package.
function prepareRoster() {
  var g = grid_();
  if (g.head < 0) {
    toast_('Trang Điểm danh chưa có cột Mã học viên.');
    return { links: 0, marked: 0, cleared: 0 };
  }
  var body = g.values.slice(g.head + 1);
  var links = 0;
  if (WEBAPP_URL && g.cols.link >= 0) {
    var column = body.map(function (v) {
      var id = cell_(v, g.cols.code).toUpperCase();
      return [id ? WEBAPP_URL + '?id=' + encodeURIComponent(id) : cell_(v, g.cols.link)];
    });
    if (column.length) g.sheet.getRange(g.head + 2, g.cols.link + 1, column.length, 1).setValues(column);
    links = g.rows.length;
  }

  var mark = [];
  var clear = [];
  var unknown = 0;
  g.rows.forEach(function (r) {
    if (!r.courses.length) {
      unknown++;
      return;
    }
    g.sessions.forEach(function (s) {
      if (!s.course) return;
      var cell = cell_(r.marks, s.col);
      var due = r.courses.indexOf(s.course) >= 0;
      if (!due && !cell) mark.push(a1_(r.row, s.col));
      else if (due && cell && !isMark_(cell)) clear.push(a1_(r.row, s.col));
    });
  });
  if (mark.length) g.sheet.getRangeList(mark).setValue(MARK_NOT_ENROLLED);
  if (clear.length) g.sheet.getRangeList(clear).clearContent();

  var missing = body.filter(function (v) { return !cell_(v, g.cols.code) && nameOf_(v, g.cols); }).length;
  toast_([
    WEBAPP_URL ? 'Đã tạo ' + links + ' link QR.' : 'Chưa tạo link QR: điền WEBAPP_URL trong Code.gs.',
    'Đánh dấu KĐK ' + mark.length + ' ô' + (clear.length ? ', bỏ KĐK ' + clear.length + ' ô' : '') + '.',
    missing ? missing + ' dòng chưa có Mã học viên: chép từ Sổ học viên.' : '',
    unknown ? unknown + ' học viên chưa rõ gói nên chưa đánh dấu KĐK.' : ''
  ].filter(String).join(' '));
  return { links: links, marked: mark.length, cleared: clear.length };
}

function doGet(e) {
  var id = e && e.parameter && e.parameter.id;
  var state = id ? checkIn_(id, SOURCE_QR, new Date()) : status_(new Date());
  var page = HtmlService.createTemplateFromFile('Index');
  page.state = JSON.stringify(state).replace(/</g, '\\u003c');
  return page.evaluate()
    .setTitle('Điểm danh')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Called from the page for learners who forgot their badge.
function search(query) {
  var words = fold_(query).split(/\s+/).filter(String);
  var digits = String(query).replace(/\D/g, '');
  var byPhone = digits.length >= 3 && digits === String(query).trim();
  if (!byPhone && words.join('').length < 2) return [];
  return grid_().rows.filter(function (r) {
    if (byPhone) return r.phone.replace(/\D/g, '').slice(-digits.length) === digits;
    var hay = fold_(r.name + ' ' + r.id);
    return words.every(function (w) { return hay.indexOf(w) >= 0; });
  }).slice(0, 8).map(function (r) {
    var card = card_(r);
    card.birth = r.birth;
    return card;
  });
}

function checkInByName(id) {
  return checkIn_(id, SOURCE_NAME, new Date());
}

// Called from the page about 30 minutes in: everyone in this session's course with no mark yet.
function missing() {
  return missing_(new Date());
}

function missing_(now) {
  var g = grid_();
  var session = session_(now, g);
  if (!session) return { session: null, count: null, people: [] };
  // A row with no readable package is listed too, so nobody drops out of the call list unseen.
  var people = g.rows.filter(function (r) {
    var due = !session.course || !r.courses.length || r.courses.indexOf(session.course) >= 0;
    return due && !isMark_(cell_(r.marks, session.col));
  }).map(function (r) {
    return { id: r.id, name: r.name, format: r.format, phone: r.phone };
  });
  return { session: session, count: count_(g, session), people: people };
}

function status_(now) {
  var g = grid_();
  var session = session_(now, g);
  return { kind: 'status', session: session, count: session ? count_(g, session) : null };
}

function checkIn_(id, source, now) {
  id = text_(id).toUpperCase();
  var g = grid_();
  var session = session_(now, g);
  var row = g.rows.filter(function (r) { return r.id === id; })[0];
  var out = { id: id, session: session, learner: row ? card_(row) : null, count: session ? count_(g, session) : null };
  if (!row || !session || (session.course && out.learner.courses.indexOf(session.course) < 0)) {
    return kind_(out, !row ? 'unknown' : !session ? 'no-session' : 'wrong-course');
  }

  // Re-read under the lock: another phone, or Gate Keeper, may have marked this learner since the read above.
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var target = g.sheet.getRange(row.row, session.col + 1);
    var mark = String(target.getDisplayValue()).trim();
    if (isMark_(mark)) {
      var earlier = read_(LOG).filter(function (r) {
        return text_(r['Ngày']) === session.day && text_(r['Buổi']) === session.part && text_(r['Mã']).toUpperCase() === id;
      })[0];
      out.mark = mark;
      out.time = earlier ? text_(earlier['Giờ']).slice(0, 5) : '';
      return kind_(out, 'again');
    }
    var time = Utilities.formatDate(now, TZ, 'HH:mm:ss');
    target.setValue(MARK_OFFLINE);
    var log = sheet_(LOG);
    log.getRange(log.getLastRow() + 1, 1, 1, LOG.headers.length).setNumberFormat('@')
      .setValues([[session.day, session.part, time, id, row.name, session.course, source, Session.getActiveUser().getEmail()]]);
    out.count.total++;
    out.count.offline++;
    out.time = time.slice(0, 5);
    return kind_(out, 'ok');
  } finally {
    lock.releaseLock();
  }
}

// Reads the shared tab the way Gate Keeper does: the first row holding a date, with Sáng/Chiều in one of
// the next four rows, gives the sessions; the row holding "Mã học viên" gives the learner columns.
function grid_() {
  var sheet = sheet_(GRID);
  var values = sheet.getDataRange().getDisplayValues();
  var g = { sheet: sheet, values: values, head: -1, cols: {}, sessions: [], rows: [] };
  var top = Math.min(values.length, 30);
  var r;

  for (r = 0; r < top && !g.sessions.length; r++) {
    if (!values[r].some(dayOf_)) continue;
    for (var s = r + 1; s < Math.min(values.length, r + 5) && !g.sessions.length; s++) {
      var day = '';
      for (var c = 0; c < values[s].length; c++) {
        day = dayOf_(values[r][c]) || day;
        var part = PARTS[fold_(values[s][c])];
        if (part && day) g.sessions.push({ col: c, day: day, part: part, course: COURSE_BY_DAY[day] || '' });
      }
    }
  }

  for (r = 0; r < top && g.head < 0; r++) {
    var keys = values[r].map(fold_);
    if (keys.indexOf('ma hoc vien') < 0) continue;
    var at = function (names) {
      for (var i = 0; i < keys.length; i++) if (names.indexOf(keys[i]) >= 0) return i;
      return -1;
    };
    g.head = r;
    g.cols = {
      code: at(['ma hoc vien']),
      family: at(['ho va ten lot', 'ho ten lot', 'ho dem', 'ho va chu lot']),
      given: at(['ten']),
      full: at(['ho va ten', 'ho ten', 'ho va ten hoc vien', 'ten hoc vien']),
      pkg: at(['goi', 'ma goi']),
      format: at(['hinh thuc']),
      birth: at(['ngay sinh']),
      phone: at(['so dien thoai']),
      unit: keys.map(function (k) { return k.indexOf('don vi') === 0; }).indexOf(true),
      link: at(['link qr'])
    };
  }

  if (g.head >= 0) {
    for (r = g.head + 1; r < values.length; r++) {
      var v = values[r];
      var id = cell_(v, g.cols.code).toUpperCase();
      if (!id) continue;
      var pkg = Number((cell_(v, g.cols.pkg).match(/[1-6]/) || [0])[0]);
      g.rows.push({
        row: r + 1, id: id, name: nameOf_(v, g.cols), pkg: pkg, courses: PACKAGES[pkg] || [],
        format: cell_(v, g.cols.format), birth: cell_(v, g.cols.birth), phone: cell_(v, g.cols.phone),
        unit: cell_(v, g.cols.unit), marks: v
      });
    }
  }
  return g;
}

function session_(now, g) {
  var day = Utilities.formatDate(now, TZ, 'dd/MM');
  var part = Number(Utilities.formatDate(now, TZ, 'H')) < 12 ? 'Sáng' : 'Chiều';
  var found = g.sessions.filter(function (s) { return s.day === day && s.part === part; })[0];
  if (!found) return null;
  return {
    course: found.course, name: found.course ? COURSES[found.course].name : '',
    day: Utilities.formatDate(now, TZ, 'dd/MM/yyyy'), part: part, col: found.col
  };
}

function count_(g, session) {
  var count = { total: 0, offline: 0, online: 0 };
  g.rows.forEach(function (r) {
    var mark = cell_(r.marks, session.col);
    if (!isMark_(mark)) return;
    count.total++;
    if (mark.indexOf(MARK_OFFLINE) === 0) count.offline++;
    else if (mark.indexOf(MARK_ONLINE) === 0) count.online++;
  });
  return count;
}

function card_(r) {
  return { id: r.id, name: r.name, unit: r.unit, pkg: r.pkg, courses: r.courses };
}

function kind_(out, kind) {
  out.kind = kind;
  return out;
}

function nameOf_(v, cols) {
  if (cols.full >= 0) return cell_(v, cols.full);
  return [cell_(v, cols.family), cell_(v, cols.given)].filter(String).join(' ');
}

// 8/1, 08/01 and 08/01/2027 all become 08/01, the key COURSE_BY_DAY uses.
function dayOf_(value) {
  var m = String(value).match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-]\d{2,4})?\b/);
  return m ? ('0' + m[1]).slice(-2) + '/' + ('0' + m[2]).slice(-2) : '';
}

function cell_(v, i) {
  return i < 0 || v[i] === undefined || v[i] === null ? '' : String(v[i]).trim();
}

// KĐK only says the session is outside the package; it is not attendance.
function isMark_(value) {
  return value !== '' && fold_(value) !== 'kdk';
}

// Zero-based column to A1, e.g. a1_(3, 26) is AA3.
function a1_(row, col) {
  var name = '';
  for (var n = col + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name;
  return name + row;
}

// Lets staff type "huong" for "Hương"; đ has no decomposed form, so it is mapped by hand.
function fold_(value) {
  return String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd').trim();
}

function text_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return Utilities.formatDate(value, TZ, 'dd/MM/yyyy');
  return String(value === undefined || value === null ? '' : value).trim();
}

function read_(def) {
  var values = sheet_(def).getDataRange().getValues();
  var head = values.shift() || [];
  return values.map(function (row) {
    var r = {};
    head.forEach(function (h, i) { r[h] = row[i]; });
    return r;
  });
}

function sheet_(def) {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  return book.getSheetByName(def.name) || book.insertSheet(def.name);
}

function toast_(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Điểm danh', 8);
}
