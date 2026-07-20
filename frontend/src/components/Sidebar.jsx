import React from 'react';
import { 
  Home, 
  TrendingUp, 
  Bot, 
  Trophy, 
  BarChart3, 
  Bell, 
  CreditCard, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon, 
  Globe,
  Database
} from 'lucide-react';
import { TRANSLATIONS } from '../translations';

export default function Sidebar({
  user,
  language,
  setLanguage,
  darkMode,
  setDarkMode,
  currentPage,
  setCurrentPage,
  onLogout,
  supabaseStatus
}) {
  const t = TRANSLATIONS[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard.split(' ')[1] || t.dashboard, icon: Home },
    { id: 'my_predictions', label: t.my_predictions.split(' ')[1] || t.my_predictions, icon: TrendingUp },
    { id: 'ai_predictions', label: t.ai_predictions.split(' ')[1] || t.ai_predictions, icon: Bot },
    { id: 'ai_assistant', label: t.ai_assistant_page.split(' ')[1] || t.ai_assistant_page, icon: Bot },
    { id: 'competitions', label: t.competitions.split(' ')[1] || t.competitions, icon: Trophy },
    { id: 'statistics', label: t.statistics.split(' ')[1] || t.statistics, icon: BarChart3 },
    { id: 'alerts', label: t.alerts.split(' ')[1] || t.alerts, icon: Bell },
    { id: 'premium', label: t.premium.split(' ')[1] || t.premium, icon: CreditCard },
  ];

  if (user && user.is_admin) {
    menuItems.push({ id: 'admin', label: t.admin.split(' ')[1] || t.admin, icon: ShieldAlert });
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <span style={styles.logoIcon}>⚽</span>
        <h2 style={styles.logoText}>SportsPredict</h2>
      </div>

      <hr style={styles.divider} />

      {/* Language and Dark Mode Controls */}
      <div style={styles.controlsRow}>
        <div style={styles.controlBox}>
          <Globe size={16} style={{ marginRight: 4 }} />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={styles.select}
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </div>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          style={styles.themeBtn}
          title={darkMode ? t.light_mode : t.dark_mode}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Supabase Status Banner */}
      <div style={styles.statusBanner}>
        <Database size={14} style={{ marginRight: 6 }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {supabaseStatus === 'connected' ? t.connected_supabase : 
           supabaseStatus === 'warning' ? t.supabase_warning : t.local_mode}
        </span>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                ...styles.navBtn,
                ...(isActive ? styles.navBtnActive : {})
              }}
            >
              <Icon size={18} style={isActive ? styles.iconActive : styles.icon} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <div style={styles.profileSection}>
          <div style={styles.avatar}>👤</div>
          <div style={styles.userInfo}>
            <div style={styles.username}>{user.username}</div>
            <div style={styles.tierBadge}>{user.subscription_tier.toUpperCase()}</div>
          </div>
        </div>

        <button onClick={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} style={{ marginRight: 8 }} />
          {t.logout_button}
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '280px',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  logoIcon: {
    fontSize: '2rem'
  },
  logoText: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.4rem',
    fontWeight: 800,
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  divider: {
    border: 'none',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '1rem'
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    gap: '0.5rem'
  },
  controlBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.25rem 0.5rem',
    flex: 1
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'var(--font-body)'
  },
  themeBtn: {
    background: 'var(--bg-secondary)',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.5rem',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '1'
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    background: 'rgba(99, 102, 241, 0.06)',
    border: '1px solid rgba(99, 102, 241, 0.1)',
    color: 'var(--accent-color)',
    marginBottom: '1.5rem'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: 1
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'transparent',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-title)',
    fontWeight: 500,
    fontSize: '0.95rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  navBtnActive: {
    background: 'var(--accent-gradient)',
    color: '#ffffff',
    fontWeight: 600,
    boxShadow: '0 4px 12px var(--accent-glow)'
  },
  icon: {
    color: 'var(--text-muted)'
  },
  iconActive: {
    color: '#ffffff'
  },
  footer: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)'
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatar: {
    fontSize: '1.5rem',
    background: 'var(--bg-secondary)',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid var(--border-color)'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  username: {
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontSize: '0.95rem'
  },
  tierBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--accent-color)',
    letterSpacing: '0.05em'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1.5px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.6rem',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-title)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }
};
