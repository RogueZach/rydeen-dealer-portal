'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { verifyOtp, resendOtp } from './actions'
import Link from 'next/link'

function VerifyForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = code.join('')
    if (token.length !== 6) return

    setError(null)
    setLoading(true)

    const result = await verifyOtp(email, token)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.pendingApproval) {
      router.push('/pending-approval')
      return
    }

    router.push('/portal/dashboard')
  }

  async function handleResend() {
    setError(null)
    const result = await resendOtp(email)
    if (result.error) setError(result.error)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Enter verification code</label>
            <p className="text-xs text-muted-foreground mb-2">The code expires in 10 minutes</p>
            <div className="flex gap-2 justify-center">
              {code.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-12 text-center text-lg"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm space-y-2">
          <button onClick={handleResend} className="text-muted-foreground hover:underline">
            Didn&apos;t receive it? Resend code
          </button>
          <p>
            <Link href="/login" className="text-muted-foreground hover:underline">&larr; Back to sign in</Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
