import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Лайк фото в свайп-режиме. Раньше браузер делал photos.update(votes) с anon-ключом —
// под RLS это запрещено, поэтому инкремент перенесён на сервер.
export async function POST(request) {
  let body
  try { body = await request.json() } catch { body = {} }
  const photoId = body.photo_id
  if (!photoId) return Response.json({ error: 'photo_id обязателен' }, { status: 400 })

  const supabase = supabaseAdmin()
  const { data: photo, error: readErr } = await supabase
    .from('photos').select('votes').eq('id', photoId).single()
  if (readErr || !photo) return Response.json({ error: 'Фото не найдено' }, { status: 404 })

  const { data, error } = await supabase
    .from('photos')
    .update({ votes: (photo.votes || 0) + 1 })
    .eq('id', photoId)
    .select('votes')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, votes: data.votes })
}
