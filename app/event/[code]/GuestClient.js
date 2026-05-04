'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

function getDeviceId() {
  let id = localStorage.getItem('tusim_device_id')
  if (!id) { id = Math.random().toString(36).substring(2) + Date.now(); localStorage.setItem('tusim_device_id', id) }
  return id
}
function getAuthor() { return localStorage.getItem('tusim_author') || '' }
function saveAuthor(name) { localStorage.setItem('tusim_author', name) }

// ── Звук затвора (Web Audio API — без файлов) ─────────────────────────────────
function playShutter() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    const sr  = ctx.sampleRate

    function makeNoise(duration, freq, q, gainVal, attackT, decayT, startT) {
      const buf  = ctx.createBuffer(1, Math.floor(sr * duration), sr)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const src    = ctx.createBufferSource()
      const flt    = ctx.createBiquadFilter()
      const gain   = ctx.createGain()
      flt.type     = 'bandpass'
      flt.frequency.value = freq
      flt.Q.value  = q
      src.buffer   = buf
      src.connect(flt); flt.connect(gain); gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, startT)
      gain.gain.linearRampToValueAtTime(gainVal, startT + attackT)
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + attackT + decayT)
      src.start(startT); src.stop(startT + duration)
    }

    // ── Звук открытия затвора (первый щелчок) ──
    // Широкополосный удар
    makeNoise(0.06, 4000, 0.5, 0.35, 0.001, 0.04, now)
    // Средние частоты — тело звука
    makeNoise(0.08, 1200, 1.2, 0.25, 0.001, 0.06, now)
    // Низкий удар
    makeNoise(0.05, 300,  2.0, 0.20, 0.001, 0.04, now)

    // ── Небольшая пауза — зеркало ──
    const gap = 0.045

    // ── Звук закрытия затвора (второй щелчок, тише) ──
    makeNoise(0.05, 3500, 0.6, 0.22, 0.001, 0.035, now + gap)
    makeNoise(0.06, 1000, 1.5, 0.18, 0.001, 0.045, now + gap)
    makeNoise(0.04, 250,  2.5, 0.15, 0.001, 0.03,  now + gap)

    // ── Тихий механический хвост ──
    makeNoise(0.12, 800, 0.8, 0.06, 0.002, 0.1, now + gap + 0.03)

    setTimeout(() => ctx.close(), 400)
  } catch {}
}

