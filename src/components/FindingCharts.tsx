import { useMemo, useRef } from 'react'
import { useResults } from '../data'
import { EASE_OUT, usePlayOnce } from '../motion'

// Redraws of the paper's figures for the web, kept faithful to the originals
// (fig8_errors_grouped, fig9_finetune) and set in the site's type and palette.
// Paper palette: preamble.tex tierG / tierP / tierF.
const C = {
  g: '#2f4b7f', p: '#1e7b72', f: '#d06a1f', fDeep: '#9a4a12',
  ink: '#0f1115', ink2: '#3b414b', mist: '#5d6470', line: '#e3e5e9', line2: '#cfd3da', misread: '#d4d9e1',
}

/* ------------------------------------------------------------------ error sources */

// Incorrect first responses by source per model group (paper Fig. errors; v4_errors.json).
// Shares are % of each group's errors; errors per model are out of 1,200 questions.
const ERRORS = [
  { group: 'Proprietary', perModel: 250, misread: 93.5, copied: 2.2, fixedG4: 4.3, letter: 0 },
  { group: 'Open', perModel: 785, misread: 62.1, copied: 0.5, fixedG4: 3.7, letter: 33.8 },
  { group: 'SFT', perModel: 269, misread: 79.6, copied: 2.6, fixedG4: 17.8, letter: 0 },
  { group: 'SFT + GRPO', perModel: 258, misread: 78.7, copied: 2.7, fixedG4: 18.6, letter: 0 },
] as const
const SOURCES = [
  { key: 'misread', name: 'Misread geometry or field', fill: C.misread, text: C.ink },
  { key: 'copied', name: 'Copied reference', fill: C.f, text: '#fff' },
  { key: 'fixedG4', name: 'Fixed G4 answer', fill: C.g, text: '#fff' },
  { key: 'letter', name: 'Favorite letter', fill: C.p, text: '#fff' },
] as const

export function ErrorSources() {
  const W = 540
  const L = 112
  const R = 522
  const T = 18
  const ROW = 56
  const BAR = 28
  const H = T + ERRORS.length * ROW + 52
  const x = (v: number) => L + (v / 100) * (R - L)
  const svg = useRef<SVGSVGElement>(null)
  usePlayOnce(svg, (el) =>
    [...el.querySelectorAll('.seg-row')].map((g, i) =>
      g.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 650, delay: 60 + i * 90, easing: EASE_OUT, fill: 'backwards' }),
    ),
  )

  return (
    <figure className="chart-card">
      <ul className="chart-legend top">
        {SOURCES.map((s) => (
          <li key={s.key}><i style={{ background: s.fill }} />{s.name}</li>
        ))}
      </ul>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Share of wrong first answers by source: proprietary models 94% misread; open models 62% misread and 34% favorite letter; SFT 80% misread and 18% fixed G4 answer; SFT plus GRPO 79% misread and 19% fixed G4 answer">
        {[25, 50, 75].map((t) => (
          <line key={t} x1={x(t)} x2={x(t)} y1={T} y2={T + ERRORS.length * ROW} stroke={C.line} />
        ))}
        {ERRORS.map((r, i) => {
          const cy = T + i * ROW + ROW / 2
          let acc = 0
          return (
            <g key={r.group}>
              <text x={L - 14} y={cy - 3} textAnchor="end" className="t-name">{r.group}</text>
              <text x={L - 14} y={cy + 15} textAnchor="end" className="t-sub">{r.perModel} errors</text>
              <g className="seg-row">
                {SOURCES.map((s) => {
                  const v = r[s.key]
                  const x0 = x(acc)
                  acc += v
                  if (v <= 0) return null
                  const w = x(acc) - x0
                  return (
                    <g key={s.key}>
                      <rect x={x0} y={cy - BAR / 2} width={w} height={BAR} fill={s.fill}>
                        <title>{`${r.group}: ${s.name} ${v.toFixed(1)}%`}</title>
                      </rect>
                      {v >= 10 && (
                        <text x={x0 + w / 2} y={cy + 5} textAnchor="middle" className="t-val" fill={s.text}>{Math.round(v)}</text>
                      )}
                    </g>
                  )
                })}
              </g>
            </g>
          )
        })}
        <rect x={L} y={T} width={R - L} height={ERRORS.length * ROW} fill="none" stroke={C.ink2} strokeWidth={1.4} />
        {[0, 25, 50, 75, 100].map((t) => (
          <text key={t} x={x(t)} y={T + ERRORS.length * ROW + 20} textAnchor="middle" className="t-tick">{t}</text>
        ))}
        <text x={(L + R) / 2} y={H - 6} textAnchor="middle" className="t-axis">Share of wrong first answers (%)</text>
      </svg>
    </figure>
  )
}

