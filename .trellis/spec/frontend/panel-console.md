# Standalone console (`panel/`) conventions

> Applies to `panel/` only. The in-DSH client (`src/client/`) follows the DSH UI slots and is not covered here.

## Layout and boundaries

- `panel/` is its own pnpm package (React 19, Vite 8, TypeScript 6 strict, Tailwind 4, shadcn/ui on **Base UI**, TanStack Query + Router). Nothing in `src/`, `lib/` or the root config depends on it; `rm -rf panel/` is the rollback.
- `panel/tsconfig.json` **extends the root tsconfig** and includes `../src/index.ts` so host module augmentations resolve. Do not fork compiler options.
- `src/contract.ts` is the **only** module that imports from the host, and only with `import type` (plus the `TICKET_FILTERS` / `THREAD_FILTERS` arrays from `src/app/api.ts`, which has no runtime imports). `pnpm build` runs `scripts/check-dist.mjs`, which fails on `node:` or `@deepseek-ai/` in `dist`.
- `fixtures/` is SAMPLE data for design rounds, typechecked by `tsconfig.fixtures.json`. Never import it from `src/`.

## Transport

- All calls go through `src/api/client.ts` `call(route, request)`. It always sends `x-orchestrator-request: 1`. The Vite proxy (dev and preview, same object) never adds that header, refuses a foreign `Origin` with 403 before proxying, and strips `Origin`/`Referer`. `cors: false` on both servers. Do not weaken any of these.
- Failure kinds: `offline` (fetch rejected, or empty-body 5xx from the proxy), `restarting` (empty-body 404), `setup` / `user` / `validation` (host envelopes), `status`, `malformed`, `cancelled`. A write that ends `offline`, `malformed` or 5xx is **outcome-unconfirmed**, never "refused"; an empty-404 write is "not run".

## Data

- One hook per route in `src/api/queries.ts`; polling via the shared `poll()` (no polling while hidden). Lists page by the host's `next_offset` (`useInfiniteQuery`) and dedupe with `pagedItems`; never grow `limit` past the host cap.
- Distinguish four states everywhere with `QueryView` / `freshness`: loading, initial failure, successful-empty, stale-after-error. Never replace content with a skeleton during a background refetch, never show another key's cached data.
- Eligibility of writes comes from the response's `actions.*` fields, never from client-side rules.

## Writes

- Only six: pause/resume, Ticket stop, Ticket retry, Trigger requeue, Decision dismiss, Thread unsubscribe. All go through `ConfirmAction` (confirm → pending → toast with host answer → invalidate). No automatic retry of writes.

## Copy and design

- Every app-authored string lives in `src/copy.ts`. API text is data.
- Tokens in `src/index.css` come from the Claude Design export (`.trellis/tasks/11-04-panel-ui/research/design/`); status colours use `--status-{ok,info,warn,danger,idle}` with `-foreground` / `-subtle`. Re-measure contrast (`research/design/contrast.mjs`) after changing a token.
- Theme: `next-themes` with `attribute="class"`; dark tokens under `.dark`.

## Verification (operator rule: no unit tests)

`pnpm -C panel typecheck && pnpm -C panel build`, restart preview (kill the pid listening on :5178 — **not** `pkill -f` with a pattern your own shell matches), then `pnpm -C panel smoke` (add `--pause-roundtrip` only when nothing runs, queues or exists as a Ticket). Populated views: `research/probe/fixture-render3.mjs` (browser-tab-only request interception; refuses POSTs).
