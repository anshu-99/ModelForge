import React from 'react';
import { Cpu, Moon, Sun, RotateCcw, Sparkles } from 'lucide-react';

export default function Header({ isDark, setIsDark, onReset, activeDatasetName }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      marginBottom: '28px',
      borderBottom: '1px solid var(--border-app)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
        }}>
          <Cpu size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px', margin: 0 }}>
              Model<span style={{ color: 'var(--brand-primary)' }}>Forge</span>
            </h1>
            <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
              AutoML Engine v1.0
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Autonomous End-to-End Machine Learning, Preprocessing & Explainability
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {activeDatasetName && (
          <div className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} />
            <span>{activeDatasetName}</span>
          </div>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className="btn-secondary btn-sm"
            title="Start new modeling session"
          >
            <RotateCcw size={14} />
            <span>New Session</span>
          </button>
        )}

        <button
          onClick={() => setIsDark(!isDark)}
          className="btn-secondary btn-sm"
          style={{ width: '36px', height: '36px', padding: 0 }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
