# Poster

Trạng thái: chưa bắt đầu. Ưu tiên: 1 (cần cho giai đoạn ưu đãi sớm, đến 08/12/2026).

## Mục đích

- **Poster in A3/A2:** dán tại Viện, gửi khoa, bệnh viện, trường đại học, phòng đào tạo sau đại học.
- **Poster số:** đăng fanpage, nhóm Zalo, Instagram; card quảng cáo Meta khi chưa có ảnh thật (kế hoạch truyền thông mục 5).
- **Ảnh chia sẻ 1200×630:** thay `logo.png` trong thẻ `og:image` của landing page (kế hoạch truyền thông mục 7 đang thiếu).

## Biến thể

| Mã | Khổ | Nội dung |
|---|---|---|
| P1 | A3 dọc, có bản A2 phóng tỷ lệ | Chuỗi đầy đủ: 3 khóa, giảng viên, mốc hạn, gói từ 3.500.000 đồng, liên hệ, QR |
| P2 | 1080×1350 | Chuỗi đầy đủ, rút gọn chữ |
| P3a, P3b, P3c | 1080×1350 | Mỗi khóa một tấm, dùng Hình 1, 2, 3 tương ứng |
| P4 | 1080×1080 | Nhắc mốc: bản giai đoạn 1 "Trước 08/12/2026 giảm 10%", bản giai đoạn 2 "Hạn chót 28/12/2026" |
| P5 | 1200×630 | Ảnh chia sẻ link: khối A, B, ngày tổ chức. Không chữ nhỏ |

## Bố cục P1 (khối theo `../design-kit/README.md`)

1. Trên: A (logo + Viện Phương Nam), nhãn của B.
2. Thân trái (4 cột): B, dòng "Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy", thông tin chung (thời gian, hình thức, địa điểm).
3. Thân phải (2 cột) hoặc nửa dưới: G với Hình 1, là mảng cobalt duy nhất.
4. C: bảng 3 khóa.
5. D: hai giảng viên, chữ, chờ ảnh.
6. E: hai mốc hạn.
7. Đáy: F + H.

Bảng 6 gói không đưa lên poster: quá dày ở A3. Ghi "6 gói đăng ký, học phí từ 3.500.000 đồng/học viên" kèm QR.

## Prompt Claude Design (P1)

```
Dùng design system "VPN · Phân tích định lượng với R". Thiết kế poster A3 dọc (297×420 mm, tràn lề 3 mm, vùng an toàn 15 mm) cho chuỗi khóa học. Phong cách: một trang bản thảo tạp chí khoa học, nền trắng, đường kẻ đậm 2 px mở đầu khối, đường mảnh giữa các dòng, không đóng khung hộp, không bóng đổ, không gradient ngoài logo.

Chữ (giữ nguyên, không viết lại):
- Nhãn: CHUỖI KHÓA HỌC · 01/2027
- Tiêu đề: Phân tích định lượng với R
- Dòng phụ (serif nghiêng, cobalt): Từ cơ bản đến chuyên sâu
- Do GS.TS. Nguyễn Văn Tuấn trực tiếp giảng dạy, cùng TS. Trần Sơn Thạch
- Từ ngày 08/01/2027 đến ngày 17/01/2027
- Học trực tiếp (offline) tại Viện Phương Nam, 45 Đinh Tiên Hoàng, Phường Sài Gòn, TP. Hồ Chí Minh, hoặc trực tuyến (online) qua Zoom
- Bảng: 1 | Phân tích dữ liệu với R cơ bản | 03 ngày | Từ 08/01 đến 10/01/2027 ; 2 | Phân tích chi phí - hiệu quả trong y tế | 02 ngày | Ngày 12/01 và 13/01/2027 ; 3 | Phân tích dữ liệu chuỗi thời gian | 03 ngày | Từ 15/01 đến 17/01/2027
- 6 gói đăng ký, học phí từ 3.500.000 đồng/học viên
- Trước 08/12/2026: giảm 10% (ngày màu đỏ #c4231a)
- Hạn chót đăng ký và hoàn tất học phí: 28/12/2026 (ngày màu đỏ #c4231a)
- Dải chân nền #0d1b2a: (028) 2242 6789 · 0949 761 636 (Ms. Vy) · 0912 114 511 (Ms. Thảo) · www.vienphuongnam.com.vn, ô QR trắng bên phải ghi "Quét để đăng ký"

Mảng cobalt #0a3d91 duy nhất chứa biểu đồ trắng: điểm phân tán, đường hồi quy, dải tin cậy 95% (dùng file SVG đính kèm nếu có), chú thích: "Hình 1. Hồi quy tuyến tính: đường phù hợp và khoảng tin cậy 95% trên 48 điểm dữ liệu mô phỏng. Dữ liệu minh họa, không phải kết quả nghiên cứu."

Chỗ ảnh giảng viên: để khung chờ viền #7f93b0, ghi "Ảnh chính thức do Viện cung cấp". Không ảnh stock, không minh họa nhân vật, không số liệu học viên. Font Source Serif 4 cho tiêu đề và con số, Source Sans 3 cho chữ thân. Thân chữ không nhỏ hơn 14 pt.
```

Biến thể số: đổi dòng đầu thành khổ tương ứng, bỏ bảng ở P4, P5; P3 thay bảng bằng một khóa và hình tương ứng.

## Cần từ Viện

- Đích của QR: trang đăng ký trong thông báo (`https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r`) hay landing page. Gắn UTM `utm_source=poster&utm_medium=print&utm_campaign=r-01-2027` (bản in), `utm_medium=social` (bản số).
- Ảnh giảng viên chính thức và quyền dùng.
- Số lượng in, nhà in.

## Xuất

`poster/export/`: `P1-A3.pdf` (CMYK do nhà in chuyển, có tràn lề), `P1-A2.pdf`, `P2.png`, `P3a.png`...`P5.png` (sRGB). Sau khi có P5: thay `og:image`, `twitter:image` trong `dist/index.html`.
