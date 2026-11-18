# Bangladesh mobile network-e site na khola — ki jana gese, ki jana jay na

## Short answer
"This site can't be reached" error ta browser dey **page load howar age**, jokhon browser server-er sathe
connect-i korte pare na (DNS fail / TCP connection timeout). Tomar React/Vite code ei stage-e cholei na,
tai **code-e kono bug ei error ghotay na**. Problem ta network/hosting layer-e.

## Ki verify kora gese (sources)
Vercel Community-te November 2026-e Bangladesh theke eki rokom report ase:

- [Intermittent TCP/443 timeouts to specific Vercel edge IPs from Bangladesh](https://community.vercel.com/t/intermittent-tcp-443-timeouts-to-specific-vercel-edge-ips-from-bangladesh/51924)
  — Robi o Airtel/Circle mobile data-te kichu Vercel edge IP-te TCP 443 timeout, kichu IP-te HTTP 200.
  Same domain, shudhu DNS je IP dey sei IP-r upor depend kore kaj kore ki kore na. Kichu minute pore nijei thik hoy.
- [Intermittent ERR_CONNECTION_TIMED_OUT on Bangladesh mobile networks](https://community.vercel.com/t/intermittent-err-connection-timed-out-on-bangladesh-mobile-networks-classorbit/1000000091)
  — Wi-Fi-te kaj kore, mobile data-te kokhono kaj kore kokhono na; Android Private DNS `dns.google` korle kichu shomoy kaj korechhe.

Duto thread-e-i **Vercel staff-er kono confirmed reason/fix nai**. Mane eta ekta ISP-routing/peering/IP-reachability
shomoshya hote pare, kintu keu official-bhabe confirm koreni.

## Ki verify kora jay NAI
- Ami (Claude) Bangladesh-er kono mobile network theke test korte pari na. Tai "GP/Robi/Banglalink/Teletalk-er
  eta-i exact karon" — eta ami claim korchi na.
- Tomar site-er jonno exact kon IP fail korche, seta tomar device theke test na korle jana jabe na (niche steps).
- Cloudflare dile shomoshya jabei — eta guarantee na. Logic ta holo: Cloudflare proxy on thakle user-er ISP Vercel-er IP-r
  bodole Cloudflare-er IP-te connect kore. Eta Cloudflare-er bishal network, tai sombhabona bhalo, kintu BD-te real test chara proman nai.

## Tumi nijei kivabe confirm korbe (5 minute)
Phone-er mobile data PC-te hotspot kore (ba Termux), tarpor:

```bash
# 1) DNS ki IP dicche
nslookup ctgpujamandap.vercel.app
# 2) oi IP-gulor port 443 reachable ki
curl -v --connect-timeout 8 https://ctgpujamandap.vercel.app/ -o /dev/null
# 3) ekta fail korle onno IP force kore dekho (IP boshao nslookup theke)
curl -v --connect-timeout 8 --resolve ctgpujamandap.vercel.app:443:<IP> https://ctgpujamandap.vercel.app/ -o /dev/null
```
- Step 2 "Connection timed out" dile + onno IP-te chole → IP-reachability/routing shomoshya (Vercel thread-er moto).
- Step 1 e-i fail ba wrong IP → DNS shomoshya. Phone-e Settings → Private DNS → `dns.google` ba `one.one.one.one` diye abar try koro.
- Facebook/YouTube khule kintu ei site na khule → site-specific IP/domain block ba routing.

Result ta pele bujhbo kon path-e jabo.

## Ei project-e ki fix kora hoyeche (code-side, shob safe)
Code shomoshya-r karon na, tobe BD-r slow/unstable mobile network-e reliability barate:

| Change | Keno |
|---|---|
| Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) remove, fonts ekhon site-er nijer server theke (`@fontsource`) | Ager head-e render-blocking CSS request ekta alada third-party host-e jachchilo. Oi host slow/blocked hole page atke jeto. Ekhon ei dependency nai. Same font, same weight. |
| `/assets/*` e long-term immutable cache header (`vercel.json`, `public/_headers`) | Ekbar load hole abar download lage na — mobile data bachay, flaky network-e fast. |
| `api/share.js` — XSS fix + crash fix | Ager version-e `title`/`id`/`img` query HTML-e escape chhara boshto (kono link diye script chalano jeto), ar title-e `%` thakle function crash korto. Output same, ekhon safe. |
| `pintro.png` → `pntro.png` typo fix | File-er nam `pntro.png`; code-e `pintro.png` likha chhilo → share preview-te default image 404 hoto. |
| Domain hard-code remove (`VITE_SITE_ORIGIN`, `SITE_ORIGIN`) | Custom domain nile code edit lagbe na, shudhu env var. |
| Cloudflare Pages-ready files (`functions/api/share.js`, `public/_headers`, `.node-version`) | Domain chhara-i Cloudflare-er network-e host korar Plan B. |

## Ekhono baki third-party dependency
Site ekhono ei external host-gulo use kore (eta change korle design/feature change hoto, tai kori ni):
- `*.supabase.co` — shob data (mandaps, photos, blog) ekhan theke ase. Eta unreachable hole map khali thakbe.
- `tile.openstreetmap.org` — map tile.
- `img.youtube.com` — shudhu Tutorial page-er thumbnail.
