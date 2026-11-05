/**
 * Vite config for the standalone dsh-superagent panel.
 *
 * The DSH host accepts management calls only when Host is 127.0.0.1:<port>, Origin is absent or same-origin,
 * and the request carries `x-orchestrator-request: 1` (src/app/http.ts:75-79). This server proxies
 * `/orchestrator/api` to the host. It never adds that header: the browser client must send it, so it keeps
 * working as the cross-site request guard. A request whose Origin is not this panel's own origin is refused
 * here with 403; otherwise Origin is removed, which the host accepts.
 */
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ProxyOptions } from 'vite'
import { defineConfig } from 'vite'

const HOST = '127.0.0.1'
const PORT = Number(process.env.PANEL_PORT ?? 5178)
const TARGET = process.env.DSH_SUPERAGENT_URL ?? 'http://127.0.0.1:3082'
const SELF_ORIGINS = new Set([`http://${HOST}:${PORT}`, `http://localhost:${PORT}`])

/** Refuses API calls from any origin other than this panel, before the proxy sees them. */
function originGuard(): Plugin {
  const guard = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const origin = req.headers.origin
    if (req.url?.startsWith('/orchestrator/api') && origin !== undefined && !SELF_ORIGINS.has(origin)) {
      res.writeHead(403, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'Cross-origin request refused by the panel proxy' }))
      return
    }
    next()
  }
  return {
    name: 'dsh-superagent-origin-guard',
    configureServer: server => { server.middlewares.use(guard) },
    configurePreviewServer: server => { server.middlewares.use(guard) },
  }
}

const proxy: Record<string, ProxyOptions> = {
  '/orchestrator/api': {
    target: TARGET,
    changeOrigin: true,
    configure(server) {
      server.on('proxyReq', proxyReq => {
        proxyReq.removeHeader('origin')
        proxyReq.removeHeader('referer')
      })
    },
  },
}

export default defineConfig({
  plugins: [originGuard(), react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: HOST, port: PORT, strictPort: true, cors: false, proxy },
  preview: { host: HOST, port: PORT, strictPort: true, cors: false, proxy },
  build: { target: 'es2022', sourcemap: false },
})
