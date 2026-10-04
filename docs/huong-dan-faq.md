# Hướng dẫn soạn và cập nhật bảng hỏi đáp (FAQ) cho trợ lý trên trang

Trợ lý trên trang trả lời theo ba tầng:

1. **Bảng FAQ** (tab `FAQ` trong Google Sheet đăng ký). Câu hỏi khớp rõ với một dòng thì trợ lý trả lời nguyên văn cột "Trả lời", ngay lập tức, không gửi đi đâu.
2. **AI miễn phí** (Gemini, rồi Cloudflare) cho câu chưa khớp. AI được gửi kèm tối đa 3 dòng FAQ gần nhất để tham khảo cách Viện trả lời.
3. **Số điện thoại và Zalo** khi không ai trả lời được. Nếu có dòng FAQ gần giống, học viên được chọn câu gần nhất.

Bảng FAQ càng đầy đủ thì trợ lý càng nhanh, càng đúng, và càng ít câu hỏi của học viên phải gửi cho dịch vụ AI bên ngoài.

Sửa trực tiếp tab `FAQ` hay tab `Thông tin thêm` thì trợ lý dùng bản mới gần như ngay (chậm nhất 10 phút), không cần đụng tới Apps Script.

## Cập nhật dữ liệu từ trang web

Khi người phụ trách trang web báo đã cập nhật dữ liệu (thêm dòng, thêm cách hỏi thật, sửa câu trả lời, thêm điều Viện xác nhận):

1. Chờ khoảng 5 phút, rồi mở Google Sheet **trên máy tính** (ứng dụng Google Sheets trên điện thoại không có menu này).
2. Chọn menu **Trợ lý AI > Cập nhật dữ liệu từ trang web**. Không thấy menu thì tải lại trang (phím F5).
3. Lần đầu mỗi người dùng menu, Google hỏi quyền: chọn Tiếp tục, chọn tài khoản của mình, rồi Cho phép. Nếu Google báo ứng dụng chưa được xác minh, chọn Nâng cao rồi chọn dòng có tên dự án để đi tiếp (đây là đoạn mã của chính Viện). Cho phép xong, chọn lại menu.

Menu làm gì:

- Dòng mới và cách hỏi mới trên trang web được thêm vào bảng. Cách hỏi mà trang web đã bỏ (ví dụ đã chuyển sang dòng khác) được xóa khỏi bảng.
- Dòng trang web đã bỏ được tắt (ghi `Không` ở cột Bật), một lần duy nhất: nếu Viện vẫn muốn dùng thì ghi lại `Có`, các lần sau menu không tắt nữa. Nếu sau này trang web dùng lại dòng đó, menu tự bật lại.
- Ô nào vẫn còn nguyên chữ của lần cập nhật trước thì được cập nhật. **Ô nào nhân viên đã sửa thì giữ nguyên chữ của nhân viên.** Bản mới nằm trong ghi chú của ô (ô có tam giác nhỏ ở góc, rê chuột vào để xem), giữa dòng `Bản mới trên trang web...` và dòng `(Hết ghi chú của menu cập nhật)`. Ghi chú nhân viên tự viết ở phía trên hay phía dưới hai dòng đó vẫn được giữ. Thấy bản mới đúng hơn thì chép phần chữ nằm giữa hai dòng đó vào ô; phần ghi chú của menu tự mất ở lần cập nhật sau.
- Dòng hay cách hỏi nhân viên đã xóa thì không bị thêm lại. Dòng nhân viên tự thêm và các cột nhân viên thêm bên phải không bị đụng tới. Không dòng nào bị xóa.
- Cách hỏi mới nào đã có ở một dòng khác đang bật thì chưa được thêm, để trợ lý không phải chọn giữa hai dòng; thông báo ghi rõ cách hỏi nào. Khi dòng kia được tắt hoặc bỏ cách hỏi đó, lần cập nhật sau sẽ thêm. Nếu câu hỏi của một dòng mới trùng với dòng khác, thông báo cũng ghi rõ: ghi `Không` ở cột Bật của một trong hai dòng.
- Nếu trang web có dòng mới mà Mã trùng với một dòng Viện tự thêm, menu không gộp hai dòng và chưa thêm dòng mới. Thông báo ghi rõ dòng nào: đổi Mã của dòng Viện tự thêm (ví dụ thêm chữ `-vien`) rồi chọn lại menu.
- Nếu tab `FAQ` hay tab `Thông tin thêm` bị xóa, hoặc bị xóa hết các dòng, lần cập nhật sau tạo lại đủ các dòng của trang web. Muốn tắt một dòng thì ghi `Không` ở cột Bật, đừng xóa.
- Kết quả hiện trong hộp thông báo, kèm danh sách các ô được giữ nguyên, và được ghi ở tab `Lịch sử cập nhật` (tab tự tạo ở lần đầu, ghi cả những lần báo lỗi).
- Nếu thông báo báo lỗi, làm theo hướng dẫn trong thông báo: thường là chờ vài phút rồi chọn lại menu (chọn lại nhiều lần cũng không sao). Vẫn lỗi thì chụp màn hình thông báo gửi người phụ trách trang web.

