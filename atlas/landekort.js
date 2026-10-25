// Landekort: Danmark fra DAGI 1:500.000 (kyster, kommuner, regioner),
// omgivelserne fra Natural Earth 1:10 mio. Hentes først ved valg af landet;
// globussens data og tilstand bevares.
export const MAKS_ZOOM = 16;

export async function hentDanmark() {
  const [svar] = await Promise.all([Promise.all(['danmark-dagi.json', 'europa-10m.json'].map(fil =>
    fetch(new URL(`./data/${fil}`, import.meta.url), { signal: AbortSignal.timeout(12000) }))),
  window.topojson.presimplify ? null : import('./vendor/topojson-simplify.min.js')]);
  if (svar.some(s => !s.ok)) throw new Error('Danmarkskort kunne ikke hentes');
  const [data, baggrund] = await Promise.all(svar.map(s => s.json()));
  const d3 = window.d3, topojson = window.topojson;
  const gyldigtLand = land => {
    const g = land?.geometry;
    const polygoner = g?.type === 'MultiPolygon' ? g.coordinates : g?.type === 'Polygon' ? [g.coordinates] : null;
    return Array.isArray(polygoner) && polygoner.length > 0 && polygoner.every(p => Array.isArray(p) && p.length > 0 &&
      p.every(ring => Array.isArray(ring) && ring.length >= 4 && ring.every(punkt => Array.isArray(punkt) &&
        punkt.length === 2 && Number.isFinite(punkt[0]) && Math.abs(punkt[0]) <= 180 &&
        Number.isFinite(punkt[1]) && Math.abs(punkt[1]) <= 90)));
  };
  if (data?.type !== 'Topology' || data.objects?.kommuner?.geometries?.length !== 99 ||
      baggrund?.type !== 'Topology' || !baggrund.objects?.countries) throw new Error('Ugyldige landekortdata');
  const kommuner = topojson.feature(data, data.objects.kommuner).features;
  if (!kommuner.every(gyldigtLand)) throw new Error('Ugyldige landekortdata');
  const danmark = { type: 'Feature', geometry: topojson.merge(data, data.objects.kommuner.geometries) };
  if (!gyldigtLand(danmark) || !d3.geoContains(danmark, [10.2, 56.15]) || !d3.geoContains(danmark, [14.92, 55.1]) ||
      d3.geoContains(danmark, [18.07, 59.33]) || d3.geoContains(danmark, [9.2, 56.97])) throw new Error('Ugyldige landekortdata');
  // Kyst og landegrænse er buer med kun én kommune; indre buer er kommune- eller regionsgrænser.
  const figurer = topo => {
    const g = topo.objects.kommuner;
    return {
      danmark: topojson.merge(topo, g.geometries),
      kyst: topojson.mesh(topo, g, (a, b) => a === b),
      regionsgraenser: topojson.mesh(topo, g, (a, b) => a !== b && a.properties.region !== b.properties.region),
      kommunegraenser: topojson.mesh(topo, g, (a, b) => a !== b && a.properties.region === b.properties.region)
    };
  };
  const omgivelser = topojson.feature(baggrund, baggrund.objects.countries).features.filter(land => land.id !== '208');
  if (omgivelser.length < 40 || !omgivelser.every(gyldigtLand)) throw new Error('Ugyldige baggrundsdata');
  // Nabolande inden for et rummeligt udsnit om Danmark; selv meget brede vinduer
  // ved 1× når ikke ud over det. Fjerne øer og oversøiske dele udelades.
  const naeromraade = topo => ({ type: 'MultiPolygon', coordinates: topojson.feature(topo, topo.objects.countries).features
    .filter(land => land.id !== '208')
    .flatMap(({ geometry: g }) => g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates])
    .filter(polygon => { const [[v, s], [o, n]] = d3.geoBounds({ type: 'Polygon', coordinates: polygon }); return v < 50 && o > -20 && s < 72 && n > 40; }) });
  // Forenklede udgaver til lav zoom (sfærisk trekantareal), så der ikke tegnes
  // linjestykker under en pixel. Fra 6× bruges de fulde data.
  const vaegtet = topojson.presimplify(data, topojson.sphericalTriangleArea);
  const vaegtetBaggrund = topojson.presimplify(baggrund, topojson.sphericalTriangleArea);
  const niveauer = new Map();
  const niveau = graense => {
    if (!niveauer.has(graense)) niveauer.set(graense, graense === 0 ? { ...figurer(data), omgivelser: naeromraade(baggrund) }
      : { ...figurer(topojson.simplify(vaegtet, graense)), omgivelser: naeromraade(topojson.simplify(vaegtetBaggrund, graense)) });
    return niveauer.get(graense);
  };
  const projektion = d3.geoMercator().precision(0);
  let zoom = 1;
  let pan = [0, 0];
  let bredde = 1, hoejde = 1;
  let kortbredde = 1, korthoejde = 1;
  let stier = {};
  // Byer som orienteringspunkter med den zoom, hvor de kommer frem. Koordinater
  // fra Natural Earth populated places og kendte bymidter; hver by er kontrolleret
  // til at ligge i sin egen kommune i DAGI-data (data/danmark-dagi.LICENSE).
  const byer = [
    ['København', [12.5683, 55.6761], 1], ['Aarhus', [10.2039, 56.1629], 1],
    ['Odense', [10.3883, 55.4038], 1], ['Aalborg', [9.9217, 57.0488], 1],
    ['Esbjerg', [8.45, 55.467], 1], ['Rønne', [14.7066, 55.1009], 1],
    ['Vejle', [9.535, 55.709], 1.7], ['Viborg', [9.4, 56.4333], 1.7], ['Roskilde', [12.0833, 55.65], 1.7],
    ['Frederikshavn', [10.5333, 57.4337], 1.7], ['Svendborg', [10.6167, 55.0704], 1.7],
    ['Kolding', [9.4722, 55.4904], 1.7], ['Randers', [10.0364, 56.4607], 1.7], ['Herning', [8.9734, 56.1393], 1.7],
    ['Helsingør', [12.5915, 56.0361], 1.7], ['Sønderborg', [9.7926, 54.9138], 1.7], ['Næstved', [11.7609, 55.2299], 1.7],
    ['Nykøbing F', [11.8724, 54.7691], 1.7], ['Thisted', [8.6942, 56.9552], 1.7], ['Holstebro', [8.6164, 56.3601], 1.7],
    ['Horsens', [9.8503, 55.8607], 2.5], ['Silkeborg', [9.5452, 56.1697], 2.5], ['Hjørring', [9.9803, 57.4642], 2.5],
    ['Skagen', [10.5833, 57.7209], 2.5], ['Ribe', [8.7604, 55.328], 2.5], ['Tønder', [8.8631, 54.9333], 2.5],
    ['Kalundborg', [11.0886, 55.6795], 2.5], ['Grenaa', [10.8783, 56.4158], 2.5], ['Hillerød', [12.3167, 55.9333], 2.5],
    ['Sorø', [11.5667, 55.433], 2.5]
  ];
  // Farvandsnavne: etiketpunkter i vand (kontrolleret mod DAGI-kysten), ikke afgrænsninger.
  const farvande = [
    ['Nordsøen', [7.3, 56.1], 1], ['Skagerrak', [8.95, 57.55], 1], ['Kattegat', [11.4, 56.8], 1],
    ['Østersøen', [14.2, 54.85], 1], ['Storebælt', [10.97, 55.25], 1.7], ['Lillebælt', [9.75, 55.3], 1.7],
    ['Øresund', [12.75, 55.82], 1.7], ['Limfjorden', [9.1, 56.93], 1.7], ['Vadehavet', [8.45, 55.2], 2.5],
    ['Smålandsfarvandet', [11.35, 55.05], 2.5], ['Femern Bælt', [11.2, 54.6], 2.5]
  ];
  const kommunenavne = kommuner.map(k => [k.properties.navn, k.properties.p]);
  return {
    maksZoom: MAKS_ZOOM,
    get zoom() { return zoom; },
    zoomMed(faktor) { zoom = Math.max(1, Math.min(MAKS_ZOOM, zoom * faktor)); this.flyt(0, 0); },
    flyt(x, y) {
      // Begræns panorering ud fra landets størrelse, også i meget brede vinduer.
      const gx = kortbredde * (.15 + (zoom - 1) * .45) / bredde;
      const gy = korthoejde * (.15 + (zoom - 1) * .45) / hoejde;
      pan = [Math.max(-gx, Math.min(gx, pan[0] + x / bredde)),
        Math.max(-gy, Math.min(gy, pan[1] + y / hoejde))];
    },
    nulstil() { zoom = 1; pan = [0, 0]; },
    tegn(ctx, w, h) {
      bredde = w; hoejde = h;
      // Fri plads til tilbageknap, nordpil og betjening i figurens hjørner.
      const top = 66, bund = w >= 900 ? 64 : 32;
      projektion.clipExtent(null).fitExtent([[32, top], [w - 32, h - bund]], danmark);
      // Stierne projekteres én gang pr. vinduesstørrelse og detaljeniveau. Zoom og
      // panorering er i Mercator en ren skalering og forskydning (transformation).
      if (stier.noegle !== `${w}x${h}`) {
        const grund = d3.geoMercator().precision(0).scale(projektion.scale()).translate(projektion.translate());
        const omfang = d3.geoPath(grund).bounds(danmark);
        kortbredde = omfang[1][0] - omfang[0][0]; korthoejde = omfang[1][1] - omfang[0][1];
        // Forenkling: en halv pixel ved niveauets mindste zoom; fra 6× fulde data.
        const graense = fra => fra ? Number((Math.cos(56 * Math.PI / 180) / (grund.scale() * fra) / 2) ** 2).toPrecision(2) * 1 : 0;
        const lav = fra => {
          const n = niveau(graense(fra));
          const sti = figur => { const p = new Path2D(); d3.geoPath(grund, p)(figur); return p; };
          return { danmark: sti(n.danmark), kyst: sti(n.kyst), regionsgraenser: sti(n.regionsgraenser),
            kommunegraenser: sti(n.kommunegraenser), omgivelser: sti(n.omgivelser) };
        };
        stier = { noegle: `${w}x${h}`, lav, niveauer: new Map() };
        // De andre niveauer forberedes i ledig tid, så zoom ikke hakker første gang.
        const egne = stier, ledigTid = window.requestIdleCallback || (f => setTimeout(f, 200));
        const naeste = [2.5, 0];
        const forbered = () => {
          if (stier !== egne || !naeste.length) return;
          const fra = naeste.shift();
          if (!egne.niveauer.has(fra)) egne.niveauer.set(fra, lav(fra));
          ledigTid(forbered);
        };
        ledigTid(forbered);
      }
      const fraZoom = zoom < 2.5 ? 1 : zoom < 6 ? 2.5 : 0;
      if (!stier.niveauer.has(fraZoom)) stier.niveauer.set(fraZoom, stier.lav(fraZoom));
      const cache = stier.niveauer.get(fraZoom);
      this.flyt(0, 0);
      const centrum = [w / 2, (top + h - bund) / 2];
      const t = projektion.translate();
      projektion.scale(projektion.scale() * zoom).translate([
        centrum[0] + (t[0] - centrum[0]) * zoom + pan[0] * w,
        centrum[1] + (t[1] - centrum[1]) * zoom + pan[1] * h
      ]).clipExtent([[0, 0], [w, h]]);
      ctx.fillStyle = '#d6eaf2'; ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.transform(zoom, 0, 0, zoom, centrum[0] * (1 - zoom) + pan[0] * w, centrum[1] * (1 - zoom) + pan[1] * h);
      // Linjebredder i skærmpixel uanset zoom.
      const linje = (sti, farve, bredde, stiplet) => {
        ctx.strokeStyle = farve; ctx.lineWidth = bredde / zoom;
        ctx.setLineDash(stiplet ? stiplet.map(l => l / zoom) : []); ctx.stroke(sti);
      };
      ctx.fillStyle = '#e8e7d9'; ctx.fill(cache.omgivelser);
      linje(cache.omgivelser, '#9bada1', .7);
      ctx.fillStyle = '#d9e2bb'; ctx.fill(cache.danmark);
      // Kommunegrænser først ved zoom, så oversigten ikke bliver urolig.
      if (zoom >= 2) linje(cache.kommunegraenser, '#a3b38e', .8);
      linje(cache.regionsgraenser, '#6f8a6f', 1.1, [5, 3]);
      linje(cache.kyst, '#345e50', zoom >= 4 ? 1.1 : .9);
      ctx.restore();

      // Etiketter må ikke overlappe; byer har forrang, så farvande og kommuner.
      const optaget = [];
      const ledig = (x0, y0, x1, y1) => x0 > 4 && x1 < w - 4 && y0 > top - 8 && y1 < h - bund + 4 &&
        !optaget.some(([a, b, c, d]) => x0 < c && x1 > a && y0 < d && y1 > b);
      const skriv = (tekst, x, y, fyld, kant) => {
        ctx.lineWidth = 4; ctx.strokeStyle = kant; ctx.strokeText(tekst, x, y);
        ctx.fillStyle = fyld; ctx.fillText(tekst, x, y);
      };
      const vist = new Set();
      ctx.font = '600 12px Archivo, sans-serif';
      for (const [navn, punkt, fraZoom] of byer) {
        if (zoom < fraZoom) continue;
        const [x, y] = projektion(punkt);
        const b = ctx.measureText(navn).width;
        const tekstx = x + 7 + b < w - 8 ? x + 7 : x - 7 - b;
        if (!ledig(Math.min(x - 3, tekstx), y - 9, Math.max(x + 3, tekstx + b), y + 6)) continue;
        optaget.push([Math.min(x - 3, tekstx) - 2, y - 11, Math.max(x + 3, tekstx + b) + 2, y + 8]);
        vist.add(navn);
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 2 * Math.PI); ctx.fillStyle = '#17211f'; ctx.fill();
        skriv(navn, tekstx, y + 4, '#17211f', '#fff9ee');
      }
      ctx.font = 'italic 13px "Source Serif 4", Georgia, serif';
      ctx.textAlign = 'center';
      for (const [navn, punkt, fraZoom] of farvande) {
        if (zoom < fraZoom) continue;
        const [x, y] = projektion(punkt);
        const b = ctx.measureText(navn).width / 2;
        if (!ledig(x - b, y - 10, x + b, y + 4)) continue;
        optaget.push([x - b - 2, y - 12, x + b + 2, y + 6]);
        skriv(navn, x, y, '#2f6f8f', 'rgba(214,234,242,.9)');
      }
      // Kommunenavne ved tæt zoom; punktet er et indre punkt, ikke kommunens centrum.
      if (zoom >= 3.5) {
        ctx.font = '11px Archivo, sans-serif';
        for (const [navn, punkt] of kommunenavne) {
          if (vist.has(navn)) continue; // Byens navn står der allerede.
          const [x, y] = projektion(punkt);
          const b = ctx.measureText(navn).width / 2;
          if (!ledig(x - b, y - 9, x + b, y + 3)) continue;
          optaget.push([x - b - 2, y - 11, x + b + 2, y + 5]);
          skriv(navn, x, y, '#4d5f4a', 'rgba(217,226,187,.85)');
        }
      }
      ctx.textAlign = 'start';

      // Lokal målestok: sfærisk afstand ved målestokkens position på kortet.
      const y = h - bund + 12, x = 24;
      const km = d3.geoDistance(projektion.invert([x, y]), projektion.invert([x + 90, y])) * 6371;
      const laengde = [1, 2, 5, 10, 20, 50, 100, 200].filter(tal => tal <= km).at(-1) || 1;
      const px = 90 * laengde / km;
      ctx.strokeStyle = '#17211f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.lineTo(x + px, y - 5); ctx.stroke();
      ctx.font = '12px "IBM Plex Mono", monospace'; ctx.fillStyle = '#17211f'; ctx.fillText(`${laengde} km`, x, y - 9);
    }
  };
}
