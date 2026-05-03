import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  const formData = await request.formData()
  const file = formData.get('file')
  const eventId = formData.get('event_id')
  const deviceId = formData.get('device_id')

  const filename = `${eventId}/${Date.now()}.jpg`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filename, buffer, { contentType: 'image/jpeg' })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(filename)

  const { data: photo, error: dbError } = await supabase
    .from('photos')
    .insert({
      event_id: eventId,
      device_id: deviceId,
      url: urlData.publicUrl,
      votes: 0,
    })
    .select()
    .single()

  if (dbError) {
    return Response.json({ error: dbError.message }, { status: 500 })
  }

  return Response.json({ photo })
}