Lưu ý:

- **Đừng đổi mã (cột Mã) hay tên các cột** của tab `FAQ` và tab `Thông tin thêm`. Menu dùng mã để tìm dòng: đổi mã thì dòng đó thành dòng riêng của nhân viên, các bản cập nhật sau không tới được nữa. Đổi tên, thêm hay xóa cột ở giữa bảng thì menu dừng lại và báo lỗi.
- Lần đầu chọn menu, dòng hay cách hỏi đã bị xóa khỏi bảng từ trước đó sẽ được thêm lại, vì menu chưa biết là nhân viên đã xóa. Sau lần đầu, xem lại bảng và xóa hoặc tắt lại nếu cần; từ lần thứ hai menu đã nhớ.
- Khôi phục bảng về một phiên bản cũ (Tệp > Nhật ký phiên bản) thì menu vẫn nhớ lần cập nhật gần nhất. Lần cập nhật sau, những ô khác với lần đó được coi là nhân viên đã sửa (giữ nguyên, bản mới nằm trong ghi chú), và những cách hỏi lần đó đã thêm không được thêm lại. Nếu cần, báo người phụ trách trang web.

## Tab "Thông tin thêm"

Những điều Viện xác nhận thêm ngoài thông báo (giờ học, học online, giấy chứng nhận, hóa đơn...) nằm ở tab này. Tab tự xuất hiện sau lần đầu chọn menu **Trợ lý AI > Cập nhật dữ liệu từ trang web**. Mỗi điều một dòng: `Mã`, `Nội dung`, `Bật`. AI đọc các dòng đang bật để trả lời những câu bảng FAQ không có; sửa xong thì AI dùng gần như ngay.

- Viện xác nhận thêm điều gì (ví dụ sĩ số dự kiến), thêm một dòng: mã ngắn không dấu, chưa có ở dòng nào trong tab (ví dụ `si-so`), nội dung viết như một câu khẳng định, cột Bật ghi `Có`.
- Điều nào không còn đúng: sửa nội dung, hoặc ghi `Không` ở cột Bật.
- Chỉ ghi điều Viện đã xác nhận, đúng như Viện nói; AI sẽ nói lại với học viên như sự thật.

## Các cột trong tab FAQ

| Cột | Ý nghĩa | Ví dụ |
|---|---|---|
| Mã | Tên ngắn, không dấu, không trùng. Menu cập nhật dùng mã để tìm dòng, nên **đừng đổi mã của dòng có sẵn**. Mã cũng hiện trong nhật ký. | `goi-hoc-phi` |
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
- Gói và khóa: nếu dòng chỉ nói về một gói hay một khóa (ví dụ lịch Khóa 1), ghi số đó trong cách hỏi ("khóa 1 học ngày nào"). Nếu dòng đúng cho mọi gói (ví dụ ưu đãi nhóm), đừng ghi số gói nào, hoặc ghi đủ các gói: dòng có ghi "gói 2" thì sẽ không trả lời câu hỏi về "gói 3".
- Câu học viên gõ **giống hệt** một cách hỏi đã có (không tính dấu, chữ hoa và các từ như ạ, ơi, ad, cho em hỏi) luôn được trả lời bằng dòng đó, kể cả câu rất ngắn như `Hỏi giá`. Vì vậy chép nguyên văn tin nhắn thật của học viên là cách chắc nhất. Đừng ghi cùng một cách hỏi cho hai dòng cùng đang bật: khi đó trợ lý không biết chọn dòng nào. Hai dòng thay nhau theo ngày (ưu đãi sớm và ưu đãi đã hết) thì ghi giống nhau được.
- Không chép lời chào hay lời cảm ơn vào "Cách hỏi khác" ("chào ad", "cho em hỏi", "cảm ơn"): trợ lý tự bỏ qua phần lớn các từ này, còn chép vào thì dòng đó dễ bị chọn nhầm cho những câu chỉ có lời chào.

### Câu trả lời

