export interface DonutChartProps {
  data: { name: string; value: number; color: string }[]
  size?: number
  innerRadius?: number
  showLegend?: boolean
  className?: string
}

export function DonutChart({ data, size = 128, innerRadius = 32, showLegend = true, className = '' }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0)
  let cumulative = 0

  const gradientParts = data.map((item) => {
    const start = (cumulative / total) * 100
    cumulative += item.value
    const end = (cumulative / total) * 100
    return `${item.color} ${start}% ${end}%`
  })

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div
        className="rounded-full relative"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientParts.join(', ')})`,
        }}
      >
        <div
          className="absolute bg-white rounded-full"
          style={{
            width: innerRadius * 2,
            height: innerRadius * 2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {showLegend && (
        <div className="space-y-2 w-full">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600 flex-1">{item.name}</span>
              <span className="font-medium text-gray-800">{item.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
