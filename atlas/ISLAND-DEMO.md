# Island – faglig og teknisk demonstrationsspecifikation

**Status: plan, ikke implementeret.** Første fulde eksempel på atlasvisionen: geografisk sted → rumlig proces → forklaring → undersøgelse → anvendelse. Byg i små leverancer på `main` efter `CLAUDE.md` og `design_rules.md`.

Arbejdet styres i [#49](https://github.com/SimDeMe/smbi/issues/49). Navigationen
bygger på reviewet i [#47](https://github.com/SimDeMe/smbi/issues/47), og
integrationen kræver første pladegrænselag fra
[#48](https://github.com/SimDeMe/smbi/issues/48), ikke de senere jordskælvs- og
vulkanlag. [#46](https://github.com/SimDeMe/smbi/issues/46) leverer den
kontrollerede læreplanskobling. Nedenstående læringsmål er mål for denne
demonstration, ikke ekstra nationale læreplanskrav.

Modelbeskrivelsen og den korte elevopgave skal være fagligt kvalitetssikrede,
før avanceret animation bygges. Det er en eksplicit startbetingelse mellem
milepæl A og de efterfølgende trin; planen er ikke i sig selv en godkendt model.

## Læringsmål

Efter 10–15 minutters undersøgelse skal en elev kunne:
1. placere Island på den Midtatlantiske Ryg og beskrive pladernes relative bevægelse;
2. forklare hovedtrækkene i, hvorfor spredningszoner kan føre til delvis opsmeltning (trykaflastning);
3. forklare, at Islands særlige vulkanske aktivitet også forbindes med en varm kappeopstrømning/hotspot, og skelne mellem veletablerede observationer og fortolkninger;
4. skelne mellem en skematisk geologisk model og konkret målte forhold ved en bestemt lokalitet.

## Elevens fem trin

1. **Find:** Vælg Island på globusen; se placering, Midtatlantiske Ryg og relevante plader.
2. **Zoom:** Vis stedbundet kort/terræn, gerne et dokumenteret område som Þingvellir eller Reykjanes; angiv datakilde.
3. **Se under overfladen:** Åbn et skematisk 3D-tværsnit med lithosfære, kappe, pladebevægelse, trykaflastningssmeltning og magmatransport.
4. **Undersøg:** Vis/skjul forklarende lag; styr en **illustrativ tidsanimation** af pladernes relative bevægelse; sammenlign situation med/uden forklaringslag. Undgå falsk kvantitativ præcision.
5. **Anvend:** Kort elevopgave: 'Hvorfor er Island vulkansk aktivt, og hvorfor er en pladegrænse alene ikke hele forklaringen?' Bed eleven bruge mindst to observationer/modellag.

## Visualisering

- **Behold eksisterende D3/Canvas-globus** som atlasnavigation.
- Byg tværsnittet som et **selvstændigt Three.js-modul** som udgangspunkt; dokumentér version, licens, ydelse og den rumlige læringsværdi. Globussen forbliver Canvas/D3. Ingen omskrivning af eksisterende `geografi/pladegraenser.html` eller `geografi/vulkanudbrud.html` som forudsætning.
- Skift mellem overflade og tværsnit med tydelige knapper. Vis dybder, lagtykkelser og bevægelseshastigheder kun med korrekt dokumentation; ellers tydelig markering **'skematiske proportioner – ikke målfast'**.
- Sørg for, at figur og primære kontroller er synlige og brugbare på skolelaptop. Sekundær forklaring kan åbnes i panel; tilbyd fokusvisning.
- Tastatur/touch, reduced motion, pause og tydelige labels. Tilbyd et læsbart 2D-/tekstalternativ og model-links, hvis 3D/WebGL fejler; globusnavigationen skal fortsat fungere.
- Ingen krav om fotorealisme; vægt læsbarhed og faglig korrekthed.

## Kilder og faglige forbehold

- Brug dokumenterede geografiske data for pladegrænser, terræn og eventuelle vulkaner. Registrér kilde, licens, dato, opløsning og usikkerhed.
- Island er et særligt eksempel: divergens ved den Midtatlantiske Ryg kombineret med ekstra magmatilførsel knyttet til hotspot/kappeopstrømning. Fremstil ikke alle detaljer af dybe kappeprocesser som direkte observerede eller uomstridte.
- En generel spredningsmodel må ikke udlægges som et præcist geofysisk tværsnit gennem Þingvellir.
- Bevar forskel på tidskomprimeret animation, faktisk pladehastighed og geologisk tid.
- Gør kildearten synlig: geografiske data viser sted og kortgrundlag; et skematisk tværsnit viser en idealiseret proces; fortolkninger forklarer geologiske sammenhænge og deres usikkerhed. En modelgrænse er ikke automatisk en direkte observation.

## Tekniske milepæle

A. Skriv og kvalitetssikr en faglig modelbeskrivelse med referencer og elevspørgsmål. Beskriv pladebevægelse → kappeopstrømning → trykfald → delvis opsmeltning → magmatransport/vulkanisme samt Islands særlige forhold. Angiv antagelser og begrænsninger, så en illustrativ animation ikke bliver en ny, udokumenteret faglig påstand.
B. Byg en statisk, korrekt mærket tværsnitsprototype.
C. Tilføj rotation, vis/skjul-lag og kontrolleret animation uden nye faglige påstande.
D. Integrér i atlas fra Island-markøren, med retur til globus og links til de to eksisterende simulationer.
E. Test 1280×577, 1366×625, 1536×730, 390×750, 640×625, touch, tastatur, 3D-fallback og relevante browsere.
F. Afprøv elevopgaven og justér efter observeret forståelse.

## Definition of done

- En elev kan følge hele kæden uden at miste overblik eller blive tvunget gennem en lineær undervisningsplatform.
- Hver figur angiver om den er skematisk eller baseret på data.
- Faglige processer, termer og enheder er kvalitetssikrede.
- Eksisterende atlas og simulations-URL'er er intakte.
- Kode, datakilder, licenser, begrænsninger og test er dokumenteret.
- En elevafprøvning dokumenterer, om forløbet kan gennemføres på 10–15 minutter, og om eleven kan forklare sammenhængen mellem Islands beliggenhed, pladespredning og vulkanisme.

Forløbet er et frivilligt demonstrationsspor; eleven skal kunne gå tilbage,
springe til en selvstændig model eller vælge noget andet i biblioteket.
Ingen login, profiler eller LMS-funktioner.

Se `atlas/ROADMAP.md` og `atlas/KERNESTOF.md`.
