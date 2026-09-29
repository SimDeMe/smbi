/* ─────────────────────────────────────────────────────────
   Tegnet sten — står i stedet for et foto, indtil stenen er
   fotograferet. Formen og mønstret bestemmes af postens id,
   så den samme sten altid ser ens ud.

   `tegning` i data vælger mønster, `farver` giver farverne
   (den første er grundfarven). Ukendte mønstre tegnes massive.
   ───────────────────────────────────────────────────────── */

const B = 200, H = 150;           /* viewBox */

function frø(tekst){
  let h = 2166136261;
  for(const c of tekst){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  let s = h >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; };
}

const f = n => n.toFixed(1);

/* Stenens omrids: en rundet, uregelmæssig klump. */
function omrids(r, kantet){
  const n = kantet ? 7 : 11, p = [];
  for(let i = 0; i < n; i++){
    const a = (i / n) * Math.PI * 2 + (r() - .5) * .35;
    const k = .8 + r() * .22;
    p.push([B/2 + Math.cos(a) * 84 * k, H/2 + 4 + Math.sin(a) * 58 * k]);
  }
  if(kantet) return {p, d:'M' + p.map(q => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z'};
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = 'M' + mid(p[n-1], p[0]).map(f).join(' ');
  for(let i = 0; i < n; i++){
    const m = mid(p[i], p[(i+1) % n]);
    d += `Q${f(p[i][0])} ${f(p[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return {p, d: d + 'Z'};
}

const vaelg = (r, a) => a[Math.floor(r() * a.length)];

function polygon(r, cx, cy, s, farve){
  const n = 4 + Math.floor(r() * 3), pt = [];
  for(let i = 0; i < n; i++){
    const a = (i / n) * Math.PI * 2 + r() * .6;
    const k = s * (.55 + r() * .5);
    pt.push(f(cx + Math.cos(a) * k) + ',' + f(cy + Math.sin(a) * k * .85));
  }
  return `<polygon points="${pt.join(' ')}" fill="${farve}"/>`;
}

function prikker(r, n, rmin, rmax, farver, op){
  let s = '';
  for(let i = 0; i < n; i++)
    s += `<circle cx="${f(r()*B)}" cy="${f(r()*H)}" r="${f(rmin + r()*(rmax-rmin))}" fill="${vaelg(r, farver)}"${op ? ` opacity="${op}"` : ''}/>`;
  return s;
}

function baand(r, antal, amp, farver, tyk){
  let s = '';
  for(let i = 0; i < antal; i++){
    const y0 = (i + .5) * (H + 40) / antal - 20, ph = r() * 6, k = .02 + r() * .02;
    let d = '';
    for(let x = -10; x <= B + 10; x += 10){
      const y = y0 + Math.sin(x * k + ph) * amp + (x / B) * 14;
      d += (d ? 'L' : 'M') + f(x) + ' ' + f(y);
    }
    s += `<path d="${d}" fill="none" stroke="${farver[i % farver.length]}" stroke-width="${f(tyk * (.6 + r() * .8))}" stroke-linecap="round"/>`;
  }
  return s;
}

const MOENSTRE = {
  grovkornet(r, F){
    let s = '';
    for(let i = 0; i < 150; i++) s += polygon(r, r()*B, r()*H, 5 + r()*7, vaelg(r, F));
    return s;
  },
  kaempekorn(r, F){
    let s = '';
    for(let i = 0; i < 26; i++) s += polygon(r, r()*B, r()*H, 14 + r()*16, vaelg(r, F));
    return s;
  },
  finkornet(r, F){ return prikker(r, 420, .6, 1.5, F.slice(1), .75); },
  sand(r, F){ return prikker(r, 700, .9, 1.9, F, .9); },
  porfyr(r, F){
    let s = prikker(r, 260, .5, 1.2, [F[2] || F[0]], .6);
    for(let i = 0; i < 12; i++){
      const x = r()*B, y = r()*H, w = 5 + r()*7, a = r()*180;
      s += `<rect x="${f(x-w)}" y="${f(y-w*.6)}" width="${f(w*2)}" height="${f(w*1.2)}" fill="${F[1]}" transform="rotate(${f(a)} ${f(x)} ${f(y)}) skewX(25)"/>`;
    }
    return s;
  },
  glas(r, F){
    return `<path d="M20 60Q70 22 150 34" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="9" stroke-linecap="round"/>`
         + `<path d="M40 110Q90 78 150 96M60 125Q100 104 140 116" fill="none" stroke="${F[1]}" stroke-width="2"/>`;
  },
  blaerer(r, F){
    let s = prikker(r, 160, .5, 1.2, [F[1]], .7);
    for(let i = 0; i < 45; i++)
      s += `<ellipse cx="${f(r()*B)}" cy="${f(r()*H)}" rx="${f(1.5 + r()*5)}" ry="${f(1.2 + r()*3.5)}" fill="${F[2] || '#555'}" opacity=".85"/>`;
    return s;
  },
  klaster(r, F){
    let s = prikker(r, 300, .6, 1.4, F, .8);
    for(let i = 0; i < 16; i++){
      const x = r()*B, y = r()*H;
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(7 + r()*12)}" ry="${f(5 + r()*8)}" fill="${vaelg(r, F)}" stroke="#17211F" stroke-width="1" stroke-opacity=".5" transform="rotate(${f(r()*180)} ${f(x)} ${f(y)})"/>`;
    }
    return s;
  },
  lag(r, F){ return baand(r, 16, 2, F, 5) + prikker(r, 120, .5, 1, [F[1]], .5); },
  baand(r, F){ return baand(r, 9, 7, F, 11) + prikker(r, 240, .6, 1.4, F, .8); },
  migmatit(r, F){ return baand(r, 6, 18, [F[1], F[2] || F[1]], 12); },
  aarer(r, F){ return baand(r, 3, 22, [F[3] || F[1]], 1.6) + prikker(r, 160, .6, 1.3, [F[1]], .6); },
  fossiler(r, F){
    let s = prikker(r, 200, .6, 1.3, [F[1]], .7);
    for(let i = 0; i < 9; i++){
      const x = r()*B, y = r()*H, k = 5 + r()*7, a = r()*360;
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})" fill="none" stroke="${F[1]}" stroke-width="1.6">`
         + `<path d="M${-k} 0A${k} ${k} 0 0 1 ${k} 0Z"/>`
         + `<path d="M0 0L${f(-k*.6)} ${f(-k*.8)}M0 0L0 ${-k}M0 0L${f(k*.6)} ${f(-k*.8)}"/></g>`;
    }
    return s;
  },
  flint(r, F, o){
    return `<path d="${o.d}" fill="none" stroke="${F[2]}" stroke-width="16"/>`
         + `<path d="M50 62Q96 36 150 52" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="7" stroke-linecap="round"/>`;
  },
  eklogit(r, F){
    let s = '';
    for(let i = 0; i < 120; i++) s += polygon(r, r()*B, r()*H, 4 + r()*6, vaelg(r, [F[0], F[2]]));
    for(let i = 0; i < 26; i++) s += `<circle cx="${f(r()*B)}" cy="${f(r()*H)}" r="${f(3 + r()*4)}" fill="${F[1]}" stroke="#17211F" stroke-width=".8"/>`;
    return s;
  },
  korn(r, F){
    let s = '';
    for(let i = 0; i < 90; i++) s += `<circle cx="${f(r()*B)}" cy="${f(r()*H)}" r="${f(5 + r()*6)}" fill="${vaelg(r, F)}" stroke="#17211F" stroke-opacity=".25"/>`;
    return s;
  },
  massiv(r, F){
    let s = '';
    for(let i = 0; i < 14; i++) s += `<circle cx="${f(r()*B)}" cy="${f(r()*H)}" r="${f(14 + r()*24)}" fill="${vaelg(r, F)}" opacity=".35"/>`;
    return s;
  },
  blade(r, F){
    let s = '';
    for(let i = 0; i < 16; i++){
      const y = i * 10 + r() * 4;
      s += `<path d="M-5 ${f(y)}Q100 ${f(y - 6 + r()*12)} 205 ${f(y + r()*6)}" fill="none" stroke="${vaelg(r, F)}" stroke-width="${f(3 + r()*5)}"/>`;
    }
    return s;
  },
  staengler(r, F){
    let s = '';
    for(let i = 0; i < 38; i++){
      const x = r()*B, y = r()*H, l = 14 + r()*22, a = 20 + r()*40;
      s += `<rect x="${f(x)}" y="${f(y)}" width="${f(l)}" height="${f(3 + r()*3)}" fill="${vaelg(r, F)}" stroke="#fff" stroke-opacity=".25" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`;
    }
    return s;
  }
};

