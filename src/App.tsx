import { useEffect, useState } from 'react'
import { CALCULATORS, GROUPS } from './calculators/registry'
import { KeypadProvider } from './ui/Keypad'

const WIDE = '(min-width: 900px)'

function currentId(): string {
  const id = location.hash.replace(/^#\/?/, '')
  return CALCULATORS.some((c) => c.id === id) ? id : CALCULATORS[0].id
}

export function App() {
  const [id, setId] = useState(currentId)
  const [navOpen, setNavOpen] = useState(() => matchMedia(WIDE).matches)

  useEffect(() => {
    const onHash = () => setId(currentId())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  const calc = CALCULATORS.find((c) => c.id === id)!
  const select = (next: string) => {
    location.hash = `/${next}`
    if (!matchMedia(WIDE).matches) setNavOpen(false)
  }

  return (
    <KeypadProvider>
    <div className={`app ${navOpen ? 'nav-open' : ''}`}>
      <div className="backdrop" onClick={() => setNavOpen(false)} />
      <nav className="nav" aria-label="Calculators" aria-hidden={!navOpen}>
        <div className="nav-brand">Pilot Calc</div>
        {GROUPS.map((g) => {
          const items = CALCULATORS.filter((c) => c.group === g.id)
          return (
            <div key={g.id} className="nav-group">
              <h2>{g.title}</h2>
              {items.length === 0 && <div className="nav-empty">Coming soon</div>}
              {items.map((c) => (
                <button
                  key={c.id}
                  className={`nav-item ${c.id === id ? 'active' : ''}`}
                  tabIndex={navOpen ? 0 : -1}
                  onClick={() => select(c.id)}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )
        })}
      </nav>
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" aria-label={navOpen ? 'Close menu' : 'Open menu'} onClick={() => setNavOpen((o) => !o)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1>{calc.title}</h1>
            <div className="subtitle">{calc.subtitle}</div>
          </div>
        </header>
        <main className="content">
          <calc.Page key={calc.id} />
        </main>
      </div>
    </div>
    </KeypadProvider>
  )
}
