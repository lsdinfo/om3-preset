'use strict';

// ---------- Dati ----------
const CAMPI = [
  ...DATI.CAMPI.map((c) => ({ c: c.c, e: c.e, t: c.t })),
  { c: 'checklist', e: 'Checklist (una voce per riga)', t: 'area' },
  { c: 'luogo', e: 'Luogo', t: 'testo' },
  { c: 'data_foto', e: 'Data dello scatto di esempio', t: 'testo' },
];
const COLONNE = CAMPI.map((c) => c.c);
const ETICHETTE = Object.fromEntries(CAMPI.map((c) => [c.c, c.e]));
const OPZIONI = { ...DATI.OPZIONI };

let presets = LS.get('presets', null);
if (!Array.isArray(presets)) {
  presets = structuredClone(DATI.PRESET);
  LS.set('presets', presets);
}
// Migrazione 2: Live ND non funziona in A; Live Composite delle scie impostato come computazionale
if (LS.get('dati', 1) < 2) {
  for (const p of presets) {
    const ref = DATI.PRESET.find((x) => x.nome === p.nome);
    if (!ref) continue;
    if (p.nome === 'Acqua setosa - Live ND' && p.modo === 'A') {
      Object.assign(p, { modo: ref.modo, diaframma: ref.diaframma, tempo: ref.tempo, parametri_comp: ref.parametri_comp });
    }
    if (p.nome === 'Scie stellari - Live Composite' && p.computazionale === 'Nessuna') p.computazionale = ref.computazionale;
  }
  LS.set('presets', presets);
  LS.set('dati', 2);
}
let miei = LS.get('miei', null);
if (!Array.isArray(miei)) {
  miei = [...DATI.MIEI];
  LS.set('miei', miei);
}
const salvaPreset = () => LS.set('presets', presets);
const salvaMiei = () => LS.set('miei', miei);
const tuttiGliObiettivi = () => [...new Set([...DATI.LENTI, ...miei])];
OPZIONI.obiettivo = tuttiGliObiettivi();

const ui = { tab: 'preset', testo: '', comp: false, pref: false };
const nuovoId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const èComputazionale = (p) => p.computazionale && p.computazionale !== 'Nessuna';

// ---------- Elementi comuni ----------
const badge = (t, cls = '') => el('span', { class: 'badge ' + cls }, t);

function piede() {
  return el(
    'p',
    { class: 'piede' },
    'Dati indicativi: verifica sempre sul manuale ufficiale. App indipendente, non affiliata a OM System. Uso a tuo rischio. ',
    el('button', { class: 'link', onclick: apriInfo }, 'Note legali e crediti')
  );
}

function apriInfo() {
  apriModale((box, m) => {
    box.append(
      el('div', { class: 'testata' }, el('h2', {}, 'Informazioni'),
        el('button', { class: 'btn piatto', 'aria-label': 'Chiudi', onclick: () => m.chiudi() }, '✕')),
      el('p', { class: 'tenue' }, `OM-3 Preset - versione ${VERSIONE_APP}`)
    );
    costruisciLegale(box);
    box.append(el('button', { class: 'btn', onclick: () => m.chiudi() }, 'Chiudi'));
  });
}

