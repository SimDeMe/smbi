// Georeferenced, equirectangular source images. Pixel centres cover the globe.
// Nearest-neighbour sampling preserves the categorical MODIS colours.
export function pixel(lon, lat, w, h) {
  const x = Math.floor((((lon + 180) % 360 + 360) % 360) / 360 * w);
  const y = Math.max(0, Math.min(h - 1, Math.floor((90 - lat) / 180 * h)));
  return 4 * (y * w + x);
}
export function lavNaturraster(navn) {
  let data, pending, cache, projection, timer, lastMove = 0;
  const vegetation = navn === 'vegetation';
  const modul = {
    ORDEN: 0, AFLAESNING: `#${navn}aflaesning`, klasser: [],
    async hent() {
      if (data) return data;
      pending ??= (async () => {
        const response = await fetch(new URL(`./data/${navn}.${vegetation ? 'png' : 'jpg'}`, import.meta.url), { signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error('Kortet kunne ikke hentes');
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0); bitmap.close();
        if (vegetation) {
          const svar = await fetch(new URL('./data/vegetation-klasser.json', import.meta.url), { signal: AbortSignal.timeout(20000) });
          if (!svar.ok) throw new Error('Farveforklaring mangler');
          modul.klasser = await svar.json();
        }
        data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return data;
      })().catch(error => { pending = null; throw error; });
      return pending;
    },
    tegnFlade(ctx, { projektion, centrum, skala, bredde, hoejde, gentegn }) {
      if (!data) return;
      projection = projektion;
      const key = [centrum, skala, bredde, hoejde].join(',');
      const now = performance.now(), moved = cache?.key !== key;
      const coarse = moved ? now - lastMove < 150 : cache.coarse;
      if (moved) lastMove = now;
      const factor = coarse ? .4 : 1;
      if (moved || cache.factor !== factor) {
        const canvas = document.createElement('canvas');
        const w = canvas.width = Math.ceil(bredde * factor), h = canvas.height = Math.ceil(hoejde * factor);
        const lc = canvas.getContext('2d'), image = lc.createImageData(w, h);
        const r = Math.PI / 180, lon0 = centrum[0] * r, lat0 = centrum[1] * r;
        const sp = Math.sin(lat0), cp = Math.cos(lat0), scale = skala * factor;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const u = (x + .5 - bredde * factor / 2) / scale, v = (hoejde * factor / 2 - y - .5) / scale;
          const rho = u*u + v*v;
          if (rho > 1) continue;
          const z = Math.sqrt(1-rho), lat = Math.asin(v*cp + z*sp)/r;
          const lon = (lon0 + Math.atan2(u,z*cp-v*sp))/r;
          const src = pixel(lon,lat,data.width,data.height), dst = 4*(y*w+x);
          image.data[dst] = data.data[src]; image.data[dst+1] = data.data[src+1];
          image.data[dst+2] = data.data[src+2]; image.data[dst+3] = data.data[src+3];
        }
        lc.putImageData(image,0,0); cache = {key,coarse,factor,canvas};
      }
      ctx.save(); ctx.imageSmoothingEnabled = !vegetation;
      ctx.drawImage(cache.canvas,0,0,bredde,hoejde); ctx.restore();
      clearTimeout(timer);
      if (coarse) timer = setTimeout(() => { cache.key = null; lastMove = 0; gentegn(); },180);
    },
    tegn() {}, // All colour is drawn in tegnFlade; no additional overlay.
    aflaes(xy) {
      const p = projection?.invert(xy);
      if (!data || !p || !p.every(Number.isFinite)) return 'Ingen data';
      const sted = `${Math.abs(p[1]).toFixed(1)}° ${p[1]<0?'S':'N'}, ${Math.abs(p[0]).toFixed(1)}° ${p[0]<0?'V':'Ø'}`;
      if (!vegetation) return `${sted}. Farvet relief; højder og dybder kan ikke aflæses i meter på dette kort.`;
      const i = pixel(...p,data.width,data.height);
      const k = data.data[i+3] && modul.klasser.find(k => k.rgb.every((v,j) => v === data.data[i+j]));
      return `${sted}: ${k ? k.navn : 'Ingen data'} · 2023`;
    }
  };
  return modul;
}
