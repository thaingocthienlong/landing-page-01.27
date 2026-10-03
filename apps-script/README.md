# Apps Script backend

One Apps Script project, bound to the registration Google Sheet, serves two things from the same web app URL (the `/exec` URL in `dist/index.html`):

| File | What it does |
|---|---|
| `Code.gs` | Registration form: appends to the `Đăng ký` sheet and emails the team. Also routes requests. |
| `Chat.gs` | Learner-care chat: sends the learner's question to a low-cost AI model (Google Gemini by default) and logs the exchange to the `Hỏi đáp` sheet. |
| `Knowledge.gs` | The chat's instructions and everything it knows about the course series (from the v4 notice and the three outlines). |

`doPost` in `Code.gs` sends any request with `"action": "chat"` to `Chat.gs` before taking the registration lock, so a slow model reply never holds up a registration.

## Turning the chat on (free, Google Gemini)

1. Sign in to aistudio.google.com with the institute's Google account and accept the terms. AI Studio creates a Cloud project and an API key for new users; otherwise use API keys > Create API key. No credit card is needed. On the API keys page, choose Add restrictions > Restrict to Gemini API only. (On a Google Workspace account, an admin can switch AI Studio off; ask them if it is blocked.)
2. Open the Sheet > Extensions > Apps Script. Add two script files named `Chat` and `Knowledge` and paste `Chat.gs` and `Knowledge.gs` into them. Replace `Code` with `Code.gs`.
3. Project Settings (gear icon) > Script properties:

   | Property | Value | Required |
   |---|---|---|
   | `CHAT_API_KEY` | the key from step 1 | yes |
   | `CHAT_MODELS` | models tried in order, default `gemini-3.5-flash-lite,gemini-3.1-flash-lite` | no |
   | `CHAT_MAX_PER_HOUR` | questions allowed per hour across all visitors, default `100` | no |

   Delete `ANTHROPIC_API_KEY` if an earlier version left it there; it is no longer used.
4. In the editor, choose `chatSelfTest` in the function list and Run. Accept the new permission ("Connect to an external service"): the web app runs as you, so it can only reach the AI service after you grant this. The execution log should start with `ok gemini-3.5-flash-lite` and quote 8.800.000 đồng. `error-400` usually means the key was pasted wrong.
5. Deploy > Manage deployments > pencil icon on the existing web app > Version: **New version** > Deploy. This keeps the `/exec` URL, so `dist/index.html` needs no change. (Deploy > New deployment would create a different URL.)

Until `CHAT_API_KEY` is set, the chat panel tells visitors the assistant is not running yet and shows the phone and Zalo numbers. It never shows a made-up answer.

## What the free tier gives and costs

- **Price: nothing.** A project with no billing account cannot be charged. When the free quota runs out, Gemini answers HTTP 429; the chat then tries the next model in `CHAT_MODELS` (each model has its own quota) and, if that is used up too, shows the phone and Zalo numbers.
- **Quota.** Google no longer publishes fixed free limits; see your project's rate limits in AI Studio. Unofficial reports put Flash-Lite models at about 500 requests a day each, so the two default models should cover tens to a few hundred questions a day. Daily quotas reset at midnight Pacific time: 14:00 in Vietnam until 1 November 2026, 15:00 after. Each question sends about 5,000 to 8,000 tokens (the prompt plus recent turns).
- **Data.** On the free tier Google may use questions and answers to improve its products, and human reviewers may read them (after Google disconnects them from the account). Google's terms ask developers not to send personal information to the free tier. So:
  - `Chat.gs` replaces a learner's own phone numbers, email addresses and 9 or 12 digit ID numbers with `[số điện thoại]`, `[email]` and `[số giấy tờ]` before the question leaves Apps Script. The institute's own numbers pass through. The `Hỏi đáp` sheet keeps the original text.
  - The chat panel asks learners not to type personal information and says questions go to an outside AI service.
- **Terms that apply to this site.** You must be 18 or older to use the API, and it may not power a site aimed at or likely to be used by under-18s; this audience (researchers, postgraduates, clinicians) is adult. The API may not be used to give medical advice; the prompt tells the bot to decline clinical questions. Re-read https://ai.google.dev/gemini-api/terms before launch.

**When to pay instead.** If you want learners' questions kept out of Google's product improvement, or need more quota: AI Studio > Set up billing, choose Prepay with the US$5 minimum, leave auto-reload off, and set a monthly spend cap on the project. Rough estimate at Flash-Lite paid prices (US$0.30 per million input tokens and US$2.50 per million output tokens for gemini-3.5-flash-lite): about US$3 to 4 a month at 50 questions a day, about US$23 at 300. When the credit runs out, Gemini returns HTTP 402 and the chat shows the phone numbers; nothing is charged beyond the credit you bought.

## Models

- Default order: `gemini-3.5-flash-lite` (generally available since July 2026, no shutdown date announced), then `gemini-3.1-flash-lite` (cheapest paid Gemini model; earliest shutdown 7 May 2027). Both run with `thinkingLevel: MINIMAL` for fast, short answers. After May 2027, take `gemini-3.1-flash-lite` out of `CHAT_MODELS` or replace it with the Flash-Lite model current then; the sheet will show `error-404` for it.
- Do not use `gemini-2.5-*` models: since 18 September 2026 new projects get 404. Avoid `*-preview` and `*-latest` IDs.
- Larger Flash models (such as `gemini-3.8-flash`) are reported to get only about 20 free requests a day.
- `gemma-4-31b-it` is also free on the same key but untested here; check its Vietnamese and whether it accepts the system prompt with `chatSelfTest` before relying on it.

## Other low-cost providers (optional)

Any OpenAI-compatible API works. Set `CHAT_PROVIDER` to `openai` and:

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
- Does not collect callback requests. The panel always shows Call and Zalo links.

## The `Hỏi đáp` sheet

Created on the first question. One row per question: time (Vietnam), anonymous session id, question, answer, status, page URL. Values are stored as text, so nothing a visitor types runs as a formula.

The status lists each model tried, for example `error-429 gemini-3.5-flash-lite; ok gemini-3.1-flash-lite` (first model out of quota, second answered).

| Status | Meaning |
|---|---|
| `ok` | answered |
| `ok-truncated` | the answer hit the length cap; usually a sign the question needs a person |
| `blocked-...` | the provider's safety filter stopped the question or answer; the visitor got the call/Zalo message |
| `error-429` | quota or rate limit reached |
| `error-404` | the model is not available to this key; update `CHAT_MODELS` |
| `error-400` | wrong key (Gemini reports a bad key this way) or a setting the model rejects |
| `error-401`, `error-403` | the key is not allowed to use this API |
| `error-402` | prepaid credit used up |
| `error-500`, `error-503` | the provider was busy |
| `error-network`, `error-parse`, `error-empty` | no usable reply |

Read it weekly: repeated questions the bot cannot answer are the facts to add to `Knowledge.gs` (once the Institute confirms them).

## Updating what the chat knows

Edit `Knowledge.gs`, run `chatSelfTest` if you want a quick check, then deploy a new version (step 5). Keep the text identical between deployments so the provider can reuse its cached copy. Follow the same rule as the page: the notice is the source of truth, and nothing goes in that the notice or the outlines do not say.

## Limits

30 questions per visitor session per hour, `CHAT_MAX_PER_HOUR` across everyone (default 100), 1,000 characters per question, the last 12 turns of history, 1,024 output tokens per answer. The visitor-session limit can be dodged by clearing the browser; the hourly cap and the provider's own quota are the real ceiling.
