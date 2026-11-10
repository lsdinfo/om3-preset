'use strict';

const VERSIONE_APP = '1.3.0';
const VERSIONE_LEGALE = 1; // aumentala quando cambiano le note legali: l'avviso iniziale viene mostrato di nuovo

const LEGALE = [
  ['Natura dell\'app', [
    'OM-3 Preset è un\'app personale, gratuita e senza scopo di lucro, nata come esercizio di programmazione. ' +
    'Serve a conservare e consultare impostazioni fotografiche di esempio.',
    'Tutti i contenuti (preset, elenco degli obiettivi, valori, note, formule) sono INDICATIVI e a solo scopo informativo. ' +
    'Non sono consigli professionali né istruzioni ufficiali.',
  ]],
  ['Possibili errori', [
    'I contenuti sono stati preparati con l\'aiuto di un assistente di intelligenza artificiale, in parte a memoria, ' +
    'e NON sono stati verificati contro il manuale ufficiale. Possono contenere errori, omissioni o dati superati: ' +
    'nomi e opzioni dei menu, livelli del Live ND, limiti degli ISO, modalità computazionali, nomi e caratteristiche degli obiettivi.',
    'Il pixel pitch usato per la regola NPF (3,3 µm) è una stima. Le formule per cielo stellato, filtri ND, alba, tramonto e ' +
    'Luna sono semplificate: gli orari possono differire di alcuni minuti e non vanno usati per scopi di sicurezza o navigazione.',
    'Verifica sempre le impostazioni con il manuale ufficiale e con la versione del firmware della tua fotocamera.',
  ]],
  ['Esclusione di garanzia e responsabilità', [
    'L\'app è fornita "così com\'è" e "come disponibile", senza garanzie di alcun tipo, esplicite o implicite ' +
    '(commerciabilità, idoneità a uno scopo specifico, accuratezza, assenza di errori o interruzioni).',
    'Nei limiti consentiti dalla legge, l\'autore e chi ha contribuito al progetto non rispondono di danni diretti o indiretti, ' +
    'perdita di dati, foto non riuscite o perse, mancati scatti, danni all\'attrezzatura o a terzi derivanti dall\'uso dell\'app o ' +
    'dall\'affidamento sui suoi contenuti. Le tutele inderogabili previste dalla legge (ad esempio quelle dei consumatori) restano valide.',
    'L\'uso avviene a tuo rischio e sotto la tua responsabilità.',
  ]],
  ['Sicurezza', [
    'Non puntare mai il Sole con fotocamera, mirino, schermo o teleobiettivi senza filtri specifici: puoi danneggiare gli occhi e il sensore.',
    'Fotografia notturna, in montagna o in ambienti difficili: valuta meteo, terreno, freddo, orari e luce. ' +
    'Non esporti a rischi per una foto. Per fuochi d\'artificio rispetta distanze, divieti e indicazioni degli organizzatori.',
    'Tieni attrezzatura e treppiede in modo stabile e sicuro, senza ostacolare il passaggio altrui.',
  ]],
  ['Privacy e diritti delle persone', [
    'Fotografando persone, soprattutto minori (ad esempio i preset per sport e bambini), rispetta la normativa sulla privacy ' +
    'e sul diritto all\'immagine del tuo Paese e le regole del luogo (palestre, piscine, scuole, eventi). ' +
    'Chiedi il consenso quando serve e pubblica le immagini solo se sei autorizzato.',
    'L\'app non invia i tuoi dati a nessun server. Preset, obiettivi, impostazioni e foto di esempio restano nel browser del tuo ' +
    'dispositivo. Se usi "Usa la mia posizione" le coordinate servono solo ai calcoli locali e vengono salvate solo sul dispositivo. ' +
    'Cancellando i dati del sito dal browser perdi tutto: usa l\'esportazione per i backup.',
  ]],
  ['Marchi e non affiliazione', [
    'OM System, OM-3, OM Digital Solutions, Olympus, M.Zuiko, Zuiko, Panasonic, Lumix, Leica, Sigma, Voigtländer, Laowa, Samyang, ' +
    'Tamron, GitHub e gli altri nomi citati sono marchi o nomi commerciali dei rispettivi proprietari, usati solo per identificare ' +
    'prodotti e compatibilità.',
    'Questo progetto è indipendente: non è affiliato, sponsorizzato, approvato né collegato in alcun modo ai titolari di tali marchi.',
  ]],
  ['Crediti', [
    'Ideazione, scelta dei preset e direzione del progetto: @lsdinfo.',
    'Realizzazione del codice con l\'assistenza di GitHub Copilot (intelligenza artificiale). L\'output di un\'IA può contenere errori: ' +
    'è stato rivisto solo in parte.',
    'Regola NPF: metodo proposto da Frédéric Michaud, qui con costanti semplificate. Regola 500: regola empirica tradizionale. ' +
    'Posizioni di Sole e Luna: formule semplificate di uso comune in astronomia (ispirate all\'Astronomical Almanac e ai lavori di Jean Meeus), ' +
    'implementate qui con precisione ridotta.',
    'L\'app non utilizza librerie, caratteri o immagini di terze parti: l\'icona è stata creata per questo progetto.',
  ]],
  ['Licenza', [
    'Il codice è distribuito con licenza MIT (vedi il file LICENSE): puoi usarlo, copiarlo e modificarlo mantenendo l\'avviso di copyright e ' +
    'questa esclusione di garanzia. I dati dei preset sono forniti con gli stessi termini.',
  ]],
];

function costruisciLegale(contenitore) {
  for (const [titolo, paragrafi] of LEGALE) {
    contenitore.append(el('h3', {}, titolo), ...paragrafi.map((p) => el('p', { class: 'legale' }, p)));
  }
}

// Avviso mostrato al primo avvio (e quando cambia VERSIONE_LEGALE): va accettato per usare l'app.
function avvisoIniziale() {
  if (LS.get('legale', 0) >= VERSIONE_LEGALE) return;
  const ov = el('div', { class: 'modale avviso' });
  const box = el('div', { class: 'scheda' });
  const spunta = el('input', { type: 'checkbox', id: 'accetto' });
  const bottone = el('button', { class: 'btn', disabled: true }, 'Continua');
  spunta.addEventListener('change', () => {
    bottone.disabled = !spunta.checked;
  });
  bottone.addEventListener('click', () => {
    LS.set('legale', VERSIONE_LEGALE);
    ov.remove();
  });
  box.append(
    el('h2', {}, 'Prima di iniziare'),
    el('p', { class: 'grande' },
      'I preset e i calcoli sono indicativi e possono contenere errori. Verifica sempre con il manuale ufficiale. ' +
      'L\'app è fornita senza garanzie e l\'uso è a tuo rischio. Non è affiliata a OM System o ad altri marchi.'),
    el('details', {}, el('summary', {}, 'Leggi tutte le note legali'), (() => {
      const d = el('div');
      costruisciLegale(d);
      return d;
    })()),
    el('label', { class: 'interruttore' }, spunta, ' Ho letto e accetto queste condizioni'),
    bottone
  );
  ov.append(box);
  document.body.append(ov);
}
