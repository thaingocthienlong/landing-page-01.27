# Poster

Trạng thái: đã dựng ST1 (Story quảng cáo); các biến thể khác chưa bắt đầu. Ưu tiên: 1 (cần cho giai đoạn ưu đãi sớm, đến 08/12/2026).

## Mục đích

- **Poster in A3/A2:** dán tại Viện, gửi khoa, bệnh viện, trường đại học, phòng đào tạo sau đại học.
- **Poster số:** đăng fanpage, nhóm Zalo, Instagram; card quảng cáo Meta khi chưa có ảnh thật (kế hoạch truyền thông mục 5).
- **Ảnh chia sẻ 1200×630:** thay `logo.png` trong thẻ `og:image` của landing page (kế hoạch truyền thông mục 7 đang thiếu).

## Biến thể

| Mã | Khổ | Nội dung |
|---|---|---|
| P1 | A3 dọc, có bản A2 phóng tỷ lệ | Chuỗi đầy đủ: 3 khóa, giảng viên, mốc hạn, gói từ 3.500.000 đồng, liên hệ, QR |
| P2 | 1080×1350 | Chuỗi đầy đủ, rút gọn chữ |
| P3a, P3b, P3c | 1080×1350 | Mỗi khóa một tấm, dùng Hình 1, 2, 3 tương ứng |
| P4 | 1080×1080 | Nhắc mốc: bản giai đoạn 1 "Trước 08/12/2026 giảm 10%", bản giai đoạn 2 "Hạn chót 28/12/2026" |
| ST1 | 1080×1920 (Story Instagram/Facebook) | **Đã dựng.** Quảng cáo dạng "mọi thông tin là một biểu đồ": lộ trình 3 khóa trên đường hồi quy, 6 gói là biểu đồ cột chồng theo số ngày, ưu đãi là đồ thị nút, mốc thời gian là trục có ngắt. `ads/story-khoa-goi-uu-dai.html` |
| ST2 | 1080×1920 (Story/Reel) | **Đã dựng.** 3 khóa · lịch học · hình thức: mỗi khóa một hình nhỏ (hồi quy, mặt phẳng chi phí - hiệu quả, dự báo) và 3 nội dung chính từ outline; lịch Gantt 08–17/01/2027 theo ngày và số buổi; sơ đồ Trực tiếp hoặc Trực tuyến; phần mềm và máy tính cá nhân. `ads/story-khoa-hoc-lich-hoc.html` |
| ST3 | 1080×1920 (Story/Reel) | **Đã dựng.** Gói · học phí · ưu đãi · hạn chót: chú giải K1/K2/K3, biểu đồ cột chồng 6 gói, 3 nút ưu đãi, trục thời gian 08/12 · 28/12 · 08/01, nộp học phí tiền mặt hoặc chuyển khoản. `ads/story-goi-hoc-phi-uu-dai.html` |
| P5 | 1200×630 | Ảnh chia sẻ link: khối A, B, ngày tổ chức. Không chữ nhỏ |

## Bố cục P1 (khối theo `../design-kit/README.md`)

1. Trên: A (logo + Viện Phương Nam), nhãn của B.
2. Thân trái (4 cột): B, dòng "Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy", thông tin chung (thời gian, hình thức, địa điểm).
3. Thân phải (2 cột) hoặc nửa dưới: G với Hình 1, là mảng cobalt duy nhất.
4. C: bảng 3 khóa.
5. D: hai giảng viên, chữ, chờ ảnh.
6. E: hai mốc hạn.
7. Đáy: F + H.

Bảng 6 gói không đưa lên poster: quá dày ở A3. Ghi "6 gói đăng ký, học phí từ 3.500.000 đồng/học viên" kèm QR.

## Prompt Claude Design (P1)