// ---------- Tab Preset ----------
function vistaPreset(vista) {
  const cerca = el('input', { type: 'search', placeholder: 'Cerca preset, scena, obiettivo, luogo...', value: ui.testo });
  const interruttore = (testo, chiave) => {
    const i = el('input', { type: 'checkbox' });
    i.checked = ui[chiave];
    i.addEventListener('change', () => {
      ui[chiave] = i.checked;
      disegna();
    });
    return el('label', { class: 'interruttore' }, i, ' ' + testo);
  };
  const recenti = el('div');
  const lista = el('div', { class: 'lista' });

  function disegna() {
    const rec = presets.filter((p) => p.ultimo_uso).sort((a, b) => b.ultimo_uso.localeCompare(a.ultimo_uso)).slice(0, 5);
    recenti.replaceChildren();
    if (rec.length) {
      recenti.append(
        el('p', { class: 'tenue piccolo' }, 'Usati di recente'),
        el('div', { class: 'chips' }, rec.map((p) =>
          el('button', { class: 'chip', onclick: () => apriDettaglio(p.id) }, '↺ ' + p.nome)))
      );
    }
    const q = ui.testo.trim().toLowerCase();
    const righe = presets
      .filter((p) => !q || [p.nome, p.scena, p.computazionale, p.obiettivo, p.luogo].some((x) => (x || '').toLowerCase().includes(q)))
      .filter((p) => !ui.comp || èComputazionale(p))
      .filter((p) => !ui.pref || p.preferito)
      .sort((a, b) => (b.preferito || 0) - (a.preferito || 0) || (a.scena || '').localeCompare(b.scena || '', 'it') || a.nome.localeCompare(b.nome, 'it'));
    lista.replaceChildren();
    if (!righe.length) lista.append(el('p', { class: 'vuoto' }, 'Nessun preset trovato'));
    for (const p of righe) {
      lista.append(
        el('button', { class: 'scheda-preset', onclick: () => apriDettaglio(p.id) },
          el('div', { class: 'riga spazio' },
            el('strong', { class: 'titolo' }, (p.preferito ? '★ ' : '') + p.nome),
            èComputazionale(p) ? badge(p.computazionale, 'ambra') : null),
          el('div', { class: 'tenue piccolo' }, `${p.scena} - ${p.obiettivo}`),
          el('div', { class: 'badges' }, [['modo', ''], ['diaframma', 'f/'], ['tempo', ''], ['iso', 'ISO ']]
            .filter(([k]) => p[k]).map(([k, pre]) => badge(pre + p[k]))))
      );
    }
  }

  cerca.addEventListener('input', () => {
    ui.testo = cerca.value;
    disegna();
  });
  vista.append(cerca, el('div', { class: 'riga' }, interruttore('Solo computazionali', 'comp'), interruttore('Solo preferiti', 'pref')),
    recenti, lista, piede());
  disegna();
}

function apriDettaglio(id) {
  const p = presets.find((x) => x.id === id);
  if (!p) return;
  p.ultimo_uso = new Date().toISOString();
  salvaPreset();
  apriModale((box, m) => dettaglio(id, box, m));
}

function dettaglio(id, box, m) {
  const p = presets.find((x) => x.id === id);
  const stella = el('button', { class: 'btn piatto stella', 'aria-label': 'Preferito' }, p.preferito ? '★' : '☆');
  stella.addEventListener('click', () => {
    p.preferito = p.preferito ? 0 : 1;
    salvaPreset();
    m.mostra((b) => dettaglio(id, b, m));
    mostra();
  });
  box.append(el('div', { class: 'testata' }, el('h2', {}, p.nome), el('div', { class: 'riga' }, stella,
    el('button', { class: 'btn piatto', 'aria-label': 'Chiudi', onclick: () => { m.chiudi(); mostra(); } }, '✕'))));
  if (p.foto) {
    const img = el('img', { class: 'foto', alt: 'Foto di esempio' });
    box.append(img);
    FotoDB.get(p.id).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
  }
  for (const { c, e } of CAMPI.slice(1)) {
    if (c === 'checklist' || !p[c]) continue;
    box.append(el('div', { class: 'dato' }, el('span', { class: 'tenue' }, e), el('span', { class: 'valore' }, p[c])));
  }
  const voci = (p.checklist || '').split('\n').map((v) => v.trim()).filter(Boolean);
  if (voci.length) {
    box.append(el('h3', {}, 'Checklist prima di scattare'),
      ...voci.map((v) => el('label', { class: 'interruttore' }, el('input', { type: 'checkbox' }), ' ' + v)));
  }
  const guide = istruzioni(p);
  if (guide.length) {
    box.append(el('h3', {}, 'Come attivarla'));
    for (const [titolo, passi] of guide) {
      box.append(el('details', {}, el('summary', {}, titolo),
        el('ol', { class: 'legale' }, passi.map((s) => el('li', {}, s))),
        el('p', { class: 'tenue piccolo' }, 'Indicazioni di massima: verifica i nomi dei menu sul manuale.')));
    }
  }
  box.append(el('div', { class: 'riga azioni' },
    el('button', { class: 'btn', onclick: () => m.mostra((b) => modulo(id, b, m)) }, 'Modifica'),
    el('button', { class: 'btn contorno', onclick: () => { duplica(id); m.chiudi(); mostra(); } }, 'Duplica'),
    el('button', { class: 'btn pericolo contorno', onclick: () => conferma(`Eliminare "${p.nome}"?`, 'Elimina', () => {
      elimina(id);
      m.chiudi();
      mostra();
    }) }, 'Elimina')),
    piede());
}

