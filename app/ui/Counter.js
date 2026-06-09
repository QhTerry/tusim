'use client'
import { useEffect, useRef, useState } from 'react'

// Count-up число, запускается при появлении в зоне видимости. <Counter value={42} />
export default function Counter({ value = 0, duration = 1100, className = '', style }) {
  const [n, setN] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (e.isIntersecting && !started.current) {
          started.current = true
          const t0 = performance.now()
          const tick = (t) => {
            const p = Math.min((t - t0) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setN(Math.round(eased * value))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      })
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [value, duration])
  return <span ref={ref} className={className} style={style}>{n.toLocaleString('ru-RU')}</span>
}
