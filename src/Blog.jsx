import { useEffect, useState } from 'react'
import { sb } from './supabase'
import ShareButton from './ShareButton'
import { go, nav } from './spa'

const L = {
  bn: {
    paper: 'চট্টগ্রাম পূজা মণ্ডপ গাইড',
    kicker: 'পূজা ব্লগ',
    sub: 'পূজা নিয়ে লেখা, তথ্য ও গল্প',
    write: '✍ তুমিও লেখো',
    back: '← সব ব্লগ',
    by: 'লেখক',
    admin: 'অ্যাডমিন',
    none: 'এখনো কোনো ব্লগ নেই।',
    loading: 'লোড হচ্ছে...',
    nf: 'ব্লগটি পাওয়া যায়নি।',
    more: 'পড়ো →',
    lead: 'প্রধান লেখা',
    shareHint: 'লেখাটি ভালো লাগলে শেয়ার করো',
  },
  en: {
    paper: 'Chattogram Puja Mandap Guide',
    kicker: 'Puja Blog',
    sub: 'Writing, details and stories about Puja',
    write: '✍ Write for us',
    back: '← All posts',
    by: 'By',
    admin: 'Admin',
    none: 'No posts yet.',
    loading: 'Loading...',
    nf: 'Post not found.',
    more: 'Read →',
    lead: 'Lead story',
    shareHint: 'Liked it? Share it',
  },
}

const TILT = ['sm:rotate-1', 'sm:-rotate-1', ''] // card gulo ektu tilted, hover e sojja hoy

// kagoje-r moto stacked-sheet shadow
const sheetStyle = {
  backgroundImage: 'radial-gradient(ellipse at top, rgba(255,255,255,.25), transparent 65%)',
  boxShadow: '0 1px 0 #e9dcb9, 0 2px 0 #f4ead0, 0 12px 28px rgba(60,40,10,.18)',
}

const paras = (s) => (s || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

const excerpt = (s, n = 140) => {
  const x = (s || '').replace(/\s+/g, ' ').trim()
  return x.length > n ? x.slice(0, n).trimEnd() + '…' : x
}

// /blog/<id>  (notun)  |  /blog?id=<id>  (share.js er purono link)  |  #/blog?id=  (aro purono)
const getId = () => {
  try {
    const m = window.location.pathname.match(/^\/blog\/([^/]+)/i)
    if (m) return decodeURIComponent(m[1])
  } catch { /* bad url */ }
  const q = new URLSearchParams(window.location.search).get('id')
  if (q) return q
  return new URLSearchParams(window.location.hash.split('?')[1] || '').get('id')
}

const Tape = () => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute -top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 -rotate-2 bg-amber-200/70 shadow-sm dark:bg-stone-500/50"
  />
)

