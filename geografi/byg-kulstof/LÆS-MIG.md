# Byg kulstofkredsløbet – kulstoffets former i landskabet

`geografi/byg-kulstof.html` viser ét stort, selvtegnet landskab i snit med
skov, humus, industri, vulkan, flod, hav, plankton, skaller og geologiske lagre.
Eleven trækker genbrugelige kulstofkort til elementerne eller vælger et kort
og klikker på elementet. Et kort kan bruges mange gange, og havet kan rumme
flere kort. Der gives feedback straks ved placering.

## C og B i samme landskab

- **C:** 12 placeringer med tre brede kategorier: CO₂, organisk kulstof og
  kulstof i fast kalk. Organisk kulstof omfatter både levende og dødt
  organisk stof og fossile brændsler. Olie og gas behandles derfor som
  organisk bundet kulstof, ikke som nye korttyper.
- **B:** 15 placeringer. C-svar bevares; havet tilføjes HCO₃⁻ og CO₃²⁻,
  og floden tilføjes HCO₃⁻. B kan vælges direkte, eller eleven kan vælge
  »Fortsæt til B-niveau« efter C. Skift tilbage til C skjuler ionkort og
  B-forklaringer, men bevarer svarene.
- Flodens svarplads er kun aktiv på B. I C fremgår flodtransporten af de
  valgfrie processer, uden at de to ionbegreber introduceres.
- »Kulstof i kalk« er et fast mineral; B-ionkortene er udtrykkeligt
  opløste former i vand. Kul og kalksten er forskellige lagre.

Det erstatter den første udgaves tre separate figurer. Gamle URL-fragmenter
`#hurtig`, `#geologi` og `#mennesker` fører til det fælles landskab.
Den fælles motor i `byg-motor/` er uændret: genbrugelige kort og flere svar
på samme element styres lokalt, så der ikke findes skjulte, enslydende kort,
som kun accepteres på hver sin plads.

## Filer og tilstand

- `landskab.js`: statisk SVG-landskab med stor, farvet illustration fra start.
- `model.js`: former, elementer, C/B-krav, svarregler og processer.
- `side.js`: træk med mus/pen/touch, klik, tastatur, feedback og lagring.
- `stil.css`: landskabet, klæbende kortbakke, stor visning, overblik og fokus.
- `model.test.mjs` og `browser-test.mjs`: faglig svarstruktur og betjening.

Korrekte svar gemmes som `element:form` under `byg-kulstof.v2` i browseren.
Kun gyldige kombinationer læses ind. Den tidligere v1-øvelses afslutningsmærker
kan ikke oversættes til disse placeringer og importeres ikke. »Byg forfra«
rydder svar på begge niveauer. Modellen virker uden adgang til localStorage.

## Processerne er bevaret

»Vis kredsløbets pile« og procesvælgeren viser fotosyntese, respiration,
havudveksling, kemisk forvitring og flodtransport, biologisk pumpe,
sedimentation, kalkdannelse/diagenese, subduktion/metamorfose/afgasning,
landhævning, fossildannelse, forbrænding og cementproduktion i det samme
landskab. Den valgte proces fremhæves og forklares. C-tekster bruger ikke
hydrogenkarbonat eller karbonationer; B udvider den kemiske forklaring.

## Faglige forenklinger

Landskabet er et kvalitativt snit uden målestok. Lagre og tidsrum er ikke
proportionale. Røg og vulkanskyer markerer kilder; CO₂ er usynlig. Felterne
spørger til bestemte materialer: væv, humus, olie osv., ikke til alle stoffer
i deres omgivelser. Havvandets felt handler om opløst uorganisk kulstof;
organisk kulstof er vist på plankton og tang. De tre B-former findes i det
samme havvand og er ikke fordelt på adskilte havlag.

Silikatforvitring forbruger CO₂. Kalkdannelse frigiver også CO₂; kombinationen
giver netto lagring. Kalkopløsning og genudfældning alene er ikke samme
langsigtede nettooptag. CO₂ kan frigives under metamorfose uden fuldstændig
opsmeltning. Ikke alt subduceret kulstof returneres straks. Disse forhold
uddybes under modellen, med reaktionsligninger i B-visningen.

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
python3 -m http.server 8777
node geografi/byg-kulstof/model.test.mjs
node geografi/byg-kulstof/browser-test.mjs
```

Modeltesten kontrollerer gentagen brug af samme kort, C/B-krav, udvidelse af
det samme havfelt, bevarelse af placeringer og validering af gemt tilstand.
Browsertesten udfører faktiske træk, klik og tastaturvalg, bygger C og
fortsætter til B, genindlæser og afprøver fem skærmstørrelser samt touch.
Skærmbilleder ligger i `værktøj/ud/` og er ikke med i git. Den tidligere
standardtest fra `byg-motor/` gælder ikke for denne svarstruktur.

## Elevafprøvning – endnu ikke gennemført

Undersøg ved tænke-højt-afprøvning, om eleven:

1. opdager, at samme kort kan bruges flere steder;
2. forbinder organisk kulstof med planter, humus og fossile brændsler;
3. skelner kul fra kalk og et fast mineral fra en opløst ion;
4. kan fortsætte fra C til B og forklare, hvad der er nyt;
5. forstår, at havets tre B-former findes i det samme vand;
6. kan følge forvitring og begravelse gennem landskabet med pilene;
7. kan bruge kortene og finde elementerne på telefonen.

Spørg efterfølgende til et nyt tilfælde, fx hvorfor forbrænding af naturgas
flytter kulstof til atmosfæren. Automatisk test dokumenterer funktion,
ikke læringsudbytte.
