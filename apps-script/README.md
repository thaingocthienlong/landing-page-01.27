# Apps Script backend

One Apps Script project, bound to the registration Google Sheet, serves two things from the same web app URL (the `/exec` URL in `dist/index.html`):

| File | What it does |
|---|---|
| `Code.gs` | Registration form: appends to the `Đăng ký` sheet and emails the team. Also routes requests. |
| `Chat.gs` | Learner-care chat: answers from the FAQ tab when it can, otherwise asks a chain of low-cost AI models, and logs every exchange to the `Hỏi đáp` sheet. |
| `Faq.gs` | The FAQ lookup: reads the staff-edited `FAQ` tab and finds the row a question matches. |
| `FaqSeed.gs` | Starter FAQ rows, copied into the tab once by `setupFaq`. |
| `Knowledge.gs` | The AI's instructions and everything it knows about the course series (from the v4 notice and the three outlines), plus the daily date note. |

`doPost` in `Code.gs` sends any request with `"action": "chat"` to `Chat.gs` before taking the registration lock, so a slow model reply never holds up a registration.

## How a question is answered

1. **FAQ tab.** A question that clearly matches a row (see "FAQ matching") gets that row's answer word for word, in about a second, and never leaves Apps Script. Staff maintain the tab; their guide is `docs/huong-dan-faq.md` (Vietnamese).
2. **AI chain.** Other questions go to the configured providers in order: `CHAT_` (Gemini free tier by default), then `CHAT2_` (Cloudflare Workers AI), then `CHAT3_` (the office PC, optional). The three closest FAQ rows travel with the question as reference, so the model reuses the staff's wording.
3. **Fallback.** If no model answers, the learner is offered the closest FAQ questions to tap, or, with none close, a plain "no answer yet" with the phone and Zalo numbers.

With no AI configured at all, steps 1 and 3 still work: the chat runs as a FAQ bot.

## Setting it up

1. Open the Sheet > Extensions > Apps Script. Create script files named `Chat`, `Faq`, `FaqSeed` and `Knowledge` and paste the matching `.gs` files. Replace `Code` with `Code.gs`.
2. Choose `setupFaq` in the function list and Run. It creates the `FAQ` tab with the starter rows (it never overwrites a tab that has rows).
3. Get a free Gemini key: sign in to aistudio.google.com with the institute's Google account and accept the terms. AI Studio creates a Cloud project and an API key for new users; otherwise use API keys > Create API key. No credit card is needed. Make sure the key sits in a project **with no billing account**: a key inherits its project's billing, and a billed project is charged for every question. If the account already has Google Cloud projects with billing (for Maps, for example), choose to create a new project in the dialog, then check that AI Studio shows the project on the Free tier. On the API keys page, choose Add restrictions > Restrict to Gemini API only. (On a Google Workspace account, an admin can switch AI Studio off; ask them if it is blocked.)
4. Project Settings (gear icon) > Script properties: set `CHAT_API_KEY` to that key. Add Cloudflare (`CHAT2_...`, below) the same way. Delete `ANTHROPIC_API_KEY` if an earlier version left it there.
5. Run `chatSelfTest`. Accept the new permission ("Connect to an external service"): the web app runs as you, so it can only reach the AI services after you grant this. The log shows the FAQ row count and a line per provider, which should start with `ok` and quote 8.800.000 đồng. `error-400` from Gemini usually means the key was pasted wrong.
6. Deploy > Manage deployments > pencil icon on the existing web app > Version: **New version** > Deploy. This keeps the `/exec` URL, so `dist/index.html` needs no change. (Deploy > New deployment would create a different URL.)

## Script properties

Each provider reads a group of properties with its own prefix. A provider without a key, without models, or with a malformed JSON value is skipped.

