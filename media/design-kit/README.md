# Design kit v2: khổ, lưới, thành phần, công thức bố cục

Áp dụng `../brand-kit/` (v2, "Data Lab"). Mẫu gốc là 3 poster Story đã chốt; mọi ấn phẩm khác lắp từ cùng các khối trong `media/poster/ads/story.css` và `story.js`. Sơ đồ khung từng ấn phẩm: `kit.html` (ảnh xem nhanh `export/kit.png`).

## 1. Cách dùng

1. Dựng ấn phẩm bằng HTML đúng khổ, link `story.css` (đã import `brand-kit/tokens.css`) và `story.js`. Mẫu: `media/poster/ads/story-*.html`.
2. Chép khối từ bảng ở mục 5, đặt theo công thức ở mục 6.
3. Xuất: ấn phẩm số bằng `media/poster/ads/render.py` (PNG đúng khổ); asset tách nền bằng `media/poster/ads/assets/export.py` (PNG 6× trong suốt và PDF vector).
4. Với Claude Design: nạp `brand-kit/README.md`, `brand-kit/tokens.css`, `design-kit/README.md`, ảnh `brand-kit/export/brand-board.png`, `design-kit/export/kit.png` và 3 poster đã chốt; dán prompt trong README từng ấn phẩm.

## 2. Khổ và thông số

| Ấn phẩm | Khổ | Chế độ | Tràn lề | Vùng an toàn | Xuất |
|---|---|---|---|---|---|
| Story, Reel (đã chốt) | 1080×1920 px | tối | | trên 124 px (dải đầu), dưới 96 px (dải chân); Reel: tránh 120 px mép phải | PNG sRGB |
| Poster số vuông | 1080×1080 px | tối | | 60 px | PNG |
| Ảnh chia sẻ link | 1200×630 px | tối | | 50 px | PNG |
| Poster in | A3 297×420 mm, A2 phóng tỷ lệ | tối | 3 mm | 15 mm | PDF, nhà in chuyển CMYK |
| Standee | 60×160 cm | tối | theo nhà in | 5 cm; 15 cm đáy để trống cho chân đế | PDF 150 dpi ở khổ thật |
| Backdrop | 3×2 m (chờ đo tường) | tối | theo nhà in | 10 cm; 1/3 dưới chỉ có nền | PDF 100 dpi |
| Nền Zoom | 1920×1080 px | tối | | 1/3 giữa để trống cho người | PNG |
| Email banner | 600×240 hiển thị, xuất 1200×480 | tối | | 48 px | PNG dưới 200 KB |
| Video | 1080×1920 và 1920×1080 | tối | | 10% mỗi cạnh; 9:16 chừa 15% dưới | MP4 30 fps |
| Thẻ đeo | 90×130 mm | tối | 3 mm | 6 mm; 15 mm trên cho lỗ đục | PDF, 4 thẻ một tờ A4 |
| Bìa tài liệu | A4 210×297 mm, mỗi khóa một bìa | tối | 3 mm | 12 mm | PDF |
| Giấy chứng nhận | A4 ngang 297×210 mm | sáng | 3 mm | 15 mm | PDF; bản online sRGB |

## 3. Lưới và thang chữ

**Khổ gốc** là Story 1080 px: lề 70 px (6.5% chiều rộng), cột nội dung 940 px, cột dữ liệu (cột gói, chữ ưu đãi) bắt đầu ở 186 px, khoảng cách giữa các mục 24 px.

**Quy đổi sang khổ khác:** đặt `s` = chiều rộng vùng nội dung của khổ mới / 940. Nhân mọi cỡ chữ, nét, khoảng cách với `s`. Khổ in tính theo 300 dpi (A3 rộng 3508 px, nội dung 3154 px, `s` ≈ 3.36).