- Giọng như tư vấn viên của Viện: xưng "em", gọi "anh/chị", mở bằng "Dạ, ...", câu đầu trả lời thẳng điều được hỏi, thêm "ạ" khi tự nhiên. Có thể kết bằng một gợi ý ngắn ("anh/chị cần em gửi thêm lịch học không ạ?"), nhưng đừng dòng nào cũng hỏi lại. Không viết tắt, không dùng bảng, tiêu đề, biểu tượng cảm xúc.
- Học viên đọc trên điện thoại, nên đừng viết thành một đoạn dài:
  - Câu đầu là câu trả lời, đứng riêng một đoạn.
  - Phần còn lại chia đoạn ngắn, mỗi đoạn tối đa 2 câu. Giữa hai đoạn để một dòng trống (trong ô: Ctrl+Enter hai lần).
  - Từ 2 ý trở lên (các gói, điều kiện, mốc ngày, các bước) thì mỗi ý một dòng, bắt đầu bằng "- ". Trang tự hiện thành danh sách.
  - In đậm con số chính bằng `**...**`, ví dụ `**8.360.000 đồng**`, `**08/12/2026**`.
  - Ví dụ một ô:

    ```text
    Dạ, mỗi ngày học 2 buổi ạ:
    - Sáng **8:30–11:30**: lý thuyết
    - Chiều **13:30–17:00**: thực hành bằng R trên dữ liệu thực tế

    Lịch học cố định theo lịch GS. Nguyễn Văn Tuấn về Việt Nam giảng dạy, nên không có lớp buổi tối ạ.
    ```

  Nếu một đoạn vẫn quá dài (trên khoảng 170 ký tự), trang tự tách thành câu đầu và các đoạn 2 câu, nhưng tự chia đoạn vẫn dễ đọc hơn.
- Câu hỏi gộp hai ý thì câu trả lời phải có cả hai. Ví dụ nút quảng cáo "Học phí khóa học là bao nhiêu? Hiện đang có ưu đãi gì không?" được ghi ở các dòng ưu đãi, vì các dòng này nêu cả học phí gốc lẫn ưu đãi; nhân viên từng bỏ sót phần ưu đãi ở khoảng 49 cuộc hội thoại.
- Không cần viết "em chào anh/chị" trong câu trả lời: nếu đó là câu hỏi đầu tiên của học viên, trợ lý tự thêm "Dạ, em chào anh/chị." vào đầu.
- Mọi con số (học phí, ngày, phần trăm, số tài khoản) phải đúng như thông báo chính thức.
- Số tiền sau ưu đãi ghi là "tạm tính" và nói Viện xác nhận số tiền chính thức.
- Muốn chỉ học viên tới phiếu đăng ký, viết đúng cụm **Đăng ký khóa học**: trang tự biến nó thành đường dẫn.
- Số điện thoại viết đúng dạng (028) 2242 6789, 0949 761 636, 0912 114 511: trang tự biến thành nút gọi.
- Điều thông báo chưa có và Viện chưa xác nhận (còn chỗ, sĩ số lớp, số buổi phải tham dự để được cấp giấy chứng nhận, học thử, giờ làm việc): trả lời là chưa có thông tin và mời gọi Viện, cho tới khi Viện có câu trả lời chính thức. Bảo lưu hay rút học phí: mời liên hệ chuyên viên tư vấn. Những điều Viện đã xác nhận ngày 03/10/2026 (giờ học, học online cùng lúc với lớp, ngôn ngữ giảng dạy, tài liệu và sách, giấy chứng nhận, link xem lại bản ghi, hóa đơn VAT, liên hệ trong khoảng 1 ngày, xác nhận số tiền trước khi chuyển khoản, phiếu thu, nhóm Zalo lớp, hỗ trợ sau khóa) đã có trong bảng FAQ và trong tab `Thông tin thêm`.

### Câu trả lời đổi theo ngày

Ví dụ ưu đãi hoàn tất trước 08/12/2026: tạo hai dòng.

- `uu-dai-som`: Đến ngày `07/12/2026`, trả lời về mức giảm 10%.
- `uu-dai-som-het`: Từ ngày `09/12/2026` đến ngày `27/12/2026`, trả lời rằng ưu đãi đã hết (sau hạn chót 28/12 thì không nói "hiện vẫn có ưu đãi" nữa).

Các dòng về ưu đãi nhóm, cộng dồn ưu đãi và đăng ký nhóm cũng kết thúc ngày `27/12/2026`: sau hạn chót, câu hỏi về ưu đãi được chuyển cho AI, và AI mời học viên liên hệ Viện.

