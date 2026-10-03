# Learner-care chat verification - 2026-10-02

Antislop mode: apply while building (explicit session instruction). The antislop skill files live on the Windows workstation, so the rules applied were `DESIGN.md` and those cited in `anti-slop/audit-001` and `audit-002`.

## Scope

- New AI assistant for learner questions: corner launcher and panel from 901px, third mobile-bar button and full-screen sheet below.
- `apps-script/Chat.gs` first called Claude; on 2026-10-03 it was switched to a low-cost provider (see "Model switch" below). The prompt, `apps-script/Knowledge.gs`, is built from the v4 notice and the three v2 outlines. Logs to the `Hỏi đáp` sheet.
- `apps-script/Code.gs` routes `action: "chat"` before the registration lock; registration behaviour is unchanged.
- Handoff is Call and Zalo links only; no callback data is collected.

## Evidence

```text
node --check (app.js, Code.gs, Chat.gs, Knowledge.gs)   PASS
git diff --check                                        PASS
HTML id audit                                           PASS (no duplicates, aria-controls targets exist, one h1)
CSS brace balance                                       PASS
Apps Script harness, 15 cases (Node vm, stubbed services) PASS
  not-configured without key; malformed body; bad session/roles/length; request shape
  (model, effort, fallbacks header, 1h cache on the prompt, date block after the breakpoint);
  history trimmed to 12 turns; refusal reply; text after a fallback block only; one retry on
  429/5xx, none on 400; network/parse/empty errors; per-session and hourly limits; sheet failure
  keeps the answer; formula-looking input stored as text; registration path still works
Browser QA, Playwright Chromium, endpoint mocked, 15 checks PASS
  1440 and 1280: launcher in corner, open/close, focus to field, Escape returns focus,
  suggestion request payload, reply rendered as text (lists, bold, tel links, #registration link,
  allowlisted URLs only, injected <img> shown as text), Enter/Shift+Enter, error + retry,
  new question after an error, history restored after reload, "not running" message when the
  deployed backend has no Chat.gs yet (old backend answers missing-package_id)
  390, 360, 320: three bar buttons on one line and >= 44px, no horizontal overflow, full-screen
  sheet, page inert and not scrolling, greeting visible on open, jump link closes the sheet
  reduced motion: typing dots static
Visual review of screenshots at 1440, 1024, 390                PASS after three fixes:
  global `section` padding leaked into the panel (now a div); bottom-bar label wrapped
  (columns now sized to labels); launcher covered the last footer line (74px lane added)
```

## Not verified here

- No live model call: this environment has no API key, and the provider documentation sites are blocked by its network policy. Run `chatSelfTest` in the Apps Script editor after setting `CHAT_API_KEY` (see `apps-script/README.md`), then ask a few real questions on the page and read the `Hỏi đáp` sheet.
- Real Source Sans 3 / Source Serif 4 rendering: the browser QA blocked external requests, so it ran on wider fallback fonts. Layout was made to fit those, so the real fonts have more room.
- iOS Safari on-screen keyboard behaviour of the full-screen sheet (handled with `visualViewport`).

## Model switch, 2026-10-03

The owner cannot afford the Claude API. `Chat.gs` now calls Google Gemini on the free tier by default (`gemini-3.5-flash-lite`, then `gemini-3.1-flash-lite`, each with its own free quota, `generateContent` with `thinkingLevel: MINIMAL`), or any OpenAI-compatible host (DeepSeek, Cloudflare Workers AI) through script properties. Model IDs, request and response shapes, error codes, quotas and terms were researched by four agents and re-checked by four independent verifiers (sources: Gemini docs via Context7, live discovery doc, search; ai.google.dev itself is blocked here).

Changes driven by that research: the 2.5 models are avoided (new projects get 404 since 2026-09-18); the next model is tried on 429, 404 and 5xx, and a key or billing failure (401, 402, 403) stops at once; learners' own phone numbers, emails and ID numbers are masked before sending because free-tier prompts may be used by Google; the prompt declines medical advice (Gemini terms) and gained three short examples for the smaller model; the panel note now says questions go to an outside AI service and asks learners not to type personal information.

