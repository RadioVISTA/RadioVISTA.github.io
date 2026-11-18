import { useState } from 'react'
import { useCities, useLand, type City } from '../data'

const W = 1000
const LAT0 = 80
const LAT1 = -56
const H = Math.round((W * (LAT0 - LAT1)) / 360)
const px = (lon: number) => ((lon + 180) / 360) * W
const py = (lat: number) => ((LAT0 - lat) / (LAT0 - LAT1)) * H

const SPLIT: Record<City['split'], { label: string; color: string }> = {
  train: { label: 'Training cities (68)', color: '#9aa1ad' },
  val: { label: 'Validation (15)', color: '#3b528b' },
  test: { label: 'Unseen test cities (17)', color: '#21918c' },
}

export default function WorldMap() {
  const land = useLand()
  const cities = useCities()
  const [hover, setHover] = useState<City | null>(null)
  const r = (land?.step ?? 2) * (W / 360) * 0.36

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="map" role="img" aria-label={`World map of the ${cities?.length ?? 100} RadioVISTA cities on six continents: 68 training, 15 validation and 17 unseen test cities${cities ? `. Test cities: ${cities.filter((c) => c.split === 'test').map((c) => c.name).join(', ')}` : ''}`}>
        <g className="land">
          {land?.points.map(([lon, lat]) => (
            <circle key={`${lon},${lat}`} cx={px(lon)} cy={py(lat)} r={r} />
          ))}
        </g>
        {cities
          ?.slice()
          .sort((a, b) => (a.split === 'test' ? 1 : 0) - (b.split === 'test' ? 1 : 0))
          .map((c) => {
            const col = SPLIT[c.split].color
            return (
              <g
                key={c.id}
                className="city"
                onMouseEnter={() => setHover(c)}
                onMouseLeave={() => setHover(null)}
              >
                {c.split === 'test' && <circle cx={px(c.lon)} cy={py(c.lat)} r={9} fill={col} opacity={0.2} />}
                <circle className="ring" cx={px(c.lon)} cy={py(c.lat)} r={hover?.id === c.id ? 7 : 4.2} fill={col} stroke="#ffffff" strokeWidth={1.4} />
              </g>
            )
          })}
      </svg>
      <div className="map-foot">
        <div className="map-legend">
          {Object.values(SPLIT).map((s) => (
            <span key={s.label}>
              <i style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
        <p className="map-tip" aria-hidden="true">
          {hover ? `${hover.name}, ${hover.lat.toFixed(2)}°, ${hover.lon.toFixed(2)}°` : ' '}
        </p>
      </div>
    </div>
  )
}
