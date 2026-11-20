// Fagligt indhold: organernes navne og opgaver, rundturens trin og nedbrydningens forløb.
// Tal (pH, tider, længder) er typiske værdier for en voksen og varierer meget fra person til person.

export const DELE = {
  tunge: {
    navn: 'Tungen', gruppe: 'Mundhulen',
    tekst: 'En muskel, der flytter maden rundt mellem tænderne, blander den med spyt og former den til en blød klump, som kan synkes.',
  },
  taender: {
    navn: 'Tænderne', gruppe: 'Mundhulen',
    tekst: 'Fortænderne skærer, kindtænderne knuser og maler. Tygning er mekanisk nedbrydning: små stykker har en større overflade, som enzymerne kan angribe.',
  },
  gane: {
    navn: 'Ganen og gummerne', gruppe: 'Mundhulen',
    tekst: 'Ganen er mundhulens loft. Tungen presser maden op mod den, når vi tygger og synker. Den bløde gane bagest lukker op til næsen, når vi synker.',
  },
  spytkirtel: {
    navn: 'Spytkirtlerne', gruppe: 'Tilhørende organ',
    tekst: 'Tre par kirtler — ørespyt-, underkæbe- og undertungespytkirtlen — laver 1–1,5 L spyt om dagen. Spyttet fugter maden, så den kan synkes, og indeholder amylase, der begynder at spalte stivelse.',
    fakta: [['Enzym', 'spytamylase'], ['pH i munden', '≈ 7']],
  },
  svaelg: {
    navn: 'Svælget', gruppe: 'Fordøjelseskanalen',
    tekst: 'Fælles vej for luft og mad. Når vi synker, lukker strubelåget luftrøret, så maden går ned i spiserøret.',
  },
  spiseroer: {
    navn: 'Spiserøret', gruppe: 'Fordøjelseskanalen',
    tekst: 'Et ca. 25 cm langt muskelrør. Peristaltik — bølger af muskelsammentrækninger — skubber maden ned til mavesækken på få sekunder.',
    fakta: [['Tid', '5–10 s']],
  },
  mavesaek: {
    navn: 'Mavesækken', gruppe: 'Fordøjelseskanalen',
    tekst: 'Musklerne ælter maden med mavesaft til en tyk grød. Saltsyren gør pH meget lav og dræber de fleste bakterier, og pepsin begynder at spalte proteiner. Mavemunden lukker grøden videre lidt ad gangen.',
    fakta: [['pH', '1,5–2'], ['Enzym', 'pepsin'], ['Tid', '2–4 timer']],
  },
  tolvfingertarm: {
    navn: 'Tolvfingertarmen', gruppe: 'Fordøjelseskanalen',
    tekst: 'Tyndtarmens første ca. 25 cm. Her løber galde og bugspyt ind. Bikarbonat i bugspyttet neutraliserer mavesyren, og bugspyttets enzymer spalter stivelse, protein og fedt.',
    fakta: [['pH', '≈ 7–8'], ['Enzymer', 'amylase, trypsin, lipase']],
  },
  tyndtarm: {
    navn: 'Tyndtarmen', gruppe: 'Fordøjelseskanalen',
    tekst: 'Her bliver nedbrydningen færdig, og næringsstofferne optages gennem tarmtotterne (villi): glukose og aminosyrer til blodet, fedtsyrer og glycerol til lymfen. Folder, villi og mikrovilli giver en overflade på ca. 30 m².',
    fakta: [['Længde', '5–6 m (kortere i modellen)'], ['Tid', '3–5 timer']],
  },
  tyktarm: {
    navn: 'Tyktarmen', gruppe: 'Fordøjelseskanalen',
    tekst: 'Begynder med blindtarmen nederst til højre. Her optages det meste af det vand og salt, der er tilbage, så tarmindholdet bliver til fast afføring. Tarmbakterier nedbryder en del af kostfibrene.',
    fakta: [['Længde', 'ca. 1,5 m'], ['Optager', 'vand og salte'], ['Tid', '10–40 timer']],
  },
  vedhaeng: {
    navn: 'Blindtarmsvedhænget', gruppe: 'Fordøjelseskanalen',
    tekst: 'En lille blind udposning fra blindtarmen med lymfevæv. Det spiller ingen rolle for fordøjelsen. Når det bliver betændt, kaldes det i daglig tale blindtarmsbetændelse.',
  },
  endetarm: {
    navn: 'Endetarmen og anus', gruppe: 'Fordøjelseskanalen',
    tekst: 'Endetarmen samler afføringen, til den tømmes. To ringmuskler ved anus holder tæt — den inderste arbejder af sig selv, den yderste styrer vi med viljen.',
  },
  lever: {
    navn: 'Leveren', gruppe: 'Tilhørende organ',
    tekst: 'Kroppens største kirtel (ca. 1,5 kg). Den laver galde. Blodet fra tarmen løber gennem leveren via portåren, før det når resten af kroppen: leveren lagrer glukose som glykogen og uskadeliggør giftstoffer.',
  },
  galdeblaere: {
    navn: 'Galdeblæren', gruppe: 'Tilhørende organ',
    tekst: 'Opbevarer og koncentrerer galden fra leveren og presser den ud i tolvfingertarmen, når der kommer fedtholdig mad fra mavesækken.',
  },
  galdegang: {
    navn: 'Galdegangene', gruppe: 'Tilhørende organ',
    tekst: 'Fører galden fra leveren og galdeblæren til tolvfingertarmen. Galdesaltene deler store fedtdråber i små (emulgering), så lipase får mere overflade at arbejde på. Galde er ikke et enzym.',
  },
  bugspytkirtel: {
    navn: 'Bugspytkirtlen', gruppe: 'Tilhørende organ',
    tekst: 'Ligger bag mavesækken. Laver ca. 1,5 L bugspyt om dagen med bikarbonat og enzymer til alle tre næringsstoffer. Den laver også hormonerne insulin og glukagon, men de går til blodet.',
    fakta: [['Enzymer', 'amylase, trypsin, lipase']],
  },
};

