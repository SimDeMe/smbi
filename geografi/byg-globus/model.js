// Fagligt indhold og svarregler. Punkter er [længdegrad, breddegrad].
// Markørerne er eksempler inde i et område, ikke områdets grænse.
const sted = (id, navn, punkt, tekst, hint) => ({ id, navn, punkt, tekst, hint });
export const ZONER = {
  tropisk: { navn: 'Tropisk zone', farve: '#ed9c66', kriterium: 'Koldeste måned over 15 °C.' },
  subtropisk: { navn: 'Subtropisk zone', farve: '#efd168', kriterium: 'Uden for tropisk zone: varmeste måned over 20 °C og koldeste måned over 5 °C.' },
  tempereret: { navn: 'Tempereret zone', farve: '#98c2a0', kriterium: 'Varmeste måned mindst 10 °C; opfylder ikke kriterierne for tropisk eller subtropisk zone.' },
  polar: { navn: 'Polar zone', farve: '#c2b9e1', kriterium: 'Varmeste måned under 10 °C.' }
};
export const zoneForKlasse = nr => !Number.isInteger(nr) || nr < 1 || nr > 16 ? null : nr <= 4 ? 'tropisk' : nr <= 9 ? 'subtropisk' : nr <= 14 ? 'tempereret' : 'polar';
export const AFSNIT = [
  { id: 'verdensdele', navn: 'Verdensdele', lag: ['dele'] },
  { id: 'verdenshave', navn: 'Verdenshave', lag: ['have'] },
  { id: 'breddekredse', navn: 'Poler og breddekredse', lag: ['linjer'] },
  { id: 'koordinater', navn: 'Bredde og længde', lag: ['gradnet', 'punkter'] },
  { id: 'klimazoner', navn: 'Vahls klimazoner', lag: ['klima'] }
];
export const LAG = {
  dele: {
    navn: 'Find de syv verdensdele', type: 'steder', centrum: [15, 20],
    intro: 'Vælg et fagord, og tryk på den gule plads i den rigtige verdensdel. Drej globussen for at finde resten.',
    refleksion: 'Drej globussen, så Stillehavet vender mod dig. Hvilke verdensdele ligger omkring det?',
    ord: [
      sted('europa', 'Europa', [20, 52], 'Europa og Asien hænger sammen som landmassen Eurasien. Her bruger vi inddelingen i syv verdensdele.', 'Se vest for Asien og nord for Middelhavet.'),
      sted('asien', 'Asien', [95, 43], 'Asien strækker sig fra Middelhavsområdet mod øst til Stillehavet.', 'Find den store landmasse øst for Europa.'),
      sted('afrika', 'Afrika', [20, 4], 'Ækvator skærer gennem Afrika. Verdensdelen ligger på begge sider af ækvator.', 'Se syd for Europa, mellem Atlanterhavet og Det Indiske Ocean.'),
      sted('nordamerika', 'Nordamerika', [-105, 45], 'Nordamerika omfatter også Grønland, Mellemamerika og Caribien i denne inddeling.', 'Se nord for den smalle landforbindelse mellem de to amerikanske verdensdele.'),
      sted('sydamerika', 'Sydamerika', [-60, -15], 'Det meste af Sydamerika ligger syd for ækvator, men den nordligste del ligger nord for.', 'Find landmassen syd for Mellemamerika.'),
      sted('oceanien', 'Oceanien', [135, -25], 'Oceanien omfatter Australien, New Zealand og øgrupper i Stillehavet. Pladsen sidder i Australien.', 'Se sydøst for Asien. Pladsen sidder på det største landområde i verdensdelen.'),
      sted('antarktis', 'Antarktis', [25, -80], 'Antarktis er verdensdelen omkring Sydpolen. Arktis omkring Nordpolen er et område med hav og omgivende land.', 'Drej globussen, så du ser området omkring Sydpolen.')
    ]
  },
  have: {
    navn: 'Find de fem verdenshave', type: 'steder', centrum: [-35, 15],
    intro: 'Sæt navn på de fem verdenshave. De gule pladser markerer et sted i hvert hav, ikke hele havets udstrækning.',
    refleksion: 'Kan du dreje fra den ene side af Stillehavet til den anden uden at krydse en verdensdel?',
    ord: [
      sted('stille', 'Stillehavet', [-150, 0], 'Stillehavet ligger mellem Asien/Oceanien og Amerika. Det er ét hav, selv om et verdenskort ofte deler det ved kanten.', 'Find det store hav mellem Amerika og Asien/Oceanien.'),
      sted('atlanter', 'Atlanterhavet', [-35, 20], 'Atlanterhavet ligger mellem Amerika mod vest og Europa og Afrika mod øst.', 'Se mellem Amerika og Europa/Afrika.'),
      sted('indisk', 'Det Indiske Ocean', [80, -25], 'Det Indiske Ocean ligger mellem Afrika, Asien og Australien.', 'Se syd for Indien og øst for Afrika.'),
      sted('nordishav', 'Nordishavet', [0, 84], 'Nordishavet ligger omkring Nordpolen og omgives af Nordamerika, Europa og Asien.', 'Se omkring den nordlige pol.'),
      sted('sydhav', 'Sydhavet', [70, -62], 'Sydhavet omgiver Antarktis. Her følger vi den udbredte afgrænsning ved 60° syd.', 'Find havet hele vejen rundt om Antarktis.')
    ]
  },
  linjer: {
    navn: 'Poler og vigtige breddekredse', type: 'linjer', centrum: [15, 0],
    intro: 'Sæt fagordene på polerne og de fem tegnede breddekredse. De små gule pladser følger linjerne, når globussen drejes.',
    refleksion: 'Hvilke to linjer afgrænser området, hvor Solen kan stå i zenit?',
    ord: [
      sted('nordpol', 'Nordpolen', [0, 90], 'Nordpolen er 90° nord. Jordens rotationsakse går gennem Nordpolen og Sydpolen.', 'Find enden af rotationsaksen på den nordlige halvkugle.'),
      sted('nordpolar', 'Den nordlige polarcirkel', [0, 66.56], 'Den nordlige polarcirkel ligger ved ca. 66,5° nord. Nord for den kan man opleve midnatssol og polarnat.', 'Find breddekredsen mellem Krebsens vendekreds og Nordpolen.'),
      sted('krebs', 'Krebsens vendekreds', [0, 23.44], 'Krebsens vendekreds ligger ved ca. 23,5° nord. Her kan Solen stå i zenit ved juni-solhverv.', 'Find vendekredsen på den nordlige halvkugle.'),
      sted('aekvator', 'Ækvator', [0, 0], 'Ækvator er 0° bredde og deler Jorden i en nordlig og en sydlig halvkugle.', 'Find den største breddekreds, lige langt fra begge poler.'),
      sted('stenbuk', 'Stenbukkens vendekreds', [0, -23.44], 'Stenbukkens vendekreds ligger ved ca. 23,5° syd. Her kan Solen stå i zenit ved december-solhverv.', 'Find vendekredsen på den sydlige halvkugle.'),
      sted('sydpolar', 'Den sydlige polarcirkel', [0, -66.56], 'Den sydlige polarcirkel ligger ved ca. 66,5° syd. Syd for den kan man opleve midnatssol og polarnat.', 'Find breddekredsen mellem Stenbukkens vendekreds og Sydpolen.'),
      sted('sydpol', 'Sydpolen', [0, -90], 'Sydpolen er 90° syd og ligger på Antarktis.', 'Find enden af rotationsaksen på den sydlige halvkugle.')
    ]
  },
  gradnet: {
    navn: 'Læs gradnettets linjer', type: 'gradnet', centrum: [25, 15],
    intro: 'Sæt navn på de tre fremhævede linjer. Bredde måles fra ækvator; længde måles fra nulmeridianen.',
    refleksion: 'Hvorfor er breddekredsene kortere tæt på polerne, mens alle længdekredse går fra pol til pol?',
    ord: [
      sted('bredde', 'Breddekreds', [25, 30], 'En breddekreds forbinder steder med samme breddegrad. Bredde angives fra 0° til 90° nord eller syd.', 'Find linjen, der løber parallelt med ækvator.'),
      sted('laengde', 'Længdekreds', [60, 0], 'En længdekreds er en halvcirkel fra pol til pol. Længde angives fra 0° til 180° øst eller vest.', 'Find den fremhævede linje fra pol til pol, der ikke går gennem Greenwich.'),
      sted('nul', 'Nulmeridianen', [0, 0], 'Nulmeridianen er 0° længde og går gennem Greenwich i London. Valget af nulmeridian er en aftale.', 'Find den fremhævede længdekreds gennem Greenwich.')
    ]
  },
  punkter: {
    navn: 'Find steder med koordinater', type: 'punkter', centrum: [10, 15],
    intro: 'Drej globussen, og sæt punktet ved de angivne koordinater. Tryk på globussen, eller brug sigtekornet og knappen. Du får straks at vide, om punktet er korrekt. Svaret må være op til 5° fra målet.',
    refleksion: 'Forklar for en makker, hvordan du finder et sted ud fra dets breddegrad og længdegrad.',
    ord: [
      sted('punkt1', '30° N, 30° Ø', [30, 30], '30° nord for ækvator og 30° øst for nulmeridianen. Punktet ligger i Egypten.', 'Find først 30° nord og følg breddekredsen til 30° øst.'),
      sted('punkt2', '30° S, 60° V', [-60, -30], '30° syd for ækvator og 60° vest for nulmeridianen. Punktet ligger i Sydamerika.', 'Gå syd for ækvator og vest for nulmeridianen.'),
      sted('punkt3', '0°, 150° V', [-150, 0], '0° bredde er ækvator. 150° vest ligger i Stillehavet.', 'Bliv på ækvator og drej langt mod vest fra Greenwich.')
    ]
  },
  klima: {
    navn: 'Vahls fire klimazoner', type: 'klima', centrum: [20, 20],
    intro: 'De fire farver viser klimazonernes udbredelse på land. Sæt navn på zonen ved hver plads. Den polare plads sidder på Grønland.',
    refleksion: 'Slå breddekredsene til. Hvor kan du se, at klimazonernes grænser ikke følger vende- og polarcirklerne?',
    ord: [
      sted('tropisk', 'Tropisk zone', [23, 0], ZONER.tropisk.kriterium + ' Zonen findes omkring ækvator, men højland kan have et køligere klima.', 'Find zonen med høje temperaturer hele året.'),
      sted('subtropisk', 'Subtropisk zone', [15, 27], ZONER.subtropisk.kriterium, 'Find zonen med varme somre og milde vintre, uden for den tropiske zone.'),
      sted('tempereret', 'Tempereret zone', [15, 52], ZONER.tempereret.kriterium + ' Danmark ligger i tempereret zone.', 'Find den zone, som Danmark ligger i.'),
      sted('polar', 'Polar zone', [-42, 75], ZONER.polar.kriterium + ' Zonen findes også i højtliggende bjergområder.', 'Find zonen, hvor selv den varmeste måned er kold.')
    ]
  }
};

export function afstand(a, b) {
  const r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h)))) / r;
}
export const punktKorrekt = (punkt, maal) => Array.isArray(punkt) && punkt.length === 2 && punkt.every(Number.isFinite) && afstand(punkt, maal) <= 5;
export function koordinater([lon, lat]) {
  const tal = x => Math.abs(x).toFixed(0);
  return `${tal(lat)}° ${lat < 0 ? 'S' : 'N'}, ${tal(lon)}° ${lon < 0 ? 'V' : 'Ø'}`;
}
