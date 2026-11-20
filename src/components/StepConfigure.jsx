import React, { useState, useEffect } from 'react';
import {
  Play, Settings, Sliders, ShieldCheck, ChevronDown, ChevronUp,
  BrainCircuit, CheckSquare, Square, Info, RefreshCw
} from 'lucide-react';
import { getApiBase } from '../utils/api';

export default function StepConfigure({
  datasetData,
  config,
  setConfig,
  onRunPipeline,
  isTraining
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableAlgos, setAvailableAlgos] = useState([]);

  const eda = datasetData?.eda;
  const columns = datasetData?.columns || [];

  // Fetch or calculate available algorithms whenever task_type changes
  useEffect(() => {
    fetch(`${getApiBase()}/algorithms/${config.task_type}`)
      .then(res => res.json())
      .then(data => {
        setAvailableAlgos(data);
        // By default select all or default algorithms if empty
        if (!config.algorithms || config.algorithms.length === 0) {
          const defs = data.filter(a => a.default).map(a => a.id);
          setConfig(prev => ({ ...prev, algorithms: defs.length > 0 ? defs : data.map(a => a.id) }));
        }
      })
      .catch(() => {
        // Fallback local list
        setAvailableAlgos([
          { id: 'random_forest', name: 'Random Forest', category: 'Ensemble' },
          { id: 'xgboost', name: 'XGBoost', category: 'Boosting' },
          { id: 'lightgbm', name: 'LightGBM', category: 'Boosting' },
          { id: 'logistic_regression', name: 'Logistic Regression', category: 'Linear' }
        ]);
      });
  }, [config.task_type]);

  const handleTargetChange = (e) => {
    const val = e.target.value;
    if (val === "__NONE__") {
      setConfig(prev => ({
        ...prev,
        target_column: null,
        task_type: 'clustering',
        algorithms: ['kmeans', 'dbscan', 'hierarchical']
      }));
    } else {
      // Auto-detect task type for this target column
      const colInfo = eda?.columns?.find(c => c.name === val);
      let detectedTask = 'classification';
      if (colInfo) {
        if (colInfo.dtype.includes('float') || (colInfo.dtype.includes('int') && colInfo.nunique > 15)) {
          detectedTask = 'regression';
        }
      }
      setConfig(prev => ({
        ...prev,
        target_column: val,
        task_type: detectedTask,
        algorithms: []
      }));
    }
  };

  const toggleAlgorithm = (algoId) => {
    setConfig(prev => {
      const current = prev.algorithms || [];
      if (current.includes(algoId)) {
        return { ...prev, algorithms: current.filter(id => id !== algoId) };
      } else {
        return { ...prev, algorithms: [...current, algoId] };
      }
    });
  };

  const selectAllAlgos = () => {
    setConfig(prev => ({
      ...prev,
      algorithms: availableAlgos.map(a => a.id)
    }));
  };

  const deselectAllAlgos = () => {
    setConfig(prev => ({
      ...prev,
      algorithms: []
    }));
  };

  const isAllSelected = availableAlgos.length > 0 && config.algorithms?.length === availableAlgos.length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
      {/* Left Column: Core Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Target & Task Card */}
        <div className="mf-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BrainCircuit size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
              Modeling Objective & Target
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Target Column to Predict:
              </label>
              <select
                value={config.target_column || "__NONE__"}
                onChange={handleTargetChange}
                className="mf-select"
              >
                <option value="__NONE__">(None - Unsupervised / Clustering)</option>
                {columns.map(col => (
                  <option key={col} value={col}>
                    {col} {col === eda?.suggested_target ? '★ (Auto-detected)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Machine Learning Task Type:
              </label>
              <select
                value={config.task_type}
                onChange={(e) => setConfig(prev => ({ ...prev, task_type: e.target.value, algorithms: [] }))}
                className="mf-select"
              >
                <option value="classification">Classification (Binary / Multiclass)</option>
                <option value="regression">Regression (Continuous Numeric)</option>
                <option value="clustering">Clustering (Unsupervised)</option>
              </select>
            </div>
          </div>

          {/* Target column insight note */}
          {config.target_column && eda?.target_info && (
            <div style={{
              background: 'var(--bg-card-subtle)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-app)',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>
                Target contains <strong>{eda.target_info.nunique}</strong> unique values.
              </span>
              {eda.target_info.is_imbalanced && (
                <span className="badge badge-amber">
                  Class Imbalance ({eda.target_info.imbalance_ratio}:1)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Algorithm Selection Card */}
        <div className="mf-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                Algorithm Selection & Benchmarking
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={selectAllAlgos}
                className="btn-secondary btn-sm"
              >
                Compare All
              </button>
              <button
                type="button"
                onClick={deselectAllAlgos}
                className="btn-secondary btn-sm"
              >
                Clear
              </button>
            </div>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Select the algorithms to benchmark. ModelForge will train each model within leak-free cross-validation and pick the Champion.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '10px'
          }}>
            {availableAlgos.map(algo => {
              const isSelected = config.algorithms?.includes(algo.id);
              return (
                <div
                  key={algo.id}
                  onClick={() => toggleAlgorithm(algo.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-app)',
                    background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected ? (
                    <CheckSquare size={16} color="var(--brand-primary)" />
                  ) : (
                    <Square size={16} color="var(--text-muted)" />
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {algo.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {algo.category}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Preprocessing Accordion */}
        <div className="mf-card">
          <div
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                Automated Preprocessing & Feature Engineering
              </h3>
            </div>
            {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {showAdvanced && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-app)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                    Numerical Imputation:
                  </label>
                  <select
                    value={config.preprocessing?.missing_num_strategy || 'median'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      preprocessing: { ...prev.preprocessing, missing_num_strategy: e.target.value }
                    }))}
                    className="mf-select"
                  >
                    <option value="median">Median Imputation (Robust)</option>
                    <option value="mean">Mean Imputation</option>
                    <option value="knn">KNN Imputation (5 Neighbors)</option>
                    <option value="zero">Fill with Constant (0.0)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                    Outlier Treatment:
                  </label>
                  <select
                    value={config.preprocessing?.outlier_strategy || 'none'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      preprocessing: { ...prev.preprocessing, outlier_strategy: e.target.value }
                    }))}
                    className="mf-select"
                  >
                    <option value="none">None (Keep Raw Values)</option>
                    <option value="iqr">IQR Capping (1.5x IQR Boundary)</option>
                    <option value="zscore">Z-Score Capping (3.0x Sigma)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                    Feature Scaling:
                  </label>
                  <select
                    value={config.preprocessing?.feature_scaling || 'standard'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      preprocessing: { ...prev.preprocessing, feature_scaling: e.target.value }
                    }))}
                    className="mf-select"
                  >
                    <option value="standard">StandardScaler (Zero mean, unit var)</option>
                    <option value="minmax">MinMaxScaler (0 to 1 range)</option>
                    <option value="robust">RobustScaler (Median & Quantiles)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                    Class Imbalance Handling:
                  </label>
                  <select
                    value={config.preprocessing?.balance_strategy || 'none'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      preprocessing: { ...prev.preprocessing, balance_strategy: e.target.value }
                    }))}
                    className="mf-select"
                  >
                    <option value="none">None (Natural Distribution)</option>
                    <option value="class_weight">Class Weights (Algorithmic)</option>
                    <option value="smote">SMOTE (Synthetic Oversampling)</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.preprocessing?.drop_duplicates !== false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      preprocessing: { ...prev.preprocessing, drop_duplicates: e.target.checked }
                    }))}
                  />
                  <span>Drop Duplicate Rows</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.preprocessing?.drop_id_cols !== false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      preprocessing: { ...prev.preprocessing, drop_id_cols: e.target.checked }
                    }))}
                  />
                  <span>Drop ID / Key Columns</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.preprocessing?.datetime_handling !== false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      preprocessing: { ...prev.preprocessing, datetime_handling: e.target.checked }
                    }))}
                  />
                  <span>Temporal Feature Extraction</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Validation Strategy & Run Action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Validation Strategy Card */}
        <div className="mf-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sliders size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
              Validation & Tuning Strategy
            </h3>
          </div>

          {config.task_type !== 'clustering' && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                <span>Train / Test Split Ratio:</span>
                <span style={{ color: 'var(--brand-primary)' }}>
                  {Math.round(config.train_test_split * 100)}% / {Math.round((1 - config.train_test_split) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.9"
                step="0.05"
                value={config.train_test_split}
                onChange={(e) => setConfig(prev => ({ ...prev, train_test_split: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                CV Folds:
              </label>
              <select
                value={config.cv_folds}
                onChange={(e) => setConfig(prev => ({ ...prev, cv_folds: parseInt(e.target.value) }))}
                className="mf-select"
              >
                <option value={3}>3-Fold Cross-Validation</option>
                <option value={5}>5-Fold Cross-Validation</option>
                <option value={10}>10-Fold Cross-Validation</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                Random Seed:
              </label>
              <input
                type="number"
                value={config.random_seed}
                onChange={(e) => setConfig(prev => ({ ...prev, random_seed: parseInt(e.target.value) || 42 }))}
                className="mf-input"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
              Hyperparameter Search:
            </label>
            <select
              value={config.hyperparameter_tuning}
              onChange={(e) => setConfig(prev => ({ ...prev, hyperparameter_tuning: e.target.value }))}
              className="mf-select"
            >
              <option value="none">None (Fast Baseline Models)</option>
              <option value="random">RandomizedSearchCV (Fast Tuning)</option>
              <option value="grid">GridSearchCV (Exhaustive)</option>
            </select>
          </div>
        </div>

        {/* Launch Pipeline Card */}
        <div className="mf-card" style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.06))',
          border: '1.5px solid var(--border-app)',
          textAlign: 'center',
          padding: '28px 20px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
            Ready to Forge Models
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            ModelForge will clean the data, construct leak-free pipelines, benchmark {config.algorithms?.length || 0} algorithms, and compute full SHAP explainability.
          </p>

          <button
            onClick={onRunPipeline}
            disabled={isTraining || !config.algorithms || config.algorithms.length === 0}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
          >
            {isTraining ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Training in Progress...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>Launch AutoML Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