| Property (prefix `CHAT_`, `CHAT2_` or `CHAT3_`) | Meaning |
|---|---|
| `…PROVIDER` | `gemini` or `openai` (any OpenAI-compatible host). Default: `gemini` for `CHAT_`, `openai` for the others. |
| `…API_KEY` | That provider's key. Required. |
| `…MODELS` | Models tried in order, comma-separated. Required except for Gemini under `CHAT_`, which defaults to `gemini-3.5-flash-lite,gemini-3.1-flash-lite`. |
| `…BASE_URL` | OpenAI-compatible hosts only, up to `/v1`. |
| `…EXTRA_BODY` | JSON merged into the top level of every request (host switches such as turning reasoning off). For Gemini, a `generationConfig` here replaces the default one entirely. |
| `…HEADERS` | JSON of extra HTTP headers (for example a tunnel's access token). |
| `CHAT_MAX_PER_HOUR` | AI calls allowed per clock hour across all visitors, default `100`. `0` pauses the AI; the FAQ keeps answering. |

Recommended setup:

| Group | Provider | Values |
|---|---|---|
| `CHAT_` | Gemini free tier | `CHAT_API_KEY` = AI Studio key. Optional `CHAT_MODELS` = `gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemma-4-26b-a4b-it`. |
| `CHAT2_` | Cloudflare Workers AI | `CHAT2_BASE_URL` = `https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1`, `CHAT2_MODELS` = `@cf/google/gemma-4-26b-a4b-it`, `CHAT2_API_KEY` = an API token with Workers AI Read and Edit, `CHAT2_EXTRA_BODY` = `{"chat_template_kwargs":{"enable_thinking":false},"options":{"rejectIfBusy":true}}` |
| `CHAT3_` | Office PC (optional) | see "The office PC" |

Cloudflare: create a free account (no card), copy the Account ID from the dashboard, and create an API token under My Profile > API Tokens with the Workers AI template. Run `chatSelfTest` after adding it: the `CHAT2` line must start with `ok` and show a real answer. An empty answer would mean the `enable_thinking` switch was ignored.

## What the free tiers give and cost

- **Price: nothing,** as long as the Gemini key's project has no billing account and Cloudflare stays on the Workers Free plan.
- **Quotas.**
  - Gemini: Google no longer publishes fixed free limits; see your project's rate limits in AI Studio. Unofficial reports put Flash-Lite models at about 500 requests a day each; Gemma 4 reportedly allows about 16,000 tokens a minute, roughly 2 questions a minute at this prompt size. Daily quotas reset at midnight Pacific time: 15:00 in Vietnam while the US is on standard time (first Sunday of November to second Sunday of March), 14:00 the rest of the year.
  - Cloudflare: 10,000 neurons a day for the whole account, about 130 to 150 questions at this prompt size, resetting at 07:00 Vietnam time. Over the quota it answers 429 with code 3036, which the chat reads as "out for the day".
  - Every question the FAQ answers costs no quota at all.
- **Data.** On the Gemini free tier Google may use questions and answers to improve its products, and human reviewers may read them; Google's terms ask developers not to send personal information. Cloudflare does not train on or keep prompts. So:
  - FAQ answers never leave Apps Script.
  - Before any AI call, `Chat.gs` replaces a learner's own phone numbers (0909 123 456, 0909.123.456, (028) 3829 5555, +84 909 123 456, (+84) 909…, 84909123456), email addresses and ID numbers (9 or 12 digits, unbroken or in groups of 3 or 4) with `[số điện thoại]`, `[email]` and `[số giấy tờ]`. The institute's own numbers pass through. Names, addresses and workplaces cannot be detected and are not masked. A 9-digit amount typed without dots (105600000) is also hidden, the accepted cost of catching old ID numbers. The `Hỏi đáp` sheet keeps the original text.
  - The chat panel says questions go to an outside AI service that may use them to improve its services, and asks learners not to type names, phone numbers or patient information. If you change providers, keep that note true (`dist/index.html`, `.chat-note`).
- **Terms.** You must be 18 or older to use the Gemini API, and it may not power a site aimed at or likely to be used by under-18s; this audience (researchers, postgraduates, clinicians) is adult. It may not give medical advice; the prompt and the `tu-van-y-khoa` FAQ row decline clinical questions. Re-read https://ai.google.dev/gemini-api/terms before launch.

**When to pay instead.** If you want learners' questions kept out of Google's product improvement, or need more quota: AI Studio > Set up billing, choose Prepay with the US$5 minimum, leave auto-reload off, and set a monthly spend cap. Rough estimate at gemini-3.5-flash-lite paid prices (US$0.30 per million input tokens, US$2.50 per million output tokens), before the FAQ takes its share: about US$3 to 4 a month at 50 AI questions a day, about US$23 at 300. When the credit runs out, Gemini returns HTTP 402 and the chain moves on to Cloudflare.

## Models

- Gemini default order: `gemini-3.5-flash-lite` (generally available since July 2026, no shutdown date announced), then `gemini-3.1-flash-lite` (earliest shutdown 7 May 2027). Both run with `thinkingLevel: MINIMAL`. After May 2027, set `CHAT_MODELS` with `gemini-3.5-flash-lite` plus the Flash-Lite model current then.
- Gemma 4 is free on the same Gemini key: `gemma-4-26b-a4b-it` (faster) and `gemma-4-31b-it`, no paid tier, sent `thinkingLevel: MINIMAL` (it accepts only MINIMAL or HIGH). It shares Google's key and data terms, so it adds headroom, not independence; Cloudflare is the independent fallback.
- Do not use `gemini-2.5-*` models: since 18 September 2026 new projects get 404. Avoid `*-preview` and `*-latest` IDs. Larger Flash models (such as `gemini-3.8-flash`) are reported to get only about 20 free requests a day.
- A later model is only called when the earlier ones fail, and `chatSelfTest` stops at the first model of each provider that answers. To test one model, set that provider's `…MODELS` to it alone, run `chatSelfTest`, then set it back.
- Each extra model shortens the time left for the next ones (all attempts share 45 seconds, and each later attempt keeps about 5 seconds), so keep the whole chain to about five models.
- Other OpenAI-compatible hosts work in any group: DeepSeek (`https://api.deepseek.com`, `deepseek-flash`, extra body `{"thinking":{"type":"disabled"}}`; prepaid, about US$5 a month at 300 questions a day, data processed in China and may be used for training). Groq's free plan (8,000 tokens a minute) is too small for this prompt, and OpenRouter's free models (50 requests a day) are not reliable enough.

## The office PC (optional)

The chain supports the office PC as `CHAT3_`: any OpenAI-compatible server (llama.cpp's `llama-server` or Ollama) reached through a tunnel, with `CHAT3_BASE_URL`, `CHAT3_API_KEY`, `CHAT3_MODELS` and, if the tunnel needs it, `CHAT3_HEADERS`. When the PC is off, the first visitor gets a fast failure and the PC is skipped for 3 minutes, so nobody waits on it. Step-by-step Windows setup for the RTX 2060 machine is being verified and will be added here.

## FAQ matching

`Faq.gs` scores every phrasing of every active row (the question plus each line of "Cách hỏi khác") with BM25. Words are compared without accents, so "hoc phi" finds "học phí", and also with accents when the learner typed them, so "cô" and "có" stay apart. Common shorthand is expanded (hp, đk, sdt, stk, ck, gv, ko, bn, onl, k1/k2/k3…), greetings and particles are ignored, and neighbouring word pairs add weight. A row answers only when its score, the share of the question's words it covers, and its lead over the next row all pass the thresholds at the top of `Faq.gs`. Rows outside their "Từ ngày / Đến ngày" window, or with "Bật" = `Không`, are ignored.

The thresholds are being tuned on an independent set of learner-style questions written without seeing the FAQ rows; the results will be recorded here.

## What the chat does and does not do

- Answers from the FAQ tab and `Knowledge.gs` only. When something is not there (daily class hours, Zoom link timing, recordings, invoices, refunds, seats left, certificate conditions) it says so and gives (028) 2242 6789, Ms. Vy 0949 761 636 and Ms. Thảo 0912 114 511.
- Never registers, holds a seat, confirms a payment or grants a discount. It points to the form on the page, the phone numbers, or in-person registration at 45 Đinh Tiên Hoàng.
- Discounted amounts are labelled as estimates (tạm tính); the Institute confirms the final amount. It says the notice does not settle whether the early-payment and group discounts stack.
- Declines medical questions and anything outside the course series.
- The AI is told each day whether the 08/12/2026 offer date and the 28/12/2026 deadline have passed (worked out in `Knowledge.gs`, not by the model). On those two days themselves it asks the learner to confirm with the Institute, because the notice says "before" both dates; the dated FAQ rows leave those two days uncovered for the same reason.
- Does not collect callback requests. The panel always shows Call and Zalo links.

## The `Hỏi đáp` sheet

Created on the first question. One row per question: time (Vietnam), anonymous session id, question, answer, status, page URL. Values are stored as text, so nothing a visitor types runs as a formula.

For AI answers the status lists each model tried, for example `error-429-daily gemini-3.5-flash-lite; ok gemini-3.1-flash-lite`.

| Status | Meaning |
|---|---|
| `faq:<id>` | answered from that FAQ row |
| `ok` | an AI model answered |
| `ok-truncated` | the answer hit the length cap; usually a sign the question needs a person |
| `…; faq-suggest` | no model answered; the learner was offered the closest FAQ questions |
| `no-ai` | no AI configured (or `CHAT_MAX_PER_HOUR` = 0) and no FAQ row close enough |
| `over-hour-cap` | the shared hourly AI cap was reached |
| `blocked-...` | a content filter stopped the question or answer (SAFETY, PROHIBITED_CONTENT, BLOCKLIST, SPII, RECITATION, content_filter); the visitor got the call/Zalo message |
| `error-finish-...` | the model stopped for another reason (OTHER, MALFORMED_RESPONSE...); the next model is tried |
| `error-429` | per-minute rate limit; the next model is tried |
| `error-429-daily` | that model's daily free quota is used up until the reset |
| `error-404` | the model is not available to this key; update `…MODELS` |
| `error-400` | wrong key (Gemini reports a bad key this way, and that provider is skipped) or a setting the model rejects |
| `error-401`, `error-403` | the key is not allowed to use this API; that provider is skipped |
| `error-402` | prepaid credit used up; that provider is skipped |
| `error-500`, `error-503` | the provider was busy |
| `error-502`, `error-530`, `error-network` | the host could not be reached in time (for the office PC: switched off); an OpenAI-compatible host is then skipped for 3 minutes |
| `skipped-down` | not tried: that host was unreachable within the last 3 minutes |
| `skipped-time` | not tried: the 45 seconds were used up by earlier attempts |
| `error-parse`, `error-empty`, `error-thinking-length` | no usable reply (the last: a reasoning model used the whole length on thinking) |

Read it weekly (the staff guide shows how): AI answers to common questions should become FAQ rows, and `faq-suggest` rows show phrasings to add.

## Updating what the chat knows

- Course facts the AI uses: edit `Knowledge.gs`, run `chatSelfTest` if you want a quick check, then deploy a new version. Keep the text identical between deployments so the provider can reuse its cached copy. The notice is the source of truth; nothing goes in that the notice or the outlines do not say.
- FAQ answers: edit the `FAQ` tab; no deployment needed. Changes apply as soon as the tab is edited (or within 10 minutes).

## Limits

30 questions per visitor session per clock hour (FAQ answers included); `CHAT_MAX_PER_HOUR` AI calls across everyone (default 100) per clock hour; 1,000 characters per question; the last 12 turns of history; 1,024 output tokens per answer; 45 seconds for all model attempts on one question, at most 25 for one attempt (the page stops waiting at 60). A visitor over their own limit is told to try again next hour; when the shared cap is reached, the closest FAQ questions are offered, or visitors are told the assistant is busy, without blaming them.
