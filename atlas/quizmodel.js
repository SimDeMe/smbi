// Bred europæisk skoleinddeling: FN's 44 europæiske stater + Cypern,
// Tyrkiet og Kosovo som selvstændigt quizområde. Koordinater er sigtepunkter.
export const europa = [
  ['008','Albanien',19.82,41.33], ['020','Andorra',1.5218,42.5078,true],
  ['056','Belgien',3.72,51.05], ['070','Bosnien-Hercegovina',18.41,43.86],
  ['100','Bulgarien',23.32,42.7], ['196','Cypern',33.36,35.17],
  ['208','Danmark',10.2,56.15], ['233','Estland',24.75,59.43],
  ['246','Finland',25,61], ['250','Frankrig',2.35,48.86],
  ['300','Grækenland',23.73,37.98], ['112','Hviderusland',27.56,53.9],
  ['372','Irland',-6.26,53.35], ['352','Island',-19,64.9],
  ['380','Italien',16.25,39.3], ['XKX','Kosovo',21,42.6],
  ['191','Kroatien',15.98,45.81], ['428','Letland',24.1,56.95],
  ['438','Liechtenstein',9.5215,47.141,true], ['440','Litauen',25.28,54.69],
  ['442','Luxembourg',6.13,49.61,true], ['470','Malta',14.44,35.88,true],
  ['498','Moldova',28.8,47], ['492','Monaco',7.4246,43.7384,true],
  ['499','Montenegro',19.2,42.7], ['528','Nederlandene',5.2,52.2],
  ['807','Nordmakedonien',21.7,41.6], ['578','Norge',10,62],
  ['616','Polen',19,52], ['620','Portugal',-8,39.5],
  ['642','Rumænien',25,46], ['643','Rusland',40,56],
  ['674','San Marino',12.4473,43.9367,true], ['756','Schweiz',6.15,46.2],
  ['688','Serbien',20.5,44.3], ['703','Slovakiet',19.5,48.7],
  ['705','Slovenien',14.5,46.1], ['724','Spanien',-3.7,40.4],
  ['826','Storbritannien og Nordirland',-2,54], ['752','Sverige',15,62],
  ['203','Tjekkiet',15.4,49.8], ['792','Tyrkiet',33,39],
  ['276','Tyskland',13.4,52.52], ['804','Ukraine',30.5,50.45],
  ['348','Ungarn',19.1,47.5], ['336','Vatikanstaten',12.4534,41.9029,true],
  ['040','Østrig',14,47.5]
].map(([id, navn, x, y, lille = false]) => ({ id, navn, punkt: [x, y], lille }));

// Øvrige verdensdele: FN M49's medlemsstater, sigtepunkter beregnet som et
// indre punkt langt fra kysten (små lande: deres ring). zoom angiver udsnittet
// for Vis landet ved store lande, der ellers ikke kan ses i deres helhed.
const zoom = { '643': 1.2, '124': 1.3, '840': 1.6, '156': 1.6, '036': 1.7, '360': 1.5,
  '076': 1.8, '152': 1.8, '032': 2, '398': 2.2, '392': 2.2, '356': 2.5, '484': 2.5,
  '496': 2.5, '608': 2.5 };
const tilLand = ([id, navn, x, y, lille = false]) =>
  ({ id, navn, punkt: [x, y], lille, ...(zoom[id] && { zoom: zoom[id] }) });

