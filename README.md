# My Finance

Applicazione personale in italiano per conti, movimenti, risparmi e investimenti. MVP locale, gratuito e senza servizi bancari esterni. L’archivio iniziale è vuoto: nessun conto o movimento preimpostato, tutti i totali partono da zero.

## Architettura

- **Next.js 16 + React 19 + TypeScript**: interfaccia responsive e API nello stesso progetto.
- **SQLite nativo di Node.js 24**: nessun server database o compilatore da installare. File `data/finance.sqlite`, creato al primo accesso.
- **Zod**: validazione condivisa; denaro in centesimi interi.
- **Recharts**: grafici interattivi; **ExcelJS**: scambio XLSX/CSV.
- Archivio SQLite come documento JSON validato con revisione incrementale: aggiornamento atomico e controllo dei conflitti tra finestre. Scelta semplice per un singolo utente; non un sistema contabile multiutente.
- Modello e calcoli in `lib/model.ts`, persistenza in `lib/db.ts`, scambio dati in `lib/exchange.ts`, archivio iniziale vuoto in `lib/seed.ts` (fixture dimostrativa soltanto nei test), API in `app/api`, interfaccia in `app/page.tsx` e `app/globals.css`.

## Avvio su Windows

1. Installa **Node.js 24 LTS** da https://nodejs.org (include npm). Chiudi e riapri il terminale dopo l’installazione.
2. Scarica questo progetto o clonalo con Git. Apri **Prompt dei comandi** nella cartella del progetto:

```bat
cd C:\percorso\finance
node --version
npm ci
npm run build
npm start
```

3. Apri `http://127.0.0.1:3000` nel browser. Mantieni il terminale aperto; `Ctrl+C` arresta l’app. Le visite successive richiedono soltanto `npm start`. Non cancellare la cartella `data`.

Per sviluppare con aggiornamento automatico:

```bat
npm run dev
```

Se PowerShell blocca `npm.ps1`, usa Prompt dei comandi oppure `npm.cmd` al posto di `npm`, senza modificare le policy di sicurezza.

### Smartphone sulla stessa rete Wi-Fi

Dopo la build, avvia esplicitamente:

```bat
npm run start -- --hostname 0.0.0.0
ipconfig
```

Apri sul telefono `http://INDIRIZZO_IPV4_DEL_PC:3000`. Consenti eventualmente Node.js nel firewall **solo sulle reti private**. Il PC deve restare acceso. La versione locale non include login o HTTPS: tutti i dispositivi che raggiungono il server possono leggere e modificare l’archivio. Usa una rete domestica fidata, senza port forwarding o pubblicazione Internet. Per sicurezza `npm start` e `npm run dev` ascoltano solo sul PC per impostazione predefinita.

## Utilizzo

- **Conti**: crea/modifica i conti e il saldo iniziale, poi registra i movimenti. Un conto utilizzato non può essere eliminato finché esistono riferimenti.
- **Movimenti**: entrata, uscita o trasferimento tra due conti distinti. Le categorie si scelgono da un menu (Casa, Auto, Lavoro, Investimenti, Divertimento e altre). Seleziona **+ Nuova categoria…** per crearne una: dopo il salvataggio del movimento sarà disponibile anche per quelli successivi e inclusa nei backup dei movimenti. Le categorie personalizzate sono ricavate dai movimenti esistenti. I trasferimenti non cambiano patrimonio o risparmio mensile. Le date future sono indicate come previste ed escluse dai saldi odierni e dai totali della dashboard. Le uscite possono portare il saldo sotto zero.
- **Investimenti**: ETF, azioni, PAC e TFR con capitale versato, valutazione manuale e rata mensile prevista. Nessuna quotazione o negoziazione automatica. Un versamento va registrato anche come uscita dal conto e aggiornamento del capitale investito; diversamente il capitale viene contato due volte. PAC e TFR sono posizioni separate, da non duplicare negli ETF sottostanti.
- **Obiettivi**: matrimonio, casa o nomi personalizzati. Gli importi accantonati rappresentano denaro già nei conti, non si sommano al patrimonio.
- **Abbonamenti**: costo, periodicità e prossima scadenza. Promemoria manuali: pagamenti e rinnovi non sono registrati automaticamente.
- **Grafici**: andamento della liquidità storica sommata al valore attuale degli investimenti; non è uno storico delle quotazioni. Proiezione quinquennale basata su rendimento ipotetico modificabile e versamenti mensili, senza tasse/costi/inflazione. Non è una previsione garantita.

Le nuove installazioni partono da zero. Gli aggiornamenti non cancellano né sostituiscono archivi esistenti. Se usi una versione precedente con dati dimostrativi, vai in **Dati e backup → Azzera archivio**, scarica un backup e scrivi **AZZERA** per confermare. L’operazione elimina **tutti** i conti, movimenti, abbonamenti, investimenti e obiettivi, anche quelli personali. Puoi annullare prima della conferma. Il recupero richiede un backup JSON precedente.

Il saldo attuale è saldo iniziale + entrate − uscite ± trasferimenti. Impostare il saldo iniziale a zero non elimina i movimenti. I conti con movimenti o abbonamenti collegati non possono essere eliminati singolarmente: elimina/riassegna prima i riferimenti, oppure usa l’azzeramento esplicito se vuoi svuotare tutto.

