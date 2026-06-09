'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from '@/app/ui/Toaster'

function getDeviceId() {
  let id = localStorage.getItem('tusim_device_id')
  if (!id) { id = Math.random().toString(36).substring(2) + Date.now(); localStorage.setItem('tusim_device_id', id) }
  return id
}
function getAuthor() { return localStorage.getItem('tusim_author') || '' }
function saveAuthor(name) { localStorage.setItem('tusim_author', name) }

function playShutter() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    const sr  = ctx.sampleRate
    function makeNoise(duration, freq, q, gainVal, attackT, decayT, startT) {
      const buf  = ctx.createBuffer(1, Math.floor(sr * duration), sr)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      const flt = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      flt.type = 'bandpass'; flt.frequency.value = freq; flt.Q.value = q
      src.buffer = buf
      src.connect(flt); flt.connect(gain); gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, startT)
      gain.gain.linearRampToValueAtTime(gainVal, startT + attackT)
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + attackT + decayT)
      src.start(startT); src.stop(startT + duration)
    }
    makeNoise(0.06, 4000, 0.5, 0.35, 0.001, 0.04, now)
    makeNoise(0.08, 1200, 1.2, 0.25, 0.001, 0.06, now)
    makeNoise(0.05, 300,  2.0, 0.20, 0.001, 0.04, now)
    const gap = 0.045
    makeNoise(0.05, 3500, 0.6, 0.22, 0.001, 0.035, now + gap)
    makeNoise(0.06, 1000, 1.5, 0.18, 0.001, 0.045, now + gap)
    makeNoise(0.04, 250,  2.5, 0.15, 0.001, 0.03,  now + gap)
    makeNoise(0.12, 800,  0.8, 0.06, 0.002, 0.1,   now + gap + 0.03)
    setTimeout(() => ctx.close(), 400)
  } catch {}
}

function Confetti({ onDone }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const colors = ['#C3073F','#950740','#F59E0B','#22C55E','#3B82F6','#F0F0F0','#6F2232']
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4,
      size: 5 + Math.random() * 8, rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 'rect' : 'circle', alpha: 1,
    }))
    let frame, done = false
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = 0
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.08
        if (p.y > canvas.height - 50) p.alpha -= 0.04
        p.alpha = Math.max(0, p.alpha)
        if (p.alpha > 0) alive++
        ctx.save(); ctx.globalAlpha = p.alpha
        ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2)
        else { ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI*2); ctx.fill() }
        ctx.restore()
      })
      if (alive > 0 && !done) frame = requestAnimationFrame(animate)
      else onDone()
    }
    frame = requestAnimationFrame(animate)
    const t = setTimeout(() => { done = true }, 3500)
    return () => { cancelAnimationFrame(frame); clearTimeout(t) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:3000 }}/>
}

function useTimer(event) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const startsAt = event.starts_at ? new Date(event.starts_at).getTime() : null
  const endsAt   = event.ends_at   ? new Date(event.ends_at).getTime()   : null
  if (event.status === 'closed') return { phase:'closed', label:'Съёмка завершена', color:'rgba(255,255,255,0.2)', ms:0 }
  if (startsAt && now < startsAt)  return { phase:'before', label:'До начала', color:'#3B82F6', ms: startsAt - now }
  if (endsAt) {
    const ms = endsAt - now
    if (ms <= 0)           return { phase:'closed',  label:'Завершено',  color:'rgba(255,255,255,0.2)', ms:0 }
    if (ms < 15*60*1000)  return { phase:'urgent',  label:'До конца',   color:'#C3073F', ms }
    if (ms < 60*60*1000)  return { phase:'warning', label:'До конца',   color:'#F59E0B', ms }
    return                        { phase:'active',  label:'До конца',   color:'#22C55E', ms }
  }
  return { phase:'active', label:'Идёт съёмка', color:'#22C55E', ms:0 }
}

function formatMs(ms) {
  if (ms <= 0) return '00:00'
  const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function TimerBar({ event }) {
  const t = useTimer(event)
  return (
    <div style={{
      background: `rgba(${t.color === '#C3073F' ? '195,7,63' : t.color === '#F59E0B' ? '245,158,11' : t.color === '#3B82F6' ? '59,130,246' : t.color === '#22C55E' ? '34,197,94' : '255,255,255'},0.06)`,
      border: `1px solid rgba(${t.color === '#C3073F' ? '195,7,63' : t.color === '#F59E0B' ? '245,158,11' : t.color === '#3B82F6' ? '59,130,246' : t.color === '#22C55E' ? '34,197,94' : '255,255,255'},0.15)`,
      borderRadius:14, padding:'12px 16px', marginBottom:14,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      animation: t.phase==='urgent' ? 'timerUrgent 1.5s ease infinite' : 'none',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:t.color, display:'inline-block', flexShrink:0, animation:t.phase!=='closed'?'pulse 1.5s infinite':'none' }}/>
        <span style={{ fontSize:12, color:t.color, fontWeight:700 }}>{t.label}</span>
      </div>
      {t.ms > 0 && (
        <span style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:15, color:t.color, letterSpacing:'0.05em' }}>
          {formatMs(t.ms)}
        </span>
      )}
      {t.phase === 'closed' && <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>Спасибо!</span>}
    </div>
  )
}

