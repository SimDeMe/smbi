/* trinvis.js — panelet til "trin for trin": tæller, overskrift,
   forklaring, skemaet, der sammenligner to slags magma, knapper og
   trinprikker. Hvad der sker i figuren, når man skifter trin, bestemmer
   side.js (onSkift). */

const $ = id => document.getElementById(id);

// Skemaet, der sammenligner to slags magma: [[overskrift, magma], [overskrift, magma]]
function skema([[navnA, a], [navnB, b]]){
  const r = (navn, a, b) => `<tr><th scope="row">${navn}</th><td>${a}</td><td>${b}</td></tr>`;
  const e = s => `<span class="enhed">${s}</span>`;
  const graf = m => m.fragmentering != null ? 'bliver fanget' : 'kan slippe ud';
  const T = m => `ca. ${m.T.toLocaleString('da-DK')} ${e('°C')}`, V = m => `ca. ${m.vand.toLocaleString('da-DK')} ${e('vægt-%')}`;
  return `<table class="skema"><caption class="sr">To slags magma sammenlignet: ${navnA} og ${navnB}</caption>
<thead><tr><td></td><th scope="col">${navnA}</th><th scope="col">${navnB}</th></tr></thead><tbody>
${r(`Indhold af ${e('SiO₂')}`, `ca. ${a.SiO2} %`, `ca. ${b.SiO2} %`)}
${r('Temperatur', T(a), T(b))}
${r('Vand', V(a), V(b))}
${r('Flydeevne', a.flyder, b.flyder)}
${r('Gasboblerne', graf(a), graf(b))}
</tbody></table>`;
}

export function lavTrinvis({ trin, ctx, onSkift }){
  const panel = $('trin');
  const prikker = $('trin-prikker');
  let nu = 0;

  prikker.textContent = '';
  trin.forEach((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = String(i + 1);
    b.setAttribute('aria-label', 'Trin ' + (i + 1) + ': ' + t.titel);
    b.addEventListener('click', () => vis(i));
    prikker.appendChild(b);
  });

  function vis(i, stille = false){
    nu = Math.max(0, Math.min(trin.length - 1, i));
    const t = trin[nu], c = ctx();
    $('trin-tael').textContent = 'Trin ' + (nu + 1) + ' af ' + trin.length;
    $('trin-titel').textContent = t.titel;
    $('trin-tekst').innerHTML = t.tekst(c);
    // sammenlign: true = stammagmaet mod magmaet i kammeret, eller en funktion,
    // der selv vælger de to
    const par = t.sammenlign === true ? [[c.stam.navn, c.stam], [c.magma.navn, c.magma]]
              : t.sammenlign ? t.sammenlign(c) : null;
    $('trin-skema').innerHTML = par ? skema(par) : '';
    $('trin-forrige').disabled = nu === 0;
    $('trin-naeste').disabled = nu === trin.length - 1;
    [...prikker.children].forEach((b, j) => b.setAttribute('aria-current', j === nu ? 'true' : 'false'));
    if (!stille) onSkift(nu);
  }

  /* Rammen skal stå stille: panelet låses til det højeste trin, så figur,
     knapper og prikker ikke flytter sig, når man klikker videre. Under
     960 px står tingene under hinanden, og så låses der ikke. */
  function laas(){
    panel.style.minHeight = '';
    if (panel.hidden || matchMedia('(max-width:960px)').matches) return;
    const gemt = nu;
    let hoejest = 0;
    for (let i = 0; i < trin.length; i++){ vis(i, true); hoejest = Math.max(hoejest, panel.offsetHeight); }
    vis(gemt, true);
    panel.style.minHeight = hoejest + 'px';
  }

  $('trin-forrige').onclick = () => vis(nu - 1);
  $('trin-naeste').onclick = () => vis(nu + 1);

  return { vis, laas, get nu(){ return nu; } };
}
