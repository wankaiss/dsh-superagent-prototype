/**
 * Typed caller for the dsh-superagent management API (`/orchestrator/api/*`), modelled on src/client/api.ts.
 * Only types come from the host; the browser bundle carries no host code.
 */
import type { Api, ApiRequest, ApiResponse, SetupProblem } from '@/contract'
import { copy } from '@/copy'

/**
 * How a request failed, so the shell can tell "cannot reach" from "restarting" from a refused action.
 * - `offline`: no host answer. Either the fetch was rejected (the panel server is unreachable) or the panel proxy answered
 *   with an empty-body 5xx (it could not reach the host; Vite answers 502 with no body).
 * - `restarting`: the empty-body 404 the DSH web server sends while dsh-superagent's routes are unmounted.
 * - `setup`, `user`, `validation`: the host's structured envelopes (setup problem, user error code, issues).
 * - `status`: any other HTTP failure, with the host's message when it sent one.
 * - `malformed`: a success status whose body is empty or not JSON; never treated as an empty success.
 * - `cancelled`: the caller aborted the request (TanStack Query cancelling an outdated fetch).
 */
export type FailureKind = 'offline' | 'restarting' | 'setup' | 'user' | 'validation' | 'status' | 'malformed' | 'cancelled'

export class ApiError extends Error {
  constructor(message: string, readonly kind: FailureKind, readonly status: number, readonly details: {
    issues?: { path: string; message: string }[]; setup?: SetupProblem; code?: string; values?: Record<string, string>
  } = {}) {
    super(message)
    this.name = 'ApiError'
  }
  /** The host confirmed the record does not exist (a 404 with a body), as opposed to the restarting empty 404. */
  get missing() { return this.status === 404 && this.kind !== 'restarting' }
  /**
   * The outcome of a write is unknown: no host answer reached the panel, the answer was unreadable, or the host failed
   * with a 5xx after receiving the request (it may have committed part of the write). Only 4xx answers are refusals.
   */
  get unconfirmed() { return this.kind === 'offline' || this.kind === 'malformed' || this.status >= 500 }
}

async function request<T>(path: string, method: string, body: unknown, signal: AbortSignal | undefined): Promise<T> {
  const headers: Record<string, string> = { 'x-orchestrator-request': '1' }
  if (body !== undefined) headers['content-type'] = 'application/json'
  let response: Response
  try {
    response = await fetch(`/orchestrator/api/${path}`, { method, headers, signal, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch (error) {
    if (signal?.aborted) throw new ApiError(copy.errors.cancelled, 'cancelled', 0)
    void error
    throw new ApiError(copy.errors.offline, 'offline', 0)
  }
  let text: string
  try { text = await response.text() } catch {
    if (signal?.aborted) throw new ApiError(copy.errors.cancelled, 'cancelled', 0)
    throw new ApiError(copy.errors.offline, 'offline', response.status)
  }
  let value: unknown
  let parsed = false
  if (text) { try { value = JSON.parse(text); parsed = true } catch { parsed = false } }
  const { status } = response
  if (response.ok) {
    if (!parsed || value === null || typeof value !== 'object') throw new ApiError(copy.errors.malformed, 'malformed', status)
    return value as T
  }
  if (!text && status === 404) throw new ApiError(copy.errors.restarting, 'restarting', status)
  if (!text && status >= 500) throw new ApiError(copy.errors.proxyUnreachable(status), 'offline', status)
  const failure = (parsed && value && typeof value === 'object' ? value : {}) as {
    error?: unknown; issues?: unknown; setup?: SetupProblem; code?: unknown; values?: Record<string, string>
  }
  const hostMessage = typeof failure.error === 'string' && failure.error ? failure.error : undefined
  const fallback = status >= 500 ? copy.errors.serverError(status) : copy.errors.requestFailed(status)
  // Same precedence as src/client/api.ts: a setup envelope, then a user error code, then validation issues, then the status.
  if (failure.setup) throw new ApiError(failure.setup.detail || hostMessage || fallback, 'setup', status, { setup: failure.setup })
  if (typeof failure.code === 'string') {
    throw new ApiError(hostMessage ?? fallback, 'user', status, { code: failure.code, values: failure.values ?? {} })
  }
  if (Array.isArray(failure.issues) && failure.issues.length) {
    throw new ApiError(hostMessage ?? fallback, 'validation', status, { issues: failure.issues as { path: string; message: string }[] })
  }
  throw new ApiError(hostMessage ?? fallback, 'status', status)
}

type Req<K extends keyof Api> = {} extends ApiRequest<K> ? ApiRequest<K> | undefined : ApiRequest<K>

/**
 * Calls one route, e.g. `call('GET tickets/:id', { id })` or `call('POST executor/pause', { body: { paused: true } })`.
 * Path parameters are URI-encoded; empty and undefined query values are omitted.
 */
export function call<K extends keyof Api>(route: K, req: Req<K>, init: { signal?: AbortSignal } = {}): Promise<ApiResponse<K>> {
  const [method, pattern] = (route as string).split(' ') as [string, string]
  const values = (req ?? {}) as Record<string, unknown> & { query?: Record<string, unknown>; body?: unknown }
  const path = pattern.replace(/:(\w+)/g, (_m, name: string) => encodeURIComponent(String(values[name])))
  const query = Object.entries(values.query ?? {}).filter(([, v]) => v !== undefined && v !== '')
    .map(([name, v]) => `${encodeURIComponent(name)}=${encodeURIComponent(String(v))}`).join('&')
  return request(query ? `${path}?${query}` : path, method, values.body, init.signal)
}

export const asApiError = (error: unknown): ApiError => error instanceof ApiError ? error
  : new ApiError(error instanceof Error ? error.message : String(error), 'status', 0)
