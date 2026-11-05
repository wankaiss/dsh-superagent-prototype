/**
 * Overview after specimens s01–s03: a one-line health disclosure, "Needs you" (problems and person-stage Tickets), working
 * activity (Executor load and the Tickets and Evals in progress), the 24-hour counters, "Noticed but stayed quiet"
 * (Ignore Decisions), and how a Ticket can start. On an empty system "How work starts" moves up under Working.
 */
import { Link } from '@tanstack/react-router'
import { ChevronDownIcon, LoaderCircleIcon } from 'lucide-react'
import {
  Dot, EmptyState, LoadFailed, Meta, PageHeader, QueryView, Section, SectionHeading, SkeletonRows, SourceChip, StaleMarker, StatusBadge, Tag, Time, useNow,
} from '@/components/kit'
import { ProblemItem, ScrollTable, StageBadge, TableBody, TableCell, TableHead, TableHeader, TableRow, ThreadLine, TicketCard, TicketTitle } from '@/components/records'
import { freshness, useDecisions, useOverview, useSettings, useStateView, useThreads, useTickets } from '@/api/queries'
import type { Health, OverviewView, SettingsView, StateView } from '@/contract'
import { copy } from '@/copy'
import { clock, relative } from '@/lib/format'
import { healthName, healthTone, label, reasonText, threadTone } from '@/lib/labels'
import { cn } from '@/lib/utils'

const chatNames = (settings: SettingsView | undefined) => {
  const feishu = settings?.sources.find(source => source.id === 'feishu')
  if (!feishu?.value.enabled) return []
  return ((feishu.value.config as { chats?: { chatId?: string; name?: string }[] }).chats ?? [])
    .map(chat => chat.name || feishu.labels[chat.chatId ?? ''] || chat.chatId || '').filter(Boolean)
}

/** Repository · Feishu group · Eval mode, from GET state and GET settings; parts not yet known are left out. */
function Context({ state, settings }: { state: StateView | undefined; settings: SettingsView | undefined }) {
  const parts = [
    state?.setup.accounts?.repository,
    ...chatNames(settings).map(name => copy.overview.feishuGroup(name)),
  ].filter(Boolean)
  const mode = settings?.blocks.eval.value.mode
  if (!parts.length && !mode) return null
  return <>{parts.join(' · ')}{mode && <>{parts.length ? ' · ' : ''}{copy.overview.evalMode} <b className="font-semibold text-foreground">{label(copy.labels.mode, mode).toLowerCase()}</b></>}</>
}

/** One-line health summary, collapsed when every part is ready and nothing is paused; otherwise open by default. */
function HealthBoard({ state, problems }: { state: StateView; problems: number }) {
  const entries = Object.entries(state.health) as [string, Health][]
  const bad = entries.filter(([, item]) => item.state === 'error' || item.state === 'paused')
  const starting = entries.filter(([, item]) => item.state === 'starting')
  const ready = entries.filter(([, item]) => item.state === 'ready')
  const allReady = entries.length > 0 && ready.length === entries.length && !state.paused
  const [tone, title] = !entries.length ? ['idle', copy.states.notReported] as const
    : bad.length ? ['danger', copy.overview.healthSome(bad.length)] as const
      : starting.length ? ['info', copy.overview.healthStarting(starting.length)] as const
        : state.paused ? ['warn', copy.overview.healthPaused] as const : ['ok', copy.overview.healthAllReady] as const
  const summary = [
    ...problems ? [copy.overview.problemsBelow(problems)] : [],
    ...bad.map(([name, item]) => `${healthName(name)}: ${label(copy.labels.healthState, item.state).toLowerCase()}`),
    copy.overview.checksReady(ready.length, entries.length),
    state.paused ? copy.topbar.paused : copy.topbar.running,
  ].join(' · ')
  return <details key={allReady && !problems ? 'calm' : 'open'} open={!allReady || problems > 0}
    className="group rounded-lg border bg-card">
    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg px-3.5 py-2.5 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
      <Dot tone={tone} />
      <b className="font-semibold">{title}</b>
      <span className="min-w-0 flex-1 text-xs text-muted-foreground max-sm:sr-only">{summary}</span>
      <ChevronDownIcon aria-hidden className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      <span className="sr-only">{copy.overview.healthDetails}</span>
    </summary>
    <ul className="divide-y border-t px-3.5">
      {entries.map(([name, item]) => <li key={name} className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[13rem_6rem_minmax(0,1fr)] sm:items-start sm:gap-3">
        <span className="font-medium">{healthName(name)}</span>
        <StatusBadge tone={healthTone(item.state)} className="w-fit">{label(copy.labels.healthState, item.state)}</StatusBadge>
        <span className="min-w-0 text-xs break-words text-muted-foreground">{item.detail || copy.dash}
          {' · '}{item.at ? <Time at={item.at} /> : copy.overview.noTime}</span>
      </li>)}
    </ul>
  </details>
}

