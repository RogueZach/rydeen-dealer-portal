import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PendingApprovalPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Account Pending Approval</CardTitle>
        <CardDescription>
          Your dealer account is awaiting approval from Rydeen. You&apos;ll receive an email notification once your account has been activated.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          If you have questions, contact us at 1-310-787-7880.
        </p>
        <Link href="/login">
          <Button variant="outline">&larr; Back to sign in</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