```
Dùng design system "VPN · Phân tích định lượng với R". Thiết kế poster A3 dọc (297×420 mm, tràn lề 3 mm, vùng an toàn 15 mm) cho chuỗi khóa học. Phong cách: một trang bản thảo tạp chí khoa học, nền trắng, đường kẻ đậm 2 px mở đầu khối, đường mảnh giữa các dòng, không đóng khung hộp, không bóng đổ, không gradient ngoài logo.

Chữ (giữ nguyên, không viết lại):
- Nhãn: CHUỖI KHÓA HỌC · 01/2027
- Tiêu đề: Phân tích định lượng với R
- Dòng phụ (serif nghiêng, cobalt): Từ cơ bản đến chuyên sâu
- Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy, cùng TS. Trần Sơn Thạch
- Từ ngày 08/01/2027 đến ngày 17/01/2027
- Học trực tiếp (offline) tại Viện Phương Nam, 45 Đinh Tiên Hoàng, Phường Sài Gòn, TP. Hồ Chí Minh, hoặc trực tuyến (online) qua Zoom
- Bảng: 1 | Phân tích dữ liệu với R cơ bản | 03 ngày | Từ 08/01 đến 10/01/2027 ; 2 | Phân tích chi phí - hiệu quả trong y tế | 02 ngày | Ngày 12/01 và 13/01/2027 ; 3 | Phân tích dữ liệu chuỗi thời gian | 03 ngày | Từ 15/01 đến 17/01/2027
- 6 gói đăng ký, học phí từ 3.500.000 đồng/học viên
- Trước 08/12/2026: giảm 10% (ngày màu đỏ #c4231a)
- Hạn chót đăng ký và hoàn tất học phí: 28/12/2026 (ngày màu đỏ #c4231a)
- Dải chân nền #0d1b2a: (028) 2242 6789 · 0949 761 636 (Ms. Vy) · 0912 114 511 (Ms. Thảo) · www.vienphuongnam.com.vn, ô QR trắng bên phải ghi "Quét để đăng ký"

Mảng cobalt #0a3d91 duy nhất chứa biểu đồ trắng: điểm phân tán, đường hồi quy, dải tin cậy 95% (dùng file SVG đính kèm nếu có), chú thích: "Hình 1. Hồi quy tuyến tính: đường phù hợp và khoảng tin cậy 95% trên 48 điểm dữ liệu mô phỏng. Dữ liệu minh họa, không phải kết quả nghiên cứu."

Chỗ ảnh giảng viên: để khung chờ viền #7f93b0, ghi "Ảnh chính thức do Viện cung cấp". Không ảnh stock, không minh họa nhân vật, không số liệu học viên. Font Source Serif 4 cho tiêu đề và con số, Source Sans 3 cho chữ thân. Thân chữ không nhỏ hơn 14 pt.
```

Biến thể số: đổi dòng đầu thành khổ tương ứng, bỏ bảng ở P4, P5; P3 thay bảng bằng một khóa và hình tương ứng.

## ST1: Story quảng cáo

**Ý tưởng:** mọi khối thông tin được vẽ thành một loại đồ thị mà chuỗi khóa dạy, trên cùng một nền xanh đậm kiểu phòng thí nghiệm dữ liệu, không dùng ô trắng dán lên nền (góp ý ngày 02/10/2026: bản trước trông như nền và ô thông tin chồng lên nhau, thiếu tính khoa học, công nghệ, ngôn ngữ R, mô hình đồ thị).

