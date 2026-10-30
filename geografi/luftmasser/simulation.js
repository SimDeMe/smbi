import { KONFIG, LUFTMASSER, PROFILER, skybase, tilstand, pakketemperatur, omgivelser, fritLoeft } from './model.mjs';
const $ = id => document.getElementById(id);
const format = (n, decimal = 1) => n.toLocaleString('da-DK', { minimumFractionDigits: decimal, maximumFractionDigits: decimal });
let profil = 'stabil', massenoegle = 'maritimTropisk', z = 800, hastighed = 0, koersel = 'klar', sidst = null, frame = null;
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
const masse = () => LUFTMASSER[massenoegle];
function stop(status = 'klar') {
  cancelAnimationFrame(frame); frame = null; sidst = null; koersel = status;
}
function pil(x, y, retning, laengde, farve) {
  const ende = y - retning * laengde;
  return `<path d="M${x} ${y}V${ende}m-5 ${retning * 7} 5 ${-retning * 7} 5 ${retning * 7}" fill="none" stroke="${farve}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function tegn() {
  const m = masse(), t = tilstand(z, m, profil), base = skybase(m);
  const svg = $('landskab'), graf = $('graf');
  const w = svg.clientWidth, h = svg.clientHeight, gw = graf.clientWidth, gh = graf.clientHeight;
  if (!w || !h || !gw) return;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`); graf.setAttribute('viewBox', `0 0 ${gw} ${gh}`);
  const smal = w < 240, venstre = smal ? 34 : 48, bund = h - 30, top = 36;
  const y = hoejde => bund - hoejde / KONFIG.top * (bund - top);
  const cx = venstre + (w - venstre - 14) * .48, py = y(z), r = (smal ? 17 : 22) + z / 1000 * 1.6;
  let lag = '', gitter = '';
  // Temperaturfarver følger absolut temperatur: koldt blåligt, varmt orange.
  for (let hoejde = 0; hoejde < KONFIG.top; hoejde += 100) {
    const temp = omgivelser(hoejde + 50, m, profil), varm = Math.max(0, Math.min(1, (temp + 15) / 45));
    lag += `<rect x="${venstre}" y="${y(hoejde + 100)}" width="${w - venstre - 12}" height="${(bund - top) / 40 + .5}" fill="rgb(${Math.round(170 + 80 * varm)},${Math.round(205 + 8 * varm)},${Math.round(230 - 65 * varm)})"/>`;
  }
  for (let hoejde = 0; hoejde <= KONFIG.top; hoejde += 1000) {
    gitter += `<path d="M${venstre} ${y(hoejde)}H${w - 12}" stroke="#172b2b25"/><text x="${venstre - 7}" y="${y(hoejde) + 4}" text-anchor="end">${hoejde / 1000}</text>`;
  }
  const inversion = profil === 'inversion' ? `<rect x="${venstre}" y="${y(800)}" width="${w - venstre - 12}" height="${bund - y(800)}" fill="#ecac5222" stroke="#9b5f26" stroke-dasharray="4 3"/><text x="${venstre + 6}" y="${y(800) + 14}">Inversion</text>` : '';
  const skylinje = base <= KONFIG.top ? `<path d="M${venstre} ${y(base)}H${w - 12}" stroke="#527c8c" stroke-width="1.5" stroke-dasharray="2 4"/>` : '';
  const fyld = t.sky ? '#fffdf3' : (t.pakke > 10 ? '#f5b586' : '#b8d9ed');
  let partikler = '';
  for (let i = 0; i < 9; i++) {
    const vinkel = i * 2.39996, radius = Math.sqrt(i / 9) * r * .72;
    partikler += `<circle cx="${cx + Math.cos(vinkel) * radius}" cy="${py + Math.sin(vinkel) * radius}" r="${t.sky ? 2.8 : 1.7}" fill="${t.sky ? '#668a9b' : '#172b2b'}" opacity=".65"/>`;
  }
  const opdrift = Math.abs(t.forskel) > .04 ? pil(Math.min(w - 24, cx + r + 15), py + (t.forskel > 0 ? 10 : -10), Math.sign(t.forskel), Math.min(36, 12 + Math.abs(t.forskel) * 2), '#172b2b') : '';
  svg.innerHTML = `<text x="${venstre - 7}" y="14" text-anchor="end">km</text>${lag}${gitter}${inversion}${skylinje}<path d="M${venstre} ${py}H${w - 12}" stroke="#172b2b" stroke-dasharray="3 5" opacity=".45"/><circle cx="${cx}" cy="${py}" r="${r}" fill="${fyld}" stroke="#c45524" stroke-width="2.5"/>${partikler}${opdrift}<path d="M${venstre} ${bund + 2}H${w - 12}" stroke="#172b2b" stroke-width="3"/><text x="${cx}" y="${h - 7}" text-anchor="middle">${t.sky ? 'Sky i pakken' : 'Umættet luft'}</text>`;
  // Begge figurer har samme højdeakse; grafens x-akse tilpasses luftmassen.
  const gx0 = smal ? 16 : 30, gx1 = gw - 18, gy0 = top, gy1 = gh - 30;
  const minT = Math.floor((m.temperatur - 45) / 10) * 10, maxT = Math.ceil((m.temperatur + 7) / 10) * 10;
  const gx = temp => gx0 + (temp - minT) / (maxT - minT) * (gx1 - gx0);
  const gy = hoejde => gy1 - hoejde / KONFIG.top * (gy1 - gy0);
  let akser = '';
  for (let temp = minT; temp <= maxT; temp += smal ? 20 : 10) {
    akser += `<path d="M${gx(temp)} ${gy0}V${gy1}" stroke="#172b2b18"/><text x="${gx(temp)}" y="${gh - 11}" text-anchor="middle">${temp}</text>`;
  }
  for (let hoejde = 0; hoejde <= KONFIG.top; hoejde += 1000) akser += `<path d="M${gx0} ${gy(hoejde)}H${gx1}" stroke="#172b2b20"/>`;
  const kurve = fn => Array.from({ length: 81 }, (_, i) => `${i ? 'L' : 'M'}${gx(fn(i * 50))},${gy(i * 50)}`).join(' ');
  const punkter = `<circle cx="${gx(t.pakke)}" cy="${gy(z)}" r="5" fill="#c45524" stroke="#fff9ee" stroke-width="2"/><rect x="${gx(t.ude) - 4}" y="${gy(z) - 4}" width="8" height="8" fill="#172b2b" stroke="#fff9ee" stroke-width="1.5"/>`;
  const skygraf = base <= KONFIG.top ? `<path d="M${gx0} ${gy(base)}H${gx1}" stroke="#527c8c" stroke-dasharray="2 4"/><text x="${gx0 + 3}" y="${gy(base) - 5}" fill="#527c8c">Skybase</text>` : '';
  graf.innerHTML = `${akser}<text x="${gx1}" y="14" text-anchor="end">°C →</text>${skygraf}<path d="${kurve(hoejde => omgivelser(hoejde, m, profil))}" stroke="#172b2b" stroke-width="2.5" stroke-dasharray="7 4" fill="none"/><path d="${kurve(hoejde => pakketemperatur(hoejde, m))}" stroke="#c45524" stroke-width="3" fill="none"/><path d="M${gx0} ${gy(z)}H${gx1}" stroke="#172b2b" opacity=".4" stroke-dasharray="3 5"/>${punkter}`;
}
function opdater() {
  const m = masse(), t = tilstand(z, m, profil), base = skybase(m), fri = fritLoeft(m, profil);
  $('hoejdetal').textContent = `${format(z, 0)} m`;
  $('hoejde').value = z;
  $('hoejde').setAttribute('aria-valuetext', `${format(z, 0)} meter`);
  $('pakketemp').textContent = `${format(t.pakke)} °C`;
  $('udetemp').textContent = `${format(t.ude)} °C`;
  $('forskel').textContent = Math.abs(t.forskel) < .05 ? 'Samme temperatur · ingen opdrift' : `${format(Math.abs(t.forskel))} °C ${t.forskel > 0 ? 'varmere · opdrift ↑' : 'koldere · neddrift ↓'}`;
  const betegnelse = { stabil: 'Stabil atmosfære', ustabil: 'Ustabil atmosfære', betinget: 'Betinget stabil atmosfære', inversion: 'Inversion' };
  $('begreb').textContent = betegnelse[profil];
  let tekst = PROFILER[profil].tekst;
  if (profil === 'betinget' && z > 0) tekst = !t.sky ? 'Pakken er endnu umættet og køles hurtigere end omgivelserne. Slipper du den her, søger den ned igen.' : t.forskel <= 0 ? 'Der er dannet sky, og afkølingen er langsommere. Men pakken er stadig koldere end omgivelserne: den skal løftes højere for at få opdrift.' : 'Pakken har passeret både skybasen og niveauet for fri opstigning. Nu er den varmere end omgivelserne og kan stige videre af sig selv.';
  $('forklaring').textContent = tekst;
  $('figurtekst').textContent = `Højde ${format(z, 0)} meter. Luftpakken er ${format(t.pakke)} grader, omgivelserne ${format(t.ude)} grader. ${t.sky ? 'Sky i luftpakken.' : 'Luften er umættet.'} ${$('forskel').textContent}. Pilen viser opdriften.`;
  $('massetekst').textContent = `${m.fag}. ${m.tekst} Modeltal ved jorden: ${format(m.temperatur, 0)} °C og dugpunkt ${format(m.dugpunkt, 0)} °C.`;
  $('skytekst').textContent = `For den valgte luftmasse ligger skybasen ved ${format(base, 0)} m. ${fri === null ? 'Pakken får ikke positiv opdrift inden for modellens 4 km.' : fri <= 10 ? 'Pakken får opdrift straks, den løftes fra jorden.' : `Positiv opdrift begynder omkring ${format(fri, 0)} m.`}`;
  $('slip').textContent = koersel === 'koerer' ? 'Pause' : koersel === 'pause' ? 'Fortsæt' : 'Slip luftpakken ↑↓';
  $('slip').setAttribute('aria-pressed', String(koersel === 'koerer'));
  $('slip').disabled = koersel !== 'koerer' && koersel !== 'pause' && (z <= 0 || z >= KONFIG.top);
  tegn();
}
function besked(tekst) { $('besked').textContent = tekst; }
function tick(tid) {
  if (koersel !== 'koerer') return;
  const dt = sidst === null ? 0 : Math.min(.05, (tid - sidst) / 1000) * 24;
  sidst = tid;
  // Små deltrin sikrer rolig integration også ved langsomme skærmopdateringer.
  const antal = Math.max(1, Math.ceil(dt / .04)), trin = dt / antal;
  for (let i = 0; i < antal; i++) {
    hastighed += (tilstand(z, masse(), profil).acceleration - .02 * hastighed) * trin;
    z += hastighed * trin;
    if (z <= 0 || z >= KONFIG.top) {
      z = Math.max(0, Math.min(KONFIG.top, z)); hastighed = 0;
      stop('faerdig');
      besked(z === 0 ? 'Pakken er tilbage ved jorden. Løft den for at prøve igen.' : 'Pakken når modellens top ved 4 km. Det er ikke nødvendigvis skyens top.');
      break;
    }
  }
  if (koersel === 'koerer' && Math.abs(hastighed) < .15 && Math.abs(tilstand(z, masse(), profil).forskel) < .03 && dt > 0) {
    stop('faerdig'); besked('Pakken er næsten i ro: temperaturen er som i omgivelserne.');
  }
  opdater();
  if (koersel === 'koerer') frame = requestAnimationFrame(tick);
}
function slip() {
  if (koersel === 'koerer') { stop('pause'); besked('Bevægelsen er sat på pause. Fortsæt, eller løft pakken til en ny højde.'); opdater(); return; }
  if (reduceret.matches) {
    // Samme model og slutpunkt uden animation ved reduceret bevægelse.
    stop(); hastighed = 0;
    for (let i = 0; i < 120000; i++) {
      hastighed += (tilstand(z, masse(), profil).acceleration - .02 * hastighed) * .04;
      z += hastighed * .04;
      if (z <= 0 || z >= KONFIG.top) { z = Math.max(0, Math.min(KONFIG.top, z)); break; }
      if (i > 50 && Math.abs(hastighed) < .15 && Math.abs(tilstand(z, masse(), profil).forskel) < .03) break;
    }
    stop('faerdig'); besked(z >= KONFIG.top ? 'Pakken når modeltoppen ved 4 km. Resultatet vises uden animation.' : 'Pakken søger tilbage mod jorden. Resultatet vises uden animation.'); opdater(); return;
  }
  if (koersel !== 'pause') hastighed = 0;
  koersel = 'koerer'; sidst = null;
  besked('Pakken er sluppet. Pilen viser opdriften; bevægelsen er fremskyndet.');
  opdater(); frame = requestAnimationFrame(tick);
}
document.querySelectorAll('[data-profil]').forEach(knap => knap.addEventListener('click', () => {
  stop(); profil = knap.dataset.profil; hastighed = 0;
  document.querySelectorAll('[data-profil]').forEach(b => b.setAttribute('aria-pressed', String(b === knap)));
  besked('Profilen er ændret. Forudsig bevægelsen, og slip pakken.'); opdater();
}));
$('luftmasse').addEventListener('change', e => { stop(); massenoegle = e.target.value; hastighed = 0; besked('Luftmassen er ændret. Sammenlign temperaturerne, før du slipper.'); opdater(); });
$('hoejde').addEventListener('input', e => { stop(); z = Number(e.target.value); hastighed = 0; besked(z === 0 ? 'Løft pakken fra jorden for at undersøge stabiliteten.' : 'Du holder pakken her. Hvad sker der, når du slipper?'); opdater(); });
$('slip').addEventListener('click', slip);
$('nulstil').addEventListener('click', () => { stop(); z = 0; hastighed = 0; besked('Pakken er ved jorden. Løft den med skyderen.'); opdater(); });
$('fokus').addEventListener('click', () => { const fokus = document.body.classList.toggle('fokus'); $('fokus').setAttribute('aria-pressed', String(fokus)); $('fokus').textContent = fokus ? 'Afslut fokus' : 'Fokus'; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('fokus')) $('fokus').click(); });
reduceret.addEventListener('change', () => { if (koersel === 'koerer') { stop('pause'); besked('Bevægelsen er sat på pause.'); opdater(); } });
new ResizeObserver(tegn).observe(document.querySelector('.figurer'));
opdater();
