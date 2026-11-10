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
    'Prima: treppiede solido, soggetto immobile, niente vento. Usa telecomando o autoscatto 2 s per non muovere la fotocamera.',
    'Porta il selettore della fotografia computazionale su High Res Shot (o scegli High Res Shot dal menu computazionale).',
    'Scegli la variante Treppiede e, se richiesto, il formato di salvataggio (JPEG e/o RAW).',
    'Scatta: la fotocamera fa una sequenza di scatti spostando il sensore di pochissimo e li fonde in un\'unica immagine ad alta risoluzione. Non toccare nulla finché non ha finito.',
    'Aspetta che finisca l\'elaborazione prima di spegnere. Luce costante: persone, acqua e foglie mosse creano artefatti.',
  ],
  'High Res Shot (a mano)': [
    'Scegli High Res Shot e poi la variante a mano libera (Handheld).',
    'Serve luce abbondante (tempi brevi) e soggetto fermo; l\'IBIS aiuta a compensare le micro-oscillazioni.',
    'Inquadra, mezza pressione per l\'AF, scatto completo e tieni la fotocamera il più ferma possibile durante tutta la sequenza.',
    'Il risultato è meno nitido della variante su treppiede.',
  ],
  'Focus Stacking': [
    'Treppiede consigliato; soggetto fermo (macro, fiori, oggetti). Modo AF S-AF o MF, mai C-AF.',
    'Porta il selettore della fotografia computazionale su Focus Stacking (o sceglilo dal menu computazionale).',
    'Imposta numero di scatti (es. 8-15) e passo di messa a fuoco (es. 4-6): passo più piccolo = più precisione ma servono più scatti.',
    'Fai l\'AF sul punto più vicino al soggetto; premi lo scatto. La fotocamera sposta il fuoco tra uno scatto e l\'altro e fonde tutto in un\'unica foto.',
    'Con Focus Bracketing invece gli scatti restano separati e li fondi al computer.',
  ],
  'Focus Bracketing': [
    'Attiva Focus Bracketing dal menu di scatto/computazionale.',
    'Imposta numero di scatti e passo; usa S-AF o MF. Gli scatti restano separati da fondere al computer.',
  ],
  'HDR': [
    'Porta il selettore della fotografia computazionale su HDR (o sceglilo dal menu computazionale).',
    'Scegli il tipo di HDR tra quelli offerti dalla fotocamera (più o meno marcato).',
    'Fotocamera su treppiede o ben appoggiata; soggetto il più fermo possibile per evitare effetti fantasma.',
    'Scatta: la fotocamera esegue più esposizioni e le fonde in una sola foto. Utile per controluce e tramonti con forte contrasto.',
  ],
  'Pro Capture': [
    'Imposta il modo drive su Pro Capture (nel menu drive/raffica) e scegli la variante: L (più lenta) o H (più veloce, otturatore elettronico).',
    'Imposta prescatto (numero di fotogrammi salvati prima dello scatto) e usa rilevamento soggetto/C-AF per seguire il soggetto.',
    'Mezza pressione: la fotocamera registra continuamente nel buffer. Scatto completo: salva anche i fotogrammi precedenti (prescatto) e quelli successivi.',
    'Ideale per animali e sport: cattura il momento anche se premi in ritardo.',
  ],
  'Starry Sky AF': [
    'Funziona in modo M (o con modi manuali), con fotocamera su treppiede e obiettivo luminoso (es. Lumix 9 mm f/1.7).',
    'Attiva Starry Sky AF dal menu AF (o assegnalo a un pulsante personalizzato).',
    'Inquadra il cielo con stelle ben visibili (evita nuvole); premi il pulsante AF assegnato e attendi: la messa a fuoco richiede più tempo del normale.',
    'Controlla l\'immagine ingrandita: se le stelle non sono puntiformi, ripeti l\'AF o rifinisci in MF.',
    'Spegni lo stabilizzatore su treppiede e imposta il tempo con la regola NPF (tab Stelle).',
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
