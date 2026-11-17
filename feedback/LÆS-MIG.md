# Feedback-knappen

En knap på hvert kort og på hver side. Dialogen spørger først «Jeg er …»
(underviser, elev, andet) og viser så rollens få enkeltvalg, så man kan give
feedback uden at skrive noget. Øverst er der en direkte vej, «Meld en fejl
eller skriv en besked», med kategorierne Fejl, Forslag, Spørgsmål og Ros.
Svaret lander i et Google-ark med besked om, hvilken simulering eller
vejledning det drejer sig om — uden login, og uden at navn eller e-mail er
påkrævet.

## Spørgsmålene

| Rolle | Spørgsmål (enkeltvalg) | Tekst |
| --- | --- | --- |
| Underviser | Hvordan har du brugt materialet? · Hvordan fungerede det i undervisningen? (kun når det er brugt i undervisning, ikke ved «Kun afprøvet») · Ville du bruge det igen? | valgfri |
| Elev | Var det tydeligt, hvad du skulle gøre? · Hjalp materialet dig med at forstå emnet? | valgfri |
| Andet | — | påkrævet |
| (direkte besked) | kategori, valgfri | påkrævet |

Der kan sendes, når mindst ét evaluerende spørgsmål er besvaret (eller der er
skrevet tekst); rollen alene er ikke nok. Kun det, der er synligt, når der
trykkes Send, kommer med — skifter man rolle eller visning, bliver de skjulte
svar hjemme. E-mail er valgfri, men tjekkes, hvis den er udfyldt.

Kvitteringen vises kun, når modtageren har svaret `{"ok":true}`. Går noget
galt, bliver svarene stående i formularen med en forklaring.

## Delene

| Fil | Hvad den gør |
| --- | --- |
| `feedback.js` (i roden) | knapperne, dialogen og afsendelsen. Én fil, ingen afhængigheder |
| `feedback/apps-script.gs` | modtageren. Hører til i Apps Script, ikke på sitet |
| `feedback/apps-script.test.mjs` | modtageren mod et falsk ark: `node feedback/apps-script.test.mjs` |
| `værktøj/feedback-test.mjs` | dialogen i browser mod en falsk modtager: `node værktøj/feedback-test.mjs` |

Siderne indlæser den med én linje før `</body>`:

```html
<script src="/feedback.js" defer></script>
```

## Sådan sættes modtageren op

1. Lav et nyt Google-regneark. Kald fanen `Feedback` — eller lad være, scriptet
   laver den selv med overskrifter første gang.
2. **Udvidelser → Apps Script** i arket. Slet indholdet af `Kode.gs`, og sæt
   indholdet af `feedback/apps-script.gs` ind i stedet.
3. Øverst i filen: skriv din mailadresse i `MAIL_TIL`, hvis du vil have besked
   ved hver tilbagemelding. Lader du den stå tom, sendes der ingen mails.
4. Gem med **⌘S**, og klik så den blå **Implementer** øverst til højre →
   **Ny implementering**. Tandhjulet ved «Vælg type» → **Web-app**. Sæt
   *Kør som* til dig selv og *Hvem har adgang* til **Alle**.

   «Alle» er det afgørende valg: står der «Alle med en Google-konto», skal
   eleven logge ind, og så er hele pointen væk.
5. Godkend adgangen. Google advarer om, at appen ikke er bekræftet — det gør
   den om alle egne Apps Script-projekter. **Avanceret → Gå til … (usikker) →
   Tillad**. Den beder også om lov til at sende mails på dine vegne; det er
   `MailApp`, der giver dig besked ved hver tilbagemelding.
6. Kopiér web-appens adresse. Den ender på `/exec`.
7. Sæt adressen ind i `feedback.js` (linje 21):

   ```js
   var MODTAGER = 'https://script.google.com/macros/s/…/exec';
   ```

   **Så længe feltet er tomt, sættes der ingen knapper ind på siderne.** En knap,
   der ikke kan sende noget, er værre end ingen knap.
8. Åbn `/exec`-adressen i en browser. Står der «smbi.dk tager imod feedback her.»,
   er implementeringen i orden. Kommer der i stedet en loginskærm, er
   *Hvem har adgang* sat forkert.

**Ved senere rettelser i `apps-script.gs`:** **Implementer → Administrer
implementeringer →** blyanten på den, der kører **→ Version: Ny version →
Implementer**. Så beholder den sin adresse. Vælger du i stedet *Ny
implementering*, får den en ny adresse, den gamle svarer ingenting, og siderne
sender ud i det blå — uden at nogen opdager det, fordi afsenderen altid får
«Tak, beskeden er sendt».

Menupunkterne hedder «Implementer» i den danske udgave og «Deploy» i den
engelske.

Kontrollér bagefter, at `/exec`-adressen nu svarer «smbi.dk tager imod
feedback her (skema 2).» Svarer den uden «(skema 2)», kører den gamle kode
stadig. Den gamle modtager gemmer kun svar med mindst 10 tegns tekst; siden
opdager det og viser en fejl i stedet for en falsk kvittering, men de rene
afkrydsningssvar kommer ikke igennem, før den nye version er udrullet.

## Hvad der havner i arket

