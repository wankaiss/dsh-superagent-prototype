// Fails the build if host-only code leaked into the browser bundle.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const bad = [/["'`]node:[a-z]/, /@deepseek-ai\//]
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)])
const hits = walk(new URL('../dist', import.meta.url).pathname)
  .filter(f => /\.(js|css|html)$/.test(f)).flatMap(f => bad.filter(re => re.test(readFileSync(f, 'utf8'))).map(re => `${f}: ${re}`))
if (hits.length) { console.error('Host code leaked into dist:\n' + hits.join('\n')); process.exit(1) }
console.log('dist clean: no node: or @deepseek-ai references')
