import { Link } from 'react-router-dom';
import {
  Sparkles,
  Star,
  FileText,
  UtensilsCrossed,
  Monitor,
  ArrowRight,
  Check,
  CreditCard,
  HeartHandshake,
  TrendingUp,
  Building2,
  Users,
  Calendar,
  Mail,
  ChevronRight,
  Smartphone,
  QrCode,
  Filter,
  Clock,
  Palette,
  BarChart3,
  Shield,
  Rocket,
  Target,
  Megaphone,
  UserCheck,
  ExternalLink
} from 'lucide-react';

// ============================================
// CONFIGURAZIONE SERVIZI
// ============================================
const services = [
  {
    id: 'smart-review',
    name: 'Smart Review',
    tagline: 'Recensioni sotto controllo',
    description: 'Filtra le recensioni negative prima che arrivino online. Raccogli feedback su oltre 10 piattaforme con un solo QR code.',
    icon: Star,
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-t-amber-500',
    url: 'https://review.doid.it',
    features: ['Filtro recensioni negative', '10+ piattaforme', 'QR code personalizzato', 'Dashboard analytics']
  },
  {
    id: 'smart-page',
    name: 'Smart Page',
    tagline: 'Il tuo biglietto da visita digitale',
    description: 'Crea landing page professionali e biglietti da visita NFC/QR. Condividi i tuoi contatti con un tap.',
    icon: FileText,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-t-blue-500',
    url: 'https://page.doid.it',
    features: ['Landing page instant', 'NFC & QR code', 'Analytics visite', 'Personalizzazione totale']
  },
  {
    id: 'menu-digitale',
    name: 'Menu Digitale',
    tagline: 'Il menu sempre aggiornato',
    description: 'Aggiorna prezzi e piatti in tempo reale. I tuoi clienti scannerizzano e vedono sempre il menu aggiornato.',
    icon: UtensilsCrossed,
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-t-emerald-500',
    url: 'https://menu.doid.it',
    features: ['Aggiornamenti real-time', 'Multi-lingua', 'Allergeni integrati', 'Design responsive']
  },
  {
    id: 'display-suite',
    name: 'Display Suite',
    tagline: 'Digital signage semplice',
    description: 'Gestisci schermi e monitor nella tua attivita. Promozioni, menu, info: tutto da remoto.',
    icon: Monitor,
    color: 'violet',
    gradient: 'from-violet-500 to-violet-600',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-t-violet-500',
    url: null,
    comingSoon: true,
    features: ['Gestione remota', 'Playlist contenuti', 'Scheduling', 'Multi-schermo']
  }
];

// ============================================
// ROADMAP SERVIZI FUTURI
// ============================================
const futureServices = [
  { name: 'Smart Accessi', icon: UserCheck, description: 'Gestione ingressi e prenotazioni' },
  { name: 'Smart CRM', icon: Users, description: 'Clienti e comunicazioni' },
];

// ============================================
// COMPONENTE LOGO DOID
// ============================================
const DOIDLogo = ({ service = 'Suite', size = 'md', showIcon = true }) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', iconInner: 'w-4 h-4', text: 'text-sm' },
    md: { icon: 'w-10 h-10', iconInner: 'w-5 h-5', text: 'text-lg' },
    lg: { icon: 'w-12 h-12', iconInner: 'w-6 h-6', text: 'text-xl' }
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <div className={`${s.icon} bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20`}>
          <Sparkles className={`${s.iconInner} text-white`} />
        </div>
      )}
      <div className="flex items-baseline gap-0.5">
        <span className={`${s.text} text-gray-400 font-normal`}>doID</span>
        <span className={`${s.text} text-teal-600 font-bold`}>{service}</span>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE TRUST BADGES
// ============================================
const TrustBadges = () => (
  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500">
    <div className="flex items-center gap-2">
      <CreditCard className="w-4 h-4 text-teal-500" />
      <span>Nessuna carta richiesta</span>
    </div>
    <div className="flex items-center gap-2">
      <Check className="w-4 h-4 text-teal-500" />
      <span>Registrazione gratuita</span>
    </div>
    <div className="flex items-center gap-2">
      <HeartHandshake className="w-4 h-4 text-teal-500" />
      <span>Supporto italiano</span>
    </div>
  </div>
);

