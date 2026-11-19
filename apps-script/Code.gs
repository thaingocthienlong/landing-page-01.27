/**
 * Receives registrations from the landing page form, appends them to the
 * bound Google Sheet and emails a notification.
 *
 * Setup: open the Sheet > Extensions > Apps Script, paste this file, run
 * setup() once and authorize, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). Put the /exec URL in the
 * data-endpoint attribute of #consultation-form in dist/index.html.
 * Requests with action 'chat' go to the learner-care chat in Chat.gs, any other action to BotApi.gs.
 */

var SHEET_NAME = 'Đăng ký';
// Extra recipients besides the account that owns this script.
var NOTIFY_EMAILS = ['vanphong@vienphuongnam.com.vn'];
var MIN_SECONDS_TO_FILL = 3;

var HEADERS = [
  'Thời gian', 'Mã gói', 'Gói đăng ký quan tâm', 'Họ và chữ lót', 'Tên', 'Email', 'Số điện thoại',
  'Giới tính', 'Ngày sinh', 'Tỉnh/Thành phố', 'Vị trí công tác', 'Đơn vị công tác',
  'Biết đến qua', 'Ghi rõ (Khác)', 'Đồng ý', 'Trang gửi', 'Trạng thái',
  'Mã học viên', 'Đợt', 'Kênh', 'Hình thức', 'Số tiền phải đóng', 'Ngày đóng', 'Phụ trách', 'Ghi chú'
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
  // The short consult form for the ads has its own tab and lock (Leads.gs).
  if (data.form_type === 'tu_van') return handleConsult_(data);
  // Every other action is the bot's read-only API (BotApi.gs); it skips the lock, and registration payloads carry no action.
  if (data.action) return handleBotApi_(data);

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

    var sheet = getSheet_();
    if (sheet.getLastRow() === 0) setup();
    var last = sheet.getLastRow();
    var next = last + 1;

    // An unmigrated or odd ledger tab leaves the code blank instead of costing the learner the registration.
    var intake = null;
    var code = '';
    try {
      intake = ledgerIntake_(clean_(data.dot));
      // A blank prefix would number every intake from 001.
      if (intake && !intake.prefix) intake = null;
      if (intake) {
        var taken = last > 1 ? sheet.getRange(2, ledgerCol_('Mã học viên'), last - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
        code = nextLearnerCode_(taken, intake.prefix);
      }
    } catch (err) {
      intake = null;
    }

    var row = [
      new Date(), data.package_id, data.package, data.ho_lot, data.ten, data.emailcontact, data.phoneregister,
      data.gioi_tinh, data.ngay_sinh, data.tinh_thanh, data.vi_tri, data.don_vi,
      data.biet_qua, data.biet_qua_other || '', 'Có', data.page, 'Mới',
      code, intake ? intake.dot : '', channelFromPage_(data.page), ledgerFormat_(data.hinh_thuc_hoc), '', '', '', ''
    ].map(clean_);
    row[0] = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');

    // A new tab has 1000 rows; writing past the grid throws.
    if (next > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 1);
    var cells = sheet.getRange(next, 1, 1, row.length).setNumberFormat('@');
    try {
      cells.setValues([row]);
    } catch (err) {
      // A "Hình thức" dropdown that staff changed refuses the form's value: the registration matters more than that cell.
      row[HEADERS.indexOf('Hình thức')] = '';
      cells.setValues([row]);
    }

    cache.put(key, '1', 600);
    // Ad attribution is a copy for marketing: losing it must not fail a saved registration.
    try { logRegistrationLead_(data, row); } catch (ignore) {}

    // The row is saved and cached: a mail or journal failure must not become an error the learner retries.
    var note = function (c, event, detail) { try { journal_(c, event, detail); } catch (ignore) {} };
    var reason = function (err) { return String((err && err.message) || err).slice(0, 200); };
    try {
      notify_(data, row);
    } catch (err) {
      note(code, 'lỗi email', 'thông báo Viện: ' + reason(err));
    }
    if (!intake) {
      note('', 'lỗi đợt', clean_(data.dot));
    } else {
      note(code, 'đăng ký', data.package_id);
      var why = '';
      try {
        sendConfirmation_(ledgerRow_(sheet, next), intake);
      } catch (err) {
        why = reason(err);
      }
      note(code, why ? 'lỗi email' : 'email xác nhận', why);
    }
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

// The learner's receipt and the email layout live here, not in Leads.gs or LedgerMail.gs: both send the receipt, and only
// Code.gs is in every install (the ledger setup does not add Leads.gs). r is the registration keyed by the Đăng ký headers.
// Throws when the send fails.
function sendReceipt_(r, course) {
  MailApp.sendEmail({
    to: clean_(r['Email']),
    replyTo: 'vanphong@vienphuongnam.com.vn',
    name: 'Viện Phương Nam',
    subject: 'Phiếu xác nhận đăng ký khóa học ' + course,
    htmlBody: receiptHtml_(r, course)
  });
}

// Everything the learner filled in, so they can check it. No price, bank details or learner code: the advisers confirm
// the amount with the learner on Zalo.
function receiptHtml_(r, course) {
  var text = function (header) { return esc_(clean_(r[header])); };
  var name = esc_([clean_(r['Họ và chữ lót']), clean_(r['Tên'])].filter(Boolean).join(' '));
  var other = clean_(r['Ghi rõ (Khác)']);
  var facts = [
    ['Khóa học', esc_(course)],
    // The label ends in the list price and the confirmed amount can differ, so show the package name only.
    ['Gói đăng ký', esc_(clean_(r['Gói đăng ký quan tâm'] || r['Mã gói']).replace(/\s*\(.*$/, ''))],
    ['Hình thức học', text('Hình thức')],
    ['Họ và tên', name],
    ['Email', text('Email')],
    ['Số điện thoại', text('Số điện thoại')],
    ['Giới tính', text('Giới tính')],
    ['Ngày sinh', text('Ngày sinh')],
    ['Tỉnh/Thành phố', text('Tỉnh/Thành phố')],
    ['Vị trí công tác', text('Vị trí công tác')],
    ['Đơn vị công tác', text('Đơn vị công tác')],
    ['Biết đến qua', text('Biết đến qua') + (other ? ' (' + esc_(other) + ')' : '')]
  ].filter(function (f) { return f[1]; });
  return learnerMailHtml_('Phiếu xác nhận đăng ký thông tin tư vấn/tham gia khóa học',
    'Viện Phương Nam (Ms. Vy/Ms. Thảo) sẽ liên hệ anh/chị qua Zalo/điện thoại.', [
      mailText_('Kính chào anh/chị ' + name + ','),
      mailText_('Cảm ơn anh/chị đã đăng ký. Thông tin anh/chị đã điền:'),
      mailFacts_(facts),
      '<p style="margin:0 0 8px;' + MAIL_SERIF + 'font-size:19px;font-weight:600">Bước tiếp theo</p>' +
        mailText_('Viện Phương Nam (Ms. Vy/Ms. Thảo) sẽ liên hệ anh/chị qua Zalo/điện thoại để tư vấn các thông tin về khóa học và hướng dẫn các bước tiếp theo.'),
      mailText_('Viện Phương Nam cam kết bảo mật tuyệt đối thông tin cá nhân của quý anh/chị và chỉ sử dụng thông tin nhận được để phục vụ cho việc quản lý khoá học.')
    ]);
}

var COURSE_URL = 'https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/';
// [label, shown text, link] in the contact band of every learner email.
var LEARNER_CONTACTS = [
  ['Văn phòng Viện Phương Nam', '(028) 2242 6789', 'tel:02822426789'],
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
      '<p style="margin:12px 0 4px;' + MAIL_SERIF + 'font-size:19px;font-weight:600">Cần hỏi thêm, anh/chị liên hệ Viện Phương Nam</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + contacts + '</table></td></tr>' +
    '</table>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px"><tr>' +
      "<td style=\"padding:16px 24px;font-family:'Source Sans 3','Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.5;color:#566780\">" +
      'Thư gửi tự động từ <a href="' + COURSE_URL + '" style="color:#0a3d91">trang khóa học</a> của Viện Phương Nam. Trả lời thư này để liên hệ văn phòng Viện Phương Nam.</td></tr></table>' +
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
