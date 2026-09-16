/* =====================================================================
   handlinger.js - det, der sker, naar eleven klikker, traekker og slipper

   Genstandene traekkes hen til et maal. Zonerne er ellipser om maalets
   midte; det naermeste gyldige maal vinder. Traek og haeld udfoeres
   altid, ogsaa naar det er forkert: dobbelt gaer, BTB i kolben, for
   meget vand, en kolbe paa gulvet. Kun det, der fysisk ikke kan lade sig
   goere, afvises: at komme noget ned gennem en prop eller at stille to
   ting paa samme plads.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;
    var S = NK.Scene;
    var M = NK.Model;
    var A = S.ANKER;
    var r = NK.r;
    var P = NK.Forsoeg.prototype;

    var PLADE_TRIN = [20, 25, 30, 35, 37, 40, 45, 50, 55, 60, 65, 70, 80, 90];

    function aabning(k) { return NK.tilVerden(k.p, A.kolbe, 48, 0); }

    /* Toppen af gaerroerets aabne ben */
    function roerTop(ro) { return NK.tilVerden(ro.p, A.gaerroer, 69, 12); }

    P.synkRoer = function () {
        for (var i = 0; i < this.roer.length; i++) {
            var ro = this.roer[i];
            if (ro.paa !== null && !ro.flytter && !ro.traekkes) ro.p = S.roerPaaKolbe(this.kolber[ro.paa].p);
        }
    };

    P.friPlads = function (undtagen) {
        for (var i = 0; i < S.PLADS.length; i++) {
            var k = this.kolbePaaPlads(S.PLADS[i]);
            if (!k || k === undtagen) return S.PLADS[i];
        }
        return null;
    };

    P.frittHul = function () {
        for (var i = 0; i < 3; i++) {
            if (!this.roer.some(function (ro) { return ro.slot === i && ro.paa === null; })) return i;
        }
        return 0;
    };

    /* ----- Klik ------------------------------------------------------------ */
    P.klik = function (navn) {
        if (NK.Lyd) NK.Lyd.laasOp();
        if (!navn) return false;
        if (navn === "laerer") return this.klikLaerer ? this.klikLaerer() : false;
        if (navn === "taeller" && this.taeller.aktiv !== null) return this.boble();
        if (navn.indexOf("plade:") === 0) {
            var d = navn.split(":");
            if (d[2]) return this.justerPlade(d[1], d[2] === "plus" ? 1 : -1);
            this.besked("Indstil varmepladen med − og +.");
            return false;
        }
        if (this.optaget()) return false;
        var del = navn.split(":");
        switch (del[0]) {
            case "ur": return this.spolFrem();
            case "kaffekop": return this.klikKop ? this.klikKop() : false;
            case "kolbe": this.besked(this.indholdTekst(this.kolber[+del[1]])); return false;
            case "roer": this.besked(this.roerTekst(this.roer[+del[1]])); return false;
            case "sukker": this.besked("Træk sukkeret hen på en kolbe."); return false;
            case "gaer": this.besked("Træk gæren hen på en kolbe."); return false;
            case "maaleglas": this.besked("Træk måleglasset hen på en kolbe eller et gærrør."); return false;
            case "btb": this.besked("Træk BTB-flasken hen på et gærrør."); return false;
            case "spatel": this.besked("Træk spatlen hen på en kolbe."); return false;
            case "termometer": this.besked("Træk termometeret hen på en kolbe."); return false;
            case "taeller": this.besked("Træk tælleren hen på den kolbe, du vil tælle bobler fra."); return false;
            case "spand": this.besked("Træk en kolbe eller et gærrør hen i spanden for at tømme det."); return false;
            case "baegerglas": this.besked(this.baegerPaaHylde ? "Bægerglasset står på hylden nu." : "Et bægerglas med noget indtørret. Det hører ikke til forsøget."); return false;
            case "kaffe": this.besked(this.g.kaffe.tom ? "Kemi-Nillers kop. Nu er den tom." : "Kemi-Niller glemte sin kaffe."); return false;
        }
        return false;
    };

    P.indholdTekst = function (k) {
        var m = k.m, dele = [];
        if (m.sukker) dele.push(m.sukker + " g sukker");
        if (m.gaer) dele.push(m.gaer + " g gær");
        if (m.vand) dele.push(Math.round(m.vand) + " mL vand");
        if (m.btb) dele.push("BTB");
        return k.navn + ": " + (dele.length ? dele.join(", ") : "tom") + ".";
    };

    P.roerTekst = function (ro) {
        if (ro.m.vand <= 0) return "Gærrør " + ro.nr + ": tomt" + (ro.m.btb ? ", med BTB på glasset." : ".");
        return "Gærrør " + ro.nr + ": vand" + (ro.m.btb ? " med BTB, " + M.btbNavn(M.roerPH(ro.m)) + "." : " uden BTB.");
    };

    P.justerPlade = function (id, retning) {
        var pl = this.plader[id];
        var i = 0;
        while (i < PLADE_TRIN.length - 1 && PLADE_TRIN[i] < pl.indstillet) i++;
        if (PLADE_TRIN[i] !== pl.indstillet && retning < 0) i++;
        i = NK.klamp(i + retning, 0, PLADE_TRIN.length - 1);
        if (PLADE_TRIN[i] === pl.indstillet) return false;
        pl.indstillet = PLADE_TRIN[i];
        if (NK.Lyd) NK.Lyd.klik();
        this.aendret("plade");
        return true;
    };

    /* ----- Traek -------------------------------------------------------------- */
    var MULIGE = {
        sukker: ["kolbe"],
        gaer: ["kolbe"],
        maaleglas: ["kolbe", "roer"],
        btb: ["roer", "kolbe", "baeger"],
        kaffe: ["kolbe"],
        spatel: ["kolbe"],
        termometer: ["kolbe"],
        taeller: ["kolbe"],
        kolbe: ["plads", "spand", "gulv"],
        roer: ["kolbe", "stativ", "spand"]
    };

    P.traekGenstand = function (navn) {
        var d = navn.split(":");
        if (d[0] === "kolbe") return this.kolber[+d[1]];
        if (d[0] === "roer") return this.roer[+d[1]];
        return this.g[navn];
    };

    P.kanTraekke = function (navn) {
        if (!navn || this.optaget()) return false;
        var d = navn.split(":");
        if (d[0] === "taeller") return this.taeller.aktiv === null;
        if (d[0] === "kaffe") return !!this.g.kaffe.findes && !this.g.kaffe.tom;
        if (d[0] === "kolbe") { var k = this.kolber[+d[1]]; return !!k.sted && !k.knust; }
        if (d[0] === "roer") return !this.roer[+d[1]].knust;
        return !!MULIGE[d[0]];
    };

    P.maalZone = function (type, i) {
        switch (type) {
            case "kolbe": var k = this.kolber[i]; return { x: k.p.x, y: k.p.y + 60, rx: 56, ry: 88 };
            case "roer": var ro = this.roer[i], c = NK.tilVerden(ro.p, A.gaerroer, 40, 50); return { x: c.x, y: c.y, rx: 46, ry: 62 };
            case "plads": var pl = S.PLADS[i]; return { x: pl.x, y: pl.y - 60, rx: 54, ry: 84 };
            case "stativ": return { x: S.STATIV.huller[i] + 30, y: S.STATIV.top - 45, rx: 46, ry: 64 };
            case "spand": return { x: S.SPAND_P.x, y: 548, rx: 62, ry: 62 };
            case "baeger": var b = NK.tilVerden(this.g.baegerglas.p, A.baegerglas, 36, 46); return { x: b.x, y: b.y, rx: 46, ry: 62 };
        }
        return null;
    };

    P.traekRekt = function (m) {
        switch (m.type) {
            case "kolbe": return S.rekt("kolbe", this.kolber[m.i].p, A.kolbe, 0);
            case "roer": return S.rekt("gaerroer", this.roer[m.i].p, A.gaerroer, 0);
            case "plads": var pl = S.PLADS[m.i]; return { x: pl.x - 50, y: pl.y - 130, b: 100, h: 132 };
            case "stativ": return { x: S.STATIV.huller[m.i] - 14, y: S.STATIV.top - 98, b: 92, h: 110 };
            case "spand": return { x: S.SPAND_P.x - 44, y: 512, b: 88, h: 86 };
            case "baeger": return S.rekt("baegerglas", this.g.baegerglas.p, A.baegerglas, 0);
        }
        return null;
    };

    P.findMaal = function (navn, pt) {
        var d = navn.split(":");
        var slags = d[0], egen = d[1] === undefined ? -1 : +d[1];
        var liste = MULIGE[slags] || [], bedst = null, afst = Infinity;
        var mig = this;
        function proev(type, i) {
            var z = mig.maalZone(type, i);
            var dx = (pt.x - z.x) / z.rx, dy = (pt.y - z.y) / z.ry;
            var dd = dx * dx + dy * dy;
            if (dd <= 1 && dd < afst) { afst = dd; bedst = { type: type, i: i }; }
        }
        liste.forEach(function (type) {
            var i;
            if (type === "kolbe") {
                for (i = 0; i < 3; i++) {
                    var k = mig.kolber[i];
                    if (!k.sted || k.knust) continue;
                    if (slags === "roer" && k.roer !== null && k.roer !== egen) continue;
                    proev("kolbe", i);
                }
            } else if (type === "roer") {
                for (i = 0; i < 3; i++) if (!mig.roer[i].knust) proev("roer", i);
            } else if (type === "plads") {
                for (i = 0; i < S.PLADS.length; i++) {
                    var paa = mig.kolbePaaPlads(S.PLADS[i]);
                    if (!paa || paa.i === egen) proev("plads", i);
                }
            } else if (type === "stativ") {
                for (i = 0; i < 3; i++) {
                    var optaget = mig.roer.some(function (x) { return x.i !== egen && x.paa === null && x.slot === i; });
                    if (!optaget) proev("stativ", i);
                }
            } else if (type === "baeger") {
                if (!mig.baegerPaaHylde && !mig.g.baegerglas.btb) proev("baeger", 0);
            } else if (type === "spand") {
                proev("spand", 0);
            }
        });
        if (!bedst && liste.indexOf("gulv") >= 0 && pt.y > S.BORD + 40) bedst = { type: "gulv", i: 0 };
        return bedst;
    };

    P.slipTil = function (navn, m, pt) {
        var d = navn.split(":");
        var k = m.type === "kolbe" ? this.kolber[m.i] : null;
        var ro = m.type === "roer" ? this.roer[m.i] : null;
        switch (d[0]) {
            case "sukker": return this.drys(k, "sukker");
            case "gaer": return this.drys(k, "gaer");
            case "maaleglas": return k ? this.haeldVand(k) : this.haeldVandRoer(ro);
            case "btb": return m.type === "baeger" ? this.btbIBaeger() : (k ? this.btbIKolbe(k) : this.btbIRoer(ro));
            case "spatel": return this.roerRundt(k);
            case "termometer": return this.maalTemp(k);
            case "taeller": return this.taellerPaa(k);
            case "kaffe": return this.kaffeIKolbe(k);
            case "kolbe":
                var kk = this.kolber[+d[1]];
                if (m.type === "plads") return this.flytKolbe(kk, S.PLADS[m.i]);
                if (m.type === "spand") return this.kolbeISpand(kk);
                if (m.type === "gulv") return this.tabKolbe(kk, pt);
                return false;
            case "roer":
                var rr = this.roer[+d[1]];
                if (m.type === "kolbe") return this.saetRoerPaa(rr, this.kolber[m.i]);
                if (m.type === "stativ") return this.roerIStativ(rr, m.i);
                if (m.type === "spand") return this.roerISpand(rr);
                return false;
        }
        return false;
    };

    /* Proppen spaerrer kolbens hals: det eneste, der afvises */
    P.proppet = function (k, hvad) {
        if (k.roer === null) return false;
        this.besked("Gærrøret sidder i " + k.navn.toLowerCase() + ". " + hvad, "advarsel");
        this.markér("kolbe:" + k.i, 2);
        return true;
    };

    /* ----- Sukker og gaer --------------------------------------------------- */
    P.drys = function (k, hvad) {
        if (this.proppet(k, "Tag det af først.")) return false;
        var gg = this.g[hvad];
        var farve = hvad === "sukker" ? "#f4f6f8" : "#caa56a";
        this.koer([
            { flyt: gg, til: function () { var a = aabning(k); return { x: a.x - 8, y: a.y - 18, v: hvad === "sukker" ? 1.95 : 2.25 }; }, tid: 0.8, loeft: 50 },
            { kald: function () { if (NK.Lyd) NK.Lyd.drys(1); } },
            { tid: 1.0, hver: function () {
                if (Math.random() < 0.8) {
                    var spids = NK.tilVerden(gg.p, gg.anker, gg.anker.x, gg.anker.y);
                    var bund = k.niveau !== null ? k.niveau : NK.tilVerden(k.p, A.kolbe, 48, 118).y;
                    this.flyvende.push({ x: spids.x + r(-2, 2), y: spids.y, vx: r(10, 30), vy: r(0, 40), a: 0, r: r(1, 2), farve: farve, bund: bund });
                }
            } },
            { kald: function () {
                var m = k.m;
                if (hvad === "sukker") { M.blandTemp(m, 16, M.RUM); m.sukker += M.PORTION.sukker; }
                else { M.blandTemp(m, 18, M.RUM); m.gaer += M.PORTION.gaer; if (m.gaer > M.PORTION.gaer) this.iagttag("dobbeltGaer", true); }
                if (m.sukker > M.PORTION.sukker && hvad === "sukker") this.iagttag("dobbeltSukker", true);
                m.roert = false;
                this.aendret(hvad);
            } },
            this.hjemTil(gg, 0.8, 50)
        ], hvad);
        return true;
    };

    /* ----- Vand ------------------------------------------------------------ */
    P.haeldVand = function (k) {
        if (this.proppet(k, "Der kan ikke hældes vand i.")) return false;
        var gg = this.g.maaleglas, m = k.m, haeldt = 0, spildt = 0;
        this.koer([
            { flyt: gg, til: function () { var a = aabning(k); return { x: a.x - 6, y: a.y - 20, v: 1.95 }; }, tid: 0.8, loeft: 50 },
            { kald: function () { if (NK.Lyd) NK.Lyd.haeld(1.3); } },
            { tid: 1.3, hver: function (t) {
                var nu = M.PORTION.vand * NK.blod(t);
                var plads = Math.max(0, M.GRAENSE.kolbe - M.rumfang(m));
                var ind = Math.min(plads, nu - haeldt - spildt);
                if (ind > 0) { M.blandTemp(m, ind, M.RUM); m.vand += ind; }
                spildt += (nu - haeldt - spildt) - Math.max(0, ind);
                haeldt += Math.max(0, ind);
                var spids = NK.tilVerden(gg.p, gg.anker, 8, 6);
                this.straale = { fra: spids, til: { x: k.p.x + 2, y: k.niveau !== null ? k.niveau : k.p.y + 118 }, farve: M.FARVE.vand, bredde: 3 };
                if (spildt > 1) {
                    if (!k.pyt) { k.pyt = { x: k.p.x, y: k.sted ? k.sted.y : S.BORD, rx: 8, alfa: 1, farve: { r: 190, g: 222, b: 244, a: 0.6 } }; this.pytter.push(k.pyt); }
                    k.pyt.rx = Math.min(60, 8 + spildt * 0.9);
                    if (Math.random() < 0.5) {
                        var a = aabning(k);
                        this.flyvende.push({ x: a.x + r(-12, 12), y: a.y + 4, vx: r(-60, 60), vy: r(-20, 20), a: 0, r: 1.6, farve: "rgba(190, 222, 244, 0.9)", bund: k.sted ? k.sted.y : S.BORD });
                    }
                }
            } },
            { kald: function () {
                this.straale = null;
                m.roert = false;
                if (spildt > 1) {
                    k.pyt = null;
                    this.iagttag("overloeb");
                    if (this.laererOverloeb) this.laererOverloeb(k);
                }
                this.aendret("vand");
            } },
            this.hjemTil(gg, 0.8, 50)
        ], "vand");
        return true;
    };

    P.haeldVandRoer = function (ro) {
        var gg = this.g.maaleglas, foer = ro.m.vand;
        this.koer([
            { flyt: gg, til: function () { var t = roerTop(ro); return { x: t.x - 4, y: t.y - 16, v: 1.95 }; }, tid: 0.8, loeft: 40 },
            { kald: function () { if (NK.Lyd) NK.Lyd.haeld(0.5); } },
            { tid: 0.6, hver: function () {
                var spids = NK.tilVerden(gg.p, gg.anker, 8, 6);
                var t = roerTop(ro);
                this.straale = { fra: spids, til: { x: t.x, y: t.y + 20 }, farve: M.FARVE.vand, bredde: 2 };
            } },
            { kald: function () {
                this.straale = null;
                ro.m.vand = Math.min(M.GRAENSE.roer, foer + M.PORTION.roerVand);
                if (foer + M.PORTION.roerVand > M.GRAENSE.roer) {
                    ro.overloeb = 1;
                    var t = roerTop(ro);
                    this.pytter.push({ x: t.x + 6, y: ro.paa === null ? S.HYLDE_H.y : this.kolber[ro.paa].sted ? this.kolber[ro.paa].sted.y : S.BORD, rx: 16, alfa: 1, farve: M.roerFarve(ro.m) || M.FARVE.vand });
                    this.iagttag("roerOverloeb", true);
                }
                this.aendret("roerVand");
            } },
            this.hjemTil(gg, 0.8, 40)
        ], "roerVand");
        return true;
    };

    /* ----- BTB -------------------------------------------------------------- */
    P.btbDraaber = function (til, farve) {
        var gg = this.g.btb;
        var mig = this;
        return { tid: 0.9, hver: function (t, tt) {
            var n = Math.floor(tt / 0.3);
            if (n > (this.btbN || 0) - 1 && n < 3) {
                mig.btbN = n + 1;
                var spids = NK.tilVerden(gg.p, gg.anker, 17, 2);
                this.flyvende.push({ x: spids.x, y: spids.y + 2, vx: 0, vy: 20, a: 0, r: 2, farve: farve, bund: til() });
                if (NK.Lyd) NK.Lyd.plip();
            }
        } };
    };

    /* Flasken kan vaere toemt i baegerglasset, indtil Kemi-Niller kommer */
    P.btbSkalHaves = function () {
        if (!this.btbTom) return true;
        this.besked("BTB-flasken er tom.", "advarsel");
        return false;
    };

    P.btbIRoer = function (ro) {
        if (!this.btbSkalHaves()) return false;
        var gg = this.g.btb;
        this.btbN = 0;
        this.koer([
            { flyt: gg, til: function () { var t = roerTop(ro); return { x: t.x, y: t.y - 30, v: Math.PI }; }, tid: 0.8, loeft: 40 },
            this.btbDraaber(function () { return roerTop(ro).y + 30; }, "rgba(40, 100, 210, 0.95)"),
            { kald: function () { ro.m.btb += M.PORTION.btb; this.aendret("btb"); } },
            this.hjemTil(gg, 0.8, 40)
        ], "btb");
        return true;
    };

    P.btbIKolbe = function (k) {
        if (!this.btbSkalHaves()) return false;
        if (this.proppet(k, "BTB kan ikke komme ned gennem proppen.")) return false;
        var gg = this.g.btb;
        this.btbN = 0;
        this.koer([
            { flyt: gg, til: function () { var a = aabning(k); return { x: a.x, y: a.y - 26, v: Math.PI }; }, tid: 0.8, loeft: 40 },
            this.btbDraaber(function () { return k.niveau !== null ? k.niveau : k.p.y + 118; }, "rgba(40, 100, 210, 0.95)"),
            { kald: function () { k.m.btb += M.PORTION.btb; this.iagttag("btbKolbe", true); this.aendret("btb"); } },
            this.hjemTil(gg, 0.8, 40)
        ], "btbKolbe");
        return true;
    };

    /* Paaskeaeg: de sidste draaber BTB i det gamle baegerglas. Det saetter
       historien med SM-Simon og Kemi-Niller i gang (js/laerer.js). */
    P.btbIBaeger = function () {
        if (!this.btbSkalHaves()) return false;
        var gg = this.g.btb, b = this.g.baegerglas;
        this.btbN = 0;
        this.koer([
            { flyt: gg, til: function () { var t = NK.tilVerden(b.p, A.baegerglas, 36, 0); return { x: t.x, y: t.y - 26, v: Math.PI }; }, tid: 0.8, loeft: 40 },
            this.btbDraaber(function () { return NK.tilVerden(b.p, A.baegerglas, 36, 82).y; }, "rgba(40, 110, 205, 0.95)"),
            { kald: function () {
                b.btb += M.PORTION.btb;
                this.btbTom = true;
                this.aendret("baeger");
            } },
            this.hjemTil(gg, 0.8, 40),
            { kald: function () { if (this.laererBaeger) this.laererBaeger(); } }
        ], "baegerBtb");
        return true;
    };

    /* Kemi-Nillers glemte kaffe kan haeldes i en kolbe */
    P.kaffeIKolbe = function (k) {
        if (this.proppet(k, "Kaffen kan ikke komme ned gennem proppen.")) return false;
        var gg = this.g.kaffe, m = k.m, haeldt = 0;
        this.koer([
            { flyt: gg, til: function () { var a = aabning(k); return { x: a.x - 4, y: a.y - 20, v: 2.1 }; }, tid: 0.8, loeft: 50 },
            { kald: function () { if (NK.Lyd) NK.Lyd.haeld(1); } },
            { tid: 1.0, hver: function (t) {
                var nu = M.PORTION.kaffe * NK.blod(t);
                var ind = Math.min(nu - haeldt, Math.max(0, M.GRAENSE.kolbe - M.rumfang(m)));
                haeldt = nu;
                if (ind > 0) { M.blandTemp(m, ind, 55); m.vand += ind; m.kaffe += ind; }
                var spids = NK.tilVerden(gg.p, gg.anker, 22, 6);
                this.straale = { fra: spids, til: { x: k.p.x + 2, y: k.niveau !== null ? k.niveau : k.p.y + 118 }, farve: M.FARVE.kaffe, bredde: 2.6 };
            } },
            { kald: function () {
                this.straale = null;
                m.roert = false;
                gg.tom = true;
                this.iagttag("kaffeIKolbe", true);
                this.aendret("kaffe");
            } },
            this.hjemTil(gg, 0.8, 50)
        ], "kaffe");
        return true;
    };

    /* ----- Spatel og termometer -------------------------------------------- */    P.roerRundt = function (k) {
        if (this.proppet(k, "Spatlen kan ikke komme ned gennem proppen.")) return false;
        var gg = this.g.spatel;
        function inde() { return NK.tilVerden(k.p, A.kolbe, 48, 112); }
        this.koer([
            { flyt: gg, til: function () { var a = aabning(k); return { x: a.x, y: a.y - 20, v: 0 }; }, tid: 0.8, loeft: 50 },
            { flyt: gg, til: function () { var p = inde(); return { x: p.x, y: p.y, v: 0.12 }; }, tid: 0.4, loeft: 0 },
            { tid: 1.6, hver: function (t) {
                var p = inde();
                gg.p.x = p.x + Math.sin(t * Math.PI * 8) * 14;
                gg.p.y = p.y;
                gg.p.v = Math.sin(t * Math.PI * 8) * 0.22;
                k.boelge = 1.5 * Math.sin(Math.PI * t);
            } },
            { kald: function () {
                k.boelge = 0;
                if (k.m.vand > 0 && (k.m.sukker > 0 || k.m.gaer > 0)) k.m.roert = true;
                if (NK.Lyd) NK.Lyd.klirr();
                this.aendret("roert");
            } },
            { flyt: gg, til: function () { var a = aabning(k); return { x: a.x, y: a.y - 20, v: 0 }; }, tid: 0.4, loeft: 0 },
            this.hjemTil(gg, 0.8, 50)
        ], "roert");
        return true;
    };

    P.maalTemp = function (k) {
        if (this.proppet(k, "Termometeret kan ikke komme ned gennem proppen.")) return false;
        var gg = this.g.termometer;
        function inde() { return NK.tilVerden(k.p, A.kolbe, 44, 114); }
        this.koer([
            { flyt: gg, til: function () { var a = aabning(k); return { x: a.x, y: a.y - 20, v: 0 }; }, tid: 0.8, loeft: 50 },
            { flyt: gg, til: function () { var p = inde(); return { x: p.x, y: p.y, v: 0.1 }; }, tid: 0.4, loeft: 0 },
            { tid: 1.4, hver: function () { var p = inde(); gg.p.x = p.x; gg.p.y = p.y; } },
            { kald: function () {
                k.maaltTemp = Math.round(k.m.temp);
                var a = aabning(k);
                this.aflaesning = { x: a.x + 14, y: a.y - 60, tekst: k.maaltTemp + " °C", ur: 2.6 };
                if (NK.Lyd) NK.Lyd.bip();
                this.maal("temp", k.i);
                this.aendret("temp");
            } },
            { flyt: gg, til: function () { var a = aabning(k); return { x: a.x, y: a.y - 20, v: 0 }; }, tid: 0.4, loeft: 0 },
            this.hjemTil(gg, 0.8, 50)
        ], "maal");
        return true;
    };

    /* ----- Taelleren ----------------------------------------------------------- */
    P.taellerPaa = function (k) {
        var gg = this.g.taeller;
        var L = S.LUP;
        this.koer([
            { flyt: gg, til: { x: L.x + L.r * 0.78, y: L.y + L.r * 0.95, v: -0.2 }, tid: 0.8, loeft: 40 },
            { kald: function () { this.startTaelling(k); } }
        ], "taeller");
        return true;
    };

    /* ----- Kolberne ------------------------------------------------------------ */
    P.flytKolbe = function (k, plads) {
        var andre = this.kolbePaaPlads(plads);
        if (andre && andre !== k) return false;
        k.sted = null;
        this.koer([
            { flyt: k, til: S.kolbePaa(plads), tid: 0.5, loeft: 10 },
            { kald: function () {
                k.sted = plads;
                if (NK.Lyd) NK.Lyd.klirr();
                var pl = this.pladeFor(k);
                if (pl && pl.indstillet <= M.RUM) { this.besked("Varmepladen er slukket. Indstil den med +."); this.markér("plade:" + plads.id, 3); }
                this.aendret("flyt");
            } }
        ], "flyt");
        return true;
    };

    P.kolbeISpand = function (k) {
        var mig = this;
        var fra = k.sted;
        var ro = this.roerPaaKolbe(k);
        k.sted = null;
        if (this.taeller.aktiv === k.i) this.afbrydTaelling("Tællingen stoppede. Kolben blev tømt.");
        this.koer([
            { flyt: k, til: { x: S.SPAND_P.x - 30, y: 440, v: 2.3 }, tid: 0.7, loeft: 30 },
            { kald: function () { if (NK.Lyd) NK.Lyd.haeld(0.8); } },
            { tid: 0.8, hver: function (t) {
                k.m.vand *= 1 - t * 0.5;
                if (ro) { ro.m.vand = 0; }
            } },
            { kald: function () {
                var nr = k.i;
                var ny = mig.nyKolbe(nr, fra);
                k.m = ny.m;
                k.maaltTemp = null;
                k.taelling = null;
                k.bobler = [];
                if (ro) {
                    ro.paa = null; k.roer = null;
                    ro.m = M.nytRoer(); ro.bobler = [];
                    ro.slot = mig.frittHul();
                    ro.p = S.roerIStativ(ro.slot);
                }
                this.aendret("spand");
            } },
            { flyt: k, til: function () { var pl = mig.kolbePaaPlads(fra) ? mig.friPlads(k) : fra; k.nyPlads = pl; return S.kolbePaa(pl); }, tid: 0.8, loeft: 40 },
            { kald: function () { k.sted = k.nyPlads; if (NK.Lyd) NK.Lyd.klirr(); this.aendret("flyt"); } }
        ], "spand");
        return true;
    };

    /* Uheld: kolben slippes foran bordet og knuses paa gulvet */
    P.tabKolbe = function (k, pt) {
        var ro = this.roerPaaKolbe(k);
        var x = NK.klamp(pt.x, 40, 960);
        if (this.taeller.aktiv === k.i) this.afbrydTaelling();
        k.sted = null;
        k.falder = true;
        k.skaarX = x;
        this.koer([
            { tid: 0.25, hver: function (t) { k.p.y += 600 * t * 0.05; k.p.v += 0.08; } },
            { kald: function () {
                var i;
                k.falder = false;
                k.knust = true;
                if (NK.Lyd) NK.Lyd.knus();
                for (i = 0; i < 14; i++) this.skaar.push({ x: x + r(-50, 50), y: r(574, 596), a: r(0, 6.3), s: r(0.6, 1.4) });
                for (i = 0; i < 12; i++) this.flyvende.push({ x: x, y: 580, vx: r(-160, 160), vy: -r(100, 260), a: 0, r: r(1.4, 2.4), farve: "rgba(214, 190, 140, 0.9)", bund: 598 });
                this.pytter.push({ x: x, y: 592, rx: 50, alfa: 1, farve: M.kolbeFarve(k.m) || { r: 190, g: 222, b: 244, a: 0.6 } });
                if (ro) {
                    ro.knust = true;
                    ro.paa = null;
                    k.roer = null;
                    for (i = 0; i < 6; i++) this.skaar.push({ x: x + r(-30, 30), y: r(578, 596), a: r(0, 6.3), s: r(0.4, 0.8) });
                }
                this.iagttag("tabt");
                this.aendret("tabt");
                if (this.laererTabt) this.laererTabt(k, ro);
            } }
        ], "tabt");
        return true;
    };

    /* Laereren stiller en ny, tom kolbe (og et nyt gaerroer) frem */
    P.erstatKolbe = function (k, ro) {
        var plads = this.friPlads(null);
        var ny = this.nyKolbe(k.i, plads);
        Object.keys(ny).forEach(function (n) { k[n] = ny[n]; });
        k.knust = false;
        if (ro) {
            ro.knust = false;
            ro.m = M.nytRoer();
            ro.bobler = [];
            ro.slot = this.frittHul();
            ro.p = S.roerIStativ(ro.slot);
        }
        this.skaar = [];
        this.pytter = this.pytter.filter(function (p) { return p.y < 570; });
        this.aendret("erstat");
    };

    /* ----- Gaerroerene ----------------------------------------------------------- */
    P.saetRoerPaa = function (ro, k) {
        if (k.roer !== null && k.roer !== ro.i) return false;
        if (ro.paa !== null && ro.paa !== k.i) this.kolber[ro.paa].roer = null;
        ro.flytter = true;
        this.koer([
            { flyt: ro, til: function () { return S.roerPaaKolbe(k.p); }, tid: 0.6, loeft: 20 },
            { kald: function () {
                ro.flytter = false;
                ro.paa = k.i;
                ro.slot = null;
                k.roer = ro.i;
                if (NK.Lyd) NK.Lyd.klirr();
                var m = k.m;
                if (m.vand > 0 || m.sukker > 0 || m.gaer > 0) {
                    if (m.sukker <= 0) this.iagttag("ingenSukker", true);
                    else if (m.gaer <= 0) this.iagttag("ingenGaer", true);
                    else if (m.vand <= 0) this.iagttag("ingenVand", true);
                    else if (!m.roert) this.iagttag("ikkeRoert");
                }
                if (ro.m.vand <= 0) this.iagttag("tomtRoer", true);
                this.aendret("prop");
            } }
        ], "prop");
        return true;
    };

    P.roerIStativ = function (ro, slot) {
        if (ro.paa !== null) { this.kolber[ro.paa].roer = null; if (this.taeller.aktiv === ro.paa) this.afbrydTaelling("Tællingen stoppede. Gærrøret blev taget af."); }
        ro.paa = null;
        ro.flytter = true;
        this.koer([
            { flyt: ro, til: S.roerIStativ(slot), tid: 0.6, loeft: 20 },
            { kald: function () { ro.flytter = false; ro.slot = slot; if (NK.Lyd) NK.Lyd.klirr(); this.aendret("stativ"); } }
        ], "stativ");
        return true;
    };

    P.roerISpand = function (ro) {
        var mig = this;
        if (ro.paa !== null) { this.kolber[ro.paa].roer = null; if (this.taeller.aktiv === ro.paa) this.afbrydTaelling(); }
        ro.paa = null;
        ro.flytter = true;
        this.koer([
            { flyt: ro, til: { x: S.SPAND_P.x - 10, y: 470, v: 2.6 }, tid: 0.7, loeft: 30 },
            { tid: 0.5 },
            { kald: function () { ro.m = M.nytRoer(); ro.bobler = []; ro.slot = mig.frittHul(); } },
            { flyt: ro, til: function () { return S.roerIStativ(ro.slot); }, tid: 0.8, loeft: 40 },
            { kald: function () { ro.flytter = false; this.aendret("stativ"); } }
        ], "roerSpand");
        return true;
    };
}());
