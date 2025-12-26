import { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function PlanModal({ service, onClose, onActivate }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.getServicePlans(service.code);
        if (response.success) {
          setPlans(response.data.plans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [service.code]);

  const handleActivate = async () => {
    if (!selectedPlan) return;

    setActivating(true);
    try {
      await onActivate(selectedPlan.id, billingCycle);
      onClose();
    } catch (error) {
      console.error('Error activating subscription:', error);
    } finally {
      setActivating(false);
    }
  };

  const getPrice = (plan) => {
    const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    if (price === 0) return 'Gratis';
    return `€${price.toFixed(2)}`;
  };

  const getPeriod = () => {
    return billingCycle === 'yearly' ? '/anno' : '/mese';
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
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Attiva {service.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Scegli il piano più adatto alle tue esigenze
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Mensile
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Annuale
                  <span className="ml-2 text-xs text-green-600 font-semibold">-17%</span>
                </button>
              </div>
            </div>

            {/* Plans */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan.code === 'pro' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Popolare
                        </span>
                      </div>
                    )}

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {plan.name}
                    </h3>

                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {getPrice(plan)}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-gray-500 text-sm">{getPeriod()}</span>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Annulla
            </button>
            <button
              onClick={handleActivate}
              disabled={!selectedPlan || activating}
              className="btn-primary"
            >
              {activating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Attiva ${selectedPlan?.name || ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
