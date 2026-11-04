import { hent, flet } from '../byg-biologi/figurer.js';
// Skematiske molekyler. Placeringerne er valgt for at fremhæve relationerne.
const blaa = '#8bbce0';
const lilla = '#b6a0dc';
const gul = '#f4cb73';
const groen = '#a0ce9b';
const pink = '#f1a3bb';
const blaek = '#334155';

const streg = (d, farve = blaek, bredde = 3, stiplet = false) =>
  `<path d="${d}" fill="none" stroke="${farve}" stroke-width="${bredde}" stroke-linecap="round"${stiplet ? ' stroke-dasharray="3 5"' : ''}/>`;
const felt = (x, y, b, h, farve, r = 7) =>
  `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="${r}" fill="${farve}" stroke="${blaek}" stroke-width="2"/>`;
const oval = (x, y, rx, ry, farve) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${farve}" stroke="${blaek}" stroke-width="2"/>`;
const tekst = (x, y, t) =>
  `<text x="${x}" y="${y}" text-anchor="middle" class="fig-navn">${t}</text>`;
const pil = (x, y, tilX, tilY) => {
  const v = Math.atan2(tilY - y, tilX - x);
  const hoved = [v - 0.5, v + 0.5].map(a =>
    `L${tilX - 10 * Math.cos(a)} ${tilY - 10 * Math.sin(a)}`);
  return streg(`M${x} ${y} L${tilX} ${tilY} M${tilX} ${tilY} ${hoved[0]} M${tilX} ${tilY} ${hoved[1]}`);
};
const basefarver = { A: gul, T: pink, U: pink, G: groen, C: blaa };
const base = (x, y, b) => felt(x - 16, y - 16, 32, 32, basefarver[b]) + tekst(x, y + 6, b);
const raekke = (x, y, sekvens) => Array.from(sekvens, (b, i) => base(x + 34 * i, y, b)).join('');
const sukker = (x, y) =>
  `<path d="M${x - 26} ${y - 8} l26 -19 26 19 -10 30 h-32Z" fill="${blaa}" stroke="${blaek}" stroke-width="2"/>`;

