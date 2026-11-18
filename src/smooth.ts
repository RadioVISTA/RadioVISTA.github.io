import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { prefersReducedMotion } from './data'

/** Site-wide smooth scrolling. Wheel and trackpad input glide to a stop instead of stepping;
 *  touch keeps the platform's own scrolling. In-page `#anchor` links glide too, stopping below
 *  the sticky header and section bar. Off for reduced motion, where the page scrolls natively. */
let lenis: Lenis | null = null

export function startSmoothScroll() {
  if (lenis || typeof window === 'undefined' || prefersReducedMotion()) return lenis
  // Anchor glides stop below the sticky bars through the page's own `scroll-padding-top`.
  lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 0.9,
    autoRaf: true,
    anchors: true,
  })
  return lenis
}

/** Jump to the top on route change without a glide. */
export function resetScroll() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}
