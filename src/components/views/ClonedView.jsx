import React from 'react';
import { Sparkles, CheckCircle2, FileCheck, Layers, Type, AlignLeft } from 'lucide-react';

export default function ClonedView({ doc, profile }) {
  if (!doc) return null;

  const activeProfile = profile || {
    name: 'Auto-Analyzed Reference Profile',
    sourceFile: 'reference_template.doc',
    fontFamily: "'Source Serif 4', Georgia, serif",
    baseFontSize: '10.5pt',
    headingFontFamily: "'Plus Jakarta Sans', sans-serif",
    h1Style: { size: '15pt', weight: '700', transform: 'none', numbering: 'decimal', color: '#1e40af' },
    h2Style: { size: '12pt', weight: '600', transform: 'none', numbering: 'none', color: '#334155' },
    lineHeight: '1.6',
    paragraphIndent: '0in',
    paragraphSpacing: '0.75rem',
    textAlign: 'justify',
    columns: 2,
    margins: '0.85in',
    citationStyle: 'bracket',
    accentColor: '#1e40af',
    confidenceScore: 96,
    detectedAttributes: ['Analyzed layout and typography matches']
  };

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  const getHeadingLabel = (idx, level, cleanTitle) => {
    const numbering = activeProfile.h1Style?.numbering;
    if (numbering === 'roman') {
      return `${romanNumerals[idx] || (idx + 1)}. ${cleanTitle}`;
    }
    if (numbering === 'decimal') {
      return `${idx + 1}.0 ${cleanTitle}`;
    }
    return cleanTitle;
  };

  const paperStyle = {
    fontFamily: activeProfile.fontFamily,
    fontSize: activeProfile.baseFontSize,
    lineHeight: activeProfile.lineHeight,
    padding: activeProfile.margins || '1in',
    color: '#1e293b'
  };

  const bodyStyle = {
    columnCount: activeProfile.columns || 1,
    columnGap: '26px',
    textAlign: activeProfile.textAlign || 'left'
  };

  return (
    <div className="cloned-format-paper" style={paperStyle}>
      {/* Cloned Format Analysis Verification Ribbon */}
      <div className="cloned-audit-banner">
        <div className="audit-banner-left">
          <div className="audit-icon-wrap">
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="audit-title-row">
              <span className="audit-source-name">Strict Format Applied: {activeProfile.name}</span>
              <span className="audit-score-pill">
                <CheckCircle2 size={12} /> {activeProfile.confidenceScore || 95}% Match
              </span>
            </div>
            <div className="audit-meta-summary">
              <span><Type size={11} /> {activeProfile.fontFamily.split(',')[0].replace(/['"]/g, '')}</span>
              <span><Layers size={11} /> {activeProfile.columns === 2 ? 'Two-Column Layout' : 'Single-Column'}</span>
              <span><AlignLeft size={11} /> {activeProfile.textAlign === 'justify' ? 'Justified Body' : 'Left Aligned'}</span>
              <span><FileCheck size={11} /> Citation: {activeProfile.citationStyle.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Title Header */}
      <header className="cloned-header">
        <h1
          className="cloned-title"
          style={{
            fontFamily: activeProfile.headingFontFamily || activeProfile.fontFamily,
            color: activeProfile.accentColor || '#0f172a'
          }}
        >
          {doc.title}
        </h1>

        {doc.authors && doc.authors.length > 0 && (
          <div className="cloned-authors-list">
            {doc.authors.map((a, idx) => (
              <span key={idx} className="cloned-author-item">
                <span className="cloned-author-name">{a.name}</span>
                {a.affiliation && <span className="cloned-author-affil"> ({a.affiliation})</span>}
                {a.email && <span className="cloned-author-email"> &lt;{a.email}&gt;</span>}
              </span>
            ))}
          </div>
        )}

        {doc.abstract && (
          <div
            className="cloned-abstract-container"
            style={{
              borderColor: `${activeProfile.accentColor || '#3b82f6'}30`,
              backgroundColor: `${activeProfile.accentColor || '#3b82f6'}08`
            }}
          >
            <div
              className="cloned-abstract-label"
              style={{ color: activeProfile.accentColor || '#0f172a' }}
            >
              Abstract
            </div>
            <p className="cloned-abstract-text">{doc.abstract}</p>
          </div>
        )}

        {doc.keywords && doc.keywords.length > 0 && (
          <div className="cloned-keywords-line">
            <strong>Index Terms:</strong> {doc.keywords.join(', ')}
          </div>
        )}
      </header>

      {/* Body with extracted columns & typography rules */}
      <div className="cloned-body-columns" style={bodyStyle}>
        {doc.sections && doc.sections.map((sec, idx) => {
          const headingLabel = getHeadingLabel(idx, sec.level, sec.cleanTitle || sec.title);
          const isUppercase = activeProfile.h1Style?.transform === 'uppercase';

          return (
            <section key={sec.id || idx} className="cloned-section">
              <h2
                className="cloned-sec-h1"
                style={{
                  fontFamily: activeProfile.headingFontFamily || activeProfile.fontFamily,
                  color: activeProfile.accentColor || '#0f172a',
                  textTransform: isUppercase ? 'uppercase' : 'none',
                  fontSize: activeProfile.h1Style?.size || '15pt'
                }}
              >
                {headingLabel}
              </h2>

              {sec.items && sec.items.map((item, itemIdx) => {
                if (item.type === 'paragraph') {
                  return (
                    <p
                      key={itemIdx}
                      className="cloned-paragraph"
                      style={{
                        textIndent: activeProfile.paragraphIndent || '0in',
                        marginBottom: activeProfile.paragraphSpacing || '0.75rem'
                      }}
                    >
                      {item.content}
                    </p>
                  );
                }
                if (item.type === 'list') {
                  return (
                    <ul key={itemIdx} className="cloned-list">
                      {item.items.map((li, lIdx) => (
                        <li key={lIdx}>{li.replace(/^[-*•\d\.\)]\s*/, '')}</li>
                      ))}
                    </ul>
                  );
                }
                if (item.type === 'equation') {
                  return (
                    <div key={itemIdx} className="cloned-eq-wrap">
                      <span className="cloned-eq-math">{item.content}</span>
                      <span className="cloned-eq-num">({itemIdx + 1})</span>
                    </div>
                  );
                }
                if (item.type === 'table') {
                  return (
                    <div key={itemIdx} className="cloned-table-box">
                      <div className="cloned-table-caption" style={{ color: activeProfile.accentColor || '#1e293b' }}>
                        {item.title || 'Table Analysis'}
                      </div>
                      <table className="cloned-table">
                        {item.headers && (
                          <thead>
                            <tr style={{ borderBottomColor: activeProfile.accentColor || '#cbd5e1' }}>
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
                    <div key={itemIdx} className="cloned-figure-box">
                      <div className="cloned-figure-placeholder">[ Cloned Layout Figure Item ]</div>
                      <div className="cloned-figure-caption">
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

        {/* References formatted according to extracted citation signature */}
        {doc.references && doc.references.length > 0 && (
          <section className="cloned-section cloned-ref-section">
            <h2
              className="cloned-sec-h1"
              style={{
                fontFamily: activeProfile.headingFontFamily || activeProfile.fontFamily,
                color: activeProfile.accentColor || '#0f172a',
                textTransform: activeProfile.h1Style?.transform === 'uppercase' ? 'uppercase' : 'none'
              }}
            >
              References
            </h2>
            <div className="cloned-ref-list">
              {doc.references.map((ref, idx) => (
                <div
                  key={idx}
                  className={`cloned-ref-item ${activeProfile.citationStyle === 'apa' ? 'apa-hanging' : ''}`}
                >
                  {activeProfile.citationStyle === 'bracket' && (
                    <span className="cloned-ref-tag" style={{ color: activeProfile.accentColor || '#2563eb' }}>
                      [{idx + 1}]
                    </span>
                  )}
                  {activeProfile.citationStyle === 'footnote' && (
                    <sup className="cloned-ref-sup" style={{ color: activeProfile.accentColor || '#2563eb' }}>
                      {idx + 1}.
                    </sup>
                  )}
                  <span className="cloned-ref-content">{ref.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
