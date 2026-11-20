import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Printer, FileDown } from 'lucide-react';
import IEEEView from './views/IEEEView';
import LatexView from './views/LatexView';
import ProfessionalView from './views/ProfessionalView';
import AcademicView from './views/AcademicView';
import CustomView from './views/CustomView';
import ClonedView from './views/ClonedView';

export default function PaperCanvas({
  doc,
  activeFormat,
  customSettings,
  clonedProfile
}) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 140));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 60));
  const handleResetZoom = () => setZoom(100);

  const renderActiveView = () => {
    switch (activeFormat) {
      case 'ieee':
        return <IEEEView doc={doc} />;
      case 'latex':
        return <LatexView doc={doc} />;
      case 'professional':
        return <ProfessionalView doc={doc} />;
      case 'academic':
        return <AcademicView doc={doc} />;
      case 'custom':
        return <CustomView doc={doc} settings={customSettings} />;
      case 'uploaded':
        return <ClonedView doc={doc} profile={clonedProfile} />;
      default:
        return <IEEEView doc={doc} />;
    }
  };

  return (
    <div className="paper-canvas-container">
      {/* Canvas Top Bar: Paper Info & Zoom Controls */}
      <div className="canvas-control-bar">
        <div className="canvas-info-left">
          <span className="page-type-tag">Standard Letter / A4 Print Sheet</span>
          <span className="live-render-tag">Live Dynamic Rendering</span>
        </div>

        <div className="canvas-zoom-controls">
          <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <span className="zoom-percentage">{zoom}%</span>
          <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button className="zoom-btn" onClick={handleResetZoom} title="Reset to 100%">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Realistic Paper Desk / Viewport */}
      <div className="paper-viewport-desk">
        <div
          className="paper-sheet"
          id="printable-paper"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center'
          }}
        >
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}
