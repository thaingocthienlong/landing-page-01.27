# Brand kit v2: Phân tích định lượng với R (01/2027)

Phiên bản 2, ngày 02/10/2026. Rút ra từ bộ 3 poster Story đã chốt (`media/poster/export/story-*.png`) và áp dụng cho mọi ấn phẩm còn lại. Bản v1 ("The Manuscript", nền trắng) vẫn là hệ của landing page (`DESIGN.md`) và trở thành **chế độ nền sáng** của bộ này.

| File | Nội dung |
|---|---|
| `README.md` | Phân tích, quy tắc logo, màu, chữ, khối tiêu đề, hệ biểu đồ, nền, biểu tượng, giọng văn |
| `tokens.css` | Nguồn duy nhất cho màu, font, lưới; `media/poster/ads/story.css` import file này |
| `content.md` | Chữ chuẩn: thông báo v4 và outline đã duyệt |
| `brand-board.html` | Bảng nhận diện dựng từ chính các thành phần của poster; ảnh xem nhanh `export/brand-board.png` |
| `logo/logo-color.png` | Logo màu, cắt sát, nền trong suốt |
| `logo/logo-reverse-white-DRAFT.png` | Logo trắng, bản nháp tự dựng; poster đã chốt dùng logo màu trong khung tròn trắng thay cho bản này |

## 1. Phân tích bộ poster đã chốt

Mỗi vòng góp ý để lại một quy tắc. Các quy tắc dưới đây là những gì bộ poster đã chốt thể hiện, không phải sở thích mới.

| Góp ý trong quá trình làm | Quy tắc rút ra |
|---|---|
| "Nền và các ô thông tin đè lên nhau" | Không đặt hộp trắng lên nền. Thông tin được vẽ thành biểu đồ ngay trên nền (đồ thị lộ trình, cột gói, nút ưu đãi, trục thời gian). |
| "Thiếu khoa học, công nghệ, nghiên cứu, ngôn ngữ R, mô hình đồ thị" | Hình ảnh chính là loại biểu đồ mà khóa học dạy; nhãn mục viết như comment R (`# 6 gói đăng ký`); chữ R đặt trong lục giác như sticker gói R; nền có lưới chấm, cụm lục giác, dòng code R. |
| "Phần trên và dưới còn trống" (so với poster đã duyệt của Viện) | Dải đầu có logo và tên Viện; dải chân trắng có icon điện thoại, địa chỉ, website; nội dung kín khung. |
| "Dùng font uyển chuyển như landing page" | Tiêu đề Source Serif 4, cụm "từ cơ bản đến chuyên sâu" in nghiêng; con số và nhãn dùng Oswald. |
| "Bỏ thông tin thừa" | Không chú thích cách đọc biểu đồ trên ấn phẩm quảng cáo; mỗi biểu đồ tự giải thích bằng nhãn. |
| "Logo bị cắt, chữ R hơi cao, icon lệch", sau đó "logo hơi nhỏ so với nền tròn" | Logo rộng 74/100 đường kính: lớn nhất mà góc chữ PHUONG NAM vẫn cách viền (82/100 chạm viền, 64/100 nhỏ); chữ R đặt theo chiều cao chữ hoa thật; icon căn giữa vòng tròn. Kiểm tra bằng ảnh render, không bằng mắt trên code. |

## 2. Hai chế độ

| | Nền tối "Data Lab" | Nền sáng "Paper" |
|---|---|---|
| Dùng cho | Quảng cáo, poster, standee, backdrop, video, email, nền Zoom, thẻ đeo, bìa tài liệu | Giấy chứng nhận, trang trong tài liệu, văn bản in, landing page |
| Nền | Gradient xanh đậm `--bg-0` → `--bg-2`, hai vệt sáng, lưới chấm, lục giác, code R | Trắng `--paper`, nền phụ `--plate`, lưới chấm rất nhạt ở góc |
| Chữ chính | Trắng | Ink `--ink` |
| Mã màu khóa | `--k1` `--k2` `--k3` | `--k1-on-paper` `--k2-on-paper` `--k3-on-paper` |
| Logo | Logo màu trong khung tròn trắng | Logo màu trực tiếp trên giấy |

Cùng một bộ font, cùng khối tiêu đề, cùng từ vựng biểu đồ. Không trộn hai chế độ trên một mặt.

## 3. Logo

- Nền tối: logo màu đặt trong khung tròn trắng; logo rộng 74% đường kính, căn giữa theo khung ảnh logo; góc chữ PHUONG NAM, điểm gần viền nhất, cách viền khoảng 5% đường kính. Không quá 76% (góc chữ sát viền, trông như bị cắt). Viền ngoài khung: 5 px cyan 28% (ở khổ 1080 px).
- Nền sáng: logo màu đặt trực tiếp, không khung.
- Vùng an toàn: tối thiểu bằng chiều cao chữ "PHUONG NAM" mỗi cạnh.
- Cỡ tối thiểu: khung tròn 100 px ở khổ 1080 px; in 25 mm chiều rộng logo.
- Không: kéo giãn, xoay, đổi màu gradient, đặt logo màu trực tiếp lên nền xanh đậm, thêm bóng đổ.
- Bản logo trắng trong `logo/` là nháp tự dựng; chưa dùng trên ấn phẩm nào.

