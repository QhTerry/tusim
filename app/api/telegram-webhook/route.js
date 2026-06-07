import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'

// Сервисный ключ обходит RLS — организаторов заводим только с сервера.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const data = await req.json()

    // ── Dev-вход (только при server-флаге DEV_LOGIN=1) ───────────────
    // Позволяет логиниться локально, где Telegram-виджет недоступен.
    // В проде флаг не выставлен → ветка мертва.
    let tgUser = data
    if (data?.dev === true) {
      if (process.env.DEV_LOGIN !== '1') {
        return NextResponse.json({ error: 'Dev-вход выключен' }, { status: 403 })
      }
      tgUser = {
        id: 'dev-000001',
        first_name: 'Dev',
        username: 'dev_organizer',
        auth_date: Math.floor(Date.now() / 1000),
      }
    } else {
      // ── Боевой путь: верифицируем подпись Telegram ────────────────
      if (!verifyTelegramAuth(data)) {
        return NextResponse.json({ error: 'Недействительные данные' }, { status: 401 })
      }
      const authDate = parseInt(data.auth_date)
      if (Date.now() / 1000 - authDate > 86400) {
        return NextResponse.json({ error: 'Данные устарели' }, { status: 401 })
      }
    }

    const telegramId = tgUser.id.toString()

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
          telegram_username: tgUser.username || null,
          telegram_first_name: tgUser.first_name || null,
          telegram_last_name: tgUser.last_name || null,
          telegram_photo_url: tgUser.photo_url || null,
        })
        .select()
        .single()

      if (error) throw error
      organizer = newOrg
    } else {
      await supabase
        .from('organizers')
        .update({
          telegram_username: tgUser.username || null,
          telegram_first_name: tgUser.first_name || null,
          telegram_last_name: tgUser.last_name || null,
          telegram_photo_url: tgUser.photo_url || null,
        })
        .eq('telegram_id', telegramId)
    }

    // Подписанная сессия в httpOnly-cookie
    const token = signSession({
      id: organizer.id,
      telegram_id: telegramId,
      first_name: tgUser.first_name || '',
      last_name: tgUser.last_name || '',
      username: tgUser.username || '',
      photo_url: tgUser.photo_url || '',
    })

    const res = NextResponse.json({
      ok: true,
      organizer: {
        id: organizer.id,
        first_name: tgUser.first_name || '',
        last_name: tgUser.last_name || '',
        username: tgUser.username || '',
        photo_url: tgUser.photo_url || '',
      },
    })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return res
  } catch (e) {
    console.error('Telegram auth error:', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

function verifyTelegramAuth(data) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return false
  const { hash, ...rest } = data

  const checkString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  return expectedHash === hash
}
