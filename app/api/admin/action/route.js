import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAdmin, unauthorized } from '@/lib/auth'

function genCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return s
}

// Все мутации админки через сервер с проверкой admin-сессии (service_role обходит RLS).
export async function POST(request) {
  if (!(await isAdmin())) return unauthorized()

  let body
  try { body = await request.json() } catch { body = {} }
  const { action } = body || {}
  const supabase = supabaseAdmin()

  if (action === 'create_event') {
    const name = (body.name || '').toString().trim().slice(0, 80) || 'Событие'
    const photo_limit = Math.max(1, parseInt(body.photo_limit) || 30)
    const guest_limit = Math.max(1, parseInt(body.guest_limit) || 150)
    const durationMin = Math.max(15, parseInt(body.duration_min) || 120)
    const startNow = body.start_now !== false
    const now = Date.now()

    let event = null, lastErr = null
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase.from('events').insert({
        name, code: genCode(), status: 'active',
        photo_limit, guest_limit,
        starts_at: startNow ? new Date(now).toISOString() : null,
        ends_at: new Date(now + durationMin * 60000).toISOString(),
      }).select().single()
      if (!error) { event = data; break }
      lastErr = error
      if (error.code !== '23505') break
    }
    if (!event) return Response.json({ error: lastErr?.message || 'Не удалось создать' }, { status: 500 })
    return Response.json({ event })
  }

  if (action === 'update_event') {
    const { event_id } = body
    if (!event_id) return Response.json({ error: 'event_id обязателен' }, { status: 400 })
    const allow = ['status', 'ends_at', 'starts_at', 'photo_limit', 'guest_limit', 'name']
    const fields = {}
    for (const k of allow) if (k in (body.fields || {})) fields[k] = body.fields[k]
    if (!Object.keys(fields).length) return Response.json({ error: 'Нет полей' }, { status: 400 })
    const { data, error } = await supabase.from('events').update(fields).eq('id', event_id).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ event: data })
  }

  if (action === 'delete_photo') {
    const { photo_id } = body
    if (!photo_id) return Response.json({ error: 'photo_id обязателен' }, { status: 400 })
    const { data: photo } = await supabase.from('photos').select('url').eq('id', photo_id).single()
    if (photo?.url) {
      try {
        const parts = photo.url.split('/storage/v1/object/public/photos/')
        if (parts[1]) await supabase.storage.from('photos').remove([parts[1]])
      } catch (e) { console.warn('storage remove:', e) }
    }
    const { error } = await supabase.from('photos').delete().eq('id', photo_id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Неизвестное действие' }, { status: 400 })
}
