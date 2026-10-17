/**
 * Attendance for the R series (01/2027). A badge QR opens this web app with
 * ?id=<code>; each learner gets one row per session in "Lượt quét".
 *
 * Deploy as Web app with Execute as: Me, Who has access: Anyone within
 * vienphuongnam.com.vn, so learners scanning their own badge hit a sign-in wall.
 * Setup steps for staff are in README.md next to this file.
 */

var TZ = 'Asia/Ho_Chi_Minh';
// Paste the /exec URL after deploying; "Tạo link QR" builds the QR links from it.
var WEBAPP_URL = '';
// Codes come from the registration ledger (Mã học viên), never from this sheet.
var ID_PREFIX = 'R27-';
var SOURCE_QR = 'QR';
var SOURCE_NAME = 'Tra tên';
var SOURCE_ZOOM = 'Zoom';
// Someone still connected at the afternoon start counts for the afternoon too.
var AFTERNOON_START = '13:30';

var COURSES = {
  K1: { name: 'Phân tích dữ liệu với R cơ bản', days: ['08/01/2027', '09/01/2027', '10/01/2027'] },
  K2: { name: 'Phân tích chi phí - hiệu quả trong y tế', days: ['12/01/2027', '13/01/2027'] },
  K3: { name: 'Phân tích dữ liệu chuỗi thời gian', days: ['15/01/2027', '16/01/2027', '17/01/2027'] }
};
var PACKAGES = { 1: ['K1', 'K2', 'K3'], 2: ['K1', 'K2'], 3: ['K1', 'K3'], 4: ['K2', 'K3'], 5: ['K2'], 6: ['K3'] };

var LEARNERS = { name: 'Học viên', headers: ['Mã', 'Họ và chữ lót', 'Tên', 'Gói', 'Hình thức', 'Ngày sinh', 'Số điện thoại', 'Email', 'Đơn vị công tác', 'Link QR'] };
var SESSIONS = { name: 'Buổi', headers: ['Khóa', 'Ngày', 'Buổi'] };
var LOG = { name: 'Lượt quét', headers: ['Ngày', 'Buổi', 'Giờ', 'Mã', 'Họ tên', 'Khóa', 'Nguồn', 'Người ghi'] };
var SUMMARY = { name: 'Tổng hợp' };
var ZOOM = { name: 'Zoom' };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Điểm danh')
    .addItem('Tạo các trang tính', 'setup')
    .addItem('Tạo link QR', 'makeQrLinks')
    .addItem('Nhập điểm danh Zoom', 'importZoom')
    .addItem('Cập nhật tổng hợp', 'buildSummary')
    .addToUi();
}

function setup() {
  [LEARNERS, SESSIONS, LOG].forEach(function (def) {
    var sheet = sheet_(def);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    // Text format keeps 08/01/2027 from turning into 1 August in an en-US sheet.
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, def.headers.length).setNumberFormat('@');
  });
  var sessions = sheet_(SESSIONS);
  if (sessions.getLastRow() < 2) {
    var rows = [];
    Object.keys(COURSES).forEach(function (course) {
      COURSES[course].days.forEach(function (day) {
        rows.push([course, day, 'Sáng'], [course, day, 'Chiều']);
      });
    });
    sessions.getRange(2, 1, rows.length, 3).setValues(rows);
  }
  sheet_(ZOOM);
}

function makeQrLinks() {
  if (!WEBAPP_URL) {
    toast_('Chưa có link ứng dụng: điền WEBAPP_URL trong Code.gs.');
    return 0;
  }
  var sheet = sheet_(LEARNERS);
  var head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var made = 0;
  var missing = 0;
  var links = read_(LEARNERS).map(function (r) {
    var id = text_(r['Mã']);
    if (id) made++;
    else if (text_(r['Tên'])) missing++;
    return [id ? WEBAPP_URL + '?id=' + encodeURIComponent(id) : ''];
  });
  if (links.length) sheet.getRange(2, head.indexOf('Link QR') + 1, links.length, 1).setValues(links);
  toast_('Đã tạo ' + made + ' link QR.' + (missing ? ' ' + missing + ' dòng chưa có Mã: chép Mã học viên từ Sổ học viên.' : ''));
  return made;
}

