import { RouteButton } from '../components/ui'

export default function NotFound() {
  return (
    <section className="hero" style={{ minHeight: '60vh' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}>No signal at this address</h1>
        <p className="lede">The page you asked for does not exist. The leaderboard and findings are a click away.</p>
        <div className="btns">
          <RouteButton to="/" primary>Go to the home page</RouteButton>
          <RouteButton to="/leaderboard">See the leaderboard</RouteButton>
        </div>
      </div>
    </section>
  )
}
