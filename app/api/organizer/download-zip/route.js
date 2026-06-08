import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizer, unauthorized } from '@/lib/auth'
import { buildZip } from '@/lib/zip'

// Скачивание всех фото события одним ZIP. Проверка владения + тариф (не для free).
export async function GET(request) {
  const organizer = await getOrganizer()
  if (!organizer) return unauthorized()

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event_id')
  if (!eventId) return Response.json({ error: 'event_id обязателен' }, { status: 400 })

  const supabase = supabaseAdmin()
  const { data: event, error } = await supabase
    .from('events').select('id, organizer_id, name, plan, code').eq('id', eventId).single()
  if (error || !event) return Response.json({ error: 'Событие не найдено' }, { status: 404 })
  if (event.organizer_id !== organizer.id) return Response.json({ error: 'Нет прав' }, { status: 403 })
  if (event.plan === 'free') return Response.json({ error: 'Скачивание архива доступно с тарифа «Тусовка»' }, { status: 402 })

  const { data: photos } = await supabase
    .from('photos').select('url, author, created_at').eq('event_id', eventId).order('created_at', { ascending: true })

  if (!photos || !photos.length) return Response.json({ error: 'В событии пока нет фото' }, { status: 404 })

  const files = []
  let idx = 0
  for (const p of photos) {
    idx++
    try {
      const r = await fetch(p.url)
      if (!r.ok) continue
      const buf = Buffer.from(await r.arrayBuffer())
      const num = String(idx).padStart(3, '0')
      const who = (p.author || 'guest').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 24)
      files.push({ name: `${num}_${who}.jpg`, data: buf })
    } catch (e) { /* пропускаем битый файл */ }
  }

  if (!files.length) return Response.json({ error: 'Не удалось собрать фото' }, { status: 500 })

  const zip = buildZip(files)
  const safeName = (event.name || event.code || 'event').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40)
  return new Response(zip, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="tusim_${safeName}.zip"`,
      'Content-Length': String(zip.length),
    },
  })
}
