import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { C } from './adminUi'

// Boro photo ke max 1920px e chhoto kore (Supabase free storage bachate). Fail hole original jabe.
async function shrink(file, max = 1920, q = 0.85) {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const cv = document.createElement('canvas')
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k)
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height)
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', q))
    return blob && blob.size < file.size ? blob : file
  } catch { return file }
}

// Ekta mandap er photo manage: unlimited upload + delete
export default function PhotoManager({ mandap }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const [busy, setBusy] = useState(false)
  const [prog, setProg] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const { data, error } = await sb.from('photos').select('*').eq('mandap_id', mandap.id).order('created_at', { ascending: false })
    if (error) return setMsg(error.message)
    setList(data || [])
  }
  useEffect(() => { if (open) load() }, [open])

  async function upload(e) {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy(true); setMsg('')
    const email = (await sb.auth.getUser()).data.user?.email || 'admin'
    const rows = []
    let fail = 0
    for (let i = 0; i < files.length; i++) {
      setProg(`${i + 1} / ${files.length} upload hocche...`)
      const blob = await shrink(files[i])
      const path = `${mandap.id}/admin-${Date.now()}-${i}.jpg`
      const { error } = await sb.storage.from('photos').upload(path, blob, { contentType: blob.type || 'image/jpeg' })
      if (error) { fail++; setMsg(error.message); continue }
      const url = sb.storage.from('photos').getPublicUrl(path).data.publicUrl
      rows.push({ mandap_id: mandap.id, path, url, status: 'approved', uploader_name: 'Admin', uploader_email: email, year: new Date().getFullYear() })
    }
    if (rows.length) {
      const { error } = await sb.from('photos').insert(rows)
      if (error) setMsg(error.message)
      else setMsg(`${rows.length} ta photo add hoyeche.${fail ? ` ${fail} ta fail.` : ''}`)
    }
    setBusy(false); setProg(''); load()
  }

  async function del(p) {
    if (!confirm('Ei photo delete korben?')) return
    if (p.path) await sb.storage.from('photos').remove([p.path])
    const { error } = await sb.from('photos').delete().eq('id', p.id)
    if (error) return setMsg(error.message)
    load()
  }

  return (
    <div className="mt-1 mb-2">
      <button className={C.btn} onClick={() => setOpen(!open)}>📷 Photos {open ? '▲' : '▼'}</button>
      {open && (
        <div className="mt-2 p-3 border border-[var(--bd)] rounded-xl bg-[var(--card)]">
          <label className={`${C.pri} inline-block cursor-pointer`}>
            {busy ? prog : '＋ Add photos (unlimited)'}
            <input type="file" accept="image/*" multiple hidden disabled={busy} onChange={upload} />
          </label>
          {msg && <p className={`${C.msg} mt-2`}>{msg}</p>}
          {!list.length && <p className={`${C.muted} mt-2`}>Ekhono kono photo nai.</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {list.map((p) => (
              <div key={p.id} className="relative">
                <a href={p.url} target="_blank" rel="noreferrer"><img className={C.thumb} src={p.url} /></a>
                <button onClick={() => del(p)} title="Delete"
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs cursor-pointer">✕</button>
                {p.status !== 'approved' && <span className="absolute bottom-0 left-0 text-[10px] bg-yellow-200 px-1 rounded">{p.status}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
