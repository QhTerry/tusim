import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizer, unauthorized } from '@/lib/auth'
import { getPlan } from '@/lib/plans'

function genCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return s
}

export async function POST(request) {
  const organizer = await getOrganizer()
  if (!organizer) return unauthorized()

  let body
  try { body = await request.json() } catch { body = {} }

  const name = (body.name || '').toString().trim().slice(0, 80) || 'Событие'
  const plan = getPlan(body.plan)
  // Длительность не больше, чем разрешает тариф.
  const hours = Math.min(Math.max(parseInt(body.duration) || plan.durationHours, 1), plan.durationHours)
  const now = Date.now()
  const supabase = supabaseAdmin()

  let event = null, lastErr = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('events')
      .insert({
        organizer_id: organizer.id,
        name,
        code: genCode(),
        plan: plan.id,
        status: 'active',
        photo_limit: plan.photos,
        guest_limit: plan.guests,
        starts_at: new Date(now).toISOString(),
        ends_at: new Date(now + hours * 3600_000).toISOString(),
      })
      .select()
      .single()
    if (!error) { event = data; break }
    lastErr = error
    if (error.code !== '23505') break
  }

  if (!event) {
    return Response.json({ error: lastErr?.message || 'Не удалось создать событие' }, { status: 500 })
  }
  return Response.json({ event })
}
