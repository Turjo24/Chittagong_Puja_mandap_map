# Cloudflare Free Plan setup

> Ami tomar Cloudflare/Vercel account-e login korte pari na, tai niche-r step-gulo **tomake nije korte hobe**.
> Project-er shob file ready — shudhu dashboard-er click-gulo baki.

## Age bujhe nao: custom domain lagbe ki?

| Tumi ki chao | Custom domain lagbe? |
|---|---|
| Cloudflare **DNS + proxy** (orange cloud) Vercel-er samne boshano | **Ha, lagbe.** Cloudflare shudhu oi domain-er DNS control kore jeta tumi own koro. `*.vercel.app` Vercel-er domain, ota Cloudflare-e add kora jay na. |
| Cloudflare-er network-e **hosting** (Cloudflare Pages) | **Na.** Free `<name>.pages.dev` subdomain pabe. |

Tai domain na kena porjonto tomar duto option ache: **Option B (Pages, free, ekhoni)** ba **Option A (domain kine Vercel + Cloudflare)**.

> ⚠ Duto option-er kono-tai BD mobile network-e ami test korte pari ni. `pages.dev` BD-te sob ISP-te khule ki na — ami jani na.
> Deploy kore GP/Robi/Banglalink/Teletalk-e nijei khule dekho.

---

## Option B — Cloudflare Pages (domain chhara, free)

1. Project ta GitHub-e push koro (`.env` push korbe na — `.gitignore`-e ache).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → repo select.
3. Build settings:
   - Framework preset: **Vite** (ba None)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Environment variables** (Production): 
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`.env` file theke)
   - `NODE_VERSION` = `22` (`.node-version` file-o ache)
5. Save and Deploy. Site pabe `https://<project>.pages.dev`.
6. `/api/share` (Facebook/WhatsApp preview) `functions/api/share.js` theke automatic Pages Function hishebe cholbe.
   Git integration chhara dashboard-e dist drag-and-drop korle Functions kaj kore na — tai Git use koro.

Notes:
- Pages-e SPA routing automatic: `404.html` nai, tai unknown path (`/about`, `/blog`...) `index.html` serve kore. Alada `_redirects` dorkar nai (dile loop warning ashe).
- Pages-er per-file limit 25 MiB. Tomar sobcheye boro file (mp3) ~13.8 MB — thik ache.
- `public/_headers` immutable cache + security header dey.
- Vercel-ta chaile ekoi shomoy-e chaliye rakhte paro; duto alada site.

---

## Option A — Custom domain + Vercel + Cloudflare proxy

### 1. Domain kino
Je kono registrar theke (.com, ba .bd registrar). Price ami verify kori ni, tai number dilam na.

### 2. Cloudflare-e domain add koro
Cloudflare dashboard → **Add a domain** → **Free** plan → Cloudflare-er dewa duto nameserver registrar-er panel-e boshao. Active hote kichu ghonta lagte pare.

### 3. Vercel-e domain add koro
Vercel project → **Settings → Domains → Add** (`yourdomain.com` ar `www.yourdomain.com`).
Vercel **je DNS record dekhabe, hubohu seta-i** Cloudflare-er **DNS → Records**-e dao. (Ami record bananor jonno kono value likhi ni —
value Vercel dashboard-er sathe porivartito hote pare.)

### 4. Prothome **DNS only** (grey cloud) rakho
Vercel-e "Valid Configuration" + certificate issue na howa porjonto Cloudflare-er record-gulo grey cloud (DNS only) rakho.

### 5. Tarpor Proxy on koro (orange cloud) — BD fix-er mul step
Record-gulo **Proxied** koro. Er por user-er ISP Cloudflare-er IP-te connect korbe.

Cloudflare → **SSL/TLS → Overview**: mode **Full (strict)**.  **Flexible kokhono na** — Vercel HTTP→HTTPS redirect kore, Cloudflare HTTP-te pathay → redirect loop.

### 6. Cache Rules (Rules → Cache Rules)
Vercel-er [official guide](https://vercel.com/guides/using-cloudflare-with-vercel) onujayi proxy-r somoy:
- `/.well-known/vercel/*` — **cache koro na** (Bypass cache). Certificate renewal-er jonno dorkar.
- `/api/*` — Bypass cache (ba amar `s-maxage=3600` header mene cache — tomar icche).
- `/assets/*` — Eligible for cache, origin header mene (immutable, hashed file tai safe).
- HTML (`/`, `/blog` ...) — cache korba na (Cloudflare default-e HTML cache kore na). Cache korle deploy-er por purono HTML + notun asset mismatch hote pare (Vercel guide-o eta warning dey).

### 7. Notun domain code-e janao
Vercel → **Settings → Environment Variables**:
- `VITE_SITE_ORIGIN` = `https://yourdomain.com`   (og:image / og:url build-e boshe)
- `SITE_ORIGIN` = `https://yourdomain.com`        (share API)
Tarpor **Redeploy**.

### 8. Check
- `https://yourdomain.com` , `/blog`, `/about` direct open.
- Facebook Sharing Debugger-e kono share link.
- GP, Robi, Banglalink, Teletalk — mobile data-te (Wi-Fi na).
- Admin: login session browser-origin-er hishebe save hoy, tai notun domain-e ekbar abar login korte hobe. Password login, tai Supabase redirect URL change dorkar na.

### Trade-off (shotti kotha)
Vercel nijei bole direct (DNS only) connection-i tader recommended; Cloudflare proxy "security, caching, operational tradeoffs" ane,
ar Vercel-er Bot Protection proxy-r pichone kaj kore na. Tomar case-e **ISP Vercel IP reach korte na parle** proxy-i fayda dey,
tai ei trade-off worth it hote pare — kintu eta BD-te test kore confirm korte hobe. Jodi proxy on kore kono khanei problem hoy,
grey cloud-e fire gele ager obostha-e ashbe.

---

## Free workaround ekhoni (user-er side)
Je user-er site khole na, tader phone-e **Settings → Network → Private DNS → `dns.google`** (ba `one.one.one.one`) dile kichu cases-e kaj korechhe
([report](https://community.vercel.com/t/intermittent-err-connection-timed-out-on-bangladesh-mobile-networks-classorbit/1000000091)).
Eta fix na, shudhu temporary workaround.
