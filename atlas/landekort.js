// Første landekort: Danmark fra Natural Earth 1:10 mio., omgivelser 1:50 mio.
// Hentes først ved valg af landet; globussens data og tilstand bevares.
export async function hentDanmark() {
  const svar = await Promise.all(['danmark-10m.json', 'countries-50m.json'].map(fil =>
    fetch(new URL(`./data/${fil}`, import.meta.url), { signal: AbortSignal.timeout(12000) })));
  if (svar.some(s => !s.ok)) throw new Error('Danmarkskort kunne ikke hentes');
  const [data, baggrund] = await Promise.all(svar.map(s => s.json()));
  const d3 = window.d3;
  const gyldigtLand = land => {
    const g = land?.geometry;
    const polygoner = g?.type === 'MultiPolygon' ? g.coordinates : g?.type === 'Polygon' ? [g.coordinates] : null;
    return Array.isArray(polygoner) && polygoner.length > 0 && polygoner.every(p => Array.isArray(p) && p.length > 0 &&
      p.every(ring => Array.isArray(ring) && ring.length >= 4 && ring.every(punkt => Array.isArray(punkt) &&
        punkt.length === 2 && Number.isFinite(punkt[0]) && Math.abs(punkt[0]) <= 180 &&
        Number.isFinite(punkt[1]) && Math.abs(punkt[1]) <= 90)));
  };
  if (data.type !== 'FeatureCollection' || data.features?.length !== 1 ||
      data.features[0].id !== '208' || !gyldigtLand(data.features[0]) || !baggrund.objects?.countries) {
    throw new Error('Ugyldige landekortdata');
  }
  const omgivelser = window.topojson.feature(baggrund, baggrund.objects.countries);
  if (omgivelser.features?.length < 200 || !omgivelser.features?.every(gyldigtLand)) throw new Error('Ugyldige baggrundsdata');
  const laengdeintervaller = (vest, oest) => vest <= oest ? [[vest, oest]] : [[vest, 180], [-180, oest]];
  // Del øgrupper, så fx Frankrigs oversøiske områder ikke skal projekteres
  // under hvert træk i et Danmarkskort. De oprindelige kyster bevares.
  const baggrundsdele = omgivelser.features.filter(land => land.id !== '208').flatMap(land => {
    const g = land.geometry;
    return (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]).map(coordinates => {
      const figur = { type: 'Polygon', coordinates };
      const [[vest, syd], [oest, nord]] = d3.geoBounds(figur);
      return { figur, syd, nord, intervaller: laengdeintervaller(vest, oest) };
    });
  });
  const danmark = data.features?.find(land => land.id === '208');
  if (!danmark || !d3.geoContains(danmark, [10.2, 56.15]) || !d3.geoContains(danmark, [14.92, 55.1]) ||
      d3.geoContains(danmark, [18.07, 59.33])) throw new Error('Ugyldige landekortdata');
  const projektion = d3.geoMercator();
  let zoom = 1;
  let pan = [0, 0];
  let bredde = 1, hoejde = 1;
  let kortbredde = 1, korthoejde = 1;
  const steder = [
    ['København', [12.5683, 55.6761]], ['Aarhus', [10.2039, 56.1629]],
    ['Odense', [10.3883, 55.4038]], ['Aalborg', [9.9217, 57.0488]],
    ['Rønne', [14.7066, 55.1009]]
  ];
  return {
    get zoom() { return zoom; },
    zoomMed(faktor) { zoom = Math.max(1, Math.min(8, zoom * faktor)); this.flyt(0, 0); },
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
      const omfang = d3.geoPath(projektion).bounds(danmark);
      kortbredde = omfang[1][0] - omfang[0][0]; korthoejde = omfang[1][1] - omfang[0][1];
      this.flyt(0, 0);
      const centrum = [w / 2, (top + h - bund) / 2];
      const t = projektion.translate();
      projektion.scale(projektion.scale() * zoom).translate([
        centrum[0] + (t[0] - centrum[0]) * zoom + pan[0] * w,
        centrum[1] + (t[1] - centrum[1]) * zoom + pan[1] * h
      ]).clipExtent([[0, 0], [w, h]]);
      const sti = d3.geoPath(projektion, ctx);
      ctx.fillStyle = '#d6eaf2'; ctx.fillRect(0, 0, w, h);
      // Hele verdenskortet er til rådighed; kun synlige dele projekteres.
      const [vest, syd] = projektion.invert([0, h]);
      const [oest, nord] = projektion.invert([w, 0]);
      const intervaller = laengdeintervaller(vest, oest);
      const synlige = baggrundsdele.filter(del => del.syd <= nord && del.nord >= syd &&
        del.intervaller.some(([v, oe]) => intervaller.some(([a, b]) => v <= b && oe >= a)));
      for (const land of [...synlige.map(del => del.figur), danmark]) {
        ctx.beginPath(); sti(land);
        ctx.fillStyle = land === danmark ? '#d9e2bb' : '#e8e7d9'; ctx.fill();
        ctx.strokeStyle = land === danmark ? '#345e50' : '#9bada1';
        ctx.lineWidth = land === danmark ? 1.25 : .7; ctx.stroke();
      }
      // Byernes koordinater er orienteringspunkter, ikke faglige modelmarkører.
      ctx.font = '600 12px Archivo, sans-serif';
      for (const [navn, punkt] of steder) {
        const [x, y] = projektion(punkt);
        if (x < 12 || x > w - 12 || y < top || y > h - bund) continue;
        const tekstx = x + 7 + ctx.measureText(navn).width < w - 8 ? x + 7 : x - 7 - ctx.measureText(navn).width;
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 2 * Math.PI); ctx.fillStyle = '#17211f'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#fff9ee'; ctx.strokeText(navn, tekstx, y + 4);
        ctx.fillText(navn, tekstx, y + 4);
      }
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
