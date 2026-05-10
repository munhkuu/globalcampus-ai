'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, LayoutDashboard, Briefcase, BookOpen, Map, Lightbulb, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils/cn'
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

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href)
    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
          active
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
        )}
      >
        <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-foreground' : 'text-muted-foreground')} />
        {item.label}
      </Link>
    )
  }

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[220px] p-0">
          {/* Logo */}
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
                <span className="text-[10px] font-bold text-background leading-none">GC</span>
              </div>
              <span className="text-sm font-semibold tracking-tight">GlobalCampus</span>
            </Link>
          </div>

          {/* Primary nav */}
          <nav className="flex flex-col gap-0.5 px-2 py-3">
            {navItems.map((item) => <NavLink key={item.href} item={item} />)}
          </nav>

          <div className="px-2 pb-3">
            <Separator className="mb-3" />
            {bottomItems.map((item) => <NavLink key={item.href} item={item} />)}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
