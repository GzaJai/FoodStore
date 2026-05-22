import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from './Card'

export interface MetricCardProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({ title, value, change, trend = 'neutral', icon, className = '' }: MetricCardProps) {
  return (
    <Card hoverable className={className}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{title}</span>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {change && (
        <div
          className={`flex items-center gap-1 mt-1 text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'
          }`}
        >
          {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : null}
          {change}
        </div>
      )}
    </Card>
  )
}
