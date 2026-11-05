/**
 * The one boundary to the host contract (src/app/api.ts). Everything under panel/src imports API types from here.
 * Only types cross, plus the two filter arrays, which are the contract's only values (that module has type imports only).
 */
import type { Api, ApiRequest, ApiResponse, ThreadFilter, TicketFilter } from '../../src/app/api.ts'

export { THREAD_FILTERS, TICKET_FILTERS } from '../../src/app/api.ts'
export type { Api, ApiRequest, ApiResponse, ThreadFilter, TicketFilter }

export type StateView = ApiResponse<'GET state'>
export type Health = StateView['health'][string]
export type SetupProblem = NonNullable<StateView['setup']['problem']>
export type Accounts = NonNullable<StateView['setup']['accounts']>

export type OverviewView = ApiResponse<'GET overview'>
export type Problem = OverviewView['problems'][number]

export type TicketList = ApiResponse<'GET tickets'>
export type TicketRow = TicketList['items'][number]
export type TicketPage = ApiResponse<'GET tickets/:id'>
export type TicketInput = TicketPage['inputs'][number]
export type Assignment = TicketPage['assignments'][number]
export type BasisFact = TicketPage['basis']['facts'][number]
export type ThreadFactsView = TicketRow['threads'][number]

export type ThreadList = ApiResponse<'GET threads'>
export type ThreadRow = ThreadList['items'][number]
export type ThreadPage = ApiResponse<'GET threads/:key'>
export type TriggerRow = ThreadPage['timeline'][number]

export type DecisionList = ApiResponse<'GET decisions'>
export type DecisionRow = DecisionList['items'][number]
export type Reason = DecisionRow['reason'][number]

export type SourceStatus = ApiResponse<'GET sources'>[number]
export type SettingsView = ApiResponse<'GET settings'>
export type SourceSettings = SettingsView['sources'][number]
export type SearchView = ApiResponse<'GET search'>
export type HistoryView = ApiResponse<'GET policy/history'>
export type PromptsView = ApiResponse<'GET prompts'>
export type ModelCatalog = ApiResponse<'GET models'>

export type Actor = TriggerRow['actor']
/** `{zh, en}` text as the host sends it. */
export interface Localized { zh: string; en: string }

/** Decision filter tabs, mapped to the `kind` CSV the host expects (as src/client/api.ts DECISION_KINDS). */
export const DECISION_FILTERS = ['work', 'stop', 'ignore', 'unavailable', 'all'] as const
export type DecisionFilter = typeof DECISION_FILTERS[number]
export const DECISION_KINDS: Readonly<Record<DecisionFilter, string>> = {
  work: 'accept,reopen', stop: 'stop', ignore: 'ignore', unavailable: 'unavailable', all: '',
}
