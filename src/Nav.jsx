import Flame from './Flame'
const L = [['#/', 'Map', 'মানচিত্র'], ['#/routes', 'Routes & Fare', 'যাতায়াত ও খরচ'], ['#/schedule', 'Schedule', 'তিথি'], ['#/vote', 'Vote', 'ভোট'], ['#/reps', 'Representatives', 'প্রতিনিধি'], ['#/sponsors', 'Sponsors', 'স্পনসর']]
export default function Nav({ lang, setLang, dark, setDark, tools, route }) {
  const cur = route || '#/'
  const on = (h) => (h === '#/' ? cur === '' || cur === '#' || cur === '#/' : cur.startsWith(h))
  return (
    <nav className="nav">
      {tools && <a href="#/" className="logo sm"><Flame size={16} /></a>}
      <div className="links">{L.map(([h, e, b]) => <a key={h} href={h} className={on(h) ? 'on' : ''}>{lang === 'bn' ? b : e}</a>)}</div>
      {tools && (
        <div className="tools">
          <button className="btn" onClick={() => setDark(!dark)}>{dark ? '☀' : '☾'}</button>
          <button className="btn" onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}>{lang === 'bn' ? 'English' : 'বাংলা'}</button>
        </div>
      )}
    </nav>
  )
}
