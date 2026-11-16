var LEDGER_OFFICE_EMAIL = 'vanphong@vienphuongnam.com.vn';
var LEDGER_ACCOUNT_NAME = 'VIEN PHAT TRIEN NGUON LUC XA HOI PHUONG NAM';
var LEDGER_ACCOUNT_NUMBER = '2242 6789';
var LEDGER_BANK = 'Ngân hàng Phương Đông (OCB), chi nhánh Tân Thuận';
var LEDGER_BANK_BIN = '970448';

// The label ends in the list price and the confirmed amount can differ, so show the name only.
function ledgerPack_(r) {
  return String(r['Gói đăng ký quan tâm'] || r['Mã gói'] || '').replace(/\s*\(.*$/, '');
}

function ledgerSend_(r, subject, html) {
  MailApp.sendEmail({
    to: clean_(r['Email']),
    replyTo: LEDGER_OFFICE_EMAIL,
    name: 'Viện Phương Nam',
    subject: subject,
    htmlBody: html
  });
}

// The receipt and its layout live in Code.gs (receiptHtml_). Throws when the send fails.
function sendConfirmation_(r, intake) {
  ledgerSend_(r, 'Viện Phương Nam đã nhận phiếu đăng ký – ' + r['Mã học viên'],
    receiptHtml_(r['Họ và chữ lót'] + ' ' + r['Tên'], intake.name, ledgerPack_(r), r['Mã học viên'], intake.deadline));
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
  var strong = function (text) { return '<strong>' + esc_(text) + '</strong>'; };
  ledgerSend_(r, 'Hướng dẫn chuyển khoản học phí – ' + code, learnerMailHtml_('Hướng dẫn chuyển khoản học phí',
    'Học phí đã được xác nhận: ' + esc_(money) + ' đồng. Thông tin chuyển khoản trong thư.', [
      mailText_('Kính chào anh/chị ' + esc_(clean_(r['Họ và chữ lót'] + ' ' + r['Tên'])) + ','),
      mailText_('Chuyên viên của Viện đã xác nhận học phí của anh/chị. Anh/chị vui lòng chuyển khoản theo thông tin dưới đây.'),
      mailFacts_([
        ['Mã học viên', strong(code)],
        ['Gói đã chọn', esc_(ledgerPack_(r))],
        format && ['Hình thức học', esc_(format)],
        ['Số tiền', strong(money + ' đồng')],
        ['Chủ tài khoản', strong(LEDGER_ACCOUNT_NAME)],
        ['Số tài khoản', strong(LEDGER_ACCOUNT_NUMBER)],
        ['Nơi mở tài khoản', esc_(LEDGER_BANK)],
        ['Nội dung chuyển khoản', strong(note)]
      ]),
      '<img src="' + esc_(vietQrUrl_(amount, note)) + '" alt="Mã VietQR chuyển khoản học phí" width="240" style="display:block;margin:0 0 6px">' +
        mailText_('Quét bằng ứng dụng ngân hàng để điền sẵn số tiền và nội dung.'),
      intake.deadline ? mailText_('Anh/chị vui lòng hoàn tất học phí trước ngày ' + mailDeadline_(intake.deadline) + '.') : '',
      mailText_('Viện sẽ gửi phiếu thu qua Zalo sau khi nhận được học phí.')
    ]));
}