Trợ lý vẫn so câu hỏi với các dòng đã hết hạn. Nếu một dòng hết hạn khớp hơn mọi dòng đang dùng (ví dụ ngày 15/12 có người hỏi "đóng trước 8/12 được giảm bao nhiêu"), trợ lý không trả lời bằng bảng mà chuyển cho AI. Vì vậy khi tạo dòng "đã hết", chép sang đó các cách hỏi của dòng cũ.

Hai ngày 08/12 và 28/12 cố ý để trống, vì thông báo ghi "trước" các ngày này; hôm đó trợ lý sẽ mời học viên liên hệ Viện xác nhận. Khi Viện chốt được hai ngày này có tính hay không, sửa ngày ở các dòng tương ứng.

## Lấy câu hỏi từ các cuộc tư vấn trên Facebook

Mục tiêu: biết học viên thật hỏi gì và hỏi bằng lời nào, rồi đưa vào cột "Cách hỏi khác" và thêm dòng mới khi cần. Tin nhắn có họ tên, số điện thoại của học viên, nên toàn bộ việc xử lý làm trên máy của Viện, không dán vào ChatGPT, Gemini hay dịch vụ AI trực tuyến nào (Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 áp dụng từ 01/01/2026).

1. **Xuất tin nhắn của Trang** (người có toàn quyền quản lý Trang, làm trên máy tính):
   - Trên Facebook, chuyển sang Trang của Viện. Vào Cài đặt và quyền riêng tư > Cài đặt > Trung tâm tài khoản > Thông tin và quyền của bạn > Tải thông tin của bạn xuống > Tải xuống hoặc chuyển thông tin, rồi chọn Trang.
   - Chọn "Một số thông tin của bạn" > đánh dấu Tin nhắn > Tải xuống thiết bị. Khoảng thời gian: các đợt khóa trước (ví dụ 3 năm gần nhất). Định dạng: **JSON**. Chất lượng file phương tiện: Thấp.
   - Facebook báo khi tệp sẵn sàng (vài phút đến khoảng một ngày); đường dẫn tải hết hạn sau vài ngày. Tên các mục có thể khác đôi chút: làm theo chữ trên màn hình.
   - Nên **thử trước với 1 tháng** để chắc tệp có hộp thư của Trang, rồi mới xuất cả khoảng thời gian.
   - Hộp thư Meta Business Suite không xuất tin nhắn hàng loạt được (nút Xuất ở đó chỉ xuất số liệu thống kê). Đừng dùng tiện ích "xuất tin nhắn" của bên thứ ba: dữ liệu học viên sẽ đi qua một công ty khác.
2. **Làm sạch bằng công cụ có sẵn** (`tools/facebook-to-text.py` trong kho mã của trang; nhờ người phụ trách trang chép tệp này vào máy). Công cụ sửa lỗi chữ tiếng Việt của tệp Facebook (chữ "Há»c" thành "Học"), sắp tin nhắn theo thứ tự thời gian, ghi "Viện:" / "Học viên:" ở đầu mỗi lượt, thay tên học viên, email, số điện thoại, số CCCD/CMND bằng `[tên]`, `[email]`, `[số điện thoại]`, `[số giấy tờ]`, và chia thành các tệp `hoi-thoai-001.txt`, `hoi-thoai-002.txt`… mỗi tệp 15 cuộc hội thoại.
   - Cài Python từ python.org (một lần; khi cài, đánh dấu "Add python.exe to PATH").
   - Mở cmd ở thư mục chứa công cụ và chạy: `py facebook-to-text.py "C:\Users\<tên>\Downloads\facebook-xxxx.zip" "C:\FAQ\hoi-thoai"` (đường dẫn tệp tải về và thư mục kết quả). Công cụ tự đoán tên Trang. Nếu công cụ dừng và in ra một danh sách tên (ví dụ khi tệp chỉ có một cuộc hội thoại), chạy lại và thêm `--page "Tên Trang"`, chép đúng tên Trang trong danh sách đó.
   - Tên học viên viết **bên trong** tin nhắn ("chào chị Lan") không tự xóa được: đọc lại trước khi dùng. Soạn xong thì xóa tệp tải về và thư mục kết quả.
