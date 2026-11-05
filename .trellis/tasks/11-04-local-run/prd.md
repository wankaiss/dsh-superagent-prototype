# Run dsh-superagent locally

## Goal

The operator (GitHub `wankaiss`, Feishu personal app) can start dsh-superagent on this WSL machine, see it healthy in the panel, and watch it turn a real request (GitHub Issue mention, and a Feishu group message) into a Ticket that a worker Session executes with DeepSeek `deepseek-flash` and answers in the original conversation.

## Requirements

- R1 DSH `0.2.1-rc.3` (installed) boots a dedicated profile `superagent`, separate from the operator's `web` profile; panel on `127.0.0.1:3082`.
- R2 The bundle is built (`pnpm build`) and linked into the profile (`dsh plugin --profile superagent add link:$PWD`).
- R3 Model: main Session and workers use `deepseek-official` / `deepseek-flash`, set explicitly in `eval.model` and `executor.model` before the first Sessions are created. `DEEPSEEK_API_KEY` comes from `~/.config/dsh-superagent/env` (mode 600), never from the repo.
- R4 GitHub Source works on a sandbox repository, not on the prototype repo itself.
- R5 Feishu Source works on a dedicated group chat, not on the operator's DM with the bot (that DM is the progress channel).
- R6 Policy starts conservative: `eval.mode = observe`, allowed people = operator only on each Source.
- R7 Each Ticket gets a git worktree checkout of the sandbox repo (prepare command).
- R8 Start / stop / status through `scripts/dsh-superagent`; the service survives closing the terminal (tmux).
- R9 Verification is smoke / e2e only (see `.trellis/spec/guides/lessons.md`): no unit-test suite runs.

## Decisions (made 2026-11-04, advisor-reviewed; operator delegated decisions)

| # | Decision | Alternatives rejected | Why |
|---|---|---|---|
| D1 | Target repo: new **private** `wankaiss/dsh-superagent-sandbox`, tiny TS seed + 2 seed issues | Prototype repo itself; an existing repo | Agent pushes branches/PRs and comments; keep that away from real code |
| D2 | Agent GitHub account = operator `wankaiss` via `~/.local/bin/gh-agent` (own `GH_CONFIG_DIR`) | Dedicated bot account (SETUP default) | No second account exists; local prototype. **Recorded deviation**: everything the agent writes appears as the operator |
| D3 | `eval.model` = `executor.model` = `{provider: deepseek-official, model: deepseek-flash}` | Rely on profile default `deepseek-v4-flash` | Both ids resolve to `deepseek-flash` today; explicit beats alias |
| D4 | Feishu Source on the **personal** app via bot-only config `~/.lark-cli-dsh-superagent` (strict-mode bot, same keychain secret ref) + `~/.local/bin/lark-bot`; a **new group chat** "dsh-superagent sandbox" (bot + operator) with `listen: mentions`; `directMessages: false` | Reuse DM with `directMessages: true`; `listen: all` | The DM carries progress updates; operator replies there would become Triggers (observe mode still executes explicit asks, Codex #2). `listen: mentions` makes an unregistered mention fail visibly; in observe mode only *addressed* allowed messages execute (`src/admission.ts`) |
| D8 | **E2E trigger comes from Feishu, not GitHub.** With agent = operator = `wankaiss`, the GitHub Source drops every comment/issue authored by the agent login (`src/sources/github.ts:227,355,365,397`), so no GitHub request from the operator can become a Ticket. Feishu E2E message is sent **as the operator's user identity** via the default lark-cli profile (`cli_a942…`, refresh valid to 2026-11-10) with a real `<at>` of the personal bot | Second GitHub account now; code change | No second identity available without operator action. Restores later via operator ask: if `ZenoWangzy` is theirs, re-auth it as `gh-agent`, add as collaborator → agent = ZenoWangzy, asker = wankaiss |
| D5 | `eval.mode = observe`; allowed: GitHub `wankaiss`, Feishu operator open_id | `auto` | SETUP default; explicit asks still execute, proactive work only recorded |
| D6 | `executor.prepare` = docs/006 worktree recipe against `~/src/dsh-superagent-sandbox` | Empty prepare | Empty prepare gives workers no checkout, and PR binding needs branch `agent/$DSH_SUPERAGENT_NAME` |
| D7 | Codex #3 (workers reach panel API), #4 (tool-origin policy edits), #7 (proxy header trust) accepted as **known risks** for loopback-only local use | Fix now | Out of scope for "make it run"; carried into `11-04-architecture-doc` |

## Known risks

- The `wankaiss` token has broad scopes (`admin:org`, `delete:packages`, …) and workers run `danger-full-access` as the same OS user, so the blast radius is the account, not the sandbox repo. **Operator step (non-blocking):** replace the `gh-agent` login with a fine-grained PAT limited to `dsh-superagent-sandbox` (contents, issues, pull requests, metadata).
- The GitHub token and DeepSeek key appeared in chat; operator should rotate both.

## Acceptance Criteria (smoke / e2e only)

- [ ] `scripts/dsh-superagent status` exits 0.
- [ ] `GET /orchestrator/api/state`: `setup.problem == null`, `setup.feishuProblem == null`, every `health` entry `ready`.
- [ ] `GET /orchestrator/api/settings`: `eval.model` and `executor.model` = `deepseek-official/deepseek-flash`; `eval.mode == observe`.
- [ ] GitHub Source `ready` and polling without error (intake proven only to this level; see D8).
- [ ] E2E: an @bot message in the sandbox group from the operator's user identity becomes a Ticket that reaches a **running worker** (not just a Decision row), the worker gets a worktree of the sandbox repo, and the result lands on GitHub as `wankaiss` (branch, PR or issue comment) plus a threaded reply in the group.
- [ ] Main Session and worker Session records show `deepseek-flash` (or the `deepseek-v4-flash` alias that resolves to it).
- [ ] The `.artifacts/` startup log shows `[llm-deepseek-api-key] … loaded 2 model(s)` (key reached the tmux-launched process).
- [ ] No secret in any tracked file (`git grep -nE 'sk-[0-9a-f]{20}|ghp_[A-Za-z0-9]{20}'` empty).
- [ ] Operator gets a Feishu DM summary.

## Out of scope

- Hourly watchdog check from another profile (docs/006 "Hourly check"): nice-to-have, listed in implement.md as optional.
- Fixing Codex #3/#4/#7, the failing Feishu consumer unit test, or any src/ change.
