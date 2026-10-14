// Pladegrænser fra Bird (2003), model PB2002. Data dannes af
// data/pladegraenser.py; se README for kilde, licens og bearbejdning.
// Signaturen bruger både farve og linjeform, så typen kan skelnes uden farver.

export const SIGNATUR = {
  konstruktiv: { farve: '#c0182c', tekst: 'Konstruktiv', forklaring: 'pladerne bevæger sig fra hinanden (spredningsryg, riftzone)' },
  destruktiv: { farve: '#1d2b6b', tekst: 'Destruktiv', forklaring: 'pladerne bevæger sig mod hinanden. Tænderne sidder på den overliggende plade ved subduktion' },
  bevarende: { farve: '#08714c', tekst: 'Bevarende', forklaring: 'pladerne glider forbi hinanden (transformforkastning)' }
};

let data = null;

export async function hentPladegraenser() {
  if (data) return data;
  const svar = await fetch(new URL('./data/pladegraenser.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
  if (!svar.ok) throw new Error('Pladedata kunne ikke indlæses');
  const raa = await svar.json();
  const par = flad => {
    const punkter = [];
    for (let i = 0; i < flad.length; i += 2) punkter.push([flad[i], flad[i + 1]]);
    return punkter;
  };
  const linjer = { konstruktiv: [], destruktiv: [], bevarende: [] };
  const subduktion = [];
  for (const [bird, , overliggende, , flad] of raa.linjer) {
    const punkter = par(flad);
    linjer[raa.klasser[bird]].push(punkter);
    if (overliggende) subduktion.push({ punkter, side: overliggende });
  }
  if (!linjer.konstruktiv.length || !linjer.destruktiv.length) throw new Error('Pladedata er ufuldstændige');
  data = {
    linjer: Object.fromEntries(Object.entries(linjer).map(([klasse, liste]) =>
      [klasse, { type: 'MultiLineString', coordinates: liste }])),
    subduktion,
    orogener: { type: 'MultiPolygon', coordinates: raa.orogener.map(([, flad]) => [par(flad)]) }
  };
  return data;
}

let skravering = null;
function skraveringsmoenster(ctx) {
  if (skravering) return skravering;
  const felt = document.createElement('canvas');
  felt.width = felt.height = 8;
  const f = felt.getContext('2d');
  f.strokeStyle = '#5b4a3a80';
  f.lineWidth = 1.2;
  f.beginPath(); f.moveTo(0, 8); f.lineTo(8, 0); f.moveTo(-2, 2); f.lineTo(2, -2); f.moveTo(6, 10); f.lineTo(10, 6); f.stroke();
  skravering = ctx.createPattern(felt, 'repeat');
  return skravering;
}

// Tegnes efter landene og inden for globussens klipning.
export function tegnPladegraenser(ctx, sti, projektion, synlig, skala) {
  if (!data) return;
  const bredde = Math.max(1.6, Math.min(3, skala / 170));
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath(); sti(data.orogener);
  ctx.fillStyle = skraveringsmoenster(ctx); ctx.fill();
  ctx.setLineDash([3, 3]); ctx.strokeStyle = '#5b4a3aa0'; ctx.lineWidth = 1; ctx.stroke();

  // Bevarende: stiplet.
  ctx.beginPath(); sti(data.linjer.bevarende);
  ctx.setLineDash([5, 4]); ctx.strokeStyle = SIGNATUR.bevarende.farve; ctx.lineWidth = bredde; ctx.stroke();

  // Konstruktiv: dobbeltlinje (bred farvet linje med lys midte).
  ctx.setLineDash([]);
  ctx.beginPath(); sti(data.linjer.konstruktiv);
  ctx.strokeStyle = SIGNATUR.konstruktiv.farve; ctx.lineWidth = bredde * 2.2; ctx.stroke();
  ctx.strokeStyle = '#fff9ee'; ctx.lineWidth = bredde * .7; ctx.stroke();

  // Destruktiv: fuldt optrukket; subduktion får tænder på den overliggende plade.
  ctx.beginPath(); sti(data.linjer.destruktiv);
  ctx.strokeStyle = SIGNATUR.destruktiv.farve; ctx.lineWidth = bredde; ctx.stroke();
  ctx.fillStyle = SIGNATUR.destruktiv.farve;
  ctx.beginPath();
  const afstand = 15;
  const stoerrelse = bredde * 2.4;
  for (const { punkter, side } of data.subduktion) {
    let rest = afstand / 2;
    let forrige = null;
    for (const punkt of punkter) {
      const nu = synlig(punkt) ? projektion(punkt) : null;
      if (forrige && nu) {
        const dx = nu[0] - forrige[0];
        const dy = nu[1] - forrige[1];
        const laengde = Math.hypot(dx, dy);
        if (laengde > 0) {
          // Skærmens y peger nedad; venstre for retningen (dx, dy) er (dy, -dx),
          // set udefra som i Birds digitalisering.
          const nx = dy / laengde * side;
          const ny = -dx / laengde * side;
          const ex = dx / laengde;
          const ey = dy / laengde;
          for (let s = rest; s < laengde; s += afstand) {
            const x = forrige[0] + ex * s;
            const y = forrige[1] + ey * s;
            ctx.moveTo(x - ex * stoerrelse, y - ey * stoerrelse);
            ctx.lineTo(x + ex * stoerrelse, y + ey * stoerrelse);
            ctx.lineTo(x + nx * stoerrelse * 1.5, y + ny * stoerrelse * 1.5);
            ctx.closePath();
          }
          rest = (rest - laengde) % afstand;
          if (rest < 0) rest += afstand;
        }
      }
      forrige = nu;
    }
  }
  ctx.fill();
  ctx.restore();
}
