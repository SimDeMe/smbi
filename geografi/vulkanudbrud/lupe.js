/* lupe.js — magmaet set gennem en lup: et udsnit på ca. 5 mm.
   Samme fem billeder som grundbogens figur: smelte med krystaller og
   opløst gas, bobler der dannes, bobler der vokser, og til sidst gas
   med aske, når skummet er sprængt. Hvad der vises, regnes ud i
   model.js; her tegnes det bare. */

export const W = 360, H = 560;
const CX = 180, CY = 222, R = 146;
const INK = '#17211F';
const BREDDE_MM = 5;

// Fast tilfældighed, så lupen ser ens ud hver gang siden åbnes
function rng(frø){ return () => ((frø = (frø * 16807) % 2147483647) - 1) / 2147483646; }
const r = rng(4242);
const Y_SPAN = 2.7;                                   // elementerne går i ring lodret

const krystaller = Array.from({ length: 12 }, (_, i) => ({
  x: r() * 2 - 1, y: r() * Y_SPAN - Y_SPAN / 2, rot: r() * Math.PI,
  str: 0.1 + r() * 0.08, slags: i % 3 === 2 ? 'pyroxen' : 'plagioklas', tone: r()
}));
const vandprik = Array.from({ length: 120 }, () => ({ x: r() * 2 - 1, y: r() * Y_SPAN - Y_SPAN / 2, rang: r() }));
const bobler = Array.from({ length: 19 }, () => ({ x: r() * 1.9 - 0.95, y: r() * Y_SPAN - Y_SPAN / 2, s: 0.55 + r() * 0.9 }));
const SUM_S2 = bobler.reduce((a, b) => a + b.s * b.s, 0);
const skaar = Array.from({ length: 30 }, () => ({ x: r() * 2 - 1, y: r() * Y_SPAN - Y_SPAN / 2, rot: r() * 6.3, str: 0.06 + r() * 0.07 }));
const korn = Array.from({ length: 80 }, () => {
  const n = 5 + Math.floor(r() * 3), rr = 0.13 + r() * 0.14, x = r() * 2.3 - 1.15, y = r() * 2.3 - 1.15;
  const farver = ['#9C9791', '#C7A698', '#E6E1D8', '#55504B', '#B4AFA8'];
  return { x, y, farve: farver[Math.floor(r() * farver.length)],
           pkt: Array.from({ length: n }, (_, i) => { const a = i / n * 2 * Math.PI + r() * 0.5; const d = rr * (0.7 + r() * 0.5); return [x + Math.cos(a) * d, y + Math.sin(a) * d]; }) };
});

let rul = 0;                                          // hvor langt indholdet er strømmet forbi
export function stroem(ds){ rul += ds; }

const wrap = y => { let v = (y - rul + Y_SPAN / 2) % Y_SPAN; if (v < 0) v += Y_SPAN; return v - Y_SPAN / 2; };
const px = (x, y) => [CX + x * R, CY + y * R];

// ── Tilstandens navn og forklaring ─────────────────────
// l.slags: 'klippe' (størknet prop), 'plade' (den nedsynkende plade),
// 'delvis' (kappe, der er begyndt at smelte) eller 'magma'.
export function tekst(l, magma){
  if (l.slags === 'klippe') return { titel: 'Fast bjergart',
    brod: 'Kanalen er lukket af størknet magma fra sidste udbrud. Det nye magma venter nede i kammeret.' };
  if (l.slags === 'plade') return { titel: 'Den nedsynkende plade',
    brod: 'Mineralkorn fra havbundens skorpe. Vandet (de blå prikker) sidder bundet i mineralerne — det kom med ned fra havbunden.' };
  if (l.slags === 'delvis') return { titel: 'Delvis smeltning',
    brod: 'Kun en lille del af kappen smelter. Smelten sidder som tynde hinder mellem krystallerne og samler sig til basaltisk magma.' };
  const p = l.p, sejt = magma.fragmentering != null;
  if (p.fragmenteret) return { titel: 'Gas med aske',
    brod: `Boblerne fylder over ${Math.round(magma.fragmentering * 100)} %, og skummet sprænges. Tilbage er gas med aske — knuste boblevægge — og krystaller.` };
  if (p.gasandel <= 0) return { titel: 'Smelte med opløst gas',
    brod: `${magma.navn} magma: ca. ${magma.SiO2} % SiO₂, ${magma.T.toLocaleString('da-DK')} °C og ${magma.flyder}. Trykket er så højt, at alt vandet er opløst — der er ingen bobler.` };
  if (p.gasandel < 0.3) return { titel: 'Gasbobler dannes',
    brod: 'Trykket er faldet så meget, at smelten ikke kan holde på alt vandet. Resten går ud af opløsning som små gasbobler.' };
  return { titel: 'Boblerne vokser', brod: sejt
    ? `Jo lavere trykket bliver, jo mere udvider gassen sig. ${magma.navn} magma er så sejt, at boblerne ikke kan slippe ud — magmaet bliver til skum.`
    : 'Jo lavere trykket bliver, jo mere udvider gassen sig. Magmaet er så tyndtflydende, at boblerne kan stige op gennem det og slippe ud.' };
}

