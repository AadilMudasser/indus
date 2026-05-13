import { createClient } from '@/lib/supabase/client'

export async function logActivity(action: string, entity: string, entityId?: string, details?: string) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('activity_logs').insert({
      admin_id: user.id,
      action,
      entity,
      entity_id: entityId,
      details,
    })
  } catch {
    // non-critical, silently fail
  }
}
