// Kort over Sydasien og Det Indiske Ocean med tryk, vind ved jorden, ITK og
// områder med meget regn – for juli (sommermonsun) og januar (vintermonsun).
// Mønstrene er forenklede klimatologiske gennemsnit, ikke vejret en bestemt
// dag. Positionerne er afrundede (se README).
import { BREDDE, HOEJDE, SKALA, FLYT, LAND, GRAENSER } from './kortdata.js';

const rad = Math.PI / 180;
// Samme Mercator-projektion som kortdata.js (d3.geoMercator uden rotation).
export function projicer(lon, lat) {
  return [FLYT[0] + SKALA * lon * rad, FLYT[1] - SKALA * Math.log(Math.tan(Math.PI / 4 + lat * rad / 2))];
}

export const SAESONER = {
  sommer: {
    titel: 'Juli · sommermonsun',
    tryk: [
      { t: 'L', lon: 69, lat: 29, navn: 'Termisk lavtryk', over: true },
      { t: 'H', lon: 58, lat: -26, navn: 'Maskarenerhøjtrykket', side: 'h' },
    ],
    // Vind ved jorden: sydøstpassaten krydser ækvator og drejes til sydvestmonsun.
    vind: [
      [[63, -22], [56, -14], [49, -5]],
      [[46, -3], [50, 5], [58, 11], [67, 14], [73, 16]],
      [[58, 2], [68, 7], [78, 9]],
      [[96, -20], [87, -12], [81, -4], [83, 4], [88, 10]],
      [[86, 5], [91, 12], [93, 20]],
      [[89, 23], [84, 25.5], [78, 28]],
    ],
    itk: [[30, 15], [45, 18], [60, 24], [70, 28], [80, 25], [90, 22], [100, 20], [115, 18], [130, 16]],
    regn: [[74, 15, 1], [91.5, 25, 1], [94, 19, 0.8], [86, 27, 0.7]],
    forklaring: 'Asien er varmere end havet. Over Pakistan og Nordindien ligger et termisk lavtryk. Passatvinden fra højtrykket syd for ækvator krydser ækvator, drejes af Jordens rotation og når Indien som fugtig sydvestvind. Hvor den presses op ad bjerge, falder der kraftig regn.',
  },
  vinter: {
    titel: 'Januar · vintermonsun',
    tryk: [
      { t: 'H', lon: 101, lat: 42, navn: 'Sibirisk højtryk', side: 'v' },
      { t: 'L', lon: 70, lat: -13, navn: 'Lavtryk ved ITK' },
    ],
    // Tør nordøstvind fra land mod hav; syd for ækvator drejes den mod sydøst.
    vind: [
      [[106, 38], [111, 31], [113, 24], [111, 16]],
      [[93, 21], [91.5, 14], [86, 7], [81, 2]],
      [[87, 25], [83, 19], [78, 13]],
      [[72, 20], [66, 12], [58, 5]],
      [[79, 0], [81, -5], [85, -9]],
      [[109, 11], [106, 3], [109, -4], [114, -9]],
    ],
    itk: [[30, -12], [45, -14], [60, -10], [75, -9], [90, -8], [105, -10], [120, -14], [130, -15]],
    regn: [[80.5, 8.5, 0.8], [82, -8, 0.8], [110, -7, 0.7]],
    forklaring: 'Asien er koldere end havet. Et stort højtryk ligger over Sibirien og Mongoliet, og ITK er rykket syd for ækvator. Tør luft blæser fra nordøst ud over Indien og havet, så det meste af Indien får næsten ingen regn. Regnen falder over havet ved ITK – og i Sri Lanka og Indiens sydøstspids, hvor vinden har samlet fugt over Den Bengalske Bugt.',
  },
};

const STEDER = [
  ['Indien', 78, 21, 'land'], ['Det Indiske Ocean', 88, -22, 'hav'], ['Arabiske<br>Hav', 63, 16, 'hav'],
  ['Bengalske<br>Bugt', 86.5, 16, 'hav'], ['Himalaya', 85, 30, 'bjerg'], ['Tibet', 88, 35, 'bjerg'],
  ['Ækvator', 39, 1.2, 'linje'],
];

