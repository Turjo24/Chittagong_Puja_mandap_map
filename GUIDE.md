# Puja Map — AI Chatbot + SEO guide

## 1. Kon file kothay boshabe

| File (zip e) | Tomar project e kothay | Kaj |
|---|---|---|
| `src/Chatbot.jsx` | `src/Chatbot.jsx` (NOTUN) | floating chat + map control + feature tour |
| `src/Seo.js` | `src/Seo.js` (NOTUN) | page wise title/meta/JSON-LD |
| `src/App.jsx` | `src/App.jsx` (**REPLACE**) | chatbot + SEO wire kora (ager code ager moto, shudhu ~35 line add) |
| `api/chat.js` | `api/chat.js` (NOTUN, `api/share.js` er pashe) | AI server |
| `api/sitemap.js` | `api/sitemap.js` (NOTUN) | auto sitemap.xml |
| `public/robots.txt` | `public/robots.txt` | `YOUR-DOMAIN.com` bodlao |
| `seo/index.head.html` | `index.html` er `<head>` e paste | meta tags |
| `seo/vercel.json.add.txt` | `vercel.json` e 1 ta rewrite add | sitemap.xml chalu |

> Note: tumi shudhu `src` folder pathaiso, tai `index.html`, `vercel.json`, `api/share.js` dekhi nai. Egulo bhange nai, shudhu add korbe.

## 2. Free AI key (Gemini) — step by step

1. https://aistudio.google.com e Google account diye login → **Get API key** → **Create API key**.
2. Vercel → tomar project → **Settings → Environment Variables** e add koro:
   - `GEMINI_API_KEY` = oi key
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY` = tomar `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` er same value (na dilei cholbe, code VITE_ ta fallback hishebe pore)
   - (optional) `GEMINI_MODEL` = AI Studio te je Flash-Lite model er exact ID dekhao (comma diye ekadhik dile ekta limit khele porerta try kore)
3. **Redeploy** koro (env change er por redeploy lagbe).
4. Key kokhono `VITE_` diye shuru korbe na, na hole browser e expose hoye jabe.

Free tier er limit: Google ekhon per-model limit shudhu AI Studio console e dekhay, ar free tier e pathano content Google er product improve e use hote pare. Tai chat e keu personal info likhle seta Google e jete pare — chat er upore ei kotha ekta line likhe dite paro. Limit shesh hole bot "ektu pore" bole; amra rate-limit (IP prothi 10 min e 20 ta) ar 5 min cache rekhechi jate free quota tikey thake.

## 3. Bot ki ki kore

- "Dampara te asi, kache kon puja ase?" → area/mandap name theke khuje map e fly kore.
- 📍 button → GPS diye km soho nearest 5 ta, map e prothom ta focus, baki gulo button.
- "X mandap er heritage ase?" → heritage data theke summary + **Heritage page e oi doc khule dey**; na thakle submit korte bole.
- "Feature gulo dekhao" → **Feature tour**: 13 ta page e automatic ghure ghure (9 sec kore), Pause / Next / Back / Stop button shoho.
- Bot kichu banay na: mandap id, heritage id, page path sob server e validate hoy (mock test e fake id/path drop hoyeche).

Notun page add korle `src/Chatbot.jsx` er `STEPS` e ekta line, ar `api/chat.js` er `PAGES` e path ta add koro.

## 4. SEO — ki kora holo, ki tomake korte hobe

**Code e kora holo:** page wise title/description/canonical/OpenGraph, mandap select korle Place JSON-LD, `/admin` noindex, auto `sitemap.xml` (mandap + heritage soho), `robots.txt`.

**Tomar ekhon korar list (order e):**
1. `index.html` e `seo/index.head.html` paste, `<html lang="bn">`, domain bosao. Ekta `og-cover.jpg` (1200×630) `public/` e rakho.
2. **Google Search Console** → Domain add → verify → `https://YOUR-DOMAIN/sitemap.xml` submit. Tarpor Heritage/main URL gulo "Request indexing".
3. **Bing Webmaster Tools** e Search Console theke import.
4. Custom domain nao (`.vercel.app` e authority jome na). `.com`/`.org` hole bhalo.
5. Page speed: 58 MB src er beshi ta songs/ images. Song file gulo `src/` e na rekhe `public/` ba storage e rakho, ar image compress (WebP) koro.

**Ekta bastob shotyi:** website ta SPA, ar mandap gulo `/?m=slug` URL e. Google egulo index korte pare kintu dhire. Beshi jore SEO chaile porer step e mandap/heritage er jonno alada URL + server-side meta (jemon `/api/share` er moto) lagbe — chaile ota ami banai dibo.

**Timing:** ekhon November, Durga Puja 2026 shesh. Tai "durga puja" keyword er peak chole geche. Ekhon kaj: heritage/history content baranno (evergreen), Saraswati Puja (Magh mash) er jonno page, ar backlink jomano — jate agami Bhadro/Ashwin e Google e agei rank pao. SEO result ashte 2–4 mash lage.

## 5. Backlink — kon pothe (safe, spam chara)

Kena/spam backlink korbe na — Google penalty dey. Ei gulo kaj kore:

1. **Puja committee**: prothi mandap committee/Facebook page ke bolo tader mandap er page link (`/?m=slug`) tader page/bio/post e dite. Prothi mandap = ekta natural link. Sobcheye strong.
2. **Facebook/YouTube**: tomar channel er description e website link, pinned comment, every video te mandap er link. (nofollow, kintu traffic + brand signal.)
3. **Local news / blog**: Chattogram er online news portal, local blogger, university magazine (AUST, CU, CUET) ke ekta choto press note: "chattogram puja map, AI guide shoho". "Pujo guide bot" ta ekta bhalo story.
4. **OpenStreetMap**: mandap gulo OSM e add kore `website=` tag e link dao.
5. **Developer side**: GitHub README, Medium/Dev.to e "How I built an AI-powered puja map (Supabase + React + Gemini)" — tech backlink.
6. **Wikimedia Commons**: nijer tola ছবি CC license e upload, description e source link.
7. **Community**: Facebook group (Chattogram, puja groups), Reddit r/bangladesh e **value dey emon** post, shudhu link na.
8. **Heritage documents er QR**: print/poster e QR rakho — offline theke online.

Track: Search Console → Links, ar mashe ekbar dekho kon site link dilo.

## 6. Test checklist (deploy er por)

- [ ] chat button dekha jay, "Dampara kothay?" → map e fly kore
- [ ] 📍 diye nearest list ashe (HTTPS e lagbe, Vercel e ache)
- [ ] heritage question → `/heritage?docId=..` khole
- [ ] "feature dekhao" → tour cholche, Stop kaj kore
- [ ] `https://YOUR-DOMAIN/sitemap.xml` browser e xml dekhay
- [ ] Vercel → Logs e `/api/chat` e error nai
