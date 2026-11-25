/* ═══════════════════════════════════════════════════════════════
   celledeling-visning.js — betjening og aflæsning til celledeling.js

   Binder motoren til siden: faseslider, forrige/næste, afspil/pause,
   hastighed, etiketter til/fra, SVG-eksport, fokustilstand, tastatur og
   tællingen (kromosomer, kromatider pr. kromosom, DNA-mængde).
   Elementerne findes via data-rolle="…" inde i roden.
   ═══════════════════════════════════════════════════════════════ */
import {opretAfspiller, hentFil} from './celledeling.js';

const tal = v => {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : String(r).replace('.', ',');
};

/* Aflæsning ud fra en tælling (se celledeling.js → taelling). */
export function aflaes(t){
  const celler = t.celler;
  const krom = celler.map(c => c.kromosomer);
  const kromatider = celler.reduce((s, c) => s + c.kromatider, 0);
  const kromosomer = krom.reduce((s, v) => s + v, 0);
  const ens = krom.every(v => v === krom[0]);
  const flere = celler.length > 1;
  const kernetal = t.kerner.map(k => k.kromosomer);
  return {
    kromosomerTal: flere && ens ? krom[0] : kromosomer,
    kromosomerHvor: flere ? (ens ? 'i hver celle' : krom.join(' + '))
      : (kernetal.length > 1 && kernetal.every(v => v === kernetal[0]) ? `i cellen · ${kernetal[0]} i hver kerne` : 'i cellen'),
    kromatiderPr: kromosomer ? kromatider / kromosomer : 0,
    dna: celler[0].dna,
    dnaHvor: flere ? 'i hver celle' : 'i cellen',
    flere
  };
}