Kolonnerne skrives efter overskrift. Har arket allerede de elleve gamle
kolonner, lægger scriptet de nye til efter «Status» første gang, der kommer et
svar — de gamle rækker og din statuskolonne bliver, hvor de er.

| Kolonne | Eksempel |
| --- | --- |
| Tidspunkt | 22-09-2026 10:14 |
| Nøgle | `Øvelser/Geografi/oliens-migration` |
| Titel | Oliens migration |
| Kilde | `kort på geografi.html` eller `siden selv` |
| Tilstand | `trin=3`, `mode=explore` — tom hvor siden ikke har trin |
| Type | kategorien i den direkte visning: Fejl · Forslag · Spørgsmål · Ros (gamle rækker: også Mangler · Idé) |
| Besked | den skrevne tekst — tom, hvis der kun er sat kryds |
| Navn | kun gamle rækker; feltet findes ikke længere i formularen |
| Skærm, Browser | til fejl, der kun viser sig på små skærme |
| Status | tom — din egen kolonne til «set», «rettet» |
| Visning | `evaluering` eller `besked` (den direkte vej) |
| Rolle | Underviser · Elev · Andet |
| Anvendelse, Fungerede, Brug igen | underviserens svar |
| Tydeligt, Forstået | elevens svar |
| E-mail | kun hvis afsenderen vil have svar; bruges som svaradresse i mailen |
| URL | den fulde adresse på materialet |
| Skema | `2` for den nye formular, `1` for gamle sider i en browsercache |

Celler, der begynder med `=`, `+`, `-` eller `@`, får en apostrof foran, så
Sheets ikke læser dem som formler.

**Nøglen er mappen, ikke filen.** Feedback fra kortet på `geografi.html` og fra
selve vejledningen får den samme nøgle, selv om den ene pegede på `.pdf` og den
anden på `.html`. Ellers skulle du selv sidde og parre dem bagefter.

## Spærringerne mod spam

Adressen på webappen står i klartekst i `feedback.js` og kan ikke holdes
hemmelig. Derfor flere lag:

* **Honningkrukken.** Feltet `hjemmeside` er skjult ude til venstre for skærmen,
  har `tabindex="-1"` og `aria-hidden`, så hverken øjne eller skærmlæsere møder
  det. Bots udfylder alt, hvad de finder — er feltet udfyldt, skrives rækken ikke.
* **Tidsfælden.** Under tre sekunder fra dialogen åbnes til der trykkes send, og
  beskeden afvises med «vent et øjeblik, og tryk så igen». Et menneske kan prøve
  igen; et script, der fyrer løs, plejer ikke at vente.
* **Kendte værdier.** Modtageren tager kun imod de svarmuligheder, formularen
  har, og kun de felter, der hører til rollen.
* **Timegrænsen.** Over 50 rækker på en time, og Apps Script holder op med at
  skrive, indtil det falder til ro — og sender dig én advarsel, ikke femhundrede.
  Afsenderen får at vide, at der er travlt, og kan prøve igen.

Honningkrukken svarer altid «ok», så en bot ikke kan læse sig til, hvad der
afslørede den. Alle andre afvisninger svarer ærligt, så en rigtig afsender
aldrig får en falsk kvittering.

## Hvor knapperne kommer frem

* **Kort** — alle `.sim` og `.item` med et link i `<h4>`, altså både
  simuleringer, forsøgsvejledninger og opgaver. Knappen sættes ind i `.sub`-rækken
  ved siden af `PDF` og `Word`, og et nyt kort får sin knap af sig selv.
* **Simuleringer** — en `.btn-mini` i panelets `.rig-head`, efter den sidste
  knap i rækken. Så er knappen der også, når figuren ligger i en iframe, hvor
  sidens krom er skjult. Siden får så ingen pille i sidefoden — én knap pr.
  side. Det gælder alle sider med `.rig .rig-head` undtagen forsiden, hvis
  panel kun er en smagsprøve. Knappen skjules i projektortilstand
  (`body[data-projektor="1"]`), og i arket står der, om den kom fra en iframe.
* **Siden selv** — på alle andre sider en pille i sidefoden. Har siden ingen
  `.foot` (de gamle sider), lægger den sig nederst til højre i stedet.
* **Ikke** i projektortilstand (`?projektor=1`, `?mode=teach`), ikke på print,
  ikke i en iframe (bortset fra simuleringens egen knap) — og ikke inde i
  øvelsesvejledningerne, se nedenfor.

## Øvelsesvejledningerne har ingen knap

De 25 HTML-vejledninger får **ikke** en knap, og `Øvelser/_quarto.yml` er
urørt. Feedback om en vejledning gives på dens kort på `biologi.html` eller
`geografi.html`.

Det er også der, den hører hjemme: en vejledning bliver lige så tit hentet som
PDF eller Word som læst i browseren, og de to formater kan ikke have en knap.
Sidder knappen kun på kortet, rammer alle tilbagemeldinger det samme sted,
uanset hvilket format eleven valgte — og det er stadig mappen, der er nøglen.

Til gengæld er der intet at vedligeholde: ingen Quarto-stump, der skal med i
hver render, og ingen kode bagt ind i 25 selvstændige HTML-filer, som skulle
renderes igen, hver gang `feedback.js` blev rettet.
