// Lydfeedback: deltageren tænker højt, mens simulationen bruges, aflytter
// og afleverer aktivt. Se simulationsdesign.md, afsnit 4, og feedback/LYD.md.
//
// Knappen vises kun, når siden er åbnet med et afprøvningslink (?afproevning=KODE)
// og en modtager er sat op. Almindelig brug af simulationen mærker intet.
import { LYD_CONFIG } from './lyd-config.js';

const MAKS_MS = 15 * 60 * 1000;
const MAKS_LOG = 2000;
const TAVS_EFTER_MS = 4000;      // så længe må en ny optagelse være helt tavs, før der advares
const MIKROFON_LANGSOM_MS = 12000;
const INGEN_LYD = 'Browseren fik ingen lyd fra mikrofonen. Tjek at den rigtige mikrofon er valgt. På en Mac skal browseren også have lov under Systemindstillinger → Anonymitet og sikkerhed → Mikrofon. Hjælper det ikke, så genstart browseren eller prøv en anden.';
const FORMATER = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
const ENDELSER = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' };

const CSS = `
.lf-knap{font:700 13px Archivo,system-ui,sans-serif;background:#fff;color:#172b2b;border:1.5px solid #172b2b;border-radius:6px;padding:6px 10px;cursor:pointer;min-height:36px}
.lf-knap:hover{background:#172b2b;color:#fff9ee}
.lf-dialog{width:min(480px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;margin:auto;padding:0;background:#fff9ee;color:#172b2b;border:2px solid #172b2b;border-radius:12px;box-shadow:5px 5px 0 #172b2b;font:16px/1.45 'Source Serif 4',Georgia,serif}
.lf-dialog::backdrop{background:rgba(23,33,31,.45)}
.lf-indhold{padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.lf-dialog h2{font:800 19px/1.2 Archivo,system-ui,sans-serif;margin:0}
.lf-dialog p,.lf-dialog ul{margin:0}.lf-dialog ul{padding-left:20px}.lf-dialog li+li{margin-top:3px}
.lf-opgave{background:#fff;border:1.5px solid #17212b40;border-radius:8px;padding:9px 11px}
.lf-lille{font-size:14px;color:#516565}
.lf-dialog audio{width:100%}
.lf-handlinger{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:4px}
.lf-handlinger button,.lf-handlinger a,.lf-stop{font:700 14px Archivo,system-ui,sans-serif;min-height:40px;padding:7px 13px;background:#fff;color:#172b2b;border:1.5px solid #172b2b;border-radius:8px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.lf-handlinger .lf-primaer{background:#0e86c8;color:#fff}
.lf-handlinger button:disabled{opacity:.55;cursor:default}
.lf-fejl{color:#b3123f;font-weight:600}
.lf-bjaelke{position:fixed;left:50%;top:7px;transform:translateX(-50%);z-index:50;display:flex;align-items:center;gap:10px;background:#172b2b;color:#fff9ee;border-radius:999px;padding:6px 8px 6px 14px;font:600 14px Archivo,system-ui,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.35);max-width:calc(100vw - 24px);white-space:nowrap}
.lf-prik{width:11px;height:11px;border-radius:50%;background:#ff5a5a;flex:none;animation:lf-blink 1.4s infinite}
.lf-tid{font-variant-numeric:tabular-nums}
.lf-niveau{width:34px;height:7px;flex:none;border-radius:4px;background:#fff9ee40;overflow:hidden}
.lf-niveau i{display:block;height:100%;background:#7fd68a;transform:scaleX(0);transform-origin:left}
.lf-varsel{color:#ffd166;white-space:normal;line-height:1.2}.lf-varsel:empty{display:none}
.lf-stop{min-height:34px;border-radius:999px;padding:3px 13px}
.lf-dialog :focus-visible,.lf-bjaelke :focus-visible,.lf-knap:focus-visible{outline:3px solid #7a4fd6;outline-offset:2px}
@keyframes lf-blink{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.lf-prik{animation:none}}
@media print{.lf-knap,.lf-bjaelke,.lf-dialog{display:none!important}}
`;

