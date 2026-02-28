'use server'

import { createSSRClient } from '@/lib/supabase/server'

export async function sendOtp(email: string) {
  const supabase = await createSSRClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    if (error.message.includes('Signups not allowed')) {
      return { error: 'No account found with this email. Please apply for an account first.' }
    }
    return { error: error.message }
  }

  return { error: null }
}
