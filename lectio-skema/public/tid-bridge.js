// The Firebase login stays on smbi.dk. This page only transfers the schedule.
export function initTidBridge(getSnapshot) {
  const button = document.getElementById('send-tid');
  const status = document.getElementById('tid-status');
  const target = new URL('https://smbi.dk/tid/lectio-import.html');
  let popup = null, nonce = null, ready = false, lastSent = null;
  function send(force = false) {
    if (popup?.closed) { popup = null; ready = false; status.textContent = 'Forbindelsen til Tid er lukket. Tryk Send til Tid igen.'; }
    const snapshot = getSnapshot();
    if (!popup || !ready || !snapshot || (!force && lastSent === snapshot.fetchedAt)) return;
    popup.postMessage({ type: 'tid-lectio-snapshot', nonce, snapshot }, target.origin);
    lastSent = snapshot.fetchedAt;
    status.textContent = 'Skemaet er sendt til forbindelsesvinduet. Første gang skal du logge ind og vælge Forbind og gem skema.';
  }
  button.addEventListener('click', () => {
    if (!getSnapshot()) { status.textContent = 'Hent et skema først.'; return; }
    if (popup && !popup.closed) { popup.focus(); send(true); return; }
    nonce = crypto.randomUUID(); ready = false; lastSent = null;
    target.hash = new URLSearchParams({ origin: location.origin, nonce }).toString();
    popup = window.open(target.href, 'smbi-lectio-tid', 'popup,width=620,height=760');
    status.textContent = popup ? 'Åbner forbindelsen til din Tid-konto…' : 'Browseren blokerede vinduet. Tillad popup-vinduet, og tryk Send til Tid igen.';
  });
  window.addEventListener('message', event => {
    if (!popup || event.origin !== target.origin || event.source !== popup || event.data?.nonce !== nonce) return;
    if (event.data.type === 'tid-lectio-ready') { ready = true; send(); }
    if (event.data.type === 'tid-lectio-saved') status.textContent = `${event.data.count} aktiviteter gemt i Tid. Nye opdateringer sendes også, så længe forbindelsesvinduet er åbent.`;
    if (event.data.type === 'tid-lectio-error') status.textContent = event.data.message;
    if (event.data.type === 'tid-lectio-disconnected') { ready = false; popup = null; status.textContent = 'Forbindelsen til Tid er afbrudt.'; }
  });
  window.addEventListener('beforeunload', () => { if (popup && !popup.closed) popup.postMessage({ type: 'tid-lectio-disconnect', nonce }, target.origin); });
  return send;
}
