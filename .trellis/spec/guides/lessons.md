# Lessons

> Rules learned the hard way in this project. Read before verifying work or setting up the environment. Add new lessons at the top of their section, dated.

---

## Verification

### Do not run the unit-test suite; verify with smoke / e2e only (2026-11-04, operator rule)

**Rule:** Do not run `pnpm test`, `pnpm check` or `vitest` as a verification step. Running the full suite (1,197 tests, ~1–2 min plus triage of unrelated failures) is too slow for the value it gives here.

**Verify instead with, in order:**

1. `pnpm typecheck` (fast, catches contract breaks)
2. `pnpm build` (the DSH bundle is installed via `link:$PWD` and loads `lib/*.js`; an unbuilt change is invisible to the running service)
3. **Smoke / e2e against the real system:**
   - `scripts/dsh-superagent status` exits 0 (or the expected 2/3 with a known reason)
   - `curl -s -H 'x-orchestrator-request: 1' http://127.0.0.1:3082/orchestrator/api/state` returns the expected `setup` / `health`
   - one real round-trip for the feature touched (e.g. a GitHub Issue mention or Feishu message becomes a Ticket and gets a reply; the UI loads and renders live data)
   - `dsh headless "<task>"` for a model/provider sanity check

**Why:** the operator wants evidence the system works end-to-end, not unit coverage; unit failures seen so far were environmental (CRLF checkout) or unrelated to the change.

**How to apply:** `check.jsonl` / `implement.md` validation steps and `trellis-check` runs list typecheck + build + smoke commands, never `pnpm test` / `pnpm check`. Only run a single targeted spec if the operator asks.

---

## Environment

### Git `core.autocrlf=true` breaks this repo on WSL (2026-11-04)

**Symptom:** `scripts/dsh-superagent` would fail (`#!/usr/bin/env python3\r`), and `tests/docs.spec.ts` reported every module as missing from `docs/007-architecture.md` (table parser splits on `\n`).

**Cause:** the global git config has `core.autocrlf=true`, so the LF-committed files were checked out with CRLF.

**Fix (applied):** `git config core.autocrlf false` in this repo, then re-checkout tracked files (`git ls-files -z | xargs -0 rm -f && git checkout -- .`) when there are no tracked changes. Check with `git ls-files --eol | grep -c w/crlf` → `0`.

### Node 24 reports the DSH process as `MainThread` in `ps` (2026-11-04)

**Symptom:** `scripts/dsh-superagent start` printed `Startup health check timed out`, `status` showed `"pids": []` and exited 1, although DSH was serving on :3082.

**Cause:** Node 24.16 names its main thread `MainThread`; `ps -o ucomm=` reports that instead of `node`, and the script only accepted `('node', 'dsh')`.

**Fix (applied):** `SERVICE_NAMES = ('node', 'dsh', 'MainThread')` in `scripts/dsh-superagent`. Check: `scripts/dsh-superagent status` exits 0/2/3, never 1 while the service answers.

### tmux-hosted DSH needs `DEEPSEEK_API_KEY` in the launch env (2026-11-04)

The provider reads the key from the process's launch environment, and `scripts/dsh-superagent` passes none to tmux. `tmux start-server` alone exits immediately (no sessions), so `set-environment -g` after it is lost. Use `~/.local/bin/dsh-superagent-local <start|restart|stop|status>`, which exports only the key and also sets it on a running tmux server. Verify with `/proc/<pid>/environ` (never print the value).

### Feishu: apps from different tenants cannot see each other's chats (2026-11-04)

The default lark-cli profile (`cli_a942…`) and the `personal` profile (`cli_aa2c…`) are in different tenants: `+chat-members-list` on the personal bot's group returns `232010 not authorized`. Feishu E2E triggers must come from a human in the personal tenant (or that profile's refreshed user login), not from the other profile.

### Same GitHub account as agent and asker cannot trigger work (2026-11-04)

The GitHub Source drops items authored by the agent login (`src/sources/github.ts:227,355,365,397`). With agent = operator, drive E2E from Feishu or use a second GitHub account.

### `scripts/dsh-superagent` health checks and the local proxy

`.bashrc` sets `http(s)_proxy=127.0.0.1:3129`; `no_proxy` includes `127.0.0.1,localhost`, so loopback calls are fine. Use `curl --noproxy '*'` or a `ProxyHandler({})` opener in ad-hoc scripts when unsure.

