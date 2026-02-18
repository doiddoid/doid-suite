import { ChevronDown, ChevronUp, Plus, LayoutDashboard, Star, FileText, UtensilsCrossed, Monitor, Key, Bot, Users } from 'lucide-react';
import ElementRow from './ElementRow';

// Mappa icone per codice servizio
const iconMap = {
  star: Star,
  'file-text': FileText,
  'utensils-crossed': UtensilsCrossed,
  monitor: Monitor,
  'key-round': Key,
  bot: Bot,
  users: Users,
  // Fallback per codici servizio
  review: Star,
  page: FileText,
  menu: UtensilsCrossed,
  display: Monitor,
  agent_ai: Bot,
  connect: Users,
  accessi: Key,
};

/**
 * ServiceCard - Card accordion per servizio nella pagina "I Miei Servizi"
 *
 * Props:
 * - service: { info: {...}, elements: [...] }
 *   - info: { code, name, icon, color_primary, color_dark, color_light, price_pro_monthly, price_pro_yearly, price_addon_monthly, has_free_tier }
 *   - elements: array di subscription elements
 * - expanded: boolean - se la card è espansa
 * - onToggle: () => void - toggle espansione
 * - onAction: (element, actionType) => void - azioni sugli elementi
 * - onAddElement: () => void - aggiunta nuovo elemento
 * - onDashboard: () => void - vai alla dashboard servizio
 */
export default function ServiceCard({
  service,
  expanded,
  onToggle,
  onAction,
  onAddElement,
  onDashboard
}) {
  const { info, elements } = service;
  const {
    code,
    name,
    icon,
    color_primary,
    color_dark,
    color_light
  } = info;

  // Ottieni icona
  const IconComponent = iconMap[icon] || iconMap[code] || Star;

  // Conta elementi per tipo
  const proElements = elements.filter(e => e.status === 'pro' || e.status === 'active' || e.status === 'trial');
  const freeElements = elements.filter(e => e.status === 'free');
  const totalElements = elements.length;

  // Calcola totale mensile per questo servizio
  const serviceMonthlyTotal = elements
    .filter(e => e.status === 'pro' || e.status === 'active')
    .reduce((sum, e) => sum + (e.price || 0), 0);

  // Formatta prezzo
  const formatPrice = (amount) => {
    if (!amount || amount === 0) return null;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Sottotesto per header
  const getSubtext = () => {
    if (totalElements === 0) return 'Nessun elemento';
    const parts = [];
    parts.push(`${totalElements} element${totalElements !== 1 ? 'i' : 'o'}`);
    if (proElements.length > 0) parts.push(`${proElements.length} PRO`);
    if (freeElements.length > 0) parts.push(`${freeElements.length} Free`);
    return parts.join(' • ');
  };

  // Stile header quando espanso
  const getHeaderStyle = () => {
    if (expanded) {
      return {
        background: `linear-gradient(135deg, ${color_light || '#F5F5F5'} 0%, #FFFFFF 100%)`,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      };
    }
    return {};
  };

  // Se non ci sono elementi, mostra bottone Attiva
  const hasElements = totalElements > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* HEADER - sempre visibile, cliccabile */}
      <div
        className={`p-4 cursor-pointer transition-all ${hasElements ? 'hover:bg-gray-50' : ''}`}
        style={getHeaderStyle()}
        onClick={hasElements ? onToggle : undefined}
      >
        <div className="flex items-center justify-between">
          {/* Sinistra: Icona + Nome + Sottotesto */}
          <div className="flex items-center gap-3">
            {/* Box icona con gradient */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${color_light || '#F5F5F5'} 0%, ${color_primary}30 100%)`
              }}
            >
              <IconComponent
                className="w-6 h-6"
                style={{ color: color_primary || '#6B7280' }}
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">{name}</h3>
              <p className="text-xs text-gray-500">{getSubtext()}</p>
            </div>
          </div>

          {/* Destra: Totale + Chevron o Bottone Attiva */}
          <div className="flex items-center gap-3">
            {hasElements ? (
              <>
                {serviceMonthlyTotal > 0 && (
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(serviceMonthlyTotal)}/mese
                  </span>
                )}
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddElement?.();
                }}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: color_primary }}
              >
                Attiva
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY - solo se espanso e ha elementi */}
      {expanded && hasElements && (
        <div className="px-4 pb-4 space-y-4">
          {/* Sezione PRO / TRIAL */}
          {proElements.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[10px] font-bold tracking-wider uppercase"
                style={{ color: color_dark || color_primary }}
              >
                Elementi PRO / Trial
              </p>
              <div className="space-y-2">
                {proElements.map((element) => (
                  <ElementRow
                    key={element.subscription_id}
                    element={element}
                    serviceColor={color_primary}
                    serviceDark={color_dark}
                    onAction={onAction}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sezione FREE */}
          {freeElements.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                Elementi Free
              </p>
              <div className="space-y-2">
                {freeElements.map((element) => (
                  <ElementRow
                    key={element.subscription_id}
                    element={element}
                    serviceColor={color_primary}
                    serviceDark={color_dark}
                    onAction={onAction}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer con azioni */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {/* Bottone Aggiungi elemento */}
              <button
                onClick={() => onAddElement?.()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: color_primary }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi elemento</span>
              </button>

              {/* Bottone Dashboard */}
              <button
                onClick={() => onDashboard?.()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all hover:bg-gray-50"
                style={{
                  color: color_primary,
                  borderColor: `${color_primary}40`
                }}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Badge totale mensile servizio */}
            {serviceMonthlyTotal > 0 && (
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: `${color_primary}15`,
                  color: color_primary
                }}
              >
                Totale: {formatPrice(serviceMonthlyTotal)}/mese
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
