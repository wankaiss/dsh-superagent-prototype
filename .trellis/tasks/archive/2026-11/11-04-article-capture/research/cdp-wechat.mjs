const [,, url, out] = process.argv;
const base = 'http://127.0.0.1:9223';
const t = await (await fetch(`${base}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable');
await send('Page.navigate', { url });
let state;
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 1500));
  state = await ev(`({title: document.title, has: !!document.querySelector('#js_content'), len: (document.querySelector('#js_content')||{}).innerText?.length||0, body: document.body?.innerText.slice(0,200)})`);
  if (state?.has && state.len > 500) break;
}
console.error('STATE', JSON.stringify(state));
if (state?.has) {
  // scroll to trigger lazy images
  await ev(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=800){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}})()`);
  const data = await ev(`(()=>{const c=document.querySelector('#js_content');const q=s=>document.querySelector(s)?.innerText.trim()||'';
    const imgs=[...c.querySelectorAll('img')].map(i=>({src:i.dataset.src||i.src,alt:i.alt||''}));
    const links=[...c.querySelectorAll('a')].map(a=>({text:a.innerText.trim(),href:a.href}));
    return {title:q('#activity-name'),author:q('#js_name'),published:q('#publish_time'),html:c.innerHTML,text:c.innerText,imgs,links}})()`);
  (await import('node:fs')).writeFileSync(out, JSON.stringify(data));
  console.error('WROTE', out, data.text.length, 'chars', data.imgs.length, 'imgs');
}
await send('Page.close').catch(()=>{});
await fetch(`${base}/json/close/${t.id}`).catch(()=>{});
process.exit(0);
