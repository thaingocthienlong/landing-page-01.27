# Landing page structure verification - 2026-10-01

## Scope

- Replaced the two-column dashboard hero with a centered course-title hero.
- Moved the full registration form inline directly after the hero.
- Kept the existing light visual system, grid, linked particles, wave, course facts, and scenario workbench.
- Removed dialog-only registration behavior and retained local validation plus the phone fallback.
- Preserved legacy `#consultation`, reference `#lp-form`, and `#course-cea` navigation behavior.

## Evidence

```text
Task 1 structure audit                    PASS (hero -> registration -> curriculum; no hero workbench; no dialog)
Task 2 style audit                        PASS (centered hero, large title, registration card, responsive rules, no dialog CSS)
Task 3 behavior audit                     PASS (inline validation, phone grammar, Khác, certificates, status, no modal state)
node --check dist/app.js                  PASS
git diff --check                          PASS (product files clean; pre-existing .codebase-memory line-ending warning only)
HTML id/hash audit                        PASS (52 ids, no duplicates, no missing hash targets, one h1, one form, no dialogs)
CSS brace balance                         PASS (555 opening and 555 closing braces)
Dead dialog selector audit                PASS (HTML, CSS, and JS contain no dialog/modal behavior)
Browser QA at 1440/1280/768/390px         PASS (no horizontal overflow; centered title; inline form visible after hero)
Form interaction QA                       PASS (empty required validation, phone grammar, Khác toggle, certificate add/remove, fallback status/data retention)
Course deep link QA                       PASS (#course-cea selects Chi phí - hiệu quả)
Public deployment                         PASS (GitHub Pages workflow 36756512622 succeeded; commit e0ef7d6)
```

## Required browser checks

- The first content view has one centered large `h1`, metadata, and CTAs.
- The full form is visible immediately below the hero without opening a dialog.
- The scenario workbench appears in `#programs`, after registration.
- Registration, legacy consultation, reference form alias, curriculum, schedule, tuition, faculty, advantages, skills, and contact anchors resolve.
- Required validation, invalid phone, `Khác`, certificate rows, keyboard order, status focus, and phone fallback work inline.
- No horizontal overflow or fixed-rail obstruction appears at 1440px, 1280px, 768px, or 390px.

## Browser evidence

- Chrome viewport checks completed at 1440×900, 1280×800, 768×1024, and 390×844. The measured document width stayed at or below the viewport width after the scrollbar, the title stayed inside the content shell, and the registration section followed the hero in every viewport.
- The 390px screenshot shows the centered title, stacked CTAs, mobile navigation, contact rail, safe-area floating TOC, and the inline form card without overlap.
- Empty submit exposed the form alert. A 3-digit phone was rejected. Selecting `Khác` made `#consultation-other` visible, enabled, and required; returning to Email hid, disabled, and unrequired it.
- Adding a certificate created indexes `1` and `2`; removing the second row restored only the first row. A valid local-only check displayed the phone fallback and preserved the entered course and phone values.

## Deployment evidence

- `https://thaingocthienlong.github.io/landing-page-01.27/?v=20261001-structure` returned HTTP 200 and exposes one `h1`, one form, `#registration`, the centered source title, and no dialog markup.
- `https://thaingocthienlong.github.io/landing-page-01.27/app.js?v=20261001-structure` returned HTTP 200 with no `showModal` or `data-open-consultation` behavior.
- `https://thaingocthienlong.github.io/landing-page-01.27/styles.css?v=20261001-structure` returned HTTP 200 with no dialog selectors.
- Public browser AX inspection confirmed the centered hero, inline `consultation-form`, `#registration` before `#programs`, updated header/TOC anchors, and the complete field set.
