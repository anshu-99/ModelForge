import React from 'react';

export default function AcademicView({ doc }) {
  if (!doc) return null;

  const runningHeadTitle = (doc.title || 'MANUSCRIPT').toUpperCase().slice(0, 50);

  return (
    <div className="academic-paper">
      {/* Running Head */}
      <div className="academic-running-head">
        <span className="running-head-left">{runningHeadTitle}</span>
        <span className="running-head-right">1</span>
      </div>

      {/* Title & Author Block */}
      <div className="academic-title-block">
        <h1 className="academic-title">{doc.title}</h1>
        
        <div className="academic-author-info">
          {doc.authors && doc.authors.length > 0 ? (
            doc.authors.map((a, idx) => (
              <div key={idx} className="academic-author-line">
                <span className="academic-author-name">{a.name}</span>
                {a.affiliation && <div className="academic-author-affil">{a.affiliation}</div>}
              </div>
            ))
          ) : (
            <div className="academic-author-line">
              <span className="academic-author-name">Researcher Name</span>
              <div className="academic-author-affil">Department of Psychology, Graduate Division</div>
            </div>
          )}

          {doc.subtitle ? (
            <div className="academic-metadata-lines">
              {doc.subtitle.split('|').map((part, pIdx) => (
                <div key={pIdx} className="academic-meta-line">{part.trim()}</div>
              ))}
            </div>
          ) : (
            <div className="academic-metadata-lines">
              <div className="academic-meta-line">Faculty of Arts and Sciences</div>
              <div className="academic-meta-line">Fall Term 2026</div>
            </div>
          )}
        </div>
      </div>

      {/* Abstract Block (APA 7th Edition style) */}
      {doc.abstract && (
        <div className="academic-abstract-section">
          <h2 className="academic-h1-centered">Abstract</h2>
          <p className="academic-abstract-p">{doc.abstract}</p>
          {doc.keywords && doc.keywords.length > 0 && (
            <div className="academic-keywords-p">
              <em>Keywords:</em> {doc.keywords.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Body Sections */}
      <div className="academic-body">
        {doc.sections && doc.sections.map((sec, idx) => {
          return (
            <section key={sec.id || idx} className="academic-section">
              {/* APA Level 1 Heading: Centered, Bold */}
              <h2 className="academic-h1-centered">{sec.cleanTitle || sec.title}</h2>

              {sec.items && sec.items.map((item, itemIdx) => {
                if (item.type === 'paragraph') {
                  return (
                    <p key={itemIdx} className="academic-p-indented">
                      {item.content}
                    </p>
                  );
                }
                if (item.type === 'list') {
                  return (
                    <ul key={itemIdx} className="academic-list">
                      {item.items.map((li, lIdx) => (
                        <li key={lIdx}>{li.replace(/^[-*•\d\.\)]\s*/, '')}</li>
                      ))}
                    </ul>
                  );
                }
                if (item.type === 'equation') {
                  return (
                    <div key={itemIdx} className="academic-equation-box">
                      <span className="academic-eq-content">{item.content}</span>
                      <span className="academic-eq-num">({itemIdx + 1})</span>
                    </div>
                  );
                }
                if (item.type === 'table') {
                  return (
                    <div key={itemIdx} className="academic-table-container">
                      <div className="academic-table-num">Table {itemIdx + 1}</div>
                      <div className="academic-table-title"><em>{item.title || 'Empirical Evaluation Summary'}</em></div>
                      <table className="academic-table">
                        {item.headers && item.headers.length > 0 && (
                          <thead>
                            <tr>
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
                      <div className="academic-table-note"><em>Note.</em> Data collected across experimental conditions with p &lt; .05 significance.</div>
                    </div>
                  );
                }
                if (item.type === 'figure') {
                  return (
                    <div key={itemIdx} className="academic-figure-box">
                      <div className="academic-figure-placeholder">[ Figure Visual ]</div>
                      <div className="academic-figure-caption">
                        <em>Figure {itemIdx + 1}.</em> {item.caption.replace(/^(?:fig(?:ure)?\.?)\s*[\dIVXLCDM]+[\.:\s\-]+/i, '')}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </section>
          );
        })}

        {/* References with APA Hanging Indent */}
        {doc.references && doc.references.length > 0 && (
          <section className="academic-references-section">
            <h2 className="academic-h1-centered">References</h2>
            <div className="academic-ref-list">
              {doc.references.map((ref, idx) => (
                <div key={idx} className="academic-ref-hanging">
                  {ref.text}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
