import React from 'react';
import { Calendar, User, ShieldCheck, Tag, FileText, CheckCircle2 } from 'lucide-react';

export default function ProfessionalView({ doc }) {
  if (!doc) return null;

  return (
    <div className="professional-paper">
      {/* Executive Header Banner */}
      <div className="pro-header-card">
        <div className="pro-top-meta">
          <span className="pro-badge"><ShieldCheck size={13} /> Corporate Strategy & Architecture</span>
          <span className="pro-badge status"><CheckCircle2 size={13} /> Verified Format</span>
        </div>

        <h1 className="pro-title">{doc.title}</h1>
        {doc.subtitle && <p className="pro-subtitle">{doc.subtitle}</p>}

        <div className="pro-meta-grid">
          <div className="pro-meta-item">
            <span className="pro-meta-label"><User size={13} /> Author / Lead</span>
            <span className="pro-meta-val">
              {doc.authors && doc.authors.length > 0 ? doc.authors[0].name : 'Executive Team'}
            </span>
          </div>
          <div className="pro-meta-item">
            <span className="pro-meta-label"><FileText size={13} /> Organization</span>
            <span className="pro-meta-val">
              {doc.authors && doc.authors.length > 0 && doc.authors[0].affiliation ? doc.authors[0].affiliation : 'Global Enterprise Infrastructure'}
            </span>
          </div>
          <div className="pro-meta-item">
            <span className="pro-meta-label"><Calendar size={13} /> Published</span>
            <span className="pro-meta-val">October 2026</span>
          </div>
          <div className="pro-meta-item">
            <span className="pro-meta-label"><Tag size={13} /> Classification</span>
            <span className="pro-meta-val">Confidential / Internal</span>
          </div>
        </div>
      </div>

      {/* Executive Summary Callout */}
      {doc.abstract && (
        <div className="pro-exec-summary">
          <div className="pro-exec-tag">Executive Summary</div>
          <p className="pro-exec-text">{doc.abstract}</p>
        </div>
      )}

      {/* Document Sections */}
      <div className="pro-sections">
        {doc.sections && doc.sections.map((sec, idx) => {
          const paddedIdx = String(idx + 1).padStart(2, '0');
          return (
            <section key={sec.id || idx} className="pro-section">
              <div className="pro-sec-header">
                <span className="pro-sec-num">{paddedIdx}</span>
                <h2 className="pro-sec-title">{sec.cleanTitle || sec.title}</h2>
              </div>

              <div className="pro-sec-content">
                {sec.items && sec.items.map((item, itemIdx) => {
                  if (item.type === 'paragraph') {
                    return <p key={itemIdx} className="pro-paragraph">{item.content}</p>;
                  }
                  if (item.type === 'list') {
                    return (
                      <div key={itemIdx} className="pro-list-card">
                        {item.items.map((li, lIdx) => (
                          <div key={lIdx} className="pro-list-item">
                            <span className="pro-bullet-dot"></span>
                            <span>{li.replace(/^[-*•\d\.\)]\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (item.type === 'equation') {
                    return (
                      <div key={itemIdx} className="pro-metric-callout">
                        <span className="pro-metric-label">Operational Formula / Criterion</span>
                        <div className="pro-metric-math">{item.content}</div>
                      </div>
                    );
                  }
                  if (item.type === 'table') {
                    return (
                      <div key={itemIdx} className="pro-table-wrapper">
                        <div className="pro-table-heading">{item.title || 'Performance & KPI Metrics'}</div>
                        <table className="pro-table">
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
                      </div>
                    );
                  }
                  if (item.type === 'figure') {
                    return (
                      <div key={itemIdx} className="pro-figure-card">
                        <div className="pro-figure-placeholder">Enterprise Architecture Blueprint Visual</div>
                        <div className="pro-figure-cap">{item.caption}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </section>
          );
        })}

        {/* References / Sources */}
        {doc.references && doc.references.length > 0 && (
          <section className="pro-section pro-references-sec">
            <div className="pro-sec-header">
              <span className="pro-sec-num">REF</span>
              <h2 className="pro-sec-title">References & Strategic Sources</h2>
            </div>
            <div className="pro-ref-list">
              {doc.references.map((ref, idx) => (
                <div key={idx} className="pro-ref-row">
                  <span className="pro-ref-index">[{idx + 1}]</span>
                  <span className="pro-ref-text">{ref.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Professional Footer */}
      <footer className="pro-footer">
        <div className="pro-footer-left">Strictly Confidential — For Internal Distribution Only</div>
        <div className="pro-footer-right">Page 1 of 1</div>
      </footer>
    </div>
  );
}
