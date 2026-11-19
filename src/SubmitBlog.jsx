import { useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'
import { go, nav } from './spa'

// kagoje-r moto sheet
const sheetStyle = {
  backgroundImage: 'radial-gradient(ellipse at top, rgba(255,255,255,.25), transparent 65%)',
  boxShadow: '0 1px 0 #e9dcb9, 0 2px 0 #f4ead0, 0 12px 28px rgba(60,40,10,.18)',
}

const L = {
  bn: {
    title: 'তোমার ব্লগ পাঠাও',
    sub: 'পূজা নিয়ে লেখা পাঠাও। অ্যাডমিন দেখে ঠিক থাকলে ব্লগে যোগ করবে।',
    t: 'ব্লগের শিরোনাম',
    c: 'বিস্তারিত লেখো (অনুচ্ছেদ আলাদা করতে একটা ফাঁকা লাইন দাও)',
    n: 'তোমার নাম',
    e: 'তোমার ইমেইল',
    pic: 'ছবি যোগ করো (ঐচ্ছিক, ১টি)',
    send: 'পাঠাও',
    sending: 'পাঠানো হচ্ছে...',
    done: 'ধন্যবাদ! তোমার ব্লগ অ্যাডমিনের কাছে গেছে। অনুমোদন পেলে ব্লগে দেখা যাবে।',
    note: 'তোমার ইমেইল শুধু অ্যাডমিন দেখতে পাবে, ব্লগে দেখানো হবে না।',
    back: '← ব্লগে ফিরে যাও',
    again: 'আরেকটা লেখো'
  },
  en: {
    title: 'Send your blog post',
    sub: 'Write about Puja. The admin will review it and add it to the blog.',
    t: 'Title',
    c: 'Details (leave a blank line between paragraphs)',
    n: 'Your name',
    e: 'Your email',
    pic: 'Add a picture (optional, 1)',
    send: 'Submit',
    sending: 'Sending...',
    done: 'Thank you! Your post went to the admin. It will appear on the blog once approved.',
    note: 'Your email is visible to the admin only, it is not shown on the blog.',
    back: '← Back to blog',
    again: 'Write another'
  }
}

export default function SubmitBlog({ lang = 'bn' }) {
  const t = L[lang] || L.bn
  const [form, setForm] = useState({ title: '', content: '', name: '', email: '' })
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setMsg('')
    const pics = files.slice(0, 1)
    if (pics.length) { const err = check(pics); if (err) return setMsg(err) }
    setBusy(true)
    try {
      let image = null
      if (pics.length) image = (await uploadAll(pics))[0]
      const { error } = await sb.from('blog_submissions').insert({
        title: form.title.trim(),
        content: form.content.trim(),
        submitter_name: form.name.trim(),
        submitter_email: form.email.trim(),
        image_url: image?.url || null,
        image_path: image?.path || null
      })
      if (error) throw error
      setSent(true); setFiles([])
      setForm({ title: '', content: '', name: '', email: '' })
    } catch (x) {
      console.error('blog submit error:', x)
      setMsg(x?.message || String(x))
    }
    setBusy(false)
  }

  return (
    <div className="page">
      <div className="mx-auto max-w-2xl">
        <a href="/blog" onClick={nav('/blog')} className="text-sm font-bold no-underline">{t.back}</a>

        <div
          className="relative mt-6 rounded-sm border border-amber-200 bg-amber-50 p-5 text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 sm:p-8"
          style={sheetStyle}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 left-1/2 h-5 w-20 -translate-x-1/2 -rotate-2 bg-amber-200/70 shadow-sm dark:bg-stone-500/50"
          />
          <h2 className="mb-1 text-2xl font-extrabold">{t.title}</h2>
          <p className="muted mt-0">{t.sub}</p>

          {sent ? (
            <div>
              <p className="msg">{t.done}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn pri" onClick={() => go('/blog')}>{t.back}</button>
                <button type="button" className="btn" onClick={() => setSent(false)}>{t.again}</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 grid gap-3">
              <input required maxLength={200} placeholder={t.t} value={form.title} onChange={set('title')} />
              <textarea required rows={10} maxLength={20000} placeholder={t.c} value={form.content} onChange={set('content')} />
              <input required maxLength={120} placeholder={t.n} value={form.name} onChange={set('name')} />
              <input required type="email" maxLength={200} placeholder={t.e} value={form.email} onChange={set('email')} />
              <PhotoPicker files={files} setFiles={setFiles} label={t.pic} />
              <p className="muted" style={{ fontSize: 12 }}>{t.note}</p>
              <button className="btn pri" disabled={busy}>{busy ? t.sending : t.send}</button>
              {msg && <p className="msg">{msg}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
