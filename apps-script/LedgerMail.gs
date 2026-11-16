var LEDGER_OFFICE_EMAIL = 'vanphong@vienphuongnam.com.vn';

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

// The only email the ledger sends; payment details come from the advisers on Zalo.
// The receipt and its layout live in Code.gs (receiptHtml_). Throws when the send fails.
function sendConfirmation_(r, intake) {
  ledgerSend_(r, 'Viện Phương Nam đã nhận phiếu đăng ký – ' + r['Mã học viên'],
    receiptHtml_(r['Họ và chữ lót'] + ' ' + r['Tên'], intake.name, ledgerPack_(r), r['Mã học viên'], intake.deadline));
}
