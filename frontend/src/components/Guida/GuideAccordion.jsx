import { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import GuideStep from './GuideStep';
import GuideFAQ from './GuideFAQ';

/**
 * Accordion per una singola guida. Contiene sezioni (GuideStep), FAQ e link alla guida successiva.
 */
export default function GuideAccordion({ guide, index, onNavigateToGuide, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header - clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Number badge */}
        <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
          {index + 1}
        </span>

        {/* Title & subtitle */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {guide.title}
          </h3>
          {guide.subtitle && (
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {guide.subtitle}
            </p>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Guide sections */}
          {guide.sections && guide.sections.length > 0 && (
            <div className="divide-y divide-gray-100">
              {guide.sections.map((section, sIdx) => (
                <div key={sIdx} className="py-4 first:pt-4">
                  <GuideStep section={section} index={guide.sections.length > 1 ? sIdx : undefined} />
                </div>
              ))}
            </div>
          )}

          {/* FAQ inline */}
          {guide.faq && guide.faq.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <GuideFAQ items={guide.faq} />
            </div>
          )}

          {/* Next guide link */}
          {guide.nextGuide && onNavigateToGuide && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => onNavigateToGuide(guide.nextGuide)}
                className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                <span>Prossima guida</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
