# Geografibogen — plan

En lille, gratis webbog på smbi.dk/geografibogen/, der introducerer centrale
begreber i naturgeografi på **HF-niveau** (naturgeografi C og NV). Bogen
bygges op kapitel for kapitel, og vi skriver den sammen.

## Formål

* Give eleverne korte, letlæste tekster, de kan læse hjemme eller i timen.
* Forklare ét centralt begreb ad gangen — så eleven bagefter kan bruge det.
* Bruge smbi.dk's simuleringer, hvor de passer, så eleven kan undersøge
  begrebet selv i stedet for kun at læse om det.

## Sproget

* **Lav LIX.** Mål: under 35 (let tekst). Korte sætninger, almindelige ord.
  Fagord er tilladt — de er en del af faget — men de forklares første gang,
  de bruges, og fremhæves med fed.
* **Sigende overskrifter.** En overskrift skal kunne læses som en lille
  påstand eller et spørgsmål: «Luft vejer noget», ikke «Lufttryk».
* **Korte afsnit.** Højst 3–4 sætninger pr. afsnit. Hellere en ny overskrift
  end et langt afsnit.
* **Du-form.** Vi taler til eleven og tager udgangspunkt i noget, de kender.
* Hvert kapitel slutter med en kort liste: **Det skal du huske**.
* LIX tjekkes med `node geografibogen/lix.mjs geografibogen/<kapitel>.html`.

## Figurer og billeder

* Figurer tegner vi selv som SVG direkte i siden — så kan de rettes,
  skaleres skarpt og læses af skærmlæsere (alt-tekst / figurtekst).
* Fotos og andre billeder må kun have **åben licens** (CC0, CC BY,
  CC BY-SA, public domain — fx Wikimedia Commons, NASA, NOAA, Unsplash).
  Licens, ophav og kilde skrives i figurteksten og i kapitlets kildeliste.
  Billedfiler ligger i `geografibogen/billeder/`.
* Ingen opfundne data. Skitser, der ikke er rigtige målinger, står der
  «skitse» ved.

## Simuleringer

* Vi linker til eksisterende simuleringer på smbi.dk, hvor de passer, og
  fortæller kort, hvad eleven skal prøve i dem.
* Mangler der en simulering, designer vi en ny. Små interaktive figurer kan
  ligge direkte i kapitlet; større modeller bygges som selvstændige
  simuleringer under `geografi/` med deres egen stabile adresse, så de også
  kan bruges uden bogen.

## Opgaver undervejs

* Små opgaver indlejret i teksten («Prøv selv»): valg mellem svar med
  øjeblikkelig forklaring, aflæsning af en figur, eller et kort
  «forklar med dine egne ord» med et skjult svarforslag.
* Opgaverne skal kunne løses på 1–2 minutter og tjekke forståelse, ikke
  udenadslære.
* Opgaverne virker uden login, og intet gemmes.

## Opbygning af filer

```
geografibogen/
  PLAN.md            denne plan
  index.html         bogens forside og indholdsfortegnelse
  bog.css            fælles udseende for alle kapitler
  bog.js             fælles kode: opgaver, fokus mv.
  lix.mjs            LIX-tjek af et kapitel
  tryk-og-vind.html  kapitel 1
  billeder/          fotos med åben licens (når vi får brug for dem)
```

* Ét kapitel = én HTML-fil med et kort, sigende filnavn.
  Adresserne må ikke ændres, når de først er lagt ud.
* Kapitlets egen interaktive figur kan ligge i kapitlet; bliver den stor,
  flyttes koden ud i et ES-modul ved siden af.
* Nye kapitler skrives ind i `index.html` og `sitemap.xml`.

## Kapitelliste (forslag — ændres undervejs)

Vejr og klima

1. **Tryk og vind** — lufttryk, højtryk og lavtryk, vind og isobarer.
   *Simuleringer:* Termiske tryk, Termiske tryksystemer. ✅ første udkast
2. Jorden drejer — vinden drejer (corioliseffekten, vind omkring høj- og
   lavtryk).
3. Varme og fugt i luften (luftfugtighed, dugpunkt, skyer).
   *Simuleringer:* Dugpunkt, Luftmasser.
4. Regn (stigningsregn, frontregn, konvektiv regn).
   *Simuleringer:* Stigningsregn.
5. Fronter og lavtryk over Danmark.
6. Den globale cirkulation og klimazoner.
7. Årstider og solens indstråling. *Simuleringer:* Årstider.
8. Drivhuseffekten. *Simuleringer:* Drivhuseffekten trin for trin.
9. Havstrømme og El Niño. *Simuleringer:* ENSO, Grønlandspumpen.

Jorden og landskabet

10. Jordens indre. *Simuleringer:* Byg jordens indre.
11. Pladetektonik. *Simuleringer:* Pladegrænser.
12. Vulkaner og jordskælv. *Simuleringer:* Vulkanudbrud.
13. Bjergarter og kredsløb. *Simuleringer:* Stensamling.
14. Grundvand. *Simuleringer:* Porøsitet og permeabilitet.
15. Bølger, kyster og tidevand. *Simuleringer:* Bølger, Tidevand.

Ressourcer og mennesker

16. Råstoffer og energi. *Simuleringer:* Råstoffer.
17. Kulstofkredsløbet. *Simuleringer:* Byg kulstofkredsløbet.

## Arbejdsgang for et nyt kapitel

1. Vi aftaler kapitlets 4–8 kernebegreber og rækkefølgen.
2. Tekst skrives i korte afsnit med sigende overskrifter.
3. Figurer tegnes, eller billeder med åben licens findes.
4. 3–5 små opgaver lægges ind undervejs.
5. Links til simuleringer med en kort opgave til hver.
6. LIX-tjek, faglig gennemlæsning og test på skolelaptop og mobil.
7. Kapitlet skrives ind i indholdsfortegnelsen og sitemap — og committes.
