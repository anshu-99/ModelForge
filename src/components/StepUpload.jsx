import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Sparkles, AlertCircle, Database, Layers, CheckCircle2, Search, ArrowRight } from 'lucide-react';

export default function StepUpload({
  datasetData,
  onUploadFile,
  onLoadSample,
  onProceed,
  loading,
  error
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [colSearch, setColSearch] = useState('');
  const fileInputRef = useRef(null);

  const samples = [
    { id: 'titanic', label: 'Titanic (Classification)', task: 'Binary Classif.', badge: 'badge-blue' },
    { id: 'iris', label: 'Iris Flower (Multiclass)', task: 'Multiclass', badge: 'badge-purple' },
    { id: 'housing', label: 'California Housing (Regression)', task: 'Continuous', badge: 'badge-green' },
    { id: 'wine', label: 'Wine Quality (Multiclass)', task: 'Multiclass', badge: 'badge-purple' },
    { id: 'breast_cancer', label: 'Breast Cancer (High Dim)', task: 'Binary Classif.', badge: 'badge-blue' },
    { id: 'customers', label: 'Mall Customers (Clustering)', task: 'Clustering', badge: 'badge-amber' }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  // Preview filtering
  const previewRows = datasetData?.preview || [];
  const allColumns = datasetData?.columns || [];
  const filteredColumns = colSearch.trim()
    ? allColumns.filter(c => c.toLowerCase().includes(colSearch.toLowerCase()))
    : allColumns;

  // Metadata calculations
  const eda = datasetData?.eda;
  const totalRows = eda?.n_rows || previewRows.length;
  const totalCols = eda?.n_cols || allColumns.length;
  const memoryMb = eda?.memory_mb || '0.1';
  const duplicateRows = eda?.duplicate_rows ?? 0;

  // Missing values %
  let totalCells = totalRows * totalCols;
  let missingCells = 0;
  if (eda?.columns) {
    missingCells = eda.columns.reduce((acc, c) => acc + (c.null_count || 0), 0);
  }
  const missingPct = totalCells > 0 ? ((missingCells / totalCells) * 100).toFixed(1) : '0.0';

  return (
    <div>
      {/* Top Banner / Upload Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '28px' }}>
        {/* Drag & Drop Area */}
        <div
          className="mf-card"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging ? '2px dashed var(--brand-primary)' : '2px dashed var(--border-app)',
            background: isDragging ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card)',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".csv,.xlsx,.xls,.json"
            style={{ display: 'none' }}
          />

          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)'
          }}>
            <Upload size={26} />
          </div>

          <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px' }}>
            Upload your Dataset
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', maxWidth: '360px' }}>
            Drag and drop your file here, or click to browse. Supports CSV, XLSX, and JSON files up to 100 MB.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-blue">CSV</span>
            <span className="badge badge-purple">Excel (XLSX)</span>
            <span className="badge badge-green">JSON</span>
          </div>

          {loading && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: '600' }}>
              <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span>Analyzing dataset & profiling schema...</span>
            </div>
          )}
        </div>

        {/* Quick Sample Datasets Card */}
        <div className="mf-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={18} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>
                Instant Test Datasets
              </h3>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Try ModelForge instantly with curated real-world benchmark datasets:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onLoadSample(s.id)}
                  disabled={loading}
                  className="btn-secondary"
                  style={{
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: 'var(--bg-card-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={14} color="var(--brand-primary)" />
                    <span style={{ fontWeight: '600' }}>{s.label}</span>
                  </div>
                  <span className={`badge ${s.badge}`} style={{ fontSize: '11px', padding: '2px 6px' }}>
                    {s.task}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-danger-bg)',
              color: 'var(--accent-danger)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Overview & Preview (Shows when loaded) */}
      {datasetData && (
        <div className="mf-card" style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-app)',
            paddingBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="var(--accent-success)" />
                <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>
                  Dataset Profile: {datasetData.name}
                </h3>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 28px' }}>
                Successfully loaded and verified schema for modeling.
              </p>
            </div>

            <button
              onClick={onProceed}
              className="btn-primary"
              style={{ padding: '10px 22px' }}
            >
              <span>Configure Pipeline</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-app)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Total Rows</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--brand-primary)', marginTop: '4px' }}>
                {totalRows.toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-app)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Total Features</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                {totalCols}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-app)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Memory Footprint</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                {memoryMb} MB
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-app)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Missing Values</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: missingPct > 0 ? 'var(--accent-warning)' : 'var(--accent-success)', marginTop: '4px' }}>
                {missingPct}%
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-app)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Duplicate Rows</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: duplicateRows > 0 ? 'var(--accent-danger)' : 'var(--text-primary)', marginTop: '4px' }}>
                {duplicateRows}
              </div>
            </div>
          </div>

          {/* Interactive Preview Table Header & Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} color="var(--brand-primary)" />
              <span style={{ fontSize: '14px', fontWeight: '700' }}>
                Data Preview (Showing first {previewRows.length} rows)
              </span>
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search columns..."
                value={colSearch}
                onChange={(e) => setColSearch(e.target.value)}
                className="mf-input"
                style={{ paddingLeft: '32px', fontSize: '12px', height: '34px' }}
              />
            </div>
          </div>

          {/* Scrollable Data Table */}
          <div className="data-table-container" style={{ maxHeight: '340px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  {filteredColumns.map((col) => {
                    const colInfo = eda?.columns?.find(c => c.name === col);
                    const role = colInfo?.role || 'feature';
                    return (
                      <th key={col}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>{col}</span>
                          <span style={{ fontSize: '10px', opacity: 0.75, fontWeight: 'normal', textTransform: 'lowercase' }}>
                            {colInfo?.dtype || 'any'} • {role}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>{rIdx + 1}</td>
                    {filteredColumns.map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined;
                      return (
                        <td key={col} style={{ color: isNull ? 'var(--text-light)' : 'inherit' }}>
                          {isNull ? (
                            <span style={{ fontStyle: 'italic', fontSize: '11px' }}>null</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
