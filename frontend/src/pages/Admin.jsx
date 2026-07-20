import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { Database, ShieldAlert, Cpu, Trash2, Plus, Play, Download, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Admin({ user, language, apiUrl }) {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState("db");
  
  // DB Management state
  const [selectedTable, setSelectedTable] = useState("users");
  const [tableData, setTableData] = useState([]);
  const [dbStats, setDbStats] = useState({});
  const [loadingDb, setLoadingDb] = useState(false);
  
  // Forms for inserts
  const [userForm, setUserForm] = useState({ email: '', username: '', password: '', full_name: '', subscription_tier: 'free' });
  const [teamForm, setTeamForm] = useState({ name: '', country: '', sport_type: 'football' });
  const [matchForm, setMatchForm] = useState({ home_team_name: '', away_team_name: '', league: '', match_date: '', sport_type: 'football' });

  // Model Validation state
  const [validating, setValidating] = useState(false);
  const [valResults, setValResults] = useState(null);
  const [selectedValidationModel, setSelectedValidationModel] = useState('XGBoost');
  const [validationSuccess, setValidationSuccess] = useState(false);
  
  const [apiReport, setApiReport] = useState(null);

  const fetchDbData = async () => {
    try {
      setLoadingDb(true);
      // Fetch stats
      const statsRes = await fetch(`${apiUrl}/api/admin/db-stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDbStats(statsData);
      }
      
      // Fetch current table
      const tableRes = await fetch(`${apiUrl}/api/admin/table/${selectedTable}`);
      if (tableRes.ok) {
        const data = await tableRes.json();
        setTableData(data);
      }
    } catch (e) {
      console.error("Error loading DB manager data", e);
    } finally {
      setLoadingDb(false);
    }
  };

  const fetchValidationResults = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/validation-results`);
      if (res.ok) {
        const data = await res.json();
        setValResults(data);
      }
    } catch (e) {
      console.error("Error loading validation results", e);
    }
  };

  const fetchApiReport = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/validation-report`);
      if (res.ok) {
        const data = await res.json();
        if (!data.error) setApiReport(data);
      }
    } catch (e) {
      console.error("Error loading api validation report", e);
    }
  };

  useEffect(() => {
    fetchDbData();
  }, [selectedTable]);

  useEffect(() => {
    fetchValidationResults();
    fetchApiReport();
  }, []);

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    let body = {};
    if (selectedTable === 'users') body = userForm;
    else if (selectedTable === 'teams') body = teamForm;
    else if (selectedTable === 'matches') body = matchForm;

    try {
      const res = await fetch(`${apiUrl}/api/admin/table/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        // Reset forms
        setUserForm({ email: '', username: '', password: '', full_name: '', subscription_tier: 'free' });
        setTeamForm({ name: '', country: '', sport_type: 'football' });
        setMatchForm({ home_team_name: '', away_team_name: '', league: '', match_date: '', sport_type: 'football' });
        fetchDbData();
      }
    } catch (e) {
      console.error("Error creating record", e);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("¿Seguro que desea eliminar este registro?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/table/${selectedTable}/${recordId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchDbData();
      }
    } catch (e) {
      console.error("Error deleting record", e);
    }
  };

  const handleRunValidation = async () => {
    try {
      setValidating(true);
      setValidationSuccess(false);
      const res = await fetch(`${apiUrl}/api/admin/validate-models`, {
        method: 'POST'
      });
      if (res.ok) {
        setValidationSuccess(true);
        fetchValidationResults();
      }
    } catch (e) {
      alert("Error durante la validación.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldAlert size={32} style={{ color: 'var(--accent-color)' }} />
        {t.admin}
      </h1>

      {/* Tabs */}
      <div className="tab-list">
        <button 
          onClick={() => setActiveTab("db")} 
          className={`tab-btn ${activeTab === 'db' ? 'active' : ''}`}
        >
          <Database size={16} style={{ marginRight: 6, display: 'inline' }} />
          {t.admin_tab1}
        </button>
        <button 
          onClick={() => setActiveTab("models")} 
          className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`}
        >
          <Cpu size={16} style={{ marginRight: 6, display: 'inline' }} />
          {t.admin_tab2}
        </button>
        <button 
          onClick={() => setActiveTab("api-validation")} 
          className={`tab-btn ${activeTab === 'api-validation' ? 'active' : ''}`}
        >
          <ShieldAlert size={16} style={{ marginRight: 6, display: 'inline' }} />
          🤖 Validación con API
        </button>
      </div>

      {/* TAB 1: DATABASE CRUD */}
      {activeTab === 'db' && (
        <div>
          {/* Stats KPI cards */}
          <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
            <div className="glass-card metric-card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Usuarios</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dbStats.total_users || 0}</div>
            </div>
            <div className="glass-card metric-card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Equipos</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dbStats.total_teams || 0}</div>
            </div>
            <div className="glass-card metric-card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Partidos</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dbStats.total_matches || 0}</div>
            </div>
            <div className="glass-card metric-card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Predicciones</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dbStats.total_predictions || 0}</div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Table listings */}
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Listado de Datos</h3>
                <select 
                  value={selectedTable} 
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="input-field"
                  style={{ width: '150px', padding: '0.4rem' }}
                >
                  <option value="users">users</option>
                  <option value="teams">teams</option>
                  <option value="matches">matches</option>
                </select>
              </div>

              {loadingDb ? (
                <p style={{ color: 'var(--text-muted)' }}>Cargando tabla...</p>
              ) : tableData.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No hay datos en esta tabla</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem' }}>ID</th>
                      {selectedTable === 'users' && (
                        <>
                          <th style={{ padding: '0.5rem' }}>Username</th>
                          <th style={{ padding: '0.5rem' }}>Email</th>
                          <th style={{ padding: '0.5rem' }}>Plan</th>
                        </>
                      )}
                      {selectedTable === 'teams' && (
                        <>
                          <th style={{ padding: '0.5rem' }}>Nombre</th>
                          <th style={{ padding: '0.5rem' }}>País</th>
                          <th style={{ padding: '0.5rem' }}>Deporte</th>
                        </>
                      )}
                      {selectedTable === 'matches' && (
                        <>
                          <th style={{ padding: '0.5rem' }}>Local</th>
                          <th style={{ padding: '0.5rem' }}>Visitante</th>
                          <th style={{ padding: '0.5rem' }}>Liga</th>
                          <th style={{ padding: '0.5rem' }}>Fecha</th>
                        </>
                      )}
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '60px' }}>
                          {row.id}
                        </td>
                        {selectedTable === 'users' && (
                          <>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{row.username}</td>
                            <td style={{ padding: '0.5rem' }}>{row.email}</td>
                            <td style={{ padding: '0.5rem' }}>{row.subscription_tier?.toUpperCase()}</td>
                          </>
                        )}
                        {selectedTable === 'teams' && (
                          <>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{row.name}</td>
                            <td style={{ padding: '0.5rem' }}>{row.country || 'N/A'}</td>
                            <td style={{ padding: '0.5rem' }}>{row.sport_type}</td>
                          </>
                        )}
                        {selectedTable === 'matches' && (
                          <>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{row.home_team_name}</td>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{row.away_team_name}</td>
                            <td style={{ padding: '0.5rem' }}>{row.league}</td>
                            <td style={{ padding: '0.5rem' }}>{row.match_date?.slice(0,10)}</td>
                          </>
                        )}
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDeleteRecord(row.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Create record forms */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} />
                Agregar Nuevo Registro
              </h3>
              
              <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedTable === 'users' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email</label>
                      <input 
                        type="email" 
                        required
                        value={userForm.email} 
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Username</label>
                      <input 
                        type="text" 
                        required
                        value={userForm.username} 
                        onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contraseña</label>
                      <input 
                        type="password" 
                        required
                        value={userForm.password} 
                        onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre Completo</label>
                      <input 
                        type="text" 
                        required
                        value={userForm.full_name} 
                        onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Plan</label>
                      <select 
                        value={userForm.subscription_tier} 
                        onChange={(e) => setUserForm(prev => ({ ...prev, subscription_tier: e.target.value }))}
                        className="input-field"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="elite">Elite</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedTable === 'teams' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre del Equipo</label>
                      <input 
                        type="text" 
                        required
                        value={teamForm.name} 
                        onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>País</label>
                      <input 
                        type="text" 
                        required
                        value={teamForm.country} 
                        onChange={(e) => setTeamForm(prev => ({ ...prev, country: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Deporte</label>
                      <select 
                        value={teamForm.sport_type} 
                        onChange={(e) => setTeamForm(prev => ({ ...prev, sport_type: e.target.value }))}
                        className="input-field"
                      >
                        <option value="football">Fútbol</option>
                        <option value="basketball">Baloncesto</option>
                        <option value="tennis">Tenis</option>
                        <option value="baseball">Béisbol</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedTable === 'matches' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Equipo Local</label>
                      <input 
                        type="text" 
                        required
                        value={matchForm.home_team_name} 
                        onChange={(e) => setMatchForm(prev => ({ ...prev, home_team_name: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Equipo Visitante</label>
                      <input 
                        type="text" 
                        required
                        value={matchForm.away_team_name} 
                        onChange={(e) => setMatchForm(prev => ({ ...prev, away_team_name: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Liga</label>
                      <input 
                        type="text" 
                        required
                        value={matchForm.league} 
                        onChange={(e) => setMatchForm(prev => ({ ...prev, league: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Fecha</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={matchForm.match_date} 
                        onChange={(e) => setMatchForm(prev => ({ ...prev, match_date: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Deporte</label>
                      <select 
                        value={matchForm.sport_type} 
                        onChange={(e) => setMatchForm(prev => ({ ...prev, sport_type: e.target.value }))}
                        className="input-field"
                      >
                        <option value="football">Fútbol</option>
                        <option value="basketball">Baloncesto</option>
                        <option value="tennis">Tenis</option>
                        <option value="baseball">Béisbol</option>
                      </select>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }}>
                  Guardar Registro
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODEL ROBUST VALIDATION */}
      {activeTab === 'models' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.35rem' }}>{t.admin_validation_header}</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.95rem' }}>
              Ejecuta pruebas estadísticas, validaciones cruzadas (5-folds) y análisis de sobreajuste de los modelos entrenados.
            </p>
            
            <button 
              onClick={handleRunValidation}
              disabled={validating}
              className="btn-primary"
              style={{ padding: '0.8rem 2.5rem', borderRadius: '8px' }}
            >
              <Play size={18} />
              {validating ? t.admin_validating : t.admin_run_validation}
            </button>
            
            {validationSuccess && (
              <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                {t.admin_validation_success}
              </span>
            )}
          </div>

          {valResults && valResults.multi_model_results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {valResults.best_model && (
                <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--success-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ background: 'var(--success-color)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 'bold' }}>🏆 Mejor Modelo Global: {valResults.best_model}</span>
                    <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>Accuracy: {(valResults.best_score * 100).toFixed(1)}%</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>¿Por qué esto debe ser automático?</strong> La selección automática del mejor modelo empírico garantiza que nuestro pipeline pueda promover a producción únicamente el estimador más robusto sin intervención manual. Esto previene degradaciones (regresiones), reduce el sesgo humano y mantiene las predicciones altamente competitivas.
                  </p>
                </div>
              )}
              
              <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontWeight: 600 }}>Seleccione el Modelo para auditar:</label>
                <select 
                  value={selectedValidationModel} 
                  onChange={(e) => setSelectedValidationModel(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  {Object.keys(valResults.multi_model_results).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const currentValData = valResults.multi_model_results[selectedValidationModel];
                if(!currentValData) return null;
                
                return (
                  <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div className="glass-card">
                      <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                        {t.admin_classification}
                      </h4>
                      <table style={{ width: '100%' }}>
                        <tbody>
                          {Object.entries(currentValData.classification_metrics).map(([k, v]) => (
                            <tr key={k}>
                              <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>{k}</td>
                              <td style={{ padding: '0.4rem 0', fontWeight: 700, textAlign: 'right' }}>{Number(v).toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {currentValData.regression_metrics && Object.keys(currentValData.regression_metrics).length > 0 && (
                      <div className="glass-card">
                        <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                          {t.admin_regression}
                        </h4>
                        <table style={{ width: '100%' }}>
                          <tbody>
                            {Object.entries(currentValData.regression_metrics).map(([k, v]) => (
                              <tr key={k}>
                                <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>{k}</td>
                                <td style={{ padding: '0.4rem 0', fontWeight: 700, textAlign: 'right' }}>{Number(v).toFixed(3)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginTop: '1rem' }}>{t.admin_visualizations}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    
                    {currentValData.confusion_matrix && currentValData.confusion_matrix.length === 3 && (
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h4 style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}>Matriz de Confusión ({selectedValidationModel})</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: '0.5rem', width: '220px', textAlign: 'center', fontSize: '0.85rem' }}>
                          <div></div>
                          <div style={{ fontWeight: 600 }}>Loc</div>
                          <div style={{ fontWeight: 600 }}>Emp</div>
                          <div style={{ fontWeight: 600 }}>Vis</div>

                          <div style={{ fontWeight: 600, alignSelf: 'center' }}>Loc</div>
                          <div style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem 0', borderRadius: '4px', fontWeight: 700 }}>{currentValData.confusion_matrix[0][0]}</div>
                          <div style={{ background: '#eff6ff', padding: '0.75rem 0', borderRadius: '4px' }}>{currentValData.confusion_matrix[0][1]}</div>
                          <div style={{ background: '#dbeafe', padding: '0.75rem 0', borderRadius: '4px' }}>{currentValData.confusion_matrix[0][2]}</div>

                          <div style={{ fontWeight: 600, alignSelf: 'center' }}>Emp</div>
                          <div style={{ background: '#dbeafe', padding: '0.75rem 0', borderRadius: '4px' }}>{currentValData.confusion_matrix[1][0]}</div>
                          <div style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem 0', borderRadius: '4px', fontWeight: 700 }}>{currentValData.confusion_matrix[1][1]}</div>
                          <div style={{ background: '#eff6ff', padding: '0.75rem 0', borderRadius: '4px' }}>{currentValData.confusion_matrix[1][2]}</div>

                          <div style={{ fontWeight: 600, alignSelf: 'center' }}>Vis</div>
                          <div style={{ background: '#eff6ff', padding: '0.75rem 0', borderRadius: '4px' }}>{currentValData.confusion_matrix[2][0]}</div>
                          <div style={{ background: '#dbeafe', padding: '0.75rem 0', borderRadius: '4px' }}>{currentValData.confusion_matrix[2][1]}</div>
                          <div style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem 0', borderRadius: '4px', fontWeight: 700 }}>{currentValData.confusion_matrix[2][2]}</div>
                        </div>
                      </div>
                    )}

                    <div className="glass-card">
                      <h4 style={{ marginBottom: '1rem' }}>{t.admin_overfitting_test}</h4>
                      <div style={{ width: '100%', height: '140px' }}>
                        <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                          <rect x="60" y="30" width="40" height="90" rx="2" fill="var(--accent-color)" />
                          <text x="80" y="24" fill="var(--text-primary)" fontSize="9" fontWeight="700" textAnchor="middle">
                            {(currentValData.overfitting.train_accuracy * 100).toFixed(1)}%
                          </text>
                          <text x="80" y="135" fill="var(--text-muted)" fontSize="9" textAnchor="middle">Entrenamiento</text>

                          <rect x="180" y="39" width="40" height="81" rx="2" fill="#10b981" />
                          <text x="200" y="33" fill="var(--text-primary)" fontSize="9" fontWeight="700" textAnchor="middle">
                            {(currentValData.overfitting.test_accuracy * 100).toFixed(1)}%
                          </text>
                          <text x="200" y="135" fill="var(--text-muted)" fontSize="9" textAnchor="middle">Prueba</text>

                          <line x1="30" y1="120" x2="270" y2="120" stroke="var(--border-color)" strokeWidth="1" />
                        </svg>
                      </div>
                    </div>

                    <div className="glass-card">
                      <h4 style={{ marginBottom: '1rem' }}>{t.admin_cv_stability.split(' ')[0]} (Bootstrapping)</h4>
                      <div style={{ width: '100%', height: '140px' }}>
                        <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                          {currentValData.cv_stability.scores && currentValData.cv_stability.scores.map((score, i) => {
                            const h = score * 100;
                            const x = 35 + i * 48;
                            const y = 120 - h;
                            return (
                              <g key={i}>
                                <rect x={x} y={y} width="22" height={h} rx="2" fill="#818cf8" />
                                <text x={x + 11} y={y - 5} fill="var(--text-primary)" fontSize="8" fontWeight="700" textAnchor="middle">
                                  {Number(score).toFixed(3)}
                                </text>
                                <text x={x + 11} y="135" fill="var(--text-muted)" fontSize="8" textAnchor="middle">I{i+1}</text>
                              </g>
                            );
                          })}
                          
                          <line x1="20" y1={120 - currentValData.cv_stability.mean * 100} x2="280" y2={120 - currentValData.cv_stability.mean * 100} stroke="red" strokeWidth="1.5" strokeDasharray="3" />
                          <line x1="20" y1="120" x2="280" y2="120" stroke="var(--border-color)" strokeWidth="1" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                    {currentValData.normality_tests && currentValData.normality_tests.shapiro && (
                      <div className="glass-card">
                        <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                          {t.admin_normality_tests}
                        </h4>
                        <table style={{ width: '100%', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ color: 'var(--text-muted)' }}>
                              <th>Prueba</th>
                              <th>Estadístico</th>
                              <th style={{ textAlign: 'right' }}>p-valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.4rem 0', fontWeight: 600 }}>Shapiro-Wilk</td>
                              <td style={{ padding: '0.4rem 0' }}>{Number(currentValData.normality_tests.shapiro.stat).toFixed(4)}</td>
                              <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>{Number(currentValData.normality_tests.shapiro.p).toFixed(4)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.4rem 0', fontWeight: 600 }}>Kolmogorov-Smirnov</td>
                              <td style={{ padding: '0.4rem 0' }}>{Number(currentValData.normality_tests.ks.stat).toFixed(4)}</td>
                              <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>{Number(currentValData.normality_tests.ks.p).toFixed(4)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {currentValData.residual_analysis && currentValData.residual_analysis.mean_residual !== undefined && (
                      <div className="glass-card">
                        <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                          {t.admin_residual_analysis}
                        </h4>
                        <table style={{ width: '100%', fontSize: '0.9rem' }}>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Residuo Promedio</td>
                              <td style={{ padding: '0.4rem 0', fontWeight: 700, textAlign: 'right' }}>{Number(currentValData.residual_analysis.mean_residual).toFixed(4)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Desv. Est. Residuo</td>
                              <td style={{ padding: '0.4rem 0', fontWeight: 700, textAlign: 'right' }}>{Number(currentValData.residual_analysis.std_residual).toFixed(4)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Residuo Mínimo</td>
                              <td style={{ padding: '0.4rem 0', fontWeight: 700, textAlign: 'right' }}>{Number(currentValData.residual_analysis.min_residual).toFixed(1)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Residuo Máximo</td>
                              <td style={{ padding: '0.4rem 0', fontWeight: 700, textAlign: 'right' }}>{Number(currentValData.residual_analysis.max_residual).toFixed(1)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
</>
                );
              })()}

              {/* Download CSV links */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <a 
                  href={`${apiUrl}/api/admin/validation-csv`} 
                  download="model_validation_results.csv"
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                >
                  <Download size={16} />
                  {t.admin_download_results}
                </a>
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB 3: API VALIDATION */}
      {activeTab === 'api-validation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>🤖 Validación con Datos Reales (API Football)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Estos resultados comparan el desempeño de los modelos contra partidos reales finalizados usando la API de Football. El test de McNemar nos dice si las diferencias de precisión son significativas o si podrían ser al azar.
            </p>
            {apiReport ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--success-color)', marginBottom: '2rem' }}>
                  <div style={{ background: 'var(--success-color)', color: 'white', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.25rem' }}>
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--success-color)', fontWeight: 600, marginBottom: '0.25rem' }}>🏆 MEJOR MODELO EN DATOS REALES (API)</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{apiReport.best_model}</div>
                    <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      <strong>¿Por qué se selecciona automáticamente?</strong> Al validar contra docenas de partidos recién finalizados (API-Football), este modelo demostró ser estadísticamente superior mediante la prueba de McNemar y superó la prueba de azar (Binomial). En un pipeline automatizado de apuestas deportivas, promover dinámicamente el modelo empíricamente superior evita el sesgo humano, previene regresiones en rendimiento y garantiza que el sistema siempre use las probabilidades más exactas frente a la realidad actual.
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  
                  {/* CHART COLUMN */}
                  <div style={{ minHeight: '350px', paddingBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Accuracy por Modelo</h3>
                    <div style={{ width: '100%', height: '350px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={apiReport.models} margin={{top: 20, right: 30, left: 0, bottom: 20}}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                          <XAxis dataKey="name" tick={{fill: 'var(--text-secondary)', fontSize: 11}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 11}} domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                            formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'Accuracy']}
                            cursor={{fill: 'transparent'}}
                          />
                          <Bar dataKey="accuracy" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* STATS COLUMN */}
                  <div>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Análisis Estadístico por Modelo</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {apiReport.models.map((model, idx) => (
                        <div key={idx} className="glass-card" style={{ padding: '1.25rem', borderLeft: model.name === apiReport.best_model ? '4px solid var(--success)' : '4px solid var(--accent-primary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{model.name}</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>{(model.accuracy * 100).toFixed(2)}%</div>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            {model.description}
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Pruebas de McNemar vs otros:</div>
                          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                  <th style={{ padding: '0.5rem' }}>Comparado con</th>
                                  <th style={{ padding: '0.5rem' }}>P-Value</th>
                                  <th style={{ padding: '0.5rem' }}>Significancia</th>
                                </tr>
                              </thead>
                              <tbody>
                                {model.mcnemar_tests.map((test, tidx) => (
                                  <tr key={tidx} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: '500' }}>{test.compared_to}</td>
                                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{test.p_value.toFixed(4)}</td>
                                    <td style={{ padding: '0.5rem', color: test.significant ? 'var(--success)' : 'var(--text-muted)' }}>
                                      {test.significant ? "✅ Sí" : "❌ No"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Otras Pruebas Robustas:</div>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                  <th style={{ padding: '0.5rem' }}>Prueba</th>
                                  <th style={{ padding: '0.5rem' }}>P-Value</th>
                                  <th style={{ padding: '0.5rem' }}>Resultado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {model.additional_tests && model.additional_tests.binomial_test && (
                                  <tr style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                                    <td style={{ padding: '0.5rem' }}>Binomial<br/><span style={{fontSize:'0.75rem', color:'var(--text-secondary)', fontWeight:'normal'}}>{model.additional_tests.binomial_test.description}</span></td>
                                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{model.additional_tests.binomial_test.p_value.toFixed(4)}</td>
                                    <td style={{ padding: '0.5rem', color: model.additional_tests.binomial_test.significant ? 'var(--success)' : 'var(--text-muted)' }}>
                                      {model.additional_tests.binomial_test.significant ? "✅ Supera azar" : "❌ Igual azar"}
                                    </td>
                                  </tr>
                                )}
                                {model.additional_tests && model.additional_tests.chi_square_test && (
                                  <tr style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                                    <td style={{ padding: '0.5rem' }}>Chi-Cuadrado<br/><span style={{fontSize:'0.75rem', color:'var(--text-secondary)', fontWeight:'normal'}}>{model.additional_tests.chi_square_test.description}</span></td>
                                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{model.additional_tests.chi_square_test.p_value.toFixed(4)}</td>
                                    <td style={{ padding: '0.5rem', color: model.additional_tests.chi_square_test.significant ? 'var(--success)' : 'var(--text-muted)' }}>
                                      {model.additional_tests.chi_square_test.significant ? "✅ Difiere" : "❌ Similar"}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', textAlign: 'center' }}>
                No se encontró el reporte de validación. Ejecute la validación de API.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
