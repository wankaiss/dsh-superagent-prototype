/**
 * Code-based route tree (grill G2): six views plus two detail pages. Filters live in validated search params so they
 * survive reloads and browser history; values are the contract's filter keys, never display labels. A missing or
 * unknown value means the default filter. Each validator returns its key explicitly (possibly undefined) because the
 * router spreads the raw parent search under the validated one, which would otherwise let an invalid value through.
 */
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import {
  DECISION_FILTERS, THREAD_FILTERS, TICKET_FILTERS, type DecisionFilter, type ThreadFilter, type TicketFilter,
} from '@/contract'
import { AppShell } from '@/components/app-shell'
import { OverviewPage } from '@/routes/overview'
import { TicketsPage } from '@/routes/tickets'
import { TicketPage } from '@/routes/ticket'
import { ThreadsPage } from '@/routes/threads'
import { ThreadPage } from '@/routes/thread'
import { DecisionsPage } from '@/routes/decisions'
import { SourcesPage } from '@/routes/sources'
import { SystemPage } from '@/routes/system'
import { NotFound, RouteError } from '@/routes/not-found'

const pick = <T extends string>(allowed: readonly T[], value: unknown): T | undefined =>
  (allowed as readonly string[]).includes(String(value)) ? (value as T) : undefined

const root = createRootRoute({ component: AppShell, notFoundComponent: NotFound })
const overview = createRoute({ getParentRoute: () => root, path: '/', component: OverviewPage })
export const ticketsRoute = createRoute({
  getParentRoute: () => root, path: '/tickets', component: TicketsPage,
  validateSearch: (s: Record<string, unknown>): { state?: TicketFilter } => {
    const state = pick(TICKET_FILTERS, s.state)
    return { state }
  },
})
export const ticketRoute = createRoute({ getParentRoute: () => root, path: '/tickets/$id', component: TicketPage })
export const threadsRoute = createRoute({
  getParentRoute: () => root, path: '/threads', component: ThreadsPage,
  validateSearch: (s: Record<string, unknown>): { filter?: ThreadFilter } => {
    const filter = pick(THREAD_FILTERS, s.filter)
    return { filter }
  },
})
export const threadRoute = createRoute({ getParentRoute: () => root, path: '/threads/$key', component: ThreadPage })
export const decisionsRoute = createRoute({
  getParentRoute: () => root, path: '/decisions', component: DecisionsPage,
  validateSearch: (s: Record<string, unknown>): { kind?: DecisionFilter } => {
    const kind = pick(DECISION_FILTERS, s.kind)
    return { kind }
  },
})
const sources = createRoute({ getParentRoute: () => root, path: '/sources', component: SourcesPage })
const system = createRoute({ getParentRoute: () => root, path: '/system', component: SystemPage })

const routeTree = root.addChildren([overview, ticketsRoute, ticketRoute, threadsRoute, threadRoute, decisionsRoute, sources, system])
export const router = createRouter({ routeTree, defaultPreload: false, scrollRestoration: true, defaultErrorComponent: RouteError })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
