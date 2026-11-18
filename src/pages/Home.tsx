import { Link } from 'react-router-dom'
import FieldReveal from '../components/FieldReveal'
import WorldMap from '../components/WorldMap'
import CityStrip from '../components/CityStrip'
import MatchedGrid from '../components/MatchedGrid'
import Dissociation from '../components/Dissociation'
import SubNav from '../components/SubNav'
import { CopyBlock, ResourceButton, RouteButton } from '../components/ui'
import { useRef } from 'react'
import { RV, useResults } from '../data'
import { EASE_OUT, growKeyframes, usePlayOnce } from '../motion'
import { BIBTEX, LINKS } from '../site'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'engine', label: 'Engine' },
  { id: 'fields', label: 'Matched fields' },
  { id: 'exam', label: 'Exam' },
  { id: 'findings', label: 'Findings' },
  { id: 'training', label: 'Training' },
  { id: 'cite', label: 'Results' },
]

const PILLARS = [
  {
    to: '#engine',
    img: ['city_tokyo_render.webp'],
    title: 'Global scene engine',
    text: 'Turns any coordinate on Earth into a watertight, ray-traceable city with ITU-R materials, fused from 23 open geospatial sources.',
  },
  {
    to: '#fields',
    img: ['m_L3M4.webp'],
    title: 'Matched ray tracing',
    text: 'Traces each city as a controlled experiment. Twelve matched fields isolate one physical factor at a time.',
  },
  {
    to: '#exam',
    img: ['city_lusaka_render.webp', 'city_lusaka_field.webp'],
    title: 'Physics exam',
    text: 'Compiles the fields into twelve tasks with exact answers, from tracing a single path to ranking regions by coverage.',
  },
  {
    to: '#training',
    img: ['city_sydney_render.webp', 'city_sydney_field.webp'],
    title: 'Training data',
    text: 'The same engine produces training data on 68 cities. A 9B open model trained on it nears frontier proprietary models on fields.',
  },
]

const GROUPS = [
  {
    k: 'G',
    color: 'var(--g)',
    name: 'Spatial recognition',
    skill: 'Geometric competence: trace a path and judge whether it clears a building or bounces off a wall.',
    tasks: [['G1', 'Height'], ['G2', 'Line of sight'], ['G3', 'Occlusion'], ['G4', 'Path reachability']],
    q: 'Is there a direct path or one specular wall reflection from any listed transmitter to the target?',
    model: 'Gemini-3.8-Flash',
    said: 'No',
    truth: 'Yes',
    ok: false,
  },
  {
    k: 'P',
    color: 'var(--p)',
    name: 'Channel reasoning',
    skill: 'Propagation competence: judge how the signal responds to distance, materials and added mechanisms.',
    tasks: [['P1', 'Path loss'], ['P2', 'Material'], ['P3', 'Scatter'], ['P4', 'Diffract']],
    q: 'Point B is twice as far from TX 0 as point A. How much does free-space path loss increase?',
    model: 'Gemini-3.8-Flash',
    said: '6.02 dB',
    truth: '6.02 dB',
    ok: true,
  },
  {
    k: 'F',
    color: 'var(--f)',
    name: 'Physics aggregation',
    skill: 'Both together: rank four regions by coverage, often after a change the model never sees.',
    tasks: [['F1', 'Read'], ['F2', 'Mode'], ['F3', 'Material'], ['F4', 'Joint']],
    q: 'The input shows concrete ground. With the mapped ground materials, which region has the highest coverage?',
    model: 'GPT-6-Luna',
    said: 'R3',
    truth: 'R2',
    ok: false,
  },
]

