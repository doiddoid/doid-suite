import { Camera, Lightbulb, AlertTriangle } from 'lucide-react';

/**
 * Singola sezione di una guida con titolo, contenuto, screenshot placeholder, tip e warning.
 */
export default function GuideStep({ section, index }) {
  // Renderizza il contenuto con formattazione base (bold, liste, tabelle)
  const renderContent = (text) => {
    if (!text) return null;

    // Splitta per righe e processa
    const lines = text.split('\n');
    const elements = [];
    let tableRows = [];
    let inTable = false;

    lines.forEach((line, i) => {
      // Tabella markdown
      if (line.trim().startsWith('|')) {
        if (line.trim().match(/^\|[\s-|]+\|$/)) {
          // Separator row - skip
          return;
        }
        const cells = line.split('|').filter(c => c.trim() !== '');
        tableRows.push(cells.map(c => c.trim()));
        inTable = true;
        return;
      }

      // Fine tabella - renderizza
      if (inTable && tableRows.length > 0) {
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-3">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {tableRows[0].map((cell, ci) => (
                    <th key={ci} className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">
                      {renderInlineText(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2 px-3 text-gray-600">
                        {renderInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }

      // Riga vuota
      if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
        return;
      }

      // Bullet list
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        const text = line.trim().replace(/^[•-]\s+/, '');
        elements.push(
          <li key={i} className="ml-4 text-gray-600 leading-relaxed list-disc">
            {renderInlineText(text)}
          </li>
        );
        return;
      }

      // Numbered list
      if (line.trim().match(/^\d+\.\s/)) {
        const text = line.trim().replace(/^\d+\.\s+/, '');
        const num = line.trim().match(/^(\d+)\./)[1];
        elements.push(
          <li key={i} className="ml-4 text-gray-600 leading-relaxed list-decimal" value={num}>
            {renderInlineText(text)}
          </li>
        );
        return;
      }

      // Paragrafo normale
      elements.push(
        <p key={i} className="text-gray-600 leading-relaxed">
          {renderInlineText(line)}
        </p>
      );
    });

    // Flush remaining table
    if (inTable && tableRows.length > 0) {
      elements.push(
        <div key="table-final" className="overflow-x-auto my-3">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {tableRows[0].map((cell, ci) => (
                  <th key={ci} className="text-left py-2 px-3 font-semibold text-gray-700 bg-gray-50">
                    {renderInlineText(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2 px-3 text-gray-600">
                      {renderInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <div className="space-y-1">{elements}</div>;
  };

  // Renderizza testo inline (bold)
  const renderInlineText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-4">
      {/* Section title */}
      {section.title && (
        <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          {index !== undefined && (
            <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {index + 1}
            </span>
          )}
          {section.title}
        </h4>
      )}

      {/* Content */}
      {section.content && renderContent(section.content)}

      {/* Screenshot placeholder */}
      {section.screenshot && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center my-4">
          <Camera className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-500">Screenshot in arrivo</p>
          <p className="text-xs text-gray-400 mt-1">{section.screenshot.desc}</p>
        </div>
      )}

      {/* Tip box */}
      {section.tip && (
        <div className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-lg p-4 my-3">
          <Lightbulb className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-teal-800">{renderInlineText(section.tip)}</p>
        </div>
      )}

      {/* Warning box */}
      {section.warning && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg p-4 my-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{renderInlineText(section.warning)}</p>
        </div>
      )}
    </div>
  );
}
