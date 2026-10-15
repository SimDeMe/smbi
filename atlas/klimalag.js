// Globale klimalag: Köppen-Geiger og Vahls klimazoner og plantebælter.
// Data: Beck m.fl. (2023), 1991–2020, CC BY 4.0. Dannes af data/klimazoner.py;
// se data/klimazoner.LICENSE for kilde, kriterier og bearbejdning.
// Klasserne fylder også havet nær kysten; laget klippes derfor med
// atlassets egen kystlinje, så kortets lande og kyster bestemmer formen.

const ZONER = {
  tropisk: 'Tropisk zone', subtropisk: 'Subtropisk zone',
  tempereret: 'Tempereret zone', polar: 'Polar zone'
};

export const SYSTEMER = {
  vahl: {
    navn: 'Vahl',
    titel: 'Klimazoner og plantebælter (Vahl)',
    note: 'v/k: varmeste/koldeste måned. Fugtig måned: nedbør (mm) > 2 × temp. (°C). Model ud fra normaler 1991–2020.',
    grupper: [
      ['tropisk', 'Tropisk', 'k > 15 °C'],
      ['subtropisk', 'Subtropisk', 'v > 20, k > 5 °C'],
      ['tempereret', 'Tempereret', 'v ≥ 10 °C'],
      ['polar', 'Polar', 'v < 10 °C']
    ],
    klasser: {
      1: ['tropisk', 'Regnskov', '#1f7a3a', '10–12 fugtige måneder'],
      2: ['tropisk', 'Savanne', '#a9bb3e', '3–9 fugtige måneder'],
      3: ['tropisk', 'Busksteppe', '#dcb85e', '1–2 fugtige måneder'],
      4: ['tropisk', 'Ørken', '#f0cf96', 'ingen fugtige måneder'],
      5: ['subtropisk', 'Subtropisk skov', '#4b9a5b', '10–12 fugtige måneder'],
      6: ['subtropisk', 'Maki', '#93853a', 'vinterregn: 3–9 fugtige måneder, tør sommer'],
      7: ['subtropisk', 'Græssteppe og savanne', '#c9cf74', '3–9 fugtige måneder, regn om sommeren'],
      8: ['subtropisk', 'Busksteppe', '#e6c983', '1–2 fugtige måneder'],
      9: ['subtropisk', 'Ørken', '#f5dfb2', 'ingen fugtige måneder'],
      10: ['tempereret', 'Løvskov', '#7cbf63', '10–12 fugtige måneder, lang vækstsæson'],
      11: ['tempereret', 'Nåleskov', '#2e6a5d', '10–12 fugtige måneder, kort vækstsæson'],
      12: ['tempereret', 'Steppe', '#e3df96', 'tør måned i vækstsæsonen, 3+ fugtige'],
      13: ['tempereret', 'Busksteppe', '#ead49c', '1–2 fugtige måneder i vækstsæsonen'],
      14: ['tempereret', 'Ørken', '#f2e4c6', 'ingen fugtige måneder i vækstsæsonen'],
      15: ['polar', 'Tundra', '#b3aed0', 'varmeste måned 0–10 °C'],
      16: ['polar', 'Is', '#f3f7fb', 'varmeste måned < 0 °C']
    }
  },
  koppen: {
    navn: 'Köppen',
    titel: 'Klimatyper (Köppen-Geiger)',
    note: 'Beck m.fl. (2023), klimanormaler 1991–2020.',
    grupper: [
      ['A', 'A Tropisk', ''], ['B', 'B Tørt', ''], ['C', 'C Tempereret', ''],
      ['D', 'D Koldt (kontinentalt)', ''], ['E', 'E Polart', '']
    ],
    // Becks egne farver (legend.txt).
    klasser: Object.fromEntries([
      ['Af', 'tropisk regnskov', '0 0 255'], ['Am', 'tropisk monsun', '0 120 255'],
      ['Aw', 'tropisk savanne, tør vinter', '70 170 250'],
      ['BWh', 'varm ørken', '255 0 0'], ['BWk', 'kold ørken', '255 150 150'],
      ['BSh', 'varm steppe', '245 165 0'], ['BSk', 'kold steppe', '255 220 100'],
      ['Csa', 'tempereret, tør og hed sommer', '255 255 0'], ['Csb', 'tempereret, tør og varm sommer', '200 200 0'],
      ['Csc', 'tempereret, tør og kølig sommer', '150 150 0'],
      ['Cwa', 'tempereret, tør vinter, hed sommer', '150 255 150'], ['Cwb', 'tempereret, tør vinter, varm sommer', '100 200 100'],
      ['Cwc', 'tempereret, tør vinter, kølig sommer', '50 150 50'],
      ['Cfa', 'tempereret, ingen tørtid, hed sommer', '200 255 80'], ['Cfb', 'tempereret, ingen tørtid, varm sommer', '100 255 80'],
      ['Cfc', 'tempereret, ingen tørtid, kølig sommer', '50 200 0'],
      ['Dsa', 'koldt, tør og hed sommer', '255 0 255'], ['Dsb', 'koldt, tør og varm sommer', '200 0 200'],
      ['Dsc', 'koldt, tør og kølig sommer', '150 50 150'], ['Dsd', 'koldt, tør sommer, meget kold vinter', '150 100 150'],
      ['Dwa', 'koldt, tør vinter, hed sommer', '170 175 255'], ['Dwb', 'koldt, tør vinter, varm sommer', '90 120 220'],
      ['Dwc', 'koldt, tør vinter, kølig sommer', '75 80 180'], ['Dwd', 'koldt, tør vinter, meget kold vinter', '50 0 135'],
      ['Dfa', 'koldt, ingen tørtid, hed sommer', '0 255 255'], ['Dfb', 'koldt, ingen tørtid, varm sommer', '55 200 255'],
      ['Dfc', 'koldt, ingen tørtid, kølig sommer', '0 125 125'], ['Dfd', 'koldt, ingen tørtid, meget kold vinter', '0 70 95'],
      ['ET', 'tundra', '178 178 178'], ['EF', 'evig frost (is)', '102 102 102']
    ].map(([kode, tekst, rgb], i) => [i + 1, [kode[0], kode, `rgb(${rgb.split(' ').join(',')})`, tekst]]))
  }
};

