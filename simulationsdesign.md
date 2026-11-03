# Forskningsbaseret design og afprøvning af læringssimulationer

Senest opdateret: 3. november 2026.

Dette dokument samler anbefalinger til nye simulationer og væsentlige ændringer
på smbi.dk. Det supplerer [design_rules.md](design_rules.md). Principperne skal
anvendes med fagligt skøn; hver simulation behøver ikke alle funktioner, og
velfungerende eksisterende sider skal ikke automatisk omlægges.

## 1. Start med det, eleven skal kunne forstå og undersøge

- Formulér et afgrænset læringsmål og den centrale årsagssammenhæng.
- Vælg handlinger, hvor elevens ændringer giver en fagligt meningsfuld respons.
- Skeln mellem elevens påvirkning af systemet og modellens efterfølgende respons.
- Lad faglige begreber kunne observeres i modellens adfærd og målbare størrelser.
  Et begreb må ikke alene formidles med farve, overskrift eller en fast animation.
- Oplys væsentlige antagelser og modellens gyldighedsområde. Forenkling er et
  didaktisk valg; den må ikke indføre forkerte årsagssammenhænge.

Eksempel: Ved atmosfærisk stabilitet løfter eleven en luftpakke og slipper den.
Efter slip skal bevægelsen følge modellen for opdrift, så stabil og ustabil
atmosfære faktisk giver forskellig respons. Temperaturforskel og bevægelse
skal kunne forbindes.

## 2. Visuel prioritering: gør det tydeligt, hvor eleven skal kigge

Design hver visning omkring et fagligt fokus. Eleven skal hurtigt kunne se,
hvad der undersøges, hvordan systemet kan påvirkes, og hvor virkningen viser sig.
Reglerne nedenfor er vores omsætning af forskning og designpraksis til smbi.dk;
de er ikke en universel opskrift eller hver især dokumenteret i forsøg med vores
simulationer.

1. **Giv visningen ét tydeligt hovedområde.** Den centrale proces eller
   sammenligning skal have størst visuel vægt. Flere figurer kan udgøre ét
   samlet hovedområde, når sammenligningen er læringsmålet. Overskrift,
   navigation, opgavepanel og indstillinger skal understøtte dette fokus.
2. **Planlæg forbindelsen mellem handling og respons.** Angiv under designet:
   Hvad skal eleven først opdage? Hvad kan eleven gøre? Hvor skal eleven
   derefter se virkningen? Placér kontroller og respons, så forbindelsen kan
   følges uden gentagen søgning på tværs af skærmen.
3. **Brug tekst dér, hvor blikket allerede er.** Placér korte etiketter ved de
   objekter, de forklarer. Afprøv et kort undersøgelsesspørgsmål eller en
   figurtekst umiddelbart under hovedfiguren, fx: »Hvad sker der med luftpakken,
   når du slipper den?« Sidens titel kan fortsat stå øverst. Placeringen vælges
   efter opgaven og afprøves med elever; tekst under figuren er ikke et fast krav.
4. **Lad få elementer være visuelt fremhævede.** Brug størrelse, afstand og
   kontrast til at skelne mellem hovedindhold, betjening og supplerende stof.
   Undgå, at alle paneler får kraftige rammer, farvede overskrifter og fremhævede
   tal. Brug luft og nærhed til gruppering, før der tilføjes flere bokse.
   Sekundær tekst skal stadig være let at læse og have tilstrækkelig kontrast.
5. **Vis en enkel, brugbar starttilstand.** Vis de kontroller og målinger, der
   er nødvendige for den første meningsfulde undersøgelse. Lad ekstra grafer,
   teori og avancerede indstillinger kunne åbnes med tydelige navne. Bevar
   nødvendige sammenligninger synlige samtidig; forenkling må ikke tvinge eleven
   til at huske tal fra en skjult visning.
