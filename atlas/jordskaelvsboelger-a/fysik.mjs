// Homogent, isotropt fast materiale. Alle afstande er i km og tider i s.
export const VP = 6, VS = 3.5;
export const FAKTOR = 1 / (1 / VS - 1 / VP); // 8,4 km/s
export const stationer = [
  {navn:'A', x:120, y:130, farve:'#006e78'},
  {navn:'B', x:650, y:150, farve:'#a14d19'},
  {navn:'C', x:400, y:440, farve:'#6d4aba'}
];
export function ankomst(kilde, station, dybde) {
  const overflade = Math.hypot(kilde.x-station.x, kilde.y-station.y);
  const vej = Math.hypot(overflade, dybde);
  return {overflade, vej, p:vej/VP, s:vej/VS, delta:vej/FAKTOR};
}
export function radius(delta, dybde) {
  const vej = delta*FAKTOR;
  return vej < dybde ? null : Math.sqrt(vej*vej-dybde*dybde);
}
// Syntetisk signal: skarpe, kendte ankomster; ingen inversion af bølgeform.
export function signal(t, p, s) {
  const pakke = (start, styrke, frekvens) => t < start ? 0 : styrke * Math.exp(-(t-start)/24) *
    (Math.cos((t-start)*frekvens)+.35*Math.sin((t-start)*frekvens*1.71));
  return .018*Math.sin(t*3.7)+.01*Math.sin(t*8.3)+pakke(p,.24,5.2)+pakke(s,.68,3.9);
}
