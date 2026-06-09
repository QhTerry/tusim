'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function LiveInner() {
  const sp = useSearchParams()
  const [photos, setPhotos] = useState([])
  const [eventName, setEventName] = useState('')
  const [idx, setIdx] = useState(0)
  const [justNew, setJustNew] = useState(false)
  const eventId = useRef(null)

  useEffect(() => {
    const eid = sp.get('event_id') || (typeof window !== 'undefined' && localStorage.getItem('tusim_event_id'))
    if (!eid) return
    eventId.current = eid
    supabase.from('events').select('name').eq('id', eid).single().then(({ data }) => { if (data) setEventName(data.name) })
    supabase.from('photos').select('*').eq('event_id', eid).order('created_at', { ascending: false }).then(({ data }) => { if (data) setPhotos(data) })
    const ch = supabase.channel(`live-${eid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: `event_id=eq.${eid}` },
        p => { setPhotos(prev => [p.new, ...prev]); setIdx(0); setJustNew(true); setTimeout(() => setJustNew(false), 2500) })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  // Автопрокрутка
  useEffect(() => {
    if (photos.length < 2 || justNew) return
    const t = setInterval(() => setIdx(i => (i + 1) % photos.length), 6000)
    return () => clearInterval(t)
  }, [photos.length, justNew])

  const featured = photos[idx]

  return (
    <main style={{ position:'fixed', inset:0, background:'#050507', overflow:'hidden', fontFamily:"'Onest',sans-serif", color:'#fff' }}>
      <div className="ds-atmos" aria-hidden="true"><div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/></div>

      <div style={{ position:'absolute', top:28, left:32, zIndex:3, display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:26, letterSpacing:'-1px' }}>tusi<span style={{ color:'#E11D54' }}>&apos;m</span></span>
        {eventName && <span style={{ fontSize:18, color:'rgba(255,255,255,0.55)', fontWeight:500 }}>· {eventName}</span>}
      </div>
      <div style={{ position:'absolute', top:32, right:32, zIndex:3, display:'flex', alignItems:'center', gap:9, fontSize:14, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#E11D54' }}>
        <span style={{ width:9, height:9, borderRadius:'50%', background:'#E11D54', animation:'lvPulse 1.6s infinite' }}/>Live · {photos.length}
      </div>

      {featured ? (
        <div key={featured.id} style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'90px 40px 130px', zIndex:2 }}>
          <img src={featured.url} alt="" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:20, boxShadow:'0 40px 120px rgba(0,0,0,0.7)', animation: justNew ? 'lvPop .6s cubic-bezier(.34,1.56,.64,1)' : 'lvKen 6s ease both' }}/>
          <div style={{ position:'absolute', bottom:120, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(12px)', borderRadius:999, padding:'10px 22px', fontSize:17, fontWeight:600 }}>
            {justNew && <span style={{ color:'#E11D54', marginRight:8 }}>NEW</span>}{featured.author || 'Гость'}
          </div>
        </div>
      ) : (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, zIndex:2, color:'rgba(255,255,255,0.4)' }}>
          <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:32, fontWeight:900 }}>Ждём первые кадры…</div>
          <div style={{ fontSize:18 }}>Сканируйте QR и снимайте — фото появятся здесь</div>
        </div>
      )}

      {photos.length > 1 && (
        <div style={{ position:'absolute', bottom:28, left:0, right:0, display:'flex', justifyContent:'center', gap:10, zIndex:3, padding:'0 32px', overflow:'hidden' }}>
          {photos.slice(0, 12).map((p, i) => (
            <img key={p.id} src={p.url} alt="" onClick={() => setIdx(i)} style={{ width:64, height:64, objectFit:'cover', borderRadius:12, cursor:'pointer', opacity: i === idx ? 1 : 0.45, border: i === idx ? '2px solid #E11D54' : '2px solid transparent', transition:'opacity .3s, border-color .3s' }}/>
          ))}
        </div>
      )}

      <style>{`
        @keyframes lvPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(.8);} }
        @keyframes lvPop { from{opacity:0;transform:scale(.85);} to{opacity:1;transform:scale(1);} }
        @keyframes lvKen { from{transform:scale(1);} to{transform:scale(1.04);} }
      `}</style>
    </main>
  )
}

export default function LivePage() {
  return <Suspense fallback={<div style={{position:'fixed',inset:0,background:'#050507'}}/>}><LiveInner/></Suspense>
}
