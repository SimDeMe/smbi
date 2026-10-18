// Firestore i hukommelsen — kun det, tid/ bruger
const store = new Map();          // path -> data
const lyttere = new Set();
let nid = 1;
const cfg = window.__fsCfg || {};
// Valgfri realistisk kø og metadata til lagringsstatus-testen. Standard-
// testene får som før straks kvittering; synkronisering testes uden rigtige data.
let serverTilgaengelig = cfg.serverAvailable !== false;
let holdSkrivninger = !!cfg.holdWrites;
let opstartsKoe = !!cfg.pendingAtStart;
const ventende = new Set(), koeLyttere = new Set();
const metadata = (ref, ids = null) => ({ fromCache: !navigator.onLine || !serverTilgaengelig,
  hasPendingWrites: (opstartsKoe && cfg.pendingVisible !== false) || [...ventende].some(v => v.ops.some(([p, d]) =>
    ref.kind === 'doc' ? p === ref.path : d != null && p.startsWith(ref.path + '/') && ids.includes(p.split('/').pop()))) });
function vaekKoe() {
  if (opstartsKoe || ventende.size) return;
  for (const cb of koeLyttere) cb();
  koeLyttere.clear();
}
export const waitForPendingWrites = () => opstartsKoe || ventende.size
  ? new Promise(resolve => koeLyttere.add(resolve)) : Promise.resolve();

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
  if (a?.kind === 'col') { const id = (cfg.clientId || '') + 'd' + (nid++); return { kind: 'doc', path: a.path + '/' + id, id }; }
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
  return { empty: !out.length, size: out.length, docs: out, metadata: metadata(q, out.map(d => d.id)),
    docChanges: () => out.map(doc => ({ type: 'added', doc })), forEach: f => out.forEach(f) };
}
const docSnap = ref => { const d = store.get(ref.path); return { id: ref.id, metadata: metadata(ref), exists: () => !!d, data: () => d && { ...d } }; };

