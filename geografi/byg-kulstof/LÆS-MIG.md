# Byg kulstofkredsløbet

`geografi/byg-kulstof.html` bruger den fælles motor i `byg-motor/`.
Figurer og ordliste er selvstændigt formuleret og tegnet i SVG.

Læringsmål: Skeln mellem lagre og processer, forbind det biologiske,
oceaniske og geologiske kredsløb, og forklar menneskets hurtige overførsel
fra geologiske lagre til atmosfæren.

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

## De tre figurer

| Figur | Lag | Antal pladser |
|---|---|---|
| Land og hav | fem lagre; planter og jord; havudveksling, cirkulation og biologisk pumpe | 12 |
| Det langsomme kredsløb | steder/materialer; forvitring til havbund; begravelse og vejen tilbage | 13 |
| Fossilt kulstof og mennesker | luft og to geologiske lagre; fossil dannelse og forbrænding; afskovning og cement | 8 |

Mekanisk forvitring er et ord i overskud i den kemiske del. Forkert placering
forklares med forskellen mellem fysisk sønderdeling og kemisk CO₂-forbrug.

## Faglige afgrænsninger

- Silikatforvitring er den viste langsomme CO₂-sænke. Silikatbjergarter er
  reaktionspartner, ikke et fiktivt stort karbonatlager. CO₂ føres videre i
  vand, især som hydrogenkarbonat.
- Kalkdannelse frigiver også CO₂. Nettoreaktionen med silikatforvitring er
  vist under »Om figuren«. Opløsning af kalk og genudfældning alene giver
  ikke samme langsigtede nettooptag. Mekanisk forvitring er ikke et kemisk optag.
- Den subducerede strøm fortsætter til metamorfose og vulkansk afgasning.
  Reaktioner kan frigive CO₂ uden fuldstændig opsmeltning. Ikke alt kulstof
  returneres straks til atmosfæren.
- Kalksten er uorganisk karbonatkulstof; fossile brændsler er dannet af
  organisk stof. Der er ingen pil fra kalksten til olie.
- Havets dobbelte pile samler transport, der foregår forskellige steder.
  Organiske partikler på den biologiske pil synker; det meste nedbrydes
  inden begravelse. En nedadrettet pil er ikke lig med permanent lagring.
- Jordrespirationspilen illustrerer mikrobiel omsætning af jordens organiske
  stof. Røddernes respiration omtales, men har ikke egen pil fra vegetation.
- Pilbredder, lagerstørrelser og illustrationernes højder er kvalitative.
  Ingen daterede strømstørrelser, prognoser eller balanceberegninger indgår.
- Metan, fødekæder, havets genopløsning af kalk og mange returstrømme er
  udeladt. Figurens første to faner supplerer hinanden; de er ikke to
  uafhængige, lukkede systemer.

## Test

```sh
node byg-motor/selvtest.mjs geografi/byg-kulstof.html
node geografi/byg-kulstof/browser-test.mjs
```

Den fælles selvtest kontrollerer data, ord i overskud, forkert placering,
træk, klik, hints, svær udgave og tastatur. Sidens browsertest kontrollerer
prikkernes afstand til pile, tekstbredde, tre faner ved fem skærmstørrelser
og touch. Den forudsætter en lokal server på port 8777. Skærmbilleder
gemmes i `værktøj/ud/`, der ikke er med i git.

## Elevafprøvning – endnu ikke gennemført

Lad en elev tænke højt uden løbende instruktion. Undersøg, om eleven:

1. kan skelne lageret »Jordens kulstof« fra processen »Jordrespiration«;
2. følger pilene og kan forklare forskellen på havcirkulation og biologisk pumpe;
3. forklarer, hvorfor mekanisk forvitring ikke er det søgte CO₂-optag;
4. følger den langsomme vej fra atmosfære til kalk og tilbage;
5. kan forklare forskellen på fossil forbrænding og CO₂ fra cementens kalk;
6. finder den gule plads og kan rulle figuren på telefonen.

Spørg til et nyt tilfælde efter opgaven, fx hvorfor mere nedbrydning af jord
kan øge CO₂-indholdet, og hvorfor langsom forvitring ikke hurtigt udligner
fossil forbrænding. Automatisk test dokumenterer funktion, ikke læringsudbytte.
