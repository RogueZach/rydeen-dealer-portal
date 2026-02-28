import { createSSRClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types/database'

export async function getAuthenticatedProfile(): Promise<Profile> {
  const supabase = await createSSRClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, pricing_tier:pricing_tiers(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'dealer' && !profile.is_approved) redirect('/pending-approval')

  return profile as Profile
}
