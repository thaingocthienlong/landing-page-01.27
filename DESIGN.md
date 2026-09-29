# Research Instrument / Data Observatory

## Design read

Landing page tuyển sinh cho nhà nghiên cứu, nghiên cứu sinh, giảng viên và người làm dữ liệu; ngôn ngữ navy + trắng của một phòng phân tích, leaning toward a scientific instrument interface with restrained kinetic feedback.

## Dials

- `DESIGN_VARIANCE: 8`
- `MOTION_INTENSITY: 7`
- `VISUAL_DENSITY: 5`

## Visual contract

The page explains a real eight-day course sequence through a visible research pipeline: question, data, model, decision. The three stations are grounded in the source program notices: R fundamentals, cost-effectiveness analysis, and time-series forecasting.

### Color

- Navy 950 `#071A3A`: primary field, header mark, high-contrast action.
- Navy 800 `#0D2A5A`: explanatory dark band.
- Navy 600 `#174A8C`: signal, focus, active state, rules that need emphasis.
- White `#FFFFFF`: primary surface and type on navy.
- Cool mist `#F3F6FA`: utility surface only; no second brand accent.

There are no gradients, glass surfaces, glows, decorative data charts, or stock photos. Signal states use navy tonal changes and opacity rather than a new accent hue.

### Type

- Display and body: system sans stack, beginning with Segoe UI Variable and Segoe UI.
- Data: Cascadia Mono, SFMono-Regular, or Consolas.
- No editorial serif and no mixed-family emphasis.
- Mono is reserved for source codes, dates, labels, fee values, and technical readouts.

### Shape and layout

- One near-sharp radius language: square corners with no more than a small control radius.
- Asymmetric 12-column hero and course layouts.
- No three-card feature grid.
- Depth comes from solid navy planes, baseline rules, axis ticks, and whitespace.
- Course details remain semantic `details` elements; fee data remains a semantic table.

## Motion contract

Motion has a named purpose: explanation, state indication, spatial consistency, or tactile feedback.

- First viewport entrance: opacity plus `translateY(14px)`, `700ms`, `cubic-bezier(0.23, 1, 0.32, 1)`.
- Course state and hover: color, border, opacity, and small transforms under `240ms`.
- Button press: `scale(0.97)` between `100ms` and `160ms`.
- Scroll-linked pipeline: `IntersectionObserver` updates the active source-backed course readout. It does not hijack scroll.
- Pointer signal: a single readout marker on fine pointers only; no continuous loop.
- Reduced motion preserves readable state and color changes while removing position changes, pointer movement, and decorative entrance motion.
- Every hover motion is gated with `(hover: hover) and (pointer: fine)`.

## Content integrity

`assets/TB10.26_01.27_V1.docx` is authoritative for dates, fees, format, address, payment, and deadline. The three course notices are authoritative for their own objectives, audiences, and modules. The main notice contains an audience ordering error; the course-specific notices resolve it. Registration URL and QR are blank in the source and stay explicitly unresolved. No standalone price for Course 1 is inferred.

## Review gates

1. Validate source facts and fee arithmetic before publication.
2. Render desktop, tablet, and mobile views and inspect the first viewport plus full page.
3. Test keyboard, touch, focus, menu close, native disclosures, links, and reduced motion.
4. Run `node --check dist/app.js`, `git diff --check`, and Impeccable detect after the final visual pass.
5. Keep the previous private Site version and the local editorial snapshot available for rollback.
