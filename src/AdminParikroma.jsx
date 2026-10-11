import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { C } from './adminUi'
import { DAYS, dayLabel, parseRoutes, toDraft, fromDraft } from './parikromaUtil'

// Preview row ar Edit — dutoi eta use kore
function DraftEditor({ d, set }) {
  const toggle = (k) =>
    set({ ...d, days: d.days.includes(k) ? d.days.filter((x) => x !== k) : [...d.days, k] })
  const setSec = (i, k, v) =>
    set({ ...d, sections: d.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)) })

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <input className={`${C.input} flex-1 min-w-40`} placeholder="Route er naam" value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} />
        <input className={`${C.input} !w-24`} type="number" placeholder="Serial" value={d.sort} onChange={(e) => set({ ...d, sort: e.target.value })} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs opacity-60">Kon din:</span>
        {DAYS.map(([k, l]) => (
          <button
            type="button"
            key={k}
            onClick={() => toggle(k)}
            className={`text-xs px-3 py-1 rounded-full border ${d.days.includes(k) ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300'}`}
          >
            {l}
          </button>
        ))}
        <span className="text-xs opacity-50">(kono din select na korle protidin dekhabe)</span>
      </div>

      <input className={C.input} placeholder="Somoy / note (jemon: Ostomi shokal 9 ta theke)" value={d.time_note} onChange={(e) => set({ ...d, time_note: e.target.value })} />

      {d.sections.map((s, i) => (
        <div key={i} className="border border-dashed border-gray-300 rounded-xl p-2 flex flex-col gap-2">
          <div className="flex gap-2">
            <input className={C.input} placeholder="Section naam (optional, jemon: উত্তর কাট্টলী)" value={s.heading} onChange={(e) => setSec(i, 'heading', e.target.value)} />
            <button type="button" className={C.danger} onClick={() => set({ ...d, sections: d.sections.filter((_, j) => j !== i) })}>✕</button>
          </div>
          <textarea className={C.input} rows={2} placeholder="Jaiga → Jaiga → Jaiga" value={s.text} onChange={(e) => setSec(i, 'text', e.target.value)} />
        </div>
      ))}
      <div>
        <button type="button" className="text-sm underline" onClick={() => set({ ...d, sections: [...d.sections, { heading: '', text: '' }] })}>+ Section add</button>
      </div>
    </div>
  )
}

