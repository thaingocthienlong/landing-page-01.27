# Viện Phương Nam — WorkBuddy-like course landing page

## Design direction

This page uses the composition and interaction rhythm of a polished course landing page: a two-level header, centered course hero, visible registration form, curriculum workbench, scenario tabs, pricing, advantages, FAQ, payment information, black closing CTA, footer, and a compact contact rail. It is an original implementation for Viện Phương Nam. It does not use Tencent branding, copy, assets, or URLs.

The previous Research Instrument / Data Observatory visual world is retired. The former Value section is intentionally removed to keep the page focused. Do not reintroduce readout panels, pipeline axes, pointer-follow signals, dark mesh, neon glow, or fabricated charts.

## Visual contract

- **Palette:** action blue `#0052D9`, deep blue for hover, heading gradient `#0052D9 → #5A8ED9`, a contrast-safe blue surface gradient `#0052D9 → #0B72B1`, white, cool gray mist, black closing CTA, and dark text. The light heading endpoint is reserved for large accent text and is not used for small white copy.
- **Type:** Inter or the system sans stack. Use the monospace stack only for course codes, dates, labels, and compact data values.
- **Container:** centered desktop shell capped near `1200px`; generous section spacing; white and cool-gray sections alternate.
- **Geometry:** mostly square buttons and cards with thin gray borders and restrained shadows. The inline registration form uses an opaque white card with a light border and restrained shadow; the contact CTA uses the blue gradient reserved for action surfaces. Schedule, payment, combination price, and advantage surfaces share a controlled action-blue family. The foundational R/RStudio advantage card leads with a stronger border, surface, and shadow; the remaining cards stay compact and related without unrelated purple/teal accents.
- **Hero:** the first section follows the reference rhythm with a navy network atmosphere, faint 76px grid, floating glass chrome, a pill badge, centered display title, compact date/location metadata, and pill CTAs. The linked-particle field remains restrained and workbench visuals stay in the curriculum; the hero does not contain a competing dashboard.
- **Content:** all dates, course names, fees, contacts, payment details, faculty facts, discount conditions, and stated benefits must remain reconciled to the latest consolidated notice. The official series name is “Phân tích định lượng với R”; the landing-page H1 remains the approved descriptive phrase “Phân tích dữ liệu với R từ cơ bản đến nâng cao”. Registration uses the official URL `https://vienphuongnam.com.vn/phan-tich-du-lieu-voi-r`; the notice also contains a QR code, but this page does not duplicate the QR asset. Course codes remain internal form values and are not rendered as public copy. Do not invent a notice number when the source leaves it blank.
- **Heading treatment:** keep the main heading phrase black and apply the blue-to-light-blue gradient only to a short accent phrase in hero and section `h1`/`h2` headings. Card `h3` text and mono labels remain solid colors. The closing black CTA uses the lighter `#9BBCFF → #67E3D2` variant, while the blue consultation surface uses white-to-light-blue text so the accent remains readable. Card surfaces use the separate contrast-safe blue gradient rather than the pale heading endpoint.
- **Registration:** the full inline form follows the supplied PHP grouping: course, email, split name, gender, birth date, phone, province, work position/unit, degree field, repeatable optional certificate rows, discovery source, and consent. The “Khác” discovery option reveals and requires its detail. PHP-only CAPTCHA/session/hidden endpoint fields are intentionally excluded because this static page has no confirmed backend. It validates locally, preserves entered values, and routes the learner to the real phone contact without claiming submission success.

## Information architecture

1. Promotion strip with the official series name and the source-backed 29/12/2026 registration/payment deadline.
2. Floating dark glass navigation with the Viện Phương Nam wordmark, internal anchors, and a white scrolled state.
3. Hero: source-backed course title centered at large scale on a navy reference-inspired surface, with a specialist-course badge, compact date/location metadata, real registration/program CTAs, particle/grid atmosphere, and no workbench beside the title.
4. Registration: the full PHP-shaped field grouping is visible directly below the hero in an accessible inline form; the static page keeps local validation and the phone fallback.
5. Curriculum: three course scenarios, R basic, cost-effectiveness, and time-series tabs, with the workbench demo marked as illustration.
6. Schedule, six tuition packages and discount conditions, advantages, skills, faculty, FAQ, and payment information. The former value section is intentionally removed.
7. Contact summary and black CTA with phone and official website links.
8. Contact footer and fixed call, website, and back-to-top actions.

## Interaction and motion

- Hero and section reveal: one opacity plus small vertical translation, once per element.
- Hero atmosphere: the network canvas uses 60 desktop particles or 30 mobile particles, pauses when the hero is out of view or the tab is hidden, and renders a single static frame when reduced motion is requested.
- Workbench: one slow ambient float and a restrained status indicator; no competing loops.
- Scenario tabs: keyboard-accessible `role="tablist"`, crossfade/translate around `240ms`, no autoplay.
- Tab content is driven by the single `scenarios` object in `dist/app.js`; invalid keys fall back to `r`.
- Mobile navigation opens from the hamburger, closes on link selection, outside click, resize, or Escape.
- Native `<details>` provides FAQ disclosure without a JavaScript dependency.
- Hover changes border, shadow, and a few pixels of translation. Buttons move the arrow slightly.
- Registration form validation keeps entered values, reports invalid fields, and shows the static-site phone fallback without a fake success state. The full form is inline and does not depend on a dialog or focus trap.
- Registration links point to the official course URL, while the local inline form remains a consultation fallback with no backend claim.
- `prefers-reduced-motion: reduce` removes loops and transforms while retaining readable content and active states.
- Reference-inspired orientation: a compact floating table of contents maps to `#top`, `#registration`, `#programs`, and `#contact`; legacy `#consultation` and reference `#lp-form` aliases resolve to the inline form. It is a glass rail on wide screens and a safe-area-aware bottom bar on narrower screens.
- The header remains fixed as a dark glass capsule over the hero, switches to an opaque white surface after scrolling, and retains the existing mobile navigation behavior. The hero ends with a white SVG wave to create the same section handoff rhythm as the reference; the registration section remains an accessible white inline form.
- Inline fallback behavior exposes a visible no-JavaScript phone fallback and never claims a backend submission. Submission status is focused without moving the learner away from the form, and entered values remain in place.

## Responsive and accessibility gates

- Verify 1440px, 1280px, 768px, and 390px widths with no horizontal overflow.
- Reserve the fixed contact rail lane across mobile section shells so it cannot cover controls or copy.
- Hero collapses to one column; workbench sidebar becomes a compact tab rail; pricing becomes one column.
- Keep one `h1`, continuous heading hierarchy, skip link, visible focus, real `tel:` links, `rel="noreferrer"` for new website tabs, and no hover-only information.
- Preserve `#course-cea` as a compatible deep link that activates the CEA tab.

## Verification and rollback

Run `node --check dist/app.js`, `git diff --check`, HTML/ID/link checks, content and fee arithmetic audits, visual browser QA, and Impeccable detect after the final visual pass. Keep the pre-redesign filesystem snapshot and the current private Site version available. Publish only after source checks and browser QA pass; if preview fails, leave the new version unpublished and restore the prior Site version.
