# Termisk lavtryk

Selvstændig, buildfri simulation på `/geografi/termisk-lavtryk/`, med links fra
geografibiblioteket og atlasset. Varmeskyder, sluk varme, pause, nulstil og fokus.
Lokale skrifttyper fra atlasset; ingen eksterne JavaScript-afhængigheder.

## Faglig model

Kvalitativ principmodel: opvarmning → lavere tæthed/opstigning → udstrømning
i højden → mindre luftmasse i søjlen og lavere overfladetryk → indstrømning.
`varme` nærmer sig skyderens dimensionsløse værdi med tidskonstant 3 s;
`underskud` nærmer sig `varme` med tidskonstant 4 s. Det er en illustrativ
respons, ikke en prognose eller løsning af atmosfærens bevægelsesligninger.
Tilnærmelsen repræsenterer en balance mellem udstrømning og indstrømning;
varig varme giver ikke et ubegrænset fald i luftmassen. Tid, afstand og
partikelhastighed er ikke målfast, og trykket vises kun relativt.
Rotation, fugt, skyer og nedbør er udeladt. Returstrømmen er idealiseret.
Kilder er linket i sidens fold-ud-forklaring: NWCG's “heat low” og NWS om
konvergens/divergens og luftmassens balance.

## Afprøvning

Chromium på 1280×577, 1366×625, 1536×730, 390×750 og 640×625:
ingen vandret rulning eller JavaScript-fejl, figur og primære kontroller
samtidig synlige på de tre elevlaptops; skærmbilleder gennemgået på laptop
og mobil. Opvarmning, slukning/afkøling, pause, nulstil og skyder med tastatur
afprøvet på 1280×577. Fokus og fold-ud-forklaring afprøvet på alle fem
størrelser. Reduceret bevægelse starter pauset. Fysisk touch, Safari og
skærmlæser er ikke særskilt afprøvet.
