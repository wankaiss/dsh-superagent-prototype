/**
 * TanStack Query hooks per management route. One shared layer owns every polling timer.
 *
 * Intervals (prompt B3): 3 s state and overview, 5 s lists, 2 s for a working Ticket's detail (re-evaluated from each
 * response). Configuration reads (settings, policy history, prompts) poll every 30 s; the model catalogue is read once
 * per 5 min. No interval runs while the tab is hidden (`refetchIntervalInBackground: false`); focus refetches active data.
 *
 * No `placeholderData`: a new filter, Ticket, Thread or search query never shows another key's cached result. TanStack
 * keeps the last successful `data` of the same key when a refetch fails, which the stale marker reads.
 */
import { useInfiniteQuery, useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  DECISION_KINDS, THREAD_FILTERS, TICKET_FILTERS, type ApiResponse, type DecisionFilter, type ThreadFilter, type TicketFilter,
} from '@/contract'
import { ApiError, call } from './client'

export const INTERVAL = { status: 3_000, list: 5_000, working: 2_000, config: 30_000, catalogue: 300_000 } as const
export const PAGE = 50
export const DECISIONS_PAGE = 100

export const keys = {
  state: ['state'] as const,
  overview: ['overview'] as const,
  sources: ['sources'] as const,
  settings: ['settings'] as const,
  models: ['models'] as const,
  history: ['policy-history'] as const,
  prompts: ['prompts'] as const,
  ticketsAll: ['tickets'] as const,
  tickets: (state: TicketFilter, limit: number) => ['tickets', state, { limit }] as const,
  /** Offset-paged list (Show more); distinct from the `limit` keys the counts and Overview use, same `tickets` prefix. */
  ticketPages: (state: TicketFilter) => ['tickets', state, 'pages'] as const,
  ticketAll: ['ticket'] as const,
  ticket: (id: string) => ['ticket', id] as const,
  threadsAll: ['threads'] as const,
  threads: (filter: ThreadFilter, limit: number) => ['threads', filter, { limit }] as const,
  threadPages: (filter: ThreadFilter) => ['threads', filter, 'pages'] as const,
  threadAll: ['thread'] as const,
  thread: (key: string, before: string | null) => ['thread', key, { before }] as const,
  decisionsAll: ['decisions'] as const,
  decisions: (filter: DecisionFilter, limit: number) => ['decisions', filter, { limit, window: '24h' }] as const,
  decisionPages: (filter: DecisionFilter) => ['decisions', filter, 'pages', { window: '24h' }] as const,
  search: (q: string) => ['search', q] as const,
}

const poll = (ms: number) => ({ refetchInterval: ms, refetchIntervalInBackground: false, refetchOnWindowFocus: true }) as const
/** Do not retry a confirmed missing record or a request the host refused; retry transport failures once. */
const retry = (count: number, error: ApiError) =>
  !(error instanceof ApiError && (error.missing || ['user', 'validation', 'setup', 'malformed'].includes(error.kind))) && count < 1

export const useStateView = () => useQuery({ queryKey: keys.state, queryFn: ({ signal }) => call('GET state', undefined, { signal }),
  ...poll(INTERVAL.status), retry })
export const useOverview = () => useQuery({ queryKey: keys.overview, queryFn: ({ signal }) => call('GET overview', undefined, { signal }),
  ...poll(INTERVAL.status), retry })
export const useSources = () => useQuery({ queryKey: keys.sources, queryFn: ({ signal }) => call('GET sources', undefined, { signal }),
  ...poll(INTERVAL.list), retry })
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: ({ signal }) => call('GET settings', undefined, { signal }),
  ...poll(INTERVAL.config), retry })
export const useModels = () => useQuery({ queryKey: keys.models, queryFn: ({ signal }) => call('GET models', undefined, { signal }),
  staleTime: INTERVAL.catalogue, retry })
export const usePolicyHistory = () => useQuery({ queryKey: keys.history,
  queryFn: ({ signal }) => call('GET policy/history', undefined, { signal }), ...poll(INTERVAL.config), retry })
export const usePrompts = () => useQuery({ queryKey: keys.prompts, queryFn: ({ signal }) => call('GET prompts', undefined, { signal }),
  ...poll(INTERVAL.config), retry })

export const useTickets = (state: TicketFilter, limit = PAGE) => useQuery({
  queryKey: keys.tickets(state, limit), queryFn: ({ signal }) => call('GET tickets', { query: { state, limit } }, { signal }),
  ...poll(INTERVAL.list), retry,
})
/**
 * Tickets list paged by the host's `next_offset` in pages of `PAGE` (the host clamps `limit` to 1,000, so growing `limit`
 * cannot reach later records). A poll refetches every loaded page from offset 0; callers dedupe by id because new records
 * shift offsets between pages.
 */
