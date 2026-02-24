import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Banner CTA persuasivo per servizi non attivati.
 * Usa la formula PAS: Problema → Agitazione → Soluzione.
 */
export default function GuideCTA({ cta, serviceColor }) {
  if (!cta) return null;

  const colorMap = {
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-500',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      button: 'bg-green-500 hover:bg-green-600 text-white',
    },
  };

  const colors = colorMap[serviceColor] || colorMap.blue;

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-6 mb-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm`}>
          <Sparkles className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {cta.headline}
          </h3>
          <p className="text-gray-600 text-sm mb-1">
            {cta.problem}
          </p>
          <p className="text-gray-700 text-sm font-medium mb-4">
            {cta.solution}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to="/servizi"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold ${colors.button} transition-colors shadow-sm`}
            >
              {cta.action}
            </Link>
            {cta.note && (
              <span className="text-xs text-gray-500">{cta.note}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