// ── Tegning ────────────────────────────────────────────
export function tegn(c, l, magma, zTekst){
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);

  // hoved
  c.fillStyle = '#5A6C69';
  c.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace";
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText('LUPEN · UDSNIT ' + BREDDE_MM + ' mm BREDT', 16, 24);
  c.fillStyle = INK;
  c.font = "800 22px 'Archivo', system-ui, sans-serif";
  c.fillText(zTekst, 16, 52);

  // selve udsnittet
  c.save();
  c.beginPath(); c.arc(CX, CY, R, 0, 2 * Math.PI); c.clip();
  if (l.slags === 'klippe') tegnKlippe(c, KLIPPE);
  else if (l.slags === 'plade') tegnKlippe(c, PLADE, true);
  else if (l.slags === 'delvis') tegnDelvis(c, magma);
  else if (l.p.fragmenteret) tegnAske(c);
  else tegnSmelte(c, l.p, magma);
  c.restore();
  c.lineWidth = 7; c.strokeStyle = '#FFF3DC';
  c.beginPath(); c.arc(CX, CY, R + 4.5, 0, 2 * Math.PI); c.stroke();
  c.lineWidth = 2.5; c.strokeStyle = INK;
  c.beginPath(); c.arc(CX, CY, R, 0, 2 * Math.PI); c.stroke();
  c.beginPath(); c.arc(CX, CY, R + 9, 0, 2 * Math.PI); c.stroke();

  // målestok: 1 mm
  const mm = 2 * R / BREDDE_MM, yS = CY + R + 30;
  c.lineWidth = 2; c.strokeStyle = INK;
  c.beginPath(); c.moveTo(CX - mm / 2, yS - 5); c.lineTo(CX - mm / 2, yS); c.lineTo(CX + mm / 2, yS); c.lineTo(CX + mm / 2, yS - 5); c.stroke();
  c.fillStyle = INK; c.textAlign = 'center';
  c.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace";
  c.fillText('1 mm', CX, yS + 14);

  // navn og forklaring
  const t = tekst(l, magma);
  c.textAlign = 'left';
  c.font = "800 20px 'Archivo', system-ui, sans-serif";
  c.fillText(t.titel, 16, 442);
  c.font = "14px 'Source Serif 4', Georgia, serif";
  c.fillStyle = '#3E4E4C';
  ombryd(c, t.brod, 16, 464, W - 32, 17.5);

  tegnForklaring(c, l);
}

const KLIPPE = { bund: '#8E8984', farver: ['#9C9791', '#C7A698', '#E6E1D8', '#55504B', '#B4AFA8'] };
const PLADE  = { bund: '#4C5A5E', farver: ['#5E6E66', '#7D8C78', '#3E4A50', '#A3B19A', '#6B7F86'] };
const KAPPE  = ['#9DBB62', '#7FA04E', '#566F45', '#C3D39A', '#6E8A58'];   // olivin og pyroxen

const tegnKorn = (c, k, farve, skala = 1) => {
  const cx = k.x, cy = k.y;
  c.beginPath();
  k.pkt.forEach(([x, y], i) => {
    const [X, Y] = px(cx + (x - cx) * skala, cy + (y - cy) * skala);
    if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
  });
  c.closePath(); c.fillStyle = farve; c.fill(); c.stroke();
};

function tegnKlippe(c, stil, medVand = false){
  c.fillStyle = stil.bund; c.fillRect(CX - R, CY - R, 2 * R, 2 * R);
  c.lineWidth = 1; c.strokeStyle = 'rgba(23,33,31,.55)';
  korn.forEach((k, i) => tegnKorn(c, k, stil.farver[i % stil.farver.length]));
  if (medVand){
    c.fillStyle = '#6FC3F0';
    for (const v of vandprik){
      if (v.rang > 0.5) continue;
      const [X, Y] = px(v.x, v.y);
      c.beginPath(); c.arc(X, Y, 2.2, 0, 2 * Math.PI); c.fill();
    }
  }
}

