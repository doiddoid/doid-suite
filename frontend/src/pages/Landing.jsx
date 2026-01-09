import { Link } from 'react-router-dom';
import {
  Sparkles,
  Star,
  QrCode,
  Monitor,
  UtensilsCrossed,
  ArrowRight,
  Check,
  Shield,
  Zap,
  Users
} from 'lucide-react';

const services = [
  {
    id: 'smart-review',
    name: 'Smart Review',
    description: 'Raccogli e gestisci le recensioni dei tuoi clienti in modo intelligente',
    icon: Star,
    color: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
  },
  {
    id: 'smart-page',
    name: 'Smart Page',
    description: 'Crea biglietti da visita digitali e landing page professionali',
    icon: QrCode,
    color: 'from-blue-500 to-indigo-500',
    shadow: 'shadow-blue-500/20',
  },
  {
    id: 'menu-digitale',
    name: 'Menu Digitale',
    description: 'Digitalizza il menu del tuo ristorante con QR code dinamici',
    icon: UtensilsCrossed,
    color: 'from-green-500 to-emerald-500',
    shadow: 'shadow-green-500/20',
  },
  {
    id: 'display-suite',
    name: 'Display Suite',
    description: 'Gestisci schermi e display digitali per la tua attivita',
    icon: Monitor,
    color: 'from-purple-500 to-violet-500',
    shadow: 'shadow-purple-500/20',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Tutto in un unico posto',
    description: 'Gestisci tutti i servizi DOID da una dashboard centralizzata',
  },
  {
    icon: Users,
    title: 'Multi-attivita',
    description: 'Perfetto per agenzie e aziende con piu sedi o clienti',
  },
  {
    icon: Shield,
    title: 'Sicuro e affidabile',
    description: 'I tuoi dati sono protetti con le migliori pratiche di sicurezza',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg text-gray-400 font-normal">DOID</span>
                <span className="text-lg text-gray-900 font-bold">Suite</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#servizi" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Servizi
              </a>
              <a href="#funzionalita" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Funzionalita
              </a>
              <a href="#prezzi" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Prezzi
              </a>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Accedi
              </Link>
              <Link
                to="/register"
                className="btn-primary text-sm"
              >
                Inizia gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            La piattaforma digitale per il tuo business
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Tutti i servizi DOID,
            <br />
            <span className="text-gradient-doid">una sola dashboard</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Gestisci recensioni, biglietti da visita digitali, menu e display
            da un&apos;unica piattaforma. Semplice, veloce, professionale.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="btn-primary btn-lg group"
            >
              Inizia la prova gratuita
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="btn-outline btn-lg"
            >
              Ho gia un account
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Nessuna carta di credito richiesta - 30 giorni di prova gratuita
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section id="servizi" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              I nostri servizi
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Una suite completa di strumenti digitali per far crescere la tua attivita
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} ${service.shadow} shadow-lg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funzionalita" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perche scegliere DOID Suite
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Una piattaforma pensata per semplificare la gestione digitale della tua attivita
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-8"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section id="prezzi" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Inizia gratuitamente
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Prova tutti i servizi per 30 giorni senza impegno
          </p>

          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-8 sm:p-12 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="text-left">
                <h3 className="text-2xl font-bold mb-4">Prova gratuita</h3>
                <ul className="space-y-3">
                  {[
                    'Accesso a tutti i servizi',
                    'Nessuna carta richiesta',
                    'Supporto incluso',
                    'Cancella quando vuoi',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary-200" />
                      <span className="text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">30</div>
                <div className="text-primary-200 text-lg">giorni gratis</div>
                <Link
                  to="/register"
                  className="mt-6 inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
                >
                  Inizia ora
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Pronto a digitalizzare la tua attivita?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Unisciti a centinaia di aziende che usano DOID Suite ogni giorno
          </p>
          <Link
            to="/register"
            className="btn-primary btn-lg"
          >
            Crea il tuo account gratuito
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm text-gray-400 font-normal">DOID</span>
                <span className="text-sm text-gray-900 font-bold">Suite</span>
              </div>
            </div>

            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://doid.it" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                DOID.it
              </a>
              <a href="https://doid.it/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                Privacy
              </a>
              <a href="https://doid.it/termini" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                Termini
              </a>
            </nav>

            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} DOID. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
