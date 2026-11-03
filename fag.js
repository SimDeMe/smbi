/* ─────────────────────────────────────────────────────────
   smbi.dk — fagforsider (geografi.html, biologi.html)
   Søgefelt over kortene, emneknapper over kortene med data-emne
   + årstal i bunden.
   ───────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var aar = document.getElementById('year');
  if (aar) aar.textContent = new Date().getFullYear();

  var felt = document.getElementById('soeg');
  var tal = document.getElementById('soeg-tal');
  var tom = document.getElementById('soeg-tom');
  var emneBoks = document.getElementById('emne-filter');
  var emneTom = document.getElementById('emne-tom');
  var tomTekst = tom ? tom.textContent : '';

  /* Alfaknappen: på sider med #alfa-knap står kun betaversionerne fremme,
     og simuleringer med alfamærke vises først, når knappen er trykket ned.
     Sider uden knappen viser alle kort som før. */
  var alfaKnap = document.getElementById('alfa-knap');
  var alfaAntal = alfaKnap && alfaKnap.querySelector('.antal');
  var simAntal = document.getElementById('sim-antal');
  var visAlfa = !alfaKnap;

  /* Hvert kort bærer sine søgeord i data-sog. Overskrift og brødtekst tages
     med automatisk, så nøgleordene kun skal dække det, der IKKE står på
     kortet — fx "orografisk" på stigningsregn. Forsøgsvejledningerne har
     desuden et data-emne med ét eller flere tags adskilt af semikolon,
     fx data-emne="Klima; Kyst". Hvert tag giver sin egen emneknap. */
  var kort = Array.prototype.map.call(
    document.querySelectorAll('[data-sog]'),
    function (el) {
      return {
        el: el,
        emner: (el.getAttribute('data-emne') || '').split(';')
                 .map(function (e) { return e.trim(); })
                 .filter(function (e) { return e; }),
        tekst: (el.getAttribute('data-sog') + ' ' + el.textContent)
                 .toLowerCase().replace(/\s+/g, ' '),
        alfa: !!el.querySelector('.wip-mark'),
        soeg: true
      };
    }
  );

  /* En gruppe (overskriftsrække + kortgitter) eller en stak skal forsvinde
     helt, når ingen af dens kort er tilbage — ellers står der tomme
     overskrifter og hænger. */
  var grupper = Array.prototype.map.call(
    document.querySelectorAll('.sims, .stack'),
    function (boks) {
      /* Overskriftsrækken til et .sims-gitter ligger lige før gitteret.
         Har gruppen en note imellem (fx "under opbygning"), hører den til
         gruppen og skal skjules sammen med den. */
      var foer = boks.classList.contains('sims') ? boks.previousElementSibling : null;
      var note = foer && foer.classList.contains('grp-note') ? foer : null;
      var elementer = boks.querySelectorAll('[data-sog]');
      return {
        boks: boks,
        // staken med emneknapperne i (geografi.html) må ikke forsvinde
        medKnapper: !!(emneBoks && boks.contains(emneBoks)),
        note: note,
        titel: note ? note.previousElementSibling : foer,
        kort: kort.filter(function (k) {
          return Array.prototype.indexOf.call(elementer, k.el) !== -1;
        })
      };
    }
  );

  /* En sektion med data-skjul-tom (fx «Byg figuren») forsvinder helt,
     også fra menuen, når ingen af dens grupper er tilbage. */
  var sektioner = Array.prototype.map.call(
    document.querySelectorAll('.sec[data-skjul-tom]'),
    function (sek) {
      return {
        el: sek,
        links: document.querySelectorAll('a[href="#' + sek.id + '"]'),
        bokse: sek.querySelectorAll('.sims, .stack')
      };
    }
  );

  var ord = [];        // søgeordene
  var valgtEmne = '';  // '' = alle emner

  function normaliser(s) {
    return s.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /* Emnet i adressen: "Krop og fysiologi" → "krop-og-fysiologi" */
  function slug(s) {
    return s.toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ── Emneknapper ──────────────────────────────────────── */
  var emner = [];
  kort.forEach(function (k) {
    k.emner.forEach(function (e) {
      if (emner.indexOf(e) === -1) emner.push(e);
    });
  });

  function harEmne(k, emne) { return k.emner.indexOf(emne) !== -1; }
  emner.sort(function (a, b) { return a.localeCompare(b, 'da'); });

  var knapper = [];
  function lavKnap(emne, navn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', 'false');
    b.appendChild(document.createTextNode(navn));
    var antal = document.createElement('span');
    antal.className = 'antal';
    b.appendChild(antal);
    b.addEventListener('click', function () {
      // klik på det valgte emne igen = tilbage til alle
      vaelgEmne(emne === valgtEmne ? '' : emne, true);
    });
    emneBoks.appendChild(b);
    knapper.push({ el: b, emne: emne, antal: antal });
  }

  if (emneBoks && emner.length > 1) {
    lavKnap('', 'Alle');
    emner.forEach(function (e) { lavKnap(e, e); });
    emneBoks.hidden = false;
  }

  function vaelgEmne(emne, skrivAdresse) {
    valgtEmne = emne;
    vis();
    if (!skrivAdresse || !window.history.replaceState) return;
    var url = new URL(location.href);
    if (emne) url.searchParams.set('emne', slug(emne));
    else url.searchParams.delete('emne');
    history.replaceState(null, '', url);
  }

  /* ── Vis og skjul ─────────────────────────────────────── */
  function alfaOk(k) { return visAlfa || !k.alfa; }

  function vis() {
    var synlige = 0, fundne = 0, alfaFundne = 0;

    kort.forEach(function (k) {
      k.soeg = ord.every(function (o) { return k.tekst.indexOf(o) !== -1; });
      // kort uden emne (fx Atlas) hører ikke til noget emne
      var emneOk = !valgtEmne || harEmne(k, valgtEmne);
      k.el.hidden = !(k.soeg && emneOk && alfaOk(k));
      if (k.soeg && alfaOk(k)) fundne++;
      if (k.soeg && k.alfa) alfaFundne++;
      if (!k.el.hidden) synlige++;
    });

    /* En gruppe skjules, når ingen af dens kort vises. Står emneknapperne
       inde i en stak, skjules den stak dog efter søgningen alene: står man
       i et emne uden træffere, skal knapperne blive stående, så man kan
       vælge et andet. */
    var simuleringer = 0;
    grupper.forEach(function (g) {
      var nogen = g.medKnapper
        ? g.kort.some(function (k) { return k.soeg && alfaOk(k); })
        : g.kort.some(function (k) { return !k.el.hidden; });
      g.boks.hidden = !nogen;
      if (g.note) g.note.hidden = !nogen;
      if (g.titel && g.titel.classList.contains('grp')) g.titel.hidden = !nogen;
      // gruppens tæller følger alfaknappen, så den passer med kortene
      var n = alfaKnap && g.titel && g.titel.querySelector('.n');
      if (n) {
        var antal = g.kort.filter(alfaOk).length;
        // grupper som «Opslag» tæller værktøjer, ikke simuleringer
        if (/simulering/.test(n.textContent)) {
          simuleringer += antal;
          n.textContent = antal + (antal === 1 ? ' simulering' : ' simuleringer');
        } else {
          n.textContent = n.textContent.replace(/^\d+/, antal);
        }
      }
    });

    sektioner.forEach(function (sek) {
      var tomSek = !Array.prototype.some.call(sek.bokse, function (b) { return !b.hidden; });
      sek.el.hidden = tomSek;
      Array.prototype.forEach.call(sek.links, function (a) { a.hidden = tomSek; });
    });

    if (alfaKnap) {
      alfaKnap.setAttribute('aria-pressed', String(visAlfa));
      alfaAntal.textContent = alfaFundne;
      if (simAntal) simAntal.textContent = simuleringer + ' stk';
    }

    knapper.forEach(function (kn) {
      var n = kort.filter(function (k) {
        return k.emner.length && k.soeg && alfaOk(k) && (!kn.emne || harEmne(k, kn.emne));
      }).length;
      kn.antal.textContent = n;
      kn.el.setAttribute('aria-pressed', String(kn.emne === valgtEmne));
      // et tomt emne kan ikke vælges — men det valgte kan altid slås fra
      kn.el.disabled = n === 0 && kn.emne !== '' && kn.emne !== valgtEmne;
    });

    if (emneTom) {
      var ingenIEmne = valgtEmne && !kort.some(function (k) {
        return harEmne(k, valgtEmne) && !k.el.hidden;
      });
      emneTom.hidden = !ingenIEmne;
      emneTom.textContent = ingenIEmne
        ? 'Intet om «' + valgtEmne + '» matcher søgningen.'
        : '';
    }

    if (tom) {
      tom.hidden = fundne !== 0;
      tom.textContent = !visAlfa && alfaFundne
        ? 'Kun alfaversioner matcher søgningen — tryk på «Alfa-versioner» for at se dem.'
        : tomTekst;
    }
    if (tal) {
      tal.textContent = ord.length === 0
        ? ''
        : synlige + (synlige === 1 ? ' træffer' : ' træffere');
    }
  }

  function soeg(raa) {
    var q = normaliser(raa);
    ord = q ? q.split(' ') : [];
    vis();
  }

  if (felt) {
    felt.addEventListener('input', function () { soeg(felt.value); });

    // Escape rydder feltet, så man kan komme tilbage til hele listen uden mus
    felt.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && felt.value !== '') {
        felt.value = '';
        soeg('');
        e.preventDefault();
      }
    });
  }

  if (alfaKnap) {
    alfaKnap.addEventListener('click', function () {
      visAlfa = !visAlfa;
      vis();
      if (!window.history.replaceState) return;
      var url = new URL(location.href);
      if (visAlfa) url.searchParams.set('alfa', '1');
      else url.searchParams.delete('alfa');
      history.replaceState(null, '', url);
    });
  }

  /* Deling: ?soeg=grundvand åbner siden med søgningen slået til,
     ?emne=krop-og-fysiologi med emnet valgt og ?alfa=1 med alfaversionerne
     fremme */
  var params = new URLSearchParams(location.search);
  if (alfaKnap && params.get('alfa') === '1') visAlfa = true;
  var fraUrl = params.get('soeg');
  var emneFraUrl = params.get('emne');
  if (emneFraUrl && knapper.length) {
    emner.forEach(function (e) {
      if (slug(e) === slug(emneFraUrl)) valgtEmne = e;
    });
  }
  if (fraUrl && felt) {
    felt.value = fraUrl;
    soeg(fraUrl);
  } else {
    vis();
  }
})();
