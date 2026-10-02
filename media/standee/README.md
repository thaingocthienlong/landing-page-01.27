# Standee

Trạng thái: chưa bắt đầu. Ưu tiên: 3 (in xong trước 05/01/2027).

## Mục đích

Đặt ở sảnh Viện từ lúc nhận in đến hết khóa (08–17/01/2027), và mang theo khi giới thiệu tại hội nghị, bệnh viện. Người xem đứng cách 2–3 m, đọc trong vài giây.

## Biến thể

| Mã | Khổ | Dùng |
|---|---|---|
| S1 | 60×160 cm | Giới thiệu chuỗi, đặt từ nay đến 28/12/2026 |
| S2 | 60×160 cm | Đón học viên trong tuần học: lịch 3 khóa, phòng học, wifi/Zoom hỗ trợ (chờ thông tin) |

Hai bản cùng khung, khác nội dung giữa: nếu chỉ in một, in S1 rồi dán đè lịch.

## Bố cục S1 (từ trên xuống)

1. A: logo màu, rộng khoảng 25 cm.
2. B: tên chuỗi, tiêu đề 140–180 pt.
3. Dòng giảng viên chính.
4. G: mảng cobalt, Hình 1 lớn, chiếm khoảng 1/3 chiều cao.
5. C: bảng 3 khóa, 36 pt.
6. E: hai mốc hạn.
7. F + H: dải liên hệ, QR cạnh 40 mm trở lên.
8. 15 cm đáy: để trống nền trắng (chân đế che).

Ít chữ hơn poster: bỏ thông tin chung dài, giữ ngày, địa điểm một dòng.

## Prompt Claude Design (S1)

```
Dùng design system "VPN · Phân tích định lượng với R". Thiết kế standee dọc 60×160 cm, vùng an toàn 5 cm mỗi cạnh, chừa trống 15 cm đáy cho chân đế. Người xem đứng cách 2–3 m: tiêu đề 160 pt, chữ thân không nhỏ hơn 36 pt, chú thích không nhỏ hơn 28 pt. Phong cách bản thảo tạp chí: nền trắng, đường kẻ đậm mở đầu khối, không khung hộp, không gradient ngoài logo.

Từ trên xuống:
1. Logo Viện Phương Nam (file đính kèm), rộng khoảng 25 cm, căn giữa.
2. Nhãn CHUỖI KHÓA HỌC · 01/2027; tiêu đề "Phân tích định lượng với R"; dòng phụ serif nghiêng cobalt "Từ cơ bản đến chuyên sâu".
3. "Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy"
4. Mảng cobalt #0a3d91 duy nhất, chứa biểu đồ hồi quy trắng (điểm, đường hồi quy, dải tin cậy 95%), chú thích nhỏ: "Hình 1. Dữ liệu minh họa, không phải kết quả nghiên cứu."
5. Bảng 3 dòng: Phân tích dữ liệu với R cơ bản | 08–10/01/2027 ; Phân tích chi phí - hiệu quả trong y tế | 12 và 13/01/2027 ; Phân tích dữ liệu chuỗi thời gian | 15–17/01/2027
6. "Offline tại 45 Đinh Tiên Hoàng, TP. Hồ Chí Minh hoặc online qua Zoom"
7. "Trước 08/12/2026: giảm 10%" và "Hạn chót 28/12/2026", ngày màu đỏ #c4231a.
8. Dải nền #0d1b2a: (028) 2242 6789 · 0949 761 636 · 0912 114 511, ô QR trắng cạnh 45 mm, ghi "Quét để đăng ký".
Không ảnh stock, không biểu tượng trang trí.
```

## Cần từ Viện

- Loại standee (cuốn nhôm hay chữ X) và khổ nhà in nhận.
- Có muốn S2 không, và thông tin phòng học, hỗ trợ trong tuần học.
- Logo vector nếu muốn logo rộng hơn 38 cm.

## Xuất

`standee/export/S1-60x160.pdf` ở khổ thật hoặc tỷ lệ 1:2 theo yêu cầu nhà in, ảnh nhúng 150 dpi ở khổ thật.

Kiểm tra: in thu nhỏ ra A4, đặt cách 1 m (tương đương 2,5 m ở khổ thật) xem còn đọc được bảng 3 khóa không.
