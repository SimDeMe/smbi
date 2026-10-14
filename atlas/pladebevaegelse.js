// Lokale pladenavne og bevægelser fra Bird (2003), PB2002, tabel 1.
// Eulerpolerne i originalen er relative til Stillehavspladen. Ved valg af en
// anden reference trækkes rotationsvektorerne fra hinanden før v = ω × r.
const RAD = Math.PI / 180;
const RADIUS_CM = 6371 * 100000;

function rotationsvektor([lon, lat, fart]) {
  const w = fart * RAD / 1e6;
  return [w * Math.cos(lat * RAD) * Math.cos(lon * RAD),
    w * Math.cos(lat * RAD) * Math.sin(lon * RAD), w * Math.sin(lat * RAD)];
}

export function beregnBevaegelse(pol, reference, [lon, lat]) {
  const a = rotationsvektor(pol), b = rotationsvektor(reference);
  const [wx, wy, wz] = a.map((v, i) => v - b[i]);
  const l = lon * RAD, f = lat * RAD;
  const r = [Math.cos(f) * Math.cos(l), Math.cos(f) * Math.sin(l), Math.sin(f)];
  const v = [(wy * r[2] - wz * r[1]) * RADIUS_CM,
    (wz * r[0] - wx * r[2]) * RADIUS_CM, (wx * r[1] - wy * r[0]) * RADIUS_CM];
  const oest = -Math.sin(l) * v[0] + Math.cos(l) * v[1];
  const nord = -Math.sin(f) * Math.cos(l) * v[0] - Math.sin(f) * Math.sin(l) * v[1] + Math.cos(f) * v[2];
  const fart = Math.hypot(oest, nord);
  return { fart, nord, oest, retning: fart < 1e-9 ? null : (Math.atan2(oest, nord) / RAD + 360) % 360 };
}

export const formaterFart = fart => fart.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' cm/år';
export function formaterRetning(retning) {
  if (retning === null) return 'Står stille i den valgte reference';
  const ord = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
  return `${Math.round(retning)}° (${ord[Math.round(retning / 45) % 8]})`;
}

let data;
export async function hentPlader() {
  if (data) return data;
  const svar = await fetch(new URL('./data/plader.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
  if (!svar.ok) throw new Error('Pladenavne og bevægelser kunne ikke indlæses');
  const raa = await svar.json();
  const punkt = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
  if (raa.polreference !== 'PA' || raa.radiusKm !== 6371 || !Array.isArray(raa.plader) || raa.plader.length !== 52 ||
      new Set(raa.plader.map(p => p?.id)).size !== 52 ||
      !['EU', 'NA', 'PA', 'AF'].every(id => raa.plader.some(p => p?.id === id)) ||
      raa.plader.some(p => !p || !/^[A-Z]{2}$/.test(p.id) || typeof p.navn !== 'string' || !p.navn ||
        !punkt(p.punkt) || !Array.isArray(p.pol) || p.pol.length !== 3 || !punkt(p.pol.slice(0, 2)) ||
        !Number.isFinite(p.pol[2]) || p.pol[2] < 0 || p.pol[2] > 100 ||
        !Number.isFinite(p.areal) || p.areal <= 0 || p.areal > Math.PI * 2 || typeof p.usikker !== 'boolean')) {
    throw new Error('Ugyldige pladenavne eller rotationsdata');
  }
  data = raa.plader;
  return data;
}

function linjer(navn) {
  if (navn.endsWith(' Plade')) return [navn.slice(0, -6), 'Plade'];
  if (navn.length > 19 && navn.includes(' ')) {
    const i = navn.lastIndexOf(' ');
    return [navn.slice(0, i), navn.slice(i + 1)];
  }
  return [navn];
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function tegnPlader(ctx, projektion, synlig, valg, undgaa) {
  if (!data || !valg.navne) return;
  const skala = projektion.scale(), [cx, cy] = projektion.translate();
  const optaget = [...undgaa];
  ctx.save();
  ctx.font = "600 12px 'Archivo', sans-serif";
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const p of data) {
    if (!synlig(p.punkt) || p.areal * skala * skala < 500) continue;
    const [x, y] = projektion(p.punkt), tekst = linjer(p.navn);
    const w = Math.max(...tekst.map(t => ctx.measureText(t).width)) + 14, h = tekst.length * 15 + 10;
    const boks = [0, -16, 16].map(dy => ({ x: x - w / 2, y: y + dy - h / 2, w, h })).find(b =>
      b.x >= 0 && b.y >= 0 && b.x + w <= ctx.canvas.clientWidth && b.y + h <= ctx.canvas.clientHeight &&
      !optaget.some(a => overlap(a, b)) &&
      ![b.x, b.x + w].some(tx => [b.y, b.y + h].some(ty => Math.hypot(tx - cx, ty - cy) > skala - 5)));
    if (!boks) continue;
    optaget.push(boks);
    ctx.strokeStyle = '#fff9ee'; ctx.fillStyle = '#17211f'; ctx.lineWidth = 4;
    for (let i = 0; i < tekst.length; i++) {
      const ty = boks.y + h / 2 + (i - (tekst.length - 1) / 2) * 15;
      ctx.strokeText(tekst[i], x, ty); ctx.fillText(tekst[i], x, ty);
    }
  }
  ctx.restore();
}
