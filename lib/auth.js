import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const ADMIN_COOKIE = 'tusim_admin'

// Организатор из подписанной httpOnly-сессии (id === organizers.id) или null.
export async function getOrganizer() {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}

// Признак админа из отдельной подписанной cookie.
export async function isAdmin() {
  const store = await cookies()
  const data = verifySession(store.get(ADMIN_COOKIE)?.value)
  return !!(data && data.admin)
}

export function unauthorized() {
  return Response.json({ error: 'unauthorized' }, { status: 401 })
}
