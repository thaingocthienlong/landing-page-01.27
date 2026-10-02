# Kế hoạch truyền thông: Chuỗi khóa học Phân tích định lượng với R (01/2027)

Ngày lập: 2026-10-02. Nguồn sự thật cho mọi con số: `assets/THÔNG BÁO_v.4_CHUỖI KHÓA NCKH (01.2027).docx`.
Trang đích: `https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r/` (gọi tắt là SITE), đúng link in trong thông báo. Bản GitHub Pages chỉ là bản xem trước; `canonical` trỏ về SITE.

## 1. Mốc thời gian và giai đoạn

| Giai đoạn | Thời gian | Thông điệp chính | Kênh |
|---|---|---|---|
| 1. Ưu đãi sớm | nay đến 08/12/2026 | Nộp học phí trước 08/12 giảm 10% | Google Search, Meta (lạnh + retarget), email, Zalo |
| 2. Hạn chót | 09/12 đến 28/12/2026 | Hạn đăng ký và hoàn tất học phí 28/12 | Google Search, Meta retarget là chính |
| 3. Sau hạn | 29/12/2026 đến 08/01/2027 | Dừng quảng cáo. Chỉ nhắc học viên đã đăng ký (cài R, lịch học) | Email, Zalo |

Ngân sách: chưa có con số. Điểm xuất phát đề xuất: 55% cho giai đoạn 1, 45% cho giai đoạn 2; trong mỗi giai đoạn 60% Google Search, 40% Meta. Xem lại sau 2 tuần đầu theo chi phí mỗi lead (`generate_lead`).

## 2. Đo lường trên trang

### Sự kiện đã cài trong `dist/app.js`

| Hành động của khách | GA4 | Tham số | Meta Pixel | Google Ads |
|---|---|---|---|---|
| Tải trang | `page_view` (tự động) | | `PageView` | |
| Qua bước 1 của phiếu đăng ký | `form_start` | `form_id` | | |
| Gửi đăng ký thành công | `generate_lead` | `currency=VND`, `value` = học phí gói, `package` | `Lead` (`value`, `content_name`) | `conversion` tới `AW-ID/label` |
| Bấm số điện thoại | `phone_click` | `phone_number` | `Contact` | |

`generate_lead` chỉ bắn khi Apps Script trả `ok: true`, nên số lead trong GA4 khớp số dòng trong Google Sheet.

### Gắn ID

Mở `dist/index.html`, tìm khối `window.VPN_TRACKING`. Để trống thì trang không nạp script nào của Google hay Meta.

| Trường | Lấy ở đâu | Dạng |
|---|---|---|
| `ga4` | Đã gắn `G-SVD746Q7LC`, cùng property với vienphuongnam.com.vn | `G-XXXXXXXXXX` |
| `adsId` | Google Ads > Goals > Conversions > New > Website > "Install the tag yourself" | `AW-XXXXXXXXX` |
| `adsLeadLabel` | Cùng màn hình trên, phần `send_to` sau dấu `/` | chuỗi chữ số và ký tự |
| `fbPixel` | Meta Events Manager > Data sources > Pixel | dãy số |

Kiểm tra sau khi gắn: GA4 DebugView (bật qua tiện ích Google Analytics Debugger), tiện ích Meta Pixel Helper, Google Tag Assistant.

### Việc phải làm trên từng console sau khi có ID

- GA4: đánh dấu `generate_lead` là Key event. Đăng ký custom dimension cho `package` và `phone_number` (Admin > Custom definitions) để lọc báo cáo theo gói.
- Google Ads: liên kết tài khoản GA4, bật auto-tagging, nhập Key event `generate_lead` làm mục tiêu chiến dịch (hoặc dùng conversion tag riêng đã gắn ở trên; chọn một, không đếm hai lần).
- Meta: xác minh domain (Business Settings > Brand safety > Domains > Meta-tag) rồi thêm thẻ `<meta name="facebook-domain-verification" content="...">` vào `<head>`. Trong Events Manager, xếp ưu tiên sự kiện: `Lead` > `Contact` > `PageView`.
- Search Console: thêm property URL-prefix SITE, xác minh bằng thẻ HTML hoặc qua GA4, gửi `sitemap.xml`.