## 4. Màu

Đo trên ảnh render thật (nền tối nhiều lớp làm công cụ dò tự động tính sai, nên mọi số dưới đây lấy từ pixel).

**Nền tối**

| Token | HEX | Dùng cho | Tương phản |
|---|---|---|---|
| `--bg-0` / `--bg-1` / `--bg-2` | #061a4d / #0a2f7f / #0c3f9e | Nền gradient từ trên xuống | |
| `--light-a`, `--light-b` | #1673e3 ở 42% và 28% | Hai vệt sáng tròn | |
| trắng | #ffffff | Tiêu đề, số, chữ chính | 9.46:1 trở lên |
| `--tint` | #cfe0ff | Chữ phụ | 7.10:1 trở lên |
| `--soft` | #a8c4f0 | Chữ phụ thứ ba, phần mờ của comment R | 5.3:1 trở lên |
| `--quiet` | #9fb4da | Ngày không có buổi học trên lịch | 4.51:1 trở lên |
| `--grid` | trắng 9% | Đường lưới biểu đồ | |
| `--signal` | #c4231a | Chỉ ngày hạn chót, trên pill trắng | 5.83:1 |

**Mã màu khóa** (dùng chung cho mọi biểu đồ; không dùng cho việc khác)

| Khóa | Nền tối | Chữ trên nền tối | Chữ trên ô màu | Nền sáng (chữ) |
|---|---|---|---|---|
| K1 · R cơ bản | `--k1` #5ad8ff | #5ad8ff (5.7:1) | `--ink-dark` #06205a (9.33:1) | `--k1-on-paper` #0a6f9f (5.54:1) |
| K2 · Chi phí - hiệu quả | `--k2` #3f86ff | `--k2-text` #8fb8ff (4.71:1) | `--ink-k2` #041a4a (4.85:1) | `--k2-on-paper` #1f5fcf (5.84:1) |
| K3 · Chuỗi thời gian | `--k3` #c3dbff | #c3dbff (6.7:1) | `--ink-dark` #06205a (10.94:1) | `--k3-on-paper` #4a6596 (5.84:1) |

**Nền sáng**: trùng bảng màu landing page (`DESIGN.md`): paper, plate, ink, ink-2, ink-3, hair, cobalt.

Không dùng: tím, neon, đỏ ngoài ngày hạn chót, gradient trên chữ, màu K cho thứ không phải khóa học.

## 5. Chữ

| Font | Vai trò | Kiểu dùng |
|---|---|---|
| **Source Serif 4** | Tiêu đề chuỗi, cụm in nghiêng "từ cơ bản đến chuyên sâu", tên khóa, tên người trên giấy chứng nhận | 600; nghiêng 600 cho cụm nhấn; giãn -0.02em ở cỡ lớn |
| **Oswald** | Con số (ngày, học phí), nhãn khóa K1/K2/K3, tên gói, tên Viện ở dải đầu, chữ R trong lục giác | 500 đến 700; in hoa cho tên Viện và tên gói |
| **Montserrat** | Chữ thân, điều kiện ưu đãi, liên hệ, chú thích | 500, 600, 700 |
| **JetBrains Mono** | Nhãn mục dạng comment R, dòng code R trên nền | 500; luôn bắt đầu bằng `# ` |

Cả bốn font có bộ dấu tiếng Việt và tải từ Google Fonts (giấy phép OFL). File in: nhúng font hoặc chuyển chữ thành nét.

Cỡ chữ ở khổ chuẩn 1080 px: tiêu đề 112 px, cụm nghiêng 48, số học phí 40 đến 44, nhãn mục 25, chữ thân 22 đến 25; không chữ nào dưới 22 px. Khổ khác: xem `../design-kit/README.md` mục 3.

## 6. Khối tiêu đề

Cấu trúc cố định, dùng trên mọi ấn phẩm nền tối:

```
Phân tích định lượng                         (Source Serif 4 600, cỡ T)
với  [R trong lục giác]  từ cơ bản           (serif 600 cỡ T; lục giác cao 1.14T; nghiêng 0.43T, cyan)
                         đến chuyên sâu
                         GS.TS. Nguyễn Văn Tuấn · TS. Trần Sơn Thạch   (Montserrat 600, 0.2T)
```

- Lục giác đỉnh nhọn trên dưới (như sticker gói R), viền cyan dày 6/128 chiều cao, nền cyan 16%, glow nhẹ; chữ R Oswald 700 trắng, tâm chữ hoa trùng tâm lục giác.
- Bản rút gọn cho khổ thấp (email, thẻ đeo, nền Zoom): một dòng "Phân tích định lượng với [R]", bỏ dòng giảng viên.
- Nền sáng: chữ ink, cụm nghiêng `--cobalt`, lục giác viền cobalt nền cobalt-wash.

