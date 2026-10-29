// Globussen: D3's ortografiske projektion på Canvas 2D, mørk «natkort»-stil.
// Tre lag: grundkort (hav, land, ITK), vindspor på et separat lærred, der
// langsomt falmer, og etiketter/balloner/sol øverst.
import { vind, fart, vindbaelte, itkBredde, baelter, solbredde, modelbredde } from './model.js';
import * as middeltemperatur from '../middeltemperatur.js';
import * as nedboer from '../nedboer.js';

const RAD = Math.PI / 180;
// Lyse farver til den mørke globus; snittet bruger mørkere udgaver af samme tone.
export const FARVER = {
  passat: '#7ce1c1', vest: '#f0b97a', polar: '#a9bdeb', monsun: '#f497c4', ingen: '#d7e8cc',
};
export const ITK_FARVE = '#f6d977';
export const CELLEFARVE = { Hadley: '#5fd0b0', Ferrel: '#f0a860', Polar: '#9fb4ee', 'Én celle': '#5fd0b0' };

// Cellernes grænser som funktioner af længden (samme regel som modelbredde).
function celleBaelter(s, b, itk) {
  if (s.rotation < 0.5) {
    return [{ navn: 'Én celle', syd: itk, nord: () => 89 }, { navn: 'Én celle', syd: () => -89, nord: itk }];
  }
  const nH = l => Math.max(b.nordHoej, itk(l) + 6), sH = l => Math.min(b.sydHoej, itk(l) - 6);
  return [
    { navn: 'Hadley', syd: itk, nord: nH }, { navn: 'Hadley', syd: sH, nord: itk },
    { navn: 'Ferrel', syd: nH, nord: () => b.nordFront }, { navn: 'Ferrel', syd: () => b.sydFront, nord: sH },
    { navn: 'Polar', syd: () => b.nordFront, nord: () => 89 }, { navn: 'Polar', syd: () => -89, nord: () => b.sydFront },
  ];
}
export function farvenoegle(navn) {
  if (/monsun/i.test(navn)) return 'monsun';
  if (/passat/i.test(navn)) return 'passat';
  if (/Vesten/.test(navn)) return 'vest';
  if (/Polar/.test(navn)) return 'polar';
  return 'ingen';
}

const ANTAL = 850;

// Klimalagene genbruger atlassets egne data og farveskalaer: målte
// klimanormaler 1991–2020, ikke modellens skematiske vind.
export const KLIMALAG = {
  temperatur: {
    modul: middeltemperatur, navn: 'Temperatur', enhed: '°C',
    kilde: 'NCEP/NCAR-reanalyse, 2 m, normal 1991–2020',
    vaerdi: middeltemperatur.tI, tekst: middeltemperatur.temperaturTekst,
  },
  nedboer: {
    modul: nedboer, navn: 'Nedbør', enhed: 'mm/md.',
    kilde: 'GPCP v2.3, normal 1991–2020',
    vaerdi: nedboer.mmI, tekst: mm => `${nedboer.mmTekst(mm)} i måneden`,
  },
};
// Modellens måned 1,0–12,9 (1,5 = midt i januar) → to datamåneder og blanding.
export function maanedsblanding(m) {
  const pos = m - 1.5, f = Math.floor(pos);
  return { fra: ((f % 12) + 12) % 12, maaned: (((f + 1) % 12) + 12) % 12, t: pos - f };
}
// Den hele måned, som navnet under skyderen viser (0–11).
export const datamaaned = m => ((Math.floor(m) - 1) % 12 + 12) % 12;

// Farve efter vindbælte; i stillebæltet og ved bæltegrænserne efter cellen.
function noegle(lat, lon, s, valg) {
  const k = farvenoegle(vindbaelte(lat, lon, s.maaned, valg));
  if (k !== 'ingen' || s.rotation < 0.5) return k === 'ingen' ? 'passat' : k;
  const m = Math.abs(modelbredde(lat, s.maaned, lon, s.kontinenter));
  return m < 30 ? 'passat' : m < 60 ? 'vest' : 'polar';
}
const tilfaeldigtPunkt = () => [Math.random() * 360 - 180, Math.asin(Math.random() * 2 - 1) / RAD];

