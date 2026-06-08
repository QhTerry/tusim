import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizer, unauthorized } from '@/lib/auth'

// Список событий ТОЛЬКО текущего организатора + агрегаты (фото и уникальные гости).
// Раньше дашборд читал photo_count/guest_count, которых не было — теперь считаем здесь.
export async function GET() {
  const organizer = await getOrganizer()
  if (!organizer) return unauthorized()
  const supabase = supabaseAdmin()

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizer.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const list = events || []
  if (list.length) {
    const ids = list.map(e => e.id)
    const { data: photos } = await supabase
      .from('photos')
      .select('event_id, device_id')
      .in('event_id', ids)

    const agg = {}
    for (const p of (photos || [])) {
      const b = agg[p.event_id] || (agg[p.event_id] = { photos: 0, guests: new Set() })
      b.photos++
      if (p.device_id) b.guests.add(p.device_id)
    }
    for (const e of list) {
      const b = agg[e.id]
      e.photo_count = b ? b.photos : 0
      e.guest_count = b ? b.guests.size : 0
    }
  }

  return Response.json({ events: list })
}
