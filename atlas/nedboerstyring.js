// Signaturen til nedbørslaget: farveskala, månedsskyder, afspilning og et lille
// søjlediagram over året i det aflæste punkt. Selve data og tegning ligger i
// nedboer.js; her styres kun, hvad eleven ser og betjener.

const SKIFT = 500;        // ms, farverne glider til næste måned
const PR_MAANED = 1400;   // ms pr. måned under afspilning

export function startNedboer({ globus, modul, opdateret = () => {} }) {
  const skyder = document.querySelector('#nedboerskyder');
  const spil = document.querySelector('#nedboerspil');
  const navn = document.querySelector('#nedboermaaned');
  const zenit = document.querySelector('#nedboerzenit');
  const diagram = document.querySelector('#nedboerdiagram');
  const roligt = matchMedia('(prefers-reduced-motion: reduce)');
  let overgang = 0, naeste = 0;

  // Farveskala: én boks pr. klasse og tallene ved grænserne.
  const skala = document.querySelector('#nedboerskala');
  if (!skala.childElementCount) {
    const felter = document.createElement('div');
    felter.className = 'alderfelter';
    felter.style.gridTemplateColumns = `repeat(${modul.KLASSER.length},1fr)`;
    for (const k of modul.KLASSER) {
      const i = document.createElement('i');
      i.style.background = k.farve;
      i.title = k.til === null ? `over ${k.fra} mm` : `${k.fra}–${k.til} mm`;
      felter.append(i);
    }
    const tal = document.createElement('div');
    tal.className = 'alderskalatal';
    modul.KLASSER.forEach((k, i) => {
      if (![0, 25, 50, 100, 200, 400].includes(k.fra)) return;
      const span = Object.assign(document.createElement('span'), { textContent: k.fra });
      span.style.left = `${100 * i / modul.KLASSER.length}%`;
      tal.append(span);
    });
    skala.append(felter, tal);
  }

  function visMaaned(maaned, glid = false) {
    const fra = modul.tilstand.maaned;
    cancelAnimationFrame(overgang);
    skyder.value = maaned;
    skyder.setAttribute('aria-valuetext', modul.MAANEDER[maaned]);
    navn.textContent = modul.MAANEDER[maaned];
    if (!glid || roligt.matches || fra === maaned) {
      modul.saetMaaned(maaned);
      globus.gentegn(); opdateret();
      return;
    }
    const start = performance.now();
    const trin = nu => {
      const t = Math.min(1, (nu - start) / SKIFT);
      modul.saetMaaned(maaned, fra, t);
      globus.gentegn();
      if (t < 1) overgang = requestAnimationFrame(trin);
    };
    overgang = requestAnimationFrame(trin);
    opdateret();
  }

  function stop() {
    clearTimeout(naeste);
    naeste = 0;
    spil.setAttribute('aria-pressed', 'false');
    spil.innerHTML = '<span aria-hidden="true">▶</span> Afspil';
  }
  function fortsaet() {
    naeste = setTimeout(() => {
      visMaaned((modul.tilstand.maaned + 1) % 12, true);
      fortsaet();
    }, PR_MAANED);
  }
  spil.onclick = () => {
    if (naeste) { stop(); return; }
    spil.setAttribute('aria-pressed', 'true');
    spil.innerHTML = '<span aria-hidden="true">❚❚</span> Pause';
    visMaaned((modul.tilstand.maaned + 1) % 12, true);
    fortsaet();
  };
  // Skyderen styres af eleven: afspilningen stopper, og skiftet sker med det samme.
  skyder.addEventListener('input', () => { stop(); visMaaned(Number(skyder.value)); });
  zenit.addEventListener('change', () => { modul.tilstand.zenit = zenit.checked; globus.gentegn(); opdateret(); });

  // Søjlediagram over punktets år, den viste måned fremhævet.
  const NS = 'http://www.w3.org/2000/svg';
  const el = (type, egenskaber, tekst) => {
    const e = document.createElementNS(NS, type);
    for (const [k, v] of Object.entries(egenskaber)) e.setAttribute(k, v);
    if (tekst !== undefined) e.textContent = tekst;
    return e;
  };
  modul.lytTil((aaret, maaned) => {
    if (!aaret) { diagram.replaceChildren(); return; }
    const top = Math.max(50, Math.ceil(Math.max(...aaret) / 50) * 50);
    const B = 264, H = 52, venstre = 30, bund = 41, hoejde = 34, s = (B - venstre) / 12;
    const dele = [
      el('line', { x1: venstre, x2: B, y1: bund + .5, y2: bund + .5, stroke: '#17211f', 'stroke-width': 1 }),
      el('text', { x: venstre - 4, y: bund - hoejde + 4, 'text-anchor': 'end' }, top),
      el('text', { x: venstre - 4, y: bund, 'text-anchor': 'end' }, '0')
    ];
    aaret.forEach((mm, i) => {
      const h = Math.max(mm > 0 ? .8 : 0, mm / top * hoejde);
      dele.push(el('rect', { x: venstre + i * s + 2, y: bund - h, width: s - 4, height: h, fill: i === maaned ? '#17211f' : '#3a9bb0' }));
      dele.push(el('text', { x: venstre + (i + .5) * s, y: H - 1, 'text-anchor': 'middle', 'font-weight': i === maaned ? 700 : 400 }, 'JFMAMJJASOND'[i]));
    });
    diagram.replaceChildren(...dele);
  });

  visMaaned(modul.tilstand.maaned);
  return {
    visMaaned,
    stop,
    beskrivelse() {
      const m = modul.tilstand.maaned;
      return `Nedbør i ${modul.MAANEDER[m]}, middel 1991–2020 efter GPCP, i mm pr. måned${modul.tilstand.zenit ? `; den orange linje viser, hvor solen står i zenit midt i måneden (${Math.abs(modul.zenitbredde(m)).toFixed(0)}° ${modul.zenitbredde(m) >= 0 ? 'nord' : 'syd'})` : ''}`;
    }
  };
}
