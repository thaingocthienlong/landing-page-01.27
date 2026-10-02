# Video truyền thông

Trạng thái: chưa dựng. Phong cách: brand kit v2, nền tối "Data Lab", chuyển động theo design kit v2 mục 7. Ưu tiên: 2 (bản 15 giây trước 01/11/2026 để chạy Meta; bản nhắc hạn trước 01/12/2026).

## Mục đích

Quảng cáo Meta (Reels, Stories, Feed), fanpage, Zalo, màn chờ tại Viện. Phần lớn người xem tắt tiếng: mọi thông tin phải có trên hình.

## Nguyên liệu

Chưa có ảnh hay video giảng viên, lớp học. Bản đầu là chuyển động của chính các biểu đồ trên poster đã chốt: đường hồi quy tự vẽ, điểm mốc hiện lần lượt, cột gói mọc, nút ưu đãi phóng ra, trục thời gian chạy. Có video GS.TS. Nguyễn Văn Tuấn nói 10 đến 15 giây thì thêm một bản có giảng viên.

## Biến thể

| Mã | Khổ | Dài | Nội dung (khối từ poster) |
|---|---|---|---|
| V1 | 1080×1920 và 1920×1080 | 15 s | Tổng hợp như ST1: tiêu đề, lộ trình, cột gói, ưu đãi, trục thời gian, QR |
| V2a, V2b, V2c | 1080×1920 | 15 s | Mỗi khóa: hình nhỏ của khóa phóng lớn, tên khóa, 3 ý chính, lịch (từ ST2) |
| V3 | 1080×1920 | 10 s | Nhắc hạn: bản 08/12 (nút 10%), bản 28/12 (pill hạn chót) |
| V4 | 1920×1080 | 30 s, lặp | Màn chờ trong tuần học: khóa của ngày, lịch |

## Kịch bản V1 (15 giây, 5 nhịp; sơ đồ trong `design-kit/kit.html`)

| Giây | Khối | Chuyển động |
|---|---|---|
| 0–3 | Dải đầu, khối tiêu đề | Từng dòng trượt lên 12 px; lục giác R hiện cuối |
| 3–6 | Lộ trình | Đường hồi quy vẽ từ trái sang (1.2 s), điểm mốc K1, K2, K3 hiện cách 0.15 s, đường gióng chạy xuống, nhãn khóa hiện |
| 6–9 | Cột gói | 6 hàng mọc từ trái, cách 0.08 s; số học phí đếm lên |
| 9–12 | Nút ưu đãi | 10%, 5%, 10–15% phóng từ 0.6 lên 1 dọc trục nối |
| 12–15 | Trục thời gian, QR | Đường kẻ chạy ngang, mốc rơi xuống, pill 28/12/2026 hiện cuối; QR và liên hệ |

Một đường cong `cubic-bezier(0.16, 1, 0.3, 1)`; không nảy, không xoay, không nhấp nháy. Nền đứng yên, lưới chấm có thể trôi rất chậm. Nhạc nền chỉ dùng nhạc có giấy phép thương mại; ghi nguồn trong `video/NGUON-NHAC.md` khi chọn.

## Cách làm

1. Storyboard: dùng chính 3 poster đã chốt làm khung hình (khung cuối của mỗi nhịp là trạng thái của poster).
2. Dựng bằng HyperFrames (HTML thành MP4, có skill trong môi trường Claude Code này): composition dùng lại `media/poster/ads/story.css` và `story.js`, mỗi khối là một clip có thời gian riêng.
3. Xuất MP4 H.264, 30 fps, dưới 30 MB cho Meta; kiểm tra vùng an toàn 9:16 (10% mỗi cạnh, 15% dưới).

## Prompt Claude Design (storyboard V1)

```
Dùng design system "VPN · Phân tích định lượng với R (v2 Data Lab)". Đính kèm 3 poster Story đã chốt và kit.png. Dựng storyboard 5 khung 1080×1920 cho video 15 giây xem khi tắt tiếng; vùng an toàn 10% mỗi cạnh, 15% dưới. Mỗi khung là một nhịp, dùng đúng khối của poster ST1:
1. Dải đầu và khối tiêu đề "Phân tích định lượng / với [R lục giác] từ cơ bản / đến chuyên sâu".
2. Lộ trình 3 khóa: đường hồi quy đang vẽ dở, điểm mốc K1 #5ad8ff đã hiện.
3. Cột gói: 6 hàng K1/K2/K3 theo số ngày, học phí 8.800.000đ, 6.700.000đ, 7.500.000đ, 6.700.000đ, 3.500.000đ, 4.500.000đ.
4. Nút ưu đãi 10% (trước 08/12/2026), 5% (nhóm từ 3 người), 10–15% (học viên cũ).
5. Trục thời gian 08/12/2026, 28/12/2026 (pill trắng chữ đỏ #c4231a), 08/01/2027; QR và liên hệ.
Chữ thân không nhỏ hơn 40 px. Không ảnh stock, không người minh họa.
```

## Cần từ Viện

- Video hoặc ảnh giảng viên, lớp học các khóa trước, kèm quyền dùng.
- Kênh chạy chính (Meta, Zalo, YouTube) để chốt khổ ưu tiên.
- Có cần giọng đọc không; nếu có, người đọc hay giọng tổng hợp.

## Xuất

`video/export/V1-9x16.mp4`, `V1-16x9.mp4`..., kèm ảnh bìa (khung cuối). Mã nguồn HyperFrames đặt trong `video/src/`.
