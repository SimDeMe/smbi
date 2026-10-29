// Snittet fra Sydpol til Nordpol som i lærebogsfiguren: et tyndt lag
// atmosfære under tropopausen (ca. 16 km ved ITK, 8 km ved polerne), og hver
// celle som en flad, afrundet løkke med prikker, der løber rundt, og pile ved
// jorden og i højden. Lodret overdrevet, men cellerne er bredere end høje.
// Bælternes placering kommer fra model.js.
import { baelter, itkMiddel, solbredde } from './model.js';

// Mørkere toner af globussens farver, så de kan læses på lys baggrund.
const CELLEFARVE = { Hadley: '#278b78', Ferrel: '#b77a45', Polar: '#7a91b5', 'Én celle': '#278b78' };

export function lavSnit(canvas, tilstand) {
  const ctx = canvas.getContext('2d');
  let B = 0, H = 0, dpr = 1, fase = 0;

  function tilpas() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    B = r.width; H = r.height;
    canvas.width = Math.round(B * dpr); canvas.height = Math.round(H * dpr);
  }

  // Cellernes grænser og navne ud fra rotation og måned.
  function celler(s) {
    const b = baelter(s.maaned), itk = itkMiddel(s.maaned);
    if (s.rotation < 0.5) return { graenser: [-90, itk, 90], navne: ['Én celle', 'Én celle'], itk };
    return {
      graenser: [-90, b.sydFront, b.sydHoej, itk, b.nordHoej, b.nordFront, 90],
      navne: ['Polar', 'Ferrel', 'Hadley', 'Hadley', 'Ferrel', 'Polar'], itk, b,
    };
  }

  function trin(dt) {
    fase += dt * 0.65;
    tegn(tilstand());
  }

  function tegn(s) {
    if (B < 80 || H < 80) return; // Skjult eller endnu ikke målt.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, B, H);
    const venstre = 34, hoejre = B - 14, jord = H - 34, top = 30, span = hoejre - venstre;
    const x = lat => venstre + (lat + 90) / 180 * span;
    const { graenser, navne, itk } = celler(s);
    // Pixel pr. km: 16 km fylder højst en femtedel af bredden, så lagets
    // proportioner minder om lærebogens og ikke bliver et højt tårn.
    const km = Math.min((jord - top) / 18, span * 0.2 / 16);
    const y = h => jord - h * km;
    const tropopause = lat => 8 + 8 * Math.exp(-(((lat - itk) / 38) ** 2));

    // Atmosfæren: himmel op til lidt over tropopausen, højdelinjer ved 8 og 16 km.
    const himmel = ctx.createLinearGradient(0, y(18), 0, jord);
    himmel.addColorStop(0, '#d4e9e600'); himmel.addColorStop(0.25, '#d4e9e6'); himmel.addColorStop(1, '#f1efe3');
    ctx.fillStyle = himmel; ctx.fillRect(venstre, y(18), span, jord - y(18));
    ctx.strokeStyle = '#849f9440'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
    ctx.font = "9px 'IBM Plex Mono', monospace"; ctx.fillStyle = '#6d837b'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const h of [8, 16]) {
      ctx.beginPath(); ctx.moveTo(venstre, y(h)); ctx.lineTo(hoejre, y(h)); ctx.stroke();
      ctx.fillText(`${h} km`, venstre - 4, y(h));
    }
    ctx.setLineDash([]);
    // Tropopausen: lagets låg.
    ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 2) { const p = [x(lat), y(tropopause(lat))]; lat > -90 ? ctx.lineTo(...p) : ctx.moveTo(...p); }
    ctx.strokeStyle = '#6d837b99'; ctx.lineWidth = 1.2; ctx.stroke();
    if (s.etiketter) {
      ctx.fillStyle = '#6d837b'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText('tropopause', hoejre - 2, y(tropopause(90)) - 3);
    }



    // Fremhævning fra trinene.
    const fh = s.fremhaev;
    const felter = fh === 'itk' || fh === 'monsun' ? [[itk - 7, itk + 7]]
      : fh === 'hadley' && graenser.length > 3 ? [[graenser[2], graenser[4]]]
        : fh === 'tre' && graenser.length > 3 ? [[-90, 90]] : [];
    if (fh !== 'tre') {
      ctx.fillStyle = 'rgba(246,206,90,0.22)';
      for (const [a, c] of felter) ctx.fillRect(x(a), y(18), x(c) - x(a), jord - y(18));
    }

    // Jordstriben: koldt → ørken → tropisk → ørken → koldt.
    const stribe = ctx.createLinearGradient(venstre, 0, hoejre, 0);
    stribe.addColorStop(0, '#b9ced4'); stribe.addColorStop(0.33, '#e9bd76'); stribe.addColorStop(0.5 + itk / 180, '#87a783');
    stribe.addColorStop(0.67, '#e9bd76'); stribe.addColorStop(1, '#b9ced4');
    ctx.fillStyle = stribe; ctx.fillRect(venstre, jord + 2, span, 8);

    // Cellerne: afrundede løkker (superellipser) fra jorden op under tropopausen.
    const kant = (v, e) => Math.sign(v) * Math.abs(v) ** e;
    for (let i = 0; i < graenser.length - 1; i++) {
      const a = x(graenser[i]), b = x(graenser[i + 1]);
      const midt = (graenser[i] + graenser[i + 1]) / 2;
      const cx = (a + b) / 2, rx = (b - a) / 2 - Math.max(2, (b - a) * 0.05);
      const ry = ((tropopause(midt) - 0.8) * km - 3) / 2, cy = jord - 3 - ry;
      if (rx <= 4 || ry <= 2) continue;
      const navn = navne[i], farve = CELLEFARVE[navn];
      const p = v => [cx + rx * kant(Math.cos(v), 0.55), cy + ry * kant(Math.sin(v), 0.55)];
      // Ved jorden løber Hadley- og polarcellen mod ækvator, Ferrel mod polen.
      const halvkugle = cx > x(itk) ? 1 : -1;
      const retning = halvkugle * (navn === 'Ferrel' ? -1 : 1);
      ctx.beginPath();
      for (let j = 0; j <= 64; j++) { const q = p(j / 64 * 2 * Math.PI); j ? ctx.lineTo(...q) : ctx.moveTo(...q); }
      ctx.closePath();
      ctx.fillStyle = farve + '1c'; ctx.fill();
      ctx.strokeStyle = farve + (fh === 'tre' ? 'cc' : '80'); ctx.lineWidth = fh === 'tre' ? 1.8 : 1.3; ctx.stroke();
      ctx.fillStyle = farve;
      const prikker = Math.max(4, Math.round((rx + ry) / 9));
      for (let j = 0; j < prikker; j++) {
        const [px, py] = p(fase * retning + j * Math.PI * 2 / prikker);
        ctx.beginPath(); ctx.arc(px, py, 2.1, 0, 7); ctx.fill();
      }
      // Pile ved jorden (v = π/2) og i højden (v = 3π/2).
      for (const v of [Math.PI * 0.5, Math.PI * 1.5]) {
        const [px, py] = p(v), [qx, qy] = p(v + 0.05 * retning);
        const vinkel = Math.atan2(qy - py, qx - px);
        ctx.beginPath();
        ctx.moveTo(px + 6 * Math.cos(vinkel), py + 6 * Math.sin(vinkel));
        ctx.lineTo(px + 6 * Math.cos(vinkel + 2.5), py + 6 * Math.sin(vinkel + 2.5));
        ctx.lineTo(px + 6 * Math.cos(vinkel - 2.5), py + 6 * Math.sin(vinkel - 2.5)); ctx.fill();
      }
      if (s.etiketter && rx > 16 && ry > 6) {
        ctx.font = "600 10px Archivo, system-ui, sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#3f5a52'; ctx.fillText(navn, cx, cy);
      }
    }

    // Tryk ved jorden: lavtryk hvor luften stiger, højtryk hvor den synker.
    ctx.font = "bold 10px Archivo, system-ui, sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < graenser.length; i++) {
      const stiger = graenser.length === 3 ? i === 1 : [1, 3, 5].includes(i);
      const xx = Math.max(venstre + 10, Math.min(hoejre - 10, x(graenser[i])));
      ctx.fillStyle = stiger ? '#2d877c' : '#926936';
      ctx.fillText(stiger ? 'L ↑' : 'H ↓', xx, jord + 22);
    }

    // Breddeakse.
    ctx.fillStyle = '#536f66'; ctx.font = "9px 'IBM Plex Mono', monospace";
    for (const lat of [-90, -60, -30, 0, 30, 60, 90]) {
      const t = lat === -90 ? 'S' : lat === 90 ? 'N' : lat === 0 ? '0°' : Math.abs(lat) + '°';
      ctx.fillText(t, x(lat), H - 2);
    }

    // ITK: stiplet opstigning og en lille tordensky med regn.
    const xi = x(itk);
    ctx.strokeStyle = '#c6a149'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]);
    const ty = Math.max(top - 6, y(tropopause(itk)) - 6);
    ctx.beginPath(); ctx.moveTo(xi, jord - 12); ctx.lineTo(xi, ty + 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#fffdf3'; ctx.strokeStyle = '#91aaa0'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(xi - 12, ty + 14);
    ctx.bezierCurveTo(xi - 25, ty + 14, xi - 18, ty + 2, xi - 11, ty + 5);
    ctx.bezierCurveTo(xi - 16, ty - 12, xi + 6, ty - 17, xi + 8, ty - 3);
    ctx.bezierCurveTo(xi + 18, ty - 7, xi + 22, ty + 12, xi + 12, ty + 14);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4f9eaa';
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(xi + i * 6, ty + 19); ctx.lineTo(xi + i * 6 - 3, ty + 25); ctx.stroke(); }

    // Solen over sin bredde.
    const sx = x(solbredde(s.maaned));
    ctx.fillStyle = '#f4ce72'; ctx.beginPath(); ctx.arc(sx, 9, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d9a93a'; ctx.lineWidth = 1; ctx.stroke();
  }

  return { tilpas, trin, tegn: () => tegn(tilstand()) };
}
