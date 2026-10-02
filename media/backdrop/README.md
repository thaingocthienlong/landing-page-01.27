# Backdrop

Trạng thái: chưa bắt đầu, **chờ kích thước tường**. Ưu tiên: 3 (in xong trước 05/01/2027).

## Mục đích

- **Backdrop phòng học** tại 45 Đinh Tiên Hoàng: phía sau bục giảng, xuất hiện trong ảnh lớp và trong khung hình Zoom của giảng viên.
- **Nền Zoom** cho giảng viên và Ban tổ chức khi dạy trực tuyến hoặc khi phát lại từ phòng học.

## Biến thể

| Mã | Khổ | Ghi chú |
|---|---|---|
| B1 | 3×2 m hoặc 4×2,5 m, chốt sau khi đo | Hiflex hoặc vải; nội dung chính ở 1/2 trên vì bục giảng và người che phần dưới |
| B2 | 1920×1080 px | Nền ảo Zoom; nội dung dồn về 1/3 trái, giữa để trống cho người |
| B3 | 1920×1080 px | Màn chờ chiếu trước giờ học: tên khóa của ngày, giờ học, wifi |

## Bố cục B1

- Lưới 12 cột. Trái 7 cột: A (logo lớn), B (tên chuỗi, 300–400 pt), dòng "Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy", "08/01 – 17/01/2027 · Viện Phương Nam, TP. Hồ Chí Minh".
- Phải 5 cột: G, mảng cobalt với một hình lớn (Hình 1). Một bản backdrop dùng cả tuần nên không gắn hình theo khóa.
- Không in số điện thoại, QR, học phí, mốc hạn: khi backdrop được treo thì đã hết hạn đăng ký.
- Chữ to nhất phải đọc được trên ảnh chụp toàn lớp từ cuối phòng.

## Bố cục B2

- Nền paper, logo màu góc trên trái, dưới là tên chuỗi (cỡ 64–72 px), một đường kẻ đậm.
- Góc dưới trái: "08/01 – 17/01/2027". Không chữ nào ở 1/3 giữa và mép phải (cửa sổ người khác che).
- Zoom hiển thị ngược cho chính người dùng nhưng người khác thấy đúng chiều; không bật "Mirror my video" khi kiểm tra chữ.

## Prompt Claude Design (B1)

```
Dùng design system "VPN · Phân tích định lượng với R". Thiết kế backdrop ngang [rộng × cao] m cho phòng học, xem từ 4–8 m và xuất hiện trong ảnh chụp lớp. Nội dung chính nằm ở nửa trên, vùng an toàn 10 cm. Lưới 12 cột: trái 7 cột nền trắng, phải 5 cột là mảng cobalt #0a3d91 duy nhất, tràn mép phải, trên, dưới.

Trái: logo Viện Phương Nam lớn; nhãn CHUỖI KHÓA HỌC · 01/2027; tiêu đề serif 600 "Phân tích định lượng với R"; dòng phụ serif nghiêng cobalt "Từ cơ bản đến chuyên sâu"; "Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy"; "08/01 – 17/01/2027 · Viện Phương Nam, TP. Hồ Chí Minh".
Phải: biểu đồ hồi quy trắng lớn (điểm, đường hồi quy, dải tin cậy 95%), chú thích cobalt-tint: "Hình 1. Dữ liệu minh họa, không phải kết quả nghiên cứu."
Không số điện thoại, không QR, không học phí. Không gradient ngoài logo, không hoa văn nền.
```

## Cần từ Viện

- Kích thước tường hoặc khung treo, chất liệu, cách treo.
- Ảnh chụp phòng học hiện tại (để xem ánh sáng, vị trí bục giảng, máy quay Zoom).
- Có dùng chung backdrop cho sự kiện khác của Viện sau tháng 01/2027 không (nếu có thì bỏ ngày).

## Xuất

`backdrop/export/B1.pdf` theo tỷ lệ nhà in yêu cầu (thường 1:10), `B2-zoom.png`, `B3-cho.png`.
