# Thẻ đeo

Trạng thái: chưa bắt đầu. Ưu tiên: 4 (mẫu duyệt trước 20/12/2026; in danh sách sau hạn chót 28/12/2026, xong trước 07/01/2027).

## Mục đích

Nhận diện người trong phòng học tại 45 Đinh Tiên Hoàng: Ban tổ chức điểm danh theo khóa, giảng viên gọi tên học viên. Chỉ học viên offline cần thẻ.

## Biến thể

| Mã | Vai trò | Dải vai trò (khối I) |
|---|---|---|
| T1 | Học viên | Nền trắng, đường kẻ cobalt dày 3 mm trên dải, chữ cobalt "HỌC VIÊN" |
| T2 | Giảng viên | Nền cobalt, chữ trắng "GIẢNG VIÊN" |
| T3 | Ban tổ chức | Nền ink, chữ trắng "BAN TỔ CHỨC" |

Không dùng đỏ cho vai trò nào: đỏ chỉ dành cho mốc hạn.

## Bố cục (90×130 mm dọc)

1. 15 mm trên cùng: lỗ đục dây, để trống.
2. A: logo màu nhỏ (rộng 25 mm, đúng cỡ tối thiểu) + "Viện Phương Nam".
3. B thu gọn: "Phân tích định lượng với R · 01/2027", serif 14 pt.
4. Đường kẻ đậm.
5. Họ tên, serif 600, 24–28 pt, tối đa 2 dòng. Đơn vị công tác, sans 11 pt, 1 dòng.
6. Ô khóa (chỉ T1): ba ô vuông có nhãn "K1", "K2", "K3"; ô của khóa trong gói được tô cobalt. Ban tổ chức nhìn là biết học viên vào lớp nào.
7. Dải vai trò ở đáy, cao 18 mm.

## Ghép dữ liệu

Từ Google Sheet đăng ký, lọc học viên offline đã hoàn tất học phí: họ, tên, chức vụ/đơn vị, gói. Gói đổi ra ô khóa: Gói 1 = K1 K2 K3; Gói 2 = K1 K2; Gói 3 = K1 K3; Gói 4 = K2 K3; Gói 5 = K2; Gói 6 = K3.

Cách làm như giấy chứng nhận: template HTML khổ thật trong `badge/template/`, xếp 4 thẻ trên một tờ A4 có dấu cắt, xuất PDF bằng Chrome headless. File ghép chứa dữ liệu cá nhân: để ngoài repo.

Phương án dự phòng: in thẻ trống tên, viết tay, cho người đăng ký muộn hoặc in sai.

## Prompt Claude Design (T1)

```
Dùng design system "VPN · Phân tích định lượng với R". Thiết kế thẻ đeo dọc 90×130 mm, tràn lề 3 mm, vùng an toàn 6 mm, 15 mm trên cùng để trống cho lỗ đục dây.
Từ trên xuống: logo Viện Phương Nam rộng 25 mm + "Viện Phương Nam"; "Phân tích định lượng với R · 01/2027" serif 14 pt; đường kẻ đậm #0d1b2a; chuỗi giữ chỗ "Họ Tên Mẫu Có Dấu Đầy Đủ" serif 600 26 pt (xuống 2 dòng nếu dài); "[Đơn vị công tác]" sans 11 pt; ba ô vuông 10 mm nhãn K1, K2, K3, ô K1 và K3 tô cobalt #0a3d91, ô K2 chỉ có viền #7f93b0; dải đáy cao 18 mm nền trắng, đường kẻ cobalt 3 mm phía trên, chữ "HỌC VIÊN" sans 700 cobalt.
Làm thêm hai bản: GIẢNG VIÊN (dải nền cobalt, chữ trắng, không ô khóa) và BAN TỔ CHỨC (dải nền #0d1b2a, chữ trắng, không ô khóa).
```

Chuỗi giữ chỗ chỉ để thử bố cục; bản in lấy từ danh sách.

## Cần từ Viện

- Loại dây đeo và vỏ thẻ (khổ vỏ quyết định khổ thẻ; 90×130 mm là giả định).
- Số lượng học viên offline dự kiến, số người Ban tổ chức.
- Có in đơn vị công tác lên thẻ không (dữ liệu cá nhân hiển thị công khai).

## Xuất

`badge/export/`: `T1-mau.pdf`, `T2-mau.pdf`, `T3-mau.pdf`; bản ghép để ngoài repo.
