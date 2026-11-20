import React, { useState } from 'react';
import { Columns, SplitSquareVertical, Type, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function IEEEView({ doc, defaultColumns = 2 }) {
  const [columns, setColumns] = useState(defaultColumns); // 1 | 2 | 3
  const [ieeeVariant, setIeeeVariant] = useState('conference'); // 'conference' | 'journal'
  const [dropCap, setDropCap] = useState(true);
  const [showDivider, setShowDivider] = useState(false);
  const [showNotice, setShowNotice] = useState(true);

  if (!doc) return null;

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Format heading text according to IEEE rules
  const formatSectionHeading = (sec, secIdx) => {
    const rawClean = (sec.cleanTitle || sec.title || '').trim();
    const upper = rawClean.toUpperCase();

    // References and Acknowledgments don't receive Roman numerals in IEEE
    if (upper === 'REFERENCES' || upper === 'ACKNOWLEDGMENT' || upper === 'ACKNOWLEDGMENTS') {
      return upper;
    }

    if (sec.level === 1) {
      const romanMatch = sec.title.match(/^([IVXLCDM]+)\.\s+/i);
      const roman = romanMatch ? romanMatch[1].toUpperCase() : (romanNumerals[secIdx] || `${secIdx + 1}`);
      return `${roman}. ${rawClean.toUpperCase()}`;
    } else if (sec.level === 2) {
      const letterMatch = sec.title.match(/^([A-Z])\.\s+/);
      const letter = letterMatch ? letterMatch[1] : (alphabet[secIdx % 26] || 'A');
      return `${letter}. ${rawClean}`;
    } else {
      return `1) ${rawClean}:`;
    }
  };

  // Helper to render first paragraph with authentic IEEE Drop-Cap
  const renderParagraph = (text, isFirstPara) => {
    if (dropCap && isFirstPara && text && text.length > 25) {
      const match = text.match(/^([A-Za-z])([A-Za-z]+|\b)(.*)$/s);
      if (match) {
        const firstLetter = match[1];
        const restOfFirstWord = match[2];
        const remainder = match[3];

        return (
          <p className="ieee-paragraph ieee-para-with-dropcap">
            <span className="ieee-drop-cap">{firstLetter}</span>
            <span className="ieee-first-word-caps">{restOfFirstWord}</span>
            {remainder}
          </p>
        );
      }
    }

    return <p className="ieee-paragraph">{text}</p>;
  };

  return (
    <div className="ieee-view-container">
      {/* IEEE Interactive Format Optimizer Toolbar */}
      <div className="ieee-quick-toolbar">
        <div className="ieee-toolbar-group">
          <span className="ieee-toolbar-label">
            <Columns size={13} /> Layout Columns:
          </span>
          <div className="ieee-toggle-pill">
            <button
              className={`ieee-pill-btn ${columns === 1 ? 'active' : ''}`}
              onClick={() => setColumns(1)}
              title="1 Column: IEEE Journal Review / Technical Report / Draft"
            >
              1 Column
            </button>
            <button
              className={`ieee-pill-btn ${columns === 2 ? 'active' : ''}`}
              onClick={() => setColumns(2)}
              title="2 Columns: Standard IEEE Conference & Transactions Proceedings"
            >
              2 Columns (Std)
            </button>
            <button
              className={`ieee-pill-btn ${columns === 3 ? 'active' : ''}`}
              onClick={() => setColumns(3)}
              title="3 Columns: IEEE Magazine / Compact Digest"
            >
              3 Columns
            </button>
          </div>
        </div>

        <div className="ieee-toolbar-divider"></div>

        <div className="ieee-toolbar-group">
          <span className="ieee-toolbar-label">
            <BookOpen size={13} /> IEEE Style:
          </span>
          <select
            className="ieee-toolbar-select"
            value={ieeeVariant}
            onChange={(e) => setIeeeVariant(e.target.value)}
          >
            <option value="conference">Conference Proceedings</option>
            <option value="journal">Transactions & Journals</option>
          </select>
        </div>

        <div className="ieee-toolbar-divider"></div>

        <div className="ieee-toolbar-group">
          <label className="ieee-checkbox-label">
            <input
              type="checkbox"
              checked={dropCap}
              onChange={(e) => setDropCap(e.target.checked)}
            />
            <span>Drop Cap (\IEEEPARstart)</span>
          </label>

          <label className="ieee-checkbox-label">
            <input
              type="checkbox"
              checked={showDivider}
              onChange={(e) => setShowDivider(e.target.checked)}
            />
            <span>Column Line</span>
          </label>

          <label className="ieee-checkbox-label">
            <input
              type="checkbox"
              checked={showNotice}
              onChange={(e) => setShowNotice(e.target.checked)}
            />
            <span>IEEE Header/Notice</span>
          </label>
        </div>
      </div>

      {/* Realistic IEEE Printable Paper */}
      <div className={`ieee-paper variant-${ieeeVariant}`}>
        {/* IEEE Running Header */}
        {showNotice && (
          <div className="ieee-running-header">
            {ieeeVariant === 'journal' ? (
              <span>IEEE TRANSACTIONS ON PATTERN ANALYSIS AND MACHINE INTELLIGENCE, VOL. 44, NO. 10, OCTOBER 2026</span>
            ) : (
              <span>2026 IEEE INTERNATIONAL CONFERENCE ON SYSTEM ARCHITECTURES AND EDGE COMPUTING (ICSA)</span>
            )}
            <span className="ieee-page-num">1</span>
          </div>
        )}

        {/* IEEE Header (Spans full page width) */}
        <header className="ieee-header">
          <h1 className="ieee-title">{doc.title}</h1>

          {/* Authors Grid (Side-by-side author blocks) */}
          <div className="ieee-authors">
            {doc.authors && doc.authors.length > 0 ? (
              doc.authors.map((author, idx) => (
                <div key={idx} className="ieee-author-block">
                  <div className="ieee-author-name">{author.name}</div>
                  <div className="ieee-author-dept">
                    <em>{author.affiliation || 'Department of Computer Science'}</em>
                  </div>
                  {author.email && (
                    <div className="ieee-author-email">{author.email}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="ieee-author-block">
                <div className="ieee-author-name">Author Name</div>
                <div className="ieee-author-dept"><em>University Department & Institution</em></div>
                <div className="ieee-author-email">author@university.edu</div>
              </div>
            )}
          </div>

          {/* Abstract and Index Terms (Spanning Banner) */}
          <div className={`ieee-meta-banner ${columns === 1 ? 'single-col-abstract' : ''}`}>
            {doc.abstract && (
              <div className="ieee-abstract">
                <span className="ieee-lead-term">Abstract—</span>
                {doc.abstract}
              </div>
            )}
            {doc.keywords && doc.keywords.length > 0 && (
              <div className="ieee-keywords">
                <span className="ieee-lead-term">Index Terms—</span>
                {doc.keywords.join(', ')}
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Column Body Content (1, 2, or 3 columns) */}
        <div
          className={`ieee-body-columns cols-${columns} ${showDivider ? 'has-rule' : ''}`}
          style={{
            columnCount: columns,
            columnGap: columns === 3 ? '18px' : '24px',
            columnRule: showDivider ? '1px solid #e2e8f0' : 'none'
          }}
        >
          {doc.sections && doc.sections.map((sec, secIdx) => {
            const isRefSec = (sec.cleanTitle || sec.title || '').toUpperCase() === 'REFERENCES';
            if (isRefSec) return null; // Rendered at bottom

            const headingText = formatSectionHeading(sec, secIdx);
            const isHeadingLevel2 = sec.level === 2;
            const isHeadingLevel3 = sec.level >= 3;

            return (
              <section key={sec.id || secIdx} className="ieee-section">
                {isHeadingLevel2 ? (
                  <h3 className="ieee-h2">{headingText}</h3>
                ) : isHeadingLevel3 ? (
                  <h4 className="ieee-h3">{headingText}</h4>
                ) : (
                  <h2 className="ieee-h1">{headingText}</h2>
                )}

                {sec.items && sec.items.map((item, itemIdx) => {
                  const isFirstEverPara = secIdx === 0 && itemIdx === 0 && item.type === 'paragraph';

                  if (item.type === 'paragraph') {
                    return (
                      <React.Fragment key={itemIdx}>
                        {renderParagraph(item.content, isFirstEverPara)}
                      </React.Fragment>
                    );
                  }

                  if (item.type === 'list') {
                    return (
                      <ul key={itemIdx} className="ieee-list">
                        {item.items.map((li, liIdx) => (
                          <li key={liIdx}>{li.replace(/^[-*•\d.)]\s*/, '')}</li>
                        ))}
                      </ul>
                    );
                  }

                  if (item.type === 'equation') {
                    return (
                      <div key={itemIdx} className="ieee-equation-container">
                        <div className="ieee-equation">
                          <em>{item.content}</em>
                        </div>
                        <div className="ieee-equation-number">({itemIdx + 1})</div>
                      </div>
                    );
                  }

                  if (item.type === 'table') {
                    const isWideTable = item.headers && item.headers.length >= 4;
                    return (
                      <div
                        key={itemIdx}
                        className={`ieee-table-box ${isWideTable && columns > 1 ? 'ieee-wide-item' : ''}`}
                      >
                        <div className="ieee-table-caption-label">
                          TABLE {romanNumerals[itemIdx] || (itemIdx + 1)}
                        </div>
                        <div className="ieee-table-caption-title">
                          {(item.title || 'Summary of Experimental Results').toUpperCase()}
                        </div>
                        <table className="ieee-table">
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
                      <div key={itemIdx} className="ieee-figure-box">
                        <div className="ieee-figure-placeholder">
                          <div className="ieee-fig-diagram-sample">
                            <span className="fig-label-badge">IEEE Standard Vector Diagram</span>
                            <div className="fig-wire-mesh">
                              <div className="mesh-bar" style={{ height: '65%' }}></div>
                              <div className="mesh-bar" style={{ height: '85%' }}></div>
                              <div className="mesh-bar" style={{ height: '45%' }}></div>
                              <div className="mesh-bar" style={{ height: '95%' }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="ieee-figure-caption">
                          <strong>Fig. {itemIdx + 1}.</strong> {item.caption.replace(/^(?:fig(?:ure)?\.?)\s*[\dIVXLCDM]+[\.:\s\-]+/i, '')}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </section>
            );
          })}

          {/* References in IEEE Column with hanging indentation */}
          {doc.references && doc.references.length > 0 && (
            <section className="ieee-section ieee-references-section">
              <h2 className="ieee-h1">REFERENCES</h2>
              <div className="ieee-references-list">
                {doc.references.map((ref, idx) => (
                  <div key={ref.id || idx} className="ieee-ref-item">
                    <span className="ieee-ref-num">[{idx + 1}]</span>
                    <span className="ieee-ref-text">{ref.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* IEEE Bottom Footer / Copyright Notice */}
        {showNotice && (
          <div className="ieee-copyright-footer">
            <div className="ieee-footnote-text">
              979-8-3503-8822-2/26/$31.00 ©2026 IEEE. Personal use of this material is permitted. Permission from IEEE must be obtained for all other uses.
            </div>
            <div className="ieee-manuscript-stamp">
              Manuscript received March 15, 2026; revised July 20, 2026; accepted October 12, 2026.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