## Importazione ed esportazione

In **Dati e backup**, esporta Excel o CSV per avere il modello. Excel include il foglio `Movimenti` e i conti di riferimento. L’importazione legge solo `Movimenti` e aggiunge nuove righe dopo anteprima e conferma.

Colonne esatte:

```text
ID;Data;Descrizione;Tipo;Conto ID;Destinazione ID;Categoria;Importo EUR
```

- Date `AAAA-MM-GG`; tipi `income`, `expense`, `transfer`.
- Importo positivo in euro, massimo due decimali, punto o virgola decimale, senza separatori delle migliaia.
- Usa gli UUID dei conti esistenti. La destinazione è obbligatoria soltanto per i trasferimenti e deve essere diversa dall’origine.
- Lascia ID vuoto per nuovi movimenti; gli ID già presenti o duplicati bloccano l’intera importazione. Un export non può essere reimportato sullo stesso archivio senza prima rimuovere i duplicati.
- CSV UTF-8 con separatore `;`, compatibile con Excel italiano. I campi potenzialmente interpretati come formule sono protetti con apostrofo. XLSX: celle formula non consentite.
- File massimo 5 MB / 50.000 movimenti complessivi. Importazione atomica: nessuna riga salvata in caso di errore. Il formato non è quello specifico di una banca.

## Backup e ripristino

**Scarica backup** esporta un JSON versionato completo. **Ripristina backup JSON** valida il file e sostituisce tutti i dati dopo conferma. È il formato consigliato per spostare l’archivio tra PC. Esegui prima un backup dell’archivio corrente e custodiscilo in una cartella protetta: i dati sono in chiaro.

SQLite persiste automaticamente; il backup esterno è manuale. Per una copia del file database, arresta prima il server e copia **l’intera cartella `data`**, inclusi eventuali file WAL/SHM. Puoi selezionare un percorso alternativo con la variabile server `FINANCE_DB` (non pubblica).

## Verifica

```bat
npm test
npm run typecheck
npm run build
```

I test coprono conversioni monetarie, date, conservazione dei saldi nei trasferimenti, statistiche mensili, riferimenti, persistenza dopo riapertura, conflitti concorrenti, ripristino e import CSV. Vedi `VALIDATION.md` per i risultati effettivamente eseguiti nell’ambiente di sviluppo.

## Roadmap

1. **MVP attuale**: dashboard, CRUD conti/movimenti/categorie, abbonamenti, investimenti manuali/PAC/TFR, obiettivi, grafici e proiezioni, scambio CSV/XLSX, backup/ripristino JSON e test.
2. **Accuratezza storica**: valutazioni investimento datate, acquisti/vendite e trasferimenti al portafoglio integrati, riconciliazione, gestione saldi iniziali datati, categorie strutturate.
3. **Automazioni**: ricorrenze con conferma e prevenzione duplicati, parser bancari dedicati, budget e notifiche, backup programmati.
4. **Accesso evoluto**: autenticazione, HTTPS, eventuale PWA e sincronizzazione tra dispositivi. Da aggiungere prima di qualsiasi esposizione pubblica.

Nessun dato viene inviato a banche o servizi di analisi. In fase di installazione npm scarica dipendenze; l’utilizzo normale non richiede servizi esterni. Il codice non contiene credenziali.

### Test nel browser (facoltativi su Windows)

```bat
npx playwright install chromium
npm run build
npm run test:e2e
```

I test avviano autonomamente il server sulla porta 3100 con un database temporaneo separato, senza modificare i dati personali. Nell’ambiente cloud è stato usato Chromium di sistema tramite `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Questa variabile non serve usando il browser installato da Playwright su Windows.

## Modalità scura

Il pulsante con luna/sole nella barra superiore passa tra tema chiaro e scuro, anche da smartphone. Al primo accesso viene rispettato il tema del sistema operativo; una scelta esplicita è ricordata in questo browser tramite localStorage e prevale sul sistema. Non modifica il database e non è inclusa nei backup finanziari. Se il browser impedisce il salvataggio delle preferenze, il selettore continua a funzionare per la pagina aperta.

### Aggiornare una copia installata da ZIP

Prima di aggiornare scarica un backup JSON da **Dati e backup**. Arresta il server con `Ctrl+C`. Scarica lo ZIP aggiornato da GitHub e copia i file di progetto nella cartella esistente, senza eliminare o sostituire la tua cartella `data`. Non copiare `node_modules` o `.next` da altri PC. Per aggiornare alla versione 0.2 copia le cartelle `app` e `lib` dello ZIP nella cartella dell’app esistente, unendo le cartelle e sostituendo i file quando richiesto; questo non tocca il database. Poi esegui `npm run build` e `npm start`, infine aggiorna il browser con `Ctrl+F5`.


## Panoramica 0.2

Grafico a ciambella interattivo delle uscite del mese selezionato con importi, percentuali e legenda per categoria. Entrate, trasferimenti e movimenti futuri sono esclusi. Se non ci sono uscite compare uno stato vuoto senza percentuali artificiali. Gli ultimi movimenti mostrano tre righe compatte; **Vedi tutti** apre l’elenco completo. Entrambi i temi usano superfici e tipografia più sobrie.
