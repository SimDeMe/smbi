// side.js — trinene i målingen: aflæs psykrometeret, find forskellen, aflæs RF
// i tabellen, og brug mætningskurven til vanddamp (g/m³) og dugpunkt.

import { lavPsykrometer } from "./psykrometer.js";
import { lavKurve } from "./kurve.js";
import { tabelværdi, kapacitet, dugpunktFraKurve } from "./model.js";
import { fanfare, konfetti } from "./fejring.js";
import { spil } from "/byg-motor/lyd.js";        // samme «pling» som i Byg cellen

const $ = (id) => document.getElementById(id);
const komma = (v, d = 1) => v.toFixed(d).replace(".", ",").replace("-", "−");
const tal = (s) => {
  const v = parseFloat(String(s).trim().replace(",", ".").replace("−", "-"));
  return Number.isFinite(v) ? v : null;
};
const roligt = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Måling ──────────────────────────────────────────────────────────
const STEDER = {
  inde: { navn: "Måling i klasselokalet", tør: [19, 25], forskel: [3, 6] },
  ude: { navn: "Måling udenfor i skyggen", tør: [6, 17], forskel: [1, 4] },
};
const tilfældig = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));

// forrige: den måling, eleven lige har haft — den nye skal altid være en anden
function nyMåling(stedNøgle, forrige = null) {
  const sted = STEDER[stedNøgle];
  for (let i = 0; i < 200; i++) {
    const tør = tilfældig(sted.tør), d = tilfældig(sted.forskel);
    if (forrige && forrige.tør === tør && forrige.d === d) continue;
    const rf = tabelværdi(tør, d);
    const mætning = kapacitet(tør);
    const absolut = (rf / 100) * mætning;
    const dug = dugpunktFraKurve(absolut);
    if (dug >= 1.5) return { sted: stedNøgle, tør, våd: tør - d, d, rf, mætning, absolut, dug };
  }
  return nyMåling("inde", forrige);
}

// ── Figurerne ──────────────────────────────────────────────────────
const visning = $("visning");
const psy = lavPsykrometer(visning, { fremhæv: false, visRF: false });
const VB = { x: 28, y: 96, b: 244, h: 560 };     // udsnit: pladen, kuglerne og vægen
psy.svg.setAttribute("viewBox", `${VB.x} ${VB.y} ${VB.b} ${VB.h}`);
psy.svg.style.height = "auto";

const kurveFelt = $("kurve-felt");
const kurve = lavKurve(kurveFelt);

// zoom i psykrometeret: 100 % = figuren fylder spaltens bredde
const ZOOM = [1, 1.5, 2, 2.5, 3];
let zoomTrin = 0;
function skala() { return psy.svg.getBoundingClientRect().width / VB.b; }
function midte() {
  const s = skala();
  return { x: VB.x + (visning.scrollLeft + visning.clientWidth / 2) / s, y: VB.y + (visning.scrollTop + visning.clientHeight / 2) / s };
}
function sætZoom(nyt, centrum) {
  if (!visning.clientWidth) return;                // skjult (trin 4–5 på smal skærm)
  centrum ??= midte();
  zoomTrin = Math.max(0, Math.min(ZOOM.length - 1, nyt));
  psy.svg.style.width = `${Math.round(visning.clientWidth * ZOOM[zoomTrin]) - 2}px`;
  $("zoom-tal").textContent = `${Math.round(ZOOM[zoomTrin] * 100)} %`;
  $("zoom-ud").disabled = zoomTrin === 0;
  $("zoom-ind").disabled = zoomTrin === ZOOM.length - 1;
  rulTil(centrum, false);
}
function rulTil({ x, y }, blødt = true) {
  const s = skala();
  visning.scrollTo({
    left: (x - VB.x) * s - visning.clientWidth / 2,
    top: (y - VB.y) * s - visning.clientHeight / 2,
    behavior: blødt && !roligt ? "smooth" : "auto",
  });
}
$("zoom-ind").onclick = () => sætZoom(zoomTrin + 1);
$("zoom-ud").onclick = () => sætZoom(zoomTrin - 1);
addEventListener("resize", () => sætZoom(zoomTrin));

// ── Trin ───────────────────────────────────────────────────────────
let m, nu, forsøg, resultater;

