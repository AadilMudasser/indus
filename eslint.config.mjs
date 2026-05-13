type BadgeVariant = 'paid' | 'due' | 'partial' | 'pending' | 'approved' | 'rejected' |
  'available' | 'low' | 'out_of_stock' | 'high' | 'urgent' | 'normal' | 'low_priority'

const variantMap: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700',
  available: 'bg-green-100 text-green-700',
  due: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  out_of_stock: 'bg-red-100 text-red-700',
  urgent: 'bg-red-100 text-red-700',
  partial: 'bg-orange-100 text-orange-700',
  low: 'bg-orange-100 text-orange-700',
  pending: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-blue-100 text-blue-700',
  low_priority: 'bg-gray-100 text-gray-600',
}

const labelMap: Record<string, string> = {
  paid: 'Paid',
  due: 'Due',
  partial: 'Partial',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  available: 'Available',
  low: 'Low Stock',
  out_of_stock: 'Out of Stock',
  high: 'High',
  urgent: 'Urgent',
  normal: 'Normal',
  low_priority: 'Low',
}

export default function Badge({ variant }: { variant: string }) {
  const cls = variantMap[variant] || 'bg-gray-100 text-gray-600'
  const label = labelMap[variant] || variant
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}
