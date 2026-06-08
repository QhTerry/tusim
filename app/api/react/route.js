import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Реакция на фото в альбоме. Раньше браузер делал reactions.insert с anon-ключом —
// под RLS запрещено, поэтому вставка идёт через сервер.
export async function POST(request) {
  let body
  try { body = await request.json() } catch { body = {} }
  const { photo_id, event_id, device_id, reaction_key } = body || {}
  if (!photo_id || !event_id || !reaction_key) {
    return Response.json({ error: 'photo_id, event_id, reaction_key обязательны' }, { status: 400 })
  }

  const { error } = await supabaseAdmin()
    .from('reactions')
    .insert({ photo_id, event_id, device_id: device_id || null, reaction_key })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
