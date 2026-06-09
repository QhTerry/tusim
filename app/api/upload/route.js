import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request) {
  const supabase = supabaseAdmin()
  const formData = await request.formData()
  const file = formData.get('file')
  const eventId = formData.get('event_id')
  const deviceId = formData.get('device_id')
  const author = formData.get('author') || 'Гость'

  if (!file || !eventId || !deviceId) {
    return Response.json({ error: 'Не хватает данных для загрузки' }, { status: 400 })
  }

  // Статус и лимиты тарифа
  const { data: event } = await supabase
    .from('events').select('status, photo_limit, guest_limit').eq('id', eventId).single()
  if (!event) return Response.json({ error: 'Событие не найдено' }, { status: 404 })
  if (event.status === 'closed') {
    return Response.json({ error: 'Событие завершено — загрузка закрыта', code: 'closed' }, { status: 403 })
  }

  const { data: existing } = await supabase.from('photos').select('device_id').eq('event_id', eventId)
  const rows = existing || []
  const myCount = rows.filter(r => r.device_id === deviceId).length
  if (event.photo_limit && myCount >= event.photo_limit) {
    return Response.json({ error: `Лимит ${event.photo_limit} фото на гостя исчерпан`, code: 'photo_limit' }, { status: 403 })
  }
  const devices = new Set(rows.map(r => r.device_id).filter(Boolean))
  if (!devices.has(deviceId) && event.guest_limit && devices.size >= event.guest_limit) {
    return Response.json({ error: 'Достигнут лимит гостей на событии', code: 'guest_limit' }, { status: 403 })
  }

  const filename = `${eventId}/${Date.now()}.jpg`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filename, buffer, { contentType: 'image/jpeg' })
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filename)

  const { data: photo, error: dbError } = await supabase
    .from('photos')
    .insert({ event_id: eventId, device_id: deviceId, url: urlData.publicUrl, author, votes: 0 })
    .select()
    .single()
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

  return Response.json({ photo })
}
