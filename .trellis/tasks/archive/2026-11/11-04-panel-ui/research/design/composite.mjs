// Contrast of text over a semi-transparent surface composited (in gamma-encoded sRGB, as browsers do) onto its backdrop.
const lin = ([L, C, h]) => { const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(v => Math.min(1, Math.max(0, v))) }
const enc = v => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
const dec = v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
const srgb = c => lin(c).map(enc)
const Y = rgb => { const [r, g, b] = rgb.map(dec); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const ratio = (a, b) => { const [x, y] = [Y(a), Y(b)].sort((p, q) => q - p); return ((x + 0.05) / (y + 0.05)).toFixed(2) }
const mix = (top, alpha, under) => top.map((v, i) => v * alpha + under[i] * (1 - alpha))
const P = { light: { primary: [0.50, 0.13, 250], pf: [0.985, 0, 0], bg: [1, 0, 0], destructive: [0.52, 0.20, 27], df: [0.985, 0, 0] },
  dark: { primary: [0.74, 0.11, 250], pf: [0.16, 0.03, 250], bg: [0.141, 0.005, 285.823], destructive: [0.70, 0.18, 25], df: [0.141, 0.005, 285.823] } }
for (const [t, p] of Object.entries(P)) for (const a of [0.8, 0.9]) {
  console.log(t, `primary/${a * 100} hover`, ratio(srgb(p.pf), mix(srgb(p.primary), a, srgb(p.bg))), `destructive/${a * 100} hover`, ratio(srgb(p.df), mix(srgb(p.destructive), a, srgb(p.bg))))
}
