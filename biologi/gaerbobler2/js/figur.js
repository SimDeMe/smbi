/* =====================================================================
   figur.js - en laerer paa scenen: gang, arm, ansigt og taleboble

   Maskinrummet bag SM-Simon (simon/simon.js) og Kemi-Niller
   (niller/niller.js). Begge kobles paa forsoegets prototype med

     NK.Figur.paa(NK.Forsoeg.prototype, NK.Simon.cfg);

   og faar deres eget saet metoder ud fra cfg.praefiks. For "laerer"
   hedder de laererStart, laererNyt, laererKoer, laererSig, laererOptaget,
   laererKrop, laererSkulder, laererHaand, opdaterLaerer, tegnLaerer,
   overLaerer og klikLaerer. Tilstanden ligger i this[praefiks].

   En figur optraeder i smaa scener: en liste af trin, der koeres efter
   hinanden.
     { gaa: x, loeb }       gaa (eller loeb) hen til x; x kan vaere en funktion
     { sig: tekst, vis }    taleboble i vis sekunder
     { arm: vinkel, tid }   drej armen om skulderen (0 lige op, HAENGER ned)
     { udtryk: { ... } }    vrede, humoer, roed, skeptisk, kig, laen
     { tid, hver(t) }       vent; hver kaldes undervejs med t fra 0 til 1
     { kald() }             kald en funktion
     NK.Figur.suk(praefiks)  et suk: oejnene lukkes, og hovedet synker
   Trinene kaldes med forsoeget som this, saa en scene kan roere ved
   bordet. En scene laaser forsoeget, mens den koerer, medmindre
   blokerer er false.

   Kroge, animationen kan definere paa prototypen (alle frivillige):
     <p>StartEkstra()            mere tilstand ved start
     <p>NytEkstra()              mere at nulstille ved nyt forsoeg
     <p>Ventende()               efter scenen: start en scene, der ventede
     opdater<P>Ekstra(dt)        mere at opdatere i hvert billede
     <p>BaaretEkstra(ctx, L, hd) andet i haanden end det, cfg.baaret kender
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;

    var UDE = -320;
    var KANT = 14;
    var HAENGER = 2.9;

    function stor(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    /* Et suk: oejnene lukkes, og hovedet synker og kommer op igen */
    function suk(praefiks, tid) {
        return { tid: tid || 1.2, hver: function (t) {
            var s = Math.sin(Math.PI * t);
            this[praefiks].lukket = s;
            this[praefiks].nik = 6 * s;
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

    function paa(P, cfg) {
        var S = NK.Scene;
        var r = NK.r;
        var p = cfg.praefiks;
        var Stor = stor(p);
        var SP = cfg.sprites;
        var fredet = (cfg.fredet || []).concat("gaaUd");
        var svar = cfg.svar || [];
        var start = cfg.start || {};

        P[p + "Start"] = function () {
            this[p] = {
                x: UDE, maalX: UDE, y: cfg.y, loeb: false, gang: 0,
                scene: null,
                tale: "", taleUr: 0, taleAlfa: 0, taleLaengde: 0,
                vrede: start.vrede === undefined ? 0.3 : start.vrede,
                humoer: start.humoer === undefined ? 0.1 : start.humoer,
                roed: 0, skeptisk: 0, kig: 0, laen: 0,
                vredeMaal: start.vrede === undefined ? 0.3 : start.vrede,
                humoerMaal: start.humoer === undefined ? 0.1 : start.humoer,
                roedMaal: 0, skeptiskMaal: 0, kigMaal: 0, laenMaal: 0,
                aaben: 0, blinkUr: 2, blink: 0, lukket: 0, nik: 0, damp: 0,
                arm: HAENGER, armFra: HAENGER, armTil: HAENGER,
                baerer: null, klik: 0, plakatRegel: 0, rost: false,
                dampe: []
            };
            if (this[p + "StartEkstra"]) this[p + "StartEkstra"]();
        };

        P[p + "Nyt"] = function () {
            var L = this[p];
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
                L.baerer = null;
            }
            L.lukket = 0;
            if (this[p + "NytEkstra"]) this[p + "NytEkstra"]();
        };

        P[p + "Optaget"] = function () {
            var L = this[p];
            return !!(L && L.scene && L.scene.blokerer);
        };

        P[p + "Visning"] = function () {
            return { plakatRegel: this[p] ? this[p].plakatRegel : 0 };
        };

        P[p + "Koer"] = function (navn, trin, blokerer) {
            this[p].scene = { navn: navn, trin: trin, i: 0, t: 0, blokerer: blokerer !== false };
            this.aendret(p);
        };

        P[p + "Krop"] = function () {
            var L = this[p];
            var gaar = L.x !== L.maalX;
            var bob = gaar ? Math.abs(Math.sin(L.gang)) * -4 : 0;
            return { x: L.x, y: L.y + bob, v: (gaar ? Math.sin(L.gang) * 0.025 : 0) + L.laen * 0.04 };
        };

        P[p + "Skulder"] = function () {
            return NK.tilVerden(this[p + "Krop"](), S.ANKER[SP.krop], cfg.skulder[0], cfg.skulder[1]);
        };

        P[p + "Haand"] = function () {
            var sk = this[p + "Skulder"]();
            return NK.tilVerden({ x: sk.x, y: sk.y, v: this[p].arm }, S.ANKER[SP.arm], cfg.haand[0], cfg.haand[1]);
        };

        P[p + "Sig"] = function (tekst, vis) {
            var L = this[p];
            L.tale = tekst;
            L.taleUr = vis || 2;
            L.taleLaengde = Math.min(1.6, 0.12 + tekst.length * 0.045);
            L.taleStart = this.tid;
            if (NK.Lyd) NK.Lyd.mumle(Math.max(1, Math.min(8, Math.round(tekst.length / 5))));
        };

        P["over" + Stor] = function (pt) {
            var L = this[p];
            if (!L || L.x < -100) return null;
            var hb = cfg.hitboks;
            if (pt.x > L.x - hb[0] && pt.x < L.x + hb[1] && pt.y > L.y - hb[2] && pt.y < S.HOEJDE + 40) return p;
            return null;
        };

        P["klik" + Stor] = function () {
            var L = this[p];
            if (!svar.length || !L || L.x < -100 || (L.scene && fredet.indexOf(L.scene.navn) >= 0)) return false;
            L.klik++;
            L.vredeMaal = 1;
            L.humoerMaal = -1;
            if (L.klik <= svar.length) {
                var navn = L.klik === 1 && cfg.glimt ? cfg.glimt("navn") : null;
                this[p + "Sig"](navn || svar[L.klik - 1], navn ? 2.6 : 1.6);
                L.roedMaal = Math.min(1, 0.22 * L.klik);
                return true;
            }
            L.roedMaal = 1;
            L.damp = 3;
            this[p + "Sig"](cfg.gaarSvar || "Nu går jeg.", 1.6);
            if (NK.Lyd) NK.Lyd.brum();
            var blokerede = L.scene && L.scene.blokerer;
            this[p + "Koer"]("gaaUd", [{ arm: HAENGER, tid: 0.3 }, { tid: 1.1 }, { gaa: UDE }], !!blokerede);
            return true;
        };

        /* ----- Tidens gang ------------------------------------------------- */
        P["opdater" + Stor] = function (dt) {
            var L = this[p];
            if (!L) return;
            var i;

            var sc = L.scene, vagt = 0, rest = dt;
            while (sc && L.scene === sc && vagt++ < 30) {
                var tr = sc.trin[sc.i];
                if (!tr) { L.scene = null; this.aendret(p); break; }
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
                    if (tr.sig) this[p + "Sig"](tr.sig, tr.vis);
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

            if (this[p + "Ventende"]) this[p + "Ventende"]();

            var fart = L.loeb ? cfg.fart[1] : cfg.fart[0];
            if (L.x !== L.maalX) {
                var d = L.maalX - L.x;
                L.x += Math.sign(d) * Math.min(Math.abs(d), fart * dt);
                L.gang += dt * (L.loeb ? 18 : 12);
            }
            if (L.x <= UDE + 1 && !L.scene) {
                L.klik = 0; L.roedMaal = 0; L.damp = 0; L.kigMaal = 0; L.laenMaal = 0;
                L.vredeMaal = start.vrede === undefined ? 0.3 : start.vrede;
                L.humoerMaal = start.humoer === undefined ? 0.1 : start.humoer;
            }

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
                    var hk = this[p + "Krop"]();
                    var side = Math.random() < 0.5 ? -1 : 1;
                    L.dampe.push({ x: hk.x + side * 46, y: hk.y - 60, vx: side * r(20, 50), vy: -r(40, 80), r: r(4, 7), liv: 1 });
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

            if (this["opdater" + Stor + "Ekstra"]) this["opdater" + Stor + "Ekstra"](dt);
        };

        /* ----- Tegning ----------------------------------------------------- */
        P[p + "Baaret"] = function (ctx, L) {
            if (!L.baerer) return;
            var hd = this[p + "Haand"]();
            var b = (cfg.baaret || {})[L.baerer];
            if (b) {
                NK.Sprites.tegnPositur(ctx, b.sprite, { x: hd.x + (b.dx || 0), y: hd.y + (b.dy || 0), v: b.v || 0 }, S.ANKER[b.sprite]);
            } else if (this[p + "BaaretEkstra"]) {
                this[p + "BaaretEkstra"](ctx, L, hd);
            }
        };

        P["tegn" + Stor] = function (ctx, tid) {
            var L = this[p];
            if (!L) return;
            var i;
            if (L.x < UDE + 40 && !L.scene) return;
            var krop = this[p + "Krop"]();
            var sk = this[p + "Skulder"]();
            var armBag = Math.abs(L.arm) > 2;
            var armPositur = { x: sk.x, y: sk.y, v: L.arm };

            if (armBag) NK.Sprites.tegnPositur(ctx, SP.arm, armPositur, S.ANKER[SP.arm]);

            /* Kitlen fortsaetter ned under spritet */
            var kv = NK.tilVerden(krop, S.ANKER[SP.krop], cfg.kittel[0], cfg.kittel[2]);
            var kh = NK.tilVerden(krop, S.ANKER[SP.krop], cfg.kittel[1], cfg.kittel[2]);
            var kg = ctx.createLinearGradient(kv.x, 0, kh.x, 0);
            kg.addColorStop(0, "#c9d2da");
            kg.addColorStop(0.3, "#f7f9fb");
            kg.addColorStop(0.7, "#eef2f5");
            kg.addColorStop(1, "#bcc6cf");
            ctx.fillStyle = kg;
            ctx.fillRect(kv.x, kv.y, kh.x - kv.x, 1500);
            ctx.fillStyle = "#9aa6b1";
            ctx.fillRect(krop.x - 1, kv.y, 2, 1500);
            NK.Sprites.tegnPositur(ctx, SP.krop, krop, S.ANKER[SP.krop]);

            var ryst = L.taleUr > 0 ? Math.sin(tid * 9) * 0.05 * L.vrede * (L.humoer < 0 ? 1 : 0) : 0;
            var hoved = {
                x: krop.x + L.laen * 10,
                y: krop.y + 14 + L.nik,
                v: krop.v + ryst + L.laen * 0.18
            };
            NK.Sprites.tegnPositur(ctx, SP.hoved, hoved, S.ANKER[SP.hoved]);
            ctx.save();
            ctx.translate(hoved.x, hoved.y);
            ctx.rotate(hoved.v);
            ctx.translate(-S.ANKER[SP.hoved].x, -S.ANKER[SP.hoved].y);
            cfg.tegnAnsigt(ctx, L);
            ctx.restore();

            if (!armBag) NK.Sprites.tegnPositur(ctx, SP.arm, armPositur, S.ANKER[SP.arm]);
            this[p + "Baaret"](ctx, L);

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
            tegnTaleboble(ctx, krop.x + (cfg.taleX || 160), top - 44, L.tale, L.taleAlfa, krop.x + 56, top + 46);
        };
    }

    NK.Figur = {
        UDE: UDE,
        KANT: KANT,
        HAENGER: HAENGER,
        paa: paa,
        suk: suk,
        tegnTaleboble: tegnTaleboble
    };
}());
