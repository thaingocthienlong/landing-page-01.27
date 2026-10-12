var LEDGER_OFFICE_EMAIL = 'vanphong@vienphuongnam.com.vn';
var LEDGER_CONTACT = '(028) 2242 6789; 0949 761 636 (Ms. Vy); 0912 114 511 (Ms. Thảo); ' + LEDGER_OFFICE_EMAIL;
var LEDGER_ACCOUNT_NAME = 'VIEN PHAT TRIEN NGUON LUC XA HOI PHUONG NAM';
var LEDGER_ACCOUNT_NUMBER = '2242 6789';
var LEDGER_BANK = 'Ngân hàng Phương Đông (OCB), chi nhánh Tân Thuận';
var LEDGER_BANK_BIN = '970448';

// The label ends in the list price and the confirmed amount can differ, so show the name only.
function ledgerPack_(r) {
  return String(r['Gói đăng ký quan tâm'] || r['Mã gói'] || '').replace(/\s*\(.*$/, '');
}

function ledgerSend_(r, subject, paragraphs) {
  MailApp.sendEmail({
    to: clean_(r['Email']),
    replyTo: LEDGER_OFFICE_EMAIL,
    name: 'Viện Phương Nam',
    subject: subject,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#222">' +
      paragraphs.map(function (html) { return '<p style="margin:0 0 12px">' + html + '</p>'; }).join('') + '</div>'
  });
}

// No bank details or QR: staff confirm the amount first, so a wrong figure never reaches the learner. Throws when the send fails.
function sendConfirmation_(r, intake) {
  var before = intake.deadline ? ' trước ngày ' + esc_(intake.deadline) : '';
  ledgerSend_(r, 'Viện Phương Nam đã nhận phiếu đăng ký – ' + r['Mã học viên'], [
    'Kính chào anh/chị ' + esc_(r['Họ và chữ lót'] + ' ' + r['Tên']) + ',',
    'Viện Phương Nam đã nhận phiếu đăng ký của anh/chị cho chuỗi khóa học ' + esc_(intake.name) + '.',
    'Mã học viên: <strong>' + esc_(r['Mã học viên']) + '</strong><br>Gói đã chọn: ' + esc_(ledgerPack_(r)),
    'Ms. Vy hoặc Ms. Thảo sẽ liên hệ anh/chị qua Zalo trong khoảng 1 ngày làm việc. Nếu không tìm thấy Zalo của anh/chị, Viện sẽ gửi email.',
    'Anh/chị vui lòng chờ chuyên viên xác nhận số tiền, rồi mới chuyển khoản.',
    'Phiếu đăng ký này chưa giữ chỗ. Tên anh/chị có trong danh sách lớp khi đã hoàn tất học phí' + before + '.',
    'Cần hỏi thêm, anh/chị liên hệ Viện: ' + esc_(LEDGER_CONTACT) + '.',
    'Trân trọng,<br>Viện Phương Nam'
  ]);
}

// The QR carries only the amount, the transfer note and the account name, never anything about the learner.
function vietQrUrl_(amount, note) {
  return 'https://img.vietqr.io/image/' + LEDGER_BANK_BIN + '-' + LEDGER_ACCOUNT_NUMBER.replace(/\s/g, '') + '-compact2.png' +
    '?amount=' + amount + '&addInfo=' + encodeURIComponent(note) + '&accountName=' + encodeURIComponent(LEDGER_ACCOUNT_NAME);
}

// Sent only after staff set the amount and choose Chờ CK. Throws when the send fails.
function sendPaymentEmail_(r, intake) {
  var amount = parseAmount_(r['Số tiền phải đóng']);
  if (!amount) throw new Error('Thiếu hoặc sai Số tiền phải đóng');
  var code = clean_(r['Mã học viên']);
  var note = transferNote_(code, r['Mã gói']);
  var money = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  var format = clean_(r['Hình thức']);
  var by = intake.deadline ? ['Anh/chị vui lòng hoàn tất học phí trước ngày ' + esc_(intake.deadline) + '.'] : [];
  ledgerSend_(r, 'Hướng dẫn chuyển khoản học phí – ' + code, [
    'Kính chào anh/chị ' + esc_(clean_(r['Họ và chữ lót'] + ' ' + r['Tên'])) + ',',
    'Chuyên viên của Viện đã xác nhận học phí của anh/chị. Anh/chị vui lòng chuyển khoản theo thông tin dưới đây.',
    'Mã học viên: <strong>' + esc_(code) + '</strong><br>Gói đã chọn: ' + esc_(ledgerPack_(r)) + (format ? '<br>Hình thức học: ' + esc_(format) : ''),
    'Số tiền: <strong>' + esc_(money) + ' đồng</strong><br>' +
      'Chủ tài khoản: <strong>' + esc_(LEDGER_ACCOUNT_NAME) + '</strong><br>' +
      'Số tài khoản: <strong>' + esc_(LEDGER_ACCOUNT_NUMBER) + '</strong><br>' +
      'Nơi mở tài khoản: ' + esc_(LEDGER_BANK) + '<br>' +
      'Nội dung chuyển khoản: <strong>' + esc_(note) + '</strong>',
    '<img src="' + esc_(vietQrUrl_(amount, note)) + '" alt="Mã VietQR chuyển khoản học phí" width="240" style="display:block;margin:0 0 6px"> ' +
      'Quét bằng ứng dụng ngân hàng để điền sẵn số tiền và nội dung.'
  ].concat(by, [
    'Viện sẽ gửi phiếu thu qua Zalo sau khi nhận được học phí.',
    'Cần hỏi thêm, anh/chị liên hệ Viện: ' + esc_(LEDGER_CONTACT),
    'Trân trọng,<br>Viện Phương Nam'
  ]));
}
