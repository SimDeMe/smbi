# Byg kulstofkredsløbet – puljer og processer

`geografi/byg-kulstof.html` er **alfa**. Lærebogsfiguren er udvidet opad med et åbent himmelfelt. Opgaven bruger samme fælles motor og komponenter som vandets
kredsløb: ordbakke, gule svarfelter, træk/klik/tastatur, Indsend svar,
hints, grønne låste navne og Næste lag.

## Tre lag

1. **Puljerne:** atmosfæren, planter på land, jordens organiske stof,
   havvand, havets organismer, aflejrede kalkskaller, kul, olie, naturgas
   og kalksten. Alle ti navne er til rådighed i ordbakken.
2. **De hurtige processer – fem ord:** fotosyntese, respiration og
   nedbrydning, hav–luft-udveksling, biologisk pumpe og forbrænding.
3. **De geologiske processer – seks ord:** forvitring og flodtransport,
   aflejring af kalk, fossildannelse, landhævning og erosion,
   vulkansk afgasning og cementproduktion.

Det tidligere lag med kulstoffets former og dets C/B-kort er fjernet efter
brugerens ønske. Der er ingen placering af CO₂, organisk kulstof eller ionkort.

Procespilene forbinder tekstboksenes kanter med rette stræk og tydelige
pilespidser: fra pulje til proces og videre til næste pulje. Ruterne findes
mellem de synlige bokse med fri afstand til teksten. Procesfelterne har
ikke længere separate henvisningsstreger ud i landskabet.
Den biologiske pumpe forbindes med havvand, ikke med kalkskaller; dens
retur til havpuljen repræsenterer transport til dybere vand. Forvitring
forbindes med atmosfære og hav. Landhævning fører fra kalksten videre mod
forvitring og betyder ikke en direkte frigivelse af CO₂.

Puljernes navne bliver stående i proceslagene. Tidligere procesnavne og
pile kan vises med »Vis tidligere procesnavne«; som udgangspunkt vises
kun det aktuelle lags pile. Figuren vises højere, så landskabets elementer
bevarer deres læsbarhed; på computer følger opgavepanelet med, når man
ruller ned gennem figuren.

Der er fem eller seks nye procesnavne at arbejde med. »Vis kun
figuren« giver adgang til det rene landskab. En færdig forklaring kan
aflæses ved at pege på et korrekt ord eller fokusere det med tastaturet.

## Faglige valg og forenklinger

- Lagene organiserer opgaven. De betyder ikke, at alle processer i et lag
  foregår lige hurtigt. Cementproduktion er en hurtig industriel
  frigivelse fra et geologisk lager; den ligger sammen med bjergartsvejene.
- Den biologiske pumpe flytter kulstof ned i havet. Efterfølgende
  nedbrydning og lagring kan foregå på andre tidsskalaer.
- Fotosyntesen har to pile med ét navn: fra luft til planter på land og
  fra havvand til havets organismer.
- Fossildannelsen har særskilte pile fra landplanter mod kul og fra
  marint organisk stof mod olie/gas. Kalksten bliver ikke til olie.
- Forvitringspilen samler kemisk forvitring og flodtransport af opløste
  stoffer. Mekanisk sønderdeling alene optager ikke CO₂.
- Kalkaflejring omfatter begravelse og senere stendannelse. Selve
  kalkdannelsen frigiver også CO₂; sammen med silikatforvitring kan
  forløbet give netto lagring.
- Den dybe vej frem mod vulkansk afgasning er en samlet pil gennem flere
  processer. Reaktioner ved opvarmning kan frigive CO₂ uden fuldstændig
  opsmeltning. Figuren viser ikke en egentlig subduktionszone.
- Landhævning blotlægger bjergarter, men optager ikke selv CO₂.
- Puljer, pilebredder, afstande, lag og tidsrum er ikke proportionale.
  Det er udvalgte veje, ikke en fuldstændig massebalance.
- Røg og vulkanskyer markerer udledningssteder; CO₂ er usynlig.

