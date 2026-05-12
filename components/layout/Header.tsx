'use client'

import { usePathname } from 'next/navigation'
import { Moon, Sun, LogOut, Settings, Home } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useTransition } from 'react'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileNav } from './MobileNav'
import Link from 'next/link'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/coverletter': '자소서 Workshop',
  '/internships': 'Internships',
  '/vault': 'Study Vault',
  '/roadmap': 'Career Roadmap',
  '/explainer': 'Lecture Explainer',
  '/bugfix': 'Bug Fixer',
  '/project': 'Project Generator',
  '/settings': 'Settings',
}

interface HeaderProps {
  displayName: string
  email: string
  avatarUrl: string | null
  initials: string
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-8 w-8"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

export function Header({ displayName, email, avatarUrl, initials }: HeaderProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const pageTitle =
    Object.entries(pageTitles)
      .filter(([key]) => pathname === key || pathname.startsWith(`${key}/`))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Dashboard'

  function handleLogout() {
    startTransition(() => logout())
  }

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="text-sm font-medium">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0" aria-label="User menu">
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="truncate text-sm font-medium leading-none">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/" className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                View landing page
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isPending}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isPending ? 'Signing out…' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
