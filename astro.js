'use strict';
// Sole e Luna con formule semplificate (precisione di qualche minuto). Orari nel fuso del dispositivo.

const RAD = Math.PI / 180;
const J2000 = Date.UTC(2000, 0, 1, 12);
const mod360 = (x) => ((x % 360) + 360) % 360;
const giorniJ2000 = (t) => (t - J2000) / 864e5;

const EVENTI_SOLE = [
  [-18, true, 'Fine buio totale'],
  [-8, true, 'Inizio ora blu'],
  [-4, true, "Fine ora blu / inizio ora d'oro"],
  [-0.833, true, 'Alba'],
  [6, true, "Fine ora d'oro"],
  [6, false, "Inizio ora d'oro serale"],
  [-0.833, false, 'Tramonto'],
  [-4, false, "Fine ora d'oro / inizio ora blu"],
  [-8, false, 'Fine ora blu'],
  [-18, false, 'Inizio buio totale'],
];

function altezzaDa(ra, dec, d, lat, lon) {
  const h = (280.46061837 + 360.98564736629 * d + lon) * RAD - ra;
  const la = lat * RAD;
  return Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(h)) / RAD;
}

const soleLon = (d) => {
  const g = (357.528 + 0.9856003 * d) * RAD;
  return mod360(280.46 + 0.9856474 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
};
const lunaLon = (d) => mod360(218.316 + 13.176396 * d + 6.289 * Math.sin((134.963 + 13.064993 * d) * RAD));

function altezzaSole(t, lat, lon) {
  const d = giorniJ2000(t);
  const lam = soleLon(d) * RAD;
  const eps = (23.439 - 4e-7 * d) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  return altezzaDa(ra, Math.asin(Math.sin(eps) * Math.sin(lam)), d, lat, lon);
}

function altezzaLuna(t, lat, lon) {
  const d = giorniJ2000(t);
  const lam = lunaLon(d) * RAD;
  const beta = 5.128 * RAD * Math.sin((93.272 + 13.22935 * d) * RAD);
  const eps = (23.439 - 4e-7 * d) * RAD;
  const ra = Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(beta) * Math.sin(eps), Math.cos(lam));
  const dec = Math.asin(Math.sin(beta) * Math.cos(eps) + Math.cos(beta) * Math.sin(eps) * Math.sin(lam));
  return altezzaDa(ra, dec, d, lat, lon);
}

function faseLuna(t) {
  const d = giorniJ2000(t);
  const elong = mod360(lunaLon(d) - soleLon(d));
  const nomi = [[22.5, 'Luna nuova'], [67.5, 'Crescente'], [112.5, 'Primo quarto'], [157.5, 'Gibbosa crescente'],
    [202.5, 'Luna piena'], [247.5, 'Gibbosa calante'], [292.5, 'Ultimo quarto'], [337.5, 'Calante']];
  const nome = (nomi.find(([lim]) => elong < lim) || [0, 'Luna nuova'])[1];
  return { illum: (1 - Math.cos(elong * RAD)) / 2, eta: (elong / 360) * 29.530589, nome };
}

function attraversamenti(fn, soglia, inizio, fine, passoMin = 5) {
  const out = [];
  const passo = passoMin * 60000;
  let t = inizio;
  let prev = fn(t) - soglia;
  while (t < fine) {
    const t2 = t + passo;
    const cur = fn(t2) - soglia;
    if (prev * cur < 0) out.push([t + (passo * prev) / (prev - cur), cur > prev]);
    t = t2;
    prev = cur;
  }
  return out;
}

const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

function giornoAstro(anno, mese, giorno, lat, lon) {
  const inizio = new Date(anno, mese - 1, giorno).getTime();
  const fine = new Date(anno, mese - 1, giorno + 1).getTime();
  const sole = [];
  for (const [soglia, salita, nome] of EVENTI_SOLE) {
    for (const [t, su] of attraversamenti((x) => altezzaSole(x, lat, lon), soglia, inizio, fine)) {
      if (su === salita) sole.push([t, nome]);
    }
  }
  sole.sort((a, b) => a[0] - b[0]);
  const luna = attraversamenti((x) => altezzaLuna(x, lat, lon), 0.125, inizio, fine)
    .map(([t, su]) => [t, su ? 'Sorge la Luna' : 'Tramonta la Luna'])
    .sort((a, b) => a[0] - b[0]);
  const f = faseLuna(inizio + 12 * 3600000);
  return {
    sole: sole.map(([t, n]) => [ora(t), n]),
    luna: luna.map(([t, n]) => [ora(t), n]),
    illum: f.illum,
    eta: f.eta,
    fase: f.nome,
    consiglio: consiglio(f.illum, luna, sole),
  };
}

function consiglio(illum, luna, sole) {
  if (illum < 0.15) return 'Luna quasi assente: ottima serata per Via Lattea e cielo stellato.';
  const sorge = luna.find(([, n]) => n.startsWith('Sorge'));
  const cala = luna.find(([, n]) => n.startsWith('Tramonta'));
  const buio = sole.find(([, n]) => n === 'Inizio buio totale');
  if (illum < 0.5 && cala && buio && cala[0] > buio[0]) return `Cielo scuro dopo il tramonto della Luna (${ora(cala[0])}).`;
  if (illum < 0.5 && sorge && buio && sorge[0] > buio[0]) return `Cielo scuro fino al sorgere della Luna (${ora(sorge[0])}).`;
  if (illum > 0.75) return 'Luna molto luminosa: meglio per paesaggi notturni che per la Via Lattea.';
  return 'Luna presente: la Via Lattea sarà meno contrastata.';
}
