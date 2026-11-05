// Loads a page with live data, then answers every API call with an empty-body 404 (the "restarting" signal) via CDP Fetch.
const CDP = 'http://127.0.0.1:9223', PANEL = 'http://127.0.0.1:5178'
const [path = '/', shot] = process.argv.slice(2)
const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(r => { ws.onopen = r })
let seq = 0; const pending = new Map(); const logs = []
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return }
  if (m.method === 'Fetch.requestPaused') send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 404, responseHeaders: [], body: '' })
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description ?? '').slice(0, 300)) }
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value
const sleep = ms => new Promise(r => setTimeout(r, ms))
await send('Runtime.enable'); await send('Page.enable')
await fetch(`${CDP}/json/activate/${target.id}`)
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: PANEL + path }); await sleep(3000)
const before = await ev('document.querySelector("main").innerText.length')
await send('Fetch.enable', { patterns: [{ urlPattern: '*/orchestrator/api/*' }] })
await sleep(7000)
const out = await ev(`({ before: ${before}, after: document.querySelector("main").innerText.length,
  banners: [...document.querySelectorAll("[role=status],[role=alert]")].map(e => e.innerText.slice(0, 160)),
  stale: [...document.querySelectorAll("main")].map(m => m.innerText.match(/Showing earlier data[^\\n]*/g)).flat(),
  indicator: document.querySelector("header [aria-label^='API connection']")?.getAttribute("aria-label"),
  maxWorkers: document.querySelector("main").innerText.includes("Max workers") })`)
console.log(JSON.stringify(out, null, 1)); if (logs.length) console.log(logs)
if (shot) { const s = await send('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(shot, Buffer.from(s.result.data, 'base64')) }
await send('Fetch.disable'); await fetch(`${CDP}/json/close/${target.id}`); process.exit(0)