| Vai trò | Font | Khổ gốc 1080 px | A3 (pt) | Standee 60×160 (pt) | Backdrop 3×2 m (pt) | Thẻ đeo (pt) |
|---|---|---|---|---|---|---|
| Tiêu đề chuỗi | Source Serif 4 600 | 112 px | 90 | 300 | 520 | 14 (một dòng) |
| Cụm nghiêng | Source Serif 4 nghiêng 600 | 48 | 38 | 130 | 220 | |
| Tên người (thẻ, chứng nhận) | Source Serif 4 600 | | | | | 24 |
| Số: học phí, ngày | Oswald 700 | 40 đến 44 | 34 | 110 | 180 | |
| Nhãn mục `# ...` | JetBrains Mono 500 | 25 | 20 | 64 | 110 | 9 |
| Chữ thân | Montserrat 500/600 | 22 đến 25 | 18 | 56 | 96 | 10 |
| Tối thiểu | | 22 | 14 | 40 | 72 | 8 |

Khoảng cách xem quyết định cỡ tối thiểu: Story xem trên điện thoại, A3 ở 1 m, standee 2 đến 3 m, backdrop 4 đến 8 m, thẻ đeo ở 1 m.

## 4. Nền theo khổ

- Mọi khổ nền tối dùng đủ 4 lớp ở `brand-kit/README.md` mục 8, giữ vị trí tương đối: vệt sáng lớn ở góc trên phải, vệt nhỏ ở dưới trái, lưới chấm mờ dần từ hai góc đó, cụm lục giác góc trên phải, code R dọc hai lề.
- Khổ ngang (backdrop, email, Zoom): code R chạy ngang ở mép dưới thay vì dọc hai lề.
- In ấn: tăng lưới chấm lên 45%, lục giác lên 20%, code R lên 45%; gradient nên thêm nhiễu 1 đến 2% để tránh vệt bậc khi in.
- Nền sáng: giấy trắng, lưới chấm `--hair` 60% chỉ ở hai góc, không có code R và vệt sáng.

## 5. Thư viện thành phần

Tên lớp CSS trong `story.css`. Kích thước ở khổ gốc.

| Khối | Lớp | Nội dung | Ghi chú |
|---|---|---|---|
| Dải đầu | `.top`, `.badge` | Logo trong khung tròn trắng 100 px, tên Viện Oswald 600 38 px in hoa | Cao 124 px; đường kẻ dưới cyan nhạt dần |
| Khối tiêu đề | `.title`, `.row2`, `.hex` | Xem brand kit mục 6 | Cao khoảng 260 px |
| Nhãn mục | `.code.sec`, `.dim` | `# Tên mục` | Luôn có dấu `# ` |
| Dòng thông tin | `.facts`, `.fact`, `.ring` | Icon trong vòng tròn 64 px, giá trị Oswald 38, nhãn Montserrat 22 | Tối đa 2 mục một hàng |
| Lộ trình | `.route` + `VPN.route()` | Đường hồi quy, 3 điểm mốc, nhãn khóa và ngày | Khối nhận diện chính của chuỗi |
| Hàng khóa học | `.crs` + `VPN.mini()` | Hình nhỏ 180×120, nhãn khóa, tên khóa serif, 3 ý chính, nhãn phụ | Đường nét đứt nối các hình |
| Lịch | `.gantt` | 10 cột ngày, thanh khóa kèm số buổi | Ngày không học dùng `--quiet` |
| Hình thức | `.mode`, `.opt`, `.or`, `.kit` | Trực tiếp "hoặc" Trực tuyến, phần mềm, máy tính | |
| Chú giải khóa | `.legend` | Chip K1/K2/K3, tên khóa, ngày | Bắt buộc khi có cột gói mà không có lộ trình |
| Cột gói | `.bars-wrap`, `.bar`, `.seg` | 6 hàng: tên gói, đoạn K theo ngày, số ngày, học phí | 1 ngày = 56 px; `.lg` cho bản lớn |
| Nút ưu đãi | `.deals`, `.node` | 10%, 5%, 10–15% kèm điều kiện | Diện tích nút theo mức giảm |
| Trục thời gian | `.time`, `.mk`, `.brk` | 08/12, 28/12 (pill trắng chữ đỏ), 08/01 | `.wide` cho bản rộng hết khổ |
| Hạn chót gọn | `.dl`, `.pill` | Nhãn in hoa và pill ngày | Khi không có trục thời gian |
| Đăng ký trực tiếp | `.reg` | "Hoặc đăng ký trực tiếp tại:" (serif nghiêng cyan), ghim: Viện Phương Nam và địa chỉ đầy đủ, điện thoại: 3 số | Đặt cạnh QR. Không in thông tin nộp học phí |
| QR | `.qr`, `.qr.sm` | Khung trắng 272 px (hoặc 252), vùng yên tĩnh 22 px, chú thích | In: cạnh mã tối thiểu 25 mm |
| Liên hệ | `.contact` | Ms. Vy, Ms. Thảo | |
| Dải chân | `.foot` | Điện thoại, địa chỉ, website với icon | Cao 96 px, nền trắng |
| Nền | `.bgfx` | 4 lớp chất liệu | |

