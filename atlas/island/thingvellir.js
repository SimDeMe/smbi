// Nærvisning af Þingvellirs riftdal. Geometrien er en didaktisk illustration;
// kildegrundlag, forenklinger og forholdet til Hreppar-mikropladen står i Om modellen.
export const THINGVELLIR = {
  geo: [-21.125,64.2581],
  kilde: 'https://www.thingvellir.is/en/education/nature/tectonic-movements/'
};

export function opretThingvellir() {
  const scene=document.querySelector('#thingvellirscene');
  /* Basaltfladerne tegnes som sammenhængende blokke. */
  scene.innerHTML=`<svg id="thingvellirfigur" viewBox="0 0 1000 610" role="img" aria-labelledby="thingtitel thingbeskriv" xmlns="http://www.w3.org/2000/svg">
    <title id="thingtitel">Þingvellir: pladebevægelsen ses i sprækkerne</title>
    <desc id="thingbeskriv">Almannagjá ligger ved riftdalens vestlige kant og Hrafnagjá ved den østlige. Jorden i midten synker, mens området strækkes. Pile viser bevægelse mod vest og øst.</desc>
    <defs>
      <linearGradient id="thingbag" x2="0" y2="1"><stop stop-color="#edf0e5"/><stop offset="1" stop-color="#d0e2db"/></linearGradient>
      <linearGradient id="thingklippe" x2="0" y2="1"><stop stop-color="#465751"/><stop offset="1" stop-color="#263f40"/></linearGradient>
      <linearGradient id="thingslette" x2="0" y2="1"><stop stop-color="#a7b588"/><stop offset="1" stop-color="#7f9e83"/></linearGradient>
      <linearGradient id="thingsø" x2="0" y2="1"><stop stop-color="#99d0d2"/><stop offset="1" stop-color="#428f9f"/></linearGradient>
      <pattern id="thinggræs" width="31" height="23" patternUnits="userSpaceOnUse"><path d="M4 8l5 -2m12 12l4 -2" stroke="#4f725b" stroke-width="1.2" opacity=".23"/></pattern>
      <filter id="thingskygge"><feGaussianBlur stdDeviation="12"/></filter>
      <marker id="thingpil" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#1f514f"/></marker>
    </defs>
    <rect width="1000" height="610" fill="url(#thingbag)"/>
    <text x="36" y="43" class="thingoverlinje">ÞINGVELLIR · THINGVALLASLETTEN</text>
    <text x="36" y="78" class="thingoverskrift">Her åbner landskabet sig.</text>
    <ellipse cx="500" cy="463" rx="375" ry="38" fill="#37595b" opacity=".19" filter="url(#thingskygge)"/>
    <path d="M111 261L347 151L876 292L633 444Z" fill="#213b39"/>
    <g class="thingvest">
      <path d="M110 243L292 294L292 407L110 353Z" fill="#47605b"/>
      <path d="M292 294L452 191L452 304L292 407Z" fill="url(#thingklippe)"/>
      <path d="M110 243L277 137L452 191L292 294Z" fill="#a2ae83"/>
      <path d="M110 243L277 137L452 191L292 294Z" fill="url(#thinggræs)"/>
      <path d="M292 294L452 191" fill="none" stroke="#d9d5b2" stroke-width="3"/>
      <path d="M301 296l-1 91m12 -99l1 90m10 -98v92m11 -99l1 90m10 -99v93m11 -100l2 91m11 -99v91m11 -99l1 91m12 -100l-1 91m12 -98l1 91m11 -99l1 91m11 -99v90" stroke="#1d3839" stroke-width="2" opacity=".65"/>
    </g>
    <g class="thingbund">
      <path d="M316 316L487 208L707 267L529 382Z" fill="url(#thingslette)"/>
      <path d="M316 316L487 208L707 267L529 382Z" fill="url(#thinggræs)"/>
      <path d="M316 316L529 382L529 450L316 383Z" fill="#526f68"/>
      <path d="M529 382L707 267L707 336L529 450Z" fill="#405e5b"/>
      <path d="M470 333C500 318 526 315 553 318L618 294L658 298L529 373L449 349C461 344 457 341 470 333Z" fill="url(#thingsø)"/>
      <path d="M482 337q25 -9 52 -8m-24 22q29 -12 49 -9m-8 15l35 -19" fill="none" stroke="#d5eeee" stroke-width="1.8" opacity=".65"/>
      <path d="M382 293l37 -25m8 42l51 -34m14 49l31 -21" stroke="#547a68" stroke-width="2" opacity=".45"/>
    </g>
    <g class="thingøst">
      <path d="M550 355L735 409L735 471L550 416Z" fill="#536b60"/>
      <path d="M735 409L890 309L890 370L735 471Z" fill="#38524e"/>
      <path d="M550 355L715 245L890 309L735 409Z" fill="#b0b68d"/>
      <path d="M550 355L715 245L890 309L735 409Z" fill="url(#thinggræs)"/>
      <path d="M550 355L715 245L715 293L550 403Z" fill="url(#thingklippe)"/>
      <path d="M550 355L715 245" stroke="#dcd9b9" stroke-width="3" fill="none"/>
      <path d="M559 356v38m13 -47l-1 38m13 -47v38m12 -47v38m13 -47v38m13 -47v38m13 -47v38m13 -47v38m13 -47v38m13 -47v38m13 -47v38m13 -47v38" stroke="#233e3b" stroke-width="2" opacity=".65"/>
    </g>
    <g class="thingpile" stroke="#1f514f" fill="none" stroke-width="4" marker-end="url(#thingpil)">
      <path d="M222 205L145 182"/><path d="M742 310L822 335"/>
    </g>
    <g class="thingetiketter">
      <path d="M314 219L300 165L225 143"/><text x="197" y="122">Almannagjá</text>
      <path d="M653 294L720 193L791 192"/><text x="735" y="178">Hrafnagjá</text>
      <text x="493" y="292" text-anchor="middle" class="thingdalnavn">Riftdalen</text>
      <text x="426" y="426" class="thingsønavn">Þingvallavatn</text>
    </g>
    <text x="89" y="495" class="thingpladenavn">← Nordamerikanske plade</text>
    <text x="910" y="529" text-anchor="end" class="thingpladenavn">Mod den Eurasiske plade →</text>
  </svg>
  <div class="thingbetjening"><button id="visrift" aria-pressed="false">Vis pladernes bevægelse</button><button id="nulstilrift">Nulstil</button></div>`;
  const knap=scene.querySelector('#visrift');
  const saet=til=>{scene.classList.toggle('udstrakt',til);knap.setAttribute('aria-pressed',String(til));knap.textContent=til?'Saml visningen igen':'Vis pladernes bevægelse';};
  knap.addEventListener('click',()=>saet(!scene.classList.contains('udstrakt')));
  scene.querySelector('#nulstilrift').addEventListener('click',()=>saet(false));
  return {nulstil:()=>saet(false)};
}
