import { useEffect, useRef, useState } from 'react'
import { RV, useCities, useManifest } from '../data'

const SPEED = 32 // px per second
const IDLE_MS = 2500 // resume this long after the last wheel / drag
const DRAG_PX = 6 // movement beyond this turns a press into a drag (no click)

/**
 * Twelve engine meshes on an endless, slowly drifting strip. The drift is a transform
 * animation (runs on the compositor, sub-pixel smooth, unaffected by main-thread load);
 * wheel, drag and swipe move the same animation by hand. Hover or press a city to lay
 * its simulated field over the render.
 */
export default function CityStrip() {
  const m = useManifest()
  const cities = useCities()
  const [on, setOn] = useState<string | null>(null)
  const byId = Object.fromEntries((cities ?? []).map((c) => [c.id, c]))
  const view = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const pressed = useRef<string | null>(null)
  const sync = useRef<() => void>(() => {})
  const n = m?.gallery.length ?? 0

  useEffect(() => {
    const vp = view.current
    const tr = track.current
    if (!vp || !tr || n === 0) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let anim: Animation | null = null
    let period = 0
    let hover = false
    let focus = false
    let holdUntil = 0
    let holdTimer = 0

    // Width of one full set: distance from the first tile to its first clone.
    const measure = () => {
      const kids = tr.children as HTMLCollectionOf<HTMLElement>
      return kids.length > n ? kids[n].offsetLeft - kids[0].offsetLeft : 0
    }
    const offset = () => (anim && period ? ((Number(anim.currentTime ?? 0) / 1000) * SPEED) % period : 0)
    const setOffset = (x: number) => {
      if (!anim || !period) return
      const w = ((x % period) + period) % period
      anim.currentTime = (w / SPEED) * 1000
    }

    const build = () => {
      const p = measure()
      if (p <= 0) return
      const keep = period ? offset() / period : 0
      anim?.cancel()
      period = p
      anim = tr.animate([{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${-p}px,0,0)` }], {
        duration: (p / SPEED) * 1000,
        iterations: Infinity,
      })
      setOffset(keep * p)
      update()
    }

    const update = () => {
      if (!anim) return
      const paused = hover || focus || pressed.current !== null || performance.now() < holdUntil || reduce.matches
      if (paused) anim.pause()
      else anim.play()
    }
    sync.current = update

    const hold = () => {
      holdUntil = performance.now() + IDLE_MS
      clearTimeout(holdTimer)
      holdTimer = window.setTimeout(update, IDLE_MS + 20)
      update()
    }

    // Wheel: horizontal (or shift+vertical) moves the strip; plain vertical scrolls the page.
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
      if (!dx) return
      e.preventDefault()
      setOffset(offset() + dx)
      hold()
    }

    // Drag / swipe (touch-action: pan-y leaves vertical page scroll to the browser).
    let startX = 0
    let startOff = 0
    let down = false
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      down = true
      dragged.current = false
      startX = e.clientX
      startOff = offset()
      hold()
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (!dragged.current && Math.abs(dx) > DRAG_PX) {
        dragged.current = true
        vp.setPointerCapture(e.pointerId)
      }
      if (dragged.current) {
        setOffset(startOff - dx)
        hold()
      }
    }
    const onUp = () => {
      down = false
    }
    const enter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') { hover = true; update() }
    }
    const leave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') { hover = false; update() }
    }
    const fin = () => { focus = true; update() }
    const fout = () => { focus = false; update() }

    const ro = new ResizeObserver(build)
    ro.observe(vp)
    ro.observe(tr)
    reduce.addEventListener('change', update)
    vp.addEventListener('wheel', onWheel, { passive: false })
    vp.addEventListener('pointerdown', onDown)
    vp.addEventListener('pointermove', onMove)
    vp.addEventListener('pointerup', onUp)
    vp.addEventListener('pointercancel', onUp)
    vp.addEventListener('pointerenter', enter)
    vp.addEventListener('pointerleave', leave)
    vp.addEventListener('focusin', fin)
    vp.addEventListener('focusout', fout)
    build()
    return () => {
      ro.disconnect()
      clearTimeout(holdTimer)
      anim?.cancel()
      sync.current = () => {}
      reduce.removeEventListener('change', update)
      vp.removeEventListener('wheel', onWheel)
      vp.removeEventListener('pointerdown', onDown)
      vp.removeEventListener('pointermove', onMove)
      vp.removeEventListener('pointerup', onUp)
      vp.removeEventListener('pointercancel', onUp)
      vp.removeEventListener('pointerenter', enter)
      vp.removeEventListener('pointerleave', leave)
      vp.removeEventListener('focusin', fin)
      vp.removeEventListener('focusout', fout)
    }
  }, [n])

  // Pause while a city's field is shown.
  useEffect(() => {
    pressed.current = on
    sync.current()
  }, [on])

  // Two copies so the strip can wrap seamlessly; the second is hidden from assistive tech.
  const items = m ? [...m.gallery.map((g) => ({ g, clone: false })), ...m.gallery.map((g) => ({ g, clone: true }))] : []

  return (
    <>
      <div className="cities" ref={view}>
        <div className="cities-track" ref={track}>
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
                onClick={() => {
                  if (dragged.current) return
                  setOn(on === g.id ? null : g.id)
                }}
              >
                <span className="frame">
                  <img className="r" src={RV + g.render.replace('.webp', '_s.webp')} alt="" decoding="async" draggable={false} />
                  <img className="f" src={RV + g.field.replace('.webp', '_s.webp')} alt="" loading="lazy" decoding="async" draggable={false} />
                </span>
                <span className="name">
                  {name}
                  {c && <small>{c.country_code}</small>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <p className="strip-hint">Each tile is a 2 km engine mesh. Hover or tap one to lay its simulated field over it.</p>
    </>
  )
}
