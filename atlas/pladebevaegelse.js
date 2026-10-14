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

// Et kort geografisk skridt i en given kompasretning giver pilens retning
// i den aktuelle projektion, også når kloden drejes eller står ved datolinjen.
function fremad([lon, lat], retning) {
  const f = lat * RAD, l = lon * RAD, a = retning * RAD, d = .25 * RAD;
  const f2 = Math.asin(Math.sin(f) * Math.cos(d) + Math.cos(f) * Math.sin(d) * Math.cos(a));
  const l2 = l + Math.atan2(Math.sin(a) * Math.sin(d) * Math.cos(f), Math.cos(d) - Math.sin(f) * Math.sin(f2));
  return [((l2 / RAD + 540) % 360) - 180, f2 / RAD];
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
  if (!data || (!valg.navne && !valg.bevaegelse)) return;
  const reference = data.find(p => p.id === valg.reference);
  if (!reference) return;
  const skala = projektion.scale(), [cx, cy] = projektion.translate();
  const optaget = [...undgaa];
  ctx.save();
  ctx.font = "600 12px 'Archivo', sans-serif";
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const p of data) {
    if (!synlig(p.punkt) || p.areal * skala * skala < 500) continue;
    const [x, y] = projektion(p.punkt);
    const tekst = valg.navne ? linjer(p.navn) : [];
    let pil = valg.bevaegelse && !p.usikker;
    const v = beregnBevaegelse(p.pol, reference.pol, p.punkt);
    if (!tekst.length && !pil) continue;
    const hastighed = formaterFart(v.fart);
    const tekstbredde = Math.max(0, ...tekst.map(t => ctx.measureText(t).width)) + 14;
    const w = Math.max(tekstbredde, pil ? ctx.measureText(hastighed).width + 14 : 0);
    const h = pil ? (tekst.length ? 84 : 62) : tekst.length * 15 + 10;
    let navney = y;
    let boks = { x: x - w / 2, y: y - (pil && tekst.length ? 49 : h / 2), w, h };
    const fri = b => !optaget.some(a => overlap(a, b)) &&
      b.x >= 0 && b.y >= 0 && b.x + b.w <= ctx.canvas.clientWidth && b.y + b.h <= ctx.canvas.clientHeight &&
      ![b.x, b.x + b.w].some(tx => [b.y, b.y + b.h].some(ty => Math.hypot(tx - cx, ty - cy) > skala - 5));
    // Bevar navnet, når en pil med hastighed ikke kan være der. Punktet
    // flyttes ikke for at få plads: det ville ændre den lokale hastighed.
    if (!fri(boks) && tekst.length) {
      pil = false;
      for (const forskydning of [0, -16, 16]) {
        navney = y + forskydning;
        boks = { x: x - tekstbredde / 2, y: navney - (tekst.length * 15 + 10) / 2,
          w: tekstbredde, h: tekst.length * 15 + 10 };
        if (fri(boks)) break;
      }
    }
    if (!fri(boks)) continue;
    optaget.push(boks);
    ctx.strokeStyle = '#fff9ee'; ctx.fillStyle = '#17211f'; ctx.lineWidth = 4;
    for (let i = 0; i < tekst.length; i++) {
      const ty = pil ? y - 38 + i * 15 : navney + (i - (tekst.length - 1) / 2) * 15;
      ctx.strokeText(tekst[i], x, ty); ctx.fillText(tekst[i], x, ty);
    }
    if (!pil) continue;
    ctx.font = "600 11px 'Archivo', sans-serif";
    ctx.strokeText(hastighed, x, y + 27); ctx.fillText(hastighed, x, y + 27);
    if (v.retning === null || v.fart < .05) {
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
    } else {
      const q = projektion(fremad(p.punkt, v.retning));
      const dx = q[0] - x, dy = q[1] - y, laengde = Math.hypot(dx, dy);
      if (laengde > 0) {
        const ux = dx / laengde, uy = dy / laengde;
        const a = [x - 16 * ux, y - 16 * uy], b = [x + 16 * ux, y + 16 * uy];
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b);
        ctx.moveTo(b[0] - 8 * ux + 5 * uy, b[1] - 8 * uy - 5 * ux);
        ctx.lineTo(...b); ctx.lineTo(b[0] - 8 * ux - 5 * uy, b[1] - 8 * uy + 5 * ux);
        ctx.strokeStyle = '#fff9ee'; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = '#6842a1'; ctx.lineWidth = 2.6; ctx.stroke();
      }
    }
    ctx.font = "600 12px 'Archivo', sans-serif";
  }
  ctx.restore();
}
