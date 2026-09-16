/* =====================================================================
   bord.js - tegning af bordet og styring med musen

   Udvider NK.Forsoeg med:
     hvad(pt)          hvilken genstand ligger under punktet
     ned / flyt / op   musen: klik eller traek
     tegn()            hele scenen i den rigtige raekkefoelge
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;
    var S = NK.Scene;
    var M = NK.Model;
    var A = S.ANKER;
    var P = NK.Forsoeg.prototype;

    P.tilBord = function (ev) {
        var rect = this.canvas.getBoundingClientRect();
        var sk = S.skala(this.laerred.b, this.laerred.h);
        return { x: (ev.clientX - rect.left - sk.dx) / sk.s, y: (ev.clientY - rect.top - sk.dy) / sk.s };
    };

    /* ----- Hvad ligger under musen? ---------------------------------------- */
    P.hvad = function (pt) {
        var g = this.g, i;
        if (this.overLaerer) {
            var l = this.overLaerer(pt);
            if (l) return l;
        }
        if (!g.kaffekop.skjult && !g.kaffekop.iHaand && S.inden("simonKop", g.kaffekop.p, g.kaffekop.anker, pt.x, pt.y, 6)) return "kaffekop";
        if (Math.hypot(pt.x - S.UR.x, pt.y - S.UR.y) < S.UR.r + 8 || (Math.abs(pt.x - S.UR.x) < 44 && pt.y > S.UR.y + S.UR.r && pt.y < S.UR.y + S.UR.r + 26)) return "ur";
        for (i = 3; i < 5; i++) {
            var pl = S.PLADS[i];
            var kn = ["minus", "plus"];
            for (var j = 0; j < 2; j++) {
                var k0 = S.pladeKnap(pl, kn[j]);
                if (Math.hypot(pt.x - k0.x, pt.y - k0.y) < k0.r + 4) return "plade:" + pl.id + ":" + kn[j];
            }
        }
        if (g.kaffe.findes && S.inden("nillerKop", g.kaffe.p, g.kaffe.anker, pt.x, pt.y, 6)) return "kaffe";
        if (!(this.laerer && this.laerer.baerer === "baegerglas") && S.inden("baegerglas", g.baegerglas.p, g.baegerglas.anker, pt.x, pt.y, 4)) return "baegerglas";
        if (S.inden("taeller", g.taeller.p, g.taeller.anker, pt.x, pt.y, 6)) return "taeller";
        for (i = 0; i < 3; i++) {
            var ro = this.roer[i];
            if (ro.knust) continue;
            var lr = NK.tilLokal(ro.p, A.gaerroer, pt.x, pt.y);
            if (lr.x > 0 && lr.x < 80 && lr.y > 8 && lr.y < 104 && !(lr.x > 20 && lr.x < 36 && lr.y > 40) && !(lr.x > 50 && lr.x < 62 && lr.y < 40)) return "roer:" + i;
        }
        for (i = 0; i < 3; i++) {
            var k = this.kolber[i];
            if (k.knust) continue;
            if (S.inden("kolbe", k.p, k.anker, pt.x, pt.y, 4)) return "kolbe:" + i;
        }
        var navne = ["termometer", "spatel", "btb", "maaleglas", "gaer", "sukker"];
        for (i = 0; i < navne.length; i++) {
            var gg = g[navne[i]];
            if (gg.skjult) continue;
            if (S.inden(gg.sprite, gg.p, gg.anker, pt.x, pt.y, navne[i] === "spatel" || navne[i] === "termometer" ? 9 : 4)) return navne[i];
        }
        for (i = 3; i < 5; i++) {
            var pp = S.PLADS[i];
            if (pt.x > pp.x - 60 && pt.x < pp.x + 60 && pt.y > pp.y && pt.y < S.BORD) return "plade:" + pp.id;
        }
        if (S.inden("spand", S.SPAND_P, A.spand, pt.x, pt.y, 0)) return "spand";
        return null;
    };

    /* ----- Mus og beroering --------------------------------------------- */
    P.ned = function (pt) {
        if (NK.Lyd) NK.Lyd.laasOp();
        var navn = this.hvad(pt);
        if (!navn) return false;
        if (this.kanTraekke(navn)) {
            /* Gribes den i luften, afbrydes turen hjem */
            if (this.handling && this.handling.gribbar === navn.split(":")[0]) {
                this.handling = null;
                this.aendret("handling");
            }
            var gg = this.traekGenstand(navn);
            this.holdt = { navn: navn, start: pt, sidst: pt, flyttet: false, dx: gg.p.x - pt.x, dy: gg.p.y - pt.y,
                fra: { x: gg.p.x, y: gg.p.y, v: gg.p.v }, fraSted: gg.sted };
            return true;
        }
        this.klik(navn);
        return false;
    };

    P.flyt = function (pt) {
        var h = this.holdt;
        if (!h) { this.hover = this.hvad(pt); return; }
        var gg = this.traekGenstand(h.navn);
        if (!h.flyttet) {
            if (Math.abs(pt.x - h.start.x) + Math.abs(pt.y - h.start.y) < 6) return;
            h.flyttet = true;
            gg.traekkes = true;
            if (gg.sted !== undefined) gg.sted = null;
            if (NK.Lyd) NK.Lyd.klik();
        }
        var vx = pt.x - h.sidst.x;
        h.sidst = pt;
        gg.p.x = NK.klamp(pt.x + h.dx, 10, S.BREDDE - 10);
        gg.p.y = NK.klamp(pt.y + h.dy, 30, S.HOEJDE - 20);
        gg.p.v = NK.lerp(gg.p.v, h.fra.v + NK.klamp(vx * 0.02, -0.3, 0.3), 0.3);
        this.traekMaal = this.findMaal(h.navn, pt);
    };

    P.op = function () {
        var h = this.holdt;
        if (!h) return;
        this.holdt = null;
        var gg = this.traekGenstand(h.navn);
        var maal = this.traekMaal;
        this.traekMaal = null;
        gg.traekkes = false;
        /* Kolben har sin plads, indtil handlingen selv flytter den */
        if (h.fraSted !== undefined) gg.sted = h.fraSted;
        if (!h.flyttet) { this.klik(h.navn); return; }
        var ok = maal ? this.slipTil(h.navn, maal, h.sidst) : false;
        if (!ok) {
            if (h.fraSted !== undefined) gg.sted = null;
            var mig = this;
            this.koer([
                { flyt: gg, til: h.fra, tid: 0.45, loeft: 25 },
                { kald: function () { if (h.fraSted !== undefined) gg.sted = h.fraSted; mig.aendret("tilbage"); } }
            ], "tilbage");
        }
        this.aendret("slip");
    };

    P.bindMus = function () {
        var mig = this;
        var c = this.canvas;
        c.addEventListener("pointerdown", function (ev) {
            if (mig.ned(mig.tilBord(ev))) {
                try { c.setPointerCapture(ev.pointerId); } catch (fejl) {}
                ev.preventDefault();
            }
        });
        c.addEventListener("pointermove", function (ev) {
            mig.flyt(mig.tilBord(ev));
            var hv = mig.hover;
            c.style.cursor = mig.holdt ? "grabbing" : (hv && mig.kanTraekke(hv) ? "grab" : (hv ? "pointer" : "default"));
        });
        c.addEventListener("pointerup", function () { mig.op(); });
        c.addEventListener("pointercancel", function () { mig.op(); });
        c.addEventListener("pointerleave", function () { if (!mig.holdt) mig.hover = null; });
    };

    /* ================================================================
       TEGNING
       ================================================================ */
    P.tilpas = function () { return this.laerred.tilpas(); };

    function hjemme(gg) {
        return !gg.traekkes && Math.abs(gg.p.x - gg.hjem.x) + Math.abs(gg.p.y - gg.hjem.y) < 1.5 && Math.abs(gg.p.v - gg.hjem.v) < 0.01;
    }

    P.roerData = function (ro) {
        return { p: ro.p, farve: M.roerFarve(ro.m), bobler: ro.bobler, overloeb: ro.overloeb, fremhaev: this.markeret("roer") && ro.paa === null };
    };

    P.kolbeData = function (k, ro) {
        var m = k.m;
        return {
            p: k.p, ml: m.vand > 0 ? M.rumfang(m) : 0, farve: M.kolbeFarve(m),
            sukker: m.sukker, gaer: m.gaer, roert: m.roert && m.vand > 0,
            bobler: k.bobler, skum: m.roert ? m.slip / 70 : 0, boelge: k.boelge || 0,
            nr: k.nr, prop: !!ro, fremhaev: this.markeret("kolbe") || this.markeret("kolbe:" + k.i)
        };
    };

    P.tegnK = function (ctx, k, tid) {
        var ro = this.roerPaaKolbe(k);
        k.niveau = S.tegnKolbe(ctx, this.kolbeData(k, ro), tid);
        if (ro && !ro.traekkes && !ro.flytter) S.tegnRoer(ctx, this.roerData(ro), tid);
    };

    P.tegnGenstand = function (ctx, navn, tid) {
        var gg = this.g[navn];
        if (navn === "termometer") {
            var inde = this.handling && this.handling.navn === "maal";
            S.tegnTermometer(ctx, gg.p, inde ? this.kolberTemp(gg.p) : M.RUM, this.markeret(navn), tid);
        } else if (navn === "taeller") {
            S.tegnTaeller(ctx, gg.p, this.taeller.tal, this.markeret(navn), tid, this.taeller.tryk > 0);
        } else {
            NK.Sprites.tegnPositur(ctx, gg.sprite, gg.p, gg.anker);
            if (this.markeret(navn)) S.tegnMarkering(ctx, S.rekt(gg.sprite, gg.p, gg.anker, 0), tid);
        }
    };

    /* Den temperatur, termometeret viser: kolben, det staar i */
    P.kolberTemp = function (p) {
        for (var i = 0; i < this.kolber.length; i++) {
            var k = this.kolber[i];
            if (Math.abs(p.x - k.p.x) < 50 && p.y > k.p.y && p.y < k.p.y + 130) return k.m.temp;
        }
        return M.RUM;
    };

    P.tegn = function () {
        var L = this.laerred;
        var ctx = L.ctx;
        ctx.clearRect(0, 0, L.b, L.h);
        var sk = S.skala(L.b, L.h);
        var tid = this.tid, g = this.g, i, mig = this;
        var lv = this.laererVisning ? this.laererVisning() : {};
        this.synkRoer();

        ctx.save();
        ctx.translate(sk.dx, sk.dy);
        ctx.scale(sk.s, sk.s);

        S.tegnBaggrund(ctx, {
            tid: tid, urMinutter: this.urMinutter, urSekunder: this.urSekunder,
            plakatRegel: lv.plakatRegel || 0, urFremhaev: this.markeret("ur") || !!this.spol
        });

        var oppe = [];

        /* Krusset paa hylden */
        var kop = g.kaffekop;
        if (!kop.skjult && !kop.iHaand) {
            NK.Sprites.tegnPositur(ctx, "simonKop", kop.p, kop.anker);
            if (Math.sin(tid * 1.3) > -0.2) {
                ctx.save();
                ctx.strokeStyle = "rgba(230, 236, 242, 0.25)";
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(kop.p.x - 4, kop.p.y - 42);
                ctx.bezierCurveTo(kop.p.x - 10, kop.p.y - 52, kop.p.x + 2, kop.p.y - 58, kop.p.x - 4, kop.p.y - 68 - Math.sin(tid * 2) * 3);
                ctx.stroke();
                ctx.restore();
            }
        }

        /* Gaerroerene i stativet */
        this.roer.forEach(function (ro) {
            if (ro.knust || ro.paa !== null) return;
            if (ro.traekkes || ro.flytter) oppe.push(function () { S.tegnRoer(ctx, mig.roerData(ro), tid); });
            else S.tegnRoer(ctx, mig.roerData(ro), tid);
        });
        S.tegnStativ(ctx);

        /* Ingredienser og redskaber paa bordet */
        ["sukker", "gaer", "maaleglas", "btb", "spatel", "termometer", "taeller"].forEach(function (navn) {
            var gg = g[navn];
            if (gg.skjult) return;
            if (hjemme(gg)) {
                if (navn !== "spatel" && navn !== "termometer") S.skygge(ctx, gg.hjem.x - gg.anker.x + NK.Sprites.FILER[gg.sprite].b / 2, NK.Sprites.FILER[gg.sprite].b * 0.45, 0.3);
                mig.tegnGenstand(ctx, navn, tid);
            } else {
                oppe.push(function () { mig.tegnGenstand(ctx, navn, tid); });
            }
        });
        S.tegnHolder(ctx);

        /* Baegerglasset, der ikke hoerer til forsoeget, og Kemi-Nillers kaffe */
        if (!(this.laerer && this.laerer.baerer === "baegerglas")) {
            if (!this.baegerPaaHylde) S.skygge(ctx, g.baegerglas.p.x - 32, 34, 0.3);
            S.tegnBaeger(ctx, { p: g.baegerglas.p, btb: g.baegerglas.btb, fremhaev: mig.markeret("baegerglas") }, tid);
        }
        if (g.kaffe.findes && !(this.niller && this.niller.baerer === "nillerKop")) {
            if (hjemme(g.kaffe)) {
                S.skygge(ctx, g.kaffe.p.x, 20, 0.3);
                S.tegnKaffe(ctx, g.kaffe.p, mig.markeret("kaffe"), tid);
            } else {
                oppe.push(function () { S.tegnKaffe(ctx, g.kaffe.p, false, tid); });
            }
        }

        /* Varmepladerne */
        ["pladeA", "pladeB"].forEach(function (id, n) {
            var pl = mig.plader[id];
            S.tegnVarmeplade(ctx, S.PLADS[3 + n], pl.temp, pl.indstillet, mig.markeret("plader") || mig.markeret("plade:" + id), tid);
        });

        this.pytter.forEach(function (p) { if (p.y < 570) S.tegnPyt(ctx, p); });

        /* Kolberne */
        this.kolber.forEach(function (k) {
            if (k.knust) return;
            if (k.sted && !k.traekkes && !(mig.handling && mig.handling.liste.some(function (t) { return t.flyt === k; }))) {
                S.skygge(ctx, k.p.x, 44, 0.3, k.sted.y);
                mig.tegnK(ctx, k, tid);
            } else {
                oppe.push(function () { mig.tegnK(ctx, k, tid); });
            }
        });

        /* Spanden foran bordet og det, der ligger paa gulvet */
        NK.Sprites.tegnPositur(ctx, "spand", S.SPAND_P, A.spand);
        this.pytter.forEach(function (p) { if (p.y >= 570) S.tegnPyt(ctx, p); });
        S.tegnSkaar(ctx, this.skaar);

        /* Maalet under det, der traekkes */
        var ht = this.holdt;
        if (ht && ht.flyttet && this.traekMaal && this.traekMaal.type !== "gulv") S.tegnMarkering(ctx, this.traekRekt(this.traekMaal), tid);

        for (i = 0; i < oppe.length; i++) oppe[i]();

        if (this.straale) S.tegnStraale(ctx, this.straale.fra, this.straale.til, this.straale.farve, this.straale.bredde, tid);
        for (i = 0; i < this.flyvende.length; i++) {
            var f = this.flyvende[i];
            ctx.fillStyle = f.farve || "rgba(200, 220, 240, 0.8)";
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r || 2, 0, Math.PI * 2);
            ctx.fill();
        }
        S.tegnDampe(ctx, this.dampe);
        if (this.aflaesning) S.tegnAflaesning(ctx, this.aflaesning.x, this.aflaesning.y, this.aflaesning.tekst, Math.min(1, this.aflaesning.ur * 3));
        if (this.spol) S.tegnAflaesning(ctx, S.UR.x + S.UR.r + 10, S.UR.y, "+" + Math.ceil((300 - this.spol.rest) / 60) + " min", 1);

        /* Luppen, mens der taelles */
        var T = this.taeller;
        this.lupAlfa = NK.mod(this.lupAlfa || 0, T.aktiv !== null ? 1 : 0, 6, 1 / 60);
        if (T.aktiv !== null) this.lupKolbe = T.aktiv;
        if (this.lupAlfa > 0.01 && this.lupKolbe !== undefined) {
            var lk = this.kolber[this.lupKolbe];
            var lro = this.roerPaaKolbe(lk);
            var centrum = lro ? NK.tilVerden(lro.p, A.gaerroer, 56, 48) : NK.tilVerden(lk.p, A.kolbe, 48, 10);
            var rest = T.aktiv !== null ? Math.max(0, Math.ceil(T.slut - this.simTid)) : 0;
            S.tegnLup(ctx, centrum, this.lupAlfa, lk.navn + " · " + rest + " s", function (c, Lp) {
                c.translate(Lp.x, Lp.y);
                c.scale(2.8, 2.8);
                c.translate(-centrum.x, -centrum.y);
                if (lro) S.tegnRoer(c, mig.roerData(lro), tid);
                else mig.tegnK(c, lk, tid);
            });
            if (!hjemme(g.taeller)) this.tegnGenstand(ctx, "taeller", tid);
        }

        /* Handsken om det, der traekkes */
        var greb = ht && ht.flyttet ? { x: ht.sidst.x, y: ht.sidst.y + 6, v: 0 } : null;
        this.haandAlfa = NK.mod(this.haandAlfa || 0, greb ? 1 : 0, 10, 1 / 60);
        if (greb) this.sidsteGreb = greb;
        if (this.haandAlfa > 0.01 && this.sidsteGreb) NK.Sprites.tegnPositur(ctx, "haand", this.sidsteGreb, A.haand, this.haandAlfa);

        if (this.tegnLaerer) this.tegnLaerer(ctx, tid);
        if (this.tegnNiller) this.tegnNiller(ctx, tid);
        ctx.restore();
    };
}());