### Nguồn lead trong Google Sheet

Payload của form có trường `page` = URL đầy đủ lúc gửi, gồm cả tham số UTM. Không cần sửa Apps Script để biết lead đến từ kênh nào; nếu muốn tách cột, thêm 4 cột `utm_*` trong `apps-script/Code.gs` và parse từ `page`.

### Không làm, có chủ đích

- Không dùng Google Tag Manager: thêm một lớp quản trị cho 3 thẻ không đáng.
- Không thêm `<noscript>` pixel: phiếu đăng ký đã cần JavaScript.
- Không có banner cookie: khách ở Việt Nam, không có yêu cầu pháp lý tương đương GDPR. Nếu chạy quảng cáo nhắm EU thì cần Consent Mode.

## 3. Quy ước UTM

`utm_campaign=r-01-2027` cố định cho mọi kênh.

| Kênh | `utm_source` | `utm_medium` | `utm_content` |
|---|---|---|---|
| Google Ads | `google` | `cpc` | tên nhóm quảng cáo |
| Facebook / Instagram ads | `facebook` / `instagram` | `paid_social` | tên mẫu quảng cáo |
| Bài đăng fanpage, nhóm | `facebook` | `social` | `post-<ngày>` |
| Zalo OA, nhóm Zalo | `zalo` | `social` | `oa` / `group` |
| Email | `email` | `email` | `tb-v4`, `nhac-0812`, `nhac-2812` |

Ví dụ: `SITE?utm_source=zalo&utm_medium=social&utm_campaign=r-01-2027&utm_content=oa`

Google Ads: đặt tracking template ở cấp tài khoản để không phải gõ tay:
`{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign=r-01-2027&utm_content={adgroupid}&utm_term={keyword}`

## 4. Google Ads

Thiết lập chiến dịch: loại Search, một chiến dịch `R-01-2027 Search`. Vị trí: Việt Nam, tăng giá thầu +20% cho TP. Hồ Chí Minh (lớp offline). Ngôn ngữ: tiếng Việt và tiếng Anh (nhiều máy đặt tiếng Anh). Lịch: cả ngày. Đấu thầu: 2 tuần đầu Maximize clicks có trần CPC, chuyển sang Maximize conversions khi đạt từ 15 lead trong 30 ngày. Tắt Display Network và Search partners.

### Nhóm quảng cáo và từ khóa

Dùng khớp cụm từ. Mỗi tuần đọc báo cáo Search terms, thêm phủ định.

| Nhóm (`utm_content`) | Từ khóa |
|---|---|
| `r-co-ban` | "khóa học R", "học phân tích dữ liệu với R", "khóa học phân tích dữ liệu", "khóa học RStudio", "học R cho nghiên cứu", "khóa học thống kê y học" |
| `chi-phi-hieu-qua` | "khóa học phân tích chi phí hiệu quả", "khóa học kinh tế y tế", "cost effectiveness analysis khóa học", "đánh giá kinh tế y tế", "khóa học mô hình Markov" |
| `chuoi-thoi-gian` | "khóa học phân tích chuỗi thời gian", "khóa học time series", "ARIMA khóa học", "dự báo chuỗi thời gian với R" |
| `giang-vien` | "Nguyễn Văn Tuấn khóa học", "GS Nguyễn Văn Tuấn", "Viện Phương Nam khóa học", "khóa học Viện Phương Nam" |

Từ khóa phủ định cấp chiến dịch: miễn phí, free, pdf, tải, download, sách, ebook, giáo trình, việc làm, tuyển dụng, lương, python, excel, coursera, udemy.

### Mẫu quảng cáo tìm kiếm (RSA)

Tiêu đề (tối đa 30 ký tự). Ghim tiêu đề đầu tiên theo nhóm: nhóm `r-co-ban` ghim H1, `chi-phi-hieu-qua` ghim H7, `chuoi-thoi-gian` ghim H8, `giang-vien` ghim H2.

