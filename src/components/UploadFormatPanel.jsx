import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Sparkles, Layers, Type, AlignLeft, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { readFileContent } from '../utils/fileReader';
import { analyzeReferenceDocument } from '../utils/formatAnalyzer';
import { SAMPLE_REFERENCE_FORMATS } from '../utils/sampleDocs';

export default function UploadFormatPanel({ currentProfile, onProfileLoaded }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    setErrorMsg('');

    try {
      const { text, fileName } = await readFileContent(file);
      const analyzedProfile = analyzeReferenceDocument(text, fileName);
      onProfileLoaded(analyzedProfile);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not analyze file format. Please try another file or select a preset template.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = (sample) => {
    onProfileLoaded(sample.styleProfile);
  };

  return (
    <div className="upload-format-panel">
      {/* Upload Zone & Quick Presets Header */}
      <div className="upload-panel-banner">
        <div className="banner-badge-row">
          <span className="ai-analyzer-tag">
            <Sparkles size={13} /> Neural Format Cloner & Structural Analyzer
          </span>
          <span className="file-types-supported">
            Accepts: .doc, .docx, .pdf, .txt, .md
          </span>
        </div>
        <h3 className="banner-title">Upload Reference Document to Clone Its Strict Format</h3>
        <p className="banner-desc">
          Upload any existing paper, journal, or template. Our analyzer extracts layout geometry, typography hierarchy, heading numbering, column balance, margins, and citation syntax, then strictly applies them to your document.
        </p>
      </div>

      <div className="upload-panel-body-grid">
        {/* Left Side: Upload Dropzone & Sample Reference Picker */}
        <div className="upload-dropzone-col">
          <div
            className={`reference-dropzone ${dragActive ? 'drag-over' : ''} ${isAnalyzing ? 'analyzing' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="refFileInput"
              className="hidden-file-input"
              accept=".doc,.docx,.pdf,.txt,.md"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
            />
            <label htmlFor="refFileInput" className="dropzone-label">
              <div className="dropzone-icon-box">
                {isAnalyzing ? (
                  <RefreshCw size={28} className="animate-spin text-rose-500" />
                ) : (
                  <UploadCloud size={28} className="text-rose-500" />
                )}
              </div>
              <div className="dropzone-text">
                <span className="drop-main-text">
                  {isAnalyzing ? 'Deconstructing Document Architecture...' : 'Click to Browse or Drag Reference Document'}
                </span>
                <span className="drop-sub-text">
                  Upload .doc, .docx, .pdf, or .txt to clone
                </span>
              </div>
            </label>
          </div>

          {errorMsg && <div className="error-alert-banner">{errorMsg}</div>}

          {/* Quick Presets for Instant 1-Click Verification */}
          <div className="sample-presets-box">
            <span className="presets-label">Or test immediately with pre-analyzed reference documents:</span>
            <div className="presets-list">
              {SAMPLE_REFERENCE_FORMATS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSampleSelect(sample)}
                  className={`preset-item-btn ${currentProfile && currentProfile.name.includes(sample.name) ? 'active' : ''}`}
                >
                  <div className="preset-item-info">
                    <span className="preset-item-name">{sample.name}</span>
                    <span className="preset-item-badge">{sample.badge}</span>
                  </div>
                  <ArrowRight size={14} className="preset-arrow" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Live Analyzed Format Signature Inspector */}
        <div className="format-audit-card">
          <div className="audit-card-header">
            <div>
              <span className="audit-eyebrow">ANALYSIS RESULT</span>
              <h4 className="audit-card-title">
                {currentProfile ? currentProfile.name : 'Awaiting Reference Document'}
              </h4>
            </div>
            {currentProfile && (
              <div className="confidence-meter">
                <span className="meter-label">Clone Confidence</span>
                <span className="meter-val">{currentProfile.confidenceScore || 96}%</span>
              </div>
            )}
          </div>

          {currentProfile ? (
            <div className="audit-extracted-details">
              <div className="extracted-tokens-grid">
                <div className="token-chip">
                  <Type size={13} className="token-icon" />
                  <span className="token-label">Typeface:</span>
                  <strong className="token-val">{currentProfile.fontFamily.split(',')[0].replace(/['"]/g, '')}</strong>
                </div>
                <div className="token-chip">
                  <Layers size={13} className="token-icon" />
                  <span className="token-label">Layout:</span>
                  <strong className="token-val">{currentProfile.columns === 2 ? 'Two Columns' : 'Single Column'}</strong>
                </div>
                <div className="token-chip">
                  <AlignLeft size={13} className="token-icon" />
                  <span className="token-label">Alignment:</span>
                  <strong className="token-val">{currentProfile.textAlign.toUpperCase()}</strong>
                </div>
                <div className="token-chip">
                  <ShieldCheck size={13} className="token-icon" />
                  <span className="token-label">Citations:</span>
                  <strong className="token-val">{currentProfile.citationStyle.toUpperCase()}</strong>
                </div>
              </div>

              <div className="audit-rules-breakdown">
                <span className="rules-heading">Detected Structural Rules Applied:</span>
                <ul className="rules-list">
                  {(currentProfile.detectedAttributes || []).map((attr, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>{attr}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="strict-applied-alert">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>
                  <strong>Strict Match Active:</strong> Your unformatted document is currently displayed with this exact cloned format.
                </span>
              </div>
            </div>
          ) : (
            <div className="audit-empty-state">
              <FileText size={32} className="text-slate-300" />
              <p>Upload a file or choose a preset on the left to see live format extraction tokens.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
