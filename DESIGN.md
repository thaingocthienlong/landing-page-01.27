---
name: Viện Phương Nam - Phân tích định lượng với R
description: A journal manuscript on white paper. Sections are Figures and Tables, cobalt plates carry the evidence, signal red marks only the deadline and required fields.
colors:
  paper: "#ffffff"
  plate: "#f3f6fb"
  ink: "#0d1b2a"
  ink-2: "#3a4a5f"
  ink-3: "#566780"
  hair: "#cbd4e1"
  field: "#7f93b0"
  cobalt: "#0a3d91"
  cobalt-deep: "#072c6b"
  cobalt-wash: "#eaf0fb"
  cobalt-tint: "#cfe0ff"
  signal: "#c4231a"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, Cambria, Times New Roman, serif"
    fontSize: "clamp(2.35rem, 1.1rem + 4vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Source Serif 4, Georgia, Cambria, Times New Roman, serif"
    fontSize: "clamp(1.9rem, 1.3rem + 1.9vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Source Serif 4, Georgia, Cambria, Times New Roman, serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    letterSpacing: "0.07em"
rounded:
  sharp: "2px"
  round: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  section: "clamp(64px, 8vw, 120px)"
  gutter: "clamp(20px, 4vw, 48px)"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sharp}"
    padding: "12px 24px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    padding: "12px 24px"
    height: "50px"
  button-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cobalt-deep}"
    rounded: "{rounded.sharp}"
    padding: "12px 24px"
    height: "50px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    padding: "10px 14px"
    height: "50px"
  plate:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
    padding: "28px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "20px"
  tab-active:
    textColor: "{colors.cobalt}"
---

# Design System: Viện Phương Nam - Phân tích định lượng với R

## Overview

**Creative North Star: "The Manuscript"**

The page is a journal manuscript. Each section is a Figure or a Table the learner will learn to make: a scatter with fit and 95% band, a cost-effectiveness plane, a forecast series, a schedule table, a price table, a discount table. Structure comes from rules (heavy 2px ink rule above, 1px hairline between rows), not from boxes. Voice is the figure caption: plain, numbered, exact.