const figurer = [
  {
    id: 'nukleotid', navn: 'Nukleotidet',
    intro: 'Byg ét DNA-nukleotid. Find den del der varierer, og de to dele der indgår i DNA’ets rygrad.',
    baggrund: streg('M335 172 L392 200 L484 172') + tekst(430, 300, 'Ét DNA-nukleotid'),
    lag: [{
      navn: 'Tre byggesten',
      ekstra: {
        ribose: ['Ribose er sukkeret i RNA.', 'Kig efter sukkeret i DNA. Det har ét oxygenatom mindre end sukkeret i RNA.'],
        uracil: ['Uracil er en af de fire almindelige baser i RNA.', 'Her bygger du DNA. I RNA erstatter denne base thymin.'],
      },
      dele: [
        ['fosfat', 'Fosfat forbinder sukkermolekyler i DNA’ets rygrad. Figuren viser fosfatgruppen i ét frit nukleotid skematisk.', [320, 165], [-1, 128], oval(320, 165, 24, 24, gul)],
        ['deoxyribose', 'Deoxyribose er DNA’ets sukker. Basen sidder på sukkerets 1′-carbonatom.', [407, 201], [-1, 233], sukker(407, 201)],
        ['kvælstofbase', 'Basen kan være A, T, G eller C. Her er den A, som står for adenin.', [506, 163], [1, 156], base(506, 163, 'A')],
      ],
    }],
  },
  {
    id: 'dobbeltstreng', navn: 'DNA-dobbeltstrengen',
    intro: 'Tænk DNA som en stige, der er foldet ud. Se, hvad der holder de to strenge sammen, og sammenlign deres ender.',
    baggrund: streg('M350 88 V302 M510 88 V302', '#607892', 10)
      + tekst(350, 69, '5′') + tekst(510, 69, '3′') + tekst(350, 334, '3′') + tekst(510, 334, '5′')
      + ['A', 'G', 'T'].map((b, i) => {
        const y = 122 + 72 * i;
        return streg(`M350 ${y} H393 M467 ${y} H510`) + base(393, y, b)
          + base(467, y, ['T', 'C', 'A'][i]);
      }).join(''),
    lag: [{
      navn: 'Sammenhæng og retning',
      dele: [
        ['sukker-fosfat-rygrad', 'Sukker og fosfat skifter langs hver DNA-streng. Baserne sidder på sukkeret og vender ind mod midten.', [350, 159], [-1, 154],
          streg('M350 88 V302 M510 88 V302', blaa, 10)],
        ['basepar', 'A parrer med T, og G parrer med C. Her er G og C fremhævet som ét basepar.', [430, 194], [1, 184],
          felt(374, 174, 112, 40, '#e6f1de') + base(393, 194, 'G') + base(467, 194, 'C')],
        ['hydrogenbindinger', 'Hydrogenbindinger holder komplementære baser sammen. A–T danner to, mens G–C danner tre.', [430, 266], [1, 273],
          [117, 127, 189, 194, 199, 261, 271].map(y => streg(`M410 ${y} H450`, '#8860a5', 2, true)).join('')],
      ],
    }],
  },
  {
    id: 'transkription', navn: 'Transkription',
    intro: 'Se et udsnit af et gen i cellekernen. Sammenlign de tre første viste RNA-baser med de to DNA-strenge.',
    baggrund: tekst(430, 41, 'Udsnit af DNA og nydannet RNA')
      + tekst(310, 108, '5′') + tekst(550, 108, '3′')
      + tekst(310, 206, '3′') + tekst(550, 206, '5′')
      + pil(362, 281, 498, 281) + tekst(430, 308, 'Polymerasens bevægelse langs DNA'),
    lag: [{
      navn: 'DNA og enzymet',
      dele: [
        ['RNA-polymerase', 'RNA-polymerasen åbner DNA lokalt, læser skabelonen 3′ → 5′ og bygger RNA 5′ → 3′.', [507, 160], [1, 157],
          oval(468, 161, 53, 73, lilla)],
        ['kodende streng', 'Den kodende streng har samme basesekvens som det tilsvarende RNA, når T i DNA svarer til U i RNA.', [396, 101], [1, 88],
          streg('M334 101 H525', '#607892', 7) + raekke(396, 101, 'ATG')],
        ['skabelonstreng', 'RNA-polymerasen bruger denne DNA-streng som skabelon. Baserne i RNA er komplementære til baserne her.', [396, 200], [-1, 208],
          streg('M334 200 H525', '#607892', 7) + raekke(396, 200, 'TAC')],
      ],
    }, {
      navn: 'Det nydannede RNA',
      dele: [
        ['præ-mRNA', 'Præ-mRNA er det første RNA-produkt fra et proteinkodende gen i en eukaryot celle. Figuren viser kun tre baser fra det.', [430, 154], [-1, 130],
          streg('M322 161 Q344 151 378 154 H474', '#68894d', 7) + tekst(310, 161, '5′') + raekke(396, 154, 'AUG')],
      ],
    }],
  },
  {
    id: 'splejsning', navn: 'RNA-bearbejdning',
    intro: 'Sammenlign præ-mRNA øverst med modent mRNA nederst. Hvilken sekvens bliver fjernet, og hvad tilføjes ved enderne?',
    baggrund: tekst(430, 43, 'Præ-mRNA') + tekst(430, 362, 'Modent mRNA')
      + streg('M280 107 H580 M280 284 H580') + pil(430, 145, 430, 232)
      + tekst(277, 87, '5′') + tekst(580, 87, '3′'),
    lag: [{
      navn: 'Splejsning',
      dele: [
        ['intron', 'Et intron transkriberes til præ-mRNA. Under splejsningen fjernes det fra RNA’et.', [430, 107], [1, 97],
          felt(385, 91, 90, 32, gul)],
        ['exoner', 'Exoner er de sekvenser, der bliver tilbage i modent RNA. De kan omfatte både kodende og ikke-kodende områder.', [333, 107], [-1, 111],
          felt(293, 87, 91, 40, blaa) + felt(476, 87, 91, 40, groen)
          + felt(339, 264, 91, 40, blaa) + felt(430, 264, 91, 40, groen)],
      ],
    }, {
      navn: 'Ændringer i RNA’ets ender',
      dele: [
        ['5′-hætte', '5′-hætten beskytter RNA og hjælper blandt andet ribosomet med at finde mRNA ved translationsstart.', [314, 284], [-1, 285],
          oval(314, 284, 18, 18, lilla)],
        ['poly(A)-hale', 'Poly(A)-halen består af mange A-nukleotider, der sættes på 3′-enden. Den bidrager til mRNA’ets stabilitet.', [559, 284], [1, 283],
          felt(523, 268, 71, 32, pink) + tekst(559, 290, 'AAAA…')],
      ],
    }],
  },
  {
    id: 'translation', navn: 'Translation',
    intro: 'Ribosomet læser mRNA fra 5′ mod 3′. Figuren viser to tRNA’er, lige før den næste aminosyre føjes til kæden.',
    baggrund: streg('M275 238 H595', '#68894d', 6) + tekst(262, 243, '5′') + tekst(608, 243, '3′')
      + pil(345, 294, 528, 294) + tekst(430, 328, 'Ribosomets læseretning'),
    lag: [{
      navn: 'Ribosomet læser mRNA',
      dele: [
        ['ribosom', 'Ribosomet holder mRNA og tRNA på plads. Det katalyserer dannelsen af peptidbindinger.', [324, 186], [-1, 170],
          oval(419, 193, 111, 67, lilla) + oval(420, 257, 101, 19, '#c9b8e5')],
        ['startkodon', 'Startkodonet AUG fastlægger læserammen og koder for methionin.', [326, 238], [-1, 248],
          felt(291, 218, 70, 40, blaa) + tekst(326, 244, 'AUG')],
        ['stopkodon', 'Stopkodonet UAA genkendes af en frigivelsesfaktor. Det koder ikke for en aminosyre.', [552, 238], [1, 242],
          felt(517, 218, 70, 40, pink) + tekst(552, 244, 'UAA')],
      ],
    }, {
      navn: 'tRNA kobler kodon og aminosyre',
      dele: [
        ['tRNA', 'Et tRNA bærer en aminosyre og har et antikodon. Her vises tRNA’erne som enkle former.', [437, 155], [1, 135],
          streg('M326 110 V162 L306 180 H346 L326 162 M437 110 V162 L417 180 H457 L437 162', '#498c70', 7)],
        ['antikodon', 'Antikodonet 3′–CUU–5′ på tRNA’et baseparrer med mRNA-kodonet 5′–GAA–3′.', [437, 198], [1, 189],
          felt(402, 183, 70, 30, groen) + tekst(437, 204, 'CUU')
          + felt(291, 183, 70, 30, groen) + tekst(326, 204, 'UAC')
          + streg('M311 213 V219 M326 213 V219 M341 213 V219 M422 213 V219 M437 213 V219 M452 213 V219', blaek, 2, true)
          + felt(402, 218, 70, 40, gul) + tekst(437, 244, 'GAA')],
        ['aminosyre', 'Methionin (Met) og glutamat (Glu) er aminosyrer. Den viste korte sekvens giver kun et dipeptid.', [437, 90], [1, 65],
          oval(326, 90, 26, 19, pink) + tekst(326, 96, 'Met')
          + oval(437, 90, 26, 19, gul) + tekst(437, 96, 'Glu')],
      ],
    }],
  },
  {
    id: 'mutation', navn: 'Mutation',
    intro: 'Sammenlign de to versioner af samme kodende DNA-streng og deres mRNA. Hvad sker der med peptidet, når GAA bliver til UAA?',
    baggrund: tekst(430, 36, 'DNA → mRNA → peptid')
      + tekst(430, 82, 'Før: DNA 5′–ATG GAA TAA–3′')
      + tekst(430, 142, 'mRNA 5′–AUG GAA UAA–3′')
      + tekst(430, 181, 'Met–Glu')
      + streg('M292 207 H568', '#a6aeb7', 2, true)
      + tekst(430, 373, 'Met'),
    lag: [{
      navn: 'Fra ændring i DNA til ændret produkt',
      dele: [
        ['basesubstitution', 'G er erstattet af T i den midterste triplet på den kodende DNA-streng. Der er hverken fjernet eller indsat en base.', [453, 246], [-1, 242],
          felt(284, 227, 292, 38, blaa) + tekst(430, 252, 'Efter: DNA 5′–ATG TAA TAA–3′')],
        ['tidligt stopkodon', 'Mutationen giver UAA som det andet kodon i mRNA. Translationen stopper, inden glutamat kan føjes til.', [463, 316], [1, 312],
          felt(284, 297, 292, 38, pink) + tekst(430, 322, 'mRNA 5′–AUG UAA UAA–3′')],
      ],
    }],
  },
];

