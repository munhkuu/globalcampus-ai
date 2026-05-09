import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const displayName: string =
    user.user_metadata?.full_name ?? user.email ?? 'User'
  const email: string = user.email ?? ''
  const avatarUrl: string | null = user.user_metadata?.avatar_url ?? null
  const initials: string = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <Separator />

      {/* Profile section */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Your public profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="text-base">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account section */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Account details and metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
              {user.id}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span>{memberSince}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Auth provider</span>
            <span className="capitalize">
              {user.app_metadata?.provider ?? 'email'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile editing will be implemented in Phase 2 */}
      <p className="text-xs text-muted-foreground">
        Profile editing and additional account settings arrive in Phase 2.
      </p>
    </div>
  )
}
