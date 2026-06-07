import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Лиды с лендинга: пишем в Supabase (надёжный источник правды)
// и параллельно шлём уведомление в Telegram организатору.
// Достаточно, чтобы сработал ХОТЯ БЫ один канал — лид не теряется.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
// Сервисный ключ обходит RLS на запись с сервера. Если его нет — fallback на anon.
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function saveToDb(lead) {
  const { error } = await supabase.from('leads').insert({
    name: lead.name,
    contact: lead.contact,
    event_type: lead.type || null,
    source: lead.source || 'landing',
  })
  if (error) throw error
}

async function notifyTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!token || !chatId) throw new Error('telegram not configured')

  const text =
    `🎉 <b>Новая заявка с лендинга</b>\n\n` +
    `👤 <b>Имя:</b> ${escapeHtml(lead.name)}\n` +
    `📞 <b>Контакт:</b> ${escapeHtml(lead.contact)}\n` +
    `🎈 <b>Событие:</b> ${escapeHtml(lead.type) || '—'}`

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) throw new Error('telegram send failed: ' + res.status)
}

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const name = (body.name || '').toString().trim().slice(0, 120)
  const contact = (body.contact || '').toString().trim().slice(0, 200)
  const type = (body.type || '').toString().trim().slice(0, 120)
  const source = (body.source || 'landing').toString().trim().slice(0, 40)

  if (!name || !contact) {
    return NextResponse.json({ error: 'name and contact required' }, { status: 400 })
  }

  const lead = { name, contact, type, source }

  // Пытаемся доставить лид всеми доступными каналами.
  const results = await Promise.allSettled([saveToDb(lead), notifyTelegram(lead)])
  const delivered = results.some(r => r.status === 'fulfilled')

  if (!delivered) {
    console.error('Lead delivery failed:', results.map(r => r.status === 'rejected' ? r.reason?.message : 'ok'))
    return NextResponse.json({ error: 'delivery failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
