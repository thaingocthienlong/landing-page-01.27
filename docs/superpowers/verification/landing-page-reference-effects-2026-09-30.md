# Landing page reference effects verification - 2026-09-30

## Lane and scope

- Lane: code/config change with browser-visible UI verification.
- Scope: preserve the existing light landing-page style while adding structural motifs observed on the supplied reference page: sticky header state, section navigation, hero grid, linked-particle field, and a wave handoff into the following section.
- Reference reviewed: https://vienphuongnam.com.vn/landing-page
- Existing content, palette, typography, form fields, pricing, and section anchors were retained. The new effects are decorative or navigational layers around the existing content.
- Rollback before commit: `git restore --source=HEAD -- DESIGN.md dist/app.js dist/index.html dist/styles.css`. This does not touch the pre-existing `.codebase-memory` metadata changes. After a future commit, use `git revert <commit-sha>`.

## Implementation evidence

- `dist/index.html`: adds the hero canvas and grid overlay, the SVG wave divider, and four real section links in the floating table of contents. The stylesheet and script queries are cache-busted so the new layer is visible in a static deployment.
- `dist/styles.css`: keeps the existing colors and layout, adds the faint 76px hero grid, low-opacity canvas layer, wave handoff, sticky-header state, desktop glass rail at wide screens, and a safe-area bottom rail below the wide-screen threshold.
- `dist/app.js`: adds scroll-aware header styling, IntersectionObserver section tracking, and a device-pixel-ratio-capped canvas simulation. The simulation uses 60 particles on desktop and 30 on small screens, links nearby particles within 118 CSS pixels, pauses when the hero is out of view or the document is hidden, and renders one static frame for reduced-motion users.
- `DESIGN.md`: records the new grid, particle, navigation, and reduced-motion behavior as part of the visual contract.

## Verification evidence

```text
node --check dist/app.js                 PASS
git diff --check                         PASS (only expected line-ending warnings)
HTML id/hash audit                       PASS (48 ids, 0 duplicates, 0 missing hash targets)
CSS brace balance                       PASS (544 opening, 544 closing braces)
Feature hook audit                      PASS (canvas, grid, TOC, reduced-motion hooks present)
Browser preview at localhost:4173       PASS at the available 768px viewport
TOC interaction                         PASS (clicking Khóa học updates the URL to #programs and active state)
Cache-busted HTML/JS/CSS requests       PASS (HTTP 200 for all three local assets)
```

The browser screenshot showed the existing light-blue/white design with a faint blue grid and linked particles behind the hero, plus the styled bottom section rail and the existing contact rail. The TOC click was exercised against the real local page rather than a mock control. The current browser tool did not provide a deterministic resize control in this run, so the newly added rail/canvas layer was not independently re-screenshot at 1440, 1280, or 390px; the existing responsive layout baseline remains unchanged and the CSS contains explicit wide, narrow, and reduced-motion rules.

## Delivery gate

- Existing design style retained: PASS.
- Reference-informed component structure added without replacing existing content: PASS.
- Faint grid added with no layout footprint: PASS.
- Moving linked particles added with bounded work, visibility pausing, and reduced-motion behavior: PASS.
- Navigation targets are real anchors with active-state semantics: PASS.
- No invented testimonials, metrics, people, pricing, or external submission behavior: PASS.
- No duplicate HTML ids or missing internal hash targets: PASS.
- No known horizontal overflow in the exercised 768px browser view: PASS.