export const useTicketPages = (state: TicketFilter) => useInfiniteQuery({
  queryKey: keys.ticketPages(state), initialPageParam: 0,
  getNextPageParam: (last: ApiResponse<'GET tickets'>) => last.next_offset ?? undefined,
  queryFn: ({ signal, pageParam }) => call('GET tickets', { query: { state, offset: pageParam, limit: PAGE } }, { signal }),
  ...poll(INTERVAL.list), retry,
})
/** Items of all loaded pages in order, keeping the first copy of a record that shifted into a later page. */
export function pagedItems<T>(pages: readonly { items: T[] }[], id: (item: T) => string): T[] {
  const seen = new Set<string>()
  return pages.flatMap(page => page.items).filter(item => {
    const key = id(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
/** `total` per Ticket filter, from `limit=1` reads; `undefined` until that filter's read succeeds. */
export function useTicketCounts(): Record<TicketFilter, number | undefined> {
  const results = useQueries({ queries: TICKET_FILTERS.map(state => ({
    queryKey: keys.tickets(state, 1), queryFn: ({ signal }: { signal: AbortSignal }) => call('GET tickets', { query: { state, limit: 1 } }, { signal }),
    ...poll(INTERVAL.list), retry,
  })) })
  return Object.fromEntries(TICKET_FILTERS.map((state, index) => [state, results[index]?.data?.total])) as Record<TicketFilter, number | undefined>
}
export const useTicket = (id: string) => useQuery({
  queryKey: keys.ticket(id), queryFn: ({ signal }) => call('GET tickets/:id', { id }, { signal }), retry,
  refetchInterval: query => (query.state.data?.stage === 'working' ? INTERVAL.working : INTERVAL.list),
  refetchIntervalInBackground: false, refetchOnWindowFocus: true,
})

export const useThreads = (filter: ThreadFilter, limit = PAGE) => useQuery({
  queryKey: keys.threads(filter, limit), queryFn: ({ signal }) => call('GET threads', { query: { filter, limit } }, { signal }),
  ...poll(INTERVAL.list), retry,
})
/** Threads list paged by `next_offset`, as `useTicketPages`; callers dedupe by key. */
export const useThreadPages = (filter: ThreadFilter) => useInfiniteQuery({
  queryKey: keys.threadPages(filter), initialPageParam: 0,
  getNextPageParam: (last: ApiResponse<'GET threads'>) => last.next_offset ?? undefined,
  queryFn: ({ signal, pageParam }) => call('GET threads', { query: { filter, offset: pageParam, limit: PAGE } }, { signal }),
  ...poll(INTERVAL.list), retry,
})
export function useThreadCounts(): Record<ThreadFilter, number | undefined> {
  const results = useQueries({ queries: THREAD_FILTERS.map(filter => ({
    queryKey: keys.threads(filter, 1), queryFn: ({ signal }: { signal: AbortSignal }) => call('GET threads', { query: { filter, limit: 1 } }, { signal }),
    ...poll(INTERVAL.list), retry,
  })) })
  return Object.fromEntries(THREAD_FILTERS.map((filter, index) => [filter, results[index]?.data?.total])) as Record<ThreadFilter, number | undefined>
}
export const useThread = (key: string, before: string | null) => useQuery({
  queryKey: keys.thread(key, before),
  queryFn: ({ signal }) => call('GET threads/:key', { key, query: before ? { before } : {} }, { signal }),
  ...poll(INTERVAL.list), retry,
})

export const useDecisions = (filter: DecisionFilter, limit = DECISIONS_PAGE) => useQuery({
  queryKey: keys.decisions(filter, limit),
  queryFn: ({ signal }) => call('GET decisions', { query: { kind: DECISION_KINDS[filter] || undefined, window: '24h', limit } }, { signal }),
  ...poll(INTERVAL.list), retry,
})

/** Decisions of the last 24 h paged by `next_offset` (the host caps one page at 200); callers dedupe by id. */
export const useDecisionPages = (filter: DecisionFilter) => useInfiniteQuery({
  queryKey: keys.decisionPages(filter), initialPageParam: 0,
  getNextPageParam: (last: ApiResponse<'GET decisions'>) => last.next_offset ?? undefined,
  queryFn: ({ signal, pageParam }) => call('GET decisions',
    { query: { kind: DECISION_KINDS[filter] || undefined, window: '24h', offset: pageParam, limit: DECISIONS_PAGE } }, { signal }),
  ...poll(INTERVAL.list), retry,
})

export const useSearch = (q: string) => useQuery({
  queryKey: keys.search(q), queryFn: ({ signal }) => call('GET search', { query: { q } }, { signal }),
  enabled: q.trim().length >= 2, staleTime: 2_000, retry: false,
})

/**
 * Freshness of one query, for the four UI states the prompt separates: loading (no data, no error), initial failure
 * (error, no data), success (data, maybe empty) and stale (data kept from `dataUpdatedAt`, current refresh failed).
 */
declare module '@tanstack/react-query' {
  // Every query and mutation function goes through `call`, which throws ApiError.
  interface Register { defaultError: ApiError }
}

export function freshness<T>(query: UseQueryResult<T>) {
  const error = query.error instanceof ApiError ? query.error : query.error ? new ApiError(String(query.error), 'status', 0) : undefined
  return {
    data: query.data,
    loading: query.data === undefined && !error,
    failed: query.data === undefined ? error : undefined,
    stale: query.data !== undefined && query.isError ? error : undefined,
    fetchedAt: query.dataUpdatedAt || undefined,
  }
}
