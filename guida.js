'use strict';

// Istruzioni indicative scritte a memoria: i nomi dei menu possono differire sulla tua fotocamera/firmware.
const GUIDA = {
  'Live ND': [
    'Funziona solo in modo S o M (non in A): imposta la ghiera su S o M.',
    'Porta la leva/selettore della fotografia computazionale su Live ND (o apri il menu di fotografia computazionale).',
    'Scegli il livello ND (es. ND8 = 3 stop) e usa il treppiede.',
    'In S imposti il tempo desiderato; in M anche diaframma e ISO. La fotocamera simula il filtro ND.',
  ],
  'Live GND': [
    'Come per Live ND: usa S o M, non A.',
    'Seleziona Live GND, poi livello e posizione/direzione della sfumatura sul cielo.',
    'Utile per orizzonti con cielo molto più luminoso del terreno.',
  ],
  'High Res Shot (treppiede)': [
    'Fotocamera fissa su un treppiede solido; usa telecomando o autoscatto 2 s.',
    'Attiva High Res Shot (leva/menu di fotografia computazionale) e scegli la variante treppiede.',
    'Soggetti immobili: tutto ciò che si muove viene mosso/artefatto. Gli scatti sono più lenti e il file molto grande.',
  ],
  'High Res Shot (a mano)': [
    'Attiva High Res Shot e scegli la variante a mano libera.',
    'Tieni la fotocamera ferma durante la sequenza; funziona meglio con luce abbondante e soggetti fermi.',
  ],
  'Focus Stacking': [
    'Attiva Focus Stacking (leva/menu di fotografia computazionale).',
    'Imposta numero di scatti e passo di messa a fuoco; usa S-AF o MF, non C-AF.',
    'Treppiede consigliato. La fotocamera fonde gli scatti in un unico file.',
  ],
  'Focus Bracketing': [
    'Attiva Focus Bracketing dal menu di scatto/computazionale.',
    'Imposta numero di scatti e passo; usa S-AF o MF. Gli scatti restano separati da fondere al computer.',
  ],
  'HDR': [
    'Attiva HDR dalla fotografia computazionale (o dal modo drive) e scegli il tipo.',
    'Soggetto e fotocamera fermi (treppiede se possibile) per evitare fantasmi.',
  ],
  'Pro Capture': [
    'Imposta il modo drive su Pro Capture (L o H).',
    'Mezza pressione: la fotocamera memorizza i fotogrammi precedenti. Scatto completo: salva anche quelli prima dello scatto.',
    'Usa otturatore elettronico e rilevamento soggetto.',
  ],
  'Starry Sky AF': [
    'Attiva Starry Sky AF dal menu AF (o assegnalo a un tasto).',
    'Inquadra una stella luminosa, fai AF; poi controlla il fuoco e passa a MF se serve.',
  ],
  'Live Composite': [
    'Metti la ghiera dei modi su B (Bulb/Time/Composite).',
    'Nel menu per Bulb/Time/Composite scegli Live Composite e imposta il tempo di base (es. 10-15 s).',
    'Treppiede, fuoco manuale e telecomando. Premi per iniziare: la foto si aggiorna e si somma solo ai punti più luminosi. Premi di nuovo per terminare.',
  ],
  'Live Bulb': [
    'Metti la ghiera dei modi su B e scegli Live Bulb nelle impostazioni Bulb/Time/Composite.',
    'Tieni premuto (o con telecomando) per esporre; vedi l\'anteprima crescere durante l\'esposizione.',
  ],
  'Live Time': [
    'Metti la ghiera dei modi su B e scegli Live Time nelle impostazioni Bulb/Time/Composite.',
    'Premi per iniziare e premi di nuovo per terminare; vedi l\'anteprima durante l\'esposizione.',
  ],
  'B (Bulb)': [
    'Metti la ghiera dei modi su B. L\'otturatore resta aperto finché tieni premuto il pulsante.',
  ],
};

function istruzioni(p) {
  const chiavi = [];
  if (p.computazionale && p.computazionale !== 'Nessuna') chiavi.push(p.computazionale);
  if (GUIDA[p.modo] && !chiavi.includes(p.modo)) chiavi.push(p.modo);
  return chiavi.filter((k) => GUIDA[k]).map((k) => [k, GUIDA[k]]);
}
