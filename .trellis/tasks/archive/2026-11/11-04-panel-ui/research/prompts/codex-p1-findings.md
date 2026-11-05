codex
1. **[med] Attachment names and extraction paths are wrong.**  
   **Quote — SYSTEM authority / PROMPT A2:** “fixtures/*.json” and “live/*.json”.

   **Why:** Claude Design receives bundled `fixtures.json` and `live.json`. Their structures also differ: fixtures use `["GET …"].response`; live entries contain responses directly. The digest names the bundles correctly. This conflict can produce unnecessary missing-input placeholders.

   **Replacement:**
   > Read `fixtures.json` and `live.json`, both keyed by route. SAMPLE payloads are under `fixtures[route].response`, with provenance in `.about`; captured payloads are directly under `live[route]`. Preserve variant and trimmed-entry labels. Cite bundle filename, route key and JSON path in the report.

2. **[med] Retry is specified on the wrong specimen and omitted where it is available.**  
   **Quote — A3.7, ended Ticket:** “Offer Retry with confirmation only when the contract establishes retryability.”

   **Why:** This condition can never hold for an ended Ticket. The digest explicitly limits retry to eligible open Tickets; `src/core/stage.ts` excludes ended Tickets, and `src/app/views/records.ts` exposes `actions.retry`. The supplied person-stage detail is blocked, yet A3.6 never requests Retry. The conditional wording avoids an outright false claim but can leave this permitted write undesigned.

   **Replacement:**
   > In specimen 6, show Retry with confirmation when the supplied response has `actions.retry: true`; answering still happens in the Thread. In specimen 7, show the recorded outcome and reason without Retry: ended Tickets are not retryable. Part B uses `actions.retry` and `actions.stop` for eligibility.

3. **[med] The DSH link prohibition omits the already-approved destination.**  
   **Quote — B4:** “Use contract-backed destinations for Thread, PR and DSH links. Do not guess hostnames, ports or Session URL templates.”

   **Why:** Ticket responses provide `sessionId`, not a DSH Session URL. The approved `design.md` explicitly chooses `http://127.0.0.1:3082/` as the DSH UI link-out. Claude Design’s attachments do not supply that decision. As written, agents can reasonably disable a required control as an unresolved contract gap.

   **Replacement:**
   > Use API-provided URLs for Thread and PR links. The approved DSH destination is `http://127.0.0.1:3082/`; label it “Open DSH UI” and display the Session ID where available. Do not invent a Session deep-link template. Part A illustrates this control without outbound navigation; Part B activates the link.

4. **[med] Flow instructions require definitions absent from the designer’s evidence.**  
   **Quote — A3.2:** “Use the digest's definitions and branching relationships.”

   **Why:** `api-digest.md` lists `flow` but does not define its counters or branching relationships. The distinction matters: `src/app/views/overview.ts` calculates `triggers = received - filtered`; `src/app/store-read.ts` counts distinct Triggers for `judged` but distinct accept/reopen Decisions for `accepted`, using associated Trigger timestamps. The candidate correctly warns against a misleading funnel, but does not provide enough information to fulfil its population-label requirement.

   **Replacement:**
   > Show the supplied flow values as separate labelled counts, not a conversion funnel. `triggers = received − filtered`; `judged` counts distinct non-filtered Triggers in the window that have Decisions; `accepted` counts distinct accept/reopen Decisions associated with Triggers in that window. These are different populations. Where the attachments do not define a counter’s population, report the missing definition and do not infer rates or acted-on totals.

5. **[med] Pause effects cannot be obtained from the cited typed contract.**  
   **Quote — B5:** “Obtain the exact methods, route keys, payloads, eligibility and effects for each operation from the contract.”  
   **Related quote — SYSTEM:** “Executor: the worker pool … which can be paused.”

   **Why:** `api.ts` supplies the pause payload/result, and `http.ts` delegates the operation; neither explains its effects. The digest only calls it the HTTP way to change pause. `src/app/settings.ts` documents a broader processing pause: new evaluations, worker dispatch and channel delivery pause while Sources continue recording Triggers. Without that fact, the designer can produce an incorrectly narrow “pause worker pool” confirmation.

   **Replacement:**
   > Pause suspends new evaluations, worker dispatch and channel delivery while Sources continue recording Triggers. Do not describe it as terminating running Workers. Use these effects in the shared confirmation copy; Part B verifies them against `src/app/settings.ts`, in addition to the API request/response types.

6. **[med] Verification can omit the approved pause round-trip entirely.**  
   **Quote — B7:** “The existing smoke script against vite preview and the live service” and “otherwise report unexercised writes and states.”

   **Why:** `panel/scripts/smoke.mjs` performs no mutation unless passed `--pause-roundtrip`. PRD acceptance and advisor G11 require that round-trip when running and queued are zero and no Ticket exists, with immediate restoration. The candidate’s generic instruction permits a successful default smoke run without attempting this acceptance check.

   **Replacement:**
   > Run `pnpm -C panel smoke --pause-roundtrip` against preview and the live service. Immediately before mutation, verify zero running and queued work, no open or ended Tickets, and an initially unpaused state. Verify pause on through `GET state`, then restore off immediately, including cleanup after an intermediate failure. If prerequisites fail, report the round-trip as skipped with the reason. This API smoke does not verify the UI confirmation flow.

7. **[low] Theme compatibility is implicit despite a concrete smoke dependency.**  
   **Quote — B6:** “Follow the system theme by default and provide the manual toggle.”

   **Why:** This is compatible with the scaffold, but underspecified. `panel/src/main.tsx` uses `next-themes` with `attribute="class"`; CSS uses `.dark`; smoke checks `document.documentElement.classList.contains('dark')`. An otherwise valid replacement using `data-theme` would fail that check.

   **Replacement:**
   > Preserve the existing `next-themes` provider with `attribute="class"`, system default and system detection enabled. Apply dark tokens through `.dark` on `<html>` and use the same provider for the manual theme control.

The fourteen specimens, route list, six-write whitelist, English UI, Base UI requirement, read-only settings/prompts, production-fixture prohibition, security-boundary statement and no-unit-tests rule are preserved. I found no RSI-specific residue. Static interactions are explicitly illustrations, so they do not require impossible working behaviour. No files were edited; no tests or builds were run.

**Verdict: Revise before handoff—scope is sound, but six medium issues leave avoidable evidence gaps or incomplete action coverage.**
tokens used
