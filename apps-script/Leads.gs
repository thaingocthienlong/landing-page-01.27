/**
 * The short "Nhận đề cương và tư vấn" form the Meta ads point to (form_type 'tu_van'), and the
 * ad attribution of every form on the page. Each submission of either form gets one row in the
 * "Lead web" tab with its UTM fields, so leads can be counted per ad (utm_content). The full
 * registration still writes its own row in "Đăng ký" as before; this file never touches that tab.
 * A short-form lead emails the people on duty at once.
 */

var LEAD_SHEET_NAME = 'Lead web';
var LEAD_NOTIFY_EMAILS = ['tuyensinh@vienphuongnam.com.vn', 'vanphong@vienphuongnam.com.vn', 'quantrihethong@vienphuongnam.com.vn'];
var ATTRIBUTION_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
var LEAD_HEADERS = ['Thời gian', 'Loại form', 'Họ và tên', 'Số điện thoại', 'Hướng quan tâm', 'Hình thức học']
  .concat(ATTRIBUTION_FIELDS, ['Trang gửi', 'Trạng thái']);

function handleConsult_(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (data.website) return json_({ ok: true });
    if (Number(data.elapsed) < MIN_SECONDS_TO_FILL) return json_({ ok: false, error: 'too-fast' });
    var required = ['ho_ten', 'so_dien_thoai', 'huong_quan_tam', 'hinh_thuc_hoc'];
    for (var i = 0; i < required.length; i++) {
      if (!clean_(data[required[i]])) return json_({ ok: false, error: 'missing-' + required[i] });
    }
    if (data.agreement !== true) return json_({ ok: false, error: 'no-consent' });
    if (!/^\d{9,11}$/.test(String(data.so_dien_thoai).replace(/[\s-]/g, ''))) return json_({ ok: false, error: 'bad-phone' });

    var cache = CacheService.getScriptCache();
    var key = 'l_' + Utilities.base64EncodeWebSafe(
      // Same number however it is spaced: "0912 114 511" and "0912114511" are one lead.
      Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [String(data.so_dien_thoai).replace(/[\s-]/g, ''), data.huong_quan_tam].join('|'))
    );
    if (cache.get(key)) return json_({ ok: true, duplicate: true });

    var saved = appendLead_('Tư vấn', data.ho_ten, data.so_dien_thoai, data.huong_quan_tam, data.hinh_thuc_hoc, data);
    cache.put(key, '1', 600);
    // The row is saved: a mail failure must not become an error the learner retries, so it is marked on the row instead.
    try {
      notifyConsult_(saved.row);
    } catch (err) {
      saved.sheet.getRange(saved.index, LEAD_HEADERS.length).setValue('Mới (chưa gửi được email báo)');
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

// Called by doPost after a registration row is saved, inside its lock.
function logRegistrationLead_(data) {
  appendLead_('Đăng ký', clean_(data.ho_lot) + ' ' + clean_(data.ten), data.phoneregister, data.package_id, '', data);
}

function appendLead_(kind, name, phone, interest, format, data) {
  var sheet = leadSheet_();
  var row = [new Date(), kind, name, phone, interest, format]
    .concat(ATTRIBUTION_FIELDS.map(function (field) { return data[field]; }), [data.page, 'Mới'])
    .map(clean_);
  row[0] = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
  var index = sheet.getLastRow() + 1;
  // A new tab has 1000 rows; writing past the grid throws.
  if (index > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 1);
  sheet.getRange(index, 1, 1, row.length).setNumberFormat('@').setValues([row]);
  return { sheet: sheet, index: index, row: row };
}

function leadSheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(LEAD_SHEET_NAME) || book.insertSheet(LEAD_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS])
      .setFontWeight('bold').setBackground('#0a3d91').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function notifyConsult_(row) {
  var rows = LEAD_HEADERS.map(function (h, i) {
    return '<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">' + esc_(h) + '</th><td style="padding:4px 0">' + esc_(row[i]) + '</td></tr>';
  }).join('');
  var ad = row[LEAD_HEADERS.indexOf('utm_content')];
  MailApp.sendEmail({
    to: LEAD_NOTIFY_EMAILS.join(','),
    subject: 'Lead tư vấn mới: ' + row[2] + ' – ' + row[3] + (ad ? ' (' + ad + ')' : ''),
    htmlBody: '<p style="font-family:Arial,sans-serif;font-size:14px">Người này để lại số điện thoại để nhận đề cương và tư vấn. Vui lòng gọi lại trong giờ làm việc.</p>'
      + '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' + rows + '</table>'
  });
}
