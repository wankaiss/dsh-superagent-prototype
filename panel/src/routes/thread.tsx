/**
 * Thread detail after specimen s08: Trigger timeline (oldest first) with each Trigger's disposition and Decision, the
 * Thread's Decisions, linked Tickets, context and correlation, and the Unsubscribe and Requeue writes. Earlier Triggers
 * page backward with the host's cursor.
 */
import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { BellOffIcon, BotIcon, MessageSquareIcon, RotateCcwIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ConfirmAction } from '@/components/confirm-action'
import {
  Banner, EmptyState, ExternalLink, LoadFailed, Meta, Mono, PageHeader, Prose, Section, SkeletonRows, SourceChip, StaleMarker, StatusBadge, Tag, Time,
} from '@/components/kit'
import { DecisionItem } from '@/components/decision-item'
import { StageBadge, ThreadFacts, ThreadLink } from '@/components/records'
import { requeueWrite, unsubscribeWrite } from '@/api/mutations'
import { freshness, useThread } from '@/api/queries'
import type { ThreadPage as ThreadView, TriggerRow } from '@/contract'
import { copy } from '@/copy'
import { clock } from '@/lib/format'
import { actorName, label, outcomeTone, reasonText, sourceName, threadTone, type Tone } from '@/lib/labels'

function Crumbs({ id }: { id: string }) {
  return <nav aria-label={copy.ticket.breadcrumb} className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
    <Link to="/threads" className="text-primary underline-offset-4 hover:underline">{copy.thread.back}</Link>
    <span aria-hidden>/</span><Mono className="text-muted-foreground">{id}</Mono>
  </nav>
}

function Disposition({ trigger }: { trigger: TriggerRow }) {
  const { disposition } = trigger
  const tags: { text: string; tone: Tone }[] = []
  if (disposition.decision) tags.push({ text: `${copy.thread.disposition.decision} · ${label(copy.labels.outcome, disposition.decision.outcome)}`, tone: outcomeTone(disposition.decision.outcome) })
  if (disposition.queued) tags.push({ text: copy.thread.disposition.queued, tone: 'info' })
  if (disposition.evaluating) tags.push({ text: copy.thread.disposition.evaluating, tone: 'info' })
  if (disposition.delivered) tags.push({ text: copy.thread.disposition.delivered, tone: 'info' })
  if (disposition.fanout.length) tags.push({ text: copy.thread.disposition.passedThrough, tone: 'info' })
  if (disposition.filtered) tags.push({ text: `${copy.thread.disposition.filtered}: ${reasonText(disposition.filtered)}`, tone: 'idle' })
  return <div className="flex flex-col gap-1">
    <div className="flex flex-wrap gap-1.5">
      {tags.map(tag => <StatusBadge key={tag.text} tone={tag.tone} icon={null}>{tag.text}</StatusBadge>)}
      {!tags.length && <span className="text-xs text-muted-foreground">{copy.thread.disposition.none}</span>}
    </div>
    {disposition.decision && <p className="text-xs break-words text-muted-foreground">{reasonText(disposition.decision.reason)}
      {disposition.decision.ticketId && <> · → {copy.decisions.ticket} <Link to="/tickets/$id" params={{ id: disposition.decision.ticketId }}
        className="text-primary underline-offset-4 hover:underline"><Mono>{disposition.decision.ticketId.slice(0, 12)}…</Mono></Link></>}</p>}
    {disposition.fanout.length > 0 && <p className="text-xs text-muted-foreground">{copy.thread.disposition.fanout}: {disposition.fanout.map((id, index) =>
      <span key={id}>{index > 0 && ', '}<Link to="/tickets/$id" params={{ id }} className="text-primary underline-offset-4 hover:underline"><Mono>{id.slice(0, 12)}…</Mono></Link></span>)}</p>}
    {disposition.handbacks.map(item => <p key={item.ticketId} className="text-xs text-status-warn-foreground">
      {item.title}: {copy.ticket.handedBack(reasonText(item.reason))}</p>)}
  </div>
}

