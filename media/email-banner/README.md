# Email banner / header

Trạng thái: chưa dựng. Phong cách: brand kit v2, nền tối "Data Lab". Ưu tiên: 1 (email thông báo `tb-v4` gửi trong tháng 10/2026).

## Mục đích

Ảnh đầu email cho các đợt gửi trong kế hoạch truyền thông (`utm_content` ghi trong ngoặc). Cùng một khung, chỉ đổi dòng thứ hai.

| Mã | Đợt | Khi gửi | Dòng thứ hai |
|---|---|---|---|
| E1 | Thông báo chuỗi khóa (`tb-v4`) | tháng 10/2026 | "08/01 – 17/01/2027 · Offline / Online" |
| E2 | Nhắc ưu đãi (`nhac-0812`) | khoảng 01/12/2026 | "Hoàn tất học phí trước 08/12/2026: giảm 10%" |
| E3 | Nhắc hạn chót (`nhac-2812`) | khoảng 21/12/2026 | "Hạn chót đăng ký: 28/12/2026" (ngày trên pill trắng chữ đỏ) |
| E4 | Gửi học viên đã đăng ký | sau 28/12/2026 | "Chuẩn bị cho buổi học đầu tiên · 08/01/2027" |

## Ràng buộc email

- Nhiều ứng dụng email chặn ảnh mặc định. Banner chỉ là phần nhận diện; ngày, học phí, mốc hạn, nút đăng ký phải có trong nội dung HTML dạng chữ.
- Alt text đủ ý, ví dụ "Chuỗi khóa học Phân tích định lượng với R, 08/01 đến 17/01/2027, Viện Phương Nam".
- Rộng 600 px, xuất 1200 px; cao 240 px (xuất 480 px); dưới 200 KB.
- Chữ trên banner không nhỏ hơn 24 px ở bản 1200 px; điện thoại thu banner còn khoảng 360 px nên chỉ giữ hai dòng chữ.
- Không đặt nút giả trong ảnh.

## Bố cục (design kit v2, mục 6 "Email banner"; sơ đồ trong `design-kit/kit.html`)

- Trái 60%: logo trong khung tròn trắng; tiêu đề một dòng "Phân tích định lượng với [R lục giác]" (Source Serif 4 600, khoảng 56 px ở bản 1200 px); dòng thứ hai theo đợt (Oswald 600, 30 px).
- Phải 35%: lộ trình thu nhỏ (đường hồi quy và 3 điểm mốc K1, K2, K3), không nhãn khóa.
- Nền như poster: gradient, một vệt sáng góc trên phải, lưới chấm mờ; không code R (quá nhỏ ở khổ này).

## Prompt Claude Design (E1)

```
Dùng design system "VPN · Phân tích định lượng với R (v2 Data Lab)". Đính kèm brand-board.png, kit.png (sơ đồ Email banner) và poster ST1. Thiết kế ảnh đầu email 1200×480 px (hiển thị 600×240), vùng an toàn 48 px.
Nền gradient xanh đậm #061a4d → #0c3f9e, một vệt sáng #1673e3 góc trên phải, lưới chấm mờ.
Trái 60%: logo màu trong khung tròn trắng; "Phân tích định lượng với" Source Serif 4 600 trắng khoảng 56 px + chữ R Oswald trắng trong lục giác viền cyan #5ad8ff; dòng dưới "08/01 – 17/01/2027 · Offline / Online" Oswald 600 30 px #cfe0ff.
Phải 35%: biểu đồ lộ trình thu nhỏ: đường hồi quy cyan có dải tin cậy, 3 điểm mốc #5ad8ff, #3f86ff, #c3dbff, không chữ.
Không nút trong ảnh, không chữ nhỏ hơn 24 px.
Làm thêm 3 biến thể chỉ đổi dòng dưới: "Hoàn tất học phí trước 08/12/2026: giảm 10%"; "Hạn chót đăng ký: 28/12/2026" (ngày trên pill trắng chữ đỏ #c4231a); "Chuẩn bị cho buổi học đầu tiên · 08/01/2027".
```

## Cần từ Viện

- Công cụ gửi email (Gmail, Mailchimp, hệ thống riêng) để biết giới hạn ảnh và cách nhúng.
- Danh sách người nhận có đồng ý nhận thư không (quy định dữ liệu cá nhân).

## Xuất

`email-banner/export/E1@2x.png`, `E2@2x.png`, `E3@2x.png`, `E4@2x.png`, kèm alt text từng bản trong `email-banner/ALT.md` khi xuất.
