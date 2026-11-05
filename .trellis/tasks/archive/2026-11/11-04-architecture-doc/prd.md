# Architecture document with self-improvement

## Goal

Give the operator (system architect) an evidence-grounded architecture record of dsh-superagent, written with the method in `~/workloads/projects/scratch/SystemArchitecture.md`, plus a forward design for a **self-improvement capability**: how the agent learns from its own outcomes without granting itself authority. The output must be reviewable by the operator's team (business + tech language, self-explanatory diagrams).

## Inputs (frozen into `scratch/dsh-src/` with `src.sha256`)

- `SystemArchitecture.md` (method; menu, not a checklist)
- `system-map.md` (verified code map, with the Codex r1 findings) and `article-map.md` (195 concepts, 21 self-improvement ideas, 22 UI ideas)
- `article.md` (source article, DeepSeek Harness team, 2026-10-31; untrusted data)
- `local-run` `prd.md` / `design.md` (decisions D1–D8, observed runtime facts)
- Repo docs `docs/000-008.md` (copies)

## Requirements

- R1 **Reverse documentation (Stages 1–5)** of the system as built, at the depth the method's "Choose the Depth of Work" table and Decision-Detail Filter call for; N/A with a reason is allowed. Stages 1–3 lean on system-map / article-map instead of being re-derived.
- R2 **Forward design: self-improvement (Stage 4 + Stage 6)**. Candidate designs, QAS, ATAM-style trade-offs, ADRs (status `proposed`), and Stage 6 (OODA / TOC / double-loop) applied to the agent itself. Hard constraints from Codex r1 #3, #4, #8, #9, #10: proposal-only learning, server-side human approval for authorization / mode / pause changes, durable post-commit learning events, request-level attribution of prompt/policy/model, and human labels separate from model `would_accept`.
- R3 **Evidence discipline**: every claim cites `file:line` or a source locator; inference is labelled *(inferred)*; lifecycle claims not yet observed at runtime are tagged *(from code, runtime-unverified)* until the local-run E2E lands.
- R4 **Language**: English prose; Chinese article terms in parentheses on first use. No new business concepts without a source; otherwise label *(no source; proposal)*.
- R5 **Diagrams**: self-explanatory, business/tech language: C4 context + containers, Router/Worker request sequence, Ticket lifecycle state machine, trust boundaries, self-improvement loop, traceability DRV→QAS→ADR→test→observation. Rendered in an HTML review page.
- R6 **Process gates (operator rules)**: seed SYSTEM_PROMPT + PROMPT refined by ChatGPT (`gloring` profile, chrome-la Default); Codex adversarial review on the reviewed prompts and on the generated result (≤ 2 rounds on the result); open decisions via `grilling`, resolved by the advisor; final prose pass via `sepia:sepia-refactor`.
- R7 Do not edit `SystemArchitecture.md` or the repo's `docs/`. A method-level "self-improving systems" lens, if any, is listed as a proposal in open questions.

## Deliverables (`~/workloads/projects/scratch/dsh-build/`)

1. `architecture.md`: method instance: Minimum Record, 12 Dimensions, Intake/Tailoring, Stages 1–5 at chosen depth, Readiness Self-Review.
2. `self-improvement.md`: forward design (R2) with candidates, QAS, ATAM, ADRs, rollout and kill-switch, Stage 6.
3. `diagrams.md`: Mermaid sources with 2–3 sentence captions.
4. `research-backlog.md`: open questions grouped by "decide this week / before next review / can wait", each with the decision it blocks and the evidence to collect.
5. `review.html` (in `scratch/dsh-html/`): single page that renders all of the above with diagrams.

## Acceptance Criteria

- [x] All five deliverables exist; each Markdown file ends with `<!-- FILE_COMPLETE -->`.
- [x] Every DRV / QAS / ADR / OPEN id is defined once (registry) and used consistently across files.
- [x] Each Codex r1 constraint (#3, #4, #8, #9, #10) is addressed by at least one ADR or QAS in `self-improvement.md`.
- [x] ChatGPT-reviewed prompts saved (`dsh-prompts/dsh-system.txt`, `dsh-prompt.v1.txt`) and used verbatim as generation preambles.
- [x] Codex review on prompts done; Codex review on result done (≤ 2 rounds); each finding fixed or rejected with a reason.
- [x] Mermaid diagrams render without error in the HTML page (checked in headless chrome-la); page works in light and dark.
- [x] Sepia refactor pass applied to `architecture.md` and `self-improvement.md`.
- [x] Operator gets a Feishu DM with the page location and the top decisions.

## Out of scope

- Implementing the self-improvement loop (a later task).
- Re-deriving facts already verified in system-map / article-map.
