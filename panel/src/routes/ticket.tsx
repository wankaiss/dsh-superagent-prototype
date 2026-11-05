/**
 * Ticket detail after specimens s05–s07: header (stage, Source, asker, strength, times, Session, actions), what it needs
 * from a person or how it ended, the Mandate, one oldest-first timeline built only from recorded fields (the accepting
 * Decision, inputs, Assignments and their reports, the end), and side cards (Threads, environment, model, worker).
 * Polls every 2 s while working, 5 s otherwise. Stop and Retry follow `actions.stop` / `actions.retry` from the response.
 */
import type { ReactNode } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import {
  CheckIcon, CircleAlertIcon, CircleDashedIcon, FlagIcon, InfoIcon, MessageSquareIcon, MessageSquareTextIcon, ScaleIcon, ZapIcon,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ConfirmAction } from '@/components/confirm-action'
import {
  Banner, EmptyState, ExternalLink, KeyValueList, LoadFailed, Meta, Mono, PageHeader, Prose, QueryView, Section, SkeletonRows, SourceChip, StaleMarker,
  StatusBadge, Tag, Time, toneSurface,
} from '@/components/kit'
import { StageBadge, TargetTicket, ThreadFacts, ThreadLink } from '@/components/records'
import { retryWrite, stopWrite } from '@/api/mutations'
import { freshness, useModels, useSettings, useTicket } from '@/api/queries'
import type { Assignment, BasisFact, TicketInput, TicketPage as TicketView } from '@/contract'
import { copy } from '@/copy'
import { clock, en } from '@/lib/format'
import { actorName, label, outcomeTone, reasonText, sourceName, threadTone, type Tone } from '@/lib/labels'
import { cn } from '@/lib/utils'

function Crumbs({ id }: { id: string }) {
  return <nav aria-label={copy.ticket.breadcrumb} className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
    <Link to="/tickets" className="text-primary underline-offset-4 hover:underline">{copy.ticket.back}</Link>
    <span aria-hidden>/</span><Mono className="text-muted-foreground">{id}</Mono>
  </nav>
}

function factValue(fact: BasisFact): string {
  switch (fact.name) {
    case 'sender': return fact.value
    case 'addressed': return label(copy.labels.addressed, fact.value)
    case 'admission': return label(copy.labels.admissionCell, fact.value)
    case 'mode': return label(copy.labels.mode, fact.value)
    case 'rules': return fact.value.map(rule => rule.name).join(', ') || copy.states.none
    case 'legacyAuthority': return fact.value
    default: return copy.states.yes
  }
}

/** "Internal", "Delivered to worker", "Not yet delivered" chips: delivery to the worker Session, never to people. */
function Reach({ kind }: { kind: 'internal' | 'worker' | 'pending' }) {
  return <span className={cn('inline-flex h-5 items-center rounded border bg-card px-1.5 text-[11px] whitespace-nowrap',
    kind === 'pending' ? 'border-status-warn text-status-warn-foreground' : 'text-muted-foreground')}>
    {kind === 'internal' ? copy.ticket.internal : kind === 'worker' ? copy.ticket.deliveredToWorker : copy.ticket.notDelivered}
  </span>
}

interface Item { at: string; key: string; tone: Tone | 'muted'; icon: ReactNode; head: ReactNode; body?: ReactNode; meta?: ReactNode }