function duplica(id) {
  const p = presets.find((x) => x.id === id);
  presets.push({ ...p, id: nuovoId(), nome: p.nome + ' (copia)', foto: false, preferito: 0, ultimo_uso: '' });
  salvaPreset();
  toast('Preset duplicato');
}

function elimina(id) {
  presets = presets.filter((x) => x.id !== id);
  salvaPreset();
  FotoDB.del(id).catch(() => {});
}

// ---------- Modulo di modifica ----------
function modulo(id, box, m) {
  const esistente = id ? presets.find((x) => x.id === id) : null;
  const dati = esistente ? { ...esistente } : Object.fromEntries(COLONNE.map((c) => [c, '']));
  const campi = {};
  const foto = { blob: null, rimossa: false };

  box.append(el('h2', {}, id ? 'Modifica preset' : 'Nuovo preset'));
  for (const { c, e, t } of CAMPI) {
    const val = dati[c] || '';
    if (t === 'bool') {
      let corrente = val || 'No';
      const bt = ['Sì', 'No'].map((o) => el('button', { type: 'button', class: 'btn contorno' + (corrente === o ? ' attivo' : '') }, o));
      bt.forEach((b) => b.addEventListener('click', () => {
        corrente = b.textContent;
        bt.forEach((x) => x.classList.toggle('attivo', x === b));
      }));
      campi[c] = { el: el('div', { class: 'campo' }, el('span', { class: 'et' }, e), el('div', { class: 'riga' }, bt)), get value() { return corrente; } };
    } else if (t === 'obiettivo' || OPZIONI[t]) {
      campi[c] = campoSelettore(e, t === 'obiettivo' ? tuttiGliObiettivi() : OPZIONI[t], val,
        { preferiti: c === 'obiettivo' ? () => miei : null });
    } else {
      campi[c] = campoTesto(e, val, { area: t === 'area' });
    }
    box.append(campi[c].el);
    if (c === 'tempo') {
      box.append(el('button', { class: 'btn piatto', type: 'button', onclick: () => tempoNpf(campi) }, 'Calcola tempo NPF dall\'obiettivo'));
    }
  }

  let precedente = dati.obiettivo || '';
  campi.obiettivo.onChange((v) => {
    const msg = adattaPreset(campi, precedente, v);
    precedente = v;
    if (msg.length) toast('Adattato al nuovo obiettivo:\n' + msg.join('\n'), 6000);
  });

  // Foto di esempio
  const anteprima = el('div');
  const disegnaFoto = async () => {
    anteprima.replaceChildren();
    let src = null;
    if (foto.blob) src = URL.createObjectURL(foto.blob);
    else if (esistente?.foto && !foto.rimossa) {
      const b = await FotoDB.get(id).catch(() => null);
      if (b) src = URL.createObjectURL(b);
    }
    if (src) {
      anteprima.append(el('img', { class: 'foto', src, alt: 'Anteprima' }),
        el('button', { class: 'btn piatto pericolo', type: 'button', onclick: () => { foto.blob = null; foto.rimossa = true; disegnaFoto(); } }, 'Rimuovi foto'));
    }
  };
  const file = el('input', { type: 'file', accept: 'image/*' });
  file.addEventListener('change', async () => {
    if (!file.files[0]) return;
    try {
      foto.blob = await ridimensiona(file.files[0]);
      foto.rimossa = false;
      disegnaFoto();
    } catch {
      toast('Impossibile leggere questa immagine (usa JPG, PNG o WebP)');
    }
  });
  box.append(el('div', { class: 'campo' }, el('span', { class: 'et' }, 'Foto di esempio'), file), anteprima);
  disegnaFoto();

  box.append(el('div', { class: 'riga azioni' },
    el('button', { class: 'btn piatto', onclick: () => (id ? m.mostra((b) => dettaglio(id, b, m)) : m.chiudi()) }, 'Annulla'),
    el('button', { class: 'btn', onclick: async () => {
      const v = Object.fromEntries(COLONNE.map((c) => [c, campi[c].value.trim()]));
      if (!v.nome) return toast('Il nome è obbligatorio');
      avvisi(v).forEach((a) => toast(a, 6000));
      const p = esistente || { id: nuovoId(), preferito: 0, ultimo_uso: '', foto: false };
      Object.assign(p, v);
      try {
        if (foto.blob) { await FotoDB.put(p.id, foto.blob); p.foto = true; }
        else if (foto.rimossa) { await FotoDB.del(p.id); p.foto = false; }
      } catch { toast('Foto non salvata: spazio insufficiente?'); }
      if (!esistente) presets.push(p);
      salvaPreset();
      m.chiudi();
      mostra();
      toast('Salvato');
    } }, 'Salva')));
}

