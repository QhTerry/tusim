import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    const message = body?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat?.id?.toString()
    const text = message.text || ''

    // Когда пользователь пишет /start или любой текст —
    // сохраняем chat_id привязанный к номеру если есть pending OTP
    if (text.startsWith('/start')) {
      await sendMessage(chatId,
        '👋 Привет! Я бот сервиса *tusi\'m*.\n\n' +
        'Введи свой номер телефона на сайте и я пришлю тебе код для входа в кабинет организатора.'
      )
      return NextResponse.json({ ok: true })
    }

    // Если пользователь прислал номер телефона через кнопку
    const contact = message?.contact
    if (contact?.phone_number) {
      const phone = normalizePhone(contact.phone_number)
      await linkChatToPhone(phone, chatId)
      await sendMessage(chatId, '✅ Номер привязан! Теперь иди на сайт и запроси код.')
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return NextResponse.json({ ok: true })
  }
}

async function linkChatToPhone(phone, chatId) {
  await supabase
    .from('otp_codes')
    .update({ telegram_chat_id: chatId })
    .eq('phone', phone)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
}

async function sendMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  })
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '').replace(/^8/, '7')
}