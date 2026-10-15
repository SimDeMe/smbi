// ETOPO-gitteret genbruges uændret fra kortet. Verdenskoordinater er km i
// kortets vinkeltro projektion. Højden er i meter; overdrivelse sker kun ved tegning.
export const JORDRADIUS = 6371;

export function lavTerraen(data, buffer, d3) {
  const h = data.hoejde, [X0, Y0, X1, Y1] = data.graenser;
  if (h.type !== 'int16le' || h.enhed !== 'm' || !Number.isInteger(h.bredde) || !Number.isInteger(h.hoejde)
      || h.bredde < 2 || h.hoejde < 2 || buffer.byteLength !== h.bredde * h.hoejde * 2
      || ![X0, Y0, X1, Y1].every(Number.isFinite) || X1 <= X0 || Y1 <= Y0) throw new Error('Ugyldigt højdegitter');
  const view = new DataView(buffer);
  const hoejder = Array.from({ length: h.bredde * h.hoejde }, (_, i) => view.getInt16(i * 2, true));
  if (hoejder.some(z => z < -12000 || z > 10000)) throw new Error('Ugyldige højdeværdier');
  const p = d3.geoConicConformal().parallels(data.projektion.paralleller).rotate(data.projektion.rotation).scale(1).translate([0, 0]);
  const pixel = (X1 - X0) / data.relief.bredde, trin = pixel * h.trin;
  // Eksportøren udtager pixel nr. floor(trin/2); pixelcentret er +0,5.
  const start = (Math.floor(h.trin / 2) + .5) * pixel;
  const midte = p([-19, 64.95]);
  const fraGeo = lonlat => { const [x, z] = p(lonlat); return [(x - midte[0]) * JORDRADIUS, (z - midte[1]) * JORDRADIUS]; };
  const tilGeo = (x, z) => p.invert([x / JORDRADIUS + midte[0], z / JORDRADIUS + midte[1]]);
  const hoejdeVed = (x, z) => {
    const j = (x / JORDRADIUS + midte[0] - X0 - start) / trin;
    const i = (z / JORDRADIUS + midte[1] - Y0 - start) / trin;
    if (j < 0 || i < 0 || j > h.bredde - 1 || i > h.hoejde - 1) return null;
    const a = Math.min(h.bredde - 2, Math.floor(j)), b = Math.min(h.hoejde - 2, Math.floor(i));
    const u = j - a, v = i - b, k = b * h.bredde + a;
    return (1 - v) * ((1 - u) * hoejder[k] + u * hoejder[k + 1]) + v * ((1 - u) * hoejder[k + h.bredde] + u * hoejder[k + h.bredde + 1]);
  };
  // Et tættere udsnit omkring Island. Ingen opfundne højder eller kystlinjer.
  const ramme = [[-25.8, 62.9], [-12.5, 62.9], [-25.8, 67.35], [-12.5, 67.35]].map(fraGeo);
  const graenser = [Math.min(...ramme.map(p => p[0])), Math.min(...ramme.map(p => p[1])), Math.max(...ramme.map(p => p[0])), Math.max(...ramme.map(p => p[1]))];
  const [x0, z0, x1, z1] = graenser;
  const nx = 146, nz = Math.round(nx * (z1 - z0) / (x1 - x0));
  const punkter = [];
  for (let i = 0; i <= nz; i++) for (let j = 0; j <= nx; j++) {
    const x = x0 + (x1 - x0) * j / nx, z = z0 + (z1 - z0) * i / nz;
    const y = hoejdeVed(x, z);
    if (y == null || !Number.isFinite(y)) throw new Error('Udsnittet ligger uden for data');
    punkter.push([x, y, z]);
  }
  const flader = [], kyst = [];
  for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++) {
    const a = i * (nx + 1) + j, b = a + 1, c = a + nx + 1, d = c + 1;
    for (const ids of [[a, c, b], [b, c, d]]) {
      flader.push(ids);
      const snit = [];
      for (let k = 0; k < 3; k++) {
        const u = punkter[ids[k]], v = punkter[ids[(k + 1) % 3]];
        if ((u[1] < 0) !== (v[1] < 0)) {
          const t = -u[1] / (v[1] - u[1]);
          snit.push([u[0] + (v[0] - u[0]) * t, 0, u[2] + (v[2] - u[2]) * t]);
        }
      }
      if (snit.length === 2) kyst.push(snit);
    }
  }
  const modelHoejdeVed = (x,z) => {
    const j=(x-x0)/(x1-x0)*nx,i=(z-z0)/(z1-z0)*nz;
    if(j<0||i<0||j>nx||i>nz)return null;
    const a=Math.min(nx-1,Math.floor(j)),b=Math.min(nz-1,Math.floor(i)),u=j-a,v=i-b,k=b*(nx+1)+a;
    const A=punkter[k][1],B=punkter[k+1][1],C=punkter[k+nx+1][1],D=punkter[k+nx+2][1];
    return u+v<=1?A+u*(B-A)+v*(C-A):D+(1-u)*(C-D)+(1-v)*(B-D);
  };
  const punkt = lonlat => { const [x, z] = fraGeo(lonlat); const y = hoejdeVed(x, z); return y == null ? null : [x, y, z]; };
  return { punkter, flader, kyst, graenser, fraGeo, tilGeo, hoejdeVed, modelHoejdeVed, punkt, nx, nz };
}
