# Article capture notes

Source: WeChat article, DeepSeek Harness team, 2026-10-31 — "Exploring Super-agent Design: Towards a More Autonomous Agent System" (超级智能体设计探索).

## Fetch attempts (2026-11-04)

| # | Path | Result |
|---|---|---|
| 1 | curl with desktop UA | WeChat "环境异常 / 去验证" wall (raw/article.html) |
| 2 | chrome-devtools MCP → Windows Chrome | MCP browser connection timed out (60s) |
| 3 | codex exec (computer-use, Windows Chrome) | 1st: hung on stdin (timeout). 2nd: BLOCKED by Codex browser site-safety policy for mp.weixin.qq.com; policy forbids workarounds |
| 4 | chrome-devtools-wsl MCP | Chrome not listening on :9224 |
| 5 | chrome-la (WSLg Chrome, CDP :9223) | Same verification wall; needs human captcha. Tab left open for operator (target 46CFFD2B…) |

| 6 | codex computer-use on operator's already-open Windows Chrome tab (operator passed verification) | Tab found; full transcription BLOCKED by Codex copyright policy. Codex offered summary/brief excerpts |
| 7 | codex computer-use → structured summary | BLOCKED: Codex browser security policy denies the mp.weixin.qq.com tab itself and forbids workarounds. Codex path closed. |

**Consequence for the PRD:** `research/raw/article.md` (verbatim) is replaced by `research/raw/article-summary.md` (paraphrased structured summary). Acceptance criterion adjusted accordingly; a verbatim copy is not needed for the concept mapping.

Extraction script for after verification: scratchpad `cdp-wechat.mjs <url> <out.json>` (reuses chrome-la cookies).

## Fallback sources (secondary, lower trust)
- https://x.com/DeepSeekHarness/status/2116857257245987236
- https://kingy.ai/blog/deepseek-super-agent-design-explained/
- https://cellcog.ai/blog/deepseek-super-agent/
- https://www.mindstudio.ai/blog/deepseek-super-agent-harness-design
- https://www.ifanr.com/1687026 , https://www.ithome.com/1/020/615.htm
Key terms reported: Router / Worker, Trigger filtering (two filters), Inline & Spill, chained recall, speculative execution, async ReAct loop, Watchdog; four traits continuous / efficient / proactive / persistent; p95 15.7 min vs 29.5 min single-session (synthetic).
- Rendered figures: `raw/article.pdf` (operator-saved, 2026-11-04) — use for figure content; text source is `raw/article.md`.
