# Feedback-knappen

En knap på hvert kort og på hver side. Eleven skriver en besked, og den lander
i et Google-ark med besked om, hvilken simulering eller vejledning det drejer
sig om — uden at eleven skal vælge noget i en liste, og uden login.

## Delene

| Fil | Hvad den gør |
| --- | --- |
| `feedback.js` (i roden) | knapperne, dialogen og afsendelsen. Én fil, ingen afhængigheder |
| `feedback/apps-script.gs` | modtageren. Hører til i Apps Script, ikke på sitet |
| `Øvelser/feedback.html` | den linje, Quarto lægger ind i øvelsesvejledningerne |

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
4. **Udrul → Ny udrulning → Webapp**. Sæt *Kør som* til dig selv og
   *Hvem har adgang* til **Alle**. Uden det sidste kan eleverne ikke sende.
   Google beder om lov til at sende mails på dine vegne — det er `MailApp`.
5. Kopiér webappens adresse. Den ender på `/exec`.
6. Sæt adressen ind i `feedback.js`:

   ```js
   var MODTAGER = 'https://script.google.com/macros/s/…/exec';
   ```

   **Så længe feltet er tomt, sættes der ingen knapper ind på siderne.** En knap,
   der ikke kan sende noget, er værre end ingen knap.
7. Åbn `/exec`-adressen i en browser. Står der «smbi.dk tager imod feedback her.»,
   er udrulningen i orden.

**Ved senere rettelser i `apps-script.gs`:** udrul som *ny version* af den samme
udrulning. Laver du en helt ny udrulning, får den en ny adresse, og så sender
siderne ud i ingenting — uden at nogen opdager det.

## Hvad der havner i arket

| Kolonne | Eksempel |
| --- | --- |
| Tidspunkt | 22-09-2026 10:14 |
| Nøgle | `Øvelser/Geografi/oliens-migration` |
| Titel | Oliens migration |
| Kilde | `kort på geografi.html` eller `siden selv` |
| Tilstand | `trin=3`, `mode=explore` — tom hvor siden ikke har trin |
| Type | Fejl · Mangler · Idé · Spørgsmål · Ros |
| Besked, Navn | elevens egne ord; navnet er valgfrit |
| Skærm, Browser | til fejl, der kun viser sig på små skærme |
| Status | tom — din egen kolonne til «set», «rettet» |

**Nøglen er mappen, ikke filen.** Feedback fra kortet på `geografi.html` og fra
selve vejledningen får den samme nøgle, selv om den ene pegede på `.pdf` og den
anden på `.html`. Ellers skulle du selv sidde og parre dem bagefter.

## Spærringerne mod spam

Adressen på webappen står i klartekst i `feedback.js` og kan ikke holdes
hemmelig. Derfor tre lag:

* **Honningkrukken.** Feltet `hjemmeside` er skjult ude til venstre for skærmen,
  har `tabindex="-1"` og `aria-hidden`, så hverken øjne eller skærmlæsere møder
  det. Bots udfylder alt, hvad de finder — er feltet udfyldt, skrives rækken ikke.
* **Tidsfælden.** Under tre sekunder fra dialogen åbnes til der trykkes send, og
  beskeden afvises med «vent et øjeblik, og tryk så igen». Et menneske kan prøve
  igen; et script, der fyrer løs, plejer ikke at vente.
* **Timegrænsen.** Over 50 rækker på en time, og Apps Script holder op med at
  skrive, indtil det falder til ro — og sender dig én advarsel, ikke femhundrede.
  Det er den eneste af de tre, der hjælper mod én, der poster direkte til
  adressen uden om formularen.

Afsenderen får altid det samme svar, uanset hvad der skete. En bot skal ikke
kunne læse sig til, hvad der virkede.

## Hvor knapperne kommer frem

* **Kort** — alle `.sim` og `.item` med et link i `<h4>`, altså både
  simuleringer, forsøgsvejledninger og opgaver. Knappen sættes ind i `.sub`-rækken
  ved siden af `PDF` og `Word`, og et nyt kort får sin knap af sig selv.
* **Siden selv** — en pille i sidefoden. Har siden ingen `.foot` (de gamle sider),
  lægger den sig nederst til højre i stedet.
* **Ikke** i en iframe, ikke i projektortilstand (`?projektor=1`, `?mode=teach`),
  og ikke på print.

## Øvelsesvejledningerne

De 25 HTML-vejledninger renderes af Quarto, så linjen kan ikke skrives ind i
dem — den ville forsvinde ved næste render. I stedet står der
`include-after-body: feedback.html` i `Øvelser/_quarto.yml`.

`embed-resources: true` samler normalt alt i én fil. Adressen `/feedback.js` er
rod-relativ og peger ikke på en fil, Quarto kan finde på disken, så den burde
blive stående som et almindeligt `<script src>`. **Det er ikke efterprøvet her** —
Quarto er ikke installeret i det miljø, filerne blev skrevet i. Render én
vejledning, og se efter linjen i den færdige `.html`:

```bash
cd Øvelser/Biologi/osmose-i-kartofler
quarto render osmose-i-kartofler.qmd --to html
grep feedback.js osmose-i-kartofler.html
```

Står linjen der, er resten også i orden. Gør den ikke, skal indholdet af
`feedback.js` i stedet skrives direkte ind i `Øvelser/feedback.html` mellem
`<script>`-mærker — så virker det, men en rettelse i koden kræver, at alle
vejledninger renderes igen.

PDF- og Word-udgaverne får naturligvis ingen knap. Derfor sidder knappen også på
kortet på `biologi.html` og `geografi.html`, hvor man vælger format.
