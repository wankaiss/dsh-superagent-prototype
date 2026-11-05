/**
 * SAMPLE responses of the dsh-superagent management API, for design only; never imported by `panel/src`.
 *
 * The live system was empty on 2026-11-05, so these fixtures model one plausible morning on the sandbox:
 * - lin-qa (a GitHub user who is not on the allow-list) opens issue #1 "sum() is wrong for negative numbers", #2 "Add a CLI"
 *   and #5 (a README typo), each mentioning @wankaiss. They are inferred candidates; Eval runs in observe mode, so all three
 *   end as `ignore` Decisions (#5 one that observe mode would have accepted). This is the "noticed but stayed quiet" case.
 * - The operator 杨乾辉 asks the bot in the Feishu group "dsh-superagent sandbox", one topic per request. Each is an explicit
 *   request and becomes a Ticket:
 *   A fix #1 (PR #3, merged, ended) · B implement #2 (working) · C bump CI to Python 3.13 (waiting on a person: blocked)
 *   D type hints (idle, waiting for CI on PR #4) · E CHANGELOG entry (queued) · F rename the package (waiting on a person: a
 *   question) · G README rewrite (stopped by the operator; the stop reply was dropped because the message was recalled).
 * - One request's Eval timed out (`unavailable`, since dismissed), one Eval is running now, and one message from a chat the
 *   Source does not receive was filtered.
 *
 * Shapes follow the view builders in `src/app/views/*` and `src/app/http.ts`; every export is checked with `satisfies` against
 * `src/app/api.ts`. Values that the host omits with a conditional spread are omitted here; keys the host always writes are
 * present, `undefined` included (JSON drops them, as the host's `JSON.stringify` does). The snapshot moment is
 * 2026-11-05T02:59:30Z. Ids are computed the way the host computes them (sha256 of the parts, first 32 hex digits) from
 * made-up Feishu message ids, so they are consistent across files. No value here is a real token.
 */
import type { ApiResponse } from '../../src/app/api.ts'
// Type-only and erased at runtime: brings the DSH service augmentations of `Context` into this program, as
// `panel/tsconfig.json` does by including `../src/index.ts`, so the host files behind `api.ts` type-check.

type StateView = ApiResponse<'GET state'>
type OverviewView = ApiResponse<'GET overview'>
type TicketRow = ApiResponse<'GET tickets'>['items'][number]
type TicketPage = ApiResponse<'GET tickets/:id'>
type ThreadRow = ApiResponse<'GET threads'>['items'][number]
type ThreadPage = ApiResponse<'GET threads/:key'>
type TicketLine = ThreadPage['tickets'][number]
type TicketSummary = ApiResponse<'GET search'>['tickets'][number]
type SearchItem = ApiResponse<'GET search'>['items'][number]
type ThreadFactsView = TicketLine['threads'][number]
type TriggerRow = ThreadPage['timeline'][number]
type DecisionRow = ApiResponse<'GET decisions'>['items'][number]
type Actor = TriggerRow['actor']
type Link = TicketPage['channels'][number]
type Variable = TicketPage['environment'][number]
type SourceRow = ApiResponse<'GET sources'>[number]

// ---------------------------------------------------------------------------------------------------------------------------
// Fixed facts (from the live snapshots of 2026-11-05)

const at = (time: string) => `2026-11-05T${time}.000Z`
const POLICY_VERSION = 'b406b04a698a01418069ec76baa425e9'
const REPOSITORY = 'wankaiss/dsh-superagent-sandbox'
const CHAT = 'oc_37b3a567bce3a9e65953096b75696064'
const CHAT_NAME = 'dsh-superagent sandbox'
const CHAT_URL = `https://applink.feishu.cn/client/chat/open?openChatId=${CHAT}`
const OPERATOR_ID = 'ou_6af531addda67d7c6839104657601f76'
const OPERATOR_NAME = '杨乾辉 (operator)'
const BOT_NAME = '杨乾辉的飞书 CLI'
const WORK = '/home/gerald/.dsh/state/superagent/work'
const issueUrl = (number: number) => `https://github.com/${REPOSITORY}/issues/${number}`
const pullUrl = (number: number) => `https://github.com/${REPOSITORY}/pull/${number}`

/** The host's `preview`: plain text, whitespace collapsed, cut at `length`. Fixture texts carry no Markdown to strip. */
const preview = (text: string, length = 160) => text.replace(/\s+/g, ' ').trim().slice(0, length)

// Feishu message ids (made up) and the Trigger ids the host derives from them: key('feishu', messageId).
const M = {
  A: { message: 'om_x100b34b0de0beef32048157e2d94', trigger: '50da4d9c1f352f8caaffd654653e05ab' },
  A2: { message: 'om_x100b6b5f5c0c8e0a0d108f6f1409', trigger: '7e6b9bd8422514fcd9e00b64124dc58a' },
  A3: { message: 'om_x100bd3080b240a2f81927f99a3ca', trigger: 'c470d9fb2f66501d75d1b5dcb140fc8e' },
  B: { message: 'om_x100ba659b7e72454001edee5a2a3', trigger: 'a921010b8f5ebacbd50ef2d515e47a8f' },
  C: { message: 'om_x100bee442e86bd6e065372ec3562', trigger: '81582518e8f1e08902e323660f2c3286' },
  D: { message: 'om_x100b88ce22bbef322a53cc70eb8f', trigger: '22857fec3810e121a3a4f96853210547' },
  E: { message: 'om_x100be003ee53b6b012b516cfb956', trigger: '6c20fdecf111c8595ce399d1a26dbdfa' },
  F: { message: 'om_x100b7a2ec8fa3a49d81a6a13fd29', trigger: '0d9f8d322f49c7f5da4fb79b5be20336' },
  G: { message: 'om_x100b11beae71d207ddb24b01a1b4', trigger: 'd22aeab1bb7ff4d0f20a3d16ae749419' },
  G2: { message: 'om_x100b213e28178a6f9cdfdd18ffbe', trigger: 'e731ef9d875823c8724103691cb8da19' },
  U: { message: 'om_x100bd724c3b3e513b4472ffce186', trigger: 'cbec90fd51389ec48f08641f3c5d8f67' },
  X: { message: 'om_x100b170ae914418b5c359ac61d28', trigger: '1d0831820064b8089bf41f5bc73d07c7' },
  H: { message: 'om_x100b1f86116721a107ec594195e3', trigger: '10757ee0b7ce27cb163fdfc34eeb4bfb' },
}
// GitHub Trigger ids.
const G = {
  issue1: 'f9edf9cac0262c6cb2b7eb138baa8877', comment1: '1206595b07dd0e677d7cda0ce24dfc56', issue2: '63816bac2a29114d57de9fb10e8c8962',
  issue5: 'e75371a3a9a6bb236a04ccde95979256', ci3: 'eac46a4e49a3e28c5aa007348ed15af8', ci4: '3f443d43d10db1891b7f8b588e8aa00b',
}
// Tickets: id = key('ticket', evalId), decision = key('decision', evalId), first assignment = key('assignment', id, '0').
const T = {
  A: { id: '494111129f662c07b81d267850f4c507', eval: 'bd9c999f42512465ba551390563e571f', decision: '33d1ff1d071b4dcde98059bb7fe6f6bf',
    assignment: '91fbd0d26be46ee686f926ed3f7f2224', name: 'fix-sum-negatives-494111129f66' },
  B: { id: 'dcd835558442310351e48f6ee6c8ca9b', eval: '6da595dee28c1298b2e5775265655dfd', decision: '21c0f593833083c7d99ba564211ec368',
    assignment: 'b820acb462976a88c7ff859848dfd870', name: 'add-cli-dcd835558442' },
  C: { id: '3cdab68cbd1df46204bd5b2df1d742fc', eval: '00cae59b21d12f175cd1ebdf6cadae89', decision: '838cf278e4952964a01fa668d7a568a0',
    assignment: '425901d050bb63877839887a2a7b5d21', name: 'python-313-ci-3cdab68cbd1d' },
  D: { id: '5204e964d95f2980681ae1324273317d', eval: '4f7a1bafc7c20ee920e58e882ef0bb06', decision: '990201b0ab055aa7f9c44afafca1819b',
    assignment: '996b42ea28841b6abbd7fa5183845879', name: 'type-hints-5204e964d95f' },
  E: { id: '5b152809246fd5a30659053091b02f45', eval: 'fb15f6fe4b72581ac81c40c91a3cde57', decision: 'd2f014ce846268d74d591894b4a365da',
    assignment: 'a35a9974c1cc4956f24c6c1988e36b16', name: 'changelog-sum-fix-5b152809246f' },
  F: { id: 'a208bbe09dd28ba8791b958aa5c35d7d', eval: 'becdd963274b5f028fb4cfc225b9b906', decision: '91163478bed1277f9f33531379f21163',
    assignment: 'b774656999489ea4840775581c2a576f', name: 'rename-package-a208bbe09dd2' },
  G: { id: '21c175de34152f1972e7cc43dbda022a', eval: '38fe805bed885568adfcd9ae9e92e26e', decision: '91345aaf342824fda6901c2362121abb',
    assignment: '4a01541a5e8536b9853062d5b6bf6d96', name: 'readme-intro-21c175de3415' },
}
// Decisions without a Ticket of their own, and the running Eval.
const D = {
  issue1: 'f0626db2ec552044d5e33fad3695c896', issue2: '064ff8947257dbea532522c4da80d6c5', issue5: '2e899572330c738876438c3b53ddac27',
  stopG: '8575dd016e6b40aba0c7cd931d32cbfc', unavailable: '68ac4d560ebc4fa64a103ac60a59b88c', evalH: 'e4f4e885901c97b54017011ac61169d0',
}
const INPUT = { A2: '10f5465baabe09522ae9cbaf04d24cad', A3: 'e17c9d4a86bae777b2c661fddd49d866', Aci: '007894f1121b4ece1c89bb1c9b579985',
  Bnote: '808956437f6e38857b492e6b7b500e02', Dci: '3f78c9274a72211c67c09a73d06d4e3c', attentionF: '2c520e5533650d72d6d6df5fe5c4b090' }
