/**
 * Metadati servizi per le guide utente.
 * Le guide vere e proprie vengono caricate dal database (tabella guides).
 * Questo file contiene solo label, colori e CTA di fallback.
 */

export const guidaContent = {
  suite: {
    id: 'suite',
    label: 'DOID Suite',
    color: 'teal',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    description: 'La dashboard centralizzata: account, attività, abbonamenti e team.',
    cta: {
      headline: 'Non hai ancora un account?',
      problem: 'Gestire più strumenti digitali separatamente è complicato e fa perdere tempo.',
      solution: 'Con DOID Suite gestisci tutto da un unico pannello: servizi, team, abbonamenti.',
      action: 'Crea il tuo account gratuito',
      note: 'Nessun dato di pagamento richiesto.',
    },
    guides: [],
  },
  review: {
    id: 'review',
    label: 'Review',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    description: 'Gestisci la reputazione online: raccogli recensioni positive e intercetta quelle negative.',
    cta: {
      headline: 'Non hai ancora provato Review?',
      problem: 'Le recensioni negative finiscono online prima che tu possa fare qualcosa.',
      solution: 'Con Review le intercetti e le gestisci in privato, trasformando un problema in un\'opportunità.',
      action: 'Attiva la prova gratuita — 30 giorni gratis',
      note: 'Nessun dato di pagamento richiesto.',
    },
    guides: [],
  },
  page: {
    id: 'page',
    label: 'Page',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    description: 'Il tuo biglietto da visita digitale: sempre aggiornato, condivisibile con un tap.',
    cta: {
      headline: 'Non hai ancora provato Page?',
      problem: 'I biglietti cartacei si perdono, si rovinano e diventano obsoleti appena cambi un numero.',
      solution: 'Con Page hai un biglietto digitale sempre aggiornato, condivisibile con un tocco.',
      action: 'Attiva la prova gratuita — 30 giorni gratis',
      note: 'Nessun dato di pagamento richiesto.',
    },
    guides: [],
  },
  menu: {
    id: 'menu',
    label: 'Menu',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    description: 'Il menu digitale: aggiornamenti in tempo reale, QR Code, multilingua.',
    cta: {
      headline: 'Non hai ancora provato Menu?',
      problem: 'Menu cartacei obsoleti, ristampe costose, nessuna informazione su allergeni aggiornata.',
      solution: 'Con Menu aggiorni tutto in tempo reale, multilingua, con QR code sui tavoli.',
      action: 'Attiva la prova gratuita — 30 giorni gratis',
      note: 'Nessun dato di pagamento richiesto.',
    },
    guides: [],
  },
  chat_ai: {
    id: 'chat_ai',
    label: 'Chat AI',
    color: 'teal',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    description: 'Crea assistenti AI personalizzati ed embeddabili su qualsiasi sito web.',
    cta: {
      headline: 'Non hai ancora provato Chat AI?',
      problem: 'I tuoi clienti hanno domande anche quando non sei disponibile.',
      solution: 'Con Chat AI hai un assistente virtuale che risponde 24/7 con le informazioni che decidi tu.',
      action: 'Attiva la prova gratuita — 30 giorni gratis',
      note: 'Nessun dato di pagamento richiesto.',
    },
    guides: [],
  },
};

/** Configurazione servizi per icone e colori (allineata con Sidebar.jsx) */
export const serviceConfig = {
  suite: { color: 'teal', iconBg: 'bg-teal-100', iconText: 'text-teal-600' },
  review: { color: 'yellow', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600' },
  page: { color: 'blue', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
  menu: { color: 'green', iconBg: 'bg-green-100', iconText: 'text-green-600' },
  chat_ai: { color: 'teal', iconBg: 'bg-teal-100', iconText: 'text-teal-600' },
};
