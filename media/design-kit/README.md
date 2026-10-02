# Design kit: khổ, lưới và thành phần dùng chung

Áp dụng `../brand-kit/`. File này trả lời: mỗi khổ cần lề bao nhiêu, chữ cỡ nào, và tám sản phẩm lắp từ những khối nào.

## 1. Khổ và thông số kỹ thuật

Kích thước khổ lớn là đề xuất phổ biến; chốt với nhà in và với không gian thật tại 45 Đinh Tiên Hoàng trước khi dựng.

| Sản phẩm | Khổ thành phẩm | Tràn lề | Vùng an toàn | Độ phân giải ở khổ thật | Màu |
|---|---|---|---|---|---|
| Poster in | A3 297×420 mm; A2 420×594 mm | 3 mm | 15 mm (A3), 20 mm (A2) | 300 dpi | CMYK do nhà in chuyển |
| Poster số | 1080×1350 px (4:5), 1080×1080 px, 1200×630 px (ảnh chia sẻ link) | | 60 px | 2x khi xuất | sRGB |
| Standee | 60×160 cm hoặc 80×200 cm (cuốn hoặc chữ X) | theo nhà in | 5 cm mỗi cạnh; chừa 15 cm đáy cho chân đế | 100–150 dpi | CMYK |
| Bìa tài liệu | A4 210×297 mm, 3 bìa (mỗi khóa một bìa) | 3 mm | 12 mm | 300 dpi | CMYK |
| Giấy chứng nhận | A4 ngang 297×210 mm | 3 mm | 15 mm | 300 dpi | CMYK; bản PDF cho học viên online: sRGB |
| Backdrop | 3×2 m hoặc 4×2,5 m (chờ đo tường) | theo nhà in | 10 cm; nội dung chính ở 1/2 trên | 72–100 dpi | CMYK, duyệt bông màu hiflex |
| Nền Zoom | 1920×1080 px | | giữ trống 1/3 giữa cho người | | sRGB |
| Video | 1920×1080 (16:9), 1080×1920 (9:16) | | vùng an toàn chữ 10% mỗi cạnh; 9:16 chừa 15% dưới cho giao diện app | 30 fps | sRGB |
| Thẻ đeo | 90×130 mm dọc, đục lỗ dây phía trên | 3 mm | 6 mm; tránh 15 mm trên cùng (lỗ đục) | 300 dpi | CMYK |
| Email banner | rộng 600 px hiển thị, xuất 1200 px (2x); cao 200–300 px | | 24 px | dưới 200 KB | sRGB |

## 2. Thang chữ theo khổ

Cỡ tính theo khoảng cách xem. Cột "Thân" là cỡ nhỏ nhất cho chữ cần đọc; chú thích không nhỏ hơn cột "Tối thiểu".

| Khổ | Tên chuỗi (serif 600) | Tiêu đề mục (serif 600) | Thân (sans 400) | Tối thiểu | Khoảng cách xem |
|---|---|---|---|---|---|
| A4 (bìa, chứng nhận, tài liệu) | 40–54 pt | 18–24 pt | 11 pt | 8 pt | 40 cm |
| A3 poster | 64–80 pt | 28–32 pt | 14 pt | 10 pt | 1 m |
| A2 poster | 90–110 pt | 40 pt | 20 pt | 14 pt | 1,5 m |
| Thẻ đeo 90×130 | 14–16 pt | | họ tên 24–28 pt (serif) | 8 pt | 1 m |
| Standee 60×160 | 140–180 pt | 60 pt | 36 pt | 28 pt | 2–3 m |
| Backdrop 3×2 m | 300–400 pt | 120 pt | 72 pt | 60 pt | 4–8 m |
| Poster số 1080×1350 | 72–96 px | 40 px | 28 px | 22 px | điện thoại |
| Email banner 1200 px | 56–64 px | | 28 px | 24 px | điện thoại |
| Video 1920×1080 | 96–120 px | 56 px | 40 px (phụ đề) | 32 px | màn hình |

Dòng 1.1–1.15 cho tiêu đề serif, 1.4–1.5 cho chữ thân trên khổ in (thấp hơn 1.65 của web vì đọc ít dòng).

## 3. Lưới

- **Khổ dọc (poster, standee, bìa, thẻ đeo):** 6 cột, rãnh bằng 1/2 vùng an toàn. Khối tiêu đề chiếm 6 cột; khối thông tin chia 4 + 2 hoặc 3 + 3.
- **Khổ ngang (chứng nhận, backdrop, video 16:9, email):** 12 cột. Tỷ lệ lấy từ landing page: 7/5 (nội dung trái, biểu đồ phải) hoặc 4/8.
- **Nhịp dọc:** đường kẻ đậm 2 px (in: 0,75 pt; khổ lớn: tăng theo tỷ lệ chữ) mở đầu mỗi khối; đường mảnh hair giữa các dòng; không đóng khung hộp quanh khối.
- **Biên dưới cố định:** mọi sản phẩm in có dải liên hệ ở đáy (xem khối F).

## 4. Thành phần dùng chung

