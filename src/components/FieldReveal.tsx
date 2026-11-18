import { useEffect, useRef, useState } from 'react'
import { RV, prefersReducedMotion, useManifest } from '../data'

const R = 18 // lens radius, % of the frame
const OPEN_MS = 900 // page load: the lens opens from a point
const CLOSE_MS = 450 // back from the whole field: the field closes down into the lens
const COVER = 75 // a radius that covers the frame from anywhere inside it
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

/** The ray-traced city as a camera would see it. A lens follows the pointer and shows the
 *  simulated field underneath. On load the lens opens from a point while one radio pulse
 *  rings out from it; then it drifts on its own until the pointer takes over. The drift
 *  pauses while the hero is off screen. */
export default function FieldReveal() {
  const m = useManifest()
  const ref = useRef<HTMLDivElement>(null)
  const [full, setFull] = useState(false)
  const [ready, setReady] = useState(false) // field image decoded, so the opening is visible
  const pulsed = useRef(false) // the radio pulse rings once per page load, never on the toggle
  const wasFull = useRef(false)
  const ping = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || full || !ready) return
    const set = (x: number, y: number) => {
      el.style.setProperty('--x', `${x}%`)
      el.style.setProperty('--y', `${y}%`)
    }
    if (prefersReducedMotion()) {
      set(62, 50)
      el.style.setProperty('--r', `${R}%`)
      return
    }
    const fromFull = wasFull.current
    const [r0, dur] = fromFull ? [COVER, CLOSE_MS] : [0, OPEN_MS]
    if (!pulsed.current && !fromFull && ping.current) {
      pulsed.current = true
      ping.current.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0.15)', opacity: 0.9 },
          { transform: 'translate(-50%, -50%) scale(2.4)', opacity: 0 },
        ],
        { duration: 1600, delay: 150, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' },
      )
    }
    let raf = 0
    let manual = false
    let visible = true
    let inView = true
    let covered = false
    const t0 = performance.now()
    const frame = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      el.style.setProperty('--r', `${r0 + (R - r0) * easeOut(p)}%`)
      if (!manual) {
        const s = Math.max(0, t - t0 - dur * 0.6) / 1000
        set(50 + 24 * Math.sin(s * 0.23), 50 + 20 * Math.sin(s * 0.31 + 1))
      }
      if (visible) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    // Run only while the lens can be seen: on screen, and (home page, where the hero is pinned)
    // not yet covered by the section sliding over it. A sticky hero never leaves the viewport, so
    // the observer alone would keep the loop repainting for the whole page.
    const sync = () => {
      const was = visible
      visible = inView && !covered
      if (visible && !was) raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      sync()
    })
    io.observe(el)
    const cover = el.closest('.hero-pin')?.parentElement?.querySelector<HTMLElement>('.over')
    const onScroll = () => {
      if (!cover) return
      const bars = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      covered = cover.getBoundingClientRect().top <= bars
      sync()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    const move = (e: PointerEvent) => {
      manual = true
      const b = el.getBoundingClientRect()
      set(((e.clientX - b.left) / b.width) * 100, ((e.clientY - b.top) / b.height) * 100)
    }
    const leave = () => {
      manual = false
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      el.style.setProperty('--r', `${R}%`)
    }
  }, [full, ready])

  useEffect(() => {
    wasFull.current = full
  }, [full])

  return (
    <div>
      <div
        ref={ref}
        className={`reveal${full ? ' full' : ''}`}
        role="img"
        aria-label="A 1 km block of central Rome around the Colosseum, rendered from the engine mesh, with its simulated radio field shown inside a moving lens"
      >
        {m && (
          <>
            <img className="city" src={RV + m.hero.render} alt="" fetchPriority="high" />
            <img className="field" src={RV + m.hero.field} alt="" onLoad={() => setReady(true)} />
          </>
        )}
        <div className="lens" />
        <div className="ping" ref={ping} aria-hidden="true" />
      </div>
      <div className="reveal-meta">
        <span className="scale">
          −110 <i /> −20&nbsp;dBm
        </span>
        <button className="toggle" type="button" onClick={() => setFull((f) => !f)}>
          {full ? 'Use the lens' : 'Show the whole field'}
        </button>
      </div>
    </div>
  )
}
