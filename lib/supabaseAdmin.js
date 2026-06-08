import { createClient } from '@supabase/supabase-js'

// Серверный клиент с service_role — обходит RLS. ИСПОЛЬЗОВАТЬ ТОЛЬКО В РОУТАХ/СЕРВЕРЕ.
// Ключ никогда не уходит в браузер (нет префикса NEXT_PUBLIC_).
// Все мутации БД проходят через него, поэтому из браузера писать нельзя (RLS блокирует anon).

let _admin = null

export function supabaseAdmin() {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    // Падать явно, чтобы не словить тихие RLS-отказы в проде.
    throw new Error('SUPABASE_SERVICE_ROLE_KEY не задан — серверные мутации работать не будут')
  }
  _admin = createClient(url, key, { auth: { persistSession: false } })
  return _admin
}
