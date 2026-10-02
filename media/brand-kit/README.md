# Brand kit: Phân tích định lượng với R (01/2027)

Bộ nhận diện cho mọi sản phẩm truyền thông của chuỗi khóa học. Kế thừa hệ thiết kế của landing page (`DESIGN.md`, ý tưởng "The Manuscript": trang bản thảo tạp chí khoa học) và chuyển sang in ấn, video, email.

| File | Nội dung |
|---|---|
| `README.md` | Quy tắc logo, màu, chữ, giọng văn |
| `content.md` | Chữ chuẩn lấy từ thông báo v4: ngày, khóa, gói, học phí, ưu đãi, liên hệ |
| `tokens.css` | Biến màu, font, cỡ chữ in cho template HTML và Claude Design |
| `brand-board.html` | Bảng nhận diện một trang để duyệt và để nạp vào Claude Design |
| `logo/logo-color.png` | Logo màu, đã cắt sát, nền trong suốt, 2000 px |
| `logo/logo-reverse-white-DRAFT.png` | Logo trắng cho nền cobalt hoặc ink. **Bản nháp tự dựng, chờ Viện duyệt** |

Logo gốc: `assets/Logo VPN.png` (4501 px, nền trong suốt) và `assets/Logo VPN - Nền trắng.png`.

## 1. Ý tưởng

Mỗi sản phẩm trông như một trang trong bài báo khoa học: chữ có chân cho tiêu đề và con số, đường kẻ thay cho khung hộp, hình có chú thích đánh số. Hình ảnh chủ đạo là biểu đồ học viên sẽ tự làm được sau khóa học (đường hồi quy với dải tin cậy, mặt phẳng chi phí - hiệu quả, chuỗi thời gian có dự báo), không phải ảnh stock.

Ba nguyên tắc từ landing page giữ nguyên khi in:
1. **Thông báo là sự thật.** Chữ lấy từ `content.md`.
2. **Một mảng cobalt trên mỗi mặt.** Cobalt là mảng nền chứa bằng chứng (biểu đồ, khối thông tin chính), không dùng làm viền trang trí.
3. **Đỏ là chỉ dẫn.** Màu đỏ signal chỉ dành cho hai mốc 08/12/2026 và 28/12/2026.

## 2. Logo

- Dùng bản đầy đủ (dấu PN có mũ tốt nghiệp + PHUONG NAM INSTITUTE). Không tách chữ khỏi dấu, không xoay, không đổi màu gradient, không thêm bóng hay viền.
- Gradient xanh trong logo là nhận diện sẵn có của Viện, được phép tồn tại **chỉ trong logo**. Bố cục xung quanh không lặp lại gradient đó.
- Nền cho logo màu: trắng (`--paper`) hoặc plate tint (`--plate`). Trên nền cobalt hoặc ink dùng bản trắng; bản trắng hiện là nháp, cần Viện xác nhận có bản đơn sắc chính thức hay không.
- Vùng an toàn: khoảng trống mỗi cạnh tối thiểu bằng chiều cao chữ "PHUONG NAM" trong logo (khoảng 1/10 chiều rộng logo).
- Cỡ tối thiểu: in 25 mm chiều rộng; màn hình 120 px chiều rộng. Nhỏ hơn thì chữ INSTITUTE không đọc được.
- Đi kèm logo trên sản phẩm trang trọng (giấy chứng nhận, bìa tài liệu): dòng cơ quan chủ quản và tên đầy đủ của Viện, xem `content.md`.
- Khổ lớn (standee, backdrop): file PNG 4501 px đủ cho logo rộng tới khoảng 38 cm ở 300 dpi, 76 cm ở 150 dpi. Lớn hơn cần file vector (AI, SVG hoặc PDF) từ Viện.

## 3. Màu

Giá trị RGB lấy từ `DESIGN.md`. Tỷ lệ tương phản đo bằng `contrast-check.py` của antislop.

| Token | HEX | Vai trò | Cặp chữ/nền đã đo |
|---|---|---|---|
| `paper` | #ffffff | Nền chính | ink trên paper 17.39:1 |
| `plate` | #f3f6fb | Nền phụ xen kẽ | ink-3 trên plate 5.31:1 |
| `ink` | #0d1b2a | Chữ, đường kẻ đậm, mảng nền tối (dải chân trang, nền video) | paper trên ink 17.39:1 |
| `ink-2` | #3a4a5f | Chữ phụ | trên plate 8.34:1 |
| `ink-3` | #566780 | Nhãn, chú thích | trên paper 5.76:1 |
| `hair` | #cbd4e1 | Đường kẻ mảnh giữa các dòng | chỉ là đường, không dùng cho chữ |
| `field` | #7f93b0 | Viền ô, viền khung chờ ảnh | 3.13:1, không dùng cho chữ |
| `cobalt` | #0a3d91 | Mảng nhận diện duy nhất | paper trên cobalt 10.05:1; cobalt-tint trên cobalt 7.54:1 |
| `cobalt-deep` | #072c6b | Chữ trên nút sáng đặt trên nền cobalt | |
| `cobalt-wash` | #eaf0fb | Nền ô được chọn, dòng làm nổi trong bảng | |
| `cobalt-tint` | #cfe0ff | Chữ phụ trên nền cobalt | |
| `signal` | #c4231a | Hai mốc hạn | trên paper 5.83:1 |

