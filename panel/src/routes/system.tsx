/**
 * System: the context boundary, read-only. Accounts, machine, Sources and their configuration, allow-lists and rules,
 * Eval and Executor models side by side, settings history and the current prompt revision. Editing stays in the DSH panel.
 */
import type { ReactNode } from 'react'
import { InfoIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  ExternalLink, KeyValueList, Mono, PageHeader, Prose, QueryView, Section, SkeletonRows, StatusBadge, Tag, Time,
} from '@/components/kit'
import { ScrollTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/records'
import { useModels, usePolicyHistory, usePrompts, useSettings, useStateView } from '@/api/queries'
import type { ModelCatalog, SettingsView, SourceSettings, StateView } from '@/contract'
import { copy } from '@/copy'
import { en } from '@/lib/format'
import { changeText, label, sourceName } from '@/lib/labels'

type Field = SourceSettings['fields'][number]
type Model = { provider: string; model: string } | null | undefined

const edit = <ExternalLink href={copy.dshUrl} className="text-xs">{copy.system.editInDsh}</ExternalLink>
const sub = (text: string) => <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{text}</h3>

function modelName(model: Model, catalog: ModelCatalog | undefined): ReactNode {
  if (!model) return <span className="text-muted-foreground">{copy.system.modelDefault}</span>
  const group = catalog?.groups.find(item => item.id === model.provider)
  const entry = group?.models.find(item => item.id === model.model)
  return <span className="flex flex-col"><span className="font-medium">{entry?.name ?? model.model}</span>
    <Mono className="text-xs text-muted-foreground">{group?.name ?? model.provider} / {model.model}</Mono></span>
}

/** Renders one configuration value according to its field spec; booleans and rows never show as raw JSON. */
function fieldValue(field: Field, value: unknown, labels: Record<string, string>): ReactNode {
  if (value === undefined || value === null || value === '') return <span className="text-muted-foreground">{copy.dash}</span>
  switch (field.type) {
    case 'switch': return value ? copy.states.on : copy.states.off
    case 'select': return en(field.options.find(option => option.value === value)?.label) || String(value)
    case 'number': return <span className="tabular">{String(value)}</span>
    case 'rows': {
      const rows = Array.isArray(value) ? value as Record<string, unknown>[] : []
      if (!rows.length) return <span className="text-muted-foreground">{copy.states.none}</span>
      return <ul className="space-y-0.5">{rows.map((row, index) => <li key={index} className="break-words">
        {field.columns.map(column => {
          const cell = row[column.key]
          const text = column.type === 'select' ? en(column.options.find(option => option.value === cell)?.label) || String(cell ?? '')
            : String(cell ?? '')
          const named = column.key === 'chatId' && labels[text] ? `${labels[text]} (${text})` : text
          return named ? <span key={column.key} className="mr-2"><span className="text-muted-foreground">{en(column.label)}: </span><Mono>{named}</Mono></span> : null
        })}
      </li>)}</ul>
    }
    default: return typeof value === 'string' || typeof value === 'number' ? <Mono>{String(value)}</Mono> : <span className="text-muted-foreground">{copy.dash}</span>
  }
}

function SourceBlock({ source }: { source: SourceSettings }) {
  const config = (source.value.config ?? {}) as Record<string, unknown>
  const facts = Object.values(source.facts ?? {}) as unknown[]
  const fields = source.fields.filter(field => field.type !== 'fact')
  return <Section id={`source-settings-${source.id}`} actions={edit} title={<span className="flex flex-wrap items-center gap-1.5">{en(source.title)}
    <StatusBadge tone={source.value.enabled ? 'ok' : 'idle'} icon={null} className="font-medium">{source.value.enabled ? copy.sources.enabled : copy.states.off}</StatusBadge>
    {!source.installed && <StatusBadge tone="warn" className="font-medium">{label(copy.labels.sourceState, 'missing')}</StatusBadge>}</span>}>
    {en(source.description) !== copy.dash && <p className="text-muted-foreground">{en(source.description)}</p>}
    {facts.length > 0 && <ul className="text-xs text-muted-foreground">{facts.map((fact, index) => <li key={index}>{typeof fact === 'string' ? fact : en(fact as { en?: string })}</li>)}</ul>}
    <KeyValueList items={fields.map(field => [en(field.label), fieldValue(field, config[field.key], source.labels)] as [string, ReactNode])} />
    {source.restarts.length > 0 && <p className="text-xs text-muted-foreground">{copy.system.restarts}: {source.restarts.join(', ')}</p>}
  </Section>
}

function Policy({ settings }: { settings: SettingsView }) {
  const policy = settings.blocks.policy.value
  const people = (entries: { id: string; name?: string }[] | undefined) => entries?.length
    ? <ul className="space-y-0.5">{entries.map(entry => <li key={entry.id} className="break-words">{entry.name ? <><b className="font-semibold">{entry.name}</b> <Mono className="text-muted-foreground">{entry.id}</Mono></>
      : <Mono>{entry.id}</Mono>}</li>)}</ul> : <span className="text-muted-foreground">{copy.system.allowNone}</span>
  return <Section id="policy" actions={edit} title={<span className="flex flex-wrap items-center gap-1.5">{copy.system.policyRules(policy.rules.length)}
    <Tag mono className="font-normal">{copy.system.versionTag(settings.policyVersion.slice(0, 8))}</Tag></span>}>
    <KeyValueList items={Object.entries(policy.sources).flatMap(([id, source]) => {
      const bots = (source as { bots?: { id: string; name?: string }[] }).bots
      return [
        [copy.system.allowList(sourceName(id)), people(source.allowed)] as [string, ReactNode],
        ...bots ? [[copy.system.bots(sourceName(id)), people(bots)] as [string, ReactNode]] : [],
      ]
    })} />
    {policy.rules.length ? <ul className="flex flex-col divide-y border-t">{policy.rules.map(rule => <li key={rule.id} className="flex flex-col gap-1 py-2.5 last:pb-0">
      <p className="flex flex-wrap items-center gap-1.5 font-semibold">{rule.name}<Tag mono className="font-normal">{rule.id}</Tag>
        <StatusBadge tone={rule.enabled ? 'ok' : 'idle'} icon={null}>{rule.enabled ? copy.system.ruleOn : copy.system.ruleOff}</StatusBadge></p>
      <Prose text={rule.instruction} />
    </li>)}</ul> : <p className="text-muted-foreground">{copy.system.rulesNone}</p>}
  </Section>
}

function Models({ settings }: { settings: SettingsView }) {
  const catalog = useModels().data
  const evaluation = settings.blocks.eval.value
  const executor = settings.blocks.executor.value
  return <>
    <Section id="eval" actions={edit} title={<span className="flex flex-wrap items-center gap-1.5">{copy.system.evalModel}
      <StatusBadge tone="warn" icon={null} className="font-medium">{copy.system.modeTag(label(copy.labels.mode, evaluation.mode).toLowerCase())}</StatusBadge></span>}>
      <KeyValueList items={[
        [copy.system.mode, <span key="m"><b className="font-semibold">{label(copy.labels.mode, evaluation.mode).toLowerCase()}</b> <Mono className="text-muted-foreground">{evaluation.mode}</Mono>
          <span className="block text-xs text-muted-foreground">{copy.overview.modeHelp[evaluation.mode] ?? ''}</span></span>],
        [copy.system.model, modelName(evaluation.model, catalog)],
        [copy.system.timeout, `${evaluation.timeoutSeconds} s`],
        [copy.system.settingsRevision, <span key="r" className="tabular">{settings.blocks.eval.revision}</span>],
      ]} />
    </Section>
    <Section id="executor" title={copy.system.executorModel} actions={edit}>
      <KeyValueList items={[
        [copy.system.model, modelName(executor.model, catalog)],
        [copy.system.maxWorkers, <span key="w" className="tabular">{executor.maxWorkers}</span>],
        [copy.system.directory, executor.directory ? <Mono key="d">{executor.directory}</Mono> : copy.system.modelDefault],
        [copy.system.prepare, executor.prepare ? <Mono key="p">{executor.prepare}</Mono> : copy.dash],
        [copy.system.blocked, executor.blockedCommands.length ? <Mono key="b">{executor.blockedCommands.join(' ')}</Mono> : copy.states.none],
        [copy.system.settingsRevision, <span key="r" className="tabular">{settings.blocks.executor.revision}</span>],
      ]} />
      <p className="text-xs text-muted-foreground">{copy.system.modelsNote}</p>
    </Section>
  </>
}

function Boundary({ state, settings }: { state: StateView; settings: SettingsView | undefined }) {
  const { accounts, machine } = state.setup
  const setupProblem = state.setup.problem
  return <KeyValueList items={[
    [copy.system.stateDir, <Mono key="s">{machine.stateDir}</Mono>],
    [copy.system.workRoot, settings ? <Mono key="w">{settings.environment.root}</Mono> : copy.dash],
    [copy.system.masterId, <Mono key="m">{state.masterId}</Mono>],
    ...accounts ? [
      [copy.system.repository, <Mono key="r">{accounts.repository}</Mono>] as [string, ReactNode],
      [copy.system.agent, <Mono key="a">{accounts.agent}</Mono>] as [string, ReactNode],
      [copy.system.feishuBot, accounts.feishu ? <span key="f" className="flex flex-col"><span>{accounts.feishu.name || copy.dash}</span>
        <Mono className="text-muted-foreground">{copy.system.feishuIds(accounts.feishu.appId, accounts.feishu.botId, accounts.feishu.brand)}</Mono></span> : copy.system.feishuNone] as [string, ReactNode],
    ] : [[copy.system.accounts, copy.system.accountsNone] as [string, ReactNode]],
    [copy.system.limits, copy.system.limitsValue(machine.promptMaxChars.toLocaleString('en'), machine.admissionContextMaxPages, (machine.admissionContextTimeoutMs / 1000).toLocaleString('en'))],
    [copy.system.setup, setupProblem ? <StatusBadge key="p" tone="danger">{copy.banners.setupTitle}</StatusBadge>
      : <span key="ok" className="flex flex-wrap items-center gap-1.5"><StatusBadge tone="ok" icon={null}>{copy.system.setupComplete}</StatusBadge>
        <span className="text-xs text-muted-foreground">{copy.system.setupNoProblem}</span></span>],
  ]} />
}

function History() {
  const query = usePolicyHistory()
  return <QueryView query={query} skeleton={<SkeletonRows rows={3} />}>
    {data => data.items.length ? <ScrollTable label={copy.system.history} minWidth="40rem">
      <TableHeader><TableRow>
        <TableHead>{copy.system.historyColumns.revision}</TableHead>
        <TableHead>{copy.system.historyColumns.saved}</TableHead>
        <TableHead>{copy.system.historyColumns.block}</TableHead>
        <TableHead>{copy.system.historyColumns.changes}</TableHead>
      </TableRow></TableHeader>
      <TableBody>{data.items.map(item => <TableRow key={item.revision}>
        <TableCell className="align-top tabular">{item.revision}{item.revision === data.current && <span className="ml-1 text-xs text-muted-foreground">({copy.system.current})</span>}</TableCell>
        <TableCell className="align-top text-xs"><Time at={item.savedAt} />
          <span className="block text-muted-foreground">{label(copy.labels.origin, item.source)}</span></TableCell>
        <TableCell className="align-top text-xs">{item.block?.startsWith('source:') ? sourceName(item.block.slice(7)) : label(copy.labels.block, item.block)}
          {item.policyChanged && <span className="block text-status-info-foreground">{copy.system.policyChanged}</span>}</TableCell>
        <TableCell className="align-top text-xs whitespace-normal">
          {item.changes?.length ? <ul className="space-y-0.5">{item.changes.map((change, index) => <li key={index} className="break-words">{changeText(change)}</li>)}</ul>
            : <span className="text-muted-foreground">{copy.system.noChanges}</span>}
        </TableCell>
      </TableRow>)}</TableBody>
    </ScrollTable> : <p className="text-sm text-muted-foreground">{copy.system.historyEmpty}</p>}
  </QueryView>
}

function Prompts() {
  const query = usePrompts()
  return <QueryView query={query} skeleton={<SkeletonRows rows={2} />}>
    {data => <div className="space-y-3">
      <KeyValueList items={[
        [copy.system.promptRevision, <span key="r" className="tabular">{data.current.revision}</span>],
        [copy.system.promptSaved, data.current.savedAt ? <Time key="s" at={data.current.savedAt} /> : copy.dash],
        [copy.system.promptSource, label(copy.labels.origin, data.current.source)],
      ]} />
      {data.revisions.length > 0 && <div>
        <h3 className="mb-1 text-xs font-medium text-muted-foreground uppercase">{copy.system.promptRevisions}</h3>
        <ul className="space-y-1 text-sm">{data.revisions.slice(0, 5).map(revision => <li key={revision.revision} className="break-words">
          <span className="tabular font-medium">{revision.revision}</span> · {revision.savedAt ? <Time at={revision.savedAt} relativeOnly /> : copy.dash}
          {' · '}{label(copy.labels.origin, revision.source)}
          {revision.changed.length > 0 && <span className="text-muted-foreground"> · {copy.system.promptChanged}: {revision.changed.join(', ')}</span>}
        </li>)}</ul>
      </div>}
    </div>}
  </QueryView>
}

export function SystemPage() {
  const state = useStateView()
  const settings = useSettings()
  return <>
    <PageHeader title={copy.system.title} description={copy.system.readOnly}
      actions={<ExternalLink href={copy.dshUrl} className={buttonVariants({ variant: 'outline' })}>{copy.system.editInDsh}</ExternalLink>} />
    <div className="flex flex-col gap-4">
      <div role="note" className="flex gap-2.5 rounded-lg border bg-card px-3.5 py-2.5">
        <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">{copy.system.boundary}</p>
          <p className="text-xs text-muted-foreground">{copy.system.trustBody}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Section id="boundary" title={copy.system.contextBoundary}>
          <QueryView query={state} skeleton={<SkeletonRows rows={4} />}>{value => <Boundary state={value} settings={settings.data} />}</QueryView>
        </Section>
        <QueryView query={settings} skeleton={<SkeletonRows rows={6} />}>
          {value => <>
            <Policy settings={value} />
            {value.sources.map(source => <SourceBlock key={source.id} source={source} />)}
            <Models settings={value} />
          </>}
        </QueryView>
      </div>
      <Section id="history" title={copy.system.history}><History /></Section>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Section id="prompts" title={copy.system.prompts} actions={edit}><Prompts /></Section>
        <Section id="environment" title={copy.system.environment}>
          <QueryView query={settings} skeleton={<SkeletonRows rows={2} />}>
            {value => <details className="group">
              <summary className="cursor-pointer rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {copy.system.variablesSummary(value.environment.variables.reduce((sum, group) => sum + group.variables.length, 0),
                  value.environment.variables.map(group => sourceName(group.owner)).join(', '))}</summary>
              <div className="mt-3 flex flex-col gap-3">
                <KeyValueList items={[[copy.system.workRoot, <Mono key="r">{value.environment.root}</Mono>]]} />
                <ul className="flex flex-col gap-3">{value.environment.variables.map(group => <li key={group.owner} className="flex flex-col gap-1">
                  {sub(`${sourceName(group.owner)}${group.enabled ? '' : ` · ${copy.states.off}`}`)}
                  <dl className="flex flex-col gap-1.5">{group.variables.map(variable => <div key={variable.key}>
                    <dt><Mono>{variable.key}</Mono>{'ticket' in variable && variable.ticket === true && <span className="ml-2 text-xs text-muted-foreground">({copy.system.variableTicket})</span>}</dt>
                    <dd className="text-xs text-muted-foreground">{en(variable.description)}</dd>
                  </div>)}</dl>
                </li>)}</ul>
              </div>
            </details>}
          </QueryView>
        </Section>
      </div>
    </div>
  </>
}
