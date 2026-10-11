import { useState } from 'react'
import { sb } from './supabase'
import { check, uploadAll } from './upload'
import { C } from './adminUi'

/*
  Je kono admin card e ✎ Edit button ar inline edit form dey.

  Props:
    table       supabase table name
    item        row (id lagbe)
    fields      [{ key, label, type?: 'text'|'number'|'date'|'textarea'|'select',
                   options?: [[value,label]], required?: bool, nullable?: bool }]
                nullable: faka rakhle null save hobe (nahole '' save hobe)
    imageField  optional, photo/logo bodlanor jonno:
                { url: 'logo_url', path: 'logo_path', label: 'Logo', arg: true }
                (arg = uploadAll er 2nd argument, sponsor logo te true, reps e dorkar nai)
    onSaved     save er pore load() call hobe
    onDelete    dile ✕ Delete button dekhabe
    actions     extra button (jemon "Update fare")
    children    normal (non-edit) card er content
*/
export default function EditCard({ table, item, fields, imageField, onSaved, onDelete, actions, children }) {
  const [editing, setEditing] = useState(false)
  const [d, setD] = useState({})
  const [file, setFile] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function start() {
    const o = {}
    fields.forEach((f) => { o[f.key] = item[f.key] ?? '' })
    setD(o); setFile(null); setErr(''); setEditing(true)
  }

  async function save(e) {
    e.preventDefault()
    setErr('')
    const patch = {}
    for (const f of fields) {
      let v = typeof d[f.key] === 'string' ? d[f.key].trim() : d[f.key]
      const label = f.label || f.key
      if (f.required && (v === '' || v == null)) return setErr(`${label} lagbe`)
      if (f.type === 'number') {
        if (v === '') v = null
        else if (!Number.isFinite(Number(v))) return setErr(`${label} sothik number na`)
        else v = Number(v)
      } else if (v === '' && f.nullable) v = null
      patch[f.key] = v
    }

    setBusy(true)
    let up = null
    if (imageField && file) {
      const er = check([file])
      if (er) { setBusy(false); return setErr(er) }
      try {
        up = (await uploadAll([file], imageField.arg))[0]
      } catch (x) { setBusy(false); return setErr(x.message) }
      patch[imageField.url] = up?.url
      patch[imageField.path] = up?.path
    }

    const { error } = await sb.from(table).update(patch).eq('id', item.id)
    if (error) {
      if (up?.path) await sb.storage.from('photos').remove([up.path]) // notun upload fele dao
      setBusy(false)
      return setErr(error.message)
    }
    const old = imageField && up ? item[imageField.path] : null
    if (old) await sb.storage.from('photos').remove([old]) // purono chhobi muche dao
    setBusy(false)
    setEditing(false)
    onSaved && onSaved()
  }

  if (editing) {
    return (
      <div className={C.card}>
        <form onSubmit={save} className="w-full flex flex-col gap-2">
          {fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-xs opacity-90">
              {f.label || f.key}
              {f.type === 'textarea' ? (
                <textarea className={C.input} rows={3} value={d[f.key]} onChange={(e) => setD({ ...d, [f.key]: e.target.value })} />
              ) : f.type === 'select' ? (
                <select className={C.input} value={d[f.key]} onChange={(e) => setD({ ...d, [f.key]: e.target.value })}>
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <input
                  className={C.input}
                  type={f.type === 'number' ? 'text' : f.type || 'text'}
                  inputMode={f.type === 'number' ? 'decimal' : undefined}
                  value={d[f.key]}
                  onChange={(e) => setD({ ...d, [f.key]: e.target.value })}
                />
              )}
            </label>
          ))}

          {imageField && (
            <div className="flex items-center gap-3 text-xs">
              {item[imageField.url] && <img className="w-14 h-14 object-contain rounded" src={item[imageField.url]} />}
              <label className="flex flex-col gap-1">
                {imageField.label || 'Photo'} bodlate chaile notun file dao (na dile ager ta thakbe)
                <input className="text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} />
              </label>
            </div>
          )}

          {err && <p className={C.msg}>{err}</p>}
          <div className="flex gap-2">
            <button className={C.pri} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
            <button type="button" className={C.danger} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={C.card}>
      {children}
      <div className={C.acts}>
        {actions}
        <button className={C.pri} onClick={start}>✎ Edit</button>
        {onDelete && <button className={C.danger} onClick={onDelete}>✕ Delete</button>}
      </div>
    </div>
  )
}