export const afrika = [
  ['012','Algeriet',2.68,27.13], ['024','Angola',17.9,-12.24],
  ['204','Benin',2.38,10.39], ['072','Botswana',24.2,-22.11],
  ['854','Burkina Faso',-0.97,12.8], ['108','Burundi',29.82,-3.44],
  ['120','Cameroun',12.36,4.51], ['174','Comorerne',43.34,-11.75,true],
  ['140','Den Centralafrikanske Republik',21.57,6.84], ['180','Den Demokratiske Republik Congo',23.17,-1.69],
  ['262','Djibouti',42.16,11.38], ['818','Egypten',28.66,26.34],
  ['384','Elfenbenskysten',-5.41,7.53], ['232','Eritrea',38.1,16.03],
  ['748','Eswatini',31.45,-26.57], ['231','Etiopien',38.61,8.28],
  ['266','Gabon',11.45,-0.65], ['270','Gambia',-14.97,13.66,true],
  ['288','Ghana',-1.26,6.99], ['324','Guinea',-9.52,9.93],
  ['624','Guinea-Bissau',-14.5,12.55], ['132','Kap Verde',-23.61,15.03,true],
  ['404','Kenya',37.89,0.42], ['426','Lesotho',28.4,-29.46],
  ['430','Liberia',-9.43,6.46], ['434','Libyen',21.19,26],
  ['450','Madagaskar',46.68,-18.43], ['454','Malawi',33.73,-13.45],
  ['466','Mali',-1.95,18.68], ['504','Marokko',-6.23,31.94],
  ['478','Mauretanien',-9.73,19.44], ['480','Mauritius',57.55,-20.3,true],
  ['508','Mozambique',38.19,-14.16], ['516','Namibia',17.13,-20.55],
  ['562','Niger',10.44,17.61], ['566','Nigeria',7.17,9.32],
  ['178','Republikken Congo',16.01,0], ['646','Rwanda',30.33,-1.81],
  ['678','São Tomé og Príncipe',6.59,0.24,true], ['686','Senegal',-14.92,15.16],
  ['690','Seychellerne',55.49,-4.65,true], ['694','Sierra Leone',-11.79,8.76],
  ['706','Somalia',42.8,2.41], ['729','Sudan',29.79,16.81],
  ['710','Sydafrika',25.09,-29.74], ['728','Sydsudan',30.32,7.2],
  ['834','Tanzania',34.05,-5.55], ['148','Tchad',19.51,17.45],
  ['768','Togo',1.05,8.87], ['788','Tunesien',9.42,33.08],
  ['800','Uganda',32.96,1.8], ['732','Vestsahara',-12.05,24.21],
  ['894','Zambia',26.07,-14.86], ['716','Zimbabwe',29.91,-19.01],
  ['226','Ækvatorialguinea',10.59,1.74]
].map(tilLand);

export const nordamerika = [
  ['028','Antigua og Barbuda',-61.82,17.07,true], ['044','Bahamas',-77.99,24.65],
  ['052','Barbados',-59.51,13.15,true], ['084','Belize',-89.01,16.6],
  ['124','Canada',-113.25,57.59], ['188','Costa Rica',-84.08,10.1],
  ['192','Cuba',-76.3,20.51], ['214','Den Dominikanske Republik',-70.9,19.12],
  ['212','Dominica',-61.37,15.49,true], ['222','El Salvador',-89.27,13.9],
  ['308','Grenada',-61.68,12.11,true], ['320','Guatemala',-90.94,14.96],
  ['332','Haiti',-72.21,19.23], ['340','Honduras',-87.18,14.74],
  ['388','Jamaica',-77.56,18.18], ['484','Mexico',-101.93,23.63],
  ['558','Nicaragua',-85.18,12.55], ['591','Panama',-81.14,8.36],
  ['659','Saint Kitts og Nevis',-62.78,17.37,true], ['662','Saint Lucia',-60.99,13.85,true],
  ['670','Saint Vincent og Grenadinerne',-61.2,13.23,true], ['780','Trinidad og Tobago',-61.24,10.34,true],
  ['840','USA',-98.74,39.06]
].map(tilLand);

