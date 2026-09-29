# Viện Phương Nam — WorkBuddy-like course landing page

## Design direction

This page uses the composition and interaction rhythm of a polished product landing page: a two-level header, two-column hero, product-style workbench, scenario tabs, pricing, value cards, FAQ, black closing CTA, footer, and a compact contact rail. It is an original implementation for Viện Phương Nam. It does not use Tencent branding, copy, assets, or URLs.

The previous Research Instrument / Data Observatory visual world is retired. Do not reintroduce readout panels, pipeline axes, pointer-follow signals, dark mesh, neon glow, or fabricated charts.

## Visual contract

- **Palette:** action blue `#0052D9`, deep blue for hover, white, cool gray mist, black closing CTA, and dark text. Navy is not the dominant brand field.
- **Type:** Inter or the system sans stack. Use the monospace stack only for course codes, dates, labels, and compact data values.
- **Container:** centered desktop shell capped near `1200px`; generous section spacing; white and cool-gray sections alternate.
- **Geometry:** mostly square buttons and cards with thin gray borders and restrained shadows. No glassmorphism or large pill controls.
- **Hero:** light-blue wash and dot pattern are allowed; workbench visuals are built in HTML/CSS and do not depend on external assets.
- **Content:** all dates, codes, fees, contacts, payment details, faculty facts, and certificate conditions must remain reconciled to the source notices. Missing registration URL/QR stays explicitly unresolved.

## Information architecture

1. Promotion strip with January 2027 intake and 25/12/2026 deadline.
2. White navigation with Viện Phương Nam wordmark and internal anchors.
3. Hero: source-backed headline, 03 courses, 08 days, 02 formats, real contact CTAs, and workbench demo marked as illustration.
4. Use Cases: R basic, cost-effectiveness, and time-series tabs.
5. Schedule, tuition combinations and discounts, value, advantages, skills, faculty, FAQ.
6. Black CTA with phone and official website links.
7. Contact footer and fixed call, website, and back-to-top actions.

## Interaction and motion

- Hero and section reveal: one opacity plus small vertical translation, once per element.
- Workbench: one slow ambient float and a restrained status indicator; no competing loops.
- Scenario tabs: keyboard-accessible `role="tablist"`, crossfade/translate around `240ms`, no autoplay.
- Tab content is driven by the single `scenarios` object in `dist/app.js`; invalid keys fall back to `r`.
- Mobile navigation opens from the hamburger, closes on link selection, outside click, resize, or Escape.
- Native `<details>` provides FAQ disclosure without a JavaScript dependency.
- Hover changes border, shadow, and a few pixels of translation. Buttons move the arrow slightly.
- `prefers-reduced-motion: reduce` removes loops and transforms while retaining readable content and active states.

## Responsive and accessibility gates

- Verify 1440px, 1280px, 768px, and 390px widths with no horizontal overflow.
- Hero collapses to one column; workbench sidebar becomes a compact tab rail; pricing becomes one column.
- Keep one `h1`, continuous heading hierarchy, skip link, visible focus, real `tel:` links, `rel="noreferrer"` for new website tabs, and no hover-only information.
- Preserve `#course-cea` as a compatible deep link that activates the CEA tab.

## Verification and rollback

Run `node --check dist/app.js`, `git diff --check`, HTML/ID/link checks, content and fee arithmetic audits, visual browser QA, and Impeccable detect after the final visual pass. Keep the pre-redesign filesystem snapshot and the current private Site version available. Publish only after source checks and browser QA pass; if preview fails, leave the new version unpublished and restore the prior Site version.
