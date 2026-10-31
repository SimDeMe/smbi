import { bevaeg, tilstand } from './model.mjs';

const felt = (id, label, placeholder = '') => `<label class="skriv" for="${id}">${label}</label><textarea id="${id}" rows="3" placeholder="${placeholder}"></textarea>`;
const sparring = tekst => `<details class="sparring"><summary>Åbn faglig sparring efter dit forsøg</summary>${tekst}</details>`;
const forsoeg = (profil, luft, tekst, hoejde = 0) => `<button class="forsoeg" data-forsoeg="${profil}" data-fugt="${luft}" data-hoejde="${hoejde}">${tekst} ↗</button>`;

export function bygUndersoegelser(aabnForsoeg) {
  const rod = document.getElementById('undersoegelser');
  rod.innerHTML = `<div class="opgavehoved"><h2>Opgaver</h2><label class="sr" for="opgavevalg">Vælg opgave</label><select id="opgavevalg"></select></div>
  <div class="opgavekort">
    <article aria-labelledby="opgave-1"><p class="opgavetype">01 / Tegn fremtiden</p><h3 id="opgave-1">Hvordan ender turen?</h3>
      <p>En <strong>tør pakke i stabil luft</strong> slippes ved jorden. Den starter ved 22 °C, omgivelserne ved 20 °C. Forudsig højden efter 2, 4 og 6 modelminutter med skyderne. Vil den standse brat, svinge eller stige videre?</p>
      <svg id="forudsigelsesgraf" viewBox="0 0 480 230" role="img" aria-label="Din forudsigelse af pakkens højde over tid"></svg>
      <p class="grafnoegle"><span>━━ Din forudsigelse</span><span class="modelnoegle" hidden>┄┄ Modellens forløb</span></p>
      <div class="tegnstyring">${[2,4,6].map(t => `<label for="tegn-${t}">Efter ${t} min <output id="tegn-tal-${t}">0 m</output><input id="tegn-${t}" type="range" min="0" max="1000" step="10" value="0"></label>`).join('')}</div>
      ${felt('forklar-kurve', 'Begrund din kurve med pakkens og omgivelsernes temperatur.')}
      <button id="vis-modelkurve" aria-pressed="false">Sammenlign med modellen</button>
      <p id="kurve-feedback" class="kurve-feedback" hidden>Modellen stiger først, passerer ligevægtshøjden lidt og falder til ro omkring 333 m. Samme temperatur betyder nul termisk opdrift; pakken kan stadig have fart. Den stiplede kurve viser hele modelturen, dine punkter forbindes med rette linjer.</p>
      ${felt('revider-kurve', 'Efter sammenligning: Hvad ville du ændre i din forudsigelse, og hvorfor?')}
    </article>
    <article aria-labelledby="opgave-2"><p class="opgavetype">02 / Temperaturdetektiv</p><h3 id="opgave-2">Tre bobler, ét øjebliksbillede</h3>
      <p>Tre luftpakker holdes stille ved <strong>1.000 m</strong> i hver sin atmosfære og slippes uden begyndelsesfart. Tallene er fra modellen. Hvilken vej begynder hver pakke at bevæge sig? Hvad kan billedet fortælle om resten af turen?</p>
      <table><caption>Temperaturer i samme højde · °C</caption><thead><tr><th scope="col">Boble</th><th scope="col">Pakken</th><th scope="col">Omgivelser</th></tr></thead><tbody>${[['A','stabil','toer'],['B','betinget','fugtig'],['C','betinget','toer']].map(([navn,p,l]) => { const s = tilstand(p,l,1000); return `<tr><th scope="row">${navn}</th><td>${s.temperatur.toLocaleString('da-DK')}</td><td>${s.omgivelser.toLocaleString('da-DK')}</td></tr>`; }).join('')}</tbody></table>
      ${felt('detektiv', 'Skriv en bevægelsespil (↑/↓) for A, B og C, og forklar. Hvilke oplysninger mangler du for at forudsige hele turen?')}
      ${sparring('<p>A: 12 °C mod 16 °C → ned. B: 15 °C mod 13 °C → op. C: 12 °C mod 13 °C → ned. Sammenlign altid i samme højde.</p><p>Et øjebliksbillede giver den første retning, når pakken slippes fra hvile. Resten af turen kræver bl.a. omgivelsernes temperaturprofil og pakkens fugt/mætning. En pakke i fart kan bevæge sig modsat opdriften, mens den bremses.</p>')}
    </article>
    <article aria-labelledby="opgave-3"><p class="opgavetype">03 / Find vippepunktet</p><h3 id="opgave-3">Kan du hjælpe boblen over tærsklen?</h3>
      <p>Den <strong>tørre pakke i betinget stabil luft</strong> standser, når den slippes fra jorden. Men et bjerg eller en front kan tvinge den højere op. Find den højde over skybasen, hvor opdriften skifter fra nedad til opad.</p>
      <ol><li>Forudsig et interval, før du afprøver noget.</li><li>Hold pakken i forskellige højder med skyderen. Sammenlign temperaturerne, og slip den fra hvile.</li><li>Indsnævr grænsen til et interval på højst 100 m. Notér en højde på hver side med temperaturer og udfald.</li></ol>
      ${felt('graense-hypotese', 'Min forudsigelse og begrundelse')}
      ${forsoeg('betinget', 'toer', 'Åbn forsøget: betinget stabil, tør pakke', 2000)}
      ${felt('graense-fund', 'Min forsøgslog: højde · pakkens temperatur · omgivelsernes temperatur · bevægelse')}
      ${sparring('<p>Skybasen er 1.500 m, men dér er pakken stadig koldere end omgivelserne. Over skybasen afkøles pakken kun 0,5 °C/100 m mod omgivelsernes 0,7. Den indhenter dem ved 2.750 m (begge 0,75 °C). Fra hvile får den opdrift over denne højde; lige under søger den ned. Mætning alene garanterer altså ikke opstigning.</p>')}
    </article>
    <article aria-labelledby="opgave-4"><p class="opgavetype">04 / Reparér en forklaring</p><h3 id="opgave-4">En overbevisende fejl</h3>
      <blockquote>“Boblen køler af, fordi den afgiver varme til den kolde luft. Ved skybasen bliver vanddampen synlig, og boblen begynder at blive varmere. Så vil den altid stige videre.”</blockquote>
      <p>Omskriv forklaringen til 3–5 fagligt holdbare sætninger. Brug ordene <strong>tryk, udvidelse, kondensation, latent varme</strong> og <strong>omgivelser</strong>. Peg på et forsøg, der kan udfordre påstanden om, at en sky altid stiger videre.</p>
      ${felt('reparer', 'Min rettede forklaring og mit forslag til et modforsøg')}
      ${forsoeg('stabil', 'fugtig', 'Prøv en mættet pakke i stabil luft', 800)}
      ${sparring('<p>Ved opstigning falder trykket; pakken udvider sig og afkøles uden varmeudveksling. Vanddamp er usynlig: ved mætning kan den kondensere til synlige skydråber. Kondensation frigiver latent varme, som mindsker afkølingen, men temperaturen falder stadig under videre opstigning. Opdriften afhænger af temperaturen i forhold til omgivelserne. En fugtig pakke tvunget til 800 m i stabil luft er mættet, men koldere end omgivelserne og synker, når den slippes.</p>')}
    </article>
    <article aria-labelledby="opgave-5"><p class="opgavetype">05 / Vejrmelding med belæg</p><h3 id="opgave-5">Samme jord, to forskellige himle</h3>
      <p>Du laver en 30 sekunders vejrmelding for to modeldage. Begge har 20 °C ved jorden og pakker på 22 °C. Dag 1 har <strong>inversion og fugtige pakker</strong>. Dag 2 har <strong>betinget stabil luft og fugtige pakker</strong>.</p>
      <p>Beskriv luftbevægelse og skydannelse på hver dag. Brug mindst to aflæsninger som belæg. Slut med én ting om virkelighedens vejr, som denne model ikke kan afgøre.</p>
      <div class="forsoegsknapper">${forsoeg('inversion', 'fugtig', 'Undersøg dag 1')}${forsoeg('betinget', 'fugtig', 'Undersøg dag 2')}</div>
      ${felt('vejrmelding', 'Mit manuskript: Dag 1 … Dag 2 … Modellens begrænsning …')}
      ${sparring('<p>Dag 1: pakken falder til ro omkring 143 m, før skybasen ved 400 m, så der dannes ingen sky ved dette frie løft. Dag 2: mætning ved 400 m; derefter har pakken opdrift og stiger videre ud af figuren ved 3.000 m.</p><p>Modellen afgør fx ikke nedbør, skydække over et helt område eller dagens maksimumtemperatur. Den beskriver én idealiseret pakke uden opblanding eller nedbør. Figurens top er ikke et fysisk loft.</p>')}
    </article>
  </div>`;

  // Ét sted til alt elevarbejde, én opgave fremme ad gangen.
  const kort = rod.querySelector('.opgavekort');
  const energi = document.createElement('article');
  energi.append(document.getElementById('a-forstaaelse'));
  kort.prepend(energi);
  const regn = document.createElement('article');
  regn.append(document.getElementById('opgaver'));
  kort.append(regn);
  rod.querySelectorAll('.opgavetype').forEach(p => p.remove());
  const artikler = [...kort.children];
  const navne = ['Forklar energien', 'Tegn bevægelsen', 'Temperaturdetektiv', 'Find vippepunktet', 'Ret en forklaring', 'Lav en vejrmelding', 'Regn selv'];
  const vaelger = document.getElementById('opgavevalg');
  vaelger.innerHTML = navne.map((navn,i) => `<option value="${i}">${i+1} · ${navn}</option>`).join('');
  const vis = () => artikler.forEach((a,i) => { a.hidden = i !== +vaelger.value; });
  vaelger.addEventListener('change', vis);
  vis();

  let visModel = false;
  const faktisk = [{ z: 0 }];
  let z = 0, v = 0;
  for (let t = 1; t <= 360; t++) {
    const ny = bevaeg('stabil', 'toer', z, v, 1);
    z = ny.z; v = ny.v; faktisk.push({ z });
  }
  function tegn() {
    const x = t => 54 + t / 360 * 402, y = z => 188 - z / 1000 * 164;
    const vaerdier = [0, ...[2,4,6].map(t => +document.getElementById(`tegn-${t}`).value)];
    document.getElementById('forudsigelsesgraf').innerHTML = `
      <g font-family="system-ui, sans-serif" font-size="12" fill="#172b2b">
      <text x="8" y="15">Højde · m</text>
      ${[0,250,500,750,1000].map(h => `<path d="M54 ${y(h)}H456" stroke="#172b2b" opacity=".15"/><text x="46" y="${y(h)+4}" text-anchor="end">${h}</text>`).join('')}
      ${[0,2,4,6].map(t => `<text x="${x(t*60)}" y="207" text-anchor="middle">${t}</text>`).join('')}
      <text x="255" y="226" text-anchor="middle">Tid · modelminutter</text></g>
      <polyline points="${vaerdier.map((h,i) => `${x(i*120)},${y(h)}`).join(' ')}" fill="none" stroke="#b85b29" stroke-width="3"/>
      ${vaerdier.map((h,i) => `<circle cx="${x(i*120)}" cy="${y(h)}" r="4" fill="#b85b29"/>`).join('')}
      ${visModel ? `<polyline points="${faktisk.map((s,t) => `${x(t)},${y(s.z)}`).join(' ')}" fill="none" stroke="#146880" stroke-width="3" stroke-dasharray="6 4"/>` : ''}`;
    document.getElementById('forudsigelsesgraf').setAttribute('aria-label', `Din forudsigelse: ${vaerdier.map((h,i) => `${i*2} minutter: ${h} meter`).join(', ')}.${visModel ? ' Modellen falder til ro omkring 333 meter efter en lille svingning.' : ''}`);
  }
  [2,4,6].forEach(t => document.getElementById(`tegn-${t}`).addEventListener('input', e => {
    document.getElementById(`tegn-tal-${t}`).textContent = `${e.target.value} m`; tegn();
  }));
  document.getElementById('vis-modelkurve').addEventListener('click', e => {
    visModel = !visModel;
    e.target.setAttribute('aria-pressed', String(visModel));
    e.target.textContent = visModel ? 'Skjul modellens kurve' : 'Sammenlign med modellen';
    document.getElementById('kurve-feedback').hidden = !visModel;
    rod.querySelector('.modelnoegle').hidden = !visModel;
    tegn();
  });
  rod.querySelectorAll('[data-forsoeg]').forEach(b => b.addEventListener('click', () => aabnForsoeg(b.dataset.forsoeg, b.dataset.fugt, +b.dataset.hoejde)));
  tegn();
}
