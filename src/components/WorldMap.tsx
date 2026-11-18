import { useMemo } from 'react'
import { useCities, useLand, type City } from '../data'

const W = 1000
const LAT0 = 80
const LAT1 = -56
const H = Math.round((W * (LAT0 - LAT1)) / 360)
const px = (lon: number) => ((lon + 180) / 360) * W
const py = (lat: number) => ((LAT0 - lat) / (LAT0 - LAT1)) * H

type Split = City['split']
const SPLIT: Record<Split, { name: string; n: number; color: string; r: number }> = {
  train: { name: 'Training', n: 68, color: '#7d8491', r: 3.1 },
  val: { name: 'Validation', n: 15, color: '#3b528b', r: 3.6 },
  test: { name: 'Unseen test', n: 17, color: '#1a7f7a', r: 4.4 },
}
const ORDER: Split[] = ['train', 'val', 'test']

export default function WorldMap() {
  const land = useLand()
  const cities = useCities()

  // All land dots as one path of zero-length round-capped strokes: one DOM node, crisp at any size.
  const dots = useMemo(
    () => land?.points.map(([lon, lat]) => `M${px(lon).toFixed(1)} ${py(lat).toFixed(1)}h0`).join('') ?? '',
    [land],
  )
  const dotW = (land?.step ?? 2) * (W / 360) * 0.56
  const sorted = useMemo(
    () => cities?.slice().sort((a, b) => ORDER.indexOf(a.split) - ORDER.indexOf(b.split)) ?? [],
    [cities],
  )
  const testNames = cities?.filter((c) => c.split === 'test').map((c) => c.name).join(', ')

  return (
    <div className="wmap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="map"
        role="img"
        aria-label={`World map of the ${cities?.length ?? 100} RadioVISTA cities on six continents: 68 training, 15 validation and 17 unseen test cities${testNames ? `. Test cities: ${testNames}` : ''}`}
      >
        <path className="land" d={dots} strokeWidth={dotW} />
        {sorted.map((c, i) => {
          const s = SPLIT[c.split]
          const x = px(c.lon)
          const y = py(c.lat)
          return (
            <g key={c.id} className={`city ${c.split}`}>
              {c.split === 'test' && (
                <circle className="pulse" cx={x} cy={y} r={s.r} fill={s.color} style={{ animationDelay: `${(i % 17) * 0.23}s` }} />
              )}
              <circle className="dot" cx={x} cy={y} r={s.r} fill={s.color} />
            </g>
          )
        })}
      </svg>
      <div className="map-legend">
        {ORDER.map((k) => (
          <span key={k} className={k}>
            <i style={{ background: SPLIT[k].color }} />
            {SPLIT[k].name}
            <b>{SPLIT[k].n}</b>
          </span>
        ))}
      </div>
    </div>
  )
}
