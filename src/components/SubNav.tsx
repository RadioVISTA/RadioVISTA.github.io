import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export interface SubNavItem {
  id: string
  label: string
}

/** Dark sticky section bar. The link of the section in view is marked as current, and one
 *  underline slides between links so the move from section to section reads as one motion. */
export default function SubNav({ items, cta }: { items: SubNavItem[]; cta: { to: string; label: string } }) {
  const [active, setActive] = useState(items[0]?.id)
  const nav = useRef<HTMLElement>(null)
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: '-120px 0px -55% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [items])

  useLayoutEffect(() => {
    const place = () => {
      const a = nav.current?.querySelector<HTMLAnchorElement>(`a[href="#${active}"]`)
      if (!a || !bar.current) return
      bar.current.style.transform = `translateX(${a.offsetLeft}px) scaleX(${a.offsetWidth / 100})`
      bar.current.style.opacity = '1'
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [active])

  return (
    <div className="subnav">
      <div className="wrap subnav-inner">
        <nav aria-label="On this page" ref={nav}>
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} aria-current={active === i.id ? 'true' : undefined}>
              {i.label}
            </a>
          ))}
          <span className="subnav-bar" ref={bar} aria-hidden="true" />
        </nav>
        <Link className="btn primary" to={cta.to}>
          {cta.label}
        </Link>
      </div>
    </div>
  )
}
