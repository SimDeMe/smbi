// Snittet fra Sydpol til Nordpol: hver celle som en rolig ellipse med
// prikker, der løber rundt, og pile ved jorden og i højden. Lodret meget
// overdrevet. Bælternes placering kommer fra model.js.
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
    if (s.rotation < 0.5) return { graenser: [-90, itk, 90], navne: ['Én celle', 'Én celle'], hoejder: [0.95, 0.95], itk };
    return {
      graenser: [-90, b.sydFront, b.sydHoej, itk, b.nordHoej, b.nordFront, 90],
      navne: ['Polar', 'Ferrel', 'Hadley', 'Hadley', 'Ferrel', 'Polar'],
      hoejder: [0.5, 0.68, 1, 1, 0.68, 0.5], itk, b,
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

    // Himmel og højdelinjer.
    const himmel = ctx.createLinearGradient(0, top, 0, jord);
    himmel.addColorStop(0, '#d4e9e6'); himmel.addColorStop(1, '#f1efe3');
    ctx.fillStyle = himmel; ctx.fillRect(venstre, top - 7, span, jord - top + 7);
    ctx.strokeStyle = '#849f9440'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
    ctx.font = "9px 'IBM Plex Mono', monospace"; ctx.fillStyle = '#6d837b'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const km of [9, 18]) {
      const y = jord - (jord - top) * km / 18;
      ctx.beginPath(); ctx.moveTo(venstre, y); ctx.lineTo(hoejre, y); ctx.stroke();
      ctx.fillText(`${km} km`, venstre - 4, y);
    }
    ctx.setLineDash([]);

    const { graenser, navne, hoejder, itk } = celler(s);

    // Fremhævning fra trinene.
    const fh = s.fremhaev;
    const felter = fh === 'itk' || fh === 'monsun' ? [[itk - 7, itk + 7]]
      : fh === 'hadley' && graenser.length > 3 ? [[graenser[2], graenser[4]]]
        : fh === 'tre' && graenser.length > 3 ? [[-90, 90]] : [];
    if (fh !== 'tre') {
      ctx.fillStyle = 'rgba(246,206,90,0.22)';
      for (const [a, c] of felter) ctx.fillRect(x(a), top - 7, x(c) - x(a), jord - top + 7);
    }

    // Jordstriben: koldt → ørken → tropisk → ørken → koldt.
    const stribe = ctx.createLinearGradient(venstre, 0, hoejre, 0);
    stribe.addColorStop(0, '#b9ced4'); stribe.addColorStop(0.33, '#e9bd76'); stribe.addColorStop(0.5 + itk / 180, '#87a783');
    stribe.addColorStop(0.67, '#e9bd76'); stribe.addColorStop(1, '#b9ced4');
    ctx.fillStyle = stribe; ctx.fillRect(venstre, jord + 2, span, 8);

    // Cellerne.
    for (let i = 0; i < graenser.length - 1; i++) {
      const a = x(graenser[i]), b = x(graenser[i + 1]);
      const cx = (a + b) / 2, rx = (b - a) * 0.43, ry = (jord - top - 18) * hoejder[i] / 2, cy = jord - ry - 7;
      if (rx <= 0 || ry <= 0) continue;
      const navn = navne[i], farve = CELLEFARVE[navn];
      // Ved jorden løber Hadley- og polarcellen mod ækvator, Ferrel mod polen.
      const halvkugle = cx > x(itk) ? 1 : -1;
      const retning = halvkugle * (navn === 'Ferrel' ? -1 : 1);
      ctx.strokeStyle = farve + (fh === 'tre' ? 'cc' : '65'); ctx.lineWidth = fh === 'tre' ? 1.8 : 1.2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = farve;
      for (let j = 0; j < 7; j++) {
        const v = fase * retning + j * Math.PI * 2 / 7;
        ctx.beginPath(); ctx.arc(cx + rx * Math.cos(v), cy + ry * Math.sin(v), 2.2, 0, 7); ctx.fill();
      }
      for (const v of [Math.PI * 0.5, Math.PI * 1.5]) {
        const px = cx + rx * Math.cos(v), py = cy + ry * Math.sin(v);
        const vinkel = Math.atan2(retning * ry * Math.cos(v), -retning * rx * Math.sin(v));
        ctx.beginPath();
        ctx.moveTo(px + 5 * Math.cos(vinkel), py + 5 * Math.sin(vinkel));
        ctx.lineTo(px + 5 * Math.cos(vinkel + 2.5), py + 5 * Math.sin(vinkel + 2.5));
        ctx.lineTo(px + 5 * Math.cos(vinkel - 2.5), py + 5 * Math.sin(vinkel - 2.5)); ctx.fill();
      }
      if (s.etiketter && rx > 16) {
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
    ctx.beginPath(); ctx.moveTo(xi, jord - 12); ctx.lineTo(xi, top + 4); ctx.stroke(); ctx.setLineDash([]);
    const ty = top + 4;
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