function tempoNpf(campi) {
  let [focale, ap] = parseLente(campi.obiettivo.value);
  const d = campi.diaframma.value.trim();
  if (NUMERO.test(d)) ap = parseFloat(d);
  if (!focale || !ap) return toast('Scegli prima obiettivo e diaframma');
  const t = Math.floor(npf(focale, ap));
  campi.tempo.value = String(t);
  toast(`NPF a ${focale} mm f/${ap}: ${t} s`);
}

// ---------- Tab Obiettivi ----------
function vistaObiettivi(vista) {
  const nuovo = el('input', { type: 'text', placeholder: "Aggiungi un obiettivo che non c'è (es. 25mm f/1.8)" });
  const cerca = el('input', { type: 'search', placeholder: 'Cerca...' });
  const elenco = el('div', { class: 'elenco' });
  const disegna = () => {
    elenco.replaceChildren();
    const q = cerca.value.toLowerCase();
    for (const nome of [...new Set([...[...miei].sort(), ...DATI.LENTI])]) {
      if (!nome.toLowerCase().includes(q)) continue;
      const c = el('input', { type: 'checkbox' });
      c.checked = miei.includes(nome);
      c.addEventListener('change', () => {
        miei = c.checked ? [...miei, nome] : miei.filter((x) => x !== nome);
        salvaMiei();
      });
      elenco.append(el('label', { class: 'interruttore' }, c, ' ' + nome));
    }
  };
  const aggiungi = () => {
    const n = nuovo.value.trim();
    if (!n) return;
    if (!miei.includes(n)) miei.push(n);
    salvaMiei();
    nuovo.value = '';
    disegna();
    toast('Obiettivo aggiunto');
  };
  cerca.addEventListener('input', disegna);
  vista.append(el('h2', {}, 'I miei obiettivi'),
    el('p', { class: 'tenue' }, 'Seleziona quelli che possiedi: compariranno per primi quando scegli un obiettivo. L\'elenco è indicativo e può contenere errori.'),
    el('div', { class: 'riga' }, nuovo, el('button', { class: 'btn', onclick: aggiungi }, '+')), cerca, elenco, piede());
  disegna();
}

