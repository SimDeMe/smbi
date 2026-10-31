// Konceptvisning: energiens vej fremhæves før temperaturkurven.
import { PAKKE, uden_kondensation, latentVarme } from './model.mjs';
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits:n, maximumFractionDigits:n }).replace('-', '−');
export function tegnBegreb(s, luft, synker) {
  const varme = latentVarme(luft, s.z), sky = varme > .01;
  const r = 55 * Math.cbrt(s.volumen);
  const prikker = Array.from({ length: 22 }, (_, i) => {
    const a = i * 2.39996, d = Math.sqrt((i + .5) / 22) * r * .83;
    const x = 155 + Math.cos(a) * d, y = 106 + Math.sin(a) * d;
    return Math.abs(y - 106) < 18 && Math.abs(x - 155) < 38 ? '' : `<circle cx="${x}" cy="${y}" r="2.3" fill="#516565"/>`;
  }).join('');
  const kaede = synker
    ? '<span>Trykket stiger</span><b>→</b><span>Luften presses sammen</span><b>→</b><span>Omgivelserne tilfører energi</span><b>→</b><strong>Luften bliver varmere</strong>'
    : '<span>Trykket falder</span><b>→</b><span>Luften udvider sig</span><b>→</b><span>Energi går til udvidelsen</span><b>→</b><strong>Luften bliver koldere</strong>';
  return `<div class="energi-kaede" aria-label="Årsagskæde">${kaede}</div>
    <div class="begreb-midte">
      <div class="begreb-boble">
        <svg viewBox="0 -14 310 244" aria-hidden="true">
          <defs><marker id="energi-pil" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5 0 10Z" fill="#a54c1d"/></marker></defs>
          <circle cx="155" cy="106" r="${r}" fill="${sky ? '#deedf1' : '#f7d8a5'}" stroke="#a54c1d" stroke-width="2"/>
          <circle cx="155" cy="106" r="55" fill="none" stroke="#516565" stroke-dasharray="4 4"/>
          ${prikker}
          ${sky ? '<g fill="#fffdf6" stroke="#197e9c" stroke-width="1.5"><circle cx="140" cy="141" r="4"/><circle cx="155" cy="145" r="4"/><circle cx="170" cy="141" r="4"/></g><path d="M155 136v-12" stroke="#a54c1d" stroke-width="2" marker-end="url(#energi-pil)"/>' : ''}
          <text x="155" y="111" text-anchor="middle" class="begreb-temperatur">${tal(s.temperatur)} °C</text>
          ${[0,90,180,270].map(a => `<g transform="rotate(${a} 155 106)"><path d="M${155+r+5} 106h29" stroke="#a54c1d" stroke-width="3" ${synker ? 'marker-start' : 'marker-end'}="url(#energi-pil)"/></g>`).join('')}
          <text x="155" y="-2" text-anchor="middle" class="begreb-svgtekst">${synker ? 'Omgivelserne presser luften sammen' : 'Energi til at skubbe omgivelserne væk'}</text>
          <text x="155" y="222" text-anchor="middle" class="begreb-svgtekst">Stiplet ring = størrelsen ved jorden</text>
        </svg>
        <p><strong>${tal(s.z,0)} m</strong> · ${tal(s.tryk,0)} hPa · volumen × ${tal(s.volumen,2)}</p>
      </div>
      <div class="begreb-proces">
        <p class="energi-etiket">${synker ? 'DEN OMVENDTE PROCES' : sky ? 'TO PROCESSER SAMTIDIG' : 'FØLG ENERGIEN'}</p>
        <h2>${synker ? 'Sammentrykning varmer luften' : sky ? 'Fortætning giver varme tilbage' : 'Udvidelsen koster energi'}</h2>
        <p>${synker ? 'Omgivelserne udfører arbejde på pakken, når de presser den sammen. Det øger luftens indre energi og temperatur.' : sky ? 'Vanddamp bliver til flydende skydråber. Det frigiver energi til luften: <strong>latent varme</strong>. Energien blev optaget, da vandet fordampede.' : 'Højere oppe er der mindre luft ovenover, så trykket falder. Luften udvider sig og skubber den omgivende luft væk. Energien til arbejdet tages fra luftens <strong>indre energi</strong>.'}</p>
        ${synker ? '<p class="energi-pointe">Hvis pakken indeholder skydråber, kan de fordampe. Det optager energi og <strong>bremser opvarmningen</strong>.</p>' : sky ? '<div class="fortaetning"><span>Vanddamp</span><b>→</b><span class="draaber">● ● ●<small>Skydråber</small></span><b>+</b><strong>Varme til luften</strong></div><p class="energi-pointe">Luften udvider sig stadig. Derfor bliver den <strong>stadig koldere – bare langsommere.</strong></p>' : '<p class="energi-pointe">Molekylerne bevæger sig i gennemsnit langsommere.<br><strong>Det er det, vi måler som lavere temperatur.</strong></p><p class="ingen-varme">Adiabatisk = ingen varme ind eller ud gennem pakkens grænse. Energi overføres som arbejde, når luften udvider sig.</p>'}
      </div>
    </div>
    <div class="energi-bund ${sky ? 'med-varme' : ''}">
      ${sky ? `<div><span>Samme højde, kun udvidelse</span><strong>${tal(uden_kondensation(s.z))} °C</strong></div><b>+ ${tal(varme)} °C<small>fra fortætning</small></b><div><span>Med udvidelse og fortætning</span><strong>${tal(s.temperatur)} °C</strong></div>` : `<div><span>Temperatur ved jorden</span><strong>${tal(PAKKE)} °C</strong></div><b>− ${tal(PAKKE-s.temperatur)} °C<small>ved udvidelse</small></b><div><span>Temperatur nu</span><strong>${tal(s.temperatur)} °C</strong></div>`}
    </div>
`;
}
