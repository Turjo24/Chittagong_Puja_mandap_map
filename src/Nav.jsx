import Flame from './Flame'

const L = [
  ['#/', 'Map', 'মানচিত্র'],
  ['#/routes', 'Routes & Fare', 'যাতায়াত ও খরচ'],
  ['#/schedule', 'Schedule', 'তিথি'],
  ['#/vote', 'Vote', 'ভোট'],
  ['#/reps', 'Representatives', 'প্রতিনিধি'],
  ['#/sponsors', 'Sponsors', 'স্পনসর'],
  ['#/player', 'Pujo Song', 'পূজার গান'],
]

export default function Nav({
  lang,
  setLang,
  dark,
  setDark,
  tools,
  route
}) {
  const cur = route || '#/'

  const on = (h) =>
    h === '#/'
      ? cur === '' || cur === '#' || cur === '#/'
      : cur.startsWith(h)

  return (
    <nav className="nav">

      {/* Logo */}
      {tools && (
        <a href="#/" className="logo sm">
          <Flame size={16} />
        </a>
      )}

      {/* Navigation Links */}
      <div className="links">

        {L.map(([h, e, b]) => (
          <a
            key={h}
            href={h}
            className={on(h) ? 'on' : ''}
          >
            {h === '#/player' && '🎵 '}
            {lang === 'bn' ? b : e}
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

    </nav>
  )
}