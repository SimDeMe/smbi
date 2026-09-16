/* =====================================================================
   niller.js - Kemi-Niller, kemilaereren fra lokalet ved siden af

   Gaesten i gaerforsoeget. Han kommer kun ind, naar SM-Simon kalder paa
   en kemilaerer, fordi BTB-flasken er tom. Personen staar i README.md i
   denne mappe, og maskinrummet (gang, arm, taleboble, scener) i
   ../js/figur.js.

   Filen indlaeses efter figur.js og foer scene.js. js/laerer.js kobler
   ham paa med NK.Figur.paa(NK.Forsoeg.prototype, NK.Niller.cfg), og
   metoderne hedder derefter nillerStart, nillerKoer, nillerSig,
   opdaterNiller, tegnNiller og saa videre.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;

    var script = document.currentScript;
    var MAPPE = script && script.src ? script.src.replace(/[^\/]*$/, "") + "sprites/" : "niller/sprites/";

    var SPRITES = {
        nillerKop:   { fil: "niller_kop.svg", b: 44, h: 56 },
        nillerKrop:  { fil: "niller_krop.svg", b: 220, h: 250 },
        nillerHoved: { fil: "niller_hoved.svg", b: 110, h: 130 },
        nillerArm:   { fil: "niller_arm.svg", b: 56, h: 150 }
    };
    Object.keys(SPRITES).forEach(function (navn) {
        SPRITES[navn].mappe = MAPPE;
        NK.Sprites.FILER[navn] = SPRITES[navn];
    });

    var ANKER = {
        nillerKop:   { x: 22, y: 56 },
        nillerKrop:  { x: 110, y: 18 },
        nillerHoved: { x: 55, y: 126 },
        nillerArm:   { x: 28, y: 142 }
    };

    var SVAR = ["Ja?", "Jeg skal tilbage til kemi.", "Var der mere?"];

    /* ----- Ansigtet: oejne, bryn, runde briller og mund ------------------ */
    function tegnAnsigt(ctx, L) {
        var i;
        var kig = L.kig || 0, gy = kig * 12;
        if (L.roed > 0.02) {
            var g = ctx.createRadialGradient(55, 70, 10, 55, 66, 48);
            g.addColorStop(0, "rgba(225, 50, 40, " + (0.5 * L.roed).toFixed(3) + ")");
            g.addColorStop(1, "rgba(225, 50, 40, 0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(55, 66, 40, 42, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        var lukket = L.blink > 0 || (L.lukket || 0) > 0.4;
        for (i = 0; i < 2; i++) {
            var ox = i === 0 ? 37 : 73;
            if (lukket) {
                ctx.strokeStyle = "#2a2f36";
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(ox - 4, 61);
                ctx.lineTo(ox + 4, 61);
                ctx.stroke();
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.ellipse(ox, 61, 5.4, 4.4 - L.vrede * 1.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#2f4a6b";
                ctx.beginPath();
                ctx.arc(ox + 1.4, 61.5 - kig * 2.2, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        /* Runde briller. Med kig glider de ned ad naesen. */
        ctx.strokeStyle = "#3b4149";
        ctx.lineWidth = 2.4;
        ctx.fillStyle = "rgba(200, 230, 255, 0.12)";
        [37, 73].forEach(function (bx) {
            ctx.beginPath();
            ctx.arc(bx, 60 + gy, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(49, 59 + gy); ctx.quadraticCurveTo(55, 55 + gy, 61, 59 + gy);
        ctx.moveTo(25, 58 + gy); ctx.lineTo(16, 55 + gy * 0.4);
        ctx.moveTo(85, 58 + gy); ctx.lineTo(94, 55 + gy * 0.4);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(34, 56 + gy, 6, Math.PI * 1.1, Math.PI * 1.45);
        ctx.arc(70, 56 + gy, 6, Math.PI * 1.1, Math.PI * 1.45);
        ctx.stroke();
        /* Bryn */
        var v = L.vrede, hm = Math.max(0, L.humoer), sk = L.skeptisk || 0;
        ctx.strokeStyle = "#8a7a52";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(25, 42 + v * 1 - hm * 2 + sk * 2 - kig * 3);
        ctx.lineTo(47, 42 + v * 7 - hm * 3 + sk * 2 - kig * 3);
        ctx.moveTo(85, 42 + v * 1 - hm * 2 - sk * 10 - kig * 3);
        ctx.lineTo(63, 42 + v * 7 - hm * 3 - sk * 7 - kig * 3);
        ctx.stroke();
        /* Mund */
        var h = L.humoer;
        if (L.aaben > 0.05) {
            ctx.fillStyle = "#7a3b2e";
            ctx.beginPath();
            ctx.ellipse(55, 98 + h * 2, 6, 1.5 + 4 * L.aaben, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = "#8a4a38";
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(46, 97 - h * 2 + sk * 1.5);
            ctx.quadraticCurveTo(55, 97 + h * 7, 64, 97 - h * 2 - sk * 5);
            ctx.stroke();
        }
    }

    NK.Niller = {
        MAPPE: MAPPE,
        SPRITES: SPRITES,
        ANKER: ANKER,
        suk: function (tid) { return NK.Figur.suk("niller", tid); },
        cfg: {
            praefiks: "niller",
            sprites: { krop: "nillerKrop", hoved: "nillerHoved", arm: "nillerArm" },
            y: 392,
            skulder: [176, 58],
            haand: [28, 36],
            kittel: [15, 205, 246],
            hitboks: [105, 112, 116],
            fart: [420, 800],
            taleX: 170,
            start: { vrede: 0.1, humoer: 0.45 },
            svar: SVAR,
            gaarSvar: "Jeg går tilbage til kemi.",
            fredet: ["besoeg"],
            baaret: {
                nillerKop: { sprite: "nillerKop", dx: 6, dy: 22 },
                btb: { sprite: "btb", dx: 2, dy: 18, v: 0.12 }
            },
            tegnAnsigt: tegnAnsigt
        }
    };
}());
