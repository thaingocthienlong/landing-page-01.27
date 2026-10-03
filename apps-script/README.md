# Apps Script backend

One Apps Script project, bound to the registration Google Sheet, serves two things from the same web app URL (the `/exec` URL in `dist/index.html`):

| File | What it does |
|---|---|
| `Code.gs` | Registration form: appends to the `Đăng ký` sheet and emails the team. Also routes requests. |
| `Chat.gs` | Learner-care chat: sends the learner's question to a low-cost AI model (Google Gemini by default) and logs the exchange to the `Hỏi đáp` sheet. |
| `Knowledge.gs` | The chat's instructions and everything it knows about the course series (from the v4 notice and the three outlines). |

`doPost` in `Code.gs` sends any request with `"action": "chat"` to `Chat.gs` before taking the registration lock, so a slow model reply never holds up a registration.

## Turning the chat on (free, Google Gemini)

1. Sign in to aistudio.google.com with the institute's Google account and accept the terms. AI Studio creates a Cloud project and an API key for new users; otherwise use API keys > Create API key. No credit card is needed. Make sure the key sits in a project **with no billing account**: a key inherits its project's billing, and a billed project is charged for every question. If the account already has Google Cloud projects with billing (for Maps, for example), choose to create a new project in the dialog, then check that AI Studio shows the project on the Free tier. On the API keys page, choose Add restrictions > Restrict to Gemini API only. (On a Google Workspace account, an admin can switch AI Studio off; ask them if it is blocked.)
2. Open the Sheet > Extensions > Apps Script. Add two script files named `Chat` and `Knowledge` and paste `Chat.gs` and `Knowledge.gs` into them. Replace `Code` with `Code.gs`.
3. Project Settings (gear icon) > Script properties:

   | Property | Value | Required |
   |---|---|---|
   | `CHAT_API_KEY` | the key from step 1 | yes |
   | `CHAT_MODELS` | models tried in order, default `gemini-3.5-flash-lite,gemini-3.1-flash-lite` | no for Gemini, yes for other providers |
   | `CHAT_MAX_PER_HOUR` | questions allowed per clock hour across all visitors, default `100`; `0` pauses the chat (visitors see the "not running" message) | no |

   Delete `ANTHROPIC_API_KEY` if an earlier version left it there; it is no longer used.
4. In the editor, choose `chatSelfTest` in the function list and Run. Accept the new permission ("Connect to an external service"): the web app runs as you, so it can only reach the AI service after you grant this. The execution log should start with `ok gemini-3.5-flash-lite` and quote 8.800.000 đồng. `error-400` usually means the key was pasted wrong.
5. Deploy > Manage deployments > pencil icon on the existing web app > Version: **New version** > Deploy. This keeps the `/exec` URL, so `dist/index.html` needs no change. (Deploy > New deployment would create a different URL.)

Until `CHAT_API_KEY` is set, the chat panel tells visitors the assistant is not running yet and shows the phone and Zalo numbers. It never shows a made-up answer.

## What the free tier gives and costs

- **Price: nothing,** as long as the key's project has no billing account (step 1). When the free quota runs out, Gemini answers HTTP 429; the chat then tries the next model in `CHAT_MODELS` (each model has its own quota). When every model's daily quota is used up, the panel says the assistant is paused and shows the phone and Zalo numbers, with no "try again" button, until the quota resets.
- **Quota.** Google no longer publishes fixed free limits; see your project's rate limits in AI Studio. Unofficial reports put Flash-Lite models at about 500 requests a day each, so the two default models should cover tens to a few hundred questions a day. Daily quotas reset at midnight Pacific time: 15:00 in Vietnam while the US is on standard time (from the first Sunday of November to the second Sunday of March), 14:00 the rest of the year. Each question sends about 5,000 to 8,000 tokens (the prompt plus recent turns).
- **Data.** On the free tier Google may use questions and answers to improve its products, and human reviewers may read them (after Google disconnects them from the account). Google's terms ask developers not to send personal information to the free tier. So:
  - `Chat.gs` replaces a learner's own phone numbers (0909 123 456, 0909.123.456, (028) 3829 5555, +84 909 123 456, (+84) 909…, 84909123456), email addresses and ID numbers (9 or 12 digits, unbroken or in groups of 3 or 4) with `[số điện thoại]`, `[email]` and `[số giấy tờ]` before the question leaves Apps Script. The institute's own numbers pass through. Names, addresses and workplaces cannot be detected and are not masked. A 9-digit amount typed without dots (105600000) is also hidden, which is the accepted cost of catching old ID numbers. The `Hỏi đáp` sheet keeps the original text.
  - The chat panel says questions go to an outside AI service that may use them to improve its services, and asks learners not to type names, phone numbers or patient information. If you switch to the paid tier or another provider, keep that note true (`dist/index.html`, `.chat-note`).