// ---------- Tab Stelle ----------
function numero(etichetta, valore, extra = {}) {
  const i = el('input', { type: 'number', inputmode: 'decimal', step: 'any', ...extra });
  i.value = valore;
  return { i, el: el('label', { class: 'campo' }, el('span', { class: 'et' }, etichetta), i) };
}

function vistaStelle(vista) {
  const lente = campoSelettore('Obiettivo', tuttiGliObiettivi(), '', { preferiti: () => miei });
  const focale = numero('Focale reale (mm)', 9);
  const dia = numero('Diaframma (f/)', 1.7);
  const pitch = numero('Pixel pitch (µm) - stima', PIXEL_PITCH_UM);
  const dec = numero('Declinazione bersaglio (°)', 0);
  const ris = el('div');
  const calcola = () => {
    ris.replaceChildren();
    const f = parseFloat(focale.i.value), n = parseFloat(dia.i.value), p = parseFloat(pitch.i.value), d = parseFloat(dec.i.value) || 0;
    if (!(f > 0 && n > 0 && p > 0)) return;
    const rn = npf(f, n, p);
    for (const [titolo, v] of [['Regola NPF (consigliata)', rn], ['NPF con declinazione', correggiDeclinazione(rn, d)], ['Regola 500 (ottimista)', regola500(f)]]) {
      ris.append(el('div', { class: 'risultato' }, el('span', { class: 'tenue' }, titolo), el('strong', { class: 'grande ambra' }, v.toFixed(1) + ' s')));
    }
  };
  lente.onChange((v) => {
    const [f, a] = parseLente(v);
    if (f) focale.i.value = f;
    if (a) dia.i.value = a;
    calcola();
  });
  [focale, dia, pitch, dec].forEach((x) => x.i.addEventListener('input', calcola));
  vista.append(el('h2', {}, 'Tempo massimo cielo stellato'),
    el('p', { class: 'tenue' }, 'Oltre questo tempo le stelle diventano strisce. Calcolo approssimato: usalo come punto di partenza.'),
    lente.el, focale.el, dia.el, pitch.el, dec.el, ris, piede());
  calcola();
}

// ---------- Tab Luce ----------
function dataOggi() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function vistaLuce(vista) {
  const data = el('input', { type: 'date', value: dataOggi() });
  const lat = numero('Latitudine', LS.get('lat', 41.9));
  const lon = numero('Longitudine', LS.get('lon', 12.5));
  const ris = el('div');
  const calcola = () => {
    ris.replaceChildren();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.value);
    const la = parseFloat(lat.i.value), lo = parseFloat(lon.i.value);
    if (!m || !(Math.abs(la) <= 90) || !(Math.abs(lo) <= 180)) return;
    LS.set('lat', la);
    LS.set('lon', lo);
    const r = giornoAstro(+m[1], +m[2], +m[3], la, lo);
    ris.append(el('div', { class: 'risultato' }, el('strong', {}, `${r.fase} - illuminata al ${(r.illum * 100).toFixed(0)}% (età ${r.eta.toFixed(1)} giorni)`), el('span', { class: 'ambra' }, r.consiglio)));
    for (const [titolo, ev] of [['Sole', r.sole], ['Luna', r.luna]]) {
      ris.append(el('div', { class: 'risultato' }, el('span', { class: 'tenue' }, titolo),
        ev.length ? ev.map(([o, n]) => el('div', { class: 'dato' }, el('span', {}, n), el('strong', {}, o))) : el('span', { class: 'tenue' }, 'Nessun evento in questa data')));
    }
  };
  [data, lat.i, lon.i].forEach((x) => x.addEventListener('input', calcola));
  const gps = el('button', { class: 'btn piatto', onclick: () => {
    if (!navigator.geolocation) return toast('Posizione non disponibile: inserisci le coordinate a mano');
    navigator.geolocation.getCurrentPosition((p) => {
      lat.i.value = p.coords.latitude.toFixed(3);
      lon.i.value = p.coords.longitude.toFixed(3);
      calcola();
    }, () => toast('Posizione non disponibile: inserisci le coordinate a mano'), { timeout: 15000 });
  } }, '⌖ Usa la mia posizione');
  vista.append(el('h2', {}, 'Alba, tramonto e Luna'),
    el('p', { class: 'tenue' }, 'Orari nel fuso del dispositivo. Formule semplificate: precisione di qualche minuto, non usare per sicurezza o navigazione.'),
    el('label', { class: 'campo' }, el('span', { class: 'et' }, 'Data'), data), el('div', { class: 'riga' }, lat.el, lon.el), gps, ris, piede());
  calcola();
}

