/* Spørgsmål 15 — fagdata. */
export default {
  id:"hjertestarter", nr:15, gruppe:"Metode", emne:"Hjertestarteren",
  spoergsmaal:"Forklar hvad en hjertestarter er og hvordan den anvendes, herunder hvad der bør opbevares sammen med hjertestarteren. Forklar hvordan hjertestarteren virker på hjertet og giv eksempler på opmærksomhedspunkter inden afgivelse af stød fra hjertestarteren.",
  kort:[
    {
      titel:"Hvad er den",
      spm:"Forklar hvad en hjertestarter er, og hvad der bør opbevares sammen med den.",
      svar:[
        {h:"Hvad en hjertestarter er", tone:"coral", punkter:[
          "<b>AED</b> — automatisk ekstern defibrillator",
          "Analyserer selv hjerterytmen gennem elektroderne og afgør, om rytmen er <b>stødbar</b>",
          "<b>Giver kun stød, hvis rytmen er stødbar</b> — man kan ikke komme til at støde en rask person",
          "Taler brugeren igennem hele forløbet med tale og billeder",
          "<b>Kræver ingen uddannelse</b> og må bruges af alle",
          "<b>Erstatter ikke</b> brystkompressioner — den supplerer dem",
          "Danske hjertestartere er registreret på hjertestarter.dk, og 1-1-2 kan anvise den nærmeste"
        ]},
        {h:"Det der bør ligge sammen med den", tone:"lilla", punkter:[
          "<b>Reserveelektroder</b> til voksne — og <b>børneelektroder eller børnenøgle</b>",
          "En <b>barberskraber</b> — elektroderne skal sidde på bar, tør hud",
          "En <b>saks</b> til at klippe tøjet op med",
          "Et <b>klæde eller papir</b> til at tørre brystkassen af",
          "<b>Engangshandsker</b> og en maske/pocket-mask til indblæsninger",
          "<b>Batteri</b> med holdbarhedsdato — og et skema over eftersyn"
        ]},
        {h:"Vedligehold", tone:"groen", punkter:[
          "Elektroder og batteri har udløbsdato og skal skiftes",
          "Apparatet laver selvtest — se på statuslampen ved eftersyn",
          "Skiltning og placering skal være kendt af alle på stedet"
        ]}
      ]
    },
    {
      titel:"Sådan bruges den",
      spm:"Forklar hvordan hjertestarteren anvendes.",
      svar:[
        {h:"Inden den kommer", tone:"coral", punkter:[
          "<b>Send en anden efter hjertestarteren</b>, mens du selv giver HLR",
          "Stands ikke kompressionerne for selv at hente den",
          "Er du alene og hjertestarteren er lige ved hånden, hentes den — ellers HLR først"
        ]},
        {h:"Trin for trin", tone:"lilla", punkter:[
          "<b>Tænd apparatet</b>, så snart det er fremme, og gør nøjagtig som det siger",
          "<b>Blot brystkassen:</b> klip tøjet op, tør huden tør, barbér kraftig behåring, fjern plastre",
          "<b>Sæt elektroderne på bar hud</b> efter billedet: én under højre kraveben, én i venstre side under armhulen",
          "<b>Kompressionerne fortsætter</b>, mens elektroderne sættes på",
          "<b>Ved analyse:</b> rør ikke personen — råb «væk fra personen»",
          "<b>Ved stød:</b> se efter at ingen rører personen, og tryk på knappen (nogle apparater støder selv)",
          "<b>Start straks HLR igen</b> efter stødet — apparatet siger til efter 2 minutter",
          "Siger apparatet «intet stød anbefales»: fortsæt HLR 30:2",
          "Elektroderne bliver siddende, og apparatet bliver tændt, til ambulancen overtager"
        ]},
        {h:"Børn", tone:"groen", punkter:[
          "Hjertestarteren bruges <b>også til børn</b>",
          "<b>1–8 år:</b> børneelektroder eller børnenøgle, hvis de findes",
          "Findes de ikke, bruges voksenelektroder — placér da den ene på brystet og den anden på <b>ryggen</b>",
          "Elektroderne må aldrig røre hinanden"
        ]}
      ]
    },
    {
      titel:"Virkning og OBS",
      spm:"Forklar hvordan hjertestarteren virker på hjertet, og giv eksempler på opmærksomhedspunkter inden afgivelse af stød.",
      svar:[
        {h:"Hjertets egen elektricitet", tone:"coral", punkter:[
          "Hjertet styres af impulser fra <b>sinusknuden</b> — 60–100 impulser i minuttet. Normal rytme kaldes <b>sinusrytme</b>",
          "Impulsen går videre til AV-knuden, His' bundt og Purkinje-fibrene, så forkamre og hjertekamre trækker sig sammen i rigtig rækkefølge",
          "Rytmen kan aflæses på et <b>EKG</b> med takkerne P, Q, R, S og T"
        ]},
        {h:"Sådan virker stødet", tone:"lilla", punkter:[
          "Ved <b>ventrikelflimren (VF)</b> og <b>pulsløs ventrikulær takykardi (VT)</b> fyrer hjertemusklen kaotisk, cellerne arbejder i utakt, og hjertet pumper ikke",
          "Stødet sender strøm gennem <b>hele hjertemusklen på én gang</b> og depolariserer alle celler samtidig",
          "Hjertet «nulstilles», og sinusknuden kan få lov at overtage takten igen",
          "<b>Kun VF og pulsløs VT kan stødes</b>",
          "<b>Asystoli</b> (ingen elektrisk aktivitet) og <b>PEA</b> (elektrisk aktivitet uden pumpefunktion) kan ikke stødes — dér hjælper kun HLR",
          "Ubehandlet ventrikelflimren bliver til asystoli på få minutter — <b>derfor haster stødet</b>"
        ]},
        {h:"Opmærksomhedspunkter inden stød", tone:"obs", punkter:[
          "<b>Ingen må røre personen</b> — heller ikke den, der giver indblæsninger",
          "Ingen kontakt med <b>metal eller vand</b> — tør brystkassen, og flyt personen væk fra vandpyt eller metalrist",
          "<b>Elektroderne må ikke røre hinanden</b> eller sidde oven på hinanden",
          "Fjern <b>smykker, piercinger og medicinplastre</b> fra elektrodeområdet",
          "<b>Pacemaker eller ICD</b> (bule under huden ved kravebenet): sæt elektroden mindst 8 cm væk",
          "<b>Ilt</b> flyttes væk fra brystkassen — brandfare",
          "<b>Kraftig behåring barberes</b> — ellers dårlig kontakt og risiko for gnister",
          "Kørende køretøj: <b>stands</b>, før der analyseres og stødes — bevægelse forstyrrer analysen"
        ]}
      ]
    }
  ]
};
