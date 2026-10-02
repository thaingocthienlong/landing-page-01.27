# Bìa tài liệu

Trạng thái: chưa dựng. Phong cách: brand kit v2, nền tối "Data Lab". Ưu tiên: 3 (nộp in trước 03/01/2027; phụ thuộc tài liệu giảng viên).

## Mục đích

Bìa tài liệu học viên nhận trong lớp (offline) và trang đầu bản PDF gửi học viên online. Mỗi khóa một bìa, cùng khung, khác màu K, tên khóa và hình chính.

## Biến thể

| Mã | Khóa | Hình chính (từ `story.js`) | Màu | Ngày · thời lượng |
|---|---|---|---|---|
| D1 | Phân tích dữ liệu với R cơ bản | Hồi quy | K1 #5ad8ff | 08–10/01/2027 · 3 ngày (6 buổi) |
| D2 | Phân tích chi phí - hiệu quả trong y tế | Mặt phẳng chi phí - hiệu quả | K2 #3f86ff | 12 và 13/01/2027 · 2 ngày (4 buổi) |
| D3 | Phân tích dữ liệu chuỗi thời gian | Dự báo chuỗi thời gian | K3 #c3dbff | 15–17/01/2027 · 3 ngày (6 buổi) |

Bìa sau (chung): liên hệ và dải chân, không QR (người cầm đã là học viên). Gáy chỉ cần nếu tài liệu đóng keo; bề rộng gáy theo số trang và giấy.

## Bố cục (design kit v2, mục 6 "Bìa tài liệu"; sơ đồ trong `design-kit/kit.html`)

1. Dải đầu: logo khung tròn, tên Viện.
2. Nhãn `# Khóa n · Tài liệu học viên` (JetBrains Mono, màu K của khóa).
3. Tên khóa: Source Serif 4 600, cỡ lớn (khoảng 54 pt), 2 dòng.
4. Hình chính: hình nhỏ của khóa phóng lớn (`VPN.mini`, xuất vector), đường và điểm màu K, trục trắng mờ. Không chú thích "dữ liệu minh họa" trên bìa; trong tài liệu, các hình mô phỏng ghi lại chú thích này.
5. Ngày, số buổi, "GS.TS. Nguyễn Văn Tuấn · TS. Trần Sơn Thạch".
6. Tiêu đề chuỗi một dòng: "Phân tích định lượng với [R lục giác]".
7. Dải chân trắng (điện thoại, địa chỉ, website).

## Prompt Claude Design (D1)

```
Dùng design system "VPN · Phân tích định lượng với R (v2 Data Lab)". Đính kèm brand-board.png, kit.png và poster ST2 (story-khoa-hoc-lich-hoc.png) làm mẫu. Thiết kế bìa trước tài liệu A4 dọc (210×297 mm, tràn lề 3 mm, vùng an toàn 12 mm).

Nền như poster: gradient xanh đậm, hai vệt sáng, lưới chấm mờ, cụm lục giác góc trên phải, code R dọc hai lề.
Từ trên xuống:
1. Dải đầu: logo màu trong khung tròn trắng, "VIỆN PHÁT TRIỂN NGUỒN LỰC XÃ HỘI PHƯƠNG NAM" Oswald in hoa trắng.
2. "# Khóa 1 · Tài liệu học viên" JetBrains Mono, cyan #5ad8ff.
3. "Phân tích dữ liệu với R cơ bản" Source Serif 4 600 trắng, khoảng 54 pt, 2 dòng.
4. Hình chính chiếm khoảng 1/3 trang: biểu đồ hồi quy (điểm trắng, đường hồi quy và dải tin cậy cyan #5ad8ff, trục trắng mờ), vẽ trực tiếp trên nền.
5. "08–10/01/2027 · 3 ngày (6 buổi)" Oswald; "GS.TS. Nguyễn Văn Tuấn · TS. Trần Sơn Thạch" Montserrat.
6. "Phân tích định lượng với" serif + chữ R trong lục giác viền cyan.
7. Dải chân trắng: (028) 2242 6789 · 45 Đinh Tiên Hoàng, P. Sài Gòn, TP.HCM · vienphuongnam.com.vn, icon tròn navy.
Không ảnh, không số thông báo, không mã khóa.
```

D2, D3: đổi số khóa, tên khóa, màu K, hình chính và ngày theo bảng biến thể.

## Cần từ Viện

- Tài liệu in hay chỉ PDF; số trang; đóng ghim hay keo.
- Có cần dòng cơ quan chủ quản trên bìa không (poster đã bỏ dòng này theo yêu cầu).

## Xuất

`document-cover/export/D1-front.pdf`, `D2-front.pdf`, `D3-front.pdf`, `back.pdf`: A4 có tràn lề, hình chính dạng vector. Bản PDF cho học viên online: ghép bìa vào trang 1, sRGB.
