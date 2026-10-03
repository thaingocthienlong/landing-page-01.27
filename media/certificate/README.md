# Giấy chứng nhận

Trạng thái: chưa dựng, **chờ mẫu hiện hành của Viện**. Phong cách: brand kit v2, **nền sáng "Paper"**. Ưu tiên: 4 (mẫu duyệt trước 05/01/2027; in sau từng khóa: 10/01, 13/01, 17/01/2027).

## Đang thử (03/10/2026): một tờ cho mỗi học viên, in một lần cho buổi bế giảng chung

Đã có mẫu của Viện (`assets/RUỘT GCN lớp TKNC DDKH_Folder/`, lớp 01/2026). Phương án đang thử: mỗi học viên nhận một tờ, ghi đúng các khóa đã hoàn thành (1 đến 3 dòng), phát chung tại buổi bế giảng sau Khóa 3 (17/01/2027) thay vì in sau từng khóa. Chỉ ai hoàn thành đủ 3 khóa mới có dòng "hoàn thành chuỗi khoá học", còn người học 1 hoặc 2 khóa thì ghi "thuộc chuỗi khoá học". Ghi theo khóa đã hoàn thành, không theo gói đã đăng ký.

Mẫu thử trong `mockup/`: chạy `python media/certificate/mockup/build.py` để tạo PDF và PNG cho 3 trường hợp (Gói 5: 1 khóa, Gói 3: 2 khóa, Gói 1: 3 khóa). Script xóa phần chữ thay đổi theo học viên trên PDF của file .ai, rồi đặt chữ mới bằng font gốc. Khung, nền, quốc hiệu, họ tên mẫu và người ký giữ nguyên. PDF không đưa vào git vì chạy lại script là có.

Chờ Viện chốt: tên tiếng Anh chính thức của chuỗi và 3 khóa (bản trong mẫu thử là bản dịch đề xuất), mã cuối số hiệu (đang để `[mã]`), điều kiện "hoàn thành", ngày bế giảng.

## Mục đích

Cấp cho học viên hoàn thành từng khóa. Đây là văn bản có chữ ký và dấu của Viện, nên phần pháp lý (tiêu đề, số hiệu, điều kiện cấp, người ký) theo quy định của Viện. Thiết kế chỉ lo bố cục và nhận diện, không tự đặt nội dung pháp lý.

Nền sáng vì: in trên giấy mỹ thuật, chữ ký và dấu đỏ cần nền trắng, mảng xanh đậm tràn lề dễ loang trên giấy dày.

## Câu hỏi phải có trả lời trước khi dựng

1. Viện đã có mẫu giấy chứng nhận dùng cho các khóa trước chưa? Nếu có: gửi file, ta chỉ đổi phần khóa học và giữ khung pháp lý.
2. Cấp theo khóa (3 loại) hay theo gói (một giấy ghi các khóa đã học)?
3. Quy tắc số hiệu (có số vào sổ không, định dạng ra sao). Không tự đặt.
4. Có Quốc hiệu, tiêu ngữ, dòng cơ quan chủ quản không.
5. Ghi những trường nào: họ tên, ngày sinh, đơn vị, hình thức học (trực tiếp/trực tuyến), số buổi?
6. Học viên online nhận bản in gửi bưu điện hay PDF có chữ ký số?
7. Người ký: Viện trưởng Nguyễn Thị Xuân Vy (theo thông báo)? Có thêm chữ ký giảng viên không?

## Bố cục (design kit v2, mục 6 "Giấy chứng nhận"; sơ đồ trong `design-kit/kit.html`)