/** Segments = max workers: solid = running, hatched = queued, empty = free. The text carries the numbers. */
function LoadMeter({ executor }: { executor: OverviewView['executor'] }) {
  const { running, queued, maxWorkers } = executor
  if (!maxWorkers) return null
  const cells = Array.from({ length: maxWorkers }, (_, index) => index < running ? 'run' : index < running + queued ? 'queue' : 'free')
  return <div role="img" aria-label={copy.overview.loadAria(running, queued, maxWorkers)} className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
    {cells.map((cell, index) => <i key={index} className={cn('h-full flex-1', cell === 'run' && 'bg-status-info',
      cell === 'queue' && 'bg-[repeating-linear-gradient(135deg,var(--status-info)_0_3px,var(--status-info-subtle)_3px_6px)]')} />)}
  </div>
}

function Working({ executor, evaluating }: { executor: OverviewView['executor']; evaluating: number }) {
  const tickets = useTickets('working', 5)
  // The host's `evaluating` filter returns Threads with an Eval running and Threads with Triggers queued for one.
  const threads = useThreads('evaluating', 5)
  const now = useNow()
  const ticketState = freshness(tickets)
  const evalState = freshness(threads)
  const rows = ticketState.data?.items ?? []
  // Running Evals first, then queued ones; the truncation row below discloses anything past the five returned.
  const evals = [...evalState.data?.items ?? []].sort((a, b) => Number(!!b.evaluating) - Number(!!a.evaluating))
  const loading = ticketState.loading || evalState.loading
  const notices = [
    ticketState.failed && <LoadFailed key="tf" title={copy.overview.workingTicketsFailed} error={ticketState.failed} onRetry={() => void tickets.refetch()} />,
    ticketState.stale && <StaleMarker key="ts" title={copy.overview.workingTicketsStale} error={ticketState.stale} fetchedAt={ticketState.fetchedAt} />,
    evalState.failed && <LoadFailed key="ef" title={copy.overview.evalsFailed} error={evalState.failed} onRetry={() => void threads.refetch()} />,
    evalState.stale && <StaleMarker key="es" title={copy.overview.evalsStale} error={evalState.stale} fetchedAt={evalState.fetchedAt} />,
  ].filter(Boolean)
  return <Section id="working-card" title={<span className="font-normal"><b className="font-semibold">{copy.overview.executor}</b>{' '}
    {copy.overview.loadLine(executor.running, executor.queued, executor.maxWorkers)}</span>}
    description={copy.overview.idleTickets(executor.idle)} flush>
    <div className="px-4 pt-1 pb-3"><LoadMeter executor={executor} /></div>
    {notices.length > 0 && <div className="flex flex-col gap-2 px-4 pb-3 [&>div]:mb-0">{notices}</div>}
    {rows.length || evals.length ? <ScrollTable label={copy.overview.working} minWidth="40rem" className="rounded-none border-x-0 border-b-0">
      <TableHeader><TableRow>
        <TableHead scope="col">{copy.tickets.columns.title}</TableHead>
        <TableHead scope="col">{copy.tickets.columns.stage}</TableHead>
        <TableHead scope="col">{copy.overview.latest}</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {rows.map(ticket => <TableRow key={ticket.id}>
          <TableCell className="w-[45%] whitespace-normal"><TicketTitle ticket={ticket} />
            {ticket.threads.length > 0 && <div className="mt-1 flex flex-col gap-0.5">{ticket.threads.slice(0, 2).map(thread => <ThreadLine key={thread.key} thread={thread} link={false} />)}</div>}</TableCell>
          <TableCell><StageBadge row={ticket} /></TableCell>
          <TableCell className="whitespace-normal">
            {ticket.summary ? <p className="break-words">{ticket.summary}</p> : ticket.note ? <p className="break-words">{ticket.note.text}</p>
              : <p className="text-muted-foreground">{copy.dash}</p>}
            <Meta className="mt-1"><span>{copy.ticket.updated}</span><Time at={ticket.updatedAt} format={clock} /></Meta>
          </TableCell>
        </TableRow>)}
        {ticketState.data && ticketState.data.total > rows.length && <TableRow><TableCell colSpan={3}><Link to="/tickets" search={{ state: 'working' }}
          className="text-primary underline-offset-4 hover:underline">{copy.states.showing(rows.length, ticketState.data.total)}</Link></TableCell></TableRow>}
        {evals.map(thread => thread.evaluating ? <TableRow key={thread.key}>
          <TableCell className="whitespace-normal"><span className="font-medium">{copy.overview.evalInProgress}</span>
            <div className="mt-1"><ThreadLine thread={thread} /></div></TableCell>
          <TableCell><StatusBadge tone="info" icon={<LoaderCircleIcon aria-hidden className="size-3.5" />}>{label(copy.labels.threadStage, 'evaluating')}</StatusBadge></TableCell>
          <TableCell className="text-xs whitespace-normal text-muted-foreground">
            {copy.overview.evalWindow(clock(thread.evaluating.startedAt), clock(thread.evaluating.deadline), relative(thread.evaluating.deadline, now))}
            <span className="block">{label(copy.labels.strength, thread.evaluating.strength).toLowerCase()} · {copy.decisions.triggers(thread.evaluating.triggers)}</span>
          </TableCell>
        </TableRow> : <TableRow key={thread.key}>
          <TableCell className="whitespace-normal"><span className="font-medium">{copy.overview.evalQueued}</span>
            <div className="mt-1"><ThreadLine thread={thread} /></div></TableCell>
          <TableCell><StatusBadge tone={threadTone(thread.stage)} icon={null}>{label(copy.labels.threadStage, thread.stage)}</StatusBadge></TableCell>
          <TableCell className="text-xs whitespace-normal text-muted-foreground">
            {thread.pending > 0 ? copy.threads.pending(thread.pending) : copy.dash}
            {thread.latest && <span className="block"><Time at={thread.latest.at} format={clock} /></span>}
          </TableCell>
        </TableRow>)}
        {evalState.data && evalState.data.total > evals.length && <TableRow><TableCell colSpan={3}><Link to="/threads" search={{ filter: 'evaluating' }}
          className="text-primary underline-offset-4 hover:underline">{copy.overview.evalsShowing(evals.length, evalState.data.total)}</Link></TableCell></TableRow>}
        {loading && <TableRow><TableCell colSpan={3} className="text-xs text-muted-foreground"><span role="status">{copy.states.loading}</span></TableCell></TableRow>}
      </TableBody>
    </ScrollTable> : loading ? <div className="px-4 pb-3"><SkeletonRows rows={2} /></div>
      : ticketState.data ? <p className="px-4 pb-3.5 text-muted-foreground">{copy.overview.workingNone(evaluating)}</p> : null}
  </Section>
}

