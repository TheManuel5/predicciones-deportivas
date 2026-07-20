import React from 'react';
import { TRANSLATIONS } from '../translations';
import { Check, X } from 'lucide-react';

export default function Premium({ user, setUser, language, apiUrl }) {
  const t = TRANSLATIONS[language];

  const handleUpgrade = async (tier) => {
    try {
      const res = await fetch(`${apiUrl}/api/premium/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          tier: tier
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(prev => ({
            ...prev,
            subscription_tier: tier
          }));
          alert(tier === 'pro' ? t.welcome_pro : t.welcome_elite);
        }
      }
    } catch (e) {
      console.error("Error upgrading tier", e);
    }
  };

  const currentTier = user.subscription_tier.toLowerCase();

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{t.premium_title}</h1>

      {/* Pricing Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
        
        {/* FREE PLAN */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            border: currentTier === 'free' ? '2.5px solid var(--accent-color)' : '1px solid var(--border-color)',
            boxShadow: currentTier === 'free' ? '0 8px 32px var(--accent-glow)' : 'none'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {t.free_plan}
              {currentTier === 'free' && <span style={styles.badge}>{t.current_plan}</span>}
            </h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '1rem 0' }}>{language === 'es' ? 'Gratis' : 'Free'}</div>
            <ul style={styles.featureList}>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Predicciones IA básicas</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Competencias gratuitas</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Estadísticas básicas</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Hasta 50 predicciones/mes</li>
            </ul>
          </div>
          <button 
            disabled={true}
            className="btn-secondary" 
            style={{ width: '100%', marginTop: '2rem', cursor: 'not-allowed' }}
          >
            {currentTier === 'free' ? (language === 'es' ? 'Plan Activo' : 'Active Plan') : 'Plan Básico'}
          </button>
        </div>

        {/* PRO PLAN */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            border: currentTier === 'pro' ? '2.5px solid var(--accent-color)' : '1px solid var(--border-color)',
            boxShadow: currentTier === 'pro' ? '0 8px 32px var(--accent-glow)' : 'none'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {t.pro_plan}
              {currentTier === 'pro' && <span style={styles.badge}>{t.current_plan}</span>}
            </h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '1rem 0' }}>$4.99 / mes</div>
            <ul style={styles.featureList}>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Todas las del plan Free</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Predicciones IA avanzadas</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Acceso a competencias premium</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Análisis detallados</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Reportes PDF personalizados</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Alertas ilimitadas</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Hasta 500 predicciones/mes</li>
            </ul>
          </div>
          <button 
            onClick={() => handleUpgrade('pro')}
            disabled={currentTier === 'pro' || currentTier === 'elite'}
            className="btn-primary" 
            style={{ 
              width: '100%', 
              marginTop: '2rem',
              background: (currentTier === 'pro' || currentTier === 'elite') ? 'var(--border-color)' : 'var(--accent-gradient)',
              color: (currentTier === 'pro' || currentTier === 'elite') ? 'var(--text-muted)' : '#ffffff',
              boxShadow: (currentTier === 'pro' || currentTier === 'elite') ? 'none' : '0 4px 12px var(--accent-glow)',
              cursor: (currentTier === 'pro' || currentTier === 'elite') ? 'not-allowed' : 'pointer'
            }}
          >
            {currentTier === 'pro' ? (language === 'es' ? 'Plan Activo' : 'Active Plan') : t.subscribe_pro}
          </button>
        </div>

        {/* ELITE PLAN */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            border: currentTier === 'elite' ? '2.5px solid var(--accent-color)' : '1px solid var(--border-color)',
            boxShadow: currentTier === 'elite' ? '0 8px 32px var(--accent-glow)' : 'none'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {t.elite_plan}
              {currentTier === 'elite' && <span style={styles.badge}>{t.current_plan}</span>}
            </h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '1rem 0' }}>$9.99 / mes</div>
            <ul style={styles.featureList}>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Todas las del plan Pro</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Acceso a análisis IA en tiempo real</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Consultas personalizadas</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Datos históricos completos</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Predicciones ilimitadas</li>
              <li><Check size={16} style={{ color: 'var(--success-color)' }} /> Prioridad en competencias</li>
            </ul>
          </div>
          <button 
            onClick={() => handleUpgrade('elite')}
            disabled={currentTier === 'elite'}
            className="btn-primary" 
            style={{ 
              width: '100%', 
              marginTop: '2rem',
              background: currentTier === 'elite' ? 'var(--border-color)' : 'var(--accent-gradient)',
              color: currentTier === 'elite' ? 'var(--text-muted)' : '#ffffff',
              boxShadow: currentTier === 'elite' ? 'none' : '0 4px 12px var(--accent-glow)',
              cursor: currentTier === 'elite' ? 'not-allowed' : 'pointer'
            }}
          >
            {currentTier === 'elite' ? (language === 'es' ? 'Plan Activo' : 'Active Plan') : t.subscribe_elite}
          </button>
        </div>

      </div>

      {/* Grid Comparison list */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>{t.additional_benefits}</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.75rem' }}>{t.feature_label}</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Free</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Pro</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Elite</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Predicciones IA básicas', f: true, p: true, e: true },
              { name: 'Predicciones IA avanzadas', f: false, p: true, e: true },
              { name: 'Acceso a competencias', f: true, p: true, e: true },
              { name: 'Reportes PDF', f: false, p: true, e: true },
              { name: 'Alertas personalizadas', f: false, p: true, e: true },
              { name: 'Análisis histórico', f: false, p: true, e: true },
              { name: 'Soporte prioritario', f: false, p: false, e: true },
              { name: 'Consulta con expertos', f: false, p: false, e: true },
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {row.f ? <Check size={18} style={{ color: 'var(--success-color)' }} /> : <X size={18} style={{ color: 'var(--danger-color)' }} />}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {row.p ? <Check size={18} style={{ color: 'var(--success-color)' }} /> : <X size={18} style={{ color: 'var(--danger-color)' }} />}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {row.e ? <Check size={18} style={{ color: 'var(--success-color)' }} /> : <X size={18} style={{ color: 'var(--danger-color)' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  badge: {
    fontSize: '0.7rem',
    background: 'var(--accent-glow)',
    color: 'var(--accent-color)',
    padding: '0.2rem 0.5rem',
    borderRadius: '20px',
    fontWeight: 700
  },
  featureList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem',
    fontSize: '0.95rem',
    color: 'var(--text-secondary)'
  }
};
