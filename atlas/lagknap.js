// Fælles betjening for globussens temalag: knap, signatur, indlæsning og
// fejltilstand. Selve data og tegning ligger i lagets eget modul; her styres
// kun, hvad eleven ser og kan trykke på.
//
// valg er lagets tilstand: null eller false = slukket, ellers fx true eller
// et klimasystem. vis(valg) henter data og tegner; den kaster ved fejl, og så
// bliver laget stående, som det var.

export function lavLag({ knap, signatur, klasse, fejltekst, vis, standard = true, efter = () => {}, fejl = () => {} }) {
  const kortstatus = document.querySelector('#kortstatus');
  // Fejl, mens signaturen er åben, vises i signaturen, så de står ved laget.
  const lagstatus = signatur.querySelector('.lagstatus');
  const lag = {
    valg: null,
    standard,
    get aktiv() { return lag.valg !== null && lag.valg !== false; },
    async skift(valg) {
      const havdeFokus = document.activeElement === knap;
      kortstatus.classList.remove('landestatus');
      knap.disabled = true;
      knap.setAttribute('aria-busy', 'true');
      signatur.setAttribute('aria-busy', 'true');
      try {
        await vis(valg);
        lag.valg = valg;
        if (valg !== null && valg !== false) lag.standard = valg;
        knap.setAttribute('aria-pressed', String(lag.aktiv));
        signatur.hidden = !lag.aktiv;
        document.body.classList.toggle(klasse, lag.aktiv);
        if (lagstatus) lagstatus.hidden = true;
        kortstatus.hidden = true;
      } catch {
        fejl();
        if (lagstatus && !signatur.hidden) { lagstatus.textContent = fejltekst; lagstatus.hidden = false; }
        else { kortstatus.textContent = fejltekst; kortstatus.hidden = false; }
      } finally {
        knap.disabled = false;
        knap.removeAttribute('aria-busy');
        signatur.removeAttribute('aria-busy');
        efter();
        // Native disabled kan fjerne fokus. Giv det tilbage efter indlæsning,
        // hvis eleven ikke i mellemtiden har valgt en anden kontrol eller dialog.
        if (havdeFokus && document.activeElement === document.body && !document.querySelector('dialog[open]')) {
          knap.focus({ preventScroll: true });
        }
      }
    },
    slaaTil() { return lag.aktiv ? Promise.resolve() : lag.skift(lag.standard); }
  };
  knap.onclick = () => lag.skift(lag.aktiv ? null : lag.standard);
  return lag;
}
