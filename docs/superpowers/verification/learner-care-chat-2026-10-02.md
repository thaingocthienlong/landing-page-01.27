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
- `Chat.gs`: provider groups `CHAT_`, `CHAT2_`, `CHAT3_` tried in order inside the 45 s budget. A host that is off (502, 530, fast connection failure) is skipped for 3 minutes; a call that runs out its timeout is logged `error-timeout` and not skipped, so an office PC still loading its model is not taken out of the chain.
- Masking fix found while building the Facebook tool: a grouped ID number followed by a comma or full stop ("079 123 456 789, …") was not masked. Fixed in `Chat.gs`; four cases added.
- `tools/facebook-to-text.py`: offline cleaner for a Facebook "Download your information" export (fixes the Latin-1 garbling of Vietnamese, labels turns, masks with the same rules as `Chat.gs`, replaces listed learner names, writes 25 conversations per file).
- Office PC setup in `apps-script/README.md` from a research agent's findings checked by an independent verifier against llama.cpp b11368 source, llama-swap v261 source and Cloudflare's docs; 13 corrections applied (kill order of the off switch, driver 551.61, NSSM 2.24-101, `-fa` left on auto, `curl.exe` in PowerShell, path rule on the tunnel, Funnel not recommended). Speeds and memory figures are estimates, labelled as such.

FAQ thresholds were tuned on half of 110 learner-style questions written separately from the rows and measured once on the other half: 22 of 44 course questions answered from the table, 0 with a wrong row, the other 22 passed to the AI with the right row among the references; 11 of 11 off-topic, medical and multi-step questions kept away from the table. Six held-out questions had been read during development. All 589 seed phrasings map back to their own row or are deferred (13); none lands on another row.

```text
node --check (app.js, every .gs), py_compile (tools)    PASS
Apps Script harness, 37 cases                           PASS (adds FAQ answers, suggestions, no-ai, provider chain, down flag, timeout)
Masking format cases, 43                                PASS (Python cleaner matches Chat.gs on 48 inputs)
Facebook cleaner on a synthetic export (zip and folder) PASS
Browser QA, 19 checks                                   PASS (adds FAQ suggestion chips)
```

Not verified here: a live call to any provider (no keys in this environment), the office PC steps on real hardware, and whether a Page's "Download your information" export includes the Page inbox (the staff guide says to test one month first).
