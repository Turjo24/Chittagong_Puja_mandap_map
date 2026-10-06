import { useEffect, useState } from 'react'
import { sb } from './supabase'
const at = (d) => new Date(d + 'T00:00:00+06:00')

export default function Schedule({ lang }) {
  const bn = lang === 'bn'
  const [list, setList] = useState([]), [now, setNow] = useState(Date.now())
  useEffect(() => {
    sb.from('schedule').select('*').order('day').then(({ data }) => setList(data || []))
    const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i)
  }, [])
  const next = list.find((x) => at(x.day) > now)
  const diff = next ? at(next.day) - now : 0
  const box = [[Math.floor(diff / 864e5), bn ? 'দিন' : 'Days'], [Math.floor(diff / 36e5) % 24, bn ? 'ঘণ্টা' : 'Hours'], [Math.floor(diff / 6e4) % 60, bn ? 'মিনিট' : 'Min'], [Math.floor(diff / 1e3) % 60, bn ? 'সেকেন্ড' : 'Sec']]
  const fmt = (d) => at(d).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dhaka' })
  const dnum = (d) => at(d).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { day: 'numeric', timeZone: 'Asia/Dhaka' })
  const mon = (d) => at(d).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { month: 'short', timeZone: 'Asia/Dhaka' })
  return (
    <div className="page"><div className="wrap">
      <div className="shero">
        <h2 className="title">{bn ? 'পূজার তিথি ও সূচি' : 'Puja Schedule'}</h2>
        {next && <p className="muted">{bn ? 'পরবর্তী' : 'Next'}: <b>{bn && next.title_bn ? next.title_bn : next.title}</b></p>}
        {next && <div className="count">{box.map(([n, l]) => <div key={l}><b>{String(n).padStart(2, '0')}</b><small>{l}</small></div>)}</div>}
      </div>
      <div className="tl">
        {list.map((x) => (
          <div className={'ti' + (at(x.day) <= now - 864e5 ? ' past' : '')} key={x.id}>
            <div className="d">{dnum(x.day)}<small>{mon(x.day)}</small></div>
            <div><b className="rt">{bn && x.title_bn ? x.title_bn : x.title}</b><br />
              <span className="muted">{fmt(x.day)}{x.note && ` · ${x.note}`}</span></div>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 16 }}>{bn ? '* তারিখ পঞ্জিকা ও সরকারি ঘোষণা অনুযায়ী পরিবর্তন হতে পারে।' : '* Dates may change per the official calendar and announcements.'}</p>
    </div></div>
  )
}