// ── Конфетти ─────────────────────────────────────────────────────────────────
function Confetti({ onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#C3073F', '#950740', '#F59E0B', '#22C55E', '#3B82F6', '#F0F0F0', '#6F2232']
    const particles = Array.from({ length: 120 }, () => ({
      x:    Math.random() * canvas.width,
      y:    -10 - Math.random() * 40,
      vx:   (Math.random() - 0.5) * 4,
      vy:   2 + Math.random() * 4,
      size: 5 + Math.random() * 8,
      rot:  Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      alpha: 1,
    }))

    let frame, done = false
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = 0
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        p.rot += p.rotV; p.vy += 0.08
        if (p.y > canvas.height - 50) p.alpha -= 0.04
        p.alpha = Math.max(0, p.alpha)
        if (p.alpha > 0) alive++
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot * Math.PI / 180)
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

// ── Таймер ────────────────────────────────────────────────────────────────────
function useTimer(event) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const startsAt = event.starts_at ? new Date(event.starts_at).getTime() : null
  const endsAt   = event.ends_at   ? new Date(event.ends_at).getTime()   : null
  if (event.status === 'closed') return { phase:'closed',  label:'Съёмка завершена', color:'#3a3a3a', ms:0 }
  if (startsAt && now < startsAt)  return { phase:'before',  label:'До начала',       color:'#3B82F6', ms: startsAt-now }
  if (endsAt) {
    const ms = endsAt - now
    if (ms <= 0)          return { phase:'closed',  label:'Завершено',  color:'#3a3a3a', ms:0 }
    if (ms < 15*60*1000) return { phase:'urgent',  label:'До конца',   color:'#C3073F', ms }
    if (ms < 60*60*1000) return { phase:'warning', label:'До конца',   color:'#F59E0B', ms }
    return                       { phase:'active',  label:'До конца',   color:'#22C55E', ms }
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
  const bg = { before:'rgba(59,130,246,0.08)', active:'rgba(34,197,94,0.08)', warning:'rgba(245,158,11,0.08)', urgent:'rgba(195,7,63,0.08)', closed:'rgba(255,255,255,0.03)' }
  const br = { before:'rgba(59,130,246,0.2)', active:'rgba(34,197,94,0.2)', warning:'rgba(245,158,11,0.2)', urgent:'rgba(195,7,63,0.2)', closed:'rgba(255,255,255,0.06)' }
  return (
    <div style={{ background:bg[t.phase], border:`1px solid ${br[t.phase]}`, borderRadius:'14px', padding:'11px 16px', marginBottom:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', animation: t.phase==='urgent'?'timerUrgent 1.5s ease infinite':'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:t.color, display:'inline-block', flexShrink:0, animation: t.phase!=='closed'?'pulse 1.5s infinite':'none' }}/>
        <span style={{ fontSize:'12px', color:t.color, fontWeight:600 }}>{t.label}</span>
      </div>
      {t.ms > 0 && <span style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'15px', color:t.color, letterSpacing:'0.05em' }}>{formatMs(t.ms)}</span>}
      {t.phase === 'closed' && <span style={{ fontSize:'12px', color:'#333' }}>Спасибо!</span>}
    </div>
  )
}

// ── Онбординг ─────────────────────────────────────────────────────────────────
const ONBOARD = [
  { emoji:'📸', title:'Снимай лучшие моменты', text:'У тебя ограниченное количество кадров — используй их осознанно. Выбирай только лучшие моменты!' },
  { emoji:'❤️', title:'Голосуй за фото', text:'В разделе «Голосование» свайпай вправо если фото огонь, влево — если нет. Лучшие фото победят!' },
  { emoji:'🖼️', title:'Общий альбом', text:'Все фото попадают в один альбом в реальном времени. Смотри что снимают другие гости!' },
]