### Driving ChatGPT (gloring profile) over CDP (2026-11-04)

- Open in the right profile: `google-chrome-stable --user-data-dir=$HOME/.chrome-la-profile --profile-directory=Default https://chatgpt.com/` (chrome-la Default = "gloring yang"; Profile 1 = "geraldyang" for Claude). `/json/new` opens in whichever window was last focused.
- Verify the account before sending: `fetch('/api/auth/session')` → `user.name`, `account.planType`.
- Synthetic `ClipboardEvent('paste')` no longer fills the composer; use CDP `Input.insertText` after focusing `#prompt-textarea`. Long text is turned into a "Pasted text" attachment; that is fine.
- The reply DOM changed: no `[data-message-author-role]`, no `<pre>`. The response root is `[class*="DilResponseRoot"]`; fenced blocks are leaf `<span>`s inside it. Helpers: `scratch/dsh-prompts/{cdp.mjs,cdp-insert.mjs,extract.js}`.

### Driving Claude Design (geraldyang profile) over CDP (2026-11-05)

- Open in the right profile: `google-chrome-stable --user-data-dir=$HOME/.chrome-la-profile --profile-directory='Profile 1' https://claude.ai/design`; verify with `fetch('/api/account')` (email starts `gera…@gmail.com`) before inserting anything.
- Start page: click the **UI mockups** template; **Design system → clear (⊗)** so it reads "None" (org default is Modernist); **Model → Fable 5.1, Effort Max**.
- Message: one text = `SYSTEMPROMPT (governs this whole task)` + system prompt + prompt, inserted with `document.execCommand('insertText', false, text)` on the `[contenteditable=true]` composer. Add attachments **after** inserting (selectAll would drop the chips): "+" → "Attach file" with `Page.setInterceptFileChooserDialog` + `DOM.setFileInputFiles` (several files in one chooser works). The "+" moves when the composer grows; re-locate it.
- Bundle many JSON inputs into one or two files keyed by route; name the bundles in the prompt exactly as uploaded.
- Wait: poll for `button[title=Stop]`; done when absent twice 30 s apart. Turns take 30–65 min. If turn 1 only reads files, send one nudge: "You read the files but created nothing. Create the file now; do not re-analyse."
- Export: inside the preview iframe origin, fetch `/serve/<file>.html?t=<token>` (no `srcmap=1`, no `_wr`), then strip `data-omelette-injected` tags. Activate the tab before screenshots (`/json/activate/<id>`); background tabs hang `Page.captureScreenshot`.
- Helpers: `~/workloads/projects/scratch/panel-design/{cdp.mjs,wait-stop.sh,insert-msg.js,pos-*.js,fetch-export.js,clean_check.py}`.

### ChatGPT Pro replies: new DOM again (2026-11-05)

The reply is no longer under `[class*="DilResponseRoot"]`; fenced blocks are `main code` elements (take those longer than 1,000 chars). Pro "Thinking" shows only an `aria-label="Stop"` button, and a reply took ~35 min. A new chat may inherit files from a ChatGPT project; check its notes for "attachment mismatch".

### Codex `exec` must run from a dir where its hooks resolve (2026-11-04)

`~/workloads/projects/.codex/hooks.json` calls `.codex/hooks/inject-workflow-state.py` by a **relative** path. `codex exec -C ~/workloads/projects/scratch` therefore logs `hook: UserPromptSubmit Blocked` and does nothing (exit 0, no review). Run with `-C ~/workloads/projects` and refer to `scratch/...` paths. Also always pass `< /dev/null`, or `codex exec` waits on stdin. Check the log for `hook: ... Blocked` before trusting an empty result.

### WeChat articles (`mp.weixin.qq.com`) cannot be fetched by automation (2026-11-04)

curl, headless/real Chrome via CDP all hit the "环境异常 / 去验证" captcha; Codex computer-use refuses the domain by site-safety policy. Don't retry these paths. Ask the operator to pass the captcha in `chrome-la` (CDP :9223), then extract with `.trellis/tasks/11-04-article-capture/research/cdp-wechat.mjs`.

### DeepSeek model ids (2026-11-04)

`deepseek-v4-flash` (DSH default in `~/.dsh/settings.yaml`) is served as `deepseek-flash`; both ids work. Set `deepseek-flash` explicitly in `eval.model` / `executor.model`.
