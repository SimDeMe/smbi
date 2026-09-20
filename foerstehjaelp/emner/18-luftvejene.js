/* Spørgsmål 18 — fagdata. */
export default {
  id:"luftvejene", nr:18, gruppe:"Krop", emne:"Luftvejene og åndedrættet",
  spoergsmaal:"Beskriv luftvejenes opbygning og forklar, hvordan åndedrættet virker.",
  kort:[
    {
      titel:"Opbygning",
      spm:"Beskriv luftvejenes opbygning.",
      svar:[
        {h:"Øvre luftveje", tone:"coral", punkter:[
          "<b>Næse og næsehule:</b> luften varmes, fugtes og renses. Næsehår og slimhinde fanger partikler",
          "<b>Svælget (pharynx):</b> fælles vej for luft og mad",
          "<b>Strubelåget (epiglottis)</b> lukker luftrøret, når man synker",
          "<b>Strubehovedet (larynx)</b> med stemmelæberne"
        ]},
        {h:"Nedre luftveje", tone:"lilla", punkter:[
          "<b>Luftrøret (trachea)</b> — holdes åbent af bruskringe",
          "Deler sig i to <b>hovedbronkier</b>. Den højre er mere lodret — derfor havner fremmedlegemer oftest dér",
          "<b>Bronkier → bronkioler</b> — bliver stadig mindre og har glat muskulatur i væggen",
          "<b>Alveolerne (lungeblærerne):</b> ca. 300 millioner, samlet overflade omkring 70–100 m²"
        ]},
        {h:"Lungerne", tone:"groen", punkter:[
          "Højre lunge har <b>3 lapper</b>, venstre har <b>2</b> — der skal være plads til hjertet",
          "<b>Lungehinderne (pleura)</b> med et tyndt væskelag imellem",
          "<b>Undertrykket</b> mellem hinderne holder lungen udspilet mod brystvæggen",
          "Slimhinden har <b>fimrehår</b>, der transporterer slim og snavs opad mod svælget"
        ]},
        {h:"Det betyder for førstehjælperen", tone:"obs", punkter:[
          "Hos en <b>bevidstløs</b> person mister svælgets muskler spændingen, og <b>tungen kan falde tilbage</b> og lukke luftvejen",
          "Derfor: bøj hovedet bagover og løft hagen — <b>frie luftveje først</b>",
          "Hul i brystvæggen eller lungen ophæver undertrykket, og lungen falder sammen"
        ]}
      ]
    },
    {
      titel:"Åndedrættet",
      spm:"Forklar hvordan åndedrættet virker.",
      svar:[
        {h:"Indånding — aktiv", tone:"coral", punkter:[
          "<b>Mellemgulvet (diaphragma)</b> trækker sig sammen og flader ud",
          "De ydre ribbensmuskler løfter ribbenene op og ud",
          "Brysthulen bliver <b>større</b> → trykket falder under atmosfæretrykket",
          "<b>Luften strømmer ind</b> af sig selv — man suger ikke, man skaber undertryk"
        ]},
        {h:"Udånding — passiv i hvile", tone:"lilla", punkter:[
          "Musklerne slapper af",
          "Brystkassen og lungernes <b>elastiske væv</b> trækker sig sammen",
          "Trykket stiger → luften presses ud",
          "Ved anstrengelse bruges <b>hjælpemuskler</b>: mavemuskler og indre ribbensmuskler ved udånding, hals- og skuldermuskler ved indånding"
        ]},
        {h:"Tallene", tone:"groen", punkter:[
          "Frekvens i hvile: voksne <b>12–20</b> i minuttet, børn hurtigere, spædbørn 30–40",
          "Ét åndedrag i hvile er ca. <b>0,5 liter</b> — kun en del når helt ned i alveolerne",
          "<b>Udåndingsluft indeholder stadig ca. 16–17 % ilt</b> — derfor virker indblæsninger ved genoplivning"
        ]}
      ]
    },
    {
      titel:"Gasudveksling",
      spm:"Forklar gasudvekslingen og hvordan vejrtrækningen reguleres.",
      svar:[
        {h:"I alveolerne", tone:"coral", punkter:[
          "<b>Ilt diffunderer</b> fra alveoleluften over i blodet, <b>kuldioxid</b> den modsatte vej",
          "Drivkraften er forskellen i <b>partialtryk</b> — stofferne bevæger sig fra høj mod lav koncentration",
          "Afstanden er kun <b>ét til to cellelag</b> — derfor går det hurtigt",
          "Ilten bindes til <b>hæmoglobin</b> i de røde blodlegemer"
        ]},
        {h:"Ude i vævet", tone:"lilla", punkter:[
          "Det modsatte sker: ilt afgives til cellerne, og CO₂ optages",
          "Cellerne bruger ilten til at frigøre energi fra næringsstofferne",
          "Uden ilt går cellerne over til energidannelse uden ilt → <b>mælkesyre</b> ophobes"
        ]},
        {h:"Regulering", tone:"groen", punkter:[
          "<b>Respirationscentret</b> ligger i den forlængede rygmarv (medulla oblongata) i hjernestammen",
          "Det styres først og fremmest af <b>kuldioxidindholdet</b> i blodet — ikke af iltmanglen",
          "Stiger CO₂, stiger vejrtrækningens dybde og frekvens",
          "<b>Kemoreceptorer</b> i aorta og halspulsårerne måler ilt, CO₂ og pH",
          "Vejrtrækningen sker automatisk, men kan viljestyres et stykke tid"
        ]},
        {h:"Det betyder for førstehjælperen", tone:"obs", punkter:[
          "Skader på <b>hjernestammen</b> rammer selve respirationscentret",
          "<b>Høj nakkeskade</b> rammer mellemgulvets nerveforsyning → vejrtrækningen ophører",
          "Ved hjertestop svigter respirationscentret — det ses som <b>agonale gisp</b>",
          "Indblæsninger virker, fordi udåndingsluft stadig indeholder rigeligt ilt"
        ]}
      ]
    }
  ]
};
