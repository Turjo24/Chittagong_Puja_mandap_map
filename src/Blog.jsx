import { useEffect, useState } from 'react'
import { sb } from './supabase'

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

          if (error) {
            setErr(error.message)
            return
          }

          setPost(data || null)
        })
    } else {
      setPosts(null)

      sb.from('blog_posts')
        .select(
          'id,title,content,image_url,author_name,created_at'
        )
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!active) return

          if (error) {
            setErr(error.message)
            return
          }

          setPosts(data || [])
        })
    }

    return () => {
      active = false
    }
  }, [id])

  // Error message
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
      <div
        className="page"
        style={{
          maxWidth: 760,
          margin: '0 auto'
        }}
      >
        <a href="#/blog">{t.back}</a>

        <h2 style={{ marginBottom: 4 }}>
          {post.title}
        </h2>

        <p
          className="muted"
          style={{ marginTop: 0 }}
        >
          {post.author_name && (
            <>
              {t.by}: {post.author_name} ·{' '}
            </>
          )}
          {date(post.created_at)}
        </p>

        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title || ''}
            style={{
              width: '100%',
              maxHeight: 420,
              objectFit: 'cover',
              borderRadius: 14,
              marginBottom: 14
            }}
          />
        )}

        {paras(post.content).map((p, i) => (
          <p
            key={i}
            style={{
              lineHeight: 1.8,
              whiteSpace: 'pre-line'
            }}
          >
            {p}
          </p>
        ))}
      </div>
    )
  }

  // Blog listing
  return (
    <div
      className="page"
      style={{
        maxWidth: 1100,
        margin: '0 auto'
      }}
    >
      {/* Header */}
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
          <h2 style={{ marginBottom: 2 }}>
            {t.title}
          </h2>

          <p
            className="muted"
            style={{ marginTop: 0 }}
          >
            {t.sub}
          </p>
        </div>

        <a href="#/blog-submit">
          <button className="btn pri">
            {t.write}
          </button>
        </a>
      </div>

      {/* Loading */}
      {posts === null && (
        <p className="muted">{t.loading}</p>
      )}

      {/* Empty state */}
      {posts !== null && posts?.length === 0 && (
        <p className="muted">{t.none}</p>
      )}

      {/* Responsive blog grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(posts || []).map((p) => (
          <a
            key={p.id}
            href={`#/blog?id=${p.id}`}
            className="block h-full no-underline text-inherit"
            style={{
              color: 'inherit',
              textDecoration: 'none'
            }}
          >
            <article
              className="h-full overflow-hidden rounded-xl border border-gray-300/30"
              style={{
                height: '100%',
                border: '1px solid rgba(128,128,128,.3)',
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'transform 0.2s ease'
              }}
            >
              {/* Blog image */}
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.title || ''}
                  loading="lazy"
                  className="block h-40 w-full object-cover"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 160,
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 160,
                    background: 'rgba(232,89,12,.12)'
                  }}
                />
              )}

              {/* Blog details */}
              <div style={{ padding: 14 }}>
                <h4
                  style={{
                    margin: '0 0 8px',
                    lineHeight: 1.5,
                    overflowWrap: 'anywhere'
                  }}
                >
                  {p.title}
                </h4>

                <small className="muted">
                  {p.author_name && (
                    <>{p.author_name} · </>
                  )}
                  {date(p.created_at)}
                </small>

                <p
                  style={{
                    margin: '10px 0',
                    fontSize: 14,
                    lineHeight: 1.7,
                    overflowWrap: 'anywhere'
                  }}
                >
                  {excerpt(p.content)}
                </p>

                <b style={{ fontSize: 13 }}>
                  {t.more}
                </b>
              </div>
            </article>
          </a>
        ))}
      </div>
    </div>
  )
}
