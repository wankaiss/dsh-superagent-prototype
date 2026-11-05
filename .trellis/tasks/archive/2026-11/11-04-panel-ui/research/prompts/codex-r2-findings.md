codex
### A. R1 fix verification

| # | Status | Evidence |
|---|---|---|
| 1. Write-error classification | **FIXED** | [client.ts:33](/home/gerald/workloads/dsh-superagent-prototype/panel/src/api/client.ts:33) treats 5xx as unconfirmed. [confirm-action.tsx:24](/home/gerald/workloads/dsh-superagent-prototype/panel/src/components/confirm-action.tsx:24) distinguishes server failures and restarting. This covers pause committing settings before delivery completes. |
| 2. Thread cursor reset | **FIXED** | [thread.tsx:119](/home/gerald/workloads/dsh-superagent-prototype/panel/src/routes/thread.tsx:119) keys `ThreadBody` by Thread identity, resetting `before`. Polling the same Thread does not remount it. |
| 3. Tickets/Threads pagination | **FIXED** | [queries.ts:74](/home/gerald/workloads/dsh-superagent-prototype/panel/src/api/queries.ts:74) and [queries.ts:109](/home/gerald/workloads/dsh-superagent-prototype/panel/src/api/queries.ts:109) consume `next_offset` with bounded pages; `pagedItems` deduplicates identities. Matches the host’s [records.ts:14](/home/gerald/workloads/dsh-superagent-prototype/src/app/views/records.ts:14) pagination contract. |
| 4. Overview Eval visibility | **FIXED** | [overview.tsx:90](/home/gerald/workloads/dsh-superagent-prototype/panel/src/routes/overview.tsx:90) handles both queries independently through `freshness` and notices—equivalent states, though not literally `QueryView`. Queued entries render at line 134; truncation links at line 143. |
| 5. Model settings uncertainty | **FIXED** | [ticket.tsx:211](/home/gerald/workloads/dsh-superagent-prototype/panel/src/routes/ticket.tsx:211) wraps the Model value in settings `QueryView`, including stale handling. Default appears only after a successful read establishes no configured model. |
| 6. Confirmation overflow | **FIXED** | [alert-dialog.tsx:55](/home/gerald/workloads/dsh-superagent-prototype/panel/src/components/ui/alert-dialog.tsx:55) bounds popup height; [confirm-action.tsx:78](/home/gerald/workloads/dsh-superagent-prototype/panel/src/components/confirm-action.tsx:78) scrolls the body; the footer is nonshrinking at [alert-dialog.tsx:88](/home/gerald/workloads/dsh-superagent-prototype/panel/src/components/ui/alert-dialog.tsx:88). |

### B. Regressions

No verified high/medium regression found. Pagination keys are filter-specific and separate from count/Overview keys; deduplication protects list row keys. The write-outcome change preserves connection-banner error classification.

### C. Remaining findings

1. **MEDIUM — Decisions pagination stops at 200 despite available results.**  
   **Evidence:** [decisions.tsx:83](/home/gerald/workloads/dsh-superagent-prototype/panel/src/routes/decisions.tsx:83), [queries.ts:130](/home/gerald/workloads/dsh-superagent-prototype/panel/src/api/queries.ts:130).  
   **Failure scenario:** With 201 or more matching Decisions in the last 24 hours, “Show more” increases the limit to 200, then disappears while `next_offset` remains non-null. Older matching Decisions cannot be reached through this audit view. The host supports subsequent offsets at [http.ts:182](/home/gerald/workloads/dsh-superagent-prototype/src/app/http.ts:182); 200 is its per-request limit. The disclosure acknowledges truncation but provides no continuation.  
   **Fix:** Consume `next_offset` using bounded pages and deduplicate by Decision ID, retaining the filter and time-window query parameters.

Typecheck passed. No files edited, unit tests run, or API writes sent. Findings are code-verified; browser interactions were not exercised.

**Verdict: All six R1 fixes pass; R2 needs changes for one remaining medium Decisions-pagination issue.**
tokens used