export const sydamerika = [
  ['032','Argentina',-64.12,-31.73], ['068','Bolivia',-64.48,-16.62],
  ['076','Brasilien',-49.5,-12.29], ['152','Chile',-69.19,-22.96],
  ['170','Colombia',-73.25,3.28], ['218','Ecuador',-78.27,-1.14],
  ['328','Guyana',-58.69,2.84], ['600','Paraguay',-60.13,-21.57],
  ['604','Peru',-73.11,-12.85], ['740','Surinam',-55.93,4.13],
  ['858','Uruguay',-55.91,-33.02], ['862','Venezuela',-64.23,7.29]
].map(tilLand);

export const asienOceanien = [
  ['004','Afghanistan',66.61,34.16], ['051','Armenien',44.63,40.56],
  ['031','Aserbajdsjan',47.29,40.4], ['036','Australien',133.39,-23.49],
  ['048','Bahrain',50.52,26.12,true], ['050','Bangladesh',89.75,24.27],
  ['064','Bhutan',89.99,27.49], ['096','Brunei',114.55,4.46,true],
  ['116','Cambodja',104.43,12.67], ['784','De Forenede Arabiske Emirater',54.46,23.48],
  ['242','Fiji',177.98,-17.84], ['608','Filippinerne',121.42,16.96],
  ['268','Georgien',42.67,42.31], ['356','Indien',79.83,22.47],
  ['360','Indonesien',114.18,-0.97], ['368','Irak',43.17,33.01],
  ['364','Iran',55.12,32.05], ['376','Israel',34.82,30.96],
  ['392','Japan',138.71,36.27], ['400','Jordan',36.36,30.76],
  ['398','Kasakhstan',69.96,48.38], ['156','Kina',108.77,31.91],
  ['417','Kirgisistan',74.74,41.74], ['296','Kiribati',172.98,1.42,true],
  ['414','Kuwait',47.48,29.71], ['418','Laos',102.56,19.71],
  ['422','Libanon',36.08,34.2], ['458','Malaysia',113.67,2.39],
  ['462','Maldiverne',73.47,4.18,true], ['584','Marshalløerne',171.13,7.11,true],
  ['583','Mikronesien',158.23,6.86,true], ['496','Mongoliet',104.63,46.07],
  ['104','Myanmar',96,21.58], ['520','Nauru',166.93,-0.52,true],
  ['524','Nepal',81.86,29.09], ['554','New Zealand',169.41,-44.98],
  ['408','Nordkorea',126.4,40.08], ['512','Oman',57.49,22.06],
  ['586','Pakistan',66.92,27.7], ['585','Palau',134.59,7.48,true],
  ['275','Palæstina',35.26,32.09,true], ['598','Papua Ny Guinea',142.85,-5.43],
  ['634','Qatar',51.21,25.08], ['643','Rusland',107.49,62.21],
  ['090','Salomonøerne',160.09,-9.63], ['882','Samoa',-172.44,-13.64,true],
  ['682','Saudi-Arabien',45.1,23.06], ['702','Singapore',103.82,1.36,true],
  ['144','Sri Lanka',80.85,7.1], ['410','Sydkorea',128.12,36.35],
  ['760','Syrien',38.39,35.07], ['762','Tadsjikistan',72.62,38.31],
  ['158','Taiwan',120.84,23.6], ['764','Thailand',101.5,15.63],
  ['776','Tonga',-175.27,-21.19,true], ['795','Turkmenistan',58.83,39.72],
  ['798','Tuvalu',179.21,-8.49,true], ['792','Tyrkiet',33.56,39.27],
  ['860','Usbekistan',63.7,42], ['548','Vanuatu',166.88,-15.38],
  ['704','Vietnam',105.43,21.52], ['887','Yemen',45.23,15.32],
  ['626','Østtimor',125.45,-8.9]
].map(tilLand);


