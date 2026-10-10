import { Card, CardContent } from '@/components/ui/card'

type StatCardProps = {
  label: string
  value: string
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="gap-0 py-5">
      <CardContent>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
