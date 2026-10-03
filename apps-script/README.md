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
  - Vietnam's Personal Data Protection Law (Law 91/2025/QH15) has applied since 1 January 2026, including to personal data sent to services abroad. Masking reduces but does not remove personal data in learners' questions, so ask whoever handles legal matters at the Institute whether the Gemini and Cloudflare tiers need a transfer impact assessment. FAQ answers never leave Apps Script. The office PC, even placed first, does not make the chain in-house: questions still pass through Google (Apps Script, the Sheet) and through Cloudflare's tunnel, and go on to Gemini whenever the PC is slow or off. Include those flows in the question.
  - The chat panel no longer shows a privacy note (removed at the Institute's request). The greeting still says it is an AI that can be wrong. If the Institute wants learners told that questions may reach an outside AI service, the privacy policy page is the place for it.
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

**Wait for data before setting this up.** The PC (Core i5-14400F, 16 GB RAM, RTX 2060 12 GB) is on only in office hours and shared with other work, and the FAQ tab plus two free cloud tiers should cover most questions. Its clearest use is drafting FAQ rows from the Facebook conversations without sending them to a cloud service (`docs/huong-dan-faq.md`). Add it to the chat only if, after 2 to 4 weeks, the `Hỏi đáp` sheet shows office-hours rows with `error-429-daily` (a Gemini or Cloudflare daily quota used up), `over-hour-cap` or `faq-suggest`. Plain `error-429` is a per-minute limit that the chain gets past on its own.

- **What it adds:** answers when both free tiers are used up during office hours, and, if placed first in the chain, fewer questions sent to AI providers that may use them to improve their products (they still pass through Cloudflare's tunnel and Google).
- **What it costs:** about half a day of setup; 4 to 5 GB of the 12 GB GPU memory held for 15 minutes after each question; about 10 seconds of full GPU load per answer, which can stutter video playback or slow an export.
- **Model: Gemma 4 E4B, 4-bit.** Not the 12B: about 19 to 24 seconds per answer on this card, plus reload time, against a 25 second limit per call. Not the 26B: it does not fit, and Cloudflare already runs it for free.

Estimates from published benchmarks of similar cards, not measured on this PC: 3.5 to 5 GB of GPU memory while loaded (part of the model stays in system RAM), 8 to 12 seconds per answer with the model loaded, 13 to 22 seconds after an idle unload.

### Setup (Windows, administrator account)

1. **Prepare.**
   - Update the NVIDIA driver to 551.61 or newer. The prebuilt llama.cpp CUDA 12.4 build compiles its RTX 20-series code on first use, which needs that driver.
   - Power Options: no sleep during office hours, and Fast Startup off (Choose what the power buttons do), so startup tasks run at every boot.
   - Create `C:\AI\llama`, `C:\AI\models` and `C:\AI\swap`. About 6 GB of disk is needed.
2. **llama.cpp.** From https://github.com/ggml-org/llama.cpp/releases download `llama-<build>-bin-win-cuda-12.4-x64.zip` and `cudart-llama-bin-win-cuda-12.4-x64.zip` (build b11368 on 3 October 2026) and unzip both into `C:\AI\llama`. Check: `C:\AI\llama\llama-server.exe --list-devices` lists the RTX 2060 with about 12 GB.
3. **Model.** Download a 4-bit Gemma 4 E4B GGUF file and save it as `C:\AI\models\gemma-4-e4b.gguf`. First choice: Google's own `google/gemma-4-E4B-it-qat-q4_0-gguf` on Hugging Face, trained for 4-bit use. Alternatives: the `Q4_K_M` file in `ggml-org/gemma-4-E4B-it-GGUF` or `bartowski/google_gemma-4-E4B-it-GGUF` (about 5 GB). The `mmproj` file (images) is not needed. Keep it on the SSD: a hard disk adds tens of seconds to every reload.
4. **First run**, in cmd. The very first start can take minutes while the driver compiles; later starts are fast.
   ```
   C:\AI\llama\llama-server.exe -m C:\AI\models\gemma-4-e4b.gguf --no-mmproj -c 32768 -np 2 --host 127.0.0.1 --port 8081 --no-webui --no-slots --reasoning off --temp 1.0 --top-p 0.95 --top-k 64 --cache-ram 1024 -ctxcp 8
   ```
   In a second cmd window:
   ```
   curl.exe http://127.0.0.1:8081/v1/chat/completions -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Xin chao\"}],\"reasoning_effort\":\"none\",\"max_tokens\":200}"
   ```
   The reply's `timings` give prompt and generation speed. The startup log shows the GPU memory used (`CUDA0 model buffer size`, `KV buffer size`, `compute buffer size`) and whether FlashAttention is on. Stop with Ctrl+C. Leave `-ngl` and `-fa` unset: when other programs already hold GPU memory, llama.cpp then puts fewer layers on the GPU (slower) instead of failing. Run the curl tests in this section in cmd (Command Prompt), not PowerShell: PowerShell breaks the quoted JSON, even typed as `curl.exe`.
5. **API key**, in PowerShell:
   ```powershell
   $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); 'sk-' + (-join ($b | % { $_.ToString('x2') }))
   ```
6. **llama-swap** starts the model on the first question and closes it after 15 idle minutes, so all its GPU memory goes back to the team. It also checks the API key. Download `llama-swap_<version>_windows_amd64.zip` (v261 on 3 October 2026) from https://github.com/mostlygeek/llama-swap/releases into `C:\AI\swap` and create `C:\AI\swap\config.yaml`:
   ```yaml
   healthCheckTimeout: 300
   sendLoadingState: false
   apiKeys:
     - "sk-PASTE_KEY_HERE"
   models:
     gemma-4-e4b:
       ttl: 900
       cmd: |
         C:\AI\llama\llama-server.exe --port ${PORT} --host 127.0.0.1
         -m C:\AI\models\gemma-4-e4b.gguf --no-mmproj
         -c 32768 -np 2 --no-webui --no-slots --reasoning off
         --temp 1.0 --top-p 0.95 --top-k 64 --cache-ram 1024 -ctxcp 8
   ```
   Test with `C:\AI\swap\llama-swap.exe --config C:\AI\swap\config.yaml --listen 127.0.0.1:8080`, then, in a cmd window, the curl above on port 8080 with `-H "Authorization: Bearer sk-..."` added and `\"model\":\"gemma-4-e4b\",` at the start of the body. Always pass `--listen 127.0.0.1:8080`: the default listens on the office network too. Stop it with Ctrl+C before step 7, which starts the same program on the same port. (`healthCheckTimeout` allows 5 minutes for the very first start, while the driver compiles.)
7. **Start at boot**, in an administrator PowerShell. The task runs before anyone logs in, with no window to close by mistake.
   ```powershell
   $a = New-ScheduledTaskAction -Execute 'C:\AI\swap\llama-swap.exe' -Argument '--config C:\AI\swap\config.yaml --listen 127.0.0.1:8080' -WorkingDirectory 'C:\AI\swap'
   $t = New-ScheduledTaskTrigger -AtStartup
   $p = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
   $s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -MultipleInstances IgnoreNew
   Register-ScheduledTask -TaskName 'Gemma AI' -Action $a -Trigger $t -Principal $p -Settings $s
   Start-ScheduledTask 'Gemma AI'
   ```
   Then send one test request: the SYSTEM account compiles the GPU code again on its first start. Do the same after every NVIDIA driver update. (NSSM works as well; use 2.24-101 or newer, since 2.24 can fail to start services on Windows 10 and 11.)
8. **Shortcuts for the team**, as `.cmd` files on the desktop:
   - `AI-giai-phong-GPU.cmd`, no administrator rights needed: `curl.exe -X POST -H "Authorization: Bearer sk-..." http://127.0.0.1:8080/api/models/unload`. Frees the GPU memory at once; the next question reloads the model.
   - `AI-TAT.cmd`, run as administrator: `taskkill /F /T /IM llama-swap.exe & schtasks /End /TN "Gemma AI" & taskkill /F /IM llama-server.exe`. In this order, so no `llama-server.exe` is left holding memory. The chat then skips the PC.
   - `AI-BAT.cmd`, run as administrator: `schtasks /Run /TN "Gemma AI"`.
   - Optional: NVIDIA Control Panel > Manage 3D settings > Program settings > add `C:\AI\llama\llama-server.exe` > CUDA - Sysmem Fallback Policy = Prefer No Sysmem Fallback. The model then fails fast when the GPU is full instead of crawling. It does not protect other programs: an editor can still slow down while the model holds memory, which is what the first shortcut is for.
9. **Cloudflare Tunnel.** When the PC is off, Cloudflare answers 530 at once (502 if only llama-swap is stopped), and the chat skips the PC for 3 minutes without making anyone wait.
   - It needs a domain whose DNS is on Cloudflare (the free plan is enough). Without one, move the domain's DNS to Cloudflare (copy the MX records first) or register a cheap domain for this.
   - Install cloudflared (`winget install --id Cloudflare.cloudflared`). In the Cloudflare dashboard: Networking > Tunnels > Create a tunnel > Windows, and run the `cloudflared.exe service install <token>` command it shows in an administrator cmd. The service starts at boot.
   - Add a published application: hostname `ai.<domain>`, path `^/v1/chat/completions$`, service `http://127.0.0.1:8080`. The path rule matters: llama-swap also serves pages and controls under other paths.
   - If Bot Fight Mode is on for the domain, check that `chatSelfTest` does not get a 403. On the free plan it can only be turned off, not bypassed for one path.
   - Quick tunnels (`trycloudflare.com`) do not work here, because their address changes at every start. Tailscale Funnel is not recommended: when the PC is off each call hangs for the whole timeout, and Funnel is reported to stop accepting connections after the machine has been offline for a weekend.
10. **Apps Script properties**, then `chatSelfTest` (the `CHAT3` line must start with `ok`) and a new version of the deployment:

    | Property | Value |
    |---|---|
    | `CHAT3_PROVIDER` | `openai` |
    | `CHAT3_BASE_URL` | `https://ai.<domain>/v1` |
    | `CHAT3_API_KEY` | the `sk-...` key from step 5 |
    | `CHAT3_MODELS` | `gemma-4-e4b` (the name in `config.yaml`) |
    | `CHAT3_EXTRA_BODY` | `{"reasoning_effort":"none","max_tokens":500}` |

### Running it

- **Slow answers.** A call that runs out of time is logged as `error-timeout` and the PC sits out 1 minute instead of 3: a model that was still loading keeps loading and is ready for the next visitor, and a PC that stays slow (GPU busy with other work) does not hold up every question. If `error-timeout` keeps appearing for `CHAT3`, raise `ttl` so the model stays loaded through the hours when the log shows overflow (3600 keeps it for an hour after each question, at the cost of holding the memory longer). The slowest load is the first one after a restart or an NVIDIA driver update.
- **Prompt reuse.** The FAQ references change with every question and sit in the system message, so llama-server processes the whole prompt (about 6,400 tokens, 3 to 4 seconds on this card) each time. Adding `--swa-full` to the command lets it reuse the unchanged part, at the cost of about 1.2 GB more GPU memory.
- **Order.** As `CHAT3_` the PC answers only when both free tiers fail. To send fewer questions to AI providers that may use them during office hours, put it first instead (questions still pass through Cloudflare and Google, see "Data" above): its values under `CHAT_` (with `CHAT_PROVIDER` = `openai`), Gemini under `CHAT2_` (with `CHAT2_PROVIDER` = `gemini` and `CHAT2_MODELS` set, since only `CHAT_` has default models) and Cloudflare under `CHAT3_`. Outside office hours the chat then spends one fast 530 every 3 minutes before moving on.

## FAQ matching

`Faq.gs` scores every phrasing of every row (the question plus each line of "Cách hỏi khác") with BM25. Words are compared without accents, so "hoc phi" finds "học phí", and also with accents when the learner typed them, so "cô" and "có" stay apart. Common shorthand is expanded (hp, đk, sdt, stk, ck, gv, ko, bn, onl, k1/k2/k3…), greetings and particles are ignored, neighbouring word pairs add weight, and a number after "gói" or "khóa" is read together with it, so "gói 2" never matches "khóa 2". A row answers only when its score, its coverage of the question and its lead over the next row all pass the thresholds at the top of `Faq.gs`, when it shares at least a third of the question's words, and when the row (in any phrasing) contains the question's rarest word of three letters or more (package and course numbers and "cho" do not count). A row whose phrasings name a different package or course than the question (the Khóa 1 schedule for "khóa 2") cannot answer, and a thank-you with no question word is never matched. `=FAQ_KHOP` shows which rule stopped a question. Coverage weighs each word by how rare it is in the table, and a word the table never uses counts in full, so "khóa học có dùng Python không" is not answered by a row that shares only "khóa học có dùng … không". Rows with "Bật" = `Không` are ignored. Rows outside their "Từ ngày / Đến ngày" window never answer, and when one of them matches better than every active row, the question goes to the AI instead (on 15/12, "đóng trước 8/12 giảm bao nhiêu" must not get a neighbouring row's answer). The three closest active rows that share at least a third of the question's words go to the AI as reference.

The thresholds were tuned on half of two sets and measured on the other half:

- 110 learner-style questions written separately from the 50 starter rows (abbreviations, no accents, long messages with greetings, plus off-topic, medical and multi-step questions);
- 274 questions a code reviewer wrote to break the matcher, most asking something next to a row's topic ("khóa học có dạy Python không", "gói 2 học mấy ngày"), each labelled with the rows that answer it correctly, or none, by two separate agents and an adjudicator.

Held-out halves (192 questions), compared with the first version of the matcher:

| | This version | First version |
|---|---|---|
| Questions some row answers correctly (102) | 34 answered from the table, 0 with a wrong row, 68 passed to the AI (51 of them with the right row among its references) | 43 answered right, 9 with a wrong row |
| Questions no row answers (90) | 82 passed to the AI, 8 answered from the table | 65 passed, 25 answered from the table |
| Share of table answers that are right | 34 of 42 (81%) | 43 of 77 (56%) |

The thresholds favour sending a question to the AI over a wrong canned answer. The remaining wrong table answers are questions next to a row's topic ("đóng tiền mặt ở đâu" getting the payment row). Most questions passed on are long messages with personal context ("em là dược sĩ, mù code…") or a word the table does not use yet. Adding real phrasings from the Facebook conversations to "Cách hỏi khác", and rows for side questions learners actually ask, improves both numbers. Some held-out questions were read during development, and the matching rules were revised several times after looking at held-out results (each time to fix a class of errors a reviewer found, not to fit single questions), so take the figures as approximate. The test sets stayed outside the repository; once staff edit the rows, check new phrasings with `=FAQ_KHOP` in the sheet.

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
| `error-502`, `error-530`, `error-network` | the host could not be reached (for the office PC: switched off, or llama-swap stopped); an OpenAI-compatible host is then skipped for 3 minutes |
| `error-timeout` | the host answered too slowly (for the office PC: the model still loading, or the GPU busy); an OpenAI-compatible host is then skipped for 1 minute, unless earlier attempts had left it less than 15 seconds |
| `skipped-down` | not tried: that host was unreachable within the last 3 minutes, or timed out within the last minute |
| `skipped-time` | not tried: the 45 seconds were used up by earlier attempts |
| `error-parse`, `error-empty`, `error-thinking-length` | no usable reply (the last: a reasoning model used the whole length on thinking) |

Read it weekly (the staff guide shows how): AI answers to common questions should become FAQ rows, and `faq-suggest` rows show phrasings to add.

## Updating what the chat knows

- Course facts the AI uses: edit `Knowledge.gs`, run `chatSelfTest` if you want a quick check, then deploy a new version. Keep the text identical between deployments so the provider can reuse its cached copy. The notice is the source of truth; nothing goes in that the notice or the outlines do not say.
- FAQ answers: edit the `FAQ` tab; no deployment needed. Changes apply as soon as the tab is edited (or within 10 minutes).

## Limits

30 questions per visitor session per clock hour (FAQ answers included); `CHAT_MAX_PER_HOUR` AI calls across everyone (default 100) per clock hour; 1,000 characters per question; the last 12 turns of history; 1,024 output tokens per answer; 45 seconds for all model attempts on one question, at most 25 for one attempt (the page stops waiting at 60). A visitor over their own limit is told to try again next hour; when the shared cap is reached, the closest FAQ questions are offered, or visitors are told the assistant is busy, without blaming them.
