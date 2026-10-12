var LEDGER_OFFICE_EMAIL = 'vanphong@vienphuongnam.com.vn';
var LEDGER_CONTACT = '(028) 2242 6789; 0949 761 636 (Ms. Vy); 0912 114 511 (Ms. Thảo); ' + LEDGER_OFFICE_EMAIL;

// No bank details or QR: staff confirm the amount first, so a wrong figure never reaches the learner. Throws when the send fails.
function sendConfirmation_(r, intake) {
  var p = function (html) { return '<p style="margin:0 0 12px">' + html + '</p>'; };
  var before = intake.deadline ? ' trước ngày ' + esc_(intake.deadline) : '';
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#222">' +
    p('Kính chào anh/chị ' + esc_(r['Họ và chữ lót'] + ' ' + r['Tên']) + ',') +
    p('Viện Phương Nam đã nhận phiếu đăng ký của anh/chị cho chuỗi khóa học ' + esc_(intake.name) + '.') +
    p('Mã học viên: <strong>' + esc_(r['Mã học viên']) + '</strong><br>Gói đã chọn: ' + esc_(r['Gói đăng ký quan tâm'])) +
    p('Ms. Vy hoặc Ms. Thảo sẽ liên hệ anh/chị qua Zalo trong khoảng 1 ngày làm việc. Nếu không tìm thấy Zalo của anh/chị, Viện sẽ gửi email.') +
    p('Anh/chị vui lòng chờ chuyên viên xác nhận số tiền, rồi mới chuyển khoản.') +
    p('Phiếu đăng ký này chưa giữ chỗ. Tên anh/chị có trong danh sách lớp khi đã hoàn tất học phí' + before + '.') +
    p('Cần hỏi thêm, anh/chị liên hệ Viện: ' + esc_(LEDGER_CONTACT) + '.') +
    p('Trân trọng,<br>Viện Phương Nam') +
    '</div>';
  MailApp.sendEmail({
    to: r['Email'],
    replyTo: LEDGER_OFFICE_EMAIL,
    name: 'Viện Phương Nam',
    subject: 'Viện Phương Nam đã nhận phiếu đăng ký – ' + r['Mã học viên'],
    htmlBody: html
  });
}