In ấn: chưa có thông số CMYK hay Pantone chính thức. Gửi nhà in giá trị HEX, nhờ họ chuyển theo profile máy in và **in thử một bông màu cobalt và signal** trước khi in hàng loạt. Cobalt dễ bị in ra tím hoặc xỉn trên hiflex (backdrop) và decal; duyệt bông màu theo từng chất liệu.

Không dùng: gradient trang trí, nền cyan của logo làm mảng lớn, màu tím, màu neon, đỏ cho trang trí hay cho tiêu đề.

## 4. Chữ

| Vai trò | Font | Dùng cho |
|---|---|---|
| Serif | Source Serif 4 (600, nghiêng 600 cho cụm nhấn) | Tên chuỗi khóa, tiêu đề, con số (ngày, học phí), tên giảng viên, tên học viên trên giấy chứng nhận |
| Sans | Source Sans 3 (400, 600, 700) | Đoạn văn, nhãn, bảng, thông tin liên hệ, phụ đề video |

Cả hai font miễn phí (giấy phép SIL OFL), có đủ dấu tiếng Việt, tải từ Google Fonts. Gửi nhà in file PDF đã nhúng font hoặc chuyển chữ thành đường nét (outline).

Quy tắc:
- Số dùng dạng chữ số đều (tabular) trong bảng và lịch.
- Nhãn in hoa (sans 700, giãn 0.07em) chỉ cho tên cột bảng và nhãn mục. Không in hoa cả đoạn.
- Cụm nhấn trong tiêu đề: serif nghiêng, màu cobalt (trên nền trắng) hoặc cobalt-tint (trên nền cobalt).
- Kiểm tra dấu: "ữ, ặ, ộ, ỹ" phải đúng font, không rơi về font dự phòng.
- Cỡ chữ theo khổ: xem `../design-kit/README.md`.

## 5. Giọng văn

Viết như chú thích hình trong bài báo: rõ, có số, chính xác.

| Nên | Không nên |
|---|---|
| "Từ 08/01 đến 17/01/2027, học trực tiếp tại TP. Hồ Chí Minh hoặc qua Zoom" | "Cơ hội vàng không thể bỏ lỡ" |
| "Hoàn tất học phí trước 08/12/2026: giảm 10%" | "Ưu đãi cực sốc, số lượng có hạn" (không có nguồn về giới hạn chỗ) |
| "Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy" | "Chuyên gia hàng đầu thế giới" (thông báo không dùng cụm này) |
| "Không cần biết lập trình trước" (đã duyệt trong kế hoạch quảng cáo) | "Thành thạo R chỉ sau 3 ngày" (hứa kết quả) |

Thuật ngữ cố định: Chuỗi khóa học; Gói đăng ký; Học phí/học viên; học trực tiếp (offline); trực tuyến (online) qua Zoom; GS.TS. Nguyễn Văn Tuấn; TS. Trần Sơn Thạch; Viện Phương Nam.

Định dạng: ngày `dd/mm/yyyy`; tiền `8.800.000 đồng` (chỗ chật có thể viết `8.800.000đ`); điện thoại `(028) 2242 6789`, `0949 761 636`.

Không dùng gạch dài (em dash) trong chữ trên sản phẩm. Dùng dấu phẩy, hai chấm hoặc gạch ngang ngắn như thông báo.

## 6. Hình ảnh

- Hình chủ đạo: biểu đồ vẽ từ dữ liệu mô phỏng theo bộ ba hình của landing page (Hình 1 hồi quy, Hình 2 mặt phẳng chi phí - hiệu quả, Hình 3 chuỗi thời gian và dự báo). Mã vẽ trong `dist/app.js`. Mọi biểu đồ ghi rõ "Dữ liệu minh họa, không phải kết quả nghiên cứu." (chú thích đầy đủ: `../design-kit/README.md` mục 5).
- Ảnh người: chỉ ảnh chính thức do Viện cung cấp (giảng viên, lớp học thật của Viện). Chưa có thì để khung chờ có ghi chữ, không thay bằng ảnh stock hay ảnh AI.
- Biểu tượng: hạn chế. Nếu cần (điện thoại, địa điểm, lịch) dùng nét đều, góc vuông, màu ink.
- Không dùng: nền hạt liên kết, khối tam giác bay, kính mờ, khối 3D, minh họa nhân vật.
