import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/kit'
import { copy } from '@/copy'

export function NotFound() {
  return <>
    <PageHeader title={copy.notFound.title} />
    <EmptyState title={copy.notFound.body}>
      <Link to="/" className="text-primary underline-offset-4 hover:underline">{copy.notFound.home}</Link>
    </EmptyState>
  </>
}

/** Shown instead of a blank page when a view throws while rendering (for example on a response shape it did not expect). */
export function RouteError({ error, reset }: ErrorComponentProps) {
  return <>
    <PageHeader title={copy.renderError.title} />
    <div className="space-y-3 rounded-lg border border-status-danger/40 bg-status-danger-subtle p-4 text-sm text-status-danger-foreground">
      <p>{copy.renderError.body}</p>
      <p className="font-mono text-xs break-all">{error instanceof Error ? error.message : String(error)}</p>
      <Button size="sm" variant="outline" onClick={reset}>{copy.states.retry}</Button>
    </div>
  </>
}