6. **Brug fremhævelse og bevægelse med et fagligt formål.** Fremhæv det objekt,
   den kurve eller den ændring, eleven aktuelt skal forbinde med sin handling.
   Lad samme størrelse have genkendelige markeringer i figur og graf. Undgå
   samtidige, uvedkommende animationer og blink. Brug også tekst eller form,
   så farve aldrig står alene.
7. **Giv en tydelig invitation til at begynde.** Brug en kort, konkret handling
   som »Træk luftpakken op og slip«. Lad den første handling være let at opdage,
   og gør nulstilling tilgængelig. Støtten skal give adgang til selvstændig
   undersøgelse og kunne træde i baggrunden efter starten.
8. **Fjern indhold, før resten gøres mindre.** Når layoutet bliver overfyldt,
   skal hvert element begrundes ud fra læringsmålet. Fjern gentagelser, saml
   beslægtede oplysninger, og flyt sekundært stof. Bevar læsbare figurer, tal og
   kontroller på elevens skærm. Reducér visuel støj med respekt for den nødvendige
   faglige kompleksitet.

### Grundlag og grænser for overførsel fra reklamedesign

- Ogilvy anbefaler billede → overskrift → brødtekst i trykte annoncer. Det er
  inspiration til at afprøve figurtekst og spørgsmål under figuren. Passagen
  giver ikke tilstrækkelige metodeoplysninger til at overføre hans procenttal
  til simulationer, og vi antager ikke en fast læserækkefølge.
- Pieters & Wedel (2004) fandt i øjenbevægelsesdata fra 1.363 annoncer, at
  billeddelen var særlig effektiv til at fange opmærksomhed. Opmærksomhed i en
  annonce er ikke i sig selv dokumentation for læring.
- Pieters, Wedel & Batra (2010) skelner mellem tæthed af visuelle detaljer og
  kompleksitet i kompositionen. Resultaterne støtter ikke, at al kompleksitet
  skal fjernes; de motiverer os til at skelne mellem støj og meningsfuld struktur.
- Schneider m.fl. (2018) fandt i en metaanalyse af 103 undersøgelser gavnlige
  gennemsnitlige effekter af signaler, der fremhæver relevant information eller
  organisering, på genkaldelse og transfer. Det understøtter fagligt begrundet
  fremhævelse, men dokumenterer ikke vores konkrete layoutvalg.
- NN/g beskriver visuelt hierarki og gradvis adgang til ekstra funktioner som
  principper for brugerflader. Hyppigt nødvendige funktioner skal være synlige,
  og adgangen til sekundære funktioner skal være tydelig.