// Reads the participant report pasted into the Zoom tab and checks people in through checkIn_.
// shortcut: checkIn_ re-reads the sheets per row (about a second each), fine for one session; batch the reads if a run times out.
function importZoom() {
  var days = {};
  read_(SESSIONS).forEach(function (r) { days[text_(r['Ngày'])] = true; });
  var byEmail = {};
  read_(LEARNERS).forEach(function (r) {
    if (text_(r['Mã']) && text_(r['Email'])) byEmail[text_(r['Email']).toLowerCase()] = text_(r['Mã']);
  });
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var codeRe = new RegExp(ID_PREFIX + '\\d+', 'i');
  var done = { ok: 0, again: 0 };
  var skipped = {};

  sheet_(ZOOM).getDataRange().getValues().forEach(function (row) {
    var cells = row.map(function (v) {
      return Object.prototype.toString.call(v) === '[object Date]' ? Utilities.formatDate(v, tz, 'dd/MM/yyyy HH:mm') : String(v).trim();
    });
    var line = cells.join(' ');
    var code = (line.match(codeRe) || [])[0];
    var email = (line.match(/[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}/i) || [])[0];
    if (!code && !email) return;
    var label = cells[0] || email;
    var id = code ? code.toUpperCase() : byEmail[email.toLowerCase()];
    if (!id) {
      skipped[label] = 'không khớp học viên';
      return;
    }
    // Zoom lists the join time before the leave time.
    var times = cells.map(function (c) { return zoomTime_(c, days); }).filter(Boolean);
    if (!times.length) {
      skipped[label] = 'không có giờ vào trong ngày học';
      return;
    }
    var moments = [times[0]];
    var resume = Utilities.parseDate(Utilities.formatDate(times[0], TZ, 'dd/MM/yyyy') + ' ' + AFTERNOON_START, TZ, 'dd/MM/yyyy HH:mm');
    if (Number(Utilities.formatDate(times[0], TZ, 'H')) < 12 && times[1] && times[1] >= resume) moments.push(resume);
    moments.forEach(function (at) {
      var r = checkIn_(id, SOURCE_ZOOM, at);
      if (r.kind === 'ok' || r.kind === 'again') done[r.kind]++;
      else skipped[label] = { unknown: 'không có mã ' + id, 'no-session': 'ngoài buổi học', 'wrong-course': 'gói không có ' + (r.session && r.session.course) }[r.kind];
    });
  });

  var lines = Object.keys(skipped).map(function (k) { return k + ': ' + skipped[k]; });
  var message = 'Đã ghi ' + done.ok + ' lượt. Đã có từ trước: ' + done.again + '.' +
    (lines.length ? '\n\nKhông ghi (giảng viên và Ban tổ chức cũng nằm ở đây):\n' + lines.join('\n') : '');
  SpreadsheetApp.getUi().alert(message);
  return { ok: done.ok, again: done.again, skipped: skipped };
}

// Zoom writes 01/08/2027 08:25:31 AM or 2027-01-08 08:25:31 depending on account settings, and Sheets
// may have swapped day and month on import, so the reading that lands on a class day wins.
function zoomTime_(text, days) {
  var m = String(text).match(/(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4}),?\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?/i);
  if (!m) return null;
  var hour = m[6] ? Number(m[4]) % 12 + (/^p/i.test(m[6]) ? 12 : 0) : Number(m[4]);
  var year = m[1].length === 4 ? m[1] : m[3];
  var orders = m[1].length === 4 ? [[m[3], m[2]]] : [[m[1], m[2]], [m[2], m[1]]];
  var pad = function (n) { return ('0' + Number(n)).slice(-2); };
  for (var i = 0; i < orders.length; i++) {
    var day = pad(orders[i][0]) + '/' + pad(orders[i][1]) + '/' + year;
    if (days[day]) return Utilities.parseDate(day + ' ' + pad(hour) + ':' + m[5], TZ, 'dd/MM/yyyy HH:mm');
  }
  return null;
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
  return read_(LEARNERS).filter(function (r) {
    if (!text_(r['Mã'])) return false;
    if (byPhone) return String(r['Số điện thoại']).replace(/\D/g, '').slice(-digits.length) === digits;
    var hay = fold_(fullName_(r) + ' ' + r['Mã']);
    return words.every(function (w) { return hay.indexOf(w) >= 0; });
  }).slice(0, 8).map(function (r) {
    var card = card_(r);
    card.birth = text_(r['Ngày sinh']);
    return card;
  });
}

function checkInByName(id) {
  return checkIn_(id, SOURCE_NAME, new Date());
}

function status_(now) {
  var session = session_(now);
  return { kind: 'status', session: session, count: session ? count_(read_(LOG), session) : 0 };
}

