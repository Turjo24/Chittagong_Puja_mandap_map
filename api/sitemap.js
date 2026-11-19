// /sitemap.xml (vercel.json rewrite diye ei function e ashe). Mandap + heritage notun add holei auto update.
const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const STATIC = ['/', '/heritage', '/routes', '/schedule', '/parikroma', '/vote', '/reps', '/player', '/blog', '/zones', '/sponsors', '/about', '/tutorial']
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const get = async (p) => {
  const r = await fetch(`${SB_URL}/rest/v1/${p}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } })
  return r.ok ? r.json() : []
}

export default async function handler(req, res) {
  const base = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '')
  const [m, h] = await Promise.all([
    get('mandaps?select=id,slug&status=eq.approved&limit=5000'),
    get('heritage_docs?select=id&status=eq.approved&limit=5000'),
  ])
  const urls = [
    ...STATIC.map((p) => base + p),
    ...m.map((x) => `${base}/?m=${encodeURIComponent(x.slug || x.id)}`),
    ...h.map((x) => `${base}/heritage?docId=${x.id}`),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>`
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
