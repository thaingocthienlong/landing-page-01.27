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

First viewport: serif H1, byline, ruled abstract list (term 112px, value), two actions on the left; a white figure sheet on the right that plays every course figure in turn. Sticky header 72px over a 42px ink promotion strip.

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
- Sheet: white with hairline border, used for the hero figure and the program figures (the cobalt hero plate was removed on request). Both use the same SVG vocabulary: grid hairlines, axes, 2.6px fit line, translucent band, points, leader line with dot and halo-stroked annotation text.
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
- **Don't** add navy particle heroes, glass chrome, gradient text or fills, or an AI-chat/workbench mockup. The working learner-care chat (below) is the one chat surface; it is a real assistant, not a mockup.
- **Don't** wrap content in bordered, shadowed cards when a rule or table will do.
- **Don't** set body text below 17px or rendered chart text below 11px.
- **Don't** introduce an invented notice number or unreconciled figures.

## Additions after first release

- **Backdrop:** one fixed full-viewport canvas (`#bg-canvas`) draws faint cobalt linked particles and translucent triangles behind transparent sections; opaque panels (plates, form, tables' featured row, closing band) cover it. Paused when the tab is hidden, a single static frame under reduced motion, 34% opacity below 720px, 55% above, one particle per 22,000 px² of viewport and at most 65 (lightened on 20/11/2026 at the owner's request: the earlier 80%/48%, one per 16,000 px² and at most 90 read as busy).
- **Logo:** official artwork from `assets/Logo VPN.png`, trimmed and resized to `dist/logo.png` (header, 56px tall; footer on a white chip) and `dist/favicon.png`. The full institute name sits beside it in the header and footer.
- **Chat button icon:** the robot head the user supplied on 14/11/2026, kept as `assets/chatbot-icon.png`, trimmed and resized to `dist/chatbot.png` (128px; shown at 28px in the desktop launcher, 40px in the round phone button).
- **Messenger and Zalo button:** a white round button above the chat launcher opens two links (Messenger to the Page, Zalo to 0912 114 511). The two marks are simple solid-colour drawings in the SVG sprite (`i-messenger`, `i-zalo`), not the brands' official files.
- **Top strip:** registration certificate line (A-2619, Bộ Khoa học và Công nghệ) left, deadline right; no action link in the strip, the navbar holds the only register button above the fold.
- **Side navigation:** fixed left menu from 1100px up (hidden below). From 1280px up every section name is always visible, the active one in cobalt with a 3px bar, and the page shell reserves a 142px rail so the menu never covers content. Between 1100px and 1279px it falls back to ticks with the label on hover/focus, because the narrower shell would wrap the header links.
- **Loops:** the hero figure cycles through all 14 course figures every 4s endlessly (starting on Hình 1.4, the linear regression) with no controls (stops only while off-screen or the tab is hidden, static under reduced motion); the programs tabs advance every 5s too, pausing on hover or focus and via a visible "Tạm dừng" toggle. The programs panel min-height is locked to the tallest scenario to avoid layout shift, and the hero caption reserves three lines for the same reason.
- **Registration links:** no link to the official registration page anywhere on the page; registration is the on-page form, phone, or in person.

## Tuition section (package accordion and discount timeline)

- Packages are an accordion row modelled on Tencent Cloud's scenario panels: six cobalt panels side by side, one open at a time (default Gói 1). Open panel is white with a 4px cobalt top rule and carries the fee at display size, course list, that package's own discounts and a register link that preselects the package in the form. Closed panels show only label, combo and fee over a large faint numeral. Opens on hover (mouse, wide screens), click or keyboard focus; the row has a fixed height so opening never shifts the page. Under 1061px it becomes a vertical accordion with +/- markers. Fees are tabular lining numerals; "đồng" is the small unit.
- Discounts live inside each package panel (10% / 5% / 10% + 5% for Gói 1 to 4, 10% for Gói 5 and 6). Below the row, a cobalt band holds only the timeline (solid bar before 08/12/2026, dashed bar to the 28/12/2026 deadline; stacked list on mobile) and the notice's notes. No images, no chart data, nothing invented.

## Course outline section (tabs and lesson accordion)

