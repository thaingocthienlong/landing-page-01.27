/**
 * Copies each form submission into the staff tabs "Theo dõi lead" and, for registrations,
 * "Học viên - Học phí", so advisers stop retyping rows from "Lead web". Staff own those tabs:
 * every row already carries formulas, checkboxes and dropdowns, so only the input columns are
 * written, only with values from their dropdown lists, and the next free row is the first one
 * whose column A is empty. Missing tabs are skipped.
 */

var TRACK_SHEET = 'Theo dõi lead';
var FEES_SHEET = 'Học viên - Học phí';
var LEAD_TZ = 'Asia/Ho_Chi_Minh';
var INTERESTS = ['Cả 3 khóa', 'Khóa 2: Phân tích chi phí - hiệu quả trong y tế', 'Khóa 1 + Khóa 3', 'Chưa rõ, cần tư vấn'];
var INTEREST_BY_PACKAGE = { 'Gói 1': INTERESTS[0], 'Gói 3': INTERESTS[2], 'Gói 5': INTERESTS[1] };
var FORMATS = ['Trực tiếp tại Viện', 'Trực tuyến qua Zoom', 'Chưa quyết định'];
var PACKAGES = ['Gói 1', 'Gói 2', 'Gói 3', 'Gói 4', 'Gói 5', 'Gói 6'];
var SOURCE_BY_HEARD = {
  'Email': 'Email/Zalo của Viện', 'Zalo': 'Email/Zalo của Viện',
  'Facebook Viện Phương Nam': 'Facebook tự nhiên', 'Facebook GS.TS. Nguyễn Văn Tuấn': 'Facebook tự nhiên', 'Hội nhóm Facebook': 'Facebook tự nhiên',
  'Website Viện Phương Nam': 'Website', 'Người quen giới thiệu': 'Người quen giới thiệu', 'Khác': 'Khác'
};

// Same rule as the tabs' "SĐT chuẩn" formula.
function normalizePhone_(value) {
  var digits = String(value === undefined || value === null ? '' : value).replace(/\D/g, '');
  if (/^84\d{9}$/.test(digits)) return '0' + digits.slice(2);
  if (/^[1-9]\d{8}$/.test(digits)) return '0' + digits;
  return digits;
}

function leadChannel_(isConsult, data) {
  if (clean_(data.utm_medium).toLowerCase() === 'messenger') return 'Messenger';
  return isConsult ? 'Web - form tư vấn' : 'Web - form đăng ký';
}

// Messenger leads stay blank: only the adviser can tell an ad conversation from an organic one.
function leadSource_(isConsult, data) {
  var source = clean_(data.utm_source).toLowerCase();
  var medium = clean_(data.utm_medium).toLowerCase();
  if (medium === 'messenger') return '';
  if (source === 'meta' && medium === 'paid_social') return 'Quảng cáo Meta';
  if (isConsult) return 'Chưa rõ';
  return SOURCE_BY_HEARD[clean_(data.biet_qua)] || 'Chưa rõ';
}

// k1k3 first: "k1k301" also starts with "k1".
function leadGroup_(content) {
  var c = clean_(content).toLowerCase();
  if (c.indexOf('k1k3') === 0) return 'K1K3';
  if (c.indexOf('k2') === 0) return 'K2';
  if (c.indexOf('gen') === 0) return 'GEN';
  return '';
}

function leadInterest_(isConsult, data) {
  if (!isConsult) return INTEREST_BY_PACKAGE[clean_(data.package_id)] || '';
  var dashes = function (s) { return s.replace(/\s*[-–—]\s*/g, ' - '); };
  var wanted = dashes(clean_(data.huong_quan_tam));
  for (var i = 0; i < INTERESTS.length; i++) if (dashes(INTERESTS[i]) === wanted) return INTERESTS[i];
  return '';
}

function fillLeadTabs_(isConsult, data, when) {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var lead = {
    isConsult: isConsult,
    name: isConsult ? clean_(data.ho_ten) : (clean_(data.ho_lot) + ' ' + clean_(data.ten)).trim(),
    phone: clean_(isConsult ? data.so_dien_thoai : data.phoneregister),
    pkg: PACKAGES.indexOf(clean_(data.package_id)) >= 0 ? clean_(data.package_id) : '',
    stamp: Utilities.formatDate(when, LEAD_TZ, 'dd/MM/yyyy HH:mm:ss'),
    short: Utilities.formatDate(when, LEAD_TZ, 'dd/MM HH:mm'),
    code: 'DK-' + Utilities.formatDate(when, LEAD_TZ, 'yyMMdd-HHmmss')
  };
  lead.key = normalizePhone_(lead.phone);
  var track = book.getSheetByName(TRACK_SHEET);
  if (track) upsertTrackRow_(track, lead, data);
  var fees = book.getSheetByName(FEES_SHEET);
  if (fees && !isConsult && lead.pkg) addFeeRow_(fees, lead);
}

