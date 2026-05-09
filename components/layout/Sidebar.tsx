'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  Map,
  Lightbulb,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Separator } from '@/components/ui/separator'
import type { NavItem } from '@/lib/types/app.types'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Internships', href: '/internships', icon: Briefcase },
  { label: 'Study Vault', href: '/vault', icon: BookOpen },
  { label: 'Career Roadmap', href: '/roadmap', icon: Map },
  { label: 'Lecture AI', href: '/explainer', icon: Lightbulb },
]

const bottomItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      <item.icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r bg-sidebar md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <span className="text-[10px] font-bold text-background leading-none">
              GC
            </span>
          </div>
          <span className="text-sm font-semibold tracking-tight">
            GlobalCampus
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 pb-3">
        <Separator className="mb-3" />
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  )
}