// Rækkefølge i listen under figuren
export const LISTE = [
  ['Kanalen', ['tunge', 'taender', 'svaelg', 'spiseroer', 'mavesaek', 'tolvfingertarm', 'tyndtarm', 'tyktarm', 'vedhaeng', 'endetarm']],
  ['Tilhørende organer', ['spytkirtel', 'lever', 'galdeblaere', 'galdegang', 'bugspytkirtel']],
];

// Rundturens trin. «dele» er de 3D-dele, der fremhæves; «andel» er trinnets del af afspilningen;
// «tid» er minutter efter måltidet (idealiseret); «ph» er [start, slut].
export const TRIN = [
  {
    id: 'mund', navn: 'Munden', dele: ['tunge', 'taender', 'gane', 'spytkirtel'], andel: 0.11, tid: [0, 1], ph: [7, 7],
    mekanisk: 'Tænderne tygger, og tungen blander maden med spyt til en blød klump.',
    kemisk: [['Spytamylase', 'stivelse → maltose']],
    note: 'Spyt fra spytkirtlerne fugter maden og bringer amylase med.',
  },
  {
    id: 'svaelg', navn: 'Svælget', dele: ['svaelg'], andel: 0.04, tid: [1, 1.05], ph: [7, 7],
    mekanisk: 'Tungen skubber klumpen bagud, og strubelåget lukker luftrøret, mens vi synker.',
    kemisk: [['Spytamylase', 'arbejder videre inde i klumpen']],
  },
  {
    id: 'spiseroer', navn: 'Spiserøret', dele: ['spiseroer'], andel: 0.07, tid: [1.05, 1.2], ph: [7, 7],
    mekanisk: 'Peristaltik: en ring af muskelsammentrækning bevæger sig ned ad røret og skubber klumpen foran sig.',
    kemisk: [['Spytamylase', 'arbejder videre inde i klumpen']],
  },
  {
    id: 'mavesaek', navn: 'Mavesækken', dele: ['mavesaek'], andel: 0.17, tid: [1.2, 210], ph: [5, 2],
    mekanisk: 'Mavens muskler ælter maden med mavesaften til en tyk grød.',
    kemisk: [['Pepsin', 'protein → peptider']],
    note: 'Spytamylase virker bedst ved pH ≈ 7. Når saltsyren gør pH lav, holder den op med at virke — pepsin virker derimod bedst i den sure mave.',
  },
  {
    id: 'tolvfingertarm', navn: 'Tolvfingertarmen', dele: ['tolvfingertarm', 'galdegang', 'galdeblaere', 'bugspytkirtel'],
    andel: 0.13, tid: [210, 240], ph: [2, 7.5],
    mekanisk: 'Galden emulgerer fedtet: store dråber deles i små. Det er en fysisk proces, ikke en spaltning.',
    kemisk: [['Amylase', 'stivelse → maltose'], ['Trypsin', 'peptider → kortere peptider'], ['Lipase', 'fedt → fedtsyrer + glycerol']],
    note: 'Bikarbonat fra bugspytkirtlen neutraliserer mavesyren, så bugspyttets enzymer kan virke.',
  },
  {
    id: 'tyndtarm', navn: 'Tyndtarmen', dele: ['tyndtarm'], andel: 0.22, tid: [240, 480], ph: [7.5, 7.5],
    mekanisk: 'Peristaltik og blandebevægelser fører tarmindholdet hen over tarmtotterne.',
    kemisk: [['Maltase', 'maltose → glukose'], ['Peptidaser', 'peptider → aminosyrer']],
    optag: 'Glukose og aminosyrer → blodet (via portåren til leveren). Fedtsyrer og glycerol → lymfen.',
  },
  {
    id: 'tyktarm', navn: 'Tyktarmen', dele: ['tyktarm', 'vedhaeng'], andel: 0.18, tid: [480, 1800], ph: [6.5, 6.5],
    mekanisk: 'Langsomme bevægelser. Tarmindholdet bliver fastere, efterhånden som vandet optages.',
    kemisk: [['Tarmbakterier', 'en del af kostfibrene gæres']],
    optag: 'Vand og salte → blodet.',
  },
  {
    id: 'endetarm', navn: 'Endetarmen og anus', dele: ['endetarm'], andel: 0.08, tid: [1800, 2100], ph: [7, 7],
    mekanisk: 'Afføringen samles og tømmes ud gennem anus.',
    kemisk: [],
    note: 'Afføring er vand, ufordøjelige kostfibre, tarmbakterier, afstødte celler og galdefarvestof (som giver den brune farve).',
  },
];

