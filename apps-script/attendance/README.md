# Điểm danh chuỗi khóa R 01/2027

Cả khóa dùng một Google Sheet. Trang tính **Điểm danh** có mỗi học viên một dòng và mỗi buổi một cột (hàng 1 ghi ngày, hàng 2 ghi Sáng hoặc Chiều). Hai công cụ cùng ghi vào ô của học viên ở cột buổi đang học:

- **Học viên Zoom:** Zoom Meeting Gate Keeper (repo `zoom-meeting-gatekeeper`) chạy trong Zoom của chủ phòng. Học viên vào bằng link chung của khóa và chờ ở phòng chờ. Tên Zoom khớp tên trong danh sách thì Gate Keeper tự cho vào và ghi `ONL`.
- **Học viên tại lớp:** lễ tân quét mã QR trên thẻ bằng điện thoại. Ứng dụng web trong thư mục này ghi `OFF` và ghi giờ vào trang tính Lượt quét.

Ô còn trống nghĩa là học viên chưa có mặt. Khoảng 30 phút sau giờ học, lễ tân bấm **Xem danh sách** ở mục Chưa điểm danh trên ứng dụng. Danh sách hiện những học viên của khóa đang học còn ô trống, kèm số điện thoại để gọi nhắc. Danh sách buổi học lúc đó gồm: người có `OFF`, người có `ONL`, và người chưa điểm danh.

Ô có `OFF` cũng chặn người dùng cùng tên vào Zoom trong buổi đó (quy tắc của Gate Keeper), nên một người không được tính hai lần.

## Chuẩn bị (làm một lần)

### Sheet và ứng dụng quét thẻ

1. Dùng tài khoản `@vienphuongnam.com.vn` tạo một Google Sheet mới, ví dụ "Điểm danh R 01/2027".
2. Trong Sheet: Tiện ích mở rộng > Apps Script. Dán nội dung `Code.gs` vào file `Code.gs`. Thêm file HTML tên `Index` và dán nội dung `Index.html`.
3. Chọn hàm `setup`, bấm Chạy, cấp quyền. Sheet có trang tính Điểm danh (11 cột thông tin học viên và 16 cột buổi học) và trang tính Lượt quét. Tải lại Sheet sẽ thấy menu **Điểm danh**.
4. Triển khai > Tùy chọn triển khai mới > Ứng dụng web:
   - Thực thi với tư cách: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai trong vienphuongnam.com.vn**

   Nhờ đó chỉ tài khoản của Viện mở được trang. Học viên tự quét thẻ của mình sẽ gặp trang đăng nhập Google.
5. Chép link `/exec` vừa nhận vào dòng `var WEBAPP_URL = '';` trong `Code.gs` rồi lưu.
6. Trên điện thoại của từng lễ tân: đăng nhập tài khoản Viện trong trình duyệt mặc định (Safari trên iPhone, Chrome trên Android), vì camera mở link bằng trình duyệt đó.

Sửa `Code.gs` hay `Index.html` sau khi đã triển khai thì phải vào Triển khai > Quản lý triển khai > sửa > Phiên bản mới, trang điểm danh mới nhận bản sửa.

Không đổi tên các cột Họ và tên lót, Tên, Ghi chú và không chèn cột vào giữa hàng ngày, vì Gate Keeper đọc theo các tiêu đề đó.

### Gate Keeper

1. Chia sẻ Sheet cho email service account của Gate Keeper, quyền Người chỉnh sửa.
2. Trong Gate Keeper > Course setup: dán link Sheet này vào ô master sheet. Ô QR sheet cũng dán link này, vì phần quét tại lớp do ứng dụng ở đây làm, không dùng tab QR của Gate Keeper.
3. Chạy kiểm tra đọc và ghi của Gate Keeper. Kiểm tra ghi tạo trang tính `_GateKeeperTest`, để nguyên trang này.

Cách cài máy chủ, Cloudflare Tunnel và tài khoản Zoom nằm trong repo Gate Keeper (`deployment/TARGET-MACHINE-README.md`, `docs/co-host-zoom-account-guide.md`).

