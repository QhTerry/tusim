'use client'

// Брендовый фон-сигнатура: аврора + блобы + плёночное зерно + виньетка.
// Кладётся первым в корне страницы: <Atmosphere/>. Контент — с z-index выше 0.
// props.blobs — показывать ли размытые пятна (по умолчанию да).
export default function Atmosphere({ blobs = true, grain = true, vignette = true }) {
  return (
    <div className="ds-atmos" aria-hidden="true">
      <div className="ds-aurora" />
      {blobs && (<><div className="ds-blob ds-blob-1" /><div className="ds-blob ds-blob-2" /></>)}
      {grain && <div className="ds-grain" />}
      {vignette && <div className="ds-vignette" />}
    </div>
  )
}