Thêm khối mới: ghi tên lớp, nội dung, nơi dùng vào bảng này trước khi dùng.

## 6. Công thức bố cục

Sơ đồ khung đúng tỷ lệ cho từng công thức: `kit.html`.

**Poster in A3 (và A2).** Dải đầu → khối tiêu đề → dòng thông tin → lộ trình rộng hết khổ → hai cột: cột gói (60%) và nút ưu đãi (40%) → trục thời gian (65%) cạnh QR (35%) → dải chân. Nội dung giống ST1, chia hai cột vì khổ A3 rộng hơn Story.

**Standee 60×160 cm.** Dải đầu → khối tiêu đề lớn → dòng thông tin xếp hai hàng → lộ trình → hạn chót gọn hoặc trục thời gian → QR lớn ở giữa → liên hệ → dải chân → 15 cm đáy để trống. Không đưa bảng gói lên standee: xem từ xa không đọc được 6 hàng số.

**Backdrop 3×2 m.** Dải đầu thu gọn ở góc trên trái → khối tiêu đề và dòng thông tin ở 56% bên trái → lộ trình lớn ở 40% bên phải → 1/3 dưới chỉ có nền (người đứng che). Không QR, không học phí, không hạn chót: backdrop dùng trong tuần học.

**Email banner 1200×480.** Logo khung tròn → tiêu đề một dòng → một dòng ngày theo đợt gửi (thông báo, nhắc 08/12, nhắc 28/12, gửi học viên) → lộ trình thu nhỏ bên phải. Thông tin chính phải có lại trong nội dung HTML của email.

**Nền Zoom 1920×1080.** Logo và tiêu đề một dòng góc trên trái → ngày tổ chức → lộ trình mờ góc dưới trái → 1/3 giữa trống.

**Thẻ đeo 90×130 mm.** 15 mm trên để trống (lỗ đục) → logo khung tròn và "Viện Phương Nam" → dòng `# Phân tích định lượng với R · 01/2027` → họ tên serif 24 pt (tối đa 2 dòng) → đơn vị → chip khóa đã đăng ký (K1, K2, K3 tô màu, khóa không đăng ký chỉ có viền) → dải vai trò. Dải vai trò: Học viên nền trắng chữ navy; Giảng viên gradient cyan sang xanh (lấy từ logo) chữ trắng; Ban tổ chức nền `--bg-0` viền cyan chữ trắng. Không dùng màu K cho vai trò.

**Bìa tài liệu A4 (mỗi khóa).** Dải đầu → nhãn `# Khóa n · Tài liệu học viên` → tên khóa serif lớn → hình của khóa phóng lớn làm hình chính, màu K của khóa → ngày, số buổi, giảng viên → tiêu đề chuỗi một dòng → dải chân. Bìa sau: liên hệ, không QR.