function checkIn_(id, source, now) {
  id = text_(id).toUpperCase();
  var session = session_(now);
  var row = read_(LEARNERS).filter(function (r) { return text_(r['Mã']).toUpperCase() === id; })[0];
  var out = { id: id, session: session, learner: row ? card_(row) : null, count: 0 };
  if (!row || !session || out.learner.courses.indexOf(session.course) < 0) {
    if (session) out.count = count_(read_(LOG), session);
    return kind_(out, !row ? 'unknown' : !session ? 'no-session' : 'wrong-course');
  }

  // Two phones scanning the same badge at once must not write two rows.
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var log = read_(LOG);
    var earlier = log.filter(function (r) { return same_(r, session) && text_(r['Mã']).toUpperCase() === id; })[0];
    out.count = count_(log, session);
    if (earlier) {
      out.time = text_(earlier['Giờ']).slice(0, 5);
      return kind_(out, 'again');
    }
    var time = Utilities.formatDate(now, TZ, 'HH:mm:ss');
    var by = Session.getActiveUser().getEmail();
    var sheet = sheet_(LOG);
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, LOG.headers.length).setNumberFormat('@')
      .setValues([[session.day, session.part, time, id, out.learner.name, session.course, source, by]]);
    out.count++;
    out.time = time.slice(0, 5);
    return kind_(out, 'ok');
  } finally {
    lock.releaseLock();
  }
}

function buildSummary() {
  var sessions = read_(SESSIONS).map(function (r) {
    return { course: text_(r['Khóa']), day: text_(r['Ngày']), part: text_(r['Buổi']) };
  });
  var present = {};
  var lookups = {};
  read_(LOG).forEach(function (r) {
    var id = text_(r['Mã']).toUpperCase();
    present[id + '|' + text_(r['Ngày']) + '|' + text_(r['Buổi'])] = true;
    if (text_(r['Nguồn']) === SOURCE_NAME) lookups[id] = (lookups[id] || 0) + 1;
  });
  var courses = Object.keys(COURSES);
  var head = ['Mã', 'Họ tên', 'Gói']
    .concat(sessions.map(function (s) { return s.course + '\n' + s.day.slice(0, 5) + ' ' + s.part; }))
    .concat(courses, [SOURCE_NAME]);
  var rows = read_(LEARNERS).filter(function (r) { return text_(r['Mã']); }).map(function (r) {
    var card = card_(r);
    var mine = sessions.map(function (s) {
      if (card.courses.indexOf(s.course) < 0) return '·';
      return present[card.id + '|' + s.day + '|' + s.part] ? '✓' : '';
    });
    var totals = courses.map(function (c) {
      if (card.courses.indexOf(c) < 0) return '';
      var all = sessions.filter(function (s) { return s.course === c; });
      var seen = all.filter(function (s) { return present[card.id + '|' + s.day + '|' + s.part]; });
      return seen.length + '/' + all.length;
    });
    return [card.id, card.name, card.pkg ? 'Gói ' + card.pkg : ''].concat(mine, totals, [lookups[card.id] || '']);
  });
  var sheet = sheet_(SUMMARY);
  sheet.clearContents();
  // Text format stops Sheets from reading "5/6" as a date.
  sheet.getRange(1, 1, rows.length + 1, head.length).setNumberFormat('@').setValues([head].concat(rows));
  sheet.getRange(1, 1, 1, head.length).setFontWeight('bold').setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  toast_('Đã cập nhật ' + rows.length + ' học viên.');
  return rows.length;
}

function session_(now) {
  var day = Utilities.formatDate(now, TZ, 'dd/MM/yyyy');
  var part = Number(Utilities.formatDate(now, TZ, 'H')) < 12 ? 'Sáng' : 'Chiều';
  var found = read_(SESSIONS).filter(function (r) { return text_(r['Ngày']) === day && text_(r['Buổi']) === part; })[0];
  if (!found) return null;
  var course = text_(found['Khóa']);
  return { course: course, name: COURSES[course] ? COURSES[course].name : '', day: day, part: part };
}

function card_(r) {
  var pkg = Number((String(r['Gói']).match(/[1-6]/) || [0])[0]);
  return { id: text_(r['Mã']).toUpperCase(), name: fullName_(r), unit: text_(r['Đơn vị công tác']), pkg: pkg, courses: PACKAGES[pkg] || [] };
}

function kind_(out, kind) {
  out.kind = kind;
  return out;
}

function same_(r, session) {
  return text_(r['Ngày']) === session.day && text_(r['Buổi']) === session.part;
}

function count_(log, session) {
  return log.filter(function (r) { return same_(r, session); }).length;
}

function fullName_(r) {
  return (text_(r['Họ và chữ lót']) + ' ' + text_(r['Tên'])).trim();
}

// Lets staff type "huong" for "Hương"; đ has no decomposed form, so it is mapped by hand.
function fold_(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').trim();
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
