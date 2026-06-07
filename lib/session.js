import crypto from 'crypto'

// Подписанная сессия в httpOnly-cookie. Секрет — серверный, в браузер не попадает.
// HMAC-SHA256(body) проверяет, что cookie не подделана. Хранит id организатора.

export const SESSION_COOKIE = 'tusim_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней

function secret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.TELEGRAM_BOT_TOKEN ||
    'insecure-dev-secret-change-me'
  )
}

export function signSession(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (!data.iat || Date.now() - data.iat > SESSION_MAX_AGE * 1000) return null
    return data
  } catch {
    return null
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  }
}
