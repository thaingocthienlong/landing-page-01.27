# Hướng dẫn soạn và cập nhật bảng hỏi đáp (FAQ) cho trợ lý trên trang

Trợ lý trên trang trả lời theo ba tầng:

1. **Bảng FAQ** (tab `FAQ` trong Google Sheet đăng ký). Câu hỏi khớp rõ với một dòng thì trợ lý trả lời nguyên văn cột "Trả lời", ngay lập tức, không gửi đi đâu.
2. **AI miễn phí** (Gemini, rồi Cloudflare) cho câu chưa khớp. AI được gửi kèm 3 dòng FAQ gần nhất để tham khảo cách Viện trả lời.
3. **Số điện thoại và Zalo** khi không ai trả lời được. Nếu có dòng FAQ gần giống, học viên được chọn câu gần nhất.

Bảng FAQ càng đầy đủ thì trợ lý càng nhanh, càng đúng, và càng ít câu hỏi của học viên phải gửi cho dịch vụ AI bên ngoài.

## Các cột trong tab FAQ

| Cột | Ý nghĩa | Ví dụ |
|---|---|---|
| Mã | Tên ngắn, không dấu, không trùng. Dùng để đọc nhật ký. | `goi-hoc-phi` |
| Nhóm | Để dễ lọc: Học phí, Lịch học, Đăng ký... | Học phí |
| Câu hỏi | Câu hỏi chuẩn, viết có dấu. Hiện cho học viên khi trợ lý gợi ý. | Học phí các gói là bao nhiêu? |
| Cách hỏi khác | Mỗi dòng một cách hỏi (xuống dòng trong ô: Ctrl+Enter, hoặc Alt+Enter). Càng nhiều cách hỏi thật càng tốt. | hp goi 1 bao nhieu<br>giá khóa học<br>đóng bao nhiêu tiền |
| Trả lời | Câu trả lời đã duyệt, hiện nguyên văn. | Dạ, Gói 1 là 8.800.000 đồng/học viên... |
| Từ ngày / Đến ngày | Để trống nếu luôn đúng. Ghi `dd/mm/yyyy` nếu câu trả lời chỉ đúng trong một khoảng. | Đến ngày `07/12/2026` |
| Bật | `Có` để dùng, `Không` để tạm tắt dòng mà không xóa. | Có |

Sửa xong là có hiệu lực sau tối đa vài phút.

### Cách viết "Cách hỏi khác"

Học viên nhắn qua Zalo, Messenger trên điện thoại nên hay viết tắt và bỏ dấu. Với mỗi câu hỏi, ghi 8 đến 15 cách hỏi **khác nhau thật sự**:

- Có dấu và không dấu: `học phí bao nhiêu`, `hoc phi bao nhieu`.
- Viết tắt thường gặp: hp (học phí), đk/dk (đăng ký), sdt, stk, ck (chuyển khoản), gv (giảng viên), ko/k (không), j (gì), bn (bao nhiêu), onl (online). Trợ lý đã tự hiểu các viết tắt này, nhưng ghi thêm vẫn tốt.
- Từ đồng nghĩa: giá / phí / tiền / chi phí; khai giảng / bắt đầu / học khi nào; ghi danh / đăng ký.
- Câu ngắn kiểu tin nhắn: `lịch học?`, `học phí`.
- Không cần chép lại lời chào ("chào ad", "cho em hỏi"): trợ lý tự bỏ qua.

### Câu trả lời

- Xưng "em", gọi "anh/chị", 1 đến 4 câu ngắn. Có thể gạch đầu dòng bằng "- " và in đậm bằng `**...**`. Không dùng bảng, tiêu đề, biểu tượng cảm xúc.
- Mọi con số (học phí, ngày, phần trăm, số tài khoản) phải đúng như thông báo chính thức.
- Số tiền sau ưu đãi ghi là "tạm tính" và nói Viện xác nhận số tiền chính thức.
- Muốn chỉ học viên tới phiếu đăng ký, viết đúng cụm **Đăng ký khóa học**: trang tự biến nó thành đường dẫn.
- Số điện thoại viết đúng dạng (028) 2242 6789, 0949 761 636, 0912 114 511: trang tự biến thành nút gọi.
- Điều thông báo chưa có (giờ học từng buổi, link Zoom, ghi hình, hóa đơn, hoàn/hủy, còn chỗ, điều kiện cấp giấy chứng nhận): trả lời là thông báo chưa có thông tin và mời gọi Viện, cho tới khi Viện có câu trả lời chính thức.

### Câu trả lời đổi theo ngày

Ví dụ ưu đãi hoàn tất trước 08/12/2026: tạo hai dòng.

