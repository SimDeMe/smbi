export function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') e.appendChild(document.createTextNode(child));
    else if (child) e.appendChild(child);
  }
  return e;
}

export function showToast(msg, type = 'info') {
  const t = el('div', { class: `toast toast-${type}`, role: 'status' }, msg);
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast-visible'), 10);
  setTimeout(() => {
    t.classList.remove('toast-visible');
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

// Sidehovedet i skabelonens form: øjenbryn, overskrift og én linje om,
// hvad man gør her.
export function viewHead(eyebrow, title, lead) {
  return el('div', { class: 'view-head' },
    el('span', { class: 'eyebrow mono' }, el('span', { class: 'blink' }), eyebrow),
    el('h1', {}, title),
    lead ? el('p', { class: 'lead' }, lead) : null
  );
}

export function backLink(label, onclick) {
  return el('button', { class: 'back-link', type: 'button', onclick }, label);
}

export function renderProgressBar(current, total) {
  const pct = Math.round((current / total) * 100);
  return el('div', { class: 'progress-wrap' },
    el('div', { class: 'progress-bar', style: `width:${pct}%` }),
    el('span', { class: 'progress-label' }, `${current} af ${total}`)
  );
}

export function spinner() {
  return el('div', { class: 'spinner' });
}

export function renderStudentCard(student, onEdit, vistNavn) {
  const hasWarning = !student.photoUrls?.length && !student.hints;
  const card = el('div', { class: 'student-card' + (hasWarning ? ' student-card--warn' : '') },
    el('div', { class: 'student-card-photo' },
      student.photoUrls?.length
        ? el('img', { src: student.photoUrls[0], alt: vistNavn || student.name, loading: 'lazy' })
        : el('div', { class: 'student-card-no-photo' }, '?')
    ),
    el('div', { class: 'student-card-info' },
      el('div', { class: 'student-card-name' }, vistNavn || student.name),
      el('div', { class: 'student-card-meta' },
        `Niveau ${student.level || 1}`,
        hasWarning ? el('span', { class: 'warn-badge' }, 'Mangler foto/hint') : null
      )
    ),
    el('button', { class: 'btn-icon', onclick: () => onEdit(student) }, '✎')
  );
  return card;
}

// ── Fokus uden genklik ───────────────────────────────────────────────────────
//
// Trykker man Enter i svarfeltet, sender samme tastetryk også en keypress af
// sted — og den lander på den knap, der i mellemtiden har fået fokus, og
// klikker den. Et forkert svar viste derfor facit i et splitsekund og hoppede
// selv videre til næste elev. Det samme sker, hvis man holder Enter nede:
// tastaturets gentagelser klikker knappen igen og igen.
//
// En knap, der fødes med fokus, skal derfor først tage imod, når tastaturet
// har været sluppet. Er svaret afgivet med mus eller finger, er der ingen tast
// nede, og knappen virker med det samme.

let tastNede = false;
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', () => { tastNede = true; }, true);
  window.addEventListener('keyup', () => { tastNede = false; }, true);
  window.addEventListener('blur', () => { tastNede = false; });
}

export function fokuserUdenGenklik(knap) {
  knap.focus();
  if (!tastNede) return;

  const blokér = e => { e.preventDefault(); e.stopPropagation(); };
  knap.addEventListener('click', blokér, true);

  const slipLøs = () => {
    knap.removeEventListener('click', blokér, true);
    window.removeEventListener('keyup', slipLøs, true);
  };
  window.addEventListener('keyup', slipLøs, true);
}
