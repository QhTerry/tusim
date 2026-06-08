import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizer, unauthorized } from '@/lib/auth'

// Все мутации организатора над своим событием в одном месте. Каждая проверяет,
// что событие принадлежит текущему организатору (event.organizer_id === session.id).
// Раньше это делалось из браузера с anon-ключом → любой мог закрыть/удалить чужое.

export async function POST(request) {
  const organizer = await getOrganizer()
  if (!organizer) return unauthorized()

  let body
  try { body = await request.json() } catch { body = {} }
  const { action, event_id, photo_id, extra_minutes } = body || {}

  if (!event_id) return Response.json({ error: 'event_id обязателен' }, { status: 400 })

  const supabase = supabaseAdmin()

  // Проверка владения — фундамент безопасности всех действий ниже.
  const { data: event, error: evErr } = await supabase
    .from('events')
    .select('id, organizer_id, ends_at, status')
    .eq('id', event_id)
    .single()

  if (evErr || !event) return Response.json({ error: 'Событие не найдено' }, { status: 404 })
  if (event.organizer_id !== organizer.id) {
    return Response.json({ error: 'Нет прав на это событие' }, { status: 403 })
  }

  if (action === 'close') {
    const { error } = await supabase.from('events').update({ status: 'closed' }).eq('id', event_id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true, status: 'closed' })
  }

  if (action === 'reopen') {
    const minutes = Math.min(Math.max(parseInt(extra_minutes) || 120, 15), 24 * 60)
    const base = event.ends_at && new Date(event.ends_at) > new Date() ? new Date(event.ends_at) : new Date()
    const ends_at = new Date(base.getTime() + minutes * 60000).toISOString()
    const { error } = await supabase.from('events').update({ status: 'active', ends_at }).eq('id', event_id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true, status: 'active', ends_at })
  }

  if (action === 'delete_photo') {
    if (!photo_id) return Response.json({ error: 'photo_id обязателен' }, { status: 400 })
    // Фото должно принадлежать ИМЕННО этому событию (защита от удаления чужого фото
    // через подмену photo_id из другого события).
    const { data: photo } = await supabase
      .from('photos').select('id, url, event_id').eq('id', photo_id).single()
    if (!photo || photo.event_id !== event_id) {
      return Response.json({ error: 'Фото не найдено в этом событии' }, { status: 404 })
    }
    // Чистим файл в Storage (best-effort), затем строку в БД.
    try {
      const parts = (photo.url || '').split('/storage/v1/object/public/photos/')
      if (parts[1]) await supabase.storage.from('photos').remove([parts[1]])
    } catch (e) { console.warn('storage remove:', e) }
    const { error } = await supabase.from('photos').delete().eq('id', photo_id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Неизвестное действие' }, { status: 400 })
}