- Outline text comes verbatim from the approved outline documents in assets/ (khoá 1 v2, khoá 2 v2, khoá 3 v2); nothing is summarised or reworded. The collapsed lesson row previews the first two lines of the lesson's own first bullet.
- Three tabs reuse the programs-section tab style (name, lesson count, dates and duration). Each panel has a left column (course name, dates, requirements to attend, collapsible teaching method) and a right column: an optional cobalt-wash process strip (khoá 2 Bài 7, khoá 3 Bài 8, parsed from the arrows in the outline), an "open all" link, and the lesson accordion with a large serif number, the lesson label, and a cobalt plus/minus. First lesson open by default.
- Audience lists from the outline files are deliberately not shown (audience is broad; see the removed hero block). Notice number and the unfilled notice date in the outline headers are not shown either. The series name in the outline files ("Nghiên cứu định lượng với R") differs from the page's "Phân tích định lượng với R"; the page keeps its own until confirmed.

## Programs section figures (per-course sequence)

- Each course tab plays its own figure sequence, one figure every 4 s, then hands over to the next course tab; every figure finishes its motion in under about 2.7 s and then holds. No controls (the loop is endless, as requested); reduced motion shows the first figure static.
- Figures map to outline lessons and the caption names them ("Hình 2.3 · Bài 5."). Khóa 1: confidence intervals from 20 repeated samples (Bài 4), skewed histogram with mean and median (Bài 5), two-group boxplot with mean difference and 95% CI (Bài 6), linear regression (Bài 7), logistic regression with odds ratio (Bài 7). Khóa 2: decision tree with expected cost/QALY and ICER (Bài 3), three-state Markov cohort trace (Bài 4), one-way tornado on the same tree (Bài 5), cost-effectiveness plane (Bài 6), CEAC from the same PSA sample (Bài 6). Khóa 3: ACF of the raw series (Bài 2), additive decomposition (Bài 3), out-of-sample forecast (Bài 4), MAE/RMSE/MAPE comparison of seasonal naive, Holt-Winters and trend + season regression (Bài 6).
- All numbers are computed live from seeded synthetic data (shared generators keep related figures consistent: tree and tornado use one model, plane and CEAC one PSA sample, all Khóa 3 figures one series). Captions say the data is illustrative.
- Motion vocabulary: points pop (f-pt), lines draw (f-draw, per-element --d/--dur), bars grow from their baseline (f-bar, f-barx), stacked areas wipe left to right (f-wipe), labels fade in (f-in, --d). The hero sheet plays the same 14 figures in order; its caption height is locked to the tallest caption.

## Header brand

- Logo at 64px (54px on phones) with two pale bright-blue concentric rings behind it (vertical gradient, 4.5 to 8.5% alpha) that breathe out of step on a 3s loop (static under reduced motion). The institute name is set in uppercase serif, always one line from 1200px up (font scales with the space left beside the nav via a container query, 3.7cqi, capped at 1.3125rem: about 19px at 1440px, 14px at 1280px), balanced over two or three lines below 1200px; the course line under it was removed. Nav links never wrap.

## Review round 1 (client feedback)

- Programs section renamed "Giới thiệu chung" (heading, top nav, side menu, hero button).
- Schedule: heading above, calendar and Bảng 1 full width; day cells 84px with 1.625rem numerals, course labels centred under their days, Bảng 1 left aligned throughout; note reads "Ngày 11/01/2027 và ngày 14/01/2027 nghỉ."
- Tuition: returning-learner offer shown as one 15% figure in a highlighted row (falls back to a struck 15% over 10% after 08/12/2026); larger package text; panel row 730px; one notes block under the packages (tax line, then group offer, returning-learner definition, no stacking) replaces the price note and the timeline notes.
- Close section: new two-sentence CTA copy; contact names carry "(SĐT/Zalo)". Footer logo sits in a white circle with a pale ring. Faculty cards link to each lecturer's ScholarGPS profile.

## Review round 2

