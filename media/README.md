# Sản phẩm truyền thông: Chuỗi khóa học Phân tích định lượng với R (01/2027)

Ngày lập: 02/10/2026. Nguồn chữ: `assets/THÔNG BÁO_v.4_CHUỖI KHÓA NCKH (01.2027).docx`, chép sẵn trong `brand-kit/content.md`. Kế hoạch kênh và UTM: `../docs/marketing/campaign-plan-2026-10.md`.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `brand-kit/` | Logo, màu, chữ, giọng văn, nội dung chuẩn, token CSS, bảng nhận diện |
| `design-kit/` | Khổ, lề, thang chữ theo khổ, lưới, 10 khối dùng chung (A đến J), checklist xuất file |
| `poster/` | Poster in A3/A2, poster số, ảnh chia sẻ link 1200×630 |
| `standee/` | Standee 60×160 cm |
| `document-cover/` | Bìa tài liệu cho 3 khóa |
| `certificate/` | Giấy chứng nhận hoàn thành khóa |
| `backdrop/` | Backdrop phòng học, nền Zoom, màn chờ |
| `video/` | Video 15 giây, video từng khóa, video nhắc hạn, màn chờ lặp |
| `badge/` | Thẻ đeo học viên, giảng viên, Ban tổ chức |
| `email-banner/` | Ảnh đầu email cho 4 đợt gửi |

Mỗi thư mục sản phẩm có `README.md` gồm: mục đích, biến thể, bố cục theo khối, prompt Claude Design, việc cần Viện trả lời, tên file xuất. File xuất đặt trong `<sản phẩm>/export/`.

## Lịch

Mốc cố định: ưu đãi sớm đến 08/12/2026; hạn chót 28/12/2026; khóa học 08/01 đến 17/01/2027.

| Đợt | Hạn duyệt | Sản phẩm | Lý do thứ tự |
|---|---|---|---|
| 0 | 09/10/2026 | Brand kit, design kit, design system trong Claude Design | Mọi sản phẩm sau dùng chung |
| 1 | 16/10/2026 | Email E1, poster số P2, P5 (ảnh chia sẻ), P3a–c | Chạy giai đoạn ưu đãi sớm; P5 thay ảnh chia sẻ đang thiếu trên landing page |
| 2 | 31/10/2026 | Poster in P1 (A3, A2), video V1, V2a–c | In và phát tới đơn vị; Meta cần video trước tháng 11 |
| 3 | 25/11/2026 | Email E2, poster P4, video V3 (bản 08/12) | Gửi khoảng 01/12 |
| 4 | 15/12/2026 | Email E3, P4 và V3 (bản 28/12); standee S1; mẫu thẻ đeo; mẫu giấy chứng nhận | Standee đặt trước hạn chót; mẫu cần Viện duyệt sớm |
| 5 | 31/12/2026 | Backdrop B1–B3, bìa tài liệu D1–D3, email E4, thẻ đeo in theo danh sách, video V4 | Danh sách học viên chốt sau 28/12; in xong trước 07/01/2027 |
| 6 | 10/01, 13/01, 17/01/2027 | In giấy chứng nhận theo từng khóa | Cấp cuối mỗi khóa |

## Quy trình với Claude Design

Claude Design (claude.ai/design) dựng thiết kế từ prompt, đọc được codebase và file đính kèm để tạo design system dùng chung cho mọi dự án, cho sửa bằng bình luận và chỉnh trực tiếp, xuất PDF, PPTX, HTML, gửi sang Canva hoặc chuyển cho Claude Code. Kiểm tra lại các lựa chọn xuất trong ứng dụng vì sản phẩm còn đang cập nhật.

**Bước 1: tạo design system (một lần).**
1. Tạo design system tên **"VPN · Phân tích định lượng với R"**.
2. Nạp: repo này (hoặc tải lên `DESIGN.md`, `media/brand-kit/README.md`, `media/brand-kit/tokens.css`, `media/design-kit/README.md`), logo `media/brand-kit/logo/logo-color.png`, ảnh chụp `media/brand-kit/brand-board.html`, ảnh chụp landing page.
3. Kiểm tra Claude Design đọc đúng: 2 font Source Serif 4 và Source Sans 3; màu cobalt #0a3d91, ink #0d1b2a, signal #c4231a; bo góc 2 px; không bóng đổ. Sửa ngay nếu nó tự thêm gradient hoặc góc bo tròn.

**Bước 2: từng sản phẩm.**
1. Mở dự án mới trong design system trên, dán prompt trong `README.md` của sản phẩm.
2. Đính kèm SVG biểu đồ (design kit mục 5) để hình thống nhất.
3. Sửa bằng bình luận. Mỗi vòng, đối chiếu chữ với `brand-kit/content.md`.
4. Chạy checklist `design-kit/README.md` mục 6 trước khi gửi duyệt.

**Bước 3: xuất.**
- Sản phẩm số (poster số, email, nền Zoom): xuất PNG ở 2x.
- Sản phẩm in: xuất PDF, rồi kiểm tra khổ thật và tràn lề. Nếu bản xuất thiếu tràn lề hoặc sai khổ, chuyển cho Claude Code dựng HTML khổ thật (mm) với `tokens.css` và in PDF bằng Chrome headless. Nhà in chuyển CMYK và in thử bông màu.
- Video: Claude Design làm storyboard; dựng MP4 bằng HyperFrames (xem `video/README.md`).
- Thẻ đeo, giấy chứng nhận: Claude Design làm mẫu; ghép danh sách bằng template HTML (xem README từng sản phẩm).

## Cần Viện cung cấp hoặc quyết định

| # | Việc | Chặn sản phẩm |
|---|---|---|
| 1 | Logo vector (AI, SVG hoặc PDF) và bản logo trắng/đơn sắc chính thức | standee, backdrop; mọi bản trên nền tối |
| 2 | Ảnh chính thức GS.TS. Nguyễn Văn Tuấn, TS. Trần Sơn Thạch và quyền dùng; ảnh, video lớp các khóa trước | poster, standee, video (có thể chạy bản không ảnh trước) |
| 3 | Đích của mã QR: trang đăng ký trong thông báo hay landing page | poster in, standee |
| 4 | Mẫu giấy chứng nhận hiện hành, quy tắc số hiệu, người ký (7 câu trong `certificate/README.md`) | giấy chứng nhận |
| 5 | Kích thước tường phòng học, ảnh chụp phòng, cách treo | backdrop |
| 6 | Nhà in, chất liệu, số lượng, ngân sách in | mọi bản in |
| 7 | Vỏ thẻ và dây đeo; có in đơn vị công tác không | thẻ đeo |
| 8 | Tài liệu in hay PDF, số trang, cách đóng | bìa tài liệu |
| 9 | Công cụ gửi email | email banner |
| 10 | Giờ học: xác nhận 08:30–12:00, 13:30–17:00, ngày đầu 08:00 (thông báo v4 không ghi) | standee S2, màn chờ, email E4 |

## Trạng thái

| Sản phẩm | Trạng thái |
|---|---|
| Brand kit | Bản đầu, chờ Viện duyệt (logo trắng là nháp) |
| Design kit | Bản đầu, chờ chốt khổ với nhà in |
| Poster, standee, bìa, backdrop, video, thẻ đeo, email | Có brief và prompt, chưa dựng |
| Giấy chứng nhận | Có brief, chờ mẫu hiện hành của Viện |
