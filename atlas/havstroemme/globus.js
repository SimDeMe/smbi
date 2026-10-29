// Globussen fra cirkulationsmodellen (D3's ortografiske projektion på Canvas
// 2D, mørk «natkort»-stil), her med havstrømme i stedet for vind: partikelspor
// farvet efter varm/kold, vinden ved jorden som pile, hvirvlerne,
// transportbåndet og flaskepost, der driver med strømmen.
import { STROEMME, HVIRVLER, BAAND, fart, modRetning, TYPENAVN } from './model.js';
import { vind } from '../cirkulation/model.js';
import { KLASSER, klasseFor } from './havtemperatur.js';

const RAD = Math.PI / 180;
export const FARVER = { varm: '#ff9a76', kold: '#7cc8ff', blandet: '#d7e8cc' };
const VINDFARVE = '#f6e7b8';
const ANTAL = 1100;

export function lavGlobus(canvas, land, felt, tilstand) {
  const d3 = window.d3;
  const ctx = canvas.getContext('2d');
  const spor = document.createElement('canvas');
  const sctx = spor.getContext('2d');
  const proj = d3.geoOrthographic().precision(0.5);
  const sti = d3.geoPath(proj, ctx);
  const gradnet = d3.geoGraticule10();
  let bredde = 0, hoejde = 0, dpr = 1;
  let centrum = [-40, 25];
  let maal = null;

  const synlig = p => d3.geoDistance(p, centrum) < Math.PI / 2 - 0.02;
  function nyPartikel(start) {
    let p = felt.startpunkt();
    for (let i = 0; i < 12 && d3.geoDistance(p, centrum) > 1.45; i++) p = felt.startpunkt();
    return { lon: p[0], lat: p[1], alder: start ? Math.random() * 4 : 0, levetid: 3 + Math.random() * 4 };
  }
  const partikler = Array.from({ length: ANTAL }, () => nyPartikel(true));
  const flasker = [];

  function tilpas() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    bredde = r.width; hoejde = r.height;
    for (const c of [canvas, spor]) { c.width = Math.round(bredde * dpr); c.height = Math.round(hoejde * dpr); }
    // Plads til overskrift og signatur over og under.
    const radius = Math.max(60, Math.min((bredde - 40) / 2, (hoejde - 92) / 2));
    proj.translate([bredde / 2, hoejde / 2 - 2]).scale(radius);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rydSpor() { sctx.clearRect(0, 0, bredde, hoejde); }
  function drej(dl, db) {
    centrum = [((centrum[0] + dl + 540) % 360) - 180, Math.max(-70, Math.min(70, centrum[1] + db))];
    maal = null;
    rydSpor();
  }
  function flyvTil(lon, lat) { maal = [lon, lat]; }

  // Flytter et punkt med strømmen; k er grader pr. fartenhed.
  function flyt(p, k) {
    const w = felt.stroem(p.lon, p.lat);
    p.lat = Math.max(-85, Math.min(85, p.lat + w.v * k));
    p.lon += w.u * k / Math.max(0.15, Math.cos(p.lat * RAD));
    if (p.lon > 180) p.lon -= 360; else if (p.lon < -180) p.lon += 360;
    return w;
  }

  function trin(dt, t) {
    const s = tilstand();
    if (maal) {
      const dl = ((maal[0] - centrum[0] + 540) % 360) - 180, db = maal[1] - centrum[1];
      const k = Math.min(1, dt * 3 || 1);
      centrum = [centrum[0] + dl * k, centrum[1] + db * k];
      if (Math.abs(dl) < 0.2 && Math.abs(db) < 0.2) maal = null;
      rydSpor();
    }
    proj.rotate([-centrum[0], -centrum[1]]);

    // Strømspor: falm det gamle, tegn nye stykker.
    sctx.globalCompositeOperation = 'destination-out';
    sctx.fillStyle = `rgba(0,0,0,${s.pause ? 0 : Math.min(0.5, dt * 3)})`;
    sctx.fillRect(0, 0, bredde, hoejde);
    sctx.globalCompositeOperation = 'source-over';
    if (!s.pause) {
      const stier = { varm: new Path2D(), kold: new Path2D(), blandet: new Path2D() };
      for (let i = 0; i < partikler.length; i++) {
        const p = partikler[i];
        p.alder += dt;
        if (p.alder > p.levetid || !synlig([p.lon, p.lat])) { partikler[i] = nyPartikel(false); continue; }
        const a = proj([p.lon, p.lat]);
        const w = flyt(p, 7 * dt);
        if (fart(w) < 0.04 || felt.erLand(p.lon, p.lat) || !synlig([p.lon, p.lat])) { p.alder = 99; continue; }
        const b = proj([p.lon, p.lat]);
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 30) continue;
        const hvem = felt.hvem(p.lon, p.lat);
        const sti = stier[hvem ? hvem.type : 'blandet'];
        sti.moveTo(a[0], a[1]); sti.lineTo(b[0], b[1]);
      }
      sctx.lineWidth = 1.3; sctx.lineCap = 'round'; sctx.globalAlpha = s.baand ? 0.35 : 0.85;
      for (const [k, sti] of Object.entries(stier)) { sctx.strokeStyle = FARVER[k]; sctx.stroke(sti); }
      sctx.globalAlpha = 1;
    }

    // Flaskepost driver langsommere og strander på land.
    for (const f of flasker) {
      if (s.pause || f.strandet) continue;
      flyt(f, 2.2 * dt);
      f.alder += dt;
      if (felt.erLand(f.lon, f.lat)) f.strandet = true;
      const sidste = f.spor[f.spor.length - 1];
      if (d3.geoDistance(sidste, [f.lon, f.lat]) > 0.01) f.spor.push([f.lon, f.lat]);
      if (f.spor.length > 900) f.spor.shift();
    }
    for (let i = flasker.length - 1; i >= 0; i--) if (flasker[i].alder > 90) flasker.splice(i, 1);

    tegn(s, t);
  }

  function tegn(s, t) {
    if (!bredde || !hoejde) return; // Skjult eller endnu ikke målt.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, bredde, hoejde);
    const [cx, cy] = proj.translate(), r = proj.scale();

    // Rolige kortprikker i det mørke felt og en svag glorie om kloden.
    ctx.fillStyle = '#7dada01a';
    for (let x = 17; x < bredde; x += 28) for (let y = 19; y < hoejde; y += 28) { ctx.beginPath(); ctx.arc(x, y, 0.65, 0, 7); ctx.fill(); }
    const glorie = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.17);
    glorie.addColorStop(0, '#74d9b900'); glorie.addColorStop(0.65, '#74d9b91a'); glorie.addColorStop(1, '#74d9b900');
    ctx.fillStyle = glorie; ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);

    ctx.save();
    ctx.beginPath(); sti({ type: 'Sphere' }); ctx.clip();
    const hav = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    hav.addColorStop(0, '#2c5f70'); hav.addColorStop(0.55, '#1f4655'); hav.addColorStop(1, '#122f3c');
    ctx.fillStyle = hav; ctx.fillRect(0, 0, bredde, hoejde);
    if (s.havtemp && s.sst) havtemperatur(s.sst, cx, cy, r);

    // Med havtemperaturen bliver land mørkt, så det ikke forveksles med de lyse klasser.
    ctx.beginPath(); sti(land); ctx.fillStyle = s.havtemp && s.sst ? '#3e4a42' : '#7f8f72'; ctx.fill();
    ctx.strokeStyle = '#bcc5a05c'; ctx.lineWidth = 0.55; ctx.stroke();

    // Gradnet, ækvator og vendekredsene.
    ctx.beginPath(); sti(gradnet); ctx.strokeStyle = '#d5e4cc16'; ctx.lineWidth = 0.6; ctx.stroke();
    for (const lat of [-23.44, 0, 23.44]) {
      ctx.beginPath(); sti({ type: 'LineString', coordinates: Array.from({ length: 91 }, (_, i) => [-180 + i * 4, lat]) });
      ctx.setLineDash(lat === 0 ? [2, 4] : [1, 5]);
      ctx.strokeStyle = lat === 0 ? '#d7e8cc65' : '#d7e8cc30'; ctx.lineWidth = 0.8; ctx.stroke();
    }
    ctx.setLineDash([]);

    // Fremhævede strømme fra trinene glødende under sporene.
    const fh = s.fremhaev || [];
    for (const strom of STROEMME) {
      if (!fh.includes(strom.navn)) continue;
      const linje = { type: 'LineString', coordinates: strom.punkter };
      for (const [w, a] of [[16, 0.12], [7, 0.2]]) {
        ctx.beginPath(); sti(linje); ctx.strokeStyle = FARVER[strom.type]; ctx.globalAlpha = a; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Skygge mod nattesiden.
    const skygge = ctx.createRadialGradient(cx - r * 0.42, cy - r * 0.4, r * 0.1, cx + r * 0.28, cy + r * 0.1, r * 1.25);
    skygge.addColorStop(0, '#0b202400'); skygge.addColorStop(0.6, '#081b2220'); skygge.addColorStop(1, '#06181dbb');
    ctx.fillStyle = skygge; ctx.fillRect(0, 0, bredde, hoejde);

    // Strømspor. På pause vises faste pile, så strømmen kan aflæses.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(spor, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    optaget = [];
    if (s.pause) pile(s);
    if (s.vind) vindpile(s);
    if (s.hvirvler) hvirvler(s, t);
    if (s.baand) baand(t);
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.strokeStyle = '#b5dac060'; ctx.lineWidth = 1; ctx.stroke();

    if (s.etiketter) etiketter(s);

    // Flaskepost med sit spor.
    for (const f of flasker) {
      ctx.save(); ctx.beginPath(); sti({ type: 'Sphere' }); ctx.clip();
      ctx.beginPath(); sti({ type: 'LineString', coordinates: f.spor });
      ctx.setLineDash([2, 2]); ctx.strokeStyle = '#ffe3a1'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      if (!synlig([f.lon, f.lat])) continue;
      const [x, y] = proj([f.lon, f.lat]);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6);
      ctx.fillStyle = '#9ee0c0cc'; ctx.strokeStyle = '#effff5'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-8, -3.5, 12, 7, 3); ctx.fill(); ctx.stroke();
      ctx.fillRect(4, -1.8, 4, 3.6);
      ctx.fillStyle = '#c58b4f'; ctx.fillRect(8, -2, 2.4, 4);
      ctx.fillStyle = '#fff6dc'; ctx.fillRect(-5, -1.3, 7, 2.6);
      ctx.restore();
      if (f.strandet) maerke(f.lon, f.lat - 3, 'STRANDET', '#ffe3a1', true);
    }
  }

  // Havtemperaturen: hver pixel på et groft lærred slås baglæns op i gitteret
  // (omvendt ortografisk projektion) og skaleres op. Gentegnes kun, når
  // globussen er drejet eller har skiftet størrelse.
  const temp = document.createElement('canvas'), tctx = temp.getContext('2d');
  let tempNoegle = '';
  function havtemperatur(sst, cx, cy, r) {
    const trin = Math.max(1.5, r / 160), n = Math.ceil(2 * r / trin);
    const noegle = `${centrum[0].toFixed(2)},${centrum[1].toFixed(2)},${r},${n}`;
    if (noegle !== tempNoegle) {
      tempNoegle = noegle;
      temp.width = temp.height = n;
      const billede = tctx.createImageData(n, n), px = billede.data;
      const [l0, b0] = centrum, sb = Math.sin(b0 * RAD), cb = Math.cos(b0 * RAD);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const X = (i + 0.5) / n * 2 - 1, Y = 1 - (j + 0.5) / n * 2, rr = X * X + Y * Y;
        if (rr >= 1) continue;
        const Z = Math.sqrt(1 - rr);
        const lat = Math.asin(Y * cb + Z * sb) / RAD;
        const lon = l0 + Math.atan2(X, -Y * sb + Z * cb) / RAD;
        const t = sst.temperatur(lon, lat);
        if (t === null) continue;
        const [rd, g, b] = KLASSER[klasseFor(t)].rgb, k = (j * n + i) * 4;
        px[k] = rd; px[k + 1] = g; px[k + 2] = b; px[k + 3] = 255;
      }
      tctx.putImageData(billede, 0, 0);
    }
    ctx.globalAlpha = 0.72; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(temp, cx - r, cy - r, 2 * r, 2 * r);
    ctx.globalAlpha = 1;
  }

  // Faste strømpile langs hver strøm (på pause og ved reduceret bevægelse).
  function pile() {
    for (const strom of STROEMME) {
      const farve = FARVER[strom.type];
      for (let i = 0; i < strom.punkter.length - 1; i++) {
        const a0 = strom.punkter[i], b0 = strom.punkter[i + 1];
        if (!synlig(a0) || !synlig(b0)) continue;
        const a = proj(a0), b = proj(b0);
        ctx.strokeStyle = farve; ctx.fillStyle = farve; ctx.lineWidth = 1 + strom.fart * 1.4; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
        if (i % 2 === 0 || i === strom.punkter.length - 2) pilespids(b, Math.atan2(b[1] - a[1], b[0] - a[0]), 5);
      }
    }
    ctx.globalAlpha = 1;
  }
  function pilespids([x, y], vinkel, l) {
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - l * Math.cos(vinkel - 0.5), y - l * Math.sin(vinkel - 0.5));
    ctx.lineTo(x - l * Math.cos(vinkel + 0.5), y - l * Math.sin(vinkel + 0.5)); ctx.fill();
  }

  // Vinden ved jorden fra cirkulationsmodellen (jævndøgn, uden kontinenter):
  // passat mod vest, vestenvind mod øst – samme retning som strømmene.
  function vindpile(s) {
    const staerk = (s.fremhaev || []).includes('vind');
    ctx.strokeStyle = VINDFARVE; ctx.fillStyle = VINDFARVE; ctx.lineWidth = staerk ? 1.6 : 1.1;
    ctx.globalAlpha = staerk ? 0.85 : 0.55;
    for (let lat = -67.5; lat <= 67.5; lat += 15) for (let lon = -180; lon < 180; lon += 15) {
      const p = [lon + (Math.abs(lat) % 30 ? 7.5 : 0), lat];
      if (!synlig(p) || felt.erLand(...p)) continue;
      const w = vind(lat, p[0], 4, { rotation: 1, kontinenter: 0 }), f = Math.hypot(w.u, w.v);
      if (f < 0.8) continue;
      const k = 4.2 / f;
      const q = [p[0] + w.u * k / Math.max(0.2, Math.cos(lat * RAD)), lat + w.v * k];
      if (!synlig(q)) continue;
      const a = proj(p), b = proj(q);
      // Vindpil med fjer, så den ikke forveksles med strømsporene.
      ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      ctx.setLineDash([]);
      pilespids(b, Math.atan2(b[1] - a[1], b[0] - a[0]), 5);
    }
    ctx.globalAlpha = 1;
  }

  // Hvirvlerne: en ellipse af pile om hvert centrum, der løber rundt.
  function hvirvler(s, t) {
    const staerk = (s.fremhaev || []).includes('hvirvler');
    for (const h of HVIRVLER) {
      const punkt = a => [h.centrum[0] + h.rx * Math.cos(a), h.centrum[1] + h.ry * Math.sin(a)];
      // Med uret set ovenfra: vinklen aftager (øst = 0, nord = π/2).
      const retning = h.medUret ? -1 : 1;
      ctx.strokeStyle = '#f3e9c8'; ctx.lineWidth = staerk ? 2.4 : 1.6; ctx.globalAlpha = staerk ? 0.7 : 0.45;
      ctx.setLineDash([7, 6]); ctx.lineDashOffset = -t * 14;
      ctx.beginPath();
      let i = false;
      for (let a = 0; a <= 2 * Math.PI + 0.01; a += 0.08) {
        const p = punkt(retning * a);
        if (!synlig(p)) { i = false; continue; }
        const [x, y] = proj(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); i = true;
      }
      ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      ctx.fillStyle = '#f3e9c8';
      for (let k = 0; k < 4; k++) {
        const a = retning * (k * Math.PI / 2 + 0.4 + (t * 0.25) % (Math.PI / 2));
        const p = punkt(a), q = punkt(a + retning * 0.05);
        if (!synlig(p) || !synlig(q)) continue;
        const pa = proj(p), pb = proj(q);
        pilespids(pb, Math.atan2(pb[1] - pa[1], pb[0] - pa[0]), staerk ? 9 : 7);
      }
      ctx.globalAlpha = 1;
      if (s.etiketter && synlig(h.centrum)) maerke(...h.centrum, h.medUret ? '↻ MED URET' : '↺ MOD URET', '#f3e9c8');
    }
  }

  // Transportbåndet: varm overfladegren og kold dybgren med løbende streger.
  function baand(t) {
    const tegnGren = (punkter, farve, bred, streg) => {
      const linje = { type: 'LineString', coordinates: punkter };
      ctx.beginPath(); sti(linje); ctx.strokeStyle = farve; ctx.globalAlpha = 0.22; ctx.lineWidth = bred; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); sti(linje); ctx.globalAlpha = 0.95; ctx.lineWidth = 2; ctx.setLineDash(streg); ctx.lineDashOffset = -t * 18; ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.globalAlpha = 1;
    };
    tegnGren(BAAND.dyb, '#5d8ff0', 11, [3, 7]);
    tegnGren(BAAND.grenIndisk, '#5d8ff0', 11, [3, 7]);
    tegnGren(BAAND.overflade, '#ff8a5c', 13, [10, 6]);
    for (const { punkt, navn } of BAAND.synker) symbol(punkt, '↓', '#a9c4ff', navn);
    for (const { punkt } of BAAND.stiger) symbol(punkt, '↑', '#ffc2a6');
  }
  function symbol(p, tegnet, farve, navn) {
    if (!synlig(p)) return;
    const [x, y] = proj(p);
    ctx.fillStyle = '#0d282bdd'; ctx.strokeStyle = farve; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = farve; ctx.font = "bold 13px Archivo, system-ui, sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tegnet, x, y + 1);
    if (navn) maerke(p[0], p[1] - 6, navn.toUpperCase(), farve);
  }

  // Mørk etiket med farvet skrift, som i et natkort. Etiketter, der ville
  // overlappe en allerede tegnet, springes over.
  let optaget = [];
  const indenfor = (p, grader = 72) => d3.geoDistance(p, centrum) < grader * RAD;
  function maerke(lon, lat, tekst, farve, tving = false) {
    if (!indenfor([lon, lat])) return;
    const [x, y] = proj([lon, lat]);
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    const w = ctx.measureText(tekst).width;
    const boks = [x - w / 2 - 6, y - 9, w + 12, 18];
    if (!tving && optaget.some(o => boks[0] < o[0] + o[2] && o[0] < boks[0] + boks[2] && boks[1] < o[1] + o[3] && o[1] < boks[1] + boks[3])) return;
    optaget.push(boks);
    ctx.fillStyle = '#102c2ae8'; ctx.fillRect(...boks);
    ctx.strokeStyle = farve + '70'; ctx.lineWidth = 0.6; ctx.strokeRect(...boks);
    ctx.fillStyle = farve; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tekst, x, y + 0.5);
  }
  function etiketter(s) {
    const fh = s.fremhaev || [];
    // Fremhævede og hurtige strømme først, så de vinder pladsen.
    const orden = [...STROEMME].sort((a, b) => (fh.includes(b.navn) - fh.includes(a.navn)) || b.fart - a.fart);
    for (const strom of orden) {
      const p = strom.punkter[Math.floor((strom.punkter.length - 1) / 2)];
      maerke(p[0], p[1], strom.navn, FARVER[strom.type]);
    }
  }

  function aflaes(x, y) {
    const p = proj.invert([x, y]);
    if (!p || !synlig(p)) return null;
    return p;
  }
  function slipFlaske(lon, lat) {
    if (felt.erLand(lon, lat)) return false;
    flasker.push({ lon, lat, alder: 0, strandet: false, spor: [[lon, lat]] });
    if (flasker.length > 6) flasker.shift();
    return true;
  }

  return {
    tilpas, trin, drej, flyvTil, aflaes, slipFlaske, rydSpor,
    get centrum() { return centrum; },
    get antalFlasker() { return flasker.length; },
  };
}

// Tekst til aflæsningen: strømmens navn, type og retning.
export function beskriv(lon, lat, felt) {
  if (felt.erLand(lon, lat)) return { navn: 'Land', tekst: '' };
  const w = felt.stroem(lon, lat), strom = felt.hvem(lon, lat);
  if (!strom || fart(w) < 0.06) return { navn: 'Åbent hav', tekst: 'svag strøm' };
  return { navn: strom.navn, tekst: `${TYPENAVN[strom.type]} · mod ${modRetning(w)}` };
}