// Ens opslag for begge systemer: gruppe, kort navn, farve, forklaring.
export function klasse(system, nr) {
  const k = SYSTEMER[system].klasser[nr];
  if (!k) return null;
  if (system === 'koppen') return { gruppe: k[0], navn: k[1], farve: k[2], forklaring: k[3] };
  return { gruppe: k[0], navn: k[1], farve: k[2], forklaring: k[3], zone: ZONER[k[0]] };
}

export function beskriv(system, nr) {
  const k = klasse(system, nr);
  if (!k) return '';
  return system === 'koppen' ? `${k.navn} – ${k.forklaring}` : `${k.zone}: ${k.navn.toLowerCase()} (${k.forklaring})`;
}

const data = {};
const henter = {};

function kontrollerData(topo, system) {
  const objekt = topo?.objects?.[system];
  const gyldige = new Set(Object.keys(SYSTEMER[system].klasser).map(Number));
  if (topo?.type !== 'Topology' || !Array.isArray(topo.arcs) || !topo.arcs.length ||
      objekt?.type !== 'GeometryCollection' || objekt.geometries.length < (system === 'vahl' ? 12 : 25) ||
      objekt.geometries.some(g => !gyldige.has(g.id) || !['Polygon', 'MultiPolygon'].includes(g.type))) {
    throw new Error('Klimadata er ugyldige eller ufuldstændige');
  }
}

// Detaljeniveauer (Visvalingam, sfærisk areal i steradianer). Fælles buer
// forenkles samlet, så der ikke opstår sprækker mellem klasserne. Grove
// niveauer bruges, når kloden er lille; aflæsningen bruger altid de fulde data.
const NIVEAUER = [4e-6, 1e-6, 2.5e-7, 6e-8, 0];

// Deler hver klasse op i polygoner med en omskreven cirkel (punkt + vinkel),
// så dele uden for synsfeltet kan springes over ved tegning.
function lavDele(samling) {
  const d3 = window.d3;
  const dele = [];
  for (const f of samling.features) {
    if (!f.geometry) continue;
    const polygoner = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const ringe of polygoner) {
      if (ringe[0].length < 4) continue;
      // Rasterpolygonerne har GeoJSON-omløb; D3 tegner sfærisk og vil have ydre
      // ringe med uret. En del, der dækker over en halvkugle, er vendt forkert.
      let p = { type: 'Polygon', coordinates: ringe };
      if (d3.geoArea(p) > 2 * Math.PI) p = { type: 'Polygon', coordinates: ringe.map(r => [...r].reverse()) };
      const midte = ringe[0][0];
      let radius = 0;
      for (const punkt of ringe[0]) radius = Math.max(radius, d3.geoDistance(midte, punkt));
      dele.push({ nr: f.id, polygon: p, midte, radius, boks: d3.geoBounds(p) });
    }
  }
  return dele;
}

