import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function ResetDrawModal() {
  const {
    event,
    eventWinners,
    onResetLuckyDraw,
    resetConfirmOpen,
    setResetConfirmOpen
  } = useRegistrationStats();

  return (
    <>
      {resetConfirmOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '440px',
            width: '100%',
            padding: 'clamp(16px, 4vw, 24px)',
            border: '1.5px solid #f43f5e',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <AlertCircle size={40} color="#f43f5e" style={{ margin: '0 auto' }} />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                Reset Semua Pemenang Undian?
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Tindakan ini akan menghapus seluruh data {eventWinners.length} pemenang undian pada acara ini dan mengembalikan semua pendaftar formulir ke dalam pool undian.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetLuckyDraw) onResetLuckyDraw(event.id);
                  setResetConfirmOpen(false);
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: '#f43f5e',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Ya, Reset Pemenang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
