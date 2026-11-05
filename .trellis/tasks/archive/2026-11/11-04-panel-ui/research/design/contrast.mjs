// WCAG 2.x contrast of the token pairs the console uses, computed from the oklch values in panel/src/index.css.
import { readFileSync } from 'node:fs'
const css = readFileSync(process.argv[2], 'utf8')
const block = sel => { const i = css.indexOf(`${sel} {`); const body = css.slice(i, css.indexOf('}', i)); return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*oklch\(([^)]+)\)/g)].map(m => [m[1], m[2].trim().split(/\s+/).map(Number)])) }
const themes = { Light: block(':root'), Dark: { ...block(':root'), ...block('.dark') } }
const lin = ([L, C, h]) => {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
    .map(v => Math.min(1, Math.max(0, v)))
}
const Y = c => { const [r, g, b] = lin(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const hex = c => '#' + lin(c).map(v => { const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(s * 255).toString(16).padStart(2, '0') }).join('')
const ratio = (a, b) => { const [x, y] = [Y(a), Y(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const T = 4.5, N = 3
const pairs = [
  ['foreground', 'background', T, 'Body text on the page'], ['card-foreground', 'card', T, 'Text on cards'], ['popover-foreground', 'popover', T, 'Dialogs, menus, search, toasts'],
  ['foreground', 'muted', T, 'Text on muted (code chips, skeleton labels)'], ['accent-foreground', 'accent', T, 'Hovered table row / menu item'],
  ['foreground', 'accent', T, 'Row text on hovered row'],
  ['muted-foreground', 'background', T, 'Secondary text, inactive tabs'], ['muted-foreground', 'card', T, 'Secondary text on cards'],
  ['muted-foreground', 'muted', T, 'Table head, Tag chips, kbd'], ['muted-foreground', 'accent', T, 'Secondary text on hovered row'],
  ['muted-foreground', 'popover', T, 'Secondary text in dialogs and search'], ['muted-foreground', 'sidebar', T, 'Sidebar footer'],
  ['primary', 'background', T, 'Links, active tab on page'], ['primary', 'card', T, 'Links on cards'], ['primary', 'accent', T, 'Links in hovered row'],
  ['primary', 'popover', T, 'Links in dialogs'],
  ['primary-foreground', 'primary', T, 'Primary button, skip link'], ['secondary-foreground', 'secondary', T, 'Secondary button (Retry…)'],
  ['destructive-foreground', 'destructive', T, 'Destructive button (Stop…)'],
  ['sidebar-foreground', 'sidebar', T, 'Sidebar items'], ['sidebar-accent-foreground', 'sidebar-accent', T, 'Active sidebar item'],
  ['sidebar-primary-foreground', 'sidebar-primary', T, 'Sidebar person badge'],
  ...['ok', 'info', 'warn', 'danger', 'idle'].flatMap(s => [
    [`status-${s}-foreground`, `status-${s}-subtle`, T, `${s} badge / banner text`],
    [`status-${s}-foreground`, 'card', T, `${s} text on card (facts, Reach chip, inline errors)`],
    [`status-${s}-foreground`, 'background', T, `${s} text on page`],
  ]),
  ['foreground', 'status-warn-subtle', T, 'Body text inside the warn banner (worker question)'],
  ['foreground', 'status-idle-subtle', T, 'Worker summary inside the ended banner'],
  ...['ok', 'info', 'warn', 'danger', 'idle'].map(s => ['muted-foreground', `status-${s}-subtle`, T, `Relative time / meta text inside a ${s} banner`]),
  ['primary', 'status-danger-subtle', T, 'Link in the setup / Source problem banner'],
  ['primary', 'status-warn-subtle', T, 'Link in a warn banner'], ['primary', 'status-info-subtle', T, 'Link in the info banner'],
  ['status-danger-foreground', 'status-danger-subtle', N, 'Outline "Retry" button border (currentColor) in a danger banner'],
  ['foreground', 'card', T, 'Source chip text'],
  ...['ok', 'info', 'warn', 'danger', 'idle'].flatMap(s => [
    [`status-${s}`, 'background', N, `${s} dot on page (top bar)`], [`status-${s}`, 'card', N, `${s} dot / card edge on card`]]),
  ['status-info', 'muted', N, 'Load meter fill against its track'], ['status-warn', 'card', N, 'Reach "Not yet delivered" chip border'],
  ['ring', 'background', N, 'Focus outline on page'], ['ring', 'card', N, 'Focus outline on card'], ['ring', 'popover', N, 'Focus outline in dialogs'],
  ['sidebar-ring', 'sidebar', N, 'Focus outline in sidebar'],
  ['input', 'background', N, 'Outline button / input border, switch-off track'], ['input', 'card', N, 'Outline button border on cards'],
  ['input', 'popover', N, 'Outline button (Cancel) in dialogs'], ['background', 'input', N, 'Switch thumb on the off track'],
  ['primary', 'background', N, 'Switch-on track, active tab underline'], ['primary-foreground', 'primary', N, 'Switch thumb on the on track'],
]
const rows = []
for (const [theme, t] of Object.entries(themes)) for (const [fg, bg, need, use] of pairs) {
  const r = ratio(t[fg], t[bg]); rows.push({ theme, fg, bg, use, r, need, hexes: `${hex(t[fg])} / ${hex(t[bg])}` })
}
const fails = rows.filter(x => x.r < x.need)
console.log('| Theme | Foreground | Background | Use | Rendered sRGB | Ratio | Required | Result |\n|---|---|---|---|---|---|---|---|')
for (const x of rows) console.log(`| ${x.theme} | \`--${x.fg}\` | \`--${x.bg}\` | ${x.use} | ${x.hexes} | ${x.r.toFixed(2)}:1 | ${x.need}:1 | ${x.r >= x.need ? 'Pass' : '**Fail**'} |`)
console.error(`${rows.length} pairs, ${fails.length} fail`, fails.map(f => `${f.theme} ${f.fg}/${f.bg} ${f.r.toFixed(2)}`))
