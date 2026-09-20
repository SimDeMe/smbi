/* Spørgsmål 1 — fagdata. Rettes frit; <b> er tilladt i punkterne. */
export default {
  id:"blodprop-i-hjertet", nr:1, gruppe:"Sygdom", emne:"Blodprop i hjertet",
  spoergsmaal:"Forklar hvad en blodprop i hjertet er. Nævn symptomer på en blodprop i hjertet og forklar, hvad der sker ved en blodprop i hjertet. Forklar førstehjælpen til en person, der vurderes at have en blodprop i hjertet.",
  kort:[
    {
      titel:"Hvad er det",
      spm:"Forklar hvad en blodprop i hjertet er, og hvad der sker i kroppen.",
      svar:[
        {h:"Hvad det er", tone:"coral", punkter:[
          "Fagord: <b>akut myokardieinfarkt</b> (AMI)",
          "En af hjertets <b>kranspulsårer</b> (koronararterier) lukkes",
          "Kranspulsårerne er hjertemusklens egen forsyning med ilt og næring",
          "Udgår fra aorta lige over aortaklappen"
        ]},
        {h:"Sådan opstår den", tone:"lilla", punkter:[
          "<b>Åreforkalkning</b> (aterosklerose): LDL-kolesterol, fedt og kalk aflejres som plak i karvæggen → forsnævring",
          "Plakken <b>brister</b> → blottet væv kommer i kontakt med blodet",
          "Koagulationssystemet aktiveres: trombocytter binder sig, fibrin dannes → <b>trombe</b> lukker karret helt",
          "Kan også skyldes en <b>emboli</b> (prop dannet et andet sted) eller en <b>koronar spasme</b> (karret kramper sammen)",
          "Betændelse i karvæggen og øget størkningstendens øger risikoen"
        ]},
        {h:"Hvad der sker i kroppen", tone:"groen", punkter:[
          "Blodet kan ikke komme forbi → hjertemusklen bag proppen får <b>ingen ilt</b> (iskæmi)",
          "Iltmangel i muskelcellerne giver den <b>trykkende brystsmerte</b>",
          "Efter minutter til timer <b>dør</b> cellerne — det døde væv bliver til arvæv, der ikke kan trække sig sammen",
          "Hjertet pumper dårligere → blodtryksfald, væske i lungerne, åndenød, kredsløbssvigt",
          "Det skadede væv kan give <b>rytmeforstyrrelser</b> → ventrikelflimren → <b>hjertestop</b>",
          "Jo hurtigere karret åbnes igen, jo mindre muskel går tabt — <b>tid er hjertemuskel</b>"
        ]},
        {h:"Risikofaktorer", tone:"blaa", punkter:[
          "Rygning, højt blodtryk, højt kolesterol, diabetes",
          "Overvægt, for lidt motion, stress, arv, alder"
        ]}
      ]
    },
    {
      titel:"Symptomer",
      spm:"Nævn symptomer på en blodprop i hjertet.",
      svar:[
        {h:"Det klassiske hovedsymptom", tone:"coral", punkter:[
          "<b>Trykkende, knugende smerte bag brystbenet</b> — som en snærende ring om brystet",
          "Varer typisk <b>mere end 15 minutter</b> og forsvinder <b>ikke</b> ved hvile",
          "Smerten kan <b>stråle ud</b>: venstre arm (eller begge), hals, kæbe, skuldre, ryg, mavepulen",
          "Skyldes at smertesensoriske nerver fra hjertet løber sammen med nerver fra andre dele af kroppen"
        ]},
        {h:"Andre symptomer", tone:"lilla", punkter:[
          "<b>Åndenød</b> — nedsat pumpeevne giver væske i lungerne",
          "<b>Bleg, koldsvedende og klam</b> hud — stresshormoner og sammentrukne hudkar",
          "Kvalme og opkastning — påvirkning af centrene i hjernestammen",
          "Angst, uro, følelse af at noget er alvorligt galt",
          "Svimmelhed og træthed — for lidt ilt til hjernen",
          "Hurtig, langsom eller uregelmæssig puls"
        ]},
        {h:"Pas på de utypiske symptomer", tone:"obs", punkter:[
          "<b>Kvinder, ældre og diabetikere</b> har ofte ikke den klassiske brystsmerte",
          "I stedet: uforklarlig træthed, åndenød, kvalme, ubehag i maven, smerter i ryg eller kæbe",
          "Symptomerne kan komme <b>snigende</b> over timer — ikke altid pludseligt"
        ]},
        {h:"Hvis det forværres", tone:"groen", punkter:[
          "Personen kan blive <b>bevidstløs</b>",
          "Vejrtrækningen bliver unormal eller stopper → <b>hjertestop</b>",
          "Ved mistanke: <b>ring 1-1-2 — også i tvivlstilfælde</b>"
        ]}
      ]
    },
    {
      titel:"Førstehjælp",
      spm:"Forklar førstehjælpen til en person, der vurderes at have en blodprop i hjertet.",
      svar:[
        {h:"Førstehjælpens 4 hovedpunkter", tone:"coral", punkter:[
          "<b>1. Skab sikkerhed:</b> stands ulykken — få personen til at stoppe al aktivitet og anstrengelse straks",
          "<b>2. Vurder personen:</b> er personen vågen? frie luftveje? normal vejrtrækning?",
          "<b>3. Tilkald hjælp:</b> ring <b>1-1-2</b> og sig «mistanke om blodprop i hjertet» + adresse",
          "<b>4. Giv førstehjælp:</b> hvilestilling, ro og omsorg, overvågning"
        ]},
        {h:"Mens I venter på ambulancen", tone:"lilla", punkter:[
          "<b>Hvilestilling:</b> halvsiddende med støtte i ryggen og bøjede knæ — aflaster hjertet og letter vejrtrækningen",
          "Personen må <b>ikke</b> gå selv, bære noget eller selv køre til lægen",
          "Løsn stramt tøj, skaf frisk luft, hold personen varm",
          "<b>Psykisk førstehjælp:</b> tal roligt, bliv hos personen, lad ikke personen være alene",
          "Hjælp med personens <b>egen lægeordinerede medicin</b> (fx nitroglycerin under tungen)",
          "Giv kun anden medicin — fx acetylsalicylsyre — <b>efter aftale med alarmcentralen</b>",
          "Giv <b>ikke</b> mad eller drikke",
          "<b>Overvåg hele tiden</b> bevidsthed og vejrtrækning — tilstanden kan skifte på sekunder",
          "Send en anden ud for at <b>møde ambulancen</b> og hold døren åben"
        ]},
        {h:"Hvis tilstanden forværres", tone:"obs", punkter:[
          "<b>Bevidstløs, men trækker vejret normalt:</b> skab frie luftveje, læg i <b>stabilt sideleje</b>, bliv ved med at tjekke vejrtrækningen",
          "<b>Bevidstløs uden normal vejrtrækning = hjertestop:</b> start <b>hjerte-lunge-redning</b> straks",
          "<b>30 tryk : 2 indblæsninger</b>, midt på brystet, 5–6 cm dybt, 100–120 tryk i minuttet",
          "Få en <b>hjertestarter (AED)</b> hentet og tændt — følg dens besked",
          "Fortsæt til ambulancen overtager, eller personen viser tydelige livstegn"
        ]}
      ]
    }
  ]
};
