# Chattogram Puja Mandap Guide (puja-map)

React 18 + Vite 5 + Tailwind 4 + Leaflet + Supabase. Live: https://ctgpujamandap.vercel.app/

## Run locally
```bash
npm install
cp .env.example .env      # tomar .env already ei zip-e ache; shudhu notun machine-e lagbe
npm run dev               # http://localhost:5173
npm run build             # production build -> dist/
npm run preview           # dist/ local-e dekho
```
Node 18+ (22 recommended; `.node-version` ache).

## Environment variables
| Name | Kothay | Kaj |
|---|---|---|
| `VITE_SUPABASE_URL` | build | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | build | Supabase **anon** public key (service_role key kokhono boshabe na) |
| `VITE_SITE_ORIGIN` | build, optional | og:image / og:url-er absolute URL. Default `https://ctgpujamandap.vercel.app` |
| `SITE_ORIGIN` | runtime (API), optional | `/api/share`-er origin. Na dile request-er host use hoy |

## Deploy
**Vercel (current):** GitHub repo import → framework Vite → env vars dao → Deploy. `vercel.json` SPA rewrite, `/api/*`, cache header handle kore.

**Cloudflare Pages (domain chhara free option):** `docs/CLOUDFLARE_SETUP.md` → Option B.

## Bangladesh network problem
"This site can't be reached" mane browser server-er sathe connect-i korte pare ni — code-er bug na. Details, sources,
ar tumi nije kivabe test korbe: **`docs/BANGLADESH_ACCESS_DIAGNOSIS.md`**.
Custom domain + Cloudflare proxy setup: **`docs/CLOUDFLARE_SETUP.md`** → Option A.

## Custom domain pele (checklist)
1. Domain kino → Cloudflare Free-e add → registrar-e nameserver bodlao.
2. Vercel → Settings → Domains → domain add → Vercel-er dekhano DNS record Cloudflare-e dao (prothome grey cloud).
3. Valid hole → orange cloud (Proxied), SSL mode **Full (strict)**.
4. Vercel env: `VITE_SITE_ORIGIN` ar `SITE_ORIGIN` = `https://yourdomain.com` → Redeploy.
5. Mobile data-te GP/Robi/BL/Teletalk-e test.
(Full step: `docs/CLOUDFLARE_SETUP.md`)

## Ei version-e ki change hoyeche
Shob existing feature, design, content, route ager moto. Change shudhu:
- Google Fonts → self-hosted (`@fontsource`), same font/weight (`src/main.jsx`, `index.html`)
- `api/share.js` → escape + crash fix; logic `shared/shareCard.js`-e (Vercel o Cloudflare duitar jonno)
- `functions/api/share.js`, `public/_headers`, `.node-version` → Cloudflare Pages support
- `vercel.json` → immutable asset cache + basic security headers (rewrites ager moto)
- `pintro.png` typo → `pntro.png` (`src/ShareButton.jsx`, `api/share.js`)
- `index.html` → og URL env-driven, meta description add
- Notun: `.env.example`, `README.md`, `docs/`

## Structure
```
api/                 Vercel serverless (share card)
functions/api/       Cloudflare Pages Function (same share card)
shared/shareCard.js  common share-card HTML
src/                 React app (songs/ e mp3 — Player auto-detect kore)
public/              static (pntro.png, flame.jpg, _headers)
supabase/            SQL schema + updates
docs/                diagnosis + Cloudflare setup
```

## Known notes
- `src/songs/` ~56 MB mp3 — build-e jay, play korle load hoy. Mobile data-r jonno pore compress korle bhalo (ami chhui ni).
- `@vercel/speed-insights` dependency ache kintu code-e use hoy na; ami remove kori ni.
- `src/config.js`-e contact email/whatsapp ekhono placeholder (`your@email.com`) — nijer ta boshao.
- `.env`-e shudhu anon (public) key ache — eta browser-e jay-i; tobu zip-ta public-e share korbe na.
