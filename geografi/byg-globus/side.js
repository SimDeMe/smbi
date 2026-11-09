import { AFSNIT, LAG, ZONER, punktKorrekt, koordinater } from './model.js';
import { startGlobus } from './globus.js';

const $ = id => document.getElementById(id), NOEGLE = 'byg-globus.v1';
const data = Object.fromEntries(Object.keys(LAG).map(id => [id, { svar: {}, rigtige: new Set(), hjaelp: false, fejl: 0 }]));
try {
  const gemt = JSON.parse(localStorage.getItem(NOEGLE));
  for (const [id, t] of Object.entries(data)) {
    const gamle = gemt?.[id]; if (!gamle) continue;
    for (const ord of LAG[id].ord) if (gamle.rigtige?.includes(ord.id)) { t.rigtige.add(ord.id); t.svar[ord.id] = ord.id; }
    t.hjaelp = gamle.hjaelp === true; t.fejl = Math.max(0, Number(gamle.fejl) || 0);
  }
} catch { /* Privat browsing eller gammel/ugyldig lagring må ikke stoppe øvelsen. */ }
function gem() {
  try { localStorage.setItem(NOEGLE, JSON.stringify(Object.fromEntries(Object.entries(data).map(([id, t]) => [id, { rigtige: [...t.rigtige], hjaelp: t.hjaelp, fejl: t.fejl }])))); }
  catch { /* Opgaverne virker også uden lagring. */ }
}
let afsnit = 0, lagId = 'dele', valgt = null, hintId = null, hintTrin = 0, globe, afventer = false, sceneToken = 0;
let valgtPunkt = null, ordRaekke = [];
const lag = () => LAG[lagId], tilstand = () => data[lagId];
const faerdigt = id => data[id].rigtige.size === LAG[id].ord.length;
const aktuelPunkt = () => lag().ord.find(o => !tilstand().rigtige.has(o.id));
function besked(tekst, fejl = false) { $('besked').textContent = tekst; $('besked').classList.toggle('fejl', fejl); }
function bland(liste) {
  const ud = [...liste];
  for (let i = ud.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ud[i], ud[j]] = [ud[j], ud[i]]; }
  return ud;
}
function opdaterFaner() {
  for (const [i, a] of AFSNIT.entries()) {
    const knap = $(`tab-${a.id}`), valgt = i === afsnit;
    const klar = a.lag.every(faerdigt);
    knap.setAttribute('aria-selected', valgt); knap.tabIndex = valgt ? 0 : -1;
    knap.querySelector('.fanenavn').textContent = a.navn + (klar ? ' ✓' : '');
  }
}
for (const [i, a] of AFSNIT.entries()) {
  const knap = document.createElement('button'); knap.type = 'button'; knap.id = `tab-${a.id}`; knap.setAttribute('role', 'tab'); knap.setAttribute('aria-controls', 'arbejde');
  knap.innerHTML = `<span class="nummer">${i + 1}</span><span class="fanenavn"></span>`;
  knap.onclick = () => visAfsnit(i);
  knap.onkeydown = e => {
    let n;
    if (e.key === 'ArrowRight') n = (i + 1) % AFSNIT.length;
    else if (e.key === 'ArrowLeft') n = (i + AFSNIT.length - 1) % AFSNIT.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = AFSNIT.length - 1;
    else return;
    e.preventDefault(); visAfsnit(n); $(`tab-${AFSNIT[n].id}`).focus();
  };
  $('afsnit').append(knap);
}
function visAfsnit(n) {
  afsnit = n;
  const a = AFSNIT[n];
  visLag(a.lag.find(id => !faerdigt(id)) || a.lag[0]);
}
async function visLag(id) {
  lagId = id; valgt = null; hintId = null; hintTrin = 0; valgtPunkt = null;
  const token = ++sceneToken;
  ordRaekke = bland(lag().ord);
  afsnit = AFSNIT.findIndex(a => a.lag.includes(id));
  history.replaceState(null, '', '#' + AFSNIT[afsnit].id);
  $('arbejde').setAttribute('aria-labelledby', `tab-${AFSNIT[afsnit].id}`);
  $('titel').textContent = lag().navn; $('lag-navn').textContent = lag().navn;
  $('intro').textContent = lag().intro;
  const nr = AFSNIT[afsnit].lag.indexOf(id) + 1;
  $('trin').textContent = `Afsnit ${afsnit + 1} af 5 · Lag ${nr} af ${AFSNIT[afsnit].lag.length}`;
  $('lag-status').textContent = `${nr}/${AFSNIT[afsnit].lag.length} lag`;
  $('refleksion').textContent = lag().refleksion;
  $('hjaelpelinjer-label').hidden = lag().type !== 'klima';
  $('sigtekorn').hidden = $('centrum').hidden = lag().type !== 'punkter';
  $('forklaringer').open = false;
  $('ordliste').replaceChildren();
  for (const o of lag().ord) {
    const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = o.navn; dd.textContent = o.tekst; $('ordliste').append(dt, dd);
  }
  $('find-plads').replaceChildren();
  if (lag().type !== 'punkter') {
    const label = document.createElement('span'); label.textContent = 'Drej til plads:'; $('find-plads').append(label);
    lag().ord.forEach((o, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = i + 1; b.dataset.find = o.id; b.setAttribute('aria-label', `Vis plads ${i + 1}`);
      b.onclick = () => globe?.visPlads(o.id); $('find-plads').append(b);
    });
  }
  $('betjening').textContent = lag().type === 'punkter' ? 'Træk eller brug pilene for at dreje · Shift + pil finjusterer · tryk for at sætte punktet.' : 'Træk for at dreje · eller brug pilene. Vælg et fagord og derefter en gul plads.';
  besked('');
  globe?.scene(lag(), tilstand());
  opdater();
  if (lag().type === 'klima' && globe) {
    afventer = true; $('indlaesning').hidden = false; $('indlaesning').textContent = 'Henter klimazonerne …'; opdater();
    try {
      await globe.hentKlima();
      if (token !== sceneToken) return;
      afventer = false; $('indlaesning').hidden = true; opdater();
    } catch {
      if (token !== sceneToken) return;
      $('indlaesning').textContent = 'Klimakortet kunne ikke hentes. Du kan fortsætte med de andre afsnit.';
      const b = document.createElement('button'); b.textContent = 'Prøv igen'; b.onclick = () => visLag(id); $('indlaesning').append(b);
      besked('Klimazonerne er ikke klar endnu.', true);
    }
  } else {
    afventer = !globe; $('indlaesning').hidden = Boolean(globe); opdater();
  }
}
function opdater() {
  const t = tilstand(), klar = faerdigt(lagId), erPunkt = lag().type === 'punkter';
  opdaterFaner();
  $('taeller').textContent = `${t.rigtige.size} / ${lag().ord.length} på plads${klar && !t.hjaelp && !t.fejl ? ' ★' : ''}`;
  $('ord').hidden = erPunkt;
  $('ord').replaceChildren();
  for (const o of ordRaekke) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.ord = o.id; b.textContent = o.navn;
    const rigtig = t.rigtige.has(o.id), sted = Object.entries(t.svar).find(([, id]) => id === o.id)?.[0];
    b.classList.toggle('rigtig', rigtig); b.classList.toggle('place', Boolean(sted) && !rigtig);
    b.disabled = rigtig || afventer; b.setAttribute('aria-pressed', valgt === o.id);
    if (rigtig) {
      b.textContent += ' ✓'; b.title = o.tekst;
      if (lag().type === 'klima') b.style.borderLeft = '7px solid ' + ZONER[o.id].farve;
    }
    else if (sted) b.title = 'Sat på plads ' + (lag().ord.findIndex(o => o.id === sted) + 1) + '. Vælg for at flytte ordet.';
    b.draggable = !rigtig && !afventer;
    b.ondragstart = e => { valgt = o.id; e.dataTransfer.setData('text/plain', o.id); e.dataTransfer.effectAllowed = 'move'; };
    b.onclick = () => {
      valgt = valgt === o.id ? null : o.id;
      // Opdater kun valgmarkeringen; bevar tastaturfokus på ordknappen.
      for (const knap of $('ord').children) knap.setAttribute('aria-pressed', knap.dataset.ord === valgt);
      besked(valgt ? `${o.navn} er valgt. Tryk på den rigtige gule plads.` : 'Valget er fjernet.');
    };
    $('ord').append(b);
  }
  for (const b of $('find-plads').querySelectorAll('button')) b.classList.toggle('rigtig', t.rigtige.has(b.dataset.find));
  $('punkt-opgave').hidden = !erPunkt || klar;
  if (erPunkt && !klar) {
    $('punkt-maal').textContent = aktuelPunkt().navn;
    $('punkt-valg').textContent = valgtPunkt ? 'Dit punkt: ' + koordinater(valgtPunkt) : 'Intet punkt sat endnu.';
  }
  $('saet-punkt').disabled = afventer;
  $('faerdig').hidden = !klar;
  $('indsend').parentElement.hidden = klar;
  $('indsend').disabled = $('hint').disabled = afventer;
  $('hint').textContent = hintTrin ? 'Vis svaret' : 'Giv et hint';
  const alleLag = AFSNIT.flatMap(a => a.lag), sidst = alleLag.indexOf(lagId) === alleLag.length - 1;
  $('naeste').textContent = sidst ? 'Tilbage til verdensdelene →' : AFSNIT[afsnit].lag.at(-1) === lagId ? 'Næste afsnit →' : 'Næste lag →';
  globe?.status(t);
}
function placer(plads, ordId = valgt) {
  if (afventer) return;
  const t = tilstand(), ord = lag().ord.find(o => o.id === plads);
  if (!ord) return;
  if (t.rigtige.has(plads)) { besked(ord.navn + ': ' + ord.tekst); return; }
  if (!ordId) {
    if (t.svar[plads]) { delete t.svar[plads]; besked('Ordet er sendt tilbage.'); opdater(); }
    else besked('Vælg først et fagord i bakken.');
    return;
  }
  if (!lag().ord.some(o => o.id === ordId) || t.rigtige.has(ordId)) return;
  for (const [p, id] of Object.entries(t.svar)) if (id === ordId) delete t.svar[p];
  t.svar[plads] = ordId; valgt = null;
  besked('Ordet er sat på. Vælg det næste, eller indsend svar.'); opdater();
}
function saetPunkt(p) {
  if (afventer || lag().type !== 'punkter' || faerdigt(lagId)) return;
  valgtPunkt = p; globe.saetPunkt(p); opdater(); besked('Punktet er sat. Indsend dit svar.');
}
function indsend() {
  if (afventer || faerdigt(lagId)) return;
  const t = tilstand();
  if (lag().type === 'punkter') {
    if (!valgtPunkt) { besked('Sæt først et punkt på globussen.'); return; }
    const o = aktuelPunkt();
    if (punktKorrekt(valgtPunkt, o.punkt)) {
      t.rigtige.add(o.id); t.svar[o.id] = o.id; valgtPunkt = null; globe.saetPunkt(null);
      hintId = null; hintTrin = 0; besked(`Korrekt! ${o.tekst}${faerdigt(lagId) ? '' : ' Find nu det næste punkt.'}`);
    } else { t.fejl++; besked(`Punktet ligger for langt fra ${o.navn}. Dit punkt er ${koordinater(valgtPunkt)}. Se først på nord/syd, derefter øst/vest.`, true); }
  } else {
    let nye = 0, fejl = 0, forklaring = '';
    for (const o of lag().ord) {
      if (t.rigtige.has(o.id) || !t.svar[o.id]) continue;
      if (t.svar[o.id] === o.id) { t.rigtige.add(o.id); nye++; }
      else {
        if (!forklaring) forklaring = `Plads ${lag().ord.indexOf(o) + 1}: ${o.hint}`;
        delete t.svar[o.id]; fejl++;
      }
    }
    if (fejl) { t.fejl += fejl; besked(`${nye ? nye + ' rigtige ord er låst. ' : ''}${fejl} ord kom tilbage. ${forklaring}`, true); }
    else if (nye) besked(faerdigt(lagId) ? 'Alle fagord sidder rigtigt. Forklar sammenhængen med en makker.' : `${nye} ord er låst. Fortsæt med de tomme pladser.`);
    else besked('Sæt mindst ét fagord på en gul plads, før du indsender.');
    valgt = null; hintId = null; hintTrin = 0; globe.fjernHint();
  }
  gem(); opdater();
}
$('indsend').onclick = indsend;
$('hint').onclick = () => {
  if (afventer || faerdigt(lagId)) return;
  const t = tilstand(); t.hjaelp = true;
  const o = lag().type === 'punkter' ? aktuelPunkt() : lag().ord.find(o => o.id === hintId && !t.rigtige.has(o.id)) || lag().ord.find(o => !t.rigtige.has(o.id));
  if (!o) return;
  if (hintTrin && hintId === o.id) {
    if (lag().type === 'punkter') { valgtPunkt = [...o.punkt]; globe.centrer(o.punkt); globe.saetPunkt(valgtPunkt); }
    else { for (const [p, id] of Object.entries(t.svar)) if (id === o.id) delete t.svar[p]; t.svar[o.id] = o.id; }
    indsend();
  } else {
    hintId = o.id; hintTrin = 1;
    if (lag().type !== 'punkter') globe.hint(o.id);
    besked(o.hint); gem(); opdater();
  }
};
$('saet-punkt').onclick = () => saetPunkt(globe.centrum());
$('naeste').onclick = () => {
  const alle = AFSNIT.flatMap(a => a.lag); visLag(alle[(alle.indexOf(lagId) + 1) % alle.length]);
};
$('forfra').onclick = () => {
  data[lagId] = { svar: {}, rigtige: new Set(), hjaelp: false, fejl: 0 }; gem(); visLag(lagId);
};
for (const b of document.querySelectorAll('[data-drej]')) b.onclick = () => globe?.drej(b.dataset.drej);
$('hjem').onclick = () => globe?.centrer(lag().centrum);
$('hjaelpelinjer').onchange = e => globe?.hjaelpelinjer(e.target.checked);
$('fokus').onclick = () => {
  const aktiv = document.body.classList.toggle('fokus'); $('fokus').setAttribute('aria-pressed', aktiv); $('fokus').textContent = aktiv ? 'Afslut fokus' : 'Fokus';
};
window.addEventListener('hashchange', () => { const n = AFSNIT.findIndex(a => '#' + a.id === location.hash); if (n >= 0) visAfsnit(n); });
if (window.top !== window.self) { document.body.classList.add('fokus'); $('fokus').setAttribute('aria-pressed', 'true'); $('fokus').textContent = 'Afslut fokus'; }
async function start() {
  afventer = true;
  try {
    globe = await startGlobus({ vaelg: placer, punkt: saetPunkt, flyttet: p => { $('centrum').textContent = 'I sigtekornet: ' + koordinater(p); } });
    $('indlaesning').hidden = true;
    const n = AFSNIT.findIndex(a => '#' + a.id === location.hash); visAfsnit(n < 0 ? 0 : n);
  } catch (fejl) {
    $('indlaesning').hidden = false; $('indlaesning').textContent = fejl.message;
    const b = document.createElement('button'); b.textContent = 'Prøv igen'; b.onclick = () => location.reload(); $('indlaesning').append(b);
    besked('Globussen er ikke klar. Prøv at hente siden igen.', true);
  }
}
// Afsnit og faglig tekst er brugbare, mens kystlinjerne hentes.
const startAfsnit = AFSNIT.findIndex(a => '#' + a.id === location.hash);
visAfsnit(startAfsnit < 0 ? 0 : startAfsnit);
start();