function inputItem(input: TicketInput): Item {
  const kind = label(copy.labels.input, input.kind)
  const reach = <Reach kind={input.delivered ? 'worker' : 'pending'} />
  if (input.kind === 'trigger') {
    const trigger = 'trigger' in input ? input.trigger : undefined
    return { at: input.at, key: input.id, tone: 'muted', icon: <MessageSquareIcon className="size-3.5" />,
      head: <><b>{kind}</b>{trigger && <span>{actorName(trigger.actor)}{!trigger.human && ` · ${copy.thread.automated}`}</span>}</>,
      body: trigger ? <Prose text={trigger.preview} /> : <Mono className="text-muted-foreground">{input.triggerId}</Mono>,
      meta: <>{reach}{trigger && <Link to="/threads/$key" params={{ key: trigger.thread }} className="text-primary underline-offset-4 hover:underline">{copy.ticket.openThread}</Link>}
        {trigger?.handback && <span className="text-status-warn-foreground">{copy.ticket.handedBack(reasonText(trigger.handback.reason))}</span>}</> }
  }
  let body: ReactNode = null
  if (input.kind === 'text' || input.kind === 'note') body = <Prose text={input.text} />
  else if (input.kind === 'policy-changed') body = <p>{copy.ticket.policyVersion}: <Mono>{input.from}</Mono> → <Mono>{input.to}</Mono>
    {input.effect?.rules?.length ? <span className="block text-xs text-muted-foreground">{input.effect.rules.map(rule => `${rule.name} (${rule.change})`).join(', ')}</span> : null}</p>
  else if (input.kind === 'reopen') body = <Mono className="text-muted-foreground">{input.decisionId}</Mono>
  else if (input.kind === 'resumed') body = <Mono className="text-muted-foreground">{input.triggerId}</Mono>
  return { at: input.at, key: input.id, tone: 'muted', icon: <MessageSquareTextIcon className="size-3.5" />,
    head: <b>{copy.ticket.inputItem(kind)}</b>, body, meta: <><Reach kind="internal" />{reach}</> }
}

function assignmentItems(assignment: Assignment, index: number): Item[] {
  const items: Item[] = [{ at: assignment.startedAt ?? assignment.createdAt, key: `a-${assignment.id}`, tone: assignment.state === 'running' ? 'info' : 'muted',
    icon: <ZapIcon className="size-3.5" />,
    head: <><b>{copy.ticket.assignment(index)} · {label(copy.labels.assignment, assignment.state).toLowerCase()}</b><Mono className="text-muted-foreground">{assignment.id}</Mono></>,
    body: <p>{assignment.startedAt ? copy.ticket.workerStarted(clock(assignment.startedAt)) : copy.ticket.notStarted}
      {assignment.ref && <> · {copy.ticket.session} <Mono>{assignment.ref}</Mono></>}
      {assignment.deliveredAt && <> · {copy.ticket.lastDelivery} {clock(assignment.deliveredAt)}</>}</p>,
    meta: <Reach kind="internal" /> }]
  if (assignment.report) items.push({ at: assignment.report.at, key: `r-${assignment.id}`,
    tone: assignment.report.state === 'blocked' || assignment.report.state === 'waiting' ? 'warn' : assignment.report.state === 'failed' ? 'danger'
      : assignment.report.state === 'ready' ? 'ok' : 'info',
    icon: assignment.report.state === 'progress' ? <InfoIcon className="size-3.5" /> : <CircleAlertIcon className="size-3.5" />,
    head: <b>{copy.ticket.reportItem(label(copy.labels.report, assignment.report.state).toLowerCase())}</b>,
    body: <Prose text={assignment.report.summary} />,
    meta: <><Reach kind="internal" /><span>{copy.ticket.relayNotRecorded}</span>
      {assignment.turnEndedAt && <span>· {copy.ticket.turnEndedAt(clock(assignment.turnEndedAt))}</span>}</> })
  if (assignment.endedAt) items.push({ at: assignment.endedAt, key: `e-${assignment.id}`, tone: 'muted', icon: <CircleDashedIcon className="size-3.5" />,
    head: <b>{copy.ticket.assignment(index)} · {copy.ticket.assignmentEnded}</b>,
    body: assignment.endedReason ? <p>{copy.ticket.reason}: {reasonText(assignment.endedReason)}</p> : undefined })
  return items
}

