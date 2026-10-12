/**
 * Receives registrations from the landing page form, appends them to the
 * bound Google Sheet and emails a notification.
 *
 * Setup: open the Sheet > Extensions > Apps Script, paste this file, run
 * setup() once and authorize, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). Put the /exec URL in the
 * data-endpoint attribute of #consultation-form in dist/index.html.
 * Requests with action 'chat' go to the learner-care chat in Chat.gs.
 */

var SHEET_NAME = 'Đăng ký';
// Extra recipients besides the account that owns this script.
var NOTIFY_EMAILS = ['vanphong@vienphuongnam.com.vn'];
var MIN_SECONDS_TO_FILL = 3;

var HEADERS = [
  'Thời gian', 'Mã gói', 'Gói đăng ký quan tâm', 'Họ và chữ lót', 'Tên', 'Email', 'Số điện thoại',
  'Giới tính', 'Ngày sinh', 'Tỉnh/Thành phố', 'Vị trí công tác', 'Đơn vị công tác',
  'Biết đến qua', 'Ghi rõ (Khác)', 'Đồng ý', 'Trang gửi', 'Trạng thái',
  'Mã học viên', 'Đợt', 'Kênh', 'Hình thức', 'Số tiền phải đóng', 'Email CK đã gửi', 'Ngày đóng', 'Phụ trách', 'Ghi chú'
];

function setup() {
  var sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#0a3d91').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length).setNumberFormat('@');
}

function doGet() {
  return json_({ ok: true, service: 'registration' });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  }
  // Chat waits seconds on the model, so it must not hold the registration lock (Chat.gs).
  if (data.action === 'chat') return handleChat_(data);

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (data.website) return json_({ ok: true });
    if (Number(data.elapsed) < MIN_SECONDS_TO_FILL) return json_({ ok: false, error: 'too-fast' });

    var required = ['package_id', 'ho_lot', 'ten', 'emailcontact', 'phoneregister', 'gioi_tinh', 'ngay_sinh', 'tinh_thanh', 'vi_tri', 'don_vi', 'biet_qua'];
    for (var i = 0; i < required.length; i++) {
      if (!clean_(data[required[i]])) return json_({ ok: false, error: 'missing-' + required[i] });
    }
    if (data.agreement !== true) return json_({ ok: false, error: 'no-consent' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(data.emailcontact))) return json_({ ok: false, error: 'bad-email' });

    var cache = CacheService.getScriptCache();
    var key = 'r_' + Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [data.emailcontact, data.phoneregister, data.package_id].join('|'))
    );
    if (cache.get(key)) return json_({ ok: true, duplicate: true });

    var row = [
      new Date(), data.package_id, data.package, data.ho_lot, data.ten, data.emailcontact, data.phoneregister,
      data.gioi_tinh, data.ngay_sinh, data.tinh_thanh, data.vi_tri, data.don_vi,
      data.biet_qua, data.biet_qua_other || '', 'Có', data.page, 'Mới'
    ].map(clean_);
    row[0] = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');

    var sheet = getSheet_();
    if (sheet.getLastRow() === 0) setup();
    var next = sheet.getLastRow() + 1;
    sheet.getRange(next, 1, 1, row.length).setNumberFormat('@').setValues([row]);

    cache.put(key, '1', 600);
    notify_(data, row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function notify_(data, row) {
  var owner = Session.getEffectiveUser().getEmail();
  var to = [owner].concat(NOTIFY_EMAILS).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(',');
  var rows = HEADERS.map(function (h, i) {
    return '<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">' + esc_(h) + '</th><td style="padding:4px 0">' + esc_(row[i]) + '</td></tr>';
  }).join('');
  MailApp.sendEmail({
    to: to,
    replyTo: data.emailcontact,
    subject: 'Đăng ký mới: ' + data.package_id + ' – ' + data.ho_lot + ' ' + data.ten,
    htmlBody: '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' + rows + '</table>'
  });
}

function getSheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var found = book.getSheetByName(SHEET_NAME);
  if (found) return found;
  var first = book.getSheets()[0];
  if (book.getSheets().length === 1 && first.getLastRow() === 0) {
    first.setName(SHEET_NAME);
    return first;
  }
  return book.insertSheet(SHEET_NAME);
}

// Cells are text-formatted, so typed formulas stay inert text.
function clean_(value) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, 500);
}

function esc_(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
