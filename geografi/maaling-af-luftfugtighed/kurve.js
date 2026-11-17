// Mætningskurven (dugpunktskurven) som SVG — samme kurve og udtryk som i
// Dugpunkt.html, men med et fint gitter, så eleven kan aflæse den.
//
//   const k = lavKurve(beholder);
//   k.hjælp({ t: 22, mætning: 18.7 });              // lodret op, vandret ind
//   k.hjælp({ absolut: 10.9, dugpunkt: 13.0 });     // vandret ud, lodret ned
//   k.punkt(22, 10.9);                               // luftens punkt
//   k.nulstil();

import { kapacitet } from "./model.js";

const NS = "http://www.w3.org/2000/svg";
const W = 760, H = 440;
const V = 58, Hø = 18, O = 22, N = 50;        // margener: venstre, højre, top, bund
const T_MAKS = 35, G_MAKS = 40;
const x = (t) => V + (t / T_MAKS) * (W - V - Hø);
const y = (g) => H - N - (g / G_MAKS) * (H - N - O);
const tFraX = (px) => ((px - V) / (W - V - Hø)) * T_MAKS;
const gFraY = (py) => ((H - N - py) / (H - N - O)) * G_MAKS;

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "Archivo, system-ui, sans-serif";

export function lavKurve(beholder) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "kurve");
  svg.setAttribute("role", "img");
  svg.innerHTML = `<title>Mætningskurve: den største mængde vanddamp luften kan rumme (g/m³) som funktion af temperaturen (°C).</title>
    ${gitter()}${kurvePath()}${akser()}
    <g class="hjaelp"></g>
    <g class="sigte" style="display:none">
      <line class="sx" stroke="#7A4FD6" stroke-width="1.2" stroke-dasharray="3 3"/>
      <line class="sy" stroke="#7A4FD6" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle r="4" fill="none" stroke="#7A4FD6" stroke-width="1.6"/>
    </g>
    <g class="punkt"></g>
    <rect class="flade" x="${V}" y="${O}" width="${W - V - Hø}" height="${H - N - O}" fill="transparent"/>`;
  beholder.appendChild(svg);

  const gHjælp = svg.querySelector(".hjaelp");
  const gPunkt = svg.querySelector(".punkt");
  const sigte = svg.querySelector(".sigte");
  const sx = sigte.querySelector(".sx"), sy = sigte.querySelector(".sy");
  const ring = sigte.querySelector("circle");

  // Sigtekorn: stiplede linjer fra markøren ind til akserne — en lineal, ikke et facit.
  const flade = svg.querySelector(".flade");
  function sigt(e) {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    if (q.x < V || q.x > W - Hø || q.y < O || q.y > H - N) { sigte.style.display = "none"; return; }
    sigte.style.display = "";
    sx.setAttribute("x1", V); sx.setAttribute("x2", q.x); sx.setAttribute("y1", q.y); sx.setAttribute("y2", q.y);
    sy.setAttribute("x1", q.x); sy.setAttribute("x2", q.x); sy.setAttribute("y1", q.y); sy.setAttribute("y2", H - N);
    ring.setAttribute("cx", q.x); ring.setAttribute("cy", q.y);
  }
  flade.addEventListener("pointermove", sigt);
  flade.addEventListener("pointerdown", sigt);
  flade.addEventListener("pointerleave", () => (sigte.style.display = "none"));

  function hjælp({ t, mætning, absolut, dugpunkt, farve = "#E8336D" }) {
    let s = "";
    const pil = (x1, y1, x2, y2) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${farve}" stroke-width="2.4" stroke-dasharray="7 5" marker-end="url(#pil-${farve.slice(1)})"/>`;
    s += `<defs><marker id="pil-${farve.slice(1)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${farve}"/></marker></defs>`;
    if (t != null && mætning != null) {
      s += pil(x(t), y(0), x(t), y(mætning) + 4);
      s += pil(x(t), y(mætning), x(0) + 4, y(mætning));
      s += `<circle cx="${x(t)}" cy="${y(mætning)}" r="5" fill="${farve}" stroke="#17211F" stroke-width="1.4"/>`;
    }
    if (absolut != null && dugpunkt != null) {
      s += pil(x(0), y(absolut), x(dugpunkt) - 4, y(absolut));
      s += pil(x(dugpunkt), y(absolut), x(dugpunkt), y(0) - 4);
      s += `<circle cx="${x(dugpunkt)}" cy="${y(absolut)}" r="5" fill="${farve}" stroke="#17211F" stroke-width="1.4"/>`;
    }
    gHjælp.insertAdjacentHTML("beforeend", `<g>${s}</g>`);
  }

  function punkt(t, g) {
    gPunkt.innerHTML = `<circle cx="${x(t)}" cy="${y(g)}" r="8" fill="#17211F" stroke="#fff" stroke-width="2.5"/>
      <text x="${x(t) + 12}" y="${y(g) + 18}" font-family="${SANS}" font-size="13" font-weight="700" fill="#17211F">luften</text>`;
  }

  function nulstil() { gHjælp.innerHTML = ""; gPunkt.innerHTML = ""; }

  return { svg, hjælp, punkt, nulstil, tFraX, gFraY };
}

