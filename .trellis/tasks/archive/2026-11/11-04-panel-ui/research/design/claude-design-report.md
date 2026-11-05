# Claude Design report: Superagent Console UI (2026-11-05)

- **Project:** https://claude.ai/design/p/df707cc1-0181-42ad-85b6-bfcfabc572ec (chrome-la Profile 1, account geraldyang, verified by `/api/account` before inserting).
- **Settings:** template "UI mockups" ("Hi-fi design" chip), design system None (cleared the org default Modernist), Fable 5.1 effort Max; the label stayed "Fable 5.1 Max" for the whole turn.
- **Input:** one message of 34,240 characters: `SYSTEMPROMPT (governs this whole task)` + `scratch/panel-prompts/panel-system.txt` + `panel-prompt.txt` (ChatGPT-reviewed, Codex P1 fixes applied) + one closing line limiting the round to Part A. Inserted with `execCommand('insertText')`.
- **Attachments (4):** `api-digest.md`, `fixtures.json` (16 SAMPLE routes), `live.json` (live snapshots of 2026-11-05 ~01:40 UTC), `ui-ideas.md`. All shown under their own names.
- **Turn:** one. Sent 02:31:18 UTC, ended about 03:28 UTC (57 min, `scratch/panel-design/wait.log`). No nudge or "continue" was needed. Claude Design read the inputs, measured token contrast, wrote the specimens in 13 parts, assembled one file, and debugged its preview tool's capture limit with throw-away test pages (deleted at the end). It ended "Created 30 files".
- **Deliverable:** `Superagent Console UI.html`, exported from the serve URL (no `srcmap`, no `_wr`) and stored here as `superagent-console-ui.html`.

## Static checks (this session)

| Check | Result |
|---|---|
| Raw / clean bytes | 376,636 / 356,277 |
| `data-omelette-injected` tags stripped | 2 (1 style, 1 script) |
| `<script>` in clean file | 0 |
| `data-om-id` | 0 |
| ids / duplicates | 105 / 0 |
| Specimens | `s01`–`s14`, with problem-state variants `s03a`–`s03f`, plus `tokens`, `components`, `report` |
| External `href`/`src` | **39** (links to `http://127.0.0.1:3082/`, GitHub issue/PR URLs and Feishu AppLinks taken from the fixtures). A1 asked for no external destinations. Accepted for a design artefact; recorded as a departure. |

## What Claude Design reported

- Relative times in SAMPLE frames use a documented specimen clock (03:00:00 UTC), because `fixtures.json` has no capture time.
- Contract gaps drawn as "—" columns: Asker on the Tickets list, Actor on Decisions. It recommends Part B drop them unless the API supplies the fields. (The implementation agent found the same gaps independently.)
- No supplied Trigger is Requeue-eligible, so Requeue is drawn disabled with its reason.
- Setup-envelope text and a failed-stop host message are absent from the bundle; those containers carry marked placeholders.
- Its preview tool cannot capture a document of ~8,000 elements, so its visual checks ran on part-files built from the same fragments; the assembled file was checked by script (505 anchors resolve, 105 unique ids, no external resources).

## Viewed here

Opened the export as `file://` in chrome-la at 1440 × 900: specimens 02 (Overview busy) and 05 (Ticket detail working) render as designed, with SAMPLE badges, the specimen-clock note and source annotations outside the app frames.
