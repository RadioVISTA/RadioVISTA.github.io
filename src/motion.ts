import { useEffect, type RefObject } from 'react'
import { prefersReducedMotion } from './data'

export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** First-view motion that never shows the final state and then jumps back to the start.
 *  `build` creates the element's animations (with `fill: 'backwards'`). They are created and
 *  paused while the element is still approaching the viewport, so their first frame is already
 *  applied, and they play once it is mostly on screen. Content is final by default: without
 *  scripts or with reduced motion nothing is built. */
export function usePlayOnce(ref: RefObject<Element | null>, build: (el: Element) => Animation[], deps: unknown[] = []) {
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return
    let anims: Animation[] | null = null
    const arm = () => {
      if (anims) return
      anims = build(el)
      anims.forEach((a) => a.pause())
    }
    const armIo = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        armIo.disconnect()
        arm()
      },
      { rootMargin: '0px 0px 30% 0px' },
    )
    const playIo = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        playIo.disconnect()
        armIo.disconnect()
        arm()
        anims?.forEach((a) => a.play())
      },
      { threshold: 0.45 },
    )
    armIo.observe(el)
    playIo.observe(el)
    return () => {
      armIo.disconnect()
      playIo.disconnect()
      anims?.forEach((a) => a.finish())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Reveal a bar from `from` (0–1 of its length) to full with a clip, so its rounded end cap
 *  and gradient stay fixed while it grows. */
export const growKeyframes = (from: number, radius = 7): Keyframe[] => [
  { clipPath: `inset(0 ${((1 - from) * 100).toFixed(2)}% 0 0 round ${radius}px)` },
  { clipPath: `inset(0 0% 0 0 round ${radius}px)` },
]