// ---------- Tab Altro ----------
function vistaAltro(vista) {
  const base = el('input', { type: 'text', value: '1/125' });
  const voluto = el('input', { type: 'text', value: '2' });
  const esito = el('div');
  const calcola = () => {
    esito.replaceChildren();
    const b = parseTempo(base.value), v = parseTempo(voluto.value);
    if (!(b > 0 && v > 0)) return;
    const [stop, sugg] = calcolaND(b, v);
    esito.append(el('div', { class: 'risultato' }, el('strong', { class: 'grande ambra' }, `Servono ${Math.max(stop, 0).toFixed(1)} stop (${formattaTempo(b)} → ${formattaTempo(v)})`),
      sugg.map((s) => el('div', {}, s)), el('span', { class: 'tenue piccolo' }, 'Livelli del Live ND: verifica sul manuale dell\'OM-3.')));
  };
  [base, voluto].forEach((x) => x.addEventListener('input', calcola));

  const importa = el('input', { type: 'file', accept: '.json,application/json' });
  importa.addEventListener('change', async () => {
    try {
      toast(importaJson(JSON.parse(await importa.files[0].text())));
      mostra();
    } catch (err) {
      toast('File non valido: ' + err.message);
    }
    importa.value = '';
  });

  vista.append(
    el('h2', {}, 'Filtri ND e tempi lunghi'),
    el('p', { class: 'tenue' }, "Quanti stop servono per allungare il tempo (seta sull'acqua, nuvole mosse)."),
    el('label', { class: 'campo' }, el('span', { class: 'et' }, 'Tempo misurato senza filtro (es. 1/125)'), base),
    el('label', { class: 'campo' }, el('span', { class: 'et' }, 'Tempo che vuoi (es. 2 oppure 30)'), voluto),
    esito,
    el('hr'),
    el('h2', {}, 'Backup e condivisione'),
    el('p', { class: 'tenue' }, 'I dati restano solo su questo dispositivo: esporta un backup ogni tanto. Le foto di esempio non sono incluse nel file.'),
    el('button', { class: 'btn pieno', onclick: esporta }, 'Esporta tutto (JSON)'),
    el('label', { class: 'campo' }, el('span', { class: 'et' }, 'Importa da JSON'), importa),
    el('button', { class: 'btn contorno pieno', onclick: ripristinaEsempi }, 'Ripristina i preset di esempio mancanti'),
    el('button', { class: 'btn contorno pieno pericolo', onclick: () => conferma('Cancellare tutti i preset, le foto e le impostazioni di questo dispositivo?', 'Cancella tutto', cancellaTutto) }, 'Cancella tutti i dati'),
    el('hr'),
    el('button', { class: 'btn contorno pieno', onclick: apriInfo }, 'Note legali, crediti e licenza'),
    el('p', { class: 'tenue piccolo' }, `Versione ${VERSIONE_APP}`),
    piede()
  );
  calcola();
}

