/* =====================================================================
   app.js - binder forsoeget, maaleskemaet, tegneserien og panelet sammen

   Knapper, tastatur, pop op-vinduer og tegneloekken.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;

    var forsoeg;
    var sidsteTid = 0;
    var sidsteSignatur = "";
    var beskedUr = null;
    var hintTrin = "";
    var serieSet = false;

    /* ----- Panelet ------------------------------------------------------ */
    function opdaterPanel() {
        var f = forsoeg;
        var aktuelt = f.aktueltTrin();
        var aktivId = aktuelt ? aktuelt.id : "";
        var ol = NK.el("trin-liste");
        ol.innerHTML = "";
        var antalGjort = 0;
        NK.TRIN.forEach(function (t, i) {
            var gjort = f.trinGjort(t.id);
            var li = document.createElement("li");
            if (gjort) { li.className = "gjort"; antalGjort++; }
            else if (t.id === aktivId) li.className = "aktiv";
            var nr = document.createElement("span");
            nr.className = "nr";
            nr.textContent = gjort ? "✓" : String(i + 1);
            li.appendChild(nr);
            li.appendChild(document.createTextNode(t.tekst));
            ol.appendChild(li);
        });
        NK.saetTekst("forloeb-taeller", antalGjort + "/" + NK.TRIN.length);

        if (aktivId !== hintTrin) {
            hintTrin = aktivId;
            NK.el("hint-tekst").hidden = true;
        }
        NK.el("hint-knap").disabled = !aktuelt;

        var T = f.taeller;
        NK.el("boble-knap").hidden = T.aktiv === null;
        NK.el("vent-knap").disabled = T.aktiv !== null || !!f.spol;

        NK.saetTekst("maal-nr", "Forsøg " + f.forsoegNr);
        f.kolber.forEach(function (k, i) {
            NK.saetTekst("t-" + i, k.maaltTemp !== null ? k.maaltTemp + " °C" : "");
            var celle = NK.el("b-" + i);
            var live = T.aktiv === i;
            celle.classList.toggle("live", live);
            NK.saetTekst("b-" + i, live ? String(T.tal) : (k.taelling ? String(k.taelling.klik) : ""));
        });

        var slut = !!f.gjort.slut;
        NK.el("serieknap").hidden = !slut;
        NK.saetTekst("serie-tekst", slut ? "Forsøget er slut." : "Låses op, når der er talt bobler i alle tre kolber.");
        NK.el("serieknap").classList.toggle("banker", slut && !serieSet);
        sidsteSignatur = signatur();
    }

    function signatur() {
        var f = forsoeg;
        var t = f.aktueltTrin();
        return [
            t ? t.id : "", !!f.handling, !!f.spol, f.taeller.aktiv, f.taeller.tal, !!f.gjort.slut, f.forsoegNr,
            f.kolber.map(function (k) { return [k.maaltTemp, k.taelling ? k.taelling.klik : "-"].join(","); }).join(";"),
            NK.TRIN.map(function (x) { return f.trinGjort(x.id) ? 1 : 0; }).join("")
        ].join("|");
    }

    function visHint() {
        var tekst = forsoeg.hint();
        var el = NK.el("hint-tekst");
        if (!tekst) { el.hidden = true; return; }
        el.textContent = tekst;
        el.hidden = false;
        NK.el("hint-knap").classList.remove("banker");
    }

    function maaling(hvad, i) {
        var raekke = NK.el("raekke-" + i);
        opdaterPanel();
        if (!raekke) return;
        raekke.classList.remove("ny");
        void raekke.offsetWidth;
        raekke.classList.add("ny");
    }

    function besked(tekst, slags) {
        var el = NK.el("scenebesked");
        el.className = "scenebesked";
        void el.offsetWidth;
        el.textContent = tekst;
        el.className = "scenebesked vis " + slags;
        window.clearTimeout(beskedUr);
        beskedUr = window.setTimeout(function () { el.classList.remove("vis"); }, 2800);
    }

    /* ----- Pop op-vinduer ------------------------------------------------- */
    function aabnSerie() {
        if (!forsoeg.gjort.slut) return;
        serieSet = true;
        NK.Rundvisning.luk();
        NK.Tegneserie.byg(forsoeg, NK.el("serie-ruder"));
        NK.el("tegneserie").classList.add("vis");
        NK.el("serieknap").classList.remove("banker");
    }

    function aabnTeori() {
        NK.Rundvisning.luk();
        NK.el("teori").classList.add("vis");
    }

    var INTRO_GEMT = "smbi-gaerbobler-intro";

    function aabnIntro() {
        NK.Rundvisning.luk();
        lukOverlay();
        NK.el("intro").classList.add("vis");
        NK.el("intro-start").focus({ preventScroll: true });
    }

    function introFoersteGang() {
        var set = false;
        try {
            set = !!window.localStorage.getItem(INTRO_GEMT);
            window.localStorage.setItem(INTRO_GEMT, "set");
        } catch (fejl) { /* file:// eller privat browsing */ }
        if (!set && !/[?&]intro=0/.test(location.search)) aabnIntro();
    }

    function lukOverlay() {
        var aabne = document.querySelectorAll(".overlay.vis");
        for (var i = 0; i < aabne.length; i++) aabne[i].classList.remove("vis");
    }

    function visLyd() {
        var til = NK.Lyd.erTil();
        var knap = NK.el("lydknap");
        knap.classList.toggle("fra", !til);
        knap.setAttribute("aria-pressed", til ? "true" : "false");
    }

    function skiftLyd() {
        NK.Lyd.saet(!NK.Lyd.erTil());
        NK.Lyd.laasOp();
        visLyd();
    }

    function nytForsoeg() {
        forsoeg.holdt = null;
        forsoeg.nulstil();
        lukOverlay();
        serieSet = false;
        NK.el("hint-tekst").hidden = true;
        opdaterPanel();
    }

    /* ----- Tastatur ----------------------------------------------------- */
    function tastNed(e) {
        if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        if (e.key === "Escape") { lukOverlay(); NK.Rundvisning.luk(); return; }
        if (e.key === "?" || e.key === "h" || e.key === "H") {
            if (NK.Rundvisning.aktiv()) NK.Rundvisning.luk();
            else { lukOverlay(); NK.Rundvisning.start(); }
            return;
        }
        if (NK.Rundvisning.aktiv() || document.querySelector(".overlay.vis")) return;

        NK.Lyd.laasOp();
        var tast = e.key.toLowerCase();
        if (e.key === " " || tast === "b") { e.preventDefault(); if (!e.repeat) forsoeg.boble(); }
        else if (tast === "v") forsoeg.spolFrem();
        else if (tast === "i") visHint();
        else if (tast === "m") skiftLyd();
        else if (tast === "t") aabnTeori();
        else if (tast === "s") aabnSerie();
        else if (tast === "n") nytForsoeg();
    }

    /* ----- Tegneloekken ------------------------------------------------ */
    function loekke(ts) {
        var dt = (ts - sidsteTid) / 1000;
        sidsteTid = ts;
        if (!isFinite(dt) || dt < 0) dt = 0;
        if (dt > 0.1) dt = 0.1;

        forsoeg.tilpas();
        forsoeg.opdater(dt);
        forsoeg.tegn();

        if (signatur() !== sidsteSignatur) opdaterPanel();
        var sidderFast = forsoeg.aktueltTrin() && forsoeg.tid - forsoeg.trinStart > 30 && NK.el("hint-tekst").hidden && !NK.el("hint-knap").disabled;
        NK.el("hint-knap").classList.toggle("banker", !!sidderFast);
        window.requestAnimationFrame(loekke);
    }

    /* ----- Opstart ------------------------------------------------------- */
    function start() {
        NK.Sprites.start();
        forsoeg = new NK.Forsoeg(NK.el("scene-laerred"));

        /* Saa modellen kan pilles ved fra konsollen */
        NK.forsoeg = forsoeg;
        NK.opdaterPanel = opdaterPanel;
        NK.nytForsoeg = nytForsoeg;
        NK.aabnSerie = aabnSerie;

        forsoeg.vedAendring = function () { opdaterPanel(); };
        forsoeg.vedBesked = besked;
        forsoeg.vedMaaling = maaling;

        NK.el("boble-knap").addEventListener("pointerdown", function (e) { e.preventDefault(); NK.Lyd.laasOp(); forsoeg.boble(); });
        NK.el("vent-knap").addEventListener("click", function () { NK.Lyd.laasOp(); forsoeg.spolFrem(); });
        NK.el("hint-knap").addEventListener("click", visHint);
        NK.el("nytknap").addEventListener("click", nytForsoeg);
        NK.el("teoriknap").addEventListener("click", aabnTeori);
        NK.el("teori-luk").addEventListener("click", lukOverlay);
        NK.el("teori").addEventListener("click", function (e) { if (e.target === this) lukOverlay(); });
        NK.el("lydknap").addEventListener("click", skiftLyd);
        NK.el("hjaelpknap").addEventListener("click", function () { lukOverlay(); NK.Rundvisning.start(); });
        NK.el("serieknap").addEventListener("click", aabnSerie);
        NK.el("serie-luk").addEventListener("click", lukOverlay);
        NK.el("tegneserie").addEventListener("click", function (e) { if (e.target === this) lukOverlay(); });
        NK.el("introknap").addEventListener("click", aabnIntro);
        NK.el("intro-start").addEventListener("click", lukOverlay);
        NK.el("intro-rundvisning").addEventListener("click", function () { lukOverlay(); NK.Rundvisning.start(); });
        NK.el("intro").addEventListener("click", function (e) { if (e.target === this) lukOverlay(); });

        document.addEventListener("keydown", tastNed);

        visLyd();
        forsoeg.tilpas();
        opdaterPanel();
        introFoersteGang();

        window.requestAnimationFrame(function (ts) {
            sidsteTid = ts;
            window.requestAnimationFrame(loekke);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
}());
