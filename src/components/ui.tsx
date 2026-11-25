import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
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
      <span className="btn soon">
        {children} <span className="note">soon<span className="sr-only">, not yet released</span></span>
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

export function CopyBlock({ text, label, copyLabel = 'Copy BibTeX' }: { text: string; label: string; copyLabel?: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('done')
    } catch {
      // Clipboard blocked: say so; the text stays selectable.
      setState('fail')
    }
    setTimeout(() => setState('idle'), 2400)
  }
  return (
    <div className="codeblock">
      <pre aria-label={label}>{text}</pre>
      <button className="copy" onClick={copy}>
        <span aria-live="polite">{state === 'done' ? 'Copied' : state === 'fail' ? 'Select and copy' : copyLabel}</span>
      </button>
    </div>
  )
}

/** Underlined tab strip that switches one panel in place (WAI-ARIA tabs: arrow keys move
 *  between tabs, only the current tab is in the Tab order). Render the panel with `tabPanelProps`. */
export function ViewTabs<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
  panelId,
}: {
  value: T
  options: { v: T; label: string }[]
  onChange: (v: T) => void
  label: string
  className?: string
  panelId: string
}) {
  const base = useId()
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.v === value)
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : null
    if (n === null) return
    e.preventDefault()
    const next = options[(n + options.length) % options.length]
    onChange(next.v)
    document.getElementById(`${base}-${next.v}`)?.focus()
  }
  return (
    <div className={`view-tabs ${className}`} role="tablist" aria-label={label} onKeyDown={onKey}>
      {options.map((o) => (
        <button
          key={o.v}
          id={`${base}-${o.v}`}
          type="button"
          role="tab"
          aria-selected={value === o.v}
          aria-controls={panelId}
          tabIndex={value === o.v ? 0 : -1}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
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
