// Dyrecellen: fælles perspektivillustration med fagord og interaktive lag.
import {illustration} from './dyrecelle-tegning.js';

const figur = {
  id: 'dyr',
  navn: 'Dyrecellen',
  intro: 'En dyrecelle skåret igennem. Den er eukaryot: DNA’et ligger i en kerne, og cellen er fuld af organeller med membran om.',
  vb: [1000, 640],
  lag: [
    { navn: 'Grundplanen', ord: ['cellemembran', 'cytoplasma', 'cellekerne'], ekstra: ['cellevaeg'],
      ekstraFejl: { cellevaeg: 'Dyreceller har ingen cellevæg. Det har planter, svampe og bakterier. Cellevæggen kommer igen på plantecellen.' } },
    { navn: 'Fra gen til protein', ord: ['kernemembran', 'ribosom', 'ruER', 'golgi'] },
    { navn: 'Energi, lipider og transport', ord: ['mitokondrie', 'glatER', 'vesikel'] },
  ],
  dele: illustration,
  // x, y: midten af ordets plads. maal: prikken ved det, ordet betegner.
  // omr: det gule felt om HELE det, pladsen handler om.
  pladser: [
    { ord: 'cellemembran', x: 100, y: 52, maal: [372, 72],
      omr: '',
      fejl: { cytoplasma: 'Cytoplasmaet er væsken inde i cellen. Pladsen peger på hinden, der går hele vejen rundt om cellen.',
              kernemembran: 'Kernemembranen sidder om kernen. Den her hinde går rundt om hele cellen.' } },
    { ord: 'mitokondrie', x: 100, y: 152, maal: [258, 188],
      omr: '',
      fejl: { golgi: 'Golgi-apparatet er stakken af flade, magenta sække. Pladsen peger på en aflang organel med folder indeni.',
              vesikel: 'Vesikler er små, runde blærer. Pladsen peger på en aflang organel med folder indeni.' } },
    { ord: 'cellekerne', x: 100, y: 236, maal: [352, 250],
      omr: '',
      fejl: { cytoplasma: 'Pladsen peger på den store, lilla organel midt i cellen, ikke på væsken omkring den.' } },
    { ord: 'glatER', x: 100, y: 330, maal: [222, 322],
      omr: '',
      fejl: { ruER: 'Se efter de små prikker: ribosomerne sidder kun på den ene slags ER. Her er der ingen.',
              golgi: 'Golgi-apparatet er den magenta stak af flade sække. Den her struktur er blågrøn og bølget og har ingen ribosomer.' } },
    { ord: 'kernemembran', x: 630, y: 612, maal: [420, 372],
      omr: '',
      fejl: { cellemembran: 'Cellemembranen går rundt om hele cellen. Den her dobbelte hinde går kun rundt om kernen.',
              cellekerne: 'Cellekernen er hele organellen. Pladsen spørger om den dobbelte hinde med huller i, der omgiver den.' } },
    { ord: 'cytoplasma', x: 400, y: 612, maal: [500, 520],
      omr: '',
      fejl: { cellemembran: 'Membranen er hinden yderst. Prikken sidder i væsken inde i cellen, hvor organellerne ligger.' } },
    { ord: 'ribosom', x: 900, y: 52, maal: [642, 100],
      omr: '',
      fejl: { ruER: 'Ru ER er de blå sække ved kernen med prikker på. Pladsen spørger om de små gule prikker, der ligger frit i cytoplasmaet.' } },
    { ord: 'ruER', x: 900, y: 152, maal: [588, 196],
      omr: '',
      fejl: { glatER: 'Se efter prikkerne: på de her buer sidder der ribosomer.',
              golgi: 'Golgi-apparatet er den magenta stak længere ude. Pladsen peger på de blå sække med prikker tæt ved kernen.' } },
    { ord: 'vesikel', x: 900, y: 290, maal: [756, 296],
      omr: '',
      fejl: { ribosom: 'Ribosomerne er de små prikker overalt i cytoplasmaet. Vesiklerne er de lidt større, lyserøde blærer ved Golgi-apparatet.' } },
    { ord: 'golgi', x: 900, y: 400, maal: [706, 398],
      omr: '',
      fejl: { ruER: 'Ru ER er de blå sække med ribosomer tæt ved kernen. Den her stak er magenta og uden prikker.' } },
  ],
};

// Prikker og gule markeringer følger de samme organeller som den færdige tegning.
const mål = {
 cellemembran:[372,104], mitokondrie:[300,387], cellekerne:[437,236],
 glatER:[334,317], kernemembran:[569,307],
 cytoplasma:[492,514], ribosom:[668,456], ruER:[685,219],
 vesikel:[752,354], golgi:[695,383]
};
for (const plads of figur.pladser) {
 plads.maal=mål[plads.ord];
 plads.omr=illustration.find(del=>del.ord===plads.ord).svg;
}
export default figur;