const TRIN = [
  {
    titel: "Aflæs termometrene",
    tekst: () => `<p>Aflæs, hvor den røde væske står i tørtermometeret (til venstre) og vådtermometeret (til højre).
      Hver lille streg er 1 °C. Zoom ind, hvis stregerne er svære at se.</p>`,
    felter: [{ id: "tør", navn: "Tør", enhed: "°C" }, { id: "våd", navn: "Våd", enhed: "°C" }],
    tjek(v) {
      const fejlTør = Math.abs(v.tør - m.tør) > 0.5, fejlVåd = Math.abs(v.våd - m.våd) > 0.5;
      if (!fejlTør && !fejlVåd) return { ok: true };
      if (v.våd > v.tør) return { forkert: ["tør", "våd"], besked: "Vådtermometeret kan ikke vise mere end tørtermometeret. Har du byttet om på dem?" };
      const hvem = fejlTør && fejlVåd ? "Begge aflæsninger" : fejlTør ? "Tørtermometeret" : "Vådtermometeret";
      return { forkert: [fejlTør && "tør", fejlVåd && "våd"].filter(Boolean),
        besked: `${hvem} passer ikke helt. Se på toppen af den røde søjle, og tæl stregerne fra nærmeste tal.` };
    },
    resultat: () => `${m.tør} °C / ${m.våd} °C`,
    efter() { psy.markér(null); },
  },
  {
    titel: "Find forskellen",
    tekst: () => `<p>Træk vådtemperaturen fra tørtemperaturen.</p>
      <span class="formel">forskel = ${m.tør} °C − ${m.våd} °C</span>`,
    felter: [{ id: "d", navn: "Forskel", enhed: "°C" }],
    tjek(v) {
      if (Math.abs(v.d - m.d) < 0.05) return { ok: true };
      if (Math.abs(v.d + m.d) < 0.05) return { forkert: ["d"], besked: "Fortegnet er forkert: tag tør minus våd." };
      return { forkert: ["d"], besked: "Regn efter: tør minus våd." };
    },
    resultat: () => `${m.d} °C`,
    efter() {
      psy.markér(m.tør, m.d);
      // hele tabellens bredde i billedet, så rækkens temperatur kan ses ved siden af feltet
      const mål = { x: 150, y: psy.områder.celle(m.tør, m.d).y };
      sætZoom(Math.max(zoomTrin, 1), mål);
      rulTil(mål);
    },
  },
  {
    titel: "Aflæs den relative luftfugtighed",
    tekst: () => `<p>Rækken for tørtemperaturen (${m.tør} °C) og kolonnen for forskellen (${m.d} °C) er nu
      markeret i tabellen mellem termometrene. Hvor de krydser, står den relative luftfugtighed i procent.</p>`,
    felter: [{ id: "rf", navn: "Relativ luftfugtighed", enhed: "%" }],
    tjek(v) {
      if (Math.abs(v.rf - m.rf) <= 1) return { ok: true };
      const iRække = [1, 2, 3, 4, 5, 6].some((k) => k !== m.d && tabelværdi(m.tør, k) === Math.round(v.rf));
      const iKolonne = [-2, -1, 1, 2].some((r) => tabelværdi(m.tør + r, m.d) === Math.round(v.rf));
      const besked = iRække ? "Det tal står i den rigtige række, men i en anden kolonne. Brug kolonnen for forskellen."
        : iKolonne ? "Det tal står i den rigtige kolonne, men i en anden række. Brug rækken for tørtemperaturen."
        : "Find feltet, hvor den markerede række og kolonne krydser hinanden.";
      return { forkert: ["rf"], besked };
    },
    resultat: () => `${m.rf} %`,
    efter() {
      psy.markér(m.tør, m.d, { visVærdi: true });
      kurveFelt.classList.remove("hvil");
    },
  },
  {
    titel: "Find vanddampen i g/m³",
    tekst: () => `<ol>
        <li>Find tørtemperaturen (${m.tør} °C) på x-aksen på mætningskurven. Gå lodret op til kurven og vandret ind til
          y-aksen. Det er <b>mætningsmængden</b>: den største mængde vanddamp, luften kan rumme ved ${m.tør} °C.</li>
        <li>Luften indeholder kun ${m.rf} % af det. Regn den <b>absolutte luftfugtighed</b> ud:</li>
      </ol>
      <span class="formel">absolut luftfugtighed = ${m.rf}/100 · mætningsmængde</span>`,
    felter: [{ id: "mæt", navn: "Mætningsmængde", enhed: "g/m³" }, { id: "abs", navn: "Absolut luftfugtighed", enhed: "g/m³" }],
    hjælp: () => kurve.hjælp({ t: m.tør, mætning: m.mætning }),
    tjek(v) {
      const mætOk = Math.abs(v.mæt - m.mætning) <= Math.max(1, 0.06 * m.mætning);
      const absOk = Math.abs(v.abs - m.absolut) <= Math.max(0.8, 0.08 * m.absolut)
        || (mætOk && Math.abs(v.abs - (m.rf / 100) * v.mæt) <= 0.3);
      if (mætOk && absOk) return { ok: true };
      if (!mætOk) return { forkert: ["mæt"], besked: `Mætningsmængden passer ikke med kurven ved ${m.tør} °C. Gå lodret op fra ${m.tør} °C til kurven, og vandret ind til y-aksen.` };
      if (Math.abs(v.abs - m.rf * v.mæt) < 1) return { forkert: ["abs"], besked: `Husk at dele med 100: ${m.rf} % er ${komma(m.rf / 100, 2)}.` };
      return { forkert: ["abs"], besked: `Regn efter: ${m.rf}/100 · ${komma(v.mæt)} g/m³.` };
    },
    resultat: () => `${komma(m.absolut)} g/m³`,
    efter() {
      kurve.nulstil();
      kurve.hjælp({ t: m.tør, mætning: m.mætning });
      kurve.punkt(m.tør, m.absolut);
    },
  },
  {
    titel: "Find dugpunktet",
    tekst: () => `<p>Køler man luften ned, falder mætningsmængden, men vanddampen i luften er den samme
      (${komma(m.absolut)} g/m³). Gå fra ${komma(m.absolut)} g/m³ på y-aksen vandret ud til mætningskurven, og
      lodret ned til x-aksen. Den temperatur er <b>dugpunktet</b>: her er luften mættet.</p>`,
    felter: [{ id: "dug", navn: "Dugpunkt", enhed: "°C" }],
    hjælp: () => kurve.hjælp({ absolut: m.absolut, dugpunkt: m.dug, farve: "#7A4FD6" }),
    tjek(v) {
      if (Math.abs(v.dug - m.dug) <= 1.5) return { ok: true };
      if (Math.abs(v.dug - m.tør) <= 0.5) return { forkert: ["dug"], besked: "Det er tørtemperaturen. Dugpunktet er lavere: start på y-aksen ved vanddampen, og gå vandret ud til kurven." };
      if (v.dug > m.tør) return { forkert: ["dug"], besked: "Dugpunktet er altid lavere end lufttemperaturen, når luften ikke er mættet." };
      return { forkert: ["dug"], besked: "Gå vandret fra vanddampen på y-aksen, til du rammer kurven, og lodret ned til x-aksen." };
    },
    resultat: () => `${komma(m.dug, 0)} °C`,
    efter() {
      kurve.hjælp({ absolut: m.absolut, dugpunkt: m.dug, farve: "#7A4FD6" });
      fanfare();
      konfetti();
    },
  },
];

