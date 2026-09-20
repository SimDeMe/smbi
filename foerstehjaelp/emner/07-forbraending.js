/* Spørgsmål 7 — fagdata. */
export default {
  id:"forbraending", nr:7, gruppe:"Skade", emne:"Forbrænding og skoldning",
  spoergsmaal:"Giv eksempler på påvirkninger af huden, der kan medføre forbrændinger. Nævn symptomer på forbrænding og forklar hvilke farer, der kan opstå. Forklar førstehjælpen til en person, der har fået en forbrænding eller skoldning.",
  kort:[
    {
      titel:"Påvirkninger",
      spm:"Giv eksempler på påvirkninger af huden, der kan medføre forbrændinger.",
      svar:[
        {h:"Huden kort fortalt", tone:"coral", punkter:[
          "<b>Overhud (epidermis):</b> hornlag og vækstlag — barrieren udadtil, indeholder pigmentet melanin",
          "<b>Læderhud (dermis):</b> kar, nerver, kirtler og hårsække — her sidder smertesansen",
          "<b>Underhud (subcutis):</b> fedtvæv — isolering, stødpude og depot",
          "Hudens opgaver: barriere mod mikroorganismer, kemi og stråling, væskedepot, temperaturregulering og sansning"
        ]},
        {h:"Påvirkninger, der kan forbrænde", tone:"lilla", punkter:[
          "<b>Varme:</b> åben ild, gløder, varme genstande, gnister",
          "<b>Skoldning:</b> kogende vand, damp, varm mad og olie — den hyppigste hos børn",
          "<b>Kemikalier:</b> syre og base, cement, rengøringsmidler",
          "<b>Elektricitet:</b> strømgennemgang og lysbue — skaden er ofte langt større indvendigt end udvendigt",
          "<b>Stråling:</b> sol (UV), svejselys, radioaktiv stråling",
          "<b>Friktion:</b> gnavesår ved høj hastighed",
          "Ekstrem <b>kulde</b> giver samme type vævsskade (forfrysning)"
        ]},
        {h:"Skadens omfang afhænger af", tone:"groen", punkter:[
          "<b>Temperaturen</b> og hvor <b>længe</b> huden er påvirket",
          "<b>Hvor dybt</b> skaden går (graden)",
          "<b>Hvor stort</b> et område den dækker",
          "Hvor på kroppen den sidder — og personens alder og helbred"
        ]}
      ]
    },
    {
      titel:"Symptomer og farer",
      spm:"Nævn symptomer på forbrænding og forklar hvilke farer, der kan opstå.",
      svar:[
        {h:"Graderne", tone:"coral", punkter:[
          "<b>1. grad:</b> kun overhuden — rød, tør, øm, hel hud, ingen blærer. Heler på få dage",
          "<b>2. grad:</b> ned i læderhuden — <b>blærer</b>, væskende, rød eller hvidlig, meget smertefuld",
          "<b>3. grad:</b> alle hudlag — hvid, brun, læderagtig eller forkullet, tør. <b>Få eller ingen smerter</b>, fordi nerverne er ødelagt",
          "<b>4. grad:</b> dybere end huden — fedt, muskler, sener og knogler. Livstruende"
        ]},
        {h:"Udbredelsen", tone:"lilla", punkter:[
          "Personens <b>håndflade med fingre ≈ 1 %</b> af kropsoverfladen",
          "<b>9 %-reglen</b> bruges til at vurdere større forbrændinger",
          "2. og 3. grad over ca. <b>3 % hos voksne</b> og <b>1 % hos børn</b> kræver sygehus"
        ]},
        {h:"Farer", tone:"obs", punkter:[
          "<b>Væsketab</b> gennem den ødelagte hud → kredsløbssvigt og shock",
          "<b>Underafkøling</b> — både af skaden og af den lange skylning",
          "<b>Infektion</b> — hudens barriere er væk",
          "<b>Luftvejsskade</b> ved brand i lukket rum: sod om næse og mund, hæshed, hoste, svedne næsehår → hævelse, der kan lukke luftvejen",
          "<b>Røgforgiftning</b> med kulilte og cyanid",
          "Forbrænding i <b>ansigt, hals, hænder, fødder, led og skridt</b> er særligt kritisk",
          "<b>Cirkulære</b> forbrændinger kan snøre af som en ring",
          "<b>Strømskade:</b> hjerterytmeforstyrrelser og dybe indre skader"
        ]}
      ]
    },
    {
      titel:"Førstehjælp",
      spm:"Forklar førstehjælpen til en person, der har fået en forbrænding eller skoldning.",
      svar:[
        {h:"1. Skab sikkerhed — stands ulykken", tone:"coral", punkter:[
          "<b>Tænk på dig selv først</b> — gå ikke ind i ild, røg eller strøm",
          "Sluk ilden: vand, tæppe, eller rul personen på jorden",
          "<b>Afbryd strømmen</b>, før du rører personen",
          "Fjern varmekilden og varmt, gennemvædet tøj — men ikke tøj, der sidder fast i såret",
          "Fjern ringe, ure, bælter og smykker, <b>før der hæver</b>"
        ]},
        {h:"2. Køl — det vigtigste", tone:"lilla", punkter:[
          "Skyl med <b>tempereret vand (ca. 20 °C, lunkent)</b> i mindst <b>20 minutter</b> — gerne til smerterne er dæmpet",
          "<b>Ikke isvand</b> og ikke is — det giver yderligere vævsskade",
          "Køl <b>kun den forbrændte del</b> og hold resten af kroppen varm",
          "<b>Kemisk forbrænding:</b> skyl længe med rigeligt vand, fjern forurenet tøj, og undgå selv kontakt",
          "Fortsæt gerne kølingen på vej til skadestuen"
        ]},
        {h:"3. Dæk til og hold varm", tone:"groen", punkter:[
          "Dæk med et <b>rent, fnugfrit klæde eller husholdningsfilm</b> — løst, ikke stramt rundt om en lem",
          "Brug <b>ikke</b> creme, salve, fedt, tandpasta eller puder af vat",
          "<b>Prik ikke blærer hul</b>",
          "Læg et tæppe over resten af kroppen — hold øje med <b>underafkøling</b>",
          "Psykisk førstehjælp: ro, omsorg og information",
          "Vand i små slurke, hvis personen er vågen — ved store forbrændinger efter aftale med 1-1-2"
        ]},
        {h:"4. Tilkald hjælp — ring 1-1-2 ved", tone:"obs", punkter:[
          "2. grad over ca. 3 % hos voksne, 1 % hos børn — og <b>alle</b> 3.- og 4.-gradsforbrændinger",
          "Forbrænding i <b>ansigt, hals eller luftveje</b>, på hænder, fødder, led eller i skridtet",
          "<b>Strømskader og kemiske skader</b>",
          "Røgindånding — sod om munden, hæshed, hoste",
          "Børn, ældre og svækkede personer",
          "<b>Bevidstløs:</b> frie luftveje og stabilt sideleje — eller HLR 30:2 og hjertestarter"
        ]}
      ]
    }
  ]
};
