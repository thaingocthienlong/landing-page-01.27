/**
 * The short "Đăng ký tư vấn" form the Meta ads point to (form_type 'tu_van'), and the
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
    // The staff tabs are a convenience copy: a failure there must not cost the lead (LeadTabs.gs).
    try { fillLeadTabs_(true, data, new Date()); } catch (ignore) {}
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
  var saved = appendLead_('Đăng ký', clean_(data.ho_lot) + ' ' + clean_(data.ten), data.phoneregister, data.package_id, '', data);
  try { fillLeadTabs_(false, data, new Date()); } catch (ignore) {}
  // The ledger (Ledger.gs), once deployed, sends its own receipt with the learner code.
  if (typeof ledgerIntake_ === 'function') return;
  try {
    sendReceipt_(data);
  } catch (err) {
    saved.sheet.getRange(saved.index, LEAD_HEADERS.length).setValue('Mới (chưa gửi được email xác nhận)');
  }
}

// The learner's receipt when the ledger is not deployed: the ledger's receipt minus the learner code.
function sendReceipt_(data) {
  var pack = clean_(data.package).replace(/\s*\(.*$/, '') || clean_(data.package_id);
  MailApp.sendEmail({
    to: clean_(data.emailcontact),
    replyTo: 'vanphong@vienphuongnam.com.vn',
    name: 'Viện Phương Nam',
    subject: 'Viện Phương Nam đã nhận phiếu đăng ký – Phân tích định lượng với R',
    htmlBody: receiptHtml_(clean_(data.ho_lot) + ' ' + clean_(data.ten),
      'Phân tích định lượng với R – Từ cơ bản đến chuyên sâu (01/2027)', pack, '', '28/12/2026')
  });
}

// Shared with the ledger (LedgerMail.gs). No bank details: staff confirm the amount first, so a wrong figure never reaches the learner.
function receiptHtml_(name, course, pack, code, deadline) {
  return learnerMailHtml_('Viện đã nhận phiếu đăng ký của anh/chị',
    'Chưa cần chuyển khoản. Chuyên viên sẽ liên hệ anh/chị qua Zalo để xác nhận số tiền.', [
      mailText_('Kính chào anh/chị ' + esc_(clean_(name)) + ','),
      mailText_('Cảm ơn anh/chị đã đăng ký. Thông tin trên phiếu:'),
      mailFacts_([
        ['Chuỗi khóa học', esc_(course)],
        ['Gói đã chọn', esc_(pack)],
        code && ['Mã học viên', '<strong>' + esc_(code) + '</strong>']
      ]),
      mailSteps_('Các bước tiếp theo', [
        'Ms. Vy hoặc Ms. Thảo sẽ liên hệ anh/chị qua Zalo trong khoảng 1 ngày làm việc. Nếu không tìm thấy Zalo của anh/chị, Viện sẽ gửi email.',
        'Anh/chị vui lòng chờ chuyên viên xác nhận số tiền, rồi mới chuyển khoản.',
        'Hoàn tất học phí' + (deadline ? ' trước ngày ' + mailDeadline_(deadline) : '') + ' để có tên trong danh sách lớp. Phiếu đăng ký này chưa giữ chỗ.'
      ])
    ]);
}

var COURSE_URL = 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/';
// [label, shown text, link] in the contact band of every learner email.
var LEARNER_CONTACTS = [
  ['Văn phòng Viện', '(028) 2242 6789', 'tel:02822426789'],
  ['Ms. Vy (SĐT/Zalo)', '0949 761 636', 'tel:0949761636'],
  ['Ms. Thảo (SĐT/Zalo)', '0912 114 511', 'tel:0912114511'],
  ['Email', 'vanphong@vienphuongnam.com.vn', 'mailto:vanphong@vienphuongnam.com.vn']
];
// Not Georgia: it lacks precomposed Vietnamese letters (ế, ồ) and stacks the accents beside them.
var MAIL_SERIF = "font-family:'Source Serif 4',Cambria,'Times New Roman',Times,serif;";

// Every learner email, styled like the course page (DESIGN.md): logo and institute name over a 2px ink rule, serif title,
// the caller's blocks, sign-off, the cobalt contact band. Blocks are HTML: callers pass every learner value through esc_.
// Tables and inline styles only, because Gmail and Outlook drop most CSS.
function learnerMailHtml_(title, preview, blocks) {
  var contacts = LEARNER_CONTACTS.map(function (c, i) {
    // The whole row is the link, so the tap target is the row (about 60px), not the 22px number.
    return '<tr><td style="' + (i ? 'border-top:1px solid #3a63a7;' : '') + '">' +
      '<a href="' + c[2] + '" style="display:block;padding:10px 0;color:#ffffff;text-decoration:none">' +
      '<span style="display:block;font-size:14px;color:#cfe0ff">' + c[0] + '</span>' +
      '<span style="font-size:17px;font-weight:600;text-decoration:underline;word-break:break-word">' + c[1] + '</span></a></td></tr>';
  }).join('');
  return '<div style="display:none;max-height:0;overflow:hidden">' + preview + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb"><tr><td align="center" style="padding:16px 8px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #cbd4e1;' +
      "font-family:'Source Sans 3','Segoe UI',Arial,sans-serif;font-size:17px;line-height:1.6;color:#0d1b2a\">" +
    '<tr><td style="padding:24px 24px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
      '<td width="52" style="vertical-align:middle"><img src="' + COURSE_URL + 'logo.png" width="52" height="50" alt="" style="display:block"></td>' +
      '<td style="padding-left:12px;vertical-align:middle;' + MAIL_SERIF + 'font-size:15px;font-weight:600;line-height:1.3;text-transform:uppercase">' +
      'Viện phát triển nguồn lực xã hội Phương Nam</td></tr></table></td></tr>' +
    '<tr><td style="padding:16px 24px 0"><div style="border-top:2px solid #0d1b2a"></div></td></tr>' +
    '<tr><td style="padding:24px 24px 4px"><h1 style="margin:0;' + MAIL_SERIF + 'font-size:26px;line-height:1.2;font-weight:600">' + title + '</h1></td></tr>' +
    '<tr><td style="padding:12px 24px 0">' + blocks.join('') + mailText_('Trân trọng,<br>Viện Phương Nam') + '</td></tr>' +
    '<tr><td style="padding:12px 24px 16px;background:#0a3d91;color:#ffffff">' +
      '<p style="margin:12px 0 4px;' + MAIL_SERIF + 'font-size:19px;font-weight:600">Cần hỏi thêm, anh/chị liên hệ Viện</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + contacts + '</table></td></tr>' +
    '</table>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px"><tr>' +
      "<td style=\"padding:16px 24px;font-family:'Source Sans 3','Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.5;color:#566780\">" +
      'Thư gửi tự động từ <a href="' + COURSE_URL + '" style="color:#0a3d91">trang khóa học</a> của Viện. Trả lời thư này để liên hệ văn phòng Viện.</td></tr></table>' +
    '</td></tr></table>';
}

function mailText_(html) {
  return '<p style="margin:0 0 16px">' + html + '</p>';
}

// Booktabs, as on the course page: 2px ink rules above and below, hairlines between rows. Falsy rows are skipped.
function mailFacts_(rows) {
  var kept = rows.filter(Boolean);
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;border-top:2px solid #0d1b2a;border-bottom:2px solid #0d1b2a">' +
    kept.map(function (r, i) {
      var line = i ? 'border-top:1px solid #cbd4e1;' : '';
      return '<tr><th align="left" width="38%" style="padding:10px 12px 10px 0;vertical-align:top;' + line +
        'font-size:13px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#566780">' + r[0] + '</th>' +
        '<td style="padding:10px 0;vertical-align:top;' + line + '">' + r[1] + '</td></tr>';
    }).join('') + '</table>';
}

function mailSteps_(heading, steps) {
  return '<p style="margin:0 0 12px;' + MAIL_SERIF + 'font-size:19px;font-weight:600">' + heading + '</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">' +
    steps.map(function (html, i) {
      return '<tr><td width="40" style="vertical-align:top;padding:0 0 14px">' +
        '<div style="width:28px;height:28px;line-height:28px;border-radius:50%;background:#0a3d91;color:#ffffff;text-align:center;' +
        MAIL_SERIF + 'font-size:15px;font-weight:600">' + (i + 1) + '</div></td>' +
        '<td style="vertical-align:top;padding:1px 0 14px">' + html + '</td></tr>';
    }).join('') + '</table>';
}

// Signal red marks only the deadline, as on the course page.
function mailDeadline_(date) {
  return '<strong style="color:#c4231a">' + esc_(date) + '</strong>';
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
    htmlBody: '<p style="font-family:Arial,sans-serif;font-size:14px">Người này để lại số điện thoại để được tư vấn. Vui lòng gọi lại trong giờ làm việc.</p>'
      + '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' + rows + '</table>'
  });
}
