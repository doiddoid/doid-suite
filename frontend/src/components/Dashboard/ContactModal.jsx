import { X, MessageCircle, Mail, Calendar, Check, ArrowRight } from 'lucide-react';
import { getWhatsAppLink, getEmailLink, getCalendlyLink, CONTACT_INFO } from '../../config/services';

/**
 * ContactModal - Modal per richiedere informazioni sui servizi su misura
 *
 * Props:
 * - service: { code, name, description, tagline, benefits, color, bgLight, borderColor }
 * - onClose: () => void
 */
export default function ContactModal({ service, onClose }) {
  const handleWhatsApp = () => {
    window.open(getWhatsAppLink(service.name), '_blank');
  };

  const handleEmail = () => {
    window.location.href = getEmailLink(service.name);
  };

  const handleCalendly = () => {
    window.open(getCalendlyLink(), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
          {/* Header con colore servizio */}
          <div
            className="rounded-t-2xl p-6"
            style={{ backgroundColor: service.bgLight }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: service.color }}
                >
                  {service.tagline}
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {service.name}
                </h2>
                <p className="text-gray-600 mt-2">
                  {service.description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Benefits */}
          {service.benefits && service.benefits.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <ul className="space-y-2">
                {service.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <Check
                      className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                      style={{ color: service.color }}
                    />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Parliamone insieme
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Questo servizio viene personalizzato sulle tue esigenze.
              Contattaci per una consulenza gratuita.
            </p>

            {/* Contact Options */}
            <div className="space-y-3">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-green-100 bg-green-50 hover:bg-green-100 hover:border-green-200 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center mr-3">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-500">Risposta immediata</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center mr-3">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-xs text-gray-500">{CONTACT_INFO.email}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Calendly */}
              <button
                onClick={handleCalendly}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-purple-100 bg-purple-50 hover:bg-purple-100 hover:border-purple-200 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center mr-3">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Prenota Appuntamento</p>
                    <p className="text-xs text-gray-500">Scegli data e ora</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
