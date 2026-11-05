# Design: panel-ui

## Boundaries

```
browser (127.0.0.1:5178)  ──fetch /orchestrator/api/* + x-orchestrator-request: 1──▶  Vite server (dev | preview)
                                                                                   │ proxy: Origin absent|self else 403;
                                                                                   │ delete Origin; Host → 127.0.0.1:3082
                                                                                   ▼
                                                     DSH web server 127.0.0.1:3082  /orchestrator/api/*  (dsh-superagent routes)
```

- `panel/` is a separate pnpm package. Nothing in `src/`, `lib/`, root config or the DSH profile changes.
- The only shared artefact is the type contract `src/app/api.ts` (type-only import; the filter-array constants are the one value import, and that file has only type imports).
- The DSH Session view is a link to `http://127.0.0.1:3082/` (the DSH UI), not an embedded view.

## Package layout

```
panel/
  package.json            scripts: dev, build, preview, typecheck, smoke
  tsconfig.json           extends ../tsconfig.json; include src + ../src/app/api.ts closure; noEmit; types [vite/client]
  vite.config.ts          react(), tailwindcss(); server/preview: host 127.0.0.1, port 5178, strictPort, cors false, proxy (shared object)
  index.html
  components.json         shadcn config
  src/
    main.tsx              QueryClient, RouterProvider, theme init
    router.tsx            code-based route tree: / , /tickets, /tickets/$id, /threads, /threads/$key, /decisions, /sources, /system
    api/client.ts         typed `call(route, request)` over Api (adapted from src/client/api.ts, no host value imports); ApiError kinds
    api/queries.ts        query keys + hooks (useStateView, useOverview, useTickets(filter), useTicket(id), ...) with intervals
    api/mutations.ts      pause, stop, retry, requeue, dismiss, unsubscribe; invalidate affected keys
    copy.ts               all UI strings (Sepia target)
    components/ui/*       shadcn primitives (button, badge, card, tabs, table, dialog, alert-dialog, command, tooltip, skeleton, sonner, switch, separator, scroll-area, sheet)
    components/*          app shell (sidebar + topbar), StatusDot, HealthBoard, FlowFunnel, Timeline, EmptyState, ConnectionBanner, ConfirmAction, Stale marker
    routes/*              one file per view
  scripts/smoke.mjs       CDP smoke against chrome-la (:9223) + proxy checks
  README.md               run instructions (Sepia target)
```

## Data flow and polling

- TanStack Query, `refetchInterval` per hook (3 s state/overview, 5 s lists, 2 s working Ticket), `refetchIntervalInBackground: false` plus a hidden-tab multiplier; `placeholderData: keepPreviousData` so last good data stays on screen; `structuralSharing` avoids re-renders on unchanged polls.
- Error classification (from src/client/api.ts:36-55): fetch rejected → `offline`; empty-body 404 → `restarting`; body with `setup` → `setup`; `code` → user error; otherwise status error. A top `ConnectionBanner` reads the state query's error kind.
- Mutations: confirm dialog → pending button → toast with the host result → invalidate `state`, `overview` and the affected list/detail.

## Security notes

- The `x-orchestrator-request` header stays the CSRF guard: a cross-origin page cannot send it without a preflight, and Vite's CORS is off, so the preflight fails.
- The proxy deletes Origin only after checking it is absent or the panel's own origin; foreign Origin → 403 before forwarding.
- Default `allowedHosts` blocks DNS rebinding. Loopback bind only.
- No secrets reach the browser: settings/environment views show keys and descriptions the API already returns; no new data.

## Article UI ideas coverage

| Idea | v1 | How |
|---|---|---|
| 1 Ticket-centred, Sessions as drill-down | yes | Tickets first in nav; Session link-out |
| 2 Router inbox/load | partial | load card + evaluating threads + eval-overdue problems |
| 5 Filter funnel per Source | partial | overview flow funnel + per-Source filtered/dropped |
| 10 Human-facing vs internal | partial | timeline marks delivered vs undelivered inputs and replies the API returns |
| 14 Chat vs Session view | partial | Ticket page = chat-side view; Session = link-out |
| 16 Model split | partial | System view shows eval vs executor model (no per-Session model) |
| 17 Noticed but stayed quiet | yes | overview flow (received, filtered, judged vs accepted) + ignore decisions count |
| 19 Trust and credential hygiene | partial | setup status + plain statement that workers run as the operator (ADR-23) |
| 20 Context boundary | yes | System view |
| 3, 4, 6, 7, 8, 9, 11, 12, 13, 15, 18, 21, 22 | future | need new routes or data (article-map table) |

## Design pipeline

1. Typed SAMPLE fixtures (`panel/fixtures/sample.ts`, `satisfies ApiResponse<…>`, typechecked by `tsconfig.fixtures.json`, never imported by `src/`) → exported JSON attached to Claude Design.
2. Seed SystemPrompt + Prompt (design brief + implementation brief) → ChatGPT `gloring` review → Codex P1 → final.
3. Claude Design (geraldyang, UI mockups, design system None, Fable 5.1 max) → hi-fi HTML → export to `research/design/` (strip `data-omelette-injected`).
4. Implementation maps the export's tokens to Tailwind theme variables and its layouts to shadcn compositions.

## Rollback

`rm -rf panel/` restores the repo; nothing else depends on it.