function Training() {
  const data = useResults()
  const get = (n: string) => data?.rows.find((r) => r.name === n)?.scores
  const base = get('Qwen3.5-9B')
  const ours = get('Qwen3.5-9B-SFT-GRPO')
  const ref = get('GPT-6-Astra')
  const box = useRef<HTMLDivElement>(null)
  // First view: the trained bar grows out of the base model's bar, row by row.
  usePlayOnce(
    box,
    (el) =>
      [...el.querySelectorAll<HTMLElement>('.bar .ours')].map((b, i) =>
        b.animate(growKeyframes(Number(b.dataset.from) || 0), { duration: 650, delay: 60 + i * 65, easing: EASE_OUT, fill: 'backwards' }),
      ),
    [Boolean(base)],
  )
  if (!base || !ours || !ref) return null
  const rows = [
    { k: 'All', name: 'Overall' },
    { k: 'F', name: 'Physics aggregation' },
    { k: 'P', name: 'Channel reasoning' },
    { k: 'G4', name: 'Path reachability' },
  ]
  return (
    <div className="bars" ref={box}>
      {rows.map((r) => (
        <div className="bar-row" key={r.k}>
          <header>
            <b>{r.name}</b>
            <span>
              {base[r.k].toFixed(1)} → {ours[r.k].toFixed(1)}%
            </span>
          </header>
          <div className="bar" role="img" aria-label={`${r.name}: Qwen3.5-9B ${base[r.k]}%, after training ${ours[r.k]}%, GPT-6-Astra ${ref[r.k]}%`}>
            <i className="ours" data-from={(base[r.k] / ours[r.k]).toFixed(3)} style={{ width: `${ours[r.k]}%` }} />
            <i className="base" style={{ width: `${base[r.k]}%` }} />
            <span className="ref" style={{ left: `${ref[r.k]}%` }} />
          </div>
        </div>
      ))}
      <div className="bar-key">
        <span><i style={{ background: 'var(--bar-base)' }} />Qwen3.5-9B</span>
        <span><i style={{ background: 'var(--ours)' }} />after SFT and GRPO on engine data</span>
        <span><i style={{ background: 'var(--ink)', width: 4 }} />GPT-6-Astra</span>
      </div>
    </div>
  )
}

const released = Boolean(LINKS.arxiv)

