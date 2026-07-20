import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { Download, FileText, BarChart2 } from 'lucide-react';

export default function Statistics({ user, language, apiUrl }) {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState("summary");
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Reports states
  const [reportType, setReportType] = useState("Predicciones");
  const [reportFormat, setReportFormat] = useState("PDF");
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/statistics/summary?user_id=${user.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (e) {
      console.error("Error loading stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user.user_id]);

  const handleDownloadReport = async () => {
    try {
      setGeneratingReport(true);
      const formatParam = reportFormat.toLowerCase();
      const downloadUrl = `${apiUrl}/api/reports/generate?report_type=${reportType}&format=${formatParam}&user_id=${user.user_id}`;
      
      // Dynamic link for downloading files
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `reporte_${reportType.replace(' ', '_').lower()}_${new Date().toISOString().slice(0, 10)}.${formatParam === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Error generating report", e);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Compute mock descriptive statistics variables locally if statsData isn't loaded
  const descriptiveVars = [
    { name: 'confidence_level', n: statsData?.metrics?.total_predictions || 12, mean: statsData?.metrics?.avg_confidence || 0.72, median: 0.75, std: 0.14, min: 0.40, max: 0.95 },
    { name: 'predicted_home_score', n: statsData?.metrics?.total_predictions || 12, mean: 1.6, median: 1.0, std: 1.1, min: 0, max: 4 },
    { name: 'predicted_away_score', n: statsData?.metrics?.total_predictions || 12, mean: 1.1, median: 1.0, std: 0.9, min: 0, max: 3 }
  ];

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{t.stats_title}</h1>

      {/* Tabs list navigation */}
      <div className="tab-list">
        <button 
          onClick={() => setActiveTab("summary")} 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
        >
          {t.tab_summary}
        </button>
        <button 
          onClick={() => setActiveTab("tables")} 
          className={`tab-btn ${activeTab === 'tables' ? 'active' : ''}`}
        >
          {t.tab_tables}
        </button>
        <button 
          onClick={() => setActiveTab("graphs")} 
          className={`tab-btn ${activeTab === 'graphs' ? 'active' : ''}`}
        >
          {t.tab_advanced_graphs}
        </button>
        <button 
          onClick={() => setActiveTab("reports")} 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
        >
          {t.tab_reports}
        </button>
        <button 
          onClick={() => setActiveTab("insights")} 
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
        >
          {t.tab_insights}
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Cargando estadísticas...</p>
      ) : (
        <div>
          {/* TAB 1: SUMMARY executive */}
          {activeTab === 'summary' && (
            <div className="metrics-grid">
              <div className="glass-card metric-card">
                <div className="metric-header">
                  <span>{t.total_predictions}</span>
                </div>
                <div className="metric-value">{statsData?.metrics?.total_predictions}</div>
                <div className="metric-delta delta-up">
                  <span>+2 esta semana</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-header">
                  <span>{t.accuracy_rate}</span>
                </div>
                <div className="metric-value">{statsData?.metrics?.accuracy_rate.toFixed(1)}%</div>
                <div className="metric-delta delta-up">
                  <span>+1.2% delta</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-header">
                  <span>{t.avg_confidence}</span>
                </div>
                <div className="metric-value">{statsData?.metrics?.avg_confidence.toFixed(2)}</div>
                <div className="metric-delta delta-up">
                  <span>+0.01</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-header">
                  <span>{t.global_rank}</span>
                </div>
                <div className="metric-value">{statsData?.metrics?.rank}</div>
              </div>
            </div>
          )}

          {/* TAB 2: TABLES descriptive */}
          {activeTab === 'tables' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
              <div className="glass-card">
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  {t.performance_summary}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{t.total_label}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{statsData?.metrics?.total_predictions}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{t.correct_label}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--success-color)' }}>{statsData?.metrics?.correct_predictions}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{t.incorrect_label}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--danger-color)' }}>
                        {statsData?.metrics?.total_predictions - statsData?.metrics?.correct_predictions}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{t.precision_label}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{statsData?.metrics?.accuracy_rate.toFixed(2)}%</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{t.avg_conf_short}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{statsData?.metrics?.avg_confidence.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{t.rank_label}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{statsData?.metrics?.rank}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="glass-card">
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  {t.descriptive_stats_predictions}
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem' }}>Variable</th>
                        <th style={{ padding: '0.5rem' }}>N</th>
                        <th style={{ padding: '0.5rem' }}>Media</th>
                        <th style={{ padding: '0.5rem' }}>Mediana</th>
                        <th style={{ padding: '0.5rem' }}>Desv. Est.</th>
                        <th style={{ padding: '0.5rem' }}>Min</th>
                        <th style={{ padding: '0.5rem' }}>Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {descriptiveVars.map((v, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{v.name}</td>
                          <td style={{ padding: '0.5rem' }}>{v.n}</td>
                          <td style={{ padding: '0.5rem' }}>{v.mean.toFixed(2)}</td>
                          <td style={{ padding: '0.5rem' }}>{v.median.toFixed(2)}</td>
                          <td style={{ padding: '0.5rem' }}>{v.std.toFixed(2)}</td>
                          <td style={{ padding: '0.5rem' }}>{v.min}</td>
                          <td style={{ padding: '0.5rem' }}>{v.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GRAPHS advanced */}
          {activeTab === 'graphs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              
              {/* Confidence distribution and normal curve */}
              <div className="glass-card">
                <h4 style={{ marginBottom: '0.5rem' }}>{t.confidence_distribution_curve}</h4>
                <div style={{ width: '100%', height: '180px' }}>
                  <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                    {/* Bins */}
                    <rect x="30" y="90" width="18" height="30" fill="rgba(99, 102, 241, 0.4)" />
                    <rect x="55" y="70" width="18" height="50" fill="rgba(99, 102, 241, 0.4)" />
                    <rect x="80" y="40" width="18" height="80" fill="rgba(99, 102, 241, 0.4)" />
                    <rect x="105" y="30" width="18" height="90" fill="rgba(99, 102, 241, 0.4)" />
                    <rect x="130" y="20" width="18" height="100" fill="rgba(99, 102, 241, 0.4)" />
                    <rect x="155" y="40" width="18" height="80" fill="rgba(99, 102, 241, 0.4)" />
                    <rect x="180" y="60" width="18" height="60" fill="rgba(99, 102, 241, 0.4)" />
                    <rect x="205" y="80" width="18" height="40" fill="rgba(99, 102, 241, 0.4)" />
                    <rect x="230" y="100" width="18" height="20" fill="rgba(99, 102, 241, 0.4)" />
                    
                    {/* Normal Curve overlay (red stroke) */}
                    <path 
                      d="M 10 115 Q 60 110 95 60 T 140 20 T 185 60 T 235 110 T 290 118" 
                      fill="none" 
                      stroke="red" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                    />
                    
                    <line x1="20" y1="120" x2="280" y2="120" stroke="var(--border-color)" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* CDF chart */}
              <div className="glass-card">
                <h4 style={{ marginBottom: '0.5rem' }}>{t.cdf_title}</h4>
                <div style={{ width: '100%', height: '180px' }}>
                  <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                    {/* Gridlines */}
                    <line x1="30" y1="20" x2="280" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="30" y1="70" x2="280" y2="70" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2" />
                    
                    {/* Line path */}
                    <path 
                      d="M 30 118 L 80 100 L 130 75 L 180 50 L 230 35 L 280 20" 
                      fill="none" 
                      stroke="var(--accent-color)" 
                      strokeWidth="2.5" 
                    />
                    <circle cx="30" cy="118" r="3" fill="var(--accent-color)" />
                    <circle cx="80" cy="100" r="3" fill="var(--accent-color)" />
                    <circle cx="130" cy="75" r="3" fill="var(--accent-color)" />
                    <circle cx="180" cy="50" r="3" fill="var(--accent-color)" />
                    <circle cx="230" cy="35" r="3" fill="var(--accent-color)" />
                    <circle cx="280" cy="20" r="3" fill="var(--accent-color)" />
                    
                    <line x1="30" y1="120" x2="280" y2="120" stroke="var(--border-color)" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Time series */}
              <div className="glass-card">
                <h4 style={{ marginBottom: '0.5rem' }}>{t.confidence_time_evolution}</h4>
                <div style={{ width: '100%', height: '180px' }}>
                  <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                    <path 
                      d="M 30 100 L 80 85 L 130 90 L 180 60 L 230 65 L 280 30" 
                      fill="none" 
                      stroke="var(--accent-color)" 
                      strokeWidth="2.5" 
                    />
                    {/* MA 7 Trend line (red dashed) */}
                    <path 
                      d="M 70 95 L 120 90 L 170 78 L 220 72 L 270 54" 
                      fill="none" 
                      stroke="red" 
                      strokeWidth="1.5" 
                      strokeDasharray="4" 
                    />
                    <line x1="30" y1="120" x2="280" y2="120" stroke="var(--border-color)" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Status breakdown bar chart */}
              <div className="glass-card">
                <h4 style={{ marginBottom: '0.5rem' }}>{t.status_distribution}</h4>
                <div style={{ width: '100%', height: '180px' }}>
                  <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                    {/* Won bar */}
                    <rect x="50" y="40" width="30" height="80" rx="2" fill="var(--success-color)" />
                    <text x="65" y="32" fill="var(--text-primary)" fontSize="9" fontWeight="700" textAnchor="middle">8</text>
                    <text x="65" y="135" fill="var(--text-muted)" fontSize="9" textAnchor="middle">Won</text>
                    
                    {/* Lost bar */}
                    <rect x="135" y="80" width="30" height="40" rx="2" fill="var(--danger-color)" />
                    <text x="150" y="72" fill="var(--text-primary)" fontSize="9" fontWeight="700" textAnchor="middle">4</text>
                    <text x="150" y="135" fill="var(--text-muted)" fontSize="9" textAnchor="middle">Lost</text>

                    {/* Pending bar */}
                    <rect x="220" y="100" width="30" height="20" rx="2" fill="var(--warning-color)" />
                    <text x="235" y="92" fill="var(--text-primary)" fontSize="9" fontWeight="700" textAnchor="middle">2</text>
                    <text x="235" y="135" fill="var(--text-muted)" fontSize="9" textAnchor="middle">Pend.</text>

                    <line x1="30" y1="120" x2="280" y2="120" stroke="var(--border-color)" strokeWidth="1" />
                  </svg>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: REPORTS download forms */}
          {activeTab === 'reports' && (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={22} style={{ color: 'var(--accent-color)' }} />
                {t.generate_reports}
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>Tipo de Reporte</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {["Predicciones", "Estadísticas Descriptivas", "Competencias", "Comprensivo"].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="reportType" 
                        value={type} 
                        checked={reportType === type}
                        onChange={(e) => setReportType(e.target.value)}
                        style={{ accentColor: 'var(--accent-color)' }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>Formato</label>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  {["PDF", "Excel"].map(fmt => (
                    <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="reportFormat" 
                        value={fmt} 
                        checked={reportFormat === fmt}
                        onChange={(e) => setReportFormat(e.target.value)}
                        style={{ accentColor: 'var(--accent-color)' }}
                      />
                      {fmt}
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleDownloadReport}
                disabled={generatingReport}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
              >
                <FileText size={20} />
                {generatingReport ? (language === 'es' ? 'Generando...' : 'Generating...') : (language === 'es' ? 'Generar Reporte' : 'Generate Report')}
              </button>
            </div>
          )}

          {/* TAB 5: INSIGHTS text boxes */}
          {activeTab === 'insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{t.insights_title}</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card" style={{ borderLeft: '4px solid var(--success-color)' }}>
                  <h4 style={{ color: 'var(--success-color)', marginBottom: '0.5rem' }}>{t.performance_analysis}</h4>
                  <p style={{ fontWeight: 700, margin: '0.25rem 0' }}>{t.good_performance}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.good_insight}</p>
                </div>

                <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-color)' }}>
                  <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>{t.confidence_analysis.split(' ')[1]}</h4>
                  <p style={{ fontWeight: 700, margin: '0.25rem 0' }}>{t.moderate_conf}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.moderate_conf_insight}</p>
                </div>
              </div>

              <div className="glass-card">
                <h4 style={{ marginBottom: '1rem' }}>{t.personalized_recommendations}</h4>
                <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  <li>{t.rec1}</li>
                  <li>{t.rec2}</li>
                  <li>{t.rec3}</li>
                  <li>{t.rec4}</li>
                  <li>{t.rec5}</li>
                  <li>{t.rec6}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
