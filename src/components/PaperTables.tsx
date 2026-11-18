import type { ReactNode } from 'react'
import { Dots } from './FindingCharts'

// Findings tables set like the paper's booktabs tables (tab:copyref, tab:retry): heavy top and
// bottom rules, a mid rule under the head, hairline group separators, no shading or column rules,
// reference rows in grey italics, the best entry per column in bold, tierF dot meters.

type Cell = { v: number; best?: boolean }
type Row = { name: string; italic?: boolean; ref?: boolean; cells: Cell[] }
type Col = { head: ReactNode; sub?: string; dots?: { total: number; scale: number }; digits?: number }

function PaperTable({ caption, cols, groups }: { caption: string; cols: Col[]; groups: Row[][] }) {
  return (
    <div className="ptable-scroll">
    <table className="ptable">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Model</th>
          {cols.map((c, i) => (
            <th scope="col" key={i} className={c.dots ? 'dotcol' : 'numcol'}>
              {c.head}
              {c.sub && <span className="sub">{c.sub}</span>}
            </th>
          ))}
        </tr>
      </thead>
      {groups.map((g, gi) => (
        <tbody key={gi}>
          {g.map((r) => (
            <tr key={r.name} className={r.ref ? 'ref' : r.italic ? 'it' : undefined}>
              <th scope="row">{r.name}</th>
              {r.cells.map((c, ci) => {
                const col = cols[ci]
                const txt = c.v.toFixed(col.digits === 0 && !Number.isInteger(c.v) ? 1 : (col.digits ?? 1))
                return (
                  <td key={ci} className={col.dots ? 'dotcol' : 'numcol'}>
                    {col.dots ? (
                      <span className="meter">
                        <Dots n={c.v / col.dots.scale} total={col.dots.total} />
                        <span className={c.best ? 'b' : undefined}>{txt}</span>
                      </span>
                    ) : (
                      <span className={c.best ? 'b' : undefined}>{txt}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
    </div>
  )
}

const row = (name: string, vals: (number | [number, true])[], extra: Partial<Row> = {}): Row => ({
  name,
  cells: vals.map((v) => (Array.isArray(v) ? { v: v[0], best: true } : { v })),
  ...extra,
})

/** Paper tab:copyref. Accuracy on all 306 F2–F4 questions and the 295 with a kept winner, and
 *  correct counts on the 11 where the winner changes. */
export function CopyRefTable() {
  return (
    <PaperTable
      caption="Hidden-target accuracy: all questions, kept-winner questions, and correct answers on the 11 changed-winner questions"
      cols={[
        { head: 'All (%)' },
        { head: 'Kept (%)' },
        { head: 'Changed winner', sub: 'correct of 11', dots: { total: 11, scale: 1 }, digits: 0 },
      ]}
      groups={[
        [row('Copy the reference', [96.4, 100.0, 0], { ref: true })],
        [
          row('GPT-6-Astra', [[94.8, true], [96.9, true], 4]),
          row('GPT-6.1-Sol', [[94.8, true], 96.3, 6]),
          row('GPT-6-Luna', [69.0, 70.2, 4]),
          row('Claude-Opus-5.5', [86.9, 87.8, [7, true]]),
          row('Gemini-3.8-Flash', [85.9, 87.5, 5]),
        ],
        [row('Open models (mean)', [27.9, 28.2, 2.1], { italic: true })],
        [row('Qwen3.5-9B-SFT', [87.9, 89.8, 4]), row('Qwen3.5-9B-SFT-GRPO', [88.9, 90.8, 4])],
      ]}
    />
  )
}

/** Paper tab:retry. Pass@4 and correction rate (excluding G4), one dot per ten points. */
export function RetryTable() {
  return (
    <PaperTable
      caption="Pass@4 and correction rate excluding G4, with random-guessing baselines 70.7% and 34.1%"
      cols={[
        { head: 'Pass@4 (%)', sub: 'random 70.7', dots: { total: 10, scale: 10 } },
        { head: 'Correction (%)', sub: 'random 34.1', dots: { total: 10, scale: 10 } },
      ]}
      groups={[
        [
          row('GPT-6-Astra', [92.8, [90.6, true]]),
          row('GPT-6.1-Sol', [[93.2, true], 84.6]),
          row('GPT-6-Luna', [79.8, 62.6]),
          row('Claude-Opus-5.5', [87.5, 69.3]),
          row('Gemini-3.8-Flash', [84.5, 70.3]),
          row('Proprietary mean', [87.6, 75.5], { italic: true }),
        ],
        [row('Best open model', [68.3, 50.4], { italic: true }), row('Open mean', [54.4, 29.8], { italic: true })],
        [row('Qwen3.5-9B-SFT', [88.9, 39.0]), row('Qwen3.5-9B-SFT-GRPO', [82.8, 37.8])],
      ]}
    />
  )
}

