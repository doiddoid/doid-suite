// Configurazione servizi frontend DOID Suite

// Informazioni di contatto per servizi su richiesta
export const CONTACT_INFO = {
  whatsapp: '+39 351 678 1324',
  whatsappLink: 'https://wa.me/393516781324',
  email: 'info@doid.it',
  calendly: 'https://calendly.com/doid'
};

// Servizi che richiedono contatto (non attivabili direttamente)
export const CONTACT_REQUIRED_SERVICES = {
  display_suite: {
    code: 'display_suite',
    name: 'Display Suite',
    description: 'I tuoi schermi che vendono per te',
    tagline: 'Digital signage che attira clienti',
    benefits: [
      'Palinsesti automatici e dinamici',
      'Gestione multi-schermo da remoto',
      'Contenuti che catturano l\'attenzione'
    ],
    icon: 'Monitor',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    borderColor: '#DDD6FE',
    type: 'contact_required'
  },
  smart_agent_ai: {
    code: 'smart_agent_ai',
    name: 'Smart Agent AI',
    description: 'L\'assistente AI che lavora mentre tu riposi',
    tagline: 'Automatizza. Risparmia. Cresci.',
    benefits: [
      'Risponde ai clienti 24/7',
      'Automatizza processi ripetitivi',
      'Soluzione su misura per la tua attività'
    ],
    icon: 'Bot',
    color: '#EC4899',
    bgLight: '#FDF2F8',
    borderColor: '#FBCFE8',
    type: 'contact_required'
  },
  smart_connect: {
    code: 'smart_connect',
    name: 'Smart Connect',
    description: 'Il CRM che trasforma contatti in clienti',
    tagline: 'Relazioni che generano fatturato',
    benefits: [
      'Gestione contatti centralizzata',
      'Email marketing automatizzato',
      'Funnel di vendita su misura'
    ],
    icon: 'Users',
    color: '#06B6D4',
    bgLight: '#ECFEFF',
    borderColor: '#A5F3FC',
    type: 'contact_required'
  }
};

// Lista codici servizi contact_required
export const CONTACT_REQUIRED_SERVICE_CODES = ['display_suite', 'smart_agent_ai', 'smart_connect'];

// Genera link WhatsApp con messaggio precompilato
export const getWhatsAppLink = (serviceName) => {
  const message = encodeURIComponent(
    `Ciao! Sono interessato al servizio ${serviceName} di DOID Suite. Vorrei ricevere maggiori informazioni.`
  );
  return `${CONTACT_INFO.whatsappLink}?text=${message}`;
};

// Genera link mailto con subject precompilato
export const getEmailLink = (serviceName) => {
  const subject = encodeURIComponent(`Richiesta informazioni - ${serviceName}`);
  const body = encodeURIComponent(
    `Buongiorno,\n\nSono interessato al servizio ${serviceName} di DOID Suite.\n\nVorrei ricevere maggiori informazioni riguardo:\n- Funzionalità disponibili\n- Prezzi e piani\n- Tempistiche di attivazione\n\nGrazie`
  );
  return `mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`;
};

// Genera link Calendly
export const getCalendlyLink = () => {
  return CONTACT_INFO.calendly;
};
