/**
 * Decisions after specimen s09: the Eval audit over the last 24 hours, by kind, as a table. Work = accept and reopen.
 * The host returns no total for this list, so the tabs carry no counts and a partial page says so instead of implying a
 * total. The export's Actor column is dropped: DecisionView carries no actor.
 */
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { LoaderCircleIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmAction } from '@/components/confirm-action'
import { EmptyState, Meta, PageHeader, QueryView, SkeletonRows, SourceChip, StatusBadge, Time } from '@/components/kit'
import { FilterTabs } from '@/components/filter-tabs'
import { ScrollTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/records'
import { dismissWrite } from '@/api/mutations'
import { pagedItems, useDecisionPages, useSettings } from '@/api/queries'
import { DECISION_FILTERS, type DecisionFilter, type DecisionRow } from '@/contract'
import { copy } from '@/copy'
import { DEFAULT_FILTER } from '@/lib/filters'
import { clock } from '@/lib/format'
import { label, outcomeTone, reasonText } from '@/lib/labels'

function Rows({ items }: { items: DecisionRow[] }) {
  return <ScrollTable label={copy.decisions.tableLabel} minWidth="64rem">
    <TableHeader><TableRow>
      <TableHead scope="col">{copy.decisions.columns.when}</TableHead>
      <TableHead scope="col">{copy.decisions.columns.excerpt}</TableHead>
      <TableHead scope="col">{copy.decisions.columns.kind}</TableHead>
      <TableHead scope="col">{copy.decisions.columns.rule}</TableHead>
      <TableHead scope="col">{copy.decisions.columns.reason}</TableHead>
      <TableHead scope="col"><span className="sr-only">{copy.decisions.columns.actions}</span></TableHead>
    </TableRow></TableHeader>
    <TableBody>
      {items.map(decision => {
        const source = decision.thread.split(':')[0]
        const codes = decision.reason.map(reason => reason.code).join(', ')
        return <TableRow key={decision.id} className="hover:bg-accent">
          <TableCell className="text-xs whitespace-nowrap"><Time at={decision.at} format={clock} stacked /></TableCell>
          <TableCell className="w-[30%] min-w-64 whitespace-normal">
            <Link to="/threads/$key" params={{ key: decision.thread }} className="break-words text-foreground underline-offset-4 hover:underline">
              {decision.preview || decision.threadTitle || decision.thread}</Link>
            <Meta className="mt-1">{source && copy.labels.source[source] && <SourceChip source={source} />}<span>{copy.decisions.triggers(decision.triggerIds.length)}</span></Meta>
          </TableCell>
          <TableCell className="min-w-32 whitespace-normal">
            <StatusBadge tone={outcomeTone(decision.kind)} icon={null}>{label(copy.labels.outcome, decision.kind)}</StatusBadge>
            {decision.outcome !== decision.kind && <p className="mt-1 text-xs font-semibold">{label(copy.labels.outcome, decision.outcome)}
              {decision.outcome === 'wouldAccept' && <span className="font-normal text-muted-foreground"> ({copy.decisions.observe})</span>}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{label(copy.labels.strength, decision.strength).toLowerCase()}</p>
          </TableCell>
          <TableCell className="min-w-48 text-xs whitespace-normal">
            {decision.rules.length ? <ul className="space-y-1">{decision.rules.map(rule => <li key={rule.id} className="break-words">
              {rule.matched ? <StatusBadge tone="ok" icon={null} className="h-5">{rule.name} · {copy.decisions.matched}</StatusBadge>
                : <span className="text-muted-foreground">{rule.name} · {copy.decisions.notMatched}</span>}
              {rule.reason && <span className="block text-muted-foreground">{rule.reason}</span>}
            </li>)}</ul> : <span className="text-muted-foreground">{copy.states.none}</span>}
          </TableCell>
          <TableCell className="min-w-56 whitespace-normal">
            <p className="break-words">{reasonText(decision.reason)}</p>
            {codes && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{codes}</p>}
          </TableCell>
          <TableCell className="whitespace-nowrap">
            <div className="flex flex-col items-start gap-1">
              {decision.ticketId && <Link to="/tickets/$id" params={{ id: decision.ticketId }} className="text-xs text-primary underline-offset-4 hover:underline">
                {copy.decisions.ticket}</Link>}
              {decision.kind === 'unavailable' && <ConfirmAction write={dismissWrite} variables={decision.id} title={copy.actions.dismissTitle}
                body={copy.actions.dismissBody} target={decision.threadTitle ?? decision.thread} confirmLabel={copy.actions.dismissConfirm}
                label={copy.actions.dismissEllipsis} size="xs" icon={<XIcon aria-hidden />} result={() => ({ text: copy.actions.dismissResult })} />}
            </div>
          </TableCell>
        </TableRow>
      })}
    </TableBody>
  </ScrollTable>
}

function DecisionList({ filter }: { filter: DecisionFilter }) {
  const query = useDecisionPages(filter)
  return <QueryView query={query} skeleton={<SkeletonRows rows={5} />}>
    {data => {
      const items = pagedItems(data.pages, decision => decision.id)
      return items.length ? <div className="space-y-3">
        <Rows items={items} />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{query.hasNextPage ? copy.decisions.more : copy.decisions.complete(items.length)} {copy.decisions.kindNote}</span>
          {query.hasNextPage && <Button variant="outline" size="sm" disabled={query.isFetchingNextPage} aria-busy={query.isFetchingNextPage || undefined}
            onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage && <LoaderCircleIcon aria-hidden className="animate-spin" />}{copy.states.showMore}</Button>}
        </div>
      </div> : <EmptyState title={filter === 'all' ? copy.decisions.emptySystem : copy.decisions.emptyFilter(copy.decisions.filters[filter] ?? filter)}>
        {copy.decisions.emptyBody}</EmptyState>
    }}
  </QueryView>
}

export function DecisionsPage() {
  const search = useSearch({ from: '/decisions' })
  const navigate = useNavigate({ from: '/decisions' })
  const filter = search.kind ?? DEFAULT_FILTER.decisions
  const mode = useSettings().data?.blocks.eval.value.mode
  return <>
    <PageHeader title={copy.decisions.title} description={<>{copy.decisions.description}
      {mode && <> · {copy.overview.evalMode} <b className="font-semibold text-foreground">{label(copy.labels.mode, mode).toLowerCase()}</b></>}</>} />
    <FilterTabs value={filter} values={DECISION_FILTERS} labels={copy.decisions.filters} label={copy.decisions.filtersLabel}
      onChange={kind => void navigate({ search: kind === DEFAULT_FILTER.decisions ? {} : { kind } })}>
      <DecisionList key={filter} filter={filter} />
    </FilterTabs>
  </>
}
