// Usage: node probe.mjs <path> <width> <expression>
const [path, width, expr] = process.argv.slice(2)
const CDP = 'http://127.0.0.1:9223'
const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(r => { ws.onopen = r })
let seq = 0; const pending = new Map(); const logs = []
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 500))
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) logs.push(m.params.type + ' ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 400)) }
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
await send('Runtime.enable'); await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: Number(width), height: 844, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: 'http://127.0.0.1:5179' + path })
await new Promise(r => setTimeout(r, 3000))
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
console.log(JSON.stringify(res.result?.result?.value ?? res.result, null, 1))
if (logs.length) console.log(logs.join('\n'))
await fetch(`${CDP}/json/close/${target.id}`)
process.exit(0)
