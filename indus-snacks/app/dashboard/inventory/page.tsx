import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { Package } from 'lucide-react'
import { format } from 'date-fns'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('inventory')
    .select('*')
    .order('category')
    .order('item_name')

  const list = items || []

  const byCategory: Record<string, typeof list> = {}
  list.forEach(item => {
    const cat = item.category || 'other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  })

  const available = list.filter(i => i.availability_status === 'available').length
  const low = list.filter(i => i.availability_status === 'low').length
  const outOfStock = list.filter(i => i.availability_status === 'out_of_stock').length

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Snack Inventory" description="Current stock levels across all categories" />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{available}</p>
          <p className="text-xs text-green-600 mt-0.5">Available</p>
        </div>
        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">{low}</p>
          <p className="text-xs text-orange-600 mt-0.5">Low Stock</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{outOfStock}</p>
          <p className="text-xs text-red-600 mt-0.5">Out of Stock</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={Package} title="No inventory items" description="Inventory will appear here once added by admin." />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCategory).map(([category, categoryItems]) => (
            <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm capitalize">{category}</h3>
                <span className="text-xs text-gray-400">{categoryItems.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {categoryItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{item.item_name}</td>
                        <td className="px-5 py-3.5">
                          <span className={`font-semibold ${
                            item.availability_status === 'out_of_stock' ? 'text-red-600' :
                            item.availability_status === 'low' ? 'text-orange-600' : 'text-gray-900'
                          }`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">{item.unit}</td>
                        <td className="px-5 py-3.5 text-gray-700">
                          {item.price ? `PKR ${Number(item.price).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-3.5"><Badge variant={item.availability_status} /></td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{format(new Date(item.updated_at), 'MMM d, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