const nyt = (html) => {
  const skabelon = document.createElement('template');
  skabelon.innerHTML = html.trim();
  return skabelon.content.firstChild;
};
const uuid = () => crypto.randomUUID();
const base64 = blob => new Promise((svar, fejl) => {
  const laeser = new FileReader();
  laeser.onload = () => svar(String(laeser.result).split(',')[1]);
  laeser.onerror = () => fejl(laeser.error);
  laeser.readAsDataURL(blob);
});
export const tidstekst = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// simulation: stabilt id. version og opgave følger afleveringen.
// tilstand(): sidens aktuelle tilstand; haendelser(log): kobler sidens handlinger på loggen.
export function startLydfeedback({ simulation, version, opgave, vaert, tilstand, haendelser }) {
  const kode = new URLSearchParams(location.search).get('afproevning');
  if (!kode || !LYD_CONFIG.modtager || !vaert) return null;

  document.head.append(Object.assign(document.createElement('style'), { textContent: CSS }));

  let dialog, bjaelke, stroem, optager, ur, stopUr, lydkontekst, niveauUr, langsomUr;
  let venter = false, mikrofonForsoeg = 0;
  let startetMs = 0, optagerKoerer = false;
  let optagelse = null;     // { lyd, adresse, type, varighed, startet, starttilstand, log, session, sendt }

  const log = (handling) => {
    if (!optagerKoerer || !optagelse || optagelse.log.length >= MAKS_LOG) return;
    // Bagefter, så tilstanden er den, handlingen førte til.
    const t = Date.now() - startetMs;
    setTimeout(() => {
      if (optagelse?.log.length < MAKS_LOG) optagelse.log.push({ t, handling, tilstand: tilstand?.() ?? {} });
    }, 0);
  };
  haendelser?.(log);

  const knap = nyt('<button type="button" class="lf-knap" data-lf="aabn">Hjælp med at afprøve simulationen</button>');
  knap.addEventListener('click', visInformation);
  vaert.append(knap);

  function visDialog(indhold) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'lf-dialog';
      dialog.setAttribute('aria-labelledby', 'lf-titel');
      // Escape må ikke smide en uafleveret optagelse væk.
      dialog.addEventListener('cancel', e => {
        if (venter) afbrydVentetid();
        else if (optagelse && !optagelse.sendt) e.preventDefault();
      });
      // Chrome lader et gentaget Escape lukke alligevel, så dialogen kommer tilbage.
      dialog.addEventListener('close', () => {
        if (venter) afbrydVentetid();
        else if (optagelse?.lyd && !optagelse.sendt) dialog.showModal();
      });
      document.body.append(dialog);
    }
    dialog.innerHTML = `<div class="lf-indhold">${indhold}</div>`;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('h2')?.setAttribute('tabindex', '-1');
    dialog.querySelector('h2')?.focus();
  }
  const paa = (navn, fn) => dialog.querySelector(`[data-lf="${navn}"]`)?.addEventListener('click', fn);
  const lukDialog = () => dialog?.open && dialog.close();

  function visInformation(fejl = '') {
    const besked = typeof fejl === 'string' ? fejl : '';
    visDialog(`
      <h2 id="lf-titel">Hjælp med at afprøve simulationen</h2>
      <p>Du optager din stemme, mens du bruger simulationen. Det hjælper med at gøre den bedre. Det er simulationen, der afprøves, ikke dig.</p>
      <p class="lf-opgave"><strong>Sådan gør du:</strong> ${opgave ? `${opgave} ` : ''}Sig højt, hvad du kigger på, prøver og tænker undervejs.</p>
      <ul class="lf-lille">
        <li><strong>Modtager:</strong> Simon Messell, ejer af smbi.dk. Kun ejeren kan høre optagelsen.</li>
        <li><strong>Formål:</strong> at forbedre simulationerne på smbi.dk.</li>
        <li><strong>Opbevaring:</strong> slettes senest efter ${LYD_CONFIG.opbevaringDage} dage.</li>
        <li><strong>Med optagelsen følger:</strong> en log over hvad du gør i simulationen, tidspunkt og simulationens version. Ikke det, du skriver i felter, og ikke din skærm.</li>
        <li>Det er frivilligt. Du behøver ikke sige dit navn, og din stemme kan stadig være genkendelig.</li>
        <li>Intet sendes, før du selv har lyttet og trykket send.</li>
      </ul>
      ${besked ? `<p class="lf-fejl" role="alert">${besked}</p>` : ''}
      <div class="lf-handlinger"><button type="button" data-lf="annuller">Ikke nu</button><button type="button" class="lf-primaer" data-lf="start">Start optagelse</button></div>`);
    paa('annuller', lukDialog);
    paa('start', startOptagelse);
  }

  function mikrofonFejl(fejl) {
    if (fejl?.name === 'NotAllowedError' || fejl?.name === 'SecurityError') {
      return window.top !== window.self
        ? 'Mikrofonen er ikke tilladt her. Åbn simulationen i sin egen fane og prøv igen.'
        : 'Browseren fik ikke lov til at bruge mikrofonen. Giv tilladelse ved adresselinjen og prøv igen.';
    }
    if (fejl?.name === 'NotFoundError' || fejl?.name === 'OverconstrainedError') return 'Der blev ikke fundet nogen mikrofon på denne computer.';
    if (fejl?.name === 'NotReadableError') return 'Mikrofonen kunne ikke startes. Måske bruger et andet program den.';
    return 'Optagelsen kunne ikke startes i denne browser.';
  }

  // Browserens spørgsmål om lov ligger uden for siden og kan tage tid. Imens skal
  // deltageren kunne se, hvad der sker, og kunne fortryde.
  function visVenter() {
    venter = true;
    visDialog(`
      <h2 id="lf-titel">Giv adgang til mikrofonen</h2>
      <p>Browseren spørger om lov til at bruge mikrofonen. Se efter spørgsmålet øverst ved adresselinjen, og vælg Tillad.</p>
      <p class="lf-lille" data-lf="langsom" role="status"></p>
      <div class="lf-handlinger"><button type="button" data-lf="fortryd">Annullér</button></div>`);
    // Med det samme: dialogens close-hændelse kommer først lidt senere, og det kan mikrofonens svar også.
    paa('fortryd', () => { afbrydVentetid(); lukDialog(); });
    langsomUr = setTimeout(() => {
      const felt = dialog.querySelector('[data-lf="langsom"]');
      if (felt) felt.textContent = 'Der sker ikke noget? Mikrofonen svarer ikke. Annullér, genstart browseren, og prøv igen, eller prøv en anden browser.';
    }, MIKROFON_LANGSOM_MS);
  }

  function afbrydVentetid() {
    venter = false;
    clearTimeout(langsomUr);
    mikrofonForsoeg++;      // et svar, der kommer senere, bliver lukket igen
    knap.focus();
  }

  async function startOptagelse() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      return visInformation('Denne browser kan ikke optage lyd. Prøv en nyere version af Chrome, Edge, Firefox eller Safari.');
    }
    const type = FORMATER.find(f => MediaRecorder.isTypeSupported(f));
    if (!type) return visInformation('Denne browser kan ikke optage i et lydformat, vi kan modtage.');
    visVenter();
    const forsoeg = ++mikrofonForsoeg;
    let nyStroem;
    try {
      nyStroem = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (fejl) {
      if (forsoeg !== mikrofonForsoeg) return;
      venter = false;
      clearTimeout(langsomUr);
      return visInformation(mikrofonFejl(fejl));
    }
    if (forsoeg !== mikrofonForsoeg) {      // deltageren fortrød, mens browseren spurgte
      nyStroem.getTracks().forEach(spor => spor.stop());
      return;
    }
    venter = false;
    clearTimeout(langsomUr);
    stroem = nyStroem;
    kasser();
    const stykker = [];
    optager = new MediaRecorder(stroem, { mimeType: type, audioBitsPerSecond: 32000 });
    optager.addEventListener('dataavailable', e => { if (e.data.size) stykker.push(e.data); });
    optager.addEventListener('stop', () => {
      const varighed = Date.now() - startetMs;
      frigivMikrofon();
      if (!optagelse) return;   // efter en fejl er optagelsen allerede kasseret
      const lyd = new Blob(stykker, { type });
      if (!lyd.size) {
        kasser();
        console.warn('lydfeedback: ingen data fra MediaRecorder', { type, varighed });
        return visInformation(varighed < 2000 ? 'Optagelsen var for kort til, at der kom lyd med. Prøv igen.' : INGEN_LYD);
      }
      optagelse.lyd = lyd;
      optagelse.adresse = URL.createObjectURL(lyd);
      optagelse.varighed = varighed;
      optagelse.type = type;
      visAflytning();
    });
    optager.addEventListener('error', () => {
      frigivMikrofon();
      kasser();
      visInformation('Optagelsen stoppede med en fejl. Prøv igen.');
    });
    startetMs = Date.now();
    optagelse = { startet: new Date(startetMs).toISOString(), starttilstand: tilstand?.() ?? {}, log: [], session: uuid(), sendt: false };
    optagerKoerer = true;
    optager.start(1000);
    lukDialog();
    visBjaelke();
    window.addEventListener('beforeunload', advar);
  }

  function visBjaelke() {
    bjaelke = nyt(`<div class="lf-bjaelke" role="group" aria-label="Optagelse"><span class="lf-prik" aria-hidden="true"></span><span>Optager <span class="lf-tid" data-lf="tid">00:00</span></span><span class="lf-niveau" aria-hidden="true"><i data-lf="niveau"></i></span><span class="lf-varsel" data-lf="varsel" role="status"></span><button type="button" class="lf-stop" data-lf="stop">Stop</button></div>`);
    document.body.append(bjaelke);
    const felt = bjaelke.querySelector('[data-lf="tid"]');
    bjaelke.querySelector('[data-lf="stop"]').addEventListener('click', stopOptagelse);
    ur = setInterval(() => { felt.textContent = tidstekst(Date.now() - startetMs); }, 500);
    stopUr = setTimeout(stopOptagelse, MAKS_MS);
    lytTilNiveau();
  }

  // Viser at mikrofonen hører noget, så en tavs mikrofon opdages med det samme og
  // ikke først, når optagelsen er slut. Fejler det, kan optagelsen stadig køre.
  function lytTilNiveau() {
    try {
      lydkontekst = new AudioContext();
      lydkontekst.resume?.();
      const analyse = lydkontekst.createAnalyser();
      analyse.fftSize = 1024;
      lydkontekst.createMediaStreamSource(stroem).connect(analyse);
      const proeve = new Float32Array(analyse.fftSize);
      const streg = bjaelke.querySelector('[data-lf="niveau"]'), varsel = bjaelke.querySelector('[data-lf="varsel"]');
      let hoert = false;
      const startet = Date.now();
      niveauUr = setInterval(() => {
        analyse.getFloatTimeDomainData(proeve);
        const top = proeve.reduce((storst, v) => Math.max(storst, Math.abs(v)), 0);
        streg.style.transform = `scaleX(${Math.min(1, top * 4)})`;
        if (top > 0.0003) hoert = true;
        const tavs = !hoert && lydkontekst.state === 'running' && Date.now() - startet > TAVS_EFTER_MS;
        const tekst = tavs ? 'Hører ingen lyd. Tjek mikrofonen.' : '';
        if (varsel.textContent !== tekst) varsel.textContent = tekst;
      }, 200);
    } catch (fejl) {
      console.warn('lydfeedback: niveaumåler kunne ikke starte', fejl);
    }
  }

  function stopOptagelse() {
    if (optager?.state === 'recording') optager.stop();
  }

  function frigivMikrofon() {
    optagerKoerer = false;
    clearInterval(ur); clearInterval(niveauUr); clearTimeout(stopUr);
    lydkontekst?.close().catch(() => {});
    lydkontekst = null;
    bjaelke?.remove(); bjaelke = null;
    stroem?.getTracks().forEach(spor => spor.stop());
    stroem = null;
  }

  function kasser() {
    if (optagelse?.adresse) URL.revokeObjectURL(optagelse.adresse);
    optagelse = null;
    window.removeEventListener('beforeunload', advar);
  }

  function advar(e) {
    if (optagerKoerer || (optagelse && !optagelse.sendt)) { e.preventDefault(); e.returnValue = ''; }
  }

  function filnavn() {
    return `lydfeedback-${optagelse.session.slice(0, 8)}.${ENDELSER[optagelse.type.split(';')[0]]}`;
  }

  function visAflytning(fejl = '') {
    const kanRedde = !!fejl;
    visDialog(`
      <h2 id="lf-titel">Lyt til din optagelse</h2>
      <p>Optagelsen er ${tidstekst(optagelse.varighed)} lang og ligger indtil videre kun på denne computer.</p>
      <audio controls src="${optagelse.adresse}"></audio>
      <p class="lf-lille">Sendes til Simon Messell, smbi.dk, sammen med loggen over dine handlinger i simulationen (${optagelse.log.length} handlinger). Slettes senest efter ${LYD_CONFIG.opbevaringDage} dage.</p>
      <p class="lf-status" data-lf="status" role="status">${fejl ? `<span class="lf-fejl">${fejl}</span>` : ''}</p>
      <div class="lf-handlinger">
        <button type="button" data-lf="slet">Slet</button>
        <button type="button" data-lf="igen">Optag igen</button>
        ${kanRedde ? `<a data-lf="hent" href="${optagelse.adresse}" download="${filnavn()}">Hent optagelsen</a>` : ''}
        <button type="button" class="lf-primaer" data-lf="send">${kanRedde ? 'Prøv at sende igen' : 'Send feedback til smbi.dk'}</button>
      </div>`);
    paa('slet', () => { kasser(); lukDialog(); knap.focus(); });
    paa('igen', () => { kasser(); visInformation(); });
    paa('send', send);
  }

  async function send() {
    const status = dialog.querySelector('[data-lf="status"]');
    dialog.querySelectorAll('.lf-handlinger button').forEach(b => { b.disabled = true; });
    status.textContent = 'Sender … Det kan tage op til et minut. Luk ikke siden.';

    let svar = null, data = null;
    try {
      // Apps Script kan ikke svare på en preflight, så kroppen sendes som ren tekst.
      svar = await fetch(LYD_CONFIG.modtager, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          kode, simulation, version: version ?? '', opgave: opgave ?? '',
          session: optagelse.session, startet: optagelse.startet,
          varighed_ms: optagelse.varighed, lydformat: optagelse.type,
          starttilstand: optagelse.starttilstand, log: optagelse.log,
          lyd: await base64(optagelse.lyd),
        }),
      });
      data = await svar.json();
    } catch { data = null; }

    if (svar?.ok && data?.ok && data.kvittering) {
      optagelse.sendt = true;
      visKvittering(data.kvittering);
      return;
    }
    const grund = data?.fejl;
    visAflytning(
      grund === 'kode' ? 'Afprøvningslinket gælder ikke længere. Hent optagelsen, og spørg den, der gav dig linket.'
      : grund === 'kvote' ? 'Der er modtaget mange optagelser lige nu. Prøv igen senere, eller hent optagelsen.'
      : grund === 'stoerrelse' ? 'Optagelsen er for stor til at blive sendt. Hent den, eller optag en kortere.'
      : 'Optagelsen blev ikke modtaget. Tjek forbindelsen og prøv igen, eller hent optagelsen.',
    );
  }

  function visKvittering(nummer) {
    visDialog(`
      <h2 id="lf-titel">Tak, din feedback er modtaget</h2>
      <p>smbi.dk har bekræftet, at optagelsen og loggen er kommet frem.</p>
      <p>Kvittering: <strong>${nummer}</strong></p>
      <p class="lf-lille">Nævn nummeret, hvis du senere vil have optagelsen slettet.</p>
      <div class="lf-handlinger"><button type="button" class="lf-primaer" data-lf="luk">Luk</button></div>`);
    paa('luk', () => { kasser(); lukDialog(); knap.focus(); });
  }

  // Mikrofonen må ikke leve videre, hvis siden forlades midt i en optagelse.
  window.addEventListener('pagehide', () => { if (stroem) frigivMikrofon(); });
  return { log };
}