// ---- enzymerne og pH
// Relativ aktivitet som idealiserede klokkekurver omkring hvert enzyms pH-optimum.
// Rigtige kurver er skæve, og optimum afhænger af temperatur, salte og substrat.
export const ENZYMER = [
  {id: 'amylase', navn: 'Amylase', opt: 6.9, b: 1.4, farve: '#D9A21B',
    hvor: 'Munden (spyt) og tolvfingertarmen (bugspyt)', hvad: 'stivelse → maltose', dele: ['spytkirtel', 'tunge', 'tolvfingertarm', 'bugspytkirtel']},
  {id: 'pepsin', navn: 'Pepsin', opt: 2, b: 1.5, farve: '#E8336D',
    hvor: 'Mavesækken', hvad: 'protein → peptider', dele: ['mavesaek']},
  {id: 'trypsin', navn: 'Trypsin', opt: 8, b: 1.6, farve: '#7A4FD6',
    hvor: 'Tolvfingertarmen (bugspyt)', hvad: 'peptider → kortere peptider', dele: ['tolvfingertarm', 'bugspytkirtel']},
  {id: 'lipase', navn: 'Lipase', opt: 8, b: 1.5, farve: '#0E86C8',
    hvor: 'Tolvfingertarmen (bugspyt)', hvad: 'fedt → fedtsyrer + glycerol', dele: ['tolvfingertarm', 'bugspytkirtel']},
  {id: 'maltase', navn: 'Maltase', opt: 6.5, b: 1.5, farve: '#0FA593',
    hvor: 'Tyndtarmens slimhinde', hvad: 'maltose → glukose', dele: ['tyndtarm']},
];

export function aktivitet(id, ph) {
  const e = ENZYMER.find((e) => e.id === id);
  return Math.exp(-(((ph - e.opt) / e.b) ** 2));
}

