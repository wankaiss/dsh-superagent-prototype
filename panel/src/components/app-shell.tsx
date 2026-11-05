/**
 * Application shell after the export's AppShell: skip link, 216 px sidebar (a sheet below md) with brand, navigation and
 * a footer naming the repository and Policy version, a 48 px top bar (connection, Executor switch, search, theme), page
 * banners, ⌘K search and toasts.
 */
import { useCallback, useState } from 'react'
import { Link, Outlet } from '@tanstack/react-router'
import { MenuIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Banners, ConnectionIndicator, PauseSwitch } from '@/components/status-bar'
import { SearchButton, SearchDialog, useSearchShortcut } from '@/components/search'
import { useOverview, useSettings, useStateView } from '@/api/queries'
import { copy } from '@/copy'

const NAV = [
  { to: '/', label: copy.nav.overview, exact: true },
  { to: '/tickets', label: copy.nav.tickets },
  { to: '/threads', label: copy.nav.threads },
  { to: '/decisions', label: copy.nav.decisions },
  { to: '/sources', label: copy.nav.sources },
  { to: '/system', label: copy.nav.system },
] as const

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  // Badge only for evidenced work waiting on a person (person-stage Tickets from GET overview); no zero badge.
  const person = useOverview().data?.person.length ?? 0
  return <nav aria-label={copy.nav.label}>
    <ul className="flex flex-col gap-0.5">
      {NAV.map(item => <li key={item.to}>
        <Link to={item.to} activeOptions={{ exact: 'exact' in item, includeSearch: false }} onClick={onNavigate}
          className="flex min-h-8 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground outline-none hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-accent-foreground">
          <span className="flex-1">{item.label}</span>
          {item.to === '/tickets' && person > 0 && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sidebar-primary px-1.5 text-[11px] font-semibold tabular text-sidebar-primary-foreground">
            {person}<span className="sr-only"> {copy.nav.personBadge(person)}</span>
          </span>}
        </Link>
      </li>)}
    </ul>
  </nav>
}

function Brand({ short = false }: { short?: boolean }) {
  return <Link to="/" className="flex min-w-0 items-center gap-2 rounded-md px-1 text-sm font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
    <span aria-hidden className="size-5 shrink-0 rounded-[5px] bg-sidebar-primary" />
    <span className="truncate">{copy.productShort}{!short && <span className="font-normal text-muted-foreground"> {copy.productSuffix}</span>}</span>
  </Link>
}

/** Repository and Policy version of this instance, or a plain statement that they are not known yet. */
function SidebarFooter() {
  const repository = useStateView().data?.setup.accounts?.repository
  const policy = useSettings().data?.policyVersion
  return <div className="mt-auto px-2 text-[11px] text-muted-foreground [overflow-wrap:anywhere]">
    {repository ? <p>{repository}</p> : <p>{copy.nav.repositoryUnknown}</p>}
    {policy && <p>{copy.nav.policy(policy.slice(0, 8))}</p>}
    <p>{copy.time.utcNote}</p>
  </div>
}

function ThemeMenu() {
  const { theme = 'system', setTheme } = useTheme()
  const Icon = theme === 'dark' ? MoonIcon : theme === 'light' ? SunIcon : MonitorIcon
  return <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label={copy.topbar.themeLabel(theme === 'dark' ? copy.topbar.themeDark
      : theme === 'light' ? copy.topbar.themeLight : copy.topbar.themeSystem)} />}>
      <Icon aria-hidden />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-36">
      <DropdownMenuGroup>
        <DropdownMenuLabel>{copy.topbar.theme}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={value => setTheme(String(value))}>
          <DropdownMenuRadioItem value="light"><SunIcon aria-hidden />{copy.topbar.themeLight}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><MoonIcon aria-hidden />{copy.topbar.themeDark}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system"><MonitorIcon aria-hidden />{copy.topbar.themeSystem}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
}

export function AppShell() {
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const openSearch = useCallback(() => setSearch(true), [])
  useSearchShortcut(openSearch)

  return <TooltipProvider>
    <a href="#main" className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:outline-2 focus:outline-offset-2 focus:outline-ring">
      {copy.skipLink}
    </a>
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-svh w-54 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar px-2.5 pt-2.5 pb-3 text-sidebar-foreground md:flex">
        <div className="flex h-9 items-center px-1 pb-1"><Brand /></div>
        <NavLinks />
        <SidebarFooter />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-1.5 border-b bg-background px-2.5 md:gap-2 md:px-4">
          <Button variant="outline" size="icon" className="md:hidden" aria-label={copy.nav.openMenu} aria-expanded={menu} onClick={() => setMenu(true)}>
            <MenuIcon aria-hidden />
          </Button>
          <div className="min-w-0 md:hidden"><Brand short /></div>
          <div className="min-w-0 md:flex-1"><ConnectionIndicator /></div>
          <div className="flex-1 md:hidden" />
          <PauseSwitch />
          <SearchButton onOpen={openSearch} />
          <ThemeMenu />
        </header>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-3.5 pt-3.5 pb-6 outline-none md:px-6 md:pt-5 md:pb-7">
          <div className="mx-auto w-full max-w-6xl">
            <Banners />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    <Sheet open={menu} onOpenChange={setMenu}>
      <SheetContent side="left" className="w-70 max-w-[85vw] gap-2 border-sidebar-border bg-sidebar p-2.5 text-sidebar-foreground">
        <SheetHeader className="p-1 pr-10">
          <SheetTitle className="flex items-center gap-2"><span aria-hidden className="size-5 rounded-[5px] bg-sidebar-primary" />{copy.nav.menuTitle}</SheetTitle>
          <SheetDescription className="sr-only">{copy.nav.menuDescription}</SheetDescription>
        </SheetHeader>
        <NavLinks onNavigate={() => setMenu(false)} />
        <SidebarFooter />
      </SheetContent>
    </Sheet>
    <SearchDialog open={search} onOpenChange={setSearch} />
    <Toaster position="bottom-right" closeButton />
  </TooltipProvider>
}