function Flow({ flow }: { flow: OverviewView['flow'] }) {
  const items: [string, number, string][] = [
    [copy.overview.received, flow.received, copy.overview.receivedHint],
    [copy.overview.filtered, flow.filtered, copy.overview.filteredHint],
    [copy.overview.triggers, flow.triggers, copy.overview.triggersHint],
    [copy.overview.judged, flow.judged, copy.overview.judgedHint],
    [copy.overview.accepted, flow.accepted, copy.overview.acceptedHint],
    [copy.overview.dropped, flow.dropped, copy.overview.droppedHint],
  ]
  const quiet = items.every(([, value]) => value === 0)
  return <div className="flex flex-col gap-1.5">
    {quiet ? <dl className="flex flex-wrap gap-x-3.5 gap-y-1">
      {items.map(([name, value]) => <div key={name} className="flex gap-1"><dd className="order-1 font-semibold tabular">{value.toLocaleString('en')}</dd>
        <dt className="order-2">{name.toLowerCase()}</dt></div>)}
      <div className="text-muted-foreground">· {copy.overview.evaluatingNow(flow.evaluating)}</div>
    </dl> : <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(([name, value, hint]) => <div key={name} className="flex min-w-0 flex-col rounded-lg border bg-card px-3 py-2.5">
        <dd className="order-1 text-[1.375rem] leading-tight font-semibold tabular">{value.toLocaleString('en')}</dd>
        <dt className="order-2 mt-0.5 text-xs font-semibold">{name.toLowerCase()}</dt>
        <dd className="order-3 mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</dd>
      </div>)}
    </dl>}
    <p className="text-xs text-muted-foreground">{quiet ? copy.overview.flowNote : `${copy.overview.evaluatingNow(flow.evaluating)}. ${copy.overview.flowNoteShort}`}</p>
  </div>
}

