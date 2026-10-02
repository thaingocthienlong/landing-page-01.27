# Video truyền thông

Trạng thái: chưa bắt đầu. Ưu tiên: 2 (bản 15 giây trước 01/11/2026 để chạy Meta; bản nhắc hạn trước 01/12/2026).

## Mục đích

Quảng cáo Meta (Reels, Stories, Feed), đăng fanpage, Zalo, chiếu màn chờ tại Viện. Phần lớn người xem tắt tiếng, nên mọi thông tin phải có trên hình.

## Nguyên liệu

Hiện chỉ có chữ, logo và ba biểu đồ. Chưa có ảnh hay video giảng viên, lớp học. Vì vậy bản đầu là **motion graphics từ chữ và biểu đồ**: biểu đồ tự vẽ dần (điểm hiện, đường hồi quy kéo, dải tin cậy mờ dần) như trên landing page. Nếu Viện gửi video GS.TS. Nguyễn Văn Tuấn nói 10–15 giây, thêm một bản có giảng viên.

## Biến thể

| Mã | Khổ | Dài | Nội dung |
|---|---|---|---|
| V1 | 1080×1920 và 1920×1080 | 15 s | Chuỗi khóa, giảng viên, ngày, mốc ưu đãi |
| V2a, V2b, V2c | 1080×1920 | 15 s | Mỗi khóa một video với hình của khóa |
| V3 | 1080×1920 | 10 s | Nhắc hạn: bản 08/12 và bản 28/12 |
| V4 | 1920×1080 | 30 s, lặp | Màn chờ chiếu tại Viện trong tuần học |

## Kịch bản V1 (15 giây)

| Giây | Hình | Chữ trên hình |
|---|---|---|
| 0–2 | Nền trắng, đường kẻ đậm kéo ngang, logo hiện | CHUỖI KHÓA HỌC · 01/2027 |
| 2–6 | Tiêu đề serif hiện theo dòng; mảng cobalt trượt vào, Hình 1 tự vẽ | Phân tích định lượng với R / Từ cơ bản đến chuyên sâu |
| 6–9 | Bảng 3 khóa hiện từng dòng | R cơ bản 08–10/01 · Chi phí - hiệu quả 12–13/01 · Chuỗi thời gian 15–17/01 |
| 9–12 | Tên giảng viên | Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy / Offline tại TP.HCM hoặc Zoom |
| 12–15 | Mốc đỏ, logo, liên hệ | Trước 08/12/2026: giảm 10% / (028) 2242 6789 |

Chú thích nhỏ dưới biểu đồ suốt cảnh 2–6: "Dữ liệu minh họa, không phải kết quả nghiên cứu."

Chuyển động: một kiểu ease (`cubic-bezier(0.16, 1, 0.3, 1)` như landing page), không nảy, không xoay, không hạt bay. Nhạc nền: chỉ nhạc có giấy phép dùng thương mại; ghi nguồn trong `video/NGUON-NHAC.md` khi chọn.

## Cách làm

1. **Claude Design:** dựng khung hình chính (storyboard) cho từng cảnh ở khổ 9:16 và 16:9, duyệt bố cục và chữ.
2. **Dựng video:** chuyển storyboard đã duyệt sang HyperFrames (HTML thành MP4, có sẵn skill trong môi trường Claude Code này), vì Claude Design không xuất video. Biểu đồ dùng lại logic vẽ trong `dist/app.js`.
3. Xuất MP4 H.264, 30 fps, dưới 30 MB cho Meta; kiểm tra trên điện thoại với vùng an toàn 9:16 (chừa 15% dưới cho nút và chú thích của app).

## Prompt Claude Design (storyboard V1)

```
Dùng design system "VPN · Phân tích định lượng với R". Dựng storyboard 5 khung hình 1080×1920 cho video 15 giây, không âm thanh bắt buộc, chữ đọc được khi tắt tiếng. Vùng an toàn: 10% mỗi cạnh, 15% dưới. Phong cách bản thảo tạp chí: nền trắng, đường kẻ đậm, một mảng cobalt #0a3d91.
Khung 1: logo, nhãn CHUỖI KHÓA HỌC · 01/2027.
Khung 2: "Phân tích định lượng với R" serif, "Từ cơ bản đến chuyên sâu" serif nghiêng cobalt; mảng cobalt với biểu đồ hồi quy trắng đang vẽ dở, chú thích "Dữ liệu minh họa, không phải kết quả nghiên cứu."
Khung 3: bảng 3 dòng: Phân tích dữ liệu với R cơ bản 08–10/01/2027 ; Phân tích chi phí - hiệu quả trong y tế 12 và 13/01/2027 ; Phân tích dữ liệu chuỗi thời gian 15–17/01/2027.
Khung 4: "Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy", "Offline tại TP. Hồ Chí Minh hoặc online qua Zoom".
Khung 5: "Trước 08/12/2026: giảm 10%" (ngày đỏ #c4231a), logo, "(028) 2242 6789".
Chữ thân không nhỏ hơn 40 px. Không ảnh stock, không người minh họa.
```

## Cần từ Viện

- Video hoặc ảnh giảng viên, lớp học các khóa trước, kèm quyền dùng.
- Kênh chạy chính (Meta, Zalo, YouTube) để chốt khổ ưu tiên.
- Có cần giọng đọc không; nếu có, người đọc hay giọng tổng hợp.

## Xuất

`video/export/V1-9x16.mp4`, `V1-16x9.mp4`... và ảnh bìa (frame đầu) cho mỗi video. Mã nguồn HyperFrames đặt trong `video/src/`.
