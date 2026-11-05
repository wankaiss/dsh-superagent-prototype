/**
 * Record compositions shared across views, after the export: stage badges, the "needs you" Ticket card, problem cards,
 * the Tickets table, Thread facts and links, and a labelled scrolling table region.
 */
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  CircleAlertIcon, ClockIcon, MessageSquareWarningIcon, OctagonXIcon, PauseIcon, RotateCcwIcon, TimerOffIcon, XIcon, ZapIcon,
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { ConfirmAction } from '@/components/confirm-action'
import { ExternalLink, Meta, Mono, Prose, SourceChip, StatusBadge, Tag, Time, toneEdge } from '@/components/kit'
import { dismissWrite, pauseWrite, requeueWrite, retryWrite } from '@/api/mutations'
import type { Problem, ThreadFactsView, TicketRow } from '@/contract'
import { copy } from '@/copy'
import { clock, en } from '@/lib/format'
import { healthName, label, reasonText, sourceName, ticketStage, type StageKind, type Tone } from '@/lib/labels'
import { cn } from '@/lib/utils'

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }

/** A table whose overflow scrolls inside a labelled, focusable region rather than widening the page. */
export function ScrollTable({ label: name, children, minWidth = '44rem', className }: { label: string; children: ReactNode; minWidth?: string; className?: string }) {
  return <div role="region" aria-label={name} tabIndex={0}
    className={cn('relative overflow-x-auto rounded-lg border bg-card outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}>
    <table className="w-full caption-bottom text-sm [&_tbody_tr:last-child_td]:border-b-0 [&_td]:border-b [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_th]:h-auto [&_th]:border-b [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground"
      style={{ minWidth }}>{children}</table>
  </div>
}

/** One Thread fact value (`{zh,en}` or string). */
const factText = (value: unknown) => typeof value === 'string' ? value : value && typeof value === 'object' ? en(value as { en?: string; zh?: string }) : copy.dash

export function ThreadFacts({ facts, className }: { facts: Record<string, { label?: unknown; value: unknown; problem?: true }> | undefined; className?: string }) {
  const entries = Object.entries(facts ?? {})
  if (!entries.length) return null
  return <span className={cn('inline-flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs', className)}>
    {entries.map(([id, fact], index) => <span key={id} className={fact.problem ? 'font-medium text-status-danger-foreground' : 'text-muted-foreground'}>
      {index > 0 && <span aria-hidden className="mr-1.5 text-muted-foreground">·</span>}
      {fact.label ? `${factText(fact.label)}: ` : ''}{factText(fact.value)}
    </span>)}
  </span>
}

export function ThreadLink({ thread, className }: { thread: Pick<ThreadFactsView, 'key' | 'title' | 'source'>; className?: string }) {
  return <Link to="/threads/$key" params={{ key: thread.key }} className={cn('break-words text-primary underline-offset-4 hover:underline', className)}>
    {thread.title || thread.key}
  </Link>
}

/** Source chip, Thread link and its facts on one wrapping line. */
export function ThreadLine({ thread, link = true }: { thread: Pick<ThreadFactsView, 'key' | 'title' | 'source' | 'facts'>; link?: boolean }) {
  return <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
    <SourceChip source={thread.source} />
    {link ? <ThreadLink thread={thread} className="text-xs" /> : <span className="text-xs break-words text-muted-foreground">{thread.title || thread.key}</span>}
    <ThreadFacts facts={thread.facts} />
  </span>
}

export function TicketTitle({ ticket, className }: { ticket: Pick<TicketRow, 'id' | 'title'>; className?: string }) {
  return <Link to="/tickets/$id" params={{ id: ticket.id }} className={cn('font-medium break-words text-foreground underline-offset-4 hover:underline', className)}>
    {ticket.title || ticket.id}
  </Link>
}

const STAGE_ICON: Record<StageKind, ReactNode> = {
  person: <CircleAlertIcon aria-hidden className="size-3.5 shrink-0" />,
  working: <ZapIcon aria-hidden className="size-3.5 shrink-0" />,
  queued: <ClockIcon aria-hidden className="size-3.5 shrink-0" />,
  idle: <ClockIcon aria-hidden className="size-3.5 shrink-0" />,
  ended: null,
}
export function StageBadge({ row }: { row: { stage: string; action?: string; ended?: { outcome: string } | null } }) {
  const stage = ticketStage(row)
  return <StatusBadge tone={stage.tone} icon={STAGE_ICON[stage.kind]}>{stage.label}</StatusBadge>
}

/** Card for a Ticket waiting on a person (export "NeedsYouCard"): what it needs and where the answer belongs. */
export function TicketCard({ ticket }: { ticket: TicketRow }) {
  const question = ticket.attention?.question
  // Only recorded facts: the reply channel the host gives person-stage rows, and the Threads the Ticket follows (no origin is implied).
  const reply = 'reply' in ticket ? ticket.reply : undefined
  return <li className={cn('flex min-w-0 flex-col gap-2 rounded-lg border border-l-[3px] bg-card px-3.5 py-3', toneEdge.warn)}>
    <div className="flex flex-wrap items-center gap-1.5">
      <StageBadge row={ticket} />
      {reply && <SourceChip source={reply.source} />}
      <Tag>{copy.labels.request[ticket.strength] ?? ticket.strength}</Tag>
    </div>
    <TicketTitle ticket={ticket} className="text-sm font-semibold text-primary" />
    {question ? <Prose text={question} className="text-[0.875rem] leading-normal" />
      : ticket.note ? <p className={cn('break-words', ticket.note.error && 'text-status-danger-foreground')}>{ticket.note.text}</p> : null}
    {reply && <Meta><span>{question ? copy.overview.answerVia : copy.overview.replyVia}</span>
      <ExternalLink href={reply.url} className="text-xs">{copy.ticket.replyIn(en(reply.label))}</ExternalLink></Meta>}
    {ticket.threads.length > 0 && <Meta><span>{copy.overview.threadsLabel}</span>
      {ticket.threads.slice(0, 2).map(thread => <ThreadLine key={thread.key} thread={thread} />)}</Meta>}
    <Meta><ClockIcon aria-hidden className="size-3.5" /><span>{copy.ticket.updated}</span><Time at={ticket.updatedAt} /></Meta>
    <div className="flex flex-wrap gap-2">
      <Link to="/tickets/$id" params={{ id: ticket.id }} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{copy.overview.openTicket}</Link>
      {ticket.actions.retry && <ConfirmAction write={retryWrite} variables={ticket.id} title={copy.actions.retryTitle} body={copy.actions.retryBody}
        target={<TargetTicket ticket={ticket} />} confirmLabel={copy.actions.retryConfirm} label={copy.actions.retryEllipsis} variant="secondary"
        result={() => ({ text: copy.actions.retryResult })} />}
    </div>
  </li>
}

/** The Ticket a confirmation acts on: title, id and stage. */
export function TargetTicket({ ticket, extra }: { ticket: { id: string; title: string; stage: string; action?: string; ended?: { outcome: string } | null }; extra?: ReactNode }) {
  return <div className="space-y-1">
    <p className="font-semibold break-words">{ticket.title || ticket.id} <span className="font-normal text-muted-foreground">·</span> <Mono>{ticket.id}</Mono></p>
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><StageBadge row={ticket} />{extra}</div>
  </div>
}

export function TicketRows({ items }: { items: TicketRow[] }) {
  return <ScrollTable label={copy.tickets.tableLabel} minWidth="56rem">
    <TableHeader>
      <TableRow>
        <TableHead scope="col">{copy.tickets.columns.title}</TableHead>
        <TableHead scope="col">{copy.tickets.columns.origin}</TableHead>
        <TableHead scope="col">{copy.tickets.columns.stage}</TableHead>
        <TableHead scope="col">{copy.tickets.columns.created}</TableHead>
        <TableHead scope="col">{copy.tickets.columns.updated}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map(ticket => <TableRow key={ticket.id} className="hover:bg-accent">
        <TableCell className="w-[26%] min-w-52 whitespace-normal">
          <TicketTitle ticket={ticket} />
          <div className="mt-1 flex flex-wrap gap-1">
            <Tag>{copy.labels.strength[ticket.strength]?.toLowerCase() ?? ticket.strength}</Tag>
            {ticket.inputs > 0 && <Tag>{copy.tickets.inputs(ticket.inputs)}</Tag>}
            {ticket.actions.retry && <Tag>{copy.tickets.retryAvailable}</Tag>}
          </div>
        </TableCell>
        <TableCell className="w-[30%] min-w-56 whitespace-normal">
          {ticket.threads.length ? <ul className="space-y-1">{ticket.threads.map(thread => <li key={thread.key}><ThreadLine thread={thread} /></li>)}</ul>
            : <span className="text-muted-foreground">{copy.dash}</span>}
        </TableCell>
        <TableCell className="min-w-48 whitespace-normal">
          <StageBadge row={ticket} />
          {ticket.attention?.question ? <p className="mt-1 text-xs text-muted-foreground">{copy.tickets.asked}</p>
            : ticket.note ? <p className={cn('mt-1 line-clamp-2 text-xs break-words', ticket.note.error ? 'text-status-danger-foreground' : 'text-muted-foreground')}>{ticket.note.text}</p> : null}
          {ticket.undelivered > 0 && <p className="mt-1 text-xs text-status-warn-foreground">{copy.tickets.undelivered(ticket.undelivered)}</p>}
        </TableCell>
        <TableCell className="text-xs whitespace-nowrap"><Time at={ticket.createdAt} format={clock} stacked /></TableCell>
        <TableCell className="text-xs whitespace-nowrap"><Time at={ticket.updatedAt} format={clock} stacked /></TableCell>
      </TableRow>)}
    </TableBody>
  </ScrollTable>
}

/** One overview problem, by kind (export "ProblemCard"): tone edge, title badge, the kind as text, host text, actions. */
export function ProblemItem({ problem }: { problem: Problem }) {
  const card = (tone: Tone, badge: string, icon: ReactNode, title: ReactNode, body?: ReactNode, actions?: ReactNode, source?: string) =>
    <li className={cn('flex min-w-0 flex-col gap-1.5 rounded-lg border border-l-[3px] bg-card px-3.5 py-3', toneEdge[tone])}>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge tone={tone} icon={icon}>{badge}</StatusBadge>
        <Tag mono>{copy.problems.kind(problem.kind)}</Tag>
        {source && <SourceChip source={source} />}
      </div>
      <p className="font-semibold break-words">{title}</p>
      {body && <div className="flex flex-col gap-1 text-xs break-words text-muted-foreground">{body}</div>}
      {actions && <div className="flex flex-wrap gap-2 pt-0.5">{actions}</div>}
    </li>
  const alert = <CircleAlertIcon aria-hidden className="size-3.5" />
  const dsh = <ExternalLink href={copy.dshUrl} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{copy.problems.editInDsh}</ExternalLink>
  const threadButton = (key: string) => <Link to="/threads/$key" params={{ key }} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{copy.problems.openThread}</Link>
  switch (problem.kind) {
    case 'setup': return card('danger', copy.problems.badge.setup, alert, problem.place === 'feishu' ? copy.problems.setupFeishu : copy.problems.setup,
      <Prose text={problem.detail} />, dsh)
    case 'no-source': return card('danger', copy.problems.badge.config, alert, copy.problems['no-source'], copy.problems.noSourceBody, dsh)
    case 'no-allowed': return card('warn', copy.problems.badge.config, alert, copy.problems['no-allowed'], copy.problems.noAllowedBody, dsh)
    case 'executor-paused': return card('warn', copy.problems.badge.paused, <PauseIcon aria-hidden className="size-3.5" />, copy.problems['executor-paused'],
      copy.banners.pausedBody,
      <ConfirmAction write={pauseWrite} variables={false} title={copy.actions.resumeTitle} body={copy.actions.resumeBody}
        confirmLabel={copy.actions.resumeConfirm} label={copy.banners.resume} variant="default"
        result={response => ({ text: copy.actions.pauseResult(response.paused) })} />)
    case 'runtime-error': return card('danger', copy.problems.badge.runtime, alert, copy.problems['runtime-error'](healthName(problem.name)), <Mono>{problem.detail}</Mono>)
    case 'source-error': return card('danger', copy.problems.badge.source, alert, problem.source.health.detail || copy.problems['source-error'](en(problem.source.title)),
      <p>{copy.problems['source-error'](en(problem.source.title))}{problem.source.health.at && <> · <Time at={problem.source.health.at} /></>}</p>,
      <Link to="/sources" className={buttonVariants({ variant: 'outline', size: 'sm' })}>{copy.problems.openSources}</Link>, problem.source.id)
    case 'eval-overdue': return card('warn', copy.problems.badge.overdue, <TimerOffIcon aria-hidden className="size-3.5" />, problem.thread.title || problem.thread.key,
      problem.thread.evaluating && <p>{copy.problems.started} {clock(problem.thread.evaluating.startedAt)} · {copy.problems.deadline} <Time at={problem.thread.evaluating.deadline} format={clock} /></p>,
      threadButton(problem.thread.key), problem.thread.source)
    case 'eval-unavailable': return card('danger', copy.problems.badge.unavailable, <XIcon aria-hidden className="size-3.5" />, problem.thread.title || problem.thread.key,
      <p>{copy.problems.reason}: {reasonText(problem.reason)}</p>,
      <>
        {threadButton(problem.thread.key)}
        {problem.triggerId && <ConfirmAction write={requeueWrite} variables={problem.triggerId} title={copy.actions.requeueTitle}
          body={copy.actions.requeueBody} target={problem.thread.title} confirmLabel={copy.actions.requeueConfirm}
          label={copy.actions.requeue} icon={<RotateCcwIcon aria-hidden />}
          result={response => ({ text: copy.actions.requeueResult(response.queued), ok: response.queued })} />}
        <ConfirmAction write={dismissWrite} variables={problem.decisionId} title={copy.actions.dismissTitle} body={copy.actions.dismissBody}
          target={problem.thread.title} confirmLabel={copy.actions.dismissConfirm} label={copy.actions.dismiss} icon={<XIcon aria-hidden />}
          result={() => ({ text: copy.actions.dismissResult })} />
      </>, problem.thread.source)
    case 'outgoing': return card('danger', copy.problems.badge.outgoing, <MessageSquareWarningIcon aria-hidden className="size-3.5" />,
      <Prose text={problem.outgoing.text} className="line-clamp-4" />,
      <><p>{copy.problems.outgoing(sourceName(problem.outgoing.channel.source), problem.outgoing.attempts)}</p><Mono>{problem.outgoing.error}</Mono></>,
      undefined, problem.outgoing.channel.source)
    default: return card('danger', copy.problems.badge.other, <OctagonXIcon aria-hidden className="size-3.5" />, label({}, (problem as { kind: string }).kind))
  }
}
