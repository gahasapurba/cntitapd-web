import React from 'react';
import { Trophy } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function LatestWinnersModal() {
  const {
    connectedForm,
    formSubmissions,
    isDark,
    latestWinners,
    prizeName,
    setShowLatestWinnersModal,
    showLatestWinnersModal
  } = useRegistrationStats();

  return (
    <>
      {showLatestWinnersModal && latestWinners.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '580px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 'clamp(16px, 4vw, 24px)',
            border: '2px solid var(--mandiri-gold)',
            boxShadow: '0 25px 60px rgba(255, 184, 0, 0.35)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFB800 0%, #e0a300 100%)',
              color: '#040914',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 0 25px rgba(255, 184, 0, 0.5)'
            }}>
              <Trophy size={32} />
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--mandiri-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                SELAMAT KEPADA PEMENANG!
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                {prizeName}
              </h2>
            </div>

            {/* List of Newly Drawn Winners with ALL Submitted Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {latestWinners.map((w: any, idx: any) => {
                const sub = formSubmissions.find((s: any) => s.id === w.submissionId) ||
                  formSubmissions.find((s: any) => (s.name || '').toLowerCase() === (w.winnerName || '').toLowerCase());
                const subData = w.submissionData || sub?.data || {};

                return (
                  <div
                    key={w.id || idx}
                    style={{
                      background: isDark ? 'rgba(255, 184, 0, 0.08)' : 'rgba(255, 184, 0, 0.06)',
                      border: isDark ? '1.5px solid rgba(255, 184, 0, 0.45)' : '1.5px solid rgba(255, 184, 0, 0.45)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      boxShadow: isDark ? 'none' : '0 2px 8px rgba(255, 184, 0, 0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 184, 0, 0.2)', paddingBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🏆</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--mandiri-gold)' }}>
                          Pemenang #{w.drawNumber || idx + 1}
                        </span>
                      </div>
                      <span style={{
                        background: 'rgba(255, 184, 0, 0.2)',
                        border: '1px solid var(--mandiri-gold)',
                        color: 'var(--mandiri-gold)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 800
                      }}>
                        {w.prizeTitle || w.prizeName || 'Doorprize Utama'}
                      </span>
                    </div>

                    {/* All Form Fields Submitted by the Winner */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '8px' }}>
                      {(connectedForm?.fields || []).map((f: any) => {
                        const val = subData[f.label] ?? subData[f.id] ?? (f.label.toLowerCase().includes('nama') ? w.winnerName : '-');
                        return (
                          <div
                            key={f.id}
                            style={{
                              background: isDark ? 'rgba(0, 0, 0, 0.35)' : '#ffffff',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 184, 0, 0.28)',
                              boxShadow: isDark ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.04)'
                            }}
                          >
                            <div style={{
                              fontSize: '0.68rem',
                              color: isDark ? 'var(--text-dim)' : '#64748b',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '3px'
                            }}>
                              {f.label}
                            </div>
                            <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 800, wordBreak: 'break-word' }}>
                              {String(val || '-')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowLatestWinnersModal(false)}
              style={{
                padding: '12px 28px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--mandiri-gold)',
                color: '#040914',
                fontWeight: 900,
                fontSize: '0.92rem',
                border: 'none',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Simpan & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