function TriggerItem({ trigger }: { trigger: TriggerRow }) {
  return <li className="grid grid-cols-[22px_minmax(0,1fr)] gap-2.5 border-b py-2.5 last:border-b-0">
    <span aria-hidden className="mt-px flex size-[22px] items-center justify-center rounded-full bg-muted text-muted-foreground">
      {trigger.human ? <MessageSquareIcon className="size-3.5" /> : <BotIcon className="size-3.5" />}</span>
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <b className="text-sm font-semibold text-foreground">{actorName(trigger.actor)}</b>
        <span>{trigger.human ? copy.threads.person : copy.thread.automated}</span>
        <Time at={trigger.at} />
        {trigger.url && <ExternalLink href={trigger.url}>{copy.thread.open}</ExternalLink>}
      </div>
      <Prose text={trigger.text || trigger.preview} />
      <Disposition trigger={trigger} />
      <Meta>
        <span>{copy.thread.trigger} <Mono>{trigger.id}</Mono></span>
        <ConfirmAction write={requeueWrite} variables={trigger.id} title={copy.actions.requeueTitle} disabled={!trigger.actions.requeue}
          body={copy.actions.requeueBody} target={trigger.preview} confirmLabel={copy.actions.requeueConfirm} label={copy.actions.requeue} size="xs"
          icon={<RotateCcwIcon aria-hidden />} result={response => ({ text: copy.actions.requeueResult(response.queued), ok: response.queued })} />
        {!trigger.actions.requeue && <span>{copy.thread.notEligible}</span>}
      </Meta>
    </div>
  </li>
}

function Detail({ thread, before, setBefore }: { thread: ThreadView; before: string | null; setBefore: (value: string | null) => void }) {
  return <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div className="flex min-w-0 flex-col gap-4">
      {thread.pollError && <Banner tone="danger" title={copy.thread.pollError}><p>{thread.pollError}</p></Banner>}
      {thread.evaluating && <Banner tone="info" live={false} title={copy.thread.evaluating}>
        <p>{copy.threads.evalWindow(clock(thread.evaluating.startedAt), clock(thread.evaluating.deadline))}</p></Banner>}
      <Section id="timeline" title={copy.thread.timeline} description={copy.thread.timelineNote(thread.timeline.length)} actions={<>
        {thread.earlier && <Button size="sm" variant="outline" onClick={() => setBefore(thread.earlier)}>{copy.thread.earlier}</Button>}
        {before && <Button size="sm" variant="ghost" onClick={() => setBefore(null)}>{copy.thread.latest}</Button>}
      </>}>
        {thread.timeline.length ? <ol className="flex flex-col">{thread.timeline.map(trigger => <TriggerItem key={trigger.id} trigger={trigger} />)}</ol>
          : <p className="text-muted-foreground">{copy.thread.timelineEmpty}</p>}
        {!thread.earlier && thread.timeline.length > 0 && <p className="text-xs text-muted-foreground">{copy.thread.noEarlier}</p>}
      </Section>
      <Section id="decisions" title={copy.thread.decisionsCount(thread.decisions.length)}>
        {thread.decisions.length ? <ul className="flex flex-col gap-2">{thread.decisions.map(decision => <DecisionItem key={decision.id} decision={decision} />)}</ul>
          : <p className="text-muted-foreground">{copy.thread.decisionsEmpty}</p>}
      </Section>
    </div>
    <div className="flex min-w-0 flex-col gap-4">
      <Section id="tickets" title={copy.thread.ticketsCount(thread.tickets.length)}>
        {thread.tickets.length ? <ul className="flex flex-col gap-3">{thread.tickets.map(ticket => <li key={ticket.id} className="flex flex-col gap-1">
          <Link to="/tickets/$id" params={{ id: ticket.id }} className="font-semibold break-words text-primary underline-offset-4 hover:underline">{ticket.title}</Link>
          <div className="flex flex-wrap gap-1.5"><StageBadge row={ticket} />
            {thread.context.includes(ticket.id) && <Tag>{copy.ticket.contextOnly}</Tag>}</div>
        </li>)}</ul> : <p className="text-muted-foreground">{copy.thread.ticketsEmpty}</p>}
      </Section>
      <Section id="correlation" title={copy.thread.correlation}>
        <p className="text-xs text-muted-foreground">{copy.thread.contextTickets}: <span className="text-foreground">{thread.context.length ? thread.context.length.toLocaleString('en') : copy.states.none}</span></p>
        <div className="text-xs text-muted-foreground">{copy.thread.correlated}: {thread.correlated.length ? <ul className="mt-1 space-y-0.5 text-sm">{thread.correlated.map(other => <li key={other.key}>
          <ThreadLink thread={{ key: other.key, title: other.title, source: '' }} /></li>)}</ul> : <span className="text-foreground">{copy.states.none}</span>}</div>
        <p className="text-xs text-muted-foreground">{copy.thread.pending}: <span className="text-foreground tabular">{thread.pending.toLocaleString('en')}</span></p>
        <p className="text-xs text-muted-foreground">{copy.thread.key}: <Mono className="text-foreground">{thread.key}</Mono></p>
      </Section>
    </div>
  </div>
}

