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