function Onboarding({ limit, onFinish }) {
  const [step, setStep] = useState(0)
  const isLast = step === ONBOARD.length - 1
  return (
    <main style={{ minHeight:'100dvh', background:'#1A1A1D', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:"'Onest',sans-serif", position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 70% 50% at 50% 30%,rgba(195,7,63,0.1) 0%,transparent 70%)' }}/>
      <div style={{ display:'flex', gap:'6px', marginBottom:'40px', position:'relative', zIndex:1 }}>
        {ONBOARD.map((_,i) => <div key={i} style={{ width:i===step?'24px':'6px', height:'6px', borderRadius:'3px', background:i===step?'#C3073F':'#2a2a2a', transition:'all 0.3s cubic-bezier(.22,1,.36,1)' }}/>)}
      </div>
      <div key={step} style={{ textAlign:'center', maxWidth:'320px', position:'relative', zIndex:1, animation:'fadeUp 0.4s cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ width:'100px', height:'100px', borderRadius:'28px', background:'rgba(195,7,63,0.08)', border:'1px solid rgba(195,7,63,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px', margin:'0 auto 28px', boxShadow:'0 0 60px rgba(195,7,63,0.12)' }}>{ONBOARD[step].emoji}</div>
        <h2 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'22px', color:'#F0F0F0', letterSpacing:'-0.5px', marginBottom:'14px', lineHeight:1.2 }}>{ONBOARD[step].title}</h2>
        <p style={{ color:'#555', fontSize:'14px', lineHeight:1.75 }}>{ONBOARD[step].text}</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px', width:'100%', maxWidth:'320px', marginTop:'44px', position:'relative', zIndex:1 }}>
        <button onClick={() => isLast ? onFinish() : setStep(s=>s+1)} style={{ width:'100%', padding:'18px', background:'linear-gradient(135deg,#C3073F,#950740)', color:'#fff', border:'none', borderRadius:'100px', fontFamily:"'Onest',sans-serif", fontWeight:700, fontSize:'16px', cursor:'pointer', boxShadow:'0 4px 24px rgba(195,7,63,0.35)', WebkitTapHighlightColor:'transparent' }}>
          {isLast ? 'Поехали! 🎉' : 'Дальше →'}
        </button>
        {!isLast && <button onClick={onFinish} style={{ background:'transparent', border:'none', color:'#2a2a2a', fontSize:'13px', cursor:'pointer', padding:'8px', fontFamily:"'Onest',sans-serif" }}>Пропустить</button>}
      </div>
      <p style={{ color:'#1e1e1e', fontSize:'11px', marginTop:'20px', position:'relative', zIndex:1 }}>У тебя {limit} кадров</p>
    </main>
  )
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#1A1A1D; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  @keyframes pulse  { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  @keyframes spin   { to{transform:rotate(360deg);} }
  @keyframes flashWhite { 0%{opacity:0;} 8%{opacity:1;} 100%{opacity:0;} }
  @keyframes photoAppear { from{opacity:0;transform:scale(0.82) rotate(-2deg);} to{opacity:1;transform:scale(1);} }
  @keyframes timerUrgent { 0%,100%{opacity:1;} 50%{opacity:0.65;} }
  @keyframes successPop {
    0%   { opacity:0; transform:scale(0.5); }
    60%  { opacity:1; transform:scale(1.15); }
    100% { opacity:1; transform:scale(1); }
  }
  @keyframes successFade {
    0%   { opacity:1; }
    70%  { opacity:1; }
    100% { opacity:0; }
  }

  .fade-up { animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
  .fade-in { animation:fadeIn 0.4s ease both; }

  .name-input {
    width:100%; padding:18px 20px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:18px; color:#F0F0F0; font-family:'Onest',sans-serif; font-size:18px;
    outline:none; text-align:center; transition:border-color 0.25s, background 0.25s;
    -webkit-appearance:none;
  }
  .name-input:focus { border-color:rgba(195,7,63,0.6); background:rgba(195,7,63,0.04); }
  .name-input::placeholder { color:#2a2a2a; }

  .confirm-btn {
    width:100%; padding:18px; background:linear-gradient(135deg,#C3073F,#950740);
    color:#fff; border:none; border-radius:100px;
    font-family:'Onest',sans-serif; font-weight:700; font-size:17px;
    cursor:pointer; transition:transform 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color:transparent;
  }
  .confirm-btn:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 8px 32px rgba(195,7,63,0.35); }
  .confirm-btn:active:not(:disabled) { transform:scale(0.97); }
  .confirm-btn:disabled { background:#1e1e1e; color:#444; cursor:not-allowed; }

  .shoot-btn {
    background:linear-gradient(135deg,#C3073F,#6F2232); color:#fff; border:none; border-radius:100px;
    font-family:'Onest',sans-serif; font-weight:700; font-size:17px;
    cursor:pointer; padding:20px 52px; transition:transform 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color:transparent; box-shadow:0 4px 24px rgba(195,7,63,0.3);
  }
  .shoot-btn:hover:not(:disabled) { transform:scale(1.04); box-shadow:0 8px 32px rgba(195,7,63,0.45); }
  .shoot-btn:active:not(:disabled) { transform:scale(0.96); }
  .shoot-btn:disabled { background:#1e1e1e; color:#444; cursor:not-allowed; box-shadow:none; }

  .cam-btn {
    width:46px; height:46px; border-radius:50%;
    background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.15);
    color:#fff; font-size:20px; display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:background 0.15s, transform 0.1s;
    -webkit-tap-highlight-color:transparent; backdrop-filter:blur(8px);
  }
  .cam-btn:active { transform:scale(0.88); }
  .cam-btn.active { background:rgba(195,7,63,0.5); border-color:rgba(195,7,63,0.7); }

  .snap-btn {
    width:76px; height:76px; border-radius:50%; background:#fff;
    border:5px solid rgba(255,255,255,0.25); outline:3px solid rgba(255,255,255,0.12);
    cursor:pointer; position:relative; transition:transform 0.1s;
    -webkit-tap-highlight-color:transparent; flex-shrink:0;
  }
  .snap-btn::after { content:''; position:absolute; inset:6px; border-radius:50%; background:linear-gradient(135deg,#C3073F,#6F2232); }
  .snap-btn:active { transform:scale(0.88); }

  .photo-wrap { position:relative; cursor:pointer; }
  .photo-thumb {
    width:100%; aspect-ratio:1; object-fit:cover; border-radius:10px; display:block;
    animation:photoAppear 0.4s cubic-bezier(.22,1,.36,1) both;
    transition:transform 0.2s, opacity 0.2s;
  }
  .photo-wrap:hover .photo-thumb { transform:scale(1.03); }
  .delete-btn {
    position:absolute; top:5px; right:5px;
    width:26px; height:26px; border-radius:50%;
    background:rgba(0,0,0,0.72); border:none; color:#fff; font-size:11px;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity 0.2s; backdrop-filter:blur(4px);
    -webkit-tap-highlight-color:transparent;
  }
  .photo-wrap:hover .delete-btn { opacity:1; }
  @media (hover:none) { .delete-btn { opacity:1; } }

  .stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:14px 10px; text-align:center; }

  /* Лайтбокс */
  .lightbox { position:fixed; inset:0; background:rgba(0,0,0,0.97); z-index:1500; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; animation:fadeIn 0.2s ease; }
  .lb-img { max-width:100%; max-height:72dvh; object-fit:contain; border-radius:14px; box-shadow:0 24px 80px rgba(0,0,0,0.8); animation:successPop 0.25s cubic-bezier(.22,1,.36,1); }
  .lb-close { position:absolute; top:max(18px,env(safe-area-inset-top,18px)); right:18px; width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .lb-nav { position:absolute; top:50%; transform:translateY(-50%); width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; }

  /* Анимация успеха после фото */
  .success-overlay { position:fixed; inset:0; z-index:2500; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; animation:successFade 1.8s ease forwards; }
`

export default function GuestClient({ event }) {
  const [photos, setPhotos]             = useState([])
  const [cameraOpen, setCameraOpen]     = useState(false)
  const [deviceId, setDeviceId]         = useState('')
  const [uploading, setUploading]       = useState(false)
  const [author, setAuthor]             = useState('')
  const [nameInput, setNameInput]       = useState('')
  const [screen, setScreen]             = useState('loading')
  const [accessDeniedReason, setAccessDeniedReason] = useState(null)
  const [totalPhotos, setTotalPhotos]   = useState(0)
  const [guestCount, setGuestCount]     = useState(0)
  const [deletingId, setDeletingId]     = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showSuccess, setShowSuccess]   = useState(false) // анимация успеха
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [lightboxIdx, setLightboxIdx]   = useState(0)

  const [facingMode, setFacingMode]         = useState('environment')
  const [flashOn, setFlashOn]               = useState(false)
  const [flashActive, setFlashActive]       = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const trackRef  = useRef(null)

  const [eventStatus, setEventStatus] = useState(event.status)
  const isClosed = eventStatus === 'closed'
  const limit    = event.photo_limit || 30

  // Realtime — следим за закрытием события из админки
  useEffect(() => {
    import('@supabase/supabase-js').then(({ createClient }) => {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const ch = sb.channel('ev-' + event.id)
        .on('postgres_changes', { event:'UPDATE', schema:'public', table:'events', filter:'id=eq.' + event.id },
          (p) => { if (p.new?.status) setEventStatus(p.new.status) })
        .subscribe()
      return () => sb.removeChannel(ch)
    })
  }, [event.id])

  useEffect(() => {
    const id = getDeviceId()
    setDeviceId(id)
    localStorage.setItem('tusim_event_id',   event.id)
    localStorage.setItem('tusim_event_code', event.code)
    localStorage.setItem('tusim_event_name', event.name)

    if (isClosed) { loadMyPhotos(id); setScreen('main'); return }

    fetch('/api/check-guest', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ event_id:event.id, device_id:id }),
    }).then(r=>r.json()).then(data => {
      if (!data.allowed) { setAccessDeniedReason(data.reason); setScreen('denied'); return }
      setGuestCount(data.guest_count||0)
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
    const name = nameInput.trim()
    if (!name) return
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

  // ── Камера ───────────────────────────────────────────────────────────────────
  async function openCamera() { setCameraOpen(true); await startStream(facingMode) }

  async function startStream(mode) {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{ facingMode:mode, width:{ideal:1920}, height:{ideal:1080} }, audio:false,
      })
      streamRef.current = stream
      const track = stream.getVideoTracks()[0]; trackRef.current = track
      setTorchSupported(!!(track.getCapabilities?.()?.torch))
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video:true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch { alert('Не удалось открыть камеру.'); setCameraOpen(false) }
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

  async function takePhoto() {
    const video = videoRef.current; if (!video) return

    // Звук затвора
    playShutter()

    // Вспышка-эффект
    setFlashActive(true); setTimeout(() => setFlashActive(false), 400)

    const maxSize = 1200
    const scale = Math.min(maxSize/video.videoWidth, maxSize/video.videoHeight, 1)
    const w = Math.round(video.videoWidth*scale), h = Math.round(video.videoHeight*scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (facingMode==='user') { ctx.translate(w,0); ctx.scale(-1,1) }
    ctx.drawImage(video, 0, 0, w, h)

    closeCamera(); setUploading(true)

    canvas.toBlob(async (blob) => {
      const form = new FormData()
      form.append('file', blob, 'photo.jpg')
      form.append('event_id', event.id)
      form.append('device_id', deviceId)
      form.append('author', author)
      const res = await fetch('/api/upload', { method:'POST', body:form })
      const { photo, error } = await res.json()

      if (photo) {
        const newPhotos = [{ ...photo, mine:true }, ...photos.filter(p=>p.mine)]
        setPhotos(prev => [{ ...photo, mine:true }, ...prev])
        setTotalPhotos(p => p+1)

        // Анимация успеха
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 1800)

        // Конфетти на последний кадр
        const newUsed = myPhotos.length + 1
        if (newUsed >= limit) {
          setTimeout(() => setShowConfetti(true), 400)
        }
      } else {
        console.error(error)
      }
      setUploading(false)
    }, 'image/jpeg', 0.82)
  }

  async function deletePhoto(photoId) {
    if (deletingId) return
    setDeletingId(photoId)
    try {
      const res = await fetch(`/api/delete-photo?photo_id=${photoId}&device_id=${deviceId}`, { method:'DELETE' })
      const data = await res.json()
      if (data.ok) { setPhotos(prev => prev.filter(p=>p.id!==photoId)); setTotalPhotos(p=>Math.max(0,p-1)) }
    } catch {}
    setDeletingId(null)
  }

  // Лайтбокс для своих фото
  function openLightbox(photo, idx) { setLightboxPhoto(photo); setLightboxIdx(idx) }
  function closeLightbox() { setLightboxPhoto(null) }
  function lbPrev(e) { e.stopPropagation(); const i=(lightboxIdx-1+myPhotos.length)%myPhotos.length; setLightboxIdx(i); setLightboxPhoto(myPhotos[i]) }
  function lbNext(e) { e.stopPropagation(); const i=(lightboxIdx+1)%myPhotos.length; setLightboxIdx(i); setLightboxPhoto(myPhotos[i]) }

  // ── Экраны ───────────────────────────────────────────────────────────────────
  if (screen === 'loading') return <><style>{STYLES}</style><div style={{ minHeight:'100dvh', background:'#1A1A1D' }}/></>

  if (screen === 'denied') return (
    <>
      <style>{STYLES}</style>
      <main style={{ minHeight:'100dvh', background:'#1A1A1D', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center', fontFamily:"'Onest',sans-serif" }}>
        <div style={{ fontSize:'64px', marginBottom:'24px' }}>{accessDeniedReason==='closed'?'🔒':'🎟️'}</div>
        <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'22px', color:'#F0F0F0', letterSpacing:'-0.5px', marginBottom:'12px' }}>
          {accessDeniedReason==='closed' ? 'Съёмка закрыта' : 'Мест нет'}
        </h1>
        <p style={{ color:'#555', fontSize:'14px', lineHeight:1.7 }}>
          {accessDeniedReason==='closed' ? 'Организатор завершил мероприятие' : 'На этом мероприятии достигнут лимит гостей'}
        </p>
      </main>
    </>
  )

  if (screen === 'name') return (
    <>
      <style>{STYLES}</style>
      <main style={{ minHeight:'100dvh', background:'#1A1A1D', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:"'Onest',sans-serif" }}>
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(195,7,63,0.1) 0%,transparent 70%)' }}/>
        <div className="fade-up" style={{ textAlign:'center', marginBottom:'44px' }}>
          <div style={{ width:'88px', height:'88px', borderRadius:'50%', background:'rgba(195,7,63,0.08)', border:'1px solid rgba(195,7,63,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', margin:'0 auto 24px' }}>👋</div>
          <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'26px', color:'#F0F0F0', letterSpacing:'-1px', marginBottom:'12px' }}>Привет!</h1>
          <p style={{ color:'#444', fontSize:'15px', lineHeight:1.7 }}>
            Ты на <span style={{ color:'#C3073F', fontWeight:600 }}>{event.name}</span><br/>Как тебя зовут?
          </p>
        </div>
        <div className="fade-up" style={{ width:'100%', maxWidth:'340px', animationDelay:'0.1s' }}>
          <input className="name-input" placeholder="Введи своё имя" value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmName()} autoFocus/>
          <div style={{ height:'14px' }}/>
          <button className="confirm-btn" onClick={confirmName} disabled={!nameInput.trim()}>Погнали снимать 📸</button>
        </div>
        <p className="fade-up" style={{ color:'#2a2a2a', fontSize:'12px', marginTop:'24px', textAlign:'center', animationDelay:'0.2s', lineHeight:1.7 }}>
          У тебя {limit} кадров · Снимай лучшие моменты
        </p>
      </main>
    </>
  )

  if (screen === 'onboard') return (
    <><style>{STYLES}</style><Onboarding limit={limit} onFinish={finishOnboarding}/></>
  )

  const isEventClosed = isClosed || accessDeniedReason === 'closed'

  return (
    <>
      <style>{STYLES}</style>

      {/* Конфетти */}
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)}/>}

      {/* Анимация успеха после съёмки */}
      {showSuccess && (
        <div className="success-overlay">
          <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'rgba(34,197,94,0.15)', border:'2px solid rgba(34,197,94,0.4)', display:'flex', alignItems:'center', justifyContent:'center', animation:'successPop 0.3s cubic-bezier(.22,1,.36,1)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}

      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, background:'radial-gradient(ellipse 70% 40% at 50% -10%,rgba(195,7,63,0.08) 0%,transparent 60%)' }}/>

      <main style={{ minHeight:'100dvh', background:'#1A1A1D', color:'#F0F0F0', fontFamily:"'Onest',sans-serif", maxWidth:'480px', margin:'0 auto', padding:'0 20px 120px', position:'relative', zIndex:1 }}>

        {/* Шапка */}
        <div className="fade-up" style={{ paddingTop:'48px', marginBottom:'24px', textAlign:'center' }}>
          <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'28px', letterSpacing:'-1.5px', marginBottom:'6px' }}>
            tusi<span style={{ color:'#C3073F' }}>'m</span>
          </h1>
          <p style={{ color:'#444', fontSize:'13px' }}>{event.name}{author && <span style={{ color:'#555' }}> · {author}</span>}</p>
        </div>

        <div className="fade-up" style={{ animationDelay:'0.05s' }}><TimerBar event={event}/></div>

        {/* Статистика */}
        <div className="fade-up" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'14px', animationDelay:'0.08s' }}>
          {[
            { val:guestCount||'—', label:'гостей' },
            { val:totalPhotos||myPhotos.length, label:'фото', red:true },
            { val:remaining, label:'твоих кадров', warn:remaining<=5 },
          ].map(({ val, label, red, warn }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize:'22px', fontFamily:"'Unbounded',sans-serif", fontWeight:900, lineHeight:1, color:warn||red?'#C3073F':'#F0F0F0' }}>{val}</div>
              <div style={{ fontSize:'10px', color:'#444', marginTop:'5px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Прогресс */}
        <div className="fade-up" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'13px 18px', marginBottom:'18px', animationDelay:'0.1s' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#444', marginBottom:'7px' }}>
            <span>Использовано: <span style={{ color:'#666' }}>{used}</span></span>
            <span>Лимит: <span style={{ color:'#666' }}>{limit}</span></span>
          </div>
          <div style={{ background:'#1a1a1a', borderRadius:'100px', height:'4px', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:'100px', background:progress>80?'linear-gradient(90deg,#950740,#C3073F)':'linear-gradient(90deg,#6F2232,#C3073F)', width:`${progress}%`, transition:'width 0.5s cubic-bezier(.22,1,.36,1)' }}/>
          </div>
        </div>

        {/* Кнопка съёмки */}
        <div className="fade-up" style={{ textAlign:'center', marginBottom:'28px', animationDelay:'0.12s' }}>
          {uploading && (
            <div style={{ marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
              <div style={{ width:'16px', height:'16px', borderRadius:'50%', border:'2px solid #C3073F', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
              <span style={{ color:'#C3073F', fontSize:'13px' }}>Загружаем фото...</span>
            </div>
          )}
          {isEventClosed ? (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px', color:'#444', fontSize:'14px', lineHeight:1.7 }}>
              Съёмка завершена 🎉<br/><span style={{ fontSize:'12px', color:'#333' }}>Спасибо за участие!</span>
            </div>
          ) : remaining > 0 ? (
            <button className="shoot-btn" onClick={openCamera} disabled={uploading}>📸 Сделать фото</button>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px', color:'#444', fontSize:'14px', lineHeight:1.7 }}>
              Лимит исчерпан — спасибо за кадры! 🎉
            </div>
          )}
        </div>

        {/* Мои фото с лайтбоксом */}
        {myPhotos.length > 0 && (
          <div className="fade-in" style={{ animationDelay:'0.15s' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'13px', color:'#444' }}>Твои фото</span>
              <span style={{ fontSize:'11px', fontWeight:600, color:'#C3073F', background:'rgba(195,7,63,0.1)', padding:'3px 10px', borderRadius:'100px' }}>{myPhotos.length} шт</span>
            </div>
            {!isEventClosed && <p style={{ fontSize:'11px', color:'#2a2a2a', marginBottom:'10px' }}>Нажми чтобы открыть · ✕ чтобы удалить</p>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
              {myPhotos.map((photo, i) => (
                <div key={photo.id||i} className="photo-wrap" style={{ opacity:deletingId===photo.id?0.4:1, transition:'opacity 0.2s', animationDelay:`${i*0.04}s` }}
                  onClick={() => openLightbox(photo, i)}>
                  <img src={photo.url} loading="lazy" className="photo-thumb"/>
                  {!isEventClosed && (
                    <button className="delete-btn" disabled={!!deletingId}
                      onClick={e => { e.stopPropagation(); if(confirm('Удалить фото? Слот освободится.')) deletePhoto(photo.id) }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {myPhotos.length === 0 && (
          <div className="fade-up" style={{ textAlign:'center', padding:'32px 0', animationDelay:'0.15s' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(195,7,63,0.06)', border:'1px solid rgba(195,7,63,0.12)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>📸</div>
            <p style={{ color:'#333', fontSize:'13px', lineHeight:1.7 }}>Поймай лучшие моменты<br/><span style={{ color:'#2a2a2a' }}>У тебя {limit} кадров</span></p>
          </div>
        )}
      </main>

      {/* Лайтбокс своих фото */}
      {lightboxPhoto && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lb-close" onClick={closeLightbox}>✕</button>
          {myPhotos.length > 1 && <>
            <button className="lb-nav" style={{ left:'12px' }} onClick={lbPrev}>‹</button>
            <button className="lb-nav" style={{ right:'12px' }} onClick={lbNext}>›</button>
          </>}
          <img key={lightboxPhoto.id} src={lightboxPhoto.url} className="lb-img" onClick={e=>e.stopPropagation()}/>
          <div style={{ marginTop:'14px', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:'12px', color:'#333' }}>{lightboxIdx+1} из {myPhotos.length}</div>
            {!isEventClosed && (
              <button onClick={() => { if(confirm('Удалить?')) { deletePhoto(lightboxPhoto.id); closeLightbox() } }}
                style={{ marginTop:'12px', background:'rgba(195,7,63,0.1)', border:'1px solid rgba(195,7,63,0.25)', color:'#C3073F', borderRadius:'8px', padding:'8px 18px', fontSize:'13px', cursor:'pointer', fontFamily:"'Onest',sans-serif" }}>
                Удалить фото
              </button>
            )}
          </div>
        </div>
      )}

      {/* Камера */}
      {cameraOpen && (
        <div style={{ position:'fixed', inset:0, background:'#000', zIndex:2000, animation:'fadeIn 0.2s ease' }}>
          {flashActive && <div style={{ position:'absolute', inset:0, background:'#fff', zIndex:10, pointerEvents:'none', animation:'flashWhite 0.4s ease forwards' }}/>}
          <video ref={videoRef} autoPlay playsInline muted style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform:facingMode==='user'?'scaleX(-1)':'none' }}/>
          <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:5, paddingTop:'max(52px,env(safe-area-inset-top,52px))', paddingLeft:'24px', paddingRight:'24px', paddingBottom:'20px', background:'linear-gradient(to bottom,rgba(0,0,0,0.65),transparent)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button className={`cam-btn ${flashOn?'active':''}`} onClick={toggleFlash} style={{ opacity:torchSupported?1:0.3 }}>⚡</button>
            <div style={{ background:'rgba(0,0,0,0.55)', borderRadius:'100px', padding:'7px 18px', fontSize:'13px', color:'#fff', fontFamily:"'Onest',sans-serif", fontWeight:600, backdropFilter:'blur(8px)' }}>{remaining} кадров</div>
            <button className="cam-btn" onClick={toggleCamera}>🔄</button>
          </div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:5, height:'160px', paddingBottom:'max(28px,env(safe-area-inset-bottom,28px))', paddingLeft:'36px', paddingRight:'36px', background:'linear-gradient(to top,rgba(0,0,0,0.75),transparent)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={closeCamera} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', borderRadius:'100px', padding:'12px 22px', fontSize:'14px', cursor:'pointer', fontFamily:"'Onest',sans-serif", backdropFilter:'blur(8px)', WebkitTapHighlightColor:'transparent', flexShrink:0 }}>Отмена</button>
            <button className="snap-btn" onClick={takePhoto}/>
            <div style={{ width:'52px', height:'52px', flexShrink:0 }}>
              {myPhotos[0] && <img src={myPhotos[0].url} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'12px', border:'2px solid rgba(255,255,255,0.25)' }}/>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}