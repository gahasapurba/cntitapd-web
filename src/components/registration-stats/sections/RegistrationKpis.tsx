import React from 'react';
import { CheckCircle2, Users } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function RegistrationKpis() {
  const {
    effectiveIsLimited,
    effectiveMaxQuota,
    event,
    isDark,
    participationRate,
    totalPendaftar
  } = useRegistrationStats();

  return (
    <>
      <div
        className="glass-panel"
        style={{
          padding: 'clamp(16px, 3vw, 24px)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid rgba(255, 184, 0, 0.35)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(255, 184, 0, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%)'
            : 'linear-gradient(135deg, #fffbeb 0%, #ecfeff 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Left: Total Pendaftar Count */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              TOTAL PESERTA HADIR ({event.title.toUpperCase()})
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 900, color: 'var(--mandiri-gold)', lineHeight: 1 }}>
                {totalPendaftar}
              </span>
              {effectiveIsLimited && effectiveMaxQuota > 0 ? (
                <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  / {effectiveMaxQuota} Target Peserta
                </span>
              ) : (
                <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Peserta Terdaftar
                </span>
              )}
            </div>
          </div>

          {/* Right: Tingkat Partisipasi (if limited) OR Unlimited Badge */}
          {effectiveIsLimited && effectiveMaxQuota > 0 ? (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Tingkat Partisipasi
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--mandiri-gold)', lineHeight: 1 }}>
                  {participationRate}%
                </span>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 184, 0, 0.12)',
                  border: '1.5px solid rgba(255, 184, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(255, 184, 0, 0.2)'
                }}>
                  <Users size={22} color="var(--mandiri-gold)" />
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#10b981',
              fontSize: '0.82rem',
              fontWeight: 800
            }}>
              <CheckCircle2 size={16} />
              <span>Tanpa Batasan Kuota Peserta (Unlimited)</span>
            </div>
          )}
        </div>

        {/* Sleek Horizontal Progress Bar (Only when quota target exists) */}
        {effectiveIsLimited && effectiveMaxQuota > 0 && (
          <div style={{
            width: '100%',
            height: '7px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${participationRate}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--mandiri-gold) 0%, #fbbf24 100%)',
              borderRadius: '999px',
              boxShadow: '0 0 12px rgba(255, 184, 0, 0.5)',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        )}
      </div>
    </>
  );
}
