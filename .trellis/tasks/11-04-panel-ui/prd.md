# TypeScript UI/UX for the panel

## Goal

A standalone, modern TypeScript operator console for the locally running dsh-superagent. The operator should see at a glance whether it is healthy, what it is doing and what needs a person, drill into Tickets, Threads and Eval Decisions, and use the agent-stable operator controls. The visual design comes from Claude Design; data comes only from the live management API.

## Inputs

- system-map §7: 25 HTTP routes under `/orchestrator/api/`, polling, no WebSocket, no auth, Host/Origin/`x-orchestrator-request` checks (src/app/http.ts:75-79).
- article-map "Inputs for 11-04-panel-ui": 22 UI ideas.
- Architecture record (`scratch/dsh-build/`): ADR-23 (worker isolation precondition), ADR-29 (policy rules are authorization class).
- Live API snapshots: `research/api-samples/` (2026-11-05; tickets/threads/decisions empty).
- Decisions: `grill.md` (G1–G15 plus advisor verdicts).

## Requirements

- R1 **Stack**: React 19, Vite, TypeScript strict, TanStack Router (code-based routes), TanStack Query, Tailwind CSS 4, shadcn/ui (Radix), lucide-react. Lives in `panel/` with its own package; the DSH bundle and root config are unchanged.
- R2 **Contract**: API types come from `src/app/api.ts` by type-only import; `panel/tsconfig.json` extends the root config. The built bundle contains no host code (`node:` / `@deepseek-ai` absent from `panel/dist`).
- R3 **Transport and security**: served by Vite (dev and preview) on `127.0.0.1:5178`; proxy `/orchestrator/api` → `127.0.0.1:3082`; client sends `x-orchestrator-request: 1`, proxy never adds it; proxy rejects foreign Origin with 403 and deletes Origin otherwise; `cors: false`; default `allowedHosts`.
- R4 **Views**: Overview (health board, load, problems, 24 h flow funnel, "noticed but stayed quiet", pause switch); Tickets (state tabs open/pending/working/idle/ended, detail with timeline, threads, environment, Session link-out); Threads (filter tabs, detail timeline); Decisions (Eval audit by kind); Sources (status, health, filtered/dropped); System (context boundary: accounts, stateDir, Sources, allow-lists, eval/executor model split, policy history, current prompt revision; read-only); ⌘K search over `GET search`.
- R5 **Writes**: only pause/resume, Ticket stop and retry, Trigger requeue, Decision dismiss, Thread unsubscribe. Each confirms first, shows pending state, and shows the host's result or error.
- R6 **States**: designed empty states (today's live reality), loading skeletons, and distinct banners for service down (fetch rejected), restarting (empty 404), setup problem, and API errors with the host message. Last good data stays visible with a stale marker.
- R7 **Polling**: 3 s state/overview, 5 s lists, 2 s for a working Ticket; slower when the tab is hidden.
- R8 **Look and feel**: from the Claude Design export; light and dark; works at 390 px without page-level horizontal scroll; keyboard reachable; WCAG AA text contrast.
- R9 **Language**: English UI; `{zh, en}` titles render `en`.
- R10 **Process gates** (operator rules): one ChatGPT (`gloring`) round returns a reviewed SystemPrompt + Prompt with a design-brief and an implementation-brief section, used verbatim by Claude Design and the implementation agents; Codex adversarial review once on the prompts and on the result (≤ 2 rounds); grilling via advisor (done, `grill.md`); Sepia on `panel/README.md` and the UI copy file; no unit tests.

## Acceptance Criteria

- [x] `pnpm -C panel typecheck` and `pnpm -C panel build` pass; `panel/dist` has no `node:` / `@deepseek-ai` strings.
- [x] Smoke (CDP, chrome-la, against `vite preview` and the live service): every route renders, zero console errors, live values visible (agent `wankaiss`, `maxWorkers` 3, both Sources' states), no page-level horizontal overflow at 390 px, screenshots at 1440 light/dark and 390.
- [x] Proxy checks: request without the header → 403 from the host; request with a foreign Origin → 403 from the proxy.
- [x] One write round-trip (pause on → `state.paused` true → off → false), run only when no work is queued or running and no Ticket exists.
- [x] Ticket and Thread pages checked against a live Ticket if the E2E Ticket exists; otherwise reported as checked against empty state only. **(No live Ticket yet: live check = empty state; populated pages checked with SAMPLE fixtures inside one browser tab via request interception.)**
- [x] Claude Design export saved under `research/design/` with its report; ChatGPT-reviewed prompts saved; Codex reviews logged with each finding fixed or rejected with a reason.
- [x] Sepia pass applied to `panel/README.md` and the UI copy file.
- [x] Claude Design recipe recorded in `.trellis/spec/guides/lessons.md`.
- [x] Operator gets a Feishu DM with how to run it and screenshots location. (om_x100b61f4c0346ca0cd02ea137d69e6b, 2026-11-05)

## Out of scope (v1)

- **Settings and prompt editing.** The DSH panel keeps these. Saving needs revision-conflict handling, and ADR-29 puts policy changes in the authorization class, which wants server-side approval first. The System view shows them read-only with a link to the DSH panel.
- **Opening a DSH Session inline** (`uiWorkspace.openSession` is DSH-only): the UI links out to the DSH web UI on :3082.
- **Article UI ideas that need new routes** (3, 4, 6, 7, 8, 9, 11, 12, 13, 15, 18, 21, 22): listed as future in `design.md`; no mocked data.
- Authentication, remote access, and deployment beyond `vite preview` on loopback.
