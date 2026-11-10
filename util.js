'use strict';

const $ = (s, r = document) => r.querySelector(s);

// Crea elementi DOM senza innerHTML: i testi dell'utente non vengono mai interpretati come HTML.
function el(tag, attrs = {}, ...figli) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const f of figli.flat()) {
    if (f != null && f !== false) e.append(f.nodeType ? f : document.createTextNode(String(f)));
  }
  return e;
}

const LS = {
  get(k, def) {
    try {
      const v = localStorage.getItem('om3.' + k);
      return v == null ? def : JSON.parse(v);
    } catch {
      return def;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('om3.' + k, JSON.stringify(v));
    } catch {
      toast('Memoria piena: esporta un backup e libera spazio');
    }
  },
};

function toast(msg, ms = 3500) {
  const t = el('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

// ---------- Foto (IndexedDB) ----------
const FotoDB = {
  _db: null,
  apri() {
    this._db ||= new Promise((ok, ko) => {
      const r = indexedDB.open('om3-foto', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('foto');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
    return this._db;
  },
  async tx(modo, fn) {
    const db = await this.apri();
    return new Promise((ok, ko) => {
      const t = db.transaction('foto', modo);
      const req = fn(t.objectStore('foto'));
      t.oncomplete = () => ok(req && req.result);
      t.onerror = () => ko(t.error);
    });
  },
  get: (id) => FotoDB.tx('readonly', (s) => s.get(id)),
  put: (id, blob) => FotoDB.tx('readwrite', (s) => s.put(blob, id)),
  del: (id) => FotoDB.tx('readwrite', (s) => s.delete(id)),
};

async function ridimensiona(file, max = 1280) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
}

// ---------- Finestre a schermo intero (il tasto Indietro del telefono le chiude) ----------
const pila = [];
let saltaPop = 0;

function apriModale(costruisci) {
  const ov = el('div', { class: 'modale' });
  const box = el('div', { class: 'scheda' });
  ov.append(box);
  document.body.append(ov);
  const m = {
    ov,
    box,
    chiudi() {
      const i = pila.indexOf(m);
      if (i < 0) return;
      const rimossi = pila.splice(i);
      rimossi.forEach((x) => x.ov.remove());
      saltaPop++;
      history.go(-rimossi.length);
    },
    mostra(fn) {
      box.replaceChildren();
      fn(box, m);
      box.scrollTop = 0;
    },
  };
  pila.push(m);
  history.pushState({ modale: pila.length }, '');
  m.mostra(costruisci);
  return m;
}

addEventListener('popstate', () => {
  if (saltaPop > 0) {
    saltaPop--;
    return;
  }
  const m = pila.pop();
  if (m) m.ov.remove();
});

function conferma(testo, etichetta, onSi) {
  apriModale((box, m) => {
    box.append(
      el('p', { class: 'grande' }, testo),
      el(
        'div',
        { class: 'riga' },
        el('button', { class: 'btn piatto', onclick: () => m.chiudi() }, 'Annulla'),
        el(
          'button',
          {
            class: 'btn pericolo',
            onclick: () => {
              m.chiudi();
              onSi();
            },
          },
          etichetta
        )
      )
    );
  });
}

// ---------- Campi ----------
function campoTesto(etichetta, valore = '', { area = false, tipo = 'text' } = {}) {
  const input = el(area ? 'textarea' : 'input', area ? { rows: 4 } : { type: tipo });
  input.value = valore;
  return {
    el: el('label', { class: 'campo' }, el('span', { class: 'et' }, etichetta), input),
    get value() {
      return input.value;
    },
    set value(v) {
      input.value = v;
    },
  };
}

// Campo che apre un elenco con ricerca (comodo da telefono). Si può anche scrivere un valore libero.
function campoSelettore(etichetta, opzioni, valore = '', { preferiti = null } = {}) {
  const input = el('input', { type: 'text', readonly: true, class: 'sel' });
  input.value = valore;
  const ascoltatori = [];
  const api = {
    el: el('label', { class: 'campo' }, el('span', { class: 'et' }, etichetta), input),
    get value() {
      return input.value;
    },
    set value(v) {
      input.value = v;
    },
    onChange(fn) {
      ascoltatori.push(fn);
    },
  };

  input.addEventListener('click', () => {
    const miei = preferiti ? preferiti() : [];
    let tutti = miei.length === 0;
    apriModale((box, m) => {
      const cerca = el('input', { type: 'search', placeholder: 'Cerca o scrivi un valore...' });
      const elenco = el('div', { class: 'elenco' });
      const scegli = (v) => {
        const cambiato = v !== input.value;
        input.value = v;
        m.chiudi();
        if (cambiato) ascoltatori.forEach((f) => f(v));
      };
      const voce = (testo, v, cls = '') =>
        elenco.append(el('button', { class: 'voce ' + cls, onclick: () => scegli(v) }, testo));
      const disegna = () => {
        elenco.replaceChildren();
        const q = cerca.value.trim();
        const visibili = tutti ? [...miei, ...opzioni.filter((o) => !miei.includes(o))] : miei;
        voce('- Nessuno -', '', 'tenue');
        if (q && !visibili.includes(q)) voce(`Usa "${q}"`, q, 'accento');
        for (const o of visibili) {
          if (o.toLowerCase().includes(q.toLowerCase())) {
            voce(o, o, (miei.includes(o) ? 'grassetto ' : '') + (o === input.value ? 'accento' : ''));
          }
        }
      };
      cerca.addEventListener('input', disegna);
      box.append(
        el(
          'div',
          { class: 'testata' },
          el('h2', {}, etichetta),
          el('button', { class: 'btn piatto', 'aria-label': 'Chiudi', onclick: () => m.chiudi() }, '✕')
        ),
        cerca
      );
      if (miei.length) {
        const sw = el('input', { type: 'checkbox' });
        sw.addEventListener('change', () => {
          tutti = sw.checked;
          disegna();
        });
        box.append(el('label', { class: 'interruttore' }, sw, ' Mostra tutti'));
      }
      box.append(elenco);
      disegna();
    });
  });
  return api;
}