const DROPPED_REPLY = 'cbb5be794c53790c5c4763f5b28dd706'
const FAILING_REPLY = 'f34556747c0e85e6203eb3547c8af335'

const topic = (message: string) => `feishu:${CHAT}:${message}`
const K = {
  A: topic(M.A.message), B: topic(M.B.message), C: topic(M.C.message), D: topic(M.D.message), E: topic(M.E.message),
  F: topic(M.F.message), G: topic(M.G.message), U: topic(M.U.message), H: topic(M.H.message),
  issue1: 'github:1', issue2: 'github:2', pr3: 'github:3', pr4: 'github:4', issue5: 'github:5',
}

// ---------------------------------------------------------------------------------------------------------------------------
// Actors and texts

const operator: Actor = { source: 'feishu', id: OPERATOR_ID, name: { zh: OPERATOR_NAME, en: OPERATOR_NAME } }
// GitHub defines no "unnamed" label, so an unlisted login shows as itself.
const linQa: Actor = { source: 'github', id: 'lin-qa', name: { zh: 'lin-qa', en: 'lin-qa' } }
// Automated notices (CI) have an empty id and no name.
const ci: Actor = { source: 'github', id: '' }
const stranger: Actor = { source: 'feishu', id: 'ou_0000sample0000not0a0real0user00', name: { zh: '飞书用户', en: 'Feishu user' } }

const TEXT = {
  A: `@${BOT_NAME} please fix ${issueUrl(1)}: sum() returns the wrong sign when the list has negative numbers.`,
  A2: 'Please also add a test for sum([]) returning 0.',
  A3: 'LGTM, merging now.',
  B: `@${BOT_NAME} please implement #2 Add a CLI: python -m sandbox sum 1 2 3 should print 6, and exit with code 2 when an argument is not a number.`,
  C: `@${BOT_NAME} bump the GitHub Actions workflow to Python 3.13.`,
  D: `@${BOT_NAME} add type hints to stats.py and run mypy in CI.`,
  E: `@${BOT_NAME} add a CHANGELOG entry for the sum() fix.`,
  F: `@${BOT_NAME} rename the package to dsh-sandbox-math.`,
  G: `@${BOT_NAME} rewrite the README intro so it says what the sandbox is for.`,
  G2: `@${BOT_NAME} stop the README rewrite, I will do it myself.`,
  U: `@${BOT_NAME} can you look at the flaky test_parse in CI?`,
  X: `@${BOT_NAME} 帮我看一下这个报错`,
  H: `@${BOT_NAME} also check that the docs for sum() mention negative numbers.`,
  issue1: 'sum() is wrong for negative numbers\n\n@wankaiss sum([-1, -2]) returns 3, expected -3.',
  comment1: 'Also sum([]) raises TypeError instead of returning 0.',
  issue2: 'Add a CLI\n\n@wankaiss it would be nice to have a CLI for this.',
  issue5: 'Typo in README: "teh sandbox"\n\n@wankaiss line 3 of the README says "teh sandbox".',
  ci3: 'CI passed 3/3 on PR #3 at 4b7d0e1\nRead the pull request checks for every check.',
  ci4: 'CI running 2/3 on PR #4 at 9c1e2ab: mypy, pytest (3.12)\nRead the pull request checks for every check.',
}
const TITLE = {
  A: 'Fix sum() for negative numbers', B: 'Add a CLI: python -m sandbox sum', C: 'Bump the CI workflow to Python 3.13',
  D: 'Add type hints to stats.py and run mypy in CI', E: 'Add a CHANGELOG entry for the sum() fix', F: 'Rename the package to dsh-sandbox-math',
  G: 'Rewrite the README intro',
}

const feishuLink: Link = { source: 'feishu', url: CHAT_URL, label: { zh: '飞书消息', en: 'Feishu message' } }

// ---------------------------------------------------------------------------------------------------------------------------
// Thread summaries (threadSummary) and facts (threadFacts)

const chatFacts = { chat: { value: CHAT_NAME } }
interface Latest { actor: Actor; human: boolean; at: string; text: string }
const latest = ({ actor, human, at, text }: Latest) => ({ actor, human, at, preview: preview(text, 120) })

function feishuThread(key: string, first: string, createdAt: string, last: Latest, stage: ThreadRow['stage'],
  tickets: ThreadRow['tickets']): ThreadRow {
  return { key, source: 'feishu', title: preview(first, 80), stage, latest: latest(last), lastAt: last.at, createdAt,
    subscriptions: tickets.length, tickets, evaluating: undefined, pending: 0, pollError: undefined, url: CHAT_URL, facts: chatFacts }
}
const openTicket = (id: keyof typeof T) => ({ id: T[id].id, title: TITLE[id], state: 'open' })
const endedTicket = (id: keyof typeof T) => ({ id: T[id].id, title: TITLE[id], state: 'ended' })

const operatorSaid = (time: string, text: string): Latest => ({ actor: operator, human: true, at: at(time), text })
const thread = {
  A: feishuThread(K.A, TEXT.A, at('01:10:12'), operatorSaid('02:22:15', TEXT.A3), 'dormant', [endedTicket('A')]),
  B: feishuThread(K.B, TEXT.B, at('01:40:08'), operatorSaid('01:40:08', TEXT.B), 'subscribed', [openTicket('B')]),
  C: feishuThread(K.C, TEXT.C, at('02:05:00'), operatorSaid('02:05:00', TEXT.C), 'subscribed', [openTicket('C')]),
  D: feishuThread(K.D, TEXT.D, at('01:55:20'), operatorSaid('01:55:20', TEXT.D), 'subscribed', [openTicket('D')]),
  E: feishuThread(K.E, TEXT.E, at('02:59:05'), operatorSaid('02:59:05', TEXT.E), 'subscribed', [openTicket('E')]),
  F: feishuThread(K.F, TEXT.F, at('02:15:10'), operatorSaid('02:15:10', TEXT.F), 'subscribed', [openTicket('F')]),
  G: feishuThread(K.G, TEXT.G, at('01:20:05'), operatorSaid('01:26:40', TEXT.G2), 'dormant', [endedTicket('G')]),
  U: feishuThread(K.U, TEXT.U, at('02:40:02'), operatorSaid('02:40:02', TEXT.U), 'unsubscribed', []),
  H: { ...feishuThread(K.H, TEXT.H, at('02:58:30'), operatorSaid('02:58:30', TEXT.H), 'evaluating', []),
    evaluating: { id: D.evalH, strength: 'explicit', triggers: 1, startedAt: at('02:58:31'), deadline: at('03:00:31') } },
  issue1: { key: K.issue1, source: 'github', title: '#1 sum() is wrong for negative numbers', stage: 'dormant',
    latest: latest({ actor: linQa, human: true, at: at('01:03:55'), text: TEXT.comment1 }), lastAt: at('01:03:55'),
    createdAt: at('01:02:40'), subscriptions: 1, tickets: [endedTicket('A')], evaluating: undefined, pending: 0,
    pollError: undefined, url: issueUrl(1), facts: { number: { value: '#1' } } },
  issue2: { key: K.issue2, source: 'github', title: '#2 Add a CLI', stage: 'subscribed',
    latest: latest({ actor: linQa, human: true, at: at('01:30:15'), text: TEXT.issue2 }), lastAt: at('01:30:15'),
    createdAt: at('01:30:15'), subscriptions: 1, tickets: [openTicket('B')], evaluating: undefined, pending: 0,
    pollError: undefined, url: issueUrl(2), facts: { number: { value: '#2' } } },
  pr3: { key: K.pr3, source: 'github', title: '#3 Fix sum() for negative numbers and empty lists', stage: 'dormant',
    latest: latest({ actor: ci, human: false, at: at('02:20:00'), text: TEXT.ci3 }), lastAt: at('02:20:00'),
    createdAt: at('01:52:10'), subscriptions: 1, tickets: [endedTicket('A')], evaluating: undefined, pending: 0,
    pollError: undefined, url: pullUrl(3),
    facts: { number: { value: '#3' }, ci: { label: 'CI', value: { zh: '通过', en: 'passed' } } } },
  pr4: { key: K.pr4, source: 'github', title: '#4 Add type hints to stats.py and run mypy in CI', stage: 'subscribed',
    latest: latest({ actor: ci, human: false, at: at('02:45:00'), text: TEXT.ci4 }), lastAt: at('02:45:00'),
    createdAt: at('02:28:00'), subscriptions: 1, tickets: [openTicket('D')], evaluating: undefined, pending: 0,
    pollError: undefined, url: pullUrl(4),
    facts: { number: { value: '#4' }, ci: { label: { zh: 'CI 进行中', en: 'CI running' }, value: '2' } } },
  issue5: { key: K.issue5, source: 'github', title: '#5 Typo in README: "teh sandbox"', stage: 'unsubscribed',
    latest: latest({ actor: linQa, human: true, at: at('02:32:00'), text: TEXT.issue5 }), lastAt: at('02:32:00'),
    createdAt: at('02:32:00'), subscriptions: 0, tickets: [], evaluating: undefined, pending: 0,
    pollError: undefined, url: issueUrl(5), facts: { number: { value: '#5' } } },
} satisfies Record<string, ThreadRow>

