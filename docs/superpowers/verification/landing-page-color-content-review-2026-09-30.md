# Landing page color and copy review — 2026-09-30

## Scope

- Resolved the four browser annotations covering the schedule, combination price cards, payment account card, and four advantage cards/icons.
- Audited visible copy for inconsistent Vietnamese spelling, course terminology, CTA wording, payment placeholders, and unnecessary English parentheticals.
- Kept semantic green status indicators separate from decorative accent colors.

## Implemented contract

- Schedule, combination price, payment, and advantage icon surfaces use the shared contrast-safe gradient `#0052D9 → #2E73CF`.
- Advantage cards use a light blue surface wash and all four icons use the same blue gradient; purple/teal/green decorative variants are no longer visible.
- The pale `#0052D9 → #B8D5FB` gradient remains limited to heading accent phrases and the trust line uses a darker readable blue variant.
- Price cards show source-backed base prices and the word `đồng` with spacing; no calculated discounted totals are present.
- Copy now consistently uses `khóa`, `Báo cáo viên`, `trực tiếp hoặc trực tuyến qua Zoom`, `Tài liệu theo tổ hợp`, and the full `[Số điện thoại người đại diện]` placeholder.
- Consultation and closing CTA buttons use the canonical label `Đăng ký tư vấn`.

## Verification

- `node --check dist/app.js` — passed.
- `git diff --check` — passed; Git reported only its normal LF/CRLF conversion notice.
- Static audit — passed: one `h1`; no duplicate IDs; every explicit label target exists; exactly one consultation form/status/error; two fieldsets with ten radios; no fake endpoint/CAPTCHA/SMTP/credential markers; no TODO/TBD/lorem; no calculated discount totals; CSS braces balanced (`508/508`); no undefined CSS variables; no invalid or empty links.
- Browser preview at `http://127.0.0.1:4173/` — checked schedule, pricing, payment, and advantages at the current desktop viewport. Computed styles confirmed the shared gradient and blue advantage treatment. Document width remained within the viewport (`1071px` document width vs `1086px` viewport).
- Existing responsive QA from the prior review remains applicable because this pass changes only color tokens, card surfaces, copy, and price spacing; it does not alter breakpoints or layout structure.

## Rollback

Revert the commit containing this review to return to the previously pushed page (`e1fd501`):

```powershell
git revert <new-commit-sha>
```

The codebase-memory metadata files remain uncommitted and are excluded from the product change.
