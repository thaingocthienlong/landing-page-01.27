# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing: plain static HTML/CSS/JS in `dist/`, deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`. No build step, no backend.

## Users

Vietnamese researchers, postgraduate students, lecturers, and health/pharma/health-economics professionals who need to analyse their own data in R. Many are clinicians or health researchers with no programming background. They decide on one course or a combined package, compare fees and discount deadlines, and register through the official Viện Phương Nam page or by phone. They read Vietnamese; many arrive on mobile from Zalo/Facebook/email links.

## Product Purpose

Sell seats in "Chuỗi khóa học Phân tích định lượng với R" (01/2027), run by Viện Phương Nam: three linked courses, 08/01–17/01/2027, in person at 45 Đinh Tiên Hoàng (TP. Hồ Chí Minh) or online via Zoom. Success is a completed registration and tuition payment by 28/12/2026 (early-bird deadline 08/12/2026).

## Positioning

Taught directly by GS.TS. Nguyễn Văn Tuấn (UTS / UNSW Sydney, 35+ years of medical research, 350+ papers) with TS. Trần Sơn Thạch; courses are built for health and medical research questions, from R basics to cost-effectiveness (ICER, Markov) and time-series (ARIMA).

## Operating Context

Source of truth is the v4 notice (`assets/THÔNG BÁO_v.4_CHUỖI KHÓA NCKH (01.2027).docx`); page wording follows its terms (Chuỗi khóa học, Thời gian tổ chức, Hình thức tổ chức, Địa điểm tổ chức, Phần mềm sử dụng, Giảng viên, Gói đăng ký, Học phí/học viên, Ưu đãi học phí, Hình thức nộp học phí). The page deliberately carries no link to the official registration page; the notice's QR code is not duplicated. Payment is by cash or bank transfer (OCB, Tân Thuận branch).

## Capabilities and Constraints

- Official series name: "Phân tích định lượng với R". Approved H1 phrase: "Phân tích dữ liệu với R từ cơ bản đến nâng cao".
- Courses: R cơ bản (08–10/01, 3 days), Chi phí - hiệu quả trong y tế (12–13/01, 2 days), Chuỗi thời gian (15–17/01, 3 days). Daily 08:30–12:00 and 13:30–17:00; first day starts 08:00.
- Registration is by package only: policy does not allow registering for Khóa 1 alone, so the form offers Gói 1 to Gói 6 (never single courses).
- Six tuition packages (8.800.000 / 6.700.000 / 7.500.000 / 6.700.000 / 3.500.000 / 4.500.000 đồng) with discount rules keyed to 08/12/2026 (v3: 10% before 08/12 and 5% for groups of 3+ on packages 1–4, existing learners 10% plus 5% if paid before 08/12, 10% before 08/12 on packages 5–6). The v3 notice dropped the reference book gift, so the page must not mention one. All figures must stay reconciled to the notice.
- Static site; registrations go to a Google Apps Script web app (`apps-script/Code.gs`, URL set in the form's `data-endpoint`) that appends to a Google Sheet and emails the owner. While `data-endpoint` is empty or a send fails, the form must never claim a successful submission and falls back to phone. Field set follows the supplied PHP form minus the degree-field and certificate fields, which were dropped on request (package, email, split name, gender, birth date, phone, province, position/unit, discovery source, consent to the privacy policy at https://vienphuongnam.com.vn/chinh-sach-bao-mat.php); CAPTCHA/session fields are intentionally excluded.
- Course codes (PTCBR01.27, PTHQR01.27, PTTGR01.27) are internal form values, not public copy. Do not invent a notice number.
- Contacts: (028) 2242 6789; 0949 761 636 (Ms. Vy); 0912 114 511 (Ms. Thảo).

## Evidence on Hand

Real: course schedule, fees, discount rules, faculty biographies, contact and payment details (all in the notices). Absent and not to be fabricated: faculty photos, classroom/venue photos, testimonials, student counts, outcomes, any statistics about past cohorts. Any illustrative data graphic must be labelled as illustration.

## Product Principles

1. The notice is the truth: dates, fees, and conditions are never rewritten for style.
2. Show the learner their own problem (a real analysis in R) before asking for 24 fields.
3. Never promise what a static page cannot do: no fake submit success, no fake availability.
4. Mobile first: most visitors arrive from a phone link and must reach price, dates, and the register action without hunting.

## Accessibility & Inclusion

Vietnamese text with full diacritics must render in the chosen faces. Keep one h1, skip link, visible focus, keyboard-operable tabs and form, real `tel:` links, reduced-motion support, and body text no smaller than 14px.
