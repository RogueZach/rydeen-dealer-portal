'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sendOtp } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await sendOtp(email)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/verify?email=${encodeURIComponent(email)}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Sign-in</CardTitle>
        <CardDescription>We&apos;ll send a verification code to your email</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email address</label>
            <Input
              id="email"
              type="email"
              placeholder="you@dealership.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={loading}>
            {loading ? 'Sending code...' : 'Continue with Email'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="#" className="text-muted-foreground hover:underline">Having trouble signing in?</Link>
          <p className="mt-2">
            Not a dealer yet? <Link href="/register" className="font-medium underline">Apply for an account</Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
