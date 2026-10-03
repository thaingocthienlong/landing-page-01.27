# Thẻ đeo

Trạng thái: chưa dựng. Phong cách: brand kit v2, nền tối "Data Lab". Ưu tiên: 4 (mẫu duyệt trước 20/12/2026; in danh sách sau hạn chót 28/12/2026, xong trước 07/01/2027).

## Mục đích

Nhận diện người trong phòng học tại 45 Đinh Tiên Hoàng: Ban tổ chức điểm danh theo khóa, giảng viên gọi tên học viên. Chỉ học viên offline cần thẻ.

## Biến thể và dải vai trò

| Mã | Vai trò | Dải vai trò |
|---|---|---|
| T1 | Học viên | Nền trắng, chữ "HỌC VIÊN" navy #06205a |
| T2 | Giảng viên | Gradient cyan sang xanh lấy từ logo (#51c7f6 → #031f79), chữ trắng |
| T3 | Ban tổ chức | Nền `--bg-0` #061a4d, viền cyan 2 px, chữ trắng |

Màu K1/K2/K3 chỉ dùng cho chip khóa, không dùng cho vai trò. Không dùng đỏ.

## Bố cục (design kit v2, mục 6 "Thẻ đeo"; sơ đồ trong `design-kit/kit.html`)

1. 15 mm trên cùng để trống (lỗ đục dây).
2. Logo trong khung tròn trắng (tối thiểu 14 mm) và "Viện Phương Nam" Oswald.
3. `# Phân tích định lượng với R · 01/2027` JetBrains Mono 9 pt, cyan.
4. Họ tên Source Serif 4 600, 24 pt, trắng, tối đa 2 dòng.
5. Đơn vị công tác Montserrat 10 pt, `--tint`, 1 dòng.
6. Chip khóa (chỉ T1): ba chip K1, K2, K3; khóa trong gói tô màu K với chữ navy, khóa không có trong gói chỉ có viền nét đứt.
7. Dải vai trò ở đáy, cao 18 mm.
8. Nền như poster nhưng tiết chế: gradient, lưới chấm, một lục giác mờ; không code R (quá nhỏ ở khổ thẻ).

## Ghép dữ liệu

Từ trang tính Học viên của Sheet điểm danh (`apps-script/attendance/README.md`), lọc học viên offline: mã, họ, tên, chức vụ/đơn vị, gói, Link QR. Mã QR trên thẻ chứa Link QR; lễ tân quét mã này để điểm danh. Gói đổi ra chip khóa: Gói 1 = K1 K2 K3; Gói 2 = K1 K2; Gói 3 = K1 K3; Gói 4 = K2 K3; Gói 5 = K2; Gói 6 = K3.

Template HTML khổ thật trong `badge/template/` dùng `media/poster/ads/story.css`, xếp 4 thẻ trên một tờ A4 có dấu cắt, xuất PDF bằng Chrome headless. File ghép chứa dữ liệu cá nhân: để ngoài repo. Dự phòng: in thẻ trống tên để viết tay cho người đăng ký muộn hoặc in sai.

## Prompt Claude Design (T1)

```
Dùng design system "VPN · Phân tích định lượng với R (v2 Data Lab)". Đính kèm brand-board.png và kit.png (sơ đồ Thẻ đeo). Thiết kế thẻ đeo dọc 90×130 mm, tràn lề 3 mm, vùng an toàn 6 mm, 15 mm trên cùng để trống cho lỗ đục dây.
Nền gradient xanh đậm #061a4d → #0c3f9e, lưới chấm mờ ở một góc, một lục giác mờ.
Từ trên xuống: logo màu trong khung tròn trắng 14 mm + "Viện Phương Nam" Oswald trắng; "# Phân tích định lượng với R · 01/2027" JetBrains Mono 9 pt cyan #5ad8ff; chuỗi giữ chỗ "Họ Tên Mẫu Có Dấu Đầy Đủ" Source Serif 4 600 24 pt trắng (xuống 2 dòng nếu dài); "[Đơn vị công tác]" Montserrat 10 pt #cfe0ff; ba chip bo tròn "K1" "K2" "K3": K1 tô #5ad8ff chữ #06205a, K2 chỉ viền nét đứt #8fb8ff, K3 tô #c3dbff chữ #06205a; dải đáy cao 18 mm nền trắng, chữ "HỌC VIÊN" Oswald 600 navy #06205a.
Làm thêm: GIẢNG VIÊN (dải gradient #51c7f6 → #031f79, chữ trắng, không chip) và BAN TỔ CHỨC (dải nền #061a4d viền cyan, chữ trắng, không chip).
```

Chuỗi giữ chỗ chỉ để thử bố cục; bản in lấy từ danh sách.

## Cần từ Viện

- Loại dây đeo và vỏ thẻ (khổ vỏ quyết định khổ thẻ; 90×130 mm là giả định).
- Số lượng học viên offline dự kiến, số người Ban tổ chức.
- Có in đơn vị công tác lên thẻ không (dữ liệu cá nhân hiển thị công khai).
- Mã QR điểm danh in mặt trước hay mặt sau thẻ (bố cục ở trên chưa có chỗ cho QR).

## Xuất

`badge/export/`: `T1-mau.pdf`, `T2-mau.pdf`, `T3-mau.pdf`; bản ghép để ngoài repo.
