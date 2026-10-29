import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { C } from './adminUi'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'

const btn = C.btn || 'btn pri'
const fmt = (d) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminBlog() {
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState([])
  const [posts, setPosts] = useState([])
  const [edits, setEdits] = useState({})   // pending submission er edit kora title/content
  const [editing, setEditing] = useState(null) // published post edit form
  const [form, setForm] = useState({ title: '', content: '', author: '' })
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)

  async function load() {
    const a = await sb.from('blog_submissions').select('*').eq('status', 'pending').order('created_at', { ascending: true })
    if (a.error) return setMsg(a.error.message)
    setPending(a.data || [])
    const b = await sb.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (b.error) return setMsg(b.error.message)
    setPosts(b.data || [])
  }
  useEffect(() => { load() }, [])

  const val = (s, k) => edits[s.id]?.[k] ?? s[k]
  const setEdit = (s, k, v) => setEdits((e) => ({ ...e, [s.id]: { ...e[s.id], [k]: v } }))
  const removeImg = async (path) => { if (path) await sb.storage.from('photos').remove([path]) }

  // ---- admin nije post add kore ----
  async function addPost(e) {
    e.preventDefault(); setMsg('')
    const pics = files.slice(0, 1)
    if (pics.length) { const err = check(pics); if (err) return setMsg(err) }
    setBusy(true)
    try {
      let image = null
      if (pics.length) image = (await uploadAll(pics))[0]
      const { error } = await sb.from('blog_posts').insert({
        title: form.title.trim(),
        content: form.content.trim(),
        author_name: form.author.trim() || null,
        image_url: image?.url || null,
        image_path: image?.path || null
      })
      if (error) throw error
      setForm({ title: '', content: '', author: '' }); setFiles([])
      setMsg('Post publish hoyeche.')
      load()
    } catch (x) { setMsg(x.message) }
    setBusy(false)
  }

  // ---- user submission approve / reject ----
  async function approve(s) {
    setMsg('')
    const title = val(s, 'title').trim(), content = val(s, 'content').trim()
    if (!title || !content) return setMsg('Title ar details dorkar.')
    const ins = await sb.from('blog_posts').insert({
      title, content,
      author_name: s.submitter_name,
      image_url: s.image_url,
      image_path: s.image_path
    })
    if (ins.error) return setMsg(ins.error.message)
    const up = await sb.from('blog_submissions').update({ status: 'approved' }).eq('id', s.id)
    if (up.error) setMsg('Post publish hoyeche kintu status update hoyni: ' + up.error.message)
    else setMsg(`"${title}" blog e add hoyeche.`)
    load()
  }

  async function reject(s) {
    if (!confirm(`"${s.title}" reject korben? Chobi thakle muche jabe.`)) return
    setMsg('')
    await removeImg(s.image_path)
    const { error } = await sb.from('blog_submissions').update({ status: 'rejected', image_url: null, image_path: null }).eq('id', s.id)
    if (error) return setMsg(error.message)
    load()
  }

  // ---- published post edit / delete ----
  async function savePost() {
    const { id, title, content, author_name, slug } = editing
    if (!title.trim() || !content.trim()) return setMsg('Title ar details dorkar.')
    const { error } = await sb.from('blog_posts').update({ title: title.trim(), content: content.trim(), author_name: (author_name || '').trim() || null, slug: (slug || '').trim() || null }).eq('id', id)
    if (error) return setMsg(error.message)
    setEditing(null); setMsg('Save hoyeche.'); load()
  }

  async function delPost(p) {
    if (!confirm(`"${p.title}" delete korben? Chobi o muche jabe.`)) return
    setMsg('')
    await removeImg(p.image_path)
    const { error } = await sb.from('blog_posts').delete().eq('id', p.id)
    if (error) return setMsg(error.message)
    load()
  }

  return (
    <>
      {msg && <p className={`${C.msg} mb-2`}>{msg}</p>}

      {/* ---- Pending submissions ---- */}
      <div className={C.sec}>User er pathano blog ({pending.length} ta pending)</div>
      {!pending.length && <p className={C.muted}>Kono pending blog nai.</p>}
      <div className={C.list}>
        {pending.map((s) => (
          <div className={C.card} key={s.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div className={C.muted}>
              <b>{s.submitter_name}</b> · <a href={`mailto:${s.submitter_email}`}>{s.submitter_email}</a> · {fmt(s.created_at)}
            </div>
            {s.image_url && <img src={s.image_url} alt="" style={{ maxHeight: 180, objectFit: 'cover', borderRadius: 10, alignSelf: 'flex-start' }} />}
            <input className={C.input} value={val(s, 'title')} onChange={(e) => setEdit(s, 'title', e.target.value)} />
            <textarea className={C.input} rows={8} value={val(s, 'content')} onChange={(e) => setEdit(s, 'content', e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={btn} onClick={() => approve(s)}>✓ Approve & publish</button>
              <button className={C.danger} onClick={() => reject(s)}>✕ Reject</button>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Admin new post ---- */}
      <div className={`${C.sec} mt-6`}>Notun blog post (admin)</div>
      <form onSubmit={addPost}>
        <input className={`${C.input} mb-2`} required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className={`${C.input} mb-2`} required rows={8} placeholder="Details (anuchchhed alada korte ekta faka line dao)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <input className={`${C.input} mb-2`} placeholder="Lekhok er naam (optional)" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <PhotoPicker files={files} setFiles={setFiles} label="Chobi (optional, 1 ta)" />
        <button className={`${btn} mt-2`} disabled={busy}>{busy ? 'Publishing...' : 'Publish'}</button>
      </form>

      {/* ---- Published ---- */}
      <div className={`${C.sec} mt-6`}>Published blog ({posts.length})</div>
      {!posts.length && <p className={C.muted}>Kichu nai.</p>}
      <div className={C.list}>
        {posts.map((p) => (
          <div className={C.card} key={p.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            {editing?.id === p.id ? (
              <>
                <input className={C.input} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                <textarea className={C.input} rows={8} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
                <input className={C.input} placeholder="Lekhok" value={editing.author_name || ''} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} />
                <input className={C.input} placeholder="Public link naam (a-z, 0-9, dash). Share korar pore bodlaben na" value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={btn} onClick={savePost}>Save</button>
                  <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {p.image_url && <img src={p.image_url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div className={C.name}>{p.title}</div>
                  <div className={C.muted}>{p.author_name && `${p.author_name} · `}{fmt(p.created_at)}</div>
                </div>
                <a href={`/b/${p.slug || p.id}`} target="_blank" rel="noreferrer"><button className="btn">View</button></a>
                <button className="btn" onClick={() => navigator.clipboard?.writeText(`${location.origin}/b/${p.slug || p.id}`)}>Copy link</button>
                <button className="btn" onClick={() => setEditing({ ...p })}>Edit</button>
                <button className={C.danger} onClick={() => delPost(p)}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
