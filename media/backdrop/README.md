# Backdrop, nền Zoom, màn chờ

Trạng thái: chưa dựng, chờ kích thước tường. Phong cách: brand kit v2, nền tối "Data Lab". Ưu tiên: 3 (in xong trước 05/01/2027).

## Mục đích

- **Backdrop phòng học** tại 45 Đinh Tiên Hoàng: sau bục giảng, xuất hiện trong ảnh lớp và khung hình Zoom của giảng viên.
- **Nền Zoom** cho giảng viên và Ban tổ chức khi dạy trực tuyến.
- **Màn chờ** chiếu trước giờ học.

## Biến thể

| Mã | Khổ | Ghi chú |
|---|---|---|
| B1 | 3×2 m hoặc 4×2,5 m, chốt sau khi đo | Hiflex hoặc vải; nội dung ở nửa trên |
| B2 | 1920×1080 px | Nền ảo Zoom |
| B3 | 1920×1080 px | Màn chờ: khóa của ngày, lịch học |

## Bố cục (design kit v2, mục 6; sơ đồ trong `design-kit/kit.html`)

**B1.** Dải đầu thu gọn ở góc trên trái → khối tiêu đề và dòng thông tin ở 56% bên trái → lộ trình lớn ở 40% bên phải → 1/3 dưới chỉ có nền (người đứng che). Code R chạy ngang ở mép dưới. Không QR, không học phí, không hạn chót: backdrop dùng trong tuần học. Chữ to nhất phải đọc được trên ảnh chụp toàn lớp từ cuối phòng.

**B2.** Logo khung tròn và tiêu đề một dòng ở góc trên trái → ngày tổ chức → lộ trình mờ ở góc dưới trái → 1/3 giữa để trống cho người. Zoom hiển thị ngược với chính người dùng nhưng người khác thấy đúng; không bật "Mirror my video" khi kiểm tra chữ.

**B3.** Như ST2 dạng ngang: nhãn `# Hôm nay`, tên khóa của ngày (serif), hình nhỏ của khóa, lịch Gantt với ngày hiện tại sáng hơn. Giờ học chỉ thêm khi Viện xác nhận.

## Prompt Claude Design (B1)

```
Dùng design system "VPN · Phân tích định lượng với R (v2 Data Lab)". Đính kèm brand-board.png, kit.png và 3 poster Story đã chốt. Thiết kế backdrop ngang [rộng × cao] m cho phòng học, xem từ 4 đến 8 m và xuất hiện trong ảnh chụp lớp; vùng an toàn 10 cm; 1/3 dưới chỉ có nền.

Nền như poster: gradient xanh đậm, hai vệt sáng, lưới chấm mờ, cụm lục giác góc trên phải, một dòng code R chạy ngang mép dưới ("library(ggplot2)   t.test(y ~ nhom)   lm(y ~ x)   fit <- auto.arima(y)   forecast(fit, h = 12)").
Trái 56%: dải đầu thu gọn (logo trong khung tròn trắng, "VIỆN PHÁT TRIỂN NGUỒN LỰC XÃ HỘI PHƯƠNG NAM"); khối tiêu đề "Phân tích định lượng / với [R lục giác] từ cơ bản / đến chuyên sâu" và dòng giảng viên; hai dòng thông tin có icon: "08/01 – 17/01/2027", "Offline / Online · TP. Hồ Chí Minh hoặc Zoom".
Phải 40%: lộ trình 3 khóa lớn: đường hồi quy cyan, 3 điểm mốc K1 #5ad8ff, K2 #3f86ff, K3 #c3dbff, nhãn khóa và ngày.
Không QR, không học phí, không hạn chót, không ảnh.
```

## Cần từ Viện

- Kích thước tường hoặc khung treo, chất liệu, cách treo.
- Ảnh chụp phòng học hiện tại (ánh sáng, vị trí bục giảng, máy quay Zoom).
- Có dùng backdrop cho sự kiện khác sau tháng 01/2027 không (nếu có, bỏ ngày).
- Giờ học hằng ngày nếu muốn in trên màn chờ.

## Xuất

`backdrop/export/B1.pdf` theo tỷ lệ nhà in yêu cầu (thường 1:10), ảnh nhúng 100 dpi ở khổ thật, lưới chấm 45%; `B2-zoom.png`, `B3-cho.png` 1920×1080.
