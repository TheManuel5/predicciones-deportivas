import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { Play } from 'lucide-react';

export default function AIPredictions({ user, language, apiUrl }) {
  const t = TRANSLATIONS[language];
  const [sport, setSport] = useState("Fútbol");
  const [minConfidence, setMinConfidence] = useState(0.70);
  const [days, setDays] = useState(7);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPredict, setExpandedPredict] = useState(null);

  const fetchAIPredictions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/ai-predictions?sport=${sport}&min_confidence=${minConfidence}&days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
      }
    } catch (e) {
      console.error("Error fetching AI predictions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIPredictions();
  }, [sport, minConfidence, days]);

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper SVG semi-circular gauge for ensemble confidence
  const renderGauge = (confidence) => {
    const value = confidence * 100; // e.g., 76
    // Semi-circle path calculations
    const radius = 50;
    const circumference = Math.PI * radius; // ~157
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="140" height="85" viewBox="0 0 120 70">
          {/* Track */}
          <path 
            d="M 10 60 A 50 50 0 0 1 110 60" 
            fill="none" 
            stroke="var(--border-color)" 
            strokeWidth="10" 
            strokeLinecap="round"
          />
          {/* Progress */}
          <path 
            d="M 10 60 A 50 50 0 0 1 110 60" 
            fill="none" 
            stroke="var(--accent-color)" 
            strokeWidth="10" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
          {/* Text inside */}
          <text x="60" y="55" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text-primary)">
            {Math.round(value)}%
          </text>
        </svg>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {t.ai_confidence_gauge}
        </span>
      </div>
    );
  };

  // Custom SVG Bar for individual models probabilities
  const renderModelBars = (probs, labels, colors) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        {probs.map((prob, idx) => {
          const val = prob * 100;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
              <span style={{ width: '80px', fontWeight: 600, color: 'var(--text-secondary)' }}>{labels[idx]}</span>
              <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${val}%`, background: colors[idx], borderRadius: '4px' }}></div>
              </div>
              <span style={{ width: '40px', textAlign: 'right', fontWeight: 700 }}>{val.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{t.ai_predictions_title}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t.ai_models_intro}</p>

      {/* Model Cards bullets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
          <h4>{t.model_xgb.split(':')[0]}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t.model_xgb.split(':')[1]}
          </p>
        </div>
        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #6366f1' }}>
          <h4>{t.model_bayes.split(':')[0]}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t.model_bayes.split(':')[1]}
          </p>
        </div>
        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <h4>{t.model_lstm.split(':')[0]}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t.model_lstm.split(':')[1]}
          </p>
        </div>
        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <h4>{t.model_ensemble.split(':')[0]}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t.model_ensemble.split(':')[1]}
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>{t.sport}</label>
          <select 
            value={sport} 
            onChange={(e) => setSport(e.target.value)}
            className="input-field"
          >
            <option value="Fútbol">⚽ {language === 'es' ? 'Fútbol' : 'Football'}</option>
            <option value="Baloncesto">🏀 {language === 'es' ? 'Baloncesto' : 'Basketball'}</option>
            <option value="Tenis">🎾 {language === 'es' ? 'Tenis' : 'Tennis'}</option>
            <option value="Béisbol">⚾ {language === 'es' ? 'Béisbol' : 'Baseball'}</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>{t.min_ai_confidence}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={minConfidence} 
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-color)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <span>0%</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{Math.round(minConfidence * 100)}%</span>
            <span>100%</span>
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>{t.next_days}</label>
          <input 
            type="range" 
            min="1" 
            max="14" 
            value={days} 
            onChange={(e) => setDays(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-color)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <span>1 {t.today}</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{days}</span>
            <span>14</span>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '2rem 0' }} />

      {/* Predictions Section */}
      <div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>{t.loading_matches}</p>
        ) : predictions.length === 0 ? (
          <div className="alert-info">
            {t.no_matches_period}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {predictions.map((item, idx) => {
              const isExpanded = expandedPredict === item.match_id;
              const labels = [item.home_team, t.draw_label, item.away_team];
              const colors = ['#10b981', '#94a3b8', '#6366f1'];
              
              return (
                <div key={idx} className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => setExpandedPredict(isExpanded ? null : item.match_id)}
                    style={{ 
                      padding: '1.25rem 1.5rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isExpanded ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                      fontWeight: 600
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🎯</span>
                      <span>{item.home_team} vs {item.away_team}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDate(item.date)}
                      </span>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        background: 'var(--accent-glow)',
                        color: 'var(--accent-color)'
                      }}>
                        {Math.round(item.confidence * 100)}% Conf.
                      </span>
                      <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      
                      {/* Flex grid containing charts and model details */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                        {/* Models Probabilities */}
                        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {t.model_predictions}
                          </h3>
                          
                          {/* XGBoost Box */}
                          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                            <h4 style={{ color: '#10b981', fontSize: '0.95rem', marginBottom: '0.75rem' }}>🌲 XGBoost</h4>
                            {renderModelBars(item.predictions["XGBoost"], labels, colors)}
                          </div>

                          {/* Bayesian Box */}
                          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                            <h4 style={{ color: '#6366f1', fontSize: '0.95rem', marginBottom: '0.75rem' }}>📊 Bayesian Ridge</h4>
                            {renderModelBars(item.predictions["Bayesian Ridge"], labels, colors)}
                          </div>

                          {/* LSTM Box */}
                          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                            <h4 style={{ color: '#f59e0b', fontSize: '0.95rem', marginBottom: '0.75rem' }}>🧠 LSTM con Atención</h4>
                            {renderModelBars(item.predictions["LSTM con Atención"], labels, colors)}
                          </div>
                        </div>

                        {/* Ensemble and Gauge */}
                        <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, alignSelf: 'flex-start' }}>Ensemble Final</h3>
                          
                          {renderGauge(item.confidence)}

                          <div style={{ 
                            width: '100%', 
                            padding: '1rem', 
                            background: 'var(--success-bg)', 
                            border: '1px solid var(--success-border)', 
                            borderRadius: '10px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: 'var(--success-color)'
                          }}>
                            {t.expected_winner.replace('{}', item.expected_winner.toUpperCase())}
                          </div>

                          {/* Poisson Expected Goals */}
                          {item.confidence >= minConfidence && (
                            <div style={{ width: '100%', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                              <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t.expected_goals_api}</div>
                              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                🏠 {t.home_goals_label.replace('{:.1f}', item.expected_goals.home.toFixed(1))}
                              </div>
                              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                ✈️ {t.away_goals_label.replace('{:.1f}', item.expected_goals.away.toFixed(1))}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                                {t.ai_advice_api} "{item.advice}"
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Team Comparative Stats */}
                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t.compare_teams}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                          <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              {t.form_label}
                            </div>
                            <div style={{ fontSize: '0.95rem' }}>
                              🏠 {t.form_home.replace('{}', item.comparison.form.home)}
                            </div>
                            <div style={{ fontSize: '0.95rem' }}>
                              ✈️ {t.form_away.replace('{}', item.comparison.form.away)}
                            </div>
                          </div>

                          <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              {t.att_def_label}
                            </div>
                            <div style={{ fontSize: '0.95rem' }}>
                              🏠 {t.att_def_home.replace('{}', item.comparison.att.home).replace('{}', item.comparison.def.home)}
                            </div>
                            <div style={{ fontSize: '0.95rem' }}>
                              ✈️ {t.att_def_away.replace('{}', item.comparison.att.away).replace('{}', item.comparison.def.away)}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