## 7. Hệ biểu đồ

Biểu đồ là hình ảnh chính, thay cho ảnh minh họa. Mỗi biểu đồ chở một thông tin thật:

| Biểu đồ | Thông tin | Nguồn số liệu |
|---|---|---|
| Đường hồi quy đi lên, 3 điểm mốc | Lộ trình 3 khóa và ngày học | Ngày từ thông báo; điểm nền là dữ liệu mô phỏng |
| Cột chồng nằm ngang | 6 gói: khóa nào, bao nhiêu ngày, học phí | Thông báo v4 |
| Đồ thị nút | 3 ưu đãi; diện tích nút theo mức giảm | Thông báo v4 |
| Trục thời gian có ngắt | 08/12/2026, 28/12/2026, 08/01/2027 | Thông báo v4 |
| Lịch Gantt | Ngày và số buổi từng khóa | Thông báo v4, outline |
| Hình nhỏ theo khóa | Hồi quy (K1), mặt phẳng chi phí - hiệu quả (K2), dự báo (K3) | Dữ liệu mô phỏng |

- Dữ liệu mô phỏng chỉ làm nền hình, không bao giờ mang con số như kết quả nghiên cứu.
- Trên ấn phẩm quảng cáo không ghi chú thích "dữ liệu minh họa" (quyết định của Viện ngày 02/10/2026). Tài liệu học thuật và in ấn dùng hình làm minh họa nội dung thì ghi lại chú thích này.
- Mỗi biểu đồ dùng đúng màu K của khóa; điểm nền màu `--tint` 70%.

## 8. Nền và chất liệu (chế độ nền tối)

| Lớp | Thông số ở khổ 1080 px | Mục đích |
|---|---|---|
| Gradient | `--bg-0` 0% → `--bg-1` 42% → `--bg-2` 100%, từ trên xuống | Mặt nền |
| Vệt sáng | 620×520 px tại 82% 30%; 520×420 px tại 10% 72% | Chiều sâu, giống ánh sáng trên poster đã duyệt |
| Lưới chấm | chấm 1.7 px cách 36 px, `--tint`, 30%, mờ dần từ góc trên phải và góc dưới trái | Giấy vẽ đồ thị |
| Cụm lục giác | 5 lục giác viền `--tint` 13%, 1 lục giác nền cyan 7%, góc trên phải | Hệ sinh thái gói R |
| Dòng code R | JetBrains Mono 19 px, cyan 34%, chạy dọc hai lề | Ngôn ngữ R; chỉ dùng hàm và gói có trong outline |

Chất liệu chỉ nằm ở lề và vùng trống; không đặt sau chữ nhỏ. Trên khổ in lớn, tăng độ đậm lưới chấm lên 45% vì mực in làm chấm nhạt đi.

## 9. Biểu tượng

- Nét 2 px trong ô 24×24, đầu nét tròn, màu trắng, đặt giữa vòng tròn 64 px viền cyan (thông tin) hoặc vòng tròn đặc navy 46 px (dải chân).
- Bộ đang dùng: lịch, màn hình có người (học trực tuyến), ghim địa điểm, điện thoại, quả địa cầu, dấu code `</>`.
- Không dùng icon trang trí kiểu tia sét, ngôi sao, robot.

## 10. Giọng văn và nội dung

- Mọi ngày, học phí, điều kiện ưu đãi, liên hệ lấy từ `content.md`.
- Nhãn mục viết như comment R: `# 3 khóa học: từ nền tảng đến chuyên sâu`, `# Ưu đãi học phí`.
- Câu ngắn, có số, không dùng gạch dài (em dash), không dùng từ quảng cáo rỗng ("đột phá", "hàng đầu", "cơ hội vàng").
- Không in: giờ học hằng ngày (chưa có nguồn), số thông báo, số tài khoản trên ấn phẩm công khai, số học viên, cảm nhận học viên, ảnh stock.

## 11. Nên và không nên

| Nên | Không nên |
|---|---|
| Vẽ thông tin thành biểu đồ ngay trên nền | Đặt hộp trắng chứa chữ lên nền trang trí |
| Dùng một mã màu K1/K2/K3 cho mọi biểu đồ | Đổi màu khóa giữa các ấn phẩm |
| Căn theo lưới 70 px lề, cột dữ liệu bắt đầu ở 186 px | Căn mắt từng khối |
| Đỏ chỉ cho ngày hạn chót trên pill trắng | Đỏ cho tiêu đề, giá, nút |
| Kiểm tra tương phản trên ảnh render | Tin vào kết quả công cụ dò với nền nhiều lớp |
| Giữ khối tiêu đề nguyên cấu trúc | Viết lại tên chuỗi khóa học |