Density is editorial and calm. White paper carries text; a pale plate tint (#f3f6fb) alternates with it for section fields; one cobalt field carries evidence plates and the closing section. Red appears only where the reader must act or must not miss something: the registration deadline and required-field marks.

**Key Characteristics:**
- Booktabs rules: 2px ink top rule, 1px hairline row dividers, 2px ink bottom rule on tables and lists.
- Serif for claims and numbers, sans for reading and controls.
- One cobalt field per view at most: the plate, the registration aside, the close.
- Figures are generated, labelled as simulated, and annotated with leader lines.
- No gradients as decoration, no glass, no particle or canvas atmosphere, no fake product mockups.

## Colors

Blue-black ink on white paper, one saturated cobalt, one signal red.

### Primary
- **Cobalt Plate** (#0a3d91): the only brand field. Evidence plates, registration aside, featured price row, schedule day cells, closing section, primary buttons, active tab, links.
- **Deep Cobalt** (#072c6b): hover for cobalt buttons; text on light-on-cobalt buttons.

### Secondary
- **Signal Red** (#c4231a): the deadline value in the abstract list and the required-field mark and the invalid-field border. Nothing else.

### Neutral
- **Paper** (#ffffff): page ground, header, inputs, sheets.
- **Plate Tint** (#f3f6fb): alternate section field, hover and consent rows, rest days in the schedule.
- **Blue-Black Ink** (#0d1b2a): text, heavy rules, promotion strip and footer ground.
- **Ink 2** (#3a4a5f): secondary body copy. **Ink 3** (#566780): labels, captions, meta.
- **Hairline** (#cbd4e1): row dividers and sheet borders. **Field Edge** (#7f93b0): input and quiet-button borders.
- **Cobalt Wash** (#eaf0fb): checked choice and status feedback. **Cobalt Tint** (#cfe0ff): secondary text on cobalt.

### Named Rules
**The One Field Rule.** Cobalt is a field, not a trim. It fills a plate or a section; it is not used as a border colour on neutral cards or as a decorative gradient.
**The Red Is An Instruction Rule.** Signal red means deadline or required. A decorative or brand use of red is wrong.
**The Tinted Field Rule.** Section fields use the plate tint (#f3f6fb) instead of pure white. Known and accepted deviation from a pure-white paper; keep it as the only alternate ground.

## Typography

**Display Font:** Source Serif 4 (Georgia, Cambria fallback), optical sizing auto, loaded from Google Fonts.
**Body Font:** Source Sans 3 (Segoe UI, system-ui fallback).

**Character:** A journal's serif for headings, prices, captions-as-claims and dates; a humanist sans for reading, forms and axis text.

### Hierarchy
- **Display** (600, clamp 2.35rem to 4.5rem = 72px at wide, 1.08): the single H1; its italic phrase is cobalt.
- **Headline** (600, clamp 1.9rem to 3rem, 1.12): section h2. Close h2 runs up to 3.75rem.
- **Title** (600, 1.1875rem to 2.375rem serif): table row heads, ruled-list titles, author names.
- **Body** (400, 17px / 1.0625rem, 1.65): all running text; never below 17px. Reading measure 62ch to 72ch.
- **Label** (700, 0.8125rem, 0.07em, uppercase): definition-list terms and table column heads only, in Ink 3.
- **Chart text** (sans 500/600): ticks 14px, axis labels 15.5px, annotations 16px in the SVG viewBox; hero plate 16/17/17.5px; at 720px and below 17 to 21px. Rendered size must stay at or above 11px.

### Named Rules
**The Tabular Rule.** Dates, prices, phone numbers and step counts use tabular numerals.
**The Caption Rule.** Figures and tables carry a numbered caption (Hình n, Bảng n) in bold lead plus plain sentence.

## Layout

Single column shell, max 1240px, gutter clamp(20px, 4vw, 48px). Section padding clamp(64px, 8vw, 120px). Patterns: hero grid 1.12fr / 0.88fr (text left, plate right); split 4fr / 8fr with a sticky heading column (top 112px); registration 4fr / 8fr with sticky cobalt aside; program panel 7fr / 5fr; two-column outcomes and authors; close 7fr / 5fr.

First viewport: serif H1, byline, ruled abstract list (term 112px, value), two actions on the left; live Figure 1 on a cobalt plate on the right. Sticky header 72px over a 42px ink promotion strip.

Responsive: single column at 900px and below (nav becomes toggle, fixed bottom call bar appears, aside becomes static); at 720px and below tables collapse to stacked rows with the head row hidden accessibly, tabs stack vertically with a 4px left indicator, chart text steps up. Gates: verify 1440 / 1280 / 768 / 390 with no horizontal overflow; one h1; skip link; visible focus (2px cobalt outline, 3px offset, white on cobalt/ink fields); tabs operable by arrow, Home and End; real `tel:` links; body at least 17px.

## Elevation & Depth

Flat. There are no drop shadows. Depth is tonal (paper, plate tint, cobalt field) and linear (rules). The only box-shadow uses are inset tab indicators and the 1px invalid ring. The sheet is a white figure area with a hairline border, not a lifted card.

### Named Rules
**The Rule-Not-Box Rule.** Group with a ruled list or table, not a bordered, shadowed container.

## Shapes

Square. Radius is 2px on buttons, inputs and toggle; 50% only on step-number discs and the status dot. Corners are never soft. Borders are 1px hairline or field-edge; heavy 2px ink rules open lists and tables.

## Components

### Buttons
- **Primary:** cobalt on white text, 50px min height, 12px 24px, 2px radius, 600 weight; hover to deep cobalt, arrow icon shifts 3px.
- **Ghost:** 1px ink border, fills ink on hover. **Quiet:** white with field-edge border. **Light / Outline-light:** for use on cobalt fields.
- Text links are cobalt, 600, underlined or with an arrow.

### Inputs / Fields
- 50px high, 1px field-edge border, 2px radius, white. Hover darkens border to ink; focus is a 2px cobalt outline. Invalid: signal border with a 1px ring. Required mark is signal red. Choice rows are stacked hairline boxes that wash cobalt when checked.

### Figure Plate and Sheet (signature)
- Plate: cobalt field with white ink, hero Figure 1. Sheet: white with hairline border, used for program figures. Both use the same SVG vocabulary: grid hairlines, axes, 2.6px fit line, translucent band, points, leader line with dot and halo-stroked annotation text.
- Figures are generated at runtime in `dist/app.js` from seeded synthetic data (a mulberry32-style PRNG with fixed seeds), drawn as SVG, with an accessible label and caption always stating "mô phỏng / minh họa, không phải kết quả nghiên cứu".
- Authored motion, once on entering view: points plot in (staggered 11ms), fit line draws (1.1s), band and zone fade (0.95s delay), leader annotations fade (1.5s delay). Under `prefers-reduced-motion` everything renders in its final state with no animation or transition.

### Tables
- Booktabs: 2px ink top rule, 1px ink under header, hairline rows, 2px ink bottom rule on the footnote row. Column heads are labels; row heads are serif. Featured price row is a cobalt band. Tabular numerals.

### Tabs
- Three Figure tabs under a 2px ink rule; active tab is cobalt with a 5px inset underline. Roving tabindex with arrow, Home and End keys; panel swap is a 0.38s fade-rise.

### Registration form
- Three steps (package and contact, personal details, background and consent), a cobalt stepper aside with numbered discs, step counter. Validation is local only; the form checks and reports fields and never claims a successful submission, routing the learner to a real phone link.

### Navigation
- White sticky header, serif wordmark, sans links with a growing 2px cobalt underline, cobalt CTA. Below 900px a 48px toggle opens a stacked list and a fixed bottom bar offers Call and register.

## Do's and Don'ts

### Do:
- **Do** write every date, fee, discount condition, contact, payment datum and faculty fact from the official notice (`assets\THÔNG BÁO_v.3_CHUỖI KHÓA NCKH (01.2027).docx`, the newest); the H1 follows its title "Phân tích định lượng với R – Từ cơ bản đến chuyên sâu".
- **Do** label every generated figure as simulated illustration.
- **Do** use rules and numbered captions to structure content.
- **Do** keep course codes as internal form values, never public copy; do not duplicate the notice's QR asset.
- **Do** keep red for the deadline and required marks, and cobalt as a field.

### Don't:
- **Don't** present simulated data as research results, or the form as having submitted anything.
- **Don't** add navy particle heroes, glass chrome, gradient text or fills, or an AI-chat/workbench mockup.
- **Don't** wrap content in bordered, shadowed cards when a rule or table will do.
- **Don't** set body text below 17px or rendered chart text below 11px.
- **Don't** introduce an invented notice number or unreconciled figures.

## Additions after first release

- **Backdrop:** one fixed full-viewport canvas (`#bg-canvas`) draws faint cobalt linked particles and translucent triangles behind transparent sections; opaque panels (plates, form, tables' featured row, closing band) cover it. Paused when the tab is hidden, a single static frame under reduced motion, 48% opacity below 720px, 80% above.
- **Logo:** official artwork from `assets/Logo VPN.png`, trimmed and resized to `dist/logo.png` (header, 56px tall; footer on a white chip) and `dist/favicon.png`. The full institute name sits beside it in the header and footer.
- **Top strip:** registration line (A - 2619/Bộ Khoa Học và Công Nghệ) left, deadline right; no action link in the strip, the navbar holds the only register button above the fold.
- **Side navigation:** fixed left rail of ticks from 1100px up (hidden below), active section tick lengthens in cobalt, label appears on hover/focus.
- **Loops:** the hero figure cycles Hình 1 to 3 every 5s endlessly with no controls (stops only while off-screen or the tab is hidden, static under reduced motion); the programs tabs advance every 5s too, pausing on hover or focus and via a visible "Tạm dừng" toggle. The programs panel min-height is locked to the tallest scenario to avoid layout shift, and the hero caption reserves three lines for the same reason.
- **Registration links:** no link to the official registration page anywhere on the page; registration is the on-page form, phone, or in person.

## Tuition section (package accordion and discount timeline)

- Packages are an accordion row modelled on Tencent Cloud's scenario panels: six cobalt panels side by side, one open at a time (default Gói 1). Open panel is white with a 4px cobalt top rule and carries the fee at display size, course list, that package's own discounts and a register link that preselects the package in the form. Closed panels show only label, combo and fee over a large faint numeral. Opens on hover (mouse, wide screens), click or keyboard focus; the row has a fixed height so opening never shifts the page. Under 1061px it becomes a vertical accordion with +/- markers. Fees are tabular lining numerals; "đồng" is the small unit.
- Discounts live inside each package panel (10% / 5% / 10% + 5% for Gói 1 to 4, 10% for Gói 5 and 6). Below the row, a cobalt band holds only the timeline (solid bar before 08/12/2026, dashed bar to the 28/12/2026 deadline; stacked list on mobile) and the notice's notes. No images, no chart data, nothing invented.
