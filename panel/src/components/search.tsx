/**
 * ⌘K / Ctrl+K search overlay over `GET search?q` (at most 10 Tickets and 20 Triggers, plus Threads). Results open the
 * owning Ticket or Thread; a Trigger has no page of its own. cmdk's client-side filtering is off: the host decides matches.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { Command, CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/api/queries'
import { ApiError } from '@/api/client'
import { copy } from '@/copy'
import { clock, relative } from '@/lib/format'
import { actorName, label, outcomeTone, reasonText, threadTone } from '@/lib/labels'
import { SourceChip, StatusBadge } from '@/components/kit'
import { StageBadge } from '@/components/records'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
export const searchShortcut = isMac ? copy.topbar.searchShortcutMac : copy.topbar.searchShortcutOther

export function SearchButton({ onOpen }: { onOpen: () => void }) {
  return <Button variant="outline" size="default" onClick={onOpen} aria-label={`${copy.topbar.searchLabel} (${searchShortcut})`}
    aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
    className="justify-start gap-2 px-2.5 text-xs font-normal text-muted-foreground max-sm:size-8 max-sm:justify-center max-sm:px-0 sm:min-w-56">
    <SearchIcon aria-hidden />
    <span className="max-sm:hidden">{copy.topbar.search}</span>
    <kbd className="ml-auto rounded border border-b-2 bg-muted px-1.5 py-px font-mono text-[11px] text-muted-foreground max-sm:hidden">{searchShortcut}</kbd>
  </Button>
}

export function useSearchShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
}

function useDebounced<T>(value: T, ms: number) {
  const [shown, setShown] = useState(value)
  useEffect(() => { const id = setTimeout(() => setShown(value), ms); return () => clearTimeout(id) }, [value, ms])
  return shown
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [text, setText] = useState('')
  const q = useDebounced(text.trim(), 250)
  const query = useSearch(q)
  const navigate = useNavigate()
  const go = (to: () => void) => { onOpenChange(false); to() }
  useEffect(() => { if (!open) setText('') }, [open])

  const data = query.data
  const enabled = q.length >= 2
  const typing = text.trim() !== q
  const empty = data && !data.tickets.length && !data.items.length && !data.threads.length
  const status = !enabled ? copy.search.hint : typing || query.isFetching && !data ? copy.search.loading
    : query.error ? copy.search.error(query.error instanceof ApiError ? query.error.message : String(query.error))
      : empty ? copy.search.noResults : ''

  const group = 'border-b px-2 py-1.5 last:border-b-0 **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase'
  const item = 'items-start gap-2.5 py-2'
  return <CommandDialog open={open} onOpenChange={onOpenChange} title={copy.search.title} description={copy.search.description}
    className="sm:max-w-xl">
    <Command shouldFilter={false} label={copy.search.title}>
      <CommandInput value={text} onValueChange={setText} placeholder={copy.search.placeholder} aria-label={copy.topbar.searchLabel} />
      <CommandList className="max-h-[min(60vh,28rem)]">
        <p role="status" aria-live="polite" className={status ? 'px-3 py-4 text-center text-muted-foreground' : 'sr-only'}>{status}</p>
        {enabled && !typing && data && <>
          {data.tickets.length > 0 && <CommandGroup heading={copy.search.count(copy.search.tickets, data.tickets.length)} className={group}>
            {data.tickets.map(ticket => <CommandItem key={`t-${ticket.id}`} value={`ticket-${ticket.id}`} className={item}
              onSelect={() => go(() => void navigate({ to: '/tickets/$id', params: { id: ticket.id } }))}>
              <StageBadge row={ticket} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="break-words">{ticket.title}</span>
                <span className="text-xs text-muted-foreground">{ticket.summary || `${copy.ticket.updated} ${clock(ticket.updatedAt)}`} · <span className="font-mono">{ticket.id.slice(0, 8)}…</span></span>
              </span>
            </CommandItem>)}
          </CommandGroup>}
          {data.items.length > 0 && <CommandGroup heading={copy.search.count(copy.search.triggers, data.items.length)} className={group}>
            {data.items.map(entry => {
              const home = entry.threadTitle !== undefined ? entry.threads[0] : undefined
              return <CommandItem key={`tr-${entry.id}`} value={`trigger-${entry.id}`} disabled={!home} className={item}
                onSelect={() => home && go(() => void navigate({ to: '/threads/$key', params: { key: home } }))}>
                <SourceChip source={entry.source} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="break-words">{entry.preview || copy.dash}</span>
                  <span className="text-xs text-muted-foreground">
                    {actorName(entry.actor)} · {clock(entry.at)} · {relative(entry.at)}
                    {home ? ` · ${entry.threadTitle}` : 'filtered' in entry && entry.filtered !== undefined
                      ? ` · ${copy.search.filtered(reasonText(entry.filtered || undefined))}` : ` · ${copy.search.noThread}`}
                  </span>
                </span>
                {entry.disposition.decision && <StatusBadge tone={outcomeTone(entry.disposition.decision.outcome)} icon={null}>{label(copy.labels.outcome, entry.disposition.decision.outcome)}</StatusBadge>}
              </CommandItem>
            })}
          </CommandGroup>}
          {data.threads.length > 0 && <CommandGroup heading={copy.search.count(copy.search.threads, data.threads.length)} className={group}>
            {data.threads.map(thread => <CommandItem key={`th-${thread.key}`} value={`thread-${thread.key}`} className={item}
              onSelect={() => go(() => void navigate({ to: '/threads/$key', params: { key: thread.key } }))}>
              <SourceChip source={thread.source} />
              <span className="min-w-0 flex-1 break-words">{thread.title}</span>
              <StatusBadge tone={threadTone(thread.stage)} icon={null}>{label(copy.labels.threadStage, thread.stage)}</StatusBadge>
            </CommandItem>)}
          </CommandGroup>}
        </>}
      </CommandList>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-3.5 py-2 text-[11px] text-muted-foreground">
        <span>{copy.search.cap}</span>
        <span className="ml-auto flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> {copy.search.move} · <Kbd>↵</Kbd> {copy.search.open} · <Kbd>{copy.search.escKey}</Kbd> {copy.search.close}</span>
      </div>
    </Command>
  </CommandDialog>
}

const Kbd = ({ children }: { children: string }) => <kbd className="rounded border border-b-2 bg-muted px-1 font-mono text-[11px]">{children}</kbd>