export default function AdminParikroma() {
  const [list, setList] = useState([]), [msg, setMsg] = useState('')
  const [text, setText] = useState(''), [rows, setRows] = useState(null), [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null), [draft, setDraft] = useState(null)

  async function load() {
    const { data, error } = await sb.from('parikromas').select('*').order('sort').order('created_at')
    if (error) return setMsg(error.message)
    setList(data || [])
  }
  useEffect(() => { load() }, [])

  // ---- Bulk add ----
  function preview() {
    setMsg('')
    const out = parseRoutes(text)
    if (!out.length) return setMsg('Kono route paoa jayni. Route er line 🚩 ba "রুট–০১:" diye shuru hote hobe.')
    setRows(out)
  }
  const setRowAt = (i, v) => setRows((rs) => rs.map((r, j) => (j === i ? v : r)))
  const dropRow = (i) => setRows((rs) => rs.filter((_, j) => j !== i))
  const tagAll = (k) =>
    setRows((rs) => {
      const all = rs.every((r) => r.days.includes(k))
      return rs.map((r) => ({ ...r, days: all ? r.days.filter((x) => x !== k) : [...new Set([...r.days, k])] }))
    })

  async function addAll() {
    const base = list.length
    const payload = rows.map((r, i) => ({ ...fromDraft(r), sort: base + i + 1 }))
    const bad = payload.findIndex((p) => !p.title || !p.sections.length)
    if (bad >= 0) return setMsg(`Route ${bad + 1}: naam ba jaigar list nai`)
    if (!confirm(`${payload.length} ta route add korben?`)) return
    setSaving(true); setMsg('')
    const { error } = await sb.from('parikromas').insert(payload)
    setSaving(false)
    if (error) return setMsg(error.message)
    setRows(null); setText(''); setMsg(`${payload.length} ta route add hoyeche ✓`); load()
  }

  // ---- Edit / delete ----
  const startEdit = (x) => { setEditId(x.id); setDraft(toDraft(x)); setMsg('') }
  async function saveEdit() {
    const p = fromDraft(draft)
    if (!p.title || !p.sections.length) return setMsg('Naam ar kombokhom ekta jaigar list lagbe')
    const { error } = await sb.from('parikromas').update(p).eq('id', editId)
    if (error) return setMsg(error.message)
    setEditId(null); setDraft(null); setMsg('Save hoyeche ✓'); load()
  }
  async function del(x) {
    if (!confirm(`"${x.title}" delete korben?`)) return
    const { error } = await sb.from('parikromas').delete().eq('id', x.id)
    if (error) return setMsg(error.message)
    load()
  }

  return (
    <>
      {msg && <p className={`${C.msg} mb-2`}>{msg}</p>}

      <div className={C.sec}>Bulk add routes (porikroma)</div>
      <p className={C.muted}>
        Pura route guide ekbare paste koro. <b>🚩 / রুট–০১:</b> = notun route, <b>🔸</b> = section, <b>A → B → C</b> = jaigar list.
        Preview te din (Ponchomi, Sosti...) ar somoy set kore nao.
      </p>
      <textarea
        className={`${C.input} mb-2`}
        rows={8}
        placeholder={'🚩 রুট–০১: সিটি গেইট → কর্ণেলহাট\n🔸 উত্তর কাট্টলী\nবড় কালী বাড়ি → ছোট কালী বাড়ি → মজুমদার বাড়ি'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className={C.pri} onClick={preview}>Preview</button>

      {rows && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <span className="text-xs opacity-60">Sob route e din set/unset:</span>
            {DAYS.map(([k, l]) => (
              <button key={k} type="button" onClick={() => tagAll(k)} className="text-xs px-3 py-1 rounded-full border border-gray-300">{l}</button>
            ))}
          </div>
          <div className={C.list}>
            {rows.map((r, i) => (
              <div className={C.card} key={i}>
                <DraftEditor d={r} set={(v) => setRowAt(i, v)} />
                <button className={C.danger} onClick={() => dropRow(i)}>✕ Bad dao</button>
              </div>
            ))}
          </div>
          <button className={`${C.pri} mt-3`} disabled={saving} onClick={addAll}>
            {saving ? 'Adding...' : `Add ${rows.length} route`}
          </button>
        </div>
      )}

      <div className={`${C.sec} mt-6`}>All routes ({list.length})</div>
      {!list.length && <p className={C.muted}>Kichu nai.</p>}
      <div className={C.list}>
        {list.map((x) =>
          editId === x.id ? (
            <div className={C.card} key={x.id}>
              <DraftEditor d={draft} set={setDraft} />
              <div className={C.acts}>
                <button className={C.pri} onClick={saveEdit}>Save</button>
                <button className={C.danger} onClick={() => { setEditId(null); setDraft(null) }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className={C.card} key={x.id}>
              <div className="flex-1 min-w-40">
                <div className={C.name}>{x.title}</div>
                <div className={C.muted}>
                  {(x.days || []).length ? x.days.map(dayLabel).join(', ') : 'Protidin'}
                  {x.time_note ? ` · ${x.time_note}` : ''} · {(x.sections || []).reduce((n, s) => n + (s.stops || []).length, 0)} ta jaiga
                </div>
              </div>
              <div className={C.acts}>
                <button className={C.pri} onClick={() => startEdit(x)}>✎ Edit</button>
                <button className={C.danger} onClick={() => del(x)}>✕ Delete</button>
              </div>
            </div>
          )
        )}
      </div>
    </>
  )
}
