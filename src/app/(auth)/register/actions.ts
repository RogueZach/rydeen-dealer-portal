'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function registerDealer(form: {
  email: string
  companyName: string
  contactName: string
  phone: string
}) {
  const supabase = createAdminClient()

  // Create user via admin API (bypasses "signups not allowed" restriction)
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: form.email,
    email_confirm: true,
  })

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return { error: 'An account with this email already exists. Please sign in instead.' }
    }
    return { error: createError.message }
  }

  // Update the profile with dealer details (trigger already created the profile row)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      company_name: form.companyName,
      contact_name: form.contactName,
      phone: form.phone,
      is_approved: false,
    })
    .eq('id', user.user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  return { error: null }
}
