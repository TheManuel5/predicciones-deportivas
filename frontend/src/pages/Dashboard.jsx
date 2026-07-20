import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { TrendingUp, Award, Calendar, CheckCircle } from 'lucide-react';

export default function Dashboard({ user, language, apiUrl }) {
  const t = TRANSLATIONS[language];
  const [stats, setStats] = useState({
    total_predictions: 0,
    correct_predictions: 0,
    accuracy_rate: 0,
    avg_confidence: 0,
    rank: 'N/A'
  });
  const [matches, setMatches] = useState([]);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictionsData, setPredictionsData] = useState({}); // matchId -> { home, away, confidence }
  const [saveStatus, setSaveStatus] = useState({}); // matchId -> message
  const [historyData, setHistoryData] = useState([]);

  // Fetch stats and matches
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch(`${apiUrl}/api/dashboard/stats?user_id=${user.user_id}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch matches
      const matchesRes = await fetch(`${apiUrl}/api/dashboard/matches`);
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
        
        // Pre-fill prediction inputs
        const initialInputs = {};
        matchesData.forEach(m => {
          initialInputs[m.fixture.id] = { home: 0, away: 0, confidence: 0.5 };
        });
        setPredictionsData(initialInputs);
      }

      // Fetch prediction history for charts
      const historyRes = await fetch(`${apiUrl}/api/predictions/history?user_id=${user.user_id}`);
      if (historyRes.ok) {
        const histData = await historyRes.json();
        setHistoryData(histData);
      }
    } catch (e) {
      console.error("Error loading dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.user_id]);

  const handlePredictChange = (matchId, field, value) => {
    setPredictionsData(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const handleSavePrediction = async (matchId, matchObj) => {
    const pred = predictionsData[matchId];
    try {
      const res = await fetch(`${apiUrl}/api/predictions/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          match_id: String(matchId),
          home_team_name: matchObj.teams.home.name,
          away_team_name: matchObj.teams.away.name,
          predicted_home_score: parseInt(pred.home),
          predicted_away_score: parseInt(pred.away),
          confidence_level: parseFloat(pred.confidence)
        })
      });
      if (res.ok) {
        setSaveStatus(prev => ({ ...prev, [matchId]: { type: 'success', msg: t.prediction_saved } }));
        // Refresh stats
        fetchData();
      } else {
        setSaveStatus(prev => ({ ...prev, [matchId]: { type: 'error', msg: t.prediction_error } }));
      }
    } catch (e) {
      setSaveStatus(prev => ({ ...prev, [matchId]: { type: 'error', msg: t.prediction_error } }));
    }
  };

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{t.dashboard_title}</h1>
      <h3 style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        {t.greeting.replace('{}', user.full_name)}
      </h3>

      {/* Info Card */}
      <div className="alert-info" style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{t.how_it_works}</h4>
        <p style={{ margin: '0.2rem 0' }}>{t.how_step1}</p>
        <p style={{ margin: '0.2rem 0' }}>{t.how_step2}</p>
        <p style={{ margin: '0.2rem 0' }}>{t.how_step3}</p>
        <p style={{ margin: '0.2rem 0' }}>{t.how_step4}</p>
      </div>

      {user.username === 'Invitado' && (
        <div className="alert-warning" style={{ marginBottom: '2rem' }}>
          {t.guest_warning}
        </div>
      )}

      {/* Stats Cards */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t.your_stats}</h2>
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>{t.total_predictions}</span>
            <Calendar size={18} style={{ color: 'var(--accent-color)' }} />
          </div>
          <div className="metric-value">{stats.total_predictions}</div>
          <div className="metric-delta delta-up">
            <span>+1 {t.today}</span>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>{t.accuracy_rate}</span>
            <CheckCircle size={18} style={{ color: 'var(--success-color)' }} />
          </div>
          <div className="metric-value">{stats.accuracy_rate.toFixed(1)}%</div>
          <div className="metric-delta delta-up">
            <span>+{stats.accuracy_rate > 0 ? 1.5 : 0}%</span>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>{t.avg_confidence}</span>
            <TrendingUp size={18} style={{ color: 'var(--accent-color)' }} />
          </div>
          <div className="metric-value">{stats.avg_confidence.toFixed(2)}</div>
          <div className="metric-delta delta-up">
            <span>+0.02</span>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>{t.global_rank}</span>
            <Award size={18} style={{ color: 'var(--warning-color)' }} />
          </div>
          <div className="metric-value">{stats.rank}</div>
          <div className="metric-delta delta-up">
            <span>+3 {t.positions}</span>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '2rem 0' }} />

      {/* Main Content Rows */}
      <div className="dashboard-grid">
        {/* Left Side: Upcoming Matches */}
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t.upcoming_matches}</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>{t.loading_matches}</p>
          ) : matches.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>{t.no_matches_available}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {matches.map((match) => {
                const matchId = match.fixture.id;
                const isExpanded = expandedMatch === matchId;
                const predInputs = predictionsData[matchId] || { home: 0, away: 0, confidence: 0.5 };
                const status = saveStatus[matchId];
                
                return (
                  <div key={matchId} className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
                    {/* Collapsible Header */}
                    <div 
                      onClick={() => setExpandedMatch(isExpanded ? null : matchId)}
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
                        <span style={{ fontSize: '1.2rem' }}>👥</span>
                        <span>{match.teams.home.name} vs {match.teams.away.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {formatDate(match.fixture.date)}
                        </span>
                        <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Body */}
                    {isExpanded && (
                      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                          
                          {/* AI Predictions info */}
                          <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '10px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
                              {t.ai_prediction}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '1.05rem', margin: '0.3rem 0' }}>
                              🎯 {match.teams.home.name}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              Probabilidad: 76%
                            </div>
                          </div>

                          {/* Scores prediction forms */}
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t.your_predictions}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={predInputs.home} 
                                  onChange={(e) => handlePredictChange(matchId, 'home', e.target.value)}
                                  className="input-field" 
                                  style={{ width: '70px', padding: '0.4rem' }} 
                                />
                              </div>
                              <span style={{ marginTop: '1.2rem', color: 'var(--text-muted)' }}>-</span>
                              <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Visitante</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={predInputs.away} 
                                  onChange={(e) => handlePredictChange(matchId, 'away', e.target.value)}
                                  className="input-field" 
                                  style={{ width: '70px', padding: '0.4rem' }} 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Confidence level slider */}
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t.confidence_level}</div>
                            <input 
                              type="range" 
                              min="0" 
                              max="1" 
                              step="0.1" 
                              value={predInputs.confidence}
                              onChange={(e) => handlePredictChange(matchId, 'confidence', e.target.value)}
                              style={{ width: '100%', accentColor: 'var(--accent-color)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <span>0%</span>
                              <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{Math.round(predInputs.confidence * 100)}%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>

                        {/* Save Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                          {status && (
                            <span style={{ 
                              fontSize: '0.9rem', 
                              color: status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                              fontWeight: 500
                            }}>
                              {status.msg}
                            </span>
                          )}
                          <button 
                            onClick={() => handleSavePrediction(matchId, match)}
                            className="btn-primary" 
                            style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                          >
                            {t.predict_button}
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Quick charts */}
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t.recent_performance}</h2>
          <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{t.accuracy_evolution}</h3>
            
            {/* Custom SVG Line Chart */}
            <div style={{ position: 'relative', width: '100%', height: '160px' }}>
              <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                {/* Gridlines */}
                <line x1="20" y1="20" x2="280" y2="20" stroke="var(--border-color)" strokeWidth="0.5" />
                <line x1="20" y1="70" x2="280" y2="70" stroke="var(--border-color)" strokeWidth="0.5" />
                <line x1="20" y1="120" x2="280" y2="120" stroke="var(--border-color)" strokeWidth="0.5" />
                
                {/* Chart Path */}
                <path 
                  d="M 20 110 L 70 85 L 120 90 L 170 50 L 220 55 L 270 30" 
                  fill="none" 
                  stroke="var(--accent-color)" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
                
                {/* Dots */}
                <circle cx="20" cy="110" r="4" fill="var(--accent-color)" />
                <circle cx="70" cy="85" r="4" fill="var(--accent-color)" />
                <circle cx="120" cy="90" r="4" fill="var(--accent-color)" />
                <circle cx="170" cy="50" r="4" fill="var(--accent-color)" />
                <circle cx="220" cy="55" r="4" fill="var(--accent-color)" />
                <circle cx="270" cy="30" r="4" fill="var(--accent-color)" />
                
                {/* Labels */}
                <text x="20" y="140" fill="var(--text-muted)" fontSize="8" textAnchor="middle">13 Jul</text>
                <text x="120" y="140" fill="var(--text-muted)" fontSize="8" textAnchor="middle">15 Jul</text>
                <text x="220" y="140" fill="var(--text-muted)" fontSize="8" textAnchor="middle">17 Jul</text>
              </svg>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{t.prediction_volume}</h3>
            
            {/* Custom SVG Bar Chart */}
            <div style={{ position: 'relative', width: '100%', height: '160px' }}>
              <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                {/* Bars */}
                <rect x="30" y="80" width="20" height="40" rx="3" fill="#10b981" />
                <rect x="80" y="50" width="20" height="70" rx="3" fill="#10b981" />
                <rect x="130" y="90" width="20" height="30" rx="3" fill="#10b981" />
                <rect x="180" y="30" width="20" height="90" rx="3" fill="#10b981" />
                <rect x="230" y="60" width="20" height="60" rx="3" fill="#10b981" />
                
                {/* X Axis */}
                <line x1="10" y1="120" x2="290" y2="120" stroke="var(--border-color)" strokeWidth="1" />
                
                {/* Labels */}
                <text x="40" y="135" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Lun</text>
                <text x="90" y="135" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Mar</text>
                <text x="140" y="135" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Mie</text>
                <text x="190" y="135" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Jue</text>
                <text x="240" y="135" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Vie</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
