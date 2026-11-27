import React from 'react';
import { Trash2 } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function DeleteWinnerModal() {
  const {
    getWinnerDisplayName,
    onDeleteLuckyDraw,
    setWinnerToDelete,
    winnerToDelete
  } = useRegistrationStats();

  return (
    <>
      {winnerToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
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
            border: '1.5px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              border: '1px solid rgba(244, 63, 94, 0.3)'
            }}>
              <Trash2 size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                Hapus Pemenang Undian?
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Apakah Anda yakin ingin membatalkan/menghapus pemenang <strong>"{getWinnerDisplayName(winnerToDelete)}"</strong>? Setelah dihapus, peserta ini akan kembali berstatus belum menang dan dapat diundi lagi pada sesi berikutnya.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setWinnerToDelete(null)}
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
                  if (onDeleteLuckyDraw) onDeleteLuckyDraw(winnerToDelete.id);
                  setWinnerToDelete(null);
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
                Ya, Hapus Pemenang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
