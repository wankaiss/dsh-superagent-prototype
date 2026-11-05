/** Threads list after specimen s08: filter tabs (Subscribed, Evaluating, Recent, All) with host totals and a labelled scrolling table. */
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, Meta, PageHeader, QueryView, SkeletonRows, SourceChip, StatusBadge, Time } from '@/components/kit'
import { FilterTabs } from '@/components/filter-tabs'
import { ScrollTable, TableBody, TableCell, TableHead, TableHeader, TableRow, ThreadFacts, ThreadLink } from '@/components/records'
import { pagedItems, useThreadCounts, useThreadPages } from '@/api/queries'
import { THREAD_FILTERS, type ThreadFilter, type ThreadRow } from '@/contract'
import { copy } from '@/copy'
import { DEFAULT_FILTER } from '@/lib/filters'
import { clock } from '@/lib/format'
import { actorName, label, threadTone } from '@/lib/labels'

function Rows({ items }: { items: ThreadRow[] }) {
  return <ScrollTable label={copy.threads.tableLabel} minWidth="52rem">
    <TableHeader>
      <TableRow>
        <TableHead scope="col">{copy.threads.columns.title}</TableHead>
        <TableHead scope="col">{copy.threads.columns.stage}</TableHead>
        <TableHead scope="col">{copy.threads.columns.latest}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map(thread => <TableRow key={thread.key} className="hover:bg-accent">
        <TableCell className="w-[42%] min-w-64 whitespace-normal">
          <ThreadLink thread={thread} className="font-medium text-foreground" />
          <Meta className="mt-1"><SourceChip source={thread.source} /><ThreadFacts facts={thread.facts} />
            {thread.subscriptions > 0 && <span>· {copy.threads.subscriptions(thread.subscriptions)}</span>}</Meta>
          {thread.tickets.length > 0 && <ul className="mt-1 space-y-0.5 text-xs">{thread.tickets.map(ticket => <li key={ticket.id} className="break-words">
            → {copy.decisions.ticket} <Link to="/tickets/$id" params={{ id: ticket.id }} className="text-primary underline-offset-4 hover:underline">{ticket.title}</Link>
            {ticket.state !== 'open' && <span className="text-muted-foreground"> ({ticket.state})</span>}
          </li>)}</ul>}
        </TableCell>
        <TableCell className="min-w-36 whitespace-normal">
          <StatusBadge tone={threadTone(thread.stage)} icon={thread.stage === 'evaluating' ? <LoaderCircleIcon aria-hidden className="size-3.5" /> : null}>
            {label(copy.labels.threadStage, thread.stage)}</StatusBadge>
          {thread.evaluating && <p className="mt-1 text-xs text-muted-foreground">{copy.threads.evalWindow(clock(thread.evaluating.startedAt), clock(thread.evaluating.deadline))}</p>}
          {thread.pending > 0 && <p className="mt-1 text-xs text-muted-foreground">{copy.threads.pending(thread.pending)}</p>}
        </TableCell>
        <TableCell className="min-w-64 whitespace-normal">
          {thread.latest ? <>
            <p className="line-clamp-3 break-words">{thread.latest.preview || copy.dash}</p>
            <Meta className="mt-1"><span>{actorName(thread.latest.actor)}</span><span>· {thread.latest.human ? copy.threads.person : copy.thread.automated}</span>
              <span>·</span><Time at={thread.latest.at} format={clock} /></Meta>
          </> : <span className="text-muted-foreground">{copy.dash}</span>}
        </TableCell>
      </TableRow>)}
    </TableBody>
  </ScrollTable>
}

function ThreadList({ filter, counts }: { filter: ThreadFilter; counts: Record<ThreadFilter, number | undefined> }) {
  const query = useThreadPages(filter)
  const emptySystem = counts.all === 0
  return <QueryView query={query} skeleton={<SkeletonRows rows={5} />}>
    {data => {
      const items = pagedItems(data.pages, thread => thread.key)
      const total = data.pages.at(-1)?.total ?? items.length
      return items.length ? <div className="space-y-3">
        <Rows items={items} />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{copy.states.showing(items.length, total)}</span>
          {query.hasNextPage && <Button variant="outline" size="sm" disabled={query.isFetchingNextPage} aria-busy={query.isFetchingNextPage || undefined}
            onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage && <LoaderCircleIcon aria-hidden className="animate-spin" />}{copy.states.showMore}</Button>}
        </div>
      </div> : emptySystem ? <EmptyState title={copy.threads.emptySystem}>{copy.threads.emptySystemBody}</EmptyState>
      : <EmptyState title={copy.threads.emptyFilter(copy.threads.filters[filter] ?? filter)}>{copy.threads.emptyFilterBody}</EmptyState>
    }}
  </QueryView>
}

export function ThreadsPage() {
  const search = useSearch({ from: '/threads' })
  const navigate = useNavigate({ from: '/threads' })
  const filter = search.filter ?? DEFAULT_FILTER.threads
  const counts = useThreadCounts()
  return <>
    <PageHeader title={copy.threads.title} description={copy.threads.description} />
    <FilterTabs value={filter} values={THREAD_FILTERS} labels={copy.threads.filters} counts={counts} label={copy.threads.filtersLabel}
      onChange={next => void navigate({ search: next === DEFAULT_FILTER.threads ? {} : { filter: next } })}>
      <ThreadList key={filter} filter={filter} counts={counts} />
    </FilterTabs>
  </>
}