### Danh sách học viên

1. Từ Sổ học viên (Sheet đăng ký), chép học viên đã hoàn tất học phí vào trang tính Điểm danh, từ hàng 3, mỗi người một dòng:
   - Mã học viên: lấy từ cột Mã học viên. Mã này đã gửi cho học viên trong email xác nhận.
   - Họ và tên lót, Tên: đúng như đăng ký. Gate Keeper khớp tên Zoom theo hai cột này.
   - Gói: lấy từ cột Mã gói (`Gói 1` đến `Gói 6`).
   - Hình thức: `Trực tiếp` hoặc `Online`.
   - Số điện thoại: để gọi nhắc từ danh sách chưa điểm danh.
2. Kiểm tra tên trùng: hai học viên cùng họ tên thì Gate Keeper không tự cho ai vào. Ghi vào cột Ghi chú của mỗi người một tên Zoom riêng, ví dụ `Zoom: Nguyễn Thị Hương BV Chợ Rẫy`, và báo từng người đặt đúng tên đó.
3. Menu Điểm danh > **Tạo link QR**. Mỗi dòng có Mã học viên nhận một Link QR. Dòng chưa có mã thì không có link. Ứng dụng không tự cấp mã, để mã không trùng với mã đã gửi cho học viên.
4. Tạo ảnh QR hàng loạt (mục bên dưới), in lên thẻ.
5. Gửi học viên:
   - Học viên tại lớp: ảnh mã QR của mình, để dùng khi quên thẻ.
   - Học viên Zoom: link Zoom chung của khóa, kèm lời dặn đặt tên Zoom đúng họ tên đã đăng ký (có dấu hay không dấu đều được), không thêm chức danh hay tên đơn vị.

Không sửa Mã học viên, vì thẻ in theo mã. Người đăng ký muộn: thêm dòng mới rồi bấm Tạo link QR lần nữa.

## Tạo ảnh QR hàng loạt

Các trang tạo QR miễn phí như emn178 chỉ tạo được từng mã một. Script `qr.py` tạo cả danh sách trong một lần và chạy trên máy, không gửi link đi đâu.

1. Mở trang tính Điểm danh > Tệp > Tải xuống > Giá trị được phân tách bằng dấu phẩy (.csv).
2. Cài thư viện (một lần): `pip install segno`
3. Chạy `python apps-script/attendance/qr.py diem-danh.csv qr`. Mỗi học viên có một ảnh trong thư mục `qr`, tên theo mã, ví dụ `R27-001.png`. Script báo các dòng bị bỏ qua vì thiếu Mã học viên hoặc Link QR.

File CSV và thư mục ảnh có danh sách học viên, nên để ngoài repo. In QR trên thẻ rộng ít nhất 25 mm.

## Chạy thử trước khóa học

1. Thêm một cột buổi thử: hàng 1 ghi ngày hôm nay (ví dụ `20/10/2026`), hàng 2 ghi `Sáng` hoặc `Chiều` đúng buổi đang thử. Ngày ngoài lịch khóa thì ứng dụng không kiểm tra gói.
2. Thêm vài học viên thử có Mã học viên, bấm Tạo link QR.
3. Thử quét thẻ, tra tên, xem danh sách chưa điểm danh. Trong Gate Keeper, chọn buổi thử và cho một tài khoản Zoom thử vào phòng chờ.
4. Xong thì xóa cột buổi thử, các học viên thử và các dòng thử trong Lượt quét.

## Mỗi buổi học

Giờ học 08:30 đến 12:00 và 13:30 đến 17:00; ngày đầu tiên bắt đầu 08:00.

**30 phút trước giờ học**

- Chủ phòng Zoom: mở phòng (Waiting Room bật), mở Gate Keeper, chọn đúng ngày và Sáng hoặc Chiều, nhận quyền điều khiển.
- Lễ tân: mở link ứng dụng (link `/exec`) trên điện thoại. Đầu trang phải ghi đúng khóa và buổi.

**Trong giờ đón**