// Typisk pH i kanalen, til genvejsknapperne
export const PH_STEDER = [
  {navn: 'Munden', ph: 7, dele: ['tunge', 'taender', 'gane', 'spytkirtel']},
  {navn: 'Mavesækken', ph: 2, dele: ['mavesaek']},
  {navn: 'Tyndtarmen', ph: 7.5, dele: ['tolvfingertarm', 'tyndtarm']},
  {navn: 'Tyktarmen', ph: 6.5, dele: ['tyktarm']},
];

// ---- forhold, eleven kan ændre i rundturen («hvad nu hvis …»)
export const NORMALE = {phMave: 2, galde: true};
export const forhold = {...NORMALE};

// Nedbrydningens forløb som nøglepunkter [trin, brøkdel i trinnet, værdi 0–1].
// Kurverne bygges ud fra forholdene: mavens pH styrer amylase og pepsin i mavesækken,
// og uden galde bliver fedtet ikke emulgeret, så lipase kun når en del af det.
function bygForløb({phMave, galde}) {
  const mindst = (x) => (x < 0.02 ? 0 : x);   // under 2 % regnes som «virker ikke»
  const aAmyl = mindst(aktivitet('amylase', phMave)), aPep = mindst(aktivitet('pepsin', phMave));
  const stivMave = 0.45 + 0.45 * aAmyl;
  const lip = galde ? 1 : 0.34;
  return {
    stivelse_amylase: [['mund', 0.25, 0], ['mund', 1, 0.3], ['spiseroer', 1, 0.4], ['mavesaek', 0.2, 0.45],
                       ['mavesaek', 1, stivMave], ['tolvfingertarm', 0.15, stivMave], ['tolvfingertarm', 1, 1]],
    stivelse_maltase: [['tyndtarm', 0, 0], ['tyndtarm', 0.4, 1]],
    stivelse_optag: [['tyndtarm', 0.15, 0], ['tyndtarm', 0.7, 1]],
    protein_pepsin: [['mavesaek', 0.15, 0], ['mavesaek', 1, aPep]],
    protein_trypsin: [['tolvfingertarm', 0.2, 0], ['tyndtarm', 0.1, 1]],
    protein_peptidase: [['tyndtarm', 0.05, 0], ['tyndtarm', 0.5, 1]],
    protein_optag: [['tyndtarm', 0.2, 0], ['tyndtarm', 0.75, 1]],
    fedt_galde: [['tolvfingertarm', 0.1, 0], ['tolvfingertarm', 0.5, galde ? 1 : 0]],
    fedt_lipase: [['tolvfingertarm', 0.35, 0], ['tyndtarm', 0.3, lip]],
    fedt_optag: [['tyndtarm', 0.25, 0], ['tyndtarm', 0.85, 1]],
    fibre_bakterier: [['tyktarm', 0.1, 0], ['tyktarm', 0.9, 1]],
    fibre_optag: [['tyktarm', 0.3, 0], ['tyktarm', 1, 1]],
    vand: [['mund', 0, 0.75], ['mund', 1, 0.85], ['mavesaek', 0.5, 0.9], ['tolvfingertarm', 0.5, 0.95],
           ['tyndtarm', 1, 0.9], ['tyktarm', 0.05, 0.9], ['tyktarm', 1, 0.3]],
  };
}
export let FORLØB = bygForløb(forhold);

// Klumpens farve i hvert trin (fra tygget mad over grød til afføring)
export const FARVER = {
  mund: '#e8d3a3', svaelg: '#e8d3a3', spiseroer: '#e5cf98', mavesaek: '#d9c27e', tolvfingertarm: '#c9b45a',
  tyndtarm: '#b9a24c', tyktarm: '#8a6234', endetarm: '#6b4627',
};

// ---- omregning mellem rundturens samlede position u (0–1) og (trin, brøkdel)
const SUM = TRIN.reduce((s, t) => s + t.andel, 0);
const START = [];
TRIN.reduce((s, t) => (START.push(s / SUM), s + t.andel), 0);

export function tilGlobal(id, f) {
  const i = TRIN.findIndex((t) => t.id === id);
  return START[i] + (TRIN[i].andel / SUM) * f;
}