const ONBOARD = [
  { emoji:'📸', title:'Снимай лучшие моменты', text:'У тебя ограниченное количество кадров — используй их осознанно. Выбирай только лучшие моменты!' },
  { emoji:'❤️', title:'Голосуй за фото', text:'В разделе «Голосование» свайпай вправо если фото огонь, влево — если нет.' },
  { emoji:'🖼️', title:'Общий альбом', text:'Все фото попадают в один альбом в реальном времени. Смотри что снимают другие гости!' },
]

function Onboarding({ limit, onFinish }) {
  const [step, setStep] = useState(0)
  const isLast = step === ONBOARD.length - 1
  return (
    <main style={{ minHeight:'100dvh', background:'transparent', isolation:'isolate', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:"'Onest',sans-serif", position:'relative', overflow:'hidden' }}><div className="ds-atmos" style={{position:'absolute',zIndex:-1}} aria-hidden="true"><div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/></div>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 70% 50% at 50% 30%,rgba(195,7,63,0.09) 0%,transparent 70%)' }}/>
      <div style={{ display:'flex', gap:6, marginBottom:40, position:'relative', zIndex:1 }}>
        {ONBOARD.map((_,i) => (
          <div key={i} style={{ width:i===step?28:7, height:7, borderRadius:4, background:i===step?'#C3073F':'rgba(255,255,255,0.1)', transition:'all 0.3s cubic-bezier(.22,1,.36,1)' }}/>
        ))}
      </div>
      <div key={step} style={{ textAlign:'center', maxWidth:320, position:'relative', zIndex:1, animation:'fadeUp 0.4s cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ width:100, height:100, borderRadius:28, background:'rgba(195,7,63,0.07)', border:'1px solid rgba(195,7,63,0.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:46, margin:'0 auto 28px', boxShadow:'0 0 60px rgba(195,7,63,0.1)' }}>
          {ONBOARD[step].emoji}
        </div>
        <h2 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:20, color:'#fff', letterSpacing:'-0.8px', marginBottom:14, lineHeight:1.2 }}>
          {ONBOARD[step].title}
        </h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, lineHeight:1.75 }}>{ONBOARD[step].text}</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:320, marginTop:44, position:'relative', zIndex:1 }}>
        <button onClick={() => isLast ? onFinish() : setStep(s => s+1)} style={{ width:'100%', padding:18, background:'linear-gradient(135deg,#C3073F,#950740)', color:'#fff', border:'none', borderRadius:100, fontFamily:"'Onest',sans-serif", fontWeight:700, fontSize:16, cursor:'pointer', boxShadow:'0 4px 24px rgba(195,7,63,0.35)', WebkitTapHighlightColor:'transparent' }}>
          {isLast ? 'Поехали! 🎉' : 'Дальше →'}
        </button>
        {!isLast && (
          <button onClick={onFinish} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.2)', fontSize:13, cursor:'pointer', padding:8, fontFamily:"'Onest',sans-serif" }}>
            Пропустить
          </button>
        )}
      </div>
      <p style={{ color:'rgba(255,255,255,0.15)', fontSize:11, marginTop:20, position:'relative', zIndex:1 }}>У тебя {limit} кадров</p>
    </main>
  )
}