function notify() {
  setTimeout(() => lyttere.forEach(l => l.fire()), 0);
}
export function onSnapshot(q, options, cb, err) {
  if (typeof options === 'function') { err = cb; cb = options; }
  let lukket = false, foer;
  const l = { path: q.path, fail: err, fire: () => {
    if (lukket) return;
    try {
      const snap = q.kind === 'doc' ? docSnap(q) : run(q);
      if (snap.docs) {
        const data = JSON.stringify(snap.docs.map(d => [d.id, d.data()]));
        const aendret = data !== foer; foer = data;
        snap.docChanges = () => aendret ? [{ type: 'modified' }] : [];
      }
      cb(snap);
    } catch (e) { console.error(e); }
  } };
  const delay = (cfg.delay || []).find(([frag]) => q.path.includes(frag))?.[1] ?? 0;
  // Med forsinkelse er lytteren døv, til første svar kommer
  setTimeout(() => { if (!lukket) { lyttere.add(l); l.fire(); } }, delay);
  return () => { lukket = true; lyttere.delete(l); };
}
export const getDocs = async q => run(q.kind === 'col' ? { path: q.path, c: [] } : q);
export async function getDocsFromServer(q) {
  if (cfg.readDelay) await new Promise(r => setTimeout(r, cfg.readDelay));
  if (!navigator.onLine || !serverTilgaengelig) throw new Error('unavailable');
  if (window.__fsRemote) receive(await window.__fsRemote({ type: 'read' }));
  return getDocs(q);
}
export const getDoc = async ref => docSnap(ref);
// cache: { 'sti': data } er telefonens egen kopi; mangler stien, er den ikke
// i cachen. Serveren svarer med lageret, efter forsinkelsen i cfg.delay
export async function getDocFromCache(ref) {
  if (!(ref.path in (cfg.cache || {}))) throw new Error('unavailable');
  const d = cfg.cache[ref.path];
  return { id: ref.id, exists: () => !!d, data: () => d && { ...d } };
}
export async function getDocFromServer(ref) {
  const delay = (cfg.delay || []).find(([frag]) => ref.path.includes(frag))?.[1] ?? 0;
  await new Promise(r => setTimeout(r, delay));
  return docSnap(ref);
}
async function skriv(ops) {
  const foer = ops.map(([p]) => [p, store.get(p)]);
  for (const [p, d] of ops) d == null ? store.delete(p) : store.set(p, d);
  if (!cfg.sync) { notify(); return; }
  return new Promise((resolve, reject) => {
    const v = { ops, resolve, reject, foer }; ventende.add(v); notify();
    if (!holdSkrivninger && navigator.onLine && serverTilgaengelig) setTimeout(() => bekraeft(), 0);
  });
}
async function bekraeft(fejlkode = null) {
  if (!fejlkode && (!navigator.onLine || !serverTilgaengelig)) return;
  opstartsKoe = false;
  for (const v of [...ventende]) {
    if (fejlkode) {
      for (const [p, d] of v.foer) d === undefined ? store.delete(p) : store.set(p, d);
      v.reject(Object.assign(new Error('Test: write rejected'), { code: fejlkode }));
    } else {
      if (window.__fsRemote) {
        const res = await window.__fsRemote({ type: 'commit', reads: [], ops: encode(v.ops) });
        receive(res.rows);
      }
      v.resolve();
    }
    ventende.delete(v);
  }
  vaekKoe(); notify();
}
export async function addDoc(col, data) { const r = doc(col); await skriv([[r.path, resolve(data)]]); return r; }
export async function setDoc(ref, data, opt) { await skriv([[ref.path, opt?.merge ? { ...(store.get(ref.path) || {}), ...resolve(data) } : resolve(data)]]); }
export async function updateDoc(ref, data) { if (!store.has(ref.path)) throw new Error('no doc ' + ref.path); await skriv([[ref.path, { ...store.get(ref.path), ...resolve(data) }]]); }
export async function deleteDoc(ref) { await skriv([[ref.path, null]]); }
export function writeBatch() {
  const ops = [];
  return { set: (r, d, o) => ops.push(() => setDoc(r, d, o)), update: (r, d) => ops.push(() => updateDoc(r, d)), delete: r => ops.push(() => deleteDoc(r)), commit: async () => { for (const op of ops) await op(); } };
}
export async function runTransaction(db, callback) {
  for (let retry = 0; retry < 5; retry++) {
    if (!navigator.onLine) throw new Error('unavailable');
    if (window.__fsRemote) receive(await window.__fsRemote({ type: 'read' }));
    const reads = new Map(), ops = [];
    const result = await callback({
      get: async ref => { const snap = docSnap(ref); reads.set(ref.path, snap.data() ?? null); return snap; },
      set: (ref, data) => ops.push([ref.path, resolve(data)]),
      update: (ref, data) => ops.push([ref.path, { ...store.get(ref.path), ...resolve(data) }]),
      delete: ref => ops.push([ref.path, null])
    });
    if (cfg.transactionDelay) await new Promise(r => setTimeout(r, cfg.transactionDelay));
    if (cfg.failTransaction) throw new Error('Test: transaction failed');
    if (!navigator.onLine) throw new Error('unavailable');
    if (window.__fsRemote) {
      const response = await window.__fsRemote({ type: 'commit', reads: encode([...reads]), ops: encode(ops) });
      receive(response.rows);
      if (!response.ok) continue;
    } else {
      if ([...reads].some(([path, data]) => JSON.stringify(data) !== JSON.stringify(store.get(path) ?? null))) continue;
      for (const [path, data] of ops) data ? store.set(path, data) : store.delete(path);
      notify();
    }
    return result;
  }
  throw new Error('aborted');
}
// Valgfri fælles server i testen: to browserfaner får samme dokumenter,
// men beholder hver sin lytter/copy. Commit bruger compare-and-swap.
function encode(v) {
  if (v instanceof Timestamp) return { __ts: v.ms };
  if (Array.isArray(v)) return v.map(encode);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)]));
  return v;
}
function decode(v) {
  if (v?.__ts != null) return new Timestamp(v.__ts);
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]));
  return v;
}
function receive(rows) { store.clear(); for (const [path, data] of rows) store.set(path, decode(data)); notify(); }

// Testkrog
window.__fs = { store, Timestamp, notify, receive,
  server(tilgaengelig) { serverTilgaengelig = tilgaengelig; notify(); },
  holdWrites(hold) { holdSkrivninger = hold; },
  ack: bekraeft,
  listenerError(frag, code = 'permission-denied') {
    for (const l of [...lyttere]) if (l.path.includes(frag)) {
      lyttere.delete(l); l.fail?.(Object.assign(new Error('Test: listener failed'), { code }));
    }
  },
  put(path, data) { store.set(path, data); notify(); },
  entries() { return [...store.entries()].filter(([p]) => p.startsWith('users/u1/entries/')).map(([p, d]) => ({ id: p.split('/').pop(), ...d, startMs: d.startTime?.ms, endMs: d.endTime?.ms })); } };
const tilTs = d => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v && v.__ts != null ? new Timestamp(v.__ts) : v]));
for (const [p, d] of (cfg.seed || [])) store.set(p, tilTs(d));
window.addEventListener('offline', notify);
window.addEventListener('online', () => { notify(); if (!holdSkrivninger) bekraeft(); });
