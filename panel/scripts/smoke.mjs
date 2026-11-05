#!/usr/bin/env node
/**
 * Smoke test for the Superagent Console against the LIVE dsh-superagent service (operator rule: no unit tests).
 *
 * Needs: `pnpm preview` running on 127.0.0.1:5178, the DSH host on 127.0.0.1:3082, and chrome-la with CDP on :9223.
 * Usage: node scripts/smoke.mjs [--out <dir>] [--pause-roundtrip]
 *
 * Checks
 *   1. Proxy: no header -> 403 (host), foreign Origin -> 403 (proxy), with header -> 200.
 *   2. Every route renders in a real browser tab with zero console errors / uncaught exceptions,
 *      at 1440 light, 1440 dark and 390 light, with no page-level horizontal overflow.
 *   3. Live values from GET state / settings appear on Overview and System (agent login, max workers, Source names).
 *   4. Optional pause round-trip, only when nothing is running or queued and no Ticket exists.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PANEL = process.env.PANEL_URL ?? 'http://127.0.0.1:5178'
const HOST = process.env.DSH_SUPERAGENT_URL ?? 'http://127.0.0.1:3082'
const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9223'
const args = process.argv.slice(2)
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : new URL('../.smoke', import.meta.url).pathname
const PAUSE = args.includes('--pause-roundtrip')
mkdirSync(OUT, { recursive: true })

const results = []
const record = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`) }
const api = async (path, init = {}) => {
  const r = await fetch(`${PANEL}/orchestrator/api/${path}`, { ...init, headers: { 'x-orchestrator-request': '1', ...init.headers } })
  return { status: r.status, body: await r.json().catch(() => undefined) }
}

// 1. Proxy and guard checks (fetch from Node sends no Origin unless we set one).
{
  const noHeader = await fetch(`${PANEL}/orchestrator/api/state`)
  record('proxy: request without x-orchestrator-request is refused by the host', noHeader.status === 403, `HTTP ${noHeader.status}`)
  const foreign = await fetch(`${PANEL}/orchestrator/api/state`, { headers: { 'x-orchestrator-request': '1', origin: 'http://localhost:5173' } })
  record('proxy: foreign Origin is refused by the panel proxy', foreign.status === 403, `HTTP ${foreign.status}`)
  const self = await fetch(`${PANEL}/orchestrator/api/state`, { headers: { 'x-orchestrator-request': '1', origin: PANEL } })
  record('proxy: own Origin with header reaches the host', self.status === 200, `HTTP ${self.status}`)
}

const state = (await api('state')).body
const settings = (await api('settings')).body
const tickets = (await api('tickets?state=open&limit=5')).body
const allTickets = (await api('tickets?state=ended&limit=1')).body
const threads = (await api('threads?filter=all&limit=1')).body
if (!state?.setup) { record('live state readable', false, 'GET state failed; is the service up?'); finish() }

// 2-3. Browser checks over CDP.
const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
let seq = 0
const pending = new Map()
const errors = []
ws.onmessage = event => {
  const m = JSON.parse(event.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return }
  if (m.method === 'Runtime.exceptionThrown') errors.push(`exception: ${m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text}`)
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(`console.error: ${m.params.args.map(a => a.value ?? a.description).join(' ')}`)
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(`log: ${m.params.entry.text} ${m.params.entry.url ?? ''}`)
}
const send = (method, params = {}) => new Promise(resolve => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })) })
const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value
const sleep = ms => new Promise(r => setTimeout(r, ms))
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable')
await fetch(`${CDP}/json/activate/${target.id}`)

const firstTicket = tickets?.items?.[0]?.id ?? allTickets?.items?.[0]?.id
const firstThread = threads?.items?.[0]?.key
const routes = [
  ['overview', '/'], ['tickets', '/tickets'], ['tickets-ended', '/tickets?state=ended'], ['threads', '/threads'],
  ['decisions', '/decisions'], ['sources', '/sources'], ['system', '/system'],
  ...(firstTicket ? [['ticket-detail', `/tickets/${encodeURIComponent(firstTicket)}`]] : []),
  ...(firstThread ? [['thread-detail', `/threads/${encodeURIComponent(firstThread)}`]] : []),
]
if (!firstTicket) record('ticket detail page', true, 'SKIPPED: no Ticket exists yet in the live system')
if (!firstThread) record('thread detail page', true, 'SKIPPED: no Thread exists yet in the live system')

const modes = [['1440-light', 1440, 900, 'light'], ['1440-dark', 1440, 900, 'dark'], ['390-light', 390, 844, 'light']]
for (const [mode, width, height, scheme] of modes) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] })
  for (const [name, path] of routes) {
    errors.length = 0
    await send('Page.navigate', { url: PANEL + path })
    await sleep(2500)
    const probe = await evaluate(`(() => ({
      text: document.body.innerText,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      dark: document.documentElement.classList.contains('dark'),
      main: !!document.querySelector('main'),
    }))()`)
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(OUT, `${name}-${mode}.png`), Buffer.from(shot.result.data, 'base64'))
    const label = `${name} @ ${mode}`
    record(`${label}: renders <main>`, probe?.main === true)
    record(`${label}: zero console errors`, errors.length === 0, errors.slice(0, 3).join(' | '))
    record(`${label}: no page-level horizontal overflow`, (probe?.overflow ?? 1) <= 0, `overflow ${probe?.overflow}px`)
    if (scheme === 'dark') record(`${label}: dark theme applied`, probe?.dark === true)
    if (mode === '1440-light' && name === 'overview') {
      record('overview shows live max workers', probe.text.includes(String(state.load.maxWorkers)), `maxWorkers ${state.load.maxWorkers}`)
    }
    if (mode === '1440-light' && name === 'system') {
      const agent = state.setup.accounts?.agent
      record('system shows live agent login', agent ? probe.text.includes(agent) : false, agent)
      record('system shows live repository', probe.text.includes(state.setup.accounts?.repository ?? '\u0000'), state.setup.accounts?.repository)
      record('system shows live eval mode', probe.text.toLowerCase().includes(String(settings.blocks.eval.value.mode).toLowerCase()), settings.blocks.eval.value.mode)
    }
    if (mode === '1440-light' && name === 'sources') {
      const names = ['Feishu', 'GitHub']
      record('sources shows both live Sources', names.every(n => probe.text.includes(n)))
    }
  }
}
await send('Emulation.clearDeviceMetricsOverride')

// 4. Pause round-trip through the UI's own API path (same proxy), guarded.
if (PAUSE) {
  const now = (await api('state')).body
  const anyTicket = (tickets?.items?.length ?? 0) + (allTickets?.items?.length ?? 0) > 0
  if (now.load.running || now.load.queued || anyTicket || now.paused) {
    record('pause round-trip', true, `SKIPPED: running ${now.load.running}, queued ${now.load.queued}, tickets ${anyTicket}, paused ${now.paused}`)
  } else {
    const post = paused => api('executor/pause', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paused }) })
    let on, mid, off, end
    try {
      on = await post(true)
      mid = (await api('state')).body.paused
    } finally {
      off = await post(false) // always restore, even if the middle step failed
      end = (await api('state')).body.paused
    }
    record('pause round-trip: on then off, restored', on.status === 200 && mid === true && off.status === 200 && end === false, `mid ${mid}, end ${end}`)
  }
}

await fetch(`${CDP}/json/close/${target.id}`)
finish()

function finish() {
  const failed = results.filter(r => !r.ok)
  writeFileSync(join(OUT, 'smoke.json'), JSON.stringify({ at: new Date().toISOString(), panel: PANEL, host: HOST, results }, null, 2))
  console.log(`\n${results.length - failed.length}/${results.length} passed; screenshots and smoke.json in ${OUT}`)
  process.exit(failed.length ? 1 : 0)
}
