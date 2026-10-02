# Giấy chứng nhận

Trạng thái: chưa bắt đầu, **chờ mẫu hiện hành của Viện**. Ưu tiên: 4 (mẫu duyệt trước 05/01/2027; in sau từng khóa: 10/01, 13/01, 17/01/2027).

## Mục đích

Cấp cho học viên hoàn thành từng khóa. Đây là văn bản có chữ ký và dấu của Viện, nên phần pháp lý (tiêu đề, số hiệu, điều kiện cấp, người ký) theo quy định của Viện. Thiết kế ở đây chỉ lo bố cục và nhận diện, không tự đặt nội dung pháp lý.

## Câu hỏi phải có trả lời trước khi dựng

1. Viện đã có mẫu giấy chứng nhận dùng cho các khóa trước chưa? Nếu có: gửi file, ta chỉ đổi phần khóa học và giữ khung pháp lý.
2. Cấp theo khóa (3 loại) hay theo gói (một giấy ghi các khóa đã học)?
3. Quy tắc số hiệu (ví dụ có số vào sổ không, định dạng ra sao). Không tự đặt.
4. Có Quốc hiệu, tiêu ngữ không (thông báo có, giấy chứng nhận của Viện có thể không).
5. Ghi những trường nào: họ tên, ngày sinh, đơn vị, hình thức học (trực tiếp/trực tuyến), số giờ?
6. Học viên online nhận bản in gửi bưu điện hay PDF có chữ ký số?
7. Người ký: Viện trưởng Nguyễn Thị Xuân Vy (theo thông báo)? Có thêm chữ ký giảng viên không?

## Bố cục đề xuất (A4 ngang, khối J)

1. Trên trái: logo + "LIÊN HIỆP CÁC HỘI KHOA HỌC VÀ KỸ THUẬT VIỆT NAM / VIỆN PHÁT TRIỂN NGUỒN LỰC XÃ HỘI PHƯƠNG NAM". Trên phải: số hiệu (để trống theo quy tắc Viện).
2. Giữa: "GIẤY CHỨNG NHẬN" serif 600, đường kẻ đậm dưới.
3. "Chứng nhận Ông/Bà" rồi họ tên học viên, serif 600 cỡ 32–36 pt, cobalt.
4. Các dòng trường dữ liệu theo trả lời câu 5.
5. "Đã hoàn thành khóa học" + tên khóa serif 20 pt + "thuộc chuỗi khóa học Phân tích định lượng với R – Từ cơ bản đến chuyên sâu" + thời gian khóa.
6. Dưới phải: "TP. Hồ Chí Minh, ngày ... tháng 01 năm 2027", "VIỆN TRƯỞNG", vùng chữ ký và dấu (cao khoảng 35 mm), "Nguyễn Thị Xuân Vy".
7. Viền: một đường kẻ đậm ink cách mép 10 mm và một đường mảnh hair bên trong. Không hoa văn, không ruy băng, không huy chương.

Không dùng mảng cobalt lớn: giấy chứng nhận in trên giấy mỹ thuật, mảng màu lớn dễ loang và lấn chữ ký. Cobalt chỉ ở họ tên và một dải mảnh dưới đáy.

## Ghép dữ liệu

Họ tên lấy từ Google Sheet đăng ký (cột họ, tên đã tách). Cách làm đề xuất: template HTML trong `certificate/template/` dùng `../brand-kit/tokens.css`, script đọc CSV xuất từ Sheet, in mỗi người một trang PDF khổ thật bằng Chrome headless. Dựng khi mẫu đã duyệt. Kiểm tra họ tên dài nhất trong danh sách vẫn nằm trên một dòng, dấu tiếng Việt đúng.

## Prompt Claude Design (khi đã có câu trả lời)

```
Dùng design system "VPN · Phân tích định lượng với R". Thiết kế giấy chứng nhận A4 ngang (297×210 mm, tràn lề 3 mm, vùng an toàn 15 mm), trang trọng, in trên giấy mỹ thuật trắng. Viền: đường kẻ đậm #0d1b2a cách mép 10 mm, đường mảnh #cbd4e1 bên trong. Không hoa văn, không huy chương, không gradient ngoài logo, không mảng màu lớn.

Chữ:
- Trên trái, logo + sans 700 in hoa 9 pt: LIÊN HIỆP CÁC HỘI KHOA HỌC VÀ KỸ THUẬT VIỆT NAM / VIỆN PHÁT TRIỂN NGUỒN LỰC XÃ HỘI PHƯƠNG NAM
- Trên phải: Số: [để trống]
- GIẤY CHỨNG NHẬN (serif 600, 40 pt)
- Chứng nhận Ông/Bà
- [HỌ VÀ TÊN HỌC VIÊN] (serif 600, 34 pt, cobalt #0a3d91; mẫu thử dùng chuỗi giữ chỗ "Họ Tên Mẫu Có Dấu Đầy Đủ Ữ Ặ" để kiểm tra chiều rộng và dấu)
- Đã hoàn thành khóa học
- Phân tích dữ liệu với R cơ bản (serif 600, 20 pt)
- thuộc chuỗi khóa học Phân tích định lượng với R – Từ cơ bản đến chuyên sâu
- Thời gian: từ ngày 08/01/2027 đến ngày 10/01/2027
- Dưới phải: TP. Hồ Chí Minh, ngày ... tháng 01 năm 2027 / VIỆN TRƯỞNG / [vùng chữ ký và dấu cao 35 mm] / Nguyễn Thị Xuân Vy
```

Chuỗi giữ chỗ chỉ để thử chiều rộng và dấu; bản in lấy họ tên từ danh sách.

## Xuất

`certificate/export/`: mẫu duyệt `C1-mau.pdf`, `C2-mau.pdf`, `C3-mau.pdf`; bản ghép dữ liệu đặt ngoài repo (chứa dữ liệu cá nhân học viên, không commit).
