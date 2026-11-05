# Contrast of the console's token pairs (panel, design-fidelity pass)

Date: 2026-11-05. Tokens: `panel/src/index.css` (`:root` light, `.dark` dark), taken verbatim from the Claude Design export's token sheet (`superagent-console-ui.html#tokens`) plus its `--destructive-foreground`.

## Method

- **Computed, not pixel-sampled.** Each `oklch()` token is converted OKLCH → OKLab → linear sRGB (Björn Ottosson's reference matrices), clipped to the sRGB gamut, then WCAG 2.x relative luminance and `(L1 + 0.05) / (L2 + 0.05)`. Script: `contrast.mjs` next to this file (no colour library): `node contrast.mjs ../../../../../panel/src/index.css` prints the table below; `composite.mjs` computes the hover composites.
- **Check of the conversion:** it reproduces the export's own figures exactly for the pairs both list (light muted-foreground/background 6.85, warn-foreground/warn-subtle 7.85, input/background 3.12; dark 8.60, 9.85, 3.60).
- All tokens are opaque, so a pair's rendered colours equal its tokens. Where the UI paints a semi-transparent surface, the pair is composited in gamma-encoded sRGB over its backdrop (see "Composited pairs").
- Thresholds: 4.5:1 for text (the brief applies it to all interface text, including large), 3:1 for essential non-text indicators (focus outlines, control borders, switch tracks, status dots and card edges). Decorative borders (`--border`) carry no requirement and are not listed. Disabled controls (opacity 0.5) are exempt.
- The rendered colour of a token was not read back from the browser; the chrome-la profile renders at 110 % zoom, which does not change colour.

## Result

142 pairs (71 per theme): **all pass**. Lowest: light `--input` on `--background` / `--card` 3.12:1 (3:1 boundary); lowest text pair: light `--primary` link on a hovered row (`--accent`) 5.26:1; lowest secondary-text pair: light `--muted-foreground` on `--status-idle-subtle` 6.01:1.

## Composited pairs (hover states)

| Theme | Pair | Ratio | Result |
|---|---|---|---|
| Light | `--primary-foreground` on `--primary` at 80 % over `--background` (shadcn default button hover) | 3.80:1 | **Fail → fixed**: hover changed to `--primary` at 90 % |
| Light | same at 90 % | 4.67:1 | Pass |
| Dark | same at 90 % | 6.97:1 | Pass |
| Light | `--destructive-foreground` on `--destructive` at 90 % (Stop… hover) | 5.14:1 | Pass |
| Dark | same | 5.70:1 | Pass |
| Both | text on table-row hover `--muted` at 50 % over `--card` | between the `--card` and `--muted` figures below (≥ 6.22:1 light, ≥ 6.93:1 dark for muted text) | Pass |

Other alpha utilities removed in this pass: focus rings `ring-ring/50` → opaque `ring-ring` / `outline-ring`; tab text `text-foreground/60` → `--muted-foreground`; outline-button border `--border` → `--input` and dark `bg-input/30` → `--background`; destructive button `bg-destructive/10` text-on-tint → solid `--destructive` + `--destructive-foreground`; confirm-dialog target `bg-muted/40` → `--muted`; System trust text `text-foreground/80` → `--muted-foreground` on `--card`; banner `opacity-90` text removed.

## All measured pairs

| Theme | Foreground | Background | Use | Rendered sRGB | Ratio | Required | Result |
|---|---|---|---|---|---|---|---|
| Light | `--foreground` | `--background` | Body text on the page | #09090b / #ffffff | 19.89:1 | 4.5:1 | Pass |
| Light | `--card-foreground` | `--card` | Text on cards | #09090b / #ffffff | 19.89:1 | 4.5:1 | Pass |
| Light | `--popover-foreground` | `--popover` | Dialogs, menus, search, toasts | #09090b / #ffffff | 19.89:1 | 4.5:1 | Pass |
| Light | `--foreground` | `--muted` | Text on muted (code chips, skeleton labels) | #09090b / #f4f4f5 | 18.07:1 | 4.5:1 | Pass |
| Light | `--accent-foreground` | `--accent` | Hovered table row / menu item | #18181b / #f0f0f1 | 15.55:1 | 4.5:1 | Pass |
| Light | `--foreground` | `--accent` | Row text on hovered row | #09090b / #f0f0f1 | 17.44:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--background` | Secondary text, inactive tabs | #5a5a64 / #ffffff | 6.85:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--card` | Secondary text on cards | #5a5a64 / #ffffff | 6.85:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--muted` | Table head, Tag chips, kbd | #5a5a64 / #f4f4f5 | 6.22:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--accent` | Secondary text on hovered row | #5a5a64 / #f0f0f1 | 6.01:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--popover` | Secondary text in dialogs and search | #5a5a64 / #ffffff | 6.85:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--sidebar` | Sidebar footer | #5a5a64 / #fafafa | 6.56:1 | 4.5:1 | Pass |
| Light | `--primary` | `--background` | Links, active tab on page | #1666aa / #ffffff | 6.00:1 | 4.5:1 | Pass |
| Light | `--primary` | `--card` | Links on cards | #1666aa / #ffffff | 6.00:1 | 4.5:1 | Pass |
| Light | `--primary` | `--accent` | Links in hovered row | #1666aa / #f0f0f1 | 5.26:1 | 4.5:1 | Pass |
| Light | `--primary` | `--popover` | Links in dialogs | #1666aa / #ffffff | 6.00:1 | 4.5:1 | Pass |
| Light | `--primary-foreground` | `--primary` | Primary button, skip link | #fafafa / #1666aa | 5.74:1 | 4.5:1 | Pass |
| Light | `--secondary-foreground` | `--secondary` | Secondary button (Retry…) | #18181b / #f4f4f5 | 16.11:1 | 4.5:1 | Pass |
| Light | `--destructive-foreground` | `--destructive` | Destructive button (Stop…) | #fafafa / #c2181d | 5.85:1 | 4.5:1 | Pass |
| Light | `--sidebar-foreground` | `--sidebar` | Sidebar items | #09090b / #fafafa | 19.05:1 | 4.5:1 | Pass |
| Light | `--sidebar-accent-foreground` | `--sidebar-accent` | Active sidebar item | #18181b / #e7e7ea | 14.42:1 | 4.5:1 | Pass |
| Light | `--sidebar-primary-foreground` | `--sidebar-primary` | Sidebar person badge | #fafafa / #1666aa | 5.74:1 | 4.5:1 | Pass |
| Light | `--status-ok-foreground` | `--status-ok-subtle` | ok badge / banner text | #115629 / #e2f9e6 | 7.93:1 | 4.5:1 | Pass |
| Light | `--status-ok-foreground` | `--card` | ok text on card (facts, Reach chip, inline errors) | #115629 / #ffffff | 8.80:1 | 4.5:1 | Pass |
| Light | `--status-ok-foreground` | `--background` | ok text on page | #115629 / #ffffff | 8.80:1 | 4.5:1 | Pass |
| Light | `--status-info-foreground` | `--status-info-subtle` | info badge / banner text | #0e4f86 / #e6f2fe | 7.43:1 | 4.5:1 | Pass |
| Light | `--status-info-foreground` | `--card` | info text on card (facts, Reach chip, inline errors) | #0e4f86 / #ffffff | 8.46:1 | 4.5:1 | Pass |
| Light | `--status-info-foreground` | `--background` | info text on page | #0e4f86 / #ffffff | 8.46:1 | 4.5:1 | Pass |
| Light | `--status-warn-foreground` | `--status-warn-subtle` | warn badge / banner text | #703f0e / #fef2d9 | 7.85:1 | 4.5:1 | Pass |
| Light | `--status-warn-foreground` | `--card` | warn text on card (facts, Reach chip, inline errors) | #703f0e / #ffffff | 8.70:1 | 4.5:1 | Pass |
| Light | `--status-warn-foreground` | `--background` | warn text on page | #703f0e / #ffffff | 8.70:1 | 4.5:1 | Pass |
| Light | `--status-danger-foreground` | `--status-danger-subtle` | danger badge / banner text | #9e1618 / #fceeed | 7.20:1 | 4.5:1 | Pass |
| Light | `--status-danger-foreground` | `--card` | danger text on card (facts, Reach chip, inline errors) | #9e1618 / #ffffff | 8.13:1 | 4.5:1 | Pass |
| Light | `--status-danger-foreground` | `--background` | danger text on page | #9e1618 / #ffffff | 8.13:1 | 4.5:1 | Pass |
| Light | `--status-idle-foreground` | `--status-idle-subtle` | idle badge / banner text | #51515b / #f0f0f1 | 6.83:1 | 4.5:1 | Pass |
| Light | `--status-idle-foreground` | `--card` | idle text on card (facts, Reach chip, inline errors) | #51515b / #ffffff | 7.79:1 | 4.5:1 | Pass |
| Light | `--status-idle-foreground` | `--background` | idle text on page | #51515b / #ffffff | 7.79:1 | 4.5:1 | Pass |
| Light | `--foreground` | `--status-warn-subtle` | Body text inside the warn banner (worker question) | #09090b / #fef2d9 | 17.97:1 | 4.5:1 | Pass |
| Light | `--foreground` | `--status-idle-subtle` | Worker summary inside the ended banner | #09090b / #f0f0f1 | 17.44:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--status-ok-subtle` | Relative time / meta text inside a ok banner | #5a5a64 / #e2f9e6 | 6.17:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--status-info-subtle` | Relative time / meta text inside a info banner | #5a5a64 / #e6f2fe | 6.02:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--status-warn-subtle` | Relative time / meta text inside a warn banner | #5a5a64 / #fef2d9 | 6.19:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--status-danger-subtle` | Relative time / meta text inside a danger banner | #5a5a64 / #fceeed | 6.07:1 | 4.5:1 | Pass |
| Light | `--muted-foreground` | `--status-idle-subtle` | Relative time / meta text inside a idle banner | #5a5a64 / #f0f0f1 | 6.01:1 | 4.5:1 | Pass |
| Light | `--primary` | `--status-danger-subtle` | Link in the setup / Source problem banner | #1666aa / #fceeed | 5.31:1 | 4.5:1 | Pass |
| Light | `--primary` | `--status-warn-subtle` | Link in a warn banner | #1666aa / #fef2d9 | 5.42:1 | 4.5:1 | Pass |
| Light | `--primary` | `--status-info-subtle` | Link in the info banner | #1666aa / #e6f2fe | 5.27:1 | 4.5:1 | Pass |
| Light | `--status-danger-foreground` | `--status-danger-subtle` | Outline "Retry" button border (currentColor) in a danger banner | #9e1618 / #fceeed | 7.20:1 | 3:1 | Pass |
| Light | `--foreground` | `--card` | Source chip text | #09090b / #ffffff | 19.89:1 | 4.5:1 | Pass |
| Light | `--status-ok` | `--background` | ok dot on page (top bar) | #11813c / #ffffff | 4.95:1 | 3:1 | Pass |
| Light | `--status-ok` | `--card` | ok dot / card edge on card | #11813c / #ffffff | 4.95:1 | 3:1 | Pass |
| Light | `--status-info` | `--background` | info dot on page (top bar) | #1f6cb0 / #ffffff | 5.50:1 | 3:1 | Pass |
| Light | `--status-info` | `--card` | info dot / card edge on card | #1f6cb0 / #ffffff | 5.50:1 | 3:1 | Pass |
| Light | `--status-warn` | `--background` | warn dot on page (top bar) | #a2641b / #ffffff | 4.79:1 | 3:1 | Pass |
| Light | `--status-warn` | `--card` | warn dot / card edge on card | #a2641b / #ffffff | 4.79:1 | 3:1 | Pass |
| Light | `--status-danger` | `--background` | danger dot on page (top bar) | #c2181d / #ffffff | 6.11:1 | 3:1 | Pass |
| Light | `--status-danger` | `--card` | danger dot / card edge on card | #c2181d / #ffffff | 6.11:1 | 3:1 | Pass |
| Light | `--status-idle` | `--background` | idle dot on page (top bar) | #797981 / #ffffff | 4.29:1 | 3:1 | Pass |
| Light | `--status-idle` | `--card` | idle dot / card edge on card | #797981 / #ffffff | 4.29:1 | 3:1 | Pass |
| Light | `--status-info` | `--muted` | Load meter fill against its track | #1f6cb0 / #f4f4f5 | 5.00:1 | 3:1 | Pass |
| Light | `--status-warn` | `--card` | Reach "Not yet delivered" chip border | #a2641b / #ffffff | 4.79:1 | 3:1 | Pass |
| Light | `--ring` | `--background` | Focus outline on page | #1666aa / #ffffff | 6.00:1 | 3:1 | Pass |
| Light | `--ring` | `--card` | Focus outline on card | #1666aa / #ffffff | 6.00:1 | 3:1 | Pass |
| Light | `--ring` | `--popover` | Focus outline in dialogs | #1666aa / #ffffff | 6.00:1 | 3:1 | Pass |
| Light | `--sidebar-ring` | `--sidebar` | Focus outline in sidebar | #1666aa / #fafafa | 5.74:1 | 3:1 | Pass |
| Light | `--input` | `--background` | Outline button / input border, switch-off track | #919199 / #ffffff | 3.12:1 | 3:1 | Pass |
| Light | `--input` | `--card` | Outline button border on cards | #919199 / #ffffff | 3.12:1 | 3:1 | Pass |
| Light | `--input` | `--popover` | Outline button (Cancel) in dialogs | #919199 / #ffffff | 3.12:1 | 3:1 | Pass |
| Light | `--background` | `--input` | Switch thumb on the off track | #ffffff / #919199 | 3.12:1 | 3:1 | Pass |
| Light | `--primary` | `--background` | Switch-on track, active tab underline | #1666aa / #ffffff | 6.00:1 | 3:1 | Pass |
| Light | `--primary-foreground` | `--primary` | Switch thumb on the on track | #fafafa / #1666aa | 5.74:1 | 3:1 | Pass |
| Dark | `--foreground` | `--background` | Body text on the page | #fafafa / #09090b | 19.05:1 | 4.5:1 | Pass |
| Dark | `--card-foreground` | `--card` | Text on cards | #fafafa / #131316 | 17.70:1 | 4.5:1 | Pass |
| Dark | `--popover-foreground` | `--popover` | Dialogs, menus, search, toasts | #fafafa / #18181b | 16.98:1 | 4.5:1 | Pass |
| Dark | `--foreground` | `--muted` | Text on muted (code chips, skeleton labels) | #fafafa / #212124 | 15.34:1 | 4.5:1 | Pass |
| Dark | `--accent-foreground` | `--accent` | Hovered table row / menu item | #fafafa / #27272a | 14.26:1 | 4.5:1 | Pass |
| Dark | `--foreground` | `--accent` | Row text on hovered row | #fafafa / #27272a | 14.26:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--background` | Secondary text, inactive tabs | #aaaab4 / #09090b | 8.60:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--card` | Secondary text on cards | #aaaab4 / #131316 | 7.99:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--muted` | Table head, Tag chips, kbd | #aaaab4 / #212124 | 6.93:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--accent` | Secondary text on hovered row | #aaaab4 / #27272a | 6.44:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--popover` | Secondary text in dialogs and search | #aaaab4 / #18181b | 7.67:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--sidebar` | Sidebar footer | #aaaab4 / #0f0f12 | 8.27:1 | 4.5:1 | Pass |
| Dark | `--primary` | `--background` | Links, active tab on page | #73b0ee / #09090b | 8.67:1 | 4.5:1 | Pass |
| Dark | `--primary` | `--card` | Links on cards | #73b0ee / #131316 | 8.06:1 | 4.5:1 | Pass |
| Dark | `--primary` | `--accent` | Links in hovered row | #73b0ee / #27272a | 6.49:1 | 4.5:1 | Pass |
| Dark | `--primary` | `--popover` | Links in dialogs | #73b0ee / #18181b | 7.73:1 | 4.5:1 | Pass |
| Dark | `--primary-foreground` | `--primary` | Primary button, skip link | #040e1a / #73b0ee | 8.46:1 | 4.5:1 | Pass |
| Dark | `--secondary-foreground` | `--secondary` | Secondary button (Retry…) | #fafafa / #27272a | 14.26:1 | 4.5:1 | Pass |
| Dark | `--destructive-foreground` | `--destructive` | Destructive button (Stop…) | #09090b / #fa6863 | 6.87:1 | 4.5:1 | Pass |
| Dark | `--sidebar-foreground` | `--sidebar` | Sidebar items | #fafafa / #0f0f12 | 18.32:1 | 4.5:1 | Pass |
| Dark | `--sidebar-accent-foreground` | `--sidebar-accent` | Active sidebar item | #fafafa / #262629 | 14.45:1 | 4.5:1 | Pass |
| Dark | `--sidebar-primary-foreground` | `--sidebar-primary` | Sidebar person badge | #040e1a / #73b0ee | 8.46:1 | 4.5:1 | Pass |
| Dark | `--status-ok-foreground` | `--status-ok-subtle` | ok badge / banner text | #89e29d / #132717 | 10.14:1 | 4.5:1 | Pass |
| Dark | `--status-ok-foreground` | `--card` | ok text on card (facts, Reach chip, inline errors) | #89e29d / #131316 | 11.86:1 | 4.5:1 | Pass |
| Dark | `--status-ok-foreground` | `--background` | ok text on page | #89e29d / #09090b | 12.77:1 | 4.5:1 | Pass |
| Dark | `--status-info-foreground` | `--status-info-subtle` | info badge / banner text | #a8cff7 / #122334 | 9.83:1 | 4.5:1 | Pass |
| Dark | `--status-info-foreground` | `--card` | info text on card (facts, Reach chip, inline errors) | #a8cff7 / #131316 | 11.37:1 | 4.5:1 | Pass |
| Dark | `--status-info-foreground` | `--background` | info text on page | #a8cff7 / #09090b | 12.24:1 | 4.5:1 | Pass |
| Dark | `--status-warn-foreground` | `--status-warn-subtle` | warn badge / banner text | #f5cb70 / #352206 | 9.85:1 | 4.5:1 | Pass |
| Dark | `--status-warn-foreground` | `--card` | warn text on card (facts, Reach chip, inline errors) | #f5cb70 / #131316 | 12.01:1 | 4.5:1 | Pass |
| Dark | `--status-warn-foreground` | `--background` | warn text on page | #f5cb70 / #09090b | 12.93:1 | 4.5:1 | Pass |
| Dark | `--status-danger-foreground` | `--status-danger-subtle` | danger badge / banner text | #ffaba3 / #3f1917 | 8.49:1 | 4.5:1 | Pass |
| Dark | `--status-danger-foreground` | `--card` | danger text on card (facts, Reach chip, inline errors) | #ffaba3 / #131316 | 10.18:1 | 4.5:1 | Pass |
| Dark | `--status-danger-foreground` | `--background` | danger text on page | #ffaba3 / #09090b | 10.96:1 | 4.5:1 | Pass |
| Dark | `--status-idle-foreground` | `--status-idle-subtle` | idle badge / banner text | #bdbdc5 / #242427 | 8.31:1 | 4.5:1 | Pass |
| Dark | `--status-idle-foreground` | `--card` | idle text on card (facts, Reach chip, inline errors) | #bdbdc5 / #131316 | 9.87:1 | 4.5:1 | Pass |
| Dark | `--status-idle-foreground` | `--background` | idle text on page | #bdbdc5 / #09090b | 10.62:1 | 4.5:1 | Pass |
| Dark | `--foreground` | `--status-warn-subtle` | Body text inside the warn banner (worker question) | #fafafa / #352206 | 14.52:1 | 4.5:1 | Pass |
| Dark | `--foreground` | `--status-idle-subtle` | Worker summary inside the ended banner | #fafafa / #242427 | 14.90:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--status-ok-subtle` | Relative time / meta text inside a ok banner | #aaaab4 / #132717 | 6.83:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--status-info-subtle` | Relative time / meta text inside a info banner | #aaaab4 / #122334 | 6.91:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--status-warn-subtle` | Relative time / meta text inside a warn banner | #aaaab4 / #352206 | 6.56:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--status-danger-subtle` | Relative time / meta text inside a danger banner | #aaaab4 / #3f1917 | 6.66:1 | 4.5:1 | Pass |
| Dark | `--muted-foreground` | `--status-idle-subtle` | Relative time / meta text inside a idle banner | #aaaab4 / #242427 | 6.73:1 | 4.5:1 | Pass |
| Dark | `--primary` | `--status-danger-subtle` | Link in the setup / Source problem banner | #73b0ee / #3f1917 | 6.72:1 | 4.5:1 | Pass |
| Dark | `--primary` | `--status-warn-subtle` | Link in a warn banner | #73b0ee / #352206 | 6.61:1 | 4.5:1 | Pass |
| Dark | `--primary` | `--status-info-subtle` | Link in the info banner | #73b0ee / #122334 | 6.97:1 | 4.5:1 | Pass |
| Dark | `--status-danger-foreground` | `--status-danger-subtle` | Outline "Retry" button border (currentColor) in a danger banner | #ffaba3 / #3f1917 | 8.49:1 | 3:1 | Pass |
| Dark | `--foreground` | `--card` | Source chip text | #fafafa / #131316 | 17.70:1 | 4.5:1 | Pass |
| Dark | `--status-ok` | `--background` | ok dot on page (top bar) | #53be70 / #09090b | 8.51:1 | 3:1 | Pass |
| Dark | `--status-ok` | `--card` | ok dot / card edge on card | #53be70 / #131316 | 7.91:1 | 3:1 | Pass |
| Dark | `--status-info` | `--background` | info dot on page (top bar) | #67aaed / #09090b | 8.06:1 | 3:1 | Pass |
| Dark | `--status-info` | `--card` | info dot / card edge on card | #67aaed / #131316 | 7.49:1 | 3:1 | Pass |
| Dark | `--status-warn` | `--background` | warn dot on page (top bar) | #e4a339 / #09090b | 9.08:1 | 3:1 | Pass |
| Dark | `--status-warn` | `--card` | warn dot / card edge on card | #e4a339 / #131316 | 8.44:1 | 3:1 | Pass |
| Dark | `--status-danger` | `--background` | danger dot on page (top bar) | #fa6863 / #09090b | 6.87:1 | 3:1 | Pass |
| Dark | `--status-danger` | `--card` | danger dot / card edge on card | #fa6863 / #131316 | 6.38:1 | 3:1 | Pass |
| Dark | `--status-idle` | `--background` | idle dot on page (top bar) | #8e8e96 / #09090b | 6.14:1 | 3:1 | Pass |
| Dark | `--status-idle` | `--card` | idle dot / card edge on card | #8e8e96 / #131316 | 5.70:1 | 3:1 | Pass |
| Dark | `--status-info` | `--muted` | Load meter fill against its track | #67aaed / #212124 | 6.49:1 | 3:1 | Pass |
| Dark | `--status-warn` | `--card` | Reach "Not yet delivered" chip border | #e4a339 / #131316 | 8.44:1 | 3:1 | Pass |
| Dark | `--ring` | `--background` | Focus outline on page | #73b0ee / #09090b | 8.67:1 | 3:1 | Pass |
| Dark | `--ring` | `--card` | Focus outline on card | #73b0ee / #131316 | 8.06:1 | 3:1 | Pass |
| Dark | `--ring` | `--popover` | Focus outline in dialogs | #73b0ee / #18181b | 7.73:1 | 3:1 | Pass |
| Dark | `--sidebar-ring` | `--sidebar` | Focus outline in sidebar | #73b0ee / #0f0f12 | 8.34:1 | 3:1 | Pass |
| Dark | `--input` | `--background` | Outline button / input border, switch-off track | #686870 / #09090b | 3.60:1 | 3:1 | Pass |
| Dark | `--input` | `--card` | Outline button border on cards | #686870 / #131316 | 3.35:1 | 3:1 | Pass |
| Dark | `--input` | `--popover` | Outline button (Cancel) in dialogs | #686870 / #18181b | 3.21:1 | 3:1 | Pass |
| Dark | `--background` | `--input` | Switch thumb on the off track | #09090b / #686870 | 3.60:1 | 3:1 | Pass |
| Dark | `--primary` | `--background` | Switch-on track, active tab underline | #73b0ee / #09090b | 8.67:1 | 3:1 | Pass |
| Dark | `--primary-foreground` | `--primary` | Switch thumb on the on track | #040e1a / #73b0ee | 8.46:1 | 3:1 | Pass |
