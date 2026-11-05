# API digest for Superagent Console (design input)

Source: the verified code map of dsh-superagent (system-map §5 and §7, with file:line evidence in the repo). The console uses only the routes marked ✔. SAMPLE responses for each are in `fixtures.json`; today's real (mostly empty) responses are in `live.json`.

## Transport

- Plain HTTP JSON under `/orchestrator/api/`, polled (no WebSocket). Loopback only, **no authentication**. Every request carries `x-orchestrator-request: 1`.
- Errors: 400 `{error, issues[]}` validation; 400 `{error, setup}` setup problem; 400/404 `{error, code, values}` refused or missing; 409 conflicts; 500. A rejected fetch = host down; an empty-body 404 = routes not mounted (starting or restarting).

## Routes

| # | Method and path | Request | Response | Notes and evidence |
|---|---|---|---|---|
| 1 | GET `state` | none | `{setup{machine, problem, feishuProblem, accounts{repository, agent, feishu}\|null}, load{running, queued, maxWorkers}, masterId, paused, health}` | Stable route. Polled by the panel and by the script  |
| 2 | GET `overview` | none | `{problems[kind], person, executor, flow, policyVersion}` | Problem kinds: setup, no-source, no-allowed, executor-paused, runtime-error, source-error, eval-overdue, eval-unavailable, outgoing  |
| 3 | GET `search?q` | q | `{tickets, items, threads}` | Max 10 tickets and 20 items  |
| 4 | GET `sources` | none | `SourceStatusView[]` (state, health, problem, stats, filtered, dropped) | Stable route  |
| 5 | GET `settings` | none | `{policyVersion, blocks{policy, eval, executor: {value, revision}}, sources[], environment{root, variables}}` | Stable route  |
| 6 | POST `sources/:id/labels` | none | `{added: string[]}` | Feishu chat names  |
| 7 | GET `threads?filter&offset&limit` | filter subscribed\|evaluating\|recent\|all | ThreadListView | limit default 20, max 1000  |
| 8 | GET `threads/:key?limit&before&around` | cursor `<at>\|<id>` | ThreadDetailView, `earlier` cursor | limit 50, max 100. 404 "Thread not found"  |
| 9 | POST `threads/:key/unsubscribe` | none | `{removed, thread, context_delivery}` |  |
| 10 | POST `triggers/:id/requeue` | none | `{queued}` | Evaluate again  |
| 11 | GET `decisions?kind&window=24h&offset&limit` | kind as CSV | DecisionListView | limit 30, max 200  |
| 12 | POST `decisions/:id/dismiss` | none | `{dismissed:true}` |  |
| 13 | GET `tickets?state&offset&limit` | state open\|person\|working\|idle\|ended | TicketListView | The panel label "Pending" means `person`  |
| 14 | GET `tickets/:id` | none | TicketPageView, the detail plus environment values | 404 if missing  |
| 15 | POST `tickets/:id/retry` | none | `{retried:true}` | 400 `notRetryable`  |
| 16 | POST `tickets/:id/stop` | none | `{stopped:true}` | Reason `humanStop`  |
| 17 | POST `executor/pause` | `{paused:boolean}` | `{paused}` | The only HTTP way to change `pause`  |
| 18 | PUT `settings/:block` | `{value, revision}`, block policy\|eval\|executor\|source:`<id>` | runtime `{saved, revision, policy_changed, restarting, context_delivery}`; the Api type declares only `{revision, restarting}` | 409 SettingsConflict, 404 unknown Source  |
| 19 | GET `policy/history` | none | `{current, policyVersion, items[revision, savedAt, source, block, policyChanged, notified, changes]}` | Last 30 revisions  |
| 20 | POST `policy-sync/:id` | none | `{policy}` | Sync now  |
| 21 | POST `setup/check` | none | `{restarting:true}` | 400 `setupComplete` when there is nothing to fix  |
| 22 | GET `models` | none | DSH ModelCatalog `{groups[{id, name, models[{id, name, reasoning}]}], default}` |  |
| 23 | GET `prompts?revision&offset` | none | PromptsView `{masterId, current, defaults, sections, skillName, builtin, skillPrefix, parts, defaultChanged, revision, sessions, notificationPending, revisions, next_offset}` | 404 `unknownPromptRevision`  |
| 24 | PUT `prompts` | `{config, baseRevision}` | runtime `{revision, effect:'next-request', context_delivery}`; the Api type omits `effect` | 409 PromptConflict  |
| 25 | POST `prompts/preview` | PromptConfig | `{orchestrator, worker, parts, skills, scope}` |  |


Console use: ✔ rows 1–5, 7–17 (reads plus the allowed writes: 9 unsubscribe, 10 requeue, 12 dismiss, 15 retry, 16 stop, 17 pause), 19, 22, 23 (read-only). Not used: 6, 18, 20, 21, 24, 25 (settings/prompt editing stays in the DSH panel).

## Ticket stage (first matching rule wins)

1. ended → **Ended** (outcome: completed, merged, closed, dropped, stopped; ended by executor or by a person).
2. delivery failed → **person / delivery** (a reply could not be delivered).
3. attention set → **person / answer** (the worker asked a person a question).
4. latest report ready → **person / review**.
5. latest report blocked or failed, and no person has written since → **person / blocked** or **person / failed**.
6. no Assignment yet or Assignment pending → **working / queued**.
7. report waiting or Assignment ended → **idle** ("Waiting for a Trigger").
8. otherwise → **working**.

Retry is allowed only for an open Ticket waiting on a person (blocked/failed) or with a failed delivery. Stop by a person is final.

Filter labels: Open (all not ended), Pending (= person), Working, Waiting for a Trigger (= idle), Ended.

## Other states

- Source state, in priority order: missing, off, error, setup, starting, paused, ready. Health entry: starting, ready, paused, error.
- Thread stage: error, evaluating, queued, subscribed, dormant, unsubscribed.
- Decision kinds: accept, reopen (shown together as "Work"), stop, ignore, unavailable. In `observe` Eval mode, accepts are recorded as would-accept.
- Overview problem kinds: setup, no-source, no-allowed, executor-paused, runtime-error, source-error, eval-overdue, eval-unavailable, outgoing.
- Outbound reply receipt: pending, sent, dropped (channel gone or ignored).

## Overview flow counters (24 h window)

Separate populations; not a conversion funnel.

- `received`, `filtered`: items the Sources received and filtered out (scope, gates) in the window.
- `triggers` = received − filtered.
- `judged`: distinct non-filtered Triggers in the window that have a Decision.
- `accepted`: distinct accept/reopen Decisions associated with Triggers in the window.
- `evaluating`: Evals in progress now. `dropped`: replies that could not be delivered.

## Pause

`POST executor/pause {paused}` suspends new evaluations, worker dispatch and channel delivery; Sources keep recording Triggers. It does not terminate running Workers.

## Search

`GET search?q` returns at most 10 Tickets and 20 Triggers, plus Threads. Not exhaustive.

## Security posture to state honestly

Workers run with full access as the operator's own OS user (architecture ADR-23). The management API has no authentication; the header and Origin checks stop browser cross-site requests, not local processes. Controls in the console are conveniences, not a security boundary.
