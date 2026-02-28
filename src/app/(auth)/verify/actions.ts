'use server'

import { createSSRClient } from '@/lib/supabase/server'

export async function verifyOtp(email: string, token: string) {
  const supabase = await createSSRClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { error: error.message, pendingApproval: false }
  }

  // Check if dealer is approved
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved, role')
    .eq('id', data.user!.id)
    .single()

  if (profile && profile.role === 'dealer' && !profile.is_approved) {
    return { error: null, pendingApproval: true }
  }

  return { error: null, pendingApproval: false }
}

export async function resendOtp(email: string) {
  const supabase = await createSSRClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) return { error: error.message }
  return { error: null }
}
