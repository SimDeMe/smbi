/* Spørgsmål 8 — fagdata. */
export default {
  id:"underafkoeling", nr:8, gruppe:"Skade", emne:"Underafkøling",
  spoergsmaal:"Giv eksempler på påvirkninger af kroppen, der kan medføre underafkøling. Nævn symptomer på underafkøling og forklar hvilke farer, der kan opstå. Forklar førstehjælpen til en person, der er underafkølet.",
  kort:[
    {
      titel:"Påvirkninger",
      spm:"Giv eksempler på påvirkninger af kroppen, der kan medføre underafkøling.",
      svar:[
        {h:"Hvad underafkøling er", tone:"coral", punkter:[
          "<b>Hypotermi:</b> kernetemperaturen falder under <b>35 °C</b>",
          "Kroppen taber mere varme, end den kan danne",
          "Normal kernetemperatur er ca. 37 °C"
        ]},
        {h:"Fire veje ud af kroppen", tone:"lilla", punkter:[
          "<b>Ledning:</b> kontakt med koldt underlag, vand eller metal",
          "<b>Strømning:</b> vind og træk — vindkøling øger varmetabet kraftigt",
          "<b>Stråling:</b> varme afgives til omgivelserne, især fra hovedet",
          "<b>Fordampning:</b> fra våd hud, sved og vejrtrækning",
          "<b>Vand leder varme ca. 25 gange hurtigere end luft</b> — derfor køler man hurtigt ned i vandet"
        ]},
        {h:"Typiske situationer", tone:"groen", punkter:[
          "Fald i vandet eller gennem isen",
          "Våd og blæsende tur i det fri — vådt tøj mister sin isolerende evne",
          "Ulykke, hvor personen ligger stille på jorden og venter længe på hjælp",
          "Bevidstløs person udendørs eller i et koldt rum",
          "Lang skylning af en forbrænding"
        ]},
        {h:"Særligt udsatte", tone:"blaa", punkter:[
          "<b>Børn</b> — stor overflade i forhold til vægt",
          "<b>Ældre, tynde og syge</b> — mindre varmedannelse og isolering",
          "Tilskadekomne med <b>store blødninger eller forbrændinger</b>",
          "<b>Alkohol og medicin:</b> udvider hudens kar, hæmmer skælven og dømmekraften",
          "Udmattelse, sult og manglende bevægelse"
        ]}
      ]
    },
    {
      titel:"Symptomer og farer",
      spm:"Nævn symptomer på underafkøling og forklar hvilke farer, der kan opstå.",
      svar:[
        {h:"Let underafkøling (35–32 °C)", tone:"coral", punkter:[
          "<b>Kraftig skælven</b> — kroppen producerer varme",
          "Kold, bleg hud og gåsehud",
          "Hurtig puls og vejrtrækning",
          "Klodsede bevægelser og dårlig finmotorik"
        ]},
        {h:"Moderat underafkøling (32–28 °C)", tone:"lilla", punkter:[
          "<b>Skælven aftager og ophører</b> — et dårligt tegn, ikke et godt",
          "Sløret tale, forvirring, sløvhed og ligegyldighed",
          "Langsom puls og vejrtrækning",
          "Nedsat bevidsthed — nogle klæder sig paradoksalt af"
        ]},
        {h:"Svær underafkøling (under 28 °C)", tone:"groen", punkter:[
          "<b>Bevidstløshed</b>",
          "Meget svag, langsom og uregelmæssig puls — næsten umulig at føle",
          "Stive muskler og udvidede pupiller — <b>kan ligne død</b>",
          "Høj risiko for ventrikelflimren og hjertestop"
        ]},
        {h:"Farer", tone:"obs", punkter:[
          "<b>Nedsat blodstørkning</b> — blødninger bliver værre og sværere at standse",
          "Hjertet er meget følsomt: <b>hårdhændet håndtering kan udløse hjerteflimren</b>",
          "<b>Efterfald (afterdrop):</b> koldt blod fra arme og ben strømmer ind mod kernen ved forkert opvarmning",
          "Nedsat dømmekraft — personen forstår ikke selv, hvor kritisk det er",
          "<b>«Ingen er død, før de er varme og døde»</b> — genoplivning fortsættes længe ved underafkøling"
        ]}
      ]
    },
    {
      titel:"Førstehjælp",
      spm:"Forklar førstehjælpen til en person, der er underafkølet.",
      svar:[
        {h:"Førstehjælpens 4 hovedpunkter", tone:"coral", punkter:[
          "<b>1. Skab sikkerhed:</b> tænk på din egen nedkøling, og få personen i læ",
          "<b>2. Vurder personen:</b> bevidsthed og vejrtrækning — føl og lyt i op til <b>1 minut</b>, den kan være meget langsom",
          "<b>3. Tilkald hjælp:</b> ring 1-1-2 ved bevidsthedspåvirkning, ophørt skælven eller langsom puls",
          "<b>4. Giv førstehjælp:</b> stands varmetabet og varm langsomt op"
        ]},
        {h:"Sådan gøres det", tone:"lilla", punkter:[
          "Håndtér personen <b>meget forsigtigt og vandret</b> — undgå ryk og hårde bevægelser",
          "Personen må <b>ikke gå eller anstrenge sig</b> selv",
          "Fjern vådt tøj — <b>klip det af</b> frem for at hive i det",
          "<b>Isolér mod underlaget</b> — det er dér, varmen forsvinder",
          "Pak ind i tæpper, sovepose og redningsfolie; dæk hovedet, lad ansigtet være frit",
          "<b>Varm indefra:</b> en varm, sød drik hvis personen er fuldt vågen og kan synke",
          "Varmeflasker eller varmepakninger på krop, hals og lysken — <b>aldrig direkte på huden</b>"
        ]},
        {h:"Det man ikke må", tone:"obs", punkter:[
          "<b>Gnid og masser ikke</b> arme og ben",
          "Varm <b>ikke</b> arme og ben aktivt op først — risiko for efterfald",
          "<b>Giv aldrig alkohol</b> — det udvider hudens kar og øger varmetabet",
          "Læg ikke en svært underafkølet i et varmt bad",
          "Forfrysninger optøs ikke i felten, hvis de kan nå at fryse igen"
        ]},
        {h:"Bevidstløs", tone:"groen", punkter:[
          "<b>Normal vejrtrækning:</b> frie luftveje, stabilt sideleje, isolér og pak ind",
          "<b>Ingen normal vejrtrækning:</b> HLR 30:2 og hjertestarter",
          "Fortsæt genoplivningen, til ambulancen overtager — kulden beskytter hjernen"
        ]}
      ]
    }
  ]
};
