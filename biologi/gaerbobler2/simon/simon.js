/* =====================================================================
   simon.js - SM-Simon, laereren i gaerforsoeget

   Bygget efter samme moenster som Kemichael i kemiformler.dk's
   superanimationer, men skrevet ind her, saa mappen virker for sig selv.
   Personen og glimtene af hans baggrund staar i README.md.

   Filen indlaeses efter sprites.js og foer scene.js:

     <script src="js/sprites.js"></script>
     <script src="simon/simon.js"></script>
     <script src="js/scene.js"></script>

   js/laerer.js kobler figuren paa forsoeget:

     NK.Simon.paa(NK.Forsoeg.prototype, { kaffeX: 170, fredet: ["tabt"] });

   Laereren optraeder i smaa scener (laererKoer): en liste af trin.
     { gaa: x, loeb }       gaa (eller loeb) hen til x; x kan vaere en funktion
     { sig: tekst, vis }    taleboble i vis sekunder
     { arm: vinkel, tid }   drej armen om skulderen (0 lige op, HAENGER ned)
     { udtryk: { ... } }    vrede, humoer, roed, skeptisk, kig (kigger op
                            under brynene), laen (laener sig ind)
     { tid, hver(t) }       vent; hver kaldes undervejs med t fra 0 til 1
     { kald() }             kald en funktion
     S.suk(tid)             oejnene lukkes, og hovedet synker

   Kroge paa prototypen (frivillige): laererStartEkstra, laererNytEkstra,
   laererVentende, opdaterLaererEkstra, tegnBaaretEkstra.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;

    var UDE = -320;
    var KANT = 14;
    var HAENGER = 2.9;

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

    function suk(tid) {
        return { tid: tid || 1.2, hver: function (t) {
            var s = Math.sin(Math.PI * t);
            this.laerer.lukket = s;
            this.laerer.nik = 6 * s;
        } };
    }

    function tegnTaleboble(ctx, x, y, tekst, alfa, hx, hy) {
        if (alfa < 0.01 || !tekst) return;
        var font = "700 17px 'Segoe UI', sans-serif";
        ctx.save();
        ctx.globalAlpha = NK.klamp(alfa, 0, 1);
        ctx.font = font;
        var b = ctx.measureText(tekst).width + 28, h = 38;
        var bx = NK.klamp(x - b / 2, 8, NK.Scene.BREDDE - b - 8);
        ctx.fillStyle = "#fffdf6";
        ctx.strokeStyle = "#2a2f36";
        ctx.lineWidth = 2;
        NK.rundtRekt(ctx, bx, y, b, h, 12);
        ctx.fill();
        ctx.stroke();
        var hale = NK.klamp(hx, bx + 16, bx + b - 16);
        ctx.beginPath();
        ctx.moveTo(hale - 8, y + h - 1);
        ctx.lineTo(hx, hy);
        ctx.lineTo(hale + 8, y + h - 1);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hale - 8, y + h);
        ctx.lineTo(hx, hy);
        ctx.lineTo(hale + 8, y + h);
        ctx.stroke();
        NK.tekst(ctx, tekst, bx + b / 2, y + h / 2 + 1, { font: font, justering: "center", linje: "middle", farve: "#1f2328" });
        ctx.restore();
    }

    function paa(P, valg) {
        valg = valg || {};
        var S = NK.Scene;
        var r = NK.r;
        var kaffeX = valg.kaffeX === undefined ? 170 : valg.kaffeX;
        var fredet = (valg.fredet || []).concat("gaaUd");

        P.laererStart = function () {
            this.laerer = {
                x: UDE, maalX: UDE, y: 420, loeb: false, gang: 0,
                scene: null,
                tale: "", taleUr: 0, taleAlfa: 0, taleLaengde: 0,
                vrede: 0.3, humoer: 0.1, roed: 0, skeptisk: 0, kig: 0, laen: 0,
                vredeMaal: 0.3, humoerMaal: 0.1, roedMaal: 0, skeptiskMaal: 0, kigMaal: 0, laenMaal: 0,
                aaben: 0, blinkUr: 2, blink: 0, lukket: 0, nik: 0, damp: 0,
                arm: HAENGER, armFra: HAENGER, armTil: HAENGER,
                baerer: null, klik: 0, plakatRegel: 0, rost: false,
                dampe: []
            };
            if (this.laererStartEkstra) this.laererStartEkstra();
        };

        P.laererNyt = function () {
            var L = this.laerer;
            if (!L) return;
            if (L.scene) {
                L.scene = null;
                L.maalX = UDE;
                L.tale = "";
                L.taleUr = 0;
                L.arm = HAENGER;
                L.plakatRegel = 0;
                L.skeptiskMaal = 0;
                L.kigMaal = 0;
                L.laenMaal = 0;
            }
            L.lukket = 0;
            if (this.laererNytEkstra) this.laererNytEkstra();
        };

        P.laererOptaget = function () {
            var L = this.laerer;
            return !!(L && L.scene && L.scene.blokerer);
        };

        P.laererVisning = function () {
            return { plakatRegel: this.laerer ? this.laerer.plakatRegel : 0 };
        };

        P.laererKoer = function (navn, trin, blokerer) {
            this.laerer.scene = { navn: navn, trin: trin, i: 0, t: 0, blokerer: blokerer !== false };
            this.aendret("laerer");
        };

        P.laererKrop = function () {
            var L = this.laerer;
            var gaar = L.x !== L.maalX;
            var bob = gaar ? Math.abs(Math.sin(L.gang)) * -4 : 0;
            return { x: L.x, y: L.y + bob, v: (gaar ? Math.sin(L.gang) * 0.025 : 0) + L.laen * 0.04 };
        };

        P.laererSkulder = function () {
            return NK.tilVerden(this.laererKrop(), S.ANKER.simonKrop, 198, 62);
        };

        P.laererHaand = function () {
            var sk = this.laererSkulder();
            return NK.tilVerden({ x: sk.x, y: sk.y, v: this.laerer.arm }, S.ANKER.simonArm, 30, 36);
        };

        /* ----- Kaffen i krusset --------------------------------------------- */
        P.klikKop = function () {
            var L = this.laerer, kop = this.g.kaffekop;
            if (L.scene || kop.skjult) return false;
            var kold = glimt("kaffeKold");
            this.laererKoer("kaffe", [
                { udtryk: { vrede: 0.7, humoer: -0.4, roed: 0.1 } },
                { gaa: kaffeX },
                { sig: "Det er mit krus.", vis: 2.2, tid: 0.3 },
                { arm: -0.5, tid: 0.55 },
                { kald: function () { kop.iHaand = true; this.laerer.baerer = "simonKop"; } },
                { arm: -0.98, tid: 0.6 },
                { kald: function () { if (NK.Lyd) NK.Lyd.slurk(); } }
            ].concat(kold ? [
                { udtryk: { vrede: 0.2, humoer: -0.3, roed: 0 } },
                { tid: 0.5 },
                suk(1.1),
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

        /* ----- Klik paa laereren ------------------------------------------ */
        P.overLaerer = function (pt) {
            var L = this.laerer;
            if (!L || L.x < -100) return null;
            if (pt.x > L.x - 118 && pt.x < L.x + 124 && pt.y > L.y - 112 && pt.y < S.HOEJDE + 40) return "laerer";
            return null;
        };

        P.klikLaerer = function () {
            var L = this.laerer;
            if (!L || L.x < -100 || (L.scene && fredet.indexOf(L.scene.navn) >= 0)) return false;
            L.klik++;
            L.vredeMaal = 1;
            L.humoerMaal = -1;
            if (L.klik <= SVAR.length) {
                var navn = L.klik === 1 ? glimt("navn") : null;
                this.laererSig(navn || SVAR[L.klik - 1], navn ? 2.6 : 1.6);
                L.roedMaal = Math.min(1, 0.22 * L.klik);
                return true;
            }
            L.roedMaal = 1;
            L.damp = 3;
            this.laererSig("Nu går jeg.", 1.6);
            if (NK.Lyd) NK.Lyd.brum();
            var blokerede = L.scene && L.scene.blokerer;
            this.laererKoer("gaaUd", [{ arm: HAENGER, tid: 0.3 }, { tid: 1.1 }, { gaa: UDE }], !!blokerede);
            return true;
        };

        P.laererSig = function (tekst, vis) {
            var L = this.laerer;
            L.tale = tekst;
            L.taleUr = vis || 2;
            L.taleLaengde = Math.min(1.6, 0.12 + tekst.length * 0.045);
            L.taleStart = this.tid;
            if (NK.Lyd) NK.Lyd.mumle(Math.max(1, Math.min(8, Math.round(tekst.length / 5))));
        };

        /* ----- Tidens gang ------------------------------------------------- */
        P.opdaterLaerer = function (dt) {
            var L = this.laerer;
            if (!L) return;
            var i;

            var sc = L.scene, vagt = 0, rest = dt;
            while (sc && L.scene === sc && vagt++ < 30) {
                var tr = sc.trin[sc.i];
                if (!tr) { L.scene = null; this.aendret("laerer"); break; }
                if (tr.kald) { tr.kald.call(this); sc.i++; sc.t = 0; continue; }
                if (tr.udtryk) {
                    var u = tr.udtryk;
                    if (u.vrede !== undefined) L.vredeMaal = u.vrede;
                    if (u.humoer !== undefined) L.humoerMaal = u.humoer;
                    if (u.roed !== undefined) L.roedMaal = u.roed;
                    if (u.skeptisk !== undefined) L.skeptiskMaal = u.skeptisk;
                    if (u.kig !== undefined) L.kigMaal = u.kig;
                    if (u.laen !== undefined) L.laenMaal = u.laen;
                    sc.i++; sc.t = 0;
                    continue;
                }
                if (!tr.startet) {
                    tr.startet = true;
                    if (tr.gaa !== undefined) { L.maalX = typeof tr.gaa === "function" ? tr.gaa.call(this) : tr.gaa; L.loeb = !!tr.loeb; }
                    if (tr.sig) this.laererSig(tr.sig, tr.vis);
                    if (tr.arm !== undefined) { L.armFra = L.arm; L.armTil = tr.arm; }
                }
                sc.t += rest;
                rest = 0;
                var t = tr.tid ? Math.min(1, sc.t / tr.tid) : 1;
                if (tr.arm !== undefined) L.arm = NK.lerp(L.armFra, L.armTil, NK.blod(t));
                if (tr.hver) tr.hver.call(this, t);
                var klar = t >= 1;
                if (tr.gaa !== undefined) klar = Math.abs(L.x - L.maalX) < 1;
                if (!klar) break;
                sc.i++;
                sc.t = 0;
            }

            if (this.laererVentende) this.laererVentende();

            /* Korte ben: lidt hurtigere skridt */
            var fart = L.loeb ? 780 : 400;
            if (L.x !== L.maalX) {
                var d = L.maalX - L.x;
                L.x += Math.sign(d) * Math.min(Math.abs(d), fart * dt);
                L.gang += dt * (L.loeb ? 18 : 12);
            }
            if (L.x <= UDE + 1 && !L.scene) { L.klik = 0; L.roedMaal = 0; L.damp = 0; L.kigMaal = 0; L.laenMaal = 0; L.vredeMaal = 0.3; L.humoerMaal = 0.1; }

            L.vrede = NK.mod(L.vrede, L.vredeMaal, 5, dt);
            L.humoer = NK.mod(L.humoer, L.humoerMaal, 5, dt);
            L.roed = NK.mod(L.roed, L.roedMaal, 3, dt);
            L.skeptisk = NK.mod(L.skeptisk, L.skeptiskMaal, 5, dt);
            L.kig = NK.mod(L.kig, L.kigMaal, 6, dt);
            L.laen = NK.mod(L.laen, L.laenMaal, 6, dt);
            L.taleUr -= dt;
            L.taleAlfa = NK.mod(L.taleAlfa, L.taleUr > 0 ? 1 : 0, 12, dt);
            var taler = L.taleUr > 0 && this.tid - (L.taleStart || 0) < L.taleLaengde;
            L.aaben = NK.mod(L.aaben, taler ? 0.5 + 0.5 * Math.sin(this.tid * 22) : 0, 20, dt);
            L.blinkUr -= dt;
            if (L.blinkUr <= 0) { L.blink = 0.14; L.blinkUr = r(2, 5); }
            L.blink = Math.max(0, L.blink - dt);

            if (L.damp > 0) {
                L.damp -= dt;
                if (Math.random() < dt * 12) {
                    var hk = this.laererKrop();
                    var side = Math.random() < 0.5 ? -1 : 1;
                    L.dampe.push({ x: hk.x + side * 48, y: hk.y - 62, vx: side * r(20, 50), vy: -r(40, 80), r: r(4, 7), liv: 1 });
                }
            }
            for (i = L.dampe.length - 1; i >= 0; i--) {
                var dp = L.dampe[i];
                dp.x += dp.vx * dt;
                dp.y += dp.vy * dt;
                dp.r += dt * 10;
                dp.liv -= dt * 1.4;
                if (dp.liv <= 0) L.dampe.splice(i, 1);
            }

            if (this.opdaterLaererEkstra) this.opdaterLaererEkstra(dt);
        };

        /* ----- Ansigtet: oejne, bryn og munden i skaegget ------------------ */
        P.tegnAnsigt = function (ctx, L) {
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
            /* Bryn: kraftige og moerke */
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
            /* Munden sidder i skaegget */
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
        };

        P.tegnBaaret = function (ctx, L) {
            if (!L.baerer) return;
            var hd = this.laererHaand();
            if (L.baerer === "simonKop") {
                NK.Sprites.tegnPositur(ctx, "simonKop", { x: hd.x + 8, y: hd.y + 26, v: 0 }, S.ANKER.simonKop);
            } else if (this.tegnBaaretEkstra) {
                this.tegnBaaretEkstra(ctx, L, hd);
            }
        };

        P.tegnLaerer = function (ctx, tid) {
            var L = this.laerer;
            if (!L) return;
            var i;
            if (L.x < UDE + 40 && !L.scene) return;
            var krop = this.laererKrop();
            var sk = this.laererSkulder();
            var armBag = Math.abs(L.arm) > 2;
            var armPositur = { x: sk.x, y: sk.y, v: L.arm };

            if (armBag) NK.Sprites.tegnPositur(ctx, "simonArm", armPositur, S.ANKER.simonArm);

            /* Kitlen fortsaetter ned under spritet */
            var kv = NK.tilVerden(krop, S.ANKER.simonKrop, 5, 246);
            var kh = NK.tilVerden(krop, S.ANKER.simonKrop, 235, 246);
            var kg = ctx.createLinearGradient(kv.x, 0, kh.x, 0);
            kg.addColorStop(0, "#c9d2da");
            kg.addColorStop(0.3, "#f7f9fb");
            kg.addColorStop(0.7, "#eef2f5");
            kg.addColorStop(1, "#bcc6cf");
            ctx.fillStyle = kg;
            ctx.fillRect(kv.x, kv.y, kh.x - kv.x, 1500);
            ctx.fillStyle = "#9aa6b1";
            ctx.fillRect(krop.x - 1, kv.y, 2, 1500);
            NK.Sprites.tegnPositur(ctx, "simonKrop", krop, S.ANKER.simonKrop);

            var ryst = L.taleUr > 0 ? Math.sin(tid * 9) * 0.05 * L.vrede * (L.humoer < 0 ? 1 : 0) : 0;
            var hoved = {
                x: krop.x + L.laen * 10,
                y: krop.y + 14 + L.nik,
                v: krop.v + ryst + L.laen * 0.18
            };
            NK.Sprites.tegnPositur(ctx, "simonHoved", hoved, S.ANKER.simonHoved);
            ctx.save();
            ctx.translate(hoved.x, hoved.y);
            ctx.rotate(hoved.v);
            ctx.translate(-S.ANKER.simonHoved.x, -S.ANKER.simonHoved.y);
            this.tegnAnsigt(ctx, L);
            ctx.restore();

            if (!armBag) NK.Sprites.tegnPositur(ctx, "simonArm", armPositur, S.ANKER.simonArm);
            this.tegnBaaret(ctx, L);

            ctx.save();
            for (i = 0; i < L.dampe.length; i++) {
                var d = L.dampe[i];
                ctx.globalAlpha = NK.klamp(d.liv, 0, 1) * 0.7;
                ctx.fillStyle = "#f4f6f8";
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            var top = krop.y - 118;
            tegnTaleboble(ctx, krop.x + 160, top - 44, L.tale, L.taleAlfa, krop.x + 56, top + 46);
        };
    }

    NK.Simon = {
        UDE: UDE,
        KANT: KANT,
        HAENGER: HAENGER,
        MAPPE: MAPPE,
        SPRITES: SPRITES,
        ANKER: ANKER,
        GLIMT: GLIMT,
        paa: paa,
        glimt: glimt,
        glimtTrin: glimtTrin,
        uheld: uheld,
        glimtNulstil: glimtNulstil,
        suk: suk
    };
}());
