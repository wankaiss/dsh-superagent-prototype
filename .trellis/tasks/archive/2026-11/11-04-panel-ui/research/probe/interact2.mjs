const CDP = 'http://127.0.0.1:9223', PANEL = process.env.PANEL ?? 'http://127.0.0.1:5178'
const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(r => { ws.onopen = r })
let seq = 0; const pending = new Map(); const logs = []; const requests = []
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description ?? '').slice(0, 300))
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('console.error ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 300))
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method !== 'GET') requests.push(m.params.request.method + ' ' + m.params.request.url) }
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value
const sleep = ms => new Promise(r => setTimeout(r, ms))
const key = async (k, code, mods = 0, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, modifiers: mods, windowsVirtualKeyCode: vk, ...(k === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }) }
const go = async (path, w = 1440) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: PANEL + path }); await sleep(2500) }
const text = () => ev('document.querySelector("main")?.innerText.slice(0, 300)')
await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable')
await fetch(`${CDP}/json/activate/${target.id}`)
const out = {}
const tabs = () => ev('[...document.querySelectorAll("[role=tab]")].map(t => t.innerText.split("\\n")[0] + ":" + t.getAttribute("aria-selected")).join(" ")')
await go('/tickets'); out.plain = await tabs()
await go('/tickets?state=open'); out.open = await tabs()
await go('/tickets?state=ended'); out.ended = await tabs()
await go('/tickets?state=bogus'); await sleep(1000)
out.bogusFilter = await ev('[...document.querySelectorAll("[role=tab]")].map(t => t.innerText.split("\\n")[0] + ":" + t.getAttribute("aria-selected") + ":" + t.hasAttribute("data-active")).join(" ")')
await go('/')
await ev('document.querySelector("[aria-label=\\"Search Tickets, Triggers and Threads\\"]").focus()')
await key('Enter', 'Enter', 0, 13); await sleep(600)
out.searchViaButton = await ev('!!document.querySelector("[role=dialog]")')
await key('Escape', 'Escape', 0, 27); await sleep(600)
out.searchFocusReturn = await ev('document.activeElement?.getAttribute("aria-label")')
await ev('document.querySelector("[data-slot=switch]").focus()')
await key(' ', 'Space', 0, 32); await sleep(600)
out.pauseOpenByKey = await ev('!!document.querySelector("[role=alertdialog]")')
await key('Tab', 'Tab', 0, 9); await key('Tab', 'Tab', 0, 9); await sleep(200)
out.focusTrapped = await ev('!!document.activeElement?.closest("[role=alertdialog]")')
await key('Escape', 'Escape', 0, 27); await sleep(600)
out.pauseFocusReturn = await ev('document.activeElement?.getAttribute("aria-label") + " checked=" + document.querySelector("[data-slot=switch]")?.getAttribute("aria-checked")')
await ev('document.querySelector("[aria-label^=\\"Theme\\"]").focus()')
await key('Enter', 'Enter', 0, 13); await sleep(500)
out.themeMenu = await ev('[...document.querySelectorAll("[role=menuitemradio]")].map(i => i.innerText + "=" + i.getAttribute("aria-checked")).join(", ")')
await key('Escape', 'Escape', 0, 27); await sleep(300)
out.nonGetRequests = requests
out.errors = logs
console.log(JSON.stringify(out, null, 1))
await fetch(`${CDP}/json/close/${target.id}`)
process.exit(0)
