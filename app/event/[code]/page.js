import GuestClient from './GuestClient'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function EventPage({ params }) {
  const code = (await params).code

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('code', code)
    .single()

  if (!event) {
    return (
      <div style={{
        minHeight: '100vh', background: '#1A1A1D',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{ color: '#F0F0F0', fontFamily: "'Onest', sans-serif", fontSize: '18px' }}>
          Событие не найдено
        </div>
        <div style={{ color: '#4E4E50', fontFamily: "'Onest', sans-serif", fontSize: '14px' }}>
          Проверь QR-код и попробуй снова
        </div>
      </div>
    )
  }

  return <GuestClient event={event} />
}