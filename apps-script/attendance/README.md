# Điểm danh chuỗi khóa R 01/2027

Lễ tân quét mã QR trên thẻ học viên bằng camera điện thoại. Trang điểm danh mở ra và ghi ngay, không cần bấm Gửi. Học viên quên thẻ thì lễ tân tìm theo tên trên cùng trang. Mọi lượt ghi nằm trong một Google Sheet riêng, tách khỏi Sheet đăng ký.

## Cài đặt (làm một lần)

1. Dùng tài khoản `@vienphuongnam.com.vn` tạo một Google Sheet mới, ví dụ "Điểm danh R 01/2027".
2. Trong Sheet: Tiện ích mở rộng > Apps Script. Dán nội dung `Code.gs` vào file `Code.gs`. Thêm file HTML tên `Index` và dán nội dung `Index.html`.
3. Chọn hàm `setup`, bấm Chạy, cấp quyền. Sheet có 4 trang tính: Học viên, Buổi (16 buổi, sáng và chiều của 8 ngày học), Lượt quét, Tổng hợp. Tải lại Sheet sẽ thấy menu **Điểm danh**.
4. Triển khai > Tùy chọn triển khai mới > Ứng dụng web:
   - Thực thi với tư cách: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai trong vienphuongnam.com.vn**

   Nhờ đó chỉ tài khoản của Viện mở được trang. Học viên tự quét thẻ của mình sẽ gặp trang đăng nhập Google.
5. Chép link `/exec` vừa nhận vào dòng `var WEBAPP_URL = '';` trong `Code.gs` rồi lưu.
6. Trên điện thoại của từng lễ tân: đăng nhập tài khoản Viện trong trình duyệt mặc định (Safari trên iPhone, Chrome trên Android), vì camera mở link bằng trình duyệt đó.

Sửa `Code.gs` hay `Index.html` sau khi đã triển khai thì phải vào Triển khai > Quản lý triển khai > sửa > Phiên bản mới, trang điểm danh mới nhận bản sửa.

## Nhập danh sách học viên

1. Dán học viên đã hoàn tất học phí vào trang tính **Học viên**, mỗi người một dòng. Tên cột giống Sheet đăng ký. Cột Gói ghi `Gói 1` đến `Gói 6` (lấy từ cột Mã gói).
2. Menu Điểm danh > **Cấp mã học viên**. Mỗi người mới nhận một mã `R27-001`, `R27-002`… và một Link QR.
3. Dùng cột Link QR để tạo mã QR in lên thẻ và gửi ảnh mã QR cho học viên. Học viên quên thẻ có thể đưa ảnh này trên điện thoại cho lễ tân quét.

Không sửa mã đã cấp, vì thẻ in theo mã. Người đăng ký muộn: thêm dòng mới rồi bấm Cấp mã học viên lần nữa; mã cũ giữ nguyên.

## Chạy thử trước khóa học

Thêm một dòng vào trang tính Buổi với ngày hôm nay, ví dụ `K1 | 05/10/2026 | Sáng`, và vài học viên thử. Quét thử, tìm tên thử. Xong thì xóa dòng buổi thử, các dòng thử trong Lượt quét và học viên thử.

## Trong buổi học

Quét trước 12:00 tính là buổi sáng, từ 12:00 tính là buổi chiều. Đầu trang ghi khóa, buổi và số người đã điểm danh.

| Trang hiện | Nghĩa | Lễ tân làm gì |
|---|---|---|
| Nền xanh cobalt, "Đã ghi lúc 08:14" | Đã ghi | Mời vào lớp |
| Nền xám, "Đã điểm danh lúc…" | Người này đã điểm danh buổi này | Không cần làm gì |
| Viền đỏ, "Không ghi: không học K1" | Gói của học viên không có khóa đang học | Hỏi lại gói, báo Ban tổ chức |
| Viền đỏ, "Không ghi: không có mã…" | Mã không có trong danh sách | Tìm theo tên ở ô bên dưới |
| Viền đỏ, "Không ghi: giờ này không có buổi học" | Hôm nay hoặc buổi này không có trong trang tính Buổi | Kiểm tra trang tính Buổi |

**Quên thẻ:** mở link ứng dụng (link `/exec`, không có `?id=`), gõ tên (không dấu cũng được) hoặc 4 số cuối điện thoại. Hỏi ngày sinh, khớp thì bấm Điểm danh. Phát thẻ trống, viết tay tên dùng trong ngày. Cột Nguồn trong Lượt quét ghi "Tra tên".

**Không có trong danh sách:** ghi vào danh sách giấy, mời vào học. Ban tổ chức xác nhận học phí, thêm vào trang tính Học viên, rồi ghi bù như dòng mất mạng bên dưới.

**Mất mạng:** ghi danh sách giấy. Khi có mạng, thêm từng dòng vào trang tính Lượt quét: Ngày (`08/01/2027`), Buổi (`Sáng` hoặc `Chiều`), Mã, Nguồn `Giấy`.

**Sau 30 phút vào học:** trợ giảng đếm người trong phòng, so với số người đã điểm danh ở đầu trang. Chênh lệch thì kiểm tra lại.

## Cuối ngày

Menu Điểm danh > **Cập nhật tổng hợp**. Trang tính Tổng hợp có mỗi học viên một dòng, mỗi buổi một cột:

- `✓` có mặt, ô trống là chưa điểm danh, `·` là buổi không thuộc gói của học viên.
- Cột K1, K2, K3: số buổi có mặt trên tổng số buổi của khóa, ví dụ `5/6`.
- Cột Tra tên: số lần quên thẻ. Từ 2 lần trở lên thì nhắc học viên.

## Chưa làm

- Điểm danh học viên Zoom: chờ Viện cho biết tài khoản Zoom có bản Pro không.
- Tạo ảnh mã QR: dùng công cụ tạo QR Viện đang dùng với cột Link QR, hoặc làm cùng mẫu thẻ đeo (`media/badge/`).

## Kiểm tra code

```bash
node apps-script/attendance/check.js
```

Bài kiểm tra chạy `Code.gs` trên một Sheet giả lập trong bộ nhớ.