- Root font size 106.25% (17px): every rem-based size grows about 6%.
- Hero title: "Phân tích định lượng với R" uses a sparkling blue gradient (panning cobalt → #1673e3 → #5aa9ff, 3s loop) with three four-point stars popping at random spots every second (after Hyperplexed's magic text); that phrase is italic; ", từ cơ bản đến chuyên sâu" is upright ink on its own line. The title is 700 weight, clamp(2.5rem, 1.15rem + 4vw, 4.5rem), with non-breaking spaces inside "Phân tích", "định lượng", "với R", "từ cơ bản" and "đến chuyên sâu" so lines only break between those phrases. This is a deliberate, client-requested exception to the no-gradient-text rule. Reduced motion: static gradient, no stars. Byline bold.
- Outline section renamed "Chương trình chi tiết 3 khóa học" (side menu: "Chương trình"). Active course tab is filled cobalt with white text in both tab sets.
- Offers: pill tags ("Giảm 10%", "Giảm 5%") plus condition; the returning-learner offer is a filled cobalt block ("Ưu đãi học viên cũ" / "Giảm 10%, thêm 5% nếu…"). The tax line is now the first bullet of the notes list. Package row 750px.
- Close section heading and copy rewritten in a formal register.

## Learner-care chat

- Turned off on the page on 24/11/2026: visitors stayed anonymous, so staff could not follow up, a phone number typed into it was lost, and numbers left through its card only reached the Sheet, with no alert to the Zalo group. The corner button now opens the Fanpage on Messenger (`m.me`), and the round button above it opens the advisers' Zalo. The panel markup is gone from `dist/index.html`; `setupChat` in `dist/app.js`, its styles and the Apps Script side are kept, so restoring the `#chat-panel` markup brings it back. Before that: a working assistant for learner questions (packages, fees and discounts, schedule, registration, course content). Questions go to the same Apps Script web app as the form (`data-endpoint` on `#chat-panel`). It talks as an adviser: a turn is a few short messages, it asks one question back when the answer would change its advice, and it recommends one package. Every message is looked up in the staff-written `FAQ` tab; the AI tiers in order (Claude through the Institute's Anthropic API credit, then the free Google Gemini Flash-Lite and Cloudflare Workers AI, optionally the office PC) then speak from the matched row, the closest rows and the notice and outline text in `apps-script/Knowledge.gs`. An AI answer with an amount, date, hour or phone number that the Institute's text does not support is dropped; when no model gives a usable answer, a message that asks something and clearly matches a row gets that row word for word. Every exchange is logged to the `Hỏi đáp` sheet. Setup and limits: `apps-script/README.md`; staff guide to the FAQ tab: `docs/huong-dan-faq.md`.
- From 901px: a cobalt primary button "Hỏi đáp về khóa học" fixed 24px from the bottom-right corner opens a 420 x 680px panel in the same corner (the button hides while it is open). The page stays usable; Escape or the close button returns focus to the opener.
- At 900px and below: the mobile bar gains a third button, Đăng ký (widest, primary) | Hỏi đáp | Gọi, sized to their labels on one line; icons drop below 360px. The panel becomes a full-screen sheet that follows the on-screen keyboard (visualViewport; a conversation that was at its end stays at its end when the keyboard opens), the rest of the page is inert and does not scroll behind it, and focus goes to the panel title so the keyboard does not cover the suggestions.
- Panel: white, 1px ink border, 4px cobalt top rule, flat (no shadow). Head is the serif title over an uppercase label "Trợ lý AI của Viện Phương Nam" and a 2px ink rule. The welcome speaks as the Institute (thanks for the interest), like the Institute's Messenger auto-greeting, so the assistant's first answer can open "Dạ, em chào anh/chị." as staff do; it says the AI can be wrong and asks learners to confirm fees with the Institute before paying. It is kept to two short paragraphs so that the next plate, the adviser's first question ("Để gợi ý đúng gói, anh/chị đã dùng R bao giờ chưa?"), and at least the first of its three answers ("Chưa từng dùng R", "Đã dùng R cơ bản", "Dùng R thường xuyên") show on a 320 x 568 phone without scrolling. The answers sit under the question as quick replies (hairline rows, cobalt arrow); under them an uppercase label "Hoặc hỏi ngay" (2px ink rule) heads two ready questions. All five disappear after the first question; a text link "Bắt đầu cuộc trò chuyện mới" takes their place under the greeting. Learner turns are right-aligned on cobalt wash. Each assistant message sits on its own plate (#f3f6fb, 2px corners, at most 92% wide) on the left, 17px, set for phone reading: a blank line in the reply starts a new message (at most four a turn; the rest joins the fourth), lines opening "- " or "1." become a list inside one message (also when blank lines sit between the items), `**...**` is bold. Messages of one turn are 6px apart, turns 16px. They arrive one after another, the way a person sends a few short messages: each is written out in at most 1.2s (a turn of a single message in at most 3s), then three dots on a plate wait 0.6 to 1.5s (longer before a longer message) and the next one takes their place. Sending the next question shows the rest of the turn at once; under reduced motion the whole turn appears at once. A message is written out only as it arrives in an open panel: opening the panel shows everything already in it as plain text, also messages that came while it was closed, and the rest of the turn keeps arriving. The log follows a turn as it arrives until the turn's first line reaches the top, then stays, so a turn taller than the log opens at its first line rather than its last; once the visitor scrolls, the log is left alone for the rest of that turn. A model that ignores the formatting rules still never shows one long block: lines that are each a sentence become messages of their own, and a line longer than 170 characters with two or more sentences is split, the first sentence (the answer) alone, then two sentences per message. Lines under a label (bank details) stay one message, and a long line inside such a block or a list is set as paragraphs the same way. Abbreviations such as "GS.", "TS." and "Ms." do not end a sentence, also inside bold ("**GS.TS. Nguyễn Văn Tuấn**"), and a split never falls inside a bold span. Under the field: a three-way ruled row, Gọi Viện | Zalo Ms. Vy | Zalo Ms. Thảo. No privacy note under the field (removed at the owner's request). Learners' own phone numbers, emails and ID numbers are masked server-side before a question is sent.
- Replies are set as text, never HTML: paragraphs, "- " and numbered lists and **bold** only. The three contact numbers become `tel:` links, the phrase "Đăng ký khóa học" links to `#registration` (and closes the sheet on phones), and only URLs on vienphuongnam.com.vn, cran.r-project.org, posit.co and zalo.me are linked.
- Quick replies: when the assistant asks something with a few ready answers ("Chưa từng", "Đã dùng cơ bản"), up to three sit under the turn's last message as a ruled list in the style of the suggested questions; tapping one sends it, and the list goes when the next question is sent (it is not brought back after a reload; the question above it still is). A long label wraps. The same list carries the closest FAQ questions when no model can answer but some rows come close: the reply then says the assistant is not sure which question is meant. With no AI configured the chat still runs on the FAQ tab alone and, for questions it cannot match, gives the numbers.
- Failure is honest: with no endpoint, or a server without the chat code, the panel says the assistant is not running and shows the numbers; when no FAQ row comes close and every model is out for the day (daily quota, bad key, model gone) it says the assistant is paused, and when the shared hourly cap is reached it says the assistant is busy, both with the numbers and no retry; a visitor over their own hourly limit is told to try again next hour; other failures show the numbers and a "Thử lại" link that resends the same question and moves focus to the question field (the conversation on phones), since the link goes with the message. While a reply is pending the send button is marked busy (`aria-disabled`) rather than disabled, so focus is not lost.
- Leaving a phone number: when the assistant offers the quick reply "Để lại số điện thoại" (at the next step, when the learner hesitates, asks to be called or asks something it has no answer to), tapping it sends nothing; it opens a card in the conversation, drawn like the panel (white, 1px ink border, 2px corners, flat): serif title, one line saying an adviser calls back in working hours, "Họ và tên", "Số điện thoại", the privacy consent on a plate (it also says the adviser will read this conversation), a primary "Gửi" and a text link "Để sau". The card opens at its title with focus in the first field, also where it is taller than the log, and the field being typed in stays in view when the keyboard opens. Errors are one bold ink line above the buttons and an ink border on the field (no red); a failed send keeps what was typed. A sent card is replaced by the learner's line "Tôi đã để lại số điện thoại." and the assistant's confirmation, both kept in the conversation, so the assistant does not offer again. The card posts a consult lead (`form_type` `tu_van`, `apps-script/Leads.gs`) with the conversation's id and the learner's own messages, and reports `generate_lead` (form_id `chat-lead`) and the Meta `Lead` event. "Để sau" or a new question closes it. The name and number are never stored in the browser.
- The conversation lives in `localStorage` on the device (last 80 messages, plus a question still waiting for its answer) for 30 days after its last message, so a learner who returns another day picks it up; the server sees the last 60 (30 exchanges), so what a learner said about themselves early on still counts. "Bắt đầu cuộc trò chuyện mới" clears it from the device and starts a new session id; an answer still on its way to the old conversation is dropped. A learner who returns after an hour or more finds, under the conversation, a welcome ("Viện Phương Nam chào mừng anh/chị quay lại…"), a line with the days left to the 08/12/2026 discount date (from 08/12 the 28/12/2026 deadline; nothing once it has come), and three choices: "Cách đăng ký", "Để lại số điện thoại" (not for someone who already left a number) and "Bắt đầu cuộc trò chuyện mới". The welcome is drawn by the page and is not part of what the assistant is sent. Every form on the page carries the conversation's id (`chat_session`) once the learner has said something, so a lead or a registration can be traced to its conversation. Signal red is not used anywhere in the chat; the typing dots are static under reduced motion.

## Early discount in the hero and the form, study format (20/11/2026)

- Hero abstract list: a full-width row "Ưu đãi học phí" (bold "Giảm 10%", the notice's condition, a link to the tuition section) sits third, so a phone shows it on the first screen. Ink, not signal red: red stays the deadline's.
- Registration form, package choices: one hint under the legend gives the condition once and says the amounts after the discount are estimates the Institute confirms (the chat's wording); each package then carries one short line, "Sau giảm 10%:" and the amount in bold tabular numerals. The amounts are the listed fee less 10%, nothing else.
- These three places carry `data-expires="2026-12-08"` like the tuition offers, and the class `is-early`: once the date has passed they are removed from view instead of being struck through.
- Registration form, step 1: a required "Hình thức học" group under the packages (Trực tiếp tại Viện, Trực tuyến qua Zoom, Linh hoạt (kết hợp trực tiếp và trực tuyến), Chưa quyết định), plain radios in the two-column radio grid. The values sent are the ones the staff tab's dropdown uses ("Linh hoạt (ONL + OFF)" for the third, which staff added there); the registration tab stores "Trực tiếp" or "Online" and leaves the cell empty for the other two.

## Hero video (20/11/2026, owner's request)

- The hero's right column no longer plays the course figures; they remain in "Giới thiệu chung", and what the sections above say about the hero figure loop no longer applies. In their place is the Institute's film of the series (YouTube `mUkuurSclfo`).
- Frame: 16:9 with a 2px ink edge, on a cobalt plate set off 16px to the lower right (flat: no shadow; the hero's one cobalt field). No sheet, no caption under it (removed at the owner's request). From 901px it is top-aligned beside the title and sticky at 112px, so it stays in view down the hero; below that it follows the hero's buttons at full width. Under a pointer the frame shifts 4px off its plate, because the whole frame is one link.
- YouTube's own captions are kept off (the film has its subtitles burned in): YouTube turns them on by itself for a muted start, so they are switched off when the player reports its captions module.
- While the film plays without sound, a 36px ink square with a muted-speaker mark sits in the frame's lower right corner, the corner the film's own subtitles and header leave free. It goes once sound is on.
- In the page the film plays by itself with no controls, loops, and pauses while the frame is off screen or the tab is hidden. Under reduced motion it does not start by itself. The player (YouTube's, from youtube-nocookie.com, about 1 MB) is fetched only when the frame first comes near the screen; until then the frame shows the film's thumbnail.
- YouTube lays its own title, buttons and links over the film for about 4 s each time it starts or resumes, and for as long as it is stopped; no player setting removes them. The thumbnail therefore stays over the frame as a poster until the film has run for 4.5 s, returns whenever the film stops, and fades in 0.4 s. The cost is a still frame for those seconds at every start. If YouTube changes that timing, change the 4.5 s in `setupHeroVideo`; hosting the film file ourselves would remove the need.
- Sound: the owner asked for sound from the start. Browsers refuse sound before the visitor has clicked or typed on the page. In the page the film always starts muted, which no browser refuses, and asks for sound the moment it runs: a browser that refuses stops the film at once, and it then goes on muted with the speaker mark. The visitor's first click or key press anywhere on the page asks once more, and sound then stays on, also across a reload in Chrome. Opened over the whole screen, the film starts with sound.
- A click (or Enter on the link over the frame) opens the film over the whole screen with YouTube's controls, from where it was: real fullscreen where the browser allows it for elements, else the same frame fixed over the page (iPhone). A 48px close button sits in an ink bar above the player, so it never covers YouTube's own buttons; Escape, the button or leaving fullscreen brings the film back into the frame, again without controls. Until the player's script has loaded, the link opens the film on YouTube.
- On wide screens the chat panel opens by itself on a first visit and covers most of this frame until it is closed.