/** Remounts the page per Thread key, so the paging cursor (and any dialog state) never carries over to another Thread. */
export function ThreadPage() {
  const { key } = useParams({ from: '/threads/$key' })
  return <ThreadBody key={key} threadKey={key} />
}

function ThreadBody({ threadKey: key }: { threadKey: string }) {
  const [before, setBefore] = useState<string | null>(null)
  const query = useThread(key, before)
  const state = freshness(query)
  const thread = state.data
  if (!thread) return <>
    <PageHeader back={<Crumbs id={key} />} title={state.failed?.missing ? copy.thread.notFound : copy.thread.loadingTitle} />
    {state.failed ? state.failed.missing ? <EmptyState title={copy.thread.notFound}>{copy.errors.missingThread}</EmptyState>
      : <LoadFailed error={state.failed} onRetry={() => void query.refetch()} /> : <SkeletonRows rows={6} />}
  </>
  return <>
    <PageHeader back={<Crumbs id={thread.key} />} title={thread.title || thread.key}
      description={<span className="flex flex-wrap items-center gap-1.5 text-sm text-foreground">
        <StatusBadge tone={threadTone(thread.stage)} icon={null}>{label(copy.labels.threadStage, thread.stage)}</StatusBadge>
        <SourceChip source={thread.source} /><ThreadFacts facts={thread.facts} />
        <Tag>{copy.threads.subscriptions(thread.subscriptions)}</Tag>
      </span>}
      meta={<p className="text-xs text-muted-foreground">{copy.ticket.created} <Time at={thread.createdAt} /> · {copy.thread.lastActivity} <Time at={thread.lastAt} /></p>} />
    <div className="-mt-1 mb-4 flex flex-wrap items-center justify-end gap-2">
      {thread.url && <ExternalLink href={thread.url} className={buttonVariants({ variant: 'outline' })}>{copy.thread.openIn(sourceName(thread.source))}</ExternalLink>}
      <ConfirmAction write={unsubscribeWrite} variables={thread.key} title={copy.actions.unsubscribeTitle} body={copy.actions.unsubscribeBody}
        target={thread.title} confirmLabel={copy.actions.unsubscribeConfirm} label={copy.actions.unsubscribeEllipsis} icon={<BellOffIcon aria-hidden />}
        disabled={thread.subscriptions === 0} size="default"
        result={response => ({ text: copy.actions.unsubscribeResult(response.removed, response.context_delivery), ok: response.removed })} />
      {thread.subscriptions === 0 && <span className="w-full text-right text-xs text-muted-foreground">{copy.actions.unsubscribeNone}</span>}
    </div>
    {state.stale && <StaleMarker error={state.stale} fetchedAt={state.fetchedAt} />}
    <Detail thread={thread} before={before} setBefore={setBefore} />
  </>
}
