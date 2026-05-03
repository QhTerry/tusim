import GuestClient from './GuestClient'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function EventPage({ params }) {
  const code = (await params).code

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('code', code)
    .single()

  console.log('code:', code, 'event:', event, 'error:', error)

  if (!event) {
    return (
      <div style={{
        minHeight: '100vh', background: '#1A1A1D',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{ color: '#F0F0F0', fontFamily: 'sans-serif', fontSize: '18px' }}>
          Событие не найдено: {code}
        </div>
        <div style={{ color: '#4E4E50', fontFamily: 'sans-serif', fontSize: '14px' }}>
          Проверь QR-код
        </div>
      </div>
    )
  }

  return <GuestClient event={event} />
}