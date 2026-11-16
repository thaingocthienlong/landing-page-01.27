# Apps Script backend

One Apps Script project, bound to the registration Google Sheet, serves registrations, the learner-care chat and the bot feed from the same web app URL (the `/exec` URL in `dist/index.html`):

| File | What it does |
|---|---|
| `Code.gs` | Registration form: appends to the `Đăng ký` sheet, assigns the learner code, emails the team and the learner. Also routes requests. |
| `Chat.gs` | Learner-care chat: looks each message up in the FAQ tab, lets a chain of AI models talk the learner through it in a few short messages, falls back to the FAQ wording, and logs every exchange to the `Hỏi đáp` sheet. |
| `Faq.gs` | The FAQ lookup: reads the staff-edited `FAQ` tab and finds the row a question matches. |
| `FaqSeed.gs` | The repository's copy of the FAQ rows: `setupFaq` fills an empty tab from it, and later changes reach the tab through the update menu (`Sync.gs`). |
| `Knowledge.gs` | The AI's instructions and everything it knows about the course series (from the v4 notice and the three outlines), the confirmed practices (`KNOWLEDGE_EXTRA`, used until the `Thông tin thêm` tab exists), plus the daily date note. |
| `Ledger.gs` | The learner ledger: the extra `Đăng ký` columns, the `Đợt học`, `Gói` and `Nhật ký` tabs, the `Trạng thái` trigger and the **Sổ học viên** menu actions. See "Sổ học viên". |
| `LedgerMail.gs` | The learner emails: the confirmation after registering and the transfer details (with a VietQR code) when staff choose `Chờ CK`. |
| `Leads.gs` | The short "Đăng ký tư vấn" form the Meta ads use (`form_type` `tu_van`): one row per lead in the `Lead web` tab with its UTM fields and an email to tuyensinh@, vanphong@ and quantrihethong@. A full registration also adds a `Lead web` row (type `Đăng ký`) with its UTM fields; the `Đăng ký` tab is unchanged. |
| `LeadTabs.gs` | Copies each submission into the staff tabs `Theo dõi lead` and (registrations) `Học viên - Học phí`: input columns only, dropdown values only, next row = first empty column A, one row per phone number (later submissions add a note). `backfillFromRegistrations` (run once by hand) adds the registrations made before it existed. |
| `BotApi.gs` | The `feed` action the chat bot polls for new registrations and payments, guarded by the `BOT_KEY` property. |
| `Sync.gs` | The **Trợ lý AI > Cập nhật dữ liệu từ trang web** menu: merges `assistant-data.json` (built by `tools/build-assistant-data.js` on deploy) into the `FAQ` and `Thông tin thêm` tabs, and reads the facts tab for the prompt. |

`doPost` in `Code.gs` sends any request with `"action": "chat"` to `Chat.gs`, and any other `action` to `BotApi.gs`, before taking the registration lock, so a slow model reply never holds up a registration.

## How a question is answered

The chat works as an adviser, not a lookup desk: it answers in a few short messages, asks one question back when the answer would change its advice, and recommends one package.

1. **FAQ tab.** Every message is looked up in the tab (see "FAQ matching"). Staff maintain it; their guide is `docs/huong-dan-faq.md` (Vietnamese).
2. **AI.** While a provider is configured, every message goes to the providers in order: `CLAUDE_` (Claude, through the Institute's Anthropic API credit), then `CHAT_` (Gemini free tier by default), then `CHAT2_` (Cloudflare Workers AI), then `CHAT3_` (the office PC, optional). A provider without a key is skipped, so with only Gemini set up the chain starts there. The model reads the conversation (the last 30 exchanges, 60 messages) and gets the matched row first, then the closest rows, three in all, as its source; it is told not to copy them. Its turn is one to three short messages with a blank line between them, which the page shows one after another, and may end with a line of up to three quick replies, `[[Chưa từng | Đã dùng cơ bản]]`, which the page shows as buttons. No row is answered word for word ahead of the model, payment and contact rows included: the table reads one message with no memory of the conversation, so a short answer to the assistant's own question ("rồi", "em làm về điều trị") would get whichever row shares its words.
3. **Figure check.** `chatUnknownFigure_` in `Chat.gs` drops an AI answer (status `guard-number` and the figure) when it states:
   - an amount, a date, a clock time, or a phone or account number that is in neither the prompt (its example conversation does not count), the date note, the rows sent along nor the conversation;
   - a percentage, in a sentence about money, that is in none of those;
   - an amount that is not one of a package's own amounts in the fee tables, in a sentence that names that one package or in the sentences that carry on about it (an amount the learner gave may be said back beside the package's own, never in its place);
   - another course's class day, in a sentence that names one course.

   So a sum the model worked out itself, a neighbouring row of the fee table or another course's dates never reaches the learner. The check reads figures, not meaning: a real date given for the wrong thing ("hạn chót 08/01/2027"), or a real percentage tied to the wrong condition, passes.