/* ------------------------------------------------------------------ fine-tune radar */

const TASKS = ['G1', 'G2', 'G3', 'G4', 'P1', 'P2', 'P3', 'P4', 'F1', 'F2', 'F3', 'F4'] as const
const NAMES: Record<string, string> = {
  G1: 'Height', G2: 'Line of sight', G3: 'Occlusion', G4: 'Path', P1: 'Path loss', P2: 'Material', P3: 'Scatter',
  P4: 'Diffract', F1: 'Read', F2: 'Mode', F3: 'Material', F4: 'Joint',
}
const GROUP = { G: { ink: C.g, tint: '#edf0f7' }, P: { ink: C.p, tint: '#e9f3f1' }, F: { ink: C.f, tint: '#fcf0e6' } }

type Series = { name: string; key: string; stroke: string; width: number; dash?: string; marker?: 'dot' | 'square' | 'circle' }
const SERIES: Series[] = [
  { name: 'Random guessing', key: 'Random', stroke: '#9aa1ad', width: 1.2, dash: '2 3' },
  { name: 'Gemini-3.8-Flash', key: 'Gemini-3.8-Flash', stroke: '#7cb4e6', width: 1.8, marker: 'dot' },
  { name: 'Claude-Opus-5.5', key: 'Claude-Opus-5.5', stroke: '#6fbf96', width: 1.8, marker: 'dot' },
  { name: 'GPT-6-Astra', key: 'GPT-6-Astra', stroke: '#3b414b', width: 1.8, dash: '6 4' },
  { name: 'Qwen3.5-9B', key: 'Qwen3.5-9B', stroke: '#8b8fd8', width: 2.2, marker: 'square' },
]
const OURS = 'Qwen3.5-9B-SFT-GRPO'

