// Psykrometer som SVG-figur — tegnet efter fotoet i øvelsen «Måling af luftfugtighed».
//
// Brug:
//   import { lavPsykrometer } from "./psykrometer.js";
//   const p = lavPsykrometer(beholder, { tør: 22, våd: 16 });
//   p.opdater({ tør: 20, våd: 14 });       // flytter de røde søjler
//   p.markér(22, 5, { visVærdi: false });  // fremhæv række og kolonne
//   p.markér(null);                        // fjern fremhævningen
//
// Tabellen mellem termometrene regnes ud fra model.js og svarer til den trykte
// tabel på klassens psykrometer. Med fremhæv: true markeres række og kolonne
// automatisk ud fra temperaturerne (og svaret vises); med false styres det af
// markér(). Med visRF: false nævner skærmlæserteksten ikke svaret.

import { relativFugtighed, tabelværdi } from "./model.js";

const NS = "http://www.w3.org/2000/svg";
const T_MIN = -10, T_MAX = 50;
const Y_TOP = 182, Y_BUND = 560;              // y for 50 °C og −10 °C
const yT = (t) => Y_BUND - ((t - T_MIN) / (T_MAX - T_MIN)) * (Y_BUND - Y_TOP);
const X_TØR = 88, X_VÅD = 212;                // termometerrørenes midte
const Y_KUGLE = 588;

// Tabelgeometri
const TAB_X = 100, TAB_B = 100, KOL0 = 16, KOL = (TAB_B - KOL0) / 6;
const RÆK_Y0 = 207, RÆK_H = 9.55;             // række for 35 °C øverst, 0 °C nederst
const rækkeY = (t) => RÆK_Y0 + (35 - t) * RÆK_H;
const kolX = (d) => TAB_X + KOL0 + (d - 1) * KOL;

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "Archivo, system-ui, sans-serif";

let nummer = 0;

export function lavPsykrometer(beholder, valg = {}) {
  const id = `psy${++nummer}`;
  const farve = valg.farve ?? "#2F9E57";
  const mørk = valg.mørkFarve ?? "#22794A";
  const fremhæv = valg.fremhæv ?? true;
  const visRF = valg.visRF ?? true;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 300 840");
  svg.setAttribute("role", "img");
  svg.setAttribute("class", "psykrometer");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.display = "block";
  svg.innerHTML = statiskDel(id, farve, mørk) + dynamiskDel(id);
  beholder.appendChild(svg);

  const $ = (navn) => svg.querySelector(`#${id}-${navn}`);
  const el = {
    titel: $("titel"),
    søjleTør: $("soejle-toer"), søjleVåd: $("soejle-vaad"),
    række: $("raekke"), kolonne: $("kolonne"), celle: $("celle"), celleTekst: $("celle-tekst"),
  };

  function opdater({ tør, våd }) {
    const tt = klem(tør), tv = klem(våd);
    el.søjleTør.setAttribute("y", yT(tt));
    el.søjleTør.setAttribute("height", Y_KUGLE - yT(tt));
    el.søjleVåd.setAttribute("y", yT(tv));
    el.søjleVåd.setAttribute("height", Y_KUGLE - yT(tv));

    const rf = Math.round(relativFugtighed(tør, våd));
    el.titel.textContent =
      `Psykrometer. Tørtermometeret viser ${fmt(tør)} °C, vådtermometeret ${fmt(våd)} °C.` +
      (visRF ? ` Relativ luftfugtighed ca. ${rf} %.` : "");
    if (fremhæv) markér(Math.round(tør), Math.round(tør - våd), { visVærdi: true });
    return rf;
  }

  function markér(række, kolonne, { visVærdi = false } = {}) {
    const iRække = række != null && række >= 0 && række <= 35;
    const iKolonne = kolonne != null && kolonne >= 1 && kolonne <= 6;
    const begge = iRække && iKolonne;
    vis(el.række, iRække);
    vis(el.kolonne, iKolonne);
    vis(el.celle, begge);
    vis(el.celleTekst, begge && visVærdi);
    if (iRække) el.række.setAttribute("y", rækkeY(række) - RÆK_H / 2);
    if (iKolonne) el.kolonne.setAttribute("x", kolX(kolonne));
    if (begge) {
      el.celle.setAttribute("x", kolX(kolonne));
      el.celle.setAttribute("y", rækkeY(række) - RÆK_H / 2);
      // uden værdi: kun en tyk ramme, så tallet nedenunder selv skal aflæses
      el.celle.setAttribute("fill", visVærdi ? "#0E86C8" : "none");
      el.celle.setAttribute("stroke-width", visVærdi ? ".8" : "1.6");
      el.celleTekst.setAttribute("x", kolX(kolonne) + KOL / 2);
      el.celleTekst.setAttribute("y", rækkeY(række) + 2.6);
      el.celleTekst.textContent = tabelværdi(række, kolonne);
    }
  }

  /** Område (i SVG-enheder) for nyttige udsnit, så en side kan zoome dertil. */
  const områder = {
    tør: (t) => ({ x: X_TØR, y: yT(klem(t)) }),
    våd: (t) => ({ x: X_VÅD, y: yT(klem(t)) }),
    celle: (r, k) => ({ x: kolX(k) + KOL / 2, y: rækkeY(r) }),
  };

  markér(null);
  opdater({ tør: valg.tør ?? 20, våd: valg.våd ?? 15 });
  return { svg, opdater, markér, områder };
}

