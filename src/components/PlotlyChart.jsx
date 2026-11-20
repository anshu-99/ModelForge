import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function PlotlyChart({ data, layout, config, style, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const mergedLayout = {
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: 'Inter, sans-serif',
        color: isDark ? '#cbd5e1' : '#334155',
        size: 12
      },
      margin: { t: 40, r: 25, l: 50, b: 45 },
      ...layout
    };

    const mergedConfig = {
      responsive: true,
      displayModeBar: false,
      ...config
    };

    Plotly.newPlot(containerRef.current, data, mergedLayout, mergedConfig);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return <div ref={containerRef} style={{ width: '100%', height: '360px', ...style }} className={className} />;
}
