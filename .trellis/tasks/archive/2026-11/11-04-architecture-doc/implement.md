# Implement: architecture document

Verification: smoke only (`.trellis/spec/guides/lessons.md`).

1. **Freeze inputs** → `scratch/dsh-src/` (SystemArchitecture.md, system-map.md, article-map.md, article.md, local-run prd/design, docs/000-008) + `src.sha256`.
2. **Seed prompts** → `scratch/dsh-prompts/seed-system.txt`, `seed-prompt.txt` (shape per design.md).
3. **Grilling pass** on design + seeds (load `grilling` skill; answer questions via advisor; record decisions in design.md).
4. **ChatGPT review** → open chatgpt.com in chrome-la Default (gloring), verify account, paste `chatgpt-msg.txt`, wait, extract two blocks → `dsh-system.txt`, `dsh-prompt.v1.txt` (+ raw `chatgpt-reply.md`).
5. **Codex review of prompts** (round P1, `codex exec -s read-only`) → apply fixes → `dsh-prompt.txt`, `dsh-system.txt` final; log `codex-p1.log`.
6. **Generate** via Workflow (registry → 4 files → consistency) → `scratch/dsh-build/*.md`.
7. **Codex review of result** round R1 → fix; round R2 only if needed → logs `codex-r1.log`, `codex-r2.log`.
8. **Sepia refactor** on `architecture.md`, `self-improvement.md`.
9. **HTML** → `scratch/dsh-html/review.html`; render + screenshot check in chrome-la headless.
10. **Feishu DM** with path + top decisions; tick PRD criteria.

Rollback: everything lives in `scratch/dsh-*`; delete those dirs to undo. No repo files change.

## Post-E2E follow-up (2026-11-05, grill G7)

- Workflow `arch-runtime-tag-swap` (1 swap agent, 2 adversarial verifiers with over-claim and consistency lenses, 1 fix agent) relabelled claims covered by E2E run 1 (`11-04-local-run/research/e2e.md`) as "RUNTIME-OBSERVED 2026-11-05"; everything else stays "(from code, runtime-unverified)". OPEN-15 narrowed, not closed; GitHub write-back stays dotted.
- Verifiers found 15 problems (e.g. "gate ignores…" naming a component the evidence does not, rc.3 version claimed as tested, §8.4 sequence drawing an Eval the run did not take, Assignment state names claimed observed); 14 fixed, 1 partly (Stage 4 status was already Partial). Dispositions in `consistency-report.md` §7.5.
- `review.html` rebuilt (454,549 bytes, no secrets); 14/14 Mermaid diagrams render at 1440 light/dark and 390, no overflow.
