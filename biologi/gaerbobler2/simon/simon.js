/* =====================================================================
   simon.js - SM-Simon, laereren i gaerforsoeget

   Personen og glimtene af hans baggrund er beskrevet i README.md i denne
   mappe. Maskinrummet (gang, arm, taleboble, scener) staar i
   ../js/figur.js; her staar hans sprites, hans ansigt og hans glimt.

   Filen indlaeses efter sprites.js og figur.js og foer scene.js:

     <script src="js/sprites.js"></script>
     <script src="js/figur.js"></script>
     <script src="simon/simon.js"></script>

   js/laerer.js kobler ham paa forsoeget med
   NK.Figur.paa(NK.Forsoeg.prototype, NK.Simon.cfg) og tilfoejer de
   scener, der hoerer til forsoeget.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;

    var script = document.currentScript;
    var MAPPE = script && script.src ? script.src.replace(/[^\/]*$/, "") + "sprites/" : "simon/sprites/";

    var SPRITES = {
        simonKop:   { fil: "simon_kop.svg", b: 42, h: 40 },
        simonKrop:  { fil: "simon_krop.svg", b: 240, h: 250 },
        simonHoved: { fil: "simon_hoved.svg", b: 120, h: 130 },
        simonArm:   { fil: "simon_arm.svg", b: 60, h: 140 }
    };
    Object.keys(SPRITES).forEach(function (navn) {
        SPRITES[navn].mappe = MAPPE;
        NK.Sprites.FILER[navn] = SPRITES[navn];
    });

    var ANKER = {
        simonKop:   { x: 18, y: 40 },
        simonKrop:  { x: 120, y: 18 },
        simonHoved: { x: 60, y: 126 },
        simonArm:   { x: 30, y: 132 }
    };

    var SVAR = ["Ja?", "Jeg er midt i en simulering.", "Jeg har travlt.", "Lad være med det."];

    /* ----- Glimt af baggrunden: hvert glimt én gang pr. browser ---------- */
    var GLIMT = {
        navn:       "Simon. SM-delen har en elev skrevet på skiltet.",
        kaffeKold:  "Kold. Jeg var ved at kode en simulering.",
        boller:     "Jeg bagte boller i går. De hævede heller ikke.",
        flodboelge: "I geografi kalder vi det her en flodbølge.",
        skaeg:      "Skægget er til for at se klog ud. Det virker.",
        simulering: "Jeg har lavet en simulering af det her. Den gik også galt.",
        rod:        "Der er altid lidt rodet herinde. Det er biologi.",
        kemi:       "Kemilærere. De har deres egne forkortelser.",
        regnskab3:  "Tredje uheld på den her computer. Det står i regnearket.",
        regnskab6:  "Seks uheld. Regnearket har fået et faneblad.",
        regnskab10: "Ti uheld. Nu er regnearket blevet til et diagram."
    };
    var REGNSKAB = [
        { antal: 10, id: "regnskab10" },
        { antal: 6, id: "regnskab6" },
        { antal: 3, id: "regnskab3" }
    ];

    var LAGER = "smbi-sm-simon";
    var hukommelse = { sete: [], uheld: 0 };
    var glimtVist = false;

    function hent() {
        try {
            var v = JSON.parse(window.localStorage.getItem(LAGER));
            if (v && v.sete) return v;
        } catch (fejl) { /* file:// eller privat browsing */ }
        return hukommelse;
    }

    function gem(v) {
        hukommelse = v;
        try { window.localStorage.setItem(LAGER, JSON.stringify(v)); } catch (fejl) { /* som ovenfor */ }
    }

    function glimt(id) {
        var tekst = GLIMT[id];
        if (!tekst || glimtVist) return null;
        var v = hent();
        if (v.sete.indexOf(id) >= 0) return null;
        v.sete.push(id);
        gem(v);
        glimtVist = true;
        return tekst;
    }

    function glimtTrin(id) {
        var tekst = glimt(id);
        return tekst ? [{ sig: tekst, vis: 1.4 + tekst.length * 0.045, tid: 1.6 + tekst.length * 0.045 }] : [];
    }

    function uheld() {
        var v = hent();
        v.uheld = (v.uheld || 0) + 1;
        gem(v);
        for (var i = 0; i < REGNSKAB.length; i++) {
            if (v.uheld >= REGNSKAB[i].antal) return v.sete.indexOf(REGNSKAB[i].id) >= 0 ? [] : glimtTrin(REGNSKAB[i].id);
        }
        return [];
    }

    function glimtNulstil() {
        gem({ sete: [], uheld: 0 });
        glimtVist = false;
    }

    /* ----- Ansigtet: oejne, bryn og munden i skaegget ------------------ */
    function tegnAnsigt(ctx, L) {
        var i;
        if (L.roed > 0.02) {
            var g = ctx.createRadialGradient(60, 62, 10, 60, 60, 50);
            g.addColorStop(0, "rgba(225, 50, 40, " + (0.5 * L.roed).toFixed(3) + ")");
            g.addColorStop(1, "rgba(225, 50, 40, 0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(60, 60, 42, 40, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        var kig = L.kig || 0;
        var lukket = L.blink > 0 || (L.lukket || 0) > 0.4;
        for (i = 0; i < 2; i++) {
            var ox = i === 0 ? 42 : 78;
            if (lukket) {
                ctx.strokeStyle = "#2a1c12";
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(ox - 5, 57);
                ctx.quadraticCurveTo(ox, 59, ox + 5, 57);
                ctx.stroke();
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.ellipse(ox, 56, 6, 4.8 - L.vrede * 1.3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#3b2a1e";
                ctx.beginPath();
                ctx.arc(ox + 1, 56.5 - kig * 2.4, 2.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(ox + 1.8, 55.4 - kig * 2.4, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        var v = L.vrede, hm = Math.max(0, L.humoer), sk = L.skeptisk || 0;
        ctx.strokeStyle = "#3d2a1c";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(30, 44 + v * 1 - hm * 2 + sk * 2 - kig * 4);
        ctx.lineTo(51, 43 + v * 7 - hm * 3 + sk * 2 - kig * 4);
        ctx.moveTo(90, 44 + v * 1 - hm * 2 - sk * 10 - kig * 4);
        ctx.lineTo(69, 43 + v * 7 - hm * 3 - sk * 7 - kig * 4);
        ctx.stroke();
        var h = L.humoer;
        if (L.aaben > 0.05) {
            ctx.fillStyle = "#3a1a12";
            ctx.beginPath();
            ctx.ellipse(60, 96 + h, 7, 1.5 + 4 * L.aaben, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = "#3a1a12";
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(51, 95 - h * 2 + sk * 1.5);
            ctx.quadraticCurveTo(60, 95 + h * 6, 69, 95 - h * 2 - sk * 4);
            ctx.stroke();
        }
    }

    NK.Simon = {
        MAPPE: MAPPE,
        SPRITES: SPRITES,
        ANKER: ANKER,
        GLIMT: GLIMT,
        glimt: glimt,
        glimtTrin: glimtTrin,
        uheld: uheld,
        glimtNulstil: glimtNulstil,
        suk: function (tid) { return NK.Figur.suk("laerer", tid); },
        cfg: {
            praefiks: "laerer",
            sprites: { krop: "simonKrop", hoved: "simonHoved", arm: "simonArm" },
            y: 420,
            skulder: [198, 62],
            haand: [30, 36],
            kittel: [5, 235, 246],
            hitboks: [118, 124, 112],
            fart: [400, 780],
            taleX: 160,
            svar: SVAR,
            fredet: ["tabt", "overloeb", "baeger"],
            glimt: glimt,
            baaret: { simonKop: { sprite: "simonKop", dx: 8, dy: 26 } },
            tegnAnsigt: tegnAnsigt
        }
    };
}());