| # | Tiêu đề |
|---|---|
| H1 | Phân tích dữ liệu với R cơ bản |
| H2 | Học với GS.TS. Nguyễn Văn Tuấn |
| H3 | Từ 08/01 đến 17/01/2027 |
| H4 | Offline tại TP.HCM hoặc Zoom |
| H5 | Giảm 10% khi nộp trước 08/12 |
| H6 | Hạn đăng ký 28/12/2026 |
| H7 | Chi phí - hiệu quả trong y tế |
| H8 | Chuỗi thời gian và ARIMA |
| H9 | R, RStudio và công cụ AI |
| H10 | Viện Phương Nam, 3 khóa học |
| H11 | Không cần biết lập trình trước |
| H12 | 6 gói đăng ký, từ 3.500.000đ |

Mô tả (tối đa 90 ký tự):

| # | Mô tả |
|---|---|
| D1 | Ba khóa học do GS.TS. Nguyễn Văn Tuấn giảng dạy. Học tại Viện Phương Nam hoặc qua Zoom. |
| D2 | Nộp học phí trước 08/12/2026: giảm 10%. Nhóm từ 3 người: giảm 5% cho gói 1 đến 4. |
| D3 | Từ R cơ bản đến chi phí - hiệu quả và chuỗi thời gian. Hạn đăng ký 28/12/2026. |
| D4 | Học trực tiếp tại 45 Đinh Tiên Hoàng, TP. Hồ Chí Minh hoặc trực tuyến qua Zoom. |

Giai đoạn 2: bỏ H5, D2 đổi thành "Hạn đăng ký và hoàn tất học phí: 28/12/2026. Học phí đã gồm thuế, phí theo quy định."

Tài sản bổ sung:
- Sitelinks: Học phí và ưu đãi (`SITE#tuition`), Lịch học (`SITE#schedule`), Giảng viên (`SITE#faculty`), Đăng ký (`SITE#registration`).
- Callouts: Học offline hoặc Zoom; Giảm 10% trước 08/12; 6 gói đăng ký; R, RStudio và AI.
- Call asset: (028) 2242 6789, giờ hành chính.
- Structured snippet, tiêu đề "Khóa học": Phân tích dữ liệu với R cơ bản; Phân tích chi phí - hiệu quả trong y tế; Phân tích dữ liệu chuỗi thời gian.

Ngưỡng xem lại hằng tuần: CTR dưới 3% thì đổi tiêu đề ghim; từ khóa không có lead sau 300 lượt nhấp thì tạm dừng.

## 5. Meta (Facebook, Instagram)

Chiến dịch: mục tiêu Leads, chuyển đổi trên website, sự kiện `Lead`. Pixel mới chưa đủ 50 `Lead` mỗi tuần để tối ưu, nên 2 tuần đầu chạy song song một chiến dịch Traffic nhỏ để nuôi tệp retarget.

### Nhóm đối tượng

| Nhóm | Định nghĩa | Ghi chú |
|---|---|---|
| Retarget | Pixel: đã xem SITE trong 30 ngày, loại trừ `Lead` 90 ngày | Nhận phần lớn ngân sách giai đoạn 2 |
| Tương tác | Tương tác với fanpage Viện Phương Nam và trang GS.TS. Nguyễn Văn Tuấn trong 365 ngày | Cần quyền admin cả hai trang |
| Lạnh, y tế | Việt Nam, 24 đến 55 tuổi; sở thích: y học, nghiên cứu khoa học, thống kê, dịch tễ học, kinh tế y tế; chức danh: bác sĩ, dược sĩ, giảng viên, nghiên cứu viên | Tách 2 ad set: TP. Hồ Chí Minh và còn lại |
| Lookalike | 1% đến 3% từ `Lead`, chạy khi đã có từ 100 `Lead` | Giai đoạn 2 |

### Mẫu quảng cáo

Hình: ảnh hoặc video thật của GS.TS. Nguyễn Văn Tuấn và lớp học các khóa trước (xin từ Viện). Nếu chưa có, dùng card chữ nền trắng: logo, tên 3 khóa, ngày, dòng ưu đãi. Không dùng ảnh stock, không nêu số học viên hay kết quả khóa trước.

