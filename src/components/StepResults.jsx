import React, { useState } from 'react';
import {
  Trophy, BarChart2, PieChart, Shield, GitCommit, FileCode,
  Download, Send, Copy, Check, Sparkles, Layers, CheckCircle2,
  TrendingUp, Activity, HelpCircle, ExternalLink
} from 'lucide-react';
import PlotlyChart from './PlotlyChart';
import { getApiBase, getDownloadUrl as getAssetDownloadUrl } from '../utils/api';

export default function StepResults({
  resultData,
  onReset
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Inference form state
  const [inferenceData, setInferenceData] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);

  if (!resultData) {
    return (
      <div className="mf-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>No results available. Please run the AutoML pipeline first.</p>
      </div>
    );
  }

  const {
    job_id,
    task_type,
    target_column,
    classes,
    leaderboard = [],
    best_model_name,
    best_model_id,
    best_metrics = {},
    feature_importances = [],
    shap_summary = {},
    eda_summary = {},
    preprocessing_summary = {},
    python_script = '',
    requirements = ''
  } = resultData;

  const isClassification = task_type === 'classification';
  const isRegression = task_type === 'regression';
  const isClustering = task_type === 'clustering';

  // Primary metric formatting
  let primaryMetricLabel = 'F1 Score';
  let primaryMetricValue = `${((best_metrics.f1 || 0) * 100).toFixed(1)}%`;
  if (isRegression) {
    primaryMetricLabel = 'R² Score';
    primaryMetricValue = (best_metrics.r2 || 0).toFixed(3);
  } else if (isClustering) {
    primaryMetricLabel = 'Silhouette';
    primaryMetricValue = (best_metrics.silhouette_score || 0).toFixed(3);
  }

  // Handle Download Links
  const getDownloadUrl = (asset) => getAssetDownloadUrl(job_id, asset);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Initialize inference form inputs with medians/modes from EDA
  const handleInitInferenceForm = () => {
    const initial = {};
    if (eda_summary?.columns) {
      eda_summary.columns.forEach(col => {
        if (col.name !== target_column && col.role !== 'id' && col.role !== 'constant') {
          if (col.role === 'numerical' && eda_summary.numeric_stats?.[col.name]) {
            initial[col.name] = eda_summary.numeric_stats[col.name].median;
          } else if (col.sample_values && col.sample_values.length > 0) {
            initial[col.name] = col.sample_values[0] || '';
          } else {
            initial[col.name] = 0;
          }
        }
      });
    }
    setInferenceData(initial);
  };

  // Run Live Prediction
  const handlePredict = async (e) => {
    e.preventDefault();
    setPredicting(true);
    setPredictError(null);
    try {
      const res = await fetch(`${getApiBase()}/predict/${job_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [inferenceData] })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Inference failed');
      }
      const data = await res.json();
      setPredictionResult(data);
    } catch (err) {
      setPredictError(err.message);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div>
      {/* Top Champion Ribbon */}
      <div className="mf-card" style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))',
        border: '1.5px solid var(--border-app)',
        marginBottom: '24px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(37,99,235,0.35)'
          }}>
            <Trophy size={32} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-amber" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                Champion Model Selected
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Target: <strong>{target_column || 'Unsupervised'}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 2px 0' }}>
              {best_model_name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Ranked #1 across {leaderboard.length} benchmarked models with leak-free preprocessing.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Primary {primaryMetricLabel}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--brand-primary)' }}>
              {primaryMetricValue}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={getDownloadUrl('model')}
              download
              className="btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <Download size={14} />
              <span>Download Model (.joblib)</span>
            </a>

            <a
              href={getDownloadUrl('report')}
              download
              className="btn-secondary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={14} />
              <span>HTML Report</span>
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Trophy size={15} />
          <span>Champion & Overview</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <BarChart2 size={15} />
          <span>Leaderboard ({leaderboard.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          <TrendingUp size={15} />
          <span>Deep-Dive Evaluation</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'explainability' ? 'active' : ''}`}
          onClick={() => setActiveTab('explainability')}
        >
          <Sparkles size={15} />
          <span>SHAP & Importance</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'eda' ? 'active' : ''}`}
          onClick={() => setActiveTab('eda')}
        >
          <PieChart size={15} />
          <span>EDA & Distributions</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'preprocessing' ? 'active' : ''}`}
          onClick={() => setActiveTab('preprocessing')}
        >
          <Shield size={15} />
          <span>Preprocessing</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'inference' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('inference');
            if (Object.keys(inferenceData).length === 0) handleInitInferenceForm();
          }}
        >
          <Send size={15} />
          <span>Live Inference</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <FileCode size={15} />
          <span>Code & Downloads</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & METRICS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Metric Highlights Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {isClassification && (
              <>
                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Accuracy</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {((best_metrics.accuracy || 0) * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Overall test accuracy</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>F1 Score (Weighted)</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand-primary)', marginTop: '4px' }}>
                    {(best_metrics.f1 || 0).toFixed(3)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Harmonic mean of precision & recall</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>ROC-AUC</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-success)', marginTop: '4px' }}>
                    {best_metrics.roc_auc ? best_metrics.roc_auc.toFixed(3) : 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Area under ROC curve</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Training Time</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(best_metrics.fit_time || 0).toFixed(2)}s
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Fit duration on train set</div>
                </div>
              </>
            )}

            {isRegression && (
              <>
                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>R² Determination</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand-primary)', marginTop: '4px' }}>
                    {(best_metrics.r2 || 0).toFixed(3)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Variance explained</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>MAE (Mean Absolute Error)</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(best_metrics.mae || 0).toFixed(3)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Average magnitude of errors</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>RMSE</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(best_metrics.rmse || 0).toFixed(3)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Root mean squared error</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Training Time</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(best_metrics.fit_time || 0).toFixed(2)}s
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Fit duration</div>
                </div>
              </>
            )}

            {isClustering && (
              <>
                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Silhouette Score</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand-primary)', marginTop: '4px' }}>
                    {(best_metrics.silhouette_score || 0).toFixed(3)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Separation quality (-1 to 1)</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Calinski-Harabasz</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(best_metrics.calinski_harabasz || 0).toFixed(1)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Variance ratio criterion</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Clusters Discovered</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-success)', marginTop: '4px' }}>
                    {best_metrics.n_clusters || '3'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Distinct data partitions</div>
                </div>

                <div className="mf-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Training Time</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(best_metrics.fit_time || 0).toFixed(2)}s
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Clustering execution time</div>
                </div>
              </>
            )}
          </div>

          {/* Quick Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
            {/* Top Features Preview */}
            <div className="mf-card">
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                Key Influential Features
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {feature_importances.slice(0, 6).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                    <div style={{ width: '130px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.feature}
                    </div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.max(8, f.importance))}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ width: '45px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {f.importance.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Configuration Snapshot */}
            <div className="mf-card">
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                Pipeline Architecture
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-app)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Task Type:</span>
                  <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{task_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-app)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Column:</span>
                  <span style={{ fontWeight: '600' }}>{target_column || 'None'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-app)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transformed Features:</span>
                  <span style={{ fontWeight: '600' }}>{preprocessing_summary.transformed_feature_count || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-app)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Dropped Columns:</span>
                  <span style={{ fontWeight: '600' }}>{preprocessing_summary.dropped_cols?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Leakage Protection:</span>
                  <span className="badge badge-green" style={{ fontSize: '11px', padding: '2px 6px' }}>Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="mf-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>
                Model Comparison Leaderboard
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                All candidate algorithms ranked by primary performance metric.
              </p>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Algorithm</th>
                  {isClassification && (
                    <>
                      <th>Accuracy</th>
                      <th>F1 Score</th>
                      <th>ROC-AUC</th>
                      <th>Precision</th>
                      <th>Recall</th>
                    </>
                  )}
                  {isRegression && (
                    <>
                      <th>R² Score</th>
                      <th>MAE</th>
                      <th>MSE</th>
                      <th>RMSE</th>
                    </>
                  )}
                  {isClustering && (
                    <>
                      <th>Silhouette Score</th>
                      <th>Calinski-Harabasz</th>
                      <th>Davies-Bouldin</th>
                      <th>Clusters</th>
                    </>
                  )}
                  <th>Fit Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((m, idx) => {
                  const isChamp = idx === 0;
                  return (
                    <tr key={idx} style={{ background: isChamp ? 'rgba(37, 99, 235, 0.05)' : 'inherit' }}>
                      <td>
                        {idx === 0 ? (
                          <span className="badge badge-amber" style={{ fontSize: '11px', padding: '2px 8px' }}>#1 🏆</span>
                        ) : idx === 1 ? (
                          <span className="badge" style={{ background: '#e2e8f0', color: '#475569', fontSize: '11px' }}>#2 🥈</span>
                        ) : idx === 2 ? (
                          <span className="badge" style={{ background: '#fed7aa', color: '#9a3412', fontSize: '11px' }}>#3 🥉</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>#{idx + 1}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: isChamp ? '700' : '600', color: isChamp ? 'var(--brand-primary)' : 'inherit' }}>
                          {m.model_name}
                        </span>
                        {isChamp && <span className="badge badge-blue" style={{ marginLeft: '8px', fontSize: '10px' }}>Best</span>}
                      </td>

                      {isClassification && (
                        <>
                          <td>{((m.accuracy || 0) * 100).toFixed(1)}%</td>
                          <td>
                            <span className="pill-green" style={{ background: 'var(--accent-success-bg)', color: 'var(--accent-success)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              {(m.f1 || 0).toFixed(3)}
                            </span>
                          </td>
                          <td>{m.roc_auc ? m.roc_auc.toFixed(3) : 'N/A'}</td>
                          <td>{(m.precision || 0).toFixed(3)}</td>
                          <td>{(m.recall || 0).toFixed(3)}</td>
                        </>
                      )}

                      {isRegression && (
                        <>
                          <td>
                            <span style={{ background: 'var(--accent-success-bg)', color: 'var(--accent-success)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              {(m.r2 || 0).toFixed(3)}
                            </span>
                          </td>
                          <td>{(m.mae || 0).toFixed(3)}</td>
                          <td>{(m.mse || 0).toFixed(3)}</td>
                          <td>{(m.rmse || 0).toFixed(3)}</td>
                        </>
                      )}

                      {isClustering && (
                        <>
                          <td>
                            <span style={{ background: 'var(--accent-success-bg)', color: 'var(--accent-success)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              {m.silhouette_score ? m.silhouette_score.toFixed(3) : 'N/A'}
                            </span>
                          </td>
                          <td>{m.calinski_harabasz ? m.calinski_harabasz.toFixed(1) : 'N/A'}</td>
                          <td>{m.davies_bouldin ? m.davies_bouldin.toFixed(3) : 'N/A'}</td>
                          <td>{m.n_clusters || '3'}</td>
                        </>
                      )}

                      <td style={{ color: 'var(--text-muted)' }}>
                        {(m.fit_time || 0).toFixed(2)}s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEEP-DIVE EVALUATION */}
      {activeTab === 'evaluation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {isClassification && best_metrics.confusion_matrix && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Confusion Matrix Heatmap */}
              <div className="mf-card">
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                  Confusion Matrix ({best_model_name})
                </h3>
                <PlotlyChart
                  data={[{
                    z: best_metrics.confusion_matrix.matrix,
                    x: best_metrics.confusion_matrix.labels.map(l => `Pred: ${l}`),
                    y: best_metrics.confusion_matrix.labels.map(l => `True: ${l}`),
                    type: 'heatmap',
                    colorscale: 'Blues',
                    showscale: false
                  }]}
                  layout={{
                    xaxis: { title: 'Predicted Class' },
                    yaxis: { title: 'Actual Class', autorange: 'reversed' }
                  }}
                  style={{ height: '320px' }}
                />
              </div>

              {/* ROC Curve */}
              {best_metrics.roc_curve ? (
                <div className="mf-card">
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                    ROC Curve (AUC = {best_metrics.roc_curve.auc || 'N/A'})
                  </h3>
                  <PlotlyChart
                    data={[
                      {
                        x: best_metrics.roc_curve.fpr,
                        y: best_metrics.roc_curve.tpr,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'ROC',
                        line: { color: '#2563eb', width: 2.5 }
                      },
                      {
                        x: [0, 1],
                        y: [0, 1],
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Random Guess',
                        line: { dash: 'dash', color: '#94a3b8' }
                      }
                    ]}
                    layout={{
                      xaxis: { title: 'False Positive Rate' },
                      yaxis: { title: 'True Positive Rate' }
                    }}
                    style={{ height: '320px' }}
                  />
                </div>
              ) : (
                <div className="mf-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    ROC curve is available for binary classification tasks.
                  </p>
                </div>
              )}
            </div>
          )}

          {isRegression && best_metrics.scatter_data && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Predicted vs Actual */}
              <div className="mf-card">
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                  Predicted vs Actual Scatter
                </h3>
                <PlotlyChart
                  data={[
                    {
                      x: best_metrics.scatter_data.actual,
                      y: best_metrics.scatter_data.predicted,
                      type: 'scatter',
                      mode: 'markers',
                      name: 'Predictions',
                      marker: { color: '#2563eb', size: 7, opacity: 0.7 }
                    }
                  ]}
                  layout={{
                    xaxis: { title: 'Actual Values' },
                    yaxis: { title: 'Predicted Values' }
                  }}
                  style={{ height: '320px' }}
                />
              </div>

              {/* Residuals Distribution */}
              <div className="mf-card">
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                  Residuals Distribution (Errors)
                </h3>
                <PlotlyChart
                  data={[{
                    x: best_metrics.scatter_data.residuals,
                    type: 'histogram',
                    marker: { color: '#8b5cf6' }
                  }]}
                  layout={{
                    xaxis: { title: 'Residual Error (Actual - Pred)' },
                    yaxis: { title: 'Frequency' }
                  }}
                  style={{ height: '320px' }}
                />
              </div>
            </div>
          )}

          {isClustering && best_metrics.pca_2d && (
            <div className="mf-card">
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                2D PCA Cluster Projection ({best_model_name})
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Dimensionality reduced to 2 Principal Components (Explained Variance: {best_metrics.pca_2d.explained_variance_ratio?.map(v => `${(v * 100).toFixed(1)}%`).join(' + ')}).
              </p>
              <PlotlyChart
                data={[{
                  x: best_metrics.pca_2d.x,
                  y: best_metrics.pca_2d.y,
                  mode: 'markers',
                  type: 'scatter',
                  marker: {
                    color: best_metrics.pca_2d.cluster,
                    colorscale: 'Viridis',
                    size: 8,
                    opacity: 0.85
                  }
                }]}
                layout={{
                  xaxis: { title: 'Principal Component 1' },
                  yaxis: { title: 'Principal Component 2' }
                }}
                style={{ height: '380px' }}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXPLAINABILITY & SHAP */}
      {activeTab === 'explainability' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Global Feature Importance */}
          <div className="mf-card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
              Global Feature Importance
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Normalized percentage contribution of each feature to the model's decisions.
            </p>

            <PlotlyChart
              data={[{
                x: feature_importances.map(f => f.importance).reverse(),
                y: feature_importances.map(f => f.feature).reverse(),
                type: 'bar',
                orientation: 'h',
                marker: { color: '#2563eb' }
              }]}
              layout={{
                margin: { l: 120, r: 20, t: 20, b: 40 },
                xaxis: { title: 'Relative Importance (%)' }
              }}
              style={{ height: '340px' }}
            />
          </div>

          {/* SHAP Mean Impact */}
          <div className="mf-card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
              SHAP Value Impact (|mean SHAP|)
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Shapley additive explanations quantifying directional impact on model predictions.
            </p>

            {shap_summary?.feature_ranking && shap_summary.feature_ranking.length > 0 ? (
              <PlotlyChart
                data={[{
                  x: shap_summary.feature_ranking.map(f => f.mean_shap).reverse(),
                  y: shap_summary.feature_ranking.map(f => f.feature).reverse(),
                  type: 'bar',
                  orientation: 'h',
                  marker: { color: '#7c3aed' }
                }]}
                layout={{
                  margin: { l: 120, r: 20, t: 20, b: 40 },
                  xaxis: { title: 'Mean |SHAP Value|' }
                }}
                style={{ height: '340px' }}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                SHAP explanations not generated for this model type.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: EDA & DISTRIBUTIONS */}
      {activeTab === 'eda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Correlation Heatmap */}
          {eda_summary.corr_matrix?.columns && eda_summary.corr_matrix.columns.length > 1 && (
            <div className="mf-card">
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                Pearson Correlation Heatmap (Numeric Features)
              </h3>
              <PlotlyChart
                data={[{
                  z: eda_summary.corr_matrix.values,
                  x: eda_summary.corr_matrix.columns,
                  y: eda_summary.corr_matrix.columns,
                  type: 'heatmap',
                  colorscale: 'RdBu',
                  zmin: -1,
                  zmax: 1
                }]}
                layout={{
                  margin: { l: 100, r: 40, t: 20, b: 100 }
                }}
                style={{ height: '420px' }}
              />
            </div>
          )}

          {/* Missing Values & Column Profile */}
          <div className="mf-card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
              Dataset Column Schema & Health
            </h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Role</th>
                    <th>Data Type</th>
                    <th>Missing Count</th>
                    <th>Missing %</th>
                    <th>Unique Values</th>
                  </tr>
                </thead>
                <tbody>
                  {eda_summary.columns?.map(col => (
                    <tr key={col.name}>
                      <td style={{ fontWeight: '600' }}>{col.name}</td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {col.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {col.dtype}
                      </td>
                      <td>{col.null_count}</td>
                      <td>
                        <span style={{ color: col.null_pct > 0 ? 'var(--accent-warning)' : 'inherit', fontWeight: col.null_pct > 0 ? '700' : 'normal' }}>
                          {col.null_pct}%
                        </span>
                      </td>
                      <td>{col.nunique}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PREPROCESSING */}
      {activeTab === 'preprocessing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="mf-card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
              Automated Transformations Log
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <strong>Dropped Columns:</strong>{' '}
                {preprocessing_summary.dropped_cols && preprocessing_summary.dropped_cols.length > 0 ? (
                  preprocessing_summary.dropped_cols.map(c => `${c[0]} (${c[1]})`).join(', ')
                ) : (
                  'None (all columns retained)'
                )}
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <strong>Numerical Features ({preprocessing_summary.numeric_features?.length || 0}):</strong>
                <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  {preprocessing_summary.numeric_features?.join(', ') || 'None'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <strong>Categorical Features ({preprocessing_summary.categorical_features?.length || 0}):</strong>
                <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  {preprocessing_summary.categorical_features?.join(', ') || 'None'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <strong>Post-transformation Features:</strong>{' '}
                {preprocessing_summary.transformed_feature_count} engineered columns.
              </div>
            </div>
          </div>

          <div className="mf-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                Preprocessed Cleaned Dataset
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Download the fully cleaned, imputed, scaled, and encoded dataset ready for downstream analytics or external modeling.
              </p>
            </div>

            <a
              href={getDownloadUrl('cleaned_data')}
              download
              className="btn-primary"
              style={{ width: '100%', textDecoration: 'none' }}
            >
              <Download size={16} />
              <span>Download Cleaned Dataset (CSV)</span>
            </a>
          </div>
        </div>
      )}

      {/* TAB 7: LIVE INFERENCE */}
      {activeTab === 'inference' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          {/* Form */}
          <div className="mf-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                Test Prediction with Live Inputs
              </h3>
              <button
                type="button"
                onClick={handleInitInferenceForm}
                className="btn-secondary btn-sm"
              >
                Reset to Averages
              </button>
            </div>

            <form onSubmit={handlePredict}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', maxHeight: '380px', overflowY: 'auto', paddingRight: '8px' }}>
                {Object.keys(inferenceData).map(feat => (
                  <div key={feat}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      {feat}
                    </label>
                    <input
                      type={typeof inferenceData[feat] === 'number' ? 'number' : 'text'}
                      step="any"
                      value={inferenceData[feat]}
                      onChange={(e) => {
                        const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                        setInferenceData(prev => ({ ...prev, [feat]: val }));
                      }}
                      className="mf-input"
                      style={{ fontSize: '13px', padding: '8px 10px' }}
                    />
                  </div>
                ))}
              </div>

              {predictError && (
                <div style={{ color: 'var(--accent-danger)', fontSize: '12px', marginTop: '12px' }}>
                  {predictError}
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={predicting}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  <Send size={16} />
                  <span>{predicting ? 'Predicting...' : `Predict with ${best_model_name}`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Prediction Result Display */}
          <div className="mf-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            {predictionResult ? (
              <div>
                <span className="badge badge-green" style={{ fontSize: '12px', marginBottom: '12px' }}>
                  Model Prediction Ready
                </span>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Predicted Output for {target_column || 'Cluster'}:
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--brand-primary)', margin: '10px 0' }}>
                  {String(predictionResult.predictions?.[0])}
                </div>

                {predictionResult.probabilities && (
                  <div style={{ marginTop: '20px', textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                      Class Probabilities:
                    </div>
                    {predictionResult.classes?.map((cls, idx) => {
                      const prob = (predictionResult.probabilities[0][idx] * 100).toFixed(1);
                      return (
                        <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ width: '70px', fontWeight: '600' }}>{cls}</span>
                          <div style={{ flex: 1, height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${prob}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: '4px' }} />
                          </div>
                          <span style={{ width: '40px', textAlign: 'right', color: 'var(--text-muted)' }}>{prob}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                <Sparkles size={28} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p>Fill the input form and click <strong>Predict</strong> to get immediate real-time model predictions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: CODE & DOWNLOADS */}
      {activeTab === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Downloads Center Grid */}
          <div className="mf-card">
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '14px' }}>
              Artifact Downloads Center
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Download all reproducible code, artifacts, and executive reports generated by ModelForge.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px'
            }}>
              <a href={getDownloadUrl('model')} download className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <Download size={16} color="var(--brand-primary)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Trained Model</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>.joblib binary</div>
                </div>
              </a>

              <a href={getDownloadUrl('python_script')} download className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <FileCode size={16} color="var(--accent-purple)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Python Script</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>pipeline.py</div>
                </div>
              </a>

              <a href={getDownloadUrl('jupyter_notebook')} download className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <BarChart2 size={16} color="var(--accent-warning)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Jupyter Notebook</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>pipeline.ipynb</div>
                </div>
              </a>

              <a href={getDownloadUrl('report')} download className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <ExternalLink size={16} color="var(--accent-success)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Full HTML Report</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>report.html</div>
                </div>
              </a>

              <a href={getDownloadUrl('cleaned_data')} download className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <Download size={16} color="var(--accent-cyan)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Cleaned Data</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>dataset.csv</div>
                </div>
              </a>

              <a href={getDownloadUrl('requirements')} download className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <FileCode size={16} color="var(--text-muted)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Requirements</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>requirements.txt</div>
                </div>
              </a>
            </div>
          </div>

          {/* Standalone Python Code Viewer */}
          <div className="mf-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                  Generated Pipeline Code (pipeline.py)
                </h3>
              </div>

              <button
                onClick={() => copyToClipboard(python_script)}
                className="btn-secondary btn-sm"
              >
                {copiedCode ? <Check size={14} color="var(--accent-success)" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre style={{
              background: '#090d16',
              color: '#e2e8f0',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              maxHeight: '380px',
              overflowY: 'auto'
            }}>
              <code>{python_script}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
