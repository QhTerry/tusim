import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request) {
  const supabase = supabaseAdmin()
  const { searchParams } = new URL(request.url)
  const event_id = searchParams.get('event_id')

  if (!event_id) return Response.json({ error: 'event_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('photos').select('device_id').eq('event_id', event_id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const total_photos = data.length
  const guest_count = new Set(data.map(p => p.device_id)).size
  return Response.json({ total_photos, guest_count })
}
