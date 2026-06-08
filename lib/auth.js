import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

// Достаёт организатора из подписанной httpOnly-сессии. Возвращает данные сессии
// ({ id, telegram_id, first_name, ... }) или null. id === organizers.id в БД.
export async function getOrganizer() {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}

// Удобный ответ для неавторизованных запросов.
export function unauthorized() {
  return Response.json({ error: 'unauthorized' }, { status: 401 })
}
