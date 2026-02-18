import { Sparkles } from 'lucide-react';

/**
 * WelcomeBanner - Banner di benvenuto per nuovi utenti
 *
 * Props:
 * - activityName: nome dell'attività
 * - show: boolean per mostrare/nascondere
 */
export default function WelcomeBanner({ activityName, show = true }) {
  if (!show) return null;

  return (
    <div className="mb-8 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium text-white/80">Benvenuto</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Ciao! Benvenuto in DOID Suite
        </h2>

        <p className="text-white/80 max-w-xl">
          {activityName ? (
            <>
              Gestisci <span className="font-semibold text-white">{activityName}</span> con
              i nostri servizi digitali. Attiva il tuo primo servizio per iniziare!
            </>
          ) : (
            <>
              Gestisci la tua attività con i nostri servizi digitali.
              Attiva il tuo primo servizio per iniziare!
            </>
          )}
        </p>
      </div>
    </div>
  );
}