function glat(punkter) {
  // Catmull-Rom gennem punkterne, som Bézier-segmenter.
  let d = `M${punkter[0][0]} ${punkter[0][1]}`;
  for (let i = 0; i < punkter.length - 1; i++) {
    const p0 = punkter[i - 1] || punkter[i], p1 = punkter[i], p2 = punkter[i + 1], p3 = punkter[i + 2] || p2;
    d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
const proj = liste => liste.map(([lon, lat]) => projicer(lon, lat));

export function lavKort(boks) {
  const ved = (lon, lat) => { const [x, y] = projicer(lon, lat); return [x / BREDDE * 100, y / HOEJDE * 100]; };
  const [, aekv] = projicer(0, 0);
  boks.style.aspectRatio = `${BREDDE} / ${HOEJDE}`;
  let lag = '';
  for (const [navn, s] of Object.entries(SAESONER)) {
    lag += `<g class="kort-saeson" data-saeson="${navn}">`;
    for (const [lon, lat, k] of s.regn) {
      const [x, y] = projicer(lon, lat);
      lag += `<ellipse class="kort-regn" cx="${x}" cy="${y}" rx="${46 * k}" ry="${38 * k}"/>`;
    }
    lag += `<path class="kort-itk" d="${glat(proj(s.itk))}"/></g>`;
  }
  boks.innerHTML = `<svg class="kort-svg" viewBox="0 0 ${BREDDE} ${HOEJDE}" aria-hidden="true">
    <rect width="${BREDDE}" height="${HOEJDE}" class="kort-hav"/>
    <path class="kort-aekvator" d="M0 ${aekv}H${BREDDE}"/>
    <path class="kort-land" d="${LAND}"/>
    <path class="kort-graense" d="${GRAENSER}"/>
    ${lag}
  </svg><canvas class="kort-lag" aria-hidden="true"></canvas><div class="kort-etiketter" aria-hidden="true"></div>`;
  const etiketter = boks.querySelector('.kort-etiketter');
  const laerred = boks.querySelector('canvas');
  const pensel = laerred.getContext('2d');
  const span = (tekst, lon, lat, klasse, saeson = '') => {
    const el = document.createElement('span');
    const [x, y] = ved(lon, lat);
    el.className = `kort-etiket ${klasse}`;
    if (saeson) el.dataset.saeson = saeson;
    el.style.left = `${x}%`; el.style.top = `${y}%`;
    el.innerHTML = tekst;
    etiketter.append(el);
  };
  for (const [tekst, lon, lat, klasse] of STEDER) span(tekst, lon, lat, klasse);
  for (const [navn, s] of Object.entries(SAESONER)) {
    for (const p of s.tryk) span(p.over ? `<small>${p.navn}</small><b>${p.t}</b>` : `<b>${p.t}</b><small>${p.navn}</small>`, p.lon, p.lat, `kort-tryk ${p.t === 'H' ? 'hoej' : 'lav'}${p.over ? ' over' : ''}${p.side ? ' side-' + p.side : ''}`, navn);
    const [lon, lat] = navn === 'sommer' ? [108, 22.5] : [100, -13];
    span('ITK', lon, lat, 'kort-itk-tekst', navn);
  }

  let andel = { sommer: 1, vinter: 0 }, fase = 0, bredde = 1, hoejde = 1;
  function tilpas() {
    const r = laerred.getBoundingClientRect();
    bredde = r.width || 1; hoejde = r.height || 1;
    // Etiketter skaleres med kortet, så de ikke vokser sammen på små kort.
    boks.style.setProperty('--k', Math.max(0.68, Math.min(1.15, bredde / 420)).toFixed(3));
    const px = Math.min(devicePixelRatio || 1, 2);
    laerred.width = Math.round(bredde * px); laerred.height = Math.round(hoejde * px);
    pensel.setTransform(px, 0, 0, px, 0, 0);
    tegn();
  }
  new ResizeObserver(tilpas).observe(laerred);

  function tegn() {
    pensel.clearRect(0, 0, bredde, hoejde);
    const sx = bredde / BREDDE, sy = hoejde / HOEJDE;
    const k = Math.max(0.6, Math.min(1.2, bredde / 420));
    for (const [navn, s] of Object.entries(SAESONER)) {
      const a = andel[navn];
      if (a < 0.03) continue;
      const farve = '#1d4f78';
      for (const linje of s.vind) {
        const p = proj(linje).map(([x, y]) => [x * sx, y * sy]);
        const sti = new Path2D(glat(p));
        pensel.save();
        pensel.lineCap = 'round';
        pensel.strokeStyle = farve;
        pensel.globalAlpha = a * 0.28; pensel.lineWidth = 7 * k; pensel.stroke(sti);
        pensel.globalAlpha = a * 0.95; pensel.lineWidth = 2 * k;
        pensel.setLineDash([9 * k, 8 * k]); pensel.lineDashOffset = -fase * 30 * k; pensel.stroke(sti);
        pensel.setLineDash([]);
        // Pilehoved ved enden i bevægelsesretningen.
        const [x1, y1] = p.at(-2), [x2, y2] = p.at(-1), v = Math.atan2(y2 - y1, x2 - x1), s2 = 8 * k;
        pensel.translate(x2, y2); pensel.rotate(v);
        pensel.fillStyle = farve;
        pensel.beginPath(); pensel.moveTo(s2, 0); pensel.lineTo(-s2 * 0.8, -s2 * 0.75); pensel.lineTo(-s2 * 0.35, 0); pensel.lineTo(-s2 * 0.8, s2 * 0.75); pensel.closePath(); pensel.fill();
        pensel.restore();
      }
    }
  }
  return {
    // vind > 0: sommermønster, vind < 0: vintermønster; glidende overgang.
    opdater(vind, dt = 0) {
      const sommer = Math.max(0, Math.min(1, (vind + 0.25) / 0.5));
      andel = { sommer, vinter: 1 - sommer };
      fase += dt * (0.3 + 0.7 * Math.abs(vind));
      boks.querySelectorAll('[data-saeson]').forEach(el => { el.style.opacity = andel[el.dataset.saeson]; });
      tegn();
      return sommer >= 0.5 ? SAESONER.sommer : SAESONER.vinter;
    },
    tilpas,
    saesoner: SAESONER,
  };
}
