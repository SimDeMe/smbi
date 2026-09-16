/* =====================================================================
   forsoeg.js - selve forsoeget: tilstand, trin, tid og taelling

   Tre kolber, tre gaerroer, to varmeplader og en taeller. Trinene (TRIN)
   er gjort, naar tilstanden siger det, ikke naar en knap er trykket.
   Genstandene flyttes af smaa koreografier (koer), som i kemiformler.dk's
   superanimationer.

   Tiden gaar i virkelig tid, saa boblerne kan taelles. Et klik paa uret
   spoler fem minutter frem. Handlingerne (traek og slip) staar i
   handlinger.js, tegningen og musen i bord.js, laereren i laerer.js og
   biologien i model.js.

   Eleven maa gerne goere det forkerte. Kun det, der fysisk ikke kan lade
   sig goere, afvises. Fejlene noteres i this.iagttaget, laereren
   kommenterer dem, og tegneserien viser dem.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;
    var S = NK.Scene;
    var M = NK.Model;
    var r = NK.r;
    var A = S.ANKER;

    /* Der taelles i ti sekunder, og tallet ganges op til bobler pr. minut */
    var TAELLE_SEK = 10;
    var TAELLE_FAKTOR = 60 / TAELLE_SEK;

    function kopi(p) { return { x: p.x, y: p.y, v: p.v }; }

    var TRIN = [
        { id: "roer", tekst: "Vand og BTB i gærrørene", mark: "maaleglas",
          hint: "Træk måleglasset hen på et gærrør på hylden, og træk BTB-flasken hen på det samme rør. Gør det med alle tre." },
        { id: "bland", tekst: "Sukker, gær og vand i kolberne", mark: "sukker",
          hint: "Træk sukkeret, gæren og måleglasset hen på hver af de tre kolber." },
        { id: "roert", tekst: "Rør rundt", mark: "spatel",
          hint: "Træk spatlen hen på hver kolbe." },
        { id: "temp", tekst: "Tre temperaturer: bordet, ca. 37 °C og ca. 60 °C", mark: "plader",
          hint: "Kolbe 1 bliver på bordet. Stil de to andre på hver sin varmeplade, og indstil pladerne med + til ca. 37 °C og ca. 60 °C." },
        { id: "maalt", tekst: "Mål temperaturen i kolberne", mark: "termometer",
          hint: "Klik på uret for at vente, til kolberne er varme. Træk så termometeret hen på hver kolbe." },
        { id: "prop", tekst: "Gærrør på kolberne", mark: "roer",
          hint: "Træk et gærrør fra hylden hen på hver kolbe." },
        { id: "taelt", tekst: "Tæl bobler i ti sekunder", mark: "taeller",
          hint: "Træk tælleren hen på en kolbe. Tryk på mellemrumstasten eller knappen Boble, hver gang en boble kommer op gennem vandet i gærrøret. Efter ti sekunder ganges tallet op til bobler pr. minut." }
    ];
    NK.TRIN = TRIN;

    /* Fejl og uheld, der noteres i this.iagttaget:
       ingenSukker, ingenGaer, ingenVand, dobbeltGaer, btbKolbe, overloeb,
       roerOverloeb, tabt, kogt, ingenRoer, tomtRoer, ingenBtb, luftbobler,
       nulBobler, skaevTaelling, samme og ikkeRoert. */

    NK.Forsoeg = function (canvas) {
        this.canvas = canvas;
        this.laerred = canvas ? new NK.Laerred(canvas) : null;
        this.tid = 0;
        this.forsoegNr = 0;
        this.resultater = [];
        this.koppenVaek = false;
        this.baegerPaaHylde = false;
        this.kaffeFindes = false;
        this.baegerHistorie = false;
        this.urMinutter = 0;
        this.urSekunder = 0;
        this.vedAendring = null;
        this.vedBesked = null;
        this.vedMaaling = null;
        if (this.laererStart) this.laererStart();
        this.nulstil();
        if (canvas && this.bindMus) this.bindMus();
    };

    var P = NK.Forsoeg.prototype;

    function genstand(navn, sprite, hjem) {
        return { navn: navn, sprite: sprite, anker: A[sprite], hjem: hjem, p: kopi(hjem) };
    }

    P.nyKolbe = function (i, plads) {
        var p = S.kolbePaa(plads);
        return {
            i: i, nr: i + 1, navn: "Kolbe " + (i + 1), sprite: "kolbe", anker: A.kolbe,
            m: M.nyKolbe(), sted: plads, p: p, roer: null, maaltTemp: null, taelling: null,
            bobler: [], bobleFase: 0, niveau: null, traekkes: false
        };
    };

    /* ----- Nyt forsoeg ----------------------------------------------- */
    P.nulstil = function () {
        this.forsoegNr++;
        this.gjort = {};
        this.iagttaget = {};
        this.trinStart = this.tid;
        this.sidsteTrin = "";
        this.simTid = 0;

        var mig = this;
        this.plader = { pladeA: { indstillet: M.RUM, temp: M.RUM }, pladeB: { indstillet: M.RUM, temp: M.RUM } };
        this.kolber = [0, 1, 2].map(function (i) { return mig.nyKolbe(i, S.PLADS[i]); });
        this.roer = [0, 1, 2].map(function (i) {
            return { i: i, nr: i + 1, sprite: "gaerroer", anker: A.gaerroer, m: M.nytRoer(), paa: null, slot: i,
                     p: S.roerIStativ(i), bobler: [], kvote: 0, overloeb: 0, traekkes: false };
        });
        this.g = {
            sukker:     genstand("sukker", "sukker", S.HJEM.sukker),
            gaer:       genstand("gaer", "gaer", S.HJEM.gaer),
            maaleglas:  genstand("maaleglas", "maaleglas", S.HJEM.maaleglas),
            btb:        genstand("btb", "btb", S.HJEM.btb),
            spatel:     genstand("spatel", "spatel", S.HJEM.spatel),
            termometer: genstand("termometer", "termometer", S.HJEM.termometer),
            taeller:    genstand("taeller", "taeller", S.HJEM.taeller),
            baegerglas: genstand("baegerglas", "baegerglas", S.HJEM.baegerglas),
            kaffe:      genstand("kaffe", "nillerKop", S.HJEM.kaffe),
            kaffekop:   genstand("kaffekop", "simonKop", S.HJEM.kaffekop)
        };
        this.g.kaffekop.skjult = this.koppenVaek;
        /* Baegerglasset og Kemi-Nillers glemte kaffe foelger hele sessionen */
        this.g.baegerglas.p = kopi(this.baegerPaaHylde ? S.BAEGER_HYLDE : S.HJEM.baegerglas);
        this.g.baegerglas.btb = 0;
        this.g.kaffe.findes = !!this.kaffeFindes;
        this.g.kaffe.tom = false;
        this.btbTom = false;

        this.taeller = { aktiv: null, tal: 0, sande: 0, start: 0, slut: 0, tempStart: 0, luft: 0, tryk: 0 };
        this.spol = null;
        this.handling = null;
        this.holdt = null;
        this.hover = null;
        this.mark = null;
        this.traekMaal = null;
        this.flyvende = [];
        this.dampe = [];
        this.pytter = [];
        this.skaar = [];
        this.straale = null;
        this.aflaesning = null;
        this.roerer = null;
        this.antalBobler = 0;
        if (this.laererNyt) this.laererNyt();
        this.aendret("nulstil");
    };

    /* ----- Hjaelpere ---------------------------------------------------- */
    P.pladeFor = function (k) {
        return k.sted && k.sted.type === "plade" ? this.plader[k.sted.id] : null;
    };

    P.kolbePaaPlads = function (plads) {
        for (var i = 0; i < this.kolber.length; i++) if (this.kolber[i].sted === plads) return this.kolber[i];
        return null;
    };

    P.roerPaaKolbe = function (k) {
        return k.roer === null ? null : this.roer[k.roer];
    };

    /* ----- Trinene ------------------------------------------------------ */
    P.trinGjort = function (id) {
        var mig = this;
        var K = this.kolber;
        switch (id) {
            case "roer": return this.roer.every(function (x) { return x.m.vand > 0 && x.m.btb > 0; });
            case "bland": return K.every(function (k) { return M.harBlanding(k.m); });
            case "roert": return K.every(function (k) { return M.harBlanding(k.m) && k.m.roert; });
            case "temp":
                var bord = 0, lun = 0, varm = 0;
                K.forEach(function (k) {
                    var pl = mig.pladeFor(k);
                    if (!k.sted) return;
                    if (!pl || pl.indstillet <= M.RUM) bord++;
                    else if (pl.indstillet >= 30 && pl.indstillet <= 45) lun++;
                    else if (pl.indstillet >= 50 && pl.indstillet <= 75) varm++;
                });
                return bord === 1 && lun === 1 && varm === 1;
            case "maalt": return K.every(function (k) { return k.maaltTemp !== null; });
            case "prop": return K.every(function (k) { return k.roer !== null; }) || this.trinGjort("taelt");
            case "taelt": return K.every(function (k) { return k.taelling !== null; });
        }
        return !!this.gjort[id];
    };

    P.aktueltTrin = function () {
        for (var i = 0; i < TRIN.length; i++) if (!this.trinGjort(TRIN[i].id)) return TRIN[i];
        return null;
    };

    P.hint = function () {
        var t = this.aktueltTrin();
        if (!t) return null;
        var mark = t.mark;
        var tekst = t.hint;
        if (t.id === "roer" && this.roer.every(function (x) { return x.m.vand > 0; })) mark = "btb";
        if (t.id === "bland") {
            var mangler = this.kolber.filter(function (k) { return !M.harBlanding(k.m); })[0];
            if (mangler) mark = mangler.m.sukker <= 0 ? "sukker" : (mangler.m.gaer <= 0 ? "gaer" : "maaleglas");
        }
        if (t.id === "maalt") {
            var kolde = this.kolber.some(function (k) { var pl = this.pladeFor(k); return pl && Math.abs(k.m.temp - pl.indstillet) > 3; }, this);
            if (kolde) mark = "ur";
        }
        if (t.id === "taelt" && this.taeller.aktiv !== null) {
            tekst = "Tryk på mellemrumstasten eller knappen Boble for hver boble, der kommer op gennem vandet.";
            mark = null;
        }
        if (mark) this.markér(mark, 5);
        return tekst;
    };

    P.markér = function (navn, sek) { this.mark = { navn: navn, ur: sek || 3 }; };

    P.markeret = function (navn) { return !!(this.mark && this.mark.navn === navn && this.mark.ur > 0); };

    P.aendret = function (grund) { if (this.vedAendring) this.vedAendring(grund); };

    P.besked = function (tekst, slags) { if (this.vedBesked) this.vedBesked(tekst, slags || "info"); };

    P.iagttag = function (noegle, bemaerk) {
        if (this.iagttaget[noegle]) return;
        this.iagttaget[noegle] = true;
        if (bemaerk && this.laererBemaerk) this.laererBemaerk(noegle);
        this.aendret("iagttag");
    };

    P.maal = function (hvad, vaerdi) { if (this.vedMaaling) this.vedMaaling(hvad, vaerdi); };

    P.optaget = function () {
        return !!(this.handling || this.spol || (this.laererOptaget && this.laererOptaget()));
    };

    /* ----- Koreografier ------------------------------------------------ */
    /* gribbar: navnet paa den genstand, eleven maa gribe i luften, mens
       den er paa vej hjem efter sidste trin i koreografien. */
    P.koer = function (liste, navn, gribbar) {
        this.handling = { liste: liste, i: 0, t: 0, navn: navn || "", gribbar: gribbar || null };
        this.aendret("handling");
    };

    P.opdaterHandling = function (dt) {
        var sikkerhed = 0;
        while (this.handling && sikkerhed++ < 30) {
            var h = this.handling;
            var tr = h.liste[h.i];
            if (!tr) { this.handling = null; this.aendret("handling"); return; }
            if (tr.kald) {
                tr.kald.call(this);
                if (this.handling === h) { h.i++; h.t = 0; }
                continue;
            }
            h.t += dt;
            dt = 0;
            var t = tr.tid > 0 ? Math.min(1, h.t / tr.tid) : 1;
            if (tr.flyt) {
                var gg = tr.flyt;
                if (!tr.fra) tr.fra = kopi(gg.p);
                var til = typeof tr.til === "function" ? tr.til.call(this) : tr.til;
                var e = NK.blod(t);
                gg.p.x = NK.lerp(tr.fra.x, til.x, e);
                gg.p.y = NK.lerp(tr.fra.y, til.y, e) - Math.sin(Math.PI * e) * (tr.loeft === undefined ? 40 : tr.loeft);
                gg.p.v = NK.lerp(tr.fra.v, til.v, e);
            }
            if (tr.hver) tr.hver.call(this, t, h.t);
            if (t < 1) return;
            h.i++;
            h.t = 0;
        }
    };

    P.hjemTil = function (gg, tid, loeft) {
        return { flyt: gg, til: gg.hjem, tid: tid || 0.8, loeft: loeft === undefined ? 40 : loeft };
    };

    /* ----- Uret: fem minutter frem ------------------------------------- */
    P.spolFrem = function () {
        if (this.spol) return false;
        if (this.taeller.aktiv !== null) { this.besked("Uret kan ikke spoles frem, mens der tælles."); return false; }
        if (this.handling || (this.laererOptaget && this.laererOptaget())) return false;
        this.spol = { rest: 300 };
        if (NK.Lyd) NK.Lyd.klik();
        this.aendret("spol");
        return true;
    };

    /* ----- Taellingen -------------------------------------------------- */
    P.startTaelling = function (k) {
        var T = this.taeller;
        T.aktiv = k.i;
        T.tal = 0;
        T.sande = 0;
        T.luft = 0;
        T.start = this.simTid;
        T.slut = this.simTid + TAELLE_SEK;
        T.tempStart = k.m.temp;
        this.antalBobler = 0;
        if (k.roer === null) this.iagttag("ingenRoer", true);
        else if (this.roer[k.roer].m.vand <= 0) this.iagttag("tomtRoer", true);
        else if (this.roer[k.roer].m.btb <= 0) this.iagttag("ingenBtb", true);
        this.besked("Tæl boblerne i " + k.navn.toLowerCase() + " i ti sekunder.", "god");
        this.aendret("taelling");
    };

    P.boble = function () {
        var T = this.taeller;
        if (T.aktiv === null) {
            this.besked("Træk tælleren hen på en kolbe først.");
            this.markér("taeller", 3);
            return false;
        }
        T.tal++;
        T.tryk = 0.12;
        if (NK.Lyd) NK.Lyd.taelle();
        this.aendret("boble");
        return true;
    };

    P.afbrydTaelling = function (grund) {
        var T = this.taeller;
        if (T.aktiv === null) return;
        T.aktiv = null;
        if (grund) this.besked(grund, "advarsel");
        this.koer([this.hjemTil(this.g.taeller, 0.8, 30)], "taellerHjem");
        this.aendret("taelling");
    };

    P.afslutTaelling = function () {
        var T = this.taeller;
        var k = this.kolber[T.aktiv];
        var ro = this.roerPaaKolbe(k);
        var res = {
            klik: T.tal, sande: T.sande,
            perMin: Math.round(T.tal * TAELLE_FAKTOR), sandePerMin: Math.round(T.sande * TAELLE_FAKTOR),
            tMaalt: k.maaltTemp, tSand: k.m.temp,
            roer: !!ro, vand: !!(ro && ro.m.vand > 0), luft: T.luft, stigning: k.m.temp - T.tempStart
        };
        k.taelling = res;
        T.aktiv = null;
        if (NK.Lyd) NK.Lyd.bip();
        this.besked(k.navn + ": " + res.klik + " bobler på ti sekunder, altså " + res.perMin + " pr. minut.", "god");
        if (res.luft > 0.4 || res.stigning > 0.5) this.iagttag("luftbobler", true);
        /* Nul bobler er kun en fejl, hvis gæren lever: ved 60 °C er det resultatet */
        if (res.sande === 0 && res.klik === 0 && res.vand && M.harBlanding(k.m) && k.m.levende > 0.3) this.iagttag("nulBobler", true);
        else if (res.vand && Math.abs(res.klik - res.sande) > Math.max(2, res.sande * 0.3)) this.iagttag("skaevTaelling", true);
        this.maal("taelling", k.i);
        this.koer([this.hjemTil(this.g.taeller, 0.8, 30)], "taellerHjem");

        if (this.trinGjort("taelt") && !this.gjort.slut) this.afslutForsoeg();
        this.aendret("taelling");
    };

    P.afslutForsoeg = function () {
        this.gjort.slut = true;
        var temps = this.kolber.map(function (k) { return k.taelling.tMaalt === null ? Math.round(k.taelling.tSand) : k.taelling.tMaalt; });
        if (Math.abs(temps[0] - temps[1]) < 4 || Math.abs(temps[1] - temps[2]) < 4 || Math.abs(temps[0] - temps[2]) < 4) this.iagttag("samme");
        this.resultater.push({
            nr: this.forsoegNr,
            raekker: this.kolber.map(function (k, i) { return { nr: k.nr, temp: temps[i], bobler: k.taelling.perMin, sande: k.taelling.sandePerMin }; })
        });
        if (NK.Lyd) NK.Lyd.succes();
        if (this.laererSlut) this.laererSlut();
        this.aendret("slut");
    };

    /* ----- Tidens gang --------------------------------------------------- */
    P.opdater = function (dt) {
        if (dt > 0.1) dt = 0.1;
        this.tid += dt;

        this.opdaterHandling(dt);
        if (this.opdaterLaerer) this.opdaterLaerer(dt);
        if (this.mark) { this.mark.ur -= dt; if (this.mark.ur <= 0) this.mark = null; }

        if (this.spol) {
            var stykke = Math.min(this.spol.rest, dt * 240);
            this.spol.rest -= stykke;
            while (stykke > 0) {
                var d = Math.min(1, stykke);
                this.simuler(d, true);
                stykke -= d;
            }
            if (this.spol.rest <= 0) { this.spol = null; this.aendret("spol"); }
        } else {
            this.simuler(dt, false);
        }
        this.opdaterEffekter(dt);

        var t = this.aktueltTrin();
        var id = t ? t.id : "slut";
        if (id !== this.sidsteTrin) { this.sidsteTrin = id; this.trinStart = this.tid; }
    };

    P.simuler = function (dt, hurtig) {
        var i, mig = this;
        this.simTid += dt;
        this.urSekunder = (this.urSekunder + dt) % 60;
        this.urMinutter += dt / 60;

        Object.keys(this.plader).forEach(function (id) {
            var pl = mig.plader[id];
            pl.temp += (pl.indstillet - pl.temp) * (1 - Math.exp(-dt / 25));
        });

        for (i = 0; i < this.kolber.length; i++) {
            var k = this.kolber[i];
            var pl = this.pladeFor(k);
            var maal = pl ? pl.temp : M.RUM;
            var ro = this.roerPaaKolbe(k);
            var ud = M.opdaterKolbe(k.m, dt, { maal: maal, plade: !!(pl && pl.temp > M.RUM + 0.5), lukket: !!ro });

            if (this.taeller.aktiv === i) this.taeller.luft += k.m.luft;
            if (ro) {
                var hele = M.opdaterRoer(ro.m, ud, dt);
                if (hele > 0) {
                    if (this.taeller.aktiv === i) this.taeller.sande += hele;
                    if (!hurtig) {
                        ro.kvote = Math.min(4, ro.kvote + hele);
                    }
                }
            }
            if (!hurtig && ro) ro.kvote = Math.min(4, ro.kvote);

            if (k.m.temp > 72 && (k.m.gaer > 0) && !this.iagttaget.kogt) this.iagttag("kogt", true);

            if (!hurtig) {
                k.bobleFase += dt * Math.min(16, k.m.slip * 0.3);
                while (k.bobleFase >= 1) {
                    k.bobleFase -= 1;
                    k.bobler.push({ x: 48 + r(-28, 28), y: 120, vy: -r(35, 70), r: r(0.8, 2.2) });
                }
                if (k.m.temp > 52 && !ro && k.sted && Math.random() < dt * 5) {
                    var aab = NK.tilVerden(k.p, k.anker, 48, 0);
                    this.dampe.push({ x: aab.x + r(-4, 4), y: aab.y - 2, vx: r(-6, 6), vy: r(-34, -20), r: r(3, 6), liv: 1 });
                }
            }
        }

        if (this.taeller.aktiv !== null && this.simTid >= this.taeller.slut) this.afslutTaelling();
    };

    P.opdaterEffekter = function (dt) {
        var i, j;
        this.taeller.tryk = Math.max(0, this.taeller.tryk - dt);
        if (this.aflaesning) { this.aflaesning.ur -= dt; if (this.aflaesning.ur <= 0) this.aflaesning = null; }

        /* Boblerne i gaerroerene: hoejst fire i sekundet vises */
        for (i = 0; i < this.roer.length; i++) {
            var ro = this.roer[i];
            ro.overloeb = Math.max(0, ro.overloeb - dt * 0.5);
            while (ro.kvote >= 1) {
                ro.kvote -= 1;
                ro.bobler.push({ t: 0, pop: 0 });
                if (NK.Lyd && ro.paa !== null && this.taeller.aktiv === ro.paa) NK.Lyd.plop();
            }
            for (j = ro.bobler.length - 1; j >= 0; j--) {
                var b = ro.bobler[j];
                if (b.pop > 0) { b.pop += dt * 3; if (b.pop >= 1) ro.bobler.splice(j, 1); continue; }
                b.t += dt * 1.1;
                if (b.t >= 1) { b.t = 1; b.pop = 0.01; }
            }
            if (ro.m.vand <= 0 || ro.paa === null) ro.bobler.length = 0;
        }

        for (i = 0; i < this.kolber.length; i++) {
            var k = this.kolber[i];
            var niveauLokal = k.niveau !== null ? k.niveau - k.p.y + k.anker.y : 100;
            for (j = k.bobler.length - 1; j >= 0; j--) {
                var bo = k.bobler[j];
                bo.y += bo.vy * dt;
                bo.x += Math.sin(this.tid * 9 + j) * 8 * dt;
                if (bo.y < niveauLokal || k.m.vand <= 0) k.bobler.splice(j, 1);
            }
            if (k.bobler.length > 60) k.bobler.splice(0, k.bobler.length - 60);
        }

        for (i = this.flyvende.length - 1; i >= 0; i--) {
            var f = this.flyvende[i];
            f.a += (f.va || 0) * dt;
            if (f.fra) {
                f.t += dt / f.varighed;
                var e = Math.min(1, f.t);
                f.x = NK.lerp(f.fra.x, f.til.x, e);
                f.y = NK.lerp(f.fra.y, f.til.y, e) - Math.sin(Math.PI * e) * (f.bue === undefined ? 20 : f.bue);
                if (f.t >= 1) {
                    this.flyvende.splice(i, 1);
                    if (f.vedLanding) f.vedLanding.call(this);
                }
                continue;
            }
            f.vy += 900 * dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            if (f.y > (f.bund || S.BORD) - 1) this.flyvende.splice(i, 1);
        }

        for (i = this.dampe.length - 1; i >= 0; i--) {
            var p = this.dampe[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.r += dt * 8;
            p.liv -= dt * 0.6;
            if (p.liv <= 0) this.dampe.splice(i, 1);
        }
        if (this.dampe.length > 80) this.dampe.splice(0, this.dampe.length - 80);
    };
}());
