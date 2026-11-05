// Verification only for the Codex R1 fixes. Answers this browser tab's API calls from SAMPLE fixtures (CDP Fetch);
// every non-GET is refused with 418, so nothing reaches the live service.
// Usage: node r1-probe.mjs <fixtures dir> <out dir>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const FIX = process.argv[2], OUT = process.argv[3]
mkdirSync(OUT, { recursive: true })
const load = f => JSON.parse(readFileSync(`${FIX}/${f}`, 'utf8'))
const all = load('threads_filter_all.json')
const ticketsFx = load('tickets_all_stages.json')
const mode = { evalsFail: false, settingsFail: false, longTitle: false }
const LONG = 'A very long Thread title that keeps going. '.repeat(90)
const requests = []

// Evaluating: four newer queued Threads, then one running Eval; the host reports 8 in total.
const running = all.items.find(t => t.evaluating)
const queued = all.items.filter(t => !t.evaluating).slice(0, 4).map((t, i) => ({ ...t, key: `queued:${i}`, stage: 'queued', pending: i + 1, evaluating: undefined }))
const evaluating = { items: [...queued, running], total: 8, next_offset: 5 }
// 120 open Tickets, paged honestly by offset/limit.
const base = ticketsFx.items.find(t => t.state === 'open')
const many = Array.from({ length: 120 }, (_, i) => ({ ...base, id: `t${String(i).padStart(3, '0')}`, title: `Paged Ticket ${i}` }))

const threadDetail = (key, before) => {
  const d = load('threads_github-1.json')
  if (key === 'github:1') return { ...d, title: mode.longTitle ? LONG : d.title, earlier: before ? null : 'cursorA|x', correlated: [{ key: 'github:2', title: 'Correlated B' }] }
  return { ...load('threads_feishu-topic-a.json'), key, title: `Thread ${key}`, earlier: null }
}
const route = url => {
  const u = new URL(url); const p = u.pathname.replace('/orchestrator/api/', ''); const q = u.searchParams
  if (p === 'state') return [200, load('state.json')]
  if (p === 'overview') return [200, load('overview.json')]
  if (p === 'sources') return [200, load('sources.json')]
  if (p === 'settings') return mode.settingsFail ? [500, { error: 'settings store unavailable (probe)' }] : [200, load('settings.json')]
  if (p === 'models') return [200, load('models.json')]
  if (p === 'policy/history') return [200, load('policy_history.json')]
  if (p === 'decisions') return [200, load('decisions_window_24h.json')]
  if (p === 'threads') {
    if (q.get('filter') === 'evaluating') return mode.evalsFail ? [500, { error: 'thread store unavailable (probe)' }] : [200, evaluating]
    return [200, all]
  }
  if (p.startsWith('threads/')) return [200, threadDetail(decodeURIComponent(p.slice(8)), q.get('before'))]
  if (p === 'tickets') {
    const s = q.get('state'), offset = Number(q.get('offset') ?? 0), limit = Number(q.get('limit') ?? 20)
    const items = s === 'open' ? many : []
    return [200, { items: items.slice(offset, offset + limit), total: items.length, next_offset: offset + limit < items.length ? offset + limit : null }]
  }
  if (p.startsWith('tickets/')) return [200, load('tickets_working.json')]
  return null
}