- Học viên tại lớp: quét QR trên thẻ. Quét trước 12:00 tính buổi sáng, từ 12:00 tính buổi chiều.
- Học viên Zoom: Gate Keeper tự cho vào. Tên không khớp thì nằm ở hàng chờ duyệt của Gate Keeper. Chủ phòng xác nhận người đó, bấm duyệt và lưu alias để lần sau tự vào.

| Ứng dụng quét thẻ hiện | Nghĩa | Lễ tân làm gì |
|---|---|---|
| Nền xanh cobalt, "Đã ghi lúc 08:14" | Đã ghi OFF | Mời vào lớp |
| Nền xám, "Đã điểm danh lúc…" | Người này đã điểm danh buổi này | Không cần làm gì |
| Nền xám, "Đã vào Zoom buổi này" | Gate Keeper đã ghi ONL | Hỏi lại, báo chủ phòng Zoom nếu có người khác dùng tên này |
| Viền đỏ, "Không ghi: không học K1" | Gói của học viên không có khóa đang học | Hỏi lại gói, báo Ban tổ chức |
| Viền đỏ, "Không ghi: không có mã…" | Mã không có trong danh sách | Tìm theo tên ở ô bên dưới |
| Viền đỏ, "Không ghi: giờ này không có buổi học" | Hôm nay hoặc buổi này không có cột trong trang Điểm danh | Kiểm tra hàng ngày và hàng Sáng/Chiều |

**Quên thẻ:** gõ tên (không dấu cũng được) hoặc 4 số cuối điện thoại vào ô Học viên quên thẻ. Hỏi ngày sinh, khớp thì bấm Điểm danh. Phát thẻ trống, viết tay tên dùng trong ngày. Cột Nguồn trong Lượt quét ghi "Tra tên"; lọc cột này để biết ai hay quên thẻ.

**Không có trong danh sách:** ghi vào danh sách giấy, mời vào học. Ban tổ chức xác nhận học phí, thêm dòng vào trang Điểm danh và gõ `OFF` vào ô buổi đó.

**Sau 30 phút vào học**

1. Lễ tân bấm **Xem danh sách** ở mục Chưa điểm danh. Đầu trang cập nhật số người tại lớp và trên Zoom.
2. Gọi từng người trong danh sách. Người học Online nói đang ở phòng chờ thì báo chủ phòng Zoom xem hàng chờ duyệt.
3. Trợ giảng đếm người trong phòng học, so với số "tại lớp". Chủ phòng Zoom so số người trong phòng Zoom với số "Zoom". Chênh lệch thì kiểm tra lại.
4. Bấm **Tải lại** để có danh sách mới nhất rồi báo cáo.

**Nghỉ trưa**

Gate Keeper chỉ ghi khi học viên đi qua phòng chờ. Người ở lại phòng Zoom suốt giờ trưa sẽ không có dấu buổi chiều. Vì vậy:

1. 12:00: chủ phòng chọn Kết thúc cuộc họp cho mọi người.
2. Trong Gate Keeper, chọn buổi Chiều của ngày đó.
3. 13:00: mở lại phòng bằng link cũ. Học viên vào lại qua phòng chờ và được ghi `ONL` cho buổi chiều.

**Khi có sự cố**

- Gate Keeper không chạy: chủ phòng cho vào tay từ phòng chờ. Một người phụ trách gõ `ONL` vào ô buổi của từng người được cho vào. Danh sách chưa điểm danh vẫn đúng.
- Lễ tân mất mạng: ghi danh sách giấy. Khi có mạng, gõ `OFF` vào ô buổi của từng người.

## Cuối khóa

Trang Điểm danh là kết quả: `OFF` là có mặt tại lớp, `ONL` là có mặt trên Zoom, ô trống là vắng. Muốn đếm số buổi có mặt của một khóa, thêm một cột cuối, ví dụ K1 ở cột L đến Q: `=COUNTIF(L3:Q3;"?*")`.

## Kiểm tra code

```bash
node apps-script/attendance/check.js
```

Bài kiểm tra chạy `Code.gs` trên một Sheet giả lập trong bộ nhớ, gồm cả ô `ONL` do Gate Keeper ghi.
