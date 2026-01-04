import { Briefcase, CreditCard, Percent, TrendingDown, Calendar } from 'lucide-react';

export default function BillingSummary({ billing }) {
  if (!billing) return null;

  const {
    activityCount,
    isAgency,
    discountPercentage,
    subscriptions,
    totals
  } = billing;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Riepilogo Fatturazione
          </h3>
          {isAgency && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
              <Briefcase className="w-4 h-4" />
              AGENZIA
            </span>
          )}
        </div>
      </div>

      {/* Agency Discount Banner */}
      {discountPercentage > 0 && (
        <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-purple-900">Sconto Volume Applicato</p>
                <p className="text-sm text-purple-700">{activityCount} attività gestite</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-purple-600">-{discountPercentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions && subscriptions.length > 0 ? (
        <div className="p-5 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Abbonamenti Attivi</h4>
          <div className="space-y-3">
            {subscriptions.map((sub, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{sub.serviceName}</p>
                  <p className="text-sm text-gray-500">{sub.activityName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatPrice(sub.price)}
                    <span className="text-gray-500 font-normal">
                      /{sub.billingCycle === 'yearly' ? 'anno' : 'mese'}
                    </span>
                  </p>
                  {sub.currentPeriodEnd && (
                    <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" />
                      Rinnovo: {formatDate(sub.currentPeriodEnd)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 border-b border-gray-200 text-center text-gray-500">
          Nessun abbonamento PRO attivo
        </div>
      )}

      {/* Totals */}
      <div className="p-5 bg-gray-50">
        <div className="space-y-3">
          {/* Subtotals */}
          {totals.monthlySubtotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Abbonamenti mensili</span>
              <span className="text-gray-900">{formatPrice(totals.monthlySubtotal)}/mese</span>
            </div>
          )}
          {totals.yearlySubtotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Abbonamenti annuali</span>
              <span className="text-gray-900">{formatPrice(totals.yearlySubtotal)}/anno</span>
            </div>
          )}

          {/* Monthly Equivalent */}
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="text-gray-600">Equivalente mensile</span>
            <span className="text-gray-900">{formatPrice(totals.monthlyEquivalent)}</span>
          </div>

          {/* Discount */}
          {discountPercentage > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                Sconto volume ({discountPercentage}%)
              </span>
              <span>-{formatPrice(totals.discountAmount)}</span>
            </div>
          )}

          {/* Final Total */}
          <div className="flex justify-between pt-3 border-t border-gray-300">
            <span className="font-semibold text-gray-900">Totale Mensile</span>
            <span className="text-xl font-bold text-purple-600">{formatPrice(totals.finalMonthly)}</span>
          </div>

          {/* Yearly Estimate */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Stima annuale</span>
            <span className="text-gray-600">{formatPrice(totals.estimatedYearly)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
