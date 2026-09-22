# Feedback-knappen

En knap på hvert kort og på hver side. Eleven skriver en besked, og den lander
i et Google-ark med besked om, hvilken simulering eller vejledning det drejer
sig om — uden at eleven skal vælge noget i en liste, og uden login.

## Delene

| Fil | Hvad den gør |
| --- | --- |
| `feedback.js` (i roden) | knapperne, dialogen og afsendelsen. Én fil, ingen afhængigheder |
| `feedback/apps-script.gs` | modtageren. Hører til i Apps Script, ikke på sitet |

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
  ikke på print — og ikke inde i øvelsesvejledningerne, se nedenfor.

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