const CDP = 'http://127.0.0.1:9223', PANEL = 'http://127.0.0.1:5178'
const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(r => { ws.onopen = r })
let seq = 0; const pending = new Map(); const errors = []
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
const reply = (requestId, code, value) => send('Fetch.fulfillRequest', { requestId, responseCode: code,
  responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: Buffer.from(JSON.stringify(value)).toString('base64') })
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return }
  if (m.method === 'Fetch.requestPaused') {
    const { request, requestId } = m.params
    requests.push(`${request.method} ${request.url.replace(PANEL, '')}`)
    const answer = request.method === 'GET' ? route(request.url) : null
    if (!answer) reply(requestId, request.method === 'GET' ? 404 : 418, { error: 'not in fixture probe' })
    else reply(requestId, answer[0], answer[1])
  }
  if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 300))
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 300)) }
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value
const sleep = ms => new Promise(r => setTimeout(r, ms))
const size = (width, height) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, 'base64')) }
const fullShot = async (name, width) => { const h = await ev('Math.min(document.documentElement.scrollHeight, 6000)'); await size(width, Math.max(900, h)); await sleep(300); await shot(name); await size(width, 900) }
const click = text => ev(`(()=>{const b=[...document.querySelectorAll('button,a')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!b) return false; b.click(); return true})()`)
const text = () => ev('document.querySelector("main")?.innerText ?? ""')
const overflow = () => ev('document.documentElement.scrollWidth - document.documentElement.clientWidth')
const out = []
const check = (name, ok, detail = '') => { out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`) }

await send('Runtime.enable'); await send('Page.enable')
await send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('theme','light')" })
await send('Fetch.enable', { patterns: [{ urlPattern: '*/orchestrator/api/*' }] })
await fetch(`${CDP}/json/activate/${target.id}`)

// 4. Overview: queued Evals rendered, running first, truncation disclosed, then a failing evaluating query.
for (const width of [1440, 390]) {
  await size(width, 900); errors.length = 0
  await send('Page.navigate', { url: PANEL + '/' }); await sleep(2000)
  const t = await text()
  check(`overview@${width}: queued Evals rendered`, (t.match(/Eval queued/g) ?? []).length === 4, `${(t.match(/Eval queued/g) ?? []).length} queued rows`)
  check(`overview@${width}: running Eval rendered`, t.includes('Eval in progress'))
  check(`overview@${width}: running Eval listed before queued`, t.indexOf('Eval in progress') < t.indexOf('Eval queued'))
  const link = await ev(`[...document.querySelectorAll('main a')].find(a => a.textContent.includes('with an Eval running or queued'))?.getAttribute('href')`)
  check(`overview@${width}: truncation link`, link === '/threads?filter=evaluating', link)
  check(`overview@${width}: no overflow`, (await overflow()) <= 0, `${await overflow()}px`)
  check(`overview@${width}: zero console errors`, errors.length === 0, errors.join(' | '))
  await fullShot(`overview-evals-${width}`, width)
}
mode.evalsFail = true
await size(1440, 900); await send('Page.navigate', { url: PANEL + '/' }); await sleep(4500)
{
  const t = await text()
  check('overview: failing evaluating query shows its own error', t.includes('Could not load Evals'), t.match(/Could not load Evals[^\n]*\n[^\n]*/)?.[0])
  check('overview: Tickets part still rendered', !t.includes('Could not load working Tickets'))
  await fullShot('overview-evals-failed-1440', 1440)
}
mode.evalsFail = false

// 5. Model card with settings failing, then succeeding.
mode.settingsFail = true
await send('Page.navigate', { url: PANEL + '/tickets/' + load('tickets_working.json').id }); await sleep(4500)
{
  const model = await ev(`document.getElementById('model')?.closest('section')?.innerText ?? ''`)
  check('ticket: settings failure does not claim DSH default', !model.includes('DSH default') && model.includes('Could not load'), model.replace(/\n/g, ' / ').slice(0, 200))
  await fullShot('ticket-settings-failed-1440', 1440)
}
mode.settingsFail = false
await send('Page.navigate', { url: PANEL + '/tickets/' + load('tickets_working.json').id }); await sleep(2500)
{
  const model = await ev(`document.getElementById('model')?.closest('section')?.innerText ?? ''`)
  check('ticket: settings success shows the configured model', model.includes('deepseek-flash') && !model.includes('Could not load'), model.replace(/\n/g, ' / ').slice(0, 160))
}

// 2. Thread cursor does not carry over to another Thread reached in-app.
await send('Page.navigate', { url: PANEL + '/threads/github%3A1' }); await sleep(2000)
check('thread: earlier button present', await click('Show earlier Triggers'))
await sleep(1500)
check('thread A paged with cursor', requests.some(r => r.includes('threads/github%3A1?before=')))
requests.length = 0
check('thread: in-app link to correlated Thread B', await click('Correlated B'))
await sleep(2000)
{
  const b = requests.filter(r => r.includes('threads/github%3A2'))
  check('thread B requested without A\'s cursor', b.length > 0 && b.every(r => !r.includes('before=')), b.join(', '))
  check('thread B rendered', (await ev('document.querySelector("h1")?.innerText')) === 'Thread github:2')
}

// 3. Tickets "Show more" pages by offset with bounded pages and stops at the end.
requests.length = 0
await send('Page.navigate', { url: PANEL + '/tickets' }); await sleep(2000)
const rows = () => ev(`[...document.querySelectorAll('main a[href^="/tickets/t"]')].map(a => a.getAttribute('href')).filter((h, i, a) => a.indexOf(h) === i).length`)
check('tickets: first page 50', (await rows()) === 50, String(await rows()))
await click('Show more'); await sleep(1500)
check('tickets: second page 100', (await rows()) === 100, String(await rows()))
await click('Show more'); await sleep(1500)
check('tickets: all 120 reached', (await rows()) === 120, String(await rows()))
check('tickets: Show more hidden at the end', !(await ev(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Show more')`)))
{
  const pages = requests.filter(r => r.includes('/tickets?state=open') && !r.includes('limit=1&') && !r.endsWith('limit=1'))
  check('tickets: requests use offset + limit 50', pages.some(r => r.includes('offset=50&limit=50')) && pages.some(r => r.includes('offset=100&limit=50')) && pages.every(r => r.includes('limit=50')), [...new Set(pages)].join(', '))
  check('tickets: showing line', (await text()).includes('Showing 120 of 120'))
}

