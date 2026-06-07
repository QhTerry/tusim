import { NextResponse } from 'next/server'

// Имя cookie дублируем строкой: middleware на edge-рантайме не должен
// импортировать lib/session (там node:crypto, несовместимый с edge).
const SESSION_COOKIE = 'tusim_session'

// Защищаем кабинет организатора. /organizer (логин) — открыт.
// Проверяем только НАЛИЧИЕ cookie (быстрая проверка для роутинга);
// полную проверку подписи делают серверные роуты с данными.
const PROTECTED = ['/organizer/dashboard', '/organizer/create', '/organizer/event']

export function middleware(req) {
  const { pathname } = req.nextUrl
  const needsAuth = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!needsAuth) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/organizer'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/organizer/:path*'],
}
