import { Card, CardContent } from '@/components/ui/card'

interface KpiCardsProps {
  totalOrders: number
  thisMonth: number
  pendingOrders: number
  forecastLevel: string | null
}

export function KpiCards({ totalOrders, thisMonth, pendingOrders, forecastLevel }: KpiCardsProps) {
  const cards = [
    { label: 'Total Orders', value: totalOrders.toString(), color: 'bg-blue-50 text-blue-600' },
    { label: 'This Month', value: `$${thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Orders', value: pendingOrders.toString(), color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Forecast Level', value: forecastLevel || '—', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
