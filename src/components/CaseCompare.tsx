import { useState } from 'react'
import { RV, useJson } from '../data'

interface Region { x: number; y: number; w: number; h: number; ref: number; tgt: number }
interface Case {
  render: string
  ref: string
  tgt: string
  regions: Record<string, Region>
  ref_best: string
  tgt_best: string
}

type View = 'ref' | 'tgt'
const VIEWS: { v: View; label: string; note: string }[] = [
  { v: 'ref', label: 'Shown: direct paths', note: 'the reference field the model sees' },
  { v: 'tgt', label: 'Hidden: + wall reflections', note: 'the field it must predict' },
]

/** The paper's hidden-target case, redrawn on the engine's Blender render: one 2 km scene,
 *  concrete environment, the reference field (direct paths) and the hidden target (direct plus
 *  wall reflections) in the same frame, with the four candidate regions and their coverage.
 *  Switching views crossfades the field in place, so the winning region visibly moves. */
export default function CaseCompare() {
  const c = useJson<Case>(`${RV}case.json`)
  const [view, setView] = useState<View>('ref')
  if (!c) return <figure className="case-card" />
  const best = view === 'ref' ? c.ref_best : c.tgt_best

  return (
    <figure className="case-card">
      <div className="view-tabs case-tabs" role="group" aria-label="Field shown">
        {VIEWS.map((v) => (
          <button key={v.v} type="button" aria-pressed={view === v.v} onClick={() => setView(v.v)}>
            {v.label}
          </button>
        ))}
      </div>
      <div
        className="case-frame"
        role="img"
        aria-label={`2 km engine render with regions R1 to R4. ${VIEWS.find((v) => v.v === view)?.note}. Best-covered region: ${best}.`}
      >
        <img className="case-city" src={RV + c.render} alt="" loading="lazy" />
        <img className={`case-field${view === 'ref' ? ' shown' : ''}`} src={RV + c.ref} alt="" loading="lazy" />
        <img className={`case-field${view === 'tgt' ? ' shown' : ''}`} src={RV + c.tgt} alt="" loading="lazy" />
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="case-boxes" aria-hidden="true">
          {Object.entries(c.regions).map(([k, r]) => {
            const on = k === best
            const cov = view === 'ref' ? r.ref : r.tgt
            const x = r.x * 1000
            const y = r.y * 1000
            const w = r.w * 1000
            const h = r.h * 1000
            const tagW = on ? 176 : 160
            // Keep the tag inside the frame: below the box when it would run off the top.
            const tagY = y > 70 ? y - 54 : y + h + 8
            const tagX = Math.min(x, 1000 - tagW - 6)
            return (
              <g key={k} className={on ? 'win' : undefined}>
                <rect x={x} y={y} width={w} height={h} rx={4} className="case-box" />
                <g transform={`translate(${tagX} ${tagY})`}>
                  <rect width={tagW} height={46} rx={6} className="case-tag" />
                  <text x={12} y={31} className="case-label">{k}</text>
                  <text x={tagW - 12} y={31} textAnchor="end" className="case-cov">{cov.toFixed(1)}%</text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
      <figcaption className="case-legend">
        <span className="scale">−110 <i /> −20&nbsp;dBm</span>
        <span><b className="win-key" /> Best-covered region</span>
      </figcaption>
    </figure>
  )
}