function Timeline({ ticket }: { ticket: TicketView }) {
  const { decision } = ticket
  const items: Item[] = [
    ...decision ? [{ at: decision.at, key: `d-${decision.id}`, tone: outcomeTone(decision.outcome), icon: <CheckIcon className="size-3.5" />,
      head: <><b>{copy.ticket.decisionItem(label(copy.labels.outcome, decision.outcome))}</b><span>{label(copy.labels.strength, decision.strength).toLowerCase()}</span></>,
      body: <>{decision.preview && <p className="text-muted-foreground">“{decision.preview}”</p>}<Prose text={reasonText(decision.reason)} /></>,
      meta: <Link to="/threads/$key" params={{ key: decision.thread }} className="text-primary underline-offset-4 hover:underline">{copy.ticket.openThread}</Link> } satisfies Item] : [],
    ...ticket.inputs.map(inputItem),
    ...ticket.assignments.flatMap((assignment, index) => assignmentItems(assignment, index + 1)),
    ...ticket.ended ? [{ at: ticket.ended.at, key: 'ended', tone: 'idle', icon: <FlagIcon className="size-3.5" />,
      head: <b>{copy.ticket.endedItem(label(copy.labels.ticketOutcome, ticket.ended.outcome))}</b>,
      body: <p>{copy.ticket.endedBy[ticket.ended.by] ?? ticket.ended.by}{ticket.ended.reason ? ` · ${reasonText(ticket.ended.reason)}` : ''}</p> } satisfies Item] : [],
  ].sort((a, b) => a.at.localeCompare(b.at))
  return <Section id="timeline" title={copy.ticket.timeline} description={copy.ticket.timelineNote}
    actions={<span className="hidden flex-wrap gap-1.5 sm:flex"><Reach kind="internal" /><Reach kind="pending" /></span>}>
    {items.length ? <ol className="flex flex-col">
      {items.map(item => <li key={item.key} className="grid grid-cols-[22px_minmax(0,1fr)] gap-2.5 border-b py-2.5 last:border-b-0">
        <span aria-hidden className={cn('mt-px flex size-[22px] items-center justify-center rounded-full',
          item.tone === 'muted' ? 'bg-muted text-muted-foreground' : toneSurface[item.tone])}>{item.icon}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground [&_b]:text-sm [&_b]:font-semibold [&_b]:text-foreground">
            {item.head}<Time at={item.at} format={clock} /></div>
          {item.body && <div className="mt-1 flex flex-col gap-1">{item.body}</div>}
          {item.meta && <Meta className="mt-1.5">{item.meta}</Meta>}
        </div>
      </li>)}
    </ol> : <p className="text-muted-foreground">{copy.ticket.timelineEmpty}</p>}
    <p className="text-xs text-muted-foreground">{copy.ticket.noDelivery}</p>
  </Section>
}

