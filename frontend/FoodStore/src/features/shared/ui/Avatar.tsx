export interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

const sizeMap = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base',
}

const colors = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500',
]

export function Avatar({ name, size = 'md', color, className = '' }: AvatarProps) {
  const bgColor = color || colors[name.charCodeAt(0) % colors.length]
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      className={`${bgColor} ${sizeMap[size]} rounded-full flex items-center justify-center text-white font-bold ${className}`}
    >
      {initial}
    </div>
  )
}
