const CDP = 'http://127.0.0.1:9223', PANEL = process.env.PANEL ?? 'http://127.0.0.1:5178'
const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(r => { ws.onopen = r })
let seq = 0; const pending = new Map(); const logs = []; const requests = []
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description ?? '').slice(0, 300))
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('console.error ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 300))
  if (m.method === 'Network.requestWillBeSent' && (m.params.request.method !== 'GET' || m.params.request.url.includes('tickets?'))) requests.push(m.params.request.method + ' ' + m.params.request.url) }
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value
const sleep = ms => new Promise(r => setTimeout(r, ms))
const key = async (k, code, mods = 0, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, modifiers: mods, windowsVirtualKeyCode: vk, ...(k === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }) }
const go = async (path, w = 1440) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: PANEL + path }); await sleep(2500) }
const text = () => ev('document.querySelector("main")?.innerText.slice(0, 300)')
await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable')
await fetch(`${CDP}/json/activate/${target.id}`)
const out = {}
await go('/tickets?state=bogus'); await sleep(1000)
out.nonGetRequests = requests
out.errors = logs
console.log(JSON.stringify(out, null, 1))
await fetch(`${CDP}/json/close/${target.id}`)
process.exit(0)