function NeedsPerson({ ticket }: { ticket: TicketView }) {
  const question = ticket.attention?.question
  const report = ticket.assignments.at(-1)?.report
  // The Thread of the Trigger the question answers (attention.triggerId), else the Threads the Ticket follows for work.
  const asked = ticket.attention?.triggerId
    ? ticket.inputs.find(input => input.kind === 'trigger' && input.triggerId === ticket.attention?.triggerId) : undefined
  const askedKey = asked && 'trigger' in asked ? asked.trigger?.thread : undefined
  const origin = askedKey ? ticket.threads.find(thread => thread.key === askedKey) : undefined
  const followed = origin ? [] : ticket.threads.filter(thread => !('context' in thread && thread.context))
  if (ticket.stage !== 'person' && !ticket.deliveryError) return null
  if (!question && !ticket.deliveryError && !ticket.note) return null
  return <Banner tone="warn" live={false} title={<>{question ? copy.ticket.question : ticket.deliveryError ? copy.ticket.deliveryError : copy.ticket.note}
    {report && <span className="font-normal"> · {copy.ticket.reportAt(label(copy.labels.report, report.state).toLowerCase(), clock(report.at))}</span>}</>}>
    <Prose text={question ?? ticket.deliveryError ?? ticket.note?.text} className="text-[0.9375rem] leading-normal" />
    {question && <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {origin ? <>{copy.ticket.answerWhere}<SourceChip source={origin.source} /><b className="font-semibold">{origin.title || origin.key}</b></>
        : followed.length ? <>{copy.ticket.answerFollowed}{followed.map(thread => <span key={thread.key} className="inline-flex items-center gap-1">
          <SourceChip source={thread.source} /><b className="font-semibold">{thread.title || thread.key}</b></span>)}</> : null}
      {copy.ticket.answerHow}</p>}
    <div className="flex flex-wrap gap-2 pt-1">
      {ticket.channels.map((channel, index) => <ExternalLink key={index} href={channel.url} className={buttonVariants({ size: 'sm' })}>
        {copy.ticket.replyIn(en(channel.label))}</ExternalLink>)}
      {(origin ? [origin] : followed).map(thread => <Link key={thread.key} to="/threads/$key" params={{ key: thread.key }}
        className={buttonVariants({ size: 'sm', variant: 'outline' })}>{copy.ticket.openThreadInConsole}{origin || followed.length < 2 ? '' : ` · ${sourceName(thread.source)}`}</Link>)}
    </div>
  </Banner>
}

function Mandate({ ticket }: { ticket: TicketView }) {
  const { mandate, decision } = ticket
  return <Section id="mandate" title={copy.ticket.mandate} description={copy.ticket.mandateNote}>
    <KeyValueList items={[
      [copy.ticket.asker, <span key="a" className="flex flex-col gap-0.5"><span className="flex flex-wrap items-center gap-1.5"><b className="font-semibold">{actorName(mandate.actor)}</b>
        <SourceChip source={mandate.actor.source} /></span>{mandate.actor.id && <Mono className="text-muted-foreground">{mandate.actor.id}</Mono>}</span>],
      [copy.ticket.strength, label(copy.labels.strength, mandate.strength)],
      ...ticket.basis.facts.map(fact => [label(copy.labels.basis, fact.name), factValue(fact)] as [string, string]),
      [copy.ticket.policyVersion, <Mono key="p">{mandate.policyVersion}</Mono>],
      [copy.ticket.scope, <Prose key="s" text={mandate.scope} />],
      ...decision ? [[copy.ticket.decision, <span key="d" className="flex flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2"><StatusBadge tone={outcomeTone(decision.outcome)} icon={null}>{label(copy.labels.outcome, decision.outcome)}</StatusBadge>
          <Time at={decision.at} className="text-xs" /></span>
        <Prose text={reasonText(decision.reason)} />
        <Link to="/threads/$key" params={{ key: decision.thread }} className="w-fit text-primary underline-offset-4 hover:underline">{decision.threadTitle ?? decision.thread}</Link>
      </span>] as [string, ReactNode]] : [],
      [copy.ticket.channels, ticket.channels.length ? <span key="c" className="flex flex-wrap gap-x-3">{ticket.channels.map((channel, index) =>
        <ExternalLink key={index} href={channel.url}>{en(channel.label)}</ExternalLink>)}
        <span className="text-muted-foreground">· {copy.ticket.undeliveredInputs(ticket.undelivered)}</span></span> : copy.ticket.channelsEmpty],
    ]} />
    {ticket.basis.legacy && <p className="text-xs text-muted-foreground">{copy.ticket.legacyBasis}</p>}
  </Section>
}

