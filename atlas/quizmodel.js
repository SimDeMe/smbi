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

export function lavQuiz(tilfaeldig = Math.random) {
  const raekke = [...europa];
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
