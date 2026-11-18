import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Paper figure on a white plate (the figures are drawn for a white page). Opens full size in a dialog. */
export function Plate({ src, alt }: { src: string; alt: string }) {
  const dlg = useRef<HTMLDialogElement>(null)
  return (
    <figure className="plate">
      <button className="paper" onClick={() => dlg.current?.showModal()} aria-label={`Enlarge: ${alt}`}>
        <img src={src} alt={alt} loading="lazy" />
      </button>
      <dialog ref={dlg} className="lightbox" aria-label={alt}>
        <button onClick={() => dlg.current?.close()} aria-label="Close">
          <img src={src} alt="" />
        </button>
      </dialog>
    </figure>
  )
}

/** External resource button. href null renders a dashed "soon" state instead of a dead link. */
export function ResourceButton({ href, children, primary }: { href: string | null; children: ReactNode; primary?: boolean }) {
  if (!href)
    return (
      <span className="btn soon" title="Available with the arXiv release">
        {children} <span className="note">soon</span>
      </span>
    )
  return (
    <a className={`btn${primary ? ' primary' : ''}`} href={href}>
      {children}
    </a>
  )
}

export function RouteButton({ to, children, primary }: { to: string; children: ReactNode; primary?: boolean }) {
  return (
    <Link className={`btn${primary ? ' primary' : ''}`} to={to}>
      {children}
    </Link>
  )
}

export function CopyBlock({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 1600)
    } catch {
      /* clipboard unavailable: the text stays selectable */
    }
  }
  return (
    <div className="codeblock">
      <pre aria-label={label}>{text}</pre>
      <button className="copy" onClick={copy}>
        {done ? 'Copied' : 'Copy BibTeX'}
      </button>
    </div>
  )
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { v: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
