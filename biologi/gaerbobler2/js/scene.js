/* =====================================================================
   scene.js - laboratoriet, tegnet paa et fast tegnebord

   Alt tegnes paa et tegnebord paa 1000 x 600 enheder, som skaleres og
   centreres i laerredet. Paa bordet staar ingredienserne, redskaberne,
   taelleren, tre pladser til kolberne og to varmeplader. Gaerroerene
   staar i et stativ paa hylden til hoejre. Affaldsspanden staar foran
   bordet.

   Filen indeholder kun maal og tegning. Tilstanden ligger i forsoeg.js.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;
    var F = NK.Sprites.FILER;
    var S = {};
    NK.Scene = S;

    S.BREDDE = 1000;
    S.HOEJDE = 600;
    S.BORD = 500;

    S.ANKER = {
        kolbe:      { x: 48, y: 2.5 },
        gaerroer:   { x: 11, y: 100 },
        baegerglas: { x: 68, y: 3 },
        maaleglas:  { x: 8, y: 6 },
        btb:        { x: 17, y: 2 },
        termometer: { x: 7, y: 118 },
        sukker:     { x: 5, y: 5 },
        gaer:       { x: 12, y: 4 },
        spatel:     { x: 6, y: 108 },
        taeller:    { x: 22, y: 52 },
        spand:      { x: 44, y: 88 },
        haand:      { x: 40, y: 46 },
        papir:      { x: 36, y: 22 }
    };
    [NK.Simon.ANKER, NK.Niller.ANKER].forEach(function (a) {
        Object.keys(a).forEach(function (navn) { S.ANKER[navn] = a[navn]; });
    });

    function staar(navn, x, y) {
        var f = F[navn], a = S.ANKER[navn];
        return { x: x - f.b / 2 + a.x, y: (y === undefined ? S.BORD : y) - f.h + a.y, v: 0 };
    }
    S.staar = staar;

    /* ----- Maal ----------------------------------------------------------- */
    S.PLAKAT = { x: 24, y: 86, b: 142, h: 132 };
    S.UR = { x: 236, y: 118, r: 34 };
    S.HYLDE_V = { x0: 26, x1: 166, y: 292 };
    S.HYLDE_H = { x0: 590, x1: 992, y: 215 };
    S.STATIV = { x0: 636, x1: 964, top: 191, y: 215, huller: [690, 800, 910] };
    S.LUP = { x: 470, y: 176, r: 104 };
    S.HOLDER = { x: 249, b: 38, h: 40 };
    S.SPAND_P = { x: 862, y: 598, v: 0 };

    S.PLADS = [
        { id: "bord1", type: "bord", navn: "bordet", x: 470, y: S.BORD },
        { id: "bord2", type: "bord", navn: "bordet", x: 575, y: S.BORD },
        { id: "bord3", type: "bord", navn: "bordet", x: 680, y: S.BORD },
        { id: "pladeA", type: "plade", navn: "varmeplade A", x: 792, y: S.BORD - 45 },
        { id: "pladeB", type: "plade", navn: "varmeplade B", x: 926, y: S.BORD - 45 }
    ];

    S.HJEM = {
        sukker:     staar("sukker", 50),
        gaer:       staar("gaer", 110),
        maaleglas:  staar("maaleglas", 162),
        btb:        staar("btb", 204),
        spatel:     { x: 240, y: 496, v: -0.12 },
        termometer: { x: 259, y: 496, v: 0.1 },
        taeller:    staar("taeller", 300),
        baegerglas: staar("baegerglas", 372),
        kaffe:      staar("nillerKop", 372),
        kaffekop:   staar("simonKop", 124, S.HYLDE_V.y)
    };

    /* Baegerglasset ender paa hylden ved siden af krusset */
    S.BAEGER_HYLDE = staar("baegerglas", 68, S.HYLDE_V.y);

    S.kolbePaa = function (plads) { return staar("kolbe", plads.x, plads.y); };
    S.roerIStativ = function (i) { return { x: S.STATIV.huller[i], y: S.STATIV.top + 8, v: 0 }; };
    /* Gaerroerets anker sidder lige under proppens top */
    S.roerPaaKolbe = function (kp) {
        var aab = NK.tilVerden(kp, S.ANKER.kolbe, 48, 2.5);
        return { x: aab.x, y: aab.y + 6, v: kp.v };
    };

    S.pladeKnap = function (plads, hvilken) {
        return { x: plads.x + (hvilken === "minus" ? 21 : 45), y: plads.y + 26, r: 10 };
    };

    /* ----- Indersider og hjaelpere -------------------------------------- */
    function pts(liste) { return liste.map(function (p) { return { x: p[0], y: p[1] }; }); }
    S.KOLBE_INDRE = pts([[37.8, 4], [37.8, 41.6], [8.3, 113.3], [8.6, 119.5], [14.1, 123.5], [81.9, 123.5], [87.4, 119.5], [87.7, 113.3], [58.2, 41.6], [58.2, 4]]);

    S.indreVerden = function (liste, p, anker) {
        return liste.map(function (q) { return NK.tilVerden(p, anker, q.x, q.y); });
    };

    S.skala = function (b, h) {
        var s = Math.min(b / S.BREDDE, h / S.HOEJDE);
        return { s: s, dx: (b - S.BREDDE * s) / 2, dy: (h - S.HOEJDE * s) / 2 };
    };

    S.inden = function (navn, p, anker, px, py, pad) {
        var f = F[navn];
        var l = NK.tilLokal(p, anker, px, py);
        pad = pad || 0;
        return l.x > -pad && l.x < f.b + pad && l.y > -pad && l.y < f.h + pad;
    };

    S.rekt = function (navn, p, anker, pad) {
        var f = F[navn];
        pad = pad || 0;
        var hj = [[-pad, -pad], [f.b + pad, -pad], [f.b + pad, f.h + pad], [-pad, f.h + pad]];
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        hj.forEach(function (h) {
            var w = NK.tilVerden(p, anker, h[0], h[1]);
            x0 = Math.min(x0, w.x); y0 = Math.min(y0, w.y);
            x1 = Math.max(x1, w.x); y1 = Math.max(y1, w.y);
        });
        return { x: x0, y: y0, b: x1 - x0, h: y1 - y0 };
    };

    /* ================================================================
       LOKALET
       ================================================================ */
    S.tegnBaggrund = function (ctx, v) {
        var i;
        var g = ctx.createLinearGradient(0, 0, 0, S.BORD);
        g.addColorStop(0, "#232a33");
        g.addColorStop(1, "#303843");
        ctx.fillStyle = g;
        ctx.fillRect(-2000, -2000, S.BREDDE + 4000, S.BORD + 2000);

        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var y = 330; y < S.BORD; y += 34) { ctx.moveTo(-2000, y); ctx.lineTo(3000, y); }
        for (var x = -2000; x < 3000; x += 34) { ctx.moveTo(x, 330); ctx.lineTo(x, S.BORD); }
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#2b3139";
        ctx.fillRect(-2000, -2000, S.BREDDE + 4000, 2000 + 44);
        ctx.fillStyle = "rgba(255, 248, 225, 0.55)";
        NK.rundtRekt(ctx, 60, 38, 320, 5, 2.5);
        ctx.fill();
        NK.rundtRekt(ctx, 620, 38, 320, 5, 2.5);
        ctx.fill();
        NK.skaer(ctx, 220, 46, 170, "rgba(255, 248, 225, 0.1)");
        NK.skaer(ctx, 780, 46, 170, "rgba(255, 248, 225, 0.1)");

        /* Plakat med sikkerhedsregler */
        var P = S.PLAKAT;
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(P.x + 3, P.y + 4, P.b, P.h);
        ctx.fillStyle = "#f4f0e2";
        ctx.fillRect(P.x, P.y, P.b, P.h);
        ctx.fillStyle = "#2f5d46";
        ctx.fillRect(P.x, P.y, P.b, 24);
        NK.tekst(ctx, "SIKKERHED", P.x + P.b / 2, P.y + 16.5, { font: "800 12px 'Segoe UI', sans-serif", justering: "center", farve: "#ffffff" });
        var regler = [["1", "Kittel og briller"], ["2", "Glas bæres med"], ["", "to hænder"], ["3", "Spild tørres op"], ["", "med det samme"]];
        for (i = 0; i < regler.length; i++) {
            var ry = P.y + 46 + i * 17 + (i >= 1 ? 6 : 0) + (i >= 3 ? 6 : 0);
            var regel = i === 0 ? 1 : (i < 3 ? 2 : 3);
            if (v.plakatRegel === regel) {
                ctx.fillStyle = "rgba(242, 197, 61, " + (0.35 + 0.25 * Math.sin(v.tid * 8)).toFixed(3) + ")";
                ctx.fillRect(P.x + 4, ry - 12, P.b - 8, 16);
            }
            if (regler[i][0]) NK.tekst(ctx, regler[i][0], P.x + 10, ry, { font: "800 11px 'Segoe UI', sans-serif", farve: "#2f5d46" });
            NK.tekst(ctx, regler[i][1], P.x + 24, ry, { font: "600 11px 'Segoe UI', sans-serif", farve: "#2a2f36" });
        }
        ctx.restore();

        /* Vaegur. Et klik spoler tiden frem. */
        var U = S.UR;
        ctx.save();
        if (v.urFremhaev) NK.skaer(ctx, U.x, U.y, U.r + 22, "rgba(242, 197, 61, 0.35)");
        ctx.fillStyle = "#e9ecef";
        ctx.beginPath();
        ctx.arc(U.x, U.y, U.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3.4;
        ctx.strokeStyle = "#1c2026";
        ctx.stroke();
        ctx.strokeStyle = "#39404a";
        ctx.lineWidth = 1.5;
        for (i = 0; i < 12; i++) {
            var va = i * Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(U.x + Math.cos(va) * (U.r - 3), U.y + Math.sin(va) * (U.r - 3));
            ctx.lineTo(U.x + Math.cos(va) * (U.r - 8), U.y + Math.sin(va) * (U.r - 8));
            ctx.stroke();
        }
        var min = v.urMinutter;
        var tim = 10 + min / 60;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#1c2026";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(U.x, U.y);
        ctx.lineTo(U.x + Math.sin(tim / 12 * Math.PI * 2) * 14, U.y - Math.cos(tim / 12 * Math.PI * 2) * 14);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(U.x, U.y);
        ctx.lineTo(U.x + Math.sin(min / 60 * Math.PI * 2) * 23, U.y - Math.cos(min / 60 * Math.PI * 2) * 23);
        ctx.stroke();
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(U.x, U.y);
        ctx.lineTo(U.x + Math.sin(v.urSekunder / 60 * Math.PI * 2) * 26, U.y - Math.cos(v.urSekunder / 60 * Math.PI * 2) * 26);
        ctx.stroke();
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.arc(U.x, U.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        NK.tekst(ctx, "Vent 5 min", U.x, U.y + U.r + 17, { font: "700 12px 'Segoe UI', sans-serif", justering: "center", farve: "rgba(230, 236, 242, 0.7)" });

        /* Hylderne */
        [S.HYLDE_V, S.HYLDE_H].forEach(function (H) {
            ctx.fillStyle = "#6b4a2c";
            ctx.fillRect(H.x0, H.y, H.x1 - H.x0, 8);
            ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
            ctx.fillRect(H.x0, H.y, H.x1 - H.x0, 1.5);
            ctx.fillStyle = "#4a3320";
            ctx.fillRect(H.x0 + 14, H.y + 8, 6, 16);
            ctx.fillRect(H.x1 - 20, H.y + 8, 6, 16);
        });

        /* Bordplade og forkant */
        ctx.fillStyle = "#3b404b";
        ctx.fillRect(-2000, S.BORD, S.BREDDE + 4000, 9);
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.fillRect(-2000, S.BORD, S.BREDDE + 4000, 1.5);
        var f = ctx.createLinearGradient(0, S.BORD + 9, 0, S.HOEJDE);
        f.addColorStop(0, "#23262e");
        f.addColorStop(1, "#16181d");
        ctx.fillStyle = f;
        ctx.fillRect(-2000, S.BORD + 9, S.BREDDE + 4000, 2000);
    };

    /* Stativet foran gaerroerenes stilke */
    S.tegnStativ = function (ctx) {
        var T = S.STATIV;
        var g = ctx.createLinearGradient(0, T.top, 0, T.y);
        g.addColorStop(0, "#a57a4c");
        g.addColorStop(1, "#7a5532");
        ctx.fillStyle = g;
        NK.rundtRekt(ctx, T.x0, T.top, T.x1 - T.x0, T.y - T.top, 4);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
        ctx.fillRect(T.x0 + 4, T.top + 2, T.x1 - T.x0 - 8, 2);
        T.huller.forEach(function (x, i) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.beginPath();
            ctx.ellipse(x, T.top + 4, 9, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            NK.tekst(ctx, String(i + 1), x + 30, T.top + 17, { font: "800 12px 'Segoe UI', sans-serif", justering: "center", linje: "middle", farve: "rgba(255, 240, 220, 0.75)" });
        });
    };

    /* Glasset, som spatlen og termometeret staar i. Tegnes over dem. */
    S.tegnHolder = function (ctx) {
        var H = S.HOLDER, x0 = H.x - H.b / 2, y0 = S.BORD - H.h;
        ctx.save();
        ctx.fillStyle = "rgba(212, 235, 250, 0.12)";
        NK.rundtRekt(ctx, x0, y0, H.b, H.h, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(220, 236, 248, 0.75)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, S.BORD - 3);
        ctx.quadraticCurveTo(x0, S.BORD, x0 + 3, S.BORD);
        ctx.lineTo(x0 + H.b - 3, S.BORD);
        ctx.quadraticCurveTo(x0 + H.b, S.BORD, x0 + H.b, S.BORD - 3);
        ctx.lineTo(x0 + H.b, y0);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(x0 + 4, y0 + 5, 2, H.h - 10);
        ctx.restore();
    };

    S.skygge = function (ctx, x, rx, alfa, y) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, " + (alfa === undefined ? 0.35 : alfa) + ")";
        ctx.beginPath();
        ctx.ellipse(x, (y === undefined ? S.BORD : y) + 3, rx, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    S.tegnMarkering = function (ctx, r, tid) {
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.35 * Math.sin(tid * 4);
        ctx.strokeStyle = "#f2c53d";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([7, 6]);
        ctx.lineDashOffset = -tid * 12;
        NK.rundtRekt(ctx, r.x - 6, r.y - 6, r.b + 12, r.h + 12, 9);
        ctx.stroke();
        ctx.restore();
    };

    /* ================================================================
       VARMEPLADE
       ================================================================ */
    S.tegnVarmeplade = function (ctx, plads, temp, indstillet, fremhaev, tid) {
        var x0 = plads.x - 60, y0 = plads.y;
        var taendt = indstillet > NK.Model.RUM;
        if (temp > 24) {
            ctx.save();
            ctx.globalAlpha = NK.klamp((temp - 24) / 60, 0, 1);
            var g = ctx.createLinearGradient(0, y0 - 8, 0, y0 + 5);
            g.addColorStop(0, "rgba(255, 90, 40, 0)");
            g.addColorStop(1, "rgba(255, 90, 40, 0.55)");
            ctx.fillStyle = g;
            ctx.fillRect(x0 + 5, y0 - 8, 110, 13);
            ctx.restore();
        }
        NK.Sprites.tegn(ctx, "varmeplade", x0, y0);
        NK.tekst(ctx, taendt ? indstillet + " °C" : "FRA", x0 + 52, y0 + 28, {
            font: "700 12px Consolas, 'Courier New', monospace", justering: "right", linje: "middle",
            farve: taendt ? "#ffb070" : "#8a7a6a"
        });
        ["minus", "plus"].forEach(function (h) {
            var k = S.pladeKnap(plads, h);
            NK.kugle(ctx, k.x, k.y, k.r, "#5a626c", "#262b31");
            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = "#eef2f5";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(k.x - 4.5, k.y);
            ctx.lineTo(k.x + 4.5, k.y);
            if (h === "plus") { ctx.moveTo(k.x, k.y - 4.5); ctx.lineTo(k.x, k.y + 4.5); }
            ctx.stroke();
        });
        if (taendt) NK.skaer(ctx, x0 + 60, y0 + 11, 8, "rgba(255, 120, 40, 0.9)", 0.8);
        if (fremhaev) S.tegnMarkering(ctx, { x: x0 + 8, y: y0 + 12, b: 104, h: 28 }, tid);
    };

    /* ================================================================
       VAESKER, STRAALER, DAMPE OG PARTIKLER
       ================================================================ */
    S.tegnVaeske = function (ctx, verden, areal, farve, opt) {
        opt = opt || {};
        if (areal <= 1 || !farve) return null;
        var niveau = NK.vaeskeNiveau(verden, areal);
        var x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        verden.forEach(function (p) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
        var boelge = opt.boelge || 0, tid = opt.tid || 0;

        ctx.save();
        NK.polySti(ctx, verden);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(x0 - 4, niveau);
        for (var x = x0 - 4; x <= x1 + 6; x += 4) {
            ctx.lineTo(x, niveau + Math.sin(x * 0.12 + tid * 10) * boelge + Math.sin(x * 0.05 - tid * 6.5) * boelge * 0.6);
        }
        ctx.lineTo(x1 + 6, y1 + 6);
        ctx.lineTo(x0 - 4, y1 + 6);
        ctx.closePath();
        var g = ctx.createLinearGradient(0, niveau, 0, y1);
        g.addColorStop(0, NK.css(farve, 0.85));
        g.addColorStop(1, NK.css(farve, 1.15));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, niveau);
        ctx.lineTo(x1, niveau);
        ctx.stroke();
        ctx.restore();
        return niveau;
    };

    S.tegnStraale = function (ctx, fra, til, farve, bredde, tid) {
        if (!farve) return;
        ctx.save();
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(fra.x, fra.y);
        ctx.quadraticCurveTo(fra.x + (til.x - fra.x) * 0.85, fra.y + 2, til.x, til.y);
        ctx.strokeStyle = NK.css({ r: farve.r, g: farve.g, b: farve.b, a: Math.max(0.6, farve.a) });
        ctx.lineWidth = bredde;
        ctx.stroke();
        ctx.setLineDash([5, 9]);
        ctx.lineDashOffset = -tid * 90;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = Math.max(1, bredde * 0.4);
        ctx.stroke();
        ctx.restore();
    };

    S.tegnDampe = function (ctx, dampe) {
        ctx.save();
        for (var i = 0; i < dampe.length; i++) {
            var d = dampe[i];
            ctx.globalAlpha = NK.klamp(d.liv, 0, 1) * (d.alfa || 0.2);
            ctx.fillStyle = d.farve || "#e8eef3";
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    };

    /* Spild paa bordet: { x, y, rx, alfa, farve } */
    S.tegnPyt = function (ctx, pyt) {
        if (!pyt || pyt.alfa < 0.01) return;
        ctx.save();
        ctx.globalAlpha = NK.klamp(pyt.alfa, 0, 1);
        ctx.fillStyle = NK.css(pyt.farve || { r: 190, g: 222, b: 244, a: 0.6 });
        ctx.beginPath();
        ctx.ellipse(pyt.x, (pyt.y || S.BORD) + 2, pyt.rx, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    };

    /* Glasskaar paa gulvet: [{ x, y, a, s }] */
    S.tegnSkaar = function (ctx, skaar) {
        ctx.save();
        for (var i = 0; i < skaar.length; i++) {
            var k = skaar[i];
            ctx.save();
            ctx.translate(k.x, k.y);
            ctx.rotate(k.a);
            ctx.globalAlpha = k.alfa === undefined ? 1 : NK.klamp(k.alfa, 0, 1);
            ctx.beginPath();
            ctx.moveTo(-6 * k.s, 0);
            ctx.lineTo(0, -9 * k.s);
            ctx.lineTo(7 * k.s, -2 * k.s);
            ctx.lineTo(2 * k.s, 4 * k.s);
            ctx.closePath();
            ctx.fillStyle = "rgba(212, 235, 250, 0.35)";
            ctx.fill();
            ctx.strokeStyle = "rgba(230, 244, 252, 0.85)";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    };

    /* ================================================================
       KOLBEN
       k: { p, ml, farve, sukker, gaer, roert, bobler, skum, boelge,
            nr, prop, fremhaev }
       ================================================================ */
    S.tegnKolbe = function (ctx, k, tid) {
        var a = S.ANKER.kolbe;
        var verden = S.indreVerden(S.KOLBE_INDRE, k.p, a);
        var i;
        var niveau = S.tegnVaeske(ctx, verden, k.ml * NK.Model.KOLBE_AREAL, k.farve, { boelge: k.boelge, tid: tid });

        ctx.save();
        NK.polySti(ctx, verden);
        ctx.clip();
        ctx.translate(k.p.x, k.p.y);
        ctx.rotate(k.p.v);
        ctx.translate(-a.x, -a.y);

        /* Bunker: sukker og gaer, der ikke er roert ud */
        var bunker = [];
        if (k.sukker > 0 && !k.roert) bunker.push({ m: k.sukker, x: k.gaer > 0 && !k.roert ? 36 : 48, f: "#f6f7f9", korn: "rgba(150, 160, 170, 0.6)" });
        if (k.gaer > 0 && !k.roert) bunker.push({ m: k.gaer, x: k.sukker > 0 && !k.roert ? 62 : 48, f: "#d9b574", korn: "rgba(110, 76, 30, 0.6)" });
        for (i = 0; i < bunker.length; i++) {
            var bu = bunker[i];
            var bb = Math.min(30, 14 + bu.m * 0.5), bh = Math.min(16, 5 + bu.m * 0.22);
            ctx.beginPath();
            ctx.moveTo(bu.x - bb, 124);
            ctx.quadraticCurveTo(bu.x, 124 - bh * 2, bu.x + bb, 124);
            ctx.closePath();
            ctx.fillStyle = bu.f;
            ctx.fill();
            ctx.fillStyle = bu.korn;
            for (var n = 0; n < 9; n++) ctx.fillRect(bu.x - bb * 0.6 + (n * 37 % (bb * 1.2)), 121 - (n * 13 % Math.max(2, bh)), 1.3, 1.3);
        }

        /* Bobler i vaesken */
        if (k.bobler && niveau !== null) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.lineWidth = 0.9;
            for (i = 0; i < k.bobler.length; i++) {
                var bo = k.bobler[i];
                var w = NK.tilVerden(k.p, a, bo.x, bo.y);
                if (w.y < niveau + 1) continue;
                ctx.beginPath();
                ctx.arc(bo.x, bo.y, bo.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();

        /* Skum paa overfladen */
        if (niveau !== null && k.skum > 0.03) {
            ctx.save();
            NK.polySti(ctx, verden);
            ctx.clip();
            var tyk = 2 + 9 * NK.klamp(k.skum, 0, 1);
            ctx.fillStyle = NK.css(NK.Model.FARVE.skum);
            ctx.beginPath();
            ctx.moveTo(k.p.x - 60, niveau + 2);
            for (var sx = -60; sx <= 60; sx += 6) ctx.lineTo(k.p.x + sx, niveau - tyk + Math.sin(sx * 0.4 + tid * 2) * 1.5);
            ctx.lineTo(k.p.x + 60, niveau + 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        NK.Sprites.tegnPositur(ctx, "kolbe", k.p, a);

        /* Nummer paa kolben */
        if (k.nr) {
            var m = NK.tilVerden(k.p, a, 48, 100);
            ctx.save();
            ctx.fillStyle = "rgba(247, 245, 238, 0.95)";
            ctx.beginPath();
            ctx.arc(m.x, m.y, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#3a3f47";
            ctx.lineWidth = 1.2;
            ctx.stroke();
            NK.tekst(ctx, String(k.nr), m.x, m.y + 1, { font: "800 15px 'Segoe UI', sans-serif", justering: "center", linje: "middle", farve: "#2a2f36" });
            ctx.restore();
        }
        if (k.prop) S.tegnProp(ctx, k.p);
        if (k.fremhaev) S.tegnMarkering(ctx, S.rekt("kolbe", k.p, a, 0), tid);
        return niveau;
    };

    /* Gummiproppen i kolbens hals */
    S.tegnProp = function (ctx, kp) {
        var a = S.ANKER.kolbe;
        ctx.save();
        ctx.translate(kp.x, kp.y);
        ctx.rotate(kp.v);
        ctx.translate(-a.x, -a.y);
        ctx.beginPath();
        ctx.moveTo(33, -6);
        ctx.lineTo(63, -6);
        ctx.lineTo(59, 16);
        ctx.lineTo(37, 16);
        ctx.closePath();
        ctx.fillStyle = "#6e4a3a";
        ctx.fill();
        ctx.strokeStyle = "#3c2820";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
        ctx.fillRect(36, -4, 4, 18);
        ctx.restore();
    };

    /* ================================================================
       GAERROERET
       Vandet staar i den nederste bue. Boblerne foelger vandets midterlinje
       fra overfladen i venstre ben (t = 0) til overfladen i hoejre (t = 1).
       r: { p, farve, bobler: [{ t, pop }], overloeb, fremhaev }
       ================================================================ */
    var VAND_LINJE = 42;
    var VAND_STI = (function () {
        var p = [[43, VAND_LINJE], [43, 53]];
        for (var i = 1; i <= 16; i++) {
            var v = Math.PI - Math.PI * i / 16;
            p.push([56 + Math.cos(v) * 13, 53 + Math.sin(v) * 13]);
        }
        p.push([69, VAND_LINJE]);
        var s = [0], l = 0;
        for (i = 1; i < p.length; i++) {
            l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
            s.push(l);
        }
        return { p: p, s: s, l: l };
    }());

    S.roerLokal = function (t) {
        var maal = NK.klamp(t, 0, 1) * VAND_STI.l, i = 1;
        while (i < VAND_STI.s.length - 1 && VAND_STI.s[i] < maal) i++;
        var f = (maal - VAND_STI.s[i - 1]) / Math.max(1e-6, VAND_STI.s[i] - VAND_STI.s[i - 1]);
        return { x: NK.lerp(VAND_STI.p[i - 1][0], VAND_STI.p[i][0], f), y: NK.lerp(VAND_STI.p[i - 1][1], VAND_STI.p[i][1], f) };
    };

    S.tegnRoer = function (ctx, r, tid) {
        var a = S.ANKER.gaerroer;
        var i;
        NK.Sprites.tegnPositur(ctx, "gaerroer", r.p, a);
        ctx.save();
        ctx.translate(r.p.x, r.p.y);
        ctx.rotate(r.p.v);
        ctx.translate(-a.x, -a.y);
        ctx.lineCap = "butt";
        ctx.lineJoin = "round";
        if (r.farve) {
            ctx.beginPath();
            VAND_STI.p.forEach(function (q, j) { if (j === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); });
            ctx.strokeStyle = NK.css(r.farve);
            ctx.lineWidth = 5.4;
            ctx.stroke();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(40.5, VAND_LINJE); ctx.lineTo(45.5, VAND_LINJE);
            ctx.moveTo(66.5, VAND_LINJE); ctx.lineTo(71.5, VAND_LINJE);
            ctx.stroke();
        }
        if (r.bobler) {
            for (i = 0; i < r.bobler.length; i++) {
                var b = r.bobler[i];
                var q = S.roerLokal(b.t);
                if (b.pop > 0) {
                    ctx.globalAlpha = NK.klamp(1 - b.pop, 0, 1);
                    ctx.strokeStyle = "rgba(240, 248, 255, 0.9)";
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.arc(q.x, q.y - 1, 2 + b.pop * 4, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                } else {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                    ctx.strokeStyle = "rgba(40, 60, 80, 0.5)";
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.arc(q.x, q.y, 2.3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
        if (r.overloeb > 0.02) {
            ctx.fillStyle = NK.css(r.farve || { r: 200, g: 226, b: 244, a: 0.7 }, r.overloeb);
            for (i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(73 + i * 2, 18 + ((tid * 60 + i * 13) % 60), 1.3, 2.4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
        if (r.fremhaev) S.tegnMarkering(ctx, S.rekt("gaerroer", r.p, a, 0), tid);
    };

    /* ================================================================
       BAEGERGLASSET OG KAFFEN
       Baegerglasset hoerer ikke til forsoeget: det er ikke blevet ryddet
       op. b: { p, btb, fremhaev }
       ================================================================ */
    S.tegnBaeger = function (ctx, b, tid) {
        var a = S.ANKER.baegerglas;
        ctx.save();
        ctx.translate(b.p.x, b.p.y);
        ctx.rotate(b.p.v);
        ctx.translate(-a.x, -a.y);
        /* Indtoerret rest i bunden og gamle raender paa glasset */
        ctx.fillStyle = "rgba(150, 132, 96, 0.5)";
        ctx.beginPath();
        ctx.moveTo(10, 84);
        ctx.quadraticCurveTo(36, 73, 62, 84);
        ctx.lineTo(62, 86);
        ctx.quadraticCurveTo(36, 88, 10, 86);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(186, 172, 140, 0.3)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(10, 60); ctx.quadraticCurveTo(36, 65, 62, 59);
        ctx.moveTo(10, 71); ctx.quadraticCurveTo(36, 75, 62, 70);
        ctx.stroke();
        if (b.btb > 0) {
            ctx.fillStyle = "rgba(40, 110, 205, 0.75)";
            ctx.beginPath();
            ctx.moveTo(12, 86);
            ctx.quadraticCurveTo(36, 80 - Math.min(7, b.btb * 1.6), 60, 86);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        NK.Sprites.tegnPositur(ctx, "baegerglas", b.p, a);
        if (b.fremhaev) S.tegnMarkering(ctx, S.rekt("baegerglas", b.p, a, 0), tid);
    };

    /* Kemi-Nillers glemte kaffe */
    S.tegnKaffe = function (ctx, p, fremhaev, tid) {
        NK.Sprites.tegnPositur(ctx, "nillerKop", p, S.ANKER.nillerKop);
        if (fremhaev) S.tegnMarkering(ctx, S.rekt("nillerKop", p, S.ANKER.nillerKop, 0), tid);
    };

    /* ================================================================
       TERMOMETER OG TAELLER
       ================================================================ */
    S.tegnTermometer = function (ctx, p, temp, fremhaev, tid) {
        var a = S.ANKER.termometer;
        NK.Sprites.tegnPositur(ctx, "termometer", p, a);
        var laengde = NK.klamp((temp - 0) / 100, 0, 1) * 96;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.v);
        ctx.translate(-a.x, -a.y);
        ctx.fillStyle = "#d8453a";
        ctx.fillRect(5.6, 107 - laengde, 2.8, laengde + 1);
        ctx.restore();
        if (fremhaev) S.tegnMarkering(ctx, S.rekt("termometer", p, a, 0), tid);
    };

    /* En lille maalerbrik ved siden af termometeret */
    S.tegnAflaesning = function (ctx, x, y, tekst, alfa) {
        if (alfa < 0.01) return;
        ctx.save();
        ctx.globalAlpha = NK.klamp(alfa, 0, 1);
        ctx.font = "800 16px 'Segoe UI', sans-serif";
        var b = ctx.measureText(tekst).width + 18;
        ctx.fillStyle = "rgba(20, 22, 28, 0.92)";
        NK.rundtRekt(ctx, x, y - 13, b, 26, 8);
        ctx.fill();
        ctx.strokeStyle = "#f2c53d";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        NK.tekst(ctx, tekst, x + b / 2, y + 1, { font: "800 16px 'Segoe UI', sans-serif", justering: "center", linje: "middle", farve: "#ffffff" });
        ctx.restore();
    };

    S.tegnTaeller = function (ctx, p, tal, fremhaev, tid, trykket) {
        var a = S.ANKER.taeller;
        NK.Sprites.tegnPositur(ctx, "taeller", { x: p.x, y: p.y + (trykket ? 1 : 0), v: p.v }, a);
        var m = NK.tilVerden(p, a, 22, 30);
        var t = String(Math.min(9999, tal));
        while (t.length < 4) t = "0" + t;
        NK.tekst(ctx, t, m.x, m.y + 0.5, { font: "700 10px Consolas, 'Courier New', monospace", justering: "center", linje: "middle", farve: "#7df0a8" });
        if (fremhaev) S.tegnMarkering(ctx, S.rekt("taeller", p, a, 0), tid);
    };

    /* ================================================================
       LUPPEN: gaerroeret tæt paa, mens der taelles
       ================================================================ */
    S.tegnLup = function (ctx, maal, alfa, titel, tegnIndhold) {
        if (alfa < 0.01) return;
        var L = S.LUP;
        var dx = maal.x - L.x, dy = maal.y - L.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        ctx.save();
        ctx.globalAlpha = alfa;
        if (d > L.r + 6) {
            var th = Math.atan2(dy, dx), al = Math.acos(L.r / d);
            var t1 = { x: L.x + L.r * Math.cos(th + al), y: L.y + L.r * Math.sin(th + al) };
            var t2 = { x: L.x + L.r * Math.cos(th - al), y: L.y + L.r * Math.sin(th - al) };
            ctx.beginPath();
            ctx.moveTo(maal.x, maal.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.lineTo(t2.x, t2.y);
            ctx.closePath();
            ctx.fillStyle = "rgba(190, 220, 245, 0.05)";
            ctx.fill();
            ctx.setLineDash([4, 5]);
            ctx.strokeStyle = "rgba(210, 230, 250, 0.4)";
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.arc(L.x, L.y, L.r, 0, Math.PI * 2);
        ctx.fillStyle = "#1a1f27";
        ctx.fill();
        ctx.save();
        ctx.clip();
        tegnIndhold(ctx, L);
        ctx.restore();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#3a414c";
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.stroke();
        if (titel) {
            ctx.font = "700 13px 'Segoe UI', sans-serif";
            var b = ctx.measureText(titel).width + 16;
            ctx.fillStyle = "rgba(20, 22, 28, 0.92)";
            NK.rundtRekt(ctx, L.x - b / 2, L.y + L.r - 12, b, 22, 7);
            ctx.fill();
            NK.tekst(ctx, titel, L.x, L.y + L.r - 0.5, { font: "700 13px 'Segoe UI', sans-serif", justering: "center", linje: "middle", farve: "#f2c53d" });
        }
        ctx.restore();
    };
}());