export default function GuestClient({ event }) {
  const [photos, setPhotos]               = useState([])
  const [cameraOpen, setCameraOpen]       = useState(false)
  const [deviceId, setDeviceId]           = useState('')
  const [uploading, setUploading]         = useState(false)
  const [author, setAuthor]               = useState('')
  const [nameInput, setNameInput]         = useState('')
  const [screen, setScreen]               = useState('loading')
  const [accessDeniedReason, setAccessDeniedReason] = useState(null)
  const [totalPhotos, setTotalPhotos]     = useState(0)
  const [guestCount, setGuestCount]       = useState(0)
  const [deletingId, setDeletingId]       = useState(null)
  const [showConfetti, setShowConfetti]   = useState(false)
  const [showSuccess, setShowSuccess]     = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [lightboxIdx, setLightboxIdx]     = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [facingMode, setFacingMode]       = useState('environment')
  const [flashOn, setFlashOn]             = useState(false)
  const [flashActive, setFlashActive]     = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [eventStatus, setEventStatus]     = useState(event.status)
  const [reviewPhoto, setReviewPhoto]     = useState(null)
  const [gridOn, setGridOn]               = useState(false)

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const trackRef  = useRef(null)

  const isClosed = eventStatus === 'closed'
  const limit    = event.photo_limit || 30

  useEffect(() => {
    import('@supabase/supabase-js').then(({ createClient }) => {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const ch = sb.channel('ev-' + event.id)
        .on('postgres_changes', { event:'UPDATE', schema:'public', table:'events', filter:'id=eq.' + event.id },
          p => { if (p.new?.status) setEventStatus(p.new.status) })
        .subscribe()
      return () => sb.removeChannel(ch)
    })
  }, [event.id])

  useEffect(() => {
    const id = getDeviceId(); setDeviceId(id)
    localStorage.setItem('tusim_event_id',   event.id)
    localStorage.setItem('tusim_event_code', event.code)
    localStorage.setItem('tusim_event_name', event.name)

    if (isClosed) { loadMyPhotos(id); setScreen('main'); return }

    fetch('/api/check-guest', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ event_id:event.id, device_id:id }),
    }).then(r => r.json()).then(data => {
      if (!data.allowed) { setAccessDeniedReason(data.reason); setScreen('denied'); return }
      setGuestCount(data.guest_count || 0)
      const savedAuthor = getAuthor()
      if (savedAuthor) { setAuthor(savedAuthor); loadMyPhotos(id); setScreen('main') }
      else setScreen('name')
    }).catch(() => {
      const savedAuthor = getAuthor()
      if (savedAuthor) { setAuthor(savedAuthor); loadMyPhotos(id); setScreen('main') }
      else setScreen('name')
    })

    loadEventStats()
  }, [])

  async function loadMyPhotos(id) {
    const res = await fetch(`/api/my-photos?event_id=${event.id}&device_id=${id}`)
    const { photos: data } = await res.json()
    if (data) setPhotos(data.map(p => ({ ...p, mine:true })))
  }

  async function loadEventStats() {
    try {
      const res = await fetch(`/api/event-stats?event_id=${event.id}`)
      const data = await res.json()
      if (data) { setTotalPhotos(data.total_photos||0); setGuestCount(data.guest_count||0) }
    } catch {}
  }

  function confirmName() {
    const name = nameInput.trim(); if (!name) return
    saveAuthor(name); setAuthor(name)
    const seen = localStorage.getItem('tusim_onboarded')
    if (!seen) setScreen('onboard')
    else { loadMyPhotos(deviceId); setScreen('main') }
  }

  function finishOnboarding() {
    localStorage.setItem('tusim_onboarded','1')
    loadMyPhotos(deviceId); setScreen('main')
  }

  const myPhotos  = photos.filter(p => p.mine)
  const used      = myPhotos.length
  const remaining = Math.max(0, limit - used)
  const progress  = Math.min((used / limit) * 100, 100)

  async function openCamera() { setCameraOpen(true); await startStream(facingMode) }

  async function startStream(mode) {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:mode, width:{ideal:1920}, height:{ideal:1080} }, audio:false })
      streamRef.current = stream
      const track = stream.getVideoTracks()[0]; trackRef.current = track
      setTorchSupported(!!(track.getCapabilities?.()?.torch))
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video:true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch { toast('Не удалось открыть камеру', 'error'); setCameraOpen(false) }
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; trackRef.current = null
    setCameraOpen(false); setFlashActive(false)
  }

  async function toggleFlash() {
    if (!torchSupported || !trackRef.current) return
    const nf = !flashOn; setFlashOn(nf)
    try { await trackRef.current.applyConstraints({ advanced:[{ torch:nf }] }) } catch {}
  }

  async function toggleCamera() {
    const nm = facingMode==='environment' ? 'user' : 'environment'
    setFacingMode(nm); setFlashOn(false); await startStream(nm)
  }

  // Снимок: захватываем кадр и показываем экран подтверждения — кадр пока НЕ списан.
  function takePhoto() {
    const video = videoRef.current; if (!video) return
    playShutter()
    try { navigator.vibrate?.(40) } catch {}
    setFlashActive(true); setTimeout(() => setFlashActive(false), 400)
    const maxSize = 1200
    const scale = Math.min(maxSize/video.videoWidth, maxSize/video.videoHeight, 1)
    const w = Math.round(video.videoWidth*scale), h = Math.round(video.videoHeight*scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (facingMode==='user') { ctx.translate(w,0); ctx.scale(-1,1) }
    ctx.drawImage(video, 0, 0, w, h)
    if (event.plan === 'free') {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const fsz = Math.round(Math.min(w, h) * 0.05)
      ctx.font = `800 ${fsz}px Unbounded, Onest, sans-serif`
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = fsz * 0.5
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      const pad = Math.round(fsz * 0.7)
      const txt = "tusi'm"
      const tw = ctx.measureText(txt).width
      ctx.fillText(txt, w - tw - pad, h - pad)
    }
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setReviewPhoto({ url, blob })
      closeCamera()
    }, 'image/jpeg', 0.82)
  }

  // «Переснять» — выкидываем превью, снова открываем камеру. Кадр не потрачен.
  function retakePhoto() {
    if (reviewPhoto?.url) URL.revokeObjectURL(reviewPhoto.url)
    setReviewPhoto(null)
    openCamera()
  }

  // «Оставить» — оптимистично показываем фото сразу, аплоад идёт фоном.
  async function keepPhoto() {
    const rp = reviewPhoto; if (!rp) return
    try { navigator.vibrate?.(20) } catch {}
    setReviewPhoto(null)
    const tempId = 'temp-' + Date.now()
    setPhotos(prev => [{ id: tempId, url: rp.url, mine: true, _pending: true }, ...prev])
    setTotalPhotos(p => p + 1)
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1800)
    if (used + 1 >= limit) setTimeout(() => setShowConfetti(true), 400)
    try {
      const form = new FormData()
      form.append('file', rp.blob, 'photo.jpg')
      form.append('event_id', event.id)
      form.append('device_id', deviceId)
      form.append('author', author)
      const res = await fetch('/api/upload', { method:'POST', body:form })
      const data = await res.json().catch(() => ({}))
      const photo = data.photo
      if (photo) {
        setPhotos(prev => prev.map(p => p.id === tempId ? { ...photo, mine:true } : p))
        URL.revokeObjectURL(rp.url)
      } else {
        setPhotos(prev => prev.filter(p => p.id !== tempId))
        setTotalPhotos(p => Math.max(0, p - 1))
        URL.revokeObjectURL(rp.url)
        toast(data.error || 'Не удалось загрузить фото. Попробуй ещё раз.', 'error')
      }
    } catch {
      setPhotos(prev => prev.filter(p => p.id !== tempId))
      setTotalPhotos(p => Math.max(0, p - 1))
      URL.revokeObjectURL(rp.url)
      toast('Не удалось загрузить фото. Проверь интернет.', 'error')
    }
  }

  async function deletePhoto(photoId) {
    if (deletingId) return
    setDeleteConfirm(null); setDeletingId(photoId)
    try {
      const res = await fetch(`/api/delete-photo?photo_id=${photoId}&device_id=${deviceId}`, { method:'DELETE' })
      const data = await res.json()
      if (data.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        setTotalPhotos(p => Math.max(0, p-1))
        if (lightboxPhoto?.id === photoId) closeLightbox()
      }
    } catch {}
    setDeletingId(null)
  }

  function openLightbox(photo, idx) { setLightboxPhoto(photo); setLightboxIdx(idx) }
  function closeLightbox() { setLightboxPhoto(null) }
  function lbPrev(e) { e.stopPropagation(); const i=(lightboxIdx-1+myPhotos.length)%myPhotos.length; setLightboxIdx(i); setLightboxPhoto(myPhotos[i]) }
  function lbNext(e) { e.stopPropagation(); const i=(lightboxIdx+1)%myPhotos.length; setLightboxIdx(i); setLightboxPhoto(myPhotos[i]) }

  if (screen === 'loading') return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.05)', borderTopColor:'#C3073F', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  if (screen === 'denied') return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}`}</style>
      <main style={{ minHeight:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center', fontFamily:"'Onest',sans-serif" }}>
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(195,7,63,0.08) 0%,transparent 70%)' }}/>
        <div style={{ fontSize:64, marginBottom:24, animation:'fadeUp 0.4s ease both' }}>
          {accessDeniedReason==='closed' ? '🔒' : '🎟️'}
        </div>
        <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:22, color:'#fff', letterSpacing:'-0.8px', marginBottom:12, animation:'fadeUp 0.4s 0.05s ease both' }}>
          {accessDeniedReason==='closed' ? 'Съёмка закрыта' : 'Мест нет'}
        </h1>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:14, lineHeight:1.7, animation:'fadeUp 0.4s 0.1s ease both' }}>
          {accessDeniedReason==='closed' ? 'Организатор завершил мероприятие' : 'Достигнут лимит гостей'}
        </p>
      </main>
    </>
  )

  if (screen === 'name') return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes blobDrift{from{transform:translate(0,0) scale(1);}to{transform:translate(50px,70px) scale(1.12);}}
        .name-input{width:100%;padding:18px 20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;color:#F0F0F0;font-family:'Onest',sans-serif;font-size:18px;outline:none;text-align:center;transition:border-color 0.25s,background 0.25s;-webkit-appearance:none;}
        .name-input:focus{border-color:rgba(195,7,63,0.5);background:rgba(195,7,63,0.03);}
        .name-input::placeholder{color:rgba(255,255,255,0.15);}
        .confirm-btn{width:100%;padding:18px;background:linear-gradient(135deg,#C3073F,#950740);color:#fff;border:none;border-radius:100px;font-family:'Onest',sans-serif;font-weight:700;font-size:17px;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;-webkit-tap-highlight-color:transparent;box-shadow:0 4px 24px rgba(195,7,63,0.35);}
        .confirm-btn:hover:not(:disabled){transform:scale(1.02);box-shadow:0 8px 36px rgba(195,7,63,0.5);}
        .confirm-btn:disabled{background:rgba(195,7,63,0.2);color:rgba(255,255,255,0.3);cursor:not-allowed;box-shadow:none;}
      `}</style>
      <div style={{ position:'fixed', width:600, height:600, borderRadius:'50%', filter:'blur(120px)', background:'rgba(195,7,63,0.08)', top:-200, left:-150, pointerEvents:'none', animation:'blobDrift 20s ease-in-out infinite alternate' }}/>
      <main style={{ minHeight:'100dvh', background:'transparent', isolation:'isolate', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:"'Onest',sans-serif", position:'relative', zIndex:1 }}><div className="ds-atmos" style={{position:'absolute',zIndex:-1}} aria-hidden="true"><div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/></div>
        <div style={{ animation:'fadeUp 0.5s cubic-bezier(.22,1,.36,1) both', textAlign:'center', marginBottom:44 }}>
          <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:26, color:'#fff', letterSpacing:'-1.5px', marginBottom:28 }}>
            tusi<span style={{ color:'#C3073F' }}>'m</span>
          </div>
          <div style={{ width:88, height:88, borderRadius:'50%', background:'rgba(195,7,63,0.07)', border:'1px solid rgba(195,7,63,0.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 24px' }}>👋</div>
          <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:24, color:'#fff', letterSpacing:'-1px', marginBottom:12 }}>Привет!</h1>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:15, lineHeight:1.7 }}>
            Ты на <span style={{ color:'#C3073F', fontWeight:700 }}>{event.name}</span><br/>Как тебя зовут?
          </p>
        </div>
        <div style={{ width:'100%', maxWidth:340, animation:'fadeUp 0.5s 0.1s cubic-bezier(.22,1,.36,1) both' }}>
          <input className="name-input" placeholder="Введи своё имя" value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && confirmName()} autoFocus/>
          <div style={{ height:14 }}/>
          <button className="confirm-btn" onClick={confirmName} disabled={!nameInput.trim()}>
            Погнали снимать 📸
          </button>
        </div>
        <p style={{ color:'rgba(255,255,255,0.15)', fontSize:12, marginTop:24, textAlign:'center', animation:'fadeUp 0.5s 0.2s ease both', lineHeight:1.7 }}>
          У тебя {limit} кадров · Снимай лучшие моменты
        </p>
      </main>
    </>
  )

  if (screen === 'onboard') return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}`}</style>
      <Onboarding limit={limit} onFinish={finishOnboarding}/>
    </>
  )

  const isEventClosed = isClosed || accessDeniedReason === 'closed'

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn    { from{opacity:0;} to{opacity:1;} }
        @keyframes pulse     { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes spin      { to{transform:rotate(360deg);} }
        @keyframes flashWhite{ 0%{opacity:0;} 8%{opacity:1;} 100%{opacity:0;} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes photoAppear{ from{opacity:0;transform:scale(0.84);} to{opacity:1;transform:scale(1);} }
        @keyframes timerUrgent{ 0%,100%{opacity:1;} 50%{opacity:0.6;} }
        @keyframes successPop { 0%{opacity:0;transform:scale(0.5);} 60%{opacity:1;transform:scale(1.15);} 100%{opacity:1;transform:scale(1);} }
        @keyframes successFade{ 0%{opacity:1;} 70%{opacity:1;} 100%{opacity:0;} }
        @keyframes blobDrift  { from{transform:translate(0,0) scale(1);} to{transform:translate(50px,70px) scale(1.12);} }

        .guest-root { min-height:100dvh; background:#09090b; color:#F0F0F0; font-family:'Onest',sans-serif; max-width:480px; margin:0 auto; padding:0 20px 120px; position:relative; z-index:1; }

        .shoot-btn {
          background:linear-gradient(135deg,#C3073F,#6F2232); color:#fff; border:none; border-radius:100px;
          font-family:'Onest',sans-serif; font-weight:700; font-size:17px;
          cursor:pointer; padding:20px 52px; transition:transform 0.15s,box-shadow 0.15s;
          -webkit-tap-highlight-color:transparent; box-shadow:0 4px 28px rgba(195,7,63,0.35);
        }
        .shoot-btn:hover:not(:disabled){ transform:scale(1.04); box-shadow:0 8px 36px rgba(195,7,63,0.5); }
        .shoot-btn:active:not(:disabled){ transform:scale(0.96); }
        .shoot-btn:disabled{ background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.2); cursor:not-allowed; box-shadow:none; }

        .cam-btn {
          width:46px; height:46px; border-radius:50%;
          background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);
          color:#fff; font-size:20px; display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:background 0.15s,transform 0.1s;
          -webkit-tap-highlight-color:transparent; backdrop-filter:blur(8px);
        }
        .cam-btn:active{ transform:scale(0.88); }
        .cam-btn.active{ background:rgba(195,7,63,0.5); border-color:rgba(195,7,63,0.7); }

        .snap-btn {
          width:76px; height:76px; border-radius:50%; background:#fff;
          border:5px solid rgba(255,255,255,0.2); outline:3px solid rgba(255,255,255,0.1);
          cursor:pointer; position:relative; transition:transform 0.1s;
          -webkit-tap-highlight-color:transparent; flex-shrink:0;
        }
        .snap-btn::after{ content:''; position:absolute; inset:6px; border-radius:50%; background:linear-gradient(135deg,#C3073F,#6F2232); }
        .snap-btn:active{ transform:scale(0.88); }

        .stat-card {
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.06);
          border-radius:14px; padding:14px 10px; text-align:center;
          transition:border-color 0.2s;
        }
        .stat-card:hover{ border-color:rgba(195,7,63,0.15); }

        .photo-wrap{ position:relative; cursor:pointer; border-radius:10px; overflow:hidden; }
        .photo-thumb{ width:100%; aspect-ratio:1; object-fit:cover; display:block; animation:photoAppear 0.4s cubic-bezier(.22,1,.36,1) both; transition:transform 0.2s; }
        .photo-wrap:hover .photo-thumb{ transform:scale(1.04); }
        .delete-btn{ position:absolute; top:5px; right:5px; width:26px; height:26px; border-radius:50%; background:rgba(0,0,0,0.7); border:none; color:#fff; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s; backdrop-filter:blur(4px); -webkit-tap-highlight-color:transparent; }
        .photo-wrap:hover .delete-btn{ opacity:1; }
        @media(hover:none){ .delete-btn{ opacity:1; } }

        .lightbox{ position:fixed; inset:0; background:rgba(0,0,0,0.97); z-index:1500; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; animation:fadeIn 0.2s ease; }
        .lb-img{ max-width:100%; max-height:70dvh; object-fit:contain; border-radius:14px; box-shadow:0 24px 80px rgba(0,0,0,0.8); animation:successPop 0.25s cubic-bezier(.22,1,.36,1); }
        .lb-close{ position:absolute; top:max(18px,env(safe-area-inset-top,18px)); right:18px; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .lb-nav{ position:absolute; top:50%; transform:translateY(-50%); width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
      `}</style>

      {/* Блоб фон */}
      <div style={{ position:'fixed', width:600, height:600, borderRadius:'50%', filter:'blur(130px)', background:'rgba(195,7,63,0.07)', top:-200, right:-150, pointerEvents:'none', zIndex:0, animation:'blobDrift 22s ease-in-out infinite alternate' }}/>
      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', filter:'blur(120px)', background:'rgba(195,7,63,0.04)', bottom:-100, left:-100, pointerEvents:'none', zIndex:0, animation:'blobDrift 28s ease-in-out infinite alternate-reverse' }}/>

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)}/>}

      {/* Анимация успеха */}
      {showSuccess && (
        <div style={{ position:'fixed', inset:0, zIndex:2500, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', animation:'successFade 1.8s ease forwards' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'2px solid rgba(34,197,94,0.35)', display:'flex', alignItems:'center', justifyContent:'center', animation:'successPop 0.3s cubic-bezier(.22,1,.36,1)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}

      <main className="guest-root">
        {/* Шапка */}
        <div style={{ paddingTop:48, marginBottom:24, textAlign:'center', animation:'fadeUp 0.5s cubic-bezier(.22,1,.36,1) both' }}>
          <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:26, letterSpacing:'-1.5px', marginBottom:6, color:'#fff' }}>
            tusi<span style={{ color:'#C3073F' }}>'m</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, fontWeight:500 }}>
            {event.name}
            {author && <span style={{ color:'#C3073F', fontWeight:700 }}> · {author}</span>}
          </p>
        </div>

        <div style={{ animation:'fadeUp 0.5s 0.05s cubic-bezier(.22,1,.36,1) both' }}>
          <TimerBar event={{ ...event, status: eventStatus }}/>
        </div>

        {/* Статистика */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14, animation:'fadeUp 0.5s 0.08s cubic-bezier(.22,1,.36,1) both' }}>
          {[
            { val: guestCount || '—', label:'гостей' },
            { val: totalPhotos || myPhotos.length, label:'фото', red:true },
            { val: remaining, label:'твоих кадров', warn: remaining <= 5 },
          ].map(({ val, label, red, warn }) => (
            <div key={label} className="stat-card">
              <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:24, fontWeight:900, lineHeight:1, color: warn||red ? '#C3073F' : '#fff', letterSpacing:'-0.5px' }}>{val}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:6, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Остаток кадров точками */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'13px 18px', marginBottom:18, animation:'fadeUp 0.5s 0.1s cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.25)', marginBottom:10 }}>
            <span style={{ textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 }}>Кадры</span>
            <span>осталось <span style={{ color: remaining<=5 ? '#C3073F' : 'rgba(255,255,255,0.6)', fontWeight:700 }}>{remaining}</span> из {limit}</span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {Array.from({ length: limit }).map((_, i) => (
              <span key={i} style={{ width:10, height:10, borderRadius:'50%', background: i < used ? '#C3073F' : 'rgba(255,255,255,0.1)', boxShadow: i < used ? '0 0 6px rgba(195,7,63,0.5)' : 'none', transition:'background 0.3s, box-shadow 0.3s' }}/>
            ))}
          </div>
        </div>

        {/* Кнопка съёмки */}
        <div style={{ textAlign:'center', marginBottom:28, animation:'fadeUp 0.5s 0.12s cubic-bezier(.22,1,.36,1) both' }}>
          {uploading && (
            <div style={{ marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid #C3073F', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
              <span style={{ color:'#C3073F', fontSize:13 }}>Загружаем фото...</span>
            </div>
          )}
          {isEventClosed ? (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:20, color:'rgba(255,255,255,0.3)', fontSize:14, lineHeight:1.7 }}>
              Съёмка завершена 🎉<br/><span style={{ fontSize:12, color:'rgba(255,255,255,0.15)' }}>Спасибо за участие!</span>
            </div>
          ) : remaining > 0 ? (
            <button className="shoot-btn" onClick={openCamera} disabled={uploading}>📸 Сделать фото</button>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:20, color:'rgba(255,255,255,0.3)', fontSize:14, lineHeight:1.7 }}>
              Лимит исчерпан — спасибо за кадры! 🎉
            </div>
          )}
        </div>

        {/* Мои фото */}
        {myPhotos.length > 0 && (
          <div style={{ animation:'fadeIn 0.4s ease both' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:700 }}>Твои фото</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#C3073F', background:'rgba(195,7,63,0.1)', border:'1px solid rgba(195,7,63,0.2)', padding:'3px 10px', borderRadius:100 }}>{myPhotos.length} шт</span>
            </div>
            {!isEventClosed && <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', marginBottom:10 }}>Нажми чтобы открыть · ✕ чтобы удалить</p>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
              {myPhotos.map((photo, i) => (
                <div key={photo.id||i} className="photo-wrap"
                  style={{ opacity:deletingId===photo.id?0.4:1, transition:'opacity 0.2s' }}
                  onClick={() => openLightbox(photo, i)}>
                  <img src={photo.url} loading="lazy" className="photo-thumb"/>
                  {photo._pending && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', animation:'spin 0.8s linear infinite' }}/>
                    </div>
                  )}
                  {!isEventClosed && !photo._pending && (
                    <button className="delete-btn" disabled={!!deletingId}
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(photo.id) }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {myPhotos.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 0', animation:'fadeUp 0.5s 0.15s ease both' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(195,7,63,0.06)', border:'1px solid rgba(195,7,63,0.12)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>📸</div>
            <p style={{ color:'rgba(255,255,255,0.2)', fontSize:13, lineHeight:1.7 }}>
              Поймай лучшие моменты<br/>
              <span style={{ color:'rgba(255,255,255,0.12)' }}>У тебя {limit} кадров</span>
            </p>
          </div>
        )}
      </main>

      {/* Лайтбокс */}
      {lightboxPhoto && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lb-close" onClick={closeLightbox}>✕</button>
          {myPhotos.length > 1 && <>
            <button className="lb-nav" style={{ left:12 }} onClick={lbPrev}>‹</button>
            <button className="lb-nav" style={{ right:12 }} onClick={lbNext}>›</button>
          </>}
          <img key={lightboxPhoto.id} src={lightboxPhoto.url} className="lb-img" onClick={e => e.stopPropagation()}/>
          <div style={{ marginTop:14, textAlign:'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>{lightboxIdx+1} из {myPhotos.length}</div>
            {!isEventClosed && (
              <button onClick={() => setDeleteConfirm(lightboxPhoto.id)}
                style={{ marginTop:12, background:'rgba(195,7,63,0.08)', border:'1px solid rgba(195,7,63,0.22)', color:'#C3073F', borderRadius:10, padding:'8px 18px', fontSize:13, cursor:'pointer', fontFamily:"'Onest',sans-serif", fontWeight:700 }}>
                Удалить фото
              </button>
            )}
          </div>
        </div>
      )}

      {/* Диалог удаления */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1800, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 16px 32px', backdropFilter:'blur(12px)', animation:'fadeIn 0.2s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:400, background:'#111113', border:'1px solid rgba(255,255,255,0.08)', borderRadius:22, overflow:'hidden', animation:'slideUp 0.25s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ padding:'24px 24px 12px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🗑️</div>
              <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:16, color:'#fff', marginBottom:6, letterSpacing:'-0.3px' }}>Удалить фото?</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>Слот освободится — сможешь снять ещё одно</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding:16, background:'transparent', border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', fontSize:15, cursor:'pointer', fontFamily:"'Onest',sans-serif", fontWeight:600 }}>Отмена</button>
              <button onClick={() => deletePhoto(deleteConfirm)} style={{ padding:16, background:'transparent', border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', borderLeft:'1px solid rgba(255,255,255,0.06)', color:'#C3073F', fontSize:15, cursor:'pointer', fontFamily:"'Onest',sans-serif", fontWeight:700 }}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {/* Экран подтверждения кадра — до списания */}
      {reviewPhoto && (
        <div style={{ position:'fixed', inset:0, background:'#000', zIndex:2100, animation:'fadeIn 0.2s ease' }}>
          <img src={reviewPhoto.url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
          <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:5, paddingTop:'max(52px,env(safe-area-inset-top,52px))', paddingLeft:24, paddingRight:24, paddingBottom:28, background:'linear-gradient(to bottom,rgba(0,0,0,0.75),transparent)', textAlign:'center' }}>
            <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:20, color:'#fff', letterSpacing:'-0.5px' }}>Оставить кадр?</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:5 }}>
              Останется <span style={{ color:'#fff', fontWeight:700 }}>{Math.max(0, remaining-1)}</span> из {limit} · выбирай лучшее
            </div>
          </div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:5, paddingBottom:'max(32px,env(safe-area-inset-bottom,32px))', paddingLeft:24, paddingRight:24, paddingTop:48, background:'linear-gradient(to top,rgba(0,0,0,0.85),transparent)', display:'flex', flexDirection:'column', gap:12 }}>
            <button className="shoot-btn" style={{ width:'100%' }} onClick={keepPhoto}>✓ Оставить</button>
            <button onClick={retakePhoto} style={{ width:'100%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', borderRadius:100, padding:16, fontSize:15, fontWeight:600, fontFamily:"'Onest',sans-serif", cursor:'pointer', backdropFilter:'blur(8px)', WebkitTapHighlightColor:'transparent' }}>↻ Переснять</button>
          </div>
        </div>
      )}

      {/* Камера */}
      {cameraOpen && (
        <div style={{ position:'fixed', inset:0, background:'#000', zIndex:2000, animation:'fadeIn 0.2s ease' }}>
          {flashActive && <div style={{ position:'absolute', inset:0, background:'#fff', zIndex:10, pointerEvents:'none', animation:'flashWhite 0.4s ease forwards' }}/>}
          <video ref={videoRef} autoPlay playsInline muted style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform:facingMode==='user'?'scaleX(-1)':'none' }}/>
          {gridOn && (
            <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none' }}>
              <div style={{ position:'absolute', left:'33.33%', top:0, bottom:0, width:1, background:'rgba(255,255,255,0.22)' }}/>
              <div style={{ position:'absolute', left:'66.66%', top:0, bottom:0, width:1, background:'rgba(255,255,255,0.22)' }}/>
              <div style={{ position:'absolute', top:'33.33%', left:0, right:0, height:1, background:'rgba(255,255,255,0.22)' }}/>
              <div style={{ position:'absolute', top:'66.66%', left:0, right:0, height:1, background:'rgba(255,255,255,0.22)' }}/>
            </div>
          )}
          <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:5, paddingTop:'max(52px,env(safe-area-inset-top,52px))', paddingLeft:24, paddingRight:24, paddingBottom:20, background:'linear-gradient(to bottom,rgba(0,0,0,0.7),transparent)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:10 }}>
              <button className={`cam-btn${flashOn?' active':''}`} onClick={toggleFlash} style={{ opacity:torchSupported?1:0.3 }}>⚡</button>
              <button className={`cam-btn${gridOn?' active':''}`} onClick={() => setGridOn(g => !g)}>▦</button>
            </div>
            <div style={{ background:'rgba(0,0,0,0.6)', borderRadius:100, padding:'7px 18px', fontSize:13, color:'#fff', fontFamily:"'Unbounded',sans-serif", fontWeight:900, backdropFilter:'blur(8px)', letterSpacing:'-0.3px' }}>
              {remaining} кадров
            </div>
            <button className="cam-btn" onClick={toggleCamera}>🔄</button>
          </div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:5, height:160, paddingBottom:'max(28px,env(safe-area-inset-bottom,28px))', paddingLeft:36, paddingRight:36, background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={closeCamera} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', borderRadius:100, padding:'12px 22px', fontSize:14, cursor:'pointer', fontFamily:"'Onest',sans-serif", fontWeight:600, backdropFilter:'blur(8px)', WebkitTapHighlightColor:'transparent', flexShrink:0 }}>
              Отмена
            </button>
            <button className="snap-btn" onClick={takePhoto}/>
            <div style={{ width:52, height:52, flexShrink:0 }}>
              {myPhotos[0] && <img src={myPhotos[0].url} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12, border:'2px solid rgba(255,255,255,0.2)' }}/>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}