export function lavGlobus(canvas, land, tilstand) {
  const d3 = window.d3;
  const ctx = canvas.getContext('2d');
  const spor = document.createElement('canvas');
  const sctx = spor.getContext('2d');
  const proj = d3.geoOrthographic().precision(0.5);
  const sti = d3.geoPath(proj, ctx);
  const gradnet = d3.geoGraticule10();
  let bredde = 0, hoejde = 0, dpr = 1;
  let centrum = [-20, 12];
  let maal = null;

  const partikler = Array.from({ length: ANTAL }, () => nyPartikel(true));
  const balloner = [];

  function nyPartikel(start) {
    const [lon, lat] = synligtPunkt();
    return { lon, lat, alder: start ? Math.random() * 3 : 0, levetid: 2 + Math.random() * 3 };
  }
  function synligtPunkt() {
    for (let i = 0; i < 20; i++) {
      const p = tilfaeldigtPunkt();
      if (d3.geoDistance(p, centrum) < 1.45) return p;
    }
    return tilfaeldigtPunkt();
  }
  const synlig = p => d3.geoDistance(p, centrum) < Math.PI / 2 - 0.02;

  function tilpas() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    bredde = r.width; hoejde = r.height;
    for (const c of [canvas, spor]) { c.width = Math.round(bredde * dpr); c.height = Math.round(hoejde * dpr); }
    // Plads til solen til venstre og til overskrift og signatur over og under.
    // Med et klimalag fylder signaturen mere (farveskalaen, på mobil flere linjer).
    const skala = tilstand().klimalag && canvas.parentElement.querySelector('.klimaskala');
    const ekstra = skala ? skala.offsetHeight + 6 : 0;
    const radius = Math.max(60, Math.min((bredde - 110) / 2, (hoejde - 92 - ekstra) / 2));
    proj.translate([bredde / 2 + 14, hoejde / 2 - 2 - ekstra / 2]).scale(radius);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Bånd mellem to bredde-funktioner som sfærisk polygon.
  function baand(syd, nord) {
    const ring = [];
    for (let l = -180; l <= 180; l += 4) ring.push([l, Math.max(-89, Math.min(89, syd(l)))]);
    for (let l = 180; l >= -180; l -= 4) ring.push([l, Math.max(-89, Math.min(89, nord(l)))]);
    let poly = { type: 'Polygon', coordinates: [ring] };
    if (d3.geoArea(poly) > 2 * Math.PI) poly = { type: 'Polygon', coordinates: [ring.slice().reverse()] };
    return poly;
  }
  const linje = f => ({ type: 'LineString', coordinates: Array.from({ length: 91 }, (_, i) => [-180 + i * 4, f(-180 + i * 4)]) });

  function rydSpor() { sctx.clearRect(0, 0, bredde, hoejde); }

  function drej(dl, db) {
    centrum = [((centrum[0] + dl + 540) % 360) - 180, Math.max(-70, Math.min(70, centrum[1] + db))];
    maal = null;
    rydSpor();
  }
  function flyvTil(lon, lat) { maal = [lon, lat]; }

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
    const valg = { rotation: s.rotation, kontinenter: s.kontinenter };

    // Vindspor: falm det gamle, tegn nye stykker.
    sctx.globalCompositeOperation = 'destination-out';
    sctx.fillStyle = `rgba(0,0,0,${s.pause ? 0 : Math.min(0.5, dt * 4)})`;
    sctx.fillRect(0, 0, bredde, hoejde);
    sctx.globalCompositeOperation = 'source-over';
    if (!s.pause) {
      const stier = {};
      for (const k of Object.keys(FARVER)) stier[k] = new Path2D();
      for (let i = 0; i < partikler.length; i++) {
        const p = partikler[i];
        p.alder += dt;
        if (p.alder > p.levetid || !synlig([p.lon, p.lat])) { partikler[i] = nyPartikel(false); continue; }
        const w = vind(p.lat, p.lon, s.maaned, valg);
        const a = proj([p.lon, p.lat]);
        const k = 1.3 * dt;
        p.lat = Math.max(-89, Math.min(89, p.lat + w.v * k));
        p.lon += w.u * k / Math.max(0.15, Math.cos(p.lat * RAD));
        if (p.lon > 180) p.lon -= 360; else if (p.lon < -180) p.lon += 360;
        if (!synlig([p.lon, p.lat])) continue;
        const b = proj([p.lon, p.lat]);
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 30) continue;
        const sti = stier[noegle(p.lat, p.lon, s, valg)];
        sti.moveTo(a[0], a[1]); sti.lineTo(b[0], b[1]);
      }
      sctx.lineWidth = 1.2; sctx.lineCap = 'round'; sctx.globalAlpha = 0.85;
      for (const [k, sti] of Object.entries(stier)) { sctx.strokeStyle = FARVER[k]; sctx.stroke(sti); }
      sctx.globalAlpha = 1;
    }

    // Balloner driver med samme vind.
    for (const b of balloner) {
      if (s.pause) break;
      const w = vind(b.lat, b.lon, s.maaned, valg);
      const k = 0.9 * dt;
      b.lat = Math.max(-88, Math.min(88, b.lat + w.v * k));
      b.lon += w.u * k / Math.max(0.15, Math.cos(b.lat * RAD));
      if (b.lon > 180) b.lon -= 360; else if (b.lon < -180) b.lon += 360;
      b.alder += dt;
      const sidste = b.spor[b.spor.length - 1];
      if (d3.geoDistance(sidste, [b.lon, b.lat]) > 0.01) b.spor.push([b.lon, b.lat]);
      if (b.spor.length > 600) b.spor.shift();
    }
    for (let i = balloner.length - 1; i >= 0; i--) if (balloner[i].alder > 45) balloner.splice(i, 1);

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
    hav.addColorStop(0, '#32656a'); hav.addColorStop(0.55, '#22494f'); hav.addColorStop(1, '#13343c');
    ctx.fillStyle = hav; ctx.fillRect(0, 0, bredde, hoejde);

    // Land: dæmpet grøn; svagt ørkenbånd ved højtrykkene, når Jorden drejer.
    const itk = l => itkBredde(s.maaned, l, s.kontinenter);
    const b = baelter(s.maaned);
    ctx.beginPath(); sti(land); ctx.fillStyle = '#8c9e7c'; ctx.fill();
    const lag = s.klimalag && KLIMALAG[s.klimalag];
    if (lag?.modul.data()) {
      klimaflade(lag, s, cx, cy, r);
      ctx.beginPath(); sti(land); ctx.strokeStyle = '#0d282bb0'; ctx.lineWidth = 0.8; ctx.stroke();
    } else if (s.rotation > 0.5) {
      ctx.save(); ctx.beginPath(); sti(land); ctx.clip();
      for (const [syd, nord] of [[b.nordHoej - 8, b.nordHoej + 5], [b.sydHoej - 5, b.sydHoej + 8]]) {
        ctx.beginPath(); sti(baand(() => syd, () => nord)); ctx.fillStyle = '#c9a76d'; ctx.globalAlpha = 0.55; ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.restore();
    }
    ctx.beginPath(); sti(land); ctx.strokeStyle = '#bcc5a05c'; ctx.lineWidth = 0.55; ctx.stroke();

    // Cellerne som gennemsigtige bælter, som i lærebogsfiguren (ikke oven i et
    // klimalag, hvor de ville farve de målte værdier om).
    if (s.celler && !lag?.modul.data()) for (const c of celleBaelter(s, b, itk)) {
      ctx.beginPath(); sti(baand(c.syd, c.nord));
      ctx.fillStyle = CELLEFARVE[c.navn]; ctx.globalAlpha = 0.17; ctx.fill(); ctx.globalAlpha = 1;
    }

    // Gradnet og bredder ved 0°, ±30° og ±60°.
    ctx.beginPath(); sti(gradnet); ctx.strokeStyle = '#d5e4cc16'; ctx.lineWidth = 0.6; ctx.stroke();
    for (const lat of [-60, -30, 0, 30, 60]) {
      ctx.beginPath(); sti(linje(() => lat));
      ctx.setLineDash(lat === 0 ? [2, 4] : []);
      ctx.strokeStyle = lat === 0 ? '#d7e8cc65' : '#d7e8cc28'; ctx.lineWidth = lat === 0 ? 0.9 : 0.6; ctx.stroke();
    }
    ctx.setLineDash([]);

    // Fremhævning fra trinene.
    const fh = s.fremhaev;
    if (fh === 'hadley') { glod(l => b.nordHoej - 5, l => b.nordHoej + 5); glod(l => b.sydHoej - 5, l => b.sydHoej + 5); }
    if (fh === 'tre') { glod(l => b.nordFront - 4, l => b.nordFront + 4); glod(l => b.sydFront - 4, l => b.sydFront + 4); }

    // ITK: gyldent, glødende bælte med små skytoppe.
    const itkLinje = linje(itk);
    const staerk = fh === 'itk' || fh === 'monsun' ? 1.6 : 1;
    for (const [farve, w, streg] of [['#f6d97718', 19 * staerk, []], ['#f6d97724', 9 * staerk, []], [ITK_FARVE, 1.5, [4, 3]]]) {
      ctx.beginPath(); sti(itkLinje); ctx.strokeStyle = farve; ctx.lineWidth = w; ctx.setLineDash(streg); ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let l = -180; l < 180; l += 3) {
      const lat = itk(l);
      if (!synlig([l, lat])) continue;
      const [x, y] = proj([l, lat]);
      const puls = 0.8 + 0.2 * Math.sin(t * 0.9 + l * 0.37);
      ctx.fillStyle = '#f7f6da65';
      ctx.beginPath(); ctx.ellipse(x, y - 3 - Math.sin(l * 2) * 2, (2.2 + Math.sin(l) * 0.6) * puls, 1.5, 0, 0, 7); ctx.fill();
    }

    // Skygge mod nattesiden.
    const skygge = ctx.createRadialGradient(cx - r * 0.42, cy - r * 0.4, r * 0.1, cx + r * 0.28, cy + r * 0.1, r * 1.25);
    skygge.addColorStop(0, '#0b202400'); skygge.addColorStop(0.6, '#081b2220'); skygge.addColorStop(1, '#06181dbb');
    ctx.fillStyle = skygge; ctx.fillRect(0, 0, bredde, hoejde);

    // Vindspor. På pause vises faste pile, så vinden kan aflæses.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(spor, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (s.pause) pile(s);
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.strokeStyle = '#b5dac060'; ctx.lineWidth = 1; ctx.stroke();

    if (s.luftringe) luftringe(s, b, itk, t);

    // Solen: lodret over sin bredde, med en stiplet stråle ind mod kloden.
    const sol = solbredde(s.maaned);
    const sy = cy - r * Math.sin((sol - centrum[1]) * RAD);
    const sx = Math.max(18, cx - r - 36);
    ctx.strokeStyle = fh === 'itk' ? '#f4ce72aa' : '#f4ce7250'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(sx + 12, sy); ctx.lineTo(cx - r * Math.cos((sol - centrum[1]) * RAD) * 0.92, sy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f4ce72'; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, 7); ctx.fill();
    ctx.strokeStyle = '#f4ce72';
    for (let a = 0; a < 8; a++) {
      const v = a * Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(sx + 11 * Math.cos(v), sy + 11 * Math.sin(v)); ctx.lineTo(sx + 15 * Math.cos(v), sy + 15 * Math.sin(v)); ctx.stroke();
    }

    if (s.etiketter) etiketter(s, b, itk);

    // Balloner.
    for (const bal of balloner) {
      ctx.save(); ctx.beginPath(); sti({ type: 'Sphere' }); ctx.clip();
      ctx.beginPath(); sti({ type: 'LineString', coordinates: bal.spor });
      ctx.setLineDash([2, 2]); ctx.strokeStyle = '#ffcb86'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      if (!synlig([bal.lon, bal.lat])) continue;
      const [x, y] = proj([bal.lon, bal.lat]);
      ctx.strokeStyle = '#fff1c8'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.quadraticCurveTo(x + 5, y + 8, x + 1, y + 13); ctx.stroke();
      ctx.fillStyle = '#ff9274'; ctx.beginPath(); ctx.ellipse(x, y - 8, 6, 7.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff2bc'; ctx.beginPath(); ctx.arc(x - 2, y - 10, 1.6, 0, 7); ctx.fill();
    }
  }

  // Klimalaget som raster over kloden. Mens kloden drejes, bruges en grov
  // geometri; står den stille et øjeblik, følger en skarp. Et månedsskift
  // genbruger geometrien og farver kun om.
  let flade = null, sidstFlyttet = 0;
  function klimaflade(lag, s, cx, cy, r) {
    const nu = performance.now();
    const noegle = `${centrum[0]},${centrum[1]},${r},${cx},${cy}`;
    const flyttet = flade?.noegle !== noegle;
    if (flyttet) sidstFlyttet = nu;
    const groft = nu - sidstFlyttet < 150;
    const faktor = groft ? 0.4 : Math.min(dpr, 1.25) * (s.afspil ? 0.75 : 1);
    const side = Math.max(1, Math.ceil(2 * r * faktor));
    if (flyttet || flade.faktor !== faktor) {
      const laerred = flade?.laerred.width === side ? flade.laerred : Object.assign(document.createElement('canvas'), { width: side, height: side });
      flade = {
        noegle, faktor, laerred, vist: null,
        geo: lag.modul.geometri(side, side, { centrum, skala: r * faktor, cx: side / 2, cy: side / 2 }),
        billede: laerred.getContext('2d').createImageData(side, side),
      };
    }
    const bl = maanedsblanding(s.maaned);
    const vist = `${lag.navn},${bl.fra},${bl.maaned},${bl.t.toFixed(2)},${groft}`;
    if (flade.vist !== vist) {
      lag.modul.farvTil(flade.billede.data, flade.geo, bl, lag.modul.data(), !groft);
      flade.laerred.getContext('2d').putImageData(flade.billede, 0, 0);
      flade.vist = vist;
    }
    ctx.globalAlpha = 0.8; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(flade.laerred, cx - r, cy - r, 2 * r, 2 * r);
    ctx.globalAlpha = 1;
  }

  // Faste vindpile i et net (kun på pause og ved reduceret bevægelse).
  function pile(s) {
    const valg = { rotation: s.rotation, kontinenter: s.kontinenter };
    for (let lat = -75; lat <= 75; lat += 15) for (let lon = -180; lon < 180; lon += 20) {
      const p = [lon, lat];
      if (!synlig(p)) continue;
      const w = vind(lat, lon, s.maaned, valg), f = fart(w);
      if (f < 0.6) continue;
      const k = 2.6 / f;
      const q = [lon + w.u * k / Math.max(0.2, Math.cos(lat * RAD)), lat + w.v * k];
      if (!synlig(q)) continue;
      const a = proj(p), b = proj(q), vinkel = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const farve = FARVER[noegle(lat, lon, s, valg)];
      ctx.strokeStyle = farve; ctx.fillStyle = farve; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...b);
      ctx.lineTo(b[0] - 4 * Math.cos(vinkel - 0.55), b[1] - 4 * Math.sin(vinkel - 0.55));
      ctx.lineTo(b[0] - 4 * Math.cos(vinkel + 0.55), b[1] - 4 * Math.sin(vinkel + 0.55)); ctx.fill();
    }
  }

  // Luftringene: hver celle som en gennemsigtig «donut» rundt om jordaksen.
  // Tværsnittet er en løkke fra jorden op i atmosfæren (højden er stærkt
  // overdrevet) mellem cellens grænser på hver længde. Fladerne er mest
  // tætte, hvor man ser dem fra siden, og prikker med hale løber rundt i
  // løkkerne. Ved jorden går Hadley- og polarcellen mod ækvator, Ferrel mod polen.
  // Alt deles i en bagside (z < 0) og en forside. Bagsiden tegnes kun uden for
  // klodens skive, så kloden skjuler den pixelpræcist; ellers ville hele flader
  // blinke frem og væk ved randen, når globussen drejes.
  const LAGTRIN = 12;
  function luftringe(s, b, itk, t) {
    const [cx, cy] = proj.translate(), r = proj.scale();
    const h0 = Math.min(0.13, 34 / r);
    const [l0, b0] = centrum;
    const sb = Math.sin(b0 * RAD), cb = Math.cos(b0 * RAD);
    // 3D-punkt i skærmens koordinater (z mod beskueren) for bredde, længde og højde.
    const rum = (lat, lon, hoej) => {
      const f = lat * RAD, l = (lon - l0) * RAD, k = 1 + hoej;
      const X = Math.cos(f) * Math.sin(l), Y = Math.sin(f), Z = Math.cos(f) * Math.cos(l);
      return [k * X, k * (Y * cb - Z * sb), k * (Y * sb + Z * cb)];
    };
    const xy = q => [cx + r * q[0], cy - r * q[1]];
    const DL = 10, NV = 16;
    const nytLag = () => ({ flader: Array.from({ length: LAGTRIN }, () => new Path2D()), spanter: new Path2D(), kam: new Path2D(), haler: new Path2D(), hoveder: new Path2D() });
    const tegnet = [];

    for (const c of celleBaelter(s, b, itk)) {
      const farve = CELLEFARVE[c.navn];
      const lag = [nytLag(), nytLag()]; // [bagside, forside]
      const side = (...q) => (q.reduce((sum, p) => sum + p[2], 0) < 0 ? lag[0] : lag[1]);
      const streg = (sti, p, q) => { sti.moveTo(...xy(p)); sti.lineTo(...xy(q)); };
      const h = h0 * ({ Hadley: 1, Ferrel: 0.72, Polar: 0.5, 'Én celle': 1 })[c.navn];
      const nord = c.navn === 'Én celle' ? c.nord(0) > 80 : c.syd(0) + c.nord(0) > 0;
      // Løkken på længden lon; v = -π/2 er ved jorden.
      const loekke = (lon, v) => {
        const a = c.syd(lon), e = c.nord(lon);
        const midt = (a + e) / 2, halv = Math.max(0, (e - a) / 2 * 0.9);
        return rum(Math.max(-89.5, Math.min(89.5, midt + halv * Math.cos(v))), lon, h / 2 + h / 2 * Math.sin(v));
      };
      // Gitter af punkter på donutten.
      const net = [];
      for (let l = -180; l <= 180; l += DL) {
        const række = [];
        for (let i = 0; i <= NV; i++) række.push(loekke(l, i / NV * 2 * Math.PI));
        net.push(række);
      }
      // Flader i gennemsigtighedstrin efter, hvor skråt man ser dem. Alle
      // lægges ind med samme omløbsretning på skærmen, så overlap ikke giver huller.
      for (let j = 0; j < net.length - 1; j++) for (let i = 0; i < NV; i++) {
        const p = [net[j][i], net[j + 1][i], net[j + 1][i + 1], net[j][i + 1]];
        const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
        const w = [p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]];
        const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
        const nl = Math.hypot(...n);
        if (nl < 1e-9) continue;
        const skraa = 1 - Math.abs(n[2]) / nl;
        const sti = side(...p).flader[Math.min(LAGTRIN - 1, Math.floor(skraa * skraa * LAGTRIN))];
        const hj = (n[2] < 0 ? p.slice().reverse() : p).map(xy);
        sti.moveTo(...hj[0]); sti.lineTo(...hj[1]); sti.lineTo(...hj[2]); sti.lineTo(...hj[3]); sti.closePath();
      }
      // Spanter for hver 30° og kammen øverst, så formen kan ses.
      for (let j = 0; j < net.length - 1; j += 30 / DL) for (let i = 0; i < NV; i++) {
        streg(side(net[j][i], net[j][i + 1]).spanter, net[j][i], net[j][i + 1]);
      }
      const top = Math.round(NV / 4);
      for (let j = 0; j < net.length - 1; j++) streg(side(net[j][top], net[j + 1][top]).kam, net[j][top], net[j + 1][top]);

      // Luftstrømmen: prikker med hale. v aftager → ved jorden mod ækvator på nordlig halvkugle.
      const retning = (nord ? -1 : 1) * (c.navn === 'Ferrel' ? -1 : 1);
      for (let l = -180; l < 180; l += 20) {
        for (let k = 0; k < 3; k++) {
          const v = t * 0.65 * retning + k * 2 * Math.PI / 3 + l * 0.05;
          const hale = [];
          for (let i = 0; i <= 5; i++) hale.push(loekke(l, v - retning * 0.45 * (1 - i / 5)));
          for (let i = 0; i < 5; i++) streg(side(hale[i], hale[i + 1]).haler, hale[i], hale[i + 1]);
          const [x, y] = xy(hale[5]);
          const hoveder = side(hale[5]).hoveder;
          hoveder.moveTo(x + 2, y); hoveder.arc(x, y, 2, 0, 2 * Math.PI);
        }
      }
      tegnet.push({ farve, lag });
    }

    const tegnLag = k => {
      for (const { farve, lag } of tegnet) {
        const L = lag[k];
        ctx.fillStyle = farve; ctx.strokeStyle = farve;
        L.flader.forEach((sti, i) => { const m = (i + 0.5) / LAGTRIN; ctx.globalAlpha = 0.02 + 0.15 * m; ctx.fill(sti); });
        ctx.lineWidth = 0.8; ctx.globalAlpha = 0.32; ctx.stroke(L.spanter);
        ctx.globalAlpha = 0.45; ctx.stroke(L.kam);
        ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.globalAlpha = 0.5; ctx.stroke(L.haler);
        ctx.globalAlpha = 1; ctx.fill(L.hoveder);
      }
    };
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, bredde, hoejde); ctx.arc(cx, cy, r - 0.5, 0, 2 * Math.PI); ctx.clip('evenodd');
    tegnLag(0);
    ctx.restore();
    tegnLag(1);
    ctx.globalAlpha = 1;
  }

  function glod(syd, nord) {
    ctx.beginPath(); sti(baand(syd, nord));
    ctx.fillStyle = 'rgba(246,217,119,0.14)'; ctx.fill();
    ctx.strokeStyle = 'rgba(246,217,119,0.55)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // Mørk etiket med farvet skrift, som i et natkort.
  const indenfor = (p, grader = 70) => d3.geoDistance(p, centrum) < grader * RAD;
  function maerke(lon, lat, tekst, farve) {
    if (!indenfor([lon, lat])) return;
    const [x, y] = proj([lon, lat]);
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    const w = ctx.measureText(tekst).width;
    ctx.fillStyle = '#102c2ae8'; ctx.fillRect(x - w / 2 - 6, y - 9, w + 12, 18);
    ctx.strokeStyle = farve + '70'; ctx.lineWidth = 0.6; ctx.strokeRect(x - w / 2 - 6, y - 9, w + 12, 18);
    ctx.fillStyle = farve; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tekst, x, y + 0.5);
  }

  function etiketter(s, b, itk) {
    const l0 = centrum[0];
    const valg = { rotation: s.rotation, kontinenter: s.kontinenter };
    const navn = lat => vindbaelte(lat, l0, s.maaned, valg);
    const midt = (a, c) => (a + c) / 2;
    maerke(l0 - 14, itk(l0 - 14), 'ITK · L', ITK_FARVE);
    if (s.rotation > 0.5) {
      for (const lat of [midt(itk(l0), b.nordHoej), midt(itk(l0), b.sydHoej), midt(b.nordHoej, b.nordFront),
        midt(b.sydHoej, b.sydFront), midt(b.nordFront, 90) - 3]) {
        const n = navn(lat);
        maerke(l0, lat, n.toUpperCase(), FARVER[farvenoegle(n)]);
      }
      // Sydvestmonsun lige syd for en ITK, der er trukket ind over land.
      const sydfor = itk(l0) - 7;
      if (sydfor > 3 && /monsun/i.test(navn(sydfor))) maerke(l0 - 6, sydfor, navn(sydfor).toUpperCase(), FARVER.monsun);
      maerke(l0 + 34, b.nordHoej, 'H · TØRT', '#e9c58d');
      maerke(l0 + 34, b.sydHoej, 'H · TØRT', '#e9c58d');
    } else {
      maerke(l0, midt(itk(l0), 70), 'VIND MOD ITK', FARVER.passat);
      maerke(l0, midt(itk(l0), -70), 'VIND MOD ITK', FARVER.passat);
    }
  }

  function aflaes(x, y) {
    const p = proj.invert([x, y]);
    if (!p || !synlig(p)) return null;
    return p;
  }
  function slipBallon(lon, lat) {
    balloner.push({ lon, lat, alder: 0, spor: [[lon, lat]] });
    if (balloner.length > 6) balloner.shift();
  }

  return {
    tilpas, trin, drej, flyvTil, aflaes, slipBallon, rydSpor,
    get centrum() { return centrum; },
    get antalBalloner() { return balloner.length; },
    rydBalloner() { balloner.length = 0; },
  };
}

export function beskriv(lon, lat, s) {
  const valg = { rotation: s.rotation, kontinenter: s.kontinenter };
  const w = vind(lat, lon, s.maaned, valg);
  return { navn: vindbaelte(lat, lon, s.maaned, valg), fart: fart(w), w, m: modelbredde(lat, s.maaned, lon, s.kontinenter) };
}