- `uu-dai-som`: Đến ngày `07/12/2026`, trả lời về mức giảm 10%.
- `uu-dai-som-het`: Từ ngày `09/12/2026`, trả lời rằng ưu đãi đã hết.

Hai ngày 08/12 và 28/12 cố ý để trống, vì thông báo ghi "trước" các ngày này; hôm đó trợ lý sẽ mời học viên liên hệ Viện xác nhận. Khi Viện chốt được hai ngày này có tính hay không, sửa ngày ở các dòng tương ứng.

## Lấy câu hỏi từ các cuộc tư vấn trên Facebook

Mục tiêu: biết học viên thật hỏi gì và hỏi bằng lời nào, rồi đưa vào cột "Cách hỏi khác" và thêm dòng mới khi cần.

1. **Xuất tin nhắn của Trang.** Tin nhắn của Trang không xuất hàng loạt được từ hộp thư Meta Business Suite; cách làm là tải thông tin của Trang: Trung tâm tài khoản (Accounts Center) > Thông tin và quyền của bạn > Tải thông tin của bạn > chọn Trang của Viện > chọn mục Tin nhắn, định dạng JSON hoặc HTML, khoảng thời gian các khóa trước. Facebook gửi tệp nén khi chuẩn bị xong. Tệp này có họ tên, số điện thoại của học viên: chỉ lưu trên máy của Viện, xóa sau khi soạn xong.
2. **Lọc câu hỏi, bỏ thông tin cá nhân.** Đọc qua và chép ra các câu hỏi về khóa học, bỏ họ tên, số điện thoại, email, nơi làm việc. Gộp các câu cùng ý vào một dòng FAQ.
3. **Có thể nhờ AI chạy ngay trên máy văn phòng** (không gửi dữ liệu học viên ra ngoài): cài LM Studio hoặc Ollama trên máy Truyen-Thong, tải Gemma 4 E4B (vừa card RTX 2060 12 GB), dán từng đoạn hội thoại vào và dùng câu lệnh sau:

   > Dưới đây là một đoạn hội thoại tư vấn giữa Viện Phương Nam và học viên. Hãy liệt kê các câu hỏi của học viên về khóa học, mỗi câu một dòng, giữ nguyên cách viết của học viên (kể cả viết tắt, không dấu), nhưng xóa họ tên, số điện thoại, email, nơi làm việc. Với mỗi câu, ghi thêm chủ đề ngắn (học phí, lịch học, đăng ký, thanh toán, nội dung khóa, giảng viên, chuẩn bị, giấy chứng nhận, khác). Không thêm câu hỏi nào không có trong đoạn hội thoại.

   Kết quả AI chỉ là bản nháp: người soạn vẫn kiểm tra trước khi đưa vào bảng.
4. **Câu trả lời lấy từ thông báo chính thức**, không chép nguyên câu trả lời cũ trên Facebook nếu số liệu đã khác (học phí, ngày, ưu đãi của đợt này).

## Thử một câu hỏi ngay trong Sheet

Ở một ô trống bất kỳ (ví dụ tab mới tên "Thử"), gõ:

```
=FAQ_KHOP("hp goi 1 bao nhieu")
```

Kết quả gồm 4 ô: cách xử lý (`trả lời` nghĩa là trợ lý trả lời bằng bảng FAQ; `AI hoặc gợi ý` nghĩa là chưa đủ chắc), mã dòng gần nhất, điểm, và tỷ lệ từ khớp. Nếu một câu học viên hay hỏi mà ra `AI hoặc gợi ý` hoặc ra sai dòng, thêm câu đó vào "Cách hỏi khác" của dòng đúng.

## Rà soát hằng tuần (15–30 phút)

Mở tab `Hỏi đáp` (nhật ký trò chuyện), lọc cột "Trạng thái":

| Trạng thái bắt đầu bằng | Nghĩa | Việc cần làm |
|---|---|---|
| `faq:` | Trả lời bằng bảng FAQ (mã dòng ở sau) | Thỉnh thoảng đọc lại xem có trả lời đúng ý không |
| `ok` | AI trả lời | Nếu câu này hay gặp, thêm vào bảng FAQ để lần sau trả lời ngay, đúng lời Viện |
| `...; faq-suggest` | Không ai trả lời được, học viên được gợi ý câu gần nhất | Thêm câu hỏi vào "Cách hỏi khác" của dòng đúng, hoặc tạo dòng mới |
| `no-ai` | Chưa bật AI và bảng không có câu phù hợp | Tạo dòng mới nếu là câu hỏi về khóa học |
| `error-...` | Dịch vụ AI lỗi hoặc hết lượt | Xem `apps-script/README.md`, mục bảng trạng thái |

Mỗi câu học viên hỏi mà bảng chưa có là một dòng nên thêm.
