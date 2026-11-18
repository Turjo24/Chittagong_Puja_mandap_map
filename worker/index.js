// Cloudflare Workers entry: serves /api/share, everything else comes from the built site (dist/).
import { buildShareCard, originFrom } from '../shared/shareCard.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/share') {
      const origin = originFrom(env.SITE_ORIGIN, url.host)
      return new Response(buildShareCard(Object.fromEntries(url.searchParams), origin), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    }
    return env.ASSETS.fetch(request)
  },
}
