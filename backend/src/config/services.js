// Configurazione dei servizi DOID Suite
export const SERVICES = {
  review: {
    code: 'review',
    name: 'Smart Review',
    description: 'Trasforma ogni recensione in un cliente fedele',
    tagline: 'Più recensioni positive, più clienti',
    benefits: [
      'Aumenta le recensioni a 5 stelle',
      'Gestisci più piattaforme in un unico luogo',
      'Blocca le recensioni negative prima che vadano online'
    ],
    appUrl: process.env.SMART_REVIEW_URL || 'https://review.doid.it',
    icon: 'Star',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    type: 'activatable'
  },
  page: {
    code: 'page',
    name: 'Smart Page',
    description: 'Il tuo biglietto da visita digitale che converte',
    tagline: 'Fatti trovare. Fatti scegliere.',
    benefits: [
      'Online in 5 minuti, zero competenze',
      'QR Code pronto per biglietti e vetrine',
      'Analytics per capire chi ti cerca'
    ],
    appUrl: process.env.SMART_PAGE_URL || 'https://page.doid.it',
    icon: 'FileText',
    color: '#3B82F6',
    bgLight: '#EFF6FF',
    borderColor: '#BFDBFE',
    type: 'activatable'
  },
  menu: {
    code: 'menu',
    name: 'Menu Digitale',
    description: 'Il menu che fa ordinare di più',
    tagline: 'Addio carta. Benvenuto fatturato.',
    benefits: [
      'Aggiornamenti in tempo reale',
      'Niente più ristampe costose',
      'Foto e descrizioni che aumentano gli ordini'
    ],
    appUrl: process.env.MENU_DIGITALE_URL || 'https://menu.doid.it',
    icon: 'UtensilsCrossed',
    color: '#10B981',
    bgLight: '#ECFDF5',
    borderColor: '#A7F3D0',
    type: 'activatable'
  },
  agent_ai: {
    code: 'agent_ai',
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
  connect: {
    code: 'connect',
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
  },
  display: {
    code: 'display',
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
  }
};

// Lista servizi per tipo
export const ACTIVATABLE_SERVICES = ['review', 'page', 'menu'];
export const CONTACT_REQUIRED_SERVICES = ['agent_ai', 'connect', 'display'];

// Mappatura codici servizio: database <-> frontend
// Il database usa smart_review, smart_page, menu_digitale
// Il frontend config usa review, page, menu
export const SERVICE_CODE_MAP = {
  // Database code -> Short code
  'smart_review': 'review',
  'smart_page': 'page',
  'menu_digitale': 'menu',
  // Short code -> Database code
  'review': 'smart_review',
  'page': 'smart_page',
  'menu': 'menu_digitale',
  // Display/other services (same in both)
  'display_suite': 'display',
  'display': 'display_suite',
  'agent_ai': 'agent_ai',
  'connect': 'connect'
};

// Normalizza un service code al formato breve (review, page, menu)
export const normalizeServiceCodeShort = (code) => {
  if (!code) return code;
  const mapped = SERVICE_CODE_MAP[code];
  // Se il mapping esiste e il risultato è un codice breve, usalo
  if (mapped && ['review', 'page', 'menu', 'display', 'agent_ai', 'connect'].includes(mapped)) {
    return mapped;
  }
  // Altrimenti ritorna il codice originale se già breve
  if (['review', 'page', 'menu', 'display', 'agent_ai', 'connect'].includes(code)) {
    return code;
  }
  return code;
};

// Normalizza un service code al formato database (smart_review, smart_page, menu_digitale)
export const normalizeServiceCodeFull = (code) => {
  if (!code) return code;
  const mapped = SERVICE_CODE_MAP[code];
  // Se il mapping esiste e il risultato è un codice lungo, usalo
  if (mapped && ['smart_review', 'smart_page', 'menu_digitale', 'display_suite'].includes(mapped)) {
    return mapped;
  }
  // Altrimenti ritorna il codice originale se già lungo
  if (['smart_review', 'smart_page', 'menu_digitale', 'display_suite'].includes(code)) {
    return code;
  }
  return code;
};

// Verifica se due service codes sono equivalenti (considerando la mappatura)
export const areServiceCodesEquivalent = (code1, code2) => {
  if (!code1 || !code2) return false;
  if (code1 === code2) return true;
  // Normalizza entrambi al formato breve e confronta
  return normalizeServiceCodeShort(code1) === normalizeServiceCodeShort(code2);
};

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
