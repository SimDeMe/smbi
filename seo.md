# SEO — hvad der er sat op, og hvad en ny side skal have

Sitet er statisk på GitHub Pages, så al SEO ligger i sidernes `<head>` plus to
filer i roden: `robots.txt` og `sitemap.xml`.

## Det faste hoved

Hver offentlig side har — ud over `<title>` og `<meta name="description">` —
denne blok lige under beskrivelsen. Kopiér den fra en side, der ligner, og ret
adresse, titel, beskrivelse og delebillede:

```html
<!-- Deling, ikoner og kanonisk adresse -->
<link rel="canonical" href="https://smbi.dk/biologi/osmose.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="smbi.dk">
<meta property="og:locale" content="da_DK">
<meta property="og:url" content="https://smbi.dk/biologi/osmose.html">
<meta property="og:title" content="Osmose i cellen">
<meta property="og:description" content="…samme sætning som beskrivelsen…">
<meta property="og:image" content="https://smbi.dk/img/og-biologi.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="smbi.dk — biologi: simuleringer, forløb og spil">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFF9EE">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

Delebilleder: `img/og-smbi.png` (forside og børn), `img/og-geografi.png`,
`img/og-biologi.png`. Alle er 1200 × 630 px og bygget i sidens eget formsprog.

Nederst i `<head>` står strukturdata som JSON-LD. Simuleringer, opgaver og
vejledninger er `LearningResource` + `BreadcrumbList`, forsiden er `WebSite` +
`Person`, og fagforsiderne er `CollectionPage`. Kopiér fra en tilsvarende side
og ret `name`, `description`, `url`, `about` og `learningResourceType`
(`interaktiv simulering`, `arbejdsark`, `forsøgsvejledning`, `test`,
`undervisningsforløb`).

## Tjekliste, når du laver en ny side

1. `<title>` slutter på `— smbi.dk` og siger, hvad siden er — ikke bare emnet.
2. `<meta name="description">` på én sætning, der beskriver, hvad man **gør**.
3. `<meta name="viewport">` — ellers regnes siden ikke for mobilvenlig.
4. Blokken ovenfor, med sidens egen adresse.
5. Strukturdata i bunden af `<head>`.
6. Adressen ind i `sitemap.xml` med dagens dato i `<lastmod>`.
7. Link til siden fra fagforsiden — en side, der ikke er linket til, bliver
   sjældent fundet.

## Sider, der ikke skal i søgeresultaterne

Interne sider (`censorUr.html`, arbejdstidskalenderen, `tid/`,
`navneApp/`, `studiekort/`, `smbi-design/`, `backup-gammelt-design/` og
lærerløsningerne) har `<meta name="robots" content="noindex, follow">` i stedet
for delingsblokken. De er med vilje **ikke** spærret i `robots.txt` — en
spærret side kan robotten ikke hente, og så læser den heller ikke `noindex`.
