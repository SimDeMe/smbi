// Kvalitativ responsmodel. Tilstande er dimensionsløse og tiden illustrativ.
const $ = id => document.getElementById(id);
const skyder = $('varme');
let varme = 0, underskud = 0, fase = 0;
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
let pause = reduceret.matches, sidst = null, tekst = '';
const spor = ['op', 'ud-v', 'ud-h', 'ned-v', 'ned-h', 'ind-v', 'ind-h'].map(id => {
  const sti = $(id), laengde = sti.getTotalLength();
  const prikker = Array.from({length: 5}, (_, i) => {
    const prik = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    prik.setAttribute('r', '3.5');
    prik.setAttribute('fill', id === 'op' || id.startsWith('ud') ? '#b5502d' : '#337b96');
    $('partikler').append(prik);
    return {prik, start: i / 5};
  });
  return {sti, laengde, prikker};
});
function tegn() {
  const aktiv = underskud > .025;
  $('varmetal').textContent = `${skyder.value} %`;
  skyder.setAttribute('aria-valuetext', `${skyder.value} procent opvarmning`);
  $('varmefelt').style.opacity = varme;
  $('jordvarme').style.opacity = Number(skyder.value) / 100;
  $('trykbogstav').textContent = aktiv ? 'L' : '—';
  $('trykord').textContent = aktiv ? 'Lavere tryk' : 'Samme tryk';
  $('trykbogstav').style.opacity = aktiv ? .5 + .5 * underskud : .5;
  $('op').style.opacity = .12 + .88 * varme;
  for (const {sti, laengde, prikker} of spor) {
    const styrke = sti.id === 'op' || sti.id.startsWith('ud') ? varme : underskud;
    sti.style.opacity = .12 + .88 * styrke;
    for (const {prik, start} of prikker) {
      const p = sti.getPointAtLength(((fase + start) % 1) * laengde);
      prik.setAttribute('cx', p.x); prik.setAttribute('cy', p.y);
      prik.style.opacity = styrke > .025 ? .4 + .6 * styrke : 0;
    }
  }
  let status, beskrivelse;
  if (Number(skyder.value) === 0 && (varme > .04 || aktiv)) {
    status = 'Luften køler langsomt af';
    beskrivelse = 'Varmen er slukket. Luften køler af, trykforskellen aftager, og vinden svækkes.';
  } else if (!aktiv) {
    status = Number(skyder.value) ? 'Jorden varmes op' : 'Ingen opvarmning';
    beskrivelse = Number(skyder.value) ? 'Jorden opvarmer luften. Følg opstigningen og den efterfølgende udstrømning i højden.' : 'Uden forskel i opvarmning er trykket ens, og der er ingen varmedrevet vind.';
  } else {
    status = 'Termisk lavtryk';
    beskrivelse = underskud > .5 ? 'Kraftig opvarmning giver tydelig opstigning, udstrømning i højden og vind ind ved jorden.' : 'Luft strømmer ud i højden. Trykket ved jorden er lavere end i omgivelserne, og luft strømmer ind.';
  }
  $('tilstand').textContent = status;
  if (beskrivelse !== tekst) { $('figurtekst').textContent = beskrivelse; tekst = beskrivelse; }
  $('pause').textContent = pause ? 'Afspil' : 'Pause';
  $('pause').setAttribute('aria-pressed', String(pause));
}
function billede(tid) {
  const dt = sidst === null ? 0 : Math.min((tid - sidst) / 1000, .1);
  sidst = tid;
  if (!pause) {
    // Opvarmning → opdrift/udstrømning → masseunderskud og trykforskel.
    // Indstrømningen begrænser underskuddet; størrelserne er ikke vejrtal.
    varme += (Number(skyder.value) / 100 - varme) * (1 - Math.exp(-dt / 3));
    underskud += (varme - underskud) * (1 - Math.exp(-dt / 4));
    fase += dt * (.04 + .15 * underskud);
    tegn();
  }
  requestAnimationFrame(billede);
}
skyder.addEventListener('input', tegn);
$('sluk').addEventListener('click', () => { skyder.value = 0; tegn(); });
$('pause').addEventListener('click', () => { pause = !pause; tegn(); });
$('nulstil').addEventListener('click', () => {
  skyder.value = 0; varme = 0; underskud = 0; fase = 0; tegn();
});
$('fokus').addEventListener('click', () => {
  const fokus = document.body.classList.toggle('fokus');
  $('fokus').setAttribute('aria-pressed', String(fokus));
  $('fokus').textContent = fokus ? 'Afslut fokus' : 'Fokus';
});
document.addEventListener('visibilitychange', () => { sidst = null; });
reduceret.addEventListener('change', e => { if (e.matches) { pause = true; tegn(); } });
tegn();
requestAnimationFrame(billede);
