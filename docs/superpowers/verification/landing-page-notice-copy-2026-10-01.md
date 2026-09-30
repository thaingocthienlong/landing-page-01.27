# Landing page notice-copy verification — 2026-10-01

## Scope

- Reconciled visible landing-page copy with `assets/THÔNG BÁO (v1)_CHUỖI KHÓA NCKH (01.2027) (1).docx`.
- Updated official series name, course names, dates, six package prices, discount rules, faculty facts, URL/QR wording, payment format, contact details, and deadline.
- Preserved the approved centered hero, inline form, grid, particle canvas, workbench, animation, anchors, and static phone fallback.
- Kept legacy course IDs as internal form/scenario values while removing them from public copy.

## Source reconciliation

```text
Official series name and metadata             PASS  Phân tích định lượng với R
Course names                                  PASS  R cơ bản / CEA trong y tế / chuỗi thời gian
Schedule                                      PASS  08–10, 12–13, 15–17/01/2027
Program window                                PASS  08/01/2027–17/01/2027
Package prices                                PASS  8.800.000 / 6.700.000 / 7.500.000 / 6.700.000 / 3.500.000 / 4.500.000
Discount deadline                             PASS  08/12/2026
Registration/payment deadline                PASS  29/12/2026
Official registration URL                     PASS  vienphuongnam.com.vn/phan-tich-du-lieu-voi-r
Payment placeholder                           PASS  [Gói đăng ký]
Faculty copy                                  PASS  UTS/UNSW, Garvan/UNSW and source-backed biographies
Unsupported notice number/URL claims          PASS  Removed
Book benefit                                  PASS  Gói 1–4, sách tham khảo của GS. Nguyễn Văn Tuấn
```

The DOCX body was inspected through its XML and the embedded QR image was inspected separately. Full DOCX visual rendering was unavailable because the runtime did not have LibreOffice/pdf2image; the page does not embed the QR asset, so this does not block copy verification.

## Static checks

```text
node --check dist/app.js                         PASS
git diff --check                                 PASS (pre-existing .codebase-memory line-ending warning only)
HTML content/id/hash audit                       PASS (one h1, one form, 52 ids, no duplicates, no missing targets)
Stale copy audit                                 PASS (old dates, prices, notice number, URL/QR claim absent)
CSS brace/removed-dialog audit                   PASS (555 opening, 555 closing; no dialog selectors)
```

## Browser checks

```text
1440px                                          PASS  no horizontal overflow; centered hero and readable pricing
1280px                                          PASS  no horizontal overflow; section order preserved
768px                                           PASS  no horizontal overflow; tablet reflow preserved
390px                                           PASS  no horizontal overflow; mobile title, form and fixed rail fit
```

Additional browser evidence:

- The accessibility tree exposes the new title, deadline, exact course options, six package prices, official registration URL, payment placeholders and updated faculty copy.
- Empty form submission reports the required-field error and focuses `#consultation-course`.
- Selecting `Khác` makes the extra field visible, enabled and required; selecting Email hides, disables and clears its required state.
- Adding/removing a certificate row restores the expected `1`/`2` IDs.
- `#course-cea` selects `Chi phí - hiệu quả trong y tế` and shows `12–13/01/2027 · 02 ngày`.
- No browser console errors or warnings were reported.

## Release and rollback

- Product/doc changes are ready for commit; unrelated `.codebase-memory` changes remain untouched.
- Rollback is `git revert <copy-reconciliation-commit>`; no backend or migration rollback is required.