export function FineTuneRadar() {
  const data = useResults()
  const S = 640
  const cx = S / 2
  const cy = S / 2
  const R = 196 // radius of 100%
  const PAD = 70 // room for the axis names left and right
  const ang = (i: number) => ((-90 + i * 30) * Math.PI) / 180
  const pt = (i: number, v: number, r = R) => [cx + Math.cos(ang(i)) * (v / 100) * r, cy + Math.sin(ang(i)) * (v / 100) * r] as const
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).map((n) => n.toFixed(1)).join(',')).join(' ')

  const scores = useMemo(() => {
    if (!data) return null
    const get = (n: string) => data.rows.find((r) => r.name === n)?.scores
    const all: Record<string, number[]> = {}
    for (const s of [...SERIES.map((x) => x.key), OURS]) {
      const sc = get(s)
      if (!sc) return null
      all[s] = TASKS.map((t) => sc[t])
    }
    return all
  }, [data])

  const svg = useRef<SVGSVGElement>(null)
  // First view: our model's polygon grows out of the base model's shape, then the scores land.
  usePlayOnce(
    svg,
    (el) => {
      const ours = el.querySelector<SVGPolygonElement>('.ours-poly')
      const anims: Animation[] = []
      if (ours && scores) {
        const from = scores['Qwen3.5-9B']
        const to = scores[OURS]
        // A target-less effect supplies the eased 0→1 progress; each frame redraws the polygon
        // and markers from it, and the finished state always draws the trained shape.
        const effect = new KeyframeEffect(null, [], { duration: 900, delay: 80, easing: EASE_OUT, fill: 'both' })
        const a = new Animation(effect, document.timeline)
        const dots = [...el.querySelectorAll<SVGCircleElement>('.ours-dot')]
        const drawAt = (k: number) => {
          const vals = from.map((f, i) => f + (to[i] - f) * k)
          ours.setAttribute('points', poly(vals))
          dots.forEach((d, i) => {
            const [x, y] = pt(i, vals[i])
            d.setAttribute('cx', x.toFixed(1))
            d.setAttribute('cy', y.toFixed(1))
          })
        }
        const tick = () => {
          if (a.playState === 'finished') return drawAt(1)
          drawAt(effect.getComputedTiming().progress ?? 0)
          if (a.playState === 'running') requestAnimationFrame(tick)
        }
        const play = a.play.bind(a)
        a.play = () => {
          play()
          requestAnimationFrame(tick)
        }
        a.finished.then(() => drawAt(1), () => drawAt(1))
        anims.push(a)
        drawAt(0)
      }
      el.querySelectorAll('.score-tag').forEach((g, i) =>
        anims.push(g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 760 + i * 25, easing: EASE_OUT, fill: 'backwards' })),
      )
      return anims
    },
    [Boolean(scores)],
  )

  if (!scores) return <figure className="chart-card radar-card" />
  const ours = scores[OURS]
  const base = scores['Qwen3.5-9B']
  const wedge = (a0: number, a1: number, r: number) => {
    const p = (a: number) => [cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r]
    const [x0, y0] = p(a0)
    const [x1, y1] = p(a1)
    return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z`
  }
  const RO = R * 1.2 // tinted ring that carries the score tags

  return (
    <figure className="chart-card radar-card">
      <svg ref={svg} viewBox={`${-PAD} 0 ${S + 2 * PAD} ${S}`} className="chart-svg" role="img" aria-label="Radar chart of per-task accuracy: Qwen3.5-9B after SFT and GRPO against its base model, GPT-6-Astra, Claude-Opus-5.5, Gemini-3.8-Flash and random guessing">
        {/* group sectors */}
        <path d={wedge(-105, 15, RO)} fill={GROUP.G.tint} />
        <path d={wedge(15, 135, RO)} fill={GROUP.P.tint} />
        <path d={wedge(135, 255, RO)} fill={GROUP.F.tint} />
        <circle cx={cx} cy={cy} r={RO} fill="none" stroke={C.line2} strokeWidth={1.2} />
        {[20, 40, 60, 80, 100].map((t) => (
          <circle key={t} cx={cx} cy={cy} r={(t / 100) * R} fill="none" stroke={t === 100 ? C.line2 : '#dfe2e7'} strokeWidth={t === 100 ? 1.1 : 0.8} />
        ))}
        {TASKS.map((t, i) => {
          const [x, y] = pt(i, 100, RO)
          return <line key={t} x1={cx} y1={cy} x2={x} y2={y} stroke="#dfe2e7" strokeWidth={0.8} />
        })}
        {[20, 40, 60, 80, 100].map((t) => (
          <text key={t} x={cx + 6} y={cy - (t / 100) * R + 4} className="t-ring">{t}</text>
        ))}

        {SERIES.map((s) => (
          <g key={s.key}>
            <polygon points={poly(scores[s.key])} fill="none" stroke={s.stroke} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinejoin="round">
              <title>{s.name}</title>
            </polygon>
            {s.marker === 'dot' && scores[s.key].map((v, i) => {
              const [x, y] = pt(i, v)
              return <circle key={i} cx={x} cy={y} r={2.6} fill={s.stroke} />
            })}
            {s.marker === 'square' && scores[s.key].map((v, i) => {
              const [x, y] = pt(i, v)
              return <rect key={i} x={x - 4.5} y={y - 4.5} width={9} height={9} fill="#a3a7ea" stroke="#5f64c2" strokeWidth={1}><title>{`${s.name}, ${TASKS[i]}: ${v.toFixed(1)}%`}</title></rect>
            })}
          </g>
        ))}

        <polygon className="ours-poly" points={poly(ours)} fill="rgba(208,106,31,0.06)" stroke={C.f} strokeWidth={3.2} strokeLinejoin="round" />
        {ours.map((v, i) => {
          const [x, y] = pt(i, v)
          return (
            <circle key={i} className="ours-dot" cx={x} cy={y} r={5.5} fill="#ea8a43" stroke={C.fDeep} strokeWidth={1.2}>
              <title>{`${OURS}, ${TASKS[i]}: ${v.toFixed(1)}% (${v - base[i] >= 0 ? '+' : ''}${(v - base[i]).toFixed(1)} over the base model)`}</title>
            </circle>
          )
        })}

        {TASKS.map((t, i) => {
          const [x, y] = pt(i, 100, R * 1.1)
          const gain = Math.round(ours[i] - base[i])
          return (
            <g key={t} className="score-tag" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
              <rect x={-21} y={-15} width={42} height={30} rx={4} fill="#fff" fillOpacity={0.94} />
              <text y={-2} textAnchor="middle" className="t-score">{Math.round(ours[i])}</text>
              <text y={11} textAnchor="middle" className="t-gain">({gain >= 0 ? '+' : ''}{gain})</text>
            </g>
          )
        })}

        {TASKS.map((t, i) => {
          const a = -90 + i * 30
          const [x, y] = pt(i, 100, R * 1.36)
          const c = Math.cos((a * Math.PI) / 180)
          const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end'
          return (
            <text key={t} x={x} y={y + 5} textAnchor={anchor} className="t-axisname" fill={GROUP[t[0] as 'G'].ink}>
              {t} {NAMES[t]}
            </text>
          )
        })}
      </svg>
      <ul className="chart-legend radar-legend">
        <li><svg width="34" height="12" aria-hidden="true"><line x1="2" y1="6" x2="32" y2="6" stroke={C.f} strokeWidth="3.2" /><circle cx="17" cy="6" r="4.5" fill="#ea8a43" stroke={C.fDeep} /></svg>Qwen3.5-9B-SFT-GRPO (ours)</li>
        <li><svg width="34" height="12" aria-hidden="true"><line x1="2" y1="6" x2="32" y2="6" stroke="#3b414b" strokeWidth="1.8" strokeDasharray="6 4" /></svg>GPT-6-Astra</li>
        <li><svg width="34" height="12" aria-hidden="true"><line x1="2" y1="6" x2="32" y2="6" stroke="#7cb4e6" strokeWidth="1.8" /><circle cx="17" cy="6" r="2.6" fill="#7cb4e6" /></svg>Gemini-3.8-Flash</li>
        <li><svg width="34" height="12" aria-hidden="true"><line x1="2" y1="6" x2="32" y2="6" stroke="#8b8fd8" strokeWidth="2.2" /><rect x="12.5" y="1.5" width="9" height="9" fill="#a3a7ea" stroke="#5f64c2" /></svg>Qwen3.5-9B</li>
        <li><svg width="34" height="12" aria-hidden="true"><line x1="2" y1="6" x2="32" y2="6" stroke="#6fbf96" strokeWidth="1.8" /><circle cx="17" cy="6" r="2.6" fill="#6fbf96" /></svg>Claude-Opus-5.5</li>
        <li><svg width="34" height="12" aria-hidden="true"><line x1="2" y1="6" x2="32" y2="6" stroke="#9aa1ad" strokeWidth="1.4" strokeDasharray="2 3" /></svg>Random guessing</li>
      </ul>
    </figure>
  )
}

/* ------------------------------------------------------------------ dot meters */

/** Paper-style dot meter (preamble \elev and \pct): `n` of `total` dots filled in tierF orange,
 *  fractional values fill part of a dot, the rest stay hollow. */
export function Dots({ n, total = 11 }: { n: number; total?: number }) {
  const r = 3.6
  const gap = 10
  return (
    <svg className="dots" width={total * gap} height={10} viewBox={`0 0 ${total * gap} 10`} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const cx = gap / 2 + i * gap
        const fill = Math.max(0, Math.min(1, n - i))
        const id = `dot-${total}-${i}-${Math.round(fill * 100)}`
        return (
          <g key={i}>
            <circle cx={cx} cy={5} r={r - 0.5} fill="none" stroke="#bfc4cc" strokeWidth={0.9} />
            {fill > 0 && (
              <>
                <clipPath id={id}><rect x={cx - r} y={0} width={2 * r * fill} height={10} /></clipPath>
                <circle cx={cx} cy={5} r={r} fill={C.f} clipPath={`url(#${id})`} />
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
