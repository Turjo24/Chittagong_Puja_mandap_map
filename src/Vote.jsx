import { useEffect, useState } from 'react'
import { sb } from './supabase'

export default function Vote({ lang }) {
  const bn = lang === 'bn'
  const [ms, setMs] = useState([]), [res, setRes] = useState([]), [pick, setPick] = useState([])
  const [email, setEmail] = useState(''), [msg, setMsg] = useState(''), [voted, setVoted] = useState(!!localStorage.getItem('voted'))
  const key = localStorage.getItem('vk') || (() => { const k = crypto.randomUUID(); localStorage.setItem('vk', k); return k })()
  const loadRes = () => sb.rpc('vote_results').then(({ data }) => setRes(data || []))
  useEffect(() => {
    sb.from('mandaps').select('id,name,name_bn,area').eq('status', 'approved').order('name').then(({ data }) => setMs(data || []))
    loadRes(); const i = setInterval(loadRes, 20000); return () => clearInterval(i)
  }, [])
  const nm = (m) => (bn && m.name_bn ? m.name_bn : m.name)
  const toggle = (id) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 5 ? [...p, id] : p))
  async function submit(e) {
    e.preventDefault(); setMsg('')
    const { error } = await sb.rpc('cast_votes', { p_key: key, p_email: email.trim(), p_ids: pick })
    if (error) return setMsg(error.message)
    localStorage.setItem('voted', '1'); setVoted(true); loadRes()
  }
  const top = res.slice(0, 5), max = Math.max(1, ...top.map((x) => Number(x.votes)))
  return (
    <div className="page"><div className="wrap">
      <div className="shero">
        <h2 className="title">{bn ? 'চট্টগ্রামের সেরা ৫ পূজা' : 'Top 5 Pujas of Chattogram'}</h2>
        <p className="muted">{bn ? 'আপনার মতে সেরা ৫টি মণ্ডপ বেছে নিন' : 'Pick your top 5 mandaps'}</p>
      </div>
      <div className="two">
        <div>
          <div className="sec">{bn ? 'লাইভ ফলাফল' : 'Live results'}</div>
          {top.map((x, i) => (
            <div className="rk" key={x.mandap_id}>
              <div className="n">{i + 1}</div>
              <div><b>{nm(x)}</b> <span className="muted">· {x.votes} {bn ? 'ভোট' : 'votes'}</span><div className="b"><i style={{ width: (Number(x.votes) / max) * 100 + '%' }} /></div></div>
            </div>
          ))}
        </div>
        <div>
          <div className="sec">{bn ? 'আপনার ভোট' : 'Your vote'}</div>
          {voted ? <p className="msg">{bn ? 'ধন্যবাদ! আপনার ভোট জমা হয়েছে।' : 'Thank you! Your vote is in.'}</p> : (
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflow: 'auto' }}>
                {ms.map((m) => (
                  <div key={m.id} className={'pk' + (pick.includes(m.id) ? ' on' : '')} onClick={() => toggle(m.id)}>
                    <span>{pick.includes(m.id) ? '✓' : '○'}</span><div><b>{nm(m)}</b><br /><small className="muted">{m.area}</small></div>
                  </div>
                ))}
              </div>
              <p className="muted">{pick.length}/5</p>
              <input required type="email" placeholder={bn ? 'আপনার ইমেইল (গোপন)' : 'Your email (private)'} value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn pri" disabled={!pick.length}>{bn ? 'ভোট দিন' : 'Submit vote'}</button>
              {msg && <p className="msg">{msg}</p>}
            </form>
          )}
        </div>
      </div>
    </div></div>
  )
}
