# First section reference parity plan — 2026-10-01

## Goal

Rework the first visible section of the course landing page to follow the composition of `https://vienphuongnam.com.vn/landing-page` while preserving the approved course facts, inline registration form, anchors, particle canvas, grid, wave divider, mobile navigation, and reduced-motion behavior.

## Implementation boundary

- Restyle the promotion strip and sticky header as dark navy/glass chrome with a white scrolled state.
- Recompose the hero as a viewport-led navy section with a specialist-course badge, centered uppercase H1, compact schedule/location metadata, pill CTAs, grid, linked particles, and the existing wave divider.
- Keep `#registration` immediately after `#top`, with the current full inline form and all IDs/validation behavior unchanged.
- Keep the workbench in curriculum and do not introduce reference-page course copy, dates, assets, CAPTCHA, or backend behavior.

## Verification

- Run static HTML/ID/hash, JavaScript syntax, CSS brace, and diff checks.
- Inspect the local first screen at desktop and confirm hero CTA visibility, title contrast, fixed chrome, and form handoff.
- Recheck responsive rules and reduced-motion selectors before committing.