function Side({ ticket }: { ticket: TicketView }) {
  const settings = useSettings()
  const catalog = useModels().data
  const modelName = (model: { provider: string; model: string }) =>
    catalog?.groups.find(group => group.id === model.provider)?.models.find(entry => entry.id === model.model)?.name ?? model.model
  const assignment = ticket.assignments.at(-1)
  return <div className="flex min-w-0 flex-col gap-4">
    <Section id="threads" title={copy.ticket.threadsCount(ticket.threads.length)}>
      {ticket.threads.length ? <ul className="flex flex-col gap-3">{ticket.threads.map(thread => <li key={thread.key} className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <SourceChip source={thread.source} />
          {'context' in thread && thread.context && <Tag>{copy.ticket.contextOnly}</Tag>}
          <StatusBadge tone={threadTone(thread.stage)} icon={null}>{label(copy.labels.threadStage, thread.stage)}</StatusBadge>
        </div>
        <p className="break-words">{thread.title || thread.key}</p>
        <ThreadFacts facts={thread.facts} />
        <p className="flex flex-wrap gap-x-3 text-xs"><ThreadLink thread={{ ...thread, title: copy.ticket.threadLink }} />
          {thread.url && <ExternalLink href={thread.url}>{copy.thread.openIn(sourceName(thread.source))}</ExternalLink>}</p>
      </li>)}</ul> : <p className="text-muted-foreground">{copy.ticket.threadsEmpty}</p>}
    </Section>
    <Section id="environment" title={copy.ticket.environment}>
      {ticket.environment.length ? <dl className="flex flex-col gap-2">{ticket.environment.map(variable => <div key={variable.key} className="min-w-0">
        <dt className="text-xs text-muted-foreground">{en(variable.description)}</dt>
        <dd className="pl-3">{variable.value ? <Mono>{variable.value}</Mono> : <span className="text-muted-foreground">{copy.dash}</span>}</dd>
        <dd className="pl-3"><Mono className="text-[11px] text-muted-foreground">{variable.key}</Mono></dd>
      </div>)}</dl> : <p className="text-muted-foreground">{copy.ticket.environmentEmpty}</p>}
    </Section>
    <Section id="model" title={copy.ticket.model}>
      {/* "DSH default" only when a successful settings read has no Executor model; unknown while loading or failed. */}
      <QueryView query={settings} skeleton={<SkeletonRows rows={1} />}>
        {data => {
          const model = data.blocks.executor.value.model
          return model ? <p><b className="font-semibold">{modelName(model)}</b> <Mono className="text-muted-foreground">{model.provider} / {model.model}</Mono></p>
            : <p>{copy.system.modelDefault}</p>
        }}
      </QueryView>
      <p className="text-xs text-muted-foreground">{copy.ticket.modelNote}</p>
    </Section>
    <Section id="worker" title={copy.ticket.worker}>
      <KeyValueList items={[
        [copy.ticket.assignmentLabel, assignment ? <StatusBadge key="s" tone={assignment.state === 'running' ? 'info' : 'idle'} icon={null}>{label(copy.labels.assignment, assignment.state)}</StatusBadge> : copy.ticket.assignmentsEmpty],
        ...assignment?.startedAt ? [[copy.ticket.started, <Time key="t" at={assignment.startedAt} format={clock} />] as [string, ReactNode]] : [],
        ...assignment?.deliveredAt ? [[copy.ticket.lastDeliveryLabel, <Time key="d" at={assignment.deliveredAt} format={clock} />] as [string, ReactNode]] : [],
        ...assignment?.report ? [[copy.ticket.lastReport, `${label(copy.labels.report, assignment.report.state).toLowerCase()} · ${clock(assignment.report.at)}`] as [string, string]] : [],
        [copy.ticket.directory, ticket.directory ? <Mono key="dir">{ticket.directory}</Mono> : copy.dash],
        [copy.ticket.session, ticket.sessionId ? <Mono key="sid">{ticket.sessionId}</Mono> : copy.ticket.sessionNone],
        [copy.ticket.counts, `${copy.ticket.inputsShort(ticket.inputs.length)} · ${copy.ticket.assignmentsShort(ticket.assignments.length)}`],
      ]} />
      <ExternalLink href={copy.dshUrl} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}>{copy.topbar.openDsh}</ExternalLink>
    </Section>
  </div>
}