- **Terms that apply to this site.** You must be 18 or older to use the API, and it may not power a site aimed at or likely to be used by under-18s; this audience (researchers, postgraduates, clinicians) is adult. The API may not be used to give medical advice; the prompt tells the bot to decline clinical questions. Re-read https://ai.google.dev/gemini-api/terms before launch.

**When to pay instead.** If you want learners' questions kept out of Google's product improvement, or need more quota: AI Studio > Set up billing, choose Prepay with the US$5 minimum, leave auto-reload off, and set a monthly spend cap on the project. Rough estimate at Flash-Lite paid prices (US$0.30 per million input tokens and US$2.50 per million output tokens for gemini-3.5-flash-lite): about US$3 to 4 a month at 50 questions a day, about US$23 at 300. When the credit runs out, Gemini returns HTTP 402 and the chat shows the phone numbers; nothing is charged beyond the credit you bought.

## Models

- Default order: `gemini-3.5-flash-lite` (generally available since July 2026, no shutdown date announced), then `gemini-3.1-flash-lite` (cheapest paid Gemini model; earliest shutdown 7 May 2027). Both run with `thinkingLevel: MINIMAL` for fast, short answers. After May 2027, create the `CHAT_MODELS` property (the default list lives in `Chat.gs` until you do) with `gemini-3.5-flash-lite` plus the Flash-Lite model current then.
- A later model is only called when the earlier ones fail, so a broken fallback shows `error-404` only on rows where the first model also failed, and `chatSelfTest` stops at the first model that answers. To test one model, set `CHAT_MODELS` to that model alone, run `chatSelfTest`, then set it back.
- Do not use `gemini-2.5-*` models: since 18 September 2026 new projects get 404. Avoid `*-preview` and `*-latest` IDs.
- Larger Flash models (such as `gemini-3.8-flash`) are reported to get only about 20 free requests a day.
- `gemma-4-31b-it` is also free on the same key but untested here. Test it alone as above: the log must start with `ok gemma-4-31b-it` and the answer must be good Vietnamese; `error-400` means it rejected the system prompt.

## Other low-cost providers (optional)

Any OpenAI-compatible API works. Set `CHAT_PROVIDER` to `openai` and all of these:

| Provider | `CHAT_BASE_URL` | `CHAT_MODELS` | `CHAT_EXTRA_BODY` | Cost and data |
|---|---|---|---|---|
| DeepSeek | `https://api.deepseek.com` | `deepseek-flash` | `{"thinking":{"type":"disabled"}}` | Prepaid. About US$0.0005 a question once its automatic cache is warm, roughly US$5 a month at 300 a day. Data is processed in China and may be used for training. |
| Cloudflare Workers AI | `https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1` | `@cf/google/gemma-4-26b-a4b-it` | `{"chat_template_kwargs":{"enable_thinking":false},"options":{"rejectIfBusy":true}}` | Free 10,000 neurons a day, about 150 questions at this prompt size; resets 07:00 Vietnam time. Not used for training. The API token needs Workers AI Read and Edit. |

