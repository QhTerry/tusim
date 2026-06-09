import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizer, unauthorized } from '@/lib/auth'
import { getPlan, CUSTOM_LIMITS } from '@/lib/plans'

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
  const isCustom = body.plan === 'custom'
  const plan = getPlan(body.plan)
  const clamp = (v, [lo, hi], d) => Math.min(Math.max(parseInt(v) || d, lo), hi)
  const guests = isCustom ? clamp(body.guests, CUSTOM_LIMITS.guests, 10) : plan.guests
  const photoLimit = isCustom ? clamp(body.photos, CUSTOM_LIMITS.photos, 10) : plan.photos
  const hours = isCustom ? clamp(body.duration, CUSTOM_LIMITS.hours, 6) : Math.min(Math.max(parseInt(body.duration) || plan.durationHours, 1), plan.durationHours)
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
        photo_limit: photoLimit,
        guest_limit: guests,
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