export function TicketPage() {
  const { id } = useParams({ from: '/tickets/$id' })
  const query = useTicket(id)
  const state = freshness(query)
  const ticket = state.data
  if (!ticket) return <>
    <PageHeader back={<Crumbs id={id} />} title={state.failed?.missing ? copy.ticket.notFound : copy.ticket.loadingTitle} />
    {state.failed ? state.failed.missing ? <EmptyState title={copy.ticket.notFound}>{copy.errors.missingTicket}</EmptyState>
      : <LoadFailed error={state.failed} onRetry={() => void query.refetch()} /> : <SkeletonRows rows={6} />}
  </>
  const target = <TargetTicket ticket={ticket} extra={ticket.sessionId ? <span>{copy.ticket.session} <Mono>{ticket.sessionId}</Mono></span> : undefined} />
  return <>
    <PageHeader back={<Crumbs id={ticket.id} />} title={ticket.title || ticket.id}
      description={<span className="flex flex-wrap items-center gap-1.5 text-sm text-foreground">
        <StageBadge row={ticket} /><SourceChip source={ticket.mandate.actor.source} />
        <span>{copy.ticket.askedBy} <b className="font-semibold">{actorName(ticket.mandate.actor)}</b></span>
        <Tag>{copy.labels.request[ticket.strength] ?? ticket.strength}</Tag>
      </span>}
      meta={<p className="text-xs text-muted-foreground">{copy.ticket.created} <Time at={ticket.createdAt} /> · {copy.ticket.updated} <Time at={ticket.updatedAt} /></p>} />
    <div className="-mt-1 mb-4 flex flex-wrap items-center justify-end gap-2">
      {ticket.sessionId && <span className="min-w-0 text-xs text-muted-foreground">{copy.ticket.session} <Mono>{ticket.sessionId}</Mono></span>}
      <ExternalLink href={copy.dshUrl} className={buttonVariants({ variant: 'outline' })}>{copy.topbar.openDsh}</ExternalLink>
      {ticket.actions.retry && <ConfirmAction write={retryWrite} variables={ticket.id} title={copy.actions.retryTitle} body={copy.actions.retryBody}
        target={target} confirmLabel={copy.actions.retryConfirm} label={copy.actions.retryEllipsis} variant="secondary" size="default"
        result={() => ({ text: copy.actions.retryResult })} />}
      {ticket.actions.stop && <ConfirmAction write={stopWrite} variables={ticket.id} title={copy.actions.stopTitle} body={copy.actions.stopBody}
        target={target} confirmLabel={copy.actions.stopConfirm} destructive label={copy.actions.stopEllipsis} variant="destructive" size="default"
        result={() => ({ text: copy.actions.stopResult })} />}
    </div>
    {state.stale && <StaleMarker error={state.stale} fetchedAt={state.fetchedAt} />}
    <div className="flex flex-col gap-4">
      {ticket.paused && ticket.state === 'open' && <Banner tone="warn" live={false} title={copy.ticket.paused} />}
      <NeedsPerson ticket={ticket} />
      {ticket.ended && <Banner tone="idle" live={false} icon={<ScaleIcon className="size-4" />}
        title={<>{copy.ticket.outcome}: {label(copy.labels.ticketOutcome, ticket.ended.outcome)}</>}>
        <p>{copy.ticket.endedBy[ticket.ended.by] ?? ticket.ended.by} · <Time at={ticket.ended.at} />
          {ticket.ended.reason && <> · {copy.ticket.reason}: {reasonText(ticket.ended.reason)}</>}</p>
        {ticket.summary && <Prose text={ticket.summary} className="text-foreground" />}
        <p className="text-xs">{copy.ticket.endedNote}</p>
      </Banner>}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Mandate ticket={ticket} />
          <Timeline ticket={ticket} />
        </div>
        <Side ticket={ticket} />
      </div>
    </div>
  </>
}
