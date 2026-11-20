import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2, AlertTriangle, Terminal, ArrowRight,
  Sparkles, Clock, Activity, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PIPELINE_STAGES = [
  { id: 1, name: 'Data Validation & EDA', pct: 15 },
  { id: 2, name: 'Automated Preprocessing', pct: 30 },
  { id: 3, name: 'Feature Engineering', pct: 45 },
  { id: 4, name: 'Model Training & CV', pct: 75 },
  { id: 5, name: 'SHAP & Explainability', pct: 90 },
  { id: 6, name: 'Artifact Generation', pct: 100 }
];

export default function StepTraining({
  jobStatus,
  onViewResults
}) {
  const terminalRef = useRef(null);
  const progress = jobStatus?.progress || 0;
  const status = jobStatus?.status || 'running';
  const logs = jobStatus?.logs || [];
  const currentStep = jobStatus?.current_step || 'Initializing pipeline...';

  // Auto-scroll logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Trigger celebration confetti on completion
  useEffect(() => {
    if (status === 'completed') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }
  }, [status]);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Progress Card */}
      <div className="mf-card" style={{ textAlign: 'center', padding: '36px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          {status === 'completed' ? (
            <div className="badge badge-green" style={{ fontSize: '13px', padding: '6px 14px' }}>
              <CheckCircle2 size={16} />
              <span>AutoML Training Finished Successfully</span>
            </div>
          ) : status === 'failed' ? (
            <div className="badge badge-red" style={{ fontSize: '13px', padding: '6px 14px' }}>
              <AlertTriangle size={16} />
              <span>Pipeline Failed</span>
            </div>
          ) : (
            <div className="badge badge-blue animate-pulse" style={{ fontSize: '13px', padding: '6px 14px' }}>
              <Activity size={16} />
              <span>Active Pipeline Execution</span>
            </div>
          )}
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
          {currentStep}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          ModelForge is autonomously training scikit-learn, XGBoost, and LightGBM models with leak-free preprocessing.
        </p>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '14px',
          background: 'var(--bg-card-subtle)',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '12px',
          border: '1px solid var(--border-app)',
          position: 'relative'
        }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--brand-gradient)',
              borderRadius: '9999px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
          <span>Overall Progress: {progress}%</span>
          {status === 'running' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={13} className="animate-spin" />
              <span>Computing...</span>
            </span>
          )}
        </div>

        {/* Stage Chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          marginTop: '24px'
        }}>
          {PIPELINE_STAGES.map((stg) => {
            const isDone = progress >= stg.pct;
            const isCurr = progress < stg.pct && progress >= (stg.pct - 20);

            return (
              <div
                key={stg.id}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: isDone ? 'var(--accent-success-bg)' : isCurr ? 'rgba(37,99,235,0.08)' : 'var(--bg-card-subtle)',
                  border: isDone ? '1px solid var(--accent-success)' : isCurr ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-app)',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '11px', color: isDone ? 'var(--accent-success)' : isCurr ? 'var(--brand-primary)' : 'var(--text-muted)', fontWeight: '700' }}>
                  Stage {stg.id}
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: '600', marginTop: '2px', color: 'var(--text-primary)' }}>
                  {stg.name}
                </div>
              </div>
            );
          })}
        </div>

        {status === 'completed' && (
          <div style={{ marginTop: '28px' }}>
            <button
              onClick={onViewResults}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '15px' }}
            >
              <Sparkles size={18} />
              <span>Explore Results & Dashboard</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Live Terminal Log Streamer */}
      <div className="mf-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={17} color="var(--brand-primary)" />
            <span style={{ fontSize: '13.5px', fontWeight: '700' }}>
              Execution Stream & Console Logs
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {logs.length} events logged
          </span>
        </div>

        <div ref={terminalRef} className="terminal-window">
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>
              Waiting for execution output...
            </div>
          ) : (
            logs.map((l, idx) => (
              <div key={idx} className="log-line">
                <span className="log-time">[{l.time}]</span>
                <span className={`log-level-${l.level || 'INFO'}`}>
                  {l.level || 'INFO'}
                </span>
                <span className="log-msg">{l.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
