# Standee

Trạng thái: chưa dựng. Phong cách: brand kit v2, nền tối "Data Lab". Ưu tiên: 3 (in xong trước 05/01/2027).

## Mục đích

Đặt ở sảnh Viện từ lúc nhận in đến hết khóa (08–17/01/2027), mang theo khi giới thiệu tại hội nghị, bệnh viện. Người xem đứng cách 2–3 m, đọc trong vài giây.

## Biến thể

| Mã | Khổ | Dùng |
|---|---|---|
| S1 | 60×160 cm | Giới thiệu chuỗi khóa, dùng đến 28/12/2026: lộ trình, hạn chót, QR |
| S2 | 60×160 cm | Đón học viên trong tuần học: lịch Gantt và hình thức thay cho hạn chót và QR |

## Bố cục (design kit v2, mục 6 "Standee"; sơ đồ trong `design-kit/kit.html`)

1. Dải đầu: logo trong khung tròn trắng, tên Viện.
2. Khối tiêu đề lớn (tiêu đề khoảng 300 pt ở khổ thật).
3. Dòng thông tin xếp hai hàng: 08/01 – 17/01/2027; Offline / Online.
4. Lộ trình 3 khóa (đường hồi quy, 3 điểm mốc, nhãn khóa và ngày).
5. S1: hạn chót gọn (pill trắng chữ đỏ 28/12/2026) rồi QR cạnh 40 mm trở lên ở giữa. S2: lịch Gantt và sơ đồ Trực tiếp hoặc Trực tuyến.
6. Liên hệ Ms. Vy, Ms. Thảo; dải chân.
7. 15 cm đáy để trống cho chân đế.

Không đưa cột gói lên standee: xem từ xa không đọc được 6 hàng số.

## Prompt Claude Design (S1)

```
Dùng design system "VPN · Phân tích định lượng với R (v2 Data Lab)". Đính kèm brand-board.png, kit.png và 3 poster Story đã chốt làm mẫu. Thiết kế standee dọc 60×160 cm, vùng an toàn 5 cm, chừa trống 15 cm đáy. Người xem cách 2 đến 3 m: tiêu đề khoảng 300 pt, số 110 pt, chữ thân không dưới 40 pt.

Giữ đúng hệ: nền gradient xanh đậm #061a4d → #0a2f7f → #0c3f9e, hai vệt sáng #1673e3, lưới chấm mờ ở hai góc, cụm lục giác góc trên phải, code R dọc hai lề. Thông tin vẽ trực tiếp trên nền, không hộp trắng.

Từ trên xuống:
1. Dải đầu: logo màu trong khung tròn trắng, "VIỆN PHÁT TRIỂN NGUỒN LỰC XÃ HỘI PHƯƠNG NAM" Oswald in hoa trắng.
2. "Phân tích định lượng" (Source Serif 4 600, trắng), dòng 2: "với" + chữ R Oswald trắng trong lục giác viền cyan #5ad8ff + "từ cơ bản / đến chuyên sâu" serif nghiêng cyan; dưới: "GS.TS. Nguyễn Văn Tuấn · TS. Trần Sơn Thạch".
3. Hai dòng có icon tròn viền cyan: "08/01 – 17/01/2027 · Thời gian tổ chức"; "Offline / Online · TP. Hồ Chí Minh hoặc Zoom".
4. Nhãn "# 3 khóa học: từ nền tảng đến chuyên sâu" (JetBrains Mono, cyan). Biểu đồ: đường hồi quy cyan đi lên có dải tin cậy, điểm nền mờ, 3 điểm mốc K1 #5ad8ff, K2 #3f86ff, K3 #c3dbff có đường gióng nét đứt xuống nhãn: "Khóa 1 · 08–10/01 / Phân tích dữ liệu với R cơ bản", "Khóa 2 · 12–13/01 / Phân tích chi phí - hiệu quả trong y tế", "Khóa 3 · 15–17/01 / Phân tích dữ liệu chuỗi thời gian".
5. "HẠN CHÓT ĐĂNG KÝ VÀ HOÀN TẤT HỌC PHÍ" và pill trắng chữ đỏ #c4231a "28/12/2026".
6. Mã QR (file đính kèm) trên nền trắng, cạnh mã 45 mm, chữ "Quét mã để đăng ký".
7. "0949 761 636 (Ms. Vy) · 0912 114 511 (Ms. Thảo)".
8. Dải chân trắng: icon điện thoại "(028) 2242 6789", icon địa điểm "45 Đinh Tiên Hoàng, P. Sài Gòn, TP.HCM", icon quả địa cầu "vienphuongnam.com.vn".
Không ảnh, không học phí, không giờ học.
```

S2: thay mục 5 và 6 bằng nhãn "# Lịch học · tháng 01/2027" với lịch 10 ngày (thanh "Khóa 1 · 6 buổi", "Khóa 2 · 4 buổi", "Khóa 3 · 6 buổi"; ngày 11 và 14 không học) và sơ đồ "Trực tiếp (offline) hoặc Trực tuyến (online)".

## Cần từ Viện

- Loại standee (cuốn nhôm hay chữ X) và khổ nhà in nhận.
- Có làm S2 không; thông tin phòng học và hỗ trợ trong tuần học.
- Logo vector nếu muốn logo lớn hơn bản PNG cho phép (khoảng 38 cm ở 300 dpi).
- Bông màu nền xanh đậm và K1/K2/K3 trên đúng chất liệu in.

## Xuất

`standee/export/S1-60x160.pdf` ở khổ thật (hoặc 1:2 theo nhà in), ảnh nhúng 150 dpi; lưới chấm 45%, nhiễu 1 đến 2% trên gradient. Kiểm tra: in thu nhỏ ra A4, đặt cách 1 m (tương đương 2,5 m ở khổ thật).