export function startVisning(motor, rod, {filnavn = 'celledeling'} = {}){
  const $ = r => rod.querySelector(`[data-rolle="${r}"]`);
  const {model, N} = motor;
  const svg = $('figur'), scene = $('scene');
  const slider = $('slider'), btnForrige = $('forrige'), btnNaeste = $('naeste'), btnAfspil = $('afspil');
  const hastighed = $('hastighed'), btnEtiketter = $('etiketter');
  const live = $('live'), beskrivelse = $('beskrivelse');
  let visEtiketter = true;

  slider.min = 0; slider.max = N - 1; slider.step = 1;

  /* Tabellen over hele forløbet: værdier beregnes fra fasernes tilstande */
  const tabel = $('forloeb');
  const aflaesninger = model.faser.map((_, i) => aflaes(motor.taelling(i)));
  if (tabel){
    const hoved = model.faser.map((f, i) =>
      `<th scope="col"><button type="button" data-fase="${i}" aria-label="Gå til ${f.navn}" title="${f.navn}">${f.kort}</button></th>`).join('');
    const raekke = (navn, fn) => `<tr><th scope="row">${navn}</th>${aflaesninger.map((a, i) => `<td data-kol="${i}">${fn(a)}</td>`).join('')}</tr>`;
    tabel.innerHTML = `<thead><tr><th scope="col"><span class="sr">Fase</span></th>${hoved}</tr></thead><tbody>`
      + raekke('Kromosomer <small>pr. celle</small>', a => a.kromosomerTal)
      + raekke('Kromatider <small>pr. kromosom</small>', a => tal(a.kromatiderPr))
      + raekke('DNA <small>pr. celle</small>', a => tal(a.dna) + 'c')
      + `</tbody>`;
    tabel.addEventListener('click', e => {
      const b = e.target.closest('button[data-fase]');
      if (b){ afspiller.pause(); opdaterAfspilKnap(); afspiller.gaaTil(+b.dataset.fase); }
    });
  }

  // større etiketter, når figuren vises lille (telefon)
  let etiketStr = 13.5;
  const maalStr = () => {
    const b = svg.getBoundingClientRect().width || model.bredde;
    etiketStr = b < 520 ? Math.min(17, 13.5 * 520 / b * 0.86) : 13.5;
  };
  maalStr();
  new ResizeObserver(() => { const f = etiketStr; maalStr(); if (f !== etiketStr) afspiller.tegnNu(); }).observe(svg);

  const vis = p => {
    scene.innerHTML = motor.scene(p, visEtiketter, etiketStr);
    const a = aflaes(motor.taelling(p));
    $('v-krom').textContent = a.kromosomerTal;
    $('h-krom').textContent = a.kromosomerHvor;
    $('v-kromatid').textContent = tal(a.kromatiderPr);
    $('v-dna').textContent = tal(a.dna) + 'c';
    $('h-dna').textContent = a.dnaHvor;
  };

  let visteFase = -1;
  const visFasetekst = i => {
    if (i === visteFase) return;
    visteFase = i;
    const f = model.faser[i];
    $('fase-nr').textContent = `${i + 1} / ${N}`;
    $('fase-navn').textContent = f.navn;
    const kortNavn = $('fase-kort-navn');
    if (kortNavn) kortNavn.textContent = `${i + 1}/${N} · ${f.navn}`;
    $('fase-tekst').innerHTML = f.tekst;
    slider.value = i;
    slider.setAttribute('aria-valuetext', `${i + 1} af ${N}: ${f.navn}`);
    btnForrige.disabled = i === 0;
    btnNaeste.disabled = i === N - 1;
    beskrivelse.textContent = `${f.navn}. ${f.tekst.replace(/<[^>]+>/g, '')}`;
    if (tabel) tabel.querySelectorAll('[data-kol], [data-fase]').forEach(c => {
      const kol = +(c.dataset.kol ?? c.dataset.fase);
      c.classList.toggle('nu', kol === i);
      if (c.dataset.fase != null) c.setAttribute('aria-current', kol === i ? 'step' : 'false');
    });
  };

  const meld = i => {
    const a = aflaesninger[i];
    live.textContent = `Fase ${i + 1} af ${N}: ${model.faser[i].navn}. `
      + `Kromosomer: ${a.kromosomerTal} ${a.kromosomerHvor}. Kromatider pr. kromosom: ${tal(a.kromatiderPr)}. DNA: ${tal(a.dna)}c ${a.dnaHvor}.`;
  };

  const afspiller = opretAfspiller({
    antal: N,
    tegn: p => { vis(p); visFasetekst(Math.round(afspiller?.maal ?? p)); },
    faerdig: (i, slut) => { visFasetekst(i); meld(i); if (slut) opdaterAfspilKnap(); }
  });

  const opdaterAfspilKnap = () => {
    const s = afspiller.spiller;
    btnAfspil.setAttribute('aria-pressed', s ? 'true' : 'false');
    btnAfspil.setAttribute('aria-label', s ? 'Pause' : 'Afspil faserne');
    btnAfspil.querySelector('.ikon').textContent = s ? '❚❚' : '▶';
    btnAfspil.querySelector('.tekst').textContent = s ? 'Pause' : 'Afspil';
  };
  const gaa = i => { afspiller.pause(); opdaterAfspilKnap(); afspiller.gaaTil(i); visFasetekst(Math.max(0, Math.min(N - 1, i))); };

  slider.addEventListener('input', () => gaa(+slider.value));
  btnForrige.addEventListener('click', () => gaa(afspiller.maal - 1));
  btnNaeste.addEventListener('click', () => gaa(afspiller.maal + 1));
  btnAfspil.addEventListener('click', () => {
    if (afspiller.spiller) afspiller.pause(); else afspiller.afspil();
    opdaterAfspilKnap();
  });
  hastighed.addEventListener('change', () => afspiller.saetHastighed(+hastighed.value));

  btnEtiketter.addEventListener('click', () => {
    visEtiketter = !visEtiketter;
    btnEtiketter.setAttribute('aria-pressed', visEtiketter ? 'true' : 'false');
    btnEtiketter.querySelector('.tekst').textContent = visEtiketter ? 'Etiketter til' : 'Etiketter fra';
    afspiller.tegnNu();
  });

  const tekstTilArk = i => {
    const a = aflaesninger[i];
    return `Kromosomer: ${a.kromosomerTal} ${a.kromosomerHvor} · Kromatider pr. kromosom: ${tal(a.kromatiderPr)} · DNA: ${tal(a.dna)}c ${a.dnaHvor}`;
  };
  $('eksport-fase')?.addEventListener('click', () => {
    const i = Math.round(afspiller.maal);
    hentFil(`${filnavn}-${String(i + 1).padStart(2, '0')}-${model.faser[i].id}.svg`, motor.eksporterFase(i, visEtiketter));
  });
  $('eksport-alle')?.addEventListener('click', () => {
    hentFil(`${filnavn}-alle-faser.svg`, motor.eksporterAlle(visEtiketter, tekstTilArk));
  });

  const btnFokus = $('fokus');
  btnFokus?.addEventListener('click', () => {
    const til = document.body.dataset.fokus !== '1';
    document.body.dataset.fokus = til ? '1' : '0';
    btnFokus.setAttribute('aria-pressed', til ? 'true' : 'false');
  });

  /* Tastatur: pile og Home/End skifter fase, mellemrum afspiller,
     E slår etiketter til/fra. Ikke når fokus står i et felt, der selv
     bruger tasterne. */
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const m = e.target;
    const egenTast = m.matches?.('input, select, textarea, [contenteditable]');
    if (egenTast) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown'){ e.preventDefault(); gaa(afspiller.maal + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); gaa(afspiller.maal - 1); }
    else if (e.key === 'Home'){ e.preventDefault(); gaa(0); }
    else if (e.key === 'End'){ e.preventDefault(); gaa(N - 1); }
    else if ((e.key === ' ' || e.key === 'k') && !m.matches?.('button, a, summary')){ e.preventDefault(); btnAfspil.click(); }
    else if (e.key === 'e' || e.key === 'E'){ btnEtiketter.click(); }
  });

  // start: læs evt. fase fra adressen (#fase=6)
  const start = Math.max(0, Math.min(N - 1, (+(location.hash.match(/fase=(\d+)/)?.[1] ?? 1)) - 1));
  afspiller.saet(start); visFasetekst(start); meld(start);
  return {afspiller, motor, gaa};
}