Kilder:
[Ogilvy, *Ogilvy on Advertising*, afsnit om layout](https://ogilvy.relayto.com/e/ogilvy-on-advertising-dq85bunnm5ady/5aIYP19v128),
[Pieters & Wedel, 2004](https://doi.org/10.1509/jmkg.68.2.36.27794),
[Pieters, Wedel & Batra, 2010](https://doi.org/10.1509/jmkg.74.5.048),
[Schneider m.fl., 2018](https://www.sciencedirect.com/science/article/pii/S1747938X17300581),
[NN/g: visuelt hierarki](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
og [NN/g: gradvis visning af funktioner](https://www.nngroup.com/articles/progressive-disclosure/).

## 3. Teoretiske rammer og deres anvendelse

Rammerne nedenfor er komplementære. Deres konkrete anvendelse her er en
omsætning til smbi.dk, ikke en universel opskrift bevist i én undersøgelse.
Skeln mellem teori, kvalitative designstudier og metaanalyser af læringseffekt.

### PhET: implicit stilladsering

Støt produktive undersøgelser gennem synlige handlemuligheder, begrænsninger,
visuelle signaler og feedback. Eleven skal kunne stille og afprøve egne spørgsmål.

- Brug en overskuelig starttilstand og meningsfulde parameterområder.
- Gør primære handlinger lette at opdage, og vis responsen tydeligt.
- Tilbyd nulstilling og gentagelse; tilføj pause, trin og sammenligning, hvor
  det understøtter læringsmålet.
- Åbn flere muligheder gradvist, når kompleksiteten ellers skjuler sammenhængen.
- Undgå at gøre undersøgelsen til en lang obligatorisk klikopskrift.

Kilder: [Podolefsky, Perkins & Adams, 2010](https://doi.org/10.1103/PhysRevSTPER.6.020117)
og [Podolefsky, Moore & Perkins, manuskript revideret 2014](https://arxiv.org/abs/1306.6544).

### Cognitive Load Theory: kompleksitet og forkundskaber

Arbejdshukommelsen er begrænset. Tilpas faglig kompleksitet og støtte til
målgruppen, og reducer arbejde, som ikke bidrager til læringsmålet.

- Vis få relevante variable først, og udvid efter behov.
- Giv begyndere en kort introduktion eller et gennemarbejdet eksempel.
- Lad mere øvede elever arbejde med mindre støtte og flere frihedsgrader.
- Undgå at eleven samtidig skal lære ukendte kontroller, mange fagbegreber
  og en kompleks model uden støtte.

Kilde: [Sweller, van Merriënboer & Paas, 2019](https://doi.org/10.1007/s10648-019-09465-5).

### Cognitive Theory of Multimedia Learning: tekst og visualisering

- Fjern grafik, lyd og tekst uden et tydeligt læringsformål.
- Placér forklarende etiketter ved det, de forklarer.
- Synkronisér begivenheder og tilhørende visuelle forklaringer.
- Fremhæv de sammenhænge, eleven skal lægge mærke til.
- Del komplekse forløb i overskuelige dele med elevstyret tempo, hvor relevant.

Principperne er udviklet til multimedielæring bredt. Anvend dem med hensyn til
simulationens frie undersøgelse og tilgængelighed; lyd er ikke et generelt krav.

Kilde: [Mayer, 2017](https://doi.org/10.1111/jcal.12197).

### DeFT: forbind animation, graf og tal

Flere repræsentationer hjælper kun, når eleven kan forstå deres funktion og
forbindelse. Hver ekstra visning stiller også krav til eleven.

- Lad hver repræsentation bidrage med noget nødvendigt.
- Brug konsekvente enheder, symboler og markeringer på tværs af visninger.
- Forbind samme objekt eller tidspunkt i animation og graf.
- Vis ikke alle grafer og tal fra begyndelsen alene fordi de findes i modellen.

Kilde: [Ainsworth, 2006](https://doi.org/10.1016/j.learninstruc.2006.03.001).

### ICAP: design til faglig tænkning

At klikke og flytte skydere er ikke i sig selv tegn på dyb forståelse.

- Lad elever formulere og begrunde forudsigelser.
- Bed dem forklare resultater og revidere deres forklaring efter nye forsøg.
- Brug eventuelt pararbejde, hvor elever bygger videre på hinandens forklaringer.
- I ICAP betyder »interaktiv« fælles udvikling af forståelse mellem deltagere;
  det er ikke blot betegnelsen for en brugerflade med knapper.

Kilde: [Chi & Wylie, 2014](https://doi.org/10.1080/00461520.2014.965823).

### Undersøgende læring: struktur og passende støtte

Tilrettelæg undersøgelser omkring orientering, spørgsmål/hypotese, undersøgelse,
fortolkning og konklusion. Refleksion og kommunikation kan foregå undervejs;
cyklussen behøver ikke være en låst række skærme.

- Giv eleven et afgrænset spørgsmål og mulighed for kontrollerede sammenligninger.
- Støt valg af variable og fortolkning, når eleven mangler forudsætningerne.
- Skeln mellem at gennemføre forsøget og at kunne forklare resultatet.

En metaanalyse af 72 undersøgelser fandt en positiv gennemsnitlig effekt af
vejledning på læringsudbyttet (d = 0,50). Den omhandler undersøgende læring
bredt og dokumenterer ikke en bestemt knap eller opgaveskabelon.

Kilder: [Pedaste m.fl., 2015](https://doi.org/10.1016/j.edurev.2015.02.003)
og [Lazonder & Harmsen, 2016](https://doi.org/10.3102/0034654315627366).

## 4. Afprøv med elever og lærere

- Formulér før afprøvningen, hvad der undersøges: betjening, fortolkning af
  visualiseringer, faglige misforståelser eller bestemte læringsmål.
- Brug korte, konkrete opgaver og lad deltageren tænke højt.
- En neutral instruktion kan være: »Sig højt, hvad du kigger på, prøver og
  tænker undervejs.« Adskil denne afprøvning fra mere styrende læringsopgaver.
- Undgå løbende at forklare løsningen under en brugertest. Stil uddybende
  spørgsmål bagefter, så hjælpen ikke skjuler problemer i designet.
- Vurder om deltageren opdager kontrollerne, forstår responsen og kan forklare
  eller forudsige et nyt tilfælde. Tilfredshed alene viser ikke læring.
- Brug afprøvningen til at revidere designet og afprøv de ændrede dele igen.
- Afprøv også det visuelle hierarki: Vis startskærmen kort, og spørg bagefter,
  hvad eleven først lagde mærke til, og hvad vedkommende ville gøre. Brug dette
  som en praktisk kontrol af førsteindtrykket, ikke som en måling af øjenbevægelser
  eller læring. Lad derefter eleven bruge simulationen uden hjælp, og undersøg,
  om eleven opdager responsen og kan forklare eller forudsige sammenhængen.
- Tænke-højt-optagelser kan afdække problemer og forklaringer; de dokumenterer
  ikke alene, at en simulation har en bestemt læringseffekt.

PhETs elevinterviews er en relevant metodeinspiration:
[Adams m.fl., 2008](https://phet.colorado.edu/publications/PhET_Interviews_I.pdf).

## 5. Ønsket funktion: direkte aflevering af lydfeedback

**Status: bygget til `geografi/luftmasser/`, men slukket, indtil modtageren er
sat op efter `feedback/LYD.md`. Dokumentet er designretningen.**

### Formål, deltagere og modtager

- Feedbacken skal forbedre simulationerne på smbi.dk.
- Elever og lærere fra andre skoler skal også kunne bidrage.
- **Alle indsendte optagelser og tilhørende feedback skal gå til ejeren af
  smbi.dk.** Der skal være én fælles feedbackmodtager, ikke separate
  afleveringsrum til hver lærer eller skole.
- Deltageren skal før optagelse og aflevering tydeligt se, hvem der modtager
  feedbacken, hvad den bruges til, og hvor længe den opbevares.
- Deltagelse kræver ikke, at andre skoler selv opretter noget.
  Almindelig brug af simulationerne skal kunne fortsætte uden optagelse.

### Deltagerens forløb

1. Åbn »Hjælp med at afprøve simulationen« og læs den korte information/opgave.
2. Vælg »Start optagelse« og giv browseren mikrofontilladelse.
3. Brug simulationen og tænk højt, mens optagestatus og tid vises tydeligt.
4. Vælg »Stop«, aflyt og vælg eventuelt at slette eller optage igen.
5. Vælg »Send feedback til smbi.dk«. Upload kræver denne aktive handling.
6. Vis først afleveringskvittering, når serveren har bekræftet modtagelsen af
   både optagelsen og de nødvendige metadata. Tilbyd genforsøg og download
   ved fejl; vis ikke succes alene fordi afsendelsen er startet.

Mikrofonen skal frigives efter stop. Håndtér afvist tilladelse, manglende
mikrofon, inkompatibel browser, afbrudt forbindelse og navigation væk fra en
ikke-afleveret optagelse. Brug HTTPS og vælg et lydformat, browseren understøtter.
Ved indlejring skal mikrofontilladelsen også håndteres for den relevante iframe.

### Data, der hjælper med at forstå feedbacken

Gem simulationens stabile id/sti, model- eller kodeversion, eventuel opgave,
starttidspunkt, varighed, lydformat og en tilfældig sessionskode.

En tidsstemplet log kan følge simulationens egne handlinger og tilstande, fx
»00:24: ændrer temperatur« og »00:39: slipper luftpakken«. Knyt loggen til
lydens tidsakse og registrér relevant starttilstand. Det er ikke en
skærmoptagelse eller fuld genafspilning, medmindre det særskilt implementeres.

Registrér ikke generelle tastetryk, andre faner eller uvedkommende felter.
Navn, skole og kontaktoplysninger skal ikke være obligatoriske uden et
konkret behov. En deltagerkode gør ikke en genkendelig stemme anonym.

### Valgt tjeneste: Google Drive via Apps Script

Bevar den statiske hjemmeside på GitHub Pages. Et Apps Script under ejerens konto
modtager afleveringen, lægger lyd og log i en privat Drive-mappe og skriver en
række i et regneark. Supabase blev fravalgt, fordi opsætningen var for tung.
Dropbox blev fravalgt, fordi det kræver en adgangsnøgle i sidens kode eller en
server imellem.

- Deltagere fra alle skoler skal kunne aflevere uden konto; adgang gives med et
  afprøvningslink, hvis kode valideres i scriptet.
- Ejeren lytter i Drive og læser oversigten i regnearket.
- Ingen offentlige lydfiler eller offentlig liste over afleveringer. Mappe og ark
  deles ikke. Et skjult link eller en skjult knap er ikke adgangskontrol.
- Deltageradgang er begrænset til upload og kvittering og giver ikke adgang til
  andres feedback eller mulighed for overskrivning.
- Scriptet begrænser hyppighed, antal, filstørrelse og optagelseslængde og rydder
  op efter ufuldstændige afleveringer og dubletter.
- Filer flyttes til papirkurven efter 60 dage, og Google tømmer den efter 30.
- Eventuel mail er en besked om ny feedback; lydfilen sendes ikke som vedhæftning.

Modtagelsen er billigere, men svagere end en tjeneste med databehandleraftale og
valg af region. En privat Google-konto giver efter alt at dømme ingen af delene.
Før indsamling af virkelige optagelser fra andre end ejeren skal dataansvar,
behandlingsgrundlag, information, adgang, sletning og relevante aftaler være
afklaret, også ved deltagelse fra andre skoler. Browserens mikrofontilladelse er en
teknisk tilladelse og afgør ikke behandlingsgrundlaget. Dette dokument fastlægger
ikke det juridiske grundlag.

### Verifikation før funktionen tages i brug

- Afprøv browsernes mikrofonadgang, lydformater, aflytning og stop.
- Kontrollér sammenhæng mellem lyd, log, simulation og version.
- Kontrollér serverkvittering, genforsøg, dobbeltafsendelse og uploadfejl.
- Kontrollér at uvedkommende og andre deltagere ikke kan læse, liste,
  overskrive eller slette afleveringer.
- Kontrollér sletning af både lyd, metadata og log samt papirkurven.
- Afprøv aflevering fra en ekstern skole uden ejerens Google-login.

## 6. Tekniske kilder til aflevering

Dokumentation kontrolleret 31. oktober 2026; verificér igen ved implementering.

- [GitHub Pages: statisk hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [MDN: mikrofonadgang og tilladelser](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: understøttede optageformater](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)
- [Google: webapps i Apps Script](https://developers.google.com/apps-script/guides/web)
- [Google: kvoter i Apps Script](https://developers.google.com/apps-script/guides/services/quotas)
- [Datatilsynet: skoler og daginstitutioner](https://www.datatilsynet.dk/regler-og-vejledning/skoler-og-daginstitutioner)