```text
node --check (app.js, Code.gs, Chat.gs, Knowledge.gs)   PASS
Apps Script harness, 20 cases                           PASS
  not-configured variants; Gemini URL/header/body/thinking per model family; thought parts
  skipped; MAX_TOKENS kept; blocked prompt/answer -> handoff; 429/404/503/empty fall back to
  the second model; 401/402/403 stop; single-model retry; masking (kept in the sheet, institute
  numbers and prices/dates/account number untouched); CHAT_EXTRA_BODY; OpenAI-compatible body,
  extras, <think> stripping, content_filter, 402; rate limits; chatSelfTest; registration path
Browser QA (same 15 checks as above)                    PASS
```

## Review of the switch, 2026-10-03

Five reviewers (API correctness against the researched facts, Apps Script runtime and security, prompt quality for a small model, docs accuracy, frontend contract and copy) raised 37 findings; each went to two verifiers told to refute it. 13 were upheld by both, 14 split, 10 refuted. Fixed:

- Time budget: each model call gets `timeoutSeconds` from a shared 45 s budget, so a hung first model no longer keeps the fallback from answering before the page gives up at 60 s, and the sheet always gets a row.
- Masking now covers (+84), 84…, +84 (0), bracketed area codes, numbers glued to text, grouped and unbroken 9/12-digit IDs, and leaves decimal lists, prices, dates, the account number and the institute's numbers alone (39 format cases).
- Failures that a retry cannot fix (bad Gemini key 400, 401/402/403, every model on a daily 429 or 404) return `unavailable`; the shared hourly cap returns `overloaded`; both show the numbers without "Thử lại". Daily 429s are not retried on the same model. Non-filter finish reasons (OTHER, MALFORMED_RESPONSE) try the next model.
- `CHAT_MAX_PER_HOUR=0` pauses the chat; the per-session counter resets each clock hour, as documented.
- `<think>` handling covers blocks cut off by the length limit and prefilled templates.
- Prompt: the offer and deadline status is computed in Apps Script and sent under a "Ngày hôm nay" heading (the boundary days are referred to the Institute); eligibility follows the payment date; returning-learner discount is spelled out by date and limited to Gói 1–4; every estimate is labelled by who gets it, with no combined early+group figure; the group example shows both offers and the stacking caveat; a fact line answers the online/offline suggested question from what the notice and outlines say.
- Privacy note says the provider may use questions to improve its services and asks learners not to type names, phone numbers or patient information; on phones it hides while the field has focus.
- README: key must sit in a project with no billing; CHAT_MODELS required for openai; reset time by US DST; how to test a fallback model; full status table.

Not changed: on 08/12 and 28/12 the page's offer strike-through (`setupExpiry`, `today <= data-expires`) still treats the day as included, while the notice says "trước"; the bot refers learners to the Institute on those days. Needs the Institute's answer.

```text
Apps Script harness, 26 cases          PASS
Masking format cases, 39               PASS
Browser QA, 18 checks                  PASS (adds unavailable/overloaded/rate-limited copy, note hiding while typing)
```

## FAQ first, a provider chain, and the office PC, 2026-10-03

The owner chose a FAQ bot fed by staff (documents plus past Facebook consultations), Cloudflare as a second free tier, and the office PC (RTX 2060 12 GB, on in office hours only, shared with other work) as an option. Changes:

- `Faq.gs`: BM25 over every phrasing of every active `FAQ` row, accent-folded and accented terms, shorthand, bigrams, date windows. A clear match is answered word for word without any AI call; close rows go to the model as reference or to the learner as tap-to-ask suggestions.
- `FaqSeed.gs`: 49 starter rows drafted from the notice and outlines, then fact-checked against them by a separate agent (13 answers corrected). Weekdays checked against the calendar.
- `Chat.gs`: provider groups `CHAT_`, `CHAT2_`, `CHAT3_` tried in order inside the 45 s budget. A host that is off (502, 530, fast connection failure) is skipped for 3 minutes; a call that runs out its timeout is logged `error-timeout` and the host is skipped for 1 minute (a loading model keeps loading; a hung host cannot slow every visitor).
- Masking fix found while building the Facebook tool: a grouped ID number followed by a comma or full stop ("079 123 456 789, …") was not masked. Fixed in `Chat.gs`; four cases added.
- `tools/facebook-to-text.py`: offline cleaner for a Facebook "Download your information" export (fixes the Latin-1 garbling of Vietnamese, labels turns, masks with the same rules as `Chat.gs`, replaces listed learner names, writes 25 conversations per file).
- Office PC setup in `apps-script/README.md` from a research agent's findings checked by an independent verifier against llama.cpp b11368 source, llama-swap v261 source and Cloudflare's docs; 13 corrections applied (kill order of the off switch, driver 551.61, NSSM 2.24-101, `-fa` left on auto, `curl.exe` in PowerShell, path rule on the tunnel, Funnel not recommended). Speeds and memory figures are estimates, labelled as such.

FAQ results: see the review section below; the first figures recorded here (22 of 44 answered, 0 wrong) did not include questions next to a row's topic, which the review showed the first matcher answered wrongly.

```text
node --check (app.js, every .gs), py_compile (tools)    PASS
Apps Script harness, 37 cases                           PASS (adds FAQ answers, suggestions, no-ai, provider chain, down flag, timeout)
Masking format cases, 43                                PASS (Python cleaner matches Chat.gs on 48 inputs)
Facebook cleaner on a synthetic export (zip and folder) PASS
Browser QA, 19 checks                                   PASS (adds FAQ suggestion chips)
```

Not verified here: a live call to any provider (no keys in this environment), the office PC steps on real hardware, and whether a Page's "Download your information" export includes the Page inbox (the staff guide says to test one month first).

## Review of the FAQ round, 2026-10-03

Four reviewers (Apps Script runtime, the Facebook tool, the office-PC docs against the verified research, FAQ content and copy), each followed by a verifier told to refute every finding: 19 findings upheld, 9 refuted. Fixed:

- FAQ matching answered questions next to a row's topic with that row: "khóa học có dùng Python/Stata/Excel không" got "Dạ, có" from the AI-use row, "gói 2 học mấy ngày" got the Khóa 2 row, "học phí có bao gồm ăn trưa không" got the tax row, and on 08/12 or after it, early-payment questions got the stacking row. Now: coverage weighs words by rarity (unknown words in full), the row must contain the question's rarest word of three letters or more, "gói N"/"khóa N" are one term, a row outside its dates that matches better than every active row sends the question to the AI, plus a package-composition row, reworded AI-use and tax rows, expired-offer rows with the early-payment phrasings and an end date of 27/12/2026.
- Measured on the held-out halves of the learner set and of 274 reviewer probes labelled by two agents and an adjudicator (192 questions): 34 right table answers and 8 wrong, against 43 right and 34 wrong for the first matcher. Fewer questions are answered from the table; more go to the AI with references. The rules were revised several times after looking at held-out results (see the verification rounds below).
- A timed-out host now sits out 1 minute and is not retried within the same question (the first fix never skipped a hung host, so every visitor waited 25 s on it).
- The institute's numbers written after a country code ("+84 (0) 949 761 636,") were masked as ID numbers; fixed in `Chat.gs` and the Python tool.
- Facebook tool: refused to guess the Page on a tie (it swapped roles and left the learner's name in clear text in half the runs on a one-conversation export), checks `--page` against the export, normalises Unicode, 15 conversations per file.
- Docs: Cloudflare's daily quota is `error-429-daily`, not `error-429`; the PC is no longer described as keeping questions in-house (Cloudflare tunnel, Google, Gemini fallback); curl tests in cmd only; stop the console llama-swap before the boot task; `healthCheckTimeout` 300; no warm-up advice that a 15-minute TTL undoes; LM Studio context length 16384.

```text
Apps Script harness, 37 cases                PASS (timeout skip, multi-model group, TTL values)
Masking format cases, 48                     PASS (Python cleaner matches Chat.gs on 55 inputs)
FAQ seed self-check, 608 phrasings           595 own row, 13 deferred, 0 other row
Facebook cleaner: tie, wrong --page, NFD     PASS
```

## Verification of the review fixes, 2026-10-03

Three verifiers checked each upheld finding against the fixes and looked for new defects. All 19 findings were fixed or mostly fixed. New defects found and fixed:

- A single OpenAI-compatible model flagged as down made the next visitor's request throw (no reply, no log row). The path existed before for an unreachable host; the 1-minute timeout flag made it common. Guarded, with a test.
- The 1-minute flag was also written when earlier attempts had squeezed a call to a few seconds, sidelining a healthy host. Now only for calls given 15 s or more.
- A package number ("gói 3") became the rarest word and blocked the fee, discount and choice rows; package and course numbers no longer count, and "cho"/"toi" neither.
- A row could answer after sharing a single word with the question ("cười" and "cuối" fold alike); a table answer now also needs a third of the question's words.
- "cảm ơn", "chút", "xíu", "page", "shop", "alo" and similar became the rarest word; they are ignored now.
- `=FAQ_KHOP` gives the reason a question goes to the AI, and the staff guide says to fix the replacement row when an expired row is the reason, not the row shown.
- The tax row says the notice does not mention meals, travel or lodging; the Facebook tool's messages are in Vietnamese and the guide explains the stop when it cannot tell the Page.

- From 28/12/2026 the AI's date note no longer lists the old-learner and group discounts next to "the deadline has passed".

```text
Apps Script harness, 39 cases     PASS
Held-out halves (192 questions)   35 right, 0 wrong row, 8 answered that should go to the AI
```

A last check of that commit found six smaller regressions, all fixed: with seven or more models queued the 15 s rule never flagged a hung first host (now compared with what that place in the queue gets); the group-discount, stacking and group-registration rows still answered after the deadline (they end on 27/12/2026); "muốn" as a stop word sent "em muốn được tư vấn" to the medical refusal (removed, with "nhờ"); without numbers in the rarest-word rule the Khóa 1 schedule answered "ngày đầu tiên của khóa 2" (a row naming another package or course now cannot answer); "toi" no longer skipped (it can be tới or tối); a thank-you without a question word is not matched.

```text
Apps Script harness, 40 cases     PASS
Held-out halves (192 questions)   34 right, 0 wrong row, 8 answered that should go to the AI
```

## Real Messenger consultations, 2026-10-03

Input: the Institute's Page inbox export for 01/07–15/08/2026 (90 conversations about the previous regression course), anonymised in the scratchpad before analysis; the raw file is not in the repository. Findings are in `docs/phan-tich-tu-van-meta-2026.md`.

- The Institute confirmed eight practices that the notice does not state. These are now in `Knowledge.gs` under "Viện xác nhận thêm" and in the FAQ answers:
  - class hours, mornings theory and afternoons practice;
  - online learners join live with the hall and ask by mic or chat;
  - PDF slides beforehand, printed materials and a signed book, with postage to online learners;
  - a completion certificate;
  - the two lecturers' roles;
  - Zalo contact after registration and a receipt photo after payment;
  - a fixed schedule with no evening class and no next intake planned;
  - time-limited replay for registered learners.
- FAQ changes:
  - five new rows;
  - the ad's preset questions and real phrasings added as variants;
  - answers rewritten in the staff's voice: "Dạ, ...", answer first, "ạ", open invitations instead of yes/no offers;
  - the first table answer of a conversation opens "Dạ, em chào anh/chị.", and the welcome bubble now speaks as the Institute.
- A fact-check agent removed two claims carried over from the old course that the Institute had not confirmed: online learners "see and hear everything", and contact "in order of registration". It also aligned the invoice and refund rows with the new receipt and online-switch facts, and corrected two lesson titles and the objective lists against the outlines. A style agent's fixes were applied to 40 rows.
- Measured before the held-out phrasings were added: 2 of 24 real typed questions answered from the table, 0 wrong, 17 of 21 passed to the AI with the right row attached; 11 of 11 closing messages left alone. Learner and probe held-out halves (labels redone for the 55-row table): 38 right table answers, 1 with a wrong row and 10 that should have gone to the AI.

```text
Apps Script harness, 40 cases                PASS (adds first-turn greeting, staff-row greeting variants)
FAQ seed self-check, 725 phrasings           711 own row, 14 deferred, 0 other row
```

## Answers formatted for phone reading, 2026-10-03

After the first live use, the owner reported that answers showed as one long, unformatted paragraph. Three fixes:

- `Knowledge.gs`: the formatting rule now says the first sentence answers, alone; the rest goes in short paragraphs of at most 2 sentences separated by a blank line; 2+ points become a "- " list; key figures are bold. The examples follow the same layout.
- `dist/app.js`: a line over 170 characters with 2+ sentences is split into the first sentence, then 2-sentence paragraphs. "GS.", "TS.", "PGS.", "ThS.", "Ms.", "Mr.", "TP." are not sentence ends.
- `FaqSeed.gs`: the 55 answers rewritten with lists and short paragraphs (fees per package, discounts, hours, payment steps, objectives, curriculum). Figures and facts unchanged. Staff must recreate the FAQ tab (`setupFaq`) for the new seed to take effect.

```text
Apps Script harness, 40 cases                PASS
Mask cases, 48                               PASS
FAQ seed self-check, 725 phrasings           711 own row, 14 deferred, 0 other row
Real held-out, 23 answerable                 21 right, 0 wrong, 2 to AI (refs right)
Closing messages, 11                         11 left alone
UI checks, 20 (Playwright, 390/360/320px)    PASS (adds the long-paragraph split, abbreviations kept)
```

## Second Meta export, 2026-10-03

Input: the full inbox export for 01/07–15/08/2026 (455 conversations, 365 of them new), anonymised in the scratchpad with the same cleaner as `tools/facebook-to-text.py`; the raw file is not in the repository. Findings and the list of practices to confirm with the Institute are in `docs/phan-tich-tu-van-meta-2026.md`.

- Extraction: one agent per 40K-character chunk listed every learner message, staff practice and unanswered question; a second agent per chunk audited the list (2 missed items added, 2 staff lines removed). Every extracted message was found verbatim in its conversation.
- Labels: two agents per batch labelled 218 unique messages against the 55-row table, an adjudicator settled 7 disagreements; after the update, two new agents relabelled the held-out half and the closings against the 58-row table (6 settled).
- Engine: an exact repeat of one active row's phrasing answers that row ("Hỏi giá", 11 conversations, went to the AI); acknowledgements ("ok", "okie", "ừ") are stop words; "nữa" never counts as the rarest word.
- Review: a fact-check agent and a style agent read every new or changed answer and the new prompt rules. Their findings were applied, including a renderer bug from the previous round: `dist/app.js` split "**GS.TS. Nguyễn Văn Tuấn**" because the abbreviation check only allowed a space before the title. A probe agent wrote 45 questions around the three new rows: 4 answered right, 0 with a wrong row, 33 passed to the AI, 7 of 8 that should go to the AI did.

```text
Apps Script harness, 41 cases                       PASS (adds exact phrasing, acknowledgements)
Mask cases, 48                                      PASS
UI checks, 21 (Playwright)                          PASS (adds bold titles; the new check fails on the old renderer)
FAQ seed self-check, 889 phrasings                  889 own row
Second export, held-out, before (55 rows)           23 of 70 right, 0 wrong, 28 of 47 to AI with the right reference
Second export, held-out, after dev rows (58 rows)   25 of 72 right, 1 wrong, 31 of 46 to AI with the right reference
Second export, closings                             45 of 46 left to the AI ("học phí đắt quá" gets the discount row)
First export, held-out                              22 of 23 right (was 21), 0 wrong; closings 11 of 11
Learner and probe held-out halves (58 rows)         40 right, 2 wrong rows, 10 wrongly answered (55 rows: 38, 1, 10)
```

