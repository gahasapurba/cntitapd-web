import React from 'react';
import { ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function StatsHeader() {
  const {
    connectedForm,
    isFormClosed,
    onBack,
    onNavigateForm
  } = useRegistrationStats();

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-card)'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Kalender Event</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Live Realtime Sync Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.74rem',
            color: '#10b981',
            fontWeight: 700
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }} />
            <span>Realtime Aktif</span>
          </div>

          {connectedForm && (
            <button
              onClick={() => {
                if (isFormClosed) return;
                onNavigateForm && onNavigateForm(connectedForm.id);
              }}
              disabled={isFormClosed}
              title={isFormClosed ? 'Formulir telah ditutup' : 'Buka formulir pendaftaran'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isFormClosed ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)',
                border: isFormClosed ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-card)',
                color: isFormClosed ? '#f87171' : 'var(--text-main)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: isFormClosed ? 'not-allowed' : 'pointer',
                opacity: isFormClosed ? 0.85 : 1
              }}
            >
              {isFormClosed ? <Lock size={13} /> : <ExternalLink size={13} />}
              <span>{isFormClosed ? 'Formulir Telah Ditutup' : 'Buka Form'}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
