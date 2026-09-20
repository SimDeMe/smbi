/* Spørgsmål 17 — fagdata. */
export default {
  id:"hjertet-og-kredsloebet", nr:17, gruppe:"Krop", emne:"Hjertet og kredsløbet",
  spoergsmaal:"Beskriv hjertets opbygning og forklar, hvordan kredsløbet virker, herunder blodets væsentlige funktioner.",
  kort:[
    {
      titel:"Hjertets opbygning",
      spm:"Beskriv hjertets opbygning.",
      svar:[
        {h:"Placering og størrelse", tone:"coral", punkter:[
          "En hul muskel på størrelse med en knyttet hånd, ca. 300 g",
          "Ligger bag brystbenet, lidt til venstre for midten, mellem lungerne",
          "Derfor trykkes der <b>midt på brystbenets nederste halvdel</b> ved HLR"
        ]},
        {h:"De fire rum", tone:"lilla", punkter:[
          "<b>Højre forkammer (atrium):</b> modtager iltfattigt blod fra kroppen via de to hulvener",
          "<b>Højre hjertekammer (ventrikel):</b> pumper blodet til lungerne",
          "<b>Venstre forkammer:</b> modtager iltet blod fra lungerne",
          "<b>Venstre hjertekammer:</b> pumper det iltede blod ud i aorta — har den tykkeste væg, fordi det skal nå hele kroppen",
          "En skillevæg adskiller højre og venstre side — blodet blandes ikke"
        ]},
        {h:"Klapper og lag", tone:"groen", punkter:[
          "<b>Hjerteklapperne</b> mellem for- og hjertekamre (tricuspidal- og mitralklap) sikrer envejsstrøm",
          "<b>Lommeklapperne</b> ud mod lungepulsåren og aorta hindrer tilbageløb",
          "<b>Endokardiet</b> indvendigt, <b>myokardiet</b> (selve hjertemusklen) og <b>epikardiet</b> udvendigt",
          "Udenom ligger <b>hjertesækken (perikardiet)</b>"
        ]},
        {h:"Forsyning og ledningssystem", tone:"blaa", punkter:[
          "Hjertet forsynes af <b>kranspulsårerne</b>, der udgår fra aorta lige over klappen",
          "<b>Sinusknuden</b> er taktgiver: 60–100 impulser i minuttet",
          "Impulsen går videre: <b>AV-knuden → His' bundt → Purkinje-fibrene</b>",
          "<b>Systole</b> = sammentrækning, <b>diastole</b> = fyldning",
          "Hvilepuls ca. 60–80, minutvolumen ca. 5 liter i hvile"
        ]}
      ]
    },
    {
      titel:"Kredsløbet",
      spm:"Forklar hvordan kredsløbet virker.",
      svar:[
        {h:"To kredsløb i serie", tone:"coral", punkter:[
          "<b>Det lille kredsløb (lungekredsløbet):</b> højre hjertekammer → lungepulsåren → lungernes kapillærer → ilt optages og CO₂ afgives → lungevenerne → venstre forkammer",
          "<b>Det store kredsløb (legemskredsløbet):</b> venstre hjertekammer → aorta → arterier → arterioler → kapillærer i vævet → venoler → vener → hulvenerne → højre forkammer",
          "Samme pumpe driver dem begge"
        ]},
        {h:"Karrene", tone:"lilla", punkter:[
          "<b>Arterier fører blod fra hjertet</b>, <b>vener fører blod til hjertet</b> — ikke iltet mod uiltet",
          "Arterierne har tykke, elastiske vægge og tåler trykket fra hjertet",
          "<b>Kapillærerne er ét cellelag tykke</b> — her sker <b>al</b> udveksling af ilt, næring, CO₂ og affaldsstoffer",
          "Venerne har <b>klapper</b>, og muskelpumpen i benene hjælper blodet opad",
          "Portåresystemet leder blod fra tarmen gennem leveren, før det når hjertet"
        ]},
        {h:"Blodtryk og regulering", tone:"groen", punkter:[
          "Systolisk ca. <b>120</b>, diastolisk ca. <b>80 <span class=\"enhed\">mmHg</span></b>",
          "Bestemmes af hjertets pumpeevne, blodmængden og karrenes modstand",
          "Det <b>autonome nervesystem</b> regulerer puls og karmodstand fra hjernestammen",
          "Ved blodtab trækkes karrene i hud og tarm sammen, og pulsen stiger — derfor bleghed og hurtig puls"
        ]},
        {h:"Det betyder for førstehjælperen", tone:"blaa", punkter:[
          "Kredsløbet vurderes på <b>hudfarve, temperatur, puls og kapillærrespons</b>",
          "Bleg, kold, klam hud og hurtig puls = kredsløbet er under pres"
        ]}
      ]
    },
    {
      titel:"Blodets funktioner",
      spm:"Beskriv blodets væsentlige funktioner.",
      svar:[
        {h:"Hvad blodet består af", tone:"coral", punkter:[
          "Ca. <b>5–6 liter</b> hos en voksen — omkring 7–8 % af kropsvægten",
          "<b>Plasma</b> (ca. 55 %): vand, proteiner, salte, næringsstoffer, hormoner og affaldsstoffer",
          "<b>Røde blodlegemer (erytrocytter)</b> med hæmoglobin",
          "<b>Hvide blodlegemer (leukocytter)</b>",
          "<b>Blodplader (trombocytter)</b>"
        ]},
        {h:"Funktionerne", tone:"lilla", punkter:[
          "<b>Ilttransport:</b> hæmoglobin binder ilt i lungerne og afgiver den i vævet",
          "<b>Kuldioxid</b> transporteres tilbage til lungerne, mest som bikarbonat i plasma",
          "<b>Næringsstoffer</b> fra tarmen ud til cellerne, <b>affaldsstoffer</b> til nyrer og lever",
          "<b>Hormoner</b> og signalstoffer fra kirtlerne til målorganerne",
          "<b>Forsvar</b> mod infektion — de hvide blodlegemer",
          "<b>Størkning:</b> trombocytter og fibrin danner prop og net og lukker skader i karrene",
          "<b>Temperaturregulering:</b> varme flyttes fra kernen ud til huden",
          "Opretholder <b>væske- og saltbalance</b> samt syre-base-balancen (pH ca. 7,4)"
        ]},
        {h:"Derfor er blodtab livstruende", tone:"obs", punkter:[
          "Ilttransport, varme og størkningsevne forsvinder <b>på én gang</b>",
          "Tab af ca. en tredjedel af blodmængden er livstruende",
          "Kulde forværrer størkningen — derfor holdes den tilskadekomne varm"
        ]}
      ]
    }
  ]
};
