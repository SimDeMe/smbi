/* =====================================================================
   laerer.js - SM-Simon i gaerforsoeget

   Selve figuren (gang, arm, ansigt, tale, krusset og klik paa ham) staar
   i simon/simon.js. Her staar de scener, der hoerer til dette forsoeg.

   Uheld og bemaerkninger:
     overloeb   for meget vand i en kolbe: han toerrer bordet af
     tabt       en kolbe paa gulvet: han fejer op og stiller en ny frem
     bemaerk    en fejl, han lader ske og kommenterer (BEMAERK), ofte med
                et vink om at starte et nyt forsoeg
     slut       et resultat, der passer: "Det hæver."

   Glimt af baggrunden: boller (nul bobler), flodboelge (overloebet),
   simulering (kolben paa gulvet), skaeg (rosen) og regnskabet over uheld.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;
    var Si = NK.Simon;
    var S = NK.Scene;
    var P = NK.Forsoeg.prototype;

    var UDE = NK.Figur.UDE;
    var HAENGER = NK.Figur.HAENGER;
    var KAFFE_X = 170;

    /* Begge laerere bruger den samme figur: SM-Simon som "laerer" og
       Kemi-Niller som "niller". */
    NK.Figur.paa(P, NK.Simon.cfg);
    NK.Figur.paa(P, NK.Niller.cfg);

    P.laererStartEkstra = function () {
        this.antalNyt = 0;
        this.bemaerket = {};
        this.bemaerkKoe = [];
        this.nillerSpurgt = false;
        this.simonSvaret = false;
        this.nillerFaerdig = false;
        this.nillerStart();
    };

    P.laererNytEkstra = function () {
        this.bemaerket = {};
        this.bemaerkKoe = [];
        this.laerer.baerer = null;
        this.nillerNyt();
    };

    /* Kemi-Niller foelger med i hvert billede */
    P.opdaterLaererEkstra = function (dt) {
        this.opdaterNiller(dt);
    };

    P.laererVentende = function () {
        if (this.laerer.scene) return;
        while (this.bemaerkKoe.length && !this.laerer.scene) {
            var id = this.bemaerkKoe.shift();
            if (this.bemaerket[id]) continue;
            this.laererBemaerk(id);
        }
    };

    function staaVed(x) { return NK.klamp(x - 160, 40, 780); }

    /* ----- Krusset paa hylden -------------------------------------------- */
    P.klikKop = function () {
        var L = this.laerer, kop = this.g.kaffekop;
        if (L.scene || kop.skjult) return false;
        var kold = Si.glimt("kaffeKold");
        this.laererKoer("kaffe", [
            { udtryk: { vrede: 0.7, humoer: -0.4, roed: 0.1 } },
            { gaa: KAFFE_X },
            { sig: "Det er mit krus.", vis: 2.2, tid: 0.3 },
            { arm: -0.5, tid: 0.55 },
            { kald: function () { kop.iHaand = true; this.laerer.baerer = "simonKop"; } },
            { arm: -0.98, tid: 0.6 },
            { kald: function () { if (NK.Lyd) NK.Lyd.slurk(); } }
        ].concat(kold ? [
            { udtryk: { vrede: 0.2, humoer: -0.3, roed: 0 } },
            { tid: 0.5 },
            Si.suk(1.1),
            { sig: kold, vis: 2.2, tid: 1.8 }
        ] : [
            { udtryk: { vrede: 0, humoer: 0.6, roed: 0 } },
            { tid: 1.0 },
            { sig: "Ahh.", vis: 1.3, tid: 1.1 }
        ], [
            { kald: function () { kop.skjult = true; this.koppenVaek = true; } },
            { arm: -0.3, tid: 0.4 },
            { gaa: UDE },
            { kald: function () { this.laerer.baerer = null; } }
        ]));
        return true;
    };

    /* ----- Paaskeaeg: baegerglasset, den tomme flaske og Kemi-Niller -----
       Dryppes der BTB i det gamle baegerglas, stiller SM-Simon det op paa
       hylden, opdager at flasken er tom og kalder paa en kemilaerer.
       Scenen blokerer ikke: eleven kan arbejde videre imens. */
    P.laererBaeger = function () {
        var mig = this;
        var L = this.laerer;
        var b = this.g.baegerglas;
        if (!L || this.baegerHistorie) return false;
        this.baegerHistorie = true;
        L.scene = null;
        this.laererKoer("baeger", [
            { udtryk: { vrede: 0.5, humoer: -0.2, roed: 0.05, skeptisk: 1, kig: 1 } },
            { gaa: staaVed(b.p.x) },
            { sig: "Det bægerglas er ikke en del af forsøget.", vis: 2.8, tid: 0.4 },
            { udtryk: { skeptisk: 0, kig: 0 } },
            { sig: "Det stod her i forvejen.", vis: 2.4, tid: 2.2 },
            { arm: 1.9, tid: 0.5 },
            { kald: function () { this.laerer.baerer = "baegerglas"; if (NK.Lyd) NK.Lyd.klirr(); } },
            { arm: 2.3, tid: 0.4 },
            { gaa: 150 },
            { arm: -0.7, tid: 0.7 },
            { kald: function () {
                this.laerer.baerer = null;
                this.baegerPaaHylde = true;
                b.p = { x: S.BAEGER_HYLDE.x, y: S.BAEGER_HYLDE.y, v: 0 };
                if (NK.Lyd) NK.Lyd.klirr();
                this.aendret("baeger");
            } },
            { arm: HAENGER, tid: 0.4 },
            { sig: "Det kan stå deroppe. Jeg skyller det i morgen.", vis: 3, tid: 2.8 }
        ].concat(Si.glimtTrin("rod"), [
            { udtryk: { vrede: 0.7, humoer: -0.5 } },
            { gaa: 250 },
            { sig: "Og nu er BTB-flasken tom.", vis: 2.6, tid: 2.4 },
            Si.suk(),
            { gaa: 90 },
            { sig: "Er der en kemilærer?", vis: 2.6, tid: 1.4 },
            { arm: 0.3, tid: 0.4 },
            { kald: function () { mig.nillerKommer(); } },
            { arm: HAENGER, tid: 0.6 },
            { vent: "niller", tid: 0.8 },
            { sig: "Vi mangler BTB.", vis: 2.2, tid: 2.4 },
            /* Han svarer foerst, naar Kemi-Niller har spurgt faerdig */
            { naar: function () { return this.nillerSpurgt; }, vent: "niller", tid: 0.9 },
            { udtryk: { skeptisk: 0.6 } },
            { sig: "Det lyder rigtigt nok.", vis: 2.4, tid: 2.8 },
            { kald: function () { this.simonSvaret = true; } },
            { udtryk: { skeptisk: 0 } }
        ], Si.glimtTrin("kemi"), [
            { naar: function () { return this.nillerFaerdig; }, vent: "niller", tid: 1.0 },
            { sig: "Tak. Så kan vi komme videre.", vis: 2.4, tid: 3.4 },
            { udtryk: { kig: 1 } },
            { sig: "Han glemte sin kaffe.", vis: 2.6, tid: 2.6 },
            { udtryk: { kig: 0 } },
            { gaa: UDE }
        ]), false);
        return true;
    };

    /* Kemi-Niller kommer ind med en ny flaske og sin egen kaffe */
    P.nillerKommer = function () {
        var N = this.niller;
        if (!N) return false;
        N.baerer = "nillerKop";
        this.nillerKoer("besoeg", [
            { gaa: 340 },
            { vent: "laerer", tid: 0.6 },
            { sig: "BTB? Det har jeg aldrig hørt om.", vis: 3, tid: 3.4 },
            { udtryk: { skeptisk: 0.8, kig: 1 } },
            { sig: "Mener du bromthymolblåt?", vis: 3, tid: 3.4 },
            { kald: function () { this.nillerSpurgt = true; } },
            /* Han venter paa SM-Simons svar */
            { naar: function () { return this.simonSvaret; }, vent: "laerer", tid: 0.8 },
            { udtryk: { skeptisk: 0, kig: 0, humoer: 0.6 } },
            { sig: "Så siger vi det. Jeg har en flaske.", vis: 2.8, tid: 2.6 },
            /* Kaffen saettes fra, saa han kan tage flasken frem */
            { arm: 1.9, tid: 0.6 },
            { kald: function () {
                this.niller.baerer = null;
                this.kaffeFindes = true;
                this.g.kaffe.findes = true;
                this.g.kaffe.tom = false;
                this.g.kaffe.p = { x: S.HJEM.kaffe.x, y: S.HJEM.kaffe.y, v: 0 };
                if (NK.Lyd) NK.Lyd.klirr();
                this.aendret("kaffe");
            } },
            { arm: 0.8, tid: 0.5 },
            /* Han tager den tomme flaske med og stiller en ny paa pladsen */
            { kald: function () { this.niller.baerer = "btb"; this.g.btb.skjult = true; } },
            { gaa: function () { return S.HJEM.btb.x + 96; } },
            { arm: 1.8, tid: 0.6 },
            { kald: function () {
                this.niller.baerer = null;
                this.g.btb.skjult = false;
                this.g.btb.p = { x: S.HJEM.btb.x, y: S.HJEM.btb.y, v: 0 };
                this.btbTom = false;
                if (NK.Lyd) NK.Lyd.klirr();
                this.aendret("btb");
            } },
            { arm: HAENGER, tid: 0.4 },
            { sig: "Værsgo. Bromthymolblåt.", vis: 2.6, tid: 2.6 },
            { udtryk: { humoer: 0.8 } },
            { sig: "Sig til, hvis I mangler mere.", vis: 2.4, tid: 2.4 },
            { kald: function () { this.nillerFaerdig = true; } },
            { gaa: UDE }
        ], false);
        return true;
    };

    /* ----- For meget vand i kolben: han toerrer bordet af ---------------- */
    P.laererOverloeb = function (k) {
        var L = this.laerer;
        var mig = this;
        var pytter = this.pytter.filter(function (p) { return p.y < 570; });
        if (!L) return false;
        L.scene = null;
        this.laererKoer("overloeb", [
            { tid: 0.2 },
            { udtryk: { vrede: 0.8, humoer: -0.6, roed: 0.2, kig: 1 } },
            { gaa: staaVed(k.p.x) },
            { sig: "Kolben rummer 250 mL. Ikke 300.", vis: 2.6, tid: 0.3 },
            { udtryk: { kig: 0 } },
            { arm: 1.8, tid: 0.5 },
            { kald: function () { this.laerer.baerer = "papir"; } },
            { tid: 1.8, hver: function (t) {
                this.laerer.arm = 1.8 + Math.sin(t * Math.PI * 7) * 0.14;
                pytter.forEach(function (p) { p.alfa = 1 - t; });
                if (t >= 0.99) mig.pytter = mig.pytter.filter(function (p) { return p.alfa > 0.02; });
            } },
            { kald: function () { this.laerer.baerer = null; if (NK.Lyd) NK.Lyd.brum(); } },
            { arm: HAENGER, tid: 0.4 }
        ].concat(Si.glimtTrin("flodboelge"), Si.uheld(), [
            { gaa: UDE }
        ]));
        return true;
    };

    /* ----- Kolben paa gulvet: han fejer op og stiller en ny frem ---------- */
    P.laererTabt = function (k, ro) {
        var L = this.laerer;
        var mig = this;
        if (!L) return false;
        L.scene = null;
        var x = k.skaarX;
        this.laererKoer("tabt", [
            { udtryk: { vrede: 0.9, humoer: -0.8, roed: 0.35 } },
            { gaa: staaVed(x), loeb: true },
            { sig: "Glas bæres med to hænder.", vis: 2.6, tid: 0.3 },
            { arm: -0.15, tid: 0.4, hver: function () { this.laerer.plakatRegel = 2; } },
            { tid: 2.0, hver: function (t) { this.laerer.arm = -0.15 + Math.sin(t * Math.PI * 6) * 0.1; } },
            { kald: function () { this.laerer.plakatRegel = 0; this.laerer.baerer = "kost"; } },
            { arm: 2.1, tid: 0.5 },
            { tid: 2.0, hver: function (t) {
                this.laerer.arm = 2.1 + Math.sin(t * Math.PI * 8) * 0.22;
                mig.skaar.forEach(function (s) { s.alfa = 1 - t; });
                mig.pytter.forEach(function (p) { if (p.y >= 570) p.alfa = 1 - t; });
            } },
            { kald: function () {
                this.laerer.baerer = null;
                this.erstatKolbe(k, ro);
                if (NK.Lyd) NK.Lyd.klirr();
            } },
            { arm: HAENGER, tid: 0.4 },
            Si.suk(),
            { sig: ro ? "Ny kolbe og nyt gærrør. Tom, selvfølgelig." : "Her er en ny kolbe. Tom, selvfølgelig.", vis: 2.8, tid: 2.6 }
        ].concat(Si.glimtTrin("simulering"), Si.uheld(), [
            { gaa: UDE }
        ]));
        return true;
    };

    /* ----- Forsoeget er slut --------------------------------------------- */
    P.laererSlut = function () {
        var L = this.laerer;
        if (!L || L.scene || L.rost) return;
        var res = this.resultater[this.resultater.length - 1];
        var raekker = res.raekker.slice().sort(function (a, b) { return a.temp - b.temp; });
        var kold = raekker[0], lun = raekker[1], varm = raekker[2];
        var passer = lun.temp >= 30 && lun.temp <= 45 && varm.temp >= 50 &&
            lun.bobler > kold.bobler && varm.bobler < lun.bobler && !this.iagttaget.luftbobler;
        if (!passer) return;
        L.rost = true;
        this.laererKoer("ros", [
            { udtryk: { vrede: 0, humoer: 0.9, roed: 0 } },
            { gaa: 160 },
            { tid: 0.3 },
            { sig: "Det hæver.", vis: 1.8, tid: 1.8, hver: function (t) { this.laerer.nik = Math.sin(t * Math.PI * 3) * 5; } },
            { kald: function () { this.laerer.nik = 0; } }
        ].concat(Si.glimtTrin("skaeg"), [
            { gaa: UDE }
        ]), false);
    };

    /* ----- Bemaerkninger om fejl -------------------------------------------
       Laereren lader fejlen ske og kommer med en bemaerkning. Scenen
       blokerer ikke. Hver bemaerkning kommer hoejst én gang pr. forsoeg. */
    var BEMAERK = {
        ingenSukker:   { tekst: "Gær uden sukker. Den får ikke meget at lave.", nyt: true },
        ingenGaer:     { tekst: "Sukkervand med gærrør. Der kommer ingen bobler.", nyt: true },
        ingenVand:     { tekst: "Tørt sukker og tør gær. Det er en bagemix.", nyt: true },
        dobbeltGaer:   { tekst: "Dobbelt op på gær. Så er det et andet forsøg.", nyt: true },
        dobbeltSukker: { tekst: "Mere sukker. Gæren siger tak." },
        btbKolbe:      { tekst: "BTB hører til i gærrøret. Ikke i kolben.", nyt: true },
        roerOverloeb:  { tekst: "Gærrøret skal ikke være et springvand." },
        kogt:          { tekst: "Ca. 60 °C, stod der. Det her er suppe.", nyt: true },
        ingenRoer:     { tekst: "Uden gærrør er der ikke meget at tælle." },
        tomtRoer:      { tekst: "Et gærrør uden vand. Boblerne kan ikke ses." },
        ingenBtb:      { tekst: "Uden BTB er der intet farveskift at se på." },
        luftbobler:    { tekst: "Varm luft bobler også. Vent, til temperaturen står stille.", nyt: true },
        nulBobler:     { tekst: "Nul bobler. Gæren er ikke vågnet endnu.", glimt: "boller" },
        skaevTaelling: { tekst: "Dit tal og boblerne er ikke helt enige." },
        kaffeIKolbe:   { tekst: "Det ser godt nok mærkeligt ud." }
    };
    NK.BEMAERK = BEMAERK;

    var NYT_SVAR = [
        "Knappen Nyt forsøg sidder øverst.",
        "Et nyt forsøg er en mulighed.",
        "Du kan også fortsætte. Det bliver spændende."
    ];

    P.laererBemaerk = function (id) {
        var b = BEMAERK[id];
        var L = this.laerer;
        if (!b || !L || this.bemaerket[id]) return false;
        if (L.scene) {
            if (this.bemaerkKoe.indexOf(id) < 0) this.bemaerkKoe.push(id);
            return false;
        }
        this.bemaerket[id] = true;
        var trin = [
            { udtryk: { vrede: 0.5, humoer: -0.3, roed: 0.05, skeptisk: 1, kig: 1 } },
            { gaa: 210 },
            { sig: b.tekst, vis: 1.6 + b.tekst.length * 0.045, tid: 1.8 + b.tekst.length * 0.045 }
        ];
        if (b.glimt) trin = trin.concat(Si.glimtTrin(b.glimt));
        if (b.nyt) {
            var nyt = NYT_SVAR[this.antalNyt++ % NYT_SVAR.length];
            trin.push({ arm: 0.4, tid: 0.4 });
            trin.push({ sig: nyt, vis: 2.2, tid: 2.2 });
            trin.push({ arm: HAENGER, tid: 0.4 });
        }
        trin.push({ kald: function () { if (NK.Lyd) NK.Lyd.brum(); } });
        trin.push({ udtryk: { skeptisk: 0, kig: 0 } });
        trin.push({ gaa: UDE });
        this.laererKoer("bemaerk", trin, false);
        return true;
    };

    /* ----- Det, han har i haanden ------------------------------------------- */
    P.laererBaaretEkstra = function (ctx, L, hd) {
        if (L.baerer === "baegerglas") {
            NK.Sprites.tegnPositur(ctx, "baegerglas", { x: hd.x + 34, y: hd.y + 14, v: 0.12 }, S.ANKER.baegerglas);
        } else if (L.baerer === "papir") {
            NK.Sprites.tegnPositur(ctx, "papir", { x: hd.x + 6, y: hd.y + 8, v: 0.2 }, S.ANKER.papir);
        } else if (L.baerer === "kost") {
            ctx.save();
            ctx.translate(hd.x, hd.y);
            ctx.rotate(L.arm - Math.PI);
            ctx.fillStyle = "#8a5a32";
            NK.rundtRekt(ctx, -2.5, -10, 5, 110, 2);
            ctx.fill();
            ctx.fillStyle = "#c9a15a";
            ctx.beginPath();
            ctx.moveTo(-16, 100);
            ctx.lineTo(16, 100);
            ctx.lineTo(22, 132);
            ctx.lineTo(-22, 132);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "rgba(90, 60, 30, 0.6)";
            ctx.lineWidth = 1;
            for (var i = -18; i <= 18; i += 6) { ctx.beginPath(); ctx.moveTo(i * 0.8, 102); ctx.lineTo(i, 131); ctx.stroke(); }
            ctx.restore();
        }
    };
}());
