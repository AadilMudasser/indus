export interface Profile {
  id: string
  full_name: string
  username: string | null
  email: string | null
  department: string | null
  role: 'staff' | 'admin'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  month: number
  year: number
  amount: number
  status: 'paid' | 'due' | 'partial'
  payment_date: string | null
  notes: string | null
  created_at: string
}

export interface InventoryItem {
  id: string
  item_name: string
  quantity: number
  price: number | null
  unit: string
  category: string
  availability_status: 'available' | 'low' | 'out_of_stock'
  updated_at: string
  created_at: string
}

export interface Request {
  id: string
  user_id: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  admin_response: string | null
  created_at: string
  updated_at: string
}

export interface FinancialSummary {
  id: string
  total_collected: number
  total_spent: number
  remaining_balance: number
  updated_at: string
}

export interface Expense {
  id: string
  item_name: string
  amount: number
  category: string
  description: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_active: boolean
  created_at: string
  updated_at: string
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const DEPARTMENTS = [
  'Emergency', 'ICU', 'Surgery', 'Cardiology', 'Pediatrics',
  'Radiology', 'Pharmacy', 'Administration', 'Nursing', 'Laboratory',
  'Orthopedics', 'Neurology', 'Oncology', 'Gynecology', 'Psychiatry'
]
