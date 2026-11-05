/**
 * Small application compositions shared by every view, styled after the Claude Design export (research/design):
 * status badges and dots, Source chips and tags, cards with a header bar, uppercase section headings, key/value lists,
 * time, link-outs and the four query states (loading, initial error, empty, stale).
 */
import { useEffect, useState, type ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import {
  ArrowUpRightIcon, CircleAlertIcon, CircleCheckIcon, CircleDashedIcon, HistoryIcon, LoaderCircleIcon, OctagonXIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/api/client'
import { freshness } from '@/api/queries'
import { copy } from '@/copy'
import { DASH, relative, utc } from '@/lib/format'
import { sourceName, type Tone } from '@/lib/labels'

export const toneSurface: Record<Tone, string> = {
  ok: 'bg-status-ok-subtle text-status-ok-foreground',
  info: 'bg-status-info-subtle text-status-info-foreground',
  warn: 'bg-status-warn-subtle text-status-warn-foreground',
  danger: 'bg-status-danger-subtle text-status-danger-foreground',
  idle: 'bg-status-idle-subtle text-status-idle-foreground',
}
const TONE_ICON: Record<Tone, typeof CircleCheckIcon> = {
  ok: CircleCheckIcon, info: LoaderCircleIcon, warn: CircleAlertIcon, danger: OctagonXIcon, idle: CircleDashedIcon,
}
export const toneText: Record<Tone, string> = {
  ok: 'text-status-ok-foreground', info: 'text-status-info-foreground', warn: 'text-status-warn-foreground',
  danger: 'text-status-danger-foreground', idle: 'text-status-idle-foreground',
}
const toneDot: Record<Tone, string> = {
  ok: 'bg-status-ok', info: 'bg-status-info', warn: 'bg-status-warn', danger: 'bg-status-danger', idle: 'bg-status-idle',
}
/** Left border colour of a card that needs a person (warn) or reports a problem (danger). */
export const toneEdge: Record<Tone, string> = {
  ok: 'border-l-status-ok', info: 'border-l-status-info', warn: 'border-l-status-warn', danger: 'border-l-status-danger', idle: 'border-l-status-idle',
}

/** Status label with an icon; colour is never the only signal. `icon={null}` drops the icon where the text says enough. */
export function StatusBadge({ tone, children, className, icon }: { tone: Tone; children: ReactNode; className?: string; icon?: ReactNode | null }) {
  const Icon = TONE_ICON[tone]
  return <span className={cn('inline-flex h-[22px] max-w-full items-center gap-1 rounded-md px-2 text-xs font-medium', toneSurface[tone], className)}>
    {icon === undefined ? <Icon aria-hidden className="size-3.5 shrink-0" /> : icon}
    <span className="min-w-0 truncate">{children}</span>
  </span>
}

/** Status dot; decorative, always next to text that carries the meaning. */
export const Dot = ({ tone, className }: { tone: Tone; className?: string }) =>
  <span aria-hidden className={cn('inline-block size-2 shrink-0 rounded-full', toneDot[tone], className)} />

/** Source chip ("Feishu", "GitHub"). */
export const SourceChip = ({ source, className }: { source: string; className?: string }) =>
  <span className={cn('inline-flex h-5 shrink-0 items-center rounded-[5px] border bg-card px-1.5 text-[11px] font-semibold tracking-wide text-foreground', className)}>
    {sourceName(source)}</span>

/** Quiet secondary chip ("explicit", "1 input", "context"). */
export const Tag = ({ children, className, mono }: { children: ReactNode; className?: string; mono?: boolean }) =>
  <span className={cn('inline-flex h-5 shrink-0 items-center gap-1 rounded-[5px] border bg-muted px-1.5 text-[11px] whitespace-nowrap text-muted-foreground',
    mono && 'font-mono', className)}>{children}</span>

/** Page title block: optional breadcrumb, h1, meta lines and actions (right, wrapping below on narrow screens). */
export function PageHeader({ title, description, actions, back, meta }: {
  title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: ReactNode; meta?: ReactNode
}) {
  return <header className="mb-4 flex flex-col gap-1">
    {back}
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1 basis-80 space-y-1">
        <h1 className="text-lg leading-snug font-semibold tracking-tight break-words">{title}</h1>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
        {meta}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>
}

/** Uppercase section heading used between Overview groups ("NEEDS YOU · 2 TICKETS"). */
export function SectionHeading({ id, children, extra }: { id?: string; children: ReactNode; extra?: ReactNode }) {
  return <h2 id={id} className="flex flex-wrap items-baseline gap-x-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
    <span>{children}</span>{extra && <span className="font-normal tracking-normal normal-case">{extra}</span>}
  </h2>
}

/** Card with a header bar (title, inline description, actions) and a padded body; `flush` drops the body padding for tables. */
export function Section({ title, description, actions, children, className, id, flush = false }: {
  title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string; flush?: boolean
}) {
  return <section aria-labelledby={id} className={cn('min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground', className)}>
    <div className="flex min-h-[42px] flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-2.5">
      <h2 id={id} className="text-sm font-semibold">{title}</h2>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    <div className={flush ? '' : 'flex flex-col gap-2.5 px-4 py-3.5'}>{children}</div>
  </section>
}

/** Definition list of label/value pairs; values wrap so long paths and ids never widen the page. One column on phones. */
export function KeyValueList({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return <dl className={cn('grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[minmax(7rem,max-content)_minmax(0,1fr)]', className)}>
    {items.map(([key, value], index) => <div key={index} className="contents">
      <dt className="pt-px text-xs text-muted-foreground max-sm:mt-1">{key}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>)}
  </dl>
}

export const Mono = ({ children, className }: { children: ReactNode; className?: string }) =>
  <span className={cn('font-mono text-xs [overflow-wrap:anywhere]', className)}>{children}</span>

/** Re-render periodically so relative times stay current (not announced; never inside a live region). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(id) }, [intervalMs])
  return now
}

/** Absolute UTC time first, relative second (`format` can shorten the absolute part, e.g. to the clock time). */
export function Time({ at, relativeOnly = false, className, format = utc, stacked = false }: {
  at: string | number | null | undefined; relativeOnly?: boolean; className?: string; format?: (at: string | number) => string
  /** Relative time on its own line (table cells). */
  stacked?: boolean
}) {
  const now = useNow()
  const absolute = utc(at)
  if (absolute === DASH) return <span className={className}>{DASH}</span>
  const iso = new Date(at!).toISOString()
  return <time dateTime={iso} title={absolute} className={cn('tabular', className)}>
    {relativeOnly ? relative(at, now) : stacked ? <><span className="block">{format(at!)}</span><span className="block text-muted-foreground">{relative(at, now)}</span></>
      : <>{format(at!)} <span className="text-muted-foreground">· {relative(at, now)}</span></>}
  </time>
}

/** Only http(s) URLs the API supplies become links; anything else renders as text. */
export const safeUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined
  try { const parsed = new URL(url); return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : undefined } catch { return undefined }
}
/** Link-out in a new tab with the export's ↗ glyph; its accessible name says it opens a new tab. */
export function ExternalLink({ href, children, className }: { href: string | undefined | null; children: ReactNode; className?: string }) {
  const url = safeUrl(href)
  if (!url) return <span className={className}>{children}</span>
  // DSH's own web UI asks for its sign-in link once per browser; say so wherever the console links there.
  return <a href={url} target="_blank" rel="noreferrer noopener" title={href === copy.dshUrl ? copy.dshAuthHint : undefined}
    className={cn('inline-flex max-w-full items-center gap-0.5 text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}>
    <span className="min-w-0 break-words">{children}</span><ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
    <span className="sr-only"> {copy.states.newTab}</span>
  </a>
}

/** Outcome of a successful response with nothing in it; never used for loading, errors or unknown values. */
export function EmptyState({ title, children, className }: { title: ReactNode; children?: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground', className)}>
    <p className="mb-1 font-semibold text-foreground">{title}</p>
    {children && <div className="mx-auto max-w-[56ch]">{children}</div>}
  </div>
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-2" aria-busy="true">
    <span role="status" className="text-xs text-muted-foreground">{copy.states.loading}</span>
    {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-9 w-full rounded-md" />)}
  </div>
}

/** Rounded banner in the page flow (problem, setup, offline, paused, needs-person); errors are alerts, the rest status. */
export function Banner({ tone, title, children, actions, icon, className, live = true }: {
  tone: Tone; title: ReactNode; children?: ReactNode; actions?: ReactNode; icon?: ReactNode; className?: string; live?: boolean
}) {
  const Icon = TONE_ICON[tone]
  return <div role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined}
    className={cn('flex flex-wrap items-start gap-x-2.5 gap-y-2 rounded-lg px-3.5 py-2.5 text-sm', toneSurface[tone], className)}>
    <span aria-hidden className="mt-0.5 shrink-0">{icon ?? <Icon className="size-4" />}</span>
    <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
      <p className="font-semibold">{title}</p>
      {children && <div className="flex flex-col gap-1 break-words">{children}</div>}
    </div>
    {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
}

export function LoadFailed({ error, onRetry, title = copy.states.loadFailed }: { error: ApiError; onRetry?: () => void; title?: ReactNode }) {
  return <Banner tone="danger" title={<>{title} <span className="font-normal">({copy.errors.kind[error.kind] ?? error.kind})</span></>}
    actions={onRetry && <Button size="sm" variant="outline" className="border-current bg-transparent text-inherit hover:bg-transparent hover:underline" onClick={onRetry}>
      <RefreshCwIcon aria-hidden />{copy.states.retry}</Button>}>
    <p>{error.message}</p>
    <p className="text-xs">{copy.states.unknownNotEmpty}</p>
  </Banner>
}

/**
 * Scoped marker for retained data whose latest refresh failed. Offline and restarting show the failure kind only (the
 * page banner carries the detail); any other failure shows the host's message.
 */
export function StaleMarker({ error, fetchedAt, title = copy.states.staleTitle }: { error: ApiError; fetchedAt: number | undefined; title?: ReactNode }) {
  const reason = error.kind === 'offline' || error.kind === 'restarting' ? copy.errors.kind[error.kind] ?? error.kind : error.message
  return <div className="mb-3 flex w-fit max-w-full items-start gap-1.5 rounded-md bg-status-warn-subtle px-2 py-1 text-xs text-status-warn-foreground">
    <HistoryIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
    <p className="min-w-0 break-words"><span className="font-semibold">{title}. </span>
      {copy.states.staleBody(fetchedAt ? utc(fetchedAt) : DASH, reason)}</p>
  </div>
}

/**
 * Renders one query's four states: skeleton while nothing has loaded, an error panel for an initial failure, the content
 * for a success, and the content under a stale marker when a later refresh failed.
 */
export function QueryView<T>({ query, children, skeleton, staleMarker = true }: {
  query: UseQueryResult<T>; children: (data: T) => ReactNode; skeleton?: ReactNode; staleMarker?: boolean
}) {
  const state = freshness(query)
  if (state.failed) return <LoadFailed error={state.failed} onRetry={() => void query.refetch()} />
  if (state.data === undefined) return <>{skeleton ?? <SkeletonRows />}</>
  return <>
    {staleMarker && state.stale && <StaleMarker error={state.stale} fetchedAt={state.fetchedAt} />}
    {children(state.data)}
  </>
}

/** A number, or "—" while unknown. */
export const Count = ({ value, className }: { value: number | undefined | null; className?: string }) =>
  <span className={cn('tabular', className)}>{typeof value === 'number' ? value.toLocaleString('en') : DASH}</span>

/** Plain text that keeps the author's line breaks; record content is untrusted and never parsed as markup. */
export const Prose = ({ text, className }: { text: string | undefined | null; className?: string }) =>
  <p className={cn('break-words whitespace-pre-wrap', className)}>{text || DASH}</p>

/** Muted "label value" pair used in record meta lines. */
export const Meta = ({ children, className }: { children: ReactNode; className?: string }) =>
  <div className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground', className)}>{children}</div>

