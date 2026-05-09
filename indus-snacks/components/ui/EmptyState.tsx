import { LucideIcon } from 'lucide-react'

export default function EmptyState({
  icon: Icon, title, description
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-gray-700 font-semibold">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1 max-w-xs">{description}</p>}
    </div>
  )
}
