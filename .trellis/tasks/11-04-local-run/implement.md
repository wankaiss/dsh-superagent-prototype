# Implement: local run

Verification policy: smoke / e2e only (`.trellis/spec/guides/lessons.md`). Never run `pnpm test` / `pnpm check`.

## Done during planning (probes)

- [x] DSH `0.2.1-rc.3` installed with native scripts; `dsh headless` tool call OK (x86_64, node-pty).
- [x] DeepSeek key verified; `deepseek-flash` and `deepseek-v4-flash` both answer as `deepseek-flash`.
- [x] `pnpm install`; `pnpm typecheck` OK; `pnpm build` OK (check log). CRLF checkout fixed (`core.autocrlf false`).
- [x] `GH_TOKEN` in `~/.bashrc` switched to the valid `wankaiss` token (backup `~/.bashrc.bak-20261104`).

## Steps

1. **Sandbox repo** — `gh repo create wankaiss/dsh-superagent-sandbox --private`; seed files + push; create issues #1, #2; clone to `~/src/dsh-superagent-sandbox`.
   - Check: `gh repo view wankaiss/dsh-superagent-sandbox --json visibility` → PRIVATE; 2 open issues.
2. **gh-agent** — write wrapper; `gh-agent auth login --with-token` fed from the env file; `gh-agent api user --jq .login` → `wankaiss`. No `setup-git`, no repo-local credential helper (would fail `verifyDirectory`). Private-fetch credentials are proven later by the Ticket worktree appearing (step 9).
3. **lark-bot** — write `~/.lark-cli-dsh-superagent/config.json` (bot-only app entry, keychain ref), wrapper, `lark-bot config strict-mode bot --global`.
   - Check: `lark-bot auth status` bot ready, user not available; `lark-bot api GET /open-apis/bot/v3/info` returns `ou_…`. If the keychain ref fails → operator step: `lark-bot config init --app-id cli_aa2c133e05b85bce --app-secret-stdin`.
4. **Feishu group** — create "dsh-superagent sandbox" as bot with operator invited; record `chat_id` in task notes.
5. **Profile** — confirm `~/.dsh/profiles/superagent` does not exist; `dsh superagent --from-default-profile web --dump-config >/dev/null`; `dsh plugin --profile superagent add "link:$PWD"`; write machine patch from `examples/profile.cordis.patch.yml` (stateDir, webserver 127.0.0.1:3082, feishu enabled).
   - Check: `dsh --profile superagent --dump-config | grep -E 'dsh-superagent|3082'`.
6. **Start** — `tmux start-server; tmux set-environment -g DEEPSEEK_API_KEY "<from env file>"`; then `scripts/dsh-superagent start`.
   - Check: exit 3 (waits for setup) or 0; newest `.artifacts/dsh-superagent-superagent-*.log` contains `loaded 2 model(s)`; `GET state` answers.
   - Rollback point A: `scripts/dsh-superagent stop`; delete profile + stateDir.
7. **Settings via API** — order `eval` → `executor` → `source:github` → `source:feishu` → `policy` (allow-lists `[{id}]`) → `PUT prompts`, reading live value + revision from `GET settings` before each PUT; after `restarting: true` wait until `status` stops exiting 1.
   - Check: `status` exit 0; `GET state` setup problems null, health all ready; `GET settings` models/mode as PRD.
8. **GitHub intake smoke** — `GET sources`: github `ready`, no `pollError`. (Operator-authored GitHub requests cannot trigger; D8.)
9. **E2E via Feishu** — get bot id from default profile's member list; send `@bot` request as operator's user identity in the sandbox group: "Please fix sum() for negative numbers in wankaiss/dsh-superagent-sandbox (issue #1) and open a PR." Wait ≤ 10 min.
   - Check: `GET tickets` has the Ticket with a running/finished worker Assignment; a worktree exists under stateDir `work/`; GitHub shows a branch `agent/…` / PR / issue comment by `wankaiss`; group gets a threaded reply; main + worker Session records show the model.
   - Fallback: operator sends the @bot message by hand.
10. **Secret audit** — `git grep -nE 'sk-[0-9a-f]{20}|ghp_[A-Za-z0-9]{20}'` empty; task artifacts contain no secret.
11. **Report** — Feishu DM summary (status, panel URL, Ticket links, operator steps: fine-grained PAT, rotate keys, captcha for article).
12. *(optional)* Hourly check in the `web` profile per docs/006.

## Operator steps (batched in one message)

- (non-blocking) Fine-grained PAT for `gh-agent` limited to the sandbox repo.
- (blocking only for step 9) send one @bot message in the sandbox group from the Feishu app.
- (fallback only) app secret via `--app-secret-stdin` if keychain ref fails.
- Rotate the GitHub token and DeepSeek key that appeared in chat.

## Progress (2026-11-04)

- [x] 1 Sandbox repo `wankaiss/dsh-superagent-sandbox` (PRIVATE, main, issues #1 #2), clone `~/src/dsh-superagent-sandbox`
- [x] 2 `gh-agent` → `wankaiss`
- [x] 3 `lark-bot` (keychain ref reused; no operator step) → bot `ou_b1772545ba318d939348679c42f661d2` "杨乾辉的飞书 CLI", strict-mode bot
- [x] 4 Feishu group "dsh-superagent sandbox" `oc_37b3a567bce3a9e65953096b75696064` (operator owner, bot manager)
- [x] 5 Profile `superagent` + bundle link + machine patch
- [x] 6 Start — **deviations:** (a) `scripts/dsh-superagent` patched to accept `MainThread` (Node 24 ps name); (b) key via `~/.local/bin/dsh-superagent-local` launcher. Key present in DSH process env.
- [x] 7 Settings saved in order eval → executor → github → feishu → policy → prompts (disclosure line). `status` exit 0, setup problems null, all health ready, models `deepseek-official/deepseek-flash`, mode observe.
- [x] 8 GitHub Source ready, `0 notifications; next poll ≥ 60s`
- [ ] 9 E2E via Feishu — default profile is another tenant (232010), so automated user send impossible → operator asked by DM to send the @bot message; Monitor watching tickets.
