import { useState } from 'react'
import { RV, useCities, useManifest } from '../data'

/** Twelve engine meshes. Hover or press a city to lay its simulated field over the render. */
export default function CityStrip() {
  const m = useManifest()
  const cities = useCities()
  const [on, setOn] = useState<string | null>(null)
  const byId = Object.fromEntries((cities ?? []).map((c) => [c.id, c]))

  return (
    <>
      <div className="cities">
        {m?.gallery.map((g) => {
          const c = byId[g.id]
          const name = c?.name ?? g.id
          return (
            <button
              key={g.id}
              className="ctile"
              aria-pressed={on === g.id}
              aria-label={`${name}: show its simulated field`}
              onClick={() => setOn(on === g.id ? null : g.id)}
            >
              <span className="frame">
                <img className="r" src={RV + g.render.replace('.webp', '_s.webp')} alt="" loading="lazy" />
                <img className="f" src={RV + g.field.replace('.webp', '_s.webp')} alt="" loading="lazy" />
              </span>
              <span className="name">
                {name}
                {c && <small>{c.country_code}</small>}
              </span>
            </button>
          )
        })}
      </div>
      <p className="strip-hint">Each tile is a 2 km engine mesh. Scroll for more cities. Hover or tap one to lay its simulated field over it.</p>
    </>
  )
}