3. **Gom câu hỏi.** Đọc các tệp, chép các câu hỏi về khóa học vào "Cách hỏi khác" của dòng đúng, giữ nguyên cách viết của học viên (viết tắt, không dấu). Câu chưa có dòng nào thì tạo dòng mới. Ngoài tin nhắn, bình luận dưới các bài đăng khóa trước và các câu trả lời mẫu đã lưu trong Business Suite cũng là nguồn tốt.
4. **Có thể nhờ AI chạy ngay trên máy văn phòng** (không gửi dữ liệu ra ngoài): cài LM Studio (miễn phí cho công việc, không cần tài khoản) trên máy Truyen-Thong, tìm "Gemma 4" và tải bản **12B Q4_K_M** (khoảng 8 GB, viết tiếng Việt tốt hơn); nếu card đồ họa đang bận dựng video/ảnh thì dùng bản **E4B** (khoảng 5 GB). Máy chỉ bật trong giờ hành chính nên làm vào lúc vắng việc (giờ trưa, cuối ngày); nếu trợ lý trên máy này đã được cài, bấm `AI-giai-phong-GPU` trước. Khi nạp mô hình trong LM Studio, mở phần cài đặt nạp (load settings) và đặt **Context Length** là **16384** (mặc định chỉ 4096, không đủ cho một tệp; nếu LM Studio báo "context length of only 4096 tokens" là chưa đổi). Mở một tệp `hoi-thoai-xxx.txt`, dán vào LM Studio kèm câu lệnh:

   > Dưới đây là các cuộc hội thoại tư vấn giữa Viện Phương Nam và học viên, đã ẩn thông tin cá nhân. Hãy liệt kê các câu hỏi của học viên về khóa học, mỗi câu một dòng, giữ nguyên cách viết của học viên (kể cả viết tắt, không dấu), bỏ các câu chào hỏi. Gộp các câu cùng ý vào một nhóm và đặt tên chủ đề ngắn (học phí, lịch học, đăng ký, thanh toán, nội dung khóa, giảng viên, chuẩn bị, giấy chứng nhận, khác). Không thêm câu hỏi nào không có trong hội thoại. Nếu có câu trả lời của Viện kèm số tiền, ngày, ưu đãi, địa chỉ hoặc số tài khoản, ghi "CẦN KIỂM TRA" bên cạnh.

   Kết quả AI chỉ là bản nháp: người soạn vẫn kiểm tra trước khi đưa vào bảng.
5. **Câu trả lời lấy từ thông báo chính thức**, không chép nguyên câu trả lời cũ trên Facebook nếu số liệu đã khác (học phí, ngày, ưu đãi của đợt này).

Lặp lại sau mỗi đợt khóa, chỉ xuất khoảng thời gian mới.

## Thử một câu hỏi ngay trong Sheet

Ở một ô trống bất kỳ (ví dụ tab mới tên "Thử"), gõ:

```
=FAQ_KHOP("hp goi 1 bao nhieu")
```

Kết quả gồm 5 ô: cách xử lý (`trả lời` nghĩa là trợ lý trả lời bằng bảng FAQ; `AI hoặc gợi ý` nghĩa là chưa đủ chắc), mã dòng trả lời (hoặc dòng gần nhất), điểm, độ phủ (phần câu hỏi dòng đó khớp, từ càng hiếm càng nặng), và lý do:

| Lý do | Nghĩa | Việc cần làm |
|---|---|---|
| `dòng thiếu từ: ...` | Câu hỏi có một từ mà dòng gần nhất không có (ví dụ "python") | Nếu dòng đó đúng là câu trả lời, thêm câu hỏi vào "Cách hỏi khác" của dòng. Nếu không, đó là câu hỏi mới: để AI trả lời, hoặc tạo dòng mới |
| `khớp ít từ`, `điểm thấp` | Câu hỏi khác xa mọi dòng | Thêm vào dòng đúng, hoặc tạo dòng mới |
| `gần bằng dòng ...` | Hai dòng khớp gần như nhau | Thêm câu hỏi vào dòng đúng để nó vượt lên |
| `dòng nói về gói hoặc khóa khác` | Câu hỏi về "khóa 2" mà dòng gần nhất chỉ ghi "khóa 1" | Thêm vào dòng đúng của khóa/gói đó; nếu dòng đúng cho mọi gói, xem mục "Gói và khóa" ở trên |
| `lời cảm ơn` | Tin nhắn chỉ là lời cảm ơn, không có câu hỏi | Không cần làm gì |
| `khớp nguyên văn` | Câu hỏi giống hệt một cách hỏi của dòng (ô đầu là `trả lời`) | Không cần làm gì |
| `dòng hết hạn khớp hơn: ...` | Một dòng đã hết hạn (hoặc chưa tới ngày) khớp hơn | Sửa dòng thay thế cho dòng hết hạn đó (ví dụ chép cách hỏi sang dòng "đã hết"), **không** thêm vào dòng hiện ở ô thứ hai |

Nếu một câu học viên hay hỏi mà ra sai dòng, thêm câu đó vào "Cách hỏi khác" của dòng đúng.

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