const facts = (row: ThreadRow): ThreadFactsView =>
  ({ key: row.key, source: row.source, title: row.title, ...row.url ? { url: row.url } : {}, facts: row.facts })

// ---------------------------------------------------------------------------------------------------------------------------
// Decisions (decisionView)

const noRule = (copy: string, visual: string) => [
  { id: 'copy', name: 'Copy fixes', matched: false, reason: copy },
  { id: 'visual', name: 'Visual fixes', matched: false, reason: visual },
]
function accept(id: keyof typeof T, time: string, thread: string, text: string, reason: string): DecisionRow {
  return { id: T[id].decision, kind: 'accept', outcome: 'accept', reason: [{ code: 'said', values: { text: reason } }], at: at(time),
    strength: 'explicit', ticketId: T[id].id, triggerIds: [M[id].trigger], thread, rules: [], threadTitle: preview(text, 80),
    preview: preview(text), ticketTitle: TITLE[id] }
}
const decision = {
  E: accept('E', '02:59:20', K.E, TEXT.E, 'The operator asked for a CHANGELOG entry for the merged sum() fix.'),
  unavailable: { id: D.unavailable, kind: 'unavailable', outcome: 'unavailable', reason: [{ code: 'timeout' }], at: at('02:42:05'),
    strength: 'explicit', ticketId: undefined, triggerIds: [M.U.trigger], thread: K.U, rules: [], threadTitle: preview(TEXT.U, 80),
    preview: preview(TEXT.U), ticketTitle: undefined },
  issue5: { id: D.issue5, kind: 'ignore', outcome: 'wouldAccept',
    reason: [{ code: 'observed', values: { text: 'Copy fixes: README line 3 "teh sandbox" should read "the sandbox"' } }],
    at: at('02:33:15'), strength: 'inferred', ticketId: undefined, triggerIds: [G.issue5], thread: K.issue5,
    rules: [{ id: 'copy', name: 'Copy fixes', matched: true, reason: 'A typo in existing README wording, with the correct word given.' },
      { id: 'visual', name: 'Visual fixes', matched: false, reason: 'No styling change.' }],
    threadTitle: thread.issue5.title, preview: preview(TEXT.issue5), ticketTitle: undefined },
  F: accept('F', '02:15:31', K.F, TEXT.F, 'The operator asked to rename the package.'),
  C: accept('C', '02:05:18', K.C, TEXT.C, 'The operator asked to move CI to Python 3.13.'),
  D: accept('D', '01:55:41', K.D, TEXT.D, 'The operator asked for type hints in stats.py and a mypy step in CI.'),
  B: accept('B', '01:40:30', K.B, TEXT.B, 'The operator asked to implement issue #2 with a concrete command and exit code.'),
  issue2: { id: D.issue2, kind: 'ignore', outcome: 'ignore', reason: [{ code: 'directionUnsettled' }], at: at('01:31:40'),
    strength: 'inferred', ticketId: undefined, triggerIds: [G.issue2], thread: K.issue2,
    rules: noRule('A feature request, not a wording fix.', 'A new feature, not a styling change.'),
    direction: { implementation_requested: false, target_basis: 'none',
      requires_design_decision: true, evidence: '"it would be nice to have a CLI" names no command, flags or output.' },
    threadTitle: thread.issue2.title, preview: preview(TEXT.issue2), ticketTitle: undefined },
  stopG: { id: D.stopG, kind: 'stop', outcome: 'stop', reason: [{ code: 'humanStop' }], at: at('01:26:52'), strength: 'explicit',
    ticketId: T.G.id, triggerIds: [M.G2.trigger], thread: K.G, rules: [], threadTitle: thread.G.title, preview: preview(TEXT.G2),
    ticketTitle: TITLE.G },
  G: { ...accept('G', '01:20:22', K.G, TEXT.G, ''), reason: [{ code: 'explicitRouted' }] },
  A: accept('A', '01:10:31', K.A, TEXT.A, 'The operator asked to fix issue #1 in the sandbox repository.'),
  issue1: { id: D.issue1, kind: 'ignore', outcome: 'ignore', reason: [{ code: 'noRuleMatched' }], at: at('01:05:10'),
    strength: 'inferred', ticketId: undefined, triggerIds: [G.issue1, G.comment1], thread: K.issue1,
    rules: noRule('A behaviour bug in sum(), not a wording fix.', 'Not a styling change.'),
    threadTitle: thread.issue1.title, preview: `${preview(TEXT.issue1)} / ${preview(TEXT.comment1)}`, ticketTitle: undefined },
} satisfies Record<string, DecisionRow>
const outcome = (row: DecisionRow) => ({ id: row.id, outcome: row.outcome, reason: row.reason, ticketId: row.ticketId })

// ---------------------------------------------------------------------------------------------------------------------------
// Triggers (triggerView)

type Disposition = TriggerRow['disposition']
const settledBy = (row: DecisionRow): Disposition => ({ queued: false, evaluating: false, delivered: false, filtered: undefined,
  fanout: [], handbacks: [], decision: outcome(row) })
const ackedBy = (ticket: string): Disposition => ({ queued: false, evaluating: false, delivered: false, filtered: undefined,
  fanout: [ticket], handbacks: [], decision: undefined })
