export async function POST(request) {
  const { login, password } = await request.json()

  const correctLogin    = process.env.ADMIN_LOGIN
  const correctPassword = process.env.ADMIN_PASSWORD

  if (!correctLogin || !correctPassword) {
    return Response.json({ error: 'Сервер не настроен' }, { status: 500 })
  }

  if (login === correctLogin && password === correctPassword) {
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Неверный логин или пароль' }, { status: 401 })
}