function esporta() {
  const dati = {
    versione: 1,
    preset: presets.map((p) => Object.fromEntries([...COLONNE, 'preferito'].map((c) => [c, p[c] ?? '']))),
    miei_obiettivi: miei,
    impostazioni: { lat: LS.get('lat', 41.9), lon: LS.get('lon', 12.5) },
  };
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(dati, null, 2)], { type: 'application/json' })), download: `om3-preset-${dataOggi()}.json` });
  document.body.append(a);
  a.click();
  a.remove();
}

function importaJson(dati) {
  if (!dati || !Array.isArray(dati.preset)) throw new Error("manca l'elenco dei preset");
  let nuovi = 0, aggiornati = 0;
  const testo = (x) => String(x ?? '').slice(0, 2000);
  for (const src of dati.preset) {
    if (!src || typeof src !== 'object' || !testo(src.nome).trim()) continue;
    const v = {};
    for (const c of COLONNE) if (c in src) v[c] = testo(src[c]);
    const p = presets.find((x) => x.nome === v.nome);
    if (p) {
      Object.assign(p, v, src.preferito != null ? { preferito: src.preferito ? 1 : 0 } : {});
      aggiornati++;
    } else {
      presets.push({ ...Object.fromEntries(COLONNE.map((c) => [c, ''])), ...v, id: nuovoId(), preferito: src.preferito ? 1 : 0, ultimo_uso: '', foto: false });
      nuovi++;
    }
  }
  if (Array.isArray(dati.miei_obiettivi)) {
    for (const n of dati.miei_obiettivi) if (typeof n === 'string' && n && !miei.includes(n)) miei.push(n.slice(0, 200));
    salvaMiei();
  }
  const s = dati.impostazioni;
  if (s && Math.abs(s.lat) <= 90 && Math.abs(s.lon) <= 180) { LS.set('lat', +s.lat); LS.set('lon', +s.lon); }
  salvaPreset();
  return `Importati: ${nuovi} nuovi, ${aggiornati} aggiornati`;
}

function ripristinaEsempi() {
  let n = 0;
  for (const p of DATI.PRESET) {
    if (!presets.some((x) => x.nome === p.nome)) {
      presets.push({ ...structuredClone(p), id: nuovoId() });
      n++;
    }
  }
  salvaPreset();
  toast(n ? `Aggiunti ${n} preset di esempio` : 'Nessun preset mancante');
}

async function cancellaTutto() {
  Object.keys(localStorage).filter((k) => k.startsWith('om3.')).forEach((k) => localStorage.removeItem(k));
  await new Promise((ok) => { const r = indexedDB.deleteDatabase('om3-foto'); r.onsuccess = r.onerror = r.onblocked = ok; });
  location.reload();
}

// ---------- Struttura ----------
const SCHEDE = [['preset', '☰', 'Preset', vistaPreset], ['obiettivi', '◎', 'Obiettivi', vistaObiettivi],
  ['stelle', '☾', 'Stelle', vistaStelle], ['luce', '☀', 'Luce', vistaLuce], ['altro', '⚙', 'Altro', vistaAltro]];

function mostra() {
  const vista = $('#vista');
  vista.replaceChildren();
  SCHEDE.find((s) => s[0] === ui.tab)[3](vista);
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('attivo', b.dataset.tab === ui.tab));
  $('#aggiungi').hidden = ui.tab !== 'preset';
}

function avvia() {
  $('#nav').append(...SCHEDE.map(([id, icona, nome]) =>
    el('button', { 'data-tab': id, onclick: () => { ui.tab = id; mostra(); scrollTo(0, 0); } },
      el('span', { class: 'icona', 'aria-hidden': 'true' }, icona), nome)));
  $('#aggiungi').addEventListener('click', () => apriModale((box, m) => modulo(null, box, m)));
  mostra();
  avvisoIniziale();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

avvia();
