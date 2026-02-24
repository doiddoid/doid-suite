/**
 * Contenuti delle guide utente per DOID Suite.
 * Ogni servizio ha le sue guide, organizzate per sezioni con step, screenshot placeholder, tip e warning.
 * I contenuti derivano dalle guide in /docs/guide-utente/
 */

export const guidaContent = {
  suite: {
    id: 'suite',
    label: 'DOID Suite',
    color: 'teal',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    description: 'Gestisci tutti i tuoi servizi digitali da un unico pannello di controllo.',
    cta: null, // Suite non ha CTA perché è la dashboard stessa
    guides: [
      {
        id: 'suite-01',
        title: 'Benvenuto in DOID Suite',
        subtitle: 'Cos\'è, a cosa serve e quali strumenti offre alla tua attività',
        sections: [
          {
            title: 'Cos\'è DOID Suite?',
            content: 'DOID Suite è il tuo **pannello di controllo unico** per gestire tutti gli strumenti digitali della tua attività. Invece di avere tanti account e tante password, fai un solo accesso e da lì gestisci tutto.\n\nPensa a DOID Suite come alla "casa" digitale della tua attività: entri dalla porta principale e da lì raggiungi ogni stanza — le recensioni, il biglietto da visita, il menu digitale e molto altro.',
          },
          {
            title: 'Cosa puoi fare',
            content: 'Dalla tua dashboard puoi:\n\n• **Attivare e gestire i servizi digitali** per la tua attività\n• **Monitorare lo stato** di ogni servizio (attivo, in prova, scaduto)\n• **Controllare la spesa** mensile per i tuoi abbonamenti\n• **Gestire il profilo** della tua attività e i dati di fatturazione\n• **Invitare collaboratori** a gestire l\'attività insieme a te',
          },
          {
            title: 'I servizi disponibili',
            content: '**Smart Review** — Gestisci la reputazione online. Raccogli recensioni positive e intercetta i feedback negativi prima che finiscano online.\n\n**Smart Page** — Il tuo biglietto da visita digitale. Sempre aggiornato, condivisibile con un tap o QR Code.\n\n**Smart Menu** — Il menu digitale per il tuo ristorante. Aggiorna piatti e prezzi in qualsiasi momento.\n\n**Smart Display** — Gestisci schermi e display digitali da remoto.',
          },
          {
            title: 'Come funziona in pratica',
            content: '1. **Crei un account** su suite.doid.it\n2. **Confermi la tua email** cliccando sul link che ricevi\n3. **Accedi alla dashboard** e vedi tutti i servizi disponibili\n4. **Attivi una prova gratuita** di 30 giorni per i servizi che ti interessano\n5. **Se il servizio ti piace**, scegli il piano PRO per continuare',
            tip: 'Ogni servizio offre una prova gratuita di 30 giorni con tutte le funzionalità PRO attive. Non serve inserire dati di pagamento per iniziare.',
          },
          {
            title: 'Quanto costa?',
            content: 'Ogni servizio ha un **piano FREE** (gratuito con funzionalità limitate) e un **piano PRO** con tutto incluso.\n\n| Servizio | PRO Mensile | PRO Annuale |\n|----------|-------------|-------------|\n| Smart Review | €14,90/mese | €149,00/anno (-17%) |\n| Smart Page | €14,90/mese | €149,00/anno (-17%) |\n| Smart Menu | €24,90/mese | €249,00/anno (-17%) |\n| Smart Display | €49,00/mese | €490,00/anno (-17%) |',
            warning: 'I prezzi si riferiscono a una singola attività. Se attivi più servizi per la stessa attività, hai diritto a sconti automatici (fino al 30%).',
          },
        ],
        nextGuide: 'suite-02',
      },
      {
        id: 'suite-02',
        title: 'Creare il tuo Account',
        subtitle: 'Registrazione, conferma email e primo accesso in meno di 5 minuti',
        sections: [
          {
            title: 'Cosa ti serve',
            content: '• Un **indirizzo email** valido (sarà il tuo nome utente)\n• Una **connessione internet** (da computer o smartphone)',
          },
          {
            title: 'Passo 1: Apri la pagina di registrazione',
            content: 'Vai su **suite.doid.it** dal tuo browser (Chrome, Safari, Firefox — qualsiasi va bene).\n\nClicca su **"Non hai un account? Registrati"** nella pagina di accesso.',
            screenshot: { alt: 'Pagina di login', desc: 'Pagina di login con il link "Registrati" evidenziato' },
          },
          {
            title: 'Passo 2: Compila il modulo',
            content: 'Inserisci i tuoi dati:\n\n• **Nome completo** — es. "Mario Rossi"\n• **Email** — l\'indirizzo che userai per accedere\n• **Nome della tua attività** — facoltativo ma consigliato\n• **Password** — almeno 8 caratteri\n• **Conferma Password** — riscrivi la stessa password',
            screenshot: { alt: 'Modulo di registrazione', desc: 'Modulo di registrazione compilato con dati di esempio' },
            tip: 'Usa l\'email che controlli più spesso. Riceverai il link di conferma e tutte le comunicazioni importanti a questo indirizzo.',
          },
          {
            title: 'Passo 3: Accetta e registrati',
            content: 'Spunta **"Accetto i Termini di Servizio e la Privacy Policy"** e clicca su **"Registrati"**.\n\nSe tutto è corretto, vedrai: **"Registrazione completata! Controlla la tua email per confermare l\'account."**',
            screenshot: { alt: 'Conferma registrazione', desc: 'Schermata di conferma registrazione avvenuta' },
            warning: 'Se l\'email è già associata a un account, prova con "Accedi" oppure usa "Password dimenticata?".',
          },
          {
            title: 'Passo 4: Conferma la tua email',
            content: 'Apri la tua casella di posta e cerca l\'email da DOID con oggetto "Conferma il tuo account".\n\nClicca sul **link di conferma** contenuto nell\'email.',
            screenshot: { alt: 'Email di conferma', desc: 'Email di conferma con il link evidenziato' },
            warning: 'Il link è valido per 24 ore. Se non trovi l\'email, controlla la cartella Spam.',
          },
          {
            title: 'Passo 5: Accedi al tuo account',
            content: 'Dopo aver cliccato sul link, vai alla pagina di accesso. Inserisci **email** e **password** e clicca su **"Accedi"**.',
            screenshot: { alt: 'Pagina di login', desc: 'Pagina di login con i campi compilati' },
            tip: 'Spunta "Ricordami" se usi il tuo computer personale.',
          },
          {
            title: 'Passo 6: Verifica la tua attività',
            content: 'Al primo accesso, se hai indicato il nome dell\'attività durante la registrazione, il sistema la crea automaticamente.\n\nSe non l\'hai fatto, clicca su **"Crea Attività"** e inserisci il nome.',
            screenshot: { alt: 'Dashboard primo accesso', desc: 'Dashboard con il messaggio di creazione attività' },
          },
        ],
        faq: [
          { q: 'Non ho ricevuto l\'email di conferma. Cosa faccio?', a: 'Controlla la cartella Spam. Se non la trovi, torna sulla pagina di accesso e richiedi un nuovo invio.' },
          { q: 'Posso registrarmi dal telefono?', a: 'Sì, DOID Suite funziona da qualsiasi browser, sia da computer che da smartphone o tablet.' },
          { q: 'Devo scaricare un\'app?', a: 'No, DOID Suite funziona interamente dal browser. Non serve installare nulla.' },
        ],
        nextGuide: 'suite-03',
      },
      {
        id: 'suite-03',
        title: 'La tua Dashboard',
        subtitle: 'Orientarsi nella dashboard: menu, statistiche e sezioni',
        sections: [
          {
            title: 'Le tre aree principali',
            content: 'La pagina è divisa in tre aree:\n\n1. **Menu laterale** (a sinistra) — per navigare tra le sezioni\n2. **Barra superiore** (in alto) — per cercare, notifiche e profilo\n3. **Area centrale** — statistiche e servizi',
            screenshot: { alt: 'Vista dashboard', desc: 'Vista completa della dashboard con le aree numerate' },
          },
          {
            title: 'Il menu laterale',
            content: '**Sezione "Principale":**\n• **Dashboard** — panoramica generale\n• **I Miei Servizi** — lista dettagliata dei servizi attivi\n• **Attività** — gestisci le tue attività\n\n**Sezione "I tuoi servizi":**\nOgni servizio attivo appare nel menu con un\'etichetta **TRIAL** o **PRO**. Cliccandoci accedi direttamente al pannello di gestione.\n\n**Sezione "Impostazioni":**\n• **Impostazioni** — profilo, dati aziendali, team, fatturazione\n• **Guida** — questa sezione!',
            screenshot: { alt: 'Menu laterale', desc: 'Menu laterale con servizi attivi e badge di stato' },
            tip: 'Puoi ridurre il menu laterale cliccando sulla freccetta. Così avrai più spazio per il contenuto.',
          },
          {
            title: 'Le statistiche in alto',
            content: 'I 4 riquadri mostrano:\n\n| Riquadro | Cosa mostra |\n|----------|-------------|\n| **Servizi Attivi** | Quanti servizi hai attivi |\n| **In Trial** | Quanti sono in prova gratuita |\n| **Spesa Mensile** | Quanto spendi al mese |\n| **Prossima Scadenza** | La data di scadenza più vicina |',
            screenshot: { alt: 'Statistiche dashboard', desc: 'I 4 riquadri statistiche nella dashboard' },
          },
          {
            title: 'I tuoi servizi e "Scopri gli altri"',
            content: 'Sotto le statistiche trovi le **schede dei servizi** attivi, ciascuna con nome, stato, data di rinnovo e pulsante d\'azione.\n\nPiù in basso, la sezione **"Scopri gli altri servizi"** mostra quelli non ancora attivati, con il pulsante **"Attiva Trial"**.',
            screenshot: { alt: 'Schede servizi', desc: 'Scheda di un servizio con tutti gli elementi evidenziati' },
            tip: 'Le prove gratuite includono tutte le funzionalità PRO. Provale senza impegno!',
          },
        ],
        faq: [
          { q: 'Posso accedere dal telefono?', a: 'Sì, la dashboard è completamente utilizzabile da smartphone e tablet.' },
          { q: 'Posso gestire più attività?', a: 'Sì! Dalla sezione "Attività" puoi creare e gestire più attività, ognuna con i propri servizi.' },
        ],
        nextGuide: 'suite-04',
      },
      {
        id: 'suite-04',
        title: 'Attivare un Servizio',
        subtitle: 'Prova gratuita, passaggio FREE → PRO e sconti multi-servizio',
        sections: [
          {
            title: 'Passo 1: Vai alla dashboard',
            content: 'Accedi a **suite.doid.it** e controlla di essere nell\'attività giusta (il nome è visibile nel menu laterale, sotto il logo).',
            screenshot: { alt: 'Selettore attività', desc: 'Dashboard con il selettore attività evidenziato' },
          },
          {
            title: 'Passo 2: Trova il servizio',
            content: 'Scorri fino a **"Scopri gli altri servizi"** per trovare quelli non ancora attivati.',
            screenshot: { alt: 'Servizi disponibili', desc: 'Sezione "Scopri gli altri servizi" con le schede' },
          },
          {
            title: 'Passo 3: Clicca "Attiva Trial"',
            content: 'Sul servizio che ti interessa, clicca **"Attiva Trial"**. Non serve inserire dati di pagamento. La prova parte subito.',
            screenshot: { alt: 'Pulsante Attiva Trial', desc: 'Pulsante "Attiva Trial" evidenziato sulla scheda' },
          },
          {
            title: 'La prova gratuita: 30 giorni',
            content: 'La prova dura **30 giorni** con tutte le funzionalità PRO.\n\n• **Meno di 7 giorni**: avviso giallo + pulsante "Scegli Piano"\n• **Ultimo giorno**: avviso rosso\n• **Scadenza**: servizio in stato "SCADUTO" — i tuoi dati vengono conservati',
            tip: 'Durante la prova hai accesso a tutte le funzionalità PRO, senza limitazioni. Approfittane per testare tutto!',
            warning: 'Se non attivi un piano PRO entro 30 giorni, non potrai più accedere al pannello fino a quando non attivi un piano.',
          },
          {
            title: 'Passare al piano PRO',
            content: 'Dalla dashboard, clicca **"Scegli Piano"** o **"Attiva Piano"** sulla scheda del servizio.\n\nScegli tra **Mensile** o **Annuale** (risparmi il 17%).\n\nClicca **"Attiva"** e completa il pagamento con carta di credito/debito.',
            screenshot: { alt: 'Selezione piano', desc: 'Selezione piano con toggle Mensile/Annuale' },
            tip: 'Il piano annuale ti fa risparmiare circa 2 mesi di abbonamento.',
          },
          {
            title: 'Sconti multi-servizio',
            content: 'Se attivi più servizi PRO per la stessa attività:\n\n| Servizi | Sconto |\n|---------|---------|\n| 1° servizio | Prezzo pieno |\n| 2° servizio | **-20%** |\n| 3° servizio | **-30%** |\n| 4+ | Contattaci |',
            tip: 'Se gestisci 6 o più attività, potresti avere diritto a sconti volume aggiuntivi.',
          },
        ],
        faq: [
          { q: 'Posso attivare la prova più di una volta?', a: 'No, una sola prova per servizio, per attività.' },
          { q: 'Devo inserire la carta per la prova?', a: 'No, la prova si attiva senza dati di pagamento.' },
          { q: 'Cosa succede ai miei dati quando scade?', a: 'I dati vengono conservati. Se attivi il PRO, ritroverai tutto.' },
        ],
        nextGuide: 'suite-05',
      },
      {
        id: 'suite-05',
        title: 'Gestire il tuo Abbonamento',
        subtitle: 'Piani attivi, rinnovi, fatturazione e cancellazione',
        sections: [
          {
            title: 'Dove controllare i tuoi piani',
            content: 'Hai tre modi:\n\n1. **Dashboard** — statistiche rapide in alto\n2. **I Miei Servizi** — vista dettagliata dal menu laterale\n3. **Impostazioni > Fatturazione** — storico pagamenti e dati fiscali',
            screenshot: { alt: 'Statistiche abbonamenti', desc: 'Statistiche dashboard e schede servizi con stato' },
          },
          {
            title: 'Rinnovi automatici',
            content: 'Gli abbonamenti PRO si **rinnovano automaticamente** alla scadenza. La data di rinnovo è sempre visibile nella scheda del servizio e in Impostazioni > Fatturazione.',
            warning: 'Se vuoi interrompere, devi cancellare l\'abbonamento prima della data di rinnovo.',
          },
          {
            title: 'Storico pagamenti',
            content: 'Vai in **Impostazioni > Fatturazione > Storico Pagamenti** per vedere la tabella con data, descrizione, importo e stato di ogni pagamento.',
            screenshot: { alt: 'Storico pagamenti', desc: 'Tabella storico pagamenti con esempi' },
          },
          {
            title: 'Cancellare un servizio',
            content: '1. Dalla dashboard, sulla scheda del servizio clicca **"Gestisci"**\n2. Conferma la cancellazione\n3. Il servizio resta attivo fino alla fine del periodo già pagato\n\nSe cambi idea, puoi riattivarlo in qualsiasi momento.',
            screenshot: { alt: 'Cancellazione servizio', desc: 'Servizio cancellato con pulsante "Riattiva"' },
          },
        ],
        faq: [
          { q: 'Perdo i miei dati se cancello?', a: 'I dati vengono conservati per un periodo ragionevole. Ti consigliamo di non aspettare troppo a riattivare.' },
          { q: 'Posso passare da annuale a mensile?', a: 'Contatta il supporto. Il cambio verrà applicato al prossimo rinnovo.' },
        ],
        nextGuide: 'suite-06',
      },
      {
        id: 'suite-06',
        title: 'Gestire il tuo Account',
        subtitle: 'Dati personali, password, attività, team e supporto',
        sections: [
          {
            title: 'Modificare nome e password',
            content: 'Vai in **Impostazioni > Profilo**.\n\n• Per il nome: modifica il campo e clicca "Salva modifiche"\n• Per la password: inserisci la nuova password (min. 8 caratteri + 1 numero), confermala e clicca "Aggiorna password"',
            screenshot: { alt: 'Profilo utente', desc: 'Scheda Profilo con campo Nome e sezione password' },
            tip: 'Se hai dimenticato la password, puoi usare "Invia email di reset" dalla scheda Profilo.',
          },
          {
            title: 'Gestire le attività',
            content: 'Un\'attività rappresenta il tuo negozio, ristorante o studio. Puoi gestirne più d\'una dallo stesso account.\n\n• **Vedere**: clicca "Attività" nel menu laterale\n• **Creare**: clicca "Nuova Attività"\n• **Cambiare**: usa il selettore sotto il logo\n• **Modificare**: clicca l\'ingranaggio accanto all\'attività',
            screenshot: { alt: 'Lista attività', desc: 'Pagina Attività con la lista e pulsanti di azione' },
            tip: 'Ogni attività ha i propri servizi e abbonamenti indipendenti.',
          },
          {
            title: 'Invitare collaboratori',
            content: 'Vai in **Impostazioni > Team**.\n\n1. Inserisci l\'email del collaboratore\n2. Seleziona il ruolo: **Utente** (accesso base), **Manager** (gestione servizi) o **Admin** (accesso quasi completo)\n3. Clicca "Aggiungi"',
            screenshot: { alt: 'Gestione team', desc: 'Scheda Team con modulo di aggiunta e lista membri' },
          },
          {
            title: 'Dati organizzazione e fatturazione',
            content: 'Vai in **Impostazioni > Organizzazione** per compilare:\n\n• Ragione sociale, Codice Fiscale, Partita IVA\n• Indirizzo completo\n• Codice SDI o PEC per la fatturazione elettronica\n• Email e telefono di contatto',
            screenshot: { alt: 'Dati organizzazione', desc: 'Scheda Organizzazione con tutte le sezioni' },
            tip: 'Compila i dati di fatturazione subito per risparmiare tempo quando attivi un piano PRO.',
          },
          {
            title: 'Contatti supporto',
            content: '• **Email**: info@doid.biz\n• **Telefono**: +39 348 089 0477\n• **WhatsApp**: dalla pagina "I Miei Servizi"',
          },
        ],
        faq: [
          { q: 'Posso cambiare l\'email del mio account?', a: 'Al momento no. Contatta il supporto per assistenza.' },
          { q: 'Quante attività posso creare?', a: 'Non c\'è un limite fisso. Ogni attività ha abbonamenti indipendenti.' },
        ],
        nextGuide: null,
      },
    ],
  },

  review: {
    id: 'review',
    label: 'Smart Review',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    description: 'Gestisci la reputazione online: raccogli recensioni positive e intercetta quelle negative.',
    cta: {
      headline: 'Non hai ancora provato Smart Review?',
      problem: 'Le recensioni negative finiscono online prima che tu possa fare qualcosa.',
      solution: 'Con Smart Review le intercetti e le gestisci in privato, trasformando un problema in un\'opportunità.',
      action: 'Attiva la prova gratuita — 30 giorni gratis',
      note: 'Nessun dato di pagamento richiesto.',
    },
    guides: [
      {
        id: 'review-01',
        title: 'Cos\'è Smart Review e Come Funziona',
        subtitle: 'Il flusso completo: dal QR Code alla recensione, FREE vs PRO e il Filtro',
        sections: [
          {
            title: 'A cosa serve',
            content: 'Smart Review ti aiuta a **gestire la reputazione online** della tua attività:\n\n• **Raccogli più recensioni positive** su Google, TripAdvisor, Facebook e altre\n• **Intercetti i feedback negativi** prima che vengano pubblicati (piano PRO)\n• **Migliori il servizio** grazie ai feedback privati',
          },
          {
            title: 'Come funziona il flusso',
            content: '**1. Il cliente scansiona il QR Code o tocca lo stand NFC**\nVede una pagina con "Com\'è stata la tua esperienza?" e 5 stelle.\n\n**2. Se dà 4 o 5 stelle** → viene reindirizzato alle piattaforme (Google, TripAdvisor...) per lasciare una recensione pubblica positiva.\n\n**3. Se dà da 1 a 3 stelle (con Filtro PRO)** → vede un modulo privato per lasciare il feedback direttamente a te. Niente finisce online.',
            screenshot: { alt: 'Flusso recensioni', desc: 'Schema del flusso con le due direzioni — positivo vs negativo' },
          },
          {
            title: 'FREE vs PRO',
            content: '| Funzionalità | FREE | PRO |\n|-------------|------|-----|\n| Pagina con QR Code | Si | Si |\n| Piattaforme | Max 2 | Tutte (9) |\n| Logo personalizzato | No | Si |\n| **Filtro Recensioni** | No | **Si** |\n| Carosello Google | No | Si |\n| Statistiche avanzate | No | Si |',
            tip: 'Con il piano FREE puoi comunque raccogliere recensioni positive su 2 piattaforme. Il PRO aggiunge il filtro, lo strumento più potente.',
          },
          {
            title: 'Il Filtro Recensioni',
            content: 'Il cuore di Smart Review PRO:\n\n1. Il cliente insoddisfatto dà 1-3 stelle\n2. Invece di finire su Google, vede un modulo privato\n3. Lascia il feedback direttamente a te\n4. Tu ricevi una notifica e puoi contattarlo\n\n**Non censura** — il cliente può sempre andare su Google autonomamente. Il filtro semplicemente non gli facilita il percorso.',
          },
        ],
        nextGuide: 'review-02',
      },
      {
        id: 'review-02',
        title: 'Primo Accesso e Configurazione',
        subtitle: 'Accesso da Suite, pannello di gestione e prima Smart Review',
        sections: [
          {
            title: 'Accedere da DOID Suite',
            content: 'Accedi a **suite.doid.it** e clicca su **"Smart Review"** nel menu laterale o sulla scheda del servizio.\n\nVerrai reindirizzato automaticamente a **review.doid.it** — senza un altro login (SSO).',
            screenshot: { alt: 'Accesso Smart Review', desc: 'Menu laterale con Smart Review e freccia verso il pannello' },
          },
          {
            title: 'Creare la tua Smart Review',
            content: '1. Clicca **"Crea la tua Smart Review"**\n2. Inserisci il **nome dell\'attività**\n3. Carica il **logo** (JPG o PNG, meglio quadrato su sfondo trasparente)\n4. Aggiungi almeno una **piattaforma** (incolla il link a Google Reviews, TripAdvisor...)\n5. Clicca **"Salva Modifiche"**\n6. Clicca **"Anteprima"** per vedere il risultato',
            screenshot: { alt: 'Creazione Smart Review', desc: 'Pulsante "Crea la tua Smart Review" e modulo' },
            tip: 'Le visite in modalità anteprima non vengono conteggiate nelle statistiche.',
          },
          {
            title: 'Personalizzare i messaggi (PRO)',
            content: 'Nella sezione "Personalizza i Messaggi" puoi modificare:\n\n• **Testo Landing Page** — es. "Com\'è stata la tua esperienza?"\n• **Titolo recensione** — es. "La tua opinione è importante!"\n• **Testo feedback negativo** — il messaggio per il modulo privato\n• **Ringraziamento** — la pagina finale',
            tip: 'Personalizza i messaggi con il tono della tua attività: amichevole per un ristorante, formale per uno studio.',
          },
        ],
        faq: [
          { q: 'Devo fare un altro login?', a: 'No, l\'accesso è automatico tramite SSO da DOID Suite.' },
          { q: 'Posso creare più pagine recensioni?', a: 'Con FREE/PRO puoi creare 1 pagina per attività. Per più pagine, contattaci per il piano AGENCY.' },
        ],
        nextGuide: 'review-03',
      },
      {
        id: 'review-03',
        title: 'Aggiungere le Piattaforme',
        subtitle: 'Google, TripAdvisor, Facebook e altre — come trovarle e configurarle',
        sections: [
          {
            title: 'Come aggiungere una piattaforma',
            content: '1. Apri le impostazioni della tua Smart Review\n2. Scorri alla sezione **"Piattaforme di Recensione"**\n3. Trova il **link diretto** alla tua pagina sulla piattaforma\n4. Incolla il link nel campo corrispondente\n5. Ripeti per le altre piattaforme\n6. Clicca **"Salva Modifiche"**',
            screenshot: { alt: 'Piattaforme', desc: 'Sezione "Piattaforme di Recensione" con i campi URL' },
          },
          {
            title: 'Come trovare il link Google',
            content: '**Metodo 1:** Cerca la tua attività su Google Maps → clicca "Scrivi una recensione" → copia il link.\n\n**Metodo 2:** Da Google Business Profile (business.google.com) → "Chiedi recensioni" → copia il link generato.',
          },
          {
            title: 'Piattaforme supportate',
            content: '| Piattaforma | Ideale per |\n|-------------|------------|\n| **Google Reviews** | Qualsiasi attività — la più importante |\n| **TripAdvisor** | Ristoranti, hotel, attrazioni |\n| **Facebook** | Attività con community attiva |\n| **Booking.com** | Hotel, B&B |\n| **Airbnb** | Case vacanze |\n| **Trustpilot** | E-commerce |\n| **Yelp** | Ristoranti, negozi |\n| **App Store / Google Play** | App |',
            tip: 'Inizia sempre con Google Reviews — è la piattaforma più importante per qualsiasi attività.',
            warning: 'Assicurati che i link portino alla pagina dove il cliente può scrivere la recensione, non alla pagina generica.',
          },
        ],
        nextGuide: 'review-04',
      },
      {
        id: 'review-04',
        title: 'Il Filtro Recensioni (PRO)',
        subtitle: 'Come funziona, come attivarlo e come gestire i feedback negativi',
        sections: [
          {
            title: 'Scenario A: 4 o 5 stelle',
            content: 'Il cliente viene reindirizzato alle **piattaforme pubbliche** (Google, TripAdvisor...) dove lascia una recensione positiva visibile a tutti.',
            screenshot: { alt: 'Piattaforme positive', desc: 'Pagina con i pulsanti delle piattaforme dopo 4-5 stelle' },
          },
          {
            title: 'Scenario B: 1, 2 o 3 stelle',
            content: 'Il cliente vede un **modulo di feedback privato** con:\n• Nome, Email, Telefono\n• Campo testo per descrivere l\'esperienza (max 2000 caratteri)\n• Pulsante "Invia"\n\nIl feedback arriva solo a te. Non viene pubblicato da nessuna parte.',
            screenshot: { alt: 'Modulo privato', desc: 'Modulo di feedback privato con i campi compilati' },
          },
          {
            title: 'Come attivare il filtro',
            content: '1. Apri le impostazioni della tua Smart Review\n2. Trova la sezione **"Filtro Recensioni"**\n3. Spunta **"Attiva il filtro automatico"**\n4. Opzionale: configura il **Google Maps Place ID** per il carosello recensioni\n5. Clicca **"Salva Modifiche"**',
            screenshot: { alt: 'Attivazione filtro', desc: 'Sezione Filtro Recensioni nel pannello' },
            tip: 'Il carosello Google positivo fa "priming": i clienti che vedono recensioni positive sono più propensi a lasciarne una.',
          },
          {
            title: 'Come gestire i feedback negativi',
            content: '**Visualizzare**: apri la tua Smart Review per vedere la lista dei feedback con nome, email, telefono, voto, testo e data.\n\n**Rispondere**: contatta il cliente entro 24 ore via email, telefono o WhatsApp.\n\n**Esempio messaggio**: "Ciao [Nome], grazie per il feedback. Mi dispiace che l\'esperienza non sia stata all\'altezza. Vorrei capire meglio cosa è successo e trovare un modo per rimediare."',
            screenshot: { alt: 'Lista feedback', desc: 'Lista dei feedback negativi intercettati' },
            tip: 'Rispondere entro 24 ore aumenta significativamente le probabilità di risolvere positivamente.',
          },
        ],
        faq: [
          { q: 'Il filtro blocca le recensioni su Google?', a: 'No. Non indirizza il cliente verso le piattaforme quando il voto è basso, ma il cliente può sempre andarci autonomamente.' },
          { q: 'Il cliente sa che è stato filtrato?', a: 'No. L\'esperienza è naturale: modulo feedback + ringraziamento.' },
        ],
        nextGuide: 'review-05',
      },
      {
        id: 'review-05',
        title: 'La Pagina Recensioni (Lato Cliente)',
        subtitle: 'Cosa vedono i clienti, condivisione link e QR Code',
        sections: [
          {
            title: 'Cosa vede il cliente',
            content: '**Pagina 1 — Le stelle**: logo, messaggio, 5 stelle toccabili, eventuale carosello Google.\n\n**Pagina 2a — Piattaforme** (4-5 stelle): pulsanti per scegliere dove lasciare la recensione.\n\n**Pagina 2b — Modulo privato** (1-3 stelle, PRO): campi nome, email, telefono, testo.\n\n**Pagina 3 — Ringraziamento**: messaggio personalizzabile.',
            screenshot: { alt: 'Pagina recensioni mobile', desc: 'Pagina di selezione stelle su smartphone' },
          },
          {
            title: 'Condividere il link',
            content: 'Nella sezione **"Codici di Condivisione"** trovi il link diretto e il pulsante "Copia".\n\nDove condividerlo: WhatsApp, email, Instagram/Facebook bio, sito web, SMS, biglietti da visita.',
            screenshot: { alt: 'Link condivisione', desc: 'Sezione con il link e il pulsante copia' },
            tip: 'Il momento migliore per chiedere una recensione è subito dopo un\'esperienza positiva.',
          },
          {
            title: 'Usare il QR Code',
            content: 'Scarica il QR Code (PNG) dalla sezione "Codici di Condivisione". Con il PRO include il logo al centro.\n\nDove stamparlo: bancone, tavoli, vetrina, scontrini, menu, biglietti da visita, packaging.',
            screenshot: { alt: 'QR Code', desc: 'QR Code con il pulsante di download' },
            tip: 'Aggiungi un messaggio accanto al QR: "Com\'è andata? Scansiona e dicci la tua!" — aumenta le probabilità di utilizzo.',
          },
        ],
        nextGuide: 'review-06',
      },
      {
        id: 'review-06',
        title: 'Stand e Prodotti NFC',
        subtitle: 'Posizionamento, come funziona NFC e QR, suggerimenti',
        sections: [
          {
            title: 'Dove posizionare lo stand',
            content: '**Ristoranti**: bancone/cassa (top), tavoli, all\'uscita\n**Negozi**: bancone/reception (top), sala d\'attesa\n**Hotel**: reception al check-out (top), camera, sala colazione\n\nLa regola d\'oro: metti lo stand **dove il cliente ha il telefono in mano** e **dopo un\'esperienza positiva**.',
          },
          {
            title: 'NFC: come funziona',
            content: '1. Il cliente avvicina la parte alta del telefono allo stand (2-3 cm)\n2. Il telefono vibra e mostra una notifica\n3. Tocca la notifica → si apre la pagina recensioni\n\n**Compatibilità**: iPhone 7+ (iOS 13+), Android 5.0+ con NFC attivo.',
            screenshot: { alt: 'NFC in azione', desc: 'Sequenza telefono che tocca stand → notifica → pagina' },
          },
          {
            title: 'Massimizzare l\'uso',
            content: '1. **Parla dello stand** — "Se ti è piaciuto, avvicina il telefono per una recensione!"\n2. **Forma il tuo staff** — devono sapere cos\'è, come funziona e quando suggerirlo\n3. **Posizione visibile** — ben illuminato, a portata di mano\n4. **Sfrutta i momenti giusti** — dopo un complimento, al pagamento',
            warning: 'Non forzare mai il cliente. Una richiesta gentile e naturale è sempre la strategia migliore.',
          },
        ],
        faq: [
          { q: 'Lo stand ha bisogno di batteria?', a: 'No, il chip NFC è passivo. Funziona sempre.' },
          { q: 'Posso usare Smart Review senza stand?', a: 'Sì, puoi condividere il link diretto o il QR Code digitale.' },
        ],
        nextGuide: 'review-07',
      },
      {
        id: 'review-07',
        title: 'Monitorare i Risultati',
        subtitle: 'Statistiche, feedback negativi e valutare l\'efficacia',
        sections: [
          {
            title: 'Le statistiche rapide',
            content: 'Nella scheda della tua Smart Review vedi: piattaforme configurate, visite totali, media voto e negative intercettate.',
            screenshot: { alt: 'Statistiche rapide', desc: 'Scheda Smart Review con le statistiche rapide' },
          },
          {
            title: 'Come interpretare i numeri',
            content: '**Rapporto visite/valutazioni**: >60% = ottimo, 30-60% = normale, <30% = migliorabile.\n\n**Media voto**: 4.5-5.0 eccellente, 4.0-4.4 buono, sotto 3.5 critico.\n\n**Negative intercettate**: se ce ne sono, il filtro funziona! Ogni feedback = un\'opportunità.',
            tip: 'Un tasso di interazione basso potrebbe indicare che lo stand è poco visibile.',
            warning: 'Non ossessionarti con i numeri giornalieri. Valuta su base settimanale o mensile.',
          },
        ],
        nextGuide: 'review-08',
      },
      {
        id: 'review-08',
        title: 'Domande Frequenti',
        subtitle: 'FAQ su filtro, piattaforme, prova gratuita e uso quotidiano',
        sections: [],
        faq: [
          { q: 'Il filtro blocca le recensioni negative ovunque?', a: 'No. Il filtro non blocca nulla sulle piattaforme esterne. Devia il percorso del cliente insoddisfatto verso un modulo privato.' },
          { q: 'Il cliente sa che è stato filtrato?', a: 'No. L\'esperienza è trasparente.' },
          { q: 'Cosa succede alla fine della prova gratuita?', a: 'Il servizio passa a "Scaduto". I dati vengono conservati. Puoi attivare il PRO o passare al FREE.' },
          { q: 'Durante la prova ho tutte le funzionalità PRO?', a: 'Sì, tutte.' },
          { q: 'Devo fare qualcosa ogni giorno?', a: 'No, Smart Review funziona in automatico. Controlla i feedback negativi una volta alla settimana.' },
          { q: 'I clienti devono scaricare un\'app?', a: 'No. Tutto funziona dal browser del telefono.' },
          { q: 'Il QR Code non funziona. Cosa faccio?', a: 'Verifica che sia stampato nitidamente, ben illuminato, e usa la fotocamera predefinita del telefono.' },
          { q: 'L\'NFC non risponde. Cosa faccio?', a: 'Verifica che l\'NFC sia attivo sul telefono e che stai avvicinando la parte superiore a 2-3 cm dallo stand.' },
        ],
        nextGuide: null,
      },
    ],
  },

  page: {
    id: 'page',
    label: 'Smart Page',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    description: 'Il tuo biglietto da visita digitale: sempre aggiornato, condivisibile con un tap.',
    cta: {
      headline: 'Non hai ancora provato Smart Page?',
      problem: 'I biglietti cartacei si perdono, si rovinano e diventano obsoleti appena cambi un numero.',
      solution: 'Con Smart Page hai un biglietto digitale sempre aggiornato, condivisibile con un tocco. Chi lo riceve salva i tuoi contatti in rubrica con un tap.',
      action: 'Attiva la prova gratuita — 30 giorni gratis',
      note: 'Nessun dato di pagamento richiesto.',
    },
    guides: [
      {
        id: 'page-01',
        title: 'Cos\'è Smart Page e Come Funziona',
        subtitle: 'Biglietto digitale, flusso NFC/QR → contatto salvato, FREE vs PRO',
        sections: [
          {
            title: 'A cosa serve',
            content: 'Smart Page è il tuo **biglietto da visita digitale**:\n\n• **Condividi i contatti** in modo rapido e professionale\n• **Aggiorna le informazioni** senza ristampare nulla\n• **Far salvare il contatto** direttamente in rubrica\n• **Collega i social media** in un unico posto\n• **Personalizza il design** con i tuoi colori',
          },
          {
            title: 'Come funziona',
            content: '1. **Condividi** — via NFC, QR Code o link diretto\n2. **La persona vede** — foto, nome, titolo, bio, contatti, social, pulsanti\n3. **Salva in rubrica** — con un tocco scarica la vCard nella rubrica del telefono',
          },
          {
            title: 'FREE vs PRO',
            content: '| Funzionalità | FREE | PRO |\n|-------------|------|-----|\n| Biglietti | 1 | Illimitati |\n| Social media | Max 3 | 25+ piattaforme |\n| Titolo professionale | No | Si |\n| Contatti aziendali | No | Si |\n| Link personalizzati | No | Si (2) |\n| Font personalizzati | No | Si |\n| Sfondo personalizzato | No | Si |',
            tip: 'Con il FREE hai già un biglietto base completo. Il PRO è ideale per un biglietto completo con tutti i social e personalizzazione avanzata.',
          },
        ],
        nextGuide: 'page-02',
      },
      {
        id: 'page-02',
        title: 'Primo Accesso e Configurazione',
        subtitle: 'Accesso da Suite e creazione del primo biglietto',
        sections: [
          {
            title: 'Accedere da DOID Suite',
            content: 'Accedi a **suite.doid.it** e clicca su **Smart Page** nel menu laterale o dalla scheda servizio. Verrai reindirizzato a **page.doid.it** automaticamente.',
            screenshot: { alt: 'Accesso Smart Page', desc: 'Accesso a Smart Page dalla dashboard Suite' },
          },
          {
            title: 'Creare il primo biglietto',
            content: '1. Clicca per **creare una nuova Smart Page**\n2. Inserisci **nome** e **cognome**\n3. Aggiungi una **bio breve** (max 160 caratteri)\n4. Inserisci **email** e **telefono**\n5. Aggiungi i **social** (Facebook, Instagram, LinkedIn — max 3 nel FREE)\n6. Scegli i **colori** primario e secondario\n7. Clicca **"Salva"** e poi **"Anteprima"**',
            screenshot: { alt: 'Anteprima biglietto', desc: 'Anteprima del biglietto su smartphone' },
          },
        ],
        faq: [
          { q: 'Devo fare un altro login?', a: 'No, accesso automatico via SSO.' },
          { q: 'Posso modificare dopo?', a: 'Sì, le modifiche sono immediate.' },
        ],
        nextGuide: 'page-03',
      },
      {
        id: 'page-03',
        title: 'Personalizzare il Biglietto',
        subtitle: 'Contatti, social, foto, colori, font e link personalizzati',
        sections: [
          {
            title: 'Contatti e profilo business (PRO)',
            content: '**Contatto principale** (FREE): email e telefono.\n\n**Profilo Business** (PRO): titolo professionale, telefono e email azienda, sito web, indirizzo.\n\n**Contatti aggiuntivi** (PRO): sito personale, WhatsApp, Telegram, Messenger, note.',
            tip: 'Non inserire tutto — scegli solo i contatti che vuoi effettivamente condividere.',
          },
          {
            title: 'Social media e link',
            content: '**FREE**: Facebook, Instagram, LinkedIn (max 3).\n**PRO**: 25+ piattaforme incluso YouTube, TikTok, Spotify, Pinterest, Behance, Dribbble e molte altre.\n\n**Link personalizzati** (PRO): fino a 2 link con titolo a scelta (es. "Portfolio", "Shop online").\n\n**Pulsante Recensioni** (PRO): collega la tua Smart Review!',
            tip: 'Se usi anche Smart Review, inserisci il link qui per raccogliere recensioni dal biglietto!',
          },
          {
            title: 'Design: immagini e colori',
            content: '**Foto profilo**: quadrata 600x600px, JPG o PNG.\n**Copertina**: 1920x300px.\n\n**Colori base** (FREE): primario e secondario.\n**Avanzati** (PRO): sfondo, immagine sfondo, font titoli/testo, colori titoli/testo.',
            screenshot: { alt: 'Personalizzazione tema', desc: 'Sezione immagini con foto profilo e copertina' },
            warning: 'Scegli combinazioni di colori con buon contrasto tra testo e sfondo.',
          },
        ],
        nextGuide: 'page-04',
      },
      {
        id: 'page-04',
        title: 'Condividere il Biglietto',
        subtitle: 'Link diretto, QR Code, NFC e salvataggio in rubrica',
        sections: [
          {
            title: 'Link diretto',
            content: 'Copia il link dalla pagina di gestione del biglietto.\n\nDove condividerlo: WhatsApp, email (anche nella firma!), Instagram bio, Facebook, LinkedIn, SMS, sito web.',
            screenshot: { alt: 'Link pubblico', desc: 'Link pubblico con pulsante copia' },
            tip: 'Aggiungi il link nella firma email — ogni email diventa un\'opportunità per condividere il tuo biglietto.',
          },
          {
            title: 'QR Code',
            content: 'Scarica il QR Code in formato PNG. Dove usarlo: biglietto cartaceo (retro), presentazioni (ultima slide), brochure, stand fieristici, vetrina.',
          },
          {
            title: 'Card NFC',
            content: 'Con una card NFC programmata con il tuo link:\n\n1. Tieni la card in mano\n2. L\'altra persona avvicina il telefono (2-3 cm)\n3. Si apre il biglietto nel browser\n\nVantaggi: professionale, veloce (2 secondi), ecologica, sempre aggiornata.',
          },
          {
            title: 'Come funziona la vCard',
            content: 'Chi visita il biglietto può scaricare i tuoi dati come **vCard** (.vcf). Con un tocco, nome, telefono, email e tutti i dati finiscono nella rubrica del telefono.\n\nFormato universale supportato da tutti gli smartphone e programmi di posta.',
            tip: 'Più informazioni inserisci, più completa sarà la vCard scaricata.',
          },
        ],
        nextGuide: 'page-05',
      },
      {
        id: 'page-05',
        title: 'Gestire Più Biglietti (Agenzie)',
        subtitle: 'Multi-profilo, gestione centralizzata e modalità Redirect',
        sections: [
          {
            title: 'Creare biglietti per più persone',
            content: '1. Crea un nuovo biglietto per ogni persona/attività\n2. Personalizza design, colori e contenuti singolarmente\n3. Ogni biglietto ha il suo link e QR Code univoco\n\nDal pannello vedi tutti i biglietti in una griglia.',
            tip: 'Il piano AGENCY è pensato per agenzie con gestione multi-cliente e fatturazione centralizzata.',
          },
          {
            title: 'Modalità Redirect',
            content: 'Se non serve un biglietto completo ma solo un reindirizzamento:\n\n1. Nella modifica del biglietto, seleziona "Redirect"\n2. Inserisci l\'URL di destinazione\n3. Salva\n\nChiunque apra il link viene portato direttamente all\'URL indicato. Utile per card NFC che devono portare a una pagina esterna.',
          },
        ],
        nextGuide: 'page-06',
      },
      {
        id: 'page-06',
        title: 'Statistiche e Risultati',
        subtitle: 'Monitorare visite e valutare l\'efficacia del biglietto',
        sections: [
          {
            title: 'Indicatori indiretti',
            content: '• Ricevi più chiamate o email? → Il biglietto funziona\n• Richieste di contatto su social? → I link sono efficaci\n• Le persone ti dicono "ho visto il tuo biglietto"? → La condivisione raggiunge le persone giuste',
          },
          {
            title: 'Come migliorare',
            content: '• **Condividi regolarmente** — non una volta sola\n• **Aggiungi il link alla firma email**\n• **Tieni la card NFC sempre con te**\n• **Tieni il biglietto aggiornato** — dati vecchi scoraggiano i contatti',
          },
        ],
        nextGuide: 'page-07',
      },
      {
        id: 'page-07',
        title: 'Domande Frequenti',
        subtitle: 'FAQ su modifiche, aggiornamenti, NFC e costi',
        sections: [],
        faq: [
          { q: 'Posso modificare dopo aver condiviso?', a: 'Sì. Le modifiche sono immediate. Il link resta lo stesso.' },
          { q: 'Il contatto si aggiorna in rubrica?', a: 'No. La vCard è una "fotografia" del momento. Per aggiornare, la persona deve riscaricarla.' },
          { q: 'Funziona senza app?', a: 'Sì, tutto dal browser. Nessuna app necessaria.' },
          { q: 'Devo rigenerare il QR Code se cambio i dati?', a: 'No. Il QR contiene il link, non i dati. Le modifiche si vedono automaticamente.' },
          { q: 'La card NFC funziona con tutti i telefoni?', a: 'iPhone 7+ e Android con NFC attivo. Per gli altri c\'è il QR Code stampato.' },
          { q: 'Quanto costa Smart Page PRO?', a: '€14,90/mese o €149,00/anno (-17%). Prova gratuita 30 giorni con tutto incluso.' },
          { q: 'Cosa succede se torno al FREE?', a: 'Le funzionalità PRO vengono limitate ma i dati non vengono cancellati.' },
        ],
        nextGuide: null,
      },
    ],
  },

  menu: {
    id: 'menu',
    label: 'Smart Menu',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    description: 'Il menu digitale per il tuo ristorante: aggiorna piatti e prezzi senza ristampare.',
    cta: {
      headline: 'Non hai ancora provato Smart Menu?',
      problem: 'Ogni volta che cambi un prezzo o un piatto, devi ristampare tutti i menu. Costi, tempo e sprechi.',
      solution: 'Con Smart Menu aggiorni tutto in 30 secondi dal telefono. I clienti scansionano il QR e vedono il menu sempre aggiornato, con foto, allergeni e multilingua.',
      action: 'Attiva la prova gratuita — 30 giorni gratis',
      note: 'Nessun dato di pagamento richiesto.',
    },
    guides: [
      {
        id: 'menu-01',
        title: 'Cos\'è Smart Menu e Come Funziona',
        subtitle: 'Menu digitale via QR, FREE vs PRO e sistema d\'asporto',
        sections: [
          {
            title: 'A cosa serve',
            content: 'Smart Menu è il **menu digitale** per il tuo ristorante:\n\n• **Aggiorna piatti e prezzi** in qualsiasi momento, senza ristampare\n• **Aggiungi foto** dei piatti per invogliare i clienti\n• **Indica allergeni** come richiesto dalla normativa UE\n• **Offri il menu in più lingue** — fino a 11 (ideale per zone turistiche)\n• **Ricevi ordini d\'asporto** direttamente dal menu (PRO)',
          },
          {
            title: 'Come funziona',
            content: '1. **Posizioni il QR Code** sui tavoli o al bancone\n2. **Il cliente scansiona** con la fotocamera del telefono\n3. **Si apre il menu**: foto del locale, categorie, piatti con nome, descrizione, prezzo, foto e allergeni\n4. **Ordina d\'asporto** (PRO): il cliente aggiunge piatti al carrello e invia l\'ordine via WhatsApp o email',
          },
          {
            title: 'FREE vs PRO',
            content: '| Funzionalità | FREE | PRO |\n|-------------|------|-----|\n| Menu | 1 | Illimitati |\n| Lingue | Solo italiano | 11 lingue |\n| Foto piatti | No | Si |\n| Varianti/aggiunte | No | Si |\n| Asporto | No | Si |\n| Colori e font | No | Si |\n\n**Prezzi**: €24,90/mese o €249,00/anno (-17%). Prova gratuita 30 giorni.',
          },
        ],
        nextGuide: 'menu-02',
      },
      {
        id: 'menu-02',
        title: 'Primo Accesso e Configurazione',
        subtitle: 'Profilo ristorante, lingue, colori e foto del locale',
        sections: [
          {
            title: 'Accedere da DOID Suite',
            content: 'Clicca su **Smart Menu** nel menu laterale della Suite. Verrai reindirizzato a **menu.doid.it** automaticamente.',
            screenshot: { alt: 'Accesso Smart Menu', desc: 'Accesso a Smart Menu dalla dashboard Suite' },
          },
          {
            title: 'Configurare il profilo',
            content: 'In **Impostazioni Generali > Dati Aziendali**:\n\n1. Carica il **logo**\n2. Inserisci **nome locale**, indirizzo, P.IVA, telefono, email\n3. Aggiungi **social** (Facebook, Instagram)\n4. Clicca **"Salva Impostazioni"**',
            screenshot: { alt: 'Dati aziendali', desc: 'Modulo dati aziendali compilato' },
            tip: 'Il "Nome locale" è quello che i clienti vedranno in cima al menu digitale.',
          },
          {
            title: 'Attivare le lingue (PRO)',
            content: 'In **Impostazioni Generali > Lingue**, seleziona le lingue desiderate tra le 11 disponibili: italiano (sempre attivo), inglese, tedesco, francese, spagnolo, russo, ceco, olandese, polacco, portoghese, cinese.',
            screenshot: { alt: 'Selezione lingue', desc: 'Selezione lingue con caselle' },
            warning: 'Quando attivi una lingua, dovrai tradurre manualmente i nomi di menu, categorie e piatti.',
          },
          {
            title: 'Personalizzare l\'aspetto (PRO)',
            content: 'In **Aspetto Menu**:\n\n• **Colori predefiniti**: 7 combinazioni pronte\n• **Colori personalizzati**: primario, scuro, sfondo\n• **Font**: scegli tra i Google Font disponibili\n• **Bordi arrotondati**: controlla gli angoli delle schede',
            screenshot: { alt: 'Aspetto menu', desc: 'Pannello personalizzazione con selettori colore' },
          },
          {
            title: 'Foto del ristorante',
            content: 'In **Profilo Ristorante**: scrivi la descrizione del locale (per ogni lingua) e carica le foto. Le foto appariranno come carosello nell\'intestazione del menu.',
            screenshot: { alt: 'Foto ristorante', desc: 'Upload foto ristorante con anteprima' },
          },
        ],
        nextGuide: 'menu-03',
      },
      {
        id: 'menu-03',
        title: 'Creare il Tuo Menu',
        subtitle: 'Menu, categorie, piatti, foto, allergeni e traduzioni',
        sections: [
          {
            title: 'La struttura',
            content: 'Il menu è su **tre livelli**:\n\n1. **Menu** — il contenitore (es. "Pranzo", "Cena")\n2. **Categorie** — le sezioni (es. "Antipasti", "Primi")\n3. **Piatti** — con nome, descrizione, prezzo, foto, allergeni',
          },
          {
            title: 'Creare un menu',
            content: '1. Vai in **Categorie e Menu > Menu**\n2. Clicca **"Aggiungi un Menu"**\n3. Inserisci il nome per ogni lingua attivata\n4. Spunta "Attivo" e se necessario "Disponibile per asporto"\n5. Clicca **"Salva Menu"**',
            screenshot: { alt: 'Creazione menu', desc: 'Modulo creazione menu con campi multilingua' },
            tip: 'Con il FREE hai 1 menu. Con il PRO: illimitati — pranzo, cena, aperitivo, stagionale.',
          },
          {
            title: 'Creare categorie',
            content: '1. Vai su **Categorie e Menu > Categorie**\n2. Clicca **"Aggiungi una Categoria"**\n3. Nome per ogni lingua + opzioni (attiva, asporto)\n4. Clicca **"Aggiungi Categoria"**\n\n**Esempio classico**: Antipasti, Primi, Secondi, Contorni, Dolci, Bevande, Vini, Caffetteria.',
          },
          {
            title: 'Aggiungere piatti',
            content: '1. **Gestione Piatti > "Aggiungi un piatto"**\n2. Nome e descrizione (ogni lingua)\n3. Prezzo e unità (al pezzo o al grammo)\n4. Foto del piatto (PRO)\n5. Allergeni — seleziona tra i 14 EU + Bio/Vegano\n6. Associa a menu e categoria\n7. Attiva il piatto\n8. Configura varianti (PRO) se necessario\n9. **"Salva Piatto"**',
            screenshot: { alt: 'Aggiunta piatto', desc: 'Riepilogo piatto con tutti i campi compilati' },
            tip: 'Per le foto: luce naturale, dall\'alto o 45°. Anche una foto semplice fatta con il telefono fa un ottimo effetto.',
          },
        ],
        faq: [
          { q: 'Quanti piatti posso aggiungere?', a: 'FREE: limitato. PRO: illimitati.' },
          { q: 'Posso inserire un piatto in più menu?', a: 'Sì, lo stesso piatto può essere nel menu Pranzo e Cena.' },
          { q: 'Gli allergeni sono obbligatori?', a: 'Non nel sistema, ma la normativa UE li richiede. Ti consigliamo fortemente di compilarli.' },
        ],
        nextGuide: 'menu-04',
      },
      {
        id: 'menu-04',
        title: 'Gestione Quotidiana',
        subtitle: 'Modifiche prezzi, piatti esauriti, speciali del giorno e varianti',
        sections: [
          {
            title: 'Modificare prezzi e descrizioni',
            content: '1. **Gestione Piatti** → trova il piatto (cerca o scorri)\n2. Clicca **"Modifica"** (icona matita)\n3. Cambia quello che serve\n4. **"Salva Piatto"** — le modifiche sono immediate',
            screenshot: { alt: 'Modifica piatto', desc: 'Modifica piatto con prezzo aggiornato' },
            tip: 'Puoi aggiornare un prezzo in 30 secondi, senza ristampare nulla.',
          },
          {
            title: 'Piatto esaurito? Nascondilo',
            content: 'Apri il piatto, togli la spunta da **"Attivo"**, salva. Il piatto sparisce dal menu ma non viene eliminato. Quando torna disponibile, rimetti la spunta.',
          },
          {
            title: 'Piatto del giorno',
            content: '**Opzione 1**: Crea una categoria **"Speciale del Giorno"** e aggiungi/rimuovi piatti ogni giorno.\n\n**Opzione 2**: Aggiungi il piatto a una categoria esistente e disattivalo quando non è più disponibile.',
            tip: 'La categoria dedicata è la soluzione migliore se il piatto del giorno cambia spesso.',
          },
          {
            title: 'Varianti e aggiunte (PRO)',
            content: 'Per piatti con opzioni (taglie pizza, cottura, extra):\n\n1. **Categorie e Menu > Varianti/Aggiunte**\n2. Crea un gruppo (es. "Taglie Pizza")\n3. Aggiungi le opzioni con prezzi aggiuntivi\n4. Nel piatto, attiva le varianti e seleziona i gruppi',
          },
        ],
        nextGuide: 'menu-05',
      },
      {
        id: 'menu-05',
        title: 'Far Usare il Menu ai Clienti',
        subtitle: 'QR Code, NFC, multilingua e sistema d\'asporto',
        sections: [
          {
            title: 'Stampare il QR Code',
            content: '1. **Impostazioni Generali > QR Code**\n2. Scarica l\'immagine\n3. Stampa su adesivi, cartoncini, cavalieri da tavolo o tovagliette\n\nDimensione minima: **3x3 cm** per una scansione facile.',
            screenshot: { alt: 'QR Code menu', desc: 'QR Code del menu con pulsante download' },
          },
          {
            title: 'Dove posizionare il QR',
            content: '| Posizione | Efficacia |\n|-----------|----------|\n| Centro tavolo | Top |\n| Cavaliere/porta menu | Top |\n| Bancone | Ottima |\n| Vetrina | Ottima (passanti consultano) |\n\nAggiungi un messaggio: *"Inquadra per il menu"* / *"Scan for menu"*.',
            tip: 'Assicurati che il QR sia ben illuminato e non coperto da piatti o tovaglioli.',
          },
          {
            title: 'Multilingua automatico',
            content: 'Il sistema rileva la **lingua del browser** del cliente e mostra automaticamente la versione corrispondente. Il cliente può cambiare lingua con le bandiere.\n\n**11 lingue disponibili** nel piano PRO.',
            warning: 'Per ogni lingua attivata, devi aver inserito le traduzioni. I campi non tradotti appaiono vuoti.',
          },
          {
            title: 'Sistema d\'asporto (PRO)',
            content: 'Il cliente aggiunge piatti al carrello e invia l\'ordine via **WhatsApp** o **email**.\n\nConfigura in **Impostazioni Generali > Dati Aziendali**: email per ordini e numero WhatsApp. In **Note Delivery**: istruzioni per il cliente.',
          },
        ],
        nextGuide: 'menu-06',
      },
      {
        id: 'menu-06',
        title: 'Gestire Più Ristoranti (Agenzie)',
        subtitle: 'Multi-ristorante, utenti aggiuntivi e gestione centralizzata',
        sections: [
          {
            title: 'Gestione multi-ristorante',
            content: 'Se gestisci più ristoranti:\n\n1. Crea un\'attività in DOID Suite per ogni ristorante\n2. Attiva Smart Menu per ognuno\n3. Ogni ristorante ha menu, categorie e piatti indipendenti\n4. Passa da uno all\'altro dalla pagina di selezione',
            screenshot: { alt: 'Selezione ristorante', desc: 'Pagina di selezione ristorante con griglia' },
          },
          {
            title: 'Utenti aggiuntivi (PRO)',
            content: 'In **Impostazioni Generali > Credenziali**:\n\n1. Inserisci email, password e tipo (Standard o Admin)\n2. Clicca "Aggiungi Utente"\n\nCosì il proprietario o lo staff possono accedere autonomamente.',
            tip: 'Stabilisci un processo: il cliente ti manda le variazioni del giorno, tu le aggiorni nel pannello.',
          },
        ],
        nextGuide: 'menu-07',
      },
      {
        id: 'menu-07',
        title: 'Statistiche e Risultati',
        subtitle: 'Monitorare visite, valutare efficacia e migliorare',
        sections: [
          {
            title: 'Indicatori positivi',
            content: '• I clienti usano il QR senza chiedere aiuto\n• Meno richieste di menu cartaceo\n• I clienti commentano le foto dei piatti\n• Ricevi ordini d\'asporto\n• I clienti stranieri ordinano senza difficoltà',
          },
          {
            title: 'Come migliorare',
            content: '1. **QR più visibile** — al centro del tavolo\n2. **Forma il personale** — devono indicare il QR\n3. **Aggiungi foto** (PRO) — i menu con foto vendono di più\n4. **Migliora le descrizioni** — includi ingredienti principali\n5. **Attiva più lingue** (PRO) — per clienti internazionali',
            tip: 'Quando aggiungi la foto a un piatto, spesso le vendite di quel piatto aumentano.',
          },
        ],
        nextGuide: 'menu-08',
      },
      {
        id: 'menu-08',
        title: 'Domande Frequenti',
        subtitle: 'FAQ su prezzi, lingue, foto, asporto e costi',
        sections: [],
        faq: [
          { q: 'Le modifiche si vedono subito?', a: 'Sì, istantaneamente.' },
          { q: 'Posso modificare dal telefono?', a: 'Sì, il pannello funziona da qualsiasi browser.' },
          { q: 'I clienti devono scaricare un\'app?', a: 'No. Il menu si apre nel browser.' },
          { q: 'Il menu funziona su tutti i telefoni?', a: 'Sì, su tutti gli smartphone con browser moderno.' },
          { q: 'Posso avere menu diversi per pranzo e cena?', a: 'Sì, con il PRO. Menu illimitati.' },
          { q: 'Il menu viene tradotto automaticamente?', a: 'No, le traduzioni vanno inserite manualmente per accuratezza.' },
          { q: 'Quanto risparmio rispetto ai menu cartacei?', a: 'Un menu cartaceo costa €500-1.500+/anno (stampe + ristampe). Smart Menu PRO costa €249/anno con aggiornamenti gratuiti e illimitati.' },
          { q: 'Devo indicare gli allergeni per legge?', a: 'Il Regolamento UE 1169/2011 lo richiede. Smart Menu facilita la compliance con icone automatiche per i 14 allergeni.' },
          { q: 'Come funziona l\'asporto?', a: 'Il cliente aggiunge piatti al carrello e invia l\'ordine via WhatsApp o email. Il pagamento avviene al ritiro.' },
          { q: 'Cosa succede se l\'abbonamento scade?', a: 'Il menu diventa non visibile. I dati vengono conservati per un periodo. Rinnova per riattivare.' },
        ],
        nextGuide: null,
      },
    ],
  },
};

/** Configurazione servizi per icone e colori (allineata con Sidebar.jsx) */
export const serviceConfig = {
  suite: { color: 'teal', iconBg: 'bg-teal-100', iconText: 'text-teal-600' },
  review: { color: 'yellow', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600' },
  page: { color: 'blue', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
  menu: { color: 'green', iconBg: 'bg-green-100', iconText: 'text-green-600' },
};
