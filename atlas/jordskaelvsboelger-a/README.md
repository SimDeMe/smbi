# Jordskælvsbølger model A

Selvstændigt laboratorium på `/atlas/jordskaelvsboelger-a/`, registreret i
Atlas under Processer, Seismiske bølger, Søg og jordskælvsundersøgelsen.
Ingen eksterne biblioteker, netkald eller build. Skrifter fra Atlassets lokale filer.

## Didaktisk idé

To rum binder partikelbevægelse og bølgeudbredelse sammen med en anvendelse:
P/S i fast stof og væske; derefter lokalisering af et skjult jordskælv med
syntetiske seismogrammer fra tre stationer. Eleverne justerer S−P og ser
cirklerne reagere, markerer et bud og får afstandsfeedback. Nye skælv gør
øvelsen gentagelig. Facit, ankomsttider og bølgeanimation er hjælpemidler;
bølgeanimationen afslører bevidst kildens position og er mærket som hjælp.
Tidslinjen kan også betjenes statisk. Partikelanimation starter pauset ved
`prefers-reduced-motion`.

## Fysik

`fysik.mjs` er uafhængig af DOM. Homogent, isotropt fast stof, rette stråler,
vP = 6 km/s og vS = 3,5 km/s. L = Δt/(1/vS − 1/vP) = 8,4 · Δt.
Stationer på overfladen: r = √(L² − h²), hvor h vælges som kendt dybde.
Overfladesnittet af den kugleformede bølgefront er √((v·t)² − h²), først
synligt når v·t ≥ h. Nuldybde er et eksplicit didaktisk grænsetilfælde.
Bølgefronter, kurver og cirkler beregnes af samme kilde og hastigheder.

Kortet er et fiktivt plant koordinatfelt, ikke en bestemt del af Jordens
geografi. x mod øst, y mod syd, samme målestok i begge retninger.
Partikelanimationen viser idealiserede plane bølger; fartforholdet er 6/3,5,
mens bølgelængde og udsving er valgt for synlighed. Væskevisning er kvalitativ.
Seismogrammerne har vilkårlig amplitude, deterministisk baggrundsstøj og
konstruerede P/S-ankomster; ingen observationer, magnitude eller skademodel.
Dialogen forklarer antagelser, matematik, dybde, forenklinger og virkelige
rejsetidsmodeller og linker til fire USGS-kilder.

## Kontrol

- `node atlas/test/jordskaelvsboelger-a.mjs`: 5-12-13-referenceberegning,
  ankomsttider, cirkler, dybder 0–40 km og overfladefronter.
- `node atlas/test/jordskaelvsboelger-a.cjs` med Playwright på NODE_PATH og
  lokal server på 8777: 1280×577, 1366×625, 1536×730, 390×750, 640×625.
  Kontrollerer synlige primære knapper på laptop, ingen vandret rulning,
  målinger, korrekt/forkert bud, løsning, ændret dybde, nye skælv, afspilning,
  pause, koordinattryk inklusive touch, tastatur/dialog/fokus,
  reduceret bevægelse, væske, Atlasregister og procesindgang.
- Skærmbilleder af begge rum på alle fem størrelser i `/tmp/smbi-seismik-a/`.
  Visuel kontrol udført i Chromium. Safari, fysisk mobil og skærmlæser er
  ikke særskilt afprøvet.
