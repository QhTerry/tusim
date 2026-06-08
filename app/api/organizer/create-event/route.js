import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizer, unauthorized } from '@/lib/auth'

// Лимиты тарифов — источник правды на сервере (браузеру не доверяем).
const PLANS = {
  free:     { guests: 5,   photos: 2  },
  mini:     { guests: 15,  photos: 10 },
  standard: { guests: 30,  photos: 20 },
  max:      { guests: 60,  photos: 30 },
  ultra:    { guests: 150, photos: 30 },
}

function genCode() {
  // 6 символов без похожих (0/O, 1/I) — удобно диктовать и набирать.
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
  const planId = PLANS[body.plan] ? body.plan : 'free'
  const plan = PLANS[planId]
  const hours = Math.min(Math.max(parseInt(body.duration) || 3, 1), 24)

  const now = Date.now()
  const supabase = supabaseAdmin()

  // Генерируем уникальный код (несколько попыток на случай коллизии).
  let event = null, lastErr = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('events')
      .insert({
        organizer_id: organizer.id,
        name,
        code: genCode(),
        plan: planId,
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
    // 23505 = unique_violation (код занят) → пробуем ещё раз с новым кодом.
    if (error.code !== '23505') break
  }

  if (!event) {
    return Response.json({ error: lastErr?.message || 'Не удалось создать событие' }, { status: 500 })
  }

  return Response.json({ event })
}
