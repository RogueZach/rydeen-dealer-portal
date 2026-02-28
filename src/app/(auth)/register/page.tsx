'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerDealer } from './actions'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', companyName: '', contactName: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await registerDealer(form)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Application Submitted</CardTitle>
          <CardDescription>
            Your dealer application has been submitted. A Rydeen administrator will review and approve your account.
            You&apos;ll receive an email once approved.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/login">
            <Button variant="outline">&larr; Back to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for an Account</CardTitle>
        <CardDescription>Submit your dealer application for Rydeen approval</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
            <Input id="companyName" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="contactName" className="text-sm font-medium">Contact Name</label>
            <Input id="contactName" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link href="/login" className="font-medium underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
