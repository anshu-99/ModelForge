import React, { useState } from 'react';
import { UploadCloud, FileEdit, BookOpen, Trash2, CheckCircle2, AlertCircle, Sparkles, FileText, ChevronDown } from 'lucide-react';
import { readFileContent } from '../utils/fileReader';
import { SAMPLE_DOCUMENTS } from '../utils/sampleDocs';

export default function DocumentInput({
  rawText,
  onChangeRawText,
  onLoadSample,
  docStats,
  activeSampleId
}) {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsProcessingFile(true);
    setStatusMsg('');

    try {
      const { text, fileName } = await readFileContent(file);
      onChangeRawText(text);
      setStatusMsg(`Loaded "${fileName}" successfully (${text.length} characters)`);
    } catch (err) {
      console.error(err);
      setStatusMsg('Error reading file. Please paste text directly.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="doc-input-container">
      {/* Input Header & Quick Samples */}
      <div className="input-toolbar-top">
        <div className="input-title-row">
          <div className="input-badge">
            <FileEdit size={13} /> Unformatted Document Input
          </div>
          <span className="input-help-tag">Supports .docx, .doc, .pdf, .txt, .md or direct paste</span>
        </div>

        {/* Sample Document Quick Loader Dropdown */}
        <div className="sample-picker-wrap">
          <span className="sample-picker-label">Load Test Draft:</span>
          <select
            className="sample-select"
            value={activeSampleId || ''}
            onChange={(e) => {
              const selected = SAMPLE_DOCUMENTS.find(s => s.id === e.target.value);
              if (selected) onLoadSample(selected);
            }}
          >
            <option value="" disabled>-- Select a Sample Document --</option>
            {SAMPLE_DOCUMENTS.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.category} — {sample.title.slice(0, 32)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drag & Drop File Zone */}
      <div
        className={`input-file-dropzone ${dragActive ? 'drag-over' : ''} ${isProcessingFile ? 'processing' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="docFileInput"
          className="hidden-file-input"
          accept=".docx,.doc,.pdf,.txt,.md"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
        />
        <label htmlFor="docFileInput" className="input-dropzone-label">
          <UploadCloud size={20} className="text-blue-500 drop-icon" />
          <span className="drop-cta">
            <strong>Choose Document</strong> or drag & drop here (.docx, .doc, .pdf, .txt)
          </span>
        </label>
      </div>

      {statusMsg && (
        <div className="input-status-note">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Raw Text Editor */}
      <div className="input-textarea-wrapper">
        <textarea
          className="input-textarea"
          value={rawText}
          onChange={(e) => onChangeRawText(e.target.value)}
          placeholder="Paste your unformatted text, notes, research paper draft, or meeting notes here..."
          rows={14}
        />
      </div>

      {/* Real-Time Document Stats Footer */}
      <div className="input-stats-bar">
        <div className="stat-item">
          <span className="stat-label">Words</span>
          <strong className="stat-value">{docStats?.wordCount || 0}</strong>
        </div>
        <div className="stat-item">
          <span className="stat-label">Characters</span>
          <strong className="stat-value">{docStats?.charCount || 0}</strong>
        </div>
        <div className="stat-item">
          <span className="stat-label">Sections</span>
          <strong className="stat-value">{docStats?.sectionCount || 0}</strong>
        </div>
        <div className="stat-item">
          <span className="stat-label">References</span>
          <strong className="stat-value">{docStats?.refCount || 0}</strong>
        </div>
        <div className="stat-item">
          <span className="stat-label">Est. Read</span>
          <strong className="stat-value">{docStats?.readingTimeMin || 1} min</strong>
        </div>

        {rawText && (
          <button
            className="clear-input-btn"
            onClick={() => onChangeRawText('')}
            title="Clear input text"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
