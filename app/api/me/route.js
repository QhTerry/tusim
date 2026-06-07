import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export async function GET() {
  const store = await cookies()
  const session = verifySession(store.get(SESSION_COOKIE)?.value)
  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  return Response.json({
    organizer: {
      id: session.id,
      first_name: session.first_name || '',
      last_name: session.last_name || '',
      username: session.username || '',
      photo_url: session.photo_url || '',
    },
  })
}