export default function Home() {
  return (
    <>
      {/* The section bar sits on top from the start, so the light section wipes straight over the hero. */}
      <SubNav items={SECTIONS} cta={{ to: '/leaderboard', label: 'Leaderboard' }} />

      <section className="dark hero hero-pin">
        <div className="wrap hero-grid">
          <div>
            <p className="kicker">A physics-exact benchmark for vision-language models</p>
            <h1>RadioVISTA</h1>
            <p className="lede">
              Can vision-language models infer the radio field a city shapes from the buildings an image shows?
              <br />
              A ray-traced exam that reveals what vision-language models see in a city’s radio field, and what
              they miss.
            </p>
            <div className="btns">
              <RouteButton to="/leaderboard" primary>See the leaderboard</RouteButton>
            </div>
            <div className="links">
              {LINKS.arxiv ? <a href={LINKS.arxiv}>Paper</a> : <Link to="/paper">Paper</Link>}
              <Link to="/findings">Findings</Link>
              {LINKS.dataset ? <a href={LINKS.dataset}>Data</a> : <span className="off">Data soon</span>}
            </div>
          </div>
          <FieldReveal />
        </div>
      </section>

      {/* Everything after the hero scrolls up over it (see .hero-pin / .over in styles.css). */}
      <div className="over">

      <section className="band" id="overview">
        <div className="wrap">
          <div className="head">
            <p className="label">Seeing the invisible</p>
            <h2>From a coordinate to an exact physics exam</h2>
            <p>
              A city’s radio field is governed by the buildings and streets an image shows, yet it leaves no trace in any
              pixel. RadioVISTA tests whether models can infer it, and grades every answer against ray-traced physics.
            </p>
          </div>
          <div className="cards">
            {PILLARS.map((c) => (
              <a key={c.title} className="card" href={c.to}>
                <div className="media">
                  {c.img.map((src, i) => (
                    <img
                      key={src}
                      src={RV + src}
                      alt=""
                      loading="lazy"
                      style={i === 0 && c.img.length > 1 ? { filter: 'grayscale(0.2) brightness(0.8)' } : undefined}
                    />
                  ))}
                </div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </a>
            ))}
          </div>
          <p className="center">
            <Link className="more" to="/paper">Read the paper</Link>
          </p>
        </div>
      </section>

      <section className="band alt" id="engine">
        <div className="wrap">
          <div className="head">
            <p className="label">Global scene engine</p>
            <h2>Any coordinate on Earth becomes a ray-traceable city</h2>
            <p>
              Open building, terrain and land-cover data are welded into one mesh and traced with an extended Sionna
              RT. No human labels anything, so a new city or a new physical setting yields a fresh test suite.
            </p>
          </div>
          <WorldMap />
          <div className="stats">
            <div className="stat"><b>100</b><span>cities released, test cities never seen in training</span></div>
            <div className="stat"><b>6</b><span>continents, from Lusaka to Oslo</span></div>
            <div className="stat"><b>2&nbsp;km</b><span>per scene, traced on a 1&nbsp;m receiver grid</span></div>
            <div className="stat"><b>98%</b><span>of distance rings within 3&nbsp;dB of the Friis law in free space</span></div>
          </div>
          <CityStrip />
        </div>
      </section>

      <section className="band" id="fields">
        <div className="wrap">
          <div className="head">
            <p className="label">Matched ray tracing</p>
            <h2>One physical factor at a time</h2>
            <p>
              A field that sums every mechanism cannot reveal what each one contributes. Every scene is traced in three
              environments and four cumulative propagation modes, so each pair of fields isolates a single cause.
            </p>
          </div>
          <MatchedGrid />
          <div className="facts">
            <div><b>Exact answers</b>Every label is computed from the mesh and the twelve fields.</div>
            <div><b>Fair questions</b>Boundary cases that a small shift could flip are discarded.</div>
            <div><b>Hidden targets</b>On F2 to F4 the model sees one field and must predict the winner of another.</div>
          </div>
        </div>
      </section>

      <section className="band alt" id="exam">
        <div className="wrap">
          <div className="head">
            <p className="label">Physics exam</p>
            <h2>Twelve tasks in three parts</h2>
            <p>
              The tasks test the two competences a radio field requires and their combination. Each card shows one
              benchmark question and how a model answered it.
            </p>
          </div>
          <div className="groups">
            {GROUPS.map((g) => (
              <article className="group" key={g.k} style={{ ['--c' as string]: g.color }}>
                <header>
                  <span className="badge">{g.k}</span>
                  <h3>{g.name}</h3>
                </header>
                <p className="skill">{g.skill}</p>
                <ul className="tasks">
                  {g.tasks.map(([k, n]) => (
                    <li key={k}>
                      <b>{k}</b>
                      {n}
                    </li>
                  ))}
                </ul>
                <div className="q">
                  <p>{g.q}</p>
                  <dl>
                    <dt>{g.model}</dt>
                    <dd className={g.ok ? 'ok' : 'bad'}>
                      {g.said} {g.ok ? '(correct)' : '(wrong)'}
                    </dd>
                    <dt>Ground truth</dt>
                    <dd>{g.truth}</dd>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band" id="findings">
        <div className="wrap split">
          <div>
            <p className="label">Field–path dissociation</p>
            <h2>Models read the field but miss the path</h2>
            <div className="duo">
              <div className="hl">
                <b>94.8%</b>
                <span>GPT-6-Astra ranks regions of a field it never sees</span>
              </div>
              <div>
                <b>76.5%</b>
                <span>the same model decides whether one direct or one-wall path exists</span>
              </div>
            </div>
            <div className="body">
              <p>
                A field is the sum of its paths, so a model following physics would trace paths first. The strongest
                models do the opposite. Open models fail one step earlier and stay below random guessing even when
                credited for any of four attempts.
              </p>
            </div>
            <Link className="more" to="/findings">Read all three findings</Link>
          </div>
          <Dissociation />
        </div>
      </section>

      <section className="band alt" id="training">
        <div className="wrap split">
          <div>
            <p className="label">Training on engine data</p>
            <h2>Training teaches the field, not the path</h2>
            <div className="body">
              <p>
                Trained on 68 cities and tested on 17 it never saw, Qwen3.5-9B rises from 36.0% to 77.5% overall and
                comes close to GPT-6-Astra on physics aggregation.
              </p>
              <p>
                Path reachability does not move. Supervising only final answers conveys the field but leaves
                single-path geometry out of reach, which the reflection points computed by the engine can supply.
              </p>
            </div>
            <span className="note-bad">G4 stays at chance after SFT and GRPO</span>
          </div>
          <Training />
        </div>
      </section>

      <section className="band tight" id="cite">
        <div className="wrap">
          <div className="head">
            <p className="label">Results</p>
            <h2>See how 19 models read invisible fields</h2>
            <p>
              Every score from the paper, by task and by model, with the random baseline alongside.
              {!released && ' Paper, code and data go live with the arXiv release.'}
            </p>
          </div>
          <div className="btns" style={{ justifyContent: 'center', marginBottom: released ? 40 : 0 }}>
            <RouteButton to="/leaderboard" primary>See the leaderboard</RouteButton>
            {LINKS.arxiv ? <ResourceButton href={LINKS.arxiv}>Read the paper</ResourceButton> : <RouteButton to="/findings">Read the findings</RouteButton>}
            {LINKS.code && <ResourceButton href={LINKS.code}>Get the code</ResourceButton>}
            {LINKS.dataset && <ResourceButton href={LINKS.dataset}>Download the data</ResourceButton>}
          </div>
          {released && <CopyBlock text={BIBTEX} label="BibTeX citation" />}
        </div>
      </section>
      </div>
    </>
  )
}
