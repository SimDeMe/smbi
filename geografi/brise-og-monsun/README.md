# Sø- og landbrise og monsun — kvalitativ simulation

Selvstændig, buildfri simulation i samme stil som `../drivhuseffekt/`. Den
ældre `../TermiskTryk3.html` er bevaret.

## Læringsmål og progression

Eleven skal kunne forklare, hvorfor land og hav opvarmes og afkøles forskelligt,
hvordan en temperaturforskel giver termisk tryk og vind, og hvorfor samme
princip i stor skala og over et år giver monsunen. Seks trin:

1. **Opvarmning** – tiden løber fra kl. 6 til 14; grafen viser land og hav.
2. **Luften udvider sig** – trykflader løftes over land; H/L i højden.
3. **Søbrise** – hele cirkulationen; »Følg et døgn« får vinden til at vende.
4. **Landbrise** – kl. 4; lavere og svagere cirkulation den anden vej.
5. **Sommermonsun** – skematisk snit Det Indiske Ocean → Indien → Himalaya i juli.
6. **Vintermonsun** – januar; sammenligning brise/monsun og »Forklar selv«.

Grafen ved figuren svarer til forsøget med sand og vand under en lampe
(`Øvelser/Geografi/soe-og-landbrise/`): dag = lampe tændt, nat = slukket.

## Model

`model.mjs`: for både land og hav `C · dT/dt = F·S(t) − λ(T − Tb)`. Samme
solindstråling og afkøling; kun tidskonstanten τ = C/λ er forskellig. C er
den effektive varmekapacitet = specifik varmekapacitet × opvarmet masse;
siden fremhæver vands høje specifikke varmekapacitet (ca. 4,2 mod ca. 0,8
kJ/(kg·K) for tørt sand) som hovedforklaring (døgn:
land 4 t, hav 150 t; år: land 0,7 md., hav 4 md.). Den periodiske løsning
findes ved at køre 30 perioder. Vinden sættes proportional med T_land − T_hav
og normaliseres, så den kraftigste søbrise/sommermonsun er 1.

Døgnet giver land ca. 12,5–27 °C og hav ca. 18–18,5 °C med samme døgnmiddel;
søbrise ca. kl. 10–20, landbrise resten af døgnet og svagere. Tallene er en
idealiseret kyst, ikke målinger. Monsungrafen har ingen tal; modellens
fortegnsskift (marts/september) ligger tidligere end den virkelige monsun
(Kerala ca. 1. juni, tilbagetrækning fra september) — det står i »Om modellen«.

Udeladt: Jordens rotation for brisen, terræn, skyer og baggrundsvind,
ITCZ og Tibet-plateauets opvarmning i modellen (nævnt i teksten), latent
varme (vist kvalitativt).

## Visning

SVG-landskab (genereres i `simulation.js` ud fra jordprofiler) og et lærred,
der tegnes i skærmpixels, så stregerne er lige tykke selvom figuren strækkes.
Cirkulationen er én lukket bane med glidende streger og pilehoveder; fart og
tykkelse følger vinden. Etiketter er HTML placeret i viewBox-koordinater.

## Opgaver

Efter de seks trin følger trinnet «Opgaver» (`opgaver.js`, spørgsmål i
`opgavedata.js`), bygget som drivhuseffektens: 15 opgaver med multiple choice (bl.a. hvad specifik varmekapacitet betyder),
«peg på figuren» (søbrisen, lavtrykket, hvor luften synker/stiger, regnen),
«klik i grafen» (hvornår land er varmest, hvornår det er landbrise, hvilke
måneder der er vintermonsun) og til sidst «byg kæden» for søbrisen med falske
udsagn. Figuren stilles som det trin, opgaven handler om; i grafopgaverne vises
hele kurven. Etiketter og H/L er skjult, indtil eleven har svaret. Første svar
tæller; ved forkert pegning eller grafklik vises det rigtige med grønt, og
eleven skal selv ramme rigtigt, før der kan gås videre. Peg- og grafopgaver har
fokuserbare punkter til tastaturet. Grafopgavernes facitintervaller kontrolleres
mod modellen i `test.mjs`. Direkte link: `…/brise-og-monsun/#opgaver`.

## Afprøvning

`node geografi/brise-og-monsun/test.mjs` (model) og, med serveren på 8777,
`node geografi/brise-og-monsun/browser-test.mjs` (fem skærmstørrelser, alle
trin, døgnforløb og vindskifte, monsun, forklar selv, pause, fokus, tastatur,
reduceret bevægelse). Skærmbilleder i `værktøj/ud/`. Ikke afprøvet med elever.