export const verdensdele = [
  { id: 'europa', navn: 'Europa', knap: 'Europa', quiznavn: 'Europa-quiz', kort: 'Europakortet',
    data: 'europa-10m.json', lande: europa, udsnit: { centrum: [15, 54], zoom: 1.8 },
    afgraensning: 'En bred europæisk skoleinddeling: FN’s 44 europæiske stater samt Cypern, Tyrkiet og Kosovo som selvstændigt quizområde. Rusland og Tyrkiet kan udpeges på begge sider af Europa/Asien-grænsen. Storbritannien og Nordirland er ét land. Cypern behandles som ét quizområde.' },
  { id: 'afrika', navn: 'Afrika', knap: 'Afrika', quiznavn: 'Afrika-quiz', kort: 'Afrikakortet',
    data: 'afrika-10m.json', lande: afrika, udsnit: { centrum: [17, 0], zoom: 1.45 },
    afgraensning: 'FN’s 54 afrikanske medlemsstater samt Vestsahara, som er et omstridt område. Somaliland regnes med til Somalia. Øerne Kap Verde, São Tomé og Príncipe, Comorerne, Mauritius og Seychellerne er med.' },
  { id: 'nordamerika', navn: 'Nordamerika', knap: 'Nordamerika', quiznavn: 'Nordamerika-quiz', kort: 'Nordamerikakortet',
    data: 'nordamerika-10m.json', lande: nordamerika, udsnit: { centrum: [-95, 45], zoom: 1.25 },
    afgraensning: 'Nordamerika med Mellemamerika og Caribien: FN’s 23 medlemsstater fra Canada til Panama. Grønland er en del af Rigsfællesskabet og er ikke et eget spørgsmål; det samme gælder Puerto Rico og de øvrige afhængige øer i Caribien.' },
  { id: 'sydamerika', navn: 'Sydamerika', knap: 'Sydamerika', quiznavn: 'Sydamerika-quiz', kort: 'Sydamerikakortet',
    data: 'sydamerika-10m.json', lande: sydamerika, udsnit: { centrum: [-60, -22], zoom: 1.7 },
    afgraensning: 'FN’s 12 sydamerikanske medlemsstater. Fransk Guyana er en del af Frankrig, og Falklandsøerne er britiske; de er ikke egne spørgsmål.' },
  { id: 'asien', navn: 'Asien og Oceanien', knap: 'Asien/Oceanien', quiznavn: 'Asien og Oceanien-quiz', kort: 'Kortet over Asien og Oceanien',
    data: 'asien-oceanien-10m.json', lande: asienOceanien, udsnit: { centrum: [115, 10], zoom: 1.1 },
    afgraensning: 'FN’s asiatiske og oceaniske medlemsstater samt Palæstina og Taiwan som selvstændige quizområder. Rusland og Tyrkiet er med i både Europa og Asien; Cypern hører til Europa-quizzen. Hongkong og Macao regnes med til Kina. Kiribatis ring står ved hovedstaden Tarawa.' }
];

export function lavQuiz(tilfaeldig = Math.random, lande = europa) {
  const raekke = [...lande];
  for (let i = raekke.length - 1; i > 0; i--) {
    const j = Math.floor(tilfaeldig() * (i + 1));
    [raekke[i], raekke[j]] = [raekke[j], raekke[i]];
  }
  const fundne = new Set();
  let indeks = 0, fejl = 0, viste = 0, foerste = 0, forsoeg = 0, besvaret = false;
  return {
    fundne,
    get land() { return raekke[indeks]; },
    get faerdig() { return indeks === raekke.length; },
    get besvaret() { return besvaret; },
    get resultat() { return { antal: raekke.length, fundet: fundne.size, fejl, viste, foerste }; },
    svar(id) {
      if (this.faerdig || besvaret || !id) return null;
      if (id !== this.land.id) { fejl++; forsoeg++; return false; }
      if (!forsoeg) foerste++;
      fundne.add(id); besvaret = true;
      return true;
    },
    vis() {
      if (this.faerdig || besvaret) return false;
      viste++; fundne.add(this.land.id); besvaret = true;
      return true;
    },
    naeste() {
      if (!besvaret || this.faerdig) return false;
      indeks++; forsoeg = 0; besvaret = false;
      return true;
    }
  };
}
