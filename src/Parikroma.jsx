import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { DAYS, dayLabel } from './parikromaUtil'


const CSS = `
.pk {
  --pk: #e8590c;
  /* parent flex/grid hole o jeno pura width ney, shoru hoye kone na boshe */
  box-sizing: border-box; display: block;
  width: 100%; max-width: 44rem; min-width: 0;
  flex: 1 1 100%; align-self: stretch; justify-self: stretch; grid-column: 1 / -1;
  margin-left: auto; margin-right: auto;
  padding: 24px 16px 48px;
}
.pk *, .pk *::before, .pk *::after { box-sizing: border-box; }
.pk h2 { font-size: 1.75rem; font-weight: 700; line-height: 1.2; margin: 0 0 4px; }
.pk .pk-sub { font-size: .9rem; opacity: .7; margin: 0 0 18px; }

.pk-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 18px; scrollbar-width: none; }
.pk-tabs::-webkit-scrollbar { display: none; }
.pk-tab {
  flex: none; cursor: pointer; font: inherit; font-size: .9rem; color: inherit;
  padding: 7px 16px; border-radius: 999px;
  border: 1px solid rgba(128,128,128,.3);
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  background: transparent;
}
.pk-tab:focus-visible { outline: 2px solid var(--pk); outline-offset: 2px; }
.pk-tab[aria-pressed="true"] { background: var(--pk); border-color: var(--pk); color: #fff; font-weight: 600; }

.pk-list { display: flex; flex-direction: column; gap: 16px; }
.pk-card {
  border-radius: 20px; padding: 18px 16px 14px;
  border: 1px solid rgba(128,128,128,.25);
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  box-shadow: inset 4px 0 0 var(--pk);
  overflow: hidden;
  background: rgba(128,128,128,.06);
  background: color-mix(in srgb, currentColor 4%, transparent);
}
.pk-head { display: flex; gap: 12px; align-items: flex-start; }
.pk-badge {
  flex: none; min-width: 2.2rem; height: 2.2rem; padding: 0 8px; border-radius: 12px;
  display: grid; place-items: center; font-size: .9rem; font-weight: 700; color: #fff;
  background: var(--pk);
}
.pk-title { font-size: 1.05rem; font-weight: 600; line-height: 1.45; margin: 0; }

.pk-meta { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 14px; font-size: .78rem; }
.pk-pill {
  padding: 3px 10px; border-radius: 999px;
  background: rgba(232,89,12,.14);
  background: color-mix(in srgb, var(--pk) 14%, transparent);
  color: inherit;
}
.pk-pill.time { background: rgba(128,128,128,.14); background: color-mix(in srgb, currentColor 10%, transparent); }

.pk-sec + .pk-sec { margin-top: 16px; }
.pk-sec-h { font-size: .92rem; font-weight: 600; margin: 0 0 8px; display: flex; gap: 8px; align-items: baseline; }
.pk-sec-h small { font-weight: 400; opacity: .6; font-size: .78rem; }

.pk-path { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 6px; }
.pk-path li { display: inline-flex; align-items: center; gap: 6px; margin: 0; padding: 0; }
.pk-path li:not(:last-child)::after {
  content: '→'; font-size: 1rem; line-height: 1; color: var(--pk); opacity: .7; padding: 0 2px;
}
.pk-stop {
  display: inline-flex; align-items: center; gap: 8px; max-width: 100%;
  padding: 6px 14px 6px 6px; border-radius: 999px; line-height: 1.35;
  background: rgba(232,89,12,.1);
  background: color-mix(in srgb, var(--pk) 10%, transparent);
  border: 1px solid rgba(232,89,12,.28);
  border: 1px solid color-mix(in srgb, var(--pk) 26%, transparent);
}
.pk-n {
  flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center;
  font-size: .72rem; font-weight: 700; color: #fff; background: var(--pk);
}
.pk-empty { opacity: .65; padding: 24px 0; text-align: center; }
`

export default function Parikroma() {
  const [list, setList] = useState([])
  const [day, setDay] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.from('parikromas').select('*').order('sort').order('created_at').then(({ data }) => {
      setList(data || [])
      setLoading(false)
    })
  }, [])

  // din select na thakle route ta protidin dekhabe
  const shown = list
    .map((r, i) => ({ r, no: i + 1 }))
    .filter(({ r }) =>
      day === 'all' || !(r.days || []).length || r.days.some((d) => String(d).toLowerCase() === day))

  return (
    <div className="pk">
      <style>{CSS}</style>

      <h2>Puja Porikroma</h2>
      <p className="pk-sub">Kon din kon route e mandap ghurbe, din select kore dekho.</p>

      <div className="pk-tabs" role="group" aria-label="Din">
        {[['all', 'Sob'], ...DAYS].map(([k, l]) => (
          <button key={k} className="pk-tab" aria-pressed={day === k} onClick={() => setDay(k)}>
            {l}
          </button>
        ))}
      </div>

      {loading && <p className="pk-empty">Loading...</p>}
      {!loading && !shown.length && <p className="pk-empty">Ei dine kono porikroma nai. Onno din select koro.</p>}

      <div className="pk-list">
        {shown.map(({ r, no }) => (
          <article key={r.id} className="pk-card">
            <div className="pk-head">
              <span className="pk-badge">{no}</span>
              <h3 className="pk-title">{r.title}</h3>
            </div>

            <div className="pk-meta">
              {(r.days || []).length
                ? r.days.map((k) => <span key={k} className="pk-pill">{dayLabel(k)}</span>)
                : <span className="pk-pill">Protidin</span>}
              {r.time_note && <span className="pk-pill time">🕘 {r.time_note}</span>}
            </div>

            {(r.sections || []).map((s, i) => (
              <div key={i} className="pk-sec">
                {s.heading && (
                  <h4 className="pk-sec-h">{s.heading} <small>{(s.stops || []).length} ta jaiga</small></h4>
                )}
                <ol className="pk-path">
                  {(s.stops || []).map((p, j) => (
                    <li key={j}>
                      <span className="pk-stop">
                        <span className="pk-n">{j + 1}</span>
                        {p}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  )
}