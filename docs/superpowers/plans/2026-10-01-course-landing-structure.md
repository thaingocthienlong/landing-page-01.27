# Course Landing Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the first-screen information architecture so the existing course title is centered and prominent, the complete registration form appears immediately below it, and the remaining course content reads as a finished curriculum while preserving the current visual system.

**Architecture:** Keep the static HTML/CSS/JavaScript architecture and GitHub Pages deployment. Replace the hero two-column dashboard composition with a centered one-column hero, move the existing full form from its dialog into an inline registration section, keep the existing scenario workbench inside the curriculum section, and simplify form JavaScript to inline validation and fallback behavior.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, native form validation, IntersectionObserver, Canvas 2D, GitHub Pages.

**Spec:** This plan is the approved inline plan from the 2026-10-01 review turn.

## Global Constraints

- Preserve the existing light-blue, white, cool-gray, black, typography, content, and source-backed course data.
- Use the current course title and dates as source truth; do not copy the reference course title or dates.
- The full registration form remains static and must never claim backend submission.
- Do not add dependencies, CAPTCHA, unverified endpoints, invented metrics, testimonials, people, prices, or course facts.
- Keep `#course-cea` deep-link behavior and preserve `#consultation` compatibility through an alias anchor.
- Keep grid, linked particles, reduced-motion support, safe-area navigation, and GitHub Pages workflow.

## Review Focus

- Hero title hierarchy: the first content view must have one centered large `h1`, with no workbench beside it.
- Registration conversion: the complete form must be visible immediately after the hero without opening a dialog.
- Form behavior: required validation, phone grammar, `Khác`, certificate rows, focus, status, and value retention must continue to work inline.
- Anchor integrity: registration, curriculum, legacy consultation, schedule, tuition, faculty, contact, and CEA deep links must resolve.
- Responsive resilience: 1440px, 1280px, 768px, and 390px must have no horizontal overflow or fixed-rail obstruction.

## Tasks

### Task 1: Restructure HTML and information architecture

**Files:** `dist/index.html`

- Convert `#top` to a centered one-column hero containing the current course title, date/location/format metadata, and anchors to `#registration` and `#programs`.
- Remove the hero workbench while retaining the existing canvas, grid, particles, and wave layers.
- Add `#registration` immediately after hero and move the complete `#consultation-form` markup into it, with `#consultation` and `#lp-form` alias anchors.
- Remove the dialog wrapper and duplicate form trigger-only consultation section; retain a compact contact/CTA section later in the page.
- Keep `#programs` as the curriculum entry point, retain its scenario workbench, add ids for advantages, skills, and contact, and update header/TOC targets.
- Test with an HTML audit for one `h1`, unique ids, resolved hash targets, section order, and no dialog markup.

### Task 2: Implement centered hero, inline registration, and responsive curriculum styling

**Files:** `dist/styles.css`

- Center hero content and set the large responsive title scale, metadata, CTA alignment, and mobile stacking rules.
- Add the inline registration surface with a centered max-width card, two-column form above 900px, one-column form below it, visible focus states, and preserved certificate/radio feedback styling.
- Rebalance curriculum spacing so the retained workbench is an illustration inside `#programs`, not first-screen content.
- Remove dialog-only CSS and preserve reduced-motion, grid, particle, wave, fixed TOC, safe-area, footer padding, and mobile overflow rules.
- Test brace balance and static selector checks before browser QA.

### Task 3: Convert consultation JavaScript to inline form behavior

**Files:** `dist/app.js`

- Keep `#consultation-form` as the selector and preserve source-other synchronization, certificate add/remove, feedback clearing, phone grammar, native validity, invalid focus, and static phone fallback.
- Remove modal open/close, focus trap, inert siblings, fallback dialog, backdrop, and dialog event listeners.
- Change registration triggers to ordinary anchors and keep floating TOC IntersectionObserver behavior on `#registration`, `#programs`, and `#contact`.
- Focus valid-submit status with `preventScroll` and retain entered values.
- Test invalid required fields, invalid phone, `Khác`, certificate rows, valid fallback status, keyboard order, and `#course-cea` activation.

### Task 4: Update design contract and verification record

**Files:** `DESIGN.md`, `docs/superpowers/verification/landing-page-structure-2026-10-01.md`

- Record the new hero, registration, curriculum, contact, anchor, and reduced-motion contracts.
- Record static checks, browser viewport checks, form interaction checks, and deployment evidence after implementation.

### Task 5: Full verification, commit, push, and deploy

- Run `node --check dist/app.js`, `git diff --check`, HTML/id/hash/selector audits, and any available project test command.
- Use browser QA at 1440px, 1280px, 768px, and 390px for hero/form order, overflow, focus, anchors, and fixed rails.
- Commit only product files, plan/verification records, and docs; leave pre-existing `.codebase-memory` changes untouched.
- Push `origin/main`, wait for `.github/workflows/deploy-pages.yml`, verify HTTP 200 for HTML/JS/CSS, and inspect the public first screen and inline form.