// ============================================
// COMPONENTE PRINCIPALE LANDING
// ============================================
export default function Landing() {
  return (
    <div className="min-h-screen bg-white">

      {/* ============================================
          HEADER
          ============================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <DOIDLogo />

            <nav className="hidden md:flex items-center gap-8">
              <a href="#servizi" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Servizi</a>
              <a href="#per-chi" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Per chi</a>
              <a href="#perche-noi" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Perchè noi</a>
              <a href="#contatti" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Contatti</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
                Accedi
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600 transition-colors text-sm">
                Registrati Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pre-headline */}
          <p className="text-teal-600 font-medium mb-4">
            Gestisci un'attivita e vuoi semplificare la tua presenza digitale?
          </p>

          {/* H1 */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Un solo account.
            <br />
            <span className="text-teal-600">Tutti gli strumenti digitali per la tua attivita.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            doID Suite riunisce recensioni, biglietti da visita digitali, menu e display in un'unica dashboard.
            <br />Attivi solo cio che ti serve, quando ti serve.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30">
              Registrati Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-teal-500 hover:text-teal-600 transition-all">
              Accedi
            </Link>
          </div>

          {/* Trust badges */}
          <TrustBadges />
        </div>
      </section>

      {/* ============================================
          VALUE PROPOSITION
          ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                Basta password, abbonamenti e strumenti sparsi
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Quanti servizi stai usando per gestire la presenza digitale della tua attivita?
                Recensioni qui, biglietti da visita la, menu da un'altra parte...
              </p>
              <p className="text-gray-600 leading-relaxed">
                Con doID Suite hai <strong className="text-gray-900">un'unica dashboard</strong> per tutto.
                Un solo login, una sola fattura, un solo interlocutore per il supporto.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-teal-600" />
                  </div>
                  <span>Un solo account</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                  </div>
                  <span>Dashboard unificata</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-teal-600" />
                  </div>
                  <span>Risparmio tempo</span>
                </div>
              </div>
            </div>

            {/* Dashboard mockup placeholder */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-4 text-xs text-gray-500">suite.doid.it/dashboard</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <DOIDLogo size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {services.slice(0, 4).map((service) => (
                      <div key={service.id} className={`p-4 rounded-xl ${service.bgLight} border-t-4 ${service.borderColor}`}>
                        <service.icon className={`w-6 h-6 ${service.textColor} mb-2`} />
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Attivo</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 -top-4 -right-4 w-full h-full bg-teal-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SERVIZI
          ============================================ */}
      <section id="servizi" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              I servizi della Suite
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ogni servizio risolve un problema specifico. Attivali singolarmente o combinali per una gestione completa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className={`relative bg-white rounded-2xl border border-gray-100 border-t-4 ${service.borderColor} p-6 hover:shadow-xl transition-all duration-300 group`}
              >
                {service.comingSoon && (
                  <div className="absolute top-4 right-4 bg-violet-100 text-violet-700 text-xs font-medium px-3 py-1 rounded-full">
                    Prossimamente
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <service.icon className="w-7 h-7 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-400 font-normal">doID</span>
                      <span className={`text-sm font-bold ${service.textColor}`}>{service.name.replace('Smart ', '').replace('Menu ', '').replace(' Suite', '')}</span>
                    </div>
                    <p className={`text-lg font-semibold text-gray-900 mb-2`}>{service.tagline}</p>
                    <p className="text-gray-600 text-sm mb-4">{service.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.features.map((feature, idx) => (
                        <span key={idx} className={`text-xs ${service.bgLight} ${service.textColor} px-2 py-1 rounded-md`}>
                          {feature}
                        </span>
                      ))}
                    </div>

                    {service.url ? (
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-sm font-medium ${service.textColor} hover:underline`}
                      >
                        Scopri di piu
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">In arrivo...</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-10 text-lg">
            E questo e solo l'inizio...
          </p>
        </div>
      </section>

      {/* ============================================
          LA NOSTRA VISIONE
          ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              La nostra visione
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              doID Suite nasce da un'idea semplice: le PMI italiane meritano strumenti digitali
              <strong className="text-gray-900"> accessibili, semplici e che crescono con loro</strong>.
            </p>
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-teal-500" />
              Roadmap della Suite
            </h3>

            <div className="space-y-4">
              {/* Servizi attuali */}
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Oggi disponibili</p>
                  <p className="text-sm text-gray-500">Smart Review, Smart Page</p>
                </div>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">Attivi</span>
              </div>

              {/* In arrivo */}
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">In arrivo</p>
                  <p className="text-sm text-gray-500">Menu Digitale, Display Suite</p>
                </div>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">2026</span>
              </div>

              {/* Futuri */}
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Prossimamente</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {futureServices.map((fs, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        <fs.icon className="w-3 h-3" />
                        {fs.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-teal-50 rounded-xl">
              <p className="text-sm text-teal-800 flex items-start gap-2">
                <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>La Suite cresce, il tuo abbonamento resta sotto controllo.</strong>
                  <br />
                  Paghi solo per i servizi che attivi. Nessun costo nascosto.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PER CHI E
          ============================================ */}
      <section id="per-chi" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Per chi è doID Suite?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Attivita */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Per la tua attivita</h3>
              <p className="text-gray-600 mb-6">
                Sei un titolare e vuoi gestire in autonomia la presenza digitale della tua attivita?
                La Suite è pensata per te.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Ristoranti e bar',
                  'Hotel e B&B',
                  'Negozi e boutique',
                  'Studi professionali',
                  'Centri estetici e palestre',
                  'Artigiani e liberi professionisti'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 text-teal-600 font-medium hover:underline">
                Inizia gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Agenzie */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Per agenzie e reseller</h3>
              <p className="text-gray-300 mb-6">
                Gestisci piu clienti? Abbiamo piani pensati per agenzie di comunicazione e web agency.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Gestione multi-account',
                  'Sconti volume progressivi',
                  'Dashboard centralizzata',
                  'Fatturazione semplificata',
                  'Supporto dedicato'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-teal-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contatti"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Prenota una call
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PERCHE NOI
          ============================================ */}
      <section id="perche-noi" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Perche scegliere doID Suite
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Focus PMI italiane',
                description: 'Non siamo un tool americano tradotto. Siamo italiani, per le PMI italiane.'
              },
              {
                icon: CreditCard,
                title: 'Prezzi onesti',
                description: 'Altrove paghi 250-500 per singolo servizio. Noi partiamo da 0.'
              },
              {
                icon: Palette,
                title: 'Semplicità',
                description: 'Dashboard pulita, niente funzioni inutili. Vai dritto al punto.'
              },
              {
                icon: TrendingUp,
                title: 'Cresciamo insieme',
                description: 'Nuovi servizi in arrivo. La tua Suite diventa sempre più completa.'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 text-center border border-gray-100">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          COME FUNZIONA
          ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Come funziona
            </h2>
            <p className="text-gray-600">In 3 semplici step sei operativo</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Crea il tuo account',
                description: 'Registrati gratis in 30 secondi. Nessuna carta di credito richiesta.',
                icon: UserCheck
              },
              {
                step: '2',
                title: 'Esplora i servizi',
                description: 'Scopri cosa puo fare ogni servizio per la tua attivita.',
                icon: Sparkles
              },
              {
                step: '3',
                title: 'Attiva cio che ti serve',
                description: 'Inizia con un servizio o attivali tutti. Decidi tu.',
                icon: Rocket
              }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PARLIAMONE / CONTATTI
          ============================================ */}
      <section id="contatti" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Hai domande? Parliamone
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Prenota una call conoscitiva di 15 minuti. Nessun impegno,
            solo una chiacchierata per capire se doID Suite fa per te.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="https://calendly.com/doid"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Prenota su Calendly
            </a>
            <a
              href="mailto:info@doid.it"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-teal-500 hover:text-teal-600 transition-colors"
            >
              <Mail className="w-5 h-5" />
              info@doid.it
            </a>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA FINALE
          ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-500 to-teal-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Pronto a semplificare la gestione della tua attività?
          </h2>
          <p className="text-teal-100 mb-8 max-w-xl mx-auto">
            Unisciti a centinaia di imprenditori italiani che usano doID Suite ogni giorno.
          </p>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-teal-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-teal-50 transition-colors shadow-xl shadow-teal-600/20"
          >
            Registrati Gratis Ora
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-teal-100">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Nessuna carta richiesta</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Registrazione gratuita</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Supporto italiano</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg text-gray-500 font-normal">doID</span>
                <span className="text-lg text-white font-bold">Suite</span>
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <a href="https://doid.it" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">doID.it</a>
              <a href="https://www.iubenda.com/privacy-policy/86826482" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="https://doid.it/termini-di-servizio/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Termini di Servizio</a>
              <a href="mailto:info@doid.it" className="hover:text-white transition-colors">Contatti</a>
            </nav>

            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} doID. Tutti i diritti riservati. | P.IVA IT04031700273
            </p>
          </div>
        </div>
      </footer>

      {/* ============================================
          CTA STICKY MOBILE
          ============================================ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-40">
        <Link
          to="/register"
          className="w-full inline-flex items-center justify-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
        >
          Registrati Gratis
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Spacer per CTA sticky mobile */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
}
