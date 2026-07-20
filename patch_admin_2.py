import re

with open('frontend/src/pages/Admin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>"
end_marker = "</>\n                );"
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_html = """<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
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
"""

content = content[:start_idx] + new_html + content[end_idx:]

with open('frontend/src/pages/Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Admin.jsx successfully.")
