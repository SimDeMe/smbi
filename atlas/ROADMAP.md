# Udviklingsplan – Atlas

Status: plan vedtaget 14. oktober 2026. Arbejd direkte på `main` i små, testede og tilbagerullelige commits, jf. `CLAUDE.md` og `design_rules.md`.

## Vision

Et frit, ikke-lineært naturgeografisk atlas, hvor elever kan gå fra en geografisk lokalitet på globusen til en korrekt forklaring, en interaktiv model og en konkret undersøgelse. Atlas og det eksisterende geografibibliotek skal fungere som to ligeværdige indgange til de samme selvstændige simulationer.

## Tre parallelle spor

1. **Atlas og geografiske data:** forbedr brugerflade, navigation og temalag med dokumenterede kilder.
2. **Faglig kortlægning:** kortlæg kernestof, faglige mål og metoder for Naturgeografi C mod hele `geografi/`-biblioteket.
3. **Gennemarbejdet demonstration:** Island fra globus til et rumligt tværsnit, procesforklaring og elevundersøgelse.

## Eksisterende udgangspunkt

- `atlas/` indeholder allerede en D3/Canvas 2D-globus, søgning, steder, processer, modelregister og tests.
- `atlas/modeller.js` forbinder pt. seks simulationer til atlasset. Der findes flere geografimodeller i `geografi/`, som skal kortlægges før flere links tilføjes.
- Bevar `geografi.html`, eksisterende URL'er og modeller; undgå at omskrive fungerende simulationer som led i atlasarbejdet.
- Brug Canvas 2D-globusen som navigationslag, indtil en dokumenteret funktion kræver andet. En særskilt Three.js-model kan anvendes til Island-tværsnittet.

## Faser og leverancer

Tabellen viser arbejdspakker, ikke en strengt sekventiel rækkefølge.
Atlas-review og kernestofkortlægning kan begynde samtidig. Registerarbejdet
er en opfølgning inden for de relevante issues, ikke et femte selvstændigt issue.

| Fase | Leverance | Afslutningskriterium |
| --- | --- | --- |
| 1. Atlas-review | Test- og forbedringsliste fra eksisterende prototype | Globus og primære kontroller kan bruges på elevlaptop; touch/tastatur og navigation fungerer |
| 2. Kernestofkort | `atlas/KERNESTOF.md` valideret mod gældende officiel læreplan og hele `geografi/` | Hvert relevant mål har status og mindst ét forslag til model, undersøgelse eller ressource |
| 3. Register | Udvid `atlas/modeller.js` med relevante, kvalitetssikrede metadata | Atlas, bibliotek og eksisterende links er fortsat konsistente |
| 4. Temalag | Først pladegrænser; senere jordskælv og vulkaner | Første leverance: valgfrit, klassificeret pladegrænselag, dokumenterede kilder/licenser/usikkerheder, signatur, kort elevopgave og elevskærmstest |
| 5. Island | `atlas/ISLAND-DEMO.md` implementeret som vertikal demonstration | Sted → forklaring → rumlig model → undersøgelse → anvendelse fungerer |
| 6. Klasseafprøvning | Korte elevopgaver og observerede forbedringspunkter | En elev kan gennemføre 10–15 minutters forløb og forklare en relevant sammenhæng |

Tidsrammen 6–8 uger er kun en grov arbejdsramme, ikke en deadline. Trin 1 og 2 kan foregå parallelt. Begynd ikke med tunge 3D-effekter, før den faglige model og elevopgaven er specificeret.

## Fælles didaktiske principper

- **Forstå:** sammenhængende forklaring af systemet.
- **Se:** rumlig/fysisk visualisering med tydelige antagelser.
- **Undersøg:** eleven kan manipulere meningsfulde variable eller undersøge rumlige mønstre.
- **Mål:** aflæs eller sammenlign dokumenterede størrelser, hvor det giver mening.
- **Anvend:** en kort opgave forbinder modellen til et virkeligt sted eller problem.

Dette er muligheder, ikke fem obligatoriske UI-knapper. Den primære figur og centrale kontroller prioriteres på skolelaptops; sekundære forklaringer og indstillinger kan åbnes efter behov.

## Kvalitetskrav

- Faglig korrekthed: skeln mellem observerede data, rekonstruktioner, idealiserede modeller og hypoteser/scenarier.
- Dokumentér dataenes kilde, årgang, licens, opløsning og usikkerheder. Ingen opdigtede koordinater eller pladegrænser.
- Brug reelle geografiske eksempler; generelle modeller må ikke fremstå som stedsspecifikke målinger.
- Test mindst 1280×577, 1366×625, 1536×730, mobil 390×750 og smal delt visning.
- Test tastatur, touch, reduced motion, fejltilstande og at eksisterende URL'er fortsat virker.
- Arbejd på `main`, test før push og lav små commits, så rollback er let.

## Beslutninger og afgrænsning

- Ingen login, elevprofiler, LMS eller lineært obligatorisk kursus.
- Ingen total omlægning af eksisterende simulationskode.
- Globus og bibliotek skal kunne anvendes uafhængigt.
- Fase 1–2 prioriteres før nye avancerede temalag; Island er den første komplette demonstration.
- Afvent faglig og visuel vurdering før der udvikles tilsvarende demonstrationsmoduler for Grønland, dansk istidslandskab eller global atmosfære.

## GitHub-opgaver

