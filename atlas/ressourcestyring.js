// Betjening, signatur og elevundersøgelse for Ressourcer og samfund.
import { lavLag } from './lagknap.js';
export function startRessourcer({ globus, slukAndre, opdater, undersoeg }) {
  let samfund, potentiale;
  const $ = s => document.querySelector(s);
  const signatur = $('#ressourcesignatur');
  const felt = $('#ressourcevalg');
  const lag = [];
  function aktuelt() { return potentialelaget.aktiv ? potentiale : samfund; }
  function tegn(m, type) {
    const ind = m.indikator();
    $('#ressourcetitel').textContent = type === 'energi' ? 'Energimiks pr. land' : ind.navn;
    const nytValg = felt.dataset.type !== type;
    if (nytValg) { felt.replaceChildren(); felt.dataset.type = type; }
    function vaelger(navn, id, muligheder, vaerdi, skift) {
      const label = document.createElement('label'); label.className = 'temavalg'; label.textContent = navn;
      const select = document.createElement('select'); select.id = id;
      for (const [v, tekst] of Object.entries(muligheder)) select.append(new Option(tekst, v));
      select.value = vaerdi;
      select.onchange = () => { skift(select.value); tegn(m, type); globus().gentegn(); globus().aflaes(); opdater(); };
      label.append(select); felt.append(label);
    }
    if (nytValg && type === 'energi') {
      vaelger('Opgørelse', 'energibasis', { el: 'Elproduktion', energi: 'Primærenergi' }, m.valg.basis, v => { m.valg.basis = v; });
      vaelger('Energikilde', 'energikilde', m.ENERGIKILDER, m.valg.kilde, v => { m.valg.kilde = v; });
    }
    if (type === 'energi') felt.querySelector('#energikilde option[value="biofuel"]').textContent = m.valg.basis === 'energi' ? 'Biobrændstoffer' : 'Bioenergi';
    if (nytValg && type === 'potentiale') vaelger('Ressource', 'potentialemaal', { sol: 'Solindstråling', vind: 'Vindpotentiale' }, m.valg.maal, v => { m.valg.maal = v; });
    $('#ressourceforklaring').textContent = `${ind.aar || '2001–2020'} · ${ind.enhed}. ${ind.forklaring}`;
    const klasser = m.klasser(ind);
    klasser.push({ farve: m.INGEN_DATA, tekst: 'ingen data' });
    $('#ressourceklasser').replaceChildren(...klasser.map(k => {
      const li = document.createElement('li'), farve = document.createElement('i');
      farve.style.background = k.farve; li.append(farve, k.tekst); return li;
    }));
    $('#samfundaflaesning').hidden = type === 'potentiale';
    $('#potentialeaflaesning').hidden = type !== 'potentiale';
  }
  function lav(type, knap) {
    const l = lavLag({ knap: $(knap), signatur, klasse: 'ressourcelag', efter: opdater,
      fejltekst: 'Ressourcedata kunne ikke indlæses. Prøv laget igen. Globussen virker stadig.',
      async vis(vis) {
        const raster = type === 'potentiale';
        const m = raster ? (potentiale ??= await import('./potentiale.js')) : (samfund ??= await import('./samfund.js'));
        if (vis) {
          await m.hent(); // Bevar det tidligere lag, hvis datahentningen fejler.
          for (const andet of lag) if (andet !== l && andet.aktiv) await andet.skift(null);
          await slukAndre(raster);
          if (!raster) m.valg.lag = type;
        }
        if (raster) await globus().visTemalag('potentiale', vis ? m : null);
        else await globus().visTemakort(vis ? m : null);
        if (vis) tegn(m, type);
      }
    });
    lag.push(l); return l;
  }
  lav('energi', '#energilag');
  lav('vand', '#vandstresslag');
  const potentialelaget = lav('potentiale', '#potentialelag');
  $('#ressourceopgave').onclick = () => undersoeg(aktuelt(), potentialelaget.aktiv);
  return {
    async sluk() { for (const l of lag) if (l.aktiv) await l.skift(null); },
    beskrivelse() { return lag.some(l => l.aktiv) ? `${aktuelt().indikator().navn}, ${aktuelt().indikator().enhed}. Aflæs ved sigtekornet eller musen; se Undersøg for data og opgaver.` : ''; }
  };
}
