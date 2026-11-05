/** Sources after specimen s10: one card per Source with state, health parts, 24-hour counts, and recently filtered and dropped items. */
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Banner, EmptyState, ExternalLink, Meta, Mono, PageHeader, QueryView, Section, SkeletonRows, StatusBadge, Tag, Time } from '@/components/kit'
import { useSources } from '@/api/queries'
import type { SourceStatus } from '@/contract'
import { copy } from '@/copy'
import { en } from '@/lib/format'
import { actorName, healthName, healthTone, label, reasonText, sourceTone } from '@/lib/labels'

const Part = ({ title, children }: { title: string; children: ReactNode }) => <div className="flex flex-col gap-2">
  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</h3>{children}</div>

function SourceCard({ source }: { source: SourceStatus }) {
  return <Section id={`source-${source.id}`} title={<span className="flex flex-wrap items-center gap-1.5">{en(source.title)}
    <StatusBadge tone={sourceTone(source.state)} className="font-medium">{label(copy.labels.sourceState, source.state)}</StatusBadge>
    <Tag className="font-normal">{source.installed ? copy.sources.installed : copy.sources.notInstalled}</Tag>
    <Tag className="font-normal">{source.enabled ? copy.sources.enabled : copy.sources.disabled}</Tag>
  </span>}>
    <div className="flex flex-col gap-4">
      {'problem' in source && source.problem && <Banner tone="danger" title={copy.sources.problem}
        actions={<ExternalLink href={copy.dshUrl}>{copy.problems.editInDsh}</ExternalLink>}><p className="whitespace-pre-wrap">{source.problem.detail}</p></Banner>}
      <Part title={copy.sources.health}>
        {source.health.length ? <ul className="flex flex-col gap-2">{source.health.map(part => <li key={part.name} className="grid grid-cols-1 gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3">
          <Mono className="pt-0.5" >{part.name}</Mono>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1"><StatusBadge tone={healthTone(part.state)} icon={null}>{label(copy.labels.healthState, part.state)}</StatusBadge>
              <span className="break-words">{part.detail || healthName(part.name)}</span></p>
            <p className="mt-0.5 text-xs text-muted-foreground">{part.at ? <Time at={part.at} /> : copy.overview.noTime}</p>
          </div>
        </li>)}</ul> : <p className="text-muted-foreground">{copy.states.notReported}</p>}
      </Part>
      <Part title={copy.sources.stats}>
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <span><b className="font-semibold tabular">{source.stats.received.toLocaleString('en')}</b> {copy.sources.received.toLowerCase()}</span>
          <span><b className="font-semibold tabular">{source.stats.filtered.toLocaleString('en')}</b> {copy.sources.filtered.toLowerCase()}</span>
          <span className="text-muted-foreground">{copy.sources.lastAt}: {source.stats.lastAt ? <Time at={source.stats.lastAt} /> : `${copy.dash} ${copy.sources.notReceived}`}</span>
        </p>
      </Part>
      <Part title={copy.sources.filteredList}>
        {source.filtered.length ? <ul className="flex flex-col divide-y">{source.filtered.map(item => <li key={item.id} className="flex flex-col gap-0.5 py-2 first:pt-0">
          <Meta><b className="font-medium text-foreground">{actorName(item.actor)}</b><Time at={item.at} /></Meta>
          <p className="break-words">{item.preview || copy.dash}</p>
          <p className="text-xs text-muted-foreground">{reasonText(item.reason)}</p>
        </li>)}</ul> : <p className="text-muted-foreground">{copy.sources.filteredNone}</p>}
        {source.filtered.length > 0 && <p className="text-xs text-muted-foreground">{copy.sources.filteredNote}</p>}
      </Part>
      <Part title={copy.sources.droppedList}>
        {source.dropped.length ? <ul className="flex flex-col divide-y">{source.dropped.map(item => <li key={item.id} className="flex flex-col gap-0.5 py-2 first:pt-0">
          <Meta><span>{item.kind}</span><Time at={item.dropped.at} /><span>· {reasonText(item.dropped.reason)}</span></Meta>
          <p className="break-words">{item.preview || copy.dash}</p>
          <p className="flex flex-wrap gap-x-3 text-xs">
            {item.ticket && <Link to="/tickets/$id" params={{ id: item.ticket.id }} className="text-primary underline-offset-4 hover:underline">{item.ticket.title}</Link>}
            {item.thread && <Link to="/threads/$key" params={{ key: item.thread }} className="text-primary underline-offset-4 hover:underline">{copy.ticket.openThread}</Link>}
          </p>
        </li>)}</ul> : <p className="text-muted-foreground">{copy.sources.droppedNone}</p>}
      </Part>
    </div>
  </Section>
}

export function SourcesPage() {
  const query = useSources()
  return <>
    <PageHeader title={copy.sources.title} description={copy.sources.description} />
    <QueryView query={query} skeleton={<SkeletonRows rows={6} />}>
      {data => data.length ? <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">{data.map(source => <SourceCard key={source.id} source={source} />)}</div>
        : <EmptyState title={copy.sources.empty} />}
    </QueryView>
  </>
}
