// Cloudflare Pages Function: /api/share  (same output as api/share.js on Vercel)
import { buildShareCard, originFrom } from '../../shared/shareCard.js'

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const origin = originFrom(env.SITE_ORIGIN, url.host)
  const q = Object.fromEntries(url.searchParams)
  return new Response(buildShareCard(q, origin), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
