/**
 * Writes the SAMPLE fixtures as JSON for Claude Design, one file per response, plus `index.json`.
 * Run from anywhere: `node --experimental-strip-types panel/fixtures/export.ts` (Node 24).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as sample from './sample.ts'

const OUT = join(import.meta.dirname, '../../.trellis/tasks/11-04-panel-ui/research/design/fixtures')

/** Concrete request → the fixture that answers it, its file, and what it shows. */
const files: { request: string; route: string; file: string; value: unknown; about: string }[] = [
  { request: 'GET state', route: 'GET state', file: 'state.json', value: sample.state,
    about: 'Setup, accounts, executor load and health board (live values, load updated to the sample story).' },
  { request: 'GET overview', route: 'GET overview', file: 'overview.json', value: sample.overview,
    about: 'Overview with no problems: two Tickets waiting on a person, load, 24 h flow.' },
  { request: 'GET overview (variant)', route: 'GET overview', file: 'overview_with_problems.json', value: sample.overviewWithProblems,
    about: 'Same overview with every problem card this story can produce: source error, overdue Eval, unavailable Eval, failing reply.' },
  { request: 'GET sources', route: 'GET sources', file: 'sources.json', value: sample.sources,
    about: 'Feishu and GitHub Source status, 24 h counts, one filtered message and one dropped reply.' },
  { request: 'GET settings', route: 'GET settings', file: 'settings.json', value: sample.settings,
    about: 'Live settings snapshot, unchanged (read-only in the panel).' },
  { request: 'GET threads?filter=all', route: 'GET threads', file: 'threads_filter_all.json', value: sample.threads,
    about: 'Every Thread, newest activity first, in every Thread stage.' },
  { request: 'GET threads/github:1', route: 'GET threads/:key', file: 'threads_github-1.json', value: sample.threadGithubIssue1,
    about: 'GitHub issue #1: two messages batched into one ignored Eval; a Ticket followed it later for context.' },
  { request: `GET threads/${sample.threadFeishuTopicA.key}`, route: 'GET threads/:key', file: 'threads_feishu-topic-a.json',
    value: sample.threadFeishuTopicA, about: 'Feishu topic of the merged Ticket: the request and two follow-ups.' },
  { request: 'GET decisions?window=24h', route: 'GET decisions', file: 'decisions_window_24h.json', value: sample.decisions,
    about: 'Eval audit, newest first: accept, ignore, would-accept (observe mode), stop and unavailable.' },
  { request: 'GET tickets (all stages)', route: 'GET tickets', file: 'tickets_all_stages.json', value: sample.tickets,
    about: 'One Ticket per stage side by side. The host never returns this exact list: `open` excludes ended Tickets.' },
  { request: `GET tickets/${sample.ticketWorking.id}`, route: 'GET tickets/:id', file: 'tickets_working.json',
    value: sample.ticketWorking, about: 'Ticket in a worker turn (stage working).' },
  { request: `GET tickets/${sample.ticketWaiting.id}`, route: 'GET tickets/:id', file: 'tickets_waiting.json',
    value: sample.ticketWaiting, about: 'Ticket waiting on a person: its worker reported blocked with a question; Retry is offered.' },
  { request: `GET tickets/${sample.ticketEndedMerged.id}`, route: 'GET tickets/:id', file: 'tickets_ended_merged.json',
    value: sample.ticketEndedMerged, about: 'Ended Ticket whose pull request merged.' },
  { request: 'GET policy/history', route: 'GET policy/history', file: 'policy_history.json', value: sample.policyHistory,
    about: 'Live settings history, unchanged.' },
  { request: 'GET search?q=sum', route: 'GET search', file: 'search_sum.json', value: sample.searchSum,
    about: 'Search for "sum": matching Tickets and messages.' },
  { request: 'GET models', route: 'GET models', file: 'models.json', value: sample.models, about: 'Live model catalog, unchanged.' },
]

mkdirSync(OUT, { recursive: true })
for (const { file, value } of files) writeFileSync(join(OUT, file), `${JSON.stringify(value, null, 2)}\n`)
const index = {
  _note: 'SAMPLE data for design only; not served by the app',
  prefix: '/orchestrator/api/',
  routes: Object.fromEntries(files.map(({ request, route, file, about }) => [request, { route, file, about }])),
}
writeFileSync(join(OUT, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
console.log(`Wrote ${files.length} fixtures and index.json to ${OUT}`)
