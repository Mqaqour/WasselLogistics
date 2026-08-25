import React from 'react';

const IMG_RE  = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const LINK_RE = /^\[([^\]]+)\]\(([^)]+)\)$/;

/**
 * Renders a plain-text answer stored with lightweight markdown-like syntax:
 *   **bold**  — bold text
 *   ![](url) — inline / block image
 *   [label](url) — hyperlink (opens in new tab, bold)
 *   - text    — bullet list item
 *   1. text   — numbered list item
 *   blank line — paragraph break
 */
export const FormattedAnswer: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const paragraphs = text.split(/\n{2,}/);

  const renderInline = (line: string, key: number) => {
    const parts = line.split(/(\*\*[^*]+\*\*|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g);
    return (
      <React.Fragment key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          const imgMatch = part.match(IMG_RE);
          if (imgMatch)
            return <img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full max-h-64 rounded-lg my-1 border border-gray-100" />;
          const linkMatch = part.match(LINK_RE);
          if (linkMatch)
            return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all font-bold">{linkMatch[1]}</a>;
          return part;
        })}
      </React.Fragment>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n').filter(l => l.trim() !== '');

        // Standalone image block
        if (lines.length === 1 && IMG_RE.test(lines[0].trim())) {
          const m = lines[0].trim().match(IMG_RE)!;
          return (
            <div key={pIdx} className="my-2 text-center">
              <img src={m[2]} alt={m[1]} className="max-w-full max-h-80 rounded-xl border border-gray-200 mx-auto" />
            </div>
          );
        }

        const isBulletList = lines.every(l => /^[-•]\s/.test(l.trim()));
        const isNumberList = lines.every(l => /^\d+[.)]\s/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1 text-gray-700 leading-relaxed rtl:pr-2 ltr:pl-2">
              {lines.map((l, i) => (
                <li key={i}>{renderInline(l.replace(/^[-•]\s+/, ''), i)}</li>
              ))}
            </ul>
          );
        }

        if (isNumberList) {
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1 text-gray-700 leading-relaxed rtl:pr-2 ltr:pl-2">
              {lines.map((l, i) => (
                <li key={i}>{renderInline(l.replace(/^\d+[.)]\s+/, ''), i)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={pIdx} className="text-gray-700 leading-relaxed">
            {lines.map((l, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {renderInline(l, i)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
