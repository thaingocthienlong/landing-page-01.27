# Apps Script backend

One Apps Script project, bound to the registration Google Sheet, serves two things from the same web app URL (the `/exec` URL in `dist/index.html`):

| File | What it does |
|---|---|
| `Code.gs` | Registration form: appends to the `Đăng ký` sheet and emails the team. Also routes requests. |
| `Chat.gs` | Learner-care chat: sends the learner's question to Claude and logs the exchange to the `Hỏi đáp` sheet. |
| `Knowledge.gs` | The chat's instructions and everything it knows about the course series (from the v4 notice and the three outlines). |

`doPost` in `Code.gs` sends any request with `"action": "chat"` to `Chat.gs` before taking the registration lock, so a slow model reply never holds up a registration.

## Turning the chat on

1. Get an Anthropic API key at console.anthropic.com (Settings > API keys). Set a monthly spend limit there.
2. Open the Sheet > Extensions > Apps Script. Add two script files named `Chat` and `Knowledge` and paste `Chat.gs` and `Knowledge.gs` into them. Replace `Code` with the new `Code.gs`.
3. Project Settings (gear icon) > Script properties > Add:

   | Property | Value | Required |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | the key from step 1 | yes |
   | `CHAT_MODEL` | `claude-opus-5-5` (default), `claude-sonnet-5-5` or `claude-haiku-4-5` | no |
   | `CHAT_MAX_PER_HOUR` | questions allowed per hour across all visitors, default `200` | no |

4. In the editor, choose `chatSelfTest` in the function list and Run. Accept the new permission ("Connect to an external service"): the web app runs as you, so it can only call the Anthropic API after you grant this. The execution log should show `ok` and an answer quoting 8.800.000 đồng. `error-401` means the key is wrong.
5. Deploy > Manage deployments > pencil icon on the existing web app > Version: **New version** > Deploy. This keeps the `/exec` URL, so `dist/index.html` needs no change. (Deploy > New deployment would create a different URL.)

Until `ANTHROPIC_API_KEY` is set, the chat panel tells visitors the assistant is not running yet and shows the phone and Zalo numbers. It never shows a made-up answer.

## What the chat does and does not do

- Answers from `Knowledge.gs` only. When something is not there (daily class hours, Zoom link timing, recordings, invoices, refunds, seats left, certificate conditions) it says so and gives (028) 2242 6789, Ms. Vy 0949 761 636 and Ms. Thảo 0912 114 511.
- Never registers, holds a seat, confirms a payment or grants a discount. It points to the form on the page, the phone numbers, or in-person registration at 45 Đinh Tiên Hoàng.
- Discounted amounts are labelled as estimates (tạm tính); the Institute confirms the final amount. It says the notice does not settle whether the early-payment and group discounts stack.
- Does not collect callback requests. The panel always shows Call and Zalo links.

## The `Hỏi đáp` sheet

Created on the first question. One row per question: time (Vietnam), anonymous session id, question, answer, status, page URL. Values are stored as text, so nothing a visitor types runs as a formula.

| Status | Meaning |
|---|---|
| `ok` | answered |
| `ok-truncated` | answer hit the length cap; usually a sign the question needs a person |
| `refusal` | the model declined; the visitor got the call/Zalo message |
| `error-429`, `error-529`, `error-5xx` | Anthropic was busy or rate limited (after one retry) |
| `error-401` | the API key is wrong or revoked |
| `error-400` | the request was rejected; check `CHAT_MODEL` |
| `error-network`, `error-parse`, `error-empty` | no usable reply |

Read it weekly: repeated questions the bot cannot answer are the facts to add to `Knowledge.gs` (once the Institute confirms them).

## Updating what the chat knows

Edit `Knowledge.gs`, run `chatSelfTest` if you want a quick check, then deploy a new version (step 5). The text is prompt-cached for an hour, so keep it unchanged between deployments; every edit starts a new cache entry. Follow the same rule as the page: the notice is the source of truth, and nothing goes in that the notice or the outlines do not say.

## Cost and limits

The prompt is about 16,000 characters of Vietnamese (roughly 6,000 to 9,000 tokens). It is cached for an hour, so each question mostly pays for the question, the recent history and the answer. With `claude-opus-5-5` at low effort, expect very roughly US$0.02 per question, plus about US$0.06 to rewrite the cache after an idle hour. `claude-sonnet-5-5` is about half that; `claude-haiku-4-5` is cheaper again but weaker in Vietnamese. Check real spend in the Anthropic Console after the first week.

Limits that bound spend: 30 questions per visitor session per hour, `CHAT_MAX_PER_HOUR` across everyone, 1,000 characters per question, the last 12 turns of history, 4,096 output tokens. The visitor-session limit can be dodged by clearing the browser; the hourly cap and the Console spend limit are the real ceiling.

## Privacy

Questions and answers are stored in the Sheet. The chat panel says so and links the Institute's privacy policy (https://vienphuongnam.com.vn/chinh-sach-bao-mat.php). The model is told not to ask for personal data. Questions are sent to Anthropic to generate answers.
