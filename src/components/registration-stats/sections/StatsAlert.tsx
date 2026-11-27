import React from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function StatsAlert() {
  const {
    activeAlert,
    isDark,
    setActiveAlert
  } = useRegistrationStats();

  return (
    <>
      {activeAlert && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            maxWidth: '380px',
            width: 'calc(100vw - 32px)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(14, 25, 55, 0.98) 0%, rgba(6, 78, 59, 0.95) 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
            border: '1.5px solid #10b981',
            borderRadius: 'var(--radius-md)',
            boxShadow: isDark
              ? '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.35)'
              : '0 10px 30px rgba(16, 185, 129, 0.25)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideUpToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={20} color="#10b981" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <CheckCircle2 size={12} />
              <span>Pendaftar Baru Masuk</span>
            </div>
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Selamat Datang, {activeAlert.name}! 🎉
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            title="Tutup notifikasi"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