`CHAT_API_KEY` holds that provider's key. Run `chatSelfTest` after switching: whether Cloudflare's OpenAI-style endpoint honours the two extra fields was not verified. Groq's free plan (8,000 tokens a minute) is too small for this prompt, and OpenRouter's free models (50 requests a day, frequent failures) are not reliable enough.

`CHAT_EXTRA_BODY` is merged into the top level of every request, for either provider. For Gemini, a `generationConfig` value there replaces the default one entirely.

## What the chat does and does not do

- Answers from `Knowledge.gs` only. When something is not there (daily class hours, Zoom link timing, recordings, invoices, refunds, seats left, certificate conditions) it says so and gives (028) 2242 6789, Ms. Vy 0949 761 636 and Ms. Thảo 0912 114 511.
- Never registers, holds a seat, confirms a payment or grants a discount. It points to the form on the page, the phone numbers, or in-person registration at 45 Đinh Tiên Hoàng.
- Discounted amounts are labelled as estimates (tạm tính); the Institute confirms the final amount. It says the notice does not settle whether the early-payment and group discounts stack.
- Declines medical questions and anything outside the course series.
- Is told each day whether the 08/12/2026 offer date and the 28/12/2026 deadline have passed (worked out in `Knowledge.gs`, not by the model). On those two days themselves it asks the learner to confirm with the Institute, because the notice says "before" both dates.
- Does not collect callback requests. The panel always shows Call and Zalo links.

## The `Hỏi đáp` sheet

Created on the first question. One row per question: time (Vietnam), anonymous session id, question, answer, status, page URL. Values are stored as text, so nothing a visitor types runs as a formula.

The status lists each model tried, for example `error-429 gemini-3.5-flash-lite; ok gemini-3.1-flash-lite` (first model out of quota, second answered).

| Status | Meaning |
|---|---|
| `ok` | answered |
| `ok-truncated` | the answer hit the length cap; usually a sign the question needs a person |
| `blocked-...` | a content filter stopped the question or answer (SAFETY, PROHIBITED_CONTENT, BLOCKLIST, SPII, RECITATION); the visitor got the call/Zalo message |
| `error-finish-...` | the model stopped for another reason (OTHER, MALFORMED_RESPONSE...); the next model is tried |
| `error-429` | per-minute rate limit; the next model is tried |
| `error-429-daily` | that model's daily free quota is used up until the reset |
| `error-404` | the model is not available to this key; update `CHAT_MODELS` |
| `error-400` | wrong key (Gemini reports a bad key this way, and the chat stops at once) or a setting the model rejects |
| `error-401`, `error-403` | the key is not allowed to use this API |
| `error-402` | prepaid credit used up |
| `error-500`, `error-503` | the provider was busy |
| `error-network` | no reply in time (each call is capped so all attempts finish within 45 seconds) or no connection |
| `skipped-time` | not tried: the 45 seconds were used up by the earlier attempt |
| `error-parse`, `error-empty`, `error-thinking-length` | no usable reply (the last: a reasoning model used the whole length on thinking) |

Read it weekly: repeated questions the bot cannot answer are the facts to add to `Knowledge.gs` (once the Institute confirms them).

## Updating what the chat knows

Edit `Knowledge.gs`, run `chatSelfTest` if you want a quick check, then deploy a new version (step 5). Keep the text identical between deployments so the provider can reuse its cached copy. Follow the same rule as the page: the notice is the source of truth, and nothing goes in that the notice or the outlines do not say.

## Limits

30 questions per visitor session and `CHAT_MAX_PER_HOUR` across everyone (default 100), both counted per clock hour; 1,000 characters per question; the last 12 turns of history; 1,024 output tokens per answer; 45 seconds for all model attempts on one question (the page stops waiting at 60). A visitor over their own limit is told to try again next hour; when the shared cap is reached, visitors are told the assistant is busy, without blaming them. The visitor-session limit can be dodged by clearing the browser; the hourly cap and the provider's own quota are the real ceiling.
