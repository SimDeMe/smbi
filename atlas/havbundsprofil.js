// Signaturen for «Havbundens alder»: farveskala, profilvalg og profilgraf.
// Grafen er en skyder (role=slider): markøren flyttes med mus, touch eller
// piletaster, og eleven aflæser afstand fra ryggen, alder og den gennemsnitlige
// halve spredningshastighed. Tegning på kloden ligger i havbundsalder.js.

const N = 360;

export function startProfil({ globus, modul, opdateret = () => {} }) {
  const valg = document.querySelector('#havbundprofil');
  const rum = document.querySelector('#profilrum');
  const graf = document.querySelector('#profilgraf');
  const maaling = document.querySelector('#profilmaaling');
  const hjaelp = document.querySelector('#profilhjaelp');
  const nyePunkter = document.querySelector('#profilpunkter');
  let prof = null, markoer = 0, navn = '', ender = ['A', 'B'], egne = [];

  // Farveskala: én boks pr. klasse og tal under hver anden grænse.
  const skala = document.querySelector('#alderskala');
  if (!skala.childElementCount) {
    const felter = document.createElement('div');
    felter.className = 'alderfelter';
    for (const k of modul.KLASSER) {
      const i = document.createElement('i');
      i.style.background = k.farve;
      i.title = k.til === null ? `over ${k.fra} mio. år` : `${k.fra}–${k.til} mio. år`;
      felter.append(i);
    }
    const tal = document.createElement('div');
    tal.className = 'alderskalatal';
    // Tallene står ved klassegrænserne; «200+» under den sidste klasse.
    ['0', '40', '80', '120', '160', '200+'].forEach((t, i) => {
      const span = Object.assign(document.createElement('span'), { textContent: t });
      span.style.left = `${200 * i / 11}%`;
      tal.append(span);
    });
    skala.append(felter, tal);
  }
  if (valg.options.length < 3) {
    for (const p of modul.PROFILER) valg.insertBefore(new Option(p.navn, p.id), valg.querySelector('[value="egen"]'));
  }

  const fmt = (x, d = 0) => x.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });

  function tekst() {
    if (!prof) return '';
    const p = prof.punkter[markoer];
    const sted = p.alder === null ? 'ingen havbundsalder (kontinent eller sokkel)' : modul.aldertekst(p.alder);
    if (prof.ryg === null) {
      const yngst = Math.min(...prof.punkter.filter(q => q.alder !== null).map(q => q.alder));
      return `${fmt(p.km)} km fra A · ${sted}. Profilen krydser ingen spredningsryg${Number.isFinite(yngst) ? ` (yngste havbund ${modul.aldertekst(yngst)})` : ''}.`;
    }
    const ryg = prof.punkter[prof.ryg];
    const side = p.km < ryg.km ? ender[0] : ender[1];
    const afstand = Math.abs(p.km - ryg.km);
    const hvor = afstand < 1 ? 'Ved ryggen' : `${fmt(afstand)} km fra ryggen ${side.startsWith('mod ') ? side : `mod ${side}`}`;
    const h = modul.hastighed(prof, markoer);
    if (!h) return `${hvor} · ${sted}.`;
    if (h.cm === null) return `${hvor} · ${sted}. Flyt markøren længere væk fra ryggen for at måle hastigheden.`;
    return `${hvor} · ${sted}. Halv spredningshastighed: ${fmt(h.km)} km / ${modul.aldertekst(h.alder)} = ${fmt(h.cm, 1)} cm/år.`;
  }

  function opdater() {
    modul.visProfil(prof, markoer);
    globus.gentegn();
    tegnGraf();
    const t = tekst();
    maaling.textContent = t;
    graf.setAttribute('aria-valuenow', String(markoer));
    graf.setAttribute('aria-valuetext', t);
    opdateret();
  }

  function vis(nyProf, nytNavn, nyeEnder, drej = true) {
    prof = nyProf; navn = nytNavn; ender = nyeEnder;
    rum.hidden = false; graf.hidden = false;
    graf.setAttribute('aria-label', `Aldersprofil ${navn} fra ${ender[0]} (A) til ${ender[1]} (B). Piletasterne flytter markøren.`);
    graf.setAttribute('aria-valuemin', '0'); graf.setAttribute('aria-valuemax', String(N));
    // Start et stykke ude på den længste side af ryggen.
    markoer = prof.ryg === null ? Math.round(N / 2)
      : prof.ryg < N / 2 ? Math.round(prof.ryg + (N - prof.ryg) * .55) : Math.round(prof.ryg * .45);
    if (drej) {
      const midt = prof.punkter[Math.round(N / 2)].punkt;
      globus.visUdsnit(midt, prof.laengde > 5000 ? 1 : prof.laengde > 2500 ? 1.4 : 2.2);
    }
    opdater();
  }

  function egenProfil() {
    egne = [];
    prof = null; modul.visProfil(null); globus.gentegn();
    rum.hidden = false; graf.hidden = true; maaling.textContent = '';
    hjaelp.hidden = false; nyePunkter.hidden = true;
    hjaelp.textContent = 'Tryk på kloden, hvor profilen skal begynde (A). Med tastatur: drej punktet ind i sigtekornet, og tryk Enter på kloden.';
    globus.vaelgPunkt(punkt => {
      egne.push(punkt);
      if (egne.length === 1) {
        hjaelp.textContent = 'A er sat. Tryk der, hvor profilen skal slutte (B) – helst på tværs af en ryg.';
        return;
      }
      globus.vaelgPunkt(null);
      hjaelp.hidden = true; nyePunkter.hidden = false;
      const grad = ([lon, lat]) => `${fmt(Math.abs(lat), 1)}° ${lat < 0 ? 'S' : 'N'}, ${fmt(Math.abs(lon), 1)}° ${lon < 0 ? 'V' : 'Ø'}`;
      vis(modul.profil(egne[0], egne[1], N), 'egen profil', [`A (${grad(egne[0])})`, `B (${grad(egne[1])})`], false);
    });
    opdateret();
  }

  function vaelg(id) {
    globus.vaelgPunkt(null);
    hjaelp.hidden = true; nyePunkter.hidden = true;
    if (!id) { prof = null; rum.hidden = true; modul.visProfil(null); globus.gentegn(); opdateret(); return; }
    if (id === 'egen') { nyePunkter.hidden = false; egenProfil(); return; }
    const p = modul.PROFILER.find(q => q.id === id);
    vis(modul.profil(p.fra, p.til, N), p.navn, p.ender);
  }
  valg.onchange = () => vaelg(valg.value);
  nyePunkter.onclick = egenProfil;

  // ---------- Grafen ----------
  const M = { v: 40, h: 8, o: 8, n: 22 };
  function geometri() {
    const b = graf.getBoundingClientRect();
    const w = b.width, h = b.height;
    const nul = prof.ryg !== null ? prof.punkter[prof.ryg].km : 0;
    const minX = -nul, maxX = prof.laengde - nul;
    const maksAlder = Math.max(20, ...prof.punkter.map(p => p.alder ?? 0));
    const top = Math.ceil(maksAlder / 40) * 40;
    return {
      w, h, nul, minX, maxX, top,
      x: km => M.v + (km - nul - minX) / (maxX - minX || 1) * (w - M.v - M.h),
      y: a => h - M.n - a / top * (h - M.n - M.o)
    };
  }
  function tegnGraf() {
    if (!prof || graf.hidden) return;
    const b = graf.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    graf.width = Math.max(1, Math.round(b.width * dpr)); graf.height = Math.max(1, Math.round(b.height * dpr));
    const ctx = graf.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = geometri();
    ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 0, g.w, g.h);
    ctx.font = '500 10px "IBM Plex Mono", monospace'; ctx.fillStyle = '#49615b';
    // Akser: alder (mio. år) lodret, km fra ryggen vandret.
    ctx.strokeStyle = '#17211f22'; ctx.lineWidth = 1; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let a = 0; a <= g.top; a += g.top > 120 ? 40 : 20) {
      ctx.beginPath(); ctx.moveTo(M.v, g.y(a)); ctx.lineTo(g.w - M.h, g.y(a)); ctx.stroke();
      ctx.fillText(String(a), M.v - 4, g.y(a));
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const trin = (g.maxX - g.minX) > 5000 ? 2000 : (g.maxX - g.minX) > 2000 ? 1000 : 500;
    for (let km = Math.ceil(g.minX / trin) * trin; km <= g.maxX; km += trin) {
      const x = g.x(km + g.nul);
      ctx.beginPath(); ctx.moveTo(x, M.o); ctx.lineTo(x, g.h - M.n); ctx.stroke();
      ctx.fillText(km === 0 ? '0' : fmt(Math.abs(km)), x, g.h - M.n + 3);
    }
    ctx.save(); ctx.translate(8, (g.h - M.n) / 2 + 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle'; ctx.fillText('mio. år', 0, 0); ctx.restore();
    ctx.textAlign = 'left'; ctx.fillText('A', M.v + 1, g.h - 10);
    ctx.textAlign = 'right'; ctx.fillText('B', g.w - M.h, g.h - 10);
    ctx.textAlign = 'center'; ctx.fillText(prof.ryg !== null ? 'km fra ryggen' : 'km', (M.v + g.w) / 2, g.h - 10);
    // Kurven, farvet efter aldersklasse; huller, hvor der ingen havbundsalder er.
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 1; i < prof.punkter.length; i++) {
      const p = prof.punkter[i - 1], q = prof.punkter[i];
      if (p.alder === null || q.alder === null) continue;
      ctx.beginPath(); ctx.moveTo(g.x(p.km), g.y(p.alder)); ctx.lineTo(g.x(q.km), g.y(q.alder));
      ctx.strokeStyle = modul.KLASSER[modul.klasseFor((p.alder + q.alder) / 2)].farve; ctx.stroke();
    }
    ctx.lineWidth = .8; ctx.strokeStyle = '#17211f99';
    ctx.beginPath();
    let paa = false;
    for (const p of prof.punkter) {
      if (p.alder === null) { paa = false; continue; }
      if (paa) ctx.lineTo(g.x(p.km), g.y(p.alder)); else ctx.moveTo(g.x(p.km), g.y(p.alder));
      paa = true;
    }
    ctx.stroke();
    const m = prof.punkter[markoer];
    if (prof.ryg !== null) {
      const r = prof.punkter[prof.ryg];
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#9e0142'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(g.x(r.km), M.o); ctx.lineTo(g.x(r.km), g.h - M.n); ctx.stroke();
      // Den rette linje fra ryggen til markøren: hældningen er hastigheden.
      if (m.alder !== null) {
        ctx.strokeStyle = '#7a4fd6'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(g.x(r.km), g.y(r.alder)); ctx.lineTo(g.x(m.km), g.y(m.alder)); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = '#7a4fd6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.x(m.km), M.o); ctx.lineTo(g.x(m.km), g.h - M.n); ctx.stroke();
    if (m.alder !== null) {
      ctx.beginPath(); ctx.arc(g.x(m.km), g.y(m.alder), 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    }
    if (document.activeElement === graf) {
      ctx.strokeStyle = '#7a4fd6'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, g.w - 2, g.h - 2);
    }
  }
  function tilPunkt(clientX) {
    const b = graf.getBoundingClientRect(), g = geometri();
    const km = (clientX - b.left - M.v) / (g.w - M.v - M.h) * (g.maxX - g.minX) + g.minX + g.nul;
    markoer = Math.max(0, Math.min(N, Math.round(km / prof.laengde * N)));
    opdater();
  }
  graf.addEventListener('pointerdown', e => {
    if (!prof) return;
    graf.setPointerCapture(e.pointerId);
    tilPunkt(e.clientX);
  });
  graf.addEventListener('pointermove', e => { if (prof && graf.hasPointerCapture(e.pointerId)) tilPunkt(e.clientX); });
  graf.addEventListener('keydown', e => {
    if (!prof) return;
    const ny = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 30, PageDown: -30 }[e.key];
    if (ny !== undefined) markoer += e.shiftKey ? ny * 10 : ny;
    else if (e.key === 'Home') markoer = 0;
    else if (e.key === 'End') markoer = N;
    else return;
    e.preventDefault();
    markoer = Math.max(0, Math.min(N, markoer));
    opdater();
  });
  graf.addEventListener('focus', tegnGraf);
  graf.addEventListener('blur', tegnGraf);
  new ResizeObserver(tegnGraf).observe(graf);

  return {
    get profil() { return prof; },
    get markoer() { return markoer; },
    vaelg(id) { valg.value = id; vaelg(id); },
    sluk() { valg.value = ''; vaelg(''); },
    beskrivelse() { return prof ? `Aldersprofil ${navn}: ${tekst()}` : ''; }
  };
}
