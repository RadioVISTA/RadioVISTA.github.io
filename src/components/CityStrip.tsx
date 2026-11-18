import { useEffect, useRef, useState } from 'react'
import { RV, useCities, useManifest } from '../data'

const SPEED = 32 // px per second
const IDLE_MS = 2500 // resume this long after the last manual scroll / touch

/** Twelve engine meshes on an endless, slowly drifting strip. Hover or press a city to lay its simulated field over the render. */
export default function CityStrip() {
  const m = useManifest()
  const cities = useCities()
  const [on, setOn] = useState<string | null>(null)
  const byId = Object.fromEntries((cities ?? []).map((c) => [c.id, c]))
  const ref = useRef<HTMLDivElement>(null)
  const onRef = useRef(on)
  onRef.current = on
  const n = m?.gallery.length ?? 0

  useEffect(() => {
    const el = ref.current
    if (!el || n === 0) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let pos = el.scrollLeft
    let last = performance.now()
    let hover = false
    let focus = false
    let holdUntil = 0
    let raf = 0

    // Width of one full set: distance from the first tile to its first clone.
    const period = () => {
      const kids = el.children as HTMLCollectionOf<HTMLElement>
      return kids.length > n ? kids[n].offsetLeft - kids[0].offsetLeft : 0
    }
    const wrap = (x: number) => {
      const p = period()
      if (p <= 0) return x
      return ((x % p) + p) % p
    }

    const tick = (t: number) => {
      const dt = Math.min(t - last, 100)
      last = t
      const paused = hover || focus || onRef.current !== null || t < holdUntil || reduce.matches || document.hidden
      if (!paused) {
        pos = wrap(pos + (SPEED * dt) / 1000)
        el.scrollLeft = pos
      }
      raf = requestAnimationFrame(tick)
    }

    // Manual scrolling (wheel, drag, swipe): adopt its position, keep it endless, pause briefly.
    const onScroll = () => {
      if (Math.abs(el.scrollLeft - pos) > 2) {
        holdUntil = performance.now() + IDLE_MS
        const w = wrap(el.scrollLeft)
        pos = w
        if (Math.abs(w - el.scrollLeft) > 1) el.scrollLeft = w
      }
    }
    const hold = () => { holdUntil = performance.now() + IDLE_MS }
    const enter = () => { hover = true }
    const leave = () => { hover = false }
    const fin = () => { focus = true }
    const fout = () => { focus = false }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('pointerdown', hold)
    el.addEventListener('touchstart', hold, { passive: true })
    el.addEventListener('focusin', fin)
    el.addEventListener('focusout', fout)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerdown', hold)
      el.removeEventListener('touchstart', hold)
      el.removeEventListener('focusin', fin)
      el.removeEventListener('focusout', fout)
    }
  }, [n])

  // Two copies so the strip can wrap seamlessly; the second is hidden from assistive tech.
  const items = m ? [...m.gallery.map((g) => ({ g, clone: false })), ...m.gallery.map((g) => ({ g, clone: true }))] : []

  return (
    <>
      <div className="cities" ref={ref}>
        {items.map(({ g, clone }) => {
          const c = byId[g.id]
          const name = c?.name ?? g.id
          return (
            <button
              key={(clone ? 'b-' : 'a-') + g.id}
              className="ctile"
              aria-pressed={on === g.id}
              aria-label={`${name}: show its simulated field`}
              aria-hidden={clone || undefined}
              tabIndex={clone ? -1 : undefined}
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
      <p className="strip-hint">Each tile is a 2 km engine mesh. Hover or tap one to lay its simulated field over it.</p>
    </>
  )
}
