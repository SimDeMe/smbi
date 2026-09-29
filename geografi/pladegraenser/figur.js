/* figur.js — rammen om de to figurer: tværsnittet og kortet set ovenfra.
   Målestok, dybdeakse, mærkater, pile, jordskælv og målepunktet deles
   af alle grænsetyperne, så de kan sammenlignes: samme målestok, samme
   farver og samme tegn på hver side.

   Tværsnittet har samme målestok som oversigterne i vulkanudbrud.html:
   2,6 px pr. km lodret og lodret overhøjde 3×. */

export const W = 640, H = 560;              // tværsnittet
export const KW = 360, KH = 560;            // kortet
export const INK = '#17211F';

export const Y0 = 112;                      // px — havniveau
export const PKM = 2.6;                     // px pr. km lodret
export const PX = PKM / 3;                  // px pr. km vandret
export const XC = 350;                      // px — pladegrænsen
export const yD = d => Y0 + d * PKM;
export const dY = y => (y - Y0) / PKM;
export const xK = X => XC + X * PX;         // X i km fra grænsen (+ mod højre)
export const kX = x => (x - XC) / PX;
export const X_MIN = kX(0), X_MAKS = kX(W);
export const D_MAKS = dY(H);

export const FARVE = {
  kappe: '#8A988A',                         // lithosfærisk kappe
  oceanskorpe: '#3F4B57',
  kontinent: '#B98F70',
  hav: '#86C9EC',
  magma: '#E4532A',
  normal: '#26303A', omvendt: '#D5DADF'     // havbundens magnetiske striber
};

// ── Baggrund ───────────────────────────────────────────
export function himmelOgKappe(c){
  const hg = c.createLinearGradient(0, 0, 0, Y0);
  hg.addColorStop(0, '#CFE9F7'); hg.addColorStop(1, '#F3FAFE');
  c.fillStyle = hg; c.fillRect(0, 0, W, Y0 + 1);
  // asthenosfæren: varm og plastisk — fylder alt under lithosfæren
  const ag = c.createLinearGradient(0, Y0, 0, H);
  ag.addColorStop(0, '#F2B98A'); ag.addColorStop(1, '#E48E58');
  c.fillStyle = ag; c.fillRect(0, Y0, W, H - Y0);
}

// Flade mellem to kurver: ovre(X) og nedre(X) giver dybder i km
export function flade(c, ovre, nedre, farve, X0 = X_MIN - 5, X1 = X_MAKS + 5){
  if (X1 <= X0) return;
  const skridt = Math.max(1, (X1 - X0) / 200);
  c.beginPath();
  for (let X = X0; X <= X1 + 1e-9; X += skridt) c.lineTo(xK(X), yD(ovre(X)));
  for (let X = X1; X >= X0 - 1e-9; X -= skridt) c.lineTo(xK(X), yD(nedre(X)));
  c.closePath(); c.fillStyle = farve; c.fill();
}
export function kurve(c, f, X0 = X_MIN - 5, X1 = X_MAKS + 5, bredde = 2, streg = []){
  if (X1 <= X0) return;
  const skridt = Math.max(1, (X1 - X0) / 200);
  c.save(); c.strokeStyle = INK; c.lineWidth = bredde; c.setLineDash(streg);
  c.beginPath();
  for (let X = X0; X <= X1 + 1e-9; X += skridt) c.lineTo(xK(X), yD(f(X)));
  c.stroke(); c.restore();
}

// ── Pile ───────────────────────────────────────────────
// En hvid pil i pladen, der peger i retningen a (radianer)
export function pladepil(c, x, y, a, farve = 'rgba(255,255,255,.82)', str = 1){
  c.save(); c.translate(x, y); c.rotate(a); c.scale(str, str);
  c.fillStyle = farve;
  c.beginPath(); c.moveTo(7, 0); c.lineTo(-4, -6); c.lineTo(-1, 0); c.lineTo(-4, 6); c.closePath(); c.fill();
  c.restore();
}
// Stor pil over pladen med blækkant, der viser retningen
export function retningspil(c, x, y, retning, lang = 46){
  c.save();
  c.translate(x, y); c.scale(retning, 1);
  c.fillStyle = '#FFF9EE'; c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-lang / 2, -4); c.lineTo(lang / 2 - 10, -4); c.lineTo(lang / 2 - 10, -9);
  c.lineTo(lang / 2, 0); c.lineTo(lang / 2 - 10, 9); c.lineTo(lang / 2 - 10, 4); c.lineTo(-lang / 2, 4);
  c.closePath(); c.fill(); c.stroke();
  c.restore();
}

