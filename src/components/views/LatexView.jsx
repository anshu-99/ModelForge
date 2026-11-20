import React, { useState } from 'react';
import { generateLatexCode, generateBibtex } from '../../utils/latexGenerator';
import { 
  Copy, 
  Check, 
  Download, 
  Code, 
  Eye, 
  BookMarked, 
  Columns, 
  ExternalLink,
  Sparkles,
  FileCode
} from 'lucide-react';

export default function LatexView({ doc, defaultColumns = 2 }) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'source' | 'bibtex'
  const [template, setTemplate] = useState('ieee'); // 'ieee' | 'ieee-journal' | 'article' | 'report'
  const [columns, setColumns] = useState(defaultColumns); // 1 | 2 | 3
  const [dropCap, setDropCap] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  // Generate real-time LaTeX code based on selected template, columns & drop-cap
  const latexCode = generateLatexCode(doc, {
    template,
    columns,
    dropCap
  });

  // Generate companion BibTeX code
  const bibtexCode = generateBibtex(doc);

  const activeContentToCopy = activeTab === 'bibtex' ? bibtexCode : latexCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTex = () => {
    const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(doc.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_')}_${template}_${columns}col.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBib = () => {
    const blob = new Blob([bibtexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(doc.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_')}_references.bib`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTemplateChange = (newTpl) => {
    setTemplate(newTpl);
    if (newTpl === 'ieee-onecol') {
      setColumns(1);
    } else if (newTpl === 'ieee' || newTpl === 'ieee-journal') {
      if (columns === 1) setColumns(2);
    }
  };

  return (
    <div className="latex-view-container">
      {/* Top LaTeX Control & Optimization Bar */}
      <div className="latex-toolbar">
        <div className="latex-toolbar-left">
          {/* Sub-view Switcher Pills */}
          <div className="latex-pill-toggle">
            <button
              className={`pill-btn ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={14} /> Rendered Preview
            </button>
            <button
              className={`pill-btn ${activeTab === 'source' ? 'active' : ''}`}
              onClick={() => setActiveTab('source')}
            >
              <Code size={14} /> LaTeX Source (.tex)
            </button>
            <button
              className={`pill-btn ${activeTab === 'bibtex' ? 'active' : ''}`}
              onClick={() => setActiveTab('bibtex')}
            >
              <BookMarked size={14} /> BibTeX (.bib)
            </button>
          </div>

          <div className="latex-toolbar-sep"></div>

          {/* Template Selection */}
          <div className="latex-template-select">
            <span className="template-label">Class:</span>
            <select
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="latex-select"
            >
              <option value="ieee">IEEEtran Conference (Standard)</option>
              <option value="ieee-journal">IEEEtran Journal / Transactions</option>
              <option value="ieee-onecol">IEEEtran Single Column (Draft)</option>
              <option value="article">Standard Article (11pt, A4)</option>
              <option value="report">Multi-column Report (multicol)</option>
            </select>
          </div>

          <div className="latex-toolbar-sep"></div>

          {/* Column Layout Selection */}
          <div className="latex-column-select-group">
            <span className="template-label">
              <Columns size={13} /> Columns:
            </span>
            <div className="latex-col-pills">
              <button
                className={`latex-col-pill ${columns === 1 ? 'active' : ''}`}
                onClick={() => setColumns(1)}
                title="1 Column: Full width manuscript"
              >
                1 Col
              </button>
              <button
                className={`latex-col-pill ${columns === 2 ? 'active' : ''}`}
                onClick={() => setColumns(2)}
                title="2 Columns: Standard IEEE proceedings & journal layout"
              >
                2 Cols
              </button>
              <button
                className={`latex-col-pill ${columns === 3 ? 'active' : ''}`}
                onClick={() => setColumns(3)}
                title="3 Columns: Multi-column digest using \\usepackage{multicol}"
              >
                3 Cols
              </button>
            </div>
          </div>

          <div className="latex-toolbar-sep"></div>

          <div className="latex-dropcap-toggle">
            <label className="ieee-checkbox-label">
              <input
                type="checkbox"
                checked={dropCap}
                onChange={(e) => setDropCap(e.target.checked)}
              />
              <span>Drop Cap</span>
            </label>
          </div>
        </div>

        {/* Right Action Tools: Copy, Download, Overleaf */}
        <div className="latex-toolbar-right">
          <button className="latex-action-btn" onClick={handleCopy}>
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : activeTab === 'bibtex' ? 'Copy .bib' : 'Copy .tex'}</span>
          </button>

          <button className="latex-action-btn" onClick={handleDownloadTex} title="Download ready-to-compile .tex file">
            <Download size={14} />
            <span>.tex</span>
          </button>

          <button className="latex-action-btn" onClick={handleDownloadBib} title="Download .bib bibliography file">
            <BookMarked size={14} />
            <span>.bib</span>
          </button>

          {/* 1-Click Open Directly in Overleaf */}
          <form
            action="https://www.overleaf.com/docs"
            method="POST"
            target="_blank"
            className="overleaf-form"
          >
            <input type="hidden" name="snip" value={latexCode} />
            <button
              type="submit"
              className="latex-action-btn overleaf-btn"
              title="Instantly open this document in Overleaf Cloud LaTeX Editor"
            >
              <ExternalLink size={13} />
              <span>Overleaf</span>
            </button>
          </form>
        </div>
      </div>

      {/* 1. RENDERED PREVIEW TAB */}
      {activeTab === 'preview' && (
        <div className="latex-rendered-sheet">
          <div className="latex-header-meta">
            <div className="meta-left">
              <span className="latex-class-badge">
                {template.startsWith('ieee') ? (
                  columns === 1 ? '\\documentclass[12pt,draftclsnofoot,onecolumn]{IEEEtran}' :
                  columns === 3 ? '\\documentclass[conference]{IEEEtran} + \\usepackage{multicol}' :
                  '\\documentclass[conference]{IEEEtran}'
                ) : (
                  columns === 2 ? '\\documentclass[11pt,a4paper,twocolumn]{article}' :
                  columns === 3 ? '\\documentclass[11pt,a4paper]{article} + \\usepackage{multicol}' :
                  '\\documentclass[11pt,a4paper]{article}'
                )}
              </span>
              <span className="latex-column-badge">{columns} Column{columns > 1 ? 's' : ''} Active</span>
            </div>
            <span className="latex-status-text">Fully Compliant LaTeX 2e • Direct Overleaf Sync</span>
          </div>

          <h1 className="latex-doc-title">{doc.title}</h1>

          {/* Authors Block */}
          <div className="latex-author-block">
            {doc.authors && doc.authors.length > 0 ? (
              doc.authors.map((a, idx) => (
                <div key={idx} className="latex-author-item">
                  <div className="latex-author-name">{a.name}</div>
                  <div className="latex-author-affil">{a.affiliation || 'Department of Computer Science'}</div>
                  {a.email && <div className="latex-author-email">{a.email}</div>}
                </div>
              ))
            ) : (
              <div className="latex-author-item">
                <div className="latex-author-name">Author Name</div>
                <div className="latex-author-affil">University Department, Institution</div>
                <div className="latex-author-email">author@univ.edu</div>
              </div>
            )}
          </div>

          {/* Abstract */}
          {doc.abstract && (
            <div className={`latex-abstract-box ${columns === 1 ? 'latex-abs-single-col' : ''}`}>
              <div className="latex-abstract-title">Abstract</div>
              <p className="latex-abstract-text">{doc.abstract}</p>
            </div>
          )}

          {/* Keywords */}
          {doc.keywords && doc.keywords.length > 0 && (
            <div className="latex-keywords-line">
              <strong>Keywords:</strong> {doc.keywords.join(', ')}
            </div>
          )}

          {/* Body Content in 1, 2, or 3 Columns */}
          <div
            className={`latex-body-content cols-${columns}`}
            style={{
              columnCount: columns,
              columnGap: columns === 3 ? '18px' : '24px'
            }}
          >
            {doc.sections && doc.sections.map((sec, idx) => {
              const isRef = (sec.cleanTitle || sec.title || '').toUpperCase() === 'REFERENCES';
              if (isRef) return null;

              return (
                <div key={idx} className="latex-section-block">
                  {sec.level === 2 ? (
                    <h3 className="latex-sec-subheading">
                      {idx + 1}.1 {sec.cleanTitle || sec.title}
                    </h3>
                  ) : sec.level >= 3 ? (
                    <h4 className="latex-sec-subsubheading">
                      {idx + 1}.1.1 {sec.cleanTitle || sec.title}
                    </h4>
                  ) : (
                    <h2 className="latex-sec-heading">
                      {idx + 1}. {sec.cleanTitle || sec.title}
                    </h2>
                  )}

                  {sec.items && sec.items.map((item, itemIdx) => {
                    const isFirstPara = idx === 0 && itemIdx === 0 && item.type === 'paragraph';

                    if (item.type === 'paragraph') {
                      if (dropCap && isFirstPara && item.content.length > 25) {
                        const match = item.content.match(/^([A-Za-z])([A-Za-z]+|\b)(.*)$/s);
                        if (match) {
                          return (
                            <p key={itemIdx} className="latex-p latex-dropcap-para">
                              <span className="latex-drop-char">{match[1]}</span>
                              <span className="latex-drop-rest">{match[2]}</span>
                              {match[3]}
                            </p>
                          );
                        }
                      }
                      return <p key={itemIdx} className="latex-p">{item.content}</p>;
                    }

                    if (item.type === 'list') {
                      return (
                        <ul key={itemIdx} className="latex-item-list">
                          {item.items.map((li, lIdx) => (
                            <li key={lIdx}>{li.replace(/^[-*•\d.)]\s*/, '')}</li>
                          ))}
                        </ul>
                      );
                    }

                    if (item.type === 'equation') {
                      return (
                        <div key={itemIdx} className="latex-math-display">
                          <span className="latex-math-content">
                            <em>{item.content}</em>
                          </span>
                          <span className="latex-math-tag">({itemIdx + 1})</span>
                        </div>
                      );
                    }

                    if (item.type === 'table') {
                      const isWide = item.headers && item.headers.length >= 4;
                      return (
                        <div key={itemIdx} className={`latex-table-container ${isWide && columns > 1 ? 'latex-wide-table' : ''}`}>
                          <div className="latex-table-caption">
                            <strong>Table {itemIdx + 1}:</strong> {item.title || 'Summary of Results'}
                          </div>
                          <table className="latex-booktabs-table">
                            {item.headers && (
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
                        <div key={itemIdx} className="latex-fig-container">
                          <div className="latex-fig-graphic">
                            <span className="fig-box-text">[ LaTeX Vector Graphics / \includegraphics ]</span>
                          </div>
                          <div className="latex-fig-caption">
                            <strong>Figure {itemIdx + 1}:</strong> {item.caption.replace(/^(?:fig(?:ure)?\.?)\s*[\dIVXLCDM]+[\.:\s\-]+/i, '')}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              );
            })}

            {/* References */}
            {doc.references && doc.references.length > 0 && (
              <div className="latex-bib-section">
                <h2 className="latex-sec-heading">References</h2>
                <div className="latex-bib-items">
                  {doc.references.map((ref, idx) => (
                    <div key={idx} className="latex-bib-entry">
                      <span className="latex-bib-citekey">[{idx + 1}]</span>
                      <span className="latex-bib-text">{ref.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. LATEX SOURCE CODE TAB (.tex) */}
      {activeTab === 'source' && (
        <div className="latex-code-viewer">
          <div className="latex-code-header">
            <div className="code-header-left">
              <FileCode size={15} />
              <span>{template.startsWith('ieee') ? 'main_ieee.tex' : 'document.tex'}</span>
              <span className="code-pill-tag">{columns} Column{columns > 1 ? 's' : ''}</span>
              <span className="code-pill-tag">{template}</span>
            </div>
            <span className="code-header-right">Compilable in TeXLive, MikTeX & Overleaf</span>
          </div>
          <pre className="latex-pre-code">
            <code>
              {latexCode.split('\n').map((line, idx) => (
                <div key={idx} className="latex-code-row">
                  <span className="latex-line-num">{idx + 1}</span>
                  <span className="latex-line-text">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      )}

      {/* 3. BIBTEX CODE TAB (.bib) */}
      {activeTab === 'bibtex' && (
        <div className="latex-code-viewer">
          <div className="latex-code-header">
            <div className="code-header-left">
              <BookMarked size={15} />
              <span>references.bib</span>
              <span className="code-pill-tag">BibTeX Database</span>
            </div>
            <span className="code-header-right">{doc.references ? doc.references.length : 0} Parsed Citations</span>
          </div>
          <pre className="latex-pre-code">
            <code>
              {bibtexCode.split('\n').map((line, idx) => (
                <div key={idx} className="latex-code-row">
                  <span className="latex-line-num">{idx + 1}</span>
                  <span className="latex-line-text">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