export function hentKlimalag(system) {
  if (data[system]) return Promise.resolve(data[system]);
  henter[system] ??= (async () => {
    const topojson = window.topojson;
    const [svar] = await Promise.all([
      fetch(new URL(`./data/${system}.json`, import.meta.url), { signal: AbortSignal.timeout(15000) }),
      topojson.presimplify ? null : import('./vendor/topojson-simplify.min.js')
    ]);
    if (!svar.ok) throw new Error('Klimadata kunne ikke indlæses');
    const topo = await svar.json();
    kontrollerData(topo, system);
    const vaegtet = topojson.presimplify(topo, topojson.sphericalTriangleArea);
    const fuld = lavDele(topojson.feature(topo, topo.objects[system]));
    const niveauer = new Map([[0, fuld]]);
    const niveau = graense => {
      if (!niveauer.has(graense)) {
        niveauer.set(graense, lavDele(topojson.feature(topojson.simplify(vaegtet, graense), vaegtet.objects[system])));
      }
      return niveauer.get(graense);
    };
    // Vahls zonegrænser: kanter mellem klasser i hver sin temperaturzone.
    const zone = g => SYSTEMER.vahl.klasser[g.id]?.[0];
    const zonegraenser = system === 'vahl' ? topojson.mesh(topo, topo.objects.vahl, (a, b) => a !== b && zone(a) !== zone(b)) : null;
    data[system] = { dele: fuld, niveau, zonegraenser };
    return data[system];
  })().catch(fejl => { delete henter[system]; throw fejl; });
  return henter[system];
}

// Om klassen findes i de hentede data (fx forsvinder små Köppen-klasser ved udglatning).
export function findes(system, nr) {
  return Boolean(data[system]?.dele.some(del => del.nr === Number(nr)));
}

// Klassen i et punkt [lon, lat] efter de fulde data; null uden for klasserne.
export function klasseI(system, punkt) {
  const d = data[system];
  if (!d) return null;
  const [lon, lat] = punkt;
  for (const { nr, polygon, boks: [[v, s], [o, n]] } of d.dele) {
    const iLaengde = v <= o ? lon >= v && lon <= o : lon >= v || lon <= o;
    if (lat >= s && lat <= n && iLaengde && window.d3.geoContains(polygon, punkt)) return nr;
  }
  return null;
}

// Tegnes efter landfladerne og klippes med dem (land: projiceret Path2D). centrum og synsvinkel (radian)
// afgrænser den synlige del af kloden; skala er projektionens radius i px.
export function tegnKlimalag(ctx, sti, system, land, centrum, synsvinkel, skala) {
  const d = data[system];
  if (!d) return;
  const d3 = window.d3;
  // Ca. en halv pixel i steradianer vælger det groveste niveau, der er fint nok.
  const graense = NIVEAUER.find(g => g <= (0.6 / skala) ** 2);
  const klasser = new Map();
  for (const del of d.niveau(graense)) {
    // Uden for synsfeltet, eller under en pixel stor.
    if (del.radius * skala < .7 || d3.geoDistance(centrum, del.midte) - del.radius > synsvinkel) continue;
    if (!klasser.has(del.nr)) klasser.set(del.nr, []);
    klasser.get(del.nr).push(del.polygon.coordinates);
  }
  ctx.save();
  ctx.clip(land);
  for (const [nr, polygoner] of klasser) {
    ctx.beginPath(); sti({ type: 'MultiPolygon', coordinates: polygoner });
    ctx.fillStyle = klasse(system, nr).farve; ctx.fill();
  }
  if (d.zonegraenser) {
    ctx.beginPath(); sti(d.zonegraenser);
    ctx.strokeStyle = '#17211fcc'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 3]); ctx.stroke();
  }
  ctx.restore();
}
