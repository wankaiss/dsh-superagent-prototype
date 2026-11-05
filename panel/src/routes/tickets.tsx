/** Tickets list: filter tabs with host totals, one table per filter, and empty states that tell an empty system from an empty filter. */
import { useNavigate, useSearch } from '@tanstack/react-router'
import { LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, QueryView, SkeletonRows } from '@/components/kit'
import { FilterTabs } from '@/components/filter-tabs'
import { TicketRows } from '@/components/records'
import { pagedItems, useTicketCounts, useTicketPages } from '@/api/queries'
import { TICKET_FILTERS, type TicketFilter } from '@/contract'
import { copy } from '@/copy'
import { DEFAULT_FILTER } from '@/lib/filters'

function TicketList({ filter, counts }: { filter: TicketFilter; counts: Record<TicketFilter, number | undefined> }) {
  const query = useTicketPages(filter)
  // "No Tickets yet" only when the host reported zero open and zero ended Tickets.
  const emptySystem = counts.open === 0 && counts.ended === 0
  return <QueryView query={query} skeleton={<SkeletonRows rows={5} />}>
    {data => {
      const items = pagedItems(data.pages, ticket => ticket.id)
      const total = data.pages.at(-1)?.total ?? items.length
      return items.length ? <div className="space-y-3">
        <TicketRows items={items} />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{copy.tickets.showing(items.length, total, (copy.tickets.filters[filter] ?? filter).toLowerCase())}</span>
          {query.hasNextPage && <Button variant="outline" size="sm" disabled={query.isFetchingNextPage} aria-busy={query.isFetchingNextPage || undefined}
            onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage && <LoaderCircleIcon aria-hidden className="animate-spin" />}{copy.states.showMore}</Button>}
        </div>
      </div> : emptySystem ? <EmptyState title={copy.tickets.emptySystem}>{copy.tickets.emptySystemBody}</EmptyState>
      : <EmptyState title={copy.tickets.emptyFilter(copy.tickets.filters[filter] ?? filter)}>{copy.tickets.emptyFilterBody}</EmptyState>
    }}
  </QueryView>
}

export function TicketsPage() {
  const search = useSearch({ from: '/tickets' })
  const navigate = useNavigate({ from: '/tickets' })
  const filter = search.state ?? DEFAULT_FILTER.tickets
  const counts = useTicketCounts()
  return <>
    <PageHeader title={copy.tickets.title} description={copy.tickets.summary(counts.open, counts.ended)} />
    <FilterTabs value={filter} values={TICKET_FILTERS} labels={copy.tickets.filters} counts={counts} label={copy.tickets.filtersLabel}
      onChange={state => void navigate({ search: state === DEFAULT_FILTER.tickets ? {} : { state } })}>
      <TicketList key={filter} filter={filter} counts={counts} />
    </FilterTabs>
  </>
}
