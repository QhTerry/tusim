import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const data = await req.json()

    // Верифицируем подпись от Telegram
    if (!verifyTelegramAuth(data)) {
      return NextResponse.json({ error: 'Недействительные данные' }, { status: 401 })
    }

    // Проверяем что данные свежие (не старше 24 часов)
    const authDate = parseInt(data.auth_date)
    if (Date.now() / 1000 - authDate > 86400) {
      return NextResponse.json({ error: 'Данные устарели' }, { status: 401 })
    }

    const telegramId = data.id.toString()

    // Находим или создаём организатора
    let { data: organizer } = await supabase
      .from('organizers')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (!organizer) {
      const { data: newOrg, error } = await supabase
        .from('organizers')
        .insert({
          telegram_id: telegramId,
          telegram_username: data.username || null,
          telegram_first_name: data.first_name || null,
          telegram_last_name: data.last_name || null,
          telegram_photo_url: data.photo_url || null,
        })
        .select()
        .single()

      if (error) throw error
      organizer = newOrg
    } else {
      // Обновляем данные профиля
      await supabase
        .from('organizers')
        .update({
          telegram_username: data.username || null,
          telegram_first_name: data.first_name || null,
          telegram_last_name: data.last_name || null,
          telegram_photo_url: data.photo_url || null,
        })
        .eq('telegram_id', telegramId)
    }

    // Создаём токен сессии
    const sessionToken = Buffer.from(
      JSON.stringify({
        id: organizer.id,
        telegram_id: telegramId,
        first_name: data.first_name,
        ts: Date.now()
      })
    ).toString('base64')

    return NextResponse.json({
      ok: true,
      token: sessionToken,
      organizer: {
        id: organizer.id,
        first_name: data.first_name,
        last_name: data.last_name || '',
        username: data.username || '',
        photo_url: data.photo_url || '',
      }
    })
  } catch (e) {
    console.error('Telegram auth error:', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

function verifyTelegramAuth(data) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const { hash, ...rest } = data

  // Строка для проверки: отсортированные поля key=value через \n
  const checkString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n')

  // Секретный ключ = SHA256 от токена бота
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest()

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex')

  return expectedHash === hash
}