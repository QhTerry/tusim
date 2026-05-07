import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) {
      return NextResponse.json({ error: 'Нет данных' }, { status: 400 })
    }

    const normalized = phone.replace(/\D/g, '').replace(/^8/, '7')

    // Ищем валидный код
    const { data: otp } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', normalized)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (!otp) {
      return NextResponse.json({ error: 'Неверный или истёкший код' }, { status: 401 })
    }

    // Помечаем код как использованный
    await supabase.from('otp_codes').update({ used: true }).eq('id', otp.id)

    // Создаём или находим организатора
    let { data: organizer } = await supabase
      .from('organizers')
      .select('*')
      .eq('phone', normalized)
      .single()

    if (!organizer) {
      const { data: newOrg } = await supabase
        .from('organizers')
        .insert({ phone: normalized })
        .select()
        .single()
      organizer = newOrg
    }

    // Простая сессия — токен в виде organizer_id + timestamp (для MVP)
    const sessionToken = Buffer.from(
      JSON.stringify({ id: organizer.id, phone: normalized, ts: Date.now() })
    ).toString('base64')

    return NextResponse.json({
      ok: true,
      token: sessionToken,
      organizer: { id: organizer.id, phone: normalized, name: organizer.name }
    })
  } catch (e) {
    console.error('Verify OTP error:', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}