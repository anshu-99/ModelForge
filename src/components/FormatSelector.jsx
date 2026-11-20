import React from 'react';
import { Landmark, Code2, Briefcase, GraduationCap, Sliders, UploadCloud, Sparkles } from 'lucide-react';

export const FORMAT_OPTIONS = [
  {
    id: 'ieee',
    title: 'IEEE Conference',
    subtitle: '1, 2, or 3 Columns • Drop Caps • Strict Proceedings',
    badge: '1 / 2 / 3 Cols',
    icon: Landmark,
    accent: '#2563eb',
    tagColor: 'blue'
  },
  {
    id: 'latex',
    title: 'LaTeX Format',
    subtitle: '1, 2, or 3 Columns • Overleaf Sync • .tex & BibTeX',
    badge: 'Multi-Col Engine',
    icon: Code2,
    accent: '#0d9488',
    tagColor: 'teal'
  },
  {
    id: 'professional',
    title: 'Professional Format',
    subtitle: 'Executive Report with Metadata & Callouts',
    badge: 'Corporate Standard',
    icon: Briefcase,
    accent: '#0284c7',
    tagColor: 'sky'
  },
  {
    id: 'academic',
    title: 'Academic Format',
    subtitle: 'APA 7th / University Thesis Layout',
    badge: 'Formal APA / MLA',
    icon: GraduationCap,
    accent: '#7c3aed',
    tagColor: 'purple'
  },
  {
    id: 'custom',
    title: 'Custom Format',
    subtitle: 'Fine-tune Fonts, Columns, Spacing & Themes',
    badge: 'Multi-Option Studio',
    icon: Sliders,
    accent: '#ea580c',
    tagColor: 'orange'
  },
  {
    id: 'uploaded',
    title: 'Upload Format',
    subtitle: 'Upload .doc, .pdf, or .txt to Deep-Analyze & Clone',
    badge: 'Smart Cloner',
    icon: UploadCloud,
    accent: '#e11d48',
    tagColor: 'rose',
    isSpecial: true
  }
];

export default function FormatSelector({ activeFormat, onSelectFormat, hasClonedProfile }) {
  return (
    <div className="format-selector-wrapper">
      <div className="format-selector-header">
        <div>
          <span className="format-header-eyebrow">CHOOSE TARGET FORMATTING SPECIFICATION</span>
          <h2 className="format-header-title">Formatting Engines & Templates</h2>
        </div>
        <div className="format-header-right">
          <span className="format-auto-badge">
            <Sparkles size={13} className="text-amber-500" /> Auto-Restructures AST & Citations
          </span>
        </div>
      </div>

      <div className="format-grid">
        {FORMAT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeFormat === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => onSelectFormat(opt.id)}
              className={`format-card ${isActive ? 'active' : ''} ${opt.isSpecial ? 'special-card' : ''}`}
              style={{
                '--card-accent': opt.accent
              }}
            >
              <div className="format-card-top">
                <div className="format-icon-box">
                  <Icon size={20} />
                </div>
                <span className={`format-tag ${opt.tagColor}`}>
                  {opt.id === 'uploaded' && hasClonedProfile ? 'Reference Cloned' : opt.badge}
                </span>
              </div>

              <div className="format-card-body">
                <h3 className="format-card-title">{opt.title}</h3>
                <p className="format-card-sub">{opt.subtitle}</p>
              </div>

              {isActive && (
                <div className="format-active-indicator">
                  <span className="active-dot"></span> Active Engine
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