const trinBoks = $("trin");

function start(stedNøgle) {
  m = nyMåling(stedNøgle, m);
  nu = 0; forsøg = 0; resultater = [];
  $("sted").innerHTML = `${STEDER[m.sted].navn}`;
  psy.opdater({ tør: m.tør, våd: m.våd });
  psy.markér(null);
  kurve.nulstil();
  kurveFelt.classList.add("hvil");
  tegnTrin();
  sætZoom(0, { x: 150, y: 330 });
  // begynd ved termometrenes top
  requestAnimationFrame(() => rulTil({ x: 150, y: (psy.områder.tør(m.tør).y + psy.områder.våd(m.våd).y) / 2 }, false));
}

function tegnTrin() {
  document.body.dataset.fase = nu >= 3 ? "kurve" : "psykrometer";
  let html = "";
  TRIN.forEach((t, i) => {
    if (i < nu) {
      html += `<div class="kort faerdig"><h2><span class="nr" aria-hidden="true">✓</span>${t.titel}<span class="resultat">${t.resultat()}</span></h2></div>`;
    } else if (i === nu) {
      html += `<form class="kort aktiv" id="aktiv" novalidate>
        <h2><span class="nr">${i + 1}</span>${t.titel}</h2>
        ${t.tekst()}
        <div class="felter">
          ${t.felter.map((f) => `<label class="felt" id="felt-${f.id}">${f.navn}
            <span class="inp"><input id="inp-${f.id}" inputmode="decimal" autocomplete="off" spellcheck="false"><span class="enhed">${f.enhed}</span></span></label>`).join("")}
          <button class="btn primaer" type="submit">Tjek</button>
        </div>
        <p class="svar" id="svar" role="status"></p>
        ${t.hjælp ? `<p><button type="button" class="btn-mini" id="btn-hjaelp" hidden>Vis vejen på kurven</button></p>` : ""}
      </form>`;
    } else {
      html += `<div class="kort kommer"><h2><span class="nr">${i + 1}</span>${t.titel}</h2></div>`;
    }
  });
  if (nu >= TRIN.length) {
    html += `<div class="slut" tabindex="-1" id="slut">
      <h2>Flot — målingen er færdig!</h2>
      <dl>
        <dt>Tør / våd</dt><dd>${m.tør} / ${m.våd} °C</dd>
        <dt>Relativ luftfugtighed</dt><dd>${m.rf} %</dd>
        <dt>Mætningsmængde</dt><dd>${komma(m.mætning)} g/m³</dd>
        <dt>Absolut luftfugtighed</dt><dd>${komma(m.absolut)} g/m³</dd>
        <dt>Dugpunkt</dt><dd>${komma(m.dug, 0)} °C</dd>
      </dl>
      <p>Køles luften ned under ${komma(m.dug, 0)} °C — fx mod en kold rude — kondenserer vanddampen.</p>
      <p style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn primaer" id="btn-igen">Ny måling ${m.sted === "inde" ? "udenfor" : "i klasselokalet"}</button>
      </p></div>`;
  }
  trinBoks.innerHTML = html;

  const form = $("aktiv");
  if (form) {
    form.addEventListener("submit", (e) => { e.preventDefault(); tjek(); });
    $("btn-hjaelp")?.addEventListener("click", () => { TRIN[nu].hjælp(); $("btn-hjaelp").hidden = true; });
    const første = form.querySelector("input");
    if (nu > 0) første.focus({ preventScroll: true });
    visIBoks(form);
  } else {
    $("btn-igen").onclick = () => start(m.sted === "inde" ? "ude" : "inde");
    $("slut").focus({ preventScroll: true });
    visIBoks($("slut"));
  }
}