function trigger(id: string, actor: Actor, human: boolean, time: string, text: string, key: string, disposition: Disposition,
  url?: string, requeue = false): TriggerRow {
  return { id, source: actor.source, actor, human, at: at(time), text, preview: preview(text), url, threads: [key],
    actions: { requeue }, disposition }
}
const trig = {
  issue1: trigger(G.issue1, linQa, true, '01:02:40', TEXT.issue1, K.issue1, settledBy(decision.issue1), issueUrl(1)),
  comment1: trigger(G.comment1, linQa, true, '01:03:55', TEXT.comment1, K.issue1, settledBy(decision.issue1),
    `${issueUrl(1)}#issuecomment-2400000001`),
  A: trigger(M.A.trigger, operator, true, '01:10:12', TEXT.A, K.A, settledBy(decision.A)),
  A2: trigger(M.A2.trigger, operator, true, '01:48:30', TEXT.A2, K.A, ackedBy(T.A.id)),
  A3: trigger(M.A3.trigger, operator, true, '02:22:15', TEXT.A3, K.A, ackedBy(T.A.id)),
  B: trigger(M.B.trigger, operator, true, '01:40:08', TEXT.B, K.B, settledBy(decision.B)),
  E: trigger(M.E.trigger, operator, true, '02:59:05', TEXT.E, K.E, settledBy(decision.E)),
  H: trigger(M.H.trigger, operator, true, '02:58:30', TEXT.H, K.H, { queued: false, evaluating: true, delivered: false,
    filtered: undefined, fanout: [], handbacks: [], decision: undefined }),
}
const searchItem = (row: TriggerRow, threadTitle: string): SearchItem => {
  const { text: _text, ...rest } = row
  return { ...rest, threadTitle }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Tickets (ticketSummary, ticketLine, ticketRow)

const ticketBase = (id: keyof typeof T, createdAt: string, updatedAt: string) => ({ id: T[id].id, title: TITLE[id],
  undelivered: 0, deliveryError: undefined,
  directory: `${WORK}/${T[id].name}`, createdAt: at(createdAt), updatedAt: at(updatedAt) })
const session = (id: keyof typeof T) => `worker-${T[id].id}`

const summary = {
  A: { ...ticketBase('A', '01:10:31', '02:24:31'), strength: 'explicit', state: 'ended', stage: 'ended', actions: { retry: false, stop: false },
    ended: { at: at('02:24:30'), by: 'executor', outcome: 'merged' }, attention: undefined, assignments: 1, inputs: 3,
    sessionId: session('A'),
    summary: `Fixed sum() for negative numbers and empty lists, with tests; opened PR #3 (${pullUrl(3)}).` },
  B: { ...ticketBase('B', '01:40:30', '02:55:10'), strength: 'explicit', state: 'open', stage: 'working', actions: { retry: false, stop: true },
    ended: undefined, attention: undefined, assignments: 1, inputs: 1, sessionId: session('B'),
    summary: 'The CLI parses argv and prints the sum; writing tests for the exit codes next.' },
  C: { ...ticketBase('C', '02:05:18', '02:12:40'), strength: 'explicit', state: 'open', stage: 'person', action: 'blocked',
    note: { text: 'Blocked: the lockfile was generated for Python 3.12.', error: false }, actions: { retry: true, stop: true },
    ended: undefined, attention: undefined, assignments: 1, inputs: 0, sessionId: session('C'),
    summary: 'Blocked: the lockfile was generated for Python 3.12.\nThe workflow pins Python in the matrix and in the setup step. '
      + 'Should I regenerate the lockfile for 3.13, or keep 3.12 in the matrix next to 3.13?' },
  D: { ...ticketBase('D', '01:55:41', '02:45:40'), strength: 'explicit', state: 'open', stage: 'idle', actions: { retry: false, stop: true },
    ended: undefined, attention: undefined, assignments: 1, inputs: 1, sessionId: session('D'),
    summary: `Opened PR #4 (${pullUrl(4)}); waiting for CI to finish.` },
  E: { ...ticketBase('E', '02:59:20', '02:59:20'), strength: 'explicit', state: 'open', stage: 'working', action: 'queued',
    actions: { retry: false, stop: true }, ended: undefined, attention: undefined, assignments: 1, inputs: 0, sessionId: '',
    summary: '' },
  F: { ...ticketBase('F', '02:15:31', '02:18:02'), strength: 'explicit', state: 'open', stage: 'person', action: 'answer',
    note: { text: 'Rename only the distribution name (dsh-sandbox-math), or also the import package sandbox? Renaming the import breaks existing "import sandbox" users.', error: false },
    actions: { retry: false, stop: true }, ended: undefined,
    attention: { id: INPUT.attentionF, question: 'Rename only the distribution name (dsh-sandbox-math), or also the import package sandbox? Renaming the import breaks existing "import sandbox" users.',
      triggerId: M.F.trigger },
    assignments: 1, inputs: 0, sessionId: session('F'), summary: 'Asked whether the import package should be renamed too.' },
  G: { ...ticketBase('G', '01:20:22', '01:26:53'), strength: 'explicit', state: 'ended', stage: 'ended', actions: { retry: false, stop: false },
    ended: { at: at('01:26:52'), by: 'human', outcome: 'stopped' }, attention: undefined, assignments: 1, inputs: 0,
    sessionId: session('G'), summary: '' },
} satisfies Record<keyof typeof T, TicketSummary>

const line = {
  A: { ...summary.A, threads: [facts(thread.issue1), facts(thread.A), facts(thread.pr3)] },
  B: { ...summary.B, threads: [facts(thread.issue2), facts(thread.B)] },
  C: { ...summary.C, threads: [facts(thread.C)] },
  D: { ...summary.D, threads: [facts(thread.D), facts(thread.pr4)] },
  E: { ...summary.E, threads: [facts(thread.E)] },
  F: { ...summary.F, threads: [facts(thread.F)] },
  G: { ...summary.G, threads: [facts(thread.G)] },
} satisfies Record<keyof typeof T, TicketLine>

const row = {
  A: line.A, B: line.B, C: { ...line.C, reply: feishuLink }, D: line.D, E: line.E, F: { ...line.F, reply: feishuLink }, G: line.G,
} satisfies Record<keyof typeof T, TicketRow>

// ---------------------------------------------------------------------------------------------------------------------------
// GET state

export const state = {
  setup: {
    machine: { stateDir: '/home/gerald/.dsh/state/superagent', promptMaxChars: 100000, admissionContextMaxPages: 10,
      admissionContextTimeoutMs: 15000 },
    problem: null, feishuProblem: null,
    accounts: { repository: REPOSITORY, agent: 'wankaiss',
      feishu: { appId: 'cli_aa2c133e05b85bce', brand: 'feishu', botId: 'ou_b1772545ba318d939348679c42f661d2', name: BOT_NAME } },
  },
  load: { running: 1, queued: 1, maxWorkers: 3 },
  masterId: 'orchestrator-b8c705a6238d5dbb90a51de71ead218e',
  paused: false,
  health: {
    runtime: { state: 'ready', detail: 'Orchestrator is ready', at: '2026-11-04T13:03:14.661Z' },
    relay: { state: 'ready', detail: 'Nothing waiting', at: at('02:59:21') },
    notice: { state: 'ready', detail: 'Nothing waiting', at: at('02:55:12') },
    launch: { state: 'ready', detail: '1 Ticket waiting for a worker slot', at: at('02:59:20') },
    delivery: { state: 'ready', detail: 'Nothing waiting', at: at('02:45:20') },
    assessment: { state: 'ready', detail: '1 Eval running', at: at('02:58:31') },
    reply: { state: 'ready', detail: 'Nothing waiting', at: at('02:59:25') },
    evals: { state: 'ready', detail: 'No unavailable Eval in the last hour' },
    models: { state: 'ready', detail: 'No managed Session is waiting on a model budget retry' },
    github: { state: 'ready', detail: '0 notifications; next poll ≥ 60s', at: at('02:59:02') },
    feishu: { state: 'ready', detail: 'Listening for bot events', at: '2026-11-04T13:03:19.533Z' },
    history: { state: 'ready', detail: 'Configured groups and known direct chats recovered', at: at('02:58:42') },
  },
} satisfies StateView

// ---------------------------------------------------------------------------------------------------------------------------
// GET overview (and a variant with problems)

export const overview = {
  problems: [],
  person: [row.F, row.C],
  executor: { running: 1, queued: 1, maxWorkers: 3, idle: 1 },
  // received: Feishu 13 + GitHub 6; filtered: 1 (Feishu, chat_not_allowed); judged: Triggers named by a Decision (13);
  // accepted: accept Decisions (7); evaluating: Threads with an Eval running (1); dropped: replies dropped (1).
  flow: { received: 19, filtered: 1, triggers: 18, judged: 13, accepted: 7, evaluating: 1, dropped: 1 },
  policyVersion: POLICY_VERSION,
} satisfies OverviewView

/**
 * Variant: the same data a few minutes later, as if the operator had not dismissed the unavailable Eval, the running Eval had
 * passed its deadline, a reply kept failing, and GitHub polls were failing. Shows every problem card the overview can carry
 * that this story can produce.
 */
export const overviewWithProblems = {
  ...overview,
  problems: [
    { kind: 'source-error', source: { id: 'github', title: { zh: 'GitHub', en: 'GitHub' },
      health: { name: 'github', state: 'error', detail: '3 polls failed in a row: gh api returned HTTP 502', at: at('03:01:04') } } },
    { kind: 'eval-overdue', thread: thread.H },
    { kind: 'eval-unavailable', decisionId: D.unavailable, thread: thread.U, reason: [{ code: 'timeout' }], triggerId: M.U.trigger },
    { kind: 'outgoing', outgoing: { id: FAILING_REPLY,
      channel: { source: 'feishu', thread: `feishu:${CHAT}`, address: { chatId: CHAT, messageId: M.F.message } },
      text: preview(summary.F.attention.question), attempts: 3,
      error: 'lark-cli exited with code 1: request rate limited, retry later' } },
  ],
} satisfies OverviewView

// ---------------------------------------------------------------------------------------------------------------------------
// GET sources

const feishuSource: SourceRow = {
  id: 'feishu', title: { zh: '飞书', en: 'Feishu' }, installed: true, enabled: true, state: 'ready',
  health: [
    { name: 'feishu', state: 'ready', detail: 'Listening for bot events', at: '2026-11-04T13:03:19.533Z' },
    { name: 'history', state: 'ready', detail: 'Configured groups and known direct chats recovered', at: at('02:58:42') },
  ],
  stats: { received: 13, filtered: 1, lastAt: at('02:59:05') },
  filtered: [{ id: M.X.trigger, at: at('02:10:30'), actor: stranger, preview: preview(TEXT.X, 120), reason: { code: 'chat_not_allowed' } }],
  dropped: [{ id: DROPPED_REPLY, kind: 'reply',
    channel: { source: 'feishu', thread: `feishu:${CHAT}`, address: { chatId: CHAT, messageId: M.G2.message } },
    preview: 'Stopped the README rewrite. Nothing was pushed.', dropped: { at: at('01:27:10'), reason: 'channelGone' },
    ticket: { id: T.G.id, title: TITLE.G }, thread: K.G }],
}
const githubSource: SourceRow = {
  id: 'github', title: { zh: 'GitHub', en: 'GitHub' }, installed: true, enabled: true, state: 'ready',
  health: [{ name: 'github', state: 'ready', detail: '0 notifications; next poll ≥ 60s', at: at('02:59:02') }],
  stats: { received: 6, filtered: 0, lastAt: at('02:45:00') },
  filtered: [],
  dropped: [],
}
export const sources = [feishuSource, githubSource] satisfies ApiResponse<'GET sources'>

// ---------------------------------------------------------------------------------------------------------------------------
// GET threads?filter=all (newest first by last activity)

const threadItems = [thread.E, thread.H, thread.pr4, thread.U, thread.issue5, thread.A, thread.pr3, thread.F, thread.C, thread.D,
  thread.B, thread.issue2, thread.G, thread.issue1]
export const threads = { items: threadItems, total: threadItems.length, next_offset: null } satisfies ApiResponse<'GET threads'>

// ---------------------------------------------------------------------------------------------------------------------------
// GET threads/:key

/** Issue #1: two lin-qa messages batched into one ignored Eval; Ticket A later followed the issue for context. */
export const threadGithubIssue1 = {
  ...thread.issue1,
  url: issueUrl(1),
  context: [T.A.id],
  correlated: [],
  tickets: [line.A],
  decisions: [decision.issue1],
  timeline: [trig.issue1, trig.comment1],
  earlier: null,
} satisfies ThreadPage

/** Ticket A's Feishu topic: the request, then two follow-ups its worker acknowledged. */
export const threadFeishuTopicA = {
  ...thread.A,
  url: CHAT_URL,
  context: [],
  correlated: [],
  tickets: [line.A],
  decisions: [decision.A],
  timeline: [trig.A, trig.A2, trig.A3],
  earlier: null,
} satisfies ThreadPage

// ---------------------------------------------------------------------------------------------------------------------------
// GET decisions?window=24h (newest first)

export const decisions = {
  items: [decision.E, decision.unavailable, decision.issue5, decision.F, decision.C, decision.D, decision.B, decision.issue2,
    decision.stopG, decision.G, decision.A, decision.issue1],
  next_offset: null,
} satisfies ApiResponse<'GET decisions'>

// ---------------------------------------------------------------------------------------------------------------------------
// GET tickets: one page with a Ticket in every stage. The host never returns this exact list (`open` excludes ended Tickets
// and `ended` lists only ended ones); it is merged here so the designer sees every stage side by side.

const ticketItems = [row.E, row.B, row.D, row.A, row.F, row.C, row.G]
export const tickets = { items: ticketItems, total: ticketItems.length, next_offset: null } satisfies ApiResponse<'GET tickets'>

// ---------------------------------------------------------------------------------------------------------------------------
// GET tickets/:id

const mandate = (id: keyof typeof T, message: string, scope: string): TicketPage['mandate'] => ({
  strength: 'explicit', policyVersion: POLICY_VERSION, actor: operator, scope,
  basis: { source: 'feishu', scope: { chatId: CHAT, messageId: message, direct: false, mentioned: true }, row: CHAT,
    sender: OPERATOR_NAME, via: 'addressed', addressed: 'mention' },
})
const basis: TicketPage['basis'] = { facts: [{ name: 'sender', value: OPERATOR_NAME }, { name: 'addressed', value: 'mention' }],
  legacy: false }
const environment = (id: keyof typeof T): Variable[] => [
  { key: 'DSH_SUPERAGENT_DIR', value: `${WORK}/${T[id].name}`, owner: 'executor',
    description: { zh: '这个工单的执行目录；执行器 Session 在其中工作', en: 'This ticket\'s directory; the executor Session works in it' } },
  { key: 'DSH_SUPERAGENT_NAME', value: T[id].name, owner: 'executor',
    description: { zh: '工单的短名，也是执行目录的名字', en: 'The ticket\'s short name, also its directory\'s name' } },
  { key: 'DSH_SUPERAGENT_TICKET', value: T[id].id, owner: 'executor', description: { zh: '工单 id', en: 'The ticket id' } },
  { key: 'DSH_SUPERAGENT_BLOCKED_COMMANDS', value: '', owner: 'executor',
    description: { zh: '这个执行环境禁止调用的命令，以空格分隔；不要运行它们', en: 'Commands blocked in this execution environment, separated by spaces; never run them' } },
  { key: 'DSH_SUPERAGENT_FEISHU_BOT', value: BOT_NAME, owner: 'feishu',
    description: { zh: '飞书机器人；lark-cli 以它行事', en: 'The Feishu bot; lark-cli acts as it' } },
  { key: 'DSH_SUPERAGENT_FEISHU_CHAT', value: CHAT, owner: 'feishu',
    description: { zh: '接下工单的飞书群 chat_id；工单不是从飞书来的时为空', en: 'chat_id of the Feishu chat that started the ticket; empty when the ticket did not start on Feishu' } },
  { key: 'DSH_SUPERAGENT_GITHUB_REPOSITORY', value: REPOSITORY, owner: 'github',
    description: { zh: '这个来源监听的仓库，owner/name。智能体在这里开的 PR，分支最后一段是 DSH_SUPERAGENT_NAME 时（例如 agent/$DSH_SUPERAGENT_NAME）会关联到工单', en: 'The repository this Source watches, as owner/name. A PR the agent opens here from a branch whose last path segment is DSH_SUPERAGENT_NAME (for example agent/$DSH_SUPERAGENT_NAME) binds to the ticket' } },
  { key: 'DSH_SUPERAGENT_GITHUB_ACCOUNT', value: 'wankaiss', owner: 'github',
    description: { zh: '智能体的 GitHub 账号；gh 以它登录，除自动合并外的 GitHub 操作都用 gh，不用其他账号或凭据', en: 'The agent\'s GitHub account. gh is signed in to it; use gh for every GitHub operation except auto-merge, and never another account or credential' } },
  { key: 'DSH_SUPERAGENT_GITHUB_COMMIT_EMAIL', value: '00000000+wankaiss@users.noreply.github.com', owner: 'github',
    description: { zh: '智能体账号的提交邮箱。这里的 git 没有身份：按提示词写明的作者提交，没有写明时用智能体账号和这个邮箱', en: 'Commit email of the agent\'s account. git has no identity here: commit as the author these instructions name, or as the agent\'s account with this email when they name none' } },
  // The Ticket started on Feishu, so the GitHub number and PR head are empty even when the work is about an issue.
  { key: 'DSH_SUPERAGENT_GITHUB_NUMBER', value: '', owner: 'github',
    description: { zh: '接下工单的 Issue 或 PR 编号；工单不是从 GitHub 来的时为空', en: 'Number of the Issue or PR that started the ticket; empty when the ticket did not start on GitHub' } },
  { key: 'DSH_SUPERAGENT_GITHUB_PR_HEAD', value: '', owner: 'github',
    description: { zh: '接下工单的 PR 的 head 引用 refs/pull/<编号>/head；不是 PR 时为空', en: 'Head ref refs/pull/<number>/head of the PR that started the ticket; empty when it was not a PR' } },
]

/** Ticket B, working: its worker is in a turn; one context note from the main Session. */
export const ticketWorking = {
  ...line.B,
  mandate: mandate('B', M.B.message, 'Add a python -m sandbox sum command to wankaiss/dsh-superagent-sandbox that prints the sum of '
    + 'its arguments and exits with code 2 on a non-number, with tests; open a pull request.'),
  basis, paused: false, channels: [feishuLink], decision: decision.B,
  assignments: [{ id: T.B.assignment, state: 'running', createdAt: at('01:40:30'), startedAt: at('01:40:41'),
    deliveredAt: at('01:41:02'), report: { state: 'progress', summary: summary.B.summary, at: at('02:55:10') }, ref: session('B') }],
  inputs: [{ id: INPUT.Bnote, kind: 'note', at: at('01:41:00'), delivered: true,
    text: 'Issue #2 was opened by lin-qa; an earlier Eval ignored it because the CLI\'s commands were not specified. '
      + 'The operator has now specified them.' }],
  threads: [{ ...thread.issue2, context: true }, thread.B],
  environment: environment('B'),
} satisfies TicketPage

/** Ticket C, waiting on a person: its worker reported blocked with a question; Retry is offered. */
export const ticketWaiting = {
  ...line.C,
  mandate: mandate('C', M.C.message, 'Move the GitHub Actions workflow of wankaiss/dsh-superagent-sandbox to Python 3.13 and open a '
    + 'pull request.'),
  basis, paused: false, channels: [feishuLink], decision: decision.C,
  assignments: [{ id: T.C.assignment, state: 'running', createdAt: at('02:05:18'), startedAt: at('02:05:25'),
    deliveredAt: at('02:05:40'), report: { state: 'blocked', summary: summary.C.summary, at: at('02:12:40') }, idleAt: at('02:12:41'),
    ref: session('C'), turnEndedAt: at('02:12:40') }],
  inputs: [],
  threads: [thread.C],
  environment: environment('C'),
} satisfies TicketPage

/** Ticket A, ended: PR #3 merged; it followed issue #1 for context and its own PR. */
export const ticketEndedMerged = {
  ...line.A,
  mandate: mandate('A', M.A.message, 'Fix sum() for negative numbers (issue #1) in wankaiss/dsh-superagent-sandbox, with tests, '
    + 'and open a pull request.'),
  basis, paused: false, channels: [feishuLink], decision: decision.A,
  assignments: [{ id: T.A.assignment, state: 'ended', createdAt: at('01:10:31'), startedAt: at('01:10:40'), endedAt: at('02:24:31'),
    endedReason: 'merged', deliveredAt: at('02:22:20'), idleAt: at('02:22:40'),
    report: { state: 'ready', summary: summary.A.summary, at: at('02:19:30') }, ref: session('A') }],
  inputs: [
    { id: INPUT.A3, kind: 'trigger', triggerId: M.A3.trigger, at: at('02:22:15'), human: true, readAt: at('02:22:20'),
      deliveredTo: T.A.assignment, delivered: true,
      trigger: { id: M.A3.trigger, actor: operator, human: true, preview: preview(TEXT.A3), thread: K.A } },
    { id: INPUT.Aci, kind: 'trigger', triggerId: G.ci3, at: at('02:20:00'), readAt: at('02:20:05'), deliveredTo: T.A.assignment,
      delivered: true, trigger: { id: G.ci3, actor: ci, human: false, preview: preview(TEXT.ci3), thread: K.pr3 } },
    { id: INPUT.A2, kind: 'trigger', triggerId: M.A2.trigger, at: at('01:48:30'), human: true, readAt: at('01:48:41'),
      deliveredTo: T.A.assignment, delivered: true,
      trigger: { id: M.A2.trigger, actor: operator, human: true, preview: preview(TEXT.A2), thread: K.A } },
  ],
  threads: [{ ...thread.issue1, context: true }, thread.A, thread.pr3],
  environment: environment('A'),
} satisfies TicketPage

// ---------------------------------------------------------------------------------------------------------------------------
// GET search?q=sum

export const searchSum = {
  // Tickets whose title contains "sum", newest first (ticketSummary: no threads).
  tickets: [summary.E, summary.B, summary.A],
  // Triggers whose text contains "sum", newest first.
  items: [
    searchItem(trig.E, thread.E.title),
    searchItem(trig.H, thread.H.title),
    searchItem(trig.A2, thread.A.title),
    searchItem(trig.B, thread.B.title),
    searchItem(trig.A, thread.A.title),
    searchItem(trig.comment1, thread.issue1.title),
    searchItem(trig.issue1, thread.issue1.title),
  ],
  // "sum" is not an issue number or URL, so no Thread is named directly.
  threads: [],
} satisfies ApiResponse<'GET search'>

// ---------------------------------------------------------------------------------------------------------------------------
// GET settings, GET policy/history, GET models: the live snapshots of 2026-11-05, unchanged.

// The executor's variables carry a `ticket` flag (EXECUTOR_VARIABLES) that the API type widens away; kept as a separate
// value so the live shape stays intact without an excess-property error.
const executorVariables = [
  {
    "key": "DSH_SUPERAGENT_DIR",
    "ticket": true,
    "description": {
      "zh": "这个工单的执行目录；执行器 Session 在其中工作",
      "en": "This ticket's directory; the executor Session works in it"
    }
  },
  {
    "key": "DSH_SUPERAGENT_NAME",
    "ticket": true,
    "description": {
      "zh": "工单的短名，也是执行目录的名字",
      "en": "The ticket's short name, also its directory's name"
    }
  },
  {
    "key": "DSH_SUPERAGENT_TICKET",
    "ticket": true,
    "description": {
      "zh": "工单 id",
      "en": "The ticket id"
    }
  },
  {
    "key": "DSH_SUPERAGENT_BLOCKED_COMMANDS",
    "description": {
      "zh": "这个执行环境禁止调用的命令，以空格分隔；不要运行它们",
      "en": "Commands blocked in this execution environment, separated by spaces; never run them"
    }
  }
]

export const settings = {
  "policyVersion": "b406b04a698a01418069ec76baa425e9",
  "blocks": {
    "policy": {
      "value": {
        "rules": [
          {
            "id": "copy",
            "name": "Copy fixes",
            "enabled": true,
            "instruction": "Explicit requests to correct a typo, wording, punctuation or existing translation. Preserve product promises and business meaning."
          },
          {
            "id": "visual",
            "name": "Visual fixes",
            "enabled": true,
            "instruction": "Explicit implementation requests for local spacing, alignment, overflow or styling, with a specified target or an objectively established existing standard/correct state to restore. Locating an element or calling it inconsistent, unattractive or hard to understand does not establish a target. Do not invent visual style, information hierarchy, rendering or interaction decisions. No redesign, new interaction or behavior. A known spacing defect does not authorize adjacent undefined restyling; assess only a clearly separable authorized scope. If direction or scope is unsettled, observe only: no acknowledgement, worker or unsolicited question."
          }
        ],
        "sources": {
          "github": {
            "allowed": [
              {
                "id": "wankaiss"
              }
            ],
            "admission": {}
          },
          "feishu": {
            "allowed": [
              {
                "id": "ou_6af531addda67d7c6839104657601f76",
                "name": "杨乾辉 (operator)"
              }
            ],
            "admission": {},
            "syncChat": ""
          }
        }
      },
      "revision": 1
    },
    "eval": {
      "value": {
        "mode": "observe",
        "timeoutSeconds": 120,
        "model": {
          "provider": "deepseek-official",
          "model": "deepseek-flash"
        }
      },
      "revision": 1
    },
    "executor": {
      "value": {
        "model": {
          "provider": "deepseek-official",
          "model": "deepseek-flash"
        },
        "maxWorkers": 3,
        "directory": "",
        "prepare": "git -C /home/gerald/src/dsh-superagent-sandbox fetch --no-tags \"https://github.com/$DSH_SUPERAGENT_GITHUB_REPOSITORY.git\" \"${DSH_SUPERAGENT_GITHUB_PR_HEAD:-HEAD}:refs/dsh-superagent/$DSH_SUPERAGENT_TICKET\" && git -C /home/gerald/src/dsh-superagent-sandbox worktree add -b \"agent/$DSH_SUPERAGENT_NAME\" \"$DSH_SUPERAGENT_DIR\" \"refs/dsh-superagent/$DSH_SUPERAGENT_TICKET\"",
        "blockedCommands": []
      },
      "revision": 1
    }
  },
  "sources": [
    {
      "id": "feishu",
      "kind": "feishu",
      "title": {
        "zh": "飞书",
        "en": "Feishu"
      },
      "description": {
        "zh": "接收下列群和私聊中发给机器人的消息，补收群历史并轮询订阅的线程。",
        "en": "Receives messages to the bot in these chats and direct messages, recovers chat history and polls subscribed Threads."
      },
      "installed": true,
      "value": {
        "enabled": true,
        "config": {
          "cli": "/home/gerald/.local/bin/lark-bot",
          "readPageSize": 20,
          "linkTimeoutMs": 5000,
          "chats": [
            {
              "chatId": "oc_37b3a567bce3a9e65953096b75696064",
              "name": "dsh-superagent sandbox",
              "listen": "mentions"
            }
          ],
          "directMessages": false,
          "otherChats": "none"
        }
      },
      "revision": 1,
      "restarts": [
        "cli"
      ],
      "fields": [
        {
          "key": "cli",
          "type": "text",
          "label": {
            "zh": "机器人的 lark-cli",
            "en": "Bot lark-cli"
          },
          "hint": {
            "zh": "命令名或绝对路径，指向只允许机器人身份（strict mode bot）的 lark-cli 配置；执行器以 lark-cli 调用它。保存时读取应用和机器人，然后重启 dsh-superagent。",
            "en": "A command name or absolute path of a lark-cli configuration that allows only the bot identity (strict mode bot); the Executor calls it as lark-cli. Saving reads the app and the bot, then restarts dsh-superagent."
          }
        },
        {
          "key": "chats",
          "type": "rows",
          "label": {
            "zh": "接收的群",
            "en": "Chats"
          },
          "hint": {
            "zh": "“仅 @”只接收 @ 机器人的消息和已有工单的线程；“全部消息”也接收其余消息，评估可以按规则从中推断工作，需要机器人有读取全部消息的权限。",
            "en": "\"@ only\" receives messages that mention the bot and Threads that have Tickets; \"All\" also receives the rest, from which Eval may infer work under the rules; the bot needs permission to read all messages."
          },
          "columns": [
            {
              "key": "chatId",
              "type": "text",
              "label": {
                "zh": "群",
                "en": "Chat"
              },
              "pattern": "oc_[a-zA-Z0-9]+",
              "choose": {
                "zh": "选择机器人已加入的群",
                "en": "Choose a chat the bot has joined"
              },
              "refresh": {
                "zh": "刷新群列表",
                "en": "Refresh chats"
              }
            },
            {
              "key": "listen",
              "type": "select",
              "label": {
                "zh": "接收",
                "en": "Receive"
              },
              "options": [
                {
                  "value": "mentions",
                  "label": {
                    "zh": "仅 @",
                    "en": "@ only"
                  }
                },
                {
                  "value": "all",
                  "label": {
                    "zh": "全部消息",
                    "en": "All"
                  }
                }
              ]
            }
          ]
        },
        {
          "key": "otherChats",
          "type": "select",
          "label": {
            "zh": "其他群",
            "en": "Other chats"
          },
          "options": [
            {
              "value": "none",
              "label": {
                "zh": "不接收",
                "en": "Not received"
              }
            },
            {
              "value": "mentions",
              "label": {
                "zh": "仅 @",
                "en": "@ only"
              }
            }
          ],
          "hint": {
            "zh": "机器人已加入、但没列在上面的群。“仅 @”接收那里 @ 机器人的消息；谁的消息能发起工作看策略里的准入。",
            "en": "Chats the bot has joined that are not listed above. \"@ only\" receives messages there that mention the bot; whose messages may originate work is the Policy's admission."
          }
        },
        {
          "key": "directMessages",
          "type": "switch",
          "label": {
            "zh": "接收私聊",
            "en": "Direct messages"
          }
        },
        {
          "key": "readPageSize",
          "type": "number",
          "advanced": true,
          "min": 1,
          "max": 50,
          "label": {
            "zh": "每页消息数",
            "en": "Messages per page"
          },
          "hint": {
            "zh": "智能体读取线程和群历史时，每页的消息数。",
            "en": "Messages per page when agents read Threads and chat history."
          }
        },
        {
          "key": "linkTimeoutMs",
          "type": "number",
          "advanced": true,
          "min": 1,
          "max": 90000,
          "label": {
            "zh": "原消息链接的查询时限 / 毫秒",
            "en": "Original message link time limit / ms"
          },
          "hint": {
            "zh": "查询原消息链接最多等待的时间；超时后智能体改为直接读取原消息。",
            "en": "How long to wait for an original message's link; after that, agents read the message itself."
          }
        }
      ],
      "facts": {
        "cli": {
          "zh": "当前机器人 杨乾辉的飞书 CLI",
          "en": "Current bot 杨乾辉的飞书 CLI"
        }
      },
      "labels": {
        "oc_37b3a567bce3a9e65953096b75696064": "dsh-superagent sandbox"
      },
      "policy": {
        "fields": [
          {
            "key": "allowed",
            "type": "rows",
            "label": {
              "zh": "能发起工作的飞书用户",
              "en": "Feishu users who may originate work"
            },
            "columns": [
              {
                "key": "id",
                "type": "text",
                "label": {
                  "zh": "open_id",
                  "en": "open_id"
                },
                "pattern": "ou_[a-zA-Z0-9]+"
              },
              {
                "key": "name",
                "type": "text",
                "label": {
                  "zh": "名字",
                  "en": "Name"
                },
                "optional": true
              }
            ]
          },
          {
            "key": "syncChat",
            "type": "text",
            "pattern": "(oc_[a-zA-Z0-9]+)?",
            "label": {
              "zh": "同步来源群",
              "en": "Sync chat"
            },
            "choose": {
              "zh": "不同步",
              "en": "Do not sync"
            },
            "hint": {
              "zh": "同步时，名单变成这个群里的人：新成员加入，离开的人移除，名字取群里的名字。启动时和点同步时进行。",
              "en": "Syncing makes the list the people in this chat: new members join, people who left are removed, and names follow the chat. It runs at startup and on Sync."
            }
          },
          {
            "key": "bots",
            "type": "rows",
            "label": {
              "zh": "消息可以成为候选的机器人",
              "en": "Bots whose messages may become candidates"
            },
            "hint": {
              "zh": "名单里的机器人在接收的群里发的消息成为推断的候选，交给评估；它们不能发起明确的请求，也不能停止工单。其他机器人的消息不接收。",
              "en": "Messages of a bot on this list, in chats the Source receives, become inferred candidates for an assessment; they never make an explicit request or stop a ticket. Other bots' messages are not admitted."
            },
            "columns": [
              {
                "key": "id",
                "type": "text",
                "label": {
                  "zh": "App ID 或 open_id",
                  "en": "App ID or open_id"
                },
                "pattern": "(cli|ou)_[a-zA-Z0-9]+"
              },
              {
                "key": "name",
                "type": "text",
                "label": {
                  "zh": "名字",
                  "en": "Name"
                },
                "optional": true
              }
            ]
          }
        ],
        "explicit": {
          "zh": "名单内的人 @ 机器人或私聊机器人，总是明确的请求，不需要配置。",
          "en": "Someone on the list who mentions the bot or messages it directly always makes an explicit request; that needs no setting."
        },
        "rows": [
          {
            "id": "oc_37b3a567bce3a9e65953096b75696064",
            "label": "dsh-superagent sandbox",
            "note": {
              "zh": "仅 @",
              "en": "@ only"
            },
            "cells": {
              "listedUnaddressed": false,
              "unlistedAddressed": true,
              "unlistedUnaddressed": false
            }
          },
          {
            "id": "other",
            "label": {
              "zh": "其他群",
              "en": "Other chats"
            },
            "note": {
              "zh": "不接收",
              "en": "Not received"
            },
            "cells": {
              "listedUnaddressed": false,
              "unlistedAddressed": false,
              "unlistedUnaddressed": false
            }
          },
          {
            "id": "direct",
            "label": {
              "zh": "私聊",
              "en": "Direct messages"
            },
            "note": {
              "zh": "不接收",
              "en": "Not received"
            },
            "cells": {
              "listedUnaddressed": false,
              "unlistedAddressed": false,
              "unlistedUnaddressed": false
            }
          }
        ],
        "sync": {
          "label": {
            "zh": "立即同步",
            "en": "Sync now"
          },
          "ready": false,
          "health": undefined
        }
      }
    },
    {
      "id": "github",
      "kind": "github",
      "title": {
        "zh": "GitHub",
        "en": "GitHub"
      },
      "description": {
        "zh": "智能体的 GitHub 账号；接收仓库里发给它的通知、已订阅 Issue 与 PR 的讨论、CI 状态变化和 PR 合并关闭。",
        "en": "The agent's GitHub accounts; receives notifications to it in the repository, discussion on subscribed Issues and PRs, CI changes, and PR merge or close."
      },
      "installed": true,
      "value": {
        "enabled": true,
        "config": {
          "repository": "wankaiss/dsh-superagent-sandbox",
          "cli": "/home/gerald/.local/bin/gh-agent",
          "pollSeconds": 60,
          "failuresBeforeError": 3,
          "observeIssues": false,
          "observePulls": false,
          "observeComments": false,
          "observeCi": false
        }
      },
      "revision": 1,
      "restarts": [
        "repository",
        "cli"
      ],
      "fields": [
        {
          "key": "repository",
          "type": "text",
          "pattern": "[A-Za-z0-9_.\\-]+/[A-Za-z0-9_.\\-]+",
          "label": {
            "zh": "监听的仓库",
            "en": "Repository"
          },
          "hint": {
            "zh": "写作 owner/name。这个来源接收这个仓库的通知和讨论；保存时检查智能体账号能否推送到它，然后重启 dsh-superagent。",
            "en": "Written owner/name. This Source receives the repository's notifications and discussion; saving checks that the agent account can push to it, then restarts dsh-superagent."
          }
        },
        {
          "key": "cli",
          "type": "text",
          "label": {
            "zh": "智能体的 GitHub CLI",
            "en": "Agent GitHub CLI"
          },
          "hint": {
            "zh": "命令名或绝对路径，通常是用 GH_CONFIG_DIR 登录智能体账号的 gh 包装脚本。智能体以它登录的账号行事，执行器以 gh 调用它。保存时检查它登录的账号能否推送到仓库，然后重启 dsh-superagent。",
            "en": "A command name or absolute path, usually a gh wrapper signed in to the agent account through GH_CONFIG_DIR. The agent acts as the account it is signed in to, and the Executor calls it as gh. Saving checks that this account can push to the repository, then restarts dsh-superagent."
          }
        },
        {
          "key": "pollSeconds",
          "type": "number",
          "advanced": true,
          "min": 60,
          "max": 3600,
          "label": {
            "zh": "轮询间隔 / 秒",
            "en": "Polling interval / seconds"
          },
          "hint": {
            "zh": "GitHub 要求更长间隔时以 GitHub 为准。",
            "en": "A longer interval requested by GitHub wins."
          }
        },
        {
          "key": "failuresBeforeError",
          "type": "number",
          "advanced": true,
          "min": 1,
          "max": 20,
          "label": {
            "zh": "连续失败几次后报告异常",
            "en": "Failed polls before reporting an error"
          },
          "hint": {
            "zh": "单次网络中断会在下一次轮询时自动重试，不必报告。",
            "en": "A single network interruption is retried on the next poll and need not be reported."
          }
        },
        {
          "key": "observeIssues",
          "type": "switch",
          "label": {
            "zh": "接收仓库里的新 Issue",
            "en": "Receive new Issues in the repository"
          },
          "hint": {
            "zh": "打开后，没有 @ 智能体的新 Issue 也会收到，由策略的接收表决定是否成为候选。从打开的时候开始，不读以前的。",
            "en": "New Issues that do not mention the agent are received too, and the Policy's admission table decides whether they become candidates. Starts when switched on; earlier ones are not read."
          }
        },
        {
          "key": "observePulls",
          "type": "switch",
          "label": {
            "zh": "接收仓库里的新 PR",
            "en": "Receive new pull requests in the repository"
          },
          "hint": {
            "zh": "打开后，没有 @ 智能体的新 PR 也会收到，由策略的接收表决定是否成为候选。",
            "en": "New pull requests that do not mention the agent are received too, and the Policy's admission table decides whether they become candidates."
          }
        },
        {
          "key": "observeComments",
          "type": "switch",
          "label": {
            "zh": "接收仓库里的评论",
            "en": "Receive comments in the repository"
          },
          "hint": {
            "zh": "打开后，Issue 和 PR 上没有 @ 智能体的评论和代码评论也会收到，由策略的接收表决定是否成为候选。",
            "en": "Comments and review comments on Issues and PRs that do not mention the agent are received too, and the Policy's admission table decides whether they become candidates."
          }
        },
        {
          "key": "observeCi",
          "type": "switch",
          "label": {
            "zh": "接收默认分支的 CI",
            "en": "Receive the default branch's CI"
          },
          "hint": {
            "zh": "打开后，默认分支的 CI 失败和恢复会收到，由策略的接收表决定是否成为候选。",
            "en": "Failures of the default branch's CI, and its recovery, are received, and the Policy's admission table decides whether they become candidates."
          }
        }
      ],
      "facts": {
        "cli": {
          "zh": "当前账号 @wankaiss",
          "en": "Current account @wankaiss"
        }
      },
      "labels": {},
      "policy": {
        "fields": [
          {
            "key": "allowed",
            "type": "rows",
            "label": {
              "zh": "能发起工作的 GitHub 账号",
              "en": "GitHub accounts that may originate work"
            },
            "columns": [
              {
                "key": "id",
                "type": "text",
                "label": {
                  "zh": "账号",
                  "en": "Account"
                },
                "pattern": "[A-Za-z0-9\\-]+"
              }
            ]
          },
          {
            "key": "bots",
            "type": "rows",
            "label": {
              "zh": "评论可以成为候选的机器人",
              "en": "Bots whose comments may become candidates"
            },
            "hint": {
              "zh": "名单里的机器人账号（例如 dependabot[bot]）的评论在来源收到时成为推断的候选，交给评估：评论 @ 了智能体，或者打开了“接收仓库里的评论”。它们不能发起明确的请求，也不能停止工单；其他机器人的评论不接收。",
              "en": "A comment of a bot account on this list, such as dependabot[bot], becomes an inferred candidate for an assessment when the Source receives it: when it mentions the agent, or with Receive comments in the repository on. Such a comment never makes an explicit request or stops a ticket; other bots' comments are not admitted."
            },
            "columns": [
              {
                "key": "id",
                "type": "text",
                "label": {
                  "zh": "账号",
                  "en": "Account"
                },
                "pattern": "[A-Za-z0-9\\-]+(\\[bot\\])?"
              }
            ]
          }
        ],
        "explicit": {
          "zh": "名单里的账号在 Issue 或评论里 @ 智能体的账号。",
          "en": "An account on the list mentions the agent's account in an Issue or a comment."
        },
        "rows": [
          {
            "id": "issues",
            "label": {
              "zh": "新 Issue",
              "en": "New Issues"
            },
            "note": {
              "zh": "仅 @",
              "en": "@ only"
            },
            "cells": {
              "listedUnaddressed": false,
              "unlistedAddressed": true,
              "unlistedUnaddressed": false
            }
          },
          {
            "id": "pulls",
            "label": {
              "zh": "新 PR",
              "en": "New pull requests"
            },
            "note": {
              "zh": "仅 @",
              "en": "@ only"
            },
            "cells": {
              "listedUnaddressed": false,
              "unlistedAddressed": true,
              "unlistedUnaddressed": false
            }
          },
          {
            "id": "comments",
            "label": {
              "zh": "评论",
              "en": "Comments"
            },
            "note": {
              "zh": "仅 @",
              "en": "@ only"
            },
            "cells": {
              "listedUnaddressed": false,
              "unlistedAddressed": true,
              "unlistedUnaddressed": false
            }
          },
          {
            "id": "ci",
            "label": {
              "zh": "默认分支的 CI",
              "en": "Default branch CI"
            },
            "note": {
              "zh": "不接收",
              "en": "Not received"
            },
            "cells": {
              "listedUnaddressed": false,
              "unlistedAddressed": false,
              "unlistedUnaddressed": false
            }
          }
        ]
      }
    }
  ],
  "environment": {
    "root": "/home/gerald/.dsh/state/superagent/work",
    "variables": [
      {
        "owner": "executor",
        "enabled": true,
        "variables": executorVariables
      },
      {
        "owner": "feishu",
        "enabled": true,
        "variables": [
          {
            "key": "DSH_SUPERAGENT_FEISHU_BOT",
            "description": {
              "zh": "飞书机器人；lark-cli 以它行事",
              "en": "The Feishu bot; lark-cli acts as it"
            }
          },
          {
            "key": "DSH_SUPERAGENT_FEISHU_CHAT",
            "description": {
              "zh": "接下工单的飞书群 chat_id；工单不是从飞书来的时为空",
              "en": "chat_id of the Feishu chat that started the ticket; empty when the ticket did not start on Feishu"
            }
          }
        ]
      },
      {
        "owner": "github",
        "enabled": true,
        "variables": [
          {
            "key": "DSH_SUPERAGENT_GITHUB_REPOSITORY",
            "description": {
              "zh": "这个来源监听的仓库，owner/name。智能体在这里开的 PR，分支最后一段是 DSH_SUPERAGENT_NAME 时（例如 agent/$DSH_SUPERAGENT_NAME）会关联到工单",
              "en": "The repository this Source watches, as owner/name. A PR the agent opens here from a branch whose last path segment is DSH_SUPERAGENT_NAME (for example agent/$DSH_SUPERAGENT_NAME) binds to the ticket"
            }
          },
          {
            "key": "DSH_SUPERAGENT_GITHUB_ACCOUNT",
            "description": {
              "zh": "智能体的 GitHub 账号；gh 以它登录，除自动合并外的 GitHub 操作都用 gh，不用其他账号或凭据",
              "en": "The agent's GitHub account. gh is signed in to it; use gh for every GitHub operation except auto-merge, and never another account or credential"
            }
          },
          {
            "key": "DSH_SUPERAGENT_GITHUB_COMMIT_EMAIL",
            "description": {
              "zh": "智能体账号的提交邮箱。这里的 git 没有身份：按提示词写明的作者提交，没有写明时用智能体账号和这个邮箱",
              "en": "Commit email of the agent's account. git has no identity here: commit as the author these instructions name, or as the agent's account with this email when they name none"
            }
          },
          {
            "key": "DSH_SUPERAGENT_GITHUB_NUMBER",
            "description": {
              "zh": "接下工单的 Issue 或 PR 编号；工单不是从 GitHub 来的时为空",
              "en": "Number of the Issue or PR that started the ticket; empty when the ticket did not start on GitHub"
            }
          },
          {
            "key": "DSH_SUPERAGENT_GITHUB_PR_HEAD",
            "description": {
              "zh": "接下工单的 PR 的 head 引用 refs/pull/<编号>/head；不是 PR 时为空",
              "en": "Head ref refs/pull/<number>/head of the PR that started the ticket; empty when it was not a PR"
            }
          }
        ]
      }
    ]
  }
} satisfies ApiResponse<'GET settings'>

export const policyHistory = {
  "current": 5,
  "policyVersion": "b406b04a698a01418069ec76baa425e9",
  "items": [
    {
      "revision": 5,
      "savedAt": "2026-11-04T13:03:29.398Z",
      "source": "panel",
      "block": "policy",
      "policyVersion": "aa2775ff51359634de95c6d7141ada2c",
      "policyChanged": true,
      "notified": [],
      "changes": [
        {
          "code": "sourceRowsAdded",
          "source": "github",
          "part": true,
          "field": "allowed",
          "items": [
            "wankaiss"
          ]
        },
        {
          "code": "sourceRowsAdded",
          "source": "feishu",
          "part": true,
          "field": "allowed",
          "items": [
            "杨乾辉 (operator)"
          ]
        }
      ]
    },
    {
      "revision": 4,
      "savedAt": "2026-11-04T13:03:04.889Z",
      "source": "panel",
      "block": "source:feishu",
      "policyVersion": "9fbbf9a0cf77f5da1785bc7d03d13b0b",
      "policyChanged": false,
      "notified": [],
      "changes": [
        {
          "code": "sourceField",
          "source": "feishu",
          "field": "cli",
          "from": "",
          "to": "/home/gerald/.local/bin/lark-bot"
        },
        {
          "code": "sourceRowsAdded",
          "source": "feishu",
          "field": "chats",
          "items": [
            "mentions"
          ]
        },
        {
          "code": "sourceField",
          "source": "feishu",
          "field": "directMessages",
          "from": true,
          "to": false
        }
      ]
    },
    {
      "revision": 3,
      "savedAt": "2026-11-04T13:02:54.521Z",
      "source": "panel",
      "block": "source:github",
      "policyVersion": "9fbbf9a0cf77f5da1785bc7d03d13b0b",
      "policyChanged": false,
      "notified": [],
      "changes": [
        {
          "code": "sourceField",
          "source": "github",
          "field": "repository",
          "from": "",
          "to": "wankaiss/dsh-superagent-sandbox"
        },
        {
          "code": "sourceField",
          "source": "github",
          "field": "cli",
          "from": "",
          "to": "/home/gerald/.local/bin/gh-agent"
        }
      ]
    },
    {
      "revision": 2,
      "savedAt": "2026-11-04T13:02:39.864Z",
      "source": "panel",
      "block": "executor",
      "policyVersion": "9fbbf9a0cf77f5da1785bc7d03d13b0b",
      "policyChanged": false,
      "notified": [],
      "changes": [
        {
          "code": "executorModel"
        },
        {
          "code": "prepareCommand"
        }
      ]
    },
    {
      "revision": 1,
      "savedAt": "2026-11-04T13:02:37.719Z",
      "source": "panel",
      "block": "eval",
      "policyVersion": "9fbbf9a0cf77f5da1785bc7d03d13b0b",
      "policyChanged": false,
      "notified": [],
      "changes": null
    }
  ]
} satisfies ApiResponse<'GET policy/history'>

export const models = {
  "default": {
    "provider": "deepseek-official",
    "model": "deepseek-flash"
  },
  "routableProviders": [
    "deepseek-official"
  ],
  "groups": [
    {
      "id": "deepseek-official",
      "name": "DeepSeek",
      "models": [
        {
          "id": "deepseek-flash",
          "name": "DeepSeek-V4.1-Flash",
          "reasoning": {
            "efforts": [
              {
                "id": "off",
                "name": "Off",
                "description": "Use for simple tasks that do not need reasoning."
              },
              {
                "id": "low",
                "name": "Low",
                "description": "Prefer for routine or latency-sensitive tasks."
              },
              {
                "id": "high",
                "name": "High",
                "description": "The default balance for most tasks."
              },
              {
                "id": "max",
                "name": "Max",
                "description": "Reserve for the hardest quality-first tasks."
              }
            ],
            "defaultEffort": "high"
          }
        },
        {
          "id": "deepseek-v4-pro",
          "name": "DeepSeek-V4-Pro",
          "description": "Stronger agentic coding, knowledge, and difficult reasoning; suited to complex or quality-critical tasks at higher cost.",
          "reasoning": {
            "efforts": [
              {
                "id": "off",
                "name": "Off",
                "description": "Use for simple tasks that do not need reasoning."
              },
              {
                "id": "low",
                "name": "Low",
                "description": "Prefer for routine or latency-sensitive tasks."
              },
              {
                "id": "high",
                "name": "High",
                "description": "The default balance for most tasks."
              },
              {
                "id": "max",
                "name": "Max",
                "description": "Reserve for the hardest quality-first tasks."
              }
            ],
            "defaultEffort": "high"
          }
        }
      ]
    }
  ],
  "failures": []
} satisfies ApiResponse<'GET models'>
