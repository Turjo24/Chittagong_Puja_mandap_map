import { useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'
import { parseMapsUrl } from './parseMapsUrl'

export default function Suggest({ t, picked, onClose }) {
  const [f, setF] = useState({
    name: '',
    area: '',
    address: '',
    theme: '',
    artist: '',
    by: '',
    email: '',
    phone: '',
  })

  const [mode, setMode] = useState('map')
  const [link, setLink] = useState({
    url: '',
    name: '',
  })

  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }))

  // Map-e pin korle coordinate auto-fill.
  // Manually edit korle edited value use hobe.
  const latitude =
    picked?.lat != null && !lat
      ? String(picked.lat)
      : lat

  const longitude =
    picked?.lng != null && !lng
      ? String(picked.lng)
      : lng

  // Google Maps link parsing
  const parsed =
    mode === 'link' && link.url.trim()
      ? parseMapsUrl(link.url)
      : null

  const needPin = !!parsed && parsed.lat == null

  // Google Maps link submission
  async function submitLink() {
    const url = link.url.trim()

    if (
      !/^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[a-z.]+)/i.test(url)
    ) {
      setMsg('Valid Google Maps link din.')
      return
    }

    const p = parseMapsUrl(url)

    const linkLat = p?.lat
    const linkLng = p?.lng

    const finalLat = linkLat ?? picked?.lat
    const finalLng = linkLng ?? picked?.lng

    if (
      finalLat == null ||
      finalLng == null ||
      !Number.isFinite(Number(finalLat)) ||
      !Number.isFinite(Number(finalLng)) ||
      Number(finalLat) < -90 ||
      Number(finalLat) > 90 ||
      Number(finalLng) < -180 ||
      Number(finalLng) > 180
    ) {
      setMsg(
        'Link theke location pawa jayni. Full link din, ba map-e pin korun.'
      )
      return
    }

    if (!link.name.trim()) {
      setMsg('Mandap-er naam din.')
      return
    }

    setBusy(true)

    try {
      const r = await sb.rpc('suggest_mandap', {
        p_name: link.name.trim(),
        p_area: '',
        p_address: '',
        p_theme: '',
        p_artist: '',
        p_lat: Number(finalLat),
        p_lng: Number(finalLng),
        p_by: 'Google Maps link',
        p_email: f.email.trim(),
        p_year: new Date().getFullYear(),
        p_photos: [],
      })

      if (r.error) throw r.error

      setMsg(t.done)
      setLink({ url: '', name: '' })
    } catch (x) {
      setMsg(x.message || 'Submit kora jayni.')
    } finally {
      setBusy(false)
    }
  }

  // Main form submission
  async function submit(e) {
    e.preventDefault()
    setMsg('')

    if (!f.email.trim()) {
      setMsg('Email address din.')
      return
    }

    if (mode === 'link') {
      await submitLink()
      return
    }

    const latitudeNum = Number(latitude)
    const longitudeNum = Number(longitude)

    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(latitudeNum) ||
      !Number.isFinite(longitudeNum) ||
      latitudeNum < -90 ||
      latitudeNum > 90 ||
      longitudeNum < -180 ||
      longitudeNum > 180
    ) {
      setMsg('Valid Latitude (-90 to 90) ebong Longitude (-180 to 180) din.')
      return
    }

    const err = check(files)

    if (err) {
      setMsg(err)
      return
    }

    setBusy(true)

    try {
      const ups = await uploadAll(files)

      const r = await sb.rpc('suggest_mandap', {
        p_name: f.name.trim(),
        p_area: f.area.trim(),
        p_address: f.address.trim(),
        p_theme: f.theme.trim(),
        p_artist: f.artist.trim(),
        p_lat: latitudeNum,
        p_lng: longitudeNum,
        p_by: f.by.trim(),
        p_email: f.email.trim(),
        p_year: new Date().getFullYear(),
        p_photos: ups,
      })

      if (r.error) throw r.error

      setMsg(t.done)
      setFiles([])
    } catch (x) {
      setMsg(x.message || 'Submit kora jayni.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="panel"
      style={{
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="hero short" style={{ flexShrink: 0 }}>
        <button className="x" onClick={onClose}>
          ✕
        </button>

        <h2>{t.suggest}</h2>
      </div>

      <div
        className="body"
        style={{
          overflowY: 'auto',
          flex: 1,
        }}
      >
        <div className="chips">
          <button
            type="button"
            className={`btn ${mode === 'map' ? 'pri' : ''}`}
            onClick={() => {
              setMode('map')
              setMsg('')
            }}
          >
            ⭐ Map-e pin kore
          </button>

          <button
            type="button"
            className={`btn ${mode === 'link' ? 'pri' : ''}`}
            onClick={() => {
              setMode('link')
              setMsg('')
            }}
          >
            🔗 Google Maps link ache
          </button>
        </div>

        {mode === 'map' && (
          <div className={`pickbox${picked ? ' ok' : ''}`}>
            📍{' '}
            {latitude && longitude
              ? `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`
              : t.pick}
          </div>
        )}

        {mode === 'link' && needPin && (
          <div className="pickbox">
            📍 Short link theke location ber hoyni.
            Map-e pin korun othoba full Google Maps link din.
          </div>
        )}

        <form onSubmit={submit}>
          {mode === 'map' ? (
            <>
              <input
                required
                placeholder={t.mname}
                value={f.name}
                onChange={set('name')}
              />

              <input
                placeholder={t.area}
                value={f.area}
                onChange={set('area')}
              />

              <input
                placeholder={t.addr}
                value={f.address}
                onChange={set('address')}
              />

              {/* Latitude and Longitude */}
          {/* Latitude and Longitude */}
<div
  style={{
    display: 'flex',
    gap: 8,
    marginBottom: 8,
  }}
>
  <label style={{ flex: 1, minWidth: 0 }}>
    <span
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 2,
      }}
    >
      Latitude
    </span>

    <input
      type="number"
      step="any"
      min="-90"
      max="90"
      required
      placeholder="22.3569"
      value={latitude}
      onChange={(e) => setLat(e.target.value)}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        margin: 0,
        padding: '6px 8px',
        fontSize: 13,
      }}
    />
  </label>

  <label style={{ flex: 1, minWidth: 0 }}>
    <span
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 2,
      }}
    >
      Longitude
    </span>

    <input
      type="number"
      step="any"
      min="-180"
      max="180"
      required
      placeholder="91.7832"
      value={longitude}
      onChange={(e) => setLng(e.target.value)}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        margin: 0,
        padding: '6px 8px',
        fontSize: 13,
      }}
    />
  </label>
