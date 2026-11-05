# Verifica MVP — 5 novembre 2026

Verificato su Linux, Node.js 24.22.1 e Chromium di sistema. L’esecuzione su Windows non è stata provata direttamente; i comandi sono compatibili con Node.js 24 su Windows e non richiedono moduli SQLite nativi da compilare.

## Risultati finali

- `npm test`: **9 test passati**, 0 falliti, 0 saltati. Importi in centesimi, date, trasferimenti, statistiche, integrità dei riferimenti, persistenza dopo riapertura, conflitti di revisione, ripristino, CSV e controllo origine.
- `npm run typecheck`: riuscito. La build finale include inoltre il controllo TypeScript completo, test browser compresi.
- `npm run build`: riuscita, pagina principale e due endpoint API generati.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: **3 test passati**, 0 falliti.
  - Desktop: caricamento dashboard, creazione conto, entrata, trasferimento, saldo atteso, modifica e persistenza dopo ricaricamento; grafico e simulazione funzionanti, nessun errore JavaScript.
  - API: backup completo, esportazione CSV/XLSX, rilettura XLSX, rifiuto duplicati, importazione Excel, salvataggio, conflitto concorrente, ripristino e rifiuto di origini esterne.
  - Smartphone a 390 × 844: dashboard senza overflow, menu, creazione obiettivo e accesso alla sezione backup.
- `npm audit --omit=dev`: **0 vulnerabilità note** al momento della verifica. ExcelJS usa un override di uuid 11, compatibile con la chiamata v4 utilizzata; importazione ed esportazione XLSX sono state verificate dopo l’aggiornamento.

Le verifiche browser usano un archivio temporaneo; nessuna informazione bancaria reale è stata utilizzata. Le prime esecuzioni hanno rilevato un errore del controllo origine e un’associazione non corretta delle etichette dei select: corretti prima della verifica finale. Tutti i risultati sopra si riferiscono ai controlli finali.

## Limiti intenzionali

Applicazione personale locale senza autenticazione, collegamenti bancari o prezzi live. Abbonamenti e PAC non generano movimenti automatici. Lo storico patrimoniale usa le valutazioni attuali degli investimenti, non quotazioni storiche. Esportazione/importazione Excel e CSV limitata ai movimenti; il backup JSON comprende l’intero archivio. Il salvataggio SQLite è automatico, i backup esterni sono manuali. Accesso smartphone verificato tramite viewport emulato, non su dispositivo fisico o firewall Windows.

Nessun push GitHub, deployment pubblico o pubblicazione della configurazione cloud eseguito.

## Aggiornamento tema — 6 novembre 2026

Tema chiaro/scuro con preferenza del sistema al primo accesso e scelta esplicita persistita nel browser. La build di produzione, comprensiva di TypeScript, è riuscita. Il test browser aggiunto verifica preferenza iniziale, passaggio chiaro/scuro, persistenza dopo ricaricamento, colori di pannelli e modali, selettore accessibile su smartphone e assenza di modifiche all’archivio finanziario.

Esecuzione finale: **4 test browser passati**, 0 falliti o saltati, inclusi i tre flussi precedenti. Verifica visiva aggiuntiva tramite screenshot desktop e mobile del tema scuro.
