import React from 'react';
import { X } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function PosterModal() {
  const {
    posterModal,
    setPosterModal
  } = useRegistrationStats();

  return (
    <>
      {posterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '20px',
            border: '1.5px solid var(--mandiri-gold)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Poster Cetak QR Pendaftaran
              </h3>
              <button
                onClick={() => setPosterModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <img
              src={posterModal.dataUrl}
              alt="Poster QR Formulir"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                border: '1px solid rgba(255, 184, 0, 0.4)'
              }}
            />

            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              lineHeight: 1.5
            }}>
              💡 <strong>Petunjuk di HP / iPhone:</strong> Tekan & tahan (tahan jari) gambar poster di atas, lalu pilih <strong>"Simpan Gambar" (Save to Photos)</strong> atau bagikan ke WhatsApp.
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const blobUrl = URL.createObjectURL(posterModal.blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = posterModal.fileName;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                  }, 2000);
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Unduh File (PNG)
              </button>
              <button
                type="button"
                onClick={() => setPosterModal(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-card)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
