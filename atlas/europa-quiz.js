import { europa, lavQuiz } from './quizmodel.js';

let kortdata;
export function findQuizLand(lande, punkt, xy, projektion, synlig) {
  const smaa = europa.filter(l => l.lille && synlig(l.punkt)).map(l => {
    const p = projektion(l.punkt);
    return { land: l, afstand: Math.hypot(p[0] - xy[0], p[1] - xy[1]) };
  }).filter(l => l.afstand <= 8).sort((a, b) => a.afstand - b.afstand);
  if (smaa.length) return smaa[0].land.id;
  return lande.find(l => window.d3.geoContains(l, punkt))?.id;
}
async function hentLande() {
  if (kortdata) return kortdata;
  await import('./vendor/topojson-simplify.min.js');
  const svar = await fetch(new URL('./data/europa-10m.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
  if (!svar.ok) throw new Error('Europakortet kunne ikke hentes');
  const topologi = await svar.json();
  const lande = window.topojson.feature(topologi, topologi.objects.countries).features;
  const gyldig = f => {
    const g = f?.geometry;
    const polygoner = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : null;
    return Array.isArray(polygoner) && polygoner.length && polygoner.every(p => Array.isArray(p) && p.length &&
      p.every(r => Array.isArray(r) && r.length >= 4 && r.every(x => Array.isArray(x) && x.length === 2 &&
        Number.isFinite(x[0]) && Math.abs(x[0]) <= 180 && Number.isFinite(x[1]) && Math.abs(x[1]) <= 90)));
  };
  // Vatikanets polygon kollapser ved kildens koordinatkvantisering. Dets
  // geografiske sigtepunkt/ring bruges i stedet; der opfindes ingen landflade.
  if (lande.length !== europa.length || !europa.every(l => {
    const f = lande.find(f => f.id === l.id);
    return gyldig(f) && (l.id === '336' || window.d3.geoContains(f, l.punkt));
  })) throw new Error('Ugyldige Europadata');
  // Fælles buer forenkles samlet, så nabolandes grænser ikke får sprækker.
  // Hit-test bruger altid de oprindelige polygoner, uanset tegnedetaljen.
  const vaegtet = window.topojson.presimplify(topologi, window.topojson.sphericalTriangleArea);
  const forenklet = graense => window.topojson.feature(window.topojson.simplify(vaegtet, graense),
    vaegtet.objects.countries).features;
  kortdata = { lande, oversigt: forenklet(2e-7), naer: forenklet(1e-8) };
  return kortdata;
}

export async function startEuropaQuiz(globus, vedStart, vedStop) {
  const kort = await hentLande();
  const lande = kort.lande;
  const model = lavQuiz();
  const felt = document.querySelector('#quizlinje');
  const navn = document.querySelector('#quiz-land');
  const fremskridt = document.querySelector('#quiz-fremskridt');
  const besked = document.querySelector('#quiz-besked');
  const visknap = document.querySelector('#quiz-vis');
  const igenknap = document.querySelector('#quiz-igen');
  const canvas = document.querySelector('#globus');
  let timer, stoppet = false, vist;

  function opdater(tekst = '') {
    const r = model.resultat;
    navn.textContent = model.faerdig ? 'Europa gennemført!' : model.land.navn;
    navn.dataset.land = model.faerdig ? '' : model.land.id;
    fremskridt.textContent = `${r.fundet} / ${r.antal}`;
    besked.textContent = tekst;
    visknap.hidden = model.faerdig;
    visknap.disabled = model.besvaret;
    igenknap.hidden = !model.faerdig;
    document.querySelector('#quiz-find').hidden = model.faerdig;
    canvas.setAttribute('aria-label', model.faerdig ? 'Europa-quiz gennemført' : `Europa-quiz. Find ${model.land.navn}. Drej med piletaster, finjustér med Shift og pil, vælg landet i sigtekornet med Enter.`);
    globus.gentegn();
  }
  function naeste() {
    if (stoppet) return;
    model.naeste(); vist = null;
    const r = model.resultat;
    opdater(model.faerdig ? `${r.foerste} af ${r.antal} rigtige i første forsøg · ${r.fejl} ${r.fejl === 1 ? 'forkert svar' : 'forkerte svar'} · ${r.viste} ${r.viste === 1 ? 'vist land' : 'viste lande'}.` : '');
  }
  const quiz = {
    tegn(ctx, sti, projektion, synlig) {
      const detalje = projektion.scale() < 500 ? kort.oversigt : kort.naer;
      for (const land of detalje) {
        ctx.beginPath(); sti(land);
        ctx.fillStyle = model.fundne.has(land.id) ? '#86bc96' : '#f4ebcd'; ctx.fill();
        ctx.strokeStyle = land.id === vist ? '#a64400' : '#405b4c';
        ctx.lineWidth = land.id === vist ? 2.8 : 1; ctx.stroke();
      }
      for (const land of europa.filter(l => l.lille && synlig(l.punkt))) {
        const [x, y] = projektion(land.punkt);
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = model.fundne.has(land.id) ? '#86bc96' : '#fff9ee'; ctx.fill();
        ctx.strokeStyle = land.id === vist ? '#a64400' : '#17211f'; ctx.lineWidth = 1.6; ctx.stroke();
      }
    },
    find(punkt, xy, projektion, synlig) {
      return findQuizLand(lande, punkt, xy, projektion, synlig);
    },
    svar(id) {
      if (stoppet || model.besvaret || model.faerdig) return;
      if (!id) { opdater('Du ramte uden for quizlandene. Prøv igen; zoom ind ved små lande.'); return; }
      const land = europa.find(l => l.id === id);
      if (model.svar(id)) {
        opdater(`Rigtigt: ${land.navn}!`);
        timer = setTimeout(naeste, 1000);
      } else opdater(`Det er ${land.navn}. Prøv igen.`);
    }
  };
  vedStart();
  document.body.classList.add('quiz');
  felt.hidden = false;
  document.querySelector('#nulstil').textContent = 'Europa';
  document.querySelector('#betjening').textContent = 'Tryk på landet · Drej og zoom frit · Små lande har ringe. Tastatur: pile, Shift+pil til finjustering, Enter i sigtekornet.';
  globus.visQuiz(quiz);
  opdater('Find landet på globussen. Alle 47 kommer én gang i tilfældig rækkefølge.');
  canvas.focus({ preventScroll: true });
  visknap.onclick = () => {
    if (!model.vis()) return;
    vist = model.land.id;
    globus.quizUdsnit(model.land.punkt, model.land.lille ? 8 : 3);
    opdater(`Her er ${model.land.navn}. Landet tæller som vist.`);
    // Et vist land bliver stående, indtil eleven selv går videre.
    document.querySelector('#quiz-naeste').hidden = false;
  };
  document.querySelector('#quiz-naeste').onclick = () => {
    document.querySelector('#quiz-naeste').hidden = true;
    globus.quizUdsnit([15, 54], 1.8); naeste(); canvas.focus({ preventScroll: true });
  };
  function stop() {
    if (stoppet) return;
    stoppet = true; clearTimeout(timer);
    document.body.classList.remove('quiz'); felt.hidden = true;
    document.querySelector('#quiz-naeste').hidden = true;
    document.querySelector('#nulstil').textContent = 'Nulstil';
    globus.visQuiz(null); vedStop();
  }
  document.querySelector('#quiz-stop').onclick = stop;
  igenknap.onclick = () => {
    stop(); document.querySelector('#quiz').click();
    document.querySelector('#quiz-start').click();
  };
  return { stop };
}
