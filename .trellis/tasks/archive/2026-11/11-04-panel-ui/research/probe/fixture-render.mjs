// Verification only: answers this tab's API calls with SAMPLE fixture JSON (CDP Fetch) to render populated views.
// Nothing is written to the live service; POSTs are refused with 418 so no write can happen.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const FIX = process.argv[2], OUT = process.argv[3]
mkdirSync(OUT, { recursive: true })
const load = f => readFileSync(`${FIX}/${f}`, 'utf8')
const tickets = JSON.parse(load('tickets_all_stages.json'))
const details = Object.fromEntries(['tickets_working.json', 'tickets_waiting.json', 'tickets_ended_merged.json'].map(f => { const t = JSON.parse(load(f)); return [t.id, JSON.stringify(t)] }))
const route = url => {
  const u = new URL(url); const p = u.pathname.replace('/orchestrator/api/', '')
  if (p === 'state') return load('state.json')
  if (p === 'overview') return load(process.env.PROBLEMS ? 'overview_with_problems.json' : 'overview.json')
  if (p === 'sources') return load('sources.json')
  if (p === 'settings') return load('settings.json')
  if (p === 'models') return load('models.json')
  if (p === 'policy/history') return load('policy_history.json')
  if (p === 'search') return load('search_sum.json')
  if (p === 'decisions') return load('decisions_window_24h.json')
  if (p === 'prompts') return readFileSync(process.env.PROMPTS, 'utf8')
  if (p === 'threads') return load('threads_filter_all.json')
  if (p.startsWith('threads/')) { const key = decodeURIComponent(p.slice(8)); return key === 'github:1' ? load('threads_github-1.json') : load('threads_feishu-topic-a.json') }
  if (p === 'tickets') { const s = u.searchParams.get('state'); const items = tickets.items.filter(t => s === 'open' ? t.state === 'open' : s === 'ended' ? t.stage === 'ended' : t.stage === s); return JSON.stringify({ items, total: items.length, next_offset: null }) }
  if (p.startsWith('tickets/')) { const id = decodeURIComponent(p.slice(8)); return details[id] ?? JSON.stringify(Object.assign({}, JSON.parse(Object.values(details)[0]), tickets.items.find(t => t.id === id) ?? {})) }
  return null
}
const CDP = 'http://127.0.0.1:9223', PANEL = 'http://127.0.0.1:5178'
const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(r => { ws.onopen = r })
let seq = 0; const pending = new Map(); const errors = []
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return }
  if (m.method === 'Fetch.requestPaused') {
    const { request, requestId } = m.params
    const body = request.method === 'GET' ? route(request.url) : null
    if (body === null) send('Fetch.fulfillRequest', { requestId, responseCode: request.method === 'GET' ? 404 : 418, responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: Buffer.from('{"error":"not in fixture probe"}').toString('base64') })
    else send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: Buffer.from(body).toString('base64') })
  }
  if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 400))
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 400)) }
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value
const sleep = ms => new Promise(r => setTimeout(r, ms))
await send('Runtime.enable'); await send('Page.enable')
await send('Fetch.enable', { patterns: [{ urlPattern: '*/orchestrator/api/*' }] })
await fetch(`${CDP}/json/activate/${target.id}`)
const ids = tickets.items.map(t => t.id)
const pages = [['overview', '/'], ['tickets', '/tickets'], ['tickets-person', '/tickets?state=person'], ['tickets-ended', '/tickets?state=ended'],
  ['threads', '/threads?filter=all'], ['thread-github1', '/threads/github%3A1'], ['thread-feishu', '/threads/feishu%3Aoc_37b3a567bce3a9e65953096b75696064%3Aom_x100b34b0de0beef32048157e2d94'],
  ['decisions', '/decisions'], ['sources', '/sources'], ['system', '/system'], ...ids.map((id, i) => [`ticket-${i}`, `/tickets/${id}`])]
const results = []
for (const width of [1440, 390]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
  for (const [name, path] of pages) {
    errors.length = 0
    await send('Page.navigate', { url: PANEL + path }); await sleep(1800)
    const probe = await ev(`({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: document.querySelector('h1')?.innerText, bad: (document.body.innerText.match(/undefined|NaN|\\[object Object\\]|null/g) ?? []).slice(0,5), failed: document.body.innerText.includes('Could not load') })`)
    results.push({ name, width, ...probe, errors: [...errors] })
    if (['overview', 'ticket-0', 'ticket-2', 'thread-github1', 'sources', 'decisions'].includes(name)) {
      const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); writeFileSync(`${OUT}/${name}-${width}.png`, Buffer.from(s.result.data, 'base64'))
    }
  }
}
// Search populated
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: PANEL + '/' }); await sleep(1500)
for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'k', code: 'KeyK', modifiers: 2, windowsVirtualKeyCode: 75 })
await sleep(400); await send('Input.insertText', { text: 'sum' }); await sleep(1500)
const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/search-1440.png`, Buffer.from(s.result.data, 'base64'))
results.push({ name: 'search', items: await ev('document.querySelectorAll("[cmdk-item]").length'), errors: [...errors] })
console.log(results.map(r => JSON.stringify(r)).join('\n'))
await send('Fetch.disable'); await fetch(`${CDP}/json/close/${target.id}`); process.exit(0)
