# Implement: panel-ui

Validation = typecheck + build + smoke (operator rule: no unit tests).

- [x] 1. Scaffold `panel/` (Vite 8 + React 19 + TS + Tailwind 4 + shadcn init); if Vite 8 / plugin-react 6 fail, pin Vite 7. `pnpm -C panel build` green.
- [x] 2. `tsconfig.json` extends root; type-only import of `../src/app/api.ts` typechecks.
- [x] 3. Proxy with Origin guard, `cors: false`, shared by server and preview. Check: curl without header → 403 (host), foreign Origin → 403 (proxy), with header → 200.
- [x] 4. Typed SAMPLE fixtures (`panel/fixtures/`), typechecked; JSON export for Claude Design.
- [x] 5. Seed SystemPrompt + Prompt → ChatGPT (gloring) → Codex P1 → final (`scratch/panel-prompts/`).
- [x] 6. Claude Design run (geraldyang) → export + report under `research/design/`.
- [x] 7. (parallel with 6) API client, queries, mutations, router, shell, empty/error states.
- [x] 8. Apply design: tokens, layouts, components for every view.
- [x] 9. Smoke script + run against `vite preview` + live service; screenshots.
- [x] 10. Codex result review R1 (and R2 if high/medium remain); fix.
- [x] 11. Sepia on `panel/README.md` + `src/copy.ts`; rebuild + smoke.
- [ ] 12. Lessons (Claude Design recipe), Feishu DM, PRD ticks.

Review gates: after 5 (Codex P1), after 9 (Codex R1), after 10 (R2 optional).
Rollback point: `rm -rf panel/`.

## Progress log

- 2026-11-05 01:40 Scaffold on Vite 8.3.5 / plugin-react 6.2.1 / Tailwind 4.3.4 / shadcn 4.23 (style base-nova, Base UI) works; no Vite 7 fallback needed. TypeScript pinned to 6.0.3 (root's version).
- Proxy checks (curl via preview): no header 403 (host), foreign Origin 403 (proxy), own Origin 200, cross-origin preflight 403.
- Fixtures: `panel/fixtures/sample.ts` (16 routes, typechecked by `tsconfig.fixtures.json`), exported JSON under `research/design/fixtures/`, bundled as `attachments/fixtures.json`.
- Prompts: ChatGPT Pro (gloring) rewrite → `scratch/panel-prompts/panel-{system,prompt}.v1.txt`; Codex P1 (`codex-p1.log`): 6 med + 1 low, all applied → `panel-{system,prompt}.txt`; plus own fix (search endpoint exists). Digest extended with flow-counter, pause and search definitions.
- Claude Design project https://claude.ai/design/p/df707cc1-0181-42ad-85b6-bfcfabc572ec sent 02:31:18 UTC (UI mockups, design system None, Fable 5.1 Max, 4 attachments).
- Step 7 dispatched to trellis-implement in parallel.
- 03:28 Claude Design turn ended (57 min, one turn, no nudge). Export cleaned and stored as `research/design/superagent-console-ui.html`; report `claude-design-report.md`.
- Step 7 agent: 8 routes, shell, states, six writes; live smoke 80/80; populated pages checked by fixture interception inside one browser tab only.
- Step 8 agent: tokens/layouts from the export; 142 contrast pairs ≥ AA (`research/design/contrast.md`); fixture probe 1440/390/320 light + 1440 dark: 0 overflow, 0 errors.
- 04:1x Main session: removed unused `@fontsource-variable/geist`; typecheck + build green; `node scripts/smoke.mjs --pause-roundtrip` → **81/81**, pause on (true) then off (false), state confirmed unpaused afterwards.
- Known probe artefact: for Ticket ids without a detail fixture the probe merges a list row into another detail, so `ticket-0` screenshots mix two Tickets. Not a panel bug.
- Codex R1 on the result started.
- Codex R1 (`scratch/panel-prompts/codex-r1.log`): 6 medium, 0 high — write-outcome wording for 5xx, Thread cursor across keys, list paging beyond 1,000, Overview Eval states, "DSH default" without settings, dialog height. All fixed by an implement agent (probe `research/probe/r1-probe.mjs`, 37/37); main session added "Not run: restarting" for an empty-404 write.
- Sepia refactor: README (1 fix: "the project has no unit tests" was wrong — the repo root has vitest; now "the panel has no unit tests, by choice"); copy.ts (3 fixes: offline body density, "may or may not", tautological kind note).
- Codex R2 (`codex-r2.log`, final round): all six R1 fixes FIXED, no regressions; 1 new medium (Decisions stopped at 200). Fixed in main session with `useDecisionPages` (next_offset, dedupe), fixture probe 1440/390 clean. Not re-reviewed by Codex (2-round cap).
- Final: typecheck + build green; `smoke --pause-roundtrip` 81/81 against the live service (pause true → false restored).
