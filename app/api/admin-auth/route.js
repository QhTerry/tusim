import { NextResponse } from 'next/server'
import { signSession, sessionCookieOptions } from '@/lib/session'
import { ADMIN_COOKIE } from '@/lib/auth'

export async function POST(request) {
  const { login, password } = await request.json()
  const correctLogin    = process.env.ADMIN_LOGIN
  const correctPassword = process.env.ADMIN_PASSWORD

  if (!correctLogin || !correctPassword) {
    return NextResponse.json({ error: 'Сервер не настроен' }, { status: 500 })
  }

  if (login === correctLogin && password === correctPassword) {
    const token = signSession({ admin: true })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions())
    return res
  }

  return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
}

// Выход из админки — гасим cookie.
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { ...sessionCookieOptions(0), maxAge: 0 })
  return res
}
