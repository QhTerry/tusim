import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { phone } = await req.json()
    if (!phone) return NextResponse.json({ error: 'Нет номера' }, { status: 400 })

    const normalized = normalizePhone(phone)
    if (!isValidPhone(normalized)) {
      return NextResponse.json({ error: 'Неверный номер' }, { status: 400 })
    }

    // Ищем chat_id этого пользователя в старых OTP (если уже писал боту)
    const { data: existing } = await supabase
      .from('otp_codes')
      .select('telegram_chat_id')
      .eq('phone', normalized)
      .not('telegram_chat_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const chatId = existing?.telegram_chat_id

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 минут

    // Инвалидируем старые коды
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('phone', normalized)
      .eq('used', false)

    // Сохраняем новый код
    await supabase.from('otp_codes').insert({
      phone: normalized,
      code,
      telegram_chat_id: chatId || null,
      expires_at: expiresAt.toISOString()
    })

    if (chatId) {
      // Пользователь уже писал боту — отправляем код
      await sendTelegramCode(chatId, code)
      return NextResponse.json({ status: 'sent', hasChatId: true })
    } else {
      // Нужно чтобы пользователь сначала написал боту
      return NextResponse.json({
        status: 'need_bot',
        hasChatId: false,
        botLink: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}`
      })
    }
  } catch (e) {
    console.error('Send OTP error:', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

async function sendTelegramCode(chatId, code) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🔐 Твой код для входа в tusi'm:\n\n*${code}*\n\nКод действует 10 минут.`,
      parse_mode: 'Markdown'
    })
  })
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '').replace(/^8/, '7')
}

function isValidPhone(phone) {
  return /^7\d{10}$/.test(phone)
}