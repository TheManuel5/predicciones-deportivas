import re

with open('frontend/src/pages/Admin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
content = content.replace(
    "const [valResults, setValResults] = useState(null);",
    "const [valResults, setValResults] = useState(null);\n  const [selectedValidationModel, setSelectedValidationModel] = useState('XGBoost');"
)

# Replace the TAB 2 logic
start_marker = "{valResults && ("
end_marker = "{/* Download CSV links */}"
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_html = """{valResults && valResults.multi_model_results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginTop: '1rem' }}>{t.admin_visualizations}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    
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
                  </>
                );
              })()}

              """
    
    content = content[:start_idx] + new_html + content[end_idx:]

with open('frontend/src/pages/Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Admin.jsx successfully.")
