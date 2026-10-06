import { useEffect, useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'

export default function Panel({ m, name, t, onClose }) {
  const [photos, setPhotos] = useState([])
  const [yr, setYr] = useState('')
  const [form, setForm] = useState({ name: '', email: '', year: new Date().getFullYear() })
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [box, setBox] = useState(null)
  const [liked, setLiked] = useState(JSON.parse(localStorage.getItem('liked') || '[]'))

  useEffect(() => {
    setYr(''); setMsg(''); setFiles([]); setBox(null)
    sb.from('photos').select('id,url,uploader_name,year,likes').eq('mandap_id', m.id).eq('status', 'approved')
      .order('likes', { ascending: false }).then(({ data }) => setPhotos(data || []))
  }, [m.id])

  const years = [...new Set(photos.map((p) => p.year))].sort((a, b) => b - a)
  const shown = yr ? photos.filter((p) => p.year == yr) : photos

  async function like(p) {
    if (liked.includes(p.id)) return
    await sb.rpc('like_photo', { pid: p.id })
    const l = [...liked, p.id]; setLiked(l); localStorage.setItem('liked', JSON.stringify(l))
    setPhotos(photos.map((x) => (x.id === p.id ? { ...x, likes: x.likes + 1 } : x)))
  }

  async function submit(e) {
    e.preventDefault(); setMsg('')
    if (!files.length) return setMsg(t.addPhotos)
    const err = check(files); if (err) return setMsg(err)
    setBusy(true)
    try {
      const ups = await uploadAll(files)
      const r = await sb.from('photos').insert(ups.map((u) => ({ mandap_id: m.id, url: u.url, path: u.path, uploader_name: form.name.trim(), uploader_email: form.email.trim(), year: +form.year })))
      if (r.error) throw r.error
      setMsg(t.done); setFiles([])
    } catch (x) { setMsg(x.message) }
    setBusy(false)
  }

  return (
    <div className="panel">
      <div className="hero">
        {photos[0] && <img src={photos[0].url} />}
        <button className="x" onClick={onClose}>✕</button>
        <h2>{name}</h2>
      </div>
      <div className="body">
        <div className="chips">
          {m.area && <span className="chip">{m.area}</span>}
          {m.theme && <span className="chip">{t.theme}: {m.theme}</span>}
          {m.artist && <span className="chip">{t.artist}: {m.artist}</span>}
        </div>
        {m.address && <p className="muted">{m.address}</p>}
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`} target="_blank" rel="noreferrer"><button className="btn pri">🧭 {t.dir}</button></a>

        <div className="sec">{t.photos}</div>
        {years.length > 1 && (
          <select value={yr} onChange={(e) => setYr(e.target.value)} style={{ marginBottom: 10 }}>
            <option value="">{t.allYears}</option>{years.map((y) => <option key={y}>{y}</option>)}
          </select>
        )}
        {!shown.length && <p className="muted">{t.nophoto}</p>}
        <div className="grid">
          {shown.map((p, i) => (
            <div className="ph" key={p.id} onClick={() => setBox(i)}>
              <img src={p.url} loading="lazy" />
              <div className="cap"><span>{p.uploader_name} · {p.year}</span>
                <b onClick={(e) => { e.stopPropagation(); like(p) }}>{liked.includes(p.id) ? '❤️' : '🤍'} {p.likes}</b></div>
            </div>
          ))}
        </div>

        <div className="sec">{t.upload}</div>
        <form onSubmit={submit}>
          <input required placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="number" min="2000" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          <PhotoPicker files={files} setFiles={setFiles} label={t.addPhotos} />
          <button className="btn pri" disabled={busy}>{busy ? t.sending : t.send}</button>
          {msg && <p className="msg">{msg}</p>}
        </form>
      </div>

      {box !== null && shown[box] && (
        <div className="lb" onClick={() => setBox(null)}>
          <img src={shown[box].url} onClick={(e) => e.stopPropagation()} />
          <button className="lbn l" onClick={(e) => { e.stopPropagation(); setBox((box - 1 + shown.length) % shown.length) }}>‹</button>
          <button className="lbn r" onClick={(e) => { e.stopPropagation(); setBox((box + 1) % shown.length) }}>›</button>
          <span>{t.by} {shown[box].uploader_name}</span>
        </div>
      )}
    </div>
  )
}
