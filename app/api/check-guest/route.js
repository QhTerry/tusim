import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Гейт гостя при сканировании QR. Возвращает { allowed, reason, guest_count }.
// Гость НЕ регистрируется — просто проверяем статус события и лимит гостей.
export async function POST(request) {
  let body
  try { body = await request.json() } catch { body = {} }
  const { event_id, device_id } = body || {}
  if (!event_id) return Response.json({ allowed: false, reason: 'Событие не указано' }, { status: 400 })

  const supabase = supabaseAdmin()
  const { data: event } = await supabase
    .from('events').select('id, status, guest_limit').eq('id', event_id).single()

  if (!event) return Response.json({ allowed: false, reason: 'Событие не найдено' })
  if (event.status === 'closed') return Response.json({ allowed: false, reason: 'Событие уже завершено' })

  const { data: photos } = await supabase
    .from('photos').select('device_id').eq('event_id', event_id)
  const devices = new Set((photos || []).map(p => p.device_id).filter(Boolean))
  const guest_count = devices.size
  const isExisting = device_id && devices.has(device_id)

  // Новому гостю отказываем только если лимит исчерпан; «свои» проходят всегда.
  if (!isExisting && event.guest_limit && guest_count >= event.guest_limit) {
    return Response.json({ allowed: false, reason: 'Достигнут лимит гостей на этом событии', guest_count })
  }
  return Response.json({ allowed: true, guest_count })
}