**Giấy chứng nhận A4 ngang (nền sáng).** Logo và tên Viện (trên trái), số hiệu theo quy tắc Viện (trên phải) → "GIẤY CHỨNG NHẬN" serif → họ tên serif màu cobalt → tên khóa và dòng chuỗi khóa học → thời gian → nơi ký, chữ ký, dấu (dưới phải) → một đường kẻ màu K của khóa ở mép dưới. Lưới chấm rất nhạt ở hai góc. Nội dung pháp lý theo mẫu Viện (xem `../certificate/README.md`).

**Poster số vuông 1080×1080 và ảnh chia sẻ 1200×630.** Logo khung tròn → tiêu đề (vuông: đủ khối; 1200×630: một dòng) → lộ trình → một dòng ngày hoặc hạn chót.

## 7. Chuyển động (video)

| Khối | Chuyển động | Thời lượng |
|---|---|---|
| Khối tiêu đề | Hiện từng dòng, trượt lên 12 px | 0.5 s mỗi dòng, cách 0.12 s |
| Lộ trình | Đường hồi quy vẽ từ trái sang; điểm mốc hiện lần lượt; đường gióng chạy xuống | 1.2 s; điểm cách 0.15 s |
| Cột gói | Từng hàng mọc từ trái, số học phí đếm lên | 0.6 s mỗi hàng, cách 0.08 s |
| Nút ưu đãi | Phóng từ 0.6 lên 1, dọc theo trục nối | 0.4 s mỗi nút |
| Trục thời gian | Đường kẻ chạy ngang, mốc rơi xuống, pill 28/12 hiện cuối | 0.8 s |

Một đường cong duy nhất `cubic-bezier(0.16, 1, 0.3, 1)`; không nảy, không xoay, không nhấp nháy. Nền đứng yên; nếu có chuyển động nền thì chỉ lưới chấm trôi rất chậm. Dựng bằng HyperFrames (xem `../video/README.md`).

## 8. Sản xuất

- Nền xanh đậm tràn lề tốn mực và dễ lệch màu: in thử bông màu `--bg-1` và K1, K2, K3 trên đúng chất liệu trước khi in hàng loạt.
- Gradient: thêm nhiễu 1 đến 2% khi xuất bản in để tránh vệt bậc.
- Nét mảnh tối thiểu 0.25 pt; chấm lưới tối thiểu 0.4 mm ở khổ thật.
- QR: cạnh mã tối thiểu 25 mm trên bản in, vùng yên tĩnh 4 ô mã, nền trắng; quét thử bằng hai điện thoại trên bản in thử.
- Asset tách nền: `ads/assets/export.py` cho PNG 6× trong suốt và PDF vector; glow là ảnh nằm dưới lớp vector.

## 9. Kiểm tra trước khi xuất

- [ ] Ngày, học phí, ưu đãi, liên hệ khớp `brand-kit/content.md` từng chữ
- [ ] Không in giờ học, số thông báo, số tài khoản, số học viên, ảnh stock
- [ ] Mã màu K1/K2/K3 đúng khóa ở mọi biểu đồ
- [ ] Đỏ chỉ ở ngày hạn chót, trên pill trắng
- [ ] Căn lề và cột dữ liệu theo lưới; tâm chữ R trùng tâm lục giác; icon giữa vòng tròn
- [ ] Không chữ nào nhỏ hơn cột "Tối thiểu" ở mục 3
- [ ] Tương phản đo trên ảnh render: chữ thường từ 4.5:1, chữ lớn từ 3:1
- [ ] Không tràn khung: chạy script xuất (có kiểm tra tràn)
- [ ] File in: đúng khổ, tràn lề, font nhúng, bông màu đã duyệt
- [ ] QR quét thử ra đúng trang đăng ký