/* Krystaller: flader, der alle mødes i ét punkt — et slebet udseende. */
function facetter(r, F, o){
  const cx = B/2 + (r() - .5) * 40, cy = H/2 + (r() - .5) * 26;
  let s = '';
  o.p.forEach((q, i) => {
    const n = o.p[(i + 1) % o.p.length];
    s += `<polygon points="${f(cx)},${f(cy)} ${f(q[0])},${f(q[1])} ${f(n[0])},${f(n[1])}" fill="${F[i % F.length]}" stroke="#17211F" stroke-opacity=".3"/>`;
  });
  return s + `<path d="M${f(cx-20)} ${f(cy-18)}L${f(cx+6)} ${f(cy-30)}" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>`;
}

let tæller = 0;

/* Returnerer en SVG-streng. */
export function tegnSten(post){
  const r = frø(post.id);
  const F = post.farver?.length ? post.farver : ['#9A948A', '#B9B3A9', '#77716A'];
  const kantet = post.tegning === 'krystal';
  const o = omrids(r, kantet);
  const id = 'st' + (++tæller);
  const indhold = kantet ? facetter(r, F, o) : (MOENSTRE[post.tegning] || MOENSTRE.massiv)(r, F, o);
  return `<svg viewBox="0 0 ${B} ${H}" role="img" aria-label="Tegning af ${post.navn}">`
    + `<defs><clipPath id="${id}"><path d="${o.d}"/></clipPath></defs>`
    + `<path d="${o.d}" transform="translate(5 5)" fill="#17211F"/>`
    + `<path d="${o.d}" fill="${F[0]}"/>`
    + `<g clip-path="url(#${id})">${indhold}</g>`
    + `<path d="${o.d}" fill="none" stroke="#17211F" stroke-width="2.5" stroke-linejoin="round"/>`
    + `</svg>`;
}