// ── Dybdeakse og tekst ─────────────────────────────────
export function tegnDybdeakse(c){
  c.save();
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(30, yD(0)); c.lineTo(30, yD(150)); c.stroke();
  c.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace"; c.textBaseline = 'middle';
  for (let d = 0; d <= 150; d += 50){
    c.beginPath(); c.moveTo(25, yD(d)); c.lineTo(35, yD(d)); c.stroke();
    const w = d >= 100 ? 25 : d >= 10 ? 19 : 12;
    c.fillStyle = 'rgba(255,249,238,.9)'; c.fillRect(37, yD(d) - 7, w, 14);
    c.fillStyle = INK; c.fillText(String(d), 39, yD(d) + 0.5);
  }
  for (let d = 25; d < 150; d += 50){ c.beginPath(); c.moveTo(27, yD(d)); c.lineTo(33, yD(d)); c.stroke(); }
  c.translate(14, yD(75)); c.rotate(-Math.PI / 2); c.textAlign = 'center';
  c.fillText('DYBDE · km', 0, 0);
  c.restore();
}

export function tegnFodnote(c, tekst, x, side, y = H - 9){
  c.save();
  c.font = "600 9.5px 'IBM Plex Mono', ui-monospace, monospace";
  const w = c.measureText(tekst).width + 12;
  const x0 = side === 'right' ? x - w : side === 'center' ? x - w / 2 : x;
  c.fillStyle = 'rgba(23,33,31,.62)';
  c.beginPath(); c.roundRect(x0, y - 11, w, 16, 8); c.fill();
  c.fillStyle = '#FFF6E0'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText(tekst, x0 + 6, y + 0.5);
  c.restore();
}

// Mærkater i sidens stil: pille med blækkant, evt. med en streg ind til det, de peger på.
// bredde: lærredets bredde (tværsnit eller kort), venstre: mindste x (dybdeaksen)
export function tegnMaerkater(c, maerk, bredde = W, venstre = 44){
  c.save();
  const brugt = [];
  for (const m of maerk){
    c.font = "600 10.5px 'IBM Plex Mono', ui-monospace, monospace";
    const wT = c.measureText(m.tekst).width;
    const wE = m.enhed ? c.measureText(' ' + m.enhed).width : 0;
    const w = wT + wE + 14;
    const x = Math.max(w / 2 + venstre, Math.min(bredde - w / 2 - 3, m.x));
    let y = Math.max(19, Math.min(H - 24, m.y));
    while (brugt.some(b => Math.abs(b.y - y) < 20 && Math.abs(b.x - x) < (b.w + w) / 2 + 4)) y -= 21;
    brugt.push({ x, y, w });
    if (m.mod !== undefined){
      c.strokeStyle = m.kant || INK; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(m.modX ?? x, m.mod);
      c.lineTo(Math.max(x - w / 2, Math.min(x + w / 2, m.modX ?? x)), m.mod > y ? y + 5 : y - 14); c.stroke();
    }
    c.fillStyle = 'rgba(255,249,238,.95)';
    c.strokeStyle = m.kant || INK; c.lineWidth = m.kant ? 2 : 1.5;
    c.beginPath(); c.roundRect(x - w / 2, y - 14, w, 19, 9); c.fill(); c.stroke();
    c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText(m.tekst, x - w / 2 + 7, y - 1);
    if (m.enhed){ c.fillStyle = '#566B68'; c.fillText(' ' + m.enhed, x - w / 2 + 7 + wT, y - 1); }
  }
  c.restore();
}

