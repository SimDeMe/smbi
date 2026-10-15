// Globussen: D3's ortografiske projektion på Canvas 2D.
// Tre lag: grundkort (hav, land, klimabånd, skyer), vindspor på et
// separat lærred, der langsomt falmer, og etiketter/balloner øverst.
import { vind, fart, vindbaelte, itkBredde, baelter, solbredde, modelbredde } from './model.js';

const RAD = Math.PI / 180;
export const FARVER = {
  passat: '#ff6a3d', vest: '#0e86c8', polar: '#7a4fd6', monsun: '#0fa593', ingen: '#17211f',
};
export function farvenoegle(navn) {
  if (/monsun/i.test(navn)) return 'monsun';
  if (/passat/i.test(navn)) return 'passat';
  if (/Vesten/.test(navn)) return 'vest';
  if (/Polar/.test(navn)) return 'polar';
  return 'ingen';
}

const ANTAL = 1700;

// Farve efter vindbælte; i stillebæltet og ved bæltegrænserne efter cellen.
function noegle(lat, lon, s, valg) {
  const k = farvenoegle(vindbaelte(lat, lon, s.maaned, valg));
  if (k !== 'ingen' || s.rotation < 0.5) return k;
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
    proj.translate([bredde / 2 - 8, hoejde / 2]).scale(Math.max(60, Math.min(bredde - 100, hoejde - 34) / 2));
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
      const k = Math.min(1, dt * 3);
      centrum = [centrum[0] + dl * k, centrum[1] + db * k];
      if (Math.abs(dl) < 0.2 && Math.abs(db) < 0.2) maal = null;
      rydSpor();
    }
    proj.rotate([-centrum[0], -centrum[1]]);
    const valg = { rotation: s.rotation, kontinenter: s.kontinenter };

    // Vindspor: falm det gamle, tegn nye stykker.
    sctx.globalCompositeOperation = 'destination-out';
    sctx.fillStyle = `rgba(0,0,0,${s.pause ? 0 : Math.min(0.5, dt * 5)})`;
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
      sctx.lineWidth = 1.6; sctx.lineCap = 'round';
      for (const [k, sti] of Object.entries(stier)) { sctx.strokeStyle = FARVER[k]; sctx.stroke(sti); }
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, bredde, hoejde);
    const [cx, cy] = proj.translate(), r = proj.scale();
    const fremhaev = s.fremhaev;

    // Skygge og hav.
    ctx.save();
    ctx.beginPath(); ctx.arc(cx + 5, cy + 5, r, 0, 2 * Math.PI); ctx.fillStyle = '#17211f'; ctx.fill();
    const hav = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    hav.addColorStop(0, '#e3f3fa'); hav.addColorStop(1, '#9fcfe6');
    ctx.beginPath(); sti({ type: 'Sphere' }); ctx.fillStyle = hav; ctx.fill();
    ctx.restore();

    // Land med klimabånd: regnbælte ved ITK, tørt ved højtrykkene.
    const itk = l => itkBredde(s.maaned, l, s.kontinenter);
    const b = baelter(s.maaned);
    ctx.beginPath(); sti(land); ctx.fillStyle = '#eadfbe'; ctx.fill();
    ctx.save();
    ctx.beginPath(); sti(land); ctx.clip();
    const tegnBaand = (syd, nord, farve) => { ctx.beginPath(); sti(baand(syd, nord)); ctx.fillStyle = farve; ctx.fill(); };
    if (s.rotation > 0.5) {
      tegnBaand(l => b.nordHoej - 9, l => b.nordHoej + 6, '#f2b866');
      tegnBaand(l => b.sydHoej - 6, l => b.sydHoej + 9, '#f2b866');
    }
    tegnBaand(l => itk(l) - 9, l => itk(l) + 9, '#7fc26b');
    tegnBaand(l => b.nordFront - 6, l => 72, '#b6d39a');
    tegnBaand(l => -72, l => b.sydFront + 6, '#b6d39a');
    tegnBaand(l => 74, l => 89.9, '#f4f8fb');
    tegnBaand(l => -89.9, l => -70, '#f4f8fb');
    ctx.restore();
    ctx.beginPath(); sti(land); ctx.strokeStyle = '#17211f88'; ctx.lineWidth = 0.7; ctx.stroke();

    // Gradnet, ækvator og vendekredse.
    ctx.beginPath(); sti(gradnet); ctx.strokeStyle = '#17211f14'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.setLineDash([4, 5]);
    for (const [bred, farve] of [[0, '#17211f66'], [23.44, '#c0182c55'], [-23.44, '#c0182c55']]) {
      ctx.beginPath(); sti(linje(() => bred)); ctx.strokeStyle = farve; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.setLineDash([]);

    // Fremhævning fra trinene.
    if (fremhaev === 'itk' || fremhaev === 'monsun') glod(l => itk(l) - 6, l => itk(l) + 6);
    if (fremhaev === 'hadley') { glod(l => b.nordHoej - 5, l => b.nordHoej + 5); glod(l => b.sydHoej - 5, l => b.sydHoej + 5); }
    if (fremhaev === 'tre') { glod(l => b.nordFront - 4, l => b.nordFront + 4); glod(l => b.sydFront - 4, l => b.sydFront + 4); }

    // ITK-skyer: tårne, der vokser og svinder.
    for (let l = -180; l < 180; l += 4) {
      const lat = itk(l) + 2.2 * Math.sin(l * 1.7 + t * 0.3);
      if (!synlig([l, lat])) continue;
      const [x, y] = proj([l, lat]);
      const kant = Math.cos(d3.geoDistance([l, lat], centrum));
      const puls = 0.75 + 0.25 * Math.sin(t * 0.9 + l * 0.37);
      const rr = (4 + 6 * puls * (0.6 + 0.4 * Math.abs(Math.sin(l * 2.3)))) * (0.35 + 0.65 * kant) * (r / 260);
      ctx.beginPath(); ctx.ellipse(x + rr * 0.3, y + rr * 0.45, rr * 1.6, rr * 0.55, 0, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(23,33,31,0.12)'; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, 2 * Math.PI);
      ctx.moveTo(x + rr * 1.6, y + rr * 0.25); ctx.arc(x + rr * 0.9, y + rr * 0.25, rr * 0.7, 0, 2 * Math.PI);
      ctx.moveTo(x - rr * 0.3, y + rr * 0.3); ctx.arc(x - rr * 0.9, y + rr * 0.3, rr * 0.6, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
    }

    // Vindspor.
    ctx.save();
    ctx.beginPath(); sti({ type: 'Sphere' }); ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(spor, 0, 0);
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Lys fra solen og kant.
    const glans = ctx.createRadialGradient(cx - r * 0.45, cy - r * 0.5, 0, cx - r * 0.45, cy - r * 0.5, r * 1.1);
    glans.addColorStop(0, 'rgba(255,255,255,0.28)'); glans.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); sti({ type: 'Sphere' }); ctx.fillStyle = glans; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#17211f'; ctx.stroke();

    // Solen: lodret over sin bredde, tegnet uden for kanten.
    const sol = solbredde(s.maaned);
    const sy = cy - r * Math.sin((sol - centrum[1]) * RAD);
    const sx = cx + r * Math.cos((sol - centrum[1]) * RAD) + 34;
    ctx.save();
    ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx - 18, sy + (i - 1) * 9); ctx.lineTo(sx - 30, sy + (i - 1) * 9); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(sx, sy, 11, 0, 2 * Math.PI); ctx.fillStyle = '#ffb300'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#17211f'; ctx.stroke();
    ctx.restore();

    // Tryk og navne.
    if (s.etiketter) etiketter(s, b, itk);

    // Balloner.
    for (const bal of balloner) {
      ctx.beginPath(); sti({ type: 'LineString', coordinates: bal.spor });
      ctx.setLineDash([3, 4]); ctx.strokeStyle = '#c0182c'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      if (!synlig([bal.lon, bal.lat])) continue;
      const [x, y] = proj([bal.lon, bal.lat]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 12); ctx.strokeStyle = '#17211f'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y - 20, 7, 9, 0, 0, 2 * Math.PI);
      ctx.fillStyle = '#e8336d'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    }
  }

  function glod(syd, nord) {
    ctx.beginPath(); sti(baand(syd, nord));
    ctx.fillStyle = 'rgba(255,179,0,0.28)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,179,0,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  const indenfor = (p, grader = 68) => d3.geoDistance(p, centrum) < grader * RAD;
  function maerke(lon, lat, tekst, { fyld = '#fff9ee', blæk = '#17211f', fed = false } = {}) {
    if (!indenfor([lon, lat])) return;
    const [x, y] = proj([lon, lat]);
    ctx.font = `${fed ? 800 : 700} 12px Archivo, system-ui, sans-serif`;
    const w = ctx.measureText(tekst).width + 12;
    ctx.fillStyle = fyld; ctx.strokeStyle = blæk; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 10, w, 20, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = blæk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tekst, x, y + 0.5);
  }
  function tryk(lon, lat, bogstav) {
    if (!indenfor([lon, lat], 74)) return;
    const [x, y] = proj([lon, lat]);
    const lav = bogstav === 'L';
    ctx.beginPath(); ctx.arc(x, y, 11, 0, 2 * Math.PI);
    ctx.fillStyle = lav ? '#17211f' : '#fff9ee'; ctx.fill();
    ctx.strokeStyle = '#17211f'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = lav ? '#fff9ee' : '#17211f';
    ctx.font = '800 13px Archivo, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(bogstav, x, y + 0.5);
  }

  function etiketter(s, b, itk) {
    const l0 = centrum[0];
    const lT = l0 - 32;
    tryk(lT, itk(lT), 'L');
    if (s.rotation > 0.5) {
      tryk(lT, b.nordHoej, 'H'); tryk(lT, b.sydHoej, 'H');
      tryk(lT, b.nordFront, 'L'); tryk(lT, b.sydFront, 'L');
    }
    tryk(lT, 84, 'H'); tryk(lT, -84, 'H');
    maerke(l0 + 22, itk(l0 + 22), 'ITK', { fyld: '#17211f', blæk: '#fff9ee', fed: true });
    const navn = lat => vindbaelte(lat, l0, s.maaned, { rotation: s.rotation, kontinenter: s.kontinenter });
    const midt = (a, c) => (a + c) / 2;
    const steder = s.rotation > 0.5
      ? [midt(itk(l0), b.nordHoej), midt(b.nordHoej, b.nordFront), midt(b.nordFront, 90) - 3,
        midt(itk(l0), b.sydHoej), midt(b.sydHoej, b.sydFront), midt(b.sydFront, -90) + 3]
      : [midt(itk(l0), 90), midt(itk(l0), -90)];
    for (const lat of steder) {
      const n = navn(lat);
      maerke(l0, lat, n);
      if (!indenfor([l0, lat])) continue;
      const [x, y] = proj([l0, lat]);
      ctx.fillStyle = FARVER[farvenoegle(n)];
      ctx.beginPath(); ctx.arc(x - ctx.measureText(n).width / 2 - 1, y, 3.5, 0, 2 * Math.PI); ctx.fill();
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