- **Lộ trình 3 khóa:** đường hồi quy đi lên với dải tin cậy và điểm dữ liệu mô phỏng; 3 khóa là 3 điểm mốc trên đường, có đường gióng xuống trục và nhãn tên khóa, ngày học. Theo yêu cầu ngày 02/10/2026, poster bỏ các chú thích phụ ("dữ liệu minh họa", "độ dài = số ngày học", "kích thước nút = mức giảm", nhãn trục, `lm(y ~ x)`); các điểm chỉ là hình nền của đồ thị, không trình bày như kết quả nghiên cứu.
- **6 gói:** biểu đồ cột chồng nằm ngang; mỗi đoạn là một khóa (K1, K2, K3), độ dài đúng số ngày (8, 5, 6, 5, 2, 3); học phí canh phải.
- **Ưu đãi:** đồ thị nút nối bằng một trục dọc; diện tích nút theo mức giảm (5%, 10%, vòng nét đứt tới 15% cho học viên cũ).
- **Khối cuối:** trục thời gian có ngắt trục (08/12/2026 hạn ưu đãi 10%, 28/12/2026 hạn chót trên pill trắng chữ đỏ, 08/01/2027 khai giảng) và số Ms. Vy, Ms. Thảo bên trái; mã QR đăng ký bên phải (`assets/Mã QR chuỗi PTDL R 01.27.png`, hiển thị 228 px trên nền trắng có vùng yên tĩnh 22 px), chữ "Quét mã để đăng ký".
- **Chất R:** nhãn mục viết như comment R (`# 6 gói đăng ký`), chữ R trong hình lục giác như sticker gói R.
- **Mã màu K1/K2/K3** (cyan #5ad8ff, xanh #3f86ff, xanh băng #c3dbff) dùng chung cho điểm mốc, nhãn khóa và các đoạn cột.
- **Khung theo poster đã duyệt:** dải đầu có logo trong khung tròn trắng và tên Viện (một dòng, bỏ dòng Liên hiệp hội theo yêu cầu); dải chân trắng có icon điện thoại, địa chỉ, website.
- **Lưới:** lề hai bên 70 px; cột gói và chữ ưu đãi cùng bắt đầu ở x = 186; vòng nút lớn nhất chạm lề trái.

Font (góp ý 02/10/2026: cần nhiều font hơn, uyển chuyển như landing page): Source Serif 4 cho tiêu đề "Phân tích định lượng với R", cụm in nghiêng "từ cơ bản đến chuyên sâu" (giống hero landing page) và tên khóa; Oswald cho số, ngày, nhãn K1/K2/K3 và tên gói; Montserrat cho chữ thân; JetBrains Mono cho chữ kiểu code R. Cả bốn có bộ dấu tiếng Việt.

Nền (góp ý: nền còn đơn giản): lưới chấm kiểu giấy vẽ đồ thị mờ dần từ góc trên phải và góc dưới trái; cụm lục giác như sticker gói R ở góc trên phải; hai dòng code R chạy dọc hai lề, chỉ dùng hàm và gói có trong outline (ggplot2, t.test, chisq.test, lm, glm, công thức ICER, forecast, auto.arima); hai vệt sáng nhẹ.

Chi tiết đã sửa: logo thu nhỏ để cả khối nằm gọn trong khung tròn; chữ R đặt theo chiều cao thật của chữ hoa Oswald (68 px ở cỡ 86 px) nên tâm chữ trùng tâm lục giác; icon trong vòng tròn được căn giữa (trước đó bị quy tắc `.fact span` ghi đè `display: grid`). Hình khối, biểu đồ và icon tự vẽ bằng SVG/CSS trong file; điểm dữ liệu sinh từ seed cố định nên mỗi lần xuất ra cùng một hình. Không có ảnh vì chưa có ảnh chính thức.

**Bố cục dọc:** dải đầu 0–124 px, nội dung 124–1824 px, dải chân 1824–1920 px. Khi chạy dạng quảng cáo Story trả phí, nút CTA của Meta phủ khoảng 250 px dưới cùng, tức phủ dải chân và phần dưới của mã QR. Nếu chạy quảng cáo trả phí, nên làm thêm bản đẩy khối cuối lên trên.

**Mã QR:** chưa giải mã được trên máy để kiểm tra đích đến (không có thư viện đọc QR). Quét thử bằng hai điện thoại trước khi đăng, xác nhận ra đúng trang đăng ký.

**Tương phản** (đo trên ảnh render, vì bộ dò tự động tính sai nền nhiều lớp): chữ trắng, xanh nhạt, cyan trên nền xanh đậm từ 5.12:1 trở lên; chữ trên các đoạn cột dùng xanh đen #06205a / #041a4a (từ 4.85:1); chữ trắng trên tâm nút ưu đãi 4.37:1 (chữ lớn đậm); ngày 28/12/2026 đỏ signal trên pill trắng 5.83:1.

## ST2, ST3: cùng hệ với ST1

Ba poster dùng chung `ads/story.css` (màu, chữ, các khối) và `ads/story.js` (biểu đồ lộ trình và 3 hình nhỏ theo khóa, dữ liệu mô phỏng có seed cố định). Sửa một khối ở `story.css` là sửa cho cả ba; sau khi tách file chung, ST1 render lại trùng từng pixel với bản đã duyệt.

- **ST2** lấy nội dung từ outline đã duyệt (`assets/Outline khoá 1-3_v2`): mục tiêu từng khóa, số buổi (6, 4, 6), "Không cần kinh nghiệm lập trình" (Khóa 1), mang theo máy tính cá nhân và hướng dẫn cài đặt gửi trước khai giảng. Không in giờ học hằng ngày vì thông báo v4 và outline không ghi. Ngày 11 và 14/01 không có buổi học, in màu #9fb4da.
- **ST3** không in số tài khoản (chỉ "tiền mặt hoặc chuyển khoản"), theo quy tắc trong `../brand-kit/content.md`.
- Khung QR của ST2 nhỏ hơn (252 px) để vừa chiều cao; ST1 và ST3 giữ 272 px.

**Xuất lại** sau khi sửa chữ trong file HTML:

```bash
cd media/poster/ads && python render.py
```

`render.py` mở từng file bằng Chrome, chờ font, kiểm tra khung đúng `data-size` (1080×1920) và nội dung không tràn, rồi ghi PNG đúng khổ vào `export/`. Ngày, gói, học phí, ưu đãi lấy từ `../brand-kit/content.md`.

## Cần từ Viện

- Mã QR: Viện đã cung cấp `assets/Mã QR chuỗi PTDL R 01.27.png` (dùng trên ST1). Cần xác nhận đích đến và có gắn UTM hay không; nếu cần UTM theo kênh (`utm_source=poster&utm_medium=print&utm_campaign=r-01-2027`), phải tạo mã riêng cho từng kênh.
- Ảnh giảng viên chính thức và quyền dùng.
- Số lượng in, nhà in.

## Xuất

`poster/export/`: `P1-A3.pdf` (CMYK do nhà in chuyển, có tràn lề), `P1-A2.pdf`, `P2.png`, `P3a.png`...`P5.png` (sRGB). Sau khi có P5: thay `og:image`, `twitter:image` trong `dist/index.html`.
