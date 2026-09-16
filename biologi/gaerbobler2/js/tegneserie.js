/* =====================================================================
   tegneserie.js - forsoeget opsummeret som en tegneserie

   Bag knappen Tegneserie, som laases op, naar der er talt bobler i alle
   tre kolber. Hver rude er et udsnit af tegnebordet, tegnet med de samme
   funktioner som scenen, og en kort tekst med elevens egne tal. Hver fejl
   faar sin egen roede rude. Resultatskemaet og grafen staar i den sidste.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;
    var S = NK.Scene;
    var M = NK.Model;
    var A = S.ANKER;

    var B = 300, H = 214;

    var UDSNIT = {
        hylde:  { x: 620, y: 60, b: 380 },
        bord:   { x: 380, y: 330, b: 340 },
        alle:   { x: 395, y: 105, b: 600 },
        gulv:   { x: 280, y: 400, b: 300 }
    };
    function omkring(x) { return { x: x - 196, y: 225, b: 392 }; }

    function rude(container, nr, tekst, o) {
        var div = document.createElement("div");
        div.className = "rude" + (o.fejl ? " fejl" : "");
        var canvas = document.createElement("canvas");
        var dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(B * dpr);
        canvas.height = Math.round(H * dpr);
        var ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var u = o.udsnit || UDSNIT.bord;
        var s = B / u.b;
        ctx.save();
        ctx.scale(s, s);
        ctx.translate(-u.x, -u.y);
        baggrund(ctx, u);
        if (o.tegn) o.tegn(ctx);
        ctx.restore();
        if (o.oven) o.oven(ctx);
        div.appendChild(canvas);
        var p = document.createElement("p");
        var sp = document.createElement("span");
        sp.className = "nr";
        sp.textContent = String(nr);
        p.appendChild(sp);
        p.appendChild(document.createTextNode(tekst));
        div.appendChild(p);
        container.appendChild(div);
    }

    function baggrund(ctx, u) {
        var h = u.b * H / B;
        var g = ctx.createLinearGradient(0, u.y, 0, S.BORD);
        g.addColorStop(0, "#232a33");
        g.addColorStop(1, "#303843");
        ctx.fillStyle = g;
        ctx.fillRect(u.x - 2, u.y - 2, u.b + 4, h + 4);
        ctx.fillStyle = "#6b4a2c";
        ctx.fillRect(S.HYLDE_H.x0, S.HYLDE_H.y, S.HYLDE_H.x1 - S.HYLDE_H.x0, 8);
        ctx.fillStyle = "#3b404b";
        ctx.fillRect(u.x - 2, S.BORD, u.b + 4, 9);
        ctx.fillStyle = "#1c1f26";
        ctx.fillRect(u.x - 2, S.BORD + 9, u.b + 4, h);
    }

    function tavle(ctx) {
        ctx.fillStyle = "#1d2128";
        ctx.fillRect(0, 0, B, H);
    }

    function etiket(ctx, t, x, y, opt) {
        opt = opt || {};
        NK.tekst(ctx, t, x, y, {
            font: opt.font || "700 13px 'Segoe UI', sans-serif", justering: opt.justering || "center", linje: "middle",
            farve: opt.farve || "#dfe5ec", kant: true
        });
    }

    /* En kolbe med et bestemt indhold */
    function kolbe(ctx, plads, o) {
        o = o || {};
        var m = M.nyKolbe();
        m.sukker = o.sukker === undefined ? 25 : o.sukker;
        m.gaer = o.gaer === undefined ? 20 : o.gaer;
        m.vand = o.vand === undefined ? 100 : o.vand;
        m.roert = o.roert === undefined ? true : o.roert;
        m.btb = o.btb || 0;
        m.kaffe = o.kaffe || 0;
        m.dannet = o.dannet || 0;
        var p = o.p || S.kolbePaa(plads);
        var bobler = [];
        for (var i = 0; i < (o.bobler || 0); i++) bobler.push({ x: 48 + Math.sin(i * 2.3) * 24, y: 118 - (i * 13) % 50, r: 1 + (i % 3) * 0.5 });
        S.skygge(ctx, p.x, 44, 0.3, plads.y);
        S.tegnKolbe(ctx, { p: p, ml: m.vand > 0 ? M.rumfang(m) + (o.ekstraMl || 0) : 0, farve: M.kolbeFarve(m), sukker: m.sukker, gaer: m.gaer,
            roert: m.roert && m.vand > 0, bobler: bobler, skum: o.skum || 0, nr: o.nr, prop: !!o.roer }, 0);
        if (o.roer) {
            var ro = M.nytRoer();
            ro.vand = o.roer.vand === undefined ? 8 : o.roer.vand;
            ro.btb = o.roer.btb === undefined ? 3 : o.roer.btb;
            ro.C = o.roer.C || M.nytRoer().C;
            S.tegnRoer(ctx, { p: S.roerPaaKolbe(p), farve: M.roerFarve(ro), bobler: o.roer.bobler || [], overloeb: o.roer.overloeb || 0 }, 0.3);
        }
        return p;
    }

    function roerI(ctx, i, C, vand) {
        var ro = M.nytRoer();
        ro.vand = vand === undefined ? 8 : vand;
        ro.btb = 3;
        ro.C = C;
        S.tegnRoer(ctx, { p: S.roerIStativ(i), farve: M.roerFarve(ro) }, 0);
    }

    function plade(ctx, n, temp) {
        S.tegnVarmeplade(ctx, S.PLADS[3 + n], temp, temp, false, 0);
    }

    function soejle(ctx, y, navn, v, maks) {
        etiket(ctx, navn, 14, y, { justering: "left", font: "600 12px 'Segoe UI', sans-serif", farve: "#c8ced6" });
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        NK.rundtRekt(ctx, 120, y - 7, 130, 14, 7);
        ctx.fill();
        ctx.fillStyle = "#f2c53d";
        NK.rundtRekt(ctx, 120, y - 7, 130 * NK.klamp(v / Math.max(1, maks), 0.02, 1), 14, 7);
        ctx.fill();
        etiket(ctx, String(v), 288, y, { justering: "right" });
    }

    function tempTekst(k) {
        var t = k.taelling;
        return (t && t.tMaalt !== null ? t.tMaalt : Math.round(t ? t.tSand : k.m.temp)) + " °C";
    }

    NK.Tegneserie = {
        byg: function (f, container) {
            container.innerHTML = "";
            var nr = 0;
            var gj = f.iagttaget;
            var K = f.kolber;
            var tal = K.map(function (k) { return k.taelling ? k.taelling.perMin : 0; });
            var raa = K.map(function (k) { return k.taelling ? k.taelling.klik : 0; });
            var steder = K.map(function (k) { return k.sted || S.PLADS[k.i]; });

            rude(container, ++nr, "Gærrørene fyldes med vand og nogle dråber BTB. Vandet er blåt.", {
                udsnit: UDSNIT.hylde,
                tegn: function (ctx) { for (var i = 0; i < 3; i++) roerI(ctx, i, 2.8e-5); S.tegnStativ(ctx); }
            });

            rude(container, ++nr, "Hver kolbe får 25 g sukker, 20 g gær og 100 mL vand, og der røres rundt.", {
                udsnit: UDSNIT.bord,
                tegn: function (ctx) { for (var i = 0; i < 3; i++) kolbe(ctx, S.PLADS[i], { nr: i + 1 }); }
            });

            rude(container, ++nr, "Kolberne står ved " + tempTekst(K[0]) + ", " + tempTekst(K[1]) + " og " + tempTekst(K[2]) + ". Gærrørene sættes på.", {
                udsnit: UDSNIT.alle,
                tegn: function (ctx) {
                    plade(ctx, 0, f.plader.pladeA.indstillet);
                    plade(ctx, 1, f.plader.pladeB.indstillet);
                    K.forEach(function (k, i) {
                        var p = kolbe(ctx, steder[i], { nr: k.nr, roer: {}, bobler: 6 });
                        S.tegnAflaesning(ctx, p.x - 30, p.y - 120, tempTekst(k), 1);
                    });
                }
            });

            rude(container, ++nr, "Gæren omdanner sukker til ethanol og CO₂: C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂. CO₂ bobler op gennem vandet i gærrøret.", {
                udsnit: omkring(S.PLADS[3].x + 30),
                tegn: function (ctx) {
                    plade(ctx, 0, 37);
                    kolbe(ctx, S.PLADS[3], { nr: 2, bobler: 14, skum: 0.6, roer: { C: 4e-4, bobler: [{ t: 0.2, pop: 0 }, { t: 0.55, pop: 0 }, { t: 0.9, pop: 0 }] } });
                }
            });

            rude(container, ++nr, "CO₂ gør vandet i gærrøret surt. BTB skifter fra blå over grøn mod gul, hurtigst der, hvor der kommer flest bobler.", {
                udsnit: UDSNIT.hylde,
                tegn: function (ctx) { roerI(ctx, 0, 2.8e-5); roerI(ctx, 1, 6e-4); roerI(ctx, 2, 1.2e-2); S.tegnStativ(ctx); }
            });

            var maks = Math.max.apply(null, tal.concat([10]));
            rude(container, ++nr, "Du talte " + raa[0] + ", " + raa[1] + " og " + raa[2] + " bobler på ti sekunder. Ganget op med seks bliver det " + tal[0] + ", " + tal[1] + " og " + tal[2] + " pr. minut.", {
                oven: function (ctx) {
                    tavle(ctx);
                    etiket(ctx, "Bobler pr. minut", B / 2, 26, { font: "700 14px 'Segoe UI', sans-serif", farve: "#f2c53d" });
                    K.forEach(function (k, i) { soejle(ctx, 76 + i * 44, k.navn + " · " + tempTekst(k), tal[i], maks); });
                }
            });

            /* Fejl og uheld: én roed rude for hver */
            var skaev = K.filter(function (k) { return k.taelling && k.taelling.vand && Math.abs(k.taelling.klik - k.taelling.sande) > Math.max(3, k.taelling.sande * 0.25); })[0];
            var FEJL = [
                ["ingenSukker", "En kolbe fik ingen sukker. Uden sukker har gæren intet at omdanne, og der kommer ingen CO₂.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { sukker: 0, nr: 2, roer: {} }); }],
                ["ingenGaer", "En kolbe fik ingen gær. Sukkervand gærer ikke af sig selv.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { gaer: 0, nr: 2, roer: {} }); }],
                ["ingenVand", "Gærrøret kom på en kolbe uden vand. Tør gær kan ikke omdanne sukker.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { vand: 0, roert: false, nr: 2, roer: {} }); }],
                ["dobbeltGaer", "En kolbe fik dobbelt så meget gær. Så gærer den hurtigere, og kolberne kan ikke sammenlignes.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { gaer: 40, roert: false, nr: 2 }); }],
                ["dobbeltSukker", "En kolbe fik ekstra sukker. Det ændrer ikke meget: sukkeret slipper ikke op på et minut.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { sukker: 50, roert: false, nr: 2 }); }],
                ["ikkeRoert", "Der blev ikke rørt rundt i en kolbe. Gæren kom langsommere i gang.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { roert: false, nr: 2 }); }],
                ["btbKolbe", "BTB kom i kolben i stedet for i gærrøret. Nu skifter hele kolben farve.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { btb: 3, dannet: 80, nr: 2 }); }],
                ["overloeb", "Der kom for meget vand i en kolbe, og den løb over.", UDSNIT.bord, function (ctx) {
                    S.tegnPyt(ctx, { x: S.PLADS[1].x, y: S.BORD, rx: 56, alfa: 1 });
                    kolbe(ctx, S.PLADS[1], { vand: 200, nr: 2 });
                }],
                ["roerOverloeb", "Der kom for meget vand i et gærrør, og det løb over.", UDSNIT.hylde, function (ctx) {
                    roerI(ctx, 0, 2.8e-5); S.tegnRoer(ctx, { p: S.roerIStativ(1), farve: M.roerFarve({ vand: 11, btb: 3, C: 2.8e-5 }), overloeb: 1 }, 0.4); roerI(ctx, 2, 2.8e-5);
                    S.tegnStativ(ctx);
                }],
                ["tabt", "En kolbe blev tabt på gulvet. SM-Simon fejede op og stillede en ny frem.", UDSNIT.gulv, function (ctx) {
                    S.tegnSkaar(ctx, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return { x: 330 + (i * 37) % 200, y: 576 + (i * 7) % 20, a: i, s: 1.1 }; }));
                }],
                ["kogt", "En kolbe blev varmet til over 70 °C. Over ca. 50 °C dør gærcellerne, og de kommer ikke til live igen, når kolben køler af.", omkring(S.PLADS[3].x + 30), function (ctx) {
                    plade(ctx, 0, 90);
                    var p = kolbe(ctx, S.PLADS[3], { nr: 3 });
                    S.tegnDampe(ctx, [0, 1, 2, 3].map(function (i) { return { x: p.x - 6 + i * 5, y: p.y - 10 - i * 18, r: 6 + i * 3, liv: 1, alfa: 0.35 }; }));
                }],
                ["ingenRoer", "Der blev talt bobler i en kolbe uden gærrør. CO₂ forsvinder ud af halsen uden at blive set.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { nr: 2, skum: 0.5, bobler: 12 }); }],
                ["tomtRoer", "Et gærrør uden vand kom på en kolbe. Uden vand kan boblerne ikke ses eller tælles.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { nr: 2, bobler: 10, roer: { vand: 0 } }); }],
                ["ingenBtb", "Et gærrør havde vand, men ingen BTB. Boblerne kan tælles, men farveskiftet kan ikke ses.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { nr: 2, bobler: 10, roer: { btb: 0 } }); }],
                ["luftbobler", "Der blev talt, mens kolben stadig blev varmere. Luften i kolben udvider sig og giver bobler, der ikke kommer fra gæren.", omkring(S.PLADS[3].x + 30), function (ctx) {
                    plade(ctx, 0, 60);
                    kolbe(ctx, S.PLADS[3], { nr: 3, sukker: 0, gaer: 0, roer: { bobler: [{ t: 0.3, pop: 0 }, { t: 0.8, pop: 0 }] } });
                }],
                ["nulBobler", "Der blev talt, før gæren var kommet i gang. Uret kan spole tiden frem.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { nr: 2, roert: false, roer: {} }); }],
                ["kaffeIKolbe", "Der kom kaffe i en kolbe. Den bliver brun og lidt varmere, men gæren gærer videre.", UDSNIT.bord, function (ctx) { kolbe(ctx, S.PLADS[1], { nr: 2, kaffe: 30, ekstraMl: 30, bobler: 8 }); }],
                ["skaevTaelling", skaev ? "I " + skaev.navn.toLowerCase() + " talte du " + skaev.taelling.klik + " bobler på ti sekunder, men der kom " + skaev.taelling.sande + "." : "En tælling passede ikke med boblerne.", null, null],
                ["samme", "To kolber havde næsten samme temperatur. Så kan temperaturens betydning ikke ses.", UDSNIT.alle, function (ctx) {
                    K.forEach(function (k, i) { var p = kolbe(ctx, steder[i], { nr: k.nr, roer: {} }); S.tegnAflaesning(ctx, p.x - 30, p.y - 120, tempTekst(k), 1); });
                }]
            ];
            FEJL.forEach(function (fj) {
                if (!gj[fj[0]]) return;
                if (fj[3]) rude(container, ++nr, fj[1], { udsnit: fj[2], tegn: fj[3], fejl: true });
                else rude(container, ++nr, fj[1], { fejl: true, oven: function (ctx) {
                    tavle(ctx);
                    etiket(ctx, "Talt: " + (skaev ? skaev.taelling.klik : "?"), B / 2, 80, { font: "800 22px 'Segoe UI', sans-serif", farve: "#f0918a" });
                    etiket(ctx, "Bobler: " + (skaev ? skaev.taelling.sande : "?"), B / 2, 130, { font: "800 22px 'Segoe UI', sans-serif" });
                } });
            });

            skema(container, ++nr, f);
        }
    };

    /* ----- Resultatskemaet og grafen ----------------------------------------- */
    var FARVER = ["#f2c53d", "#3d9ee0", "#3fae72", "#e6892a"];

    function skema(container, nr, f) {
        var div = document.createElement("div");
        div.className = "rude skema";
        var p = document.createElement("p");
        var sp = document.createElement("span");
        sp.className = "nr";
        sp.textContent = String(nr);
        p.appendChild(sp);
        p.appendChild(document.createTextNode("Resultater"));
        div.appendChild(p);

        var liste = f.resultater.slice(-4);
        var tabel = document.createElement("table");
        tabel.className = "resultater";
        var hoved = document.createElement("tr");
        ["", "Kolbe 1", "Kolbe 2", "Kolbe 3"].forEach(function (t) { var th = document.createElement("th"); th.textContent = t; hoved.appendChild(th); });
        tabel.appendChild(hoved);
        liste.forEach(function (res) {
            var tr = document.createElement("tr");
            var th = document.createElement("th");
            th.textContent = "Forsøg " + res.nr;
            th.style.color = FARVER[(res.nr - 1) % FARVER.length];
            tr.appendChild(th);
            res.raekker.forEach(function (x) {
                var td = document.createElement("td");
                td.textContent = x.temp + " °C · " + x.bobler + " /min";
                if (res.nr === f.forsoegNr) td.className = "aktuel";
                tr.appendChild(td);
            });
            tabel.appendChild(tr);
        });
        div.appendChild(tabel);

        /* Grafen: bobler pr. minut mod temperaturen */
        var GB = 620, GH = 240;
        var c = document.createElement("canvas");
        var dpr = window.devicePixelRatio || 1;
        c.width = GB * dpr;
        c.height = GH * dpr;
        c.style.aspectRatio = GB + " / " + GH;
        var ctx = c.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#1d2128";
        ctx.fillRect(0, 0, GB, GH);
        var x0 = 56, x1 = GB - 20, y0 = GH - 40, y1 = 16;
        var maks = 10;
        liste.forEach(function (res) { res.raekker.forEach(function (x) { maks = Math.max(maks, x.bobler); }); });
        maks = Math.ceil(maks / 10) * 10;
        function gx(t) { return x0 + (x1 - x0) * NK.klamp(t, 0, 90) / 90; }
        function gy(b) { return y0 - (y0 - y1) * b / maks; }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        var i;
        for (i = 0; i <= 90; i += 10) {
            ctx.beginPath(); ctx.moveTo(gx(i), y0); ctx.lineTo(gx(i), y1); ctx.stroke();
            NK.tekst(ctx, String(i), gx(i), y0 + 16, { font: "600 12px 'Segoe UI', sans-serif", justering: "center", farve: "#9fa6af" });
        }
        for (i = 0; i <= 4; i++) {
            var b = maks * i / 4;
            ctx.beginPath(); ctx.moveTo(x0, gy(b)); ctx.lineTo(x1, gy(b)); ctx.stroke();
            NK.tekst(ctx, String(Math.round(b)), x0 - 8, gy(b) + 4, { font: "600 12px 'Segoe UI', sans-serif", justering: "right", farve: "#9fa6af" });
        }
        NK.tekst(ctx, "Temperatur (°C)", (x0 + x1) / 2, GH - 6, { font: "700 12px 'Segoe UI', sans-serif", justering: "center", farve: "#c8ced6" });
        ctx.save();
        ctx.translate(16, (y0 + y1) / 2);
        ctx.rotate(-Math.PI / 2);
        NK.tekst(ctx, "Bobler pr. minut", 0, 0, { font: "700 12px 'Segoe UI', sans-serif", justering: "center", farve: "#c8ced6" });
        ctx.restore();
        liste.forEach(function (res) {
            var farve = FARVER[(res.nr - 1) % FARVER.length];
            var pkt = res.raekker.slice().sort(function (a, b2) { return a.temp - b2.temp; });
            ctx.strokeStyle = farve;
            ctx.lineWidth = 2;
            ctx.beginPath();
            pkt.forEach(function (x, j) { if (j === 0) ctx.moveTo(gx(x.temp), gy(x.bobler)); else ctx.lineTo(gx(x.temp), gy(x.bobler)); });
            ctx.stroke();
            pkt.forEach(function (x) {
                ctx.fillStyle = farve;
                ctx.beginPath();
                ctx.arc(gx(x.temp), gy(x.bobler), 5, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        div.appendChild(c);

        var note = document.createElement("p");
        note.className = "skema-note";
        note.textContent = "Hvert forsøg har sin farve. Temperaturen er den, du målte med termometeret.";
        div.appendChild(note);
        container.appendChild(div);
    }
}());
