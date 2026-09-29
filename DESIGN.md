---
name: "Viện Phương Nam / Hồ sơ khóa học R"
description: "A research bulletin for an eight-day R data-analysis course sequence."
colors:
  cool-paper: "#eef1ed"
  cool-paper-deep: "#dfe6e1"
  ink: "#18211f"
  muted-ink: "#59635e"
  rule: "#c6beb2"
  night: "#202d2b"
  night-rule: "#51615d"
  vermilion: "#a94033"
  vermilion-deep: "#7d2e27"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(3.3rem, 7vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  body:
    fontFamily: "IBM Plex Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  data:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  none: "0"
  hairline: "2px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.cool-paper}"
    rounded: "{rounded.hairline}"
    padding: "11px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "11px 16px"
  ruled-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "26px 0"
  disclosure:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "17px 0"
---

## Overview

**Creative North Star: "The Research Bulletin."**

This landing page treats the course announcement as a useful printed prospectus. The visitor should feel they have opened an issue with a date, a sequence, an index, a calendar, a fee ledger, and a reliable way to ask for a place. The page earns attention through editorial rhythm and source-backed specificity rather than a decorative dashboard or a collection of promotional cards.

**Key Characteristics:**
- Cool paper, dark ink, and one oxidized vermilion accent.
- Source Serif 4 for the title and course voice, IBM Plex Sans for readable body copy, and IBM Plex Mono for codes, dates, and fee columns.
- Hairline rules, ruled rows, and asymmetric columns replace rounded card grids.
- A single masthead entrance motion; content is visible by default and reduced motion is respected.
- The registration state is honest: contact links work, while the missing official QR and form link are named plainly.

## Colors

**The Cool Paper Rule.** Keep the background cool and quiet, like an archival sheet under daylight. Use the deeper paper only to separate bands; never add a gradient.

**The Single Accent Rule.** Vermilion is reserved for the active registration action, source identifiers, dates, and small status marks. Do not introduce a second accent color.

## Typography

**The Editorial Scale Rule.** Source Serif 4 carries the title, section heads, course names, and people names. IBM Plex Sans carries paragraphs. IBM Plex Mono is reserved for codes, dates, labels, and money. Keep body measure near 65 to 75 characters.

## Layout

**The Index Before the Pitch Rule.** The first viewport must answer what the course is, when it happens, and how to continue reading. Use a masthead and factual dossier before longer explanation.

**The Ruled Sequence Rule.** Repeatable course information belongs in aligned rows and a calendar sheet, not same-size feature cards. At small widths, rows become a single readable column in the same order.

## Elevation & Depth

There are no decorative shadows, blur layers, gradients, or glass surfaces. Depth comes from paper bands, ink contrast, and 1px rules. The only authored motion is the masthead entrance.

## Shapes

Corners stay square or nearly square at 0 to 2px. Pills are not part of this visual language. Focus rings use the vermilion accent with a visible offset.

## Components

**Primary action.** A rectangular vermilion button names a real next step: read the index or call the institute.

**Course index row.** A number, course code, date range, title, outcome, and explicit anchor are aligned across a ruled row.

**Calendar row.** A large day number and a schedule block make the January sequence scannable without simulating a chart.

**Disclosure list.** Native details elements keep the full syllabus available without hiding the course facts.

**Fee ledger.** The semantic table retains its caption and headers. At narrow widths each value receives a visible data label so the ledger remains readable without horizontal scrolling.

## Do's and Don'ts

- Do use real notice numbers, course codes, dates, fees, contact numbers, and the source's missing-link state.
- Do keep the CEA audience paired with the CEA course and the time-series audience paired with the time-series course.
- Do keep the mobile order identical to the reading order.
- Do use visible focus states and close the mobile menu on Escape, outside click, or link activation.
- Don't add decorative charts, fabricated metrics, stock imagery, generic icon tiles, gradients, glass, pills, or equal feature cards.
- Don't imply that a registration form or QR code exists before the organizer supplies it.
- Don't place unsupported outcomes, prices, testimonials, or credentials in the page.