| Issue | Leverance | Afhængighed / startbetingelse |
| --- | --- | --- |
| [#46 – Kortlæg kernestoffet i Naturgeografi C](https://github.com/SimDeMe/smbi/issues/46) | Kildevalideret mapping, fuldt inventar, dækning, mangler og prioritering i [KERNESTOF.md](KERNESTOF.md) | Kan starte nu, parallelt med #47 |
| [#47 – Evaluér og forbedr globussen](https://github.com/SimDeMe/smbi/issues/47) | Konkret review og små forbedringer af den eksisterende Canvas/D3-globus | Kan starte nu, parallelt med #46 |
| [#48 – Pladetektoniske temalag](https://github.com/SimDeMe/smbi/issues/48) | Pladegrænser først, med signatur, kilder og undersøgelsesopgave | Efter den indledende evaluering og nødvendige rettelser i #47; brug #46 til faglig kobling |
| [#49 – Island: 3D-demonstration](https://github.com/SimDeMe/smbi/issues/49) | [ISLAND-DEMO.md](ISLAND-DEMO.md) som frivilligt forløb på 10–15 minutter | Bygger på #48's pladegrænselag; faglig modelbeskrivelse kvalitetssikres før avanceret animation |

Afhængighederne kan læses som **#47 → #48 → #49**, mens **#46** forløber
parallelt med #47 og leverer fagligt grundlag til de følgende opgaver.
Modelbeskrivelse og kildeundersøgelse kan forberedes tidligt; færdig integration
af Island kræver pladegrænselaget. Senere jordskælvs- og vulkanlag må ikke
blokere denne første demonstration. Den samlede datadrevne sammenligning af
alle tre fænomener er først leveret, når de relevante lag faktisk er tilføjet.

Under planarbejdet kom to særskilte, konkrete forbedringsissues til:
[#50 – diskret faglig information](https://github.com/SimDeMe/smbi/issues/50)
og [#51 – global piletastnavigation](https://github.com/SimDeMe/smbi/issues/51).
De er relaterede implementeringsopgaver til reviewet i #47, ikke dubletter
til hele reviewet. Genbrug deres acceptkriterier; opret ikke nye kopier af
de samme opgaver. De er ikke implementeret som del af denne planopdatering.

### Afsluttet udgangspunkt: MVP #45

[#45](https://github.com/SimDeMe/smbi/issues/45) er leveret i
[9f5a7c1](https://github.com/SimDeMe/smbi/commit/9f5a7c1) og
[e696ef5](https://github.com/SimDeMe/smbi/commit/e696ef5) og er afsluttet som
første prototype. Den skal ikke implementeres igen. Leverancen omfatter
`/atlas/`, rotation/zoom, tre stedmarkører, globalt atmosfæretema, søgning,
modelkort, seks eksisterende model-links, redigerbart register og drift uden
WebGL. Test og begrænsninger fremgår af [README.md](README.md).

Chromium-test dækker de fem elevvisninger, tastatur, emuleret touch/knib-zoom
og fejltilstande. Fysisk telefon, Safari/Firefox og egentlig skærmlæser er
ikke afprøvet; det er opfølgning i #47, ikke en påstand om allerede udført test.
Biblioteket, forsiden og simulationerne er bevaret.

De fire nye issues er planlagte opgaver. Denne planopdatering starter ikke
deres implementation automatisk.

## Næste handling

*Opdateret 16. oktober 2026 (Atlas v442).*

- **#46 er afsluttet.** Sammenligningen med de lokale materialer står i
  [INDHOLD.md](INDHOLD.md) sammen med ejerens afgørelser. De 11 afprøvede
  øvelser er flyttet til `Øvelser/Geografi/`, og 22 forsøgsvejledninger er
  koblet til atlassets steder, undersøgelser og søgning.
- **#48 er leveret:** pladegrænser (PB2002), jordskælv (USGS) og vulkaner
  (Smithsonian GVP) som valgfrie lag med kilder og undersøgelsesopgave.
- **#49 Island:** milepæl A–E er færdige. Milepæl F: materialet er klar
  ([elevopgave](island/opgave.html), [lærerudgave og observationsark](island/laerer.html),
  [tjekliste til fysisk test](ENHEDSTEST.md)); afprøvningen afventer ejeren.
- **#47:** test på fysisk telefon/iPad, Safari og skærmlæser mangler stadig
  og kræver ejeren.
- **Leveret siden v435:** **Global cirkulation** (B's funktioner med A's
  grafik, fem korte trin, linket i atlasset, v448), Jordskælvsbølger model
  A og B (v439), Temakort med HDI, BNI og demografi (v440), laget
  **Havbundens alder** med profilmåling (v441, A3) og modellen
  **Bjergarternes kredsløb** (v442, A7). Af INDHOLD.md's roadmap er trin 1
  leveret, og af trin 2–3 seismikken, havbundens alder og kredsløbet;
  istidslandskab, grundvand og kulstofkredsløb mangler.
- **Åbent for ejeren:** licensteksten for EarthBytes aldersgitter 2020 skal
  læses i README.txt på earthbyte.org (kunne ikke nås herfra); se
  `data/havbundsalder.LICENSE`.

Derefter følger rækkefølgen i INDHOLD.md: istidslandskab på Danmarkskortet
(A9, C3; grundkortet i DAGI 1:500.000 er leveret i v460), grundvandstværsnit (C2), kulstofkredsløbet (E4),
samfundsdatalag (energi, GHI, vandstress) og vandbalance/sol- og vindpotentiale
for et sted (C1, E2).

## Ressourcer og samfund · leveret 18. oktober 2026

Samfundsdata har nu en særskilt lagkategori **Ressourcer og samfund** med
energimiks pr. land (el og primærenergi, 2023), solindstråling og
vindpotentiale (NASA POWER 2001–2020) og vandstress (FAO, 2022).
Se README.md og data/ressourcer.LICENSE. GHI, energiforbrug pr. indbygger
og en lokal model for anlægsproduktion står fortsat åbne i INDHOLD.md.