function gitter() {
  let s = "";
  for (let t = 1; t <= T_MAKS; t++) {
    const stor = t % 5 === 0;
    s += `<line x1="${x(t)}" y1="${y(0)}" x2="${x(t)}" y2="${y(G_MAKS)}" stroke="${stor ? "rgba(23,33,31,.22)" : "rgba(23,33,31,.08)"}" stroke-width="1"/>`;
  }
  for (let g = 1; g <= G_MAKS; g++) {
    const stor = g % 5 === 0;
    s += `<line x1="${x(0)}" y1="${y(g)}" x2="${x(T_MAKS)}" y2="${y(g)}" stroke="${stor ? "rgba(23,33,31,.22)" : "rgba(23,33,31,.08)"}" stroke-width="1"/>`;
  }
  return s;
}

function kurvePath() {
  let d = "";
  for (let t = 0; t <= T_MAKS + 0.01; t += 0.25) {
    d += `${d ? "L" : "M"}${x(t).toFixed(1)} ${y(kapacitet(t)).toFixed(1)}`;
  }
  return `<path d="${d} L${x(T_MAKS)} ${y(0)} L${x(0)} ${y(0)}Z" fill="rgba(14,134,200,.08)"/>
    <path d="${d}" fill="none" stroke="#0E86C8" stroke-width="3.2" stroke-linejoin="round"/>
    <text x="${x(24.5)}" y="${y(kapacitet(24.5)) - 12}" text-anchor="end" font-family="${MONO}" font-size="12" font-weight="700" fill="#0E86C8">MÆTNINGSKURVE</text>`;
}

function akser() {
  let s = `<path d="M${x(0)} ${y(G_MAKS)} V${y(0)} H${x(T_MAKS)}" fill="none" stroke="#17211F" stroke-width="2.5" stroke-linejoin="round"/>`;
  for (let t = 0; t <= T_MAKS; t += 5) {
    s += `<line x1="${x(t)}" y1="${y(0)}" x2="${x(t)}" y2="${y(0) + 6}" stroke="#17211F" stroke-width="2"/>`;
    s += `<text x="${x(t)}" y="${y(0) + 21}" text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="600" fill="#17211F">${t}</text>`;
  }
  for (let g = 0; g <= G_MAKS; g += 5) {
    s += `<line x1="${x(0) - 6}" y1="${y(g)}" x2="${x(0)}" y2="${y(g)}" stroke="#17211F" stroke-width="2"/>`;
    s += `<text x="${x(0) - 10}" y="${y(g) + 4.5}" text-anchor="end" font-family="${MONO}" font-size="13" font-weight="600" fill="#17211F">${g}</text>`;
  }
  s += `<text x="${x(T_MAKS)}" y="${H - 8}" text-anchor="end" font-family="${SANS}" font-size="14" font-weight="700" fill="#566B68">Temperatur (°C)</text>`;
  s += `<text x="${x(0) + 8}" y="${O + 14}" font-family="${SANS}" font-size="14" font-weight="700" fill="#566B68">Vanddamp (g/m³)</text>`;
  return s;
}
