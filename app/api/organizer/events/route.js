import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizer, unauthorized } from '@/lib/auth'

// Список событий ТОЛЬКО текущего организатора. Раньше дашборд тянул все события
// всех организаторов из браузера — теперь фильтр по organizer_id на сервере.
export async function GET() {
  const organizer = await getOrganizer()
  if (!organizer) return unauthorized()

  const { data, error } = await supabaseAdmin()
    .from('events')
    .select('*')
    .eq('organizer_id', organizer.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ events: data || [] })
}
