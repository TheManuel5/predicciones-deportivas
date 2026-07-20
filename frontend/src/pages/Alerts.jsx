import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { Bell, Shield, Settings, Check } from 'lucide-react';

export default function Alerts({ user, language, apiUrl }) {
  const t = TRANSLATIONS[language];
  const [alerts, setAlerts] = useState([]);
  const [config, setConfig] = useState({
    new_matches: true,
    ai_predictions: true,
    competitions: true,
    ranking_changes: true,
    premium_offers: false
  });
  const [saveStatus, setSaveStatus] = useState(false);

  const fetchAlertsData = async () => {
    try {
      // Get config
      const configRes = await fetch(`${apiUrl}/api/alerts/config`);
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      // Get timeline alerts
      const alertsRes = await fetch(`${apiUrl}/api/alerts`);
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }
    } catch (e) {
      console.error("Error loading alerts data", e);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, []);

  const handleToggle = (key) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/alerts/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSaveStatus(true);
        setTimeout(() => setSaveStatus(false), 3000);
      }
    } catch (e) {
      console.error("Error saving alerts config", e);
    }
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{t.alerts_title}</h1>

      <div className="dashboard-grid">
        {/* Left pane: Recent Timeline notifications */}
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t.recent_notifications}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className="glass-card" 
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  alignItems: 'flex-start',
                  background: alert.read ? 'var(--glass-bg)' : 'rgba(245, 158, 11, 0.04)',
                  borderLeft: alert.read ? '1px solid var(--border-color)' : '4px solid var(--warning-color)'
                }}
              >
                <span style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>{alert.icon}</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {alert.title}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{alert.time}</span>
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right pane: Config switches */}
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t.config_alerts}</h2>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <label style={styles.toggleRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚽</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t.new_matches_check}</span>
              </div>
              <input 
                type="checkbox" 
                checked={config.new_matches} 
                onChange={() => handleToggle('new_matches')}
                style={styles.checkbox}
              />
            </label>

            <label style={styles.toggleRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🤖</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t.ai_predictions_check}</span>
              </div>
              <input 
                type="checkbox" 
                checked={config.ai_predictions} 
                onChange={() => handleToggle('ai_predictions')}
                style={styles.checkbox}
              />
            </label>

            <label style={styles.toggleRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🏆</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t.competitions_check}</span>
              </div>
              <input 
                type="checkbox" 
                checked={config.competitions} 
                onChange={() => handleToggle('competitions')}
                style={styles.checkbox}
              />
            </label>

            <label style={styles.toggleRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📈</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t.ranking_changes_check}</span>
              </div>
              <input 
                type="checkbox" 
                checked={config.ranking_changes} 
                onChange={() => handleToggle('ranking_changes')}
                style={styles.checkbox}
              />
            </label>

            <label style={styles.toggleRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💎</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t.premium_offers_check}</span>
              </div>
              <input 
                type="checkbox" 
                checked={config.premium_offers} 
                onChange={() => handleToggle('premium_offers')}
                style={styles.checkbox}
              />
            </label>

            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

            <button 
              onClick={handleSaveConfig} 
              className="btn-primary" 
              style={{ justifyContent: 'center', padding: '0.65rem' }}
            >
              {saveStatus ? <Check size={18} /> : null}
              {saveStatus ? t.config_saved : t.save_config}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: 'var(--accent-color)',
    cursor: 'pointer'
  }
};