function Quiet() {
  const query = useDecisions('ignore')
  const now = useNow()
  return <QueryView query={query} skeleton={<SkeletonRows rows={2} />}>
    {data => {
      const more = data.next_offset !== null
      const would = data.items.filter(item => item.outcome === 'wouldAccept')
      const shown = (n: number) => more ? copy.overview.atLeast(n) : n.toLocaleString('en')
      if (!data.items.length) return <p className="text-muted-foreground">{copy.overview.quietNone}</p>
      return <div className="rounded-lg border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <Tag className="h-6 text-xs">{copy.overview.ignored} · {shown(data.items.length - would.length)}</Tag>
          <Tag className="h-6 text-xs">{copy.overview.wouldAcceptObserve} · {shown(would.length)}</Tag>
          <span className="text-xs text-muted-foreground">{copy.overview.quietNote}</span>
          <Link to="/decisions" search={{ kind: 'ignore' }} className="ml-auto text-xs text-primary underline-offset-4 hover:underline">{copy.overview.viewDecisions}</Link>
        </div>
        <ul className="divide-y">
          {data.items.slice(0, 5).map(item => {
            const source = item.thread.split(':')[0]
            const rule = item.rules.find(entry => entry.matched)
            return <li key={item.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-2">
              <span className="flex min-w-0 flex-1 basis-80 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <b className="font-semibold">{label(copy.labels.outcome, item.outcome)}</b><span aria-hidden className="text-muted-foreground">·</span>
                {source && copy.labels.source[source] && <SourceChip source={source} />}
                <Link to="/threads/$key" params={{ key: item.thread }} className="min-w-0 break-words text-foreground underline-offset-4 hover:underline">
                  {item.threadTitle ?? item.thread}</Link>
                <span className="text-xs text-muted-foreground">· {rule ? copy.overview.ruleMatched(rule.name) : reasonText(item.reason)}
                  {' · '}{label(copy.labels.strength, item.strength).toLowerCase()}
                  {item.triggerIds.length > 1 && <> · {copy.decisions.triggers(item.triggerIds.length)}</>}</span>
              </span>
              <span className="text-xs whitespace-nowrap text-muted-foreground tabular">{clock(item.at)} · {relative(item.at, now)}</span>
            </li>
          })}
        </ul>
      </div>
    }}
  </QueryView>
}

function Origin({ settings, state }: { settings: SettingsView; state: StateView | undefined }) {
  const feishu = settings.sources.find(source => source.id === 'feishu')
  const github = settings.sources.find(source => source.id === 'github')
  const chats = chatNames(settings)
  const policySources = settings.blocks.policy.value.sources as Record<string, { allowed?: { id: string; name?: string }[] }>
  const allowed = (id: string) => (policySources[id]?.allowed ?? []).map(entry => entry.name || entry.id)
  const mode = settings.blocks.eval.value.mode
  const accounts = state?.setup.accounts
  const who = (names: string[]) => names.length ? names.join(', ') : copy.system.allowNone
  return <div className="flex flex-col gap-2">
    {feishu?.value.enabled && <p className="flex flex-wrap items-baseline gap-x-1.5"><SourceChip source="feishu" />
      <span>{chats.length ? copy.overview.originFeishu(who(allowed('feishu')), chats.map(chat => `“${chat}”`).join(', ')) : copy.overview.originFeishuNone}</span></p>}
    {github?.value.enabled && accounts && <p className="flex flex-wrap items-baseline gap-x-1.5"><SourceChip source="github" />
      <span>{copy.overview.originGithub(who(allowed('github')), accounts.agent, accounts.repository)}</span></p>}
    <p>{copy.overview.originMode(label(copy.labels.mode, mode).toLowerCase())} <span className="text-muted-foreground">{copy.overview.modeHelp[mode] ?? ''}</span></p>
  </div>
}

export function OverviewPage() {
  const overview = useOverview()
  const state = useStateView()
  const settings = useSettings()
  const origin = <Section id="origin" title={copy.overview.origin}>
    <QueryView query={settings} skeleton={<SkeletonRows rows={2} />}>{value => <Origin settings={value} state={state.data} />}</QueryView>
  </Section>
  return <>
    <PageHeader title={copy.overview.title} description={<Context state={state.data} settings={settings.data} />} />
    <div className="flex flex-col gap-4">
      <QueryView query={state} skeleton={<SkeletonRows rows={1} />}>{value => <HealthBoard state={value} problems={overview.data?.problems.length ?? 0} />}</QueryView>
      <QueryView query={overview} skeleton={<SkeletonRows rows={4} />}>
        {data => {
          const empty = !data.person.length && !data.problems.length && data.executor.running + data.executor.queued + data.executor.idle === 0
          return <>
            <section aria-labelledby="needs-you" className="flex flex-col gap-2.5">
              <SectionHeading id="needs-you" extra={`· ${copy.overview.needsCount(data.person.length, data.problems.length)}`}>{copy.overview.needsYou}</SectionHeading>
              {data.person.length || data.problems.length ? <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {data.problems.map((problem, index) => <ProblemItem key={`${problem.kind}-${index}`} problem={problem} />)}
                {data.person.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
              </ul> : <EmptyState title={copy.overview.needsYouNone}>{copy.overview.needsYouNoneBody}</EmptyState>}
            </section>
            <section aria-labelledby="working" className="flex flex-col gap-2.5">
              <SectionHeading id="working">{copy.overview.working}</SectionHeading>
              <Working executor={data.executor} evaluating={data.flow.evaluating} />
            </section>
            {empty && origin}
            <section aria-labelledby="flow" className="flex flex-col gap-2.5">
              <SectionHeading id="flow" extra={empty ? undefined : `· ${copy.overview.flowTag}`}>{copy.overview.flow}</SectionHeading>
              <Flow flow={data.flow} />
            </section>
            <section aria-labelledby="quiet" className="flex flex-col gap-2.5">
              <SectionHeading id="quiet">{copy.overview.quiet}</SectionHeading>
              <Quiet />
            </section>
            {!empty && origin}
          </>
        }}
      </QueryView>
    </div>
  </>
}