export const NOEGLE = 'byg-dna.v1';
const enzym = hent('enzym');
export const ORD = flet(Object.fromEntries(figurer.flatMap(({ lag }) => lag.flatMap(({ dele, ekstra = {} }) => [
  ...dele.map(([ord, tekst]) => [ord, { ord, tekst }]),
  ...Object.entries(ekstra).map(([ord, [tekst]]) => [ord, { ord, tekst }]),
]))), enzym.ord);

export const FIGURER = [...figurer.map(({ id, navn, intro, lag, baggrund }) => {
  const dele = lag.flatMap(l => l.dele);
  return {
    id, navn, intro, vb: [860, 400], boks: [226, 42], mobilBredde: 650,
    lag: lag.map(({ navn, dele, ekstra = {} }) => ({
      navn, ord: dele.map(([ord]) => ord), ekstra: Object.keys(ekstra),
      ekstraFejl: Object.fromEntries(Object.entries(ekstra).map(([ord, [, fejl]]) => [ord, fejl])),
    })),
    dele: [{ ord: null, svg: baggrund }, ...dele.map(([ord, , , , svg]) => ({ ord, svg }))],
    pladser: dele.map(([ord, , maal, [side, y], svg]) => ({
      ord, maal, x: 430 + side * 296, y, omr: svg,
    })),
  };
}), enzym.figur];
