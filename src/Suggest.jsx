import { useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'
import { parseMapsUrl } from './parseMapsUrl'

export default function Suggest({ t, picked, onClose }) {
  const [f, setF] = useState({ name: '', area: '', address: '', theme: '', artist: '', by: '', email: '', phone: '' })
  const [mode, setMode] = useState('map') // 'map' = map-e pin kore, 'link' = Google Maps link diye
  const [link, setLink] = useState({ url: '', name: '' })
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  // Link theke location ber hocche kina (short link hole hoy na)
  const parsed = mode === 'link' && link.url.trim() ? parseMapsUrl(link.url) : null
  const needPin = !!parsed && parsed.lat == null

  // Google Maps link mode: link + mandap er naam + contact. Location link theke ney,
  // na pele upore map-e pin kora jayga ta ney. Ager moto suggest_mandap diyei jay.
  async function submitLink() {
    const url = link.url.trim()
    if (!/google|goo\.gl/i.test(url)) return setMsg('Eta Google Maps link na.')
    const p = parseMapsUrl(url)
    const lat = p.lat ?? picked?.lat
    const lng = p.lng ?? picked?.lng
    if (lat == null || lng == null) {
      return setMsg('Link theke location pawa jayni (short link). Full link din, ba map-e pin kore dekhan.')
    }
    setBusy(true)
    try {
      const r = await sb.rpc('suggest_mandap', {
        p_name: link.name.trim(), p_area: '', p_address: '', p_theme: '', p_artist: '',
        p_lat: lat, p_lng: lng, p_by: 'Google Maps link', p_email: f.email.trim(), p_year: new Date().getFullYear(), p_photos: [],
        ...(f.phone.trim() ? { p_phone: f.phone.trim() } : {}),
      })
      if (r.error) throw r.error
      setMsg(t.done); setLink({ url: '', name: '' })
    } catch (x) { setMsg(x.message) }
    setBusy(false)
  }

  async function submit(e) {
    e.preventDefault(); setMsg('')
    if (!f.email.trim() && !f.phone.trim()) return setMsg('Email address ba phone number din.')
    if (mode === 'link') return submitLink()
    if (!picked) return setMsg(t.pick)
    const err = check(files); if (err) return setMsg(err)
    setBusy(true)
    try {
      const ups = await uploadAll(files)
      const r = await sb.rpc('suggest_mandap', {
        p_name: f.name.trim(), p_area: f.area.trim(), p_address: f.address.trim(), p_theme: f.theme.trim(), p_artist: f.artist.trim(),
        p_lat: picked.lat, p_lng: picked.lng, p_by: f.by.trim(), p_email: f.email.trim(), p_year: new Date().getFullYear(), p_photos: ups,
        // phone dile tabei pathai, jate phone chhara submit age moto-i kaj kore
        ...(f.phone.trim() ? { p_phone: f.phone.trim() } : {}),
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
        <div className="chips">
          <button type="button" className={`btn ${mode === 'map' ? 'pri' : ''}`} onClick={() => { setMode('map'); setMsg('') }}>⭐ Map-e pin kore</button>
          <button type="button" className={`btn ${mode === 'link' ? 'pri' : ''}`} onClick={() => { setMode('link'); setMsg('') }}>🔗 Google Maps link ache</button>
        </div>
        {(mode === 'map' || needPin) && (
          <div className={'pickbox' + (picked ? ' ok' : '')}>⭐ {picked ? `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}` : t.pick}</div>
        )}
        <form onSubmit={submit}>
          {mode === 'map' ? (
            <>
              <input required placeholder={t.mname} value={f.name} onChange={set('name')} />
              <input placeholder={t.area} value={f.area} onChange={set('area')} />
              <input placeholder={t.addr} value={f.address} onChange={set('address')} />
              <input placeholder={t.theme} value={f.theme} onChange={set('theme')} />
              <input placeholder={t.artist} value={f.artist} onChange={set('artist')} />
              <PhotoPicker files={files} setFiles={setFiles} label={t.addPhotos} />
              <input required placeholder={t.name} value={f.by} onChange={set('by')} />
            </>
          ) : (
            <>
              <input required type="url" placeholder="Google Maps share link" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} />
              <p className="muted">
                {needPin
              ? 'এই লিংক থেকে লোকেশন বের করা যায়নি (শর্ট লিংক)। উপরের ম্যাপে পিন করে দিন, তাহলে সেই লোকেশনটি যুক্ত হয়ে যাবে।'
                : 'Google Maps অ্যাপ থেকে Share → Copy link করে এখানে পেস্ট করুন। লিংক থেকেই স্বয়ংক্রিয়ভাবে লোকেশন বের হয়ে যাবে।'}
              </p>
              <input required placeholder={t.mname} value={link.name} onChange={(e) => setLink({ ...link, name: e.target.value })} />
            </>
          )}
          <input type="email" placeholder={`${t.email} (optional)`} value={f.email} onChange={set('email')} />
          <input type="tel" placeholder="Phone number (optional)" value={f.phone} onChange={set('phone')} />
          <button className="btn pri" disabled={busy}>{busy ? t.sending : t.send}</button>
          {msg && <p className="msg">{msg}</p>}
        </form>
      </div>
    </div>
  )
}