import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request) {
  const supabase = supabaseAdmin()
  const { searchParams } = new URL(request.url)
  const event_id = searchParams.get('event_id')
  const device_id = searchParams.get('device_id')

  const { data, error } = await supabase
    .from('photos').select('*')
    .eq('event_id', event_id).eq('device_id', device_id)
    .order('created_at', { ascending: false })

  return Response.json({ photos: data, error })
}
