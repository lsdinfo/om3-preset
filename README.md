# OM-3 Preset

App web installabile (PWA), offline, per consultare e gestire preset indicativi per la fotocamera OM System OM-3,
inclusi i modi computazionali (Live ND, High Res, Focus Stacking, Live Composite...). Nata come progetto per imparare a programmare.

## Installazione sul telefono
Apri l'indirizzo GitHub Pages del progetto in Chrome (Android) o Safari (iPhone), poi
"Aggiungi a schermata Home" / "Installa app". Dopo il primo caricamento funziona anche offline.

## Avvertenze importanti
- **Contenuti indicativi**: preset, elenco obiettivi e formule (NPF, ND, Sole/Luna) sono approssimati, preparati anche con l'aiuto di un'IA
  e **non verificati sul manuale ufficiale**. Possono contenere errori. Controlla sempre manuale e firmware.
- **Nessuna garanzia, uso a proprio rischio**: software fornito "così com'è" (vedi LICENSE). L'autore non risponde di danni, perdita di dati o foto mancate.
- **Sicurezza**: mai puntare il Sole con fotocamera o ottiche senza filtri adatti; attenzione in notturna e in montagna.
- **Privacy e diritti**: rispetta privacy e diritto all'immagine (soprattutto minori) e le regole dei luoghi e degli eventi.
- **Marchi**: OM System, Olympus, Panasonic, Lumix, Leica, Sigma, Voigtländer, Laowa, Samyang, Tamron e altri sono marchi dei rispettivi proprietari.
  Progetto indipendente, non affiliato né approvato da nessuno di essi.
- **Dati solo locali**: nessun server, nessun tracciamento. I dati stanno nel browser: esporta backup regolari.

## Crediti
- Idea e direzione: @lsdinfo
- Codice scritto con l'assistenza di GitHub Copilot (IA)
- Regola NPF: Frédéric Michaud; Regola 500: regola empirica tradizionale; Sole/Luna: formule semplificate in stile Astronomical Almanac / Jean Meeus
- Nessuna libreria di terze parti

## Sviluppo
Solo HTML/CSS/JS statici. Prova in locale: `python -m http.server 8090` nella cartella, poi apri http://localhost:8090.
Se modifichi i file, aumenta `CACHE` in `sw.js` per far aggiornare l'app installata.

## Licenza
MIT, vedi `LICENSE`.
