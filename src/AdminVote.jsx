import { useEffect, useMemo, useState } from 'react'
import { sb } from './supabase'
import VoteCharts from './VoteCharts'

// ASSUMED schema: table `votes` (id, voter_key, email, mandap_id, created_at) — one row per picked mandap.
// Admin access should be enforced by RLS / admin-only RPC on the Supabase side.

const DISPOSABLE = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com']

const norm = (email) => {
  let [u, d] = email.toLowerCase().trim().split('@')
  if (!d) return email.toLowerCase().trim()
  if (d === 'gmail.com' || d === 'googlemail.com') { u = u.split('+')[0].replace(/\./g, ''); d = 'gmail.com' }
  return u + '@' + d
}

function flags(email, group) {
  const f = [], d = email.split('@')[1] || ''
  if (DISPOSABLE.includes(d)) f.push('disposable')
  if (email.includes('+')) f.push('plus-alias')
  if ((group[norm(email)] || []).length > 1) f.push('duplicate-gmail')
  return f
}

export default function AdminVote() {
  const [rows, setRows] = useState([]), [ms, setMs] = useState([])
  const [q, setQ] = useState(''), [msg, setMsg] = useState('')
  const [edit, setEdit] = useState(null) // { oldEmail, email, pick }

  async function load() {
    const [v, m] = await Promise.all([
      sb.from('votes').select('*').order('created_at', { ascending: false }),
      sb.from('mandaps').select('id,name,name_bn,area').order('name'),
    ])
    if (v.error) return setMsg(v.error.message)
    setRows(v.data || []); setMs(m.data || [])
  }
  useEffect(() => { load() }, [])

  const mName = useMemo(() => Object.fromEntries(ms.map((m) => [m.id, m.name])), [ms])

  const voters = useMemo(() => {
    const map = {}
    rows.forEach((r) => {
      const v = (map[r.email] ||= { email: r.email, key: r.voter_key, at: r.created_at, ids: [] })
      v.ids.push(r.mandap_id)
    })
    return Object.values(map)
  }, [rows])

  const normGroup = useMemo(() => {
    const g = {}
    voters.forEach((v) => (g[norm(v.email)] ||= []).push(v.email))
    return g
  }, [voters])

  const shown = voters.filter((v) => v.email.toLowerCase().includes(q.toLowerCase()))

  async function save(e) {
    e.preventDefault(); setMsg('')
    const email = edit.email.trim().toLowerCase()
    if (!email || !edit.pick.length) return setMsg('Email ar komopokkhe 1ta mandap lagbe')
    if (email !== edit.oldEmail && voters.some((v) => v.email.toLowerCase() === email)) return setMsg('Ei email already ache')
    const old = voters.find((v) => v.email === edit.oldEmail)
    const key = old?.key || crypto.randomUUID()
    if (edit.oldEmail) {
      const del = await sb.from('votes').delete().eq('email', edit.oldEmail)
      if (del.error) return setMsg(del.error.message)
    }
    const ins = await sb.from('votes').insert(edit.pick.map((id) => ({ voter_key: key, email, mandap_id: id })))
    if (ins.error) return setMsg(ins.error.message)
    setEdit(null); load()
  }

  async function remove(email) {
    if (!confirm(`${email} er shob vote delete korbe?`)) return
    const { error } = await sb.from('votes').delete().eq('email', email)
    if (error) return setMsg(error.message)
    load()
  }

  const toggle = (id) =>
    setEdit((s) => ({ ...s, pick: s.pick.includes(id) ? s.pick.filter((x) => x !== id) : s.pick.length < 5 ? [...s.pick, id] : s.pick }))

  return (
    <div className="page"><div className="wrap">
      <VoteCharts />
      <h2 className="title" style={{ marginTop: 24 }}>Voters ({voters.length})</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Email search..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn pri" onClick={() => setEdit({ oldEmail: '', email: '', pick: [] })}>+ Add voter</button>
      </div>
      {msg && <p className="msg">{msg}</p>}

      {edit && (
        <form onSubmit={save} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
          <b>{edit.oldEmail ? 'Edit voter' : 'New voter'}</b>
          <input required type="email" placeholder="Email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
          <div style={{ display: 'grid', gap: 6, maxHeight: 300, overflow: 'auto', margin: '8px 0' }}>
            {ms.map((m) => (
              <div key={m.id} className={'pk' + (edit.pick.includes(m.id) ? ' on' : '')} onClick={() => toggle(m.id)}>
                <span>{edit.pick.includes(m.id) ? '✓' : '○'}</span><div><b>{m.name}</b> <small className="muted">{m.area}</small></div>
              </div>
            ))}
          </div>
          <p className="muted">{edit.pick.length}/5</p>
          <button className="btn pri">Save</button>{' '}
          <button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button>
        </form>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {shown.map((v) => {
          const f = flags(v.email, normGroup)
          return (
            <div key={v.email} style={{ border: '1px solid #ddd', padding: 10 }}>
              <b>{v.email}</b>{' '}
              {f.map((x) => <span key={x} style={{ color: '#b00', fontSize: 12, marginLeft: 6 }}>⚠ {x}</span>)}
              <div className="muted" style={{ fontSize: 13 }}>
                {v.ids.map((id) => mName[id] || id).join(' · ')}
                <br />{v.at && new Date(v.at).toLocaleString()}
              </div>
              <button className="btn" onClick={() => setEdit({ oldEmail: v.email, email: v.email, pick: [...v.ids] })}>Edit</button>{' '}
              <button className="btn" onClick={() => remove(v.email)}>Delete</button>
            </div>
          )
        })}
        {!shown.length && <p className="muted">Kono voter nai</p>}
      </div>
    </div></div>
  )
}
