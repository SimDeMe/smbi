# Byg en globus

`geografi/byg-globus.html` øver geografisk orientering ved at sætte fagord
på en drejelig globus. Eleven skal forbinde et navn med en geografisk
placering og kunne bruge gradnettet til at finde nye punkter.

## Indhold

1. Syv verdensdele. Oceanien omfatter også Australien og New Zealand;
   Grønland regnes geografisk med til Nordamerika.
2. Fem verdenshave. Sydhavet afgrænses her ved 60° syd.
3. Poler, ækvator, vendekredse og polarcirkler.
4. Breddekreds, længdekreds og nulmeridian; derefter tre koordinatopgaver.
5. Vahls fire klimazoner på land. Ingen plantebælter i elevopgaven.

De gule pladser er repræsentative punkter, ikke områdegrænser. I
klimaafsnittet vises alle fire zoner i farver fra starten. Den polare
svarplads ligger på Grønland. Breddekredse kan slås til for at sammenligne
de astronomiske linjer med de temperaturbestemte zonegrænser.

## Genbrug og afgrænsning

Globussen bruger atlassets ortografiske Canvas 2D-tegnemetode, D3 og
TopoJSON fra `atlas/vendor/`, kystdata fra `atlas/data/countries-110m.json`
og klimadata via `atlas/klimalag.js`. Der ændres ikke i atlassets kode,
data eller version. Ingen WebGL, CDN, eksterne skrifter eller build kræves.
Landegrænser samles væk med TopoJSON, så kysterne er figurens fokus.

Den almindelige SVG-motor i `byg-motor/` er ikke ændret. Globussens pladser
skal kunne bevæge sig og skjules på bagsiden, så siden har sin egen lille
svarstyring med samme principper: vælg/træk et ord, placér, indsend, lås
rigtige svar og giv hints. Tastatur og touch kan udføre alle opgaver.
Telefonens ordbakke bliver synlig øverst, når eleven ruller til globussen.

Klimapolygonernes 16 eksisterende klasser samles til fire temperaturzoner;
der tegnes kun zonegrænser. Se `atlas/data/klimazoner.LICENSE` for Beck
m.fl. (2023), CC BY 4.0, og rekonstruktionens skolekriterier. Det er ikke
Vahls originale kort. Kortet er udglattet og klippes til kystlinjerne.

## Filer og test

- `model.js`: læringsindhold, målsteder, zoner og sfærisk svartolerance.
- `globus.js`: projektion, kortlag, flytbare pladser og drejebetjening.
- `side.js`: afsnit, svar, hints og lokal lagring af korrekt fremskridt.
- `stil.css`: layout og fokustilstand.

Start `python3 -m http.server 8777` i repoets rod. Kør derefter:

```sh
node geografi/byg-globus/model.test.mjs
node geografi/byg-globus/browser-test.mjs
```

Browsertesten bruger repoets eksisterende Playwright-installation i
`værktøj/node_modules`. Den kontrollerer svar, genindlæsning, tastatur,
poler, øjeblikkelig koordinatfeedback, placering af klimamarkører i data,
ekstern netblokering, blokeret lagring, netfejl/genforsøg og touch. Layout
afprøves ved 1280×577, 1366×625, 1536×730, 740×750 og 390×750.

Koordinatopgaver godkender højst 5° vinkelafstand langs en storcirkel.
Punktet bedømmes straks ved klik på globussen, Enter eller »Sæt punkt i
sigtekornet«; der er ingen separat indsend-knap i koordinatlaget.
Et punkt lige på den anden side af datolinjen skal derfor kunne godkendes.

## Elevafprøvning (endnu ikke gennemført)

Bed en elev tænke højt uden at forklare betjeningen undervejs:

- Find Oceanien og Antarktis. Opdager eleven, at globussen skal drejes?
- Placér ækvator og polarcirklerne. Kan eleven følge stregerne til linjerne?
- Find 30° S, 60° V med gradnettet; prøv derefter et nyt punkt.
- Sammenlign Vahls zonegrænser med vendekredsene. Kan eleven forklare,
  hvorfor grænserne ikke følger samme linjer?

Afprøv telefonens ordbakke og »Drej til plads« med en elev. Undersøg, om
eleven faktisk lærer placeringerne og kan finde dem fra en ny synsvinkel.
Beståede automatiske test dokumenterer funktion, ikke læringsudbytte.
