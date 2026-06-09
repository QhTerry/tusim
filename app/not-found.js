import Link from 'next/link'
import Illustration from './ui/Illustration'

export const metadata = { title: "Не найдено · tusi'm" }

export default function NotFound() {
  return (
    <main style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 24px', position:'relative', isolation:'isolate' }}>
      <div className="ds-atmos" style={{ position:'absolute', zIndex:-1 }} aria-hidden="true">
        <div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/>
      </div>
      <Illustration name="search" size={150} />
      <h1 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(28px,6vw,44px)', fontWeight:900, letterSpacing:'-1.5px', margin:'16px 0 8px' }}>404</h1>
      <p style={{ color:'var(--text-3)', fontSize:15, marginBottom:28 }}>Такой страницы нет. Возможно, событие завершилось.</p>
      <Link href="/" className="ds-btn ds-btn-gradient ds-btn-lg">На главную</Link>
    </main>
  )
}
