// Эквалайзер — фирменный party-мотив. <Equalizer bars={5} />
export default function Equalizer({ bars = 5, style, className = '' }) {
  return (
    <span className={`ds-eq ${className}`} style={style} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => <i key={i} />)}
    </span>
  )
}
