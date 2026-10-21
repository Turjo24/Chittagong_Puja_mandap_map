import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { C } from './adminUi'
import { PERM_KEYS } from './adminNav'

// Main admin er jonno: sub-admin banano, permission change, remove
export default function Team() {
  const [list, setList] = useState([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const [f, setF] = useState({ email: '', password: '', perms: [] })

  async function load() {
    const { data, error } = await sb.from('admin_roles').select('*').order('created_at')
    if (error) return setMsg(error.message)
    setList(data || [])
  }
  useEffect(() => { load() }, [])

  const toggle = (arr, k) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k])

  async function create(e) {
    e.preventDefault()
    if (f.password.length < 8) return setMsg('Password kom pokkhe 8 character')
    setBusy(true); setMsg('')
    const { data, error } = await sb.functions.invoke('create-subadmin', { body: f })
    setBusy(false)
    if (error || data?.error) return setMsg(data?.error || error.message)
    setF({ email: '', password: '', perms: [] })
    setMsg('Sub-admin toiri hoyeche. Email + password ta take pathiye din.')
    load()
  }

  async function savePerms(r, perms) {
    const { error } = await sb.from('admin_roles').update({ perms }).eq('user_id', r.user_id)
    if (error) return setMsg(error.message)
    load()
  }
  async function remove(r) {
    if (!confirm(`${r.email} er admin access tule nite chan?`)) return
    const { error } = await sb.from('admin_roles').delete().eq('user_id', r.user_id)
    if (error) return setMsg(error.message)
    load()
  }

  const Checks = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {PERM_KEYS.map(([k, l]) => (
        <label key={k} className="text-sm flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={value.includes(k)} onChange={() => onChange(toggle(value, k))} /> {l}
        </label>
      ))}
    </div>
  )

  return (
    <>
      {msg && <p className={`${C.msg} mb-2`}>{msg}</p>}
      <div className={C.sec}>Notun sub-admin</div>
      <form onSubmit={create} className="flex flex-col gap-3 p-4 border border-[var(--bd)] rounded-xl bg-[var(--card)]">
        <input className={C.input} type="email" required placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={C.input} type="text" required placeholder="Password (min 8)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <div className={C.muted}>Ke kon kon page dekhte/edit korte parbe:</div>
        <Checks value={f.perms} onChange={(perms) => setF({ ...f, perms })} />
        <button className={C.pri} disabled={busy}>{busy ? 'Toiri hocche...' : 'Create sub-admin'}</button>
      </form>

      <div className={`${C.sec} mt-6`}>Sob admin ({list.length})</div>
      <div className={C.list}>
        {list.map((r) => (
          <div className={C.cardCol} key={r.user_id}>
            <div className={C.name}>
              {r.email}{' '}
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${r.role === 'super' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{r.role === 'super' ? 'main admin' : 'sub-admin'}</span>
            </div>
            {r.role === 'super'
              ? <div className={C.muted}>Sob access ache.</div>
              : <>
                  <Checks value={r.perms || []} onChange={(p) => savePerms(r, p)} />
                  <div className={C.acts}><button className={C.danger} onClick={() => remove(r)}>✕ Remove access</button></div>
                </>}
          </div>
        ))}
      </div>
    </>
  )
}
