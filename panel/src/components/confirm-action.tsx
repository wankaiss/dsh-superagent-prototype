/**
 * The one lifecycle for every permitted write: confirmation naming the target and effect → pending → toast with the
 * host's answer or error → refetch of the affected queries (in `useWrite`).
 *
 * - Nothing changes optimistically; views update only from refetched GETs.
 * - The dialog stays open while pending; closing it does not cancel the request, and the result is still announced.
 * - A refused action keeps its error in the dialog and next to the trigger, as well as in the toast.
 * - A lost response or a host server error (5xx) is reported as unconfirmed, never as "refused" or "nothing changed":
 *   the host may have committed part of the write (pause saves settings before delivery). The refetch in `useWrite`
 *   reconciles the views. "Refused" is kept for explicit 4xx rejections (setup, user, validation, 404, 409).
 */
import { useState, type ReactNode } from 'react'
import { LoaderCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { asApiError, type ApiError } from '@/api/client'
import { useWrite, type Write } from '@/api/mutations'
import { copy } from '@/copy'

/** A lost response and a host server error (it received the request, then failed) are both unconfirmed, worded apart. */
const unconfirmedBody = (error: ApiError) => error.status >= 500 && error.kind !== 'offline'
  ? copy.actions.unconfirmedServerBody(error.message) : copy.actions.unconfirmedBody(error.message)

/** An empty 404 means the routes were unmounted (restarting): the write did not run, but nothing refused it. */
const failedTitle = (error: ApiError) => error.kind === 'restarting' ? copy.actions.notRunTitle : copy.actions.failedTitle

export interface TriggerProps { onClick: () => void; disabled: boolean; busy: boolean }

export function ConfirmAction<V, R>({
  write, variables, title, body, target, confirmLabel, destructive = false, result, label, icon, variant = 'outline', size = 'sm',
  trigger, disabled = false, inlineError = true,
}: {
  write: Write<V, R>; variables: V
  title: string; body: ReactNode; target?: ReactNode; confirmLabel: string; destructive?: boolean
  /** Text of the host's answer; `ok: false` when the host answered but did not do it (e.g. `queued: false`). */
  result: (response: R) => { text: string; ok?: boolean }
  label?: ReactNode; icon?: ReactNode; variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost'; size?: 'sm' | 'default' | 'xs'
  trigger?: (props: TriggerProps) => ReactNode
  disabled?: boolean; inlineError?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<ApiError>()
  const { mutation, busy } = useWrite(write, variables)
  const pending = mutation.isPending

  const confirm = async () => {
    if (busy) return
    setError(undefined)
    try {
      const response = await mutation.mutateAsync()
      const outcome = result(response)
      if (outcome.ok === false) toast.warning(outcome.text)
      else toast.success(outcome.text)
      setOpen(false)
    } catch (failure) {
      const apiError = asApiError(failure)
      setError(apiError)
      if (apiError.unconfirmed) toast.warning(copy.actions.unconfirmedTitle, { description: unconfirmedBody(apiError) })
      else toast.error(failedTitle(apiError), { description: apiError.message })
    }
  }
  const openDialog = () => { setError(undefined); setOpen(true) }
  const triggerProps: TriggerProps = { onClick: openDialog, disabled: disabled || busy, busy }

  return <span className="inline-flex max-w-full flex-col items-start gap-1">
    {trigger ? trigger(triggerProps) : <Button variant={variant} size={size} onClick={openDialog} disabled={disabled || busy}
      aria-busy={busy || undefined}>
      {busy ? <LoaderCircleIcon aria-hidden className="animate-spin" /> : icon}{label}
    </Button>}
    {inlineError && error && !open && <span className="max-w-xs text-xs break-words text-status-danger-foreground">
      {error.unconfirmed ? copy.actions.unconfirmedTitle : copy.actions.lastFailed(error.message)}</span>}
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="data-[size=default]:max-w-[calc(100vw-2rem)] data-[size=default]:sm:max-w-md">
        {/* Long targets and host errors scroll inside this body; the footer below stays in view (popup is viewport-bounded). */}
        <div data-slot="confirm-body" className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription render={<div />} className="space-y-2 text-left">
            {target && <div className="rounded-md border bg-muted px-3 py-2 text-foreground break-words">{target}</div>}
            <div>{body}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <div role="alert" className="rounded-md border border-status-danger/40 bg-status-danger-subtle px-3 py-2 text-sm break-words text-status-danger-foreground">
          <p className="font-medium">{error.unconfirmed ? copy.actions.unconfirmedTitle : failedTitle(error)}</p>
          <p>{error.unconfirmed ? unconfirmedBody(error) : error.message}</p>
        </div>}
        {pending && <p className="text-xs text-muted-foreground" role="status">{copy.actions.closeKeepsRequest}</p>}
        </div>
        <AlertDialogFooter className="border-t-0 bg-transparent">
          {/* Cancel first in DOM order so it receives initial focus: the safe choice for a hard-to-reverse write. */}
          <AlertDialogCancel>{pending ? copy.actions.close : copy.actions.cancel}</AlertDialogCancel>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={() => void confirm()} disabled={busy} aria-busy={pending || undefined}>
            {pending && <LoaderCircleIcon aria-hidden className="animate-spin" />}
            {pending ? copy.actions.sending : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </span>
}