Processernes faglige indhold er videreført og kontrolleret mod
[NASA: The Carbon Cycle](https://science.nasa.gov/earth/earth-observatory/the-carbon-cycle/)
den 10. november 2026, herunder forskellen på hurtige og langsomme veje,
forvitring, havudveksling, fossildannelse og cementproduktion.

## Filer og lagring

- `model.js`: puljer, procesnavne, forbindelser, lag og validering af gemte svar.
- `pile.js`: retvinklede ruter mellem bokse uden at krydse tekst.
- `puljer.js`: figurdata og lokal integration med `byg-motor/motor.js`.
- `side.js`: lagring, fokus, ren figurvisning og tastaturgenveje.
- `stil.css`: lokale tilpasninger oven på `byg-motor/stil.css`.
- `landskab.js` og `landskab-atmosfaere.webp`: højere lærebogsfigur,
  1362 × 1155 px, ca. 221 KiB; SVG-koordinatsystem 1568 × 1330.
- `landskab-laerebog.webp`: den foregående figur, bevaret som billedreference.
- `illustration-prompt.md`: imagegen-prompts til grundfiguren og den nye himmel.

Kontrollerede svar, aktivt lag, forsøg og stjerner gemmes under
`byg-kulstof.v2` med dataformat version 4. Godkendte puljenavne fra den
foregående udgave bevares; gamle kemi-/formsvar overføres ikke til
procesnavne. Ugyldige id'er fjernes, og senere lag kræver gennemførte
forudgående lag. Ikke indsendte placeringer gemmes ikke. Byg forfra
rydder alle tre lag. Siden virker også uden localStorage.

Gamle fragmenter `#hurtig`, `#geologi` og `#mennesker` fører fortsat til
landskabet. Den fælles motor og andre Byg figuren-opgaver er uændrede.

## Kildeundersøgelse, 10. november 2026

- **NaturgeografiGrundbogen C, afsnit 7.3, figur 7.3.4:** set i det lokale
  figuruddrag `figur-7-3-4-ngc.png` i Undervisning-repoets forløb
  `naturgeografi-nf-haven-i-havet/06/elevark/kulstofkredsloebet/`.
  Figuren har atmosfære, biosfære, hydrosfære og lithosfære, fotosyntese og
  respiration, forbrænding, havudveksling, aflejringer, olie, pladebevægelse,
  magma og vulkanudbrud. Kun figuruddraget er kontrolleret her, ikke den
  fulde online kapiteltekst. De tidligere lokale elevark er også læst som
  undervisningskontekst; deres forenklinger videreføres ikke automatisk.
- **NaturgeografiGrundbogen B, afsnit 11.7:** den lokalt gemte HTML-side i
  `/Users/sm/Undervisning/bøger/naturgeografigrundbogenB/` er læst.
  Jordens organiske stof, nedbrydning, rodrespiration og temperaturafhængig
  frigivelse af CO₂ motiverer en særskilt jordpulje.
- **Naturgeografi C**, lokal PDF i `bøger/mad-til-milliarder/`: opslagene
  s. 113–114 og 170–171 er set. De viser henholdsvis jord/permafrost og
  klima samt energiforbrug. PDF'en er scannet og blev læst visuelt; den er
  ikke dokumentation for et bestemt kulstofdiagram.
- Online opslag i GO Naturgeografi og Systime gav ikke læsbar kapiteltekst
  gennem søgeværktøjet. Der påstås derfor ikke en gennemgang af disse kapitler.
- [NASA, The Carbon Cycle](https://science.nasa.gov/earth/earth-observatory/the-carbon-cycle/)
  og [NOAA, Basics of the Carbon Cycle](https://gml.noaa.gov/education/carbon_toolkit/)
  er kontrolleret som primære fagkilder for langsom/hurtig omsætning,
  forvitring, havudveksling, karbonater og menneskets påvirkning.

## Test

```sh
node geografi/byg-kulstof/model.test.mjs
node geografi/byg-kulstof/browser-test.mjs
```

Modeltesten kontrollerer migration, lagvis validering, pulje-/proces-id'er
og placeringernes geometri. Browsertesten bygger alle tre lag med mus og
tastatur, kontrollerer fejl, lagring og hints og afprøver touch samt fem
skærmstørrelser. Billeder gemmes i den ignorerede mappe `værktøj/ud/`.

## Elevafprøvning – endnu ikke gennemført

Undersøg ved tænke-højt-afprøvning, om eleven kan skelne puljer og
processer, aflæse pilenes retning, forbinde forvitring med transport til
havet og forklare forskellen på hurtig frigivelse og langsom lagring.
Undersøg også, om fem/seks procesord giver en overskuelig opgave, og om
»Vis tidligere navne« hjælper eleven med at forbinde de tre lag.
Automatiske test dokumenterer funktion og layout, ikke læringsudbytte.
