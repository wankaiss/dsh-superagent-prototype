// Verification only (design-fidelity pass; v3 of fixture-render2.mjs: full-page shots, DARK=1, PROBLEMS=1, confirm dialog and mobile sheet).
// Usage: PROMPTS=<prompts.json> [DARK=1] [WIDTHS='[1440]'] [ONLY='[[name,path]]'] node fixture-render3.mjs <fixtures dir> <out dir>
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
  if (p.startsWith('tickets/')) { const id = decodeURIComponent(p.slice(8)); if (details[id]) return details[id]; const base = JSON.parse(Object.values(details)[0]); const row = tickets.items.find(t => t.id === id) ?? {}; return JSON.stringify(Object.assign({}, base, row, { assignments: base.assignments, inputs: base.inputs })) }
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
if (process.env.DARK) await send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('theme','dark')" })
else await send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('theme','light')" })
await send('Fetch.enable', { patterns: [{ urlPattern: '*/orchestrator/api/*' }] })
await fetch(`${CDP}/json/activate/${target.id}`)
const ids = tickets.items.map(t => t.id)
const pages = process.env.ONLY ? JSON.parse(process.env.ONLY) : [['overview', '/'], ['tickets', '/tickets'], ['tickets-person', '/tickets?state=person'], ['tickets-ended', '/tickets?state=ended'],
  ['threads', '/threads?filter=all'], ['thread-github1', '/threads/github%3A1'], ['thread-feishu', '/threads/feishu%3Aoc_37b3a567bce3a9e65953096b75696064%3Aom_x100b34b0de0beef32048157e2d94'],
  ['decisions', '/decisions'], ['sources', '/sources'], ['system', '/system'], ...ids.map((id, i) => [`ticket-${i}`, `/tickets/${id}`])]
const results = []
for (const width of (process.env.WIDTHS ? JSON.parse(process.env.WIDTHS) : [1440, 390])) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
  for (const [name, path] of pages) {
    errors.length = 0
    await send('Page.navigate', { url: PANEL + path }); await sleep(1800)
    const probe = await ev(`({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: document.querySelector('h1')?.innerText, bad: [...document.body.innerText.matchAll(/.{0,60}(undefined|NaN|\\[object Object\\]|null).{0,30}/g)].map(m => m[0]).slice(0,5), wide: [...document.querySelectorAll('main *')].filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(-4).map(e => e.tagName + '.' + String(e.className).slice(0, 80) + ' :: ' + (e.textContent||'').slice(0, 60)), failed: document.body.innerText.includes('Could not load'), chain: (()=>{let e=document.querySelector('[role=region]'); const out=[]; while(e&&out.length<12){out.push(e.tagName+'.'+String(e.className).slice(0,50)+' w='+Math.round(e.getBoundingClientRect().width)); e=e.parentElement} return out})() })`)
    results.push({ name, width, ...probe, errors: [...errors] })
    {
      const h = await ev('Math.min(document.documentElement.scrollHeight, 6000)')
      await send('Emulation.setDeviceMetricsOverride', { width, height: Math.max(900, h), deviceScaleFactor: 1, mobile: false }); await sleep(300)
      const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/${name}-${width}${process.env.DARK ? '-dark' : ''}${process.env.PROBLEMS ? '-problems' : ''}.png`, Buffer.from(s.result.data, 'base64'))
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    }
  }
}
errors.length = 0
// Search populated
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: PANEL + '/' }); await sleep(1500)
for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'k', code: 'KeyK', modifiers: 2, windowsVirtualKeyCode: 75 })
await sleep(400); await send('Input.insertText', { text: 'sum' }); await sleep(1500)
const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/search-1440${process.env.DARK ? '-dark' : ''}.png`, Buffer.from(s.result.data, 'base64'))
results.push({ name: 'search', items: await ev('document.querySelectorAll("[cmdk-item]").length'), errors: [...errors] })
// Confirm dialog (opened, never confirmed) and the mobile navigation sheet.
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/${name}${process.env.DARK ? '-dark' : ''}.png`, Buffer.from(r.result.data, 'base64')) }
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(300)
await send('Page.navigate', { url: PANEL + '/tickets/dcd835558442310351e48f6ee6c8ca9b' }); await sleep(1800)
await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Stop…'); b.focus(); b.click(); return 1})()`); await sleep(700)
results.push({ name: 'stop-dialog', focused: await ev('document.activeElement?.textContent'), dialog: await ev('document.querySelector("[role=alertdialog]")?.innerText?.slice(0,400)') })
await shot('confirm-stop-1440')
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(400)
results.push({ name: 'stop-dialog-closed', open: await ev('!!document.querySelector("[role=alertdialog]")'), focusReturned: await ev('document.activeElement?.tagName + ":" + document.activeElement?.textContent?.slice(0,40)') })
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: PANEL + '/' }); await sleep(1800)
await shot('sheet-closed-390')
await ev(`document.querySelector('button[aria-label="Open navigation"]')?.click()`); await sleep(600)
results.push({ name: 'sheet', focused: await ev('document.activeElement?.outerHTML?.slice(0,120)') })
await shot('sheet-open-390')
console.log(results.map(r => JSON.stringify(r)).join('\n'))
await ev("localStorage.removeItem('theme')") // leave the profile on the system theme the smoke expects
await send('Fetch.disable'); await fetch(`${CDP}/json/close/${target.id}`); process.exit(0)
