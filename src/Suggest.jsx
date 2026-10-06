import { useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'

export default function Suggest({ t, picked, onClose }) {
  const [f, setF] = useState({ name: '', area: '', address: '', theme: '', artist: '', by: '', email: '' })
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setMsg('')
    if (!picked) return setMsg(t.pick)
    const err = check(files); if (err) return setMsg(err)
    setBusy(true)
    try {
      const ups = await uploadAll(files)
      const r = await sb.rpc('suggest_mandap', {
        p_name: f.name.trim(), p_area: f.area.trim(), p_address: f.address.trim(), p_theme: f.theme.trim(), p_artist: f.artist.trim(),
        p_lat: picked.lat, p_lng: picked.lng, p_by: f.by.trim(), p_email: f.email.trim(), p_year: new Date().getFullYear(), p_photos: ups,
      })
      if (r.error) throw r.error
      setMsg(t.done); setFiles([])
    } catch (x) { setMsg(x.message) }
    setBusy(false)
  }

  return (
    <div className="panel">
      <div className="hero short"><button className="x" onClick={onClose}>✕</button><h2>{t.suggest}</h2></div>
      <div className="body">
        <div className={'pickbox' + (picked ? ' ok' : '')}>⭐ {picked ? `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}` : t.pick}</div>
        <form onSubmit={submit}>
          <input required placeholder={t.mname} value={f.name} onChange={set('name')} />
          <input placeholder={t.area} value={f.area} onChange={set('area')} />
          <input placeholder={t.addr} value={f.address} onChange={set('address')} />
          <input placeholder={t.theme} value={f.theme} onChange={set('theme')} />
          <input placeholder={t.artist} value={f.artist} onChange={set('artist')} />
          <PhotoPicker files={files} setFiles={setFiles} label={t.addPhotos} />
          <input required placeholder={t.name} value={f.by} onChange={set('by')} />
          <input required type="email" placeholder={t.email} value={f.email} onChange={set('email')} />
          <button className="btn pri" disabled={busy}>{busy ? t.sending : t.send}</button>
          {msg && <p className="msg">{msg}</p>}
        </form>
      </div>
    </div>
  )
}