Nội dung:

| Phần | Giai đoạn 1 | Giai đoạn 2 |
|---|---|---|
| Văn bản chính | Chuỗi khóa học Phân tích định lượng với R, từ 08/01 đến 17/01/2027, do GS.TS. Nguyễn Văn Tuấn giảng dạy. Học trực tiếp tại TP. Hồ Chí Minh hoặc qua Zoom. Nộp học phí trước 08/12 giảm 10%. | Còn đến 28/12/2026 để đăng ký chuỗi khóa học Phân tích định lượng với R do GS.TS. Nguyễn Văn Tuấn giảng dạy. Ba khóa, sáu gói, học offline hoặc Zoom. |
| Tiêu đề | Giảm 10% khi nộp trước 08/12/2026 | Hạn đăng ký 28/12/2026 |
| Mô tả | Offline tại TP.HCM hoặc Zoom | Ba khóa học, sáu gói đăng ký |
| Nút | Đăng ký (Sign up) | Đăng ký (Sign up) |

Biến thể theo khóa (dùng cho nhóm Lạnh): thay câu đầu bằng tên khóa và ngày, ví dụ "Phân tích chi phí - hiệu quả trong y tế, 12 và 13/01/2027: ICER, QALY, cây quyết định, mô hình Markov trên R."

## 6. Google Search Console và GEO

- Search Console: property URL-prefix SITE; gửi `sitemap.xml`; theo dõi truy vấn để bổ sung từ khóa Google Ads.
- Bing Webmaster Tools: nhập từ Search Console, một lần.
- Structured data đã có trong `dist/index.html`: `Organization`, `Place`, `EducationEvent` (3 `subEvent` theo khóa, 6 `Offer` theo gói, 2 `performer`). Kiểm tra bằng Rich Results Test. Lưu ý: `MixedEventAttendanceMode` nhưng chưa có `VirtualLocation` vì link Zoom chỉ gửi cho học viên; Google có thể báo cảnh báo, không phải lỗi.
- GEO (để ChatGPT, Gemini, Perplexity trích đúng): nội dung đã là văn bản thuần, bảng HTML thật, ngày và giá có trong JSON-LD. Chưa thêm `llms.txt` vì chưa có bằng chứng các công cụ này đọc nó cho trang đơn.

## 7. Chưa làm và cần quyết định

- Google Ads ID + label và Meta Pixel ID chưa có. GA4 đã gắn.
- Mã nguồn vienphuongnam.com.vn (kiểm tra 2026-10-02) đã có một Meta Pixel `1969746716977692`. Cần hỏi ai quản lý pixel này trước khi tạo pixel mới; dùng chung thì tệp retarget gồm cả khách của site chính.
- Triển khai lên site chính: `.htaccess` có `RewriteRule ^(.*)/$ /index.php?duongdan=$1`, nên thư mục tĩnh `/phan-tich-du-lieu-voi-r/` sẽ bị chuyển vào CMS. Đội web cần thêm `RewriteCond %{REQUEST_FILENAME} !-d` (hoặc loại trừ đường dẫn này) ngay trước rule đó. Hiện URL trả 404.
- `https://vienphuongnam.com.vn/robots.txt` đang trả về nội dung `.htaccess`, không phải robots.txt hợp lệ. Bot bỏ qua các dòng lạ nên vẫn được phép crawl, nhưng nên thay bằng file robots thật và để lộ rewrite rule là không cần thiết. Trang khóa học không có robots riêng vì robots chỉ có hiệu lực ở gốc domain.
- Đổi SITE thì sửa 4 chỗ: `canonical`, `og:url` + `og:image` + `twitter:image`, JSON-LD (`url`, `@id`, `image`), `dist/sitemap.xml`.
- Ảnh chia sẻ `dist/og-image.png` 1200x630 dựng từ logo và tên chuỗi khóa học (font Cambria của Windows, gần Source Serif trên trang). Cần Viện duyệt.
- Ngân sách thật và người theo dõi báo cáo hằng tuần.
