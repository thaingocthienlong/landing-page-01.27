# Email banner / header

Trạng thái: chưa bắt đầu. Ưu tiên: 1 (email thông báo `tb-v4` gửi trong tháng 10/2026).

## Mục đích

Ảnh đầu email cho các đợt gửi trong kế hoạch truyền thông (`utm_content` ghi trong ngoặc):

| Mã | Đợt | Khi gửi | Chữ trên banner |
|---|---|---|---|
| E1 | Thông báo chuỗi khóa (`tb-v4`) | tháng 10/2026 | Tên chuỗi, 08/01 – 17/01/2027, GS.TS. Nguyễn Văn Tuấn |
| E2 | Nhắc ưu đãi (`nhac-0812`) | khoảng 01/12/2026 | Tên chuỗi, "Trước 08/12/2026: giảm 10%" |
| E3 | Nhắc hạn chót (`nhac-2812`) | khoảng 21/12/2026 | Tên chuỗi, "Hạn chót 28/12/2026" |
| E4 | Gửi học viên đã đăng ký | sau 28/12/2026 | Tên chuỗi, "Chuẩn bị cho buổi học đầu tiên" |

Cùng một khung, chỉ đổi dòng thứ hai: làm E1 trước, ba bản còn lại là biến thể.

## Ràng buộc email

- Nhiều ứng dụng email chặn ảnh mặc định. Banner chỉ là phần nhận diện; ngày, học phí, mốc hạn, nút đăng ký phải có trong nội dung HTML dạng chữ.
- Alt text: viết đủ thông tin chính, ví dụ "Chuỗi khóa học Phân tích định lượng với R, 08/01 đến 17/01/2027, Viện Phương Nam".
- Rộng 600 px, xuất 1200 px; cao 240 px (xuất 480 px). Dưới 200 KB. PNG nếu có biểu đồ nét mảnh, JPG nếu nặng.
- Chữ trên banner không nhỏ hơn 24 px ở bản 1200 px (12 px hiển thị); điện thoại thu nhỏ banner còn khoảng 360 px rộng, nên chỉ giữ 2 dòng chữ.
- Không đặt nút giả trong ảnh. Nút "Đăng ký" là nút HTML thật.

## Bố cục E1 (1200×480)

- Trái 7/12, nền trắng: logo màu nhỏ góc trên, tên chuỗi serif 600 khoảng 60 px, dòng phụ serif nghiêng cobalt, dòng thứ hai sans 28 px.
- Phải 5/12: mảng cobalt với Hình 1 thu gọn (chỉ điểm và đường hồi quy, bỏ trục chi tiết), chú thích "Dữ liệu minh họa, không phải kết quả nghiên cứu."
- Đáy: đường kẻ đậm ink 4 px tràn ngang.

## Prompt Claude Design (E1)

```
Dùng design system "VPN · Phân tích định lượng với R". Thiết kế ảnh đầu email 1200×480 px (hiển thị 600×240), vùng an toàn 48 px. Trái 7/12 nền trắng: logo Viện Phương Nam nhỏ góc trên trái; "Phân tích định lượng với R" serif 600 60 px; "Từ cơ bản đến chuyên sâu" serif nghiêng cobalt #0a3d91 36 px; "08/01 – 17/01/2027 · GS.TS. Nguyễn Văn Tuấn" sans 28 px màu #3a4a5f. Phải 5/12: mảng cobalt #0a3d91 tràn mép, biểu đồ hồi quy trắng giản lược (điểm và đường hồi quy, dải tin cậy mờ), chú thích nhỏ 22 px #cfe0ff "Dữ liệu minh họa, không phải kết quả nghiên cứu." Đáy: đường kẻ #0d1b2a dày 4 px. Không nút trong ảnh, không gradient ngoài logo.
Làm thêm 3 biến thể chỉ đổi dòng sans: "Trước 08/12/2026: giảm 10%" (ngày màu #c4231a); "Hạn chót 28/12/2026" (ngày màu #c4231a); "Chuẩn bị cho buổi học đầu tiên".
```

## Cần từ Viện

- Công cụ gửi email (Gmail, Mailchimp, hệ thống riêng) để biết giới hạn ảnh và cách nhúng.
- Danh sách người nhận có đồng ý nhận thư không (quy định dữ liệu cá nhân).

## Xuất

`email-banner/export/E1@2x.png`... kèm alt text từng bản trong `email-banner/ALT.md` khi xuất.
