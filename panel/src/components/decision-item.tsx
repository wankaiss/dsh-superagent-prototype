/** One Eval Decision as a compact block (Thread detail): kind, strength, time, id, reason, rules, linked Ticket, Dismiss for an unavailable one. */
import { Link } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'
import { ConfirmAction } from '@/components/confirm-action'
import { Meta, Mono, Prose, StatusBadge, Time } from '@/components/kit'
import { dismissWrite } from '@/api/mutations'
import type { DecisionRow } from '@/contract'
import { copy } from '@/copy'
import { label, outcomeTone, reasonText } from '@/lib/labels'

export function DecisionItem({ decision, showThread = false }: { decision: DecisionRow; showThread?: boolean }) {
  const matched = decision.rules.filter(rule => rule.matched).map(rule => rule.name)
  return <li className="flex flex-col gap-1.5 border-b pb-2.5 last:border-b-0 last:pb-0">
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge tone={outcomeTone(decision.outcome)} icon={null}>{label(copy.labels.outcome, decision.outcome)}</StatusBadge>
      <span className="text-xs text-muted-foreground">{label(copy.labels.strength, decision.strength).toLowerCase()}</span>
      <Time at={decision.at} className="text-xs" />
    </div>
    <Mono className="text-muted-foreground">{decision.id}</Mono>
    {showThread && <Link to="/threads/$key" params={{ key: decision.thread }} className="break-words text-primary underline-offset-4 hover:underline">
      {decision.threadTitle ?? decision.thread}</Link>}
    <Prose text={reasonText(decision.reason)} />
    {decision.rules.length > 0 && <details className="text-xs">
      <summary className="cursor-pointer rounded-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">{copy.decisions.rules}</summary>
      <ul className="mt-1 space-y-1">{decision.rules.map(rule => <li key={rule.id} className="break-words">
        <span className="font-medium">{rule.name}</span> · {rule.matched ? copy.decisions.matched : copy.decisions.notMatched} · {rule.reason}</li>)}</ul>
    </details>}
    <Meta>
      <span>{copy.decisions.rulesMatched}: {matched.length ? matched.join(', ') : copy.states.none}</span>
      <span>· {copy.decisions.triggers(decision.triggerIds.length)}</span>
      {decision.ticketId && <span>· {copy.decisions.ticket} <Link to="/tickets/$id" params={{ id: decision.ticketId }} className="text-primary underline-offset-4 hover:underline">
        {decision.ticketTitle ?? decision.ticketId}</Link></span>}
    </Meta>
    {decision.kind === 'unavailable' && <div><ConfirmAction write={dismissWrite} variables={decision.id} title={copy.actions.dismissTitle}
      body={copy.actions.dismissBody} target={decision.threadTitle ?? decision.thread} confirmLabel={copy.actions.dismissConfirm}
      label={copy.actions.dismissEllipsis} size="xs" icon={<XIcon aria-hidden />} result={() => ({ text: copy.actions.dismissResult })} /></div>}
  </li>
}
