import React from 'react';
import { UploadCloud, Settings2, PlayCircle, BarChart3, Check } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Upload & Preview', desc: 'CSV, XLSX, JSON or Samples', icon: UploadCloud },
  { id: 2, title: 'Configure Pipeline', desc: 'Target, Algorithms, Preprocessing', icon: Settings2 },
  { id: 3, title: 'Automated Training', desc: 'Live Logs & Evaluation', icon: PlayCircle },
  { id: 4, title: 'Results & Insights', desc: 'Leaderboard, SHAP, Code', icon: BarChart3 }
];

export default function Stepper({ currentStep, setStep, maxStepReached }) {
  return (
    <div className="stepper-nav">
      {STEPS.map((s, index) => {
        const Icon = s.icon;
        const isActive = currentStep === s.id;
        const isCompleted = currentStep > s.id;
        const isAccessible = s.id <= maxStepReached;

        return (
          <React.Fragment key={s.id}>
            <div
              className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isAccessible ? 'disabled' : ''}`}
              onClick={() => isAccessible && setStep(s.id)}
            >
              <div className="step-number">
                {isCompleted ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
              </div>
              <div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>

            {index < STEPS.length - 1 && (
              <div className={`step-divider ${currentStep > s.id ? 'filled' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
