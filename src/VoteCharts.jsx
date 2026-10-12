import { useEffect, useMemo, useState } from 'react'
import { sb } from './supabase'

// No chart library needed — pure SVG/CSS. Reads `votes` + `mandaps` (admin needs select access via RLS).
const COLORS = ['#e8590c', '#f59f00', '#2f9e44', '#1c7ed6', '#7048e8', '#d6336c', '#0ca678', '#868e96']

const Card = ({ title, children, className = '' }) => (
  <div className={`bg-[var(--card)] border border-[var(--bd)] rounded-xl p-4 shadow-sm ${className}`}>
    <div className="font-semibold mb-3">{title}</div>
    {children}
  </div>
)

function Donut({ data, total }) {
  let acc = 0
  return (
    <div className="relative w-44 h-44 shrink-0">
      <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--soft)" strokeWidth="6" />
        {data.map((d, i) => {
          const p = total ? (d.votes / total) * 100 : 0
          const el = (
            <circle key={d.name} cx="21" cy="21" r="15.9155" fill="none" stroke={COLORS[i % COLORS.length]}
              strokeWidth="6" strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={-acc}>
              <title>{d.name}: {d.votes} ({p.toFixed(1)}%)</title>
            </circle>
          )
          acc += p
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-2xl font-bold">{total}</div>
        <div className="text-xs text-[var(--mu)]">total votes</div>
      </div>
    </div>
  )
}

function HBars({ data, color = 'var(--a)' }) {
  const max = Math.max(1, ...data.map((d) => d.votes))
  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => (
        <div key={d.name}>
          <div className="flex justify-between text-sm gap-2">
            <span className="truncate">{i + 1}. {d.name}</span>
            <b>{d.votes}</b>
          </div>
          <div className="h-2.5 rounded bg-[var(--soft)] overflow-hidden">
            <div className="h-full rounded" style={{ width: (d.votes / max) * 100 + '%', background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function VoteCharts({ compact = false }) {
  const [votes, setVotes] = useState([]), [ms, setMs] = useState([]), [err, setErr] = useState('')

  async function load() {
    const [v, m] = await Promise.all([
      sb.from('votes').select('email,mandap_id,created_at'),
      sb.from('mandaps').select('id,name,area'),
    ])
    if (v.error) return setErr(v.error.message)
    setErr(''); setVotes(v.data || []); setMs(m.data || [])
  }
  useEffect(() => { load(); const i = setInterval(load, 20000); return () => clearInterval(i) }, [])

  const s = useMemo(() => {
    const info = Object.fromEntries(ms.map((m) => [m.id, m]))
    const byM = {}, byDay = {}, byArea = {}, voters = new Set()
    votes.forEach((v) => {
      byM[v.mandap_id] = (byM[v.mandap_id] || 0) + 1
      voters.add(v.email)
      const d = new Date(v.created_at).toLocaleDateString('en-CA')
      byDay[d] = (byDay[d] || 0) + 1
      const a = info[v.mandap_id]?.area || 'Unknown'
      byArea[a] = (byArea[a] || 0) + 1
    })
    const ranking = Object.entries(byM)
      .map(([id, n]) => ({ name: info[id]?.name || id, votes: n }))
      .sort((a, b) => b.votes - a.votes)
    const pie = ranking.slice(0, 5)
    const rest = ranking.slice(5).reduce((t, x) => t + x.votes, 0)
    if (rest) pie.push({ name: 'Others', votes: rest })
    const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([name, n]) => ({ name, votes: n }))
    const areas = Object.entries(byArea).map(([name, n]) => ({ name, votes: n })).sort((a, b) => b.votes - a.votes).slice(0, 8)
    return { ranking, pie, days, areas, total: votes.length, voters: voters.size }
  }, [votes, ms])

  if (err) return <p className="text-sm text-red-600">{err}</p>
  if (!s.total) return <p className="text-sm text-[var(--mu)]">Ekhono kono vote nai.</p>

  const top = s.ranking[0]
  const leaders = s.ranking.filter((r) => r.votes === top.votes)
  const second = s.ranking.find((r) => r.votes < top.votes)
  const maxDay = Math.max(1, ...s.days.map((d) => d.votes))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2 rounded-xl p-4 text-white shadow-sm" style={{ background: 'linear-gradient(135deg,#e8590c,#f59f00)' }}>
          <div className="text-xs opacity-90">🏆 {leaders.length > 1 ? 'Currently tied' : 'Currently leading'}</div>
          <div className="text-xl font-bold truncate">{leaders.map((l) => l.name).join(' / ')}</div>
          <div className="text-sm opacity-90">
            {top.votes} votes · {((top.votes / s.total) * 100).toFixed(1)}%
            {second && ` · +${top.votes - second.votes} ahead`}
          </div>
        </div>
        {[['Total voters', s.voters], ['Avg picks / voter', (s.total / s.voters).toFixed(1)]].map(([l, v]) => (
          <div key={l} className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-4 shadow-sm">
            <div className="text-xs text-[var(--mu)]">{l}</div>
            <div className="text-2xl font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card title="Vote share (pie)">
          <div className="flex flex-wrap items-center gap-4">
            <Donut data={s.pie} total={s.total} />
            <div className="flex-1 min-w-40 flex flex-col gap-1.5 text-sm">
              {s.pie.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <i className="w-3 h-3 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="truncate flex-1">{d.name}</span>
                  <span className="text-[var(--mu)]">{d.votes} · {((d.votes / s.total) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title={compact ? 'Top 5 mandaps' : 'Top 10 mandaps (bar)'}>
          <HBars data={s.ranking.slice(0, compact ? 5 : 10)} />
        </Card>
      </div>

      {!compact && (
        <div className="grid md:grid-cols-2 gap-3">
          <Card title="Votes per day (last 14 days)">
            <div className="flex items-end gap-1.5 h-40">
              {s.days.map((d) => (
                <div key={d.name} className="flex-1 flex flex-col items-center justify-end h-full min-w-0" title={`${d.name}: ${d.votes}`}>
                  <span className="text-[10px] text-[var(--mu)]">{d.votes}</span>
                  <div className="w-full rounded-t" style={{ height: (d.votes / maxDay) * 100 + '%', background: 'var(--a)', minHeight: 2 }} />
                  <span className="text-[10px] text-[var(--mu)] mt-1">{d.name.slice(5)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Votes by area">
            <HBars data={s.areas} color="#1c7ed6" />
          </Card>
        </div>
      )}
    </div>
  )
}
