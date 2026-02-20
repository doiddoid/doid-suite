import { useState } from 'react';
import { Key, Mail, RefreshCw, X, Loader2, Check, AlertCircle, Shield } from 'lucide-react';
import api from '../../services/api';

export default function CredentialsModal({
  userId,
  userEmail,
  userName,
  onClose
}) {
  const [loading, setLoading] = useState(null); // 'reset' | 'regenerate' | null
  const [result, setResult] = useState(null); // { type: 'success'|'error', message }

  const handleResetPassword = async () => {
    setLoading('reset');
    setResult(null);

    try {
      const response = await api.request(`/admin/users/${userId}/reset-password`, {
        method: 'POST'
      });

      if (response.success) {
        setResult({
          type: 'success',
          message: `Email di reset password inviata a ${userEmail}`
        });
      } else {
        setResult({ type: 'error', message: response.error || 'Errore nell\'invio' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err.message || 'Errore nell\'invio' });
    }
    setLoading(null);
  };

  const handleRegenerateCredentials = async () => {
    setLoading('regenerate');
    setResult(null);

    try {
      const response = await api.request(`/admin/users/${userId}/regenerate-credentials`, {
        method: 'POST'
      });

      if (response.success) {
        setResult({
          type: 'success',
          message: `Nuove credenziali inviate a ${userEmail}`
        });
      } else {
        setResult({ type: 'error', message: response.error || 'Errore nella generazione' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err.message || 'Errore nella generazione' });
    }
    setLoading(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Credenziali di Accesso</h3>
              <p className="text-sm text-gray-500">{userName || userEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {/* Option 1: Send Reset Email */}
          <button
            onClick={handleResetPassword}
            disabled={loading !== null}
            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                {loading === 'reset' ? (
                  <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5 text-teal-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Invia email reset password</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Invia un link di reset password all'email del cliente. Il link scade dopo 1 ora.
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Regenerate Credentials */}
          <button
            onClick={handleRegenerateCredentials}
            disabled={loading !== null}
            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                {loading === 'regenerate' ? (
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Genera nuove credenziali</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Genera una nuova password temporanea e la invia via email al cliente. Il cliente dovrà cambiarla al primo accesso.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Result Feedback */}
        {result && (
          <div className={`mx-5 mb-5 p-4 rounded-xl flex items-center gap-3 ${
            result.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {result.type === 'success' ? (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            )}
            <p className={`text-sm font-medium ${
              result.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between rounded-b-xl">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Shield className="w-3 h-3" />
            <span>Le password non vengono mai mostrate qui</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
