import { useEffect, useState } from 'react'
import { sb } from './supabase'
import ShareButton from './ShareButton'

const L = {
  bn: {
    title: 'পূজা ব্লগ',
    sub: 'পূজা নিয়ে লেখা, তথ্য ও গল্প',
    write: '✍ তুমিও লেখো',
    back: '← সব ব্লগ',
    by: 'লেখক',
    none: 'এখনো কোনো ব্লগ নেই।',
    loading: 'লোড হচ্ছে...',
    nf: 'ব্লগটি পাওয়া যায়নি।',
    more: 'পড়ো →'
  },
  en: {
    title: 'Puja Blog',
    sub: 'Writing, details and stories about Puja',
    write: '✍ Write for us',
    back: '← All posts',
    by: 'By',
    none: 'No posts yet.',
    loading: 'Loading...',
    nf: 'Post not found.',
    more: 'Read →'
  }
}

const paras = (s) =>
  (s || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

const excerpt = (s, n = 140) => {
  const x = (s || '').replace(/\s+/g, ' ').trim()
  return x.length > n ? x.slice(0, n).trimEnd() + '…' : x
}

const getId = () =>
  new URLSearchParams(location.hash.split('?')[1] || '').get('id')

export default function Blog({ lang = 'bn' }) {
  const t = L[lang] || L.bn
  const id = getId()

  const [posts, setPosts] = useState(null)
  const [post, setPost] = useState(undefined)
  const [err, setErr] = useState('')

  const date = (d) =>
    new Date(d).toLocaleDateString(
      lang === 'bn' ? 'bn-BD' : 'en-GB',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    )

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

  if (err) {
    return (
      <div className="page">
        <p className="msg">{err}</p>
      </div>
    )
  }

  // Single blog post
  if (id) {
    if (post === undefined) {
      return (
        <div className="page">
          <p className="muted">{t.loading}</p>
        </div>
      )
    }

    if (post === null) {
      return (
        <div className="page">
          <a href="#/blog">{t.back}</a>
          <p className="muted">{t.nf}</p>
        </div>
      )
    }

    return (
      <div className="page" style={{ maxWidth: 760, margin: '0 auto' }}>
        <a href="#/blog" style={{ textDecoration: 'none', fontWeight: 'bold' }}>{t.back}</a>

        {/* Detailed Single Blog Card */}
        <div 
          style={{
            border: '1px solid rgba(128,128,128,0.25)',
            borderRadius: 16,
            padding: 20,
            marginTop: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <h2 style={{ margin: '0 0 10px', fontSize: '1.8rem' }}>{post.title}</h2>

          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: 10,
              paddingBottom: 14,
              borderBottom: '1px solid rgba(128,128,128,0.2)',
              marginBottom: 16
            }}
          >
            <span className="muted" style={{ fontSize: 14 }}>
              {post.author_name ? `${t.by}: ${post.author_name}` : 'Admin'} · {date(post.created_at)}
            </span>

            {/* Share Options */}
            <ShareButton m={post} kind="b" title={post.title} />
          </div>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title || ''}
              style={{
                width: '100%',
                maxHeight: 420,
                objectFit: 'cover',
                borderRadius: 12,
                marginBottom: 20
              }}
            />
          )}

          <div style={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
            {paras(post.content).map((p, i) => (
              <p key={i} style={{ marginBottom: 16, whiteSpace: 'pre-line' }}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Blog listing
  return (
    <div className="page" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 20
        }}
      >
        <div>
          <h2 style={{ marginBottom: 2 }}>{t.title}</h2>
          <p className="muted" style={{ marginTop: 0 }}>{t.sub}</p>
        </div>

        <a href="#/blog-submit">
          <button className="btn pri">{t.write}</button>
        </a>
      </div>

      {posts === null && <p className="muted">{t.loading}</p>}
      {posts !== null && posts?.length === 0 && <p className="muted">{t.none}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(posts || []).map((p) => (
          <a
            key={p.id}
            href={`#/blog?id=${p.id}`}
            className="block h-full no-underline text-inherit"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <article
              style={{
                height: '100%',
                border: '1px solid rgba(128,128,128,.3)',
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'transform 0.2s ease'
              }}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.title || ''}
                  loading="lazy"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 160,
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{ height: 160, background: 'rgba(232,89,12,.12)' }} />
              )}

              <div style={{ padding: 14 }}>
                <h4 style={{ margin: '0 0 8px', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                  {p.title}
                </h4>

                <small className="muted">
                  {p.author_name && <>{p.author_name} · </>}
                  {date(p.created_at)}
                </small>

                <p style={{ margin: '10px 0', fontSize: 14, lineHeight: 1.7, overflowWrap: 'anywhere' }}>
                  {excerpt(p.content)}
                </p>

                <b style={{ fontSize: 13 }}>{t.more}</b>
              </div>
            </article>
          </a>
        ))}
      </div>
    </div>
  )
}