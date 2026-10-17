// Klimaforandringer: havisens udbredelse i marts og september, 1980–2025.
// NSIDC Sea Ice Index v4 (G02135): områder med mindst 15 % havis og medianen
// for 1981–2010. Dannes af data/havis.py; se data/havis.LICENSE.
// Arktis har sit maksimum i marts og sit minimum i september; i Antarktis er
// det omvendt (maksimum i september, minimum i februar–marts).

export const ORDEN = 1;
export const AFLAESNING = '#havisaflaesning';
export const MAANED = { 3: 'marts', 9: 'september' };
export const POL = { N: 'Arktis', S: 'Antarktis' };

let data = null, henter = null, sidsteProjektion = null;
export const valg = { maaned: 9, aar: 2025, median: true };
export const hentede = () => data;

// D3 regner polygoner på kuglen: indersiden er den med uret. En ring om
// polen med forkert omløb ville dække hele resten af Jorden; den vendes.
function retVinding(mp) {
  const d3 = window.d3;
  return mp.map(polygon => d3.geoArea({ type: 'Polygon', coordinates: polygon }) > 2 * Math.PI
    ? polygon.map(ring => [...ring].reverse()) : polygon);
}

export function hent() {
  if (data) return Promise.resolve(data);
  henter ??= fetch(new URL('./data/havis.json', import.meta.url), { signal: AbortSignal.timeout(20000) })
    .then(svar => { if (!svar.ok) throw new Error('Havisdata kunne ikke indlæses'); return svar.json(); })
    .then(d => {
      if (!Array.isArray(d?.aar) || !d.kort?.['N-9-1980']?.length || !d.serie?.['N-9']?.length) throw new Error('Havisdata er ugyldige');
      for (const noegle of Object.keys(d.kort)) d.kort[noegle] = { type: 'MultiPolygon', coordinates: retVinding(d.kort[noegle]) };
      for (const noegle of Object.keys(d.median)) d.median[noegle] = { type: 'MultiLineString', coordinates: d.median[noegle] };
      data = d;
      return d;
    })
    .catch(fejl => { henter = null; throw fejl; });
  return henter;
}

export const kort = (pol, m = valg.maaned, a = valg.aar) => data.kort[`${pol}-${m}-${a}`];
export const serie = (pol, m = valg.maaned) => data.serie[`${pol}-${m}`];
// Udbredelse i mio. km² for et år, og medianen 1981–2010 af samme serie.
export const udbredelse = (pol, a = valg.aar, m = valg.maaned) => serie(pol, m).find(([aar]) => aar === a)?.[1] ?? null;
export function median(pol, m = valg.maaned) {
  const v = serie(pol, m).filter(([a]) => a >= 1981 && a <= 2010).map(([, x]) => x).sort((a, b) => a - b);
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
}
export const km2 = v => `${v.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mio. km²`;

export function tegn(ctx, { projektion }) {
  if (!data) return;
  sidsteProjektion = projektion;
  const sti = window.d3.geoPath(projektion, ctx);
  ctx.save();
  for (const pol of Object.keys(POL)) {
    ctx.beginPath(); sti(kort(pol));
    ctx.fillStyle = '#ffffffeb'; ctx.fill();
    ctx.lineWidth = .9; ctx.strokeStyle = '#4f8fb3'; ctx.stroke();
  }
  if (valg.median) {
    ctx.lineCap = 'round';
    for (const pol of Object.keys(POL)) {
      const linje = data.median[`${pol}-${valg.maaned}`];
      ctx.setLineDash([]);
      ctx.beginPath(); sti(linje); ctx.strokeStyle = '#fff9ee'; ctx.lineWidth = 4; ctx.stroke();
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); sti(linje); ctx.strokeStyle = '#d9480f'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  ctx.restore();
}

export function aflaes(xy) {
  const d3 = window.d3;
  const p = sidsteProjektion?.invert(xy);
  if (!p || !Number.isFinite(p[0])) return '';
  const pol = p[1] >= 0 ? 'N' : 'S';
  const tid = `${MAANED[valg.maaned]} ${valg.aar}`;
  return d3.geoContains(kort(pol), p) ? `havis i ${tid}` : `ingen havis i ${tid}`;
}
