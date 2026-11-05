/**
 * The six permitted writes (prompt B5), each with the queries it can change. Components run them only through
 * `ConfirmAction` (confirm → pending → toast → invalidate). Mutations never retry automatically.
 */
import { useIsMutating, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import type { ApiResponse } from '@/contract'
import { call } from './client'
import { keys } from './queries'

export interface Write<V, R> {
  /** Stable name; with the target it forms the mutation key that blocks duplicate submissions across the page. */
  name: string
  target: (variables: V) => string
  run: (variables: V) => Promise<R>
  invalidate: (variables: V) => QueryKey[]
}

const always: QueryKey[] = [keys.state, keys.overview]

export const pauseWrite: Write<boolean, ApiResponse<'POST executor/pause'>> = {
  name: 'pause', target: () => 'executor',
  run: paused => call('POST executor/pause', { body: { paused } }),
  invalidate: () => [keys.ticketsAll, keys.ticketAll],
}
export const stopWrite: Write<string, ApiResponse<'POST tickets/:id/stop'>> = {
  name: 'stop', target: id => id,
  run: id => call('POST tickets/:id/stop', { id }),
  invalidate: id => [keys.ticket(id), keys.ticketsAll, keys.threadsAll, keys.threadAll],
}
export const retryWrite: Write<string, ApiResponse<'POST tickets/:id/retry'>> = {
  name: 'retry', target: id => id,
  run: id => call('POST tickets/:id/retry', { id }),
  invalidate: id => [keys.ticket(id), keys.ticketsAll],
}
export const requeueWrite: Write<string, ApiResponse<'POST triggers/:id/requeue'>> = {
  name: 'requeue', target: id => id,
  run: id => call('POST triggers/:id/requeue', { id }),
  invalidate: () => [keys.threadsAll, keys.threadAll, keys.decisionsAll, keys.sources, ['search']],
}
export const dismissWrite: Write<string, ApiResponse<'POST decisions/:id/dismiss'>> = {
  name: 'dismiss', target: id => id,
  run: id => call('POST decisions/:id/dismiss', { id }),
  invalidate: () => [keys.decisionsAll, keys.threadAll],
}
export const unsubscribeWrite: Write<string, ApiResponse<'POST threads/:key/unsubscribe'>> = {
  name: 'unsubscribe', target: key => key,
  run: key => call('POST threads/:key/unsubscribe', { key }),
  invalidate: () => [keys.threadsAll, keys.threadAll, keys.ticketAll, keys.ticketsAll],
}

export const writeKey = <V, R>(write: Write<V, R>, variables: V) => ['write', write.name, write.target(variables)] as const

/** One write for one target; `busy` is true while any instance of the same write on the same target is in flight. */
export function useWrite<V, R>(write: Write<V, R>, variables: V) {
  const client = useQueryClient()
  const mutationKey = writeKey(write, variables)
  const mutation = useMutation({
    mutationKey, mutationFn: () => write.run(variables), retry: false,
    // Refetch whatever the write may have changed, after success, refusal or a lost response alike. Not awaited, so the
    // host's answer is announced first and the views update when the refetches land.
    onSettled: () => { void Promise.all([...always, ...write.invalidate(variables)].map(queryKey => client.invalidateQueries({ queryKey }))) },
  })
  const inFlight = useIsMutating({ mutationKey })
  return { mutation, busy: inFlight > 0 }
}
