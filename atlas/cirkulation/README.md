# Global cirkulation

Interaktiv prototype af milepæl A i `../CIRKULATION-MODEL.md`.
Åbn `/atlas/cirkulation/` via en lokal HTTP-server eller kortet «Global
cirkulation» under Processer i atlasset. Ingen build, framework eller eksterne
netværkskald; kortbiblioteker, landekort og skrifter kommer fra atlasset.

- `model.js`: ITK, sæsonudsving, vindfelt, Coriolis og balloners bevægelse.
- `globe.js`: Canvas 2D / D3, kort, pile, partikler, balloner og drejning.
- `section.js`: skematisk snit ved 32° Ø med seks celler (to uden rotation).
- `app.js`: betjening, forklaringstrin, pause, tilgængelighed og indlæsning.
- `cirkulation.css`: responsivt layout i atlassets lokale skrifter og farver.

ITK over land repræsenteres af bløde, længdegradsbestemte udsving over Afrika,
Indien og Australien. Det er en kunstnerisk model, ikke en præcis landmaske
eller målte vinddata. Hastigheder, celleformer, højder og skyer er skematiske.
Balloner følger overfladevinden; de er sporstoffer i modellen og stiger ikke
op gennem cellerne. Jordrotationens knap ændrer vindfeltet, ikke kameraet.
Snittet viser en valgt meridian; globussens ITK kan ligge anderledes ved andre
længdegrader. Milepæl B (målte data som atlaslag) er ikke implementeret.

Modellen starter på pause ved `prefers-reduced-motion`. Der er statiske pile
og trykmærker også på pause. Træk og piletaster drejer globussen; Enter slipper
en ballon i centrum. Home / nulstil-knappen gendanner kameraet. En manglende
kortfil bevarer vindmodellen. Manglende Canvas eller biblioteker giver en
tekstbesked, og forklaringer og vejledning er stadig tilgængelige.

## Afprøvning

```sh
node atlas/cirkulation/model.test.mjs
python3 -m http.server 8777
# I en anden terminal med Playwright tilgængelig:
node atlas/test/cirkulation.cjs
```

`ATLAS_URL`, `ATLAS_TEST_UD` og `NODE_PATH` kan sættes efter miljøet.
Browserprøven kontrollerer fem skærmstørrelser (1280×577, 1366×625,
1536×730, 390×750, 640×625), overlap/rulning, skift af årstid, rotation,
etiketter, kontinenter, tastatur, pointer/touch, balloner, dialog/fokusretur,
monsun, pause, reduced motion og manglende landekort. Modelprøven kontrollerer
vindretninger i begge hemisfærer, nul Coriolis ved ækvator, ITK-formlen,
kontinentale udsving og monsunens retningsskift.

Afprøvet 16. oktober 2026: modelprøven og alle fem Chromium-visninger består.
Skærmbilleder af laptop og mobil er visuelt gennemgået. Navigationen fra
atlassets Processer til modellen er også afprøvet uden JavaScriptfejl.
Fysiske telefoner, Safari, Firefox og skærmlæser er ikke afprøvet.
