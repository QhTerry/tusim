'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from '@/app/ui/Toaster'
import Icon from '@/app/ui/Icon'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function useCountdown(endsAt) {
  const [ms, setMs] = useState(0)
  useEffect(() => {
    if (!endsAt) return
    const tick = () => setMs(Math.max(0, new Date(endsAt) - Date.now()))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [endsAt])
  return ms
}

function formatMs(ms) {
  if (ms <= 0) return 'завершено'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function QRBlock({ url }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(url)}`
  const [copied, setCopied] = useState(false)
  function copy() { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  function dl() {
    fetch(qrUrl).then(r => r.blob()).then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = 'tusim-qr.png'; a.click()
    })
  }
  return (
    <div style={{ display:'flex', gap:'28px', alignItems:'flex-start', flexWrap:'wrap' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'14px', flexShrink:0, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
        <img src={qrUrl} width={150} height={150} alt="QR" style={{ display:'block' }}/>
      </div>
      <div style={{ flex:1, minWidth:'200px' }}>
        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginBottom:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px' }}>Ссылка для гостей</div>
        <div style={{ fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.4)', wordBreak:'break-all', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'12px 14px', marginBottom:'14px', lineHeight:1.6 }}>{url}</div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <button className="ev-btn-primary" onClick={copy} style={{ fontSize:'13px', padding:'10px 18px' }}>
            {copied ? <><Icon name="check" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Скопировано</> : <><Icon name="copy" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Копировать</>}
          </button>
          <button className="ev-btn-secondary" onClick={dl}><Icon name="download" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Скачать QR</button>
        </div>
      </div>
    </div>
  )
}

export default function EventManage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id

  const [event, setEvent] = useState(null)
  const [photos, setPhotos] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [closing, setClosing] = useState(false)
  const [extending, setExtending] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const ms = useCountdown(event?.ends_at)
  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://tusim.vercel.app'
  const eventUrl = event ? `${domain}/event/${event.code}` : ''
  const guestCount = new Set(photos.map(p => p.device_id)).size
  const isClosed = event?.status === 'closed'
  const pct = event?.guest_limit ? Math.min(100, Math.round(guestCount / event.guest_limit * 100)) : 0

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? loadEvent() : router.replace('/organizer'))
      .catch(() => router.replace('/organizer'))
  }, [eventId])

  useEffect(() => {
    if (!event) return
    loadPhotos()
    const ch = supabase.channel(`ev-manage-${event.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'photos', filter:`event_id=eq.${event.id}` },
        p => setPhotos(prev => [p.new, ...prev]))
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'photos', filter:`event_id=eq.${event.id}` },
        p => setPhotos(prev => prev.filter(ph => ph.id !== p.old.id)))
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'events', filter:`id=eq.${event.id}` },
        p => setEvent(prev => ({ ...prev, ...p.new })))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [event?.id])

  async function loadEvent() {
    const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
    if (data) setEvent(data)
    setLoading(false)
  }

  async function loadPhotos() {
    const { data } = await supabase.from('photos').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    if (data) setPhotos(data)
  }

  async function eventAction(payload) {
    const res = await fetch('/api/organizer/event-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, ...payload }),
    })
    if (res.status === 401) { router.replace('/organizer'); return { ok: false } }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { toast(data.error || 'Не удалось выполнить действие', 'error'); return { ok: false } }
    return { ok: true, ...data }
  }

  async function closeEvent() {
    if (closing) return
    setClosing(true)
    const r = await eventAction({ action: 'close' })
    if (r.ok) { setEvent(prev => ({ ...prev, status: 'closed' })); toast('Событие закрыто', 'success') }
    setClosing(false)
  }

  async function reopenEvent(extraMinutes = 120) {
    const r = await eventAction({ action: 'reopen', extra_minutes: extraMinutes })
    if (r.ok) { setEvent(prev => ({ ...prev, status: 'active', ends_at: r.ends_at })); toast('Событие продлено', 'success') }
  }

  async function deletePhoto(photoId) {
    if (!window.confirm('Удалить это фото? Действие необратимо.')) return
    const r = await eventAction({ action: 'delete_photo', photo_id: photoId })
    if (!r.ok) return
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (lightbox?.id === photoId) setLightbox(null)
    toast('Фото удалено', 'success')
  }

  async function downloadZip() {
    if (zipping) return
    setZipping(true)
    toast('Готовлю архив…', 'info')
    try {
      const res = await fetch(`/api/organizer/download-zip?event_id=${eventId}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast(e.error || 'Не удалось скачать архив', 'error')
      } else {
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `tusim_${event?.code || 'event'}.zip`
        a.click()
        URL.revokeObjectURL(a.href)
        toast('Архив скачан', 'success')
      }
    } catch { toast('Сеть недоступна', 'error') }
    setZipping(false)
  }

  async function deleteEvent() {
    if (deleting) return
    if (!window.confirm('Удалить событие и ВСЕ фото навсегда? Это необратимо.')) return
    setDeleting(true)
    const r = await eventAction({ action: 'delete_event' })
    if (r.ok) { toast('Событие удалено', 'success'); router.push('/organizer/dashboard') }
    else setDeleting(false)
  }

  const timerColor = isClosed ? 'rgba(255,255,255,0.2)' : ms < 15*60*1000 ? '#C3073F' : ms < 60*60*1000 ? '#F59E0B' : '#22c55e'

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#09090b', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.05)', borderTopColor:'#C3073F', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight:'100vh', background:'#09090b', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, fontFamily:'Onest,sans-serif', color:'rgba(255,255,255,0.3)' }}>
      <div style={{ fontSize:40 }}>😕</div>
      <div>Событие не найдено</div>
      <button onClick={() => router.push('/organizer/dashboard')} style={{ marginTop:8, background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', borderRadius:10, padding:'8px 16px', cursor:'pointer', fontFamily:'Onest,sans-serif' }}>← Дашборд</button>
    </div>
  )

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ev-root {
          min-height: 100vh; min-height: 100dvh;
          background: #09090b; font-family: 'Onest', sans-serif;
          color: #F0F0F0; position: relative; overflow-x: hidden;
        }

        .ev-blob {
          position: fixed; border-radius: 50%;
          filter: blur(120px); pointer-events: none; z-index: 0;
        }
        .ev-blob-1 {
          width: 600px; height: 600px; background: rgba(195,7,63,0.07);
          top: -200px; left: -150px;
          animation: blobDrift 22s ease-in-out infinite alternate;
        }
        .ev-blob-2 {
          width: 400px; height: 400px; background: rgba(195,7,63,0.04);
          bottom: -100px; right: -100px;
          animation: blobDrift 28s ease-in-out infinite alternate-reverse;
        }
        @keyframes blobDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(50px,70px) scale(1.12); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; } to { opacity:1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ev-header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(9,9,11,0.88);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 0 24px; height: 62px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .ev-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .ev-back {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.4); font-size: 18px; cursor: pointer;
          flex-shrink: 0; transition: all 0.15s; padding: 6px 10px;
          border-radius: 10px;
        }
        .ev-back:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .ev-event-name {
          font-family: 'Unbounded', sans-serif; font-weight: 900; font-size: 15px;
          color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          letter-spacing: -0.5px;
        }
        .ev-status-badge {
          padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700;
          white-space: nowrap; flex-shrink: 0; letter-spacing: 0.3px;
        }
        .ev-status-badge.active { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .ev-status-badge.closed { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.07); }

        /* Табы */
        .ev-tabs {
          display: flex; gap: 2px; padding: 0 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(9,9,11,0.7); overflow-x: auto;
          position: sticky; top: 62px; z-index: 99;
          backdrop-filter: blur(20px);
        }
        .ev-tabs::-webkit-scrollbar { display: none; }
        .ev-tab {
          padding: 14px 18px; background: none; border: none;
          border-bottom: 2px solid transparent; color: rgba(255,255,255,0.3);
          font-size: 13px; font-weight: 600; font-family: 'Onest', sans-serif;
          cursor: pointer; white-space: nowrap; transition: all 0.15s;
        }
        .ev-tab:hover { color: rgba(255,255,255,0.7); }
        .ev-tab.active { color: #fff; border-bottom-color: #C3073F; }

        .ev-body {
          max-width: 880px; margin: 0 auto;
          padding: 32px 24px 120px;
          position: relative; z-index: 1;
        }

        /* Карточки статы */
        .ev-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-bottom: 24px;
          animation: fadeUp 0.4s cubic-bezier(.22,1,.36,1) both;
        }
        @media(max-width:600px) { .ev-stats { grid-template-columns: repeat(2,1fr); } }

        .ev-stat {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 18px 16px;
          transition: border-color 0.2s;
        }
        .ev-stat:hover { border-color: rgba(195,7,63,0.2); }
        .ev-stat-val {
          font-family: 'Unbounded', sans-serif; font-size: 24px;
          font-weight: 900; color: #fff; letter-spacing: -1px;
          display: block; margin-bottom: 5px; line-height: 1;
        }
        .ev-stat-label {
          font-size: 10px; color: rgba(255,255,255,0.3);
          text-transform: uppercase; letter-spacing: 1px; font-weight: 700;
        }

        /* Прогресс бар */
        .ev-progress-block {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 20px 22px; margin-bottom: 24px;
          animation: fadeUp 0.4s 0.04s cubic-bezier(.22,1,.36,1) both;
        }
        .ev-prog-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .ev-prog-label { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 600; }
        .ev-prog-val { font-size: 13px; color: #fff; font-weight: 700; }
        .ev-bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.05); overflow: hidden; }
        .ev-bar-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, #6F2232, #C3073F);
          transition: width 0.6s cubic-bezier(.22,1,.36,1);
        }

        /* Быстрые действия */
        .ev-actions {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 32px;
          animation: fadeUp 0.4s 0.06s cubic-bezier(.22,1,.36,1) both;
        }
        .ev-btn-primary {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 18px; background: #C3073F; border: none;
          border-radius: 10px; color: #fff; font-size: 13px; font-weight: 700;
          font-family: 'Onest', sans-serif; cursor: pointer;
          box-shadow: 0 2px 12px rgba(195,7,63,0.3);
          transition: all 0.15s;
        }
        .ev-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(195,7,63,0.45); }
        .ev-btn-secondary {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 18px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
          color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 600;
          font-family: 'Onest', sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .ev-btn-secondary:hover { color: #fff; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); }
        .ev-btn-danger {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 18px; background: rgba(195,7,63,0.08);
          border: 1px solid rgba(195,7,63,0.2); border-radius: 10px;
          color: #C3073F; font-size: 13px; font-weight: 700;
          font-family: 'Onest', sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .ev-btn-danger:hover { background: rgba(195,7,63,0.15); border-color: rgba(195,7,63,0.35); }

        /* Секция заголовок */
        .ev-section-title {
          font-family: 'Unbounded', sans-serif; font-size: 13px;
          font-weight: 900; color: #fff; margin-bottom: 16px; letter-spacing: -0.3px;
        }

        /* Фото сетка */
        .ev-photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
          animation: fadeIn 0.3s ease both;
        }
        .ev-photo {
          aspect-ratio: 1; border-radius: 12px; overflow: hidden;
          position: relative; cursor: pointer; background: rgba(255,255,255,0.03);
          transition: transform 0.2s;
        }
        .ev-photo:hover { transform: scale(1.03); }
        .ev-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ev-photo-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(transparent 50%, rgba(0,0,0,0.75));
          opacity: 0; transition: opacity 0.2s;
          display: flex; align-items: flex-end; padding: 8px;
        }
        .ev-photo:hover .ev-photo-overlay { opacity: 1; }
        .ev-photo-author { font-size: 10px; color: #fff; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .ev-photo-del {
          position: absolute; top: 5px; right: 5px;
          width: 26px; height: 26px; border-radius: 50%;
          background: rgba(195,7,63,0.9); border: none;
          color: #fff; font-size: 11px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .ev-photo:hover .ev-photo-del { opacity: 1; }
        @media(hover:none) { .ev-photo-del { opacity: 1; } }

        /* QR блок */
        .ev-qr-block {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 28px;
          animation: fadeUp 0.4s cubic-bezier(.22,1,.36,1) both;
        }

        /* Статистика */
        .ev-top-list { display: flex; flex-direction: column; }
        .ev-top-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .ev-top-row:last-child { border-bottom: none; }

        /* Настройки */
        .ev-setting-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; gap: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; margin-bottom: 10px;
          transition: border-color 0.2s;
        }
        .ev-setting-row:hover { border-color: rgba(255,255,255,0.1); }
        .ev-setting-name { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 3px; }
        .ev-setting-sub { font-size: 12px; color: rgba(255,255,255,0.3); }
        .ev-toggle {
          width: 46px; height: 26px; border-radius: 13px; border: none;
          cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0;
        }
        .ev-toggle.on { background: #C3073F; }
        .ev-toggle.off { background: rgba(255,255,255,0.1); }
        .ev-toggle::after {
          content: ''; position: absolute; width: 20px; height: 20px;
          border-radius: 50%; background: #fff; top: 3px; transition: left 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .ev-toggle.on::after { left: 23px; }
        .ev-toggle.off::after { left: 3px; }

        /* Лайтбокс */
        .ev-lightbox {
          position: fixed; inset: 0; background: rgba(0,0,0,0.96);
          z-index: 2000; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 24px;
          animation: fadeIn 0.18s ease;
        }
        .ev-lb-close {
          position: absolute; top: 18px; right: 18px;
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          color: #fff; font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .ev-lb-close:hover { background: rgba(255,255,255,0.14); }
      `}</style>

      <div className="ds-atmos" aria-hidden="true">
        <div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/><div className="ds-grain"/>
      </div>

      <div className="ev-root">
        {/* Хедер */}
        <header className="ev-header">
          <div className="ev-header-left">
            <button className="ev-back" onClick={() => router.push('/organizer/dashboard')}>←</button>
            <span className="ev-event-name">{event.name}</span>
            <span className={`ev-status-badge ${event.status}`}>
              {isClosed ? 'Закрыто' : '● Активно'}
            </span>
          </div>
          <span style={{
            fontFamily: "'Unbounded',sans-serif", fontWeight: 900, fontSize: 14,
            color: timerColor, letterSpacing: '-0.5px', flexShrink: 0,
          }}>
            {isClosed ? '—' : formatMs(ms)}
          </span>
        </header>

        {/* Табы */}
        <div className="ev-tabs">
          {[
            { id:'overview', icon:'grid',     label:'Обзор' },
            { id:'photos',   icon:'images',   label:`Фото (${photos.length})` },
            { id:'qr',       icon:'qr',       label:'QR-код' },
            { id:'stats',    icon:'sparkles', label:'Статистика' },
            { id:'settings', icon:'settings', label:'Настройки' },
          ].map(t => (
            <button key={t.id} className={`ev-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={14} style={{verticalAlign:'-3px',marginRight:6}}/>{t.label}
            </button>
          ))}
        </div>

        <div className="ev-body">

          {/* ОБЗОР */}
          {tab === 'overview' && (
            <>
              <div className="ev-stats">
                {[
                  { val: guestCount, label: 'Гостей' },
                  { val: photos.length, label: 'Фото' },
                  { val: guestCount ? Math.round(photos.length / guestCount) : 0, label: 'Фото/гость' },
                  { val: event.plan || '—', label: 'Тариф' },
                ].map((s, i) => (
                  <div key={i} className="ev-stat" style={{ animationDelay:`${i*0.03}s` }}>
                    <span className="ev-stat-val" style={typeof s.val === 'string' ? {fontSize:14,marginTop:4} : {}}>{s.val}</span>
                    <span className="ev-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {event.guest_limit && (
                <div className="ev-progress-block">
                  <div className="ev-prog-head">
                    <span className="ev-prog-label">Заполненность</span>
                    <span className="ev-prog-val">{guestCount} / {event.guest_limit} гостей · {pct}%</span>
                  </div>
                  <div className="ev-bar">
                    <div className="ev-bar-fill" style={{ width:`${pct}%` }}/>
                  </div>
                </div>
              )}

              <div className="ev-actions">
                <button className="ev-btn-primary" onClick={() => setTab('qr')}><Icon name="qr" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>QR-код</button>
                <a href={`/album?event_id=${event.id}`} target="_blank" style={{textDecoration:'none'}}>
                  <button className="ev-btn-secondary"><Icon name="images" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Альбом</button>
                </a>
                {isClosed ? (
                  <button className="ev-btn-secondary" onClick={() => reopenEvent(120)}><Icon name="play" size={14} style={{verticalAlign:'-2px',marginRight:5}}/>Открыть +2ч</button>
                ) : (
                  <>
                    <button className="ev-btn-secondary" onClick={() => reopenEvent(30)}>+30м</button>
                    <button className="ev-btn-secondary" onClick={() => reopenEvent(60)}>+1ч</button>
                    <button className="ev-btn-secondary" onClick={() => reopenEvent(120)}>+2ч</button>
                    <button className="ev-btn-danger" onClick={closeEvent} disabled={closing}>
                      {closing ? '...' : <><Icon name="stop" size={14} style={{verticalAlign:'-2px',marginRight:5}}/>Закрыть</>}
                    </button>
                  </>
                )}
              </div>

              {photos.length > 0 && (
                <>
                  <div className="ev-section-title">Последние фото</div>
                  <div className="ev-photos-grid">
                    {photos.slice(0, 12).map(p => (
                      <div key={p.id} className="ev-photo" onClick={() => setLightbox(p)}>
                        <img src={p.url} alt="" loading="lazy"/>
                        <div className="ev-photo-overlay">
                          <span className="ev-photo-author">{p.author || 'Гость'}</span>
                        </div>
                        <button className="ev-photo-del" onClick={e => { e.stopPropagation(); deletePhoto(p.id) }}><Icon name="x" size={13} stroke={2.4}/></button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {photos.length === 0 && (
                <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.2)', fontSize:14 }}>
                  <div style={{ marginBottom:14, color:'var(--text-4)' }}><Icon name="camera" size={42} stroke={1.5}/></div>
                  Пока нет фото — жди гостей
                </div>
              )}
            </>
          )}

          {/* ФОТО */}
          {tab === 'photos' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)' }}>
                  {photos.length} фото от {guestCount} гостей
                </div>
                <button className="ev-btn-secondary" onClick={downloadZip} disabled={zipping}>{zipping ? 'Архив…' : <><Icon name="download" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Скачать ZIP</>}</button>
              </div>

              {photos.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.2)', fontSize:14 }}>
                  <div style={{ marginBottom:14, color:'var(--text-4)' }}><Icon name="camera" size={42} stroke={1.5}/></div>
                  Пока нет фото
                </div>
              ) : (
                <div className="ev-photos-grid">
                  {photos.map(p => (
                    <div key={p.id} className="ev-photo" onClick={() => setLightbox(p)}>
                      <img src={p.url} alt="" loading="lazy"/>
                      <div className="ev-photo-overlay">
                        <span className="ev-photo-author">{p.author || 'Гость'}</span>
                        {p.votes > 0 && <span style={{ fontSize:10, color:'#C3073F', fontWeight:700, marginLeft:'auto' }}><Icon name="heart" size={11} stroke={2.2} style={{verticalAlign:'-1px',marginRight:2}}/>{p.votes}</span>}
                      </div>
                      <button className="ev-photo-del" onClick={e => { e.stopPropagation(); deletePhoto(p.id) }}><Icon name="x" size={13} stroke={2.4}/></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* QR */}
          {tab === 'qr' && (
            <div className="ev-qr-block">
              <div className="ev-section-title" style={{ marginBottom:8 }}>QR-код события</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', marginBottom:24 }}>
                Распечатай и размести на мероприятии
              </div>
              <QRBlock url={eventUrl}/>
              <div style={{ marginTop:24, padding:'16px 18px', background:'rgba(195,7,63,0.06)', border:'1px solid rgba(195,7,63,0.15)', borderRadius:12 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Код события</div>
                <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:900, color:'#C3073F', letterSpacing:'3px' }}>{event.code}</div>
              </div>
            </div>
          )}

          {/* СТАТИСТИКА */}
          {tab === 'stats' && (
            <div style={{ maxWidth:520, display:'flex', flexDirection:'column', gap:16, animation:'fadeUp 0.4s ease both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {[['images',photos.length,'Фото'],['users',guestCount,'Гостей'],['heart',photos.reduce((s,p)=>s+(p.votes||0),0),'Лайков']].map(([e,v,l]) => (
                  <div key={l} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:18, textAlign:'center' }}>
                    <div style={{ marginBottom:8, color:'var(--red)', display:'flex', justifyContent:'center' }}><Icon name={e} size={24}/></div>
                    <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:26, color:'#F0F0F0', letterSpacing:'-1px', lineHeight:1 }}>{v}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:6, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>{l}</div>
                  </div>
                ))}
              </div>

              {photos.length > 0 && (
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:20 }}>
                  <div className="ev-section-title">Топ фотографов</div>
                  <div className="ev-top-list">
                    {Object.entries(
                      photos.reduce((acc,p) => { const k=p.author||'Гость'; acc[k]=(acc[k]||0)+1; return acc }, {})
                    ).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count],i) => (
                      <div key={name} className="ev-top-row">
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)', width:20, fontWeight:700 }}>#{i+1}</span>
                          <span style={{ fontSize:14, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>{name}</span>
                        </div>
                        <span style={{ fontSize:13, color:'#C3073F', fontWeight:900, fontFamily:"'Unbounded',sans-serif" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* НАСТРОЙКИ */}
          {tab === 'settings' && (
            <div style={{ maxWidth:520, animation:'fadeUp 0.4s ease both' }}>
              <div style={{ marginBottom:24 }}>
                <div className="ev-section-title">Продлить событие</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[30,60,120].map(m => (
                    <button key={m} className="ev-btn-secondary" onClick={() => reopenEvent(m)}>
                      +{m < 60 ? m+'мин' : m/60+'ч'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:24 }}>
                <div className="ev-section-title">Управление</div>
                {[
                  { name:'Приём фото', sub:'Гости могут загружать фото', on:!isClosed },
                  { name:'Новые гости', sub:'Разрешить новым гостям входить', on:!isClosed },
                  { name:'Реакции', sub:'Гости могут ставить реакции', on:true },
                ].map((s,i) => (
                  <div key={i} className="ev-setting-row">
                    <div>
                      <div className="ev-setting-name">{s.name}</div>
                      <div className="ev-setting-sub">{s.sub}</div>
                    </div>
                    <button className={`ev-toggle ${s.on?'on':'off'}`}/>
                  </div>
                ))}
              </div>

              <div>
                <div className="ev-section-title" style={{ color:'#C3073F' }}>Опасная зона</div>
                {isClosed ? (
                  <button className="ev-btn-secondary" onClick={() => reopenEvent(120)} style={{ width:'100%', justifyContent:'center', padding:'14px' }}>
                    <Icon name="play" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Возобновить съёмку (+2 часа)
                  </button>
                ) : (
                  <button className="ev-btn-danger" onClick={closeEvent} disabled={closing} style={{ width:'100%', justifyContent:'center', padding:'14px' }}>
                    {closing ? 'Закрываем...' : <><Icon name="stop" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Закрыть съёмку навсегда</>}
                  </button>
                )}
                <button className="ev-btn-secondary" onClick={deleteEvent} disabled={deleting} style={{ width:'100%', justifyContent:'center', padding:'14px', marginTop:10, color:'#ef4444', borderColor:'rgba(239,68,68,0.3)' }}>
                  {deleting ? 'Удаляем...' : <><Icon name="trash" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Удалить событие и все фото</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Лайтбокс */}
      {lightbox && (
        <div className="ev-lightbox" onClick={() => setLightbox(null)}>
          <button className="ev-lb-close" onClick={() => setLightbox(null)}><Icon name="x" size={18} stroke={2.2}/></button>
          <img src={lightbox.url} onClick={e => e.stopPropagation()} style={{ maxWidth:'100%', maxHeight:'75dvh', objectFit:'contain', borderRadius:14, boxShadow:'0 24px 80px rgba(0,0,0,0.8)' }}/>
          <div style={{ marginTop:16, textAlign:'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight:700, color:'#F0F0F0', fontSize:15, marginBottom:4 }}>{lightbox.author||'Гость'}</div>
            {lightbox.votes > 0 && <div style={{ color:'#C3073F', fontSize:13, marginBottom:12 }}><Icon name="heart" size={13} stroke={2.2} style={{verticalAlign:'-2px',marginRight:4}}/>{lightbox.votes}</div>}
            <button onClick={() => deletePhoto(lightbox.id)} style={{ background:'rgba(195,7,63,0.1)', border:'1px solid rgba(195,7,63,0.25)', color:'#C3073F', borderRadius:10, padding:'8px 20px', fontSize:13, cursor:'pointer', fontFamily:'Onest,sans-serif', fontWeight:700 }}>
              Удалить фото
            </button>
          </div>
        </div>
      )}
    </>
  )
}