// Build er age chole: public/sitemap.xml + public/robots.txt banay
// Lagbe env: VITE_SITE_ORIGIN (jemon https://tomar-site.pages.dev), VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
import { writeFileSync, mkdirSync } from 'node:fs'

const ORIGIN = (process.env.VITE_SITE_ORIGIN || '').replace(/\/+$/, '')
const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!ORIGIN) {
  console.warn('[sitemap] VITE_SITE_ORIGIN set kora nai, sitemap skip korlam')
  process.exit(0)
}

const STATIC = [
  ['/', '1.0'], ['/heritage', '0.9'], ['/parikroma', '0.8'], ['/routes', '0.7'],
  ['/schedule', '0.7'], ['/zones', '0.7'], ['/blog', '0.6'], ['/vote', '0.5'],
  ['/reps', '0.5'], ['/player', '0.4'], ['/about', '0.4'], ['/tutorial', '0.4'], ['/sponsors', '0.3'],
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const today = new Date().toISOString().slice(0, 10)

let mandaps = []
try {
  const r = await fetch(`${SB_URL}/rest/v1/mandaps?select=id,slug&status=eq.approved&limit=2000`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  })
  if (!r.ok) throw new Error('Supabase ' + r.status)
  mandaps = await r.json()
} catch (e) {
  console.warn('[sitemap] mandap list ana gelo na, shudhu static page:', e.message)
}

let blogs = []
try {
  const r = await fetch(`${SB_URL}/rest/v1/blog_posts?select=id&limit=2000`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  })
  if (r.ok) blogs = await r.json()
} catch { /* blog na thakleo cholbe */ }

const urls = [
  ...STATIC.map(([p, pr]) => ({ loc: ORIGIN + p, pr })),
  ...blogs.map((b) => ({ loc: `${ORIGIN}/blog/${b.id}`, pr: '0.6' })),
  ...mandaps.map((m) => ({ loc: `${ORIGIN}/mandap/${encodeURIComponent(m.slug || m.id)}`, pr: '0.8' })),
]

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${today}</lastmod><priority>${u.pr}</priority></url>`)
    .join('\n') +
  `\n</urlset>\n`

mkdirSync('public', { recursive: true })
writeFileSync('public/sitemap.xml', xml)
writeFileSync(
  'public/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`
)
console.log(`[sitemap] ${urls.length} URL likhlam (${mandaps.length} mandap, ${blogs.length} blog)`)
