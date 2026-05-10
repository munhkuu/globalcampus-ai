import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VaultClient } from '@/components/vault/VaultClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Study Vault',
}

export default async function VaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notes } = await supabase
    .from('vault_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  return <VaultClient initialNotes={notes ?? []} />
}
