/* udbrud-lava.js — det rolige (effusive) udbrud i tyndtflydende, basaltisk
   magma: gassen slipper ud af krateret, river lavaklumper med sig op i en
   lavafontæne, og lavaen løber ned ad flankerne som lavastrømme. Når
   udbruddet er ovre, størkner strømmene til et nyt, tyndt lag lava — sådan
   bygges et skjold op, lag for lag.

   Bruges af skjoldvulkanen og hotspot-vulkanen:
     lavUdbrud({ overflade, radius, hav })
       overflade(x, geo)  bjergets overflade, y i px
       radius             hvor langt ud strømmene højst kan nå, px
       hav(geo)           havniveauets y i px — eller udelades, hvis der
                          ikke er hav. Når lavaen når havet, koger vandet. */

export function lavUdbrud({ overflade, radius, hav = null }){
  const klumper = [], gas = [], damp = [];
  // Én strøm til hver side. laengde: hvor langt fronten er nået fra krateret
  // (px vandret); glod: 1 = flydende, 0 = størknet
  const stroemme = [{ side: -1, laengde: 0, glod: 0 }, { side: 1, laengde: 0, glod: 0 }];
  let tKlump = 0, tGas = 0, tDamp = 0, tHavdamp = 0, forrige = 'hvile';

  function nulstil(){
    klumper.length = gas.length = damp.length = 0;
    for (const s of stroemme){ s.laengde = 0; s.glod = 0; }
    forrige = 'hvile';
  }

  // x, hvor lavaen ville løbe ud i havet (eller strømmens yderste grænse)
  function kyst(geo, side){
    const yHav = hav ? hav(geo) : null;
    for (let d = 20; d < radius; d += 2){
      if (yHav !== null && overflade(geo.XC + side * d, geo) >= yHav) return d;
    }
    return radius - 6;
  }

  function opdater(dt, geo, tilst){
    const xk = geo.XC, yk = overflade(xk, geo) - 2;
    const styrke = tilst.fase === 'udbrud' ? tilst.intensitet : 0;

    // Et nyt udbrud: de gamle strømme er størknet og bliver en del af bjerget
    if (tilst.fase === 'udbrud' && forrige !== 'udbrud')
      for (const s of stroemme) if (s.glod < 0.5){ s.laengde = 0; s.glod = 0; }
    forrige = tilst.fase;

    // Lavafontænen: gassen skyder klumper af smelte op, de falder ned om krateret
    tKlump -= dt;
    while (styrke > 0 && tKlump <= 0){
      tKlump += 0.03 / (0.3 + styrke);
      klumper.push({ x: xk + (Math.random() - 0.5) * 6, y: yk,
                     vx: (Math.random() - 0.5) * 60, vy: -(70 + 90 * styrke + Math.random() * 40),
                     r: 1.6 + Math.random() * 1.8, alder: 0, landet: false });
    }
    for (const k of klumper){
      k.alder += dt;
      if (k.landet) continue;
      k.vy += 240 * dt;
      k.x += k.vx * dt; k.y += k.vy * dt;
      const yo = overflade(k.x, geo);
      if (k.vy > 0 && k.y >= yo - 1.5){ k.y = yo - 1.5; k.landet = true; k.alder = 0; }
    }
    for (let i = klumper.length - 1; i >= 0; i--)
      if (klumper[i].landet && klumper[i].alder > 1.2) klumper.splice(i, 1);

    // Lavastrømmene løber ud ad flankerne, langsommere jo længere de er nået
    for (const s of stroemme){
      if (styrke > 0){
        const graense = kyst(geo, s.side);
        s.glod = Math.min(1, s.glod + dt);
        s.laengde = Math.min(graense, s.laengde + (14 + 30 * styrke) * dt * (1 - 0.6 * s.laengde / radius));
      } else s.glod = Math.max(0, s.glod - dt / 9);          // størkner på ca. 9 s
    }

    // Gassen slipper ud og stiger til vejrs som en lys fane
    tGas -= dt;
    while (styrke > 0 && tGas <= 0){
      tGas += 0.08;
      gas.push({ x: xk + (Math.random() - 0.5) * 8, y: yk - 10, r: 4, alder: 0,
                 vy: -(40 + 30 * styrke), vx: 8 + Math.random() * 8 });
    }
    for (const g of gas){ g.alder += dt; g.y += g.vy * dt; g.x += g.vx * dt; g.r += 9 * dt; g.vy *= 1 - 0.25 * dt; }
    for (let i = gas.length - 1; i >= 0; i--) if (gas[i].alder > 6 || gas[i].y < -30) gas.splice(i, 1);

    // Mellem udbruddene damper krateret stille
    tDamp -= dt;
    if (tilst.fase === 'hvile' && tDamp <= 0){
      tDamp = 0.4 + Math.random() * 0.3;
      damp.push({ x: xk + (Math.random() - 0.5) * 10, y: yk, r: 3, alder: 0, vy: -16 });
    }
    // Hvor lavaen løber ud i havet, koger vandet
    tHavdamp -= dt;
    if (hav && tHavdamp <= 0){
      tHavdamp = 0.18;
      for (const s of stroemme){
        if (s.glod < 0.4 || s.laengde < kyst(geo, s.side) - 1) continue;
        damp.push({ x: xk + s.side * s.laengde + (Math.random() - 0.5) * 8, y: hav(geo) - 2, r: 3, alder: 0, vy: -22 });
      }
    }
    for (const d of damp){ d.alder += dt; d.y += d.vy * dt; d.x += 6 * dt; d.r += 5 * dt; }
    for (let i = damp.length - 1; i >= 0; i--) if (damp[i].alder > 3.5) damp.splice(i, 1);
  }

  function tegnStroem(c, geo, s){
    if (s.laengde < 4) return;
    const x0 = geo.XC, n = Math.ceil(s.laengde / 3);
    const punkt = i => {
      const d = s.laengde * i / n, x = x0 + s.side * d;
      // tykkest nær krateret, tynd ved fronten
      const tyk = 2.5 + 3.5 * Math.min(1, (s.laengde - d) / 30);
      return [x, overflade(x, geo), tyk];
    };
    c.beginPath();
    for (let i = 0; i <= n; i++){ const [x, y, t] = punkt(i); c.lineTo(x, y - t); }
    for (let i = n; i >= 0; i--){ const [x, y] = punkt(i); c.lineTo(x, y + 0.5); }
    c.closePath();
    c.fillStyle = '#2E2724'; c.fill();                 // størknet lava
    if (s.glod > 0.02){                                 // flydende lava gløder ovenpå
      const g = c.createLinearGradient(x0, 0, x0 + s.side * s.laengde, 0);
      g.addColorStop(0, '#FFD24A'); g.addColorStop(0.35, '#FF8A2A'); g.addColorStop(1, '#C83A12');
      c.globalAlpha = s.glod; c.fillStyle = g; c.fill(); c.globalAlpha = 1;
    }
    c.strokeStyle = 'rgba(23,33,31,.8)'; c.lineWidth = 1; c.stroke();
  }

  function tegn(c, geo, tilst){
    const yk = overflade(geo.XC, geo);
    c.save();
    for (const s of stroemme) tegnStroem(c, geo, s);

    // damp og den lyse gasfane
    for (const d of damp){
      c.globalAlpha = 0.5 * (1 - d.alder / 3.5);
      c.fillStyle = '#FFFFFF';
      c.beginPath(); c.arc(d.x, d.y, d.r, 0, 2 * Math.PI); c.fill();
    }
    for (const g of gas){
      c.globalAlpha = 0.34 * (1 - g.alder / 6);
      c.fillStyle = '#EEF3F4'; c.strokeStyle = 'rgba(23,33,31,.18)'; c.lineWidth = 1;
      c.beginPath(); c.arc(g.x, g.y, g.r, 0, 2 * Math.PI); c.fill(); c.stroke();
    }
    c.globalAlpha = 1;

    // glød i krateret, mens der er magma i kanalen helt oppe
    if (tilst.front <= 0.05 && tilst.fase !== 'hvile'){
      const g = c.createRadialGradient(geo.XC, yk, 2, geo.XC, yk, 34);
      g.addColorStop(0, 'rgba(255,200,80,.95)'); g.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(geo.XC, yk, 34, 0, 2 * Math.PI); c.fill();
    }

    // lavafontænen: glødende klumper, der køler af, når de lander
    for (const k of klumper){
      c.globalAlpha = k.landet ? Math.max(0, 1 - k.alder / 1.2) : 1;
      const varm = Math.max(0, 1 - k.alder / 2.5);
      c.fillStyle = `rgb(255,${Math.round(110 + 110 * varm)},${Math.round(40 + 40 * varm)})`;
      c.strokeStyle = 'rgba(120,30,10,.8)'; c.lineWidth = 0.8;
      c.beginPath(); c.arc(k.x, k.y, k.r, 0, 2 * Math.PI); c.fill(); c.stroke();
    }
    c.restore();
  }

  function maerkater(geo, tilst){
    const m = [], yk = overflade(geo.XC, geo);
    const flyver = klumper.filter(k => !k.landet);
    if (tilst.fase === 'udbrud' && flyver.length > 8){
      const top = Math.min(...flyver.map(k => k.y));
      m.push({ tekst: 'LAVAFONTÆNE', x: geo.XC - 130, y: Math.max(40, top + 10), mod: Math.max(top + 12, yk - 60), modX: geo.XC - 8 });
    }
    if (tilst.fase === 'udbrud' && gas.length > 20)
      m.push({ tekst: 'GASSEN SLIPPER UD', x: geo.XC + 130, y: 34, mod: 60, modX: geo.XC + 44 });
    const h = stroemme[1];
    if (h.laengde > 70){
      const x = geo.XC + h.laengde * 0.7, y = overflade(x, geo);
      m.push({ tekst: h.glod > 0.3 ? 'LAVASTRØM' : 'STØRKNET LAVA', x: x + 30, y: y - 34, mod: y - 3, modX: x });
    }
    if (hav && damp.some(d => d.vy < -20)){
      const v = stroemme[0];
      m.push({ tekst: 'LAVAEN MØDER HAVET', x: geo.XC - v.laengde - 30, y: hav(geo) + 46,
               mod: hav(geo) + 2, modX: geo.XC - v.laengde });
    }
    return m;
  }

  return { nulstil, opdater, tegn, maerkater };
}
