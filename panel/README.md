# Superagent Console

A standalone web console for the person who runs dsh-superagent on their own machine. It answers three questions at a glance (is it healthy, what is it doing, what needs me) and lets you drill into Tickets, Threads and Eval Decisions. It reads only the live management API of the running service; it contains no sample data.

The DSH panel stays the place to edit settings and prompts. This console shows them read-only and links there.

## Run it

Prerequisites: the dsh-superagent service running locally (`scripts/dsh-superagent status` from the repo root exits 0) with the DSH web server on `127.0.0.1:3082`.

```sh
cd panel
pnpm install
pnpm build
pnpm preview          # http://127.0.0.1:5178
```

Once the console is built, `scripts/dsh-superagent start` also runs `vite preview` in a second pane beside DSH in the `dsh-<profile>` tmux session, and `stop` closes it. `status` reports it as `panel`. The script skips the console if it is not built or if something already listens on the port. Run `pnpm preview` by hand only when you are not using the script.

For development with hot reload, use `pnpm dev` (same address).

Links to the DSH UI (`http://127.0.0.1:3082/`) need a DSH sign-in once per browser. If DSH answers "authentication required", open the URL `dsh web` printed at startup (the first line of the newest log in `../.artifacts/`). It sets a 30-day cookie. The console's own API calls do not need it.

Environment overrides: `PANEL_PORT` (default 5178) and `DSH_SUPERAGENT_URL` (default `http://127.0.0.1:3082`).

## How it talks to the service

```
browser ──/orchestrator/api/* + x-orchestrator-request: 1──▶ Vite server (127.0.0.1:5178)
                                                              │ refuses a foreign Origin (403)
                                                              │ removes Origin, sets Host
                                                              ▼
                                                DSH web server 127.0.0.1:3082
```

- The browser sends the `x-orchestrator-request` header; the proxy never adds it. That header is what stops other web pages from calling the API.
- The proxy refuses any request whose Origin is not the console itself, and Vite's CORS is off.
- The console polls: every 3 s for status, 5 s for lists, 2 s for a working Ticket, and it stops while the tab is hidden.

**Not a security boundary.** The management API has no authentication, and workers run with full access as your OS user. The checks above stop browser cross-site requests; they do not stop local processes. Treat every control here as a convenience.

## What you can change from here

Only these actions, each behind a confirmation:

| Action | Effect |
|---|---|
| Pause / resume processing | Suspends new evaluations, worker dispatch and channel delivery. Sources keep recording Triggers. Running workers are not killed. |
| Stop a Ticket | Ends it. A Ticket stopped by a person stays ended. |
| Retry a Ticket | Only offered when the service says it is retryable (blocked, failed or a failed delivery). |
| Requeue a Trigger | Sends it to evaluation again, when the service allows it. |
| Dismiss a Decision | For an Eval that ended without a judgement: the overview stops listing that problem. |
| Unsubscribe a Thread | Tickets stop following that Thread. A Ticket's origin Thread and its own pull request stay subscribed. |

## Check it works

The panel has no unit tests, by choice. Verify it with:

```sh
pnpm typecheck        # also type-checks the API contract imported from ../src/app/api.ts
pnpm build            # fails if host code (node:, @deepseek-ai) leaks into dist
pnpm preview &        # then, with chrome-la's CDP on 127.0.0.1:9223:
pnpm smoke            # proxy checks, every page at 1440 light/dark and 390, zero console errors, live values
pnpm smoke --pause-roundtrip   # also pauses and resumes once, only when nothing is running, queued or ticketed
```

Screenshots and `smoke.json` land in `panel/.smoke/`.

## Layout

| Path | What it is |
|---|---|
| `src/contract.ts` | The only import from the service: API types from `src/app/api.ts` |
| `src/api/` | Typed caller, query hooks with polling, write mutations |
| `src/routes/` | One file per page: Overview, Tickets, Ticket, Threads, Thread, Decisions, Sources, System |
| `src/components/` | App shell, banners, confirm dialog, records; `ui/` holds the shadcn primitives (Base UI) |
| `src/copy.ts` | Every user-facing string |
| `fixtures/` | SAMPLE responses used only for the design round; never imported by `src/` |
| `scripts/smoke.mjs` | Live smoke test |
