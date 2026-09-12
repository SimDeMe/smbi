// Butikken: biler og opgraderinger man kan købe for point, samt gemning
// af fremskridt i browserens localStorage.

const GEM_NOEGLE = 'smbi-bykoersel-v1';

export const BILER = [
  { id: 'starter', navn: 'Starteren', pris: 0, farve: '#5FB030', maxFart: 115, accel: 65, haandtering: 1.0, bremseEffekt: 1.0 },
  { id: 'hatchback', navn: 'Speedster', pris: 900, farve: '#0E86C8', maxFart: 145, accel: 80, haandtering: 1.12, bremseEffekt: 1.05 },
  { id: 'sport', navn: 'Ildfugl GT', pris: 2400, farve: '#E8336D', maxFart: 175, accel: 98, haandtering: 1.25, bremseEffekt: 1.15 },
  { id: 'super', navn: 'Kometen', pris: 5200, farve: '#FFB300', maxFart: 205, accel: 118, haandtering: 1.4, bremseEffekt: 1.3 },
];

export const OPGRADERINGER = [
  { id: 'motor', navn: 'Motor', beskrivelse: 'Højere tophastighed', maxNiveau: 3, prisPrNiveau: [350, 800, 1600], virkningPrNiveau: 0.08 },
  { id: 'daek', navn: 'Dæk', beskrivelse: 'Bedre håndtering i sving', maxNiveau: 3, prisPrNiveau: [300, 700, 1400], virkningPrNiveau: 0.09 },
  { id: 'bremser', navn: 'Bremser', beskrivelse: 'Kortere bremselængde', maxNiveau: 3, prisPrNiveau: [300, 650, 1300], virkningPrNiveau: 0.1 },
];

export function hentGemtTilstand() {
  try {
    const raa = localStorage.getItem(GEM_NOEGLE);
    if (!raa) return lavStandardTilstand();
    const t = JSON.parse(raa);
    return {
      point: typeof t.point === 'number' ? t.point : 0,
      ejedeBiler: Array.isArray(t.ejedeBiler) && t.ejedeBiler.length ? t.ejedeBiler : ['starter'],
      aktivBil: t.aktivBil || 'starter',
      opgraderinger: t.opgraderinger || { motor: 0, daek: 0, bremser: 0 },
    };
  } catch {
    return lavStandardTilstand();
  }
}

export function lavStandardTilstand() {
  return { point: 0, ejedeBiler: ['starter'], aktivBil: 'starter', opgraderinger: { motor: 0, daek: 0, bremser: 0 } };
}

export function gemTilstand(t) {
  try { localStorage.setItem(GEM_NOEGLE, JSON.stringify(t)); } catch { /* privat browsing e.l. */ }
}

export function beregnEffektiveStats(tilstand) {
  const bil = BILER.find(b => b.id === tilstand.aktivBil) || BILER[0];
  let motorFaktor = 1, daekFaktor = 1, bremseFaktor = 1;
  for (const [id, niveau] of Object.entries(tilstand.opgraderinger)) {
    const opg = OPGRADERINGER.find(o => o.id === id);
    if (!opg) continue;
    const faktor = 1 + niveau * opg.virkningPrNiveau;
    if (id === 'motor') motorFaktor = faktor;
    if (id === 'daek') daekFaktor = faktor;
    if (id === 'bremser') bremseFaktor = faktor;
  }
  return {
    maxFart: bil.maxFart * motorFaktor,
    accel: bil.accel * motorFaktor,
    haandtering: bil.haandtering * daekFaktor,
    bremseEffekt: bil.bremseEffekt * bremseFaktor,
    farve: bil.farve,
  };
}

export function koebBil(tilstand, bilId) {
  const bil = BILER.find(b => b.id === bilId);
  if (!bil || tilstand.ejedeBiler.includes(bilId) || tilstand.point < bil.pris) return false;
  tilstand.point -= bil.pris;
  tilstand.ejedeBiler.push(bilId);
  gemTilstand(tilstand);
  return true;
}

export function vaelgBil(tilstand, bilId) {
  if (!tilstand.ejedeBiler.includes(bilId)) return false;
  tilstand.aktivBil = bilId;
  gemTilstand(tilstand);
  return true;
}

export function koebOpgradering(tilstand, opgId) {
  const opg = OPGRADERINGER.find(o => o.id === opgId);
  const niveau = tilstand.opgraderinger[opgId] || 0;
  if (!opg || niveau >= opg.maxNiveau) return false;
  const pris = opg.prisPrNiveau[niveau];
  if (tilstand.point < pris) return false;
  tilstand.point -= pris;
  tilstand.opgraderinger[opgId] = niveau + 1;
  gemTilstand(tilstand);
  return true;
}
