import { useEffect, useRef, useState } from 'react'
import { hiddenTarget, useResults, type Row } from '../data'
import { EASE_OUT, usePlayOnce } from '../motion'

// One row per model: path tracing (G4) and field reading under a hidden intervention (F2–F4).
// The line between the two dots is the field–path gap. Wide cards put model names in a left
// column; narrow cards (phones) put each name above its row so the plot keeps the full width and
// the text stays at its set size instead of shrinking with the viewBox.
const WIDE = { W: 580, ROW: 38, L: 168, R: 24, T: 34, nameDy: 4 }
const NARROW = { W: 340, ROW: 50, L: 12, R: 14, T: 30, nameDy: -13 }

const PICK = ['GPT-6-Astra', 'GPT-6.1-Sol', 'Claude-Opus-5.5', 'Gemini-3.8-Flash', 'GPT-6-Luna', 'Open mean', 'Qwen3.5-9B-SFT-GRPO']
const PATH = '#6b7280'
const FIELD = '#21918c'

export default function Dissociation() {
  const data = useResults()
  const svg = useRef<SVGSVGElement>(null)
  const fig = useRef<HTMLElement>(null)
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const el = fig.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 440))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const { W, ROW, L, R, T, nameDy } = narrow ? NARROW : WIDE
  const x = (v: number) => L + ((v - 20) / 80) * (W - L - R)
  // First view: each gap draws from the path score to the field score, then the field dot lands.
  usePlayOnce(
    svg,
    (el) => [
      ...[...el.querySelectorAll('.gapline')].map((l, i) =>
        l.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 600, delay: 60 + i * 60, easing: EASE_OUT, fill: 'backwards' }),
      ),
      ...[...el.querySelectorAll('.fdot')].map((d, i) =>
        d.animate([{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, delay: 480 + i * 60, easing: EASE_OUT, fill: 'backwards' }),
      ),
    ],
    [Boolean(data)],
  )
  const rows = PICK.map((n) => data?.rows.find((r) => r.name === n)).filter(Boolean) as Row[]
  const H = T + rows.length * ROW + 34
  const ticks = [20, 40, 60, 80, 100]

  return (
    <figure className="chart-card" ref={fig}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="dumbbell" role="img" aria-label="Per model accuracy on path tracing (G4) and on reading a hidden field (F2 to F4)">
        {ticks.map((t) => (
          <line key={t} className="grid" x1={x(t)} x2={x(t)} y1={T - 10} y2={H - 30} />
        ))}
        <line className="chance" x1={x(50)} x2={x(50)} y1={T - 10} y2={H - 30} />
        <text className="chance-label" x={x(50) + 6} y={T - 16}>coin flip on G4</text>
        <rect className="frame" x={L} y={T - 10} width={W - L - R} height={H - 30 - (T - 10)} />
        <g className="axis">
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={H - 12} textAnchor="middle">{t}%</text>
          ))}
        </g>
        {rows.map((r, i) => {
          const y = T + i * ROW + ROW / 2
          const g4 = r.scores.G4
          const ht = hiddenTarget(r)
          const ours = r.group === 'ours'
          return (
            <g key={r.name} className={ours ? 'ours' : ''}>
              <title>{`${r.name}: path ${g4.toFixed(1)}%, hidden field ${ht.toFixed(1)}%`}</title>
              <text className="name" x={narrow ? L : L - 14} y={y + nameDy} textAnchor={narrow ? 'start' : 'end'}>
                {r.name === 'Open mean' ? 'Open models (mean)' : r.name}
              </text>
              <line className="gapline" pathLength={1} x1={x(g4)} x2={x(ht)} y1={y} y2={y} stroke={ours ? 'url(#gap)' : '#c9ced6'} strokeWidth={ours ? 4 : 3} strokeLinecap="round" />
              <circle cx={x(g4)} cy={y} r={7} fill="#ffffff" stroke={PATH} strokeWidth={2.2} />
              <circle className="fdot" cx={x(ht)} cy={y} r={7} fill={FIELD} />
            </g>
          )
        })}
        <defs>
          <linearGradient id="gap" gradientUnits="userSpaceOnUse" x1={x(40)} x2={x(100)} y1={0} y2={0}>
            <stop offset="0" stopColor="#3b528b" />
            <stop offset="1" stopColor="#5ec962" />
          </linearGradient>
        </defs>
      </svg>
      <div className="legend">
        <span><i style={{ border: `2px solid ${PATH}` }} />Path tracing: is there a direct or one-wall path? (G4)</span>
        <span><i style={{ background: FIELD }} />Field reading: which region wins after a hidden change? (F2–F4)</span>
      </div>
    </figure>
  )
}