// 6. Confirm dialog with a very long target stays inside the viewport; actions visible; body scrolls. Never confirmed.
mode.longTitle = true
for (const [width, height] of [[390, 560], [1440, 900], [390, 844]]) {
  await size(width, height)
  await send('Page.navigate', { url: PANEL + '/threads/github%3A1' }); await sleep(2000)
  await click('Unsubscribe…'); await sleep(800)
  const m = await ev(`(()=>{const d=document.querySelector('[role=alertdialog]'); const f=d?.querySelector('[data-slot=alert-dialog-footer]'); const b=d?.querySelector('[data-slot=confirm-body]');
    const fr=f?.getBoundingClientRect(), dr=d?.getBoundingClientRect();
    return d && { top: Math.round(dr.top), bottom: Math.round(dr.bottom), vh: innerHeight, footerBottom: Math.round(fr.bottom), footerTop: Math.round(fr.top),
      scroll: b.scrollHeight > b.clientHeight, focused: document.activeElement?.textContent,
      buttons: [...f.querySelectorAll('button')].map(x => { const r = x.getBoundingClientRect(); return x.textContent + ':' + (r.top >= 0 && r.bottom <= innerHeight) }) }})()`)
  check(`dialog@${width}x${height}: inside viewport`, !!m && m.top >= 0 && m.bottom <= m.vh, JSON.stringify(m))
  check(`dialog@${width}x${height}: actions visible`, !!m && m.buttons.length === 2 && m.buttons.every(b => b.endsWith(':true')))
  check(`dialog@${width}x${height}: long body scrolls`, !!m && m.scroll)
  await shot(`confirm-long-${width}x${height}`)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(400)
}
check('no POST sent while dialogs were open', !requests.some(r => r.startsWith('POST')), requests.filter(r => r.startsWith('POST')).join(', '))

console.log(out.join('\n'))
console.log(`${out.filter(l => l.startsWith('PASS')).length}/${out.length} passed`)
await ev("localStorage.removeItem('theme')")
await send('Fetch.disable'); await fetch(`${CDP}/json/close/${target.id}`); process.exit(0)
