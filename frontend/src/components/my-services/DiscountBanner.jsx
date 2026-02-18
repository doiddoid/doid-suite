import { Sparkles } from 'lucide-react';

/**
 * MultiServiceDiscountBanner - Banner sconto multi-servizio
 *
 * Visibile SOLO se totalProElements >= 2
 *
 * Props:
 * - totalProElements: numero di elementi PRO attivi
 */
export default function DiscountBanner({ totalProElements }) {
  // Non mostrare se meno di 2 elementi PRO
  if (totalProElements < 2) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
        borderColor: '#99F6E4'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Sinistra: Icona + Testo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-teal-800">
              Sconto multi-servizio attivo!
            </p>
            <p className="text-sm text-teal-600">
              Hai {totalProElements} servizi PRO attivi
            </p>
          </div>
        </div>

        {/* Destra: Badge sconti */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-white/80 rounded-lg text-xs font-bold text-teal-700">
            -20% sul 2°
          </span>
          <span className="px-2.5 py-1 bg-white/80 rounded-lg text-xs font-bold text-teal-700">
            -30% sul 3°
          </span>
        </div>
      </div>
    </div>
  );
}
