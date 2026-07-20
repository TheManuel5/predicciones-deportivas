import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { Trophy, Users, Award, ShieldCheck } from 'lucide-react';

export default function Competitions({ user, language, apiUrl }) {
  const t = TRANSLATIONS[language];
  const [competitions, setCompetitions] = useState([]);
  const [joinedList, setJoinedList] = useState([]);
  const [joinStatus, setJoinStatus] = useState({}); // compId -> status/msg

  const fetchCompetitions = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/competitions`);
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data);
      }
    } catch (e) {
      console.error("Error loading competitions", e);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleJoin = async (compId, compName, entryFee) => {
    const isFree = entryFee === t.free || entryFee === 'Gratis';
    
    // Enforce Pro/Elite Plan check for paid entry fee
    if (!isFree && user.subscription_tier === 'free') {
      setJoinStatus(prev => ({ 
        ...prev, 
        [compId]: { type: 'error', msg: t.premium_required } 
      }));
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/competitions/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          competition_id: compId
        })
      });
      if (res.ok) {
        setJoinStatus(prev => ({ 
          ...prev, 
          [compId]: { type: 'success', msg: t.joined_success.replace('{}', compName) } 
        }));
        setJoinedList(prev => [...prev, compId]);
      } else {
        setJoinStatus(prev => ({ 
          ...prev, 
          [compId]: { type: 'error', msg: 'Error de servidor al unirse' } 
        }));
      }
    } catch (e) {
      setJoinStatus(prev => ({ 
        ...prev, 
        [compId]: { type: 'error', msg: 'Fallo de red' } 
      }));
    }
  };

  const rankingPositions = [
    { pos: 1, user: 'PredictorPro', score: 1850, acc: '78%' },
    { pos: 2, user: 'SportGenius', score: 1820, acc: '76%' },
    { pos: 3, user: 'BetMaster', score: 1780, acc: '74%' },
    { pos: 4, user: 'DataAnalyst', score: 1750, acc: '72%' },
    { pos: 5, user: 'GoldenPredictor', score: 1720, acc: '71%' },
    { pos: 15, user: user.username === 'Invitado' ? (language === 'es' ? 'Tú (Invitado)' : 'You (Guest)') : user.username, score: 1520, acc: '68%', isCurrentUser: true },
  ];

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{t.competitions_title}</h1>

      <div className="dashboard-grid">
        {/* Left pane: Available competitions */}
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t.available_competitions}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {competitions.map((comp) => {
              const compId = comp.id;
              const status = joinStatus[compId];
              const isJoined = joinedList.includes(compId);

              return (
                <div key={compId} className="glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏆 {comp.name}
                    </h3>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: 'var(--success-bg)', 
                      color: 'var(--success-color)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {t.status_label.split(': ')[1]}
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                    {comp.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.participants_label}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                        {comp.participants}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.total_prize}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                        {comp.prize}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.entry_fee}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                        {comp.entry_fee}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      📅 {t.deadline_label.replace('📅 **Cierra:** {}', comp.deadline).replace('📅 **Closes:** {}', comp.deadline)}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {status && (
                        <span style={{ 
                          fontSize: '0.85rem', 
                          color: status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                          fontWeight: 500
                        }}>
                          {status.msg}
                        </span>
                      )}

                      <button 
                        onClick={() => handleJoin(compId, comp.name, comp.entry_fee)}
                        disabled={isJoined}
                        className="btn-primary"
                        style={{ 
                          padding: '0.5rem 1.25rem', 
                          borderRadius: '8px',
                          background: isJoined ? 'var(--border-color)' : 'var(--accent-gradient)',
                          color: isJoined ? 'var(--text-muted)' : '#ffffff',
                          cursor: isJoined ? 'not-allowed' : 'pointer',
                          boxShadow: isJoined ? 'none' : '0 4px 12px var(--accent-glow)'
                        }}
                      >
                        {isJoined ? (language === 'es' ? 'Unido ✓' : 'Joined ✓') : t.join_button}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right pane: Global Leaderboard Ranking */}
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t.your_ranking}</h2>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {rankingPositions.map((rank, idx) => {
              if (rank.isCurrentUser) {
                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--accent-gradient)',
                      color: '#ffffff',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 4px 12px var(--accent-glow)',
                      fontWeight: 700
                    }}
                  >
                    <span>🎯 {rank.pos}. {rank.user}</span>
                    <span>{rank.score} pts ({rank.acc})</span>
                  </div>
                );
              }
              return (
                <div 
                  key={idx}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.95rem'
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {rank.pos}. {rank.user}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {rank.score} pts ({rank.acc})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