function klem(t) { return Math.max(T_MIN, Math.min(T_MAX, t)); }
function fmt(t) { return (Math.round(t * 10) / 10).toString().replace(".", ","); }
function vis(e, ja) { e.style.display = ja ? "" : "none"; }

// ───────────────────────── statiske dele ─────────────────────────

function statiskDel(id, farve, mørk) {
  return `
<title id="${id}-titel">Psykrometer</title>
<defs>
  <linearGradient id="${id}-hus" x1="0" x2="1">
    <stop offset="0" stop-color="${mørk}"/><stop offset=".12" stop-color="${farve}"/>
    <stop offset=".88" stop-color="${farve}"/><stop offset="1" stop-color="${mørk}"/>
  </linearGradient>
  <linearGradient id="${id}-glas" x1="0" x2="1">
    <stop offset="0" stop-color="#E6ECEB"/><stop offset=".45" stop-color="#FFFFFF"/>
    <stop offset="1" stop-color="#D5DDDB"/>
  </linearGradient>
  <pattern id="${id}-stof" width="4" height="4" patternUnits="userSpaceOnUse">
    <rect width="4" height="4" fill="#F1F3EF"/>
    <path d="M0 2h4M2 0v4" stroke="#C9D2CE" stroke-width=".8"/>
  </pattern>
</defs>

<!-- ophæng og tag -->
<circle cx="150" cy="30" r="13" fill="${farve}" stroke="#17211F" stroke-width="2"/>
<circle cx="150" cy="30" r="4.5" fill="#FFF9EE" stroke="#17211F" stroke-width="1.5"/>
<path d="M22 46 H278 L284 60 H16 Z" fill="${farve}" stroke="#17211F" stroke-width="2" stroke-linejoin="round"/>
<path d="M30 60 V80 M270 60 V80" stroke="#17211F" stroke-width="2"/>

<!-- hus -->
<rect x="34" y="74" width="232" height="728" rx="18" fill="url(#${id}-hus)" stroke="#17211F" stroke-width="2.5"/>
<circle cx="150" cy="818" r="11" fill="${farve}" stroke="#17211F" stroke-width="2"/>
<circle cx="150" cy="818" r="4" fill="#FFF9EE" stroke="#17211F" stroke-width="1.5"/>
<rect x="128" y="796" width="44" height="12" fill="${farve}"/>

<!-- skala- og tabelplade -->
<rect x="50" y="108" width="200" height="500" rx="5" fill="#FFFFFF" stroke="#17211F" stroke-width="1.5"/>

<!-- vandbeholder bag ribberne -->
<rect x="58" y="616" width="184" height="174" rx="6" fill="#1D3B37"/>
<rect x="62" y="672" width="176" height="114" rx="4" fill="#8CC8E6"/>
<path d="M62 672 H238" stroke="#5FAED6" stroke-width="2"/>
<!-- væge fra vådtermometeret ned i vandet -->
<path d="M${X_VÅD} 596 C${X_VÅD} 640 ${X_VÅD - 6} 660 ${X_VÅD - 4} 740" fill="none"
      stroke="url(#${id}-stof)" stroke-width="7" stroke-linecap="round"/>
<path d="M${X_VÅD} 596 C${X_VÅD} 640 ${X_VÅD - 6} 660 ${X_VÅD - 4} 740" fill="none"
      stroke="#9DAAA5" stroke-width="7" stroke-opacity=".25" stroke-linecap="round"/>

<!-- ribbet nederste del -->
${ribber(farve, mørk)}

${skala(X_TØR, -1)}
${skala(X_VÅD, 1)}

<text x="${X_TØR}" y="128" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="700" fill="#17211F">Tør</text>
<text x="${X_VÅD}" y="128" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="700" fill="#17211F">Våd</text>
<text x="60" y="160" font-family="${SANS}" font-size="14" font-weight="700" fill="#17211F">°C</text>
<text x="240" y="160" text-anchor="end" font-family="${SANS}" font-size="14" font-weight="700" fill="#17211F">°C</text>

${tabel()}

${termometer(id, X_TØR, false)}
${termometer(id, X_VÅD, true)}
`;
}

