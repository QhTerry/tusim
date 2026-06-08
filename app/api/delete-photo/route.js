import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function DELETE(request) {
  const supabase = supabaseAdmin()
  const { searchParams } = new URL(request.url)
  const photo_id  = searchParams.get('photo_id')
  const device_id = searchParams.get('device_id')

  if (!photo_id || !device_id) {
    return Response.json({ error: 'photo_id и device_id обязательны' }, { status: 400 })
  }

  // Проверяем что фото принадлежит этому устройству
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('*')
    .eq('id', photo_id)
    .eq('device_id', device_id)
    .single()

  if (fetchError || !photo) {
    return Response.json({ error: 'Фото не найдено или нет прав' }, { status: 403 })
  }

  // Удаляем из Storage
  // URL вида: https://xxx.supabase.co/storage/v1/object/public/photos/EVENT_ID/filename.jpg
  try {
    const urlParts = photo.url.split('/storage/v1/object/public/photos/')
    if (urlParts[1]) {
      await supabase.storage.from('photos').remove([urlParts[1]])
    }
  } catch (e) {
    console.warn('Storage delete error:', e)
  }

  // Удаляем из БД
  const { error: deleteError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photo_id)
    .eq('device_id', device_id)

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}