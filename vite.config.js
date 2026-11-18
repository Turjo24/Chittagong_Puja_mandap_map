import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// og:image / og:url need an absolute URL. Set VITE_SITE_ORIGIN (e.g. https://yourdomain.com)
// when you get a custom domain; until then the Vercel URL is used. No code edit needed.
const siteOrigin = (mode) =>
  (loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_ORIGIN || 'https://ctgpujamandap.vercel.app').replace(/\/$/, '')

const siteOriginPlugin = () => {
  let origin = ''
  return {
    name: 'site-origin-html',
    configResolved: (c) => { origin = siteOrigin(c.mode) },
    transformIndexHtml: (html) => html.replaceAll('%SITE_ORIGIN%', origin),
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteOriginPlugin()],
  build: { rollupOptions: { output: { manualChunks: { leaflet: ['leaflet', 'react-leaflet'], supabase: ['@supabase/supabase-js'] } } } },
})
