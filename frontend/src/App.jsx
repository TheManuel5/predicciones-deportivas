import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MyPredictions from './pages/MyPredictions';
import AIPredictions from './pages/AIPredictions';
import AIAssistant from './pages/AIAssistant';
import Competitions from './pages/Competitions';
import Statistics from './pages/Statistics';
import Alerts from './pages/Alerts';
import Premium from './pages/Premium';
import Admin from './pages/Admin';
import { TRANSLATIONS } from './translations';

const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url || url.includes('127.0.0.1') || url.includes('localhost')) {
    if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
      return 'https://sports-predict-backend.onrender.com';
    }
    url = 'http://127.0.0.1:8000';
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
};

const API_URL = getApiUrl();

export default function App() {
  // Global App settings states
  const [language, setLanguage] = useState('es');
  const [darkMode, setDarkMode] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [modeChosen, setModeChosen] = useState(false); // guest or logged in
  const [user, setUser] = useState({
    user_id: 'guest_user',
    username: 'Invitado',
    full_name: 'Invitado',
    subscription_tier: 'free',
    is_admin: false
  });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [supabaseStatus, setSupabaseStatus] = useState('offline');

  // Auth Inputs
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const t = TRANSLATIONS[language];

  // Monitor Dark mode class
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Check Supabase connection on startup
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.supabase_connected) setSupabaseStatus('connected');
          else if (data.supabase_available) setSupabaseStatus('warning');
          else setSupabaseStatus('offline');
        }
      } catch (e) {
        setSupabaseStatus('offline');
      }
    };
    checkStatus();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser({
          user_id: userData.user_id,
          username: userData.username,
          full_name: userData.full_name,
          subscription_tier: userData.subscription_tier,
          is_admin: userData.is_admin
        });
        setAuthenticated(true);
        setModeChosen(true);
      } else {
        const err = await res.json();
        setLoginError(err.detail || t.login_error);
      }
    } catch (e) {
      setLoginError(t.login_error);
    }
  };

  const handleGuestAccess = () => {
    setUser({
      user_id: 'guest_user_' + Math.random().toString(36).substring(2, 10),
      username: 'Invitado',
      full_name: 'Invitado',
      subscription_tier: 'free',
      is_admin: false
    });
    setAuthenticated(false);
    setModeChosen(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setModeChosen(false);
    setCurrentPage('dashboard');
    setUser({
      user_id: 'guest_user',
      username: 'Invitado',
      full_name: 'Invitado',
      subscription_tier: 'free',
      is_admin: false
    });
    setLoginUsername("");
    setLoginPassword("");
  };

  // Login Screen Component
  if (!modeChosen) {
    return (
      <div style={loginStyles.container}>
        <div className="glass-card fade-in" style={loginStyles.card}>
          <div style={loginStyles.logoHeader}>
            <span style={{ fontSize: '2.5rem' }}>⚽</span>
            <h1 style={loginStyles.title}>SportsPredict Pro</h1>
          </div>
          
          <h3 style={loginStyles.subtitle}>{t.login_title}</h3>

          <form onSubmit={handleLoginSubmit} style={loginStyles.form}>
            <div style={loginStyles.inputGroup}>
              <label style={loginStyles.label}>{t.username}</label>
              <input 
                type="text" 
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                className="input-field"
                placeholder={t.username}
              />
            </div>

            <div style={loginStyles.inputGroup}>
              <label style={loginStyles.label}>{t.password}</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: 600 }}>
                {loginError}
              </span>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {t.login_button}
            </button>
          </form>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

          <div style={loginStyles.guestBox}>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{t.guest_mode}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {t.guest_info}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
              Credenciales de prueba:<br />
              - Admin: admin / admin123<br />
              - Usuario: usuario / usuario123
            </p>
            <button onClick={handleGuestAccess} className="btn-secondary" style={{ width: '100%', padding: '0.6rem' }}>
              {t.continue_as_guest}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Main dashboard page rendering router
  return (
    <div className="app-container">
      <Sidebar 
        user={user} 
        language={language}
        setLanguage={setLanguage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        supabaseStatus={supabaseStatus}
      />

      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard user={user} language={language} apiUrl={API_URL} />}
        {currentPage === 'my_predictions' && <MyPredictions user={user} language={language} apiUrl={API_URL} />}
        {currentPage === 'ai_predictions' && <AIPredictions user={user} language={language} apiUrl={API_URL} />}
        {currentPage === 'ai_assistant' && <AIAssistant user={user} language={language} apiUrl={API_URL} />}
        {currentPage === 'competitions' && <Competitions user={user} language={language} apiUrl={API_URL} />}
        {currentPage === 'statistics' && <Statistics user={user} language={language} apiUrl={API_URL} />}
        {currentPage === 'alerts' && <Alerts user={user} language={language} apiUrl={API_URL} />}
        {currentPage === 'premium' && <Premium user={user} setUser={setUser} language={language} apiUrl={API_URL} />}
        {currentPage === 'admin' && user.is_admin && <Admin user={user} language={language} apiUrl={API_URL} />}
      </main>
    </div>
  );
}

const loginStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 50%, var(--bg-primary) 0%, var(--bg-sidebar) 100%)',
    padding: '1.5rem'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem 2rem'
  },
  logoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem'
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.65rem',
    fontWeight: 800,
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: 'var(--text-primary)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  guestBox: {
    background: 'rgba(99, 102, 241, 0.04)',
    border: '1px dashed var(--border-color)',
    borderRadius: '12px',
    padding: '1rem',
    textAlign: 'center'
  }
};
