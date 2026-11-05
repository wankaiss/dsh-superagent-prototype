/** Top-bar facts: API connection, Executor pause switch, and the page banners derived from `GET state`. */
import { PlayIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ConfirmAction } from '@/components/confirm-action'
import { Banner, Dot, ExternalLink } from '@/components/kit'
import { pauseWrite } from '@/api/mutations'
import { freshness, useStateView } from '@/api/queries'
import { copy } from '@/copy'
import { clock } from '@/lib/format'
import type { Tone } from '@/lib/labels'

/** API reachability only; Source health and the Executor are separate facts shown elsewhere. */
export function ConnectionIndicator() {
  const state = freshness(useStateView())
  const error = state.failed ?? state.stale
  const [label, tone] = error
    ? error.kind === 'restarting' ? [copy.connection.restarting, 'warn'] as const
      : error.kind === 'offline' ? [copy.connection.offline, 'danger'] as const : [copy.connection.error, 'danger'] as const
    : state.data ? [copy.connection.connected, 'ok'] as const : [copy.connection.connecting, 'idle'] as const
  const detail = state.fetchedAt ? copy.connection.updated(clock(state.fetchedAt)) : copy.connection.neverFetched
  return <p className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" aria-label={`${copy.connection.describedAs}: ${label}, ${detail}`}>
    <Dot tone={tone as Tone} />
    <b className="font-semibold text-foreground max-sm:sr-only">{label}</b>
    <span className="truncate max-md:hidden">· {detail}</span>
  </p>
}

/** Pause switch: reflects `state.paused`, opens a confirmation, and only changes after the host answers and state refetches. */
export function PauseSwitch() {
  const state = useStateView()
  const paused = state.data?.paused
  // Without a current answer from GET state the pause status cannot be established, so the switch is disabled.
  const known = typeof paused === 'boolean' && !state.isError
  const text = !known ? copy.topbar.pauseUnknown : paused ? copy.topbar.paused : copy.topbar.running
  return <ConfirmAction write={pauseWrite} variables={!paused} inlineError={false}
    title={paused ? copy.actions.resumeTitle : copy.actions.pauseTitle}
    body={paused ? copy.actions.resumeBody : copy.actions.pauseBody}
    confirmLabel={paused ? copy.actions.resumeConfirm : copy.actions.pauseConfirm}
    result={response => ({ text: copy.actions.pauseResult(response.paused) })}
    disabled={!known}
    trigger={({ onClick, disabled, busy }) => <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-1 text-xs whitespace-nowrap has-disabled:cursor-not-allowed">
      <Switch checked={paused === true} disabled={disabled}
        onCheckedChange={(_checked, details) => { details.cancel(); onClick() }}
        aria-label={copy.topbar.pause} aria-describedby="pause-state" aria-busy={busy || undefined} />
      <span id="pause-state" className="max-sm:sr-only">{text}</span>
    </label>} />
}

/** Offline and restarting come from the state query's error; setup and paused come from a successful state answer. */
export function Banners() {
  const query = useStateView()
  const state = freshness(query)
  const error = state.failed ?? state.stale
  const data = state.data
  const setup = data?.setup.problem ?? null
  const feishu = data?.setup.feishuProblem ?? null
  const retry = <Button size="sm" variant="outline" className="border-current bg-transparent text-inherit hover:bg-transparent hover:underline"
    onClick={() => void query.refetch()}><RefreshCwIcon aria-hidden />{copy.banners.retryNow}</Button>
  return <div className="mb-4 flex flex-col gap-3 empty:hidden">
    {error?.kind === 'offline' && <Banner tone="danger" title={copy.banners.offlineTitle} actions={retry}>
      <p>{copy.banners.offlineBody}{data ? ` ${copy.banners.keptData}` : ''}</p><p className="text-xs">{error.message}</p></Banner>}
    {error?.kind === 'restarting' && <Banner tone="warn" title={copy.banners.restartingTitle} actions={retry}>
      <p>{copy.banners.restartingBody}{data ? ` ${copy.banners.keptData}` : ''}</p></Banner>}
    {error && !['offline', 'restarting', 'cancelled'].includes(error.kind) && <Banner tone="danger" title={copy.banners.apiErrorTitle} actions={retry}>
      <p>{error.message}</p></Banner>}
    {[setup, feishu].filter(problem => problem !== null).map(problem => <Banner key={problem.code} tone="danger"
      title={problem.place === 'feishu' && problem === feishu ? copy.banners.setupFeishuTitle : copy.banners.setupTitle}
      actions={<ExternalLink href={copy.dshUrl} className="font-medium">{copy.problems.editInDsh}</ExternalLink>}>
      <p className="whitespace-pre-wrap">{problem.detail}</p><p className="text-xs">{copy.banners.setupHint}</p>
    </Banner>)}
    {data?.paused && <Banner tone="warn" title={copy.banners.pausedTitle}
      actions={<ConfirmAction write={pauseWrite} variables={false} title={copy.actions.resumeTitle} body={copy.actions.resumeBody}
        confirmLabel={copy.actions.resumeConfirm} label={copy.banners.resume} icon={<PlayIcon aria-hidden />} variant="default"
        result={response => ({ text: copy.actions.pauseResult(response.paused) })} />}>
      <p>{copy.banners.pausedBody}</p>
    </Banner>}
  </div>
}