// Lodret klamme med påskrift langs den — viser, hvad én plade består af
// (side = 1: klammen favner det, der ligger til højre for den; -1: til venstre)
export function klamme(c, x, y0, y1, tekst, side, yTekst = (y0 + y1) / 2){
  c.save();
  c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + 5 * side, y0 + 1); c.lineTo(x, y0 + 1); c.lineTo(x, y1 - 1); c.lineTo(x + 5 * side, y1 - 1);
  c.stroke();
  c.font = "600 9px 'IBM Plex Mono', ui-monospace, monospace";
  const w = c.measureText(tekst).width + 12;
  c.translate(x, yTekst); c.rotate(-Math.PI / 2);
  c.fillStyle = 'rgba(255,249,238,.95)'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(-w / 2, -7, w, 14, 7); c.fill(); c.stroke();
  c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(tekst, 0, 0.5);
  c.restore();
}

// ── Jordskælv ──────────────────────────────────────────
/* Tre dybder, tre former — farven er ikke det eneste signal:
     lavt (under 70 km)      ●  gul
     mellemdybt (70–300 km)  ■  orange
     dybt (over 300 km)      ◆  rød          */
export const SKAELV = [
  { navn: 'Lavt · under 70 km', form: 'cirkel', farve: '#FFD23F' },
  { navn: 'Mellemdybt · 70–300 km', form: 'firkant', farve: '#FF6A3D' },
  { navn: 'Dybt · over 300 km', form: 'rombe', farve: '#C21F4B' }
];
export const skaelvKlasse = d => d < 70 ? 0 : d < 300 ? 1 : 2;

export function skaelvTegn(c, x, y, d, alfa = 1, str = 1){
  const k = SKAELV[skaelvKlasse(d)], r = 4.2 * str;
  c.save();
  c.globalAlpha = alfa;
  c.fillStyle = k.farve; c.strokeStyle = INK; c.lineWidth = 1.3;
  c.beginPath();
  if (k.form === 'cirkel') c.arc(x, y, r, 0, 2 * Math.PI);
  else if (k.form === 'firkant') c.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8);
  else { c.moveTo(x, y - r * 1.2); c.lineTo(x + r * 1.2, y); c.lineTo(x, y + r * 1.2); c.lineTo(x - r * 1.2, y); c.closePath(); }
  c.fill(); c.stroke();
  c.restore();
}

// Et nyt jordskælv blinker med en ring, der breder sig
export function skaelvRing(c, x, y, alder){
  if (alder > 0.8) return;
  c.save();
  c.globalAlpha = 1 - alder / 0.8;
  c.strokeStyle = INK; c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, 5 + alder * 26, 0, 2 * Math.PI); c.stroke();
  c.restore();
}

// ── Målepunktet ────────────────────────────────────────
// Lodret stiplet linje fra overfladen og ned, med et greb foroven
export function tegnMaalepunkt(c, X, dTop, dBund){
  const x = xK(X);
  c.save();
  c.strokeStyle = '#7A4FD6'; c.lineWidth = 2;
  c.setLineDash([5, 4]);
  c.beginPath(); c.moveTo(x, yD(dTop)); c.lineTo(x, yD(dBund)); c.stroke();
  c.setLineDash([]);
  // grebet
  const y = Math.min(yD(dTop), Y0) - 30;
  c.fillStyle = '#FFF9EE'; c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x - 34, y - 11, 68, 20, 10); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x, y + 9); c.lineTo(x, yD(dTop)); c.stroke();
  c.fillStyle = INK; c.font = "700 9px 'IBM Plex Mono', ui-monospace, monospace";
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('◂ MÅL ▸', x, y - 0.5);
  c.beginPath(); c.arc(x, yD(dTop), 4, 0, 2 * Math.PI);
  c.fillStyle = '#7A4FD6'; c.fill(); c.stroke();
  c.restore();
}

// ── Kortet set ovenfra ─────────────────────────────────
/* Kortet har samme vandrette målestok som tværsnittet, bare trykket
   sammen til kortets bredde, og snitlinjen A–B går vandret over det. */
export const KY_SNIT = 300;                 // px — snitlinjen
export const KXC = XC * KW / W;             // pladegrænsen på kortet
export const kxK = X => KXC + X * PX * KW / W;
export const KPX = PX * KW / W;             // px pr. km på kortet

