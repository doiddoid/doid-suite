// Configurazione dei servizi DOID Suite
export const SERVICES = {
  smart_review: {
    code: 'smart_review',
    name: 'Smart Review',
    description: 'Gestione recensioni intelligente per la tua attività',
    appUrl: process.env.SMART_REVIEW_URL || 'https://review.doid.it',
    icon: 'Star',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  smart_page: {
    code: 'smart_page',
    name: 'Smart Page',
    description: 'Crea pagine web professionali in pochi click',
    appUrl: process.env.SMART_PAGE_URL || 'https://page.doid.it',
    icon: 'FileText',
    color: '#3B82F6',
    bgLight: '#EFF6FF',
    borderColor: '#BFDBFE'
  },
  menu_digitale: {
    code: 'menu_digitale',
    name: 'Menu Digitale',
    description: 'Il tuo menu sempre aggiornato e accessibile',
    appUrl: process.env.MENU_DIGITALE_URL || 'https://menu.doid.it',
    icon: 'UtensilsCrossed',
    color: '#10B981',
    bgLight: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  display_suite: {
    code: 'display_suite',
    name: 'Display Suite',
    description: 'Digital signage per la tua attività',
    appUrl: process.env.DISPLAY_SUITE_URL || 'https://display.doid.it',
    icon: 'Monitor',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    borderColor: '#DDD6FE'
  }
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
    trialDays: 14
  },
  business: {
    code: 'business',
    name: 'Business',
    trialDays: 14
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
