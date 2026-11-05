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
const key = async (k, code, mods = 0, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, modifiers: mods, windowsVirtualKeyCode: vk }) }
const go = async (path, w = 1440) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: PANEL + path }); await sleep(2500) }
const text = () => ev('document.querySelector("main")?.innerText.slice(0, 300)')
await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable')
await fetch(`${CDP}/json/activate/${target.id}`)
const out = {}
await go('/tickets/does-not-exist'); out.ticket404 = await text()
await go('/threads/github%3A99999'); out.thread404 = await text()
await go('/tickets?state=bogus'); out.bogusFilter = { url: await ev('location.search'), active: await ev('document.querySelector("[role=tab][aria-selected=true]")?.innerText') }
await go('/threads?filter=all'); out.threadsAll = await ev('document.querySelector("[role=tab][aria-selected=true]")?.innerText')
// Tab click changes the URL and history
await ev('[...document.querySelectorAll("[role=tab]")].find(t => t.innerText.startsWith("Recent"))?.click()'); await sleep(600)
out.afterTab = await ev('location.pathname + location.search')
await send('Page.navigate', { url: PANEL + '/' }); await sleep(1500); await ev('history.back()'); await sleep(1200)
out.afterBack = await ev('location.pathname + location.search + " | " + document.querySelector("[role=tab][aria-selected=true]")?.innerText')
// Search
await go('/')
await key('k', 'KeyK', 2, 75); await sleep(500)
out.searchOpen = await ev('({ dialog: !!document.querySelector("[role=dialog]"), focused: document.activeElement?.getAttribute("aria-label") })')
await send('Input.insertText', { text: 'sum' }); await sleep(1800)
out.searchStatus = await ev('document.querySelector("[role=dialog] [role=status]")?.innerText')
await key('Escape', 'Escape', 0, 27); await sleep(500)
out.searchClosed = await ev('({ dialog: !!document.querySelector("[role=dialog]"), focused: document.activeElement?.tagName + " " + (document.activeElement?.getAttribute("aria-label") ?? "") })')
// Pause dialog: open, check focus, Escape, check state unchanged
await ev('document.querySelector("[data-slot=switch]").click()'); await sleep(600)
out.pauseDialog = await ev('({ dialog: document.querySelector("[role=alertdialog]")?.innerText.slice(0, 200), focused: document.activeElement?.innerText })')
await key('Escape', 'Escape', 0, 27); await sleep(600)
out.pauseAfter = await ev('({ dialog: !!document.querySelector("[role=alertdialog]"), checked: document.querySelector("[data-slot=switch]")?.getAttribute("aria-checked"), focused: document.activeElement?.getAttribute("aria-label") })')
// Mobile sheet
await go('/', 390)
await ev('document.querySelector("[aria-label=\\"Open navigation\\"]").click()'); await sleep(600)
out.sheet = await ev('({ open: !!document.querySelector("[role=dialog]"), links: [...document.querySelectorAll("[role=dialog] a")].map(a => a.innerText).join(","), focused: document.activeElement?.innerText?.slice(0,30) })')
await ev('[...document.querySelectorAll("[role=dialog] a")].find(a => a.innerText.startsWith("Sources")).click()'); await sleep(1200)
out.sheetNav = await ev('({ path: location.pathname, open: !!document.querySelector("[role=dialog]") })')
// Skip link is first focusable
await go('/'); await key('Tab', 'Tab', 0, 9); await sleep(200)
out.firstTab = await ev('document.activeElement?.innerText')
out.nonGetRequests = requests
out.errors = logs
console.log(JSON.stringify(out, null, 1))
await fetch(`${CDP}/json/close/${target.id}`)
process.exit(0)
