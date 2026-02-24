import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

/**
 * Lista FAQ collassabili. Ogni domanda si espande per mostrare la risposta.
 */
export default function GuideFAQ({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <HelpCircle className="w-4 h-4" />
        Domande frequenti
      </h4>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
                  openIndex === idx ? 'rotate-180' : ''
                }`}
              />
              <span className="text-sm font-medium text-gray-800">{item.q}</span>
            </button>
            {openIndex === idx && (
              <div className="px-3 pb-3 ml-7">
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