function ribber(farve, mørk) {
  let s = `<path d="M34 636 H266 V784 Q266 802 248 802 H52 Q34 802 34 784 Z" fill="${farve}" stroke="#17211F" stroke-width="2.5"/>`;
  s += `<path d="M34 706 H266" stroke="${mørk}" stroke-width="2"/>`;
  for (const y of [664, 730, 762]) {
    s += `<rect x="92" y="${y}" width="116" height="16" rx="8" fill="#1D3B37" stroke="#17211F" stroke-width="1.5"/>`;
  }
  // vand og væge kan ses gennem slidserne
  for (const y of [730, 762]) {
    s += `<rect x="96" y="${y + 4}" width="108" height="9" rx="4.5" fill="#8CC8E6" opacity=".9"/>`;
  }
  s += `<rect x="96" y="${664 + 6}" width="108" height="5" rx="2.5" fill="#E8ECEA" opacity=".7"/>`;
  return s;
}

function skala(x, side) {
  // side −1: tal til venstre (tørtermometer), +1: tal til højre (vådtermometer)
  let s = "";
  for (let t = T_MIN; t <= T_MAX; t++) {
    const y = yT(t);
    const lang = t % 10 === 0 ? 13 : t % 5 === 0 ? 9 : 5;
    const x0 = x + side * 8, x1 = x0 + side * lang;
    s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#17211F" stroke-width="${t % 10 === 0 ? 1.3 : 0.8}"/>`;
    if (t % 10 === 0) {
      const tx = x + side * 24;
      s += `<text x="${tx}" y="${y + 6}" text-anchor="${side < 0 ? "end" : "start"}" font-family="${SANS}" font-size="17" fill="#17211F">${String(t).replace("-", "−")}</text>`;
    }
  }
  return s;
}

