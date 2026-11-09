// Genbruger atlassets lokale D3/TopoJSON-data og ortografiske tegnemetode.
// Holdes uafhængig af atlas/globus.js, som også ejer atlassets menuer og temalag.
import { hentKlimalag } from '../../atlas/klimalag.js';
import { zoneForKlasse, ZONER } from './model.js';

const parallel = lat => ({ type: 'LineString', coordinates: Array.from({ length: 181 }, (_, i) => [-180 + i * 2, lat]) });
const meridian = lon => ({ type: 'LineString', coordinates: Array.from({ length: 91 }, (_, i) => [lon, -90 + i * 2]) });
const sphere = { type: 'Sphere' };
export async function startGlobus({ vaelg, punkt, flyttet }) {
  const d3 = window.d3, topojson = window.topojson;
  if (!d3?.geoOrthographic || !topojson?.feature) throw new Error('Kortbibliotekerne kunne ikke indlæses.');
  const canvas = document.querySelector('#globus'), rum = document.querySelector('#globusrum');
  const overlay = document.querySelector('#pladser'), ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browseren kunne ikke åbne globussens tegneflade.');
  const svar = await fetch(new URL('../../atlas/data/countries-110m.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
  if (!svar.ok) throw new Error('Kystlinjerne kunne ikke hentes.');
  const topo = await svar.json();
  // Verdensdele er fokus: saml landfladerne, så landegrænser ikke fylder.
  const lande = topojson.merge(topo, topo.objects.countries.geometries);
  const projektion = d3.geoOrthographic().clipAngle(90).precision(.4);
  const sti = d3.geoPath(projektion, ctx), net = d3.geoGraticule().step([30, 30])();
  let centrum = [15, 20], bredde = 0, hoejde = 0, ramme = 0;
  let lag, tilstand, markoerer = [], fremhaevet = null, klima, hjaelpelinjer = false, valgtPunkt = null;
  const synlig = p => d3.geoDistance(centrum, p) < Math.PI / 2 - .015;
  const linjePunkt = o => lag?.type === 'linjer' && Math.abs(o.punkt[1]) < 89 ? [centrum[0], o.punkt[1]] : o.punkt;
  function tegnGeometri(geo, farve, tykkelse = 1.5, stiplet = false) {
    ctx.beginPath(); sti(geo); ctx.strokeStyle = farve; ctx.lineWidth = tykkelse;
    ctx.setLineDash(stiplet ? [5, 4] : []); ctx.stroke(); ctx.setLineDash([]);
  }
  function tegn() {
    ramme = 0;
    if (!lag || !bredde || !hoejde) return;
    projektion.translate([bredde / 2, hoejde / 2]).scale(Math.min(bredde, hoejde) * .435).rotate([-centrum[0], -centrum[1]]);
    ctx.clearRect(0, 0, bredde, hoejde);
    ctx.beginPath(); sti(sphere); ctx.fillStyle = '#bcdfee'; ctx.fill();
    ctx.save(); ctx.clip();
    const landsti = new Path2D(); d3.geoPath(projektion, landsti)(lande);
    ctx.fillStyle = '#e1e4ce'; ctx.fill(landsti);
    if (lag.type === 'klima' && klima) {
      const grupper = new Map(Object.keys(ZONER).map(id => [id, []]));
      for (const del of klima.niveau(1e-6)) {
        if (d3.geoDistance(centrum, del.midte) - del.radius > Math.PI / 2 + .02) continue;
        grupper.get(zoneForKlasse(del.nr)).push(del.polygon.coordinates);
      }
      ctx.save(); ctx.clip(landsti);
      for (const [id, polygoner] of grupper) {
        ctx.beginPath(); sti({ type: 'MultiPolygon', coordinates: polygoner });
        ctx.fillStyle = ZONER[id].farve; ctx.fill();
      }
      tegnGeometri(klima.zonegraenser, '#405b51', 1.2);
      ctx.restore();
    }
    ctx.strokeStyle = '#536f62'; ctx.lineWidth = 1; ctx.stroke(landsti);
    if (['gradnet', 'punkter'].includes(lag.type)) tegnGeometri(net, '#5a8e9e', .7);
    if (lag.type !== 'steder' && lag.type !== 'klima') tegnGeometri(parallel(0), '#547a83', 1);
    if (lag.type === 'linjer' || hjaelpelinjer && lag.type === 'klima') {
      for (const lat of [66.56, 23.44, 0, -23.44, -66.56]) {
        const o = lag.ord.find(o => o.punkt[1] === lat);
        const bon = o && tilstand.rigtige.has(o.id);
        tegnGeometri(parallel(lat), bon ? '#3f7d4d' : '#465d68', o?.id === fremhaevet ? 4 : 1.6, Math.abs(lat) > 30);
      }
    }
    if (lag.type === 'gradnet') {
      for (const [id, geo] of [['bredde', parallel(30)], ['laengde', meridian(60)], ['nul', meridian(0)]]) {
        tegnGeometri(geo, tilstand.rigtige.has(id) ? '#397749' : '#293f4b', id === fremhaevet ? 4 : 2.5, id === 'nul');
      }
    }
    if (lag.type === 'punkter') {
      tegnGeometri(meridian(0), '#2c555e', 1.5, true); tegnGeometri(meridian(180), '#2c555e', 1, true);
    }
    if (lag.type === 'punkter') {
      ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
      for (let lon = -150; lon <= 180; lon += 30) {
        const p = [lon, 0]; if (!synlig(p)) continue;
        const [x, y] = projektion(p); ctx.fillStyle = '#fffdf8'; ctx.fillRect(x - 23, y + 4, 46, 16);
        ctx.fillStyle = '#223e49'; ctx.fillText(`${Math.abs(lon)}°${lon < 0 ? 'V' : lon > 0 ? 'Ø' : ''}`, x, y + 16);
      }
      for (const lat of [-60, -30, 30, 60]) {
        const p = [centrum[0], lat]; if (!synlig(p)) continue;
        const [x, y] = projektion(p); ctx.fillStyle = '#fffdf8'; ctx.fillRect(x + 4, y - 12, 43, 16);
        ctx.fillStyle = '#223e49'; ctx.fillText(`${Math.abs(lat)}°${lat < 0 ? 'S' : 'N'}`, x + 25, y);
      }
      if (valgtPunkt && synlig(valgtPunkt)) {
        const [x, y] = projektion(valgtPunkt); ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffb300'; ctx.fill(); ctx.strokeStyle = '#17211f'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    const radius = projektion.scale();
    const skygge = ctx.createRadialGradient(bredde / 2 - radius * .3, hoejde / 2 - radius * .3, radius * .4, bredde / 2, hoejde / 2, radius);
    skygge.addColorStop(0, '#ffffff00'); skygge.addColorStop(.8, '#17211f00'); skygge.addColorStop(1, '#17211f24');
    ctx.fillStyle = skygge; ctx.fillRect(0, 0, bredde, hoejde); ctx.restore();
    tegnGeometri(sphere, '#17211f', 2);
    const synligePladser = [];
    for (const { ord, knap } of markoerer) {
      const p = linjePunkt(ord), v = synlig(p);
      // Polerne må også vises på kuglens rand, når man ser langs ækvator.
      const polRand = Math.abs(p[1]) === 90 && Math.abs(centrum[1]) < .01;
      knap.hidden = !v && !polRand;
      if (v || polRand) {
        const [x, y] = projektion(p); synligePladser.push({ x, y, knap });
        knap.style.left = `${x}px`; knap.style.top = `${y}px`;
      }
    }
    // De polnære kredse ligger tæt i en projektion set fra ækvator.
    // Fordel deres knapper og forbind dem til den præcise plads med streger.
    if (lag.type === 'linjer') {
      const liste = synligePladser.sort((a, b) => a.y - b.y), mellemrum = 36;
      let forrige = -20;
      const positioner = liste.map(p => { const y = Math.max(20, p.y, forrige + mellemrum); forrige = y; return y; });
      const overskud = Math.max(0, (positioner.at(-1) || 0) - (hoejde - 20));
      for (let i = positioner.length - 1; i >= 0; i--) positioner[i] = Math.min(positioner[i] - overskud, i === positioner.length - 1 ? hoejde - 20 : positioner[i + 1] - mellemrum);
      liste.forEach((p, i) => {
        const x = bredde / 2 + (i % 2 ? 55 : -55), y = positioner[i];
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(x, y); ctx.strokeStyle = '#536b61'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#17211f'; ctx.fill();
        p.knap.style.left = `${x}px`; p.knap.style.top = `${y}px`;
      });
    }
    flyttet([...centrum]);
  }
  const opdater = () => { if (!ramme) ramme = requestAnimationFrame(tegn); };
  function tilpas() {
    bredde = rum.clientWidth; hoejde = rum.clientHeight;
    const taethed = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bredde * taethed); canvas.height = Math.round(hoejde * taethed);
    ctx.setTransform(taethed, 0, 0, taethed, 0, 0); opdater();
  }
  function centrer(p) {
    centrum = [((p[0] + 180) % 360 + 360) % 360 - 180, Math.max(-90, Math.min(90, p[1]))]; opdater();
  }
  function drej(retning, skridt = 15) {
    const [x, y] = { vest: [-skridt, 0], oest: [skridt, 0], nord: [0, skridt], syd: [0, -skridt] }[retning];
    centrer([centrum[0] + x, centrum[1] + y]);
  }
  const taster = { ArrowLeft: 'vest', ArrowRight: 'oest', ArrowUp: 'nord', ArrowDown: 'syd' };
  canvas.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (taster[e.key]) drej(taster[e.key], e.shiftKey ? 1 : 10);
    else if (e.key === 'Home') centrer(lag.centrum);
    else if (e.key === 'Enter' && lag.type === 'punkter') punkt([...centrum]);
    else return;
    e.preventDefault();
  });
  let tryk = null;
  canvas.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId); canvas.focus({ preventScroll: true });
    tryk = { x: e.clientX, y: e.clientY, start: [...centrum], flyttet: false, id: e.pointerId };
  });
  canvas.addEventListener('pointermove', e => {
    if (!tryk || tryk.id !== e.pointerId) return;
    const dx = e.clientX - tryk.x, dy = e.clientY - tryk.y;
    if (Math.hypot(dx, dy) > 6) tryk.flyttet = true;
    if (tryk.flyttet) centrer([tryk.start[0] - dx / projektion.scale() * 90, tryk.start[1] + dy / projektion.scale() * 90]);
  });
  canvas.addEventListener('pointerup', e => {
    if (!tryk || tryk.id !== e.pointerId) return;
    const klik = !tryk.flyttet; tryk = null;
    if (!klik || lag.type !== 'punkter') return;
    const r = canvas.getBoundingClientRect(), xy = [e.clientX - r.left, e.clientY - r.top];
    if (Math.hypot(xy[0] - bredde / 2, xy[1] - hoejde / 2) > projektion.scale()) return;
    punkt(projektion.invert(xy));
  });
  canvas.addEventListener('pointercancel', () => { tryk = null; });
  new ResizeObserver(tilpas).observe(rum);
  tilpas();
  return {
    async hentKlima() { klima = await hentKlimalag('vahl'); opdater(); return klima; },
    scene(nytLag, nyTilstand) {
      lag = nytLag; tilstand = nyTilstand; fremhaevet = null; valgtPunkt = null;
      overlay.replaceChildren();
      markoerer = (lag.type === 'punkter' ? [] : lag.ord).map((ord, n) => {
        const knap = document.createElement('button'); knap.type = 'button'; knap.className = 'plads'; knap.dataset.plads = ord.id;
        knap.innerHTML = `<span>${n + 1}</span><span class="etiket"></span>`;
        knap.onclick = () => vaelg(ord.id);
        knap.onpointerenter = knap.onfocus = () => { fremhaevet = ord.id; opdater(); };
        knap.onpointerleave = knap.onblur = () => { fremhaevet = null; opdater(); };
        knap.ondragover = e => { e.preventDefault(); };
        knap.ondrop = e => { e.preventDefault(); vaelg(ord.id, e.dataTransfer.getData('text/plain')); };
        overlay.append(knap); return { ord, knap };
      });
      centrer(lag.centrum); this.status(nyTilstand);
    },
    status(t) {
      tilstand = t;
      for (const { ord, knap } of markoerer) {
        const svarId = t.svar[ord.id], navn = lag.ord.find(o => o.id === svarId)?.navn;
        const rigtig = t.rigtige.has(ord.id), n = lag.ord.indexOf(ord) + 1;
        knap.classList.toggle('rigtig', rigtig); knap.classList.toggle('besat', Boolean(svarId) && !rigtig);
        knap.setAttribute('aria-label', `Plads ${n}${navn ? ': ' + navn : ', tom'}${rigtig ? ', korrekt. ' + ord.tekst : ''}`);
        knap.querySelector('.etiket').textContent = navn || `Plads ${n}`;
        knap.title = rigtig ? `${navn}: ${ord.tekst}` : navn || `Plads ${n}`;
      }
      opdater();
    },
    visPlads(id) {
      const o = lag.ord.find(o => o.id === id);
      centrer(lag.type === 'linjer' ? [centrum[0], o.punkt[1] * .8] : o.punkt);
      // Et efterfølgende tastaturfokus skal ramme den nye, synlige plads.
      cancelAnimationFrame(ramme); tegn();
    },
    hint(id) {
      for (const { ord, knap } of markoerer) knap.classList.toggle('hint', ord.id === id);
      this.visPlads(id);
    },
    fjernHint() { for (const { knap } of markoerer) knap.classList.remove('hint'); },
    hjaelpelinjer(v) { hjaelpelinjer = v; opdater(); },
    saetPunkt(p) { valgtPunkt = p; opdater(); },
    centrum: () => [...centrum],
    centrer, drej
  };
}
