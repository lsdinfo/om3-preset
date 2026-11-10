'use strict';
// Calcoli fotografici. Tutte le formule sono approssimate: vedi le note legali nell'app.

const CROP_M43 = 2;
const PIXEL_PITCH_UM = 3.3; // stima per 20 MP su Micro 4/3: verifica sulle specifiche ufficiali

const regola500 = (focale, crop = CROP_M43) => 500 / (focale * crop);
const npf = (focale, diaframma, pitch = PIXEL_PITCH_UM) => (35 * diaframma + 30 * pitch) / focale;
function correggiDeclinazione(t, decGradi) {
  const c = Math.cos((decGradi * Math.PI) / 180);
  return c > 0.1 ? t / c : t * 10;
}

const ISO_STD = [100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000,
  6400, 8000, 10000, 12800, 16000, 20000, 25600];

// Focale più corta e diaframma massimo letti dal nome dell'obiettivo
function datiLente(nome) {
  const m = /(\d+(?:\.\d+)?)(?:-\d+)?\s*mm\s*f\/(\d+(?:\.\d+)?)/.exec(nome || '');
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
}

function parseLente(nome) {
  const m = /(\d+(?:[.,]\d+)?)(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*mm/.exec(nome || '');
  const a = /f\/(\d+(?:[.,]\d+)?)/.exec(nome || '');
  const num = (x) => (x ? parseFloat(x[1].replace(',', '.')) : null);
  return [num(m), num(a)];
}

const NUMERO = /^\d+(\.\d+)?$/;

// Quando cambia l'obiettivo aggiorna diaframma, tempo e ISO. Restituisce i messaggi.
function adattaPreset(campi, vecchia, nuova) {
  const v = datiLente(vecchia);
  const n = datiLente(nuova);
  if (!n) return [];
  const msg = [];
  const nOld = v ? v[1] : n[1];
  const [foc, ap] = n;
  const diaTesto = campi.diaframma.value.trim();
  if (!NUMERO.test(diaTesto)) return msg;
  const diaOld = parseFloat(diaTesto);
  let dia = diaOld;
  if (diaOld <= nOld + 0.05 || diaOld < ap) dia = ap;
  if (dia !== diaOld) {
    campi.diaframma.value = String(dia);
    msg.push(`Diaframma f/${diaOld} → f/${dia}`);
  }

  const nome = campi.nome.value.toLowerCase();
  const stellato = ['stell', 'tenda', 'scie'].some((k) => nome.includes(k));
  const tempo = campi.tempo.value;
  const tOld = /^\s*(\d+(?:\.\d+)?)(?![\d/.])/.exec(tempo);
  let fattore = (dia / diaOld) ** 2;
  if (stellato && tOld) {
    const vecchio = parseFloat(tOld[1]);
    const nuovoT = Math.min(vecchio, Math.floor(npf(foc, dia)));
    if (nuovoT !== vecchio) {
      campi.tempo.value = tempo.replace(tOld[1], String(nuovoT));
      msg.push(`Tempo ${tOld[1]} s → ${nuovoT} s (limite NPF)`);
      fattore *= vecchio / nuovoT;
    }
  }
  const fisso = ['M', 'Live Composite', 'Live Bulb'].includes(campi.modo.value) || /^\s*\d/.test(tempo);
  const iso = campi.iso.value;
  if (fisso && fattore > 1.01 && /^[\d\s/]+$/.test(iso.trim())) {
    const nuovo = iso.replace(/\d+/g, (s) => {
      const x = parseFloat(s) * fattore;
      return String(ISO_STD.find((i) => i >= x * 0.97) ?? 25600);
    });
    if (nuovo !== iso) {
      campi.iso.value = nuovo;
      msg.push(`ISO ${iso.trim()} → ${nuovo}`);
      if ((nuovo.match(/\d+/g) || []).some((x) => +x > 6400)) {
        msg.push('ISO molto alti: valuta il treppiede o un tempo più lungo');
      }
    }
  }
  return msg;
}

// Controlli di coerenza sulle impostazioni computazionali
function avvisi(v) {
  const msg = [];
  if (v.computazionale === 'High Res Shot (treppiede)' && v.treppiede !== 'Sì') {
    msg.push("High Res con treppiede: segna 'Treppiede' = Sì.");
  }
  if (['Focus Stacking', 'Focus Bracketing'].includes(v.computazionale) && v.af === 'C-AF') {
    msg.push('Focus Stacking/Bracketing: meglio S-AF o MF.');
  }
  if (['Live ND', 'Live GND'].includes(v.computazionale) && !['S', 'M'].includes(v.modo)) {
    msg.push('Live ND/GND funziona solo in modo S o M: cambia il modo esposizione.');
  }
  if (v.computazionale === 'Live ND' && v.modo === 'M' && v.tempo) {
    msg.push('Live ND simula tempi lunghi: il tempo reale è gestito dalla fotocamera.');
  }
  return msg;
}

// ---------- Filtri ND ----------
const LIVE_ND_MAX_STOP = 7; // verifica i livelli Live ND sul manuale
const FILTRI_FISICI = [[0, 'nessuno'], [3, 'ND8'], [6, 'ND64'], [10, 'ND1000'], [13, 'ND8000'], [16, 'ND64000']];

function parseTempo(testo) {
  const t = (testo || '').trim().toLowerCase().replace(',', '.').replace(/s$/, '').trim();
  const f = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(t);
  if (f) return parseFloat(f[1]) / parseFloat(f[2]);
  return NUMERO.test(t) ? parseFloat(t) : null;
}

function formattaTempo(s) {
  if (s >= 1) return (s >= 10 ? s.toFixed(0) : s.toFixed(1)) + ' s';
  return '1/' + Math.round(1 / s) + ' s';
}

function calcolaND(base, voluto) {
  const stop = Math.log2(voluto / base);
  if (stop <= 0.05) return [stop, ['Non serve alcun filtro: il tempo desiderato è già raggiungibile.']];
  const sugg = [];
  for (const [fisico, nome] of FILTRI_FISICI) {
    const resto = stop - fisico;
    if (resto <= 0) {
      sugg.push(`Filtro ${nome} (${fisico} stop): basta da solo.`);
      break;
    }
    if (resto <= LIVE_ND_MAX_STOP) {
      const livello = Math.max(1, Math.round(resto));
      sugg.push(fisico ? `Filtro ${nome} + Live ND ${2 ** livello} (${livello} stop)`
        : `Live ND ${2 ** livello} (${livello} stop), senza filtri`);
      if (fisico) break;
    }
  }
  return [stop, sugg];
}
