# Bìa tài liệu

Trạng thái: chưa bắt đầu. Ưu tiên: 3 (nộp in trước 03/01/2027; phụ thuộc tài liệu giảng viên).

## Mục đích

Bìa tài liệu học viên nhận trong lớp (offline) và bản PDF gửi học viên online. Một bìa cho mỗi khóa, cùng khung, khác tên khóa và hình.

## Biến thể

| Mã | Khóa | Hình | Ngày |
|---|---|---|---|
| D1 | Phân tích dữ liệu với R cơ bản | Hình 1 | Từ 08/01 đến 10/01/2027 |
| D2 | Phân tích chi phí - hiệu quả trong y tế | Hình 2 | Ngày 12/01 và 13/01/2027 |
| D3 | Phân tích dữ liệu chuỗi thời gian | Hình 3 | Từ 15/01 đến 17/01/2027 |

Bìa sau (chung cho 3 bìa): khối F rút gọn (điện thoại, địa chỉ, website), không QR đăng ký vì người cầm đã là học viên.

Gáy: chỉ cần nếu tài liệu đóng keo. Bề rộng gáy tính theo số trang và loại giấy; hỏi nhà in khi có số trang.

## Bố cục bìa trước

1. Trên cùng, trang trọng: dòng cơ quan chủ quản "LIÊN HIỆP CÁC HỘI KHOA HỌC VÀ KỸ THUẬT VIỆT NAM", dưới là "VIỆN PHÁT TRIỂN NGUỒN LỰC XÃ HỘI PHƯƠNG NAM", logo bên trái.
2. Nhãn: "CHUỖI KHÓA HỌC PHÂN TÍCH ĐỊNH LƯỢNG VỚI R · KHÓA n".
3. Tên khóa: serif 40–54 pt.
4. Dòng "Tài liệu học viên".
5. G: mảng cobalt nửa dưới với hình của khóa. Chú thích theo design kit mục 5.
6. Đáy: "GS.TS. Nguyễn Văn Tuấn · TS. Trần Sơn Thạch" và "TP. Hồ Chí Minh, tháng 01/2027".

## Prompt Claude Design (D1)

```
Dùng design system "VPN · Phân tích định lượng với R". Thiết kế bìa trước tài liệu A4 dọc (210×297 mm, tràn lề 3 mm, vùng an toàn 12 mm). Phong cách bản thảo tạp chí khoa học, trang trọng, nền trắng, đường kẻ thay khung.

Chữ:
- Đầu trang, sans 700 in hoa, cỡ 9 pt: LIÊN HIỆP CÁC HỘI KHOA HỌC VÀ KỸ THUẬT VIỆT NAM / VIỆN PHÁT TRIỂN NGUỒN LỰC XÃ HỘI PHƯƠNG NAM, logo màu bên trái cao khoảng 22 mm.
- Nhãn: CHUỖI KHÓA HỌC PHÂN TÍCH ĐỊNH LƯỢNG VỚI R · KHÓA 1
- Tên khóa, serif 600 cỡ 48 pt: Phân tích dữ liệu với R cơ bản
- Tài liệu học viên
- Từ 08/01 đến 10/01/2027
- Nửa dưới: mảng cobalt #0a3d91 tràn lề trái, phải, dưới, chứa biểu đồ hồi quy màu trắng; chú thích cobalt-tint #cfe0ff: "Hình 1. Hồi quy tuyến tính: đường phù hợp và khoảng tin cậy 95% trên 48 điểm dữ liệu mô phỏng. Dữ liệu minh họa, không phải kết quả nghiên cứu."
- Trên mảng cobalt, chữ trắng: GS.TS. Nguyễn Văn Tuấn · TS. Trần Sơn Thạch ; TP. Hồ Chí Minh, tháng 01/2027
Không thêm số thông báo, không mã khóa, không ảnh.
```

D2, D3: đổi số khóa, tên khóa, ngày, hình và chú thích.

## Cần từ Viện

- Tài liệu in hay chỉ PDF; số trang; đóng ghim hay keo.
- Có cần dòng cơ quan chủ quản trên bìa không (đang theo phần đầu thông báo).

## Xuất

`document-cover/export/D1-front.pdf`... và `back.pdf`, A4 có tràn lề. Bản PDF gửi học viên online: ghép bìa vào trang 1 của tài liệu, sRGB.