Mỗi khối có tên mã để gọi trong prompt Claude Design và trong brief từng sản phẩm.

| Mã | Khối | Thành phần | Dùng ở |
|---|---|---|---|
| A | Nhận diện | Logo màu (hoặc trắng trên nền tối) + "Viện Phương Nam"; bản trang trọng thêm dòng cơ quan chủ quản và tên đầy đủ | tất cả |
| B | Tên chuỗi | Nhãn "CHUỖI KHÓA HỌC · 01/2027", dòng chính serif "Phân tích định lượng với R", dòng phụ serif nghiêng cobalt "Từ cơ bản đến chuyên sâu" | tất cả trừ thẻ đeo (thu gọn) |
| C | Lộ trình 3 khóa | Bảng booktabs: STT, tên khóa (serif), thời lượng, ngày (số đều). Dòng khóa đang nói tới có nền cobalt-wash | poster, standee, video, email, bìa |
| D | Giảng viên | Tên (serif 600), đơn vị (sans), 1–2 dòng giới thiệu từ `content.md`; khung chờ ảnh viền field, ghi "Ảnh chính thức do Viện cung cấp" | poster, standee, video, backdrop |
| E | Mốc hạn | Hai dòng: "Trước 08/12/2026 · giảm 10%" và "Hạn chót 28/12/2026"; giá trị ngày màu signal | poster, standee, email, video |
| F | Dải liên hệ | Nền ink, chữ paper: điện thoại, địa chỉ, website; ô QR bên phải | poster, standee, backdrop, bìa (bản rút gọn) |
| G | Mảng hình | Mảng cobalt chứa một biểu đồ trắng (Hình 1, 2 hoặc 3) + chú thích theo mục 5 | poster, standee, backdrop, video, email, bìa |
| H | Ô QR | Vuông, nền trắng, viền trắng tối thiểu 4 ô mã; cạnh tối thiểu 20 mm (A3), 40 mm (standee); chữ dưới ô ghi đích đến | poster, standee, backdrop |
| I | Dải vai trò | Dải ngang đầy chiều rộng: Học viên (paper + đường kẻ cobalt), Giảng viên (cobalt), Ban tổ chức (ink) | thẻ đeo |
| J | Khối chứng nhận | Tiêu đề "GIẤY CHỨNG NHẬN", họ tên học viên serif lớn, tên khóa, thời gian, hình thức, nơi ký, chữ ký, dấu, số hiệu | giấy chứng nhận |

Không dùng thành phần nào ngoài bảng này khi chưa thêm vào đây. Thêm khối mới: ghi mã, thành phần, nơi dùng.

## 5. Ba biểu đồ nhận diện

| Hình | Khóa | Nội dung vẽ | Chú thích (chép từ `dist/app.js`) |
|---|---|---|---|
| Hình 1 | Khóa 1 | Điểm phân tán, đường hồi quy, khoảng tin cậy 95% | "Hình 1. Hồi quy tuyến tính: đường phù hợp và khoảng tin cậy 95% trên 48 điểm dữ liệu mô phỏng. Dữ liệu minh họa, không phải kết quả nghiên cứu." |
| Hình 2 | Khóa 2 | Mặt phẳng chi phí - hiệu quả, ICER, ngưỡng sẵn lòng chi trả | "Hình 2. Mặt phẳng chi phí - hiệu quả: 260 lần mô phỏng, ICER và ngưỡng sẵn lòng chi trả. Dữ liệu minh họa, không phải kết quả nghiên cứu." |
| Hình 3 | Khóa 3 | 60 tháng huấn luyện, 12 tháng dự báo, dải dự báo 80% | "Hình 3. Dự báo chuỗi thời gian: 60 tháng huấn luyện, 12 tháng ngoài mẫu, dải dự báo 80%. Dữ liệu minh họa, không phải kết quả nghiên cứu." |

Khổ nhỏ (thẻ, banner, khung video ngắn) được rút chú thích còn "Hình n. Dữ liệu minh họa, không phải kết quả nghiên cứu." Không bỏ vế sau.

Xuất SVG từ landing page (mở trang, lưu phần tử `<svg>` của từng hình) để dùng chung cho in và video, thay vì để Claude Design vẽ lại mỗi lần một kiểu.

## 6. Kiểm tra trước khi xuất

- [ ] Ngày, học phí, ưu đãi, liên hệ khớp `content.md` từng chữ
- [ ] Màu đỏ chỉ ở hai mốc hạn
- [ ] Một mảng cobalt trên mỗi mặt
- [ ] Biểu đồ có chú thích "Dữ liệu minh họa, không phải kết quả nghiên cứu."
- [ ] Không ảnh stock, không số liệu học viên, không quà tặng sách, không mã khóa, không số thông báo tự điền
- [ ] Dấu tiếng Việt đúng font; không gạch dài
- [ ] Chữ không nhỏ hơn cột "Tối thiểu"; tương phản theo bảng màu đã đo
- [ ] File in: đúng khổ, có tràn lề, font nhúng hoặc outline, ảnh đủ dpi
- [ ] QR quét thử bằng hai điện thoại, ra đúng trang có tham số UTM