export function fraGlobal(u) {
  u = Math.min(Math.max(u, 0), 1);
  let i = TRIN.length - 1;
  while (i > 0 && START[i] > u) i--;
  return {i, trin: TRIN[i], f: Math.min(1, (u - START[i]) / (TRIN[i].andel / SUM))};
}

let KURVER = {};
function omregn() {
  KURVER = Object.fromEntries(Object.entries(FORLØB).map(([n, p]) => [n, p.map(([id, f, v]) => [tilGlobal(id, f), v])]));
}

export function sætForhold(nye) {
  Object.assign(forhold, nye);
  FORLØB = bygForløb(forhold);
  omregn();
}
export const erNormale = () => forhold.phMave === NORMALE.phMave && forhold.galde === NORMALE.galde;

// pH i et trin [start, slut] under de valgte forhold
export function trinPh(trin) {
  if (trin.id === 'mavesaek') return [Math.max(5, forhold.phMave), forhold.phMave];
  if (trin.id === 'tolvfingertarm') return [forhold.phMave, trin.ph[1]];
  return trin.ph;
}

// Trinnets tekster under de valgte forhold (mekanisk, kemisk, optagelse, note)
export function trinTekst(trin) {
  const t = {mekanisk: trin.mekanisk, kemisk: trin.kemisk, optag: trin.optag, note: trin.note || ''};
  if (trin.id === 'mavesaek' && forhold.phMave !== NORMALE.phMave) {
    const aP = aktivitet('pepsin', forhold.phMave), aA = aktivitet('amylase', forhold.phMave);
    t.kemisk = [['Pepsin', aP < 0.1 ? 'virker næsten ikke ved dette pH' : `protein → peptider${aP < 0.8 ? ' (langsomt)' : ''}`]];
    if (aA >= 0.1) t.kemisk.push(['Spytamylase', 'stivelse → maltose (arbejder videre i maven)']);
    t.note = '';
  }
  if (!forhold.galde && trin.id === 'tolvfingertarm') {
    t.mekanisk = 'Ingen galde: fedtet bliver ikke emulgeret, men forbliver i store dråber.';
    t.kemisk = trin.kemisk.map(([e, h]) => (e === 'Lipase' ? [e, h + ' — kun på dråbernes overflade'] : [e, h]));
  }
  if (!forhold.galde && trin.id === 'tyndtarm')
    t.optag = 'Glukose og aminosyrer → blodet. Kun en del af fedtet er spaltet, og kun den del optages (til lymfen).';
  return t;
}

// Ekstra forklaring i et trin, når forholdene er ændret
export function forholdNote(trin) {
  const pct = (x) => `${Math.round(x * 100)} %`;
  if (trin.id === 'mavesaek' && forhold.phMave !== NORMALE.phMave) {
    const ph = String(forhold.phMave).replace('.', ',');
    return `Ændret: pH ${ph} i mavesækken. Pepsin virker med ${pct(aktivitet('pepsin', forhold.phMave))} af sin største hastighed, spytamylase med ${pct(aktivitet('amylase', forhold.phMave))}.`;
  }
  if (!forhold.galde && trin.id === 'tolvfingertarm')
    return 'Ændret: galden mangler. Fedtet bliver i store dråber, og lipase kan kun angribe dråbernes overflade.';
  if (!forhold.galde && ['tyndtarm', 'tyktarm', 'endetarm'].includes(trin.id))
    return 'Ændret: galden mangler. En stor del af fedtet bliver ikke spaltet og optaget — det følger med ud i afføringen (fedtet afføring).';
  return '';
}

// Værdien af en forløbskurve ved u, og om den er ved at ændre sig lige dér
export function værdi(navn, u) {
  const k = KURVER[navn];
  if (u <= k[0][0]) return {v: k[0][1], aktiv: false};
  for (let j = 1; j < k.length; j++) {
    if (u <= k[j][0]) {
      const [u0, v0] = k[j - 1], [u1, v1] = k[j];
      return {v: v0 + (v1 - v0) * ((u - u0) / ((u1 - u0) || 1)), aktiv: Math.abs(v1 - v0) > 1e-3};
    }
  }
  return {v: k[k.length - 1][1], aktiv: false};
}
omregn();
