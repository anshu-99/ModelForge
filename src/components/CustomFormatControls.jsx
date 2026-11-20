import React from 'react';
import { Type, Columns, AlignJustify, Palette, ListOrdered, Indent, Space, Sparkles } from 'lucide-react';

export default function CustomFormatControls({ settings, onChangeSettings }) {
  const updateSetting = (key, val) => {
    onChangeSettings({
      ...settings,
      [key]: val
    });
  };

  const FONT_OPTIONS = [
    { label: 'Plus Jakarta Sans (Modern Sans)', val: "'Plus Jakarta Sans', sans-serif" },
    { label: 'Inter (Clean Technical)', val: "'Inter', -apple-system, sans-serif" },
    { label: 'Source Serif 4 (Journal Classical)', val: "'Source Serif 4', Georgia, serif" },
    { label: 'Merriweather (Literary Serif)', val: "'Merriweather', Georgia, serif" },
    { label: 'JetBrains Mono (Code/Technical)', val: "'JetBrains Mono', monospace" }
  ];

  const COLOR_PALETTES = [
    { name: 'Royal Navy', color: '#1e3a8a' },
    { name: 'Cobalt Blue', color: '#2563eb' },
    { name: 'Emerald Forest', color: '#059669' },
    { name: 'Crimson Wine', color: '#991b1b' },
    { name: 'Deep Slate', color: '#0f172a' },
    { name: 'Warm Amber', color: '#d97706' },
    { name: 'Amethyst Purple', color: '#7c3aed' }
  ];

  return (
    <div className="custom-controls-drawer">
      <div className="custom-drawer-header">
        <div className="drawer-title-row">
          <Sparkles size={16} className="text-amber-500" />
          <h3 className="drawer-title">Custom Format Studio Controls</h3>
        </div>
        <span className="drawer-subtitle">Adjust any parameter — changes render instantaneously on the paper sheet</span>
      </div>

      <div className="custom-controls-grid">
        {/* Font Family */}
        <div className="control-group">
          <label className="control-label">
            <Type size={14} /> Typeface / Font Family
          </label>
          <select
            className="control-select"
            value={settings.fontFamily}
            onChange={(e) => updateSetting('fontFamily', e.target.value)}
          >
            {FONT_OPTIONS.map((f, idx) => (
              <option key={idx} value={f.val}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Font Size & Line Height */}
        <div className="control-group">
          <label className="control-label">Base Size & Spacing</label>
          <div className="control-twin-inputs">
            <select
              className="control-select"
              value={settings.baseFontSize}
              onChange={(e) => updateSetting('baseFontSize', e.target.value)}
            >
              <option value="9.5pt">9.5pt (Dense)</option>
              <option value="10pt">10pt (Compact)</option>
              <option value="11pt">11pt (Standard)</option>
              <option value="12pt">12pt (Readability)</option>
              <option value="13pt">13pt (Large)</option>
            </select>
            <select
              className="control-select"
              value={settings.lineHeight}
              onChange={(e) => updateSetting('lineHeight', e.target.value)}
            >
              <option value="1.2">1.2x (Tight)</option>
              <option value="1.4">1.4x (Compact)</option>
              <option value="1.6">1.6x (Standard)</option>
              <option value="1.75">1.75x (Relaxed)</option>
              <option value="2.0">2.0x (Double)</option>
            </select>
          </div>
        </div>

        {/* Column Layout */}
        <div className="control-group">
          <label className="control-label">
            <Columns size={14} /> Column Layout
          </label>
          <div className="control-btn-group">
            <button
              className={`control-seg-btn ${settings.columns === 1 ? 'active' : ''}`}
              onClick={() => updateSetting('columns', 1)}
            >
              1 Column
            </button>
            <button
              className={`control-seg-btn ${settings.columns === 2 ? 'active' : ''}`}
              onClick={() => updateSetting('columns', 2)}
            >
              2 Columns
            </button>
          </div>
        </div>

        {/* Alignment & Indent */}
        <div className="control-group">
          <label className="control-label">
            <AlignJustify size={14} /> Alignment & Indents
          </label>
          <div className="control-twin-inputs">
            <select
              className="control-select"
              value={settings.textAlign}
              onChange={(e) => updateSetting('textAlign', e.target.value)}
            >
              <option value="left">Left Aligned</option>
              <option value="justify">Justified</option>
            </select>
            <select
              className="control-select"
              value={settings.paragraphIndent}
              onChange={(e) => updateSetting('paragraphIndent', e.target.value)}
            >
              <option value="0in">No Indent (Block)</option>
              <option value="0.25in">0.25" Indent</option>
              <option value="0.5in">0.5" APA Indent</option>
            </select>
          </div>
        </div>

        {/* Section Heading Scheme */}
        <div className="control-group">
          <label className="control-label">
            <ListOrdered size={14} /> Section Numbering Style
          </label>
          <select
            className="control-select"
            value={settings.headingNumbering}
            onChange={(e) => updateSetting('headingNumbering', e.target.value)}
          >
            <option value="decimal">Decimal Numbers (1.0, 2.0)</option>
            <option value="roman">Roman Numerals (I., II.)</option>
            <option value="pill">Pill Badges (01, 02)</option>
            <option value="underline">Clean Accent Underline</option>
            <option value="minimal">Minimalist (No numbers)</option>
          </select>
        </div>

        {/* Margins */}
        <div className="control-group">
          <label className="control-label">Page Margins</label>
          <select
            className="control-select"
            value={settings.margins}
            onChange={(e) => updateSetting('margins', e.target.value)}
          >
            <option value="0.75in">Compact (0.75 in)</option>
            <option value="1in">Standard Normal (1.0 in)</option>
            <option value="1.25in">Editorial Wide (1.25 in)</option>
          </select>
        </div>

        {/* Accent Color Palette */}
        <div className="control-group color-group">
          <label className="control-label">
            <Palette size={14} /> Accent Color Theme
          </label>
          <div className="palette-row">
            {COLOR_PALETTES.map((p, idx) => (
              <button
                key={idx}
                className={`color-swatch-btn ${settings.accentColor === p.color ? 'active' : ''}`}
                style={{ backgroundColor: p.color }}
                onClick={() => updateSetting('accentColor', p.color)}
                title={p.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
