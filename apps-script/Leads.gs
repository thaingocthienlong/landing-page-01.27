/**
 * The short "Đăng ký tư vấn" form the Meta ads point to (form_type 'tu_van'), and the
 * ad attribution of every form on the page. Each submission of either form gets one row in the
 * "Lead web" tab with its UTM fields, so leads can be counted per ad (utm_content). The full
 * registration still writes its own row in "Đăng ký" as before; this file never touches that tab.
 * A short-form lead emails the people on duty at once. The page no longer shows the short form:
 * its posts now come from the assistant's "Để lại số điện thoại" card (dist/app.js).
 *
 * A form sent by someone who talked to the assistant carries the conversation's id (chat_session,
 * the "Phiên" of the "Hỏi đáp" tab), kept in the "Phiên trợ lý" column, so a lead or a
 * registration can be traced to its conversation.
 */

var LEAD_SHEET_NAME = 'Lead web';
var LEAD_NOTIFY_EMAILS = ['tuyensinh@vienphuongnam.com.vn', 'vanphong@vienphuongnam.com.vn', 'quantrihethong@vienphuongnam.com.vn'];
var ATTRIBUTION_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
var LEAD_HEADERS = ['Thời gian', 'Loại form', 'Họ và tên', 'Số điện thoại', 'Hướng quan tâm', 'Hình thức học']
  .concat(ATTRIBUTION_FIELDS, ['Trang gửi', 'Trạng thái']);
// Added later, and only when a row has them: the assistant's conversation id and what the learner
// told it. They sit wherever their headers are, so columns staff added to the tab are left alone.
var LEAD_CHAT_HEADERS = ['Phiên trợ lý', 'Ghi chú trợ lý'];

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
      // Same number however it is spaced: "0912 114 511" and "0912114511" are one lead. The same
      // number left again from another conversation with the assistant is a lead of its own:
      // dropped as a repeat, that conversation's id and note would never reach the adviser.
      Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [String(data.so_dien_thoai).replace(/[\s-]/g, ''), data.huong_quan_tam, leadChatSession_(data)].join('|'))
    );
    if (cache.get(key)) return json_({ ok: true, duplicate: true });

    var saved = appendLead_('Tư vấn', data.ho_ten, data.so_dien_thoai, data.huong_quan_tam, data.hinh_thuc_hoc, data);
    cache.put(key, '1', 600);
    // The staff tabs are a convenience copy: a failure there must not cost the lead (LeadTabs.gs).
    try { fillLeadTabs_(true, data, new Date()); } catch (ignore) {}
    // The row is saved: a mail failure must not become an error the learner retries, so it is marked on the row instead.
    try {
      notifyConsult_(saved.row, saved.chat);
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

// Called by doPost after a registration row is saved, inside its lock; row is that row, in HEADERS order.
function logRegistrationLead_(data, row) {
  var saved = appendLead_('Đăng ký', clean_(data.ho_lot) + ' ' + clean_(data.ten), data.phoneregister, data.package_id, data.hinh_thuc_hoc, data);
  try { fillLeadTabs_(false, data, new Date()); } catch (ignore) {}
  // Once setupLedger has filled its intake tab, the ledger (Ledger.gs) sends its own receipt with the learner code.
  // Until then it sends nothing, even with Ledger.gs pushed, so this receipt is the learner's only email.
  var intakes = typeof ledgerIntake_ === 'function' && SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEDGER_INTAKES.name);
  if (intakes && intakes.getLastRow() > 1) return;
  try {
    var r = {};
    HEADERS.forEach(function (header, i) { r[header] = row[i]; });
    sendReceipt_(r, 'Phân tích định lượng với R');
  } catch (err) {
    saved.sheet.getRange(saved.index, LEAD_HEADERS.length).setValue('Mới (chưa gửi được email xác nhận)');
  }
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
  var chat = [leadChatSession_(data), clean_(data.chat_note)];
  // The attribution of the assistant is a copy for counting: losing it must not cost the lead.
  try {
    if (chat[0]) sheet.getRange(index, leadChatCol_(sheet), 1, 2).setNumberFormat('@').setValues([chat]);
  } catch (ignore) {}
  return { sheet: sheet, index: index, row: row, chat: chat };
}

// The conversation id a form carries, when it has the shape the chat gives it (Chat.gs).
function leadChatSession_(data) {
  var session = String(data.chat_session === undefined || data.chat_session === null ? '' : data.chat_session);
  return /^[A-Za-z0-9_-]{8,64}$/.test(session) ? session : '';
}

// The column of "Phiên trợ lý" ("Ghi chú trợ lý" is the next one). A tab without the two headers
// gets them after its last used column.
function leadChatCol_(sheet) {
  var last = Math.max(sheet.getLastColumn(), LEAD_HEADERS.length);
  var at = sheet.getRange(1, 1, 1, last).getValues()[0].indexOf(LEAD_CHAT_HEADERS[0]);
  if (at !== -1) return at + 1;
  if (last + 2 > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), last + 2 - sheet.getMaxColumns());
  sheet.getRange(1, last + 1, 1, 2).setValues([LEAD_CHAT_HEADERS])
    .setFontWeight('bold').setBackground('#0a3d91').setFontColor('#ffffff');
  return last + 1;
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

// chat: [conversation id, what the learner told the assistant], both '' for a lead that never used it.
function notifyConsult_(row, chat) {
  var fromChat = chat && chat[0];
  var cells = fromChat ? row.concat(chat) : row;
  var rows = (fromChat ? LEAD_HEADERS.concat(LEAD_CHAT_HEADERS) : LEAD_HEADERS).map(function (h, i) {
    return '<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">' + esc_(h) + '</th><td style="padding:4px 0">' + esc_(cells[i]) + '</td></tr>';
  }).join('');
  var ad = row[LEAD_HEADERS.indexOf('utm_content')];
  MailApp.sendEmail({
    to: LEAD_NOTIFY_EMAILS.join(','),
    subject: 'Lead tư vấn mới: ' + row[2] + ' – ' + row[3] + (ad ? ' (' + ad + ')' : ''),
    htmlBody: '<p style="font-family:Arial,sans-serif;font-size:14px">Người này để lại số điện thoại ' + (fromChat ? 'trong khung hỏi đáp với trợ lý AI ' : '') + 'để được tư vấn. Vui lòng gọi lại trong giờ làm việc.'
      + (fromChat ? ' Để đọc cả cuộc trò chuyện, lọc cột “Phiên” của tab “Hỏi đáp” theo mã ở dòng “Phiên trợ lý”.' : '') + '</p>'
      + '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' + rows + '</table>'
  });
}
