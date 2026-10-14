// Relative bevægelser ved pladegrænserne, direkte fra PB2002's tabel 2.
// Åbning/lukning er den samlede komponent på tværs, ikke halvspredning.
let data;
const KLASSER = ['OSR', 'CRB', 'SUB', 'OCB', 'CCB', 'OTF', 'CTF'];
export const erTransform = p => ['OTF', 'CTF'].includes(p.klasse);

export function formaterKomponent(cm) {
  const a = Math.abs(cm);
  return (a > 0 && a < .05 ? '<0,1' : a.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })) + ' cm/år';
}
export function tvaerstekst(cm) {
  return `${cm > 0 ? 'Fra' : cm < 0 ? 'Mod' : 'Tværs'} ${formaterKomponent(cm)}`;
}
export const hastighedstekst = p => (p.usikker ? '≈ ' : '') + (erTransform(p) ? `Langs ${formaterKomponent(p.langs)}` : tvaerstekst(p.aabning));

export async function hentGraensehastigheder() {
  if (data) return data;
  const svar = await fetch(new URL('./data/graensehastigheder.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
  if (!svar.ok) throw new Error('Grænsehastigheder kunne ikke indlæses');
  const raa = await svar.json();
  if (!raa || raa.enhed !== 'mm/år' || raa.kildetrin !== 5819 || !Array.isArray(raa.punkter) || raa.punkter.length !== 1937 ||
      new Set(raa.punkter.map(p => p?.[0])).size !== raa.punkter.length ||
      raa.punkter.some(p => !Array.isArray(p) || p.length !== 10 || !Number.isInteger(p[0]) || p[0] < 1 || p[0] > 5819 ||
        typeof p[1] !== 'string' || !/^[A-Z]{2}[-/\\][A-Z]{2}$/.test(p[1]) || !KLASSER.includes(p[2]) || ![0, 1].includes(p[3]) ||
        !p.slice(4).every(Number.isFinite) || Math.abs(p[4]) > 180 || Math.abs(p[5]) > 90 || p[6] < 0 || p[6] > 360 ||
        Math.abs(p[7]) > 500 || Math.abs(p[8]) > 500 || p[9] <= 0) ||
      !KLASSER.every(k => raa.punkter.some(p => p[2] === k))) throw new Error('Ugyldige grænsehastigheder');
  data = raa.punkter.map(p => ({ trin: p[0], graense: p[1], klasse: p[2], usikker: !!p[3],
    hypotetisk: p[1].includes('SL'), punkt: p.slice(4, 6), azimut: p[6], aabning: p[7] / 10, langs: p[8] / 10, prioritet: p[9] }));
  return data;
}

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const RAD = Math.PI / 180;
function fremad([lon, lat], retning) {
  const f = lat * RAD, l = lon * RAD, a = retning * RAD, d = .25 * RAD;
  const f2 = Math.asin(Math.sin(f) * Math.cos(d) + Math.cos(f) * Math.sin(d) * Math.cos(a));
  return [((l + Math.atan2(Math.sin(a) * Math.sin(d) * Math.cos(f), Math.cos(d) - Math.sin(f) * Math.sin(f2))) / RAD + 540) % 360 - 180, f2 / RAD];
}

// Returnér de optagne felter, så pladenavnene også undgår hastighederne.
export function tegnGraensehastigheder(ctx, projektion, synlig, undgaa) {
  if (!data) return [];
  const optaget = [...undgaa], tegnede = [];
  const [cx, cy] = projektion.translate(), skala = projektion.scale();
  const fri = b => b.x >= 2 && b.y >= 2 && b.x + b.w <= ctx.canvas.clientWidth - 2 && b.y + b.h <= ctx.canvas.clientHeight - 2 &&
    !optaget.some(a => overlap(a, b)) &&
    ![b.x, b.x + b.w].some(x => [b.y, b.y + b.h].some(y => Math.hypot(x - cx, y - cy) > skala - 5));
  const enhedsvektor = (p, azimut) => {
    const a = projektion(p), b = projektion(fremad(p, azimut));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return l > 0 ? [(b[0] - a[0]) / l, (b[1] - a[1]) / l] : [0, 0];
  };
  const pil = (x, y, ux, uy, fra, til) => {
    ctx.moveTo(x + ux * fra, y + uy * fra); ctx.lineTo(x + ux * til, y + uy * til);
    const fortegn = Math.sign(til - fra);
    ctx.moveTo(x + ux * (til - fortegn * 5) + uy * 3, y + uy * (til - fortegn * 5) - ux * 3);
    ctx.lineTo(x + ux * til, y + uy * til);
    ctx.lineTo(x + ux * (til - fortegn * 5) - uy * 3, y + uy * (til - fortegn * 5) + ux * 3);
  };
  ctx.save();
  ctx.font = "600 12px 'Archivo', sans-serif";
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // Lange, sammenhængende stykker foretrækkes. Korte kan komme frem efter
  // zoom/rotation, men der opfindes ingen gennemsnitshastighed for grænsen.
  const rangerede = data.filter(p => !p.hypotetisk && synlig(p.punkt)).map(p => {
    const [x, y] = projektion(p.punkt);
    return { p, x, y, prioritet: Math.log1p(p.prioritet) * (1 - Math.hypot(x - cx, y - cy) / skala) };
  }).sort((a, b) => b.prioritet - a.prioritet);
  // Giv alle tre bevægelsestyper plads, før en tæt række af transformstykker
  // kan optage hele figuren og skjule den tilstødende spredningsryg.
  const grupper = [['OSR', 'CRB'], ['SUB', 'OCB', 'CCB'], ['OTF', 'CTF']]
    .map(klasser => rangerede.filter(({ p }) => klasser.includes(p.klasse)));
  function tegnPunkt({ p, x, y }) {
    if (tegnede.some(t => Math.hypot(t.x - x, t.y - y) < (t.graense === p.graense ? 110 : 75))) return false;
    const pileboks = { x: x - 22, y: y - 22, w: 44, h: 44 };
    if (!fri(pileboks)) return false;
    const tekst = hastighedstekst(p), w = ctx.measureText(tekst).width + 14, h = 24;
    const boks = [{ x: x + 27, y: y - h / 2, w, h }, { x: x - 27 - w, y: y - h / 2, w, h },
      { x: x - w / 2, y: y + 27, w, h }, { x: x - w / 2, y: y - 27 - h, w, h }].find(fri);
    if (!boks) return false;
    optaget.push(pileboks, boks); tegnede.push({ x, y, graense: p.graense });
    const [nx, ny] = enhedsvektor(p.punkt, p.azimut + 90);
    const [tx, ty] = enhedsvektor(p.punkt, p.azimut);
    ctx.beginPath();
    if (erTransform(p) && Math.abs(p.langs) >= .05) {
      const f = Math.sign(p.langs);
      pil(x - nx * 7, y - ny * 7, tx, ty, -f * 12, f * 12);
      pil(x + nx * 7, y + ny * 7, tx, ty, f * 12, -f * 12);
    } else if (!erTransform(p) && Math.abs(p.aabning) >= .05) {
      const aabner = p.aabning > 0;
      pil(x, y, nx, ny, aabner ? 4 : 18, aabner ? 18 : 4);
      pil(x, y, -nx, -ny, aabner ? 4 : 18, aabner ? 18 : 4);
    }
    ctx.strokeStyle = '#fff9ee'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = '#6842a1'; ctx.lineWidth = 2; ctx.stroke();
    // En kort henvisningslinje og prik knytter tallet til det rigtige
    // kildepunkt, selv når etiketten står på den ene side af grænsen.
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(Math.max(boks.x, Math.min(x, boks.x + w)), Math.max(boks.y, Math.min(y, boks.y + h)));
    ctx.strokeStyle = '#6842a1'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 2, 0, 2 * Math.PI); ctx.fillStyle = '#6842a1'; ctx.fill();
    ctx.beginPath(); ctx.roundRect(boks.x, boks.y, w, h, 4);
    ctx.fillStyle = '#fff9ee'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#17211f'; ctx.fillText(tekst, boks.x + w / 2, boks.y + h / 2);
    return true;
  }
  const iteratorer = grupper.map(g => g[Symbol.iterator]());
  let flere = true;
  while (flere) {
    flere = false;
    for (const iterator of iteratorer) {
      for (let naeste = iterator.next(); !naeste.done; naeste = iterator.next()) {
        flere = true;
        if (tegnPunkt(naeste.value)) break;
      }
    }
  }
  ctx.restore();
  return optaget.slice(undgaa.length);
}
