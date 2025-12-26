import { createContext, useContext } from 'react';
import { useServices } from '../hooks/useServices.jsx';

// Crea il context
const ServicesContext = createContext(null);

/**
 * Provider per condividere stato servizi nell'app
 */
export function ServicesProvider({ children }) {
  const servicesData = useServices();

  return (
    <ServicesContext.Provider value={servicesData}>
      {children}
    </ServicesContext.Provider>
  );
}

/**
 * Hook per accedere al context dei servizi
 * @returns {Object} Stato e metodi dei servizi
 */
export function useServicesContext() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServicesContext must be used within a ServicesProvider');
  }
  return context;
}

export default ServicesContext;
