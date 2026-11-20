import React from 'react';

export default function CustomView({ doc, settings }) {
  if (!doc) return null;

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  const containerStyle = {
    fontFamily: settings.fontFamily || "'Plus Jakarta Sans', sans-serif",
    fontSize: settings.baseFontSize || '11pt',
    lineHeight: settings.lineHeight || '1.6',
    padding: settings.margins || '1in',
    color: '#1e293b'
  };

  const bodyStyle = {
    columnCount: settings.columns || 1,
    columnGap: '28px',
    textAlign: settings.textAlign || 'left'
  };

  const getHeadingLabel = (idx, level, cleanTitle) => {
    if (settings.headingNumbering === 'roman') {
      return `${romanNumerals[idx] || (idx + 1)}. ${cleanTitle}`;
    }
    if (settings.headingNumbering === 'decimal') {
      return `${idx + 1}.0 ${cleanTitle}`;
    }
    if (settings.headingNumbering === 'pill') {
      return cleanTitle;
    }
    return cleanTitle;
  };

  return (
    <div className="custom-paper" style={containerStyle}>
      {/* Document Header */}
      <header className="custom-doc-header">
        <h1 className="custom-doc-title" style={{ color: settings.accentColor || '#0f172a' }}>
          {doc.title}
        </h1>

        {doc.authors && doc.authors.length > 0 && (
          <div className="custom-doc-authors">
            {doc.authors.map((a, idx) => (
              <span key={idx} className="custom-author-pill">
                <strong>{a.name}</strong>
                {a.affiliation && <small> ({a.affiliation})</small>}
              </span>
            ))}
          </div>
        )}

        {doc.abstract && (
          <div className="custom-abstract-card" style={{ borderLeftColor: settings.accentColor || '#3b82f6' }}>
            <div className="custom-abstract-tag" style={{ color: settings.accentColor || '#3b82f6' }}>
              Abstract
            </div>
            <p>{doc.abstract}</p>
          </div>
        )}

        {doc.keywords && doc.keywords.length > 0 && (
          <div className="custom-keywords-row">
            <span className="custom-kw-label">Keywords:</span>
            {doc.keywords.map((kw, idx) => (
              <span key={idx} className="custom-kw-badge">
                {kw}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Body with customizable column layout */}
      <div className="custom-doc-body" style={bodyStyle}>
        {doc.sections && doc.sections.map((sec, idx) => {
          const headingText = getHeadingLabel(idx, sec.level, sec.cleanTitle || sec.title);
          
          return (
            <section key={sec.id || idx} className="custom-sec-block">
              {settings.headingNumbering === 'pill' ? (
                <div className="custom-heading-pill-wrap">
                  <span className="custom-heading-pill-badge" style={{ backgroundColor: settings.accentColor || '#3b82f6' }}>
                    0{idx + 1}
                  </span>
                  <h2 className="custom-h2-title" style={{ color: '#0f172a' }}>{headingText}</h2>
                </div>
              ) : settings.headingNumbering === 'underline' ? (
                <h2 className="custom-h2-underline" style={{ borderBottomColor: settings.accentColor || '#3b82f6', color: settings.accentColor || '#0f172a' }}>
                  {headingText}
                </h2>
              ) : (
                <h2 className="custom-h2-standard" style={{ color: settings.accentColor || '#0f172a' }}>
                  {headingText}
                </h2>
              )}

              {sec.items && sec.items.map((item, itemIdx) => {
                if (item.type === 'paragraph') {
                  return (
                    <p
                      key={itemIdx}
                      className="custom-p"
                      style={{
                        textIndent: settings.paragraphIndent || '0in',
                        marginBottom: settings.paragraphSpacing || '0.75rem'
                      }}
                    >
                      {item.content}
                    </p>
                  );
                }
                if (item.type === 'list') {
                  return (
                    <ul key={itemIdx} className="custom-list">
                      {item.items.map((li, lIdx) => (
                        <li key={lIdx}>{li.replace(/^[-*•\d\.\)]\s*/, '')}</li>
                      ))}
                    </ul>
                  );
                }
                if (item.type === 'equation') {
                  return (
                    <div key={itemIdx} className="custom-eq-container" style={{ borderColor: '#e2e8f0' }}>
                      <span className="custom-eq-text">{item.content}</span>
                      <span className="custom-eq-index">({itemIdx + 1})</span>
                    </div>
                  );
                }
                if (item.type === 'table') {
                  return (
                    <div key={itemIdx} className="custom-table-container">
                      <div className="custom-table-title" style={{ color: settings.accentColor || '#1e293b' }}>
                        {item.title || 'Data Table'}
                      </div>
                      <table className="custom-table">
                        {item.headers && (
                          <thead>
                            <tr style={{ backgroundColor: `${settings.accentColor || '#3b82f6'}15` }}>
                              {item.headers.map((h, hIdx) => (
                                <th key={hIdx}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {item.rows && item.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                if (item.type === 'figure') {
                  return (
                    <div key={itemIdx} className="custom-fig-box">
                      <div className="custom-fig-caption">
                        <strong>Figure {itemIdx + 1}:</strong> {item.caption.replace(/^fig(ure)?\.?\s*\d*[:\s]*/i, '')}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </section>
          );
        })}

        {/* References */}
        {doc.references && doc.references.length > 0 && (
          <section className="custom-sec-block custom-references-block">
            <h2 className="custom-h2-standard" style={{ color: settings.accentColor || '#0f172a' }}>
              References
            </h2>
            <div className="custom-ref-list">
              {doc.references.map((ref, idx) => (
                <div key={idx} className="custom-ref-item">
                  <span className="custom-ref-marker" style={{ color: settings.accentColor || '#3b82f6' }}>
                    [{idx + 1}]
                  </span>
                  <span className="custom-ref-body">{ref.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {settings.showPageNumbers && (
        <footer className="custom-doc-footer">
          <span>Formatted with FormatFlow Customizer</span>
          <span>Page 1</span>
        </footer>
      )}
    </div>
  );
}