function tabel() {
  const fs = 7.2;
  let s = `<g font-family="${MONO}" fill="#17211F">`;
  s += `<text x="${TAB_X + TAB_B / 2}" y="168" text-anchor="middle" font-family="${SANS}" font-size="7.5" font-weight="700">Relativ fugtighed, %</text>`;
  s += `<rect x="${TAB_X}" y="174" width="${TAB_B}" height="${RÆK_Y0 - 174 - RÆK_H / 2 + 1}" fill="none" stroke="#17211F" stroke-width=".8"/>`;
  s += `<line x1="${TAB_X + KOL0}" y1="174" x2="${TAB_X + KOL0}" y2="${rækkeY(0) + RÆK_H / 2}" stroke="#17211F" stroke-width=".8"/>`;
  s += `<text x="${TAB_X + KOL0 + 3 * KOL}" y="182" text-anchor="middle" font-family="${SANS}" font-size="5.6">Tør − våd, °C</text>`;
  s += `<line x1="${TAB_X + KOL0}" y1="185" x2="${TAB_X + TAB_B}" y2="185" stroke="#17211F" stroke-width=".6"/>`;
  s += `<text x="${TAB_X + KOL0 / 2}" y="186" text-anchor="middle" font-family="${SANS}" font-size="5.6">Tør</text>`;
  s += `<text x="${TAB_X + KOL0 / 2}" y="194" text-anchor="middle" font-family="${SANS}" font-size="5.6">°C</text>`;
  for (let d = 1; d <= 6; d++) {
    s += `<text x="${kolX(d) + KOL / 2}" y="195" text-anchor="middle" font-size="8" font-weight="600">${d}</text>`;
  }
  // svage bånd for hver anden gruppe på 5 rækker, så øjet kan følge rækken
  for (let g = 0; g < 36; g += 10) {
    const top = rækkeY(35 - g) - RÆK_H / 2;
    s += `<rect x="${TAB_X}" y="${top}" width="${TAB_B}" height="${RÆK_H * 5}" fill="#EEF5F2"/>`;
  }
  for (let t = 35; t >= 0; t--) {
    const y = rækkeY(t) + 2.6;
    s += `<text x="${TAB_X + KOL0 - 2}" y="${y}" text-anchor="end" font-size="${fs}" font-weight="600">${t}</text>`;
    for (let d = 1; d <= 6; d++) {
      s += `<text x="${kolX(d) + KOL / 2}" y="${y}" text-anchor="middle" font-size="${fs}">${tabelværdi(t, d)}</text>`;
    }
  }
  s += `<rect x="${TAB_X}" y="${RÆK_Y0 - 10}" width="${TAB_B}" height="${rækkeY(0) + RÆK_H / 2 - RÆK_Y0 + 10}" fill="none" stroke="#17211F" stroke-width=".8"/>`;
  s += `</g>`;
  return s;
}

function termometer(id, x, våd) {
  const søjle = våd ? "soejle-vaad" : "soejle-toer";
  let s = `
<rect x="${x - 6}" y="${Y_TOP - 30}" width="12" height="${Y_KUGLE - Y_TOP + 28}" rx="6" fill="url(#${id}-glas)" stroke="#17211F" stroke-width="1.3"/>
<rect x="${x - 9}" y="${Y_TOP - 34}" width="18" height="14" rx="3" fill="#F4F4F2" stroke="#17211F" stroke-width="1.3"/>
<rect id="${id}-${søjle}" x="${x - 1.6}" width="3.2" fill="#E0312B"/>
<circle cx="${x}" cy="${Y_KUGLE}" r="7" fill="#E0312B" stroke="#17211F" stroke-width="1.3"/>
<rect x="${x - 9}" y="${Y_KUGLE - 22}" width="18" height="10" rx="2" fill="#F4F4F2" stroke="#17211F" stroke-width="1.2"/>`;
  if (våd) {
    // stofstrømpe om kuglen
    s += `<rect x="${x - 9}" y="${Y_KUGLE - 10}" width="18" height="22" rx="7" fill="url(#${id}-stof)" stroke="#17211F" stroke-width="1.2"/>
<path d="M${x - 9} ${Y_KUGLE - 4} H${x + 9}" stroke="#7FA9B8" stroke-width="1"/>`;
  }
  return s;
}

// ───────────────────────── dynamiske dele ─────────────────────────

function dynamiskDel(id) {
  return `
<g pointer-events="none">
  <rect id="${id}-raekke" x="${TAB_X}" width="${TAB_B}" height="${RÆK_H}" fill="#0E86C8" fill-opacity=".22" stroke="#0E86C8" stroke-width=".7"/>
  <rect id="${id}-kolonne" y="${RÆK_Y0 - 10}" width="${KOL}" height="${rækkeY(0) + RÆK_H / 2 - RÆK_Y0 + 10}" fill="#0E86C8" fill-opacity=".22" stroke="#0E86C8" stroke-width=".7"/>
  <rect id="${id}-celle" width="${KOL}" height="${RÆK_H}" fill="#0E86C8" stroke="#17211F" stroke-width=".8"/>
  <text id="${id}-celle-tekst" text-anchor="middle" font-family="${MONO}" font-size="7.6" font-weight="700" fill="#FFFFFF"></text>
</g>`;
}
