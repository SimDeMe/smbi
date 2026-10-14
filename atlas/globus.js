// Ortografisk projektion: geografisk klipning og poler håndteres af D3.
// Canvas 2D kræver hverken grafikkortadgang eller WebGL.
import { hentPladegraenser, tegnPladegraenser } from './pladelag.js';

export async function startGlobus(steder, vaelgSted) {
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
    projektion.translate([bredde / 2, hoejde / 2]).scale(Math.min(bredde, hoejde) * 0.455 * zoom).rotate([-centrum[0], -centrum[1]]);
    ctx.beginPath(); sti({ type: 'Sphere' });
    ctx.fillStyle = '#bcdfee'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); sti(net); ctx.strokeStyle = '#76aab8'; ctx.lineWidth = 0.55; ctx.stroke();
    ctx.beginPath(); sti(lande); ctx.fillStyle = '#d9e2bb'; ctx.fill(); ctx.strokeStyle = '#527368'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); sti(graenser); ctx.strokeStyle = '#7b9379'; ctx.lineWidth = 0.55; ctx.stroke();
    if (pladelag) tegnPladegraenser(ctx, sti, projektion, punkt => d3.geoDistance(centrum, punkt) < Math.PI / 2, projektion.scale());
    // En diskret rand giver rumlighed, men angiver ingen faglige måledata.
    const radius = projektion.scale();
    const skygge = ctx.createRadialGradient(bredde / 2 - radius * .25, hoejde / 2 - radius * .25, radius * .35, bredde / 2, hoejde / 2, radius);
    skygge.addColorStop(0, '#ffffff00'); skygge.addColorStop(.8, '#17211f00'); skygge.addColorStop(1, '#17211f25');
    ctx.fillStyle = skygge; ctx.fillRect(0, 0, bredde, hoejde);
    ctx.restore();
    ctx.beginPath(); sti({ type: 'Sphere' }); ctx.strokeStyle = '#17211f'; ctx.lineWidth = 2; ctx.stroke();
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
    document.querySelector('#zoomniveau').textContent = `${zoom.toFixed(1).replace('.', ',')}×`;
    document.querySelector('#zoom-ud').disabled = zoom <= .75;
    document.querySelector('#zoom-ind').disabled = zoom >= 3;
  }
  function opdater() { if (!ramme) ramme = requestAnimationFrame(tegn); }
  function afgraens() {
    centrum[0] = ((centrum[0] + 180) % 360 + 360) % 360 - 180;
    centrum[1] = Math.max(-85, Math.min(85, centrum[1]));
    zoom = Math.max(.75, Math.min(3, zoom));
    opdater();
  }
  function tilpas() {
    bredde = rum.clientWidth; hoejde = rum.clientHeight;
    const taethed = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bredde * taethed); canvas.height = Math.round(hoejde * taethed);
    ctx.setTransform(taethed, 0, 0, taethed, 0, 0);
    opdater();
  }
  function drej(retning) {
    const delta = 12 / zoom;
    if (retning === 'vest') centrum[0] -= delta;
    if (retning === 'oest') centrum[0] += delta;
    if (retning === 'nord') centrum[1] += delta;
    if (retning === 'syd') centrum[1] -= delta;
    afgraens();
  }
  function zoomMed(faktor) { zoom *= faktor; afgraens(); }
  function nulstil() { centrum = [...start]; zoom = 1; afgraens(); }
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
  const afstand = () => {
    const [a, b] = [...fingre.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
    fingre.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (fingre.size === 2) forrigeAfstand = afstand();
  });
  canvas.addEventListener('pointermove', event => {
    const forrige = fingre.get(event.pointerId);
    if (!forrige) return;
    fingre.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (fingre.size === 2) {
      const nyAfstand = afstand();
      if (forrigeAfstand > 0) zoom *= nyAfstand / forrigeAfstand;
      forrigeAfstand = nyAfstand;
    } else {
      const graderPrPixel = 90 / (Math.min(bredde, hoejde) * .455 * zoom);
      centrum[0] -= (event.clientX - forrige.x) * graderPrPixel;
      centrum[1] += (event.clientY - forrige.y) * graderPrPixel;
    }
    afgraens();
  });
  const slip = event => { fingre.delete(event.pointerId); forrigeAfstand = 0; };
  canvas.addEventListener('pointerup', slip);
  canvas.addEventListener('pointercancel', slip);
  canvas.addEventListener('lostpointercapture', slip);
  new ResizeObserver(tilpas).observe(rum);
  tilpas();
  return {
    visSted(sted) { centrum = [...sted.koordinater]; zoom = 1.4; afgraens(); },
    // Data hentes først, når laget slås til; fejl lader globussen være uændret.
    async visPladegraenser(vis) {
      if (vis) await hentPladegraenser();
      pladelag = vis;
      opdater();
    }
  };
}
