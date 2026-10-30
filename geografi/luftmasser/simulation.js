import { FORLOEB, TRINSEKUNDER, vejrtilstand } from './forloeb.mjs';
const $ = id => document.getElementById(id);
const svg = $('landskab'), figur = $('figur');
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
let profil = 'stabil', tid = 0, afspiller = !reduceret.matches, frame = null, sidst = null, vistTrin = -1;
let W = 0, H = 0;
const slut = TRINSEKUNDER * 4;
const typer = [...document.querySelectorAll('[data-profil]')];
const trinknapper = [...document.querySelectorAll('[data-trin]')];
function trae(x, y, s, farve = '#37685b') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-25" stroke="#665449" stroke-width="3"/><path d="M-15 -18C-31 -27 -20 -45 -9 -43C-9 -62 17 -61 19 -43C38 -40 31 -18 13 -19Z" fill="${farve}"/><path d="M-5 -44C-16 -39 -18 -29 -11 -27" fill="none" stroke="#96ac78" opacity=".35" stroke-width="4"/></g>`;
}
function hus(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-17" y="-25" width="34" height="25" fill="#f6e8c8"/><path d="M-23 -25 0 -44 23 -25Z" fill="#a3634f"/><path d="M-16 -25H17" stroke="#774e40" stroke-width="2"/><rect x="-3" y="-15" width="8" height="15" fill="#647776"/><rect x="-12" y="-18" width="5" height="7" fill="#7bafb6"/><rect x="8" y="-18" width="5" height="7" fill="#7bafb6"/></g>`;
}
function bygLandskab() {
  W = figur.clientWidth; H = figur.clientHeight;
  if (!W || !H) return;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const hor = H * .77, skala = Math.min(1.2, W / 650), nat = profil === 'inversion';
  let skov = '';
  for (let i = 0; i < 11; i++) skov += trae(W * (.03 + i * .027), hor + H * (.035 + Math.sin(i * .8) * .008), (.5 + (i % 3) * .13) * skala, i % 2 ? '#477869' : '#5b8265');
  for (let i = 0; i < 5; i++) skov += trae(W * (.83 + i * .033), H * (.87 + Math.sin(i) * .008), (.8 + (i % 2) * .25) * skala);
  svg.innerHTML = `<defs>
    <linearGradient id="himmel" x2="0" y2="1"><stop id="himmel-top" stop-color="${nat ? '#7895b0' : '#8dc5df'}"/><stop offset="1" stop-color="${nat ? '#e4d8c8' : '#eef4e4'}"/></linearGradient>
    <linearGradient id="mark" x2="0.4" y2="1"><stop stop-color="#a4b977"/><stop offset="1" stop-color="#6b965f"/></linearGradient>
    <linearGradient id="skygge" x2="0.2" y2="1"><stop stop-color="#fffef6"/><stop offset=".56" stop-color="#f4f5ef"/><stop offset="1" stop-color="#c6d8dd"/></linearGradient>
    <linearGradient id="storm" x2="0.2" y2="1"><stop stop-color="#fcfcf4"/><stop offset=".4" stop-color="#e1e7e5"/><stop offset="1" stop-color="#6c8290"/></linearGradient>
    <linearGradient id="regnfarve" x2="0" y2="1"><stop stop-color="#55768c" stop-opacity=".5"/><stop offset="1" stop-color="#81a9b7" stop-opacity="0"/></linearGradient>
    <linearGradient id="disfarve" x2="0" y2="1"><stop stop-color="#f2f1df" stop-opacity="0"/><stop offset=".5" stop-color="#eceddc" stop-opacity=".85"/><stop offset="1" stop-color="#edf0df" stop-opacity=".3"/></linearGradient>
    <radialGradient id="solglod"><stop stop-color="#fff6b5" stop-opacity=".8"/><stop offset="1" stop-color="#fff6b5" stop-opacity="0"/></radialGradient>
    <radialGradient id="jordvarme"><stop stop-color="#edaa4d" stop-opacity=".6"/><stop offset="1" stop-color="#edaa4d" stop-opacity="0"/></radialGradient>
    <marker id="pil" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10Z" fill="context-stroke"/></marker>
    <path id="skyform" d="M-89 0C-123 -2 -121 -33 -98 -38C-105 -62 -77 -77 -56 -63C-54 -101 -5 -114 13 -80C43 -100 74 -69 67 -47C106 -58 131 -19 107 -2C77 9 -58 9 -89 0Z"/>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#himmel)"/>
  <g id="sol">${nat ? `<path d="M${W * .16 - 12} ${H * .18 - 16}a20 20 0 1 0 24 27a17 17 0 0 1-24-27" fill="#fff6cf"/>` : `<circle cx="${W * .14}" cy="${H * .21}" r="${H * .19}" fill="url(#solglod)"/><circle cx="${W * .14}" cy="${H * .21}" r="${Math.min(25, W * .035)}" fill="#fff5c1"/>`}</g>
  <path d="M0 ${hor - 4}Q${W * .15} ${hor - H * .16} ${W * .34} ${hor - H * .04}T${W * .72} ${hor - H * .07}Q${W * .88} ${hor - H * .2} ${W} ${hor - H * .08}V${H}H0Z" fill="#92afa0"/>
  <path d="M0 ${hor + 10}Q${W * .19} ${hor - H * .035} ${W * .36} ${hor + H * .04}T${W * .75} ${hor + H * .01}Q${W * .9} ${hor - H * .035} ${W} ${hor + 10}V${H}H0Z" fill="#aabe8c"/>
  <path d="M0 ${hor + H * .06}Q${W * .22} ${hor + H * .13} ${W * .5} ${hor + H * .07}T${W} ${hor + H * .12}V${H}H0Z" fill="url(#mark)"/>
  <path d="M${W * .4} ${hor + 18}Q${W * .53} ${H * .88} ${W * .46} ${H}H${W * .48}Q${W * .55} ${H * .88} ${W * .41} ${hor + 18}Z" fill="#b6ccd0"/>
  <path d="M0 ${H * .94}Q${W * .35} ${H * .81} ${W * .66} ${H * .94}L${W * .73} ${H}H0Z" fill="#c6be7a"/>
  <g stroke="#e9db9c" stroke-width="1" opacity=".45">${Array.from({length:8},(_,i)=>`<path d="M${W * (.03 + i * .06)} ${H}Q${W * (.2 + i * .028)} ${H * .9} ${W * .36} ${H * .91}" fill="none"/>`).join('')}</g>
  <path d="M${W * .74} ${hor + 12}Q${W * .69} ${H * .9} ${W * .81} ${H}" fill="none" stroke="#dacdb1" stroke-width="${8 * skala}"/>
  ${skov}${hus(W * .77, H * .85, .8 * skala)}${hus(W * .83, H * .86, .6 * skala)}${hus(W * .74, H * .88, .65 * skala)}
  <g id="vejr"></g>`;
  tegnVejr();
}
function sky(x, y, bredde, hoejde, opacity = 1, storm = false) {
  return `<g transform="translate(${x} ${y}) scale(${bredde / 220} ${hoejde / 100})" opacity="${opacity}"><use href="#skyform" fill="url(#${storm ? 'storm' : 'skygge'})"/><path d="M-86 -4Q0 7 98 -5" fill="none" stroke="${storm ? '#536c7b' : '#a9bec8'}" stroke-width="2" opacity=".25"/></g>`;
}
function stroem(d, farve, styrke, fart = 1) {
  if (styrke < .005) return '';
  const bredde = W < 500 ? 2.4 : 3;
  return `<path d="${d}" fill="none" stroke="${farve}" stroke-width="${bredde}" stroke-linecap="round" stroke-dasharray="2 9" stroke-dashoffset="${-tid * 20 * fart}" marker-end="url(#pil)" opacity="${styrke}"/>`;
}
function tegnVejr() {
  if (!W || !H) return;
  const v = vejrtilstand(profil, tid), cx = W * .57, jord = H * .8, base = H * .52;
  const unit = Math.min(W / 850, H / 420), smal = W < 500;
  const o = [], orange = '#c56b35', blaa = '#3e809e';
  $('himmel-top').setAttribute('stop-color', profil === 'inversion' ? '#7895b0' : v.regn > .2 ? '#8aa6ba' : '#8dc5df');
  if (profil === 'inversion') {
    const lag = H * .54;
    o.push(`<rect x="0" y="${lag - H * .06}" width="${W}" height="${H * .13}" fill="#e8b076" opacity="${v.inversion * .24}"/>`);
    o.push(`<path d="M${W * .05} ${lag}Q${W * .5} ${lag - 10} ${W * .95} ${lag}" fill="none" stroke="#ae784c" stroke-width="1.4" stroke-dasharray="7 7" opacity="${v.inversion * .65}"/>`);
    o.push(`<path d="M0 ${H * .62}Q${W * .5} ${H * .5} ${W} ${H * .64}V${H * .9}H0Z" fill="url(#disfarve)" opacity="${v.dis}"/>`);
    for (let i = 0; i < 5; i++) o.push(`<path d="M${W * (.08 + i * .16)} ${H * (.71 + i % 2 * .025)}q${W * .07} -8 ${W * .14} 0" fill="none" stroke="#faf7e9" stroke-width="${7 * unit + 3}" opacity="${v.dis * .4}"/>`);
    o.push(stroem(`M${W * .45} ${jord - 10}C${W * .47} ${H * .61} ${W * .5} ${H * .57} ${W * .57} ${H * .64}Q${W * .63} ${H * .7} ${W * .65} ${jord - 18}`, blaa, v.inversion * .7, .45));
    if (v.inversion > .1) o.push(`<text x="${W * .72}" y="${lag - 10}" text-anchor="middle" opacity="${v.inversion}">Varm luft</text><text x="${W * .72}" y="${H * .74}" text-anchor="middle" opacity="${v.inversion}">Kold luft og dis</text>`);
  } else {
    o.push(`<ellipse cx="${cx}" cy="${jord + 6}" rx="${W * .18}" ry="${H * .07}" fill="url(#jordvarme)" opacity="${v.varme}"/>`);
    for (let i = 0; i < 4; i++) {
      const p = (tid * .25 + i * .25) % 1, x = cx + (i - 1.5) * 20 * unit;
      o.push(`<path d="M${x} ${jord - 8 - p * 35 * unit}q${6 * unit} ${-8 * unit} 0 ${-16 * unit}t0 ${-16 * unit}" fill="none" stroke="${orange}" stroke-width="2" opacity="${v.varme * (1 - p) * .5}"/>`);
    }
    const sommet = base - H * .35 * v.taarn;
    // Pilene forbliver synlige under skybasen.
    o.push(stroem(`M${cx - W * .04} ${jord - 16}C${cx - W * .07} ${H * .65} ${cx - W * .025} ${H * .61} ${cx} ${base + 10}`, orange, v.loeft));
    if (v.taarn > .05) o.push(stroem(`M${cx + W * .04} ${jord - 18}Q${cx + W * .01} ${H * .64} ${cx + W * .035} ${base + 14}`, orange, v.taarn * .8, 1.25));
    if (v.taarn < .6) o.push(stroem(`M${cx - W * .035} ${base + 9}C${cx - W * .2} ${base - 13} ${cx - W * .23} ${H * .65} ${cx - W * .24} ${H * .72}`, blaa, v.loeft * (1 - v.taarn) * .7, .7));
    // Små, flade skyer i det stabile forløb; én voksende sky i bygeforløbene.
    if (v.skyer > .005) {
      const driv = Math.sin(tid * .18) * 5 * unit;
      if (profil === 'stabil') {
        o.push(sky(cx + driv, base, W * .19, H * .095, v.skyer));
        o.push(sky(W * .27 + driv * .7, H * .44, W * .12, H * .065, v.skyer * .85));
        o.push(sky(W * .82 + driv, H * .4, W * .1, H * .055, v.skyer * .8));
      } else {
        o.push(sky(cx, base, W * (.2 + .06 * v.taarn), H * (.1 + .31 * v.taarn), v.skyer, v.taarn > .15));
        if (v.taarn > .3) {
          // De øverste skypartier breder sig til en ambolt i stabil luft højt oppe.
          const ambolt = Math.max(0, (v.taarn - .3) / .7);
          o.push(`<path d="M${cx - W * .1} ${sommet + H * .075}C${cx - W * .24} ${sommet + H * .09} ${cx - W * .28} ${sommet + H * .005} ${cx - W * .14} ${sommet + H * .005}Q${cx} ${sommet - H * .015} ${cx + W * .18} ${sommet + H * .005}L${cx + W * .31} ${sommet + H * .015}Q${cx + W * .3} ${sommet + H * .055} ${cx + W * .15} ${sommet + H * .07}L${cx + W * .08} ${sommet + H * .13}Z" fill="url(#skygge)" opacity="${ambolt}"/>`);
          o.push(sky(cx - W * .012, base - H * .07 * v.taarn, W * .23, H * .18, v.taarn, true));
          o.push(sky(cx - W * .022, base - H * .19 * v.taarn, W * .17, H * .15, v.taarn));
        }
      }
    }
    if (v.ekstra > .01) {
      o.push(stroem(`M${W * .23} ${jord - 5}Q${W * .4} ${jord - 18} ${cx - 14} ${jord - 12}`, blaa, v.ekstra));
      o.push(stroem(`M${W * .9} ${jord - 5}Q${W * .73} ${jord - 18} ${cx + 18} ${jord - 12}`, blaa, v.ekstra));
      o.push(`<text x="${cx}" y="${jord + H * .07}" text-anchor="middle" opacity="${v.ekstra}">Vindene mødes → luft løftes</text>`);
    }
    if (v.regn > .01) {
      const rx = cx + W * .09;
      o.push(`<path d="M${cx + W * .005} ${base}H${cx + W * .19}L${cx + W * .22} ${jord}H${cx + W * .04}Z" fill="url(#regnfarve)" opacity="${v.regn * .18}"/>`);
      for (let i = 0; i < 65; i++) {
        const p = (tid * .9 + i * .618034) % 1, x = rx + ((i * .754877) % 1 - .5) * W * .16 + p * W * .025, y = base + p * (jord - base - 10);
        o.push(`<path d="M${x} ${y}l${3 * unit} ${10 * unit + 3}" stroke="#507d96" stroke-width="${smal ? 1 : 1.4}" opacity="${v.regn * .65}"/>`);
      }
      o.push(stroem(`M${cx + W * .22} ${base + 20}C${cx + W * .23} ${H * .68} ${cx + W * .23} ${jord - 10} ${cx + W * .32} ${jord - 7}`, blaa, v.regn * .85, 1.2));
      // Et lille lyn i skyen, uden blinkende baggrund; højst ét hvert 5,5 sekund.
      const lyn = reduceret.matches || !afspiller || tid % 5.5 > 5.12;
      if (lyn) o.push(`<path d="M${cx + W * .09} ${base - H * .1}l${-W * .035} ${H * .09}h${W * .028}l${-W * .035} ${H * .1}" fill="none" stroke="#fff1ad" stroke-width="${3 * unit + 1}" stroke-linejoin="miter" opacity="${v.regn}"/>`);
    }
  }
  $('vejr').innerHTML = o.join('');
  figur.dataset.vejr = v.regn > .5 ? 'torden' : v.dis > .5 ? 'dis' : v.skyer > .5 ? 'smaaskyer' : 'start';
  figur.dataset.taarn = v.taarn.toFixed(2);
}
function opdaterTekst() {
  const t = vejrtilstand(profil, tid).trin, f = FORLOEB[profil];
  if (t !== vistTrin) {
    vistTrin = t;
    trinknapper.forEach((k, i) => k.setAttribute('aria-pressed', String(i === t)));
    $('trin-titel').textContent = f.trin[t][0]; $('trin-tekst').textContent = f.trin[t][1];
    $('figurtekst').textContent = `${f.navn}. Trin ${t + 1}: ${f.trin[t].join('. ')}`;
  }
  $('naeste').disabled = t === 3;
  $('afspil').textContent = reduceret.matches ? 'Se forfra' : afspiller ? '❚❚ Pause' : tid >= slut ? '↻ Se igen' : '▶ Afspil';
  $('afspil').setAttribute('aria-pressed', String(afspiller));
}
function stop() { cancelAnimationFrame(frame); frame = null; sidst = null; afspiller = false; }
function billede(nu) {
  if (!afspiller) return;
  if (sidst !== null) tid = Math.min(slut, tid + Math.min(.1, (nu - sidst) / 1000));
  sidst = nu;
  if (tid >= slut) stop();
  opdaterTekst(); tegnVejr();
  if (afspiller) frame = requestAnimationFrame(billede);
}
function start() { if (reduceret.matches) return; afspiller = true; sidst = null; frame = requestAnimationFrame(billede); }
function vaelgProfil(ny) {
  stop(); profil = ny; tid = 0; vistTrin = -1;
  typer.forEach(k => k.setAttribute('aria-pressed', String(k.dataset.profil === profil)));
  trinknapper.forEach((k, i) => k.querySelector('span').textContent = FORLOEB[profil].etiketter[i]);
  $('scenenavn').textContent = FORLOEB[profil].navn;
  if (!reduceret.matches) start();
  bygLandskab(); opdaterTekst();
}
function vaelgTrin(n) {
  stop(); tid = n === 3 ? slut : n * TRINSEKUNDER + TRINSEKUNDER * .88; vistTrin = -1;
  opdaterTekst(); tegnVejr();
}
typer.forEach(k => k.addEventListener('click', () => vaelgProfil(k.dataset.profil)));
trinknapper.forEach(k => k.addEventListener('click', () => vaelgTrin(Number(k.dataset.trin))));
document.querySelector('.trin').addEventListener('keydown', e => {
  const ny = { ArrowRight: vistTrin + 1, ArrowDown: vistTrin + 1, ArrowLeft: vistTrin - 1, ArrowUp: vistTrin - 1, Home: 0, End: 3 }[e.key];
  if (ny === undefined) return;
  e.preventDefault(); const n = Math.max(0, Math.min(3, ny)); vaelgTrin(n); trinknapper[n].focus();
});
$('afspil').addEventListener('click', () => {
  if (reduceret.matches) { vaelgTrin(0); return; }
  if (afspiller) stop(); else { if (tid >= slut) { tid = 0; vistTrin = -1; } start(); }
  opdaterTekst(); tegnVejr();
});
$('naeste').addEventListener('click', () => vaelgTrin(Math.min(3, vistTrin + 1)));
$('fokus').addEventListener('click', () => { const fokus = document.body.classList.toggle('fokus'); $('fokus').setAttribute('aria-pressed', String(fokus)); $('fokus').textContent = fokus ? 'Afslut fokus' : 'Fokus'; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('fokus')) $('fokus').click(); });
document.addEventListener('visibilitychange', () => { sidst = null; });
reduceret.addEventListener('change', () => { stop(); vaelgTrin(vistTrin); });
new ResizeObserver(bygLandskab).observe(figur);
vaelgProfil(profil);
