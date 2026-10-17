# Geografiske tværsnit — kildeankre og kunstneriske valg

15. oktober 2026. Brugeren ønsker et visuelt stærkt tværsnit af det nye
3D-landskab og accepterer fortolkning af det ukendte. Det er gennemført som
tre regionale blokke i `model3d.html`, ikke som et nyt anonymt skema.

## Det målte landskab

Alle topvertexers x/z ligger i samme sfæriske konforme koniske projektion
som terrænmodellen. Deres y aflæses fra `terraen.modelHoejdeVed(x,z)`.
Snitblokken er et regionalt udsnit; den skifter ikke til en tegnet overflade.
ETOPO surface-udgaven viser overfladen af jøklerne. Vi har ikke data for
isens tykkelse eller fjeldfladen under isen. Samme kilde og licens som
`data/islandskort.LICENSE`; ingen nye raster-/terrænkilder.

## Placeringer og dybder

Publikationerne nedenfor er åbnet, og relevante afsnit om dybder og
modelbegrænsninger er kontrolleret. De gengiver forskellige perioder og
metoder, ikke Islands aktuelle tilstand. Kilderne er direkte tilgængelige
fra elevsiden. De oprindelige figurer er ikke kopieret.

| Objekt | Geografisk anker [lon, lat] | Valg i modellen | Kilde og begrundelse |
| --- | --- | --- | --- |
| Svartsengi | [−22,43; 63,88] | 4,5 km under lokal overflade, vist som ca. 4–5 km | [Islands Meteorologiske Institut](https://en.vedur.is/volcanoes/fagradalsfjall-eruption), afsnit om Svartsengi: geodetisk fortolket magmaområde omkring 4–5 km. Placeringen er omtrentligt ved Svartsengi-området beskrevet i artiklen, ikke en publiceret inversionskoordinat. |
| Fagradalsfjall | [−22,258; 63,895] | 20 km under lokal overflade | [Halldórsson m.fl. 2022, Nature](https://doi.org/10.1038/s41586-022-04981-x): termobarometri peger på mere end 15 km og sandsynligst ca. 20 km; gasanalyse giver 19 ±4 km. |
| Bárðarbunga | [−17,516; 64,633] | 6,5 km under havniveau | [Hudson m.fl. 2017, GRL](https://doi.org/10.1002/2017GL074749), diskussion: hovedlagring omkring 6–7 km bsl; andre modeller giver andre dybder. |
| Grímsvötn, lavt område | [−17,316; 64,416] | 3 km under havniveau | Hudson m.fl. henviser til Alfaro m.fl. for en lav smelteregion; Reverso m.fl. gennemgår også flere estimater. Vi vælger et afrundet niveau og viser ikke en skarpt målt kammergrænse. |
| Grímsvötn, dybt område | Samme vulkananker | 10 km under havniveau, **valgt eksempelmodel** | [Reverso m.fl. 2014, JGR](https://doi.org/10.1002/2013JB010569), figur 10: et regneeksempel med reservoirer ved 3 og 10 km. Artiklen understreger, at det dybe reservoirs dybde ikke kan bestemmes entydigt; 10 km er ikke en observation. |
| Hekla | [−19,666; 63,983] | 16 km under lokal overflade, vist som ca. 14–18 km | [Ófeigsson m.fl. 2011, JGR](https://doi.org/10.1029/2010JB007576), abstract og resultater: modellen af deformation ved udbruddet i 2000 giver 16 ±2 km; andre perioder giver andre intervaller. |

De navngivne vulkaners vandrette ankre er de eksisterende GVP-positioner i
`data/islandskort.json`. De er **vulkanpositioner**, ikke eksakte positioner
for inverterede magmakamre. Snittene ved Vatnajökull og Reykjanes går gennem
de respektive to ankre; Hekla-snittet er omtrent øst–vest gennem vulkanen.
Snittets placering vises på et lille kort, afledt af samme højdegitter.

Dybdeaksen har nul ved **havniveau**. For de tre poster, der er angivet under
lokal overflade, trækkes dybden fra den eksisterende modeloverflade ved
ankeret. De brede dybdeintervaller er bevaret i teksten. Publikationernes
forskellige geofysiske referencer er ikke forsøgt reduceret til én ny præcis
inversionsmodel. Grímsvötns dybe eksempel er forankret til havniveau i vores
illustration; det er endnu et grafisk valg, ikke en præcis reproduktion af
Reversos idealiserede overflade/datum.

## Fortolkning og grafik

- Magmaområdernes konturer, højder, bredder, krystalfordeling og farver er
  tegnet frit. Kammerkonturerne forstørres yderligere grafisk (1,4× i
  længderetningen og 1,2× i højden) for læsbarhed. Der beregnes ikke volumener.
- Tilførselsveje er uafhængige illustrerede ruter. Der tegnes ingen direkte
  forbindelse mellem Bárðarbunga og Grímsvötn eller mellem Svartsengi og
  Fagradalsfjall. Forbindelsen mellem de to Grímsvötn-reservoirer er en
  fortolkning inspireret af to-kammer-modellen.
- Strømmende lyspunkter viser retning. Der er ingen hastigheds-/tidsskala og
  ingen påstand om et aktuelt udbrud. Animationen startes eksplicit og har
  pause; den standses ved manuel kamerabetjening, Escape og skjult fane.
- Klippens diskrete farvebånd er dekorative. De er ikke kortlagte strata,
  lithosfæregrænser eller en målt Moho. Blokken slutter ved 26 km bsl;
  tilførselsvejene fortsætter principielt videre i dybet.
- Højden **over havniveau** tegnes fortsat ×20. Dybder under havniveau har
  egen overdrivelse (fra start ×1,5, valg ×0,5–×6). Den stykkevise skala
  er kontinuert ved havniveau, men har forskellig hældning på hver side.
  Det er synligt i kontrollen og forklaret under figuren. Man skal bruge
  kilometeraksen og teksten til dybde, ikke måle pixels på skærmen.
- Ingen genberegning af magma, deformation eller isostasi. Udseendet er en
  kildebaseret illustrativ rekonstruktion, ikke geofysisk tomografi.

## Implementering og kontrol

`snitdata.js` indeholder kildeankrene. `snit3d.js` bygger det geografiske
udsnit med en faktisk overkant, lukkede sider, en fælles snitflade og
kamre/gange i samme verdenskoordinater. Den eksisterende dybdebuffer skjuler
magma, når blokken drejes om på bagsiden. Kyst-/terrænfilen ændres ikke.
URL-parameteren `?snit=vatnajokull`, `reykjanes` eller `hekla` gør udsigten
delbar. Landskabets forrige kameravinkel og højdefaktor gendannes ved lukning.
De oprindelige procesfigurer og deres adresser findes fortsat.


## Elevvisning og dokumentation (v421)

Kilde-/fortolkningsmærkater er samlet i **Om modellen** frem for elevens
arbejdsflade. Samme kildedata, usikkerheder, dybdedatumer og eksemplet ved
Grímsvötn er bevaret i dialogen; kammerkortene viser navn og dybde.
Siden v450 ligger Þingvellir på selve øen: et finmasket udsnit (ca. 56 × 54 km,
400 m mellem punkterne) over ETOPO erstatter øens grove trekanter, når man
zoomer ind, og en randzone syr det sammen med resten. Søens omrids er ETOPO's
flade på 96–103 m, der hænger sammen med Þingvallavatn. De smalle
forkastninger, søbunden og overfladedetaljerne er illustrerede tilføjelser,
ikke nye målte geodata. Dokumentationen i dialogen angiver de visuelle valg,
Hreppar-mikropladen og kilder fra Þingvellir Nationalpark samt Weismüller
m.fl. (2019), DOI 10.5194/se-10-1757-2019.