function PostCard({ p, lead, tilt, t, serif, date }) {
  const href = `/blog/${p.id}`
  const imgH = lead ? 'h-56 sm:h-full' : 'h-44'
  return (
    <article
      className={`group relative flex flex-col rounded-sm border border-amber-200 bg-amber-50 text-stone-800 transition duration-300 hover:-translate-y-1 hover:rotate-0 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 ${
        lead ? 'sm:col-span-2 sm:flex-row lg:col-span-3' : ''
      } ${tilt}`}
      style={sheetStyle}
    >
      <Tape />
      <div className={`shrink-0 overflow-hidden ${lead ? 'sm:w-1/2' : ''}`}>
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.title || ''}
            loading="lazy"
            className={`block w-full object-cover ${imgH}`}
            style={{ filter: 'sepia(.25) contrast(1.03)' }}
          />
        ) : (
          <div className={`flex w-full items-center justify-center bg-amber-100 text-4xl dark:bg-stone-700 ${imgH}`}>🪔</div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {lead && (
          <span className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-300">{t.lead}</span>
        )}
        <h3 className={`${serif} break-words font-bold leading-snug ${lead ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
          {/* after: overlay = pura card click-able */}
          <a href={href} onClick={nav(href)} className="no-underline after:absolute after:inset-0">{p.title}</a>
        </h3>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {p.author_name ? `${t.by}: ${p.author_name}` : t.admin} · {date(p.created_at)}
        </p>
        <p className="mt-3 flex-1 break-words text-sm leading-7">{excerpt(p.content, lead ? 260 : 140)}</p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-amber-300 pt-3 dark:border-stone-600">
          <span className="text-sm font-bold text-orange-700 dark:text-orange-300">{t.more}</span>
          <div className="relative z-10">
            <ShareButton m={p} kind="b" title={p.title} compact />
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Blog({ lang = 'bn' }) {
  const t = L[lang] || L.bn
  const serif = lang === 'en' ? 'font-serif' : ''

  const [id, setId] = useState(getId)
  const [posts, setPosts] = useState(null)
  const [post, setPost] = useState(undefined)
  const [err, setErr] = useState('')

  const date = (d) =>
    new Date(d).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    const f = () => setId(getId())
    window.addEventListener('popstate', f)
    return () => window.removeEventListener('popstate', f)
  }, [])

  useEffect(() => {
    let active = true
    setErr('')

    if (id) {
      setPost(undefined)
      sb.from('blog_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!active) return
          if (error) return setErr(error.message)
          setPost(data || null)
        })
    } else {
      setPosts(null)
      sb.from('blog_posts')
        .select('id,title,content,image_url,author_name,created_at')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!active) return
          if (error) return setErr(error.message)
          setPosts(data || [])
        })
    }
    return () => { active = false }
  }, [id])

  // post khulle tab title + description (Google/share er jonno)
  useEffect(() => {
    if (!post) return
    document.title = `${post.title} | Chattogram Puja Mandap Guide`
    document.querySelector('meta[name="description"]')?.setAttribute('content', excerpt(post.content, 150))
  }, [post])

  if (err) {
    return (
      <div className="page">
        <p className="msg">{err}</p>
      </div>
    )
  }

  // ============ Single post (paper) ============
  if (id) {
    if (post === undefined) {
      return <div className="page"><p className="muted">{t.loading}</p></div>
    }
    if (post === null) {
      return (
        <div className="page">
          <a href="/blog" onClick={nav('/blog')}>{t.back}</a>
          <p className="muted">{t.nf}</p>
        </div>
      )
    }

    const body = paras(post.content)
    return (
      <div className="page">
        <div className="mx-auto max-w-3xl">
          <a href="/blog" onClick={nav('/blog')} className="inline-block text-sm font-bold no-underline">{t.back}</a>

          <article
            className="relative mt-6 rounded-sm border border-amber-200 bg-amber-50 px-5 py-8 text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 sm:px-12 sm:py-12"
            style={sheetStyle}
          >
            <Tape />
            <p className="text-center text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-amber-200/70">{t.paper}</p>
            <div className="my-3 border-t-4 border-double border-stone-400 dark:border-stone-500" />

            <h1 className={`${serif} break-words text-3xl font-extrabold leading-tight sm:text-4xl`}>{post.title}</h1>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-stone-300 py-3 text-sm dark:border-stone-600">
              <span className="italic text-stone-600 dark:text-stone-300">
                {post.author_name ? `${t.by}: ${post.author_name}` : t.admin} · {date(post.created_at)}
              </span>
              <ShareButton m={post} kind="b" title={post.title} compact />
            </div>

            {post.image_url && (
              <figure className="mt-6 border border-stone-300 bg-white/60 p-1 dark:border-stone-600 dark:bg-stone-700/40">
                <img
                  src={post.image_url}
                  alt={post.title || ''}
                  className="block w-full object-cover"
                  style={{ maxHeight: 420, filter: 'sepia(.2) contrast(1.02)' }}
                />
              </figure>
            )}

            <div className="mt-8">
              {body.map((p, i) => (
                <p
                  key={i}
                  className={`mb-5 whitespace-pre-line break-words text-lg leading-8 ${
                    i === 0
                      ? 'first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:font-bold first-letter:leading-none first-letter:text-orange-700 dark:first-letter:text-orange-300'
                      : ''
                  }`}
                >
                  {p}
                </p>
              ))}
            </div>

            <p className="my-6 text-center text-2xl text-orange-700 dark:text-orange-300" aria-hidden="true">❖</p>

            <div className="rounded border border-dashed border-amber-300 p-4 dark:border-stone-600">
              <p className="mb-3 text-sm font-bold">{t.shareHint}</p>
              <ShareButton m={post} kind="b" title={post.title} />
            </div>
          </article>
        </div>
      </div>
    )
  }

  // ============ Listing (newspaper front page) ============
  const today = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="page">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center text-stone-800 dark:text-stone-100">
          <div className="flex items-center justify-between border-b border-stone-400 pb-1 text-xs uppercase tracking-widest text-stone-500 dark:border-stone-500 dark:text-stone-400">
            <span>{t.kicker}</span>
            <span>{today}</span>
          </div>
          <h2 className={`${serif} my-3 text-4xl font-extrabold sm:text-6xl`}>{t.paper}</h2>
          <div className="border-y-4 border-double border-stone-500 py-2 text-sm italic text-stone-600 dark:text-stone-300">{t.sub}</div>
          <button type="button" className="btn pri mt-4" onClick={() => go('/blog-submit')}>{t.write}</button>
        </header>

        {posts === null && <p className="muted">{t.loading}</p>}
        {posts !== null && posts.length === 0 && <p className="muted">{t.none}</p>}

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(posts || []).map((p, i) => (
            <PostCard key={p.id} p={p} lead={i === 0} tilt={i === 0 ? '' : TILT[i % 3]} t={t} serif={serif} date={date} />
          ))}
        </div>
      </div>
    </div>
  )
}
