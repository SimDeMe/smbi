// Ortografisk projektion: geografisk klipning og poler håndteres af D3.
// Canvas 2D kræver hverken grafikkortadgang eller WebGL.

export async function startGlobus(steder, vaelgSted, vaelgLand) {
  const d3 = window.d3;
  const topojson = window.topojson;
  if (!d3?.geoOrthographic || !topojson?.feature) throw new Error('Kortbibliotek mangler');
  const canvas = document.querySelector('#globus');
  const rum = document.querySelector('#globusrum');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D er ikke tilgængelig');
  const svar = await fetch(new URL('./data/countries-110m.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
  if (!svar.ok) throw new Error('Kortdata kunne ikke indlæses');
  const topologi = await svar.json();
  const lande = topojson.feature(topologi, topologi.objects.countries);
  const graenser = topojson.mesh(topologi, topologi.objects.countries, (a, b) => a !== b);
  const oversigt = { lande, graenser, danmark: lande.features.find(land => land.id === '208') };
  // Tæt på skifter kortet til 1:50 mio., så kyster og øer ikke bliver kantede.
  // Det hentes først ved behov; indtil da (eller ved fejl) bruges 1:110 mio.
  const MAKS_ZOOM = 10, DETALJE_ZOOM = 2.5;
  let detalje, henterDetalje = false;
  async function hentDetalje() {
    henterDetalje = true;
    try {
      const svar = await fetch(new URL('./data/countries-50m.json', import.meta.url), { signal: AbortSignal.timeout(20000) });
      if (!svar.ok) return;
      const t = await svar.json();
      const l = topojson.feature(t, t.objects.countries);
      detalje = { lande: l, graenser: topojson.mesh(t, t.objects.countries, (a, b) => a !== b),
        danmark: l.features.find(land => land.id === '208') };
      opdater();
    } catch { /* Oversigtskortet bliver stående. */ }
  }
  const kort = () => zoom > DETALJE_ZOOM && detalje ? detalje : oversigt;
  let landekort;
  let quiz;
  let foerQuiz;
  const net = d3.geoGraticule10();
  const projektion = d3.geoOrthographic().clipAngle(90).precision(0.4);
  const sti = d3.geoPath(projektion, ctx);
  const start = [-22, 42];
  let centrum = [...start];
  let zoom = 1;
  let bredde = 0;
  let hoejde = 0;
  let ramme = 0;
  let pladelag = false;
  let plademodul;
  let navnemodul;
  let graensemodul;
  let pladevisning = { navne: false, bevaegelse: false };
  const markoerlag = document.querySelector('#markoerer');
  const markoerer = steder.map(sted => {
    const knap = document.createElement('button');
    knap.className = 'markoer';
    knap.dataset.sted = sted.id;
    knap.setAttribute('aria-label', `${sted.navn}: se forklaring og simulationer`);
    const prik = document.createElement('span');
    prik.className = 'prik';
    const etiket = document.createElement('span');
    etiket.className = 'etiket';
    etiket.textContent = sted.kortnavn || sted.navn;
    knap.append(prik, etiket);
    knap.onclick = () => vaelgSted(sted);
    markoerlag.append(knap);
    return { sted, knap, etiket };
  });

  function tegn() {
    ramme = 0;
    ctx.clearRect(0, 0, bredde, hoejde);
    if (landekort) {
      landekort.tegn(ctx, bredde, hoejde);
      visZoom(landekort.zoom, 1, 8);
      return;
    }
    opdaterProjektion();
    for (const { sted, knap, etiket } of markoerer) {
      const [x, y] = projektion(sted.koordinater);
      const synlig = d3.geoDistance(centrum, sted.koordinater) < Math.PI / 2 - .035 && x > 22 && x < bredde - 22 && y > 22 && y < hoejde - 22;
      knap.hidden = !synlig;
      if (synlig) {
        knap.style.left = `${x}px`; knap.style.top = `${y}px`;
        // Skjul kun etiketten ved kanten; stedets knap bevarer sit navn.
        etiket.hidden = x < 125 || x > bredde - 90;
      }
    }
    ctx.beginPath(); sti({ type: 'Sphere' });
    ctx.fillStyle = '#bcdfee'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); sti(net); ctx.strokeStyle = '#76aab8'; ctx.lineWidth = 0.55; ctx.stroke();
    const { lande: landflader, graenser: landegraenser, danmark } = kort();
    if (zoom > DETALJE_ZOOM && !henterDetalje) hentDetalje();
    ctx.beginPath(); sti(landflader); ctx.fillStyle = '#d9e2bb'; ctx.fill(); ctx.strokeStyle = '#527368'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); sti(landegraenser); ctx.strokeStyle = '#7b9379'; ctx.lineWidth = 0.55; ctx.stroke();
    if (quiz) quiz.tegn(ctx, sti, projektion, punkt => d3.geoDistance(centrum, punkt) < Math.PI / 2 - .02);
    else {
      ctx.beginPath(); sti(danmark); ctx.fillStyle = '#65b4d8'; ctx.fill(); ctx.strokeStyle = '#075b8b'; ctx.lineWidth = 1.5; ctx.stroke();
      if (pladelag) plademodul.tegnPladegraenser(ctx, sti, projektion, punkt => d3.geoDistance(centrum, punkt) < Math.PI / 2, projektion.scale());
    }
    // En diskret rand giver rumlighed, men angiver ingen faglige måledata.
    const radius = projektion.scale();
    const skygge = ctx.createRadialGradient(bredde / 2 - radius * .25, hoejde / 2 - radius * .25, radius * .35, bredde / 2, hoejde / 2, radius);
    skygge.addColorStop(0, '#ffffff00'); skygge.addColorStop(.8, '#17211f00'); skygge.addColorStop(1, '#17211f25');
    ctx.fillStyle = skygge; ctx.fillRect(0, 0, bredde, hoejde);
    if (!quiz && pladelag && (pladevisning.navne || pladevisning.bevaegelse)) {
      const c = canvas.getBoundingClientRect();
      const undgaa = [...document.querySelectorAll('.markoer:not([hidden]) .prik, .markoer:not([hidden]) .etiket:not([hidden]), #signatur, #pladevalg:popover-open, .betjeningslinje button')]
        .filter(el => el.getClientRects().length).map(el => {
          const r = el.getBoundingClientRect();
          return { x: r.left - c.left - 4, y: r.top - c.top - 4, w: r.width + 8, h: r.height + 8 };
        });
      const synlig = punkt => d3.geoDistance(centrum, punkt) < Math.PI / 2 - .25;
      if (pladevisning.bevaegelse) undgaa.push(...graensemodul.tegnGraensehastigheder(ctx, projektion, synlig, undgaa));
      if (pladevisning.navne) navnemodul.tegnPlader(ctx, projektion, synlig, pladevisning, undgaa);
    }
    ctx.restore();
    ctx.beginPath(); sti({ type: 'Sphere' }); ctx.strokeStyle = '#17211f'; ctx.lineWidth = 2; ctx.stroke();
    visZoom(zoom, .75, MAKS_ZOOM);
  }
  function visZoom(niveau, min, max) {
    document.querySelector('#zoomniveau').textContent = `${niveau.toFixed(1).replace('.', ',')}×`;
    document.querySelector('#zoom-ud').disabled = niveau <= min;
    document.querySelector('#zoom-ind').disabled = niveau >= max;
  }
  function opdaterProjektion() {
    projektion.translate([bredde / 2, hoejde / 2]).scale(Math.min(bredde, hoejde) * .455 * zoom).rotate([-centrum[0], -centrum[1]])
      .clipExtent(quiz || zoom > 3 ? [[0, 0], [bredde, hoejde]] : null);
  }
  function opdater() { if (!ramme) ramme = requestAnimationFrame(tegn); }
  function afgraens() {
    centrum[0] = ((centrum[0] + 180) % 360 + 360) % 360 - 180;
    centrum[1] = Math.max(-85, Math.min(85, centrum[1]));
    zoom = Math.max(.75, Math.min(MAKS_ZOOM, zoom));
    opdater();
  }
  function tilpas() {
    bredde = rum.clientWidth; hoejde = rum.clientHeight;
    const taethed = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bredde * taethed); canvas.height = Math.round(hoejde * taethed);
    ctx.setTransform(taethed, 0, 0, taethed, 0, 0);
    // Ny størrelse tømmer lærredet; tegn med det samme, så ingen frame vises blank.
    cancelAnimationFrame(ramme);
    tegn();
  }
  function drej(retning) {
    if (landekort) {
      const delta = { vest: [40, 0], oest: [-40, 0], nord: [0, 40], syd: [0, -40] }[retning];
      landekort.flyt(...delta); opdater(); return;
    }
    const delta = 12 / zoom;
    if (retning === 'vest') centrum[0] -= delta;
    if (retning === 'oest') centrum[0] += delta;
    if (retning === 'nord') centrum[1] += delta;
    if (retning === 'syd') centrum[1] -= delta;
    afgraens();
  }
  function zoomMed(faktor) {
    if (landekort) { landekort.zoomMed(faktor); opdater(); }
    else { zoom *= faktor; afgraens(); }
  }
  function nulstil() {
    if (landekort) { landekort.nulstil(); opdater(); }
    else { centrum = quiz ? [...quiz.udsnit.centrum] : [...start]; zoom = quiz ? quiz.udsnit.zoom : 1; afgraens(); }
  }
  for (const knap of document.querySelectorAll('[data-drej]')) knap.onclick = () => drej(knap.dataset.drej);
  document.querySelector('#zoom-ind').onclick = () => zoomMed(1.2);
  document.querySelector('#zoom-ud').onclick = () => zoomMed(1 / 1.2);
  document.querySelector('#nulstil').onclick = nulstil;

  // Piletaster virker også efter klik uden for canvas. Komponenters egne
  // tastaturhandlinger har forrang; lyt i bubble-fasen uden at flytte fokus.
  const retninger = { ArrowLeft: 'vest', ArrowRight: 'oest', ArrowUp: 'nord', ArrowDown: 'syd' };
  const egnePiletaster = [
    'slider', 'spinbutton', 'textbox', 'searchbox', 'combobox', 'listbox', 'option',
    'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radiogroup',
    'radio', 'tablist', 'tab', 'tree', 'treeitem', 'treegrid', 'grid', 'gridcell',
    'row', 'columnheader', 'rowheader', 'scrollbar', 'separator', 'toolbar',
    'application', 'dialog', 'alertdialog'
  ];
  const egenBetjening = ['input', 'textarea', 'select', '[aria-activedescendant]', '[popover]',
    ...egnePiletaster.map(rolle => `[role~="${rolle}"]`)].join(',');
  document.addEventListener('keydown', event => {
    const retning = retninger[event.key];
    if (!retning || event.defaultPrevented || event.isComposing ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if ([...document.querySelectorAll('dialog[open], [aria-modal="true"]')]
      .some(visning => visning.getClientRects().length)) return;
    if (event.composedPath().some(el => el instanceof Element &&
      (el.isContentEditable || el.matches(egenBetjening)))) return;
    drej(retning);
    event.preventDefault();
  });

  // Zoom og Home beholder deres lokale fokuskrav. Pile håndteres kun ovenfor,
  // så et tastetryk på canvas ikke også giver endnu en rotation via bubbling.
  canvas.addEventListener('keydown', event => {
    if (quiz && !event.defaultPrevented && !event.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey) {
      if (event.key === 'Enter') {
        opdaterProjektion();
        quiz.svar(quiz.find(centrum, [bredde / 2, hoejde / 2], projektion,
          punkt => d3.geoDistance(centrum, punkt) < Math.PI / 2 - .02));
        event.preventDefault(); return;
      }
      if (event.shiftKey && retninger[event.key]) {
        const delta = .6 / zoom;
        if (event.key === 'ArrowLeft') centrum[0] -= delta;
        if (event.key === 'ArrowRight') centrum[0] += delta;
        if (event.key === 'ArrowUp') centrum[1] += delta;
        if (event.key === 'ArrowDown') centrum[1] -= delta;
        afgraens(); event.preventDefault(); return;
      }
    }
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey ||
        event.metaKey || (event.shiftKey && event.key !== '+')) return;
    if (event.key === '+' || event.key === '=') zoomMed(1.2);
    else if (event.key === '-') zoomMed(1 / 1.2);
    else if (event.key === 'Home') nulstil();
    else return;
    event.preventDefault();
  });
  canvas.addEventListener('wheel', event => {
    if (document.activeElement !== canvas && !event.ctrlKey) return;
    event.preventDefault();
    zoomMed(Math.exp(-event.deltaY * .002));
  }, { passive: false });

  const fingre = new Map();
  let forrigeAfstand = 0;
  let tryk;
  function rammerDanmark(event) {
    const r = canvas.getBoundingClientRect();
    const punkt = [event.clientX - r.left, event.clientY - r.top];
    return !landekort && Math.hypot(punkt[0] - bredde / 2, punkt[1] - hoejde / 2) <= projektion.scale() &&
      d3.geoContains(kort().danmark, projektion.invert(punkt));
  }
  function quizLand(event) {
    opdaterProjektion();
    const r = canvas.getBoundingClientRect();
    const xy = [event.clientX - r.left, event.clientY - r.top];
    if (Math.hypot(xy[0] - bredde / 2, xy[1] - hoejde / 2) > projektion.scale()) return;
    return quiz.find(projektion.invert(xy), xy, projektion,
      punkt => d3.geoDistance(centrum, punkt) < Math.PI / 2 - .02);
  }
  const afstand = () => {
    const [a, b] = [...fingre.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
    fingre.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (fingre.size === 1) tryk = { x: event.clientX, y: event.clientY, flyttet: false };
    else if (tryk) tryk.flyttet = true;
    if (fingre.size === 2) forrigeAfstand = afstand();
  });
  canvas.addEventListener('pointermove', event => {
    const forrige = fingre.get(event.pointerId);
    if (!forrige) {
      if (event.pointerType === 'mouse') {
        const land = quiz ? quizLand(event) : rammerDanmark(event);
        canvas.style.cursor = land ? 'pointer' : '';
        canvas.title = !quiz && land ? 'Danmark — klik for landekort' : '';
      }
      return;
    }
    if (tryk && Math.hypot(event.clientX - tryk.x, event.clientY - tryk.y) > 6) tryk.flyttet = true;
    fingre.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (fingre.size === 2) {
      const nyAfstand = afstand();
      if (forrigeAfstand > 0) zoomMed(nyAfstand / forrigeAfstand);
      forrigeAfstand = nyAfstand;
    } else if (landekort) {
      landekort.flyt(event.clientX - forrige.x, event.clientY - forrige.y);
    } else {
      const graderPrPixel = 90 / (Math.min(bredde, hoejde) * .455 * zoom);
      centrum[0] -= (event.clientX - forrige.x) * graderPrPixel;
      centrum[1] += (event.clientY - forrige.y) * graderPrPixel;
    }
    afgraens();
  });
  const slip = event => {
    if (event.type === 'pointerup' && fingre.size === 1 && tryk && !tryk.flyttet && !landekort &&
        Math.hypot(event.clientX - tryk.x, event.clientY - tryk.y) <= 6) {
      if (quiz) quiz.svar(quizLand(event));
      else if (rammerDanmark(event)) vaelgLand();
    }
    fingre.delete(event.pointerId); forrigeAfstand = 0;
    // En afbrudt berøring eller det sidste løft efter et knib er aldrig et landevalg.
    if (tryk) tryk.flyttet = true;
  };
  canvas.addEventListener('pointerup', slip);
  canvas.addEventListener('pointercancel', slip);
  canvas.addEventListener('lostpointercapture', slip);
  canvas.addEventListener('pointerleave', () => { canvas.style.cursor = ''; canvas.title = ''; });
  new ResizeObserver(tilpas).observe(rum);
  tilpas();
  return {
    gentegn: opdater,
    visQuiz(ny) {
      if (ny && !quiz) {
        foerQuiz = { centrum: [...centrum], zoom };
        centrum = [...ny.udsnit.centrum]; zoom = ny.udsnit.zoom;
      } else if (!ny && quiz) { centrum = foerQuiz.centrum; zoom = foerQuiz.zoom; }
      quiz = ny; fingre.clear(); tryk = null; canvas.title = ''; canvas.style.cursor = ''; afgraens();
    },
    quizUdsnit(punkt, niveau) { if (quiz) { centrum = [...punkt]; zoom = niveau; afgraens(); } },
    visLand(kort) { landekort = kort; fingre.clear(); tryk = null; canvas.style.cursor = ''; canvas.title = ''; opdater(); },
    visSted(sted) { centrum = [...sted.koordinater]; zoom = 1.4; afgraens(); },
    // Data hentes først, når laget slås til; fejl lader globussen være uændret.
    async visPladegraenser(vis) {
      if (vis) {
        plademodul = await import('./pladelag.js');
        await plademodul.hentPladegraenser();
      }
      pladelag = vis;
      opdater();
    },
    async visPladeoplysninger(valg) {
      const ny = { ...pladevisning, ...valg };
      if (ny.navne) {
        navnemodul = await import('./pladebevaegelse.js');
        await navnemodul.hentPlader();
      }
      if (ny.bevaegelse) {
        graensemodul = await import('./graensehastigheder.js');
        await graensemodul.hentGraensehastigheder();
      }
      pladevisning = ny;
      opdater();
    }
  };
}
