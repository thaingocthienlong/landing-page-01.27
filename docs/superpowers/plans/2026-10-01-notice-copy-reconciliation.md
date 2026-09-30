# Notice copy reconciliation plan

## Source of truth

Use `assets/THÔNG BÁO (v1)_CHUỖI KHÓA NCKH (01.2027) (1).docx` for the official series name, course names, dates, six packages, prices, discount rules, registration URL, payment wording, contact details, and faculty facts. Keep the approved landing-page H1 while adding the official series name to metadata and supporting labels.

## Implementation

- Update stale copy in `dist/index.html`, including metadata, promo deadline, hero metadata, course options, schedule, pricing, discount details, faculty, FAQ, payment, contact, CTA, and footer.
- Keep legacy course IDs only as internal form values; do not render them in public copy.
- Update `dist/app.js` scenario labels and dates, hide the code from the scenario kicker, and preserve all inline form and deep-link behavior.
- Update `DESIGN.md` and write a separate verification record. Do not add a QR asset; link to the official registration URL and state that the QR is in the notice.

## Verification and release

- Run static HTML/id/hash/content audits, `node --check dist/app.js`, and `git diff --check`.
- Test the page at 1440, 1280, 768, and 390px, including external registration links, scenario tabs, form validation, mobile overflow, and fixed rails.
- Commit only product/docs changes, preserve unrelated `.codebase-memory` changes, push `origin/main`, wait for Pages, and verify public HTML/JS/CSS with cache busting.

## Rollback

Revert the copy-reconciliation commit to restore the preceding deployed content. No backend migration or data rollback is required.
