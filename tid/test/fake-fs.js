// Firestore i hukommelsen — kun det, tid/ bruger
const store = new Map();          // path -> data
const lyttere = new Set();
let nid = 1;
const cfg = window.__fsCfg || {};

export class Timestamp {
  constructor(ms) { this.ms = ms; this.seconds = Math.floor(ms / 1000); this.nanoseconds = 0; }
  static fromDate(d) { return new Timestamp(d.getTime()); }
  static fromMillis(ms) { return new Timestamp(ms); }
  static now() { return new Timestamp(Date.now()); }
  toDate() { return new Date(this.ms); }
  toMillis() { return this.ms; }
  valueOf() { return this.ms; }
}
const SERVER = { __server: true };
export const serverTimestamp = () => SERVER;
export const initializeFirestore = () => ({});
export const persistentLocalCache = () => ({});

export const collection = (db, path) => ({ kind: 'col', path });
export function doc(a, path) {
  if (a?.kind === 'col') { const id = 'd' + (nid++); return { kind: 'doc', path: a.path + '/' + id, id }; }
  return { kind: 'doc', path, id: path.split('/').pop() };
}
export const where = (f, op, v) => ({ t: 'where', f, op, v });
export const orderBy = (f, dir = 'asc') => ({ t: 'order', f, dir });
export const limit = n => ({ t: 'limit', n });
export const query = (col, ...c) => ({ kind: 'query', path: col.path, c });

const norm = v => v instanceof Timestamp ? v.ms : v;
function cmp(a, b) { a = norm(a); b = norm(b); if (a == null && b == null) return 0; if (a == null) return -1; if (b == null) return 1; return a < b ? -1 : a > b ? 1 : 0; }
function resolve(data) {
  const o = {};
  for (const [k, v] of Object.entries(data)) o[k] = v === SERVER ? Timestamp.now() : v;
  return o;
}
function run(q) {
  const path = q.path, c = q.c || [];
  let docs = [...store.entries()]
    .filter(([p]) => p.startsWith(path + '/') && !p.slice(path.length + 1).includes('/'))
    .map(([p, d]) => ({ id: p.split('/').pop(), d }));
  for (const w of c.filter(x => x.t === 'where')) {
    docs = docs.filter(({ d }) => {
      const a = d[w.f], b = w.v;
      if (w.op === '==') return b === null ? a == null : cmp(a, b) === 0;
      if (a == null) return false;
      if (w.op === '>=') return cmp(a, b) >= 0;
      if (w.op === '<') return cmp(a, b) < 0;
      if (w.op === '<=') return cmp(a, b) <= 0;
      if (w.op === '>') return cmp(a, b) > 0;
      throw new Error('op ' + w.op);
    });
  }
  for (const o of c.filter(x => x.t === 'order').reverse()) {
    docs = docs.filter(({ d }) => d[o.f] !== undefined);
    docs.sort((x, y) => cmp(x.d[o.f], y.d[o.f]) * (o.dir === 'desc' ? -1 : 1));
  }
  const l = c.find(x => x.t === 'limit'); if (l) docs = docs.slice(0, l.n);
  const out = docs.map(({ id, d }) => ({ id, data: () => ({ ...d }) }));
  return { empty: !out.length, size: out.length, docs: out, forEach: f => out.forEach(f) };
}
const docSnap = ref => { const d = store.get(ref.path); return { id: ref.id, exists: () => !!d, data: () => d && { ...d } }; };

function notify() {
  setTimeout(() => lyttere.forEach(l => l.fire()), 0);
}
export function onSnapshot(q, cb, err) {
  const l = { fire: () => { try { cb(q.kind === 'doc' ? docSnap(q) : run(q)); } catch (e) { console.error(e); } } };
  const delay = (cfg.delay || []).find(([frag]) => q.path.includes(frag))?.[1] ?? 0;
  // Med forsinkelse er lytteren døv, til første svar kommer
  setTimeout(() => { lyttere.add(l); l.fire(); }, delay);
  return () => lyttere.delete(l);
}
export const getDocs = async q => run(q.kind === 'col' ? { path: q.path, c: [] } : q);
export const getDoc = async ref => docSnap(ref);
export async function addDoc(col, data) { const r = doc(col); store.set(r.path, resolve(data)); notify(); return r; }
export async function setDoc(ref, data, opt) { store.set(ref.path, opt?.merge ? { ...(store.get(ref.path) || {}), ...resolve(data) } : resolve(data)); notify(); }
export async function updateDoc(ref, data) { if (!store.has(ref.path)) throw new Error('no doc ' + ref.path); store.set(ref.path, { ...store.get(ref.path), ...resolve(data) }); notify(); }
export async function deleteDoc(ref) { store.delete(ref.path); notify(); }
export function writeBatch() {
  const ops = [];
  return { set: (r, d, o) => ops.push(() => setDoc(r, d, o)), update: (r, d) => ops.push(() => updateDoc(r, d)), delete: r => ops.push(() => deleteDoc(r)), commit: async () => { for (const op of ops) await op(); } };
}

// Testkrog
window.__fs = { store, Timestamp, notify,
  put(path, data) { store.set(path, data); notify(); },
  entries() { return [...store.entries()].filter(([p]) => p.startsWith('users/u1/entries/')).map(([p, d]) => ({ id: p.split('/').pop(), ...d, startMs: d.startTime?.ms, endMs: d.endTime?.ms })); } };
const tilTs = d => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v && v.__ts != null ? new Timestamp(v.__ts) : v]));
for (const [p, d] of (cfg.seed || [])) store.set(p, tilTs(d));
