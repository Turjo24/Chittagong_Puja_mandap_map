
import { useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'
import { parseMapsUrl } from './parseMapsUrl'

export default function Suggest({ t, onClose }) {
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

  // Editable coordinate fields.
  // No automatic value from picked, so users can delete freely.
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) =>
    setF((prev) => ({
      ...prev,
      [k]: e.target.value,
    }))

  // Parse coordinates from a Google Maps URL.
  const parsed =
    mode === 'link' && link.url.trim()
      ? parseMapsUrl(link.url.trim())
      : null

  const needPin = !!parsed && parsed.lat == null

  // Submit using a Google Maps link.
  async function submitLink() {
    const url = link.url.trim()

    if (
      !/^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[a-z.]+)/i.test(
        url
      )
    ) {
      setMsg('Valid Google Maps link din.')
      return
    }

    const p = parseMapsUrl(url)

    const linkLat = p?.lat
    const linkLng = p?.lng

    // Use manually entered coordinates as fallback.
    const finalLat = linkLat ?? lat
    const finalLng = linkLng ?? lng

    if (
      finalLat === '' ||
      finalLng === '' ||
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
        'Coordinate ber kora jayni. Latitude o Longitude manually din.'
      )
      return
    }

    if (!link.name.trim()) {
      setMsg('Mandap-er naam din.')
      return
    }

    if (!f.email.trim()) {
      setMsg('Email address din.')
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
      setLat('')
      setLng('')
    } catch (x) {
      setMsg(x.message || 'Submit kora jayni.')
    } finally {
      setBusy(false)
    }
  }

  // Main form submission.
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

    // Validate the actual editable input values.
    if (lat.trim() === '' || lng.trim() === '') {
      setMsg('Latitude ebong Longitude duita-i din.')
      return
    }

    const latitudeNum = Number(lat)
    const longitudeNum = Number(lng)

    if (
      !Number.isFinite(latitudeNum) ||
      !Number.isFinite(longitudeNum) ||
      latitudeNum < -90 ||
      latitudeNum > 90 ||
      longitudeNum < -180 ||
      longitudeNum > 180
    ) {
      setMsg(
        'Valid Latitude (-90 to 90) ebong Longitude (-180 to 180) din.'
      )
      return
    }

    if (!f.name.trim()) {
      setMsg('Mandap-er naam din.')
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
      setLat('')
      setLng('')
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
        <button
          type="button"
          className="x"
          onClick={onClose}
        >
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
            📍 Coordinate diye submit
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

              {/* Editable Latitude and Longitude */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <label
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 5,
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
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      margin: 0,
                    }}
                  />
                </label>

                <label
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 5,
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
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      margin: 0,
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
              গুগল ম্যাপস অ্যাপ থেকে শেয়ার → লিংক কপি করে এখানে পেস্ট করুন।
               লিংক থেকে Latitude ও Longitude পাওয়া না গেলে নিচে নিজে লিখুন।
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

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <label style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 5,
                    }}
                  >
                    Latitude
                  </span>

                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    placeholder="22.3569"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      margin: 0,
                    }}
                  />
                </label>

                <label style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 5,
                    }}
                  >
                    Longitude
                  </span>

                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    placeholder="91.7832"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      margin: 0,
                    }}
                  />
                </label>
              </div>
            </>
          )}

          <input
            required
            type="email"
            placeholder={`${t.email} *`}
            value={f.email}
            onChange={set('email')}
          />

          <button
            type="submit"
            className="btn pri"
            disabled={busy}
          >
            {busy ? t.sending : t.send}
          </button>

          {msg && <p className="msg">{msg}</p>}
        </form>
      </div>
    </div>
  )
}