1. Trên trái: logo màu trực tiếp trên giấy, tên Viện (Oswald, ink). Trên phải: số hiệu theo quy tắc Viện.
2. Giữa: "GIẤY CHỨNG NHẬN" Source Serif 4 600, ink.
3. "Chứng nhận Ông/Bà", họ tên học viên Source Serif 4 600 cỡ 32 đến 36 pt, màu `--cobalt` #0a3d91.
4. Các trường theo trả lời câu 5.
5. "Đã hoàn thành khóa học" + tên khóa (serif, màu chữ K trên giấy của khóa: #0a6f9f, #1f5fcf, #4a6596) + "thuộc chuỗi khóa học Phân tích định lượng với R – Từ cơ bản đến chuyên sâu" + thời gian khóa.
6. Dưới phải: "TP. Hồ Chí Minh, ngày ... tháng 01 năm 2027", chức danh người ký, vùng chữ ký và dấu (cao khoảng 35 mm), họ tên người ký.
7. Nhận diện tiết chế: một đường kẻ màu K của khóa ở mép dưới; lưới chấm `--hair` 60% chỉ ở hai góc; lục giác R nhỏ cạnh dòng chuỗi khóa học (viền cobalt). Không hoa văn, ruy băng, huy chương, không mảng màu lớn.

## Ghép dữ liệu

Họ tên lấy từ Google Sheet đăng ký (cột họ, tên đã tách). Cách làm: template HTML trong `certificate/template/` dùng `brand-kit/tokens.css` (biến chế độ nền sáng), script đọc CSV xuất từ Sheet, in mỗi người một trang PDF khổ thật bằng Chrome headless (như `media/poster/ads/render.py`). Kiểm tra họ tên dài nhất vẫn nằm trên một dòng và dấu tiếng Việt đúng. File ghép chứa dữ liệu cá nhân: để ngoài repo.

## Prompt Claude Design (khi đã có câu trả lời)

```
Dùng design system "VPN · Phân tích định lượng với R (v2, chế độ nền sáng)". Đính kèm brand-board.png (mục 07 Nền sáng) và kit.png (sơ đồ Giấy chứng nhận). Thiết kế giấy chứng nhận A4 ngang (297×210 mm, tràn lề 3 mm, vùng an toàn 15 mm), in trên giấy mỹ thuật trắng. Không hoa văn, không huy chương, không mảng màu lớn, không gradient ngoài logo.

Chữ:
- Trên trái: logo màu, "VIỆN PHÁT TRIỂN NGUỒN LỰC XÃ HỘI PHƯƠNG NAM" Oswald 600 in hoa màu #0d1b2a.
- Trên phải: "Số: [để trống]".
- "GIẤY CHỨNG NHẬN" Source Serif 4 600, 40 pt, #0d1b2a.
- "Chứng nhận Ông/Bà"
- [HỌ VÀ TÊN HỌC VIÊN] Source Serif 4 600, 34 pt, #0a3d91 (mẫu thử chuỗi giữ chỗ "Họ Tên Mẫu Có Dấu Đầy Đủ Ữ Ặ").
- "Đã hoàn thành khóa học"
- "Phân tích dữ liệu với R cơ bản" Source Serif 4 600, 22 pt, #0a6f9f
- "thuộc chuỗi khóa học Phân tích định lượng với R – Từ cơ bản đến chuyên sâu", kèm chữ R nhỏ trong lục giác viền #0a3d91
- "Thời gian: từ ngày 08/01/2027 đến ngày 10/01/2027"
- Dưới phải: "TP. Hồ Chí Minh, ngày ... tháng 01 năm 2027" / "VIỆN TRƯỞNG" / [vùng chữ ký và dấu 35 mm] / "Nguyễn Thị Xuân Vy"
- Mép dưới: một đường kẻ 2 mm màu #5ad8ff (K1). Lưới chấm rất nhạt #cbd4e1 ở góc trên phải và góc dưới trái.
```

Khóa 2 dùng #1f5fcf cho tên khóa và đường kẻ #3f86ff; Khóa 3 dùng #4a6596 và #c3dbff. Chuỗi giữ chỗ chỉ để thử chiều rộng và dấu; bản in lấy họ tên từ danh sách.

## Xuất

`certificate/export/`: mẫu duyệt `C1-mau.pdf`, `C2-mau.pdf`, `C3-mau.pdf`; bản ghép dữ liệu để ngoài repo.
