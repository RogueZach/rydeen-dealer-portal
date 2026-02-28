export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">RYDEEN</h1>
        <p className="text-sm text-muted-foreground">next level awareness</p>
        <p className="mt-2 text-lg font-medium">Rydeen Mobile</p>
        <p className="text-sm text-muted-foreground">Dealer Portal</p>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
