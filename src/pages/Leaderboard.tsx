import { Fragment, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { prefersReducedMotion, useResults, type Row } from '../data'
import { EASE_OUT, growKeyframes, usePlayOnce } from '../motion'
import { GROUPS, TASKS } from '../site'
import { Seg } from '../components/ui'
import Dissociation from '../components/Dissociation'

type View = 'groups' | 'G' | 'P' | 'F' | 'retry'
type Filter = 'all' | 'proprietary' | 'open'
type Dir = 'descending' | 'ascending'

const VIEWS: Record<View, { cols: string[]; label: string }> = {
  groups: { cols: ['G', 'P', 'F', 'All'], label: 'Overview' },
  G: { cols: ['G1', 'G2', 'G3', 'G4', 'G'], label: 'Spatial recognition' },
  P: { cols: ['P1', 'P2', 'P3', 'P4', 'P'], label: 'Channel reasoning' },
  F: { cols: ['F1', 'F2', 'F3', 'F4', 'F'], label: 'Physics aggregation' },
  retry: { cols: ['All', 'Pass@4', 'Corr'], label: 'Retries' },
}

const HEAD: Record<string, [string, string]> = {
  G: ['G', 'Spatial recognition'],
  P: ['P', 'Channel reasoning'],
  F: ['F', 'Physics aggregation'],
  All: ['Overall', 'mean of 12 tasks'],
  'Pass@4': ['Pass@4', 'any of 4 samples'],
  Corr: ['Correction', 'after feedback'],
  ...Object.fromEntries(Object.entries(TASKS).map(([k, v]) => [k, [k, v] as [string, string]])),
}

const DISPLAY: Record<string, string> = { 'Open mean': 'Open models (mean)', 'Proprietary mean': 'Proprietary models (mean)' }

export default function Leaderboard() {
  const data = useResults()
  const [view, setView] = useState<View>('groups')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<{ key: string; dir: Dir } | null>(null)
  const cols = VIEWS[view].cols

  const { sections, best, random } = useMemo(() => {
    if (!data) return { sections: [], best: {} as Record<string, number>, random: undefined as Row | undefined }
    const random = data.rows.find((r) => r.group === 'baseline')
    const models = data.rows.filter((r) => ['proprietary', 'open', 'ours'].includes(r.group))
    const best: Record<string, number> = {}
    for (const c of data.columns) best[c] = Math.max(...models.map((r) => r.scores[c]))
    const pick = (g: string) => data.rows.filter((r) => r.group === g || r.group === `${g}-mean`)
    let sections = [
      { title: 'Proprietary models', rows: pick('proprietary') },
      { title: 'Open models', rows: pick('open') },
      { title: 'Ours: Qwen3.5-9B trained on engine data', rows: pick('ours') },
    ]
    if (filter === 'proprietary') sections = [sections[0], sections[2]]
    if (filter === 'open') sections = [sections[1], sections[2]]
    if (sort) {
      const f = sort.dir === 'descending' ? -1 : 1
      const all = sections.flatMap((s) => s.rows).filter((r) => !r.group.endsWith('mean'))
      all.sort((a, b) => f * (a.scores[sort.key] - b.scores[sort.key]))
      sections = [{ title: `Ranked by ${HEAD[sort.key][1]}`, rows: all }]
    }
    return { sections, best, random }
  }, [data, filter, sort])

  const table = useRef<HTMLDivElement>(null)
  // Reorder, filter and view changes animate rows from old to new positions with a document
  // view transition (element-scoped transitions stalled in testing). A new change skips the one
  // in flight; the update itself always runs. Plain update without support or with reduced motion.
  const transition = (update: () => void) => {
    if (prefersReducedMotion() || !document.startViewTransition) return update()
    document.startViewTransition(() => flushSync(update))
  }
  // First view: every score bar grows from zero to its value, row by row.
  usePlayOnce(
    table,
    (el) =>
      [...el.querySelectorAll('tbody tr')].flatMap((tr, row) =>
        [...tr.querySelectorAll('.cell-bar i')].map((b) =>
          b.animate(growKeyframes(0, 3), { duration: 600, delay: 60 + Math.min(row * 20, 360), easing: EASE_OUT, fill: 'backwards' }),
        ),
      ),
    [Boolean(data)],
  )

  const onSort = (key: string) =>
    transition(() =>
      setSort((s) => (s?.key === key ? (s.dir === 'descending' ? { key, dir: 'ascending' } : null) : { key, dir: 'descending' })),
    )

  const changeView = (v: View) => transition(() => {
    setView(v)
    if (sort && !VIEWS[v].cols.includes(sort.key)) setSort(null)
  })

  const status = sort ? `Ranked by ${HEAD[sort.key][1]}, ${sort.dir}` : 'Listed in paper order'

  return (
    <>
      <div className="dark">
      <div className="wrap page-head">
        <h1>Leaderboard</h1>
        <p>
          Zero-shot accuracy (%) on 1,200 questions from 17 held-out test cities. Models are listed in paper order.
          Select a column heading to rank by it.
        </p>
      </div>
      </div>

      <section className="wrap lb-board">
        <div className="controls">
          <div>
            <span className="ctl-label">Tasks</span>
            <Seg label="Task view" value={view} onChange={changeView} options={(Object.keys(VIEWS) as View[]).map((v) => ({ v, label: VIEWS[v].label }))} />
          </div>
          <div>
            <span className="ctl-label">Models</span>
            <Seg
              label="Model filter"
              value={filter}
              onChange={(f) => transition(() => setFilter(f))}
              options={[
                { v: 'all', label: 'All' },
                { v: 'proprietary', label: 'Proprietary' },
                { v: 'open', label: 'Open' },
              ]}
            />
          </div>
        </div>

        {!data ? (
          <p className="muted">Loading results…</p>
        ) : (
          <div className="table-scroll" ref={table}>
            <table className="lb" id="lb">
              <caption>
                Best entry per column in green. Retries report Pass@4 at temperature 0.7 and the correction rate after
                feedback, both excluding G4. Source: Table 2 of the paper.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  {cols.map((c) => (
                    <th key={c} scope="col" aria-sort={sort?.key === c ? sort.dir : undefined}>
                      <button type="button" onClick={() => onSort(c)}>
                        <span className="k" style={{ color: /^[GPF]\d?$/.test(c) ? GROUPS[c[0] as keyof typeof GROUPS].color : undefined }}>{HEAD[c][0]}</span>
                        <span className="sub">{HEAD[c][1]}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {random && (
                  <tr className="ref">
                    <td>Random guessing</td>
                    {cols.map((c) => (
                      <td key={c}>{random.scores[c].toFixed(1)}</td>
                    ))}
                  </tr>
                )}
                {sections.map((s) => (
                  <Fragment key={s.title}>
                    <tr className="sep">
                      <td colSpan={cols.length + 1}>{s.title}</td>
                    </tr>
                    {s.rows.map((r) => {
                      const isMean = r.group.endsWith('mean')
                      return (
                        <tr key={r.name} className={`vt ${isMean ? 'mean' : r.group === 'ours' ? 'ours' : ''}`}>
                          <td>
                            {DISPLAY[r.name] ?? r.name}
                            {r.group === 'ours' && <span className="tag">Ours</span>}
                          </td>
                          {cols.map((c) => {
                            const v = r.scores[c]
                            const isBest = !isMean && v === best[c]
                            return (
                              <td key={c} className={isBest ? 'best' : ''}>
                                {v.toFixed(1)}
                                {view === 'groups' && (
                                  <span className="cell-bar" aria-hidden="true">
                                    <i style={{ width: `${v}%` }} />
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="sr-only" role="status">{status}</p>
      </section>

      <section className="band alt">
        <div className="wrap split">
          <div>
            <h2 className="h2t">Reading the field does not transfer to tracing a path</h2>
            <div className="body">
              <p>
                Proprietary models rank regions of a hidden field at 69 to 95%, yet decide whether a single direct or
                one-wall path exists at only 47 to 77%. Fine-tuning moves our 9B model far along the field axis while
                leaving it near a coin flip on paths.
              </p>
            </div>
          </div>
          <Dissociation />
        </div>
      </section>

      <section className="band tight">
        <div className="wrap narrow">
          <h2 className="h2t">Add your model</h2>
          <div className="body">
            <p>
              The evaluation code and test split will be released with the paper. We plan to accept submissions as pull
              requests with model outputs, scored by the same deterministic answer parser.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