// The first row from 2 whose column A is empty; a full tab grows by one row copied from the last.
function freeRow_(sheet, columnA) {
  for (var i = 0; i < columnA.length; i++) if (columnA[i][0] === '' || columnA[i][0] === null) return i + 2;
  var last = sheet.getMaxRows();
  sheet.insertRowsAfter(last, 1);
  sheet.getRange(last, 1, 1, sheet.getLastColumn()).copyTo(sheet.getRange(last + 1, 1));
  return last + 1;
}

function upsertTrackRow_(track, lead, data) {
  var rows = track.getMaxRows() - 1;
  var cols = rows > 0 ? track.getRange(2, 1, rows, 3).getValues() : [];
  for (var i = 0; lead.key && i < cols.length; i++) {
    if (normalizePhone_(cols[i][2]) !== lead.key) continue;
    var at = i + 2;
    var note = track.getRange(at, 19);
    var line = lead.short + ': gửi thêm ' + (lead.isConsult ? 'form tư vấn' : 'form đăng ký ' + lead.pkg).trim();
    note.setValue(note.getValue() ? note.getValue() + '\n' + line : line);
    if (!lead.isConsult && track.getRange(at, 13).getValue() !== 'Đã thanh toán') track.getRange(at, 13).setValue('Đã đăng ký');
    if (lead.pkg && !track.getRange(at, 18).getValue()) track.getRange(at, 18).setValue(lead.pkg);
    return;
  }
  var row = freeRow_(track, cols);
  var source = leadSource_(lead.isConsult, data);
  var format = FORMATS.indexOf(clean_(data.hinh_thuc_hoc)) >= 0 ? clean_(data.hinh_thuc_hoc) : '';
  // D, E, N, Q and T hold formulas or the checkbox: write around them.
  track.getRange(row, 3).setNumberFormat('@');
  track.getRange(row, 1, 1, 3).setValues([[lead.stamp, lead.name, lead.phone]]);
  track.getRange(row, 6, 1, 8).setValues([[
    leadChannel_(lead.isConsult, data), source, source === 'Quảng cáo Meta' ? leadGroup_(data.utm_content) : '', clean_(data.utm_content),
    leadInterest_(lead.isConsult, data), format, 'Chờ kiểm', lead.isConsult ? 'Mới' : 'Đã đăng ký'
  ]]);
  if (lead.pkg) track.getRange(row, 18).setValue(lead.pkg);
}

function addFeeRow_(fees, lead) {
  var rows = fees.getMaxRows() - 1;
  var cols = rows > 0 ? fees.getRange(2, 1, rows, 4).getValues() : [];
  var codes = {};
  for (var i = 0; i < cols.length; i++) {
    if (lead.key && normalizePhone_(cols[i][1]) === lead.key && cols[i][3] === lead.pkg) return;
    codes[cols[i][0]] = true;
  }
  var code = lead.code;
  for (var n = 2; codes[code]; n++) code = lead.code + '-' + n;
  var row = freeRow_(fees, cols);
  // Only A to D and O: the rest are formulas, checkboxes or for the accountant.
  fees.getRange(row, 2).setNumberFormat('@');
  fees.getRange(row, 1, 1, 4).setValues([[code, lead.phone, lead.name, lead.pkg]]);
  fees.getRange(row, 15).setValue('Tự thêm từ form đăng ký ' + lead.short);
}

// Run once from the editor, after the user agreed: copies the registrations made before this file existed.
function backfillFromRegistrations() {
  var wanted = ['07/11/2026 11:20:44', '10/11/2026 08:39:05'];
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var rows = getSheet_().getDataRange().getValues();
    var head = rows[0].map(String);
    var at = function (row, name) { return row[head.indexOf(name)]; };
    var done = [];
    rows.slice(1).forEach(function (row) {
      var stamp = clean_(row[0]);
      if (wanted.indexOf(stamp) < 0) return;
      var data = attributionFromPage_(clean_(at(row, 'Trang gửi')));
      data.package_id = at(row, 'Mã gói');
      data.ho_lot = at(row, 'Họ và chữ lót');
      data.ten = at(row, 'Tên');
      data.phoneregister = at(row, 'Số điện thoại');
      data.biet_qua = at(row, 'Biết đến qua');
      fillLeadTabs_(false, data, parseStamp_(stamp));
      done.push(stamp);
    });
    Logger.log('Đã thêm: ' + done.join(', '));
    return done;
  } finally {
    lock.releaseLock();
  }
}

function attributionFromPage_(page) {
  var data = {};
  (page.split('#')[0].split('?')[1] || '').split('&').forEach(function (pair) {
    var parts = pair.split('=');
    if (ATTRIBUTION_FIELDS.indexOf(parts[0]) >= 0) data[parts[0]] = decodeURIComponent((parts[1] || '').replace(/\+/g, ' '));
  });
  return data;
}

// "dd/MM/yyyy HH:mm:ss" in Vietnam time (UTC+7, no daylight saving).
function parseStamp_(stamp) {
  var m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(stamp);
  return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4] - 7, +m[5], +m[6]));
}
