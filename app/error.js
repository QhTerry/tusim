'use client'
import Illustration from './ui/Illustration'

export default function Error({ error, reset }) {
  return (
    <main style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 24px', position:'relative', isolation:'isolate' }}>
      <div className="ds-atmos" style={{ position:'absolute', zIndex:-1 }} aria-hidden="true">
        <div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/>
      </div>
      <Illustration name="denied" size={140} />
      <h1 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(24px,5vw,36px)', fontWeight:900, letterSpacing:'-1px', margin:'16px 0 8px' }}>Что-то пошло не так</h1>
      <p style={{ color:'var(--text-3)', fontSize:15, marginBottom:28, maxWidth:420 }}>Мы уже в курсе. Попробуй обновить — обычно помогает.</p>
      <button className="ds-btn ds-btn-gradient ds-btn-lg" onClick={() => reset()}>Обновить</button>
    </main>
  )
}