4. **Fallback.** No usable AI answer means every provider failed, the hourly cap is reached, the check dropped the answer, a content filter refused, or the answer was cut off at the length cap. A clearly matched row is then answered word for word, provided the message asks something: it opens the conversation, or the turn before it did not end on a question, or it has a question mark or a question word. A short answer to the assistant's question never gets the table; the visitor is asked to try again. With no matched row, the learner is offered the closest FAQ questions to tap, or asked to try again.

With no AI configured at all (or `CHAT_MAX_PER_HOUR` = 0), every clear match is answered word for word, a near match gets the closest questions to tap, and anything else gets a plain "no answer yet" with the phone and Zalo numbers: the chat runs as a FAQ bot.

## Setting it up

1. Open the Sheet > Extensions > Apps Script. Create script files named `Chat`, `Faq`, `FaqSeed`, `Knowledge` and `Sync` and paste the matching `.gs` files. Replace `Code` with `Code.gs`. Reload the Sheet: a **Trợ lý AI** menu appears (see "Keeping the data current").
2. Choose `setupFaq` in the function list and Run. It creates the `FAQ` tab with the starter rows (it never overwrites a tab that has rows).
3. Claude, the first provider when the Institute has Anthropic API credit: in the Claude Console, open API keys (https://platform.claude.com/settings/keys) in the workspace that holds the credit and create a key. It is shown once; copy it straight into step 5.
4. Gemini, the free fallback: get a free Gemini key: sign in to aistudio.google.com with the institute's Google account and accept the terms. AI Studio creates a Cloud project and an API key for new users; otherwise use API keys > Create API key. No credit card is needed. Make sure the key sits in a project **with no billing account**: a key inherits its project's billing, and a billed project is charged for every question. If the account already has Google Cloud projects with billing (for Maps, for example), choose to create a new project in the dialog, then check that AI Studio shows the project on the Free tier. On the API keys page, choose Add restrictions > Restrict to Gemini API only. (On a Google Workspace account, an admin can switch AI Studio off; ask them if it is blocked.)
5. Project Settings (gear icon) > Script properties: set `CLAUDE_API_KEY` to the Anthropic key and `CHAT_API_KEY` to the Gemini key. Add Cloudflare (`CHAT2_...`, below) the same way. Delete `ANTHROPIC_API_KEY` if an earlier version left it there (nothing reads it any more).
6. Run `chatSelfTest`. Accept the new permission ("Connect to an external service"): the web app runs as you, so it can only reach the AI services after you grant this. The log shows the FAQ row count and a line per provider (`CLAUDE`, `CHAT`, ...), which should start with `ok` and quote 8.800.000 đồng. `error-401` from Claude or `error-400` from Gemini usually means the key was pasted wrong. Then run `chatTalkTest` to read a four-turn consultation with the configured models in the log: a scripted learner, the same checks as the page.
7. Deploy > Manage deployments > pencil icon on the existing web app > Version: **New version** > Deploy. This keeps the `/exec` URL, so `dist/index.html` needs no change. (Deploy > New deployment would create a different URL.)

### Upgrading an existing deployment

When new code arrives (not needed for data changes):

1. Paste every changed `.gs` file, and create any new one (for example `Sync.gs`). Files that changed together go in together: the adviser version changes `Chat.gs`, `Knowledge.gs` and `Sync.gs` (`Sync.gs` now calls `chatCell_`, which only the new `Chat.gs` has).
2. Run `chatSelfTest` once from the editor, as the owner of the deployment, and accept any new permission Google asks for (the update menu shows dialogs in the Sheet). Skipping this can leave the web app answering every request with Google's authorization page.
3. Deploy > Manage deployments > pencil icon > Version: **New version** > Deploy, and open the `/exec` URL: it should show `{"ok":true,"service":"registration"}`.

## Script properties

Each provider reads a group of properties with its own prefix. A provider without a key, without models, or with a malformed JSON value is skipped.

| Property (prefix `CLAUDE_`, `CHAT_`, `CHAT2_` or `CHAT3_`) | Meaning |
|---|---|
| `…PROVIDER` | `anthropic`, `gemini` or `openai` (any OpenAI-compatible host). Default: `anthropic` for `CLAUDE_`, `gemini` for `CHAT_`, `openai` for the others. |
| `…API_KEY` | That provider's key. Required. |
| `…MODELS` | Models tried in order, comma-separated. Required except for Anthropic, which defaults to `claude-opus-5-5` (another Opus, Sonnet or Fable model works too; Claude Haiku does not take the server-side fallback the chat asks for), and Gemini under `CHAT_`, which defaults to `gemini-3.5-flash-lite,gemini-3.1-flash-lite`. |
| `…BASE_URL` | Required for OpenAI-compatible hosts, up to `/v1`. Optional for Anthropic (default `https://api.anthropic.com/v1`). |
| `…EXTRA_BODY` | JSON merged into the top level of every request (host switches such as turning reasoning off). For Gemini, a `generationConfig` here replaces the default one entirely. For Claude, `{"output_config":{"effort":"medium"}}` lets it think longer than the default `low`, at some cost in speed. |
| `…HEADERS` | JSON of extra HTTP headers (for example a tunnel's access token). |
| `CHAT_MAX_PER_HOUR` | AI calls allowed per clock hour across all visitors, default `100`. `0` pauses the AI; the FAQ keeps answering. |
| `ASSISTANT_DATA_URL` | Optional. Where the update menu reads the data file; default `https://thaingocthienlong.github.io/landing-page-01.27/assistant-data.json`. |

Recommended setup:

| Group | Provider | Values |
|---|---|---|
| `CLAUDE_` | Claude (Anthropic API credit) | `CLAUDE_API_KEY` = Claude Console key. Nothing else needed: `claude-opus-5-5` at low effort. |
| `CHAT_` | Gemini free tier | `CHAT_API_KEY` = AI Studio key. Optional `CHAT_MODELS` = `gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemma-4-26b-a4b-it`. |
| `CHAT2_` | Cloudflare Workers AI | `CHAT2_BASE_URL` = `https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1`, `CHAT2_MODELS` = `@cf/google/gemma-4-26b-a4b-it`, `CHAT2_API_KEY` = an API token with Workers AI Read and Edit, `CHAT2_EXTRA_BODY` = `{"chat_template_kwargs":{"enable_thinking":false},"options":{"rejectIfBusy":true}}` |
| `CHAT3_` | Office PC (optional) | see "The office PC" |

Cloudflare: create a free account (no card), copy the Account ID from the dashboard, and create an API token under My Profile > API Tokens with the Workers AI template. Run `chatSelfTest` after adding it: the `CHAT2` line must start with `ok` and show a real answer. An empty answer would mean the `enable_thinking` switch was ignored.

## What the AI tiers give and cost

- **Claude (`CLAUDE_`): paid from the Institute's Anthropic API credit.** Claude Opus 5.5 costs US$4 per million input tokens and US$20 per million output tokens, and US$0.20 per million for the cached prompt. The prompt (instructions and course facts, roughly 10,000 to 20,000 tokens) is cached for 5 minutes, so the first message of a conversation pays to write it (1.25 times the input price) and the next ones, while the learner keeps replying, read it for a twentieth of the price. Rough estimate: US$0.15 to 0.30 for a six-message conversation, so about US$20 to 40 a month at 2 to 4 conversations a day. Check the Console's usage page after the first week. When the credit runs out, Claude answers 402 and the chain moves on to Gemini. Current Claude models always think before answering; the chat asks for low effort, which keeps a turn to a few seconds. On a safety decline, the request names `fallbacks: "default"`, so Anthropic re-runs the turn on a model it picks for that case; the turn is refused only when that model declines too.
- **Gemini and Cloudflare: nothing,** as long as the Gemini key's project has no billing account and Cloudflare stays on the Workers Free plan.
- **Quotas.**
  - Gemini: Google no longer publishes fixed free limits; see your project's rate limits in AI Studio. Unofficial reports put Flash-Lite models at about 500 requests a day each; Gemma 4 reportedly allows about 16,000 tokens a minute, roughly 2 questions a minute at this prompt size. Daily quotas reset at midnight Pacific time: 15:00 in Vietnam while the US is on standard time (first Sunday of November to second Sunday of March), 14:00 the rest of the year.
  - Cloudflare: 10,000 neurons a day for the whole account, about 130 to 150 questions at this prompt size, resetting at 07:00 Vietnam time. Over the quota it answers 429 with code 3036, which the chat reads as "out for the day".
  - Every message is one AI call while a provider is configured, a tapped quick reply included. At a few visitors a day that stays far inside the free quotas.
- **Data.** With `CLAUDE_` set, questions go to Anthropic first, under the terms of the Institute's API account, and to Google only when Claude fails. On the Gemini free tier Google may use questions and answers to improve its products, and human reviewers may read them; Google's terms ask developers not to send personal information. Cloudflare does not train on or keep prompts. So:
  - While a provider is configured, every message goes to the model (in the FAQ-first version, a question the table answered never left Apps Script), and the adviser asks about the learner's field, topic and data (never the name, phone, email or workplace). So more of what learners say about themselves reaches the provider than before.
  - Before any AI call, `Chat.gs` replaces a learner's own phone numbers (0909 123 456, 0909.123.456, (028) 3829 5555, +84 909 123 456, (+84) 909…, 84909123456), email addresses and ID numbers (9 or 12 digits, unbroken or in groups of 3 or 4) with `[số điện thoại]`, `[email]` and `[số giấy tờ]`. The institute's own numbers pass through. Names, addresses and workplaces cannot be detected and are not masked. A 9-digit amount typed without dots (105600000) is also hidden, the accepted cost of catching old ID numbers. The `Hỏi đáp` sheet keeps the original text.
  - Vietnam's Personal Data Protection Law (Law 91/2025/QH15) has applied since 1 January 2026, including to personal data sent to services abroad. Masking reduces but does not remove personal data in learners' questions, so ask whoever handles legal matters at the Institute whether the Anthropic, Gemini and Cloudflare tiers need a transfer impact assessment. The office PC, even placed first, does not make the chain in-house: questions still pass through Google (Apps Script, the Sheet) and through Cloudflare's tunnel, and go on to Gemini whenever the PC is slow or off. Include those flows in the question.
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

- **What it adds:** answers when every tier before it (Claude, Gemini, Cloudflare) is used up or down during office hours, and, if placed first in the chain, fewer questions sent to AI providers that may use them to improve their products (they still pass through Cloudflare's tunnel and Google).
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
- **Order.** As `CHAT3_` the PC answers only when every tier before it fails. To send fewer questions to AI providers that may use them during office hours, put it first instead (questions still pass through Cloudflare and Google, see "Data" above): its values under `CHAT_` (with `CHAT_PROVIDER` = `openai`), Gemini under `CHAT2_` (with `CHAT2_PROVIDER` = `gemini` and `CHAT2_MODELS` set, since only `CHAT_` has default models) and Cloudflare under `CHAT3_`. Outside office hours the chat then spends one fast 530 every 3 minutes before moving on.

## FAQ matching

`Faq.gs` scores every phrasing of every row (the question plus each line of "Cách hỏi khác") with BM25. Words are compared without accents, so "hoc phi" finds "học phí", and also with accents when the learner typed them, so "cô" and "có" stay apart. Common shorthand is expanded (hp, đk, sdt, stk, ck, gv, ko, bn, onl, k1/k2/k3…), greetings, particles and acknowledgements ("ok", "ừ") are ignored, neighbouring word pairs add weight, and a number after "gói" or "khóa" is read together with it, so "gói 2" never matches "khóa 2". A row answers only when its score, its coverage of the question and its lead over the next row all pass the thresholds at the top of `Faq.gs`, when it shares at least a third of the question's words, and when the row (in any phrasing) contains the question's rarest word of three letters or more (package and course numbers and common function words such as "cho", "rồi" and "nữa" do not count). A question whose words, read the same way, are exactly those of one phrasing of one active row is answered by that row without the thresholds: staff add learners' real messages as phrasings, and many are too short to score ("Hỏi giá" leaves one word). A phrasing that two active rows share never takes this shortcut. A row whose phrasings name a different package or course than the question (the Khóa 1 schedule for "khóa 2") cannot answer, and a thank-you with no question word is never matched. `=FAQ_KHOP` shows which rule stopped a question. Coverage weighs each word by how rare it is in the table, and a word the table never uses counts in full, so "khóa học có dùng Python không" is not answered by a row that shares only "khóa học có dùng … không". Rows with "Bật" = `Không` are ignored. Rows outside their "Từ ngày / Đến ngày" window never answer, and when one of them matches better than every active row, the question goes to the AI instead (on 15/12, "đóng trước 8/12 giảm bao nhiêu" must not get a neighbouring row's answer). The three closest active rows that share at least a third of the question's words go to the AI as reference.

Since the chat became an adviser, a clear match leads the model's references instead of being the answer. The figures below still say how often the matcher picks the right row, which is now what the model speaks from and what the learner gets when no model answers.

The thresholds were tuned on half of two sets and measured on the other half:

- 110 learner-style questions written separately from the starter rows (abbreviations, no accents, long messages with greetings, plus off-topic, medical and multi-step questions);
- 274 questions a code reviewer wrote to break the matcher, most asking something next to a row's topic ("khóa học có dạy Python không", "gói 2 học mấy ngày"), each labelled with the rows that answer it correctly, or none, by two separate agents and an adjudicator.

Held-out halves (192 questions). The labels were redone for the 55-row table, so the first version's figures (measured with the earlier labels) are only a rough comparison. For the 60-row table, two agents and an adjudicator relabelled the 13 questions whose topic got confirmed facts on 03/10/2026 (teaching language, support after the course, final tests); the rest keep the 55-row labels. Of its three wrong rows, one is a hiring question that gets the new "other programmes" row instead of the out-of-scope row (both decline and give the numbers):

| | This version (60 rows) | 55 rows | First version (49 rows) |
|---|---|---|---|
| Questions some row answers correctly | 42 of 113 answered from the table, 3 with a wrong row, 68 passed to the AI (52 of them with the right row among its references) | 38 of 108 answered, 1 with a wrong row | 43 of 102 answered right, 9 with a wrong row |
| Questions no row answers | 68 of 79 passed to the AI, 11 answered from the table | 74 of 84 passed, 10 answered | 65 of 90 passed, 25 answered from the table |
| Share of table answers that are right | 42 of 56 (75%) | 38 of 49 (78%) | 43 of 77 (56%) |

Real Messenger questions from the Institute's July–August 2026 inbox (`docs/phan-tich-tu-van-meta-2026.md`), each time half held out and measured before its phrasings were added, labelled by two agents and an adjudicator:

- First export (90 conversations): of 24 held-out typed questions, 2 were answered from the table and none wrongly; 17 of the other 21 went to the AI with the right row among its references. All 11 thank-you and closing messages were left to the AI.
- Second export (365 more conversations): the table answered 23 of the 70 held-out questions that a row of the old table answers before the update, and 25 of the 72 that a row of the new table answers after it (one with a wrong row, a follow-up that only makes sense after the previous message); 31 of the 46 passed to the AI had the right row among its references (28 before). 45 of 46 closing messages were left to the AI; the other, "học phí đắt quá", now gets the discount row.

Real messages are short, full of chat words ("bn", "ntn", "tt ck") and often lean on the previous message, which is why most new ones need the AI until their phrasings are in the table; the held-out ones are now in it too.

The thresholds favour sending a question to the AI over a wrong canned answer. The remaining wrong table answers are questions next to a row's topic ("đóng tiền mặt ở đâu" getting the payment row). Most questions passed on are long messages with personal context ("em là dược sĩ, mù code…") or a word the table does not use yet. Adding real phrasings from the Facebook conversations to "Cách hỏi khác", and rows for side questions learners actually ask, improves both numbers. Some held-out questions were read during development, and the matching rules were revised several times after looking at held-out results (each time to fix a class of errors a reviewer found, not to fit single questions), so take the figures as approximate. The test sets stayed outside the repository; once staff edit the rows, check new phrasings with `=FAQ_KHOP` in the sheet.

## What the chat does and does not do

- Answers from the FAQ tab and `Knowledge.gs` only. Besides the notice, `Knowledge.gs` holds practices the Institute confirmed on 03/10/2026: class hours; online learners joining live with the hall, seeing the lecturer's screen and getting help with code errors; teaching in Vietnamese; materials and the signed book; the completion certificate (course names, no CME, no final test, passport name order on request, a sample via Zalo); the replay link (from day one to about two days after the course); the Zalo contact within about one working day, confirming the amount before paying, the receipt and the VAT invoice; the class Zalo group 3–4 days before the start and support there after the course. Deferring or withdrawing a fee goes to the advisers. When something is in neither (seats left, class size, attendance needed for the certificate, trial sessions, office hours) it says so and gives (028) 2242 6789, Ms. Vy 0949 761 636 and Ms. Thảo 0912 114 511.
- Talks like an adviser. A turn is one to three short messages on one topic; it asks at most one question back (R experience; field, topic or kind of data; in person or online and any clashing dates; alone, in a group or a former learner when fees come up), then recommends one package for the learner's own reasons, naming the lessons that teach what they need. It invites the next step once (the form, or Zalo to Ms. Vy or Ms. Thảo) and never presses: no "only today", no "seats running out". It does not ask for a name, phone number, email or workplace.
- Never registers, holds a seat, confirms a payment or grants a discount. It points to the form on the page, the phone numbers, or in-person registration at 45 Đinh Tiên Hoàng.
- Discounted amounts are labelled as estimates (tạm tính); the Institute confirms the final amount. It says the notice does not settle whether the early-payment and group discounts stack.
- Declines medical questions and anything outside the course series.
- The AI is told each day whether the 08/12/2026 offer date and the 28/12/2026 deadline have passed (worked out in `Knowledge.gs`, not by the model). On those two days themselves it asks the learner to confirm with the Institute, because the notice says "before" both dates; the dated FAQ rows leave those two days uncovered for the same reason.
- Does not collect callback requests. The panel always shows Call and Zalo links.

## Keeping the data current

The chat reads its data from two tabs at run time, so changing data never needs pasted code or a new deployment:

- `FAQ`: the rows the table answers from.
- `Thông tin thêm`: the practices the Institute confirmed beyond the notice, one per row (`Mã`, `Nội dung`, `Bật`). The prompt uses the enabled rows in place of the facts built into `Knowledge.gs` (`KNOWLEDGE_EXTRA`); until the tab exists (the first menu run creates it), the built-in facts apply.

Edits to either tab take effect within seconds (the cache is cleared on edit, and expires after 10 minutes anyway). `FaqSeed.gs` and `KNOWLEDGE_EXTRA` are the repository's copy of the two tabs: `setupFaq` fills an empty `FAQ` tab from `FaqSeed.gs`, and after that, changes to either file reach the sheet only through the **Trợ lý AI > Cập nhật dữ liệu từ trang web** menu. The copies pasted into Apps Script do not need updating for data changes.

1. Merge the change into `main`. A pull request that touches the data runs the `Check assistant data` workflow, which builds the file and fails on a row the menu would refuse. On merge, the deploy workflow runs `tools/build-assistant-data.js` and publishes `assistant-data.json` next to the page: the rows of `FaqSeed.gs`, the facts of `KNOWLEDGE_EXTRA`, the build time, and from git history the hashes of every version of each field, the phrasings each row has dropped and the rows and facts the repository has dropped.
2. A few minutes later, open the Sheet on a computer and choose the menu item. Each Google account is asked for permission the first time.
3. `Sync.gs` merges the file into the two tabs, row by row (matched by `Mã`), and shows a summary, also kept in the `Lịch sử cập nhật` tab (failures too):
   - a group, question, answer, date or fact is replaced only while the cell still holds what the last update brought in (on the first update, any text the repository ever wrote). A cell staff changed keeps their text; when the repository has a new text for it (on the first update, or changed since the last one), that text goes into a block in the cell's note, between the line `Bản mới trên trang web...` and the closing line `(Hết ghi chú của menu cập nhật)`; staff notes above or below the block stay. The summary lists these cells. The block disappears once the cell matches, or when staff paste the block into the cell;
   - phrasings new in the repository are added, unless another enabled row with overlapping dates already has them (listed in the summary, and added on a later update once that row is off or drops the phrasing); phrasings the repository dropped, for example moved to another row, are removed. These checks read the tab as the same update leaves it, so a row switched off or given an end date in this update no longer counts;
   - rows and phrasings staff deleted are not brought back;
   - rows the repository dropped are switched off (`Không` in `Bật`) once, while their answer is still the repository's text. A row staff switch back on stays on, and a row the repository brings back is switched on again;
   - a new row whose question an enabled row already uses is added and reported, so staff switch one of the two off;
   - a new repository row whose `Mã` a row staff added already uses (a row whose question and answer were never the repository's) is not merged into that row, on the first update too: it waits, and the summary asks staff to rename their `Mã`. A `Mã` on several rows is left alone the same way;
   - rows staff added, columns to the right of the eight FAQ columns and every other cell are left alone, and no row is deleted. Only changed cells are written, formatted as plain text first so nothing is read as a formula, number or date.

What the last update brought in is kept in the document properties (keys starting `sync:`; phrasings as text, so a matcher change in `Faq.gs` does not bring back a phrasing staff removed), saved in one call after every cell is written: an update that stops halfway (a protected range, a timeout) saves nothing, and choosing the menu again finishes it. The lock keeps out a second update but not people: if a tab changed while the menu was reading it, nothing is written to it and the summary asks to run the menu again. The menu changes nothing when the file cannot be read or is invalid, when it is older than the last update applied, or when a tab's header row no longer has the expected columns (both headers are checked before either tab is created).

A tab that is missing or has no rows left is rebuilt from the repository, as if it were the first update. Two cases the remembered state cannot cover:

- On the first update, rows and phrasings staff deleted before the menu existed come back (nothing recorded that staff deleted them, and a tab made from an older `FaqSeed.gs` is missing rows the same way). Staff check the tab once after the first update.
- Restoring the sheet from version history does not restore the document properties. On the next update, cells that differ from the last update count as staff edits (kept, with the new text in the note), and phrasings that update added are not added again.

## The `Hỏi đáp` sheet

Created on the first question. One row per question: time (Vietnam), anonymous session id, question, answer, status, page URL. Values are stored as text, so nothing a visitor types runs as a formula.

For AI answers the status lists each model tried, for example `error-429-daily gemini-3.5-flash-lite; ok gemini-3.1-flash-lite`.

| Status | Meaning |
|---|---|
| `faq:<id>` | answered word for word from that FAQ row. Alone: no AI is configured. After other statuses (`error-500 …; faq:<id>`): no model gave a usable answer, so the matched row was used |
| `…; guard-number <figure>` | the model's answer stated a figure the Institute's text does not support and was dropped. The status names it: `7900000` (an amount found nowhere), `Gói 3: 6700000` (another package's fee), `20%`, `15/12`, `Khóa 2: 15/1` (another course's day), `19:00`, a phone number. The matched row, the closest questions or a retry followed |
| `…; guard-empty` | the model sent quick replies without a message; handled the same way |
| `ok` | an AI model answered |
| `ok-truncated` | the answer hit the length cap; it is shown only when no row matched, without quick replies. Usually a sign the question needs a person |
| `…; faq-suggest` | no model answered; the learner was offered the closest FAQ questions |
| `no-ai` | no AI configured (or `CHAT_MAX_PER_HOUR` = 0) and no FAQ row close enough |
| `over-hour-cap` | the shared hourly AI cap was reached |
| `blocked-...` | a content filter stopped the question or answer (SAFETY, PROHIBITED_CONTENT, BLOCKLIST, SPII, RECITATION, content_filter; `refusal` for Claude, after its fallback model declined too); the matched FAQ row, or else the call/Zalo message, followed |
| `error-finish-...` | the model stopped for another reason (OTHER, MALFORMED_RESPONSE...); the next model is tried |
| `error-429` | per-minute rate limit; the next model is tried |
| `error-429-daily` | that model's daily free quota is used up until the reset |
| `error-404` | the model is not available to this key; update `…MODELS` |
| `error-400` | wrong key (Gemini reports a bad key this way, and that provider is skipped) or a setting the model rejects |
| `error-401`, `error-403` | the key is not allowed to use this API; that provider is skipped |
| `error-402` | prepaid credit used up, or (Claude) a billing problem; that provider is skipped |
| `error-500`, `error-503`, `error-529` | the provider was busy (529: Anthropic overloaded); the next model is tried |
| `error-502`, `error-530`, `error-network` | the host could not be reached (for the office PC: switched off, or llama-swap stopped); an OpenAI-compatible host is then skipped for 3 minutes |
| `error-timeout` | the host answered too slowly (for the office PC: the model still loading, or the GPU busy); an OpenAI-compatible host is then skipped for 1 minute, unless earlier attempts had left it less than 15 seconds |
| `skipped-down` | not tried: that host was unreachable within the last 3 minutes, or timed out within the last minute |
| `skipped-time` | not tried: the 45 seconds were used up by earlier attempts |
| `error-parse`, `error-empty`, `error-thinking-length` | no usable reply (the last: a reasoning model, Claude included, used the whole length on thinking) |

Read it weekly (the staff guide shows how): AI answers to common questions should become FAQ rows, and `faq-suggest` rows show phrasings to add.

## Updating what the chat knows

- How it talks, rules and notice facts (`CHAT_PROMPT_TEMPLATE` in `Knowledge.gs`: "Cách trò chuyện", "Quy tắc về thông tin", the facts, then an example conversation, which a small model imitates closely): edit the file, paste it, run `chatTalkTest` to read a consultation in the log, then deploy a new version. Keep the text identical between deployments so the provider can reuse its cached copy. The notice is the source of truth; nothing goes in that the notice or the outlines do not say.
- Confirmed practices: edit the `Thông tin thêm` tab, or change `KNOWLEDGE_EXTRA` in the repository and use the update menu (see "Keeping the data current"). Once the tab exists, pasting `Knowledge.gs` does not change them.
- FAQ answers: edit the `FAQ` tab, or change `FaqSeed.gs` in the repository and use the update menu; no deployment needed.

## Limits

60 messages per visitor session per clock hour (FAQ answers and tapped quick replies included); `CHAT_MAX_PER_HOUR` AI calls across everyone (default 100) per clock hour; 1,000 characters per message; the last 30 exchanges (60 messages) of history, and more than 80 messages in one request refused; 2,048 output tokens per answer (16,000 for Claude, whose thinking counts toward it); 45 seconds for all model attempts on one question, at most 25 for one attempt (the page stops waiting at 60). A visitor over their own limit is told to try again next hour; when the shared cap is reached, the fallback of "How a question is answered" applies (a matched row, else the closest FAQ questions), or visitors are told the assistant is busy, without blaming them.

`node apps-script/chat-check.js` runs the chat against a fake sheet and a fake model (routing, the figure check, quick replies, limits), and fails when two `.gs` files define a function of the same name: Apps Script runs all files in one scope and silently keeps one of them. The `Check Apps Script` workflow runs it on every pull request that touches `apps-script/`.

## Sổ học viên

The `Đăng ký` tab is also the learner ledger. Each registration gets a learner code such as `R27-001` and the learner gets a confirmation email; staff move the learner along in the `Trạng thái` column; every step is logged in the `Nhật ký` tab; and the chat bot (a separate service) reads that log through the `feed` action. The design is in the repository `thaingocthienlong/zalo-cskh-bot`: `docs/superpowers/specs/2026-10-12-he-thong-cskh-toan-dien-design.md`.

### Setting it up

1. Paste the changed `Code.gs` and `Sync.gs`, and create script files `Ledger`, `LedgerMail` and `BotApi` with the matching `.gs` files.
2. Check the `Đăng ký` tab first. It needs at least 26 columns (A to Z, the Sheets default; insert columns if staff removed any), and columns R to Z must be empty or already hold the headers `setupLedger` writes (`Mã học viên`, `Đợt`, `Kênh`, `Hình thức`, `Số tiền phải đóng`, `Email CK đã gửi`, `Ngày đóng`, `Phụ trách`, `Ghi chú`). Any other header there makes `setupLedger` stop before it writes anything.
3. Choose `setupLedger` in the function list and Run, and accept the permissions Google asks for. It adds the columns, the `Trạng thái` and `Hình thức` dropdowns, and the `Đợt học`, `Gói` and `Nhật ký` tabs (filled for the R27 intake and its six packages; a tab that already has rows is left alone). Reload the Sheet: a **Sổ học viên** menu appears.
4. Signed in as the Sheet's owner account, menu **Sổ học viên > Bật gửi email tự động**, and authorize. The trigger sends every email as the account that creates it, so the menu refuses anyone else. It installs the trigger that reacts to the `Trạng thái` column. Without it, choosing a status sends no email and writes nothing to `Nhật ký`, so the bot never sees a payment.
5. Project Settings > Script properties: add `BOT_KEY`, a long random value. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` and give the bot the same value in its environment. Never commit it. While `BOT_KEY` is missing or empty, `feed` refuses every request.
6. Deploy > Manage deployments > pencil icon > Version: **New version** > Deploy. This keeps the `/exec` URL.

Until `setupLedger` has run, registrations still work, but they get no learner code and no emails.

### How staff use `Trạng thái`

A registration starts at `Mới`, then goes `Đã liên hệ`, `Chờ CK`, `Đã đóng`; `Hủy` is available at any point.

- Fill `Hình thức` and `Số tiền phải đóng` before choosing `Chờ CK`. Amounts like `6.700.000` are fine. Choosing `Chờ CK` emails the learner the transfer details with a VietQR code, once. If the code, the email or the amount is missing or wrong, that cell turns red with a note saying what to fix, and nothing is sent.
- To send the email again, select the rows and choose **Sổ học viên > Gửi lại email CK (dòng đang chọn)**. It asks first, and skips rows that are not in `Chờ CK`.
- `Đã đóng` fills `Ngày đóng` and logs the payment. Choosing it again on the same row adds nothing.
- Rows typed by hand or from before the ledger get a code from **Sổ học viên > Cấp mã cho dòng chưa có mã**. That never reaches the bot, so old rows do not look like new registrations.

### The bot feed

Send a `POST` to the `/exec` URL with the body `{"action":"feed","key":"<BOT_KEY>","after":<last>}`. The key is checked first, and the feed never takes the registration lock.

- A wrong, missing or empty key gives `{"ok":false,"error":"unauthorized"}`. A correct key with any other action gives `{"ok":false,"error":"bad-request"}`.
- `after` is the `last` of the previous response. Without a number from 0 up (a first call, or `null`), the response has no events and the current `last`, so the bot starts from now and never replays the journal.
- Otherwise the response is `{"ok":true,"last":N,"events":[...]}`: at most 50 events, oldest first. A full page means there may be more, so call again with the new `last`.
- `registered` comes from each `đăng ký` row of `Nhật ký`: `{id, time, type, code, dot, package, name, phone, channel}`. `paid` comes from each `đổi trạng thái` row whose detail is `Đã đóng`: `{id, time, type, code, name}`. Everything but `id`, `time`, `type` and `code` is read from the learner's row in `Đăng ký`, found by code; `name` is `Họ và chữ lót` and `Tên` together. An event whose code no longer matches a row (deleted, or retyped) is skipped, and `last` still moves past it.
