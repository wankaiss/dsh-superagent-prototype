/** Filter tabs bound to a route search param (export "FilterTabs": underline style, counts); the list scrolls sideways inside its own container at narrow widths. */
import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { copy } from '@/copy'

export function FilterTabs<T extends string>({ value, values, labels, counts, onChange, label, children }: {
  value: T; values: readonly T[]; labels: Record<string, string>; counts?: Partial<Record<T, number | undefined>>
  onChange: (value: T) => void; label: string; children: ReactNode
}) {
  return <Tabs value={value} onValueChange={next => onChange(next as T)} className="gap-4">
    <div className="overflow-x-auto border-b">
      <TabsList variant="line" aria-label={label} className="h-9! w-max gap-0.5 p-0">
        {values.map(item => {
          const count = counts?.[item]
          return <TabsTrigger key={item} value={item}
            className="h-9 flex-none rounded-b-none px-3 font-normal after:bottom-0! after:bg-primary! data-active:font-semibold">
            {labels[item] ?? item}
            {counts && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium tabular text-muted-foreground">
              {typeof count === 'number' ? count.toLocaleString('en') : copy.dash}</span>}
          </TabsTrigger>
        })}
      </TabsList>
    </div>
    <TabsContent value={value}>{children}</TabsContent>
  </Tabs>
}
