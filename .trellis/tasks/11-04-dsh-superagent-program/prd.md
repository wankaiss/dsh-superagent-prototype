# dsh-superagent: local run, architecture, UI

## Goal

Turn the published dsh-superagent research prototype into something the operator (gerald) can run, reason about and operate locally: capture the source article, run the bundle on DSH, document its architecture with a self-improvement loop, and give it a modern TypeScript UI.

## Child tasks (task map)

| Order | Child | Deliverable | Depends on |
|---|---|---|---|
| 1 | `11-04-article-capture` | Research notes from the WeChat article, mapped to `docs/000-008` | — |
| 2 | `11-04-local-run` | Prototype running on DSH locally, `pnpm check` green, panel reachable | — (can run in parallel with 1) |
| 3 | `11-04-architecture-doc` | `SystemArchitecture.md` instance for dsh-superagent + self-improvement section + diagrams | 1, 2 |
| 4 | `11-04-panel-ui` | Standalone TypeScript UI for the panel | 2, 3 |

## Decisions already made (2026-11-04)

- **DSH is required.** `src/` imports ~18 `@deepseek-ai/dsh-*` packages and runs as a cordis plugin inside the DSH host; a no-DSH host would be a rewrite. Installed `@deepseek-ai/dsh@0.2.1-rc.3` globally (the version `docs/006-deployment.md` pins; satisfies `engines.dsh ^0.2.1-alpha.2`), with native scripts allowed for `node-pty`, `koffi`, `@deepseek-ai/dsh-subprocess-local`.
- **LLM provider:** DeepSeek official API, model `deepseek-flash` (the API's `/models` returns `deepseek-flash`, `deepseek-v4-pro`; `~/.dsh/settings.yaml` currently defaults to `deepseek-v4-flash`, which must be reconciled in `local-run`). Key lives in `~/.config/dsh-superagent/env` (mode 600) as `DEEPSEEK_API_KEY`; never committed.
- **Feishu channel:** progress updates go via `lark-cli --profile personal` **bot** identity as a DM to the operator (open_id `ou_6af531addda67d7c6839104657601f76`, chat `oc_f8be1640428c4b3fdb10497e22d5ac0e`). The personal profile's *user* token is expired; bot identity is sufficient for DMs. If dsh-superagent's Feishu Source is enabled, it reuses this personal app.
- **GitHub:** repo is public and already cloned; no token needed for reading. Use `gh` CLI's own login for any write.

## Process rules (from operator)

- Prompts for substantive generation are refined via ChatGPT (`gloring` Chrome profile) returning a reviewed `SystemPrompt` + `Prompt`; Claude chat/Claude Design via `geraldyang` profile.
- `/codex:adversarial-review` on prompts and on generated results, at most 2 rounds per result.
- `/grill-me` (grilling) for open questions; decisions escalate to the advisor.
- `/sepia:sepia-refactor` on prose deliverables.
- Headless Chrome: use `chrome-la`.
- Diagrams must be self-explanatory in business/tech language.

## Acceptance Criteria (cross-child)

- [ ] Every child archived with its own acceptance criteria met.
- [ ] Architecture doc references the running system's real behavior (from `local-run`), not only the article.
- [ ] UI talks to the locally running prototype, not mock data only.
- [ ] No secret (DeepSeek key, GitHub token, Feishu secret) appears in git history.
- [ ] Operator received a Feishu update at each child's completion.

## Status (2026-11-04)

- `11-04-article-capture`: done (article.md from operator-saved page; article-map.md 195 concepts). Not archived/committed (commit awaits operator).
- `11-04-local-run`: running; status 0, all health ready. **Pending:** E2E Ticket from the operator's @bot message in group `oc_37b3a567…`.
- `11-04-architecture-doc`: done; `scratch/dsh-html/review.html`. **Follow-up after E2E:** re-run the consistency agent with the observed Ticket timeline to swap "(from code, runtime-unverified)" tags (grill G7); keep task open until then. The parent criterion "references the running system's real behavior" is met for settings/health/API, pending for the Ticket lifecycle.
- `11-04-panel-ui`: not started; inputs ready (system-map §7, article-map 22 UI ideas, architecture record).
