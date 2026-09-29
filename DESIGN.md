# Viện Phương Nam — WorkBuddy-like course landing page

## Design direction

This page uses the composition and interaction rhythm of a polished product landing page: a two-level header, two-column hero, product-style workbench, scenario tabs, pricing, advantages, FAQ, payment information, black closing CTA, footer, and a compact contact rail. It is an original implementation for Viện Phương Nam. It does not use Tencent branding, copy, assets, or URLs.

The previous Research Instrument / Data Observatory visual world is retired. The former Value section is intentionally removed to keep the page focused. Do not reintroduce readout panels, pipeline axes, pointer-follow signals, dark mesh, neon glow, or fabricated charts.

## Visual contract

- **Palette:** action blue `#0052D9`, deep blue for hover, heading gradient `#0052D9 → #008FA8`, white, cool gray mist, black closing CTA, and dark text. Navy is not the dominant brand field.
- **Type:** Inter or the system sans stack. Use the monospace stack only for course codes, dates, labels, and compact data values.
- **Container:** centered desktop shell capped near `1200px`; generous section spacing; white and cool-gray sections alternate.
- **Geometry:** mostly square buttons and cards with thin gray borders and restrained shadows. The consultation section uses a blue gradient with a localized white translucent preview card; transparency is localized and has an opaque fallback. Schedule, payment, and combination price cards use controlled blue gradients.
- **Hero:** light-blue wash and dot pattern are allowed; workbench visuals are built in HTML/CSS and do not depend on external assets.
- **Content:** all dates, codes, fees, contacts, payment details, faculty facts, and certificate conditions must remain reconciled to the source notices. Missing registration URL/QR stays explicitly unresolved. The registration statement in the promotion strip is user-supplied trust copy, kept at the user’s direction and not treated as a claim extracted from the four course notices.
- **Heading treatment:** keep the main heading phrase black and apply the blue-to-cyan gradient only to a short accent phrase in hero and section `h1`/`h2` headings. Card `h3` text and mono labels remain solid colors. The closing black CTA uses the lighter `#9BBCFF → #67E3D2` variant, while the blue consultation surface uses a white-to-mint contrast variant so the accent remains readable.
- **Consultation:** the static page opens a native dialog whose visible fields follow the supplied PHP grouping: course, email, split name, gender, birth date, phone, province, work position/unit, degree field, optional certificate, discovery source, and consent. The “Khác” discovery option requires its detail. PHP-only CAPTCHA/session/hidden endpoint fields are intentionally excluded because this static page has no confirmed backend. It validates locally, preserves entered values, and routes the learner to the real phone contact without claiming submission success.

## Information architecture

1. Promotion strip with the user-supplied institutional registration statement and the source-backed 25/12/2026 registration/payment deadline.
2. White navigation with Viện Phương Nam wordmark and internal anchors.
3. Hero: source-backed headline, 03 courses, 08 days, 02 formats, real contact CTAs, and workbench demo marked as illustration.
4. Three course scenarios: R basic, cost-effectiveness, and time-series tabs. Section labels are omitted to keep the page compact.
5. Schedule, tuition combinations and discount conditions, advantages, skills, faculty, FAQ, and payment information. The former value section is intentionally removed.
6. Consultation summary over a blue gradient surface, with the PHP-shaped fields in an accessible native dialog popup.
7. Black CTA with phone and official website links.
8. Contact footer and fixed call, website, and back-to-top actions.

## Interaction and motion

- Hero and section reveal: one opacity plus small vertical translation, once per element.
- Workbench: one slow ambient float and a restrained status indicator; no competing loops.
- Scenario tabs: keyboard-accessible `role="tablist"`, crossfade/translate around `240ms`, no autoplay.
- Tab content is driven by the single `scenarios` object in `dist/app.js`; invalid keys fall back to `r`.
- Mobile navigation opens from the hamburger, closes on link selection, outside click, resize, or Escape.
- Native `<details>` provides FAQ disclosure without a JavaScript dependency.
- Hover changes border, shadow, and a few pixels of translation. Buttons move the arrow slightly.
- Consultation form validation keeps entered values, reports invalid fields, and shows the static-site phone fallback without a fake success state.
- `prefers-reduced-motion: reduce` removes loops and transforms while retaining readable content and active states.

## Responsive and accessibility gates

- Verify 1440px, 1280px, 768px, and 390px widths with no horizontal overflow.
- Hero collapses to one column; workbench sidebar becomes a compact tab rail; pricing becomes one column.
- Keep one `h1`, continuous heading hierarchy, skip link, visible focus, real `tel:` links, `rel="noreferrer"` for new website tabs, and no hover-only information.
- Preserve `#course-cea` as a compatible deep link that activates the CEA tab.

## Verification and rollback

Run `node --check dist/app.js`, `git diff --check`, HTML/ID/link checks, content and fee arithmetic audits, visual browser QA, and Impeccable detect after the final visual pass. Keep the pre-redesign filesystem snapshot and the current private Site version available. Publish only after source checks and browser QA pass; if preview fails, leave the new version unpublished and restore the prior Site version.