</div>

              <input
                placeholder={t.theme}
                value={f.theme}
                onChange={set('theme')}
              />

              <input
                placeholder={t.artist}
                value={f.artist}
                onChange={set('artist')}
              />

              <PhotoPicker
                files={files}
                setFiles={setFiles}
                label={t.addPhotos}
              />

              <input
                required
                placeholder={t.name}
                value={f.by}
                onChange={set('by')}
              />
            </>
          ) : (
            <>
              <input
                required
                type="url"
                placeholder="Google Maps share link"
                value={link.url}
                onChange={(e) =>
                  setLink((prev) => ({
                    ...prev,
                    url: e.target.value,
                  }))
                }
              />

              <p className="muted">
                Google Maps app theke Share → Copy link kore ekhane
                paste korun. Full link hole coordinate automatically
                ber hobe. Short link hole map-e pin korte hote pare.
              </p>

              <input
                required
                placeholder={t.mname}
                value={link.name}
                onChange={(e) =>
                  setLink((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </>
          )}

          <input
            type="email"
            placeholder={`${t.email} (optional)`}
            value={f.email}
            onChange={set('email')}
          />

          <button className="btn pri" disabled={busy}>
            {busy ? t.sending : t.send}
          </button>

          {msg && <p className="msg">{msg}</p>}
        </form>
      </div>
    </div>
  )
}