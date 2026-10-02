# Sản phẩm truyền thông: Chuỗi khóa học Phân tích định lượng với R (01/2027)

Cập nhật: 02/10/2026. Nguồn chữ: `assets/THÔNG BÁO_v.4_CHUỖI KHÓA NCKH (01.2027).docx` và outline 3 khóa (`assets/Outline khoá 1-3_v2`), chép sẵn trong `brand-kit/content.md`. Kế hoạch kênh và UTM: `../docs/marketing/campaign-plan-2026-10.md`.

**Phong cách đã chốt:** brand kit v2 "Data Lab", rút ra từ 3 poster Story đã duyệt ngày 02/10/2026 (`poster/export/story-*.png`). Nền xanh đậm, thông tin vẽ thành biểu đồ mà khóa học dạy, tiêu đề serif với chữ R trong lục giác, mã màu K1/K2/K3. Giấy chứng nhận và tài liệu in dùng chế độ nền sáng của cùng hệ.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `brand-kit/` | v2: phân tích, logo, màu, chữ, khối tiêu đề, hệ biểu đồ, nền; `tokens.css` (nguồn duy nhất); `content.md`; bảng nhận diện `brand-board.html` và `export/brand-board.png` |
| `design-kit/` | v2: khổ, lưới, thang chữ theo khổ, thư viện thành phần, công thức bố cục, chuyển động, sản xuất, checklist; sơ đồ khung `kit.html` và `export/kit.png` |
| `poster/` | 3 poster Story đã chốt; `ads/story.css`, `ads/story.js` (khối dùng chung), `ads/render.py`; asset tách nền `ads/assets/`; brief poster in A3/A2 và poster số |
| `standee/` | Standee 60×160 cm |
| `document-cover/` | Bìa tài liệu cho 3 khóa |
| `certificate/` | Giấy chứng nhận (nền sáng) |
| `backdrop/` | Backdrop phòng học, nền Zoom, màn chờ |
| `video/` | Video 15 giây, video từng khóa, video nhắc hạn, màn chờ lặp |
| `badge/` | Thẻ đeo học viên, giảng viên, Ban tổ chức |
| `email-banner/` | Ảnh đầu email cho 4 đợt gửi |

Mỗi thư mục ấn phẩm có `README.md`: mục đích, biến thể, bố cục theo công thức design kit v2, prompt Claude Design, việc cần Viện trả lời, tên file xuất.

## Lịch

Mốc cố định: ưu đãi sớm đến 08/12/2026; hạn chót 28/12/2026; khóa học 08/01 đến 17/01/2027.

| Đợt | Hạn duyệt | Sản phẩm | Trạng thái |
|---|---|---|---|
| 0 | 09/10/2026 | Brand kit, design kit, design system trong Claude Design | Brand kit và design kit v2 xong |
| 1 | 16/10/2026 | Poster Story ST1–ST3; email E1; poster số P2, P5 | ST1–ST3 đã chốt; E1, P2, P5 chưa dựng |
| 2 | 31/10/2026 | Poster in P1 (A3, A2), video V1, V2a–c | Chưa dựng |
| 3 | 25/11/2026 | Email E2, poster P4, video V3 (bản 08/12) | Chưa dựng |
| 4 | 15/12/2026 | Email E3, P4 và V3 (bản 28/12); standee S1; mẫu thẻ đeo; mẫu giấy chứng nhận | Chưa dựng |
| 5 | 31/12/2026 | Backdrop B1–B3, bìa tài liệu D1–D3, email E4, thẻ đeo theo danh sách, video V4 | Chưa dựng |
| 6 | 10/01, 13/01, 17/01/2027 | In giấy chứng nhận theo từng khóa | Chờ mẫu của Viện |

## Quy trình

**Cách 1, dựng bằng HTML như 3 poster đã chốt (khuyến nghị cho bản cuối):** chép một file `poster/ads/story-*.html`, đổi khổ và khối theo công thức design kit, xuất bằng `render.py` (PNG) hoặc in PDF khổ thật. Hình giống hệt poster vì dùng chung `story.css`, `story.js`.

**Cách 2, phác bằng Claude Design (claude.ai/design):**
1. Tạo design system **"VPN · Phân tích định lượng với R (v2 Data Lab)"**. Nạp: `brand-kit/README.md`, `brand-kit/tokens.css`, `design-kit/README.md`, `brand-kit/export/brand-board.png`, `design-kit/export/kit.png`, 3 poster `poster/export/story-*.png`, logo `brand-kit/logo/logo-color.png`, mã QR.
2. Kiểm tra nó đọc đúng: 4 font (Source Serif 4, Oswald, Montserrat, JetBrains Mono); nền #061a4d → #0c3f9e; K1 #5ad8ff, K2 #3f86ff, K3 #c3dbff; đỏ #c4231a chỉ cho ngày hạn chót; thông tin vẽ thành biểu đồ, không hộp trắng.
3. Dán prompt trong README của ấn phẩm; sửa bằng bình luận; đối chiếu chữ với `brand-kit/content.md` mỗi vòng.
4. Bản cuối: chuyển sang Claude Code dựng HTML khổ thật (cách 1) để đúng từng pixel với hệ. Video: storyboard ở Claude Design, dựng MP4 bằng HyperFrames.

Trước khi gửi duyệt: checklist `design-kit/README.md` mục 9.

## Cần Viện cung cấp hoặc quyết định

| # | Việc | Chặn sản phẩm |
|---|---|---|
| 1 | Logo vector (AI, SVG hoặc PDF) | standee, backdrop khổ lớn |
| 2 | Ảnh chính thức GS.TS. Nguyễn Văn Tuấn, TS. Trần Sơn Thạch và quyền dùng; ảnh, video lớp các khóa trước | video có giảng viên; poster có ảnh (bản hiện tại không cần) |
| 3 | Quét thử mã QR (`assets/Mã QR chuỗi PTDL R 01.27.png`), xác nhận đích đến; có cần mã riêng theo kênh để gắn UTM không | mọi ấn phẩm có QR |
| 4 | Mẫu giấy chứng nhận hiện hành, quy tắc số hiệu, người ký (7 câu trong `certificate/README.md`) | giấy chứng nhận |
| 5 | Kích thước tường phòng học, ảnh chụp phòng, cách treo | backdrop |
| 6 | Nhà in, chất liệu, số lượng, ngân sách; in thử bông màu nền xanh đậm và K1/K2/K3 | mọi bản in |
| 7 | Vỏ thẻ và dây đeo; có in đơn vị công tác không | thẻ đeo |
| 8 | Tài liệu in hay PDF, số trang, cách đóng | bìa tài liệu |
| 9 | Công cụ gửi email | email banner |
| 10 | Giờ học hằng ngày (thông báo v4 và outline không ghi) | standee S2, màn chờ, email E4 |
| 11 | Số thông báo: v4 để trống, outline ghi "số 10/2026/TB-VPN" | mọi văn bản có số thông báo |

## Trạng thái

| Sản phẩm | Trạng thái |
|---|---|
| Brand kit, design kit | v2, rút ra từ 3 poster đã chốt |
| Poster Story ST1, ST2, ST3 | Đã chốt; asset lộ trình tách nền đã xuất |
| Poster in P1, poster số P2, P4, P5 | Có công thức và prompt v2, chưa dựng |
| Standee, bìa, backdrop, video, thẻ đeo, email | Có công thức và prompt v2, chưa dựng |
| Giấy chứng nhận | Có công thức nền sáng, chờ mẫu hiện hành của Viện |
