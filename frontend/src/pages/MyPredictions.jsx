import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';

export default function MyPredictions({ user, language, apiUrl }) {
  const t = TRANSLATIONS[language];
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/predictions/history?user_id=${user.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
      }
    } catch (e) {
      console.error("Error loading history", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user.user_id]);

  // Compute stats locally
  const total = predictions.length;
  const highConf = predictions.filter(p => p.confidence_level > 0.7).length;
  const avgConf = total > 0 ? (predictions.reduce((acc, curr) => acc + curr.confidence_level, 0) / total) : 0;

  // Compute 10 confidence bins [0.0-0.1, 0.1-0.2, ..., 0.9-1.0] for the histogram
  const bins = Array(10).fill(0);
  predictions.forEach(p => {
    const idx = Math.min(9, Math.floor(p.confidence_level * 10));
    bins[idx]++;
  });
  const maxBinValue = Math.max(...bins, 1);

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric', month: 'numeric', year: '2-digit'
    });
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{t.my_predictions_title}</h1>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Cargando predicciones...</p>
      ) : total === 0 ? (
        <div className="alert-info">{t.no_predictions_yet}</div>
      ) : (
        <div>
          {/* Summary KPIs */}
          <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
            <div className="glass-card metric-card">
              <div className="metric-header">
                <span>{t.total_predictions}</span>
              </div>
              <div className="metric-value">{total}</div>
            </div>
            
            <div className="glass-card metric-card">
              <div className="metric-header">
                <span>{t.high_confidence}</span>
              </div>
              <div className="metric-value">{highConf}</div>
            </div>

            <div className="glass-card metric-card">
              <div className="metric-header">
                <span>{t.confidence_avg}</span>
              </div>
              <div className="metric-value">{avgConf.toFixed(2)}</div>
            </div>
          </div>

          {/* Table history */}
          <div className="glass-card" style={{ marginBottom: '2rem', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{t.prediction_history}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem' }}>{t.match_id}</th>
                  <th style={{ padding: '0.75rem' }}>Partido</th>
                  <th style={{ padding: '0.75rem' }}>{t.home_score}</th>
                  <th style={{ padding: '0.75rem' }}>{t.away_score}</th>
                  <th style={{ padding: '0.75rem' }}>{t.confidence}</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>{t.date}</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{p.match_id || idx}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      {p.home_team_name || 'Home'} vs {p.away_team_name || 'Away'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.predicted_home_score}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.predicted_away_score}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                      {Math.round(p.confidence_level * 100)}%
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: p.prediction_status === 'won' ? 'var(--success-bg)' : 
                                    p.prediction_status === 'lost' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                        color: p.prediction_status === 'won' ? 'var(--success-color)' : 
                               p.prediction_status === 'lost' ? 'var(--danger-color)' : 'var(--warning-color)'
                      }}>
                        {p.prediction_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Histogram distribution */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t.confidence_analysis}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.confidence_distribution}</p>
            
            {/* SVG histogram */}
            <div style={{ width: '100%', height: '180px', marginTop: '1rem' }}>
              <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%' }}>
                {/* Horizontal reference lines */}
                <line x1="30" y1="20" x2="470" y2="20" stroke="var(--border-color)" strokeWidth="0.5" />
                <line x1="30" y1="70" x2="470" y2="70" stroke="var(--border-color)" strokeWidth="0.5" />
                <line x1="30" y1="120" x2="470" y2="120" stroke="var(--border-color)" strokeWidth="1" />
                
                {/* Bins */}
                {bins.map((val, idx) => {
                  const barHeight = (val / maxBinValue) * 100;
                  const x = 30 + idx * 44;
                  const y = 120 - barHeight;
                  return (
                    <g key={idx}>
                      {/* Bar */}
                      <rect 
                        x={x} 
                        y={y} 
                        width="30" 
                        height={barHeight} 
                        rx="2" 
                        fill="var(--accent-gradient)" 
                        style={{ fill: 'var(--accent-color)' }}
                      />
                      {/* Hover/Label */}
                      {val > 0 && (
                        <text x={x + 15} y={y - 5} fill="var(--text-primary)" fontSize="9" fontWeight="700" textAnchor="middle">
                          {val}
                        </text>
                      )}
                      {/* X label */}
                      <text x={x + 15} y="135" fill="var(--text-muted)" fontSize="8" textAnchor="middle">
                        {(idx / 10).toFixed(1)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