// Rul kun inde i trinspalten — ikke hele siden.
function visIBoks(el) {
  if (trinBoks.scrollHeight <= trinBoks.clientHeight + 1) return;
  const top = el.offsetTop - trinBoks.offsetTop;
  if (top < trinBoks.scrollTop || top + el.offsetHeight > trinBoks.scrollTop + trinBoks.clientHeight) {
    trinBoks.scrollTo({ top: Math.max(0, top - 8), behavior: roligt ? "auto" : "smooth" });
  }
}

function tjek() {
  const t = TRIN[nu];
  const v = {};
  let mangler = [];
  for (const f of t.felter) {
    v[f.id] = tal($(`inp-${f.id}`).value);
    $(`felt-${f.id}`).classList.remove("forkert");
    if (v[f.id] === null) mangler.push(f);
  }
  const svar = $("svar");
  if (mangler.length) {
    mangler.forEach((f) => $(`felt-${f.id}`).classList.add("forkert"));
    svar.className = "svar nej";
    svar.textContent = `Skriv et tal i feltet «${mangler[0].navn}».`;
    $(`inp-${mangler[0].id}`).focus();
    return;
  }
  const r = t.tjek(v);
  if (r.ok) {
    if (nu < TRIN.length - 1) spil("rigtigt");   // sidste trin får fanfaren i stedet
    t.efter?.();
    nu++; forsøg = 0;
    $("sr-status").textContent = `Rigtigt. ${t.titel}: ${t.resultat()}.`;
    tegnTrin();
    return;
  }
  forsøg++;
  r.forkert.forEach((id) => $(`felt-${id}`).classList.add("forkert"));
  svar.className = "svar nej";
  svar.textContent = r.besked;
  if (forsøg >= 2 && t.hjælp) $("btn-hjaelp").hidden = false;
  $(`inp-${r.forkert[0]}`).select();
}

// ── Knapper i panelets hoved ───────────────────────────────────────
$("btn-ny").onclick = () => start(Math.random() < 0.5 ? "inde" : "ude");

const begreber = $("begreber");
$("btn-begreber").onclick = () => begreber.showModal();
begreber.addEventListener("close", () => {
  if (nu === 0) $("aktiv")?.querySelector("input")?.focus({ preventScroll: true });
});

const btnFokus = $("btn-fokus");
btnFokus.onclick = () => {
  const til = document.body.dataset.fokus !== "1";
  document.body.dataset.fokus = til ? "1" : "0";
  btnFokus.setAttribute("aria-pressed", String(til));
  målHøjder();
  sætZoom(zoomTrin);
};
if (/fokus=1|projektor=1/.test(location.search)) btnFokus.click();

// panelets højde: skærmen minus topbjælke og overskrift (se stil.css)
function målHøjder() {
  const top = $("site-top"), titel = document.querySelector(".titel");
  document.documentElement.style.setProperty("--top", `${top.offsetHeight}px`);
  document.documentElement.style.setProperty("--titel", `${titel.offsetHeight}px`);
}
addEventListener("resize", målHøjder);

// skjul sidens krom i en iframe
try { if (window.top !== window.self) btnFokus.click(); } catch { /* */ }

målHøjder();
start("inde");
document.fonts?.ready.then(() => { målHøjder(); sætZoom(zoomTrin); });
begreber.showModal();
