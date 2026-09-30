# Landing page notice-copy verification — 2026-10-01

## Scope

- Reconciled visible landing-page copy with `assets/THÔNG BÁO (v1)_CHUỖI KHÓA NCKH (01.2027) (1).docx`.
- Updated official series name, exact course names, dates, six package prices, discount rules, faculty facts, URL/QR wording, payment format, contact details, and deadline.
- Preserved the approved centered hero, inline form, grid, particle canvas, workbench, animation, anchors, and static phone fallback.
- Kept legacy course IDs as internal form/scenario values while removing them from public copy.

## Source reconciliation

```text
Official series name and metadata             PASS  Phân tích định lượng với R
Course names                                  PASS  Phân tích dữ liệu với R cơ bản / Phân tích chi phí - hiệu quả trong y tế / Phân tích dữ liệu chuỗi thời gian
Schedule                                      PASS  08–10, 12–13, 15–17/01/2027
Program window                                PASS  08/01/2027–17/01/2027
Package prices                                PASS  8.800.000 / 6.700.000 / 7.500.000 / 6.700.000 / 3.500.000 / 4.500.000
Discount deadline                             PASS  08/12/2026
Registration/payment deadline                PASS  29/12/2026
Official registration URL                     PASS  vienphuongnam.com.vn/phan-tich-du-lieu-voi-r
Payment placeholder                           PASS  [Gói đăng ký]
Faculty copy                                  PASS  UTS/UNSW Sydney, Fellow of Australian Academy of Health and Medical Sciences, Garvan/UNSW and source-backed biographies with roles, research output and expertise
Unsupported notice number/URL claims          PASS  Removed
Book benefit                                  PASS  Gói 1–4, sách tham khảo của GS. Nguyễn Văn Tuấn (no unsupported signed-book claim)
```

The DOCX body was inspected through its XML and the embedded QR image was inspected separately. Full DOCX visual rendering was unavailable because the runtime did not have LibreOffice/pdf2image; the page does not embed the QR asset, so this does not block copy verification.

## Static checks

```text
node --check dist/app.js                         PASS
git diff --check                                 PASS (pre-existing .codebase-memory line-ending warning only)
HTML content/id/hash audit                       PASS (one h1, one form, 52 ids, no duplicates, no missing targets)
Stale copy audit                                 PASS (old dates, prices, notice number, URL/QR claim absent)
CSS brace/removed-dialog audit                   PASS (555 opening, 555 closing; no dialog selectors)
Final copy polish audit                          PASS (full course labels, source-backed faculty details, and `gói đăng ký` fallback wording)
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

- Commit `36028b6` (`Reconcile landing page copy with latest course notice`) contains the initial product and verification changes. Commit `38a3297` records the final exact labels, expanded source-backed faculty details and form fallback wording; commit `fde70c3` adds the explicit Fellow/Australian Academy credential wording. Unrelated `.codebase-memory` changes and the source DOCX remain outside these commits.
- GitHub Pages workflow `36761584309` completed successfully after the push.
- The intermediate workflows `36763413095` and `36764483547` were canceled after remaining in the GitHub Pages environment queue; workflow `36766162048` completed successfully for the final product commit.
- Public checks returned HTTP 200:
  - `https://thaingocthienlong.github.io/landing-page-01.27/?v=20261001-notice-copy`
  - `https://thaingocthienlong.github.io/landing-page-01.27/app.js?v=20261001-notice-copy`
  - `https://thaingocthienlong.github.io/landing-page-01.27/styles.css?v=20261001-notice-copy`
- Final cache-busted checks for `fde70c3` returned HTTP 200:
  - `https://thaingocthienlong.github.io/landing-page-01.27/?v=20261001-final-fde70c3`
  - `https://thaingocthienlong.github.io/landing-page-01.27/app.js?v=20261001-final-fde70c3`
  - `https://thaingocthienlong.github.io/landing-page-01.27/styles.css?v=20261001-final-fde70c3`
- The deployed page title is `Phân tích định lượng với R | Viện Phương Nam`; the public accessibility tree exposes the new deadline, exact course options, six prices, official URL, payment placeholders, and faculty copy.
- Rollback is `git revert fde70c3 38a3297 36028b6` for the product reconciliation commits; no backend or migration rollback is required.
