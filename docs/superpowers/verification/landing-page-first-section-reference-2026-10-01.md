# First-section reference parity verification — 2026-10-01

## Scope

The first visible section was reworked to follow the visual rhythm of `https://vienphuongnam.com.vn/landing-page` while retaining the landing page's approved content and behavior. The implementation uses the current official series/course information and does not copy the reference page's course title, dates, form endpoint, CAPTCHA, or assets.

## Implemented

- Navy hero surface with the existing grid overlay, linked-particle canvas, and white wave handoff.
- Floating dark glass promotion/header chrome with a white scrolled state and preserved mobile navigation.
- Specialist-course pill badge, centered uppercase course H1, compact date/location line, and two pill CTAs.
- Existing inline registration section remains directly after the hero; form IDs, aliases, validation, phone fallback, and course values remain unchanged.
- Workbench remains in the curriculum section.

## Static verification

```text
node --check dist/app.js                         PASS
HTML audit                                          PASS  one h1, 52 ids, no duplicates, no missing hash targets
CSS brace balance                                  PASS  623 opening / 623 closing braces
git diff --check                                  PASS  pre-existing .codebase-memory line-ending warning only
Reference visual markers                           PASS  badge, navy hero, fixed glass header, pill CTA styles present
```

## Browser verification

- Local first-screen screenshot confirms the navy/grid/particle hero, glass header, centered title, date metadata, and both CTAs.
- The CTA is fully visible after the desktop vertical-rhythm adjustment.
- Accessibility tree confirms the preserved registration section, course options, anchors, and form fields immediately after the hero.
- Existing responsive and reduced-motion rules remain in place; no form or curriculum JavaScript was changed.

## Rollback

Revert the reference-parity commit to restore the previous light hero/chrome. No backend, data, or migration rollback is required.
