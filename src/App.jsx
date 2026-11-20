import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Stepper from './components/Stepper';
import StepUpload from './components/StepUpload';
import StepConfigure from './components/StepConfigure';
import StepTraining from './components/StepTraining';
import StepResults from './components/StepResults';
import { getApiBase } from './utils/api';

const API_BASE = getApiBase();

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('modelforge_theme') === 'dark' ||
      (!('modelforge_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('modelforge_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('modelforge_theme', 'light');
    }
  }, [isDark]);

  // Wizard Navigation
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  // Dataset State
  const [datasetData, setDatasetData] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Configuration State
  const [config, setConfig] = useState({
    target_column: null,
    task_type: 'classification',
    algorithms: [],
    train_test_split: 0.8,
    cv_folds: 5,
    random_seed: 42,
    hyperparameter_tuning: 'none',
    preprocessing: {
      drop_duplicates: true,
      drop_id_cols: true,
      drop_constant_cols: true,
      datetime_handling: true,
      missing_num_strategy: 'median',
      missing_cat_strategy: 'most_frequent',
      outlier_strategy: 'none',
      feature_scaling: 'standard',
      balance_strategy: 'none'
    }
  });

  // Training & Results State
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [resultData, setResultData] = useState(null);
  const pollingRef = useRef(null);

  // Clean polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Upload handler
  const handleUploadFile = async (file) => {
    setUploadLoading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to upload dataset');
      }
      const data = await res.json();
      setDatasetData(data);
      setMaxStepReached(Math.max(maxStepReached, 2));

      // Auto-configure target & task
      const detectedTask = data.eda?.target_info?.detected_task || 'classification';
      setConfig(prev => ({
        ...prev,
        target_column: data.suggested_target || null,
        task_type: detectedTask,
        algorithms: []
      }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Sample dataset loader
  const handleLoadSample = async (sampleName) => {
    setUploadLoading(true);
    setUploadError(null);
    try {
      const res = await fetch(`${API_BASE}/sample/${sampleName}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to load sample dataset');
      }
      const data = await res.json();
      setDatasetData(data);
      setMaxStepReached(Math.max(maxStepReached, 2));

      setConfig(prev => ({
        ...prev,
        target_column: data.suggested_target || null,
        task_type: data.detected_task || 'classification',
        algorithms: []
      }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Launch AutoML Pipeline
  const handleRunPipeline = async () => {
    if (!datasetData) return;

    setIsTraining(true);
    setStep(3);
    setMaxStepReached(Math.max(maxStepReached, 3));
    setJobStatus({ progress: 5, current_step: 'Initializing pipeline...', logs: [], status: 'running' });

    try {
      const payload = {
        dataset_id: datasetData.dataset_id,
        target_column: config.target_column,
        task_type: config.task_type,
        algorithms: config.algorithms,
        train_test_split: config.train_test_split,
        cv_folds: config.cv_folds,
        random_seed: config.random_seed,
        hyperparameter_tuning: config.hyperparameter_tuning,
        preprocessing_config: config.preprocessing
      };

      const res = await fetch(`${API_BASE}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to launch training job');
      }

      const { job_id } = await res.json();
      setActiveJobId(job_id);

      // Start Polling Status
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API_BASE}/status/${job_id}`);
          if (!pollRes.ok) return;
          const statusData = await pollRes.json();
          setJobStatus(statusData);

          if (statusData.status === 'completed') {
            clearInterval(pollingRef.current);
            setIsTraining(false);
            setResultData(statusData.result);
            setMaxStepReached(4);
          } else if (statusData.status === 'failed') {
            clearInterval(pollingRef.current);
            setIsTraining(false);
          }
        } catch (e) {
          // ignore network glitch
        }
      }, 700);

    } catch (err) {
      setIsTraining(false);
      setJobStatus({ status: 'failed', current_step: 'Failed', logs: [{ time: 'Now', message: err.message, level: 'ERROR' }] });
    }
  };

  // Reset Session
  const handleReset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setDatasetData(null);
    setResultData(null);
    setJobStatus(null);
    setIsTraining(false);
    setStep(1);
    setMaxStepReached(1);
    setConfig({
      target_column: null,
      task_type: 'classification',
      algorithms: [],
      train_test_split: 0.8,
      cv_folds: 5,
      random_seed: 42,
      hyperparameter_tuning: 'none',
      preprocessing: {
        drop_duplicates: true,
        drop_id_cols: true,
        drop_constant_cols: true,
        datetime_handling: true,
        missing_num_strategy: 'median',
        missing_cat_strategy: 'most_frequent',
        outlier_strategy: 'none',
        feature_scaling: 'standard',
        balance_strategy: 'none'
      }
    });
  };

  return (
    <div className="app-container">
      <Header
        isDark={isDark}
        setIsDark={setIsDark}
        onReset={datasetData ? handleReset : null}
        activeDatasetName={datasetData?.name}
      />

      <Stepper
        currentStep={step}
        setStep={setStep}
        maxStepReached={maxStepReached}
      />

      <main style={{ marginTop: '24px' }}>
        {step === 1 && (
          <StepUpload
            datasetData={datasetData}
            onUploadFile={handleUploadFile}
            onLoadSample={handleLoadSample}
            onProceed={() => setStep(2)}
            loading={uploadLoading}
            error={uploadError}
          />
        )}

        {step === 2 && (
          <StepConfigure
            datasetData={datasetData}
            config={config}
            setConfig={setConfig}
            onRunPipeline={handleRunPipeline}
            isTraining={isTraining}
          />
        )}

        {step === 3 && (
          <StepTraining
            jobStatus={jobStatus}
            onViewResults={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <StepResults
            resultData={resultData}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
