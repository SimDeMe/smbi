// Én indgang til lagene. Selve lagtilstand, indlæsning og fejl styres fortsat af lavLag.
export function startLagmenu({ hentTema, skiftTema, skiftKlima, temaId, temaNavn, klimasystem }) {
  const menu = document.querySelector('#lagmenu');
  const knap = document.querySelector('#lag-aabn');
  const lag = [...menu.querySelectorAll('.lagknap')];
  const grupper = [...menu.querySelectorAll('.laggruppe')];
  const indikator = menu.querySelector('#lag-indikator');
  const klima = menu.querySelector('#lag-klimasystem');
  let temaKlar = false, henterTema = false;

  function placer() {
    if (!menu.matches(':popover-open')) return;
    const b = knap.getBoundingClientRect();
    menu.style.maxHeight = `${Math.max(160, innerHeight - 24)}px`;
    const r = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(innerWidth - r.width - 12, b.right - r.width))}px`;
    menu.style.top = `${Math.max(12, Math.min(innerHeight - r.height - 12, b.bottom + 8))}px`;
  }
  function opdater() {
    const aktive = lag.filter(k => k.getAttribute('aria-pressed') === 'true');
    const antal = document.querySelector('#lag-antal');
    antal.textContent = aktive.length; antal.hidden = !aktive.length;
    knap.setAttribute('aria-label', `Lag${aktive.length ? `, ${aktive.length} aktive` : ''}`);
    for (const gruppe of grupper) {
      const n = gruppe.querySelectorAll('[aria-pressed="true"]').length;
      const felt = gruppe.querySelector('.gruppe-antal');
      felt.textContent = `${n} valgt`; felt.hidden = !n;
    }
    if (temaKlar) indikator.value = temaId();
    const navne = aktive.map(k => k.id === 'temalag' ? temaNavn() : k.getAttribute('aria-label'));
    menu.querySelector('#lagmenu-status').textContent = navne.length ? `Viser: ${navne.join(' · ')}` : 'Ingen lag valgt';
    const fejl = menu.querySelector('#lagmenu-fejl');
    const status = document.querySelector('#kortstatus:not([hidden]), .signatur:not([hidden]) .lagstatus:not([hidden])');
    fejl.textContent = status && /kunne.*ikke/i.test(status.textContent) ? status.textContent : '';
    fejl.hidden = !fejl.textContent;
    klima.value = klimasystem();
    klima.disabled = document.querySelector('#klimalag').disabled;
    indikator.disabled = !temaKlar || document.querySelector('#temalag').disabled;
    placer();
  }
  async function bygTema() {
    if (temaKlar || henterTema) return;
    henterTema = true;
    try {
      const emner = await hentTema();
      indikator.replaceChildren();
      for (const [navn, liste] of emner) {
        const gruppe = document.createElement('optgroup'); gruppe.label = navn;
        for (const ind of liste) gruppe.append(new Option(ind.navn, ind.id));
        indikator.append(gruppe);
      }
      temaKlar = true;
      opdater();
    } catch {
      indikator.replaceChildren(new Option('Kunne ikke hentes – genindlæs siden', ''));
    } finally { henterTema = false; placer(); }
  }
  menu.querySelector('#lag-demografi').addEventListener('toggle', event => {
    if (event.currentTarget.open) bygTema();
  });
  indikator.addEventListener('change', async () => {
    indikator.disabled = true;
    try { await skiftTema(indikator.value); } finally { opdater(); }
  });
  klima.addEventListener('change', async () => {
    klima.disabled = true;
    try { await skiftKlima(klima.value); } finally { opdater(); }
  });
  // Accordion holder antallet af synlige kontroller nede, også på telefon.
  for (const gruppe of grupper) gruppe.addEventListener('toggle', () => {
    if (gruppe.open) for (const anden of grupper) if (anden !== gruppe) anden.open = false;
    placer();
  });
  const luk = () => { menu.hidePopover(); knap.focus({ preventScroll: true }); };
  document.querySelector('#lag-luk').onclick = luk;
  menu.addEventListener('toggle', event => {
    knap.setAttribute('aria-expanded', String(event.newState === 'open'));
    if (event.newState === 'open') { opdater(); placer(); }
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); luk(); }
    if (event.target.tagName === 'SUMMARY' && ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const overskrifter = grupper.map(g => g.querySelector('summary'));
      const i = overskrifter.indexOf(event.target);
      const n = event.key === 'Home' ? 0 : event.key === 'End' ? overskrifter.length - 1
        : (i + (event.key === 'ArrowDown' ? 1 : -1) + overskrifter.length) % overskrifter.length;
      overskrifter[n].focus();
    }
    event.stopPropagation(); // menubetjening må ikke dreje globussen
  });
  const observer = new MutationObserver(opdater);
  for (const felt of lag) observer.observe(felt, { attributes: true, attributeFilter: ['aria-pressed', 'disabled'] });
  window.addEventListener('resize', placer);
  window.addEventListener('scroll', placer, { passive: true });
  opdater();
  return { opdater, skjul() { if (menu.matches(':popover-open')) menu.hidePopover(); } };
}