export function tegnSnitlinje(c){
  c.save();
  c.strokeStyle = INK; c.lineWidth = 2; c.setLineDash([7, 4]);
  c.beginPath(); c.moveTo(10, KY_SNIT); c.lineTo(KW - 10, KY_SNIT); c.stroke();
  c.setLineDash([]);
  c.font = "800 12px 'Archivo', system-ui, sans-serif"; c.textBaseline = 'middle'; c.textAlign = 'center';
  for (const [x, t] of [[14, 'A'], [KW - 14, 'B']]){
    c.fillStyle = '#FFF9EE'; c.beginPath(); c.arc(x, KY_SNIT, 10, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.fillStyle = INK; c.fillText(t, x, KY_SNIT + 0.5);
  }
  c.restore();
}

// Målestoksforhold på kortet: en stang på 'km' km (eller 'enhed')
export function tegnMaalestok(c, laengde, tekst, x = 16, y = KH - 16){
  c.save();
  c.font = "600 9.5px 'IBM Plex Mono', ui-monospace, monospace";
  c.fillStyle = 'rgba(255,249,238,.92)'; c.strokeStyle = INK; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(x - 6, y - 20, laengde + 22 + c.measureText(tekst).width, 28, 8); c.fill();
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, y); c.lineTo(x + laengde, y); c.lineTo(x + laengde, y - 5); c.stroke();
  c.font = "600 9.5px 'IBM Plex Mono', ui-monospace, monospace";
  c.fillStyle = INK; c.textBaseline = 'alphabetic';
  c.fillText(tekst, x + laengde + 8, y);
  c.restore();
}

export function kortOverskrift(c, tekst){
  c.save();
  c.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace";
  const w = c.measureText(tekst).width + 16;
  c.fillStyle = INK;
  c.beginPath(); c.roundRect(10, 10, w, 20, 10); c.fill();
  c.fillStyle = '#FFF6E0'; c.textBaseline = 'middle';
  c.fillText(tekst, 18, 20.5);
  c.restore();
}

// Takker langs en subduktions- eller kollisionsgrænse: de peger ind over
// den plade, der ligger øverst (side = +1: takkerne sidder på højre side)
export function takker(c, x, side, y0 = 0, y1 = KH, afst = 22){
  c.save();
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
  for (let y = y0 + afst / 2; y < y1; y += afst){
    c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + side * 9, y); c.lineTo(x, y + 6); c.closePath(); c.fill();
  }
  c.restore();
}

export function vulkanTegn(c, x, y, str = 1){
  c.save();
  c.fillStyle = '#E4532A'; c.strokeStyle = INK; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x, y - 7 * str); c.lineTo(x + 6.5 * str, y + 5 * str); c.lineTo(x - 6.5 * str, y + 5 * str); c.closePath();
  c.fill(); c.stroke();
  c.restore();
}

// ── Fælles for jordskælvene ────────────────────────────
/* Hver grænsetype har en funktion skaelv(ctx), der giver et nyt
   jordskælv { X, d, Y } (km fra grænsen, dybde i km, km langs grænsen
   på kortet). Skælvene lever nogle sekunder og blegner. */
export const SKAELV_LEVETID = 6;            // s på skærmen

export function tegnSkaelvSnit(c, liste){
  for (const s of liste){
    const x = xK(s.X), y = yD(s.d);
    if (x < 44 || x > W || y > H) continue;
    const a = Math.min(1, (SKAELV_LEVETID - s.alder) / 1.5);
    skaelvTegn(c, x, y, s.d, a);
    skaelvRing(c, x, y, s.alder);
  }
}
export function tegnSkaelvKort(c, liste, kyFraY){
  for (const s of liste){
    const x = kxK(s.X), y = kyFraY(s.Y);
    if (x < 0 || x > KW) continue;
    const a = Math.min(1, (SKAELV_LEVETID - s.alder) / 1.5);
    skaelvTegn(c, x, y, s.d, a, 0.85);
    skaelvRing(c, x, y, s.alder);
  }
}
