// Configurazione dei servizi DOID Suite
export const SERVICES = {
  smart_review: {
    code: 'smart_review',
    name: 'Smart Review',
    description: 'Trasforma ogni recensione in un cliente fedele',
    tagline: 'Più recensioni positive, più clienti',
    benefits: [
      'Aumenta le recensioni a 5 stelle del 300%',
      'Rispondi in automatico con l\'AI',
      'Blocca le recensioni negative prima che vadano online'
    ],
    appUrl: process.env.SMART_REVIEW_URL || 'https://review.doid.it',
    icon: 'Star',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    type: 'activatable'
  },
  smart_page: {
    code: 'smart_page',
    name: 'Smart Page',
    description: 'Il tuo biglietto da visita digitale che converte',
    tagline: 'Fatti trovare. Fatti scegliere.',
    benefits: [
      'Pagina web professionale in 5 minuti',
      'QR Code per condivisione istantanea',
      'Analytics per capire chi ti cerca'
    ],
    appUrl: process.env.SMART_PAGE_URL || 'https://page.doid.it',
    icon: 'FileText',
    color: '#3B82F6',
    bgLight: '#EFF6FF',
    borderColor: '#BFDBFE',
    type: 'activatable'
  },
  menu_digitale: {
    code: 'menu_digitale',
    name: 'Menu Digitale',
    description: 'Il menu che fa ordinare di più',
    tagline: 'Addio carta. Benvenuto fatturato.',
    benefits: [
      'Aggiornamenti in tempo reale',
      'Foto che fanno venire l\'acquolina',
      'Niente più ristampe costose'
    ],
    appUrl: process.env.MENU_DIGITALE_URL || 'https://menu.doid.it',
    icon: 'UtensilsCrossed',
    color: '#10B981',
    bgLight: '#ECFDF5',
    borderColor: '#A7F3D0',
    type: 'activatable'
  },
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
    appUrl: process.env.DISPLAY_SUITE_URL || 'https://display.doid.it',
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
    appUrl: null,
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
    appUrl: null,
    icon: 'Users',
    color: '#06B6D4',
    bgLight: '#ECFEFF',
    borderColor: '#A5F3FC',
    type: 'contact_required'
  }
};

// Lista servizi per tipo
export const ACTIVATABLE_SERVICES = ['smart_review', 'smart_page', 'menu_digitale'];
export const CONTACT_REQUIRED_SERVICES = ['display_suite', 'smart_agent_ai', 'smart_connect'];

// Piani disponibili
export const PLANS = {
  free: {
    code: 'free',
    name: 'Free',
    trialDays: 0
  },
  pro: {
    code: 'pro',
    name: 'Pro',
    trialDays: 30
  },
  business: {
    code: 'business',
    name: 'Business',
    trialDays: 30
  }
};

// Ruoli utente
export const USER_ROLES = {
  owner: {
    code: 'owner',
    name: 'Proprietario',
    level: 4
  },
  admin: {
    code: 'admin',
    name: 'Amministratore',
    level: 3
  },
  manager: {
    code: 'manager',
    name: 'Manager',
    level: 2
  },
  user: {
    code: 'user',
    name: 'Utente',
    level: 1
  }
};

// Verifica se un ruolo ha accesso minimo
export const hasMinRole = (userRole, minRole) => {
  const userLevel = USER_ROLES[userRole]?.level || 0;
  const minLevel = USER_ROLES[minRole]?.level || 0;
  return userLevel >= minLevel;
};

export default SERVICES;
