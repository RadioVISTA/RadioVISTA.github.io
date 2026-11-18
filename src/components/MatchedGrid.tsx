import { Fragment, useState } from 'react'
import { RV, useManifest } from '../data'

const LEVELS = [
  { k: 'L1', name: 'Free space', note: 'no buildings' },
  { k: 'L2', name: 'Concrete', note: 'geometry and terrain' },
  { k: 'L3', name: 'Materials', note: 'land cover and canopy' },
]
const MODES = [
  { k: 'M1', name: 'Direct', note: 'line of sight only' },
  { k: 'M2', name: '+ Reflection', note: 'off walls' },
  { k: 'M3', name: '+ Scattering', note: 'off rough surfaces' },
  { k: 'M4', name: '+ Diffraction', note: 'around edges' },
]

type View = 'adds' | 'field'
const VIEWS: { v: View; label: string }[] = [
  { v: 'field', label: 'Signal strength' },
  { v: 'adds', label: 'What each mechanism adds' },
]

/** Twelve matched fields of one 600 m block of Midtown Manhattan: three environments by four
 *  cumulative propagation modes. "adds" shows what each mechanism newly covers; "field" shows strength. */
export default function MatchedGrid() {
  const m = useManifest()
  const [view, setView] = useState<View>('field')
  const [sel, setSel] = useState<[number, number] | null>(null)
  const mt = m?.matched

  return (
    <div>
      <div className="view-tabs" role="group" aria-label="Grid view">
        {VIEWS.map((v) => (
          <button key={v.v} type="button" aria-pressed={view === v.v} onClick={() => setView(v.v)}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="matrix-bar">
        {view === 'adds' ? (
          <div className="legend">
            <span><i className="sw" style={{ background: 'var(--cov-new)' }} />Newly covered by this mechanism</span>
            <span><i className="sw" style={{ background: 'var(--cov-old)' }} />Covered by earlier ones</span>
            <span><i className="sw" style={{ background: 'var(--cov-bld)' }} />Building</span>
          </div>
        ) : (
          <div className="legend">
            <span className="scale dark-ink">−110 <i /> −20&nbsp;dBm</span>
          </div>
        )}
      </div>

      <div className={`matrix${sel ? ' dim' : ''}`} onMouseLeave={() => setSel(null)}>
        <div className="corner" />
        {MODES.map((md, c) => (
          <div key={md.k} className={`ch${sel?.[1] === c ? ' on' : ''}`}>
            <b>{md.name}</b>
            {md.note}
          </div>
        ))}
        {LEVELS.map((lv, r) => (
          <Fragment key={lv.k}>
            <div className={`rh${sel?.[0] === r ? ' on' : ''}`}>
              <b>{lv.name}</b>
              {lv.note}
            </div>
            {MODES.map((md, c) => {
              const i = r * 4 + c
              const alt = `${lv.name} environment, ${md.name.replace('+ ', 'up to ').toLowerCase()}`
              const st = mt?.stats?.[`${lv.k}${md.k}`]
              const on = sel !== null && (sel[0] === r || sel[1] === c)
              return (
                <div key={md.k} className={`mcell${on ? ' on' : ''}`} onMouseEnter={() => setSel([r, c])}>
                  {mt?.adds && (
                    <img className={view === 'adds' ? 'shown' : ''} style={{ ['--d' as string]: `${c * 70}ms` }} src={RV + mt.adds[i]} alt={view === 'adds' ? `${alt}: new coverage` : ''} loading="lazy" />
                  )}
                  {mt && (
                    <img className={view === 'field' ? 'shown' : ''} style={{ ['--d' as string]: `${c * 70}ms` }} src={RV + mt.tiles[i]} alt={view === 'field' ? `${alt}: signal strength` : ''} loading="lazy" />
                  )}
                  {st && (
                    <span className="cov">
                      <b>{st.coverage.toFixed(1)}%</b>
                      {c > 0 && <em className={st.added > 0.05 ? 'up' : ''}>{st.added > 0.05 ? `+${st.added.toFixed(1)}` : 'no change'}</em>}
                    </span>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
      <p className="matrix-note">
        Coverage is the share of street cells receiving at least −90&nbsp;dBm, the threshold the benchmark uses. In free
        space there is nothing to reflect off, scatter from or bend around, so all four modes match.
      </p>
    </div>
  )
}