// Kappe, der er begyndt at smelte: tæt pakkede krystaller med smelte imellem
function tegnDelvis(c, magma){
  const [lys, moerk] = magma.farver;
  const g = c.createRadialGradient(CX - 40, CY - 50, 10, CX, CY, R * 1.1);
  g.addColorStop(0, lys); g.addColorStop(1, moerk);
  c.fillStyle = g; c.fillRect(CX - R, CY - R, 2 * R, 2 * R);
  c.fillStyle = '#1F4E8C';
  for (const v of vandprik){
    if (v.rang > 0.6) continue;
    const [X, Y] = px(v.x, v.y);
    c.beginPath(); c.arc(X, Y, 2, 0, 2 * Math.PI); c.fill();
  }
  c.lineWidth = 1.3; c.strokeStyle = INK;
  korn.forEach((k, i) => tegnKorn(c, k, KAPPE[i % KAPPE.length], 0.8));
}

function tegnSmelte(c, p, magma){
  const g = c.createRadialGradient(CX - 40, CY - 50, 10, CX, CY, R * 1.1);
  g.addColorStop(0, magma.farver[0]); g.addColorStop(1, magma.farver[1]);
  c.fillStyle = g; c.fillRect(CX - R, CY - R, 2 * R, 2 * R);

  // opløst vand: én prik pr. lille portion — færre, når vandet går over i boblerne
  const andel = p.oploest / magma.vandMaks;
  c.fillStyle = '#1F4E8C';
  for (const v of vandprik){
    if (v.rang >= andel) continue;
    const [X, Y] = px(v.x, wrap(v.y));
    c.beginPath(); c.arc(X, Y, 2, 0, 2 * Math.PI); c.fill();
  }

  tegnKrystaller(c, Math.round(krystaller.length * Math.min(1, magma.krystaller / 0.25)));

  // bobler: samlet areal = gasandelen. Først vægge, så indre — så smelter
  // bobler, der rører hinanden, sammen til én, ligesom i et rigtigt skum.
  if (p.gasandel > 0){
    const K = Math.sqrt(p.gasandel * 2 * Y_SPAN / (Math.PI * SUM_S2));
    const liste = bobler.map(b => { const [X, Y] = px(b.x, wrap(b.y)); return { X, Y, rr: Math.max(1.6, b.s * K * R) }; });
    c.fillStyle = '#7A3312';
    for (const b of liste){ c.beginPath(); c.arc(b.X, b.Y, b.rr + 1.8, 0, 2 * Math.PI); c.fill(); }
    for (const b of liste){
      const bg = c.createRadialGradient(b.X - b.rr * 0.35, b.Y - b.rr * 0.35, b.rr * 0.1, b.X, b.Y, b.rr);
      bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, '#B5DAEE');
      c.fillStyle = bg;
      c.beginPath(); c.arc(b.X, b.Y, b.rr, 0, 2 * Math.PI); c.fill();
    }
  }
}

function tegnKrystaller(c, n){
  c.lineWidth = 1.5; c.strokeStyle = INK;
  for (let i = 0; i < n; i++){
    const k = krystaller[i];
    const [X, Y] = px(k.x, wrap(k.y));
    const s = k.str * R;
    c.save(); c.translate(X, Y); c.rotate(k.rot);
    if (k.slags === 'plagioklas'){
      c.fillStyle = k.tone < 0.5 ? '#9FD3F0' : '#E8F4FA';
      c.beginPath(); c.rect(-s, -s * 0.28, 2 * s, s * 0.56);
    } else {
      c.fillStyle = k.tone < 0.5 ? '#7E9A6A' : '#8B7BB8';
      c.beginPath();
      for (let j = 0; j < 6; j++){ const a = j / 6 * 2 * Math.PI; c.lineTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55); }
      c.closePath();
    }
    c.fill(); c.stroke();
    c.restore();
  }
}

// Askekorn er stykker af boblevægge: trekanter med indadbuede sider
function skaarSti(c, s){
  c.beginPath();
  for (let j = 0; j < 3; j++){
    const a = j / 3 * 2 * Math.PI, b = (j + 1) / 3 * 2 * Math.PI, m = (a + b) / 2;
    const [x0, y0] = [Math.cos(a) * s, Math.sin(a) * s], [x1, y1] = [Math.cos(b) * s, Math.sin(b) * s];
    if (j === 0) c.moveTo(x0, y0);
    c.quadraticCurveTo(Math.cos(m) * s * 0.3, Math.sin(m) * s * 0.3, x1, y1);
  }
  c.closePath();
}

