/* Spørgsmål 3 — fagdata. */
export default {
  id:"diabetes", nr:3, gruppe:"Sygdom", emne:"Diabetes og lavt blodsukker",
  spoergsmaal:"Forklar hvad diabetes er. Nævn symptomer på lavt blodsukker og forklar, hvad der sker ved lavt blodsukker. Forklar førstehjælpen til en person, der vurderes at have for lavt blodsukker.",
  kort:[
    {
      titel:"Hvad er det",
      spm:"Forklar hvad diabetes er.",
      svar:[
        {h:"Hvad det er", tone:"coral", punkter:[
          "Sygdom, hvor kroppen ikke kan regulere <b>blodsukkeret</b> normalt",
          "<b>Insulin</b> er et hormon fra betacellerne i bugspytkirtlen (de langerhanske øer)",
          "Insulin binder sig til receptorer på cellerne og lukker glukosen ind, så den kan bruges til energi — eller lagres som glykogen i leveren"
        ]},
        {h:"Typerne", tone:"lilla", punkter:[
          "<b>Type 1</b> (ca. 5–10 %): autoimmun — immunforsvaret ødelægger betacellerne → for lidt eller ingen insulin. Behandles altid med insulin",
          "<b>Type 2</b> (ca. 90–95 %): <b>insulinresistens</b> — insulinet frigives, men receptorerne virker dårligere. Arv og livsstil. Med tiden kan produktionen også svigte",
          "Andre: graviditetsdiabetes samt de sjældne LADA og MODY"
        ]},
        {h:"Tallene", tone:"groen", punkter:[
          "Normalt fastende blodsukker: ca. <b>4–7 <span class=\"enhed\">mmol/L</span></b>",
          "Efter et måltid op til ca. 10 <span class=\"enhed\">mmol/L</span>",
          "<b>Lavt blodsukker (hypoglykæmi)</b>: under ca. 3,5–4 <span class=\"enhed\">mmol/L</span> — det akut farlige",
          "<b>Højt blodsukker</b> udvikler sig over timer til døgn: tørst, hyppig vandladning, træthed, vægttab, sløret syn"
        ]},
        {h:"Hvorfor blodsukkeret bliver for lavt", tone:"blaa", punkter:[
          "For meget insulin i forhold til maden",
          "Glemt eller for lille måltid",
          "Uvant hårdt fysisk arbejde eller motion",
          "Alkohol — hæmmer leverens produktion af glukose",
          "Sygdom, opkastning, diarré"
        ]}
      ]
    },
    {
      titel:"Lavt blodsukker",
      spm:"Nævn symptomer på lavt blodsukker og forklar, hvad der sker ved lavt blodsukker.",
      svar:[
        {h:"Symptomer — kommer hurtigt, på minutter", tone:"coral", punkter:[
          "<b>Sveden, klam og bleg</b> hud",
          "<b>Rysten</b>, hjertebanken, hurtig puls",
          "<b>Sult</b>",
          "Uro, irritabel eller aggressiv adfærd — <b>kan forveksles med beruselse</b>",
          "Koncentrationsbesvær, forvirring, sløret tale",
          "Svimmelhed, hovedpine, synsforstyrrelser",
          "Kraftesløshed og usikre bevægelser",
          "Ved meget lavt blodsukker: <b>kramper og bevidstløshed</b>"
        ]},
        {h:"Hvad der sker i kroppen", tone:"lilla", punkter:[
          "Hjernen kan <b>ikke lagre glukose</b> og er helt afhængig af tilførsel fra blodet",
          "For lidt glukose → hjernecellerne mangler energi → symptomer fra centralnervesystemet",
          "Kroppen forsøger at modvirke det: <b>adrenalin</b> frigives, leveren nedbryder glykogen og danner ny glukose",
          "Det er adrenalinen, der giver rysten, sved, bleghed og hjertebanken",
          "Er der insulin i kroppen, <b>fortsætter det med at virke</b> — blodsukkeret kan blive ved med at falde",
          "Ubehandlet: kramper, bevidstløshed, varig hjerneskade og død"
        ]},
        {h:"Husk", tone:"obs", punkter:[
          "Mange med mangeårig diabetes mister varslingssymptomerne og bliver dårlige uden forvarsel",
          "<b>I tvivl om højt eller lavt? Giv sukker.</b> Lavt blodsukker er det, der slår ihjel på minutter"
        ]}
      ]
    },
    {
      titel:"Førstehjælp",
      spm:"Forklar førstehjælpen til en person, der vurderes at have for lavt blodsukker.",
      svar:[
        {h:"Førstehjælpens 4 hovedpunkter", tone:"coral", punkter:[
          "<b>1. Skab sikkerhed:</b> få personen væk fra trafik, maskiner, trapper — og stop aktiviteten",
          "<b>2. Vurder personen:</b> er personen vågen og i stand til at synke?",
          "<b>3. Tilkald hjælp:</b> ring 1-1-2, hvis personen ikke kan synke, ikke bedres, får kramper eller bliver bevidstløs",
          "<b>4. Giv førstehjælp:</b> sukker, hvile og overvågning"
        ]},
        {h:"Vågen og kan synke", tone:"lilla", punkter:[
          "Giv <b>hurtige kulhydrater</b>, ca. 15–20 g: sød saft eller juice, sodavand (ikke light), druesukker, honning",
          "Vent 10–15 minutter — gentag, hvis der ikke er bedring",
          "Følg op med <b>langsomme kulhydrater</b>: brød, frugt, mælk — ellers falder blodsukkeret igen",
          "Lad personen sidde eller ligge og hvile bagefter",
          "Lad ikke personen være alene, og lad ikke personen køre bil",
          "Personen skal kontakte sin læge, hvis det sker ofte"
        ]},
        {h:"Bevidstløs eller kramper", tone:"obs", punkter:[
          "<b>Giv aldrig noget gennem munden til en bevidstløs</b> — risiko for at det havner i luftvejene",
          "Skab frie luftveje, tjek vejrtrækningen, læg i <b>stabilt sideleje</b>",
          "Ring <b>1-1-2</b> og bliv hos personen",
          "Ved kramper: beskyt hovedet, hold ikke personen fast, put ikke noget i munden",
          "<b>Ingen normal vejrtrækning:</b> HLR 30:2 og hjertestarter"
        ]}
      ]
    }
  ]
};
