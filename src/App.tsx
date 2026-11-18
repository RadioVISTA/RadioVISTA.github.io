import { Suspense, lazy, useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Findings = lazy(() => import('./pages/Findings'))
const Paper = lazy(() => import('./pages/Paper'))
import NotFound from './pages/NotFound'
import { LINKS } from './site'

const NAV = [
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/findings', label: 'Findings' },
  { to: '/paper', label: 'Paper' },
]

const TITLES: Record<string, string> = {
  '/': 'RadioVISTA: Seeing the Invisible',
  '/index.html': 'RadioVISTA: Seeing the Invisible',
  '/leaderboard': 'Leaderboard | RadioVISTA',
  '/findings': 'Findings | RadioVISTA',
  '/paper': 'Paper | RadioVISTA',
}

function RouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'Page not found | RadioVISTA'
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <RouteEffects />
      <header className="topbar">
        <div className="wrap topbar-inner">
          <NavLink to="/" className="brand" aria-label="RadioVISTA home">
            <img src="/brand/icon-64.png" alt="" width={30} height={30} />
            <span className="wordmark">
              Radio<b>VISTA</b>
            </span>
          </NavLink>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}>
                {n.label}
              </NavLink>
            ))}
            <a className="gh" href={LINKS.github}>
              GitHub
            </a>
          </nav>
        </div>
      </header>
      <main id="main">
        <Suspense fallback={<div className="page-loading" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/index.html" element={<Home />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/findings" element={<Findings />} />
          <Route path="/paper" element={<Paper />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <footer className="footer">
        <div className="wrap footer-inner">
          <span>RadioVISTA@2026</span>
          <div className="footer-logos">
            <img src="/brand/maxwell.png" alt="Maxwell" />
            <img src="/brand/bjtu-mimo.png" alt="MIMO" />
          </div>
        </div>
      </footer>
    </>
  )
}