function tegnAske(c){
  const g = c.createRadialGradient(CX - 40, CY - 50, 10, CX, CY, R * 1.1);
  g.addColorStop(0, '#E4EAEE'); g.addColorStop(1, '#B9C4CB');
  c.fillStyle = g; c.fillRect(CX - R, CY - R, 2 * R, 2 * R);
  c.fillStyle = 'rgba(23,33,31,.35)';
  c.font = "700 30px 'Archivo', system-ui, sans-serif"; c.textAlign = 'center';
  c.fillText('Gas', CX, CY - R * 0.62);
  c.lineWidth = 1.4; c.strokeStyle = INK;
  for (const k of skaar){
    const [X, Y] = px(k.x, wrap(k.y));
    c.save(); c.translate(X, Y); c.rotate(k.rot);
    skaarSti(c, k.str * R);
    c.fillStyle = '#7F95A6'; c.fill(); c.stroke();
    c.restore();
  }
  tegnKrystaller(c, 5);
}

function ombryd(c, tekst, x, y, bredde, lh){
  let linje = '';
  for (const ord of tekst.split(' ')){
    const proeve = linje ? linje + ' ' + ord : ord;
    if (c.measureText(proeve).width > bredde && linje){ c.fillText(linje, x, y); y += lh; linje = ord; }
    else linje = proeve;
  }
  if (linje) c.fillText(linje, x, y);
}

// Signaturforklaring nederst — kun de ting, der kan ses i lupen lige nu
function tegnForklaring(c, l){
  const emner = l.slags === 'klippe'
    ? [['korn', 'Mineralkorn']]
    : l.slags === 'plade'
    ? [['korn', 'Mineralkorn'], ['bundet', 'Bundet vand']]
    : l.slags === 'delvis'
    ? [['olivin', 'Krystal'], ['smelte', 'Smelte'], ['vand', 'Opløst vand']]
    : l.p.fragmenteret
      ? [['aske', 'Askekorn (glas)'], ['krystal', 'Krystal'], ['gasflade', 'Gas']]
      : [['smelte', 'Smelte'], ['krystal', 'Krystal'], ['vand', 'Opløst vand'], ['boble', 'Gasboble']];
  c.save();
  c.font = "600 9.5px 'IBM Plex Mono', ui-monospace, monospace";
  c.textAlign = 'left'; c.textBaseline = 'middle';
  let x = 16, y = 540;
  for (const [ikon, navn] of emner){
    const w = 22 + c.measureText(navn.toUpperCase()).width + 16;
    if (x + w > W - 8){ x = 16; y += 20; }
    c.save(); c.translate(x + 7, y);
    c.lineWidth = 1.2; c.strokeStyle = INK;
    if (ikon === 'smelte'){ c.fillStyle = '#F07A2A'; c.fillRect(-7, -6, 14, 12); c.strokeRect(-7, -6, 14, 12); }
    if (ikon === 'krystal'){ c.fillStyle = '#9FD3F0'; c.fillRect(-7, -3, 14, 6); c.strokeRect(-7, -3, 14, 6); }
    if (ikon === 'bundet'){ c.fillStyle = '#6FC3F0'; c.beginPath(); c.arc(0, 0, 2.8, 0, 2 * Math.PI); c.fill(); }
    if (ikon === 'olivin'){ c.fillStyle = '#9DBB62'; c.beginPath(); c.moveTo(-7, 3); c.lineTo(-2, -6); c.lineTo(7, -3); c.lineTo(4, 6); c.closePath(); c.fill(); c.stroke(); }
    if (ikon === 'vand'){ c.fillStyle = '#1F4E8C'; c.beginPath(); c.arc(0, 0, 2.6, 0, 2 * Math.PI); c.fill(); }
    if (ikon === 'boble'){ c.fillStyle = '#D6ECF7'; c.beginPath(); c.arc(0, 0, 6, 0, 2 * Math.PI); c.fill(); c.stroke(); }
    if (ikon === 'aske'){ skaarSti(c, 7); c.fillStyle = '#7F95A6'; c.fill(); c.stroke(); }
    if (ikon === 'gasflade'){ c.fillStyle = '#CFD8DE'; c.fillRect(-7, -6, 14, 12); c.strokeRect(-7, -6, 14, 12); }
    if (ikon === 'korn'){ c.fillStyle = '#C7A698'; c.beginPath(); c.moveTo(-7, 3); c.lineTo(-2, -6); c.lineTo(7, -3); c.lineTo(4, 6); c.closePath(); c.fill(); c.stroke(); }
    c.restore();
    c.fillStyle = INK;
    c.fillText(navn.toUpperCase(), x + 20, y + 0.5);
    x += w;
  }
  c.restore();
}
