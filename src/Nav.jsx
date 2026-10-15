import { useEffect, useRef, useState } from 'react'
import Flame from './Flame'

const L = [
  ['#/', 'Map', 'মানচিত্র'],
  ['#/routes', 'Routes & Fare', 'যাতায়াত ও খরচ'],
  ['#/schedule', 'Schedule', 'তিথি'],
  ['#/vote', 'Vote', 'ভোট'],
  ['#/reps', 'Representatives', 'প্রতিনিধি'],
  ['#/sponsors', 'Sponsors', 'স্পনসর'],
  ['#/player', 'Pujo Song', 'পূজার গান'],
  ['#/parikroma', 'Parikrama', 'পরিক্রমা'],
  ['#/about', 'About', 'সম্পর্কে'],
  ['#/tutorial', 'Tutorial', 'টিউটোরিয়াল'],
  ['#/blog', 'Blog', 'ব্লগ'],
  ['#/zones', 'Zones', 'জোন']
]

// Shudhu mobile er extra CSS. Rong / theme tomar purano CSS (.nav, .links, .on, .btn) theke-i ashe,
// ekhane kono hard-coded color nai. Dropdown er background nav theke inherit kore.
const CSS = `
.nav .nav-burger, .nav .nav-cur { display: none; }

@media (max-width: 900px) {
  .nav { flex-wrap: nowrap; align-items: center; gap: 8px; }
  .nav .nav-cur {
    display: block; flex: 1 1 auto; min-width: 0; font-weight: 700; font-size: 15px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .nav .nav-burger {
    display: inline-flex; align-items: center; justify-content: center;
    flex: 0 0 auto; min-width: 40px; min-height: 36px;
  }
  .nav .tools { margin-left: 0; flex: 0 0 auto; }
  .nav .tools .btn { white-space: nowrap; }

  .nav .links { display: none !important; }
  .nav .links.nav-open {
    display: flex !important; flex-direction: column; flex-wrap: nowrap; gap: 2px;
    position: fixed; left: 0; right: 0; width: auto; margin: 0;
    box-sizing: border-box; padding: 8px 10px 12px; overflow-x: hidden; overflow-y: auto;
    background: inherit; z-index: 1000;
    border-bottom: 1px solid rgba(128,128,128,.35);
    box-shadow: 0 12px 24px rgba(0,0,0,.22);
  }
  .nav .links.nav-open a {
    display: block; padding: 13px 14px; font-size: 16px; white-space: normal;
  }
}
`

export default function Nav({
  lang,
  setLang,
  dark,
  setDark,
  tools,
  route
}) {
  const [open, setOpen] = useState(false)
  const [top, setTop] = useState(56)
  const navRef = useRef(null)
  const cur = route || '#/'

  const on = (h) =>
    h === '#/'
      ? cur === '' || cur === '#' || cur === '#/'
      : cur.startsWith(h)

  const label = (e, b) => (lang === 'bn' ? b : e)
  const active = L.find(([h]) => on(h))

  // Dropdown ta nav er theek niche boshbe (nav er height jai hok)
  const place = () => {
    if (navRef.current) setTop(Math.round(navRef.current.getBoundingClientRect().bottom))
  }

  const toggle = () => {
    if (!open) place()
    setOpen((o) => !o)
  }

  // Page change hole menu bondho
  useEffect(() => { setOpen(false) }, [cur])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false)
      else place()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', place, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', place)
    }
  }, [])

  return (
    <nav className="nav" ref={navRef}>
      <style>{CSS}</style>

      {/* Logo */}
      {tools && (
        <a href="#/" className="logo sm">
          <Flame size={16} />
        </a>
      )}

      {/* Mobile e ekhon kon page e achi */}
      <span className="nav-cur">
        {active ? (active[0] === '#/player' ? '🎵 ' : '') + label(active[1], active[2]) : ''}
      </span>

      {/* Navigation Links (desktop: age jemon, mobile: dropdown) */}
      <div
        className={'links' + (open ? ' nav-open' : '')}
        style={open ? { top, maxHeight: `calc(100dvh - ${top}px)` } : undefined}
      >
        {L.map(([h, e, b]) => (
          <a
            key={h}
            href={h}
            className={on(h) ? 'on' : ''}
            onClick={() => setOpen(false)}
          >
            {h === '#/player' && '🎵 '}
            {label(e, b)}
          </a>
        ))}
      </div>

      {/* Right Side Tools */}
      {tools && (
        <div className="tools">

          {/* Dark / Light */}
          <button
            className="btn"
            onClick={() => setDark(!dark)}
          >
            {dark ? '☀' : '☾'}
          </button>

          {/* Language */}
          <button
            className="btn"
            onClick={() =>
              setLang(lang === 'bn' ? 'en' : 'bn')
            }
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>

        </div>
      )}

      {/* Hamburger (shudhu mobile e) */}
      <button
        className="btn nav-burger"
        onClick={toggle}
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? '✕' : '☰'}
      </button>
    </nav>
  )
}