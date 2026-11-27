import React from 'react';
import { Download, QrCode, X } from 'lucide-react';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormPosterModal() {
  const {
    posterPreview,
    setPosterPreview
  } = useDynamicFormContext();

  return (
    <>
      {posterPreview && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setPosterPreview(null)}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--mandiri-gold)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} color="var(--mandiri-gold)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Poster QR Formulir (HD)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPosterPreview(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <img
              src={posterPreview.url}
              alt={posterPreview.title}
              style={{
                width: '100%',
                maxHeight: '52vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                border: '1px solid var(--border-card)'
              }}
            />

            <div style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.5,
              background: 'var(--input-bg)',
              padding: '10px 14px',
              borderRadius: '8px',
              width: '100%'
            }}>
              💡 <strong>Tips Mobile (iPhone 17 Pro Max / Android):</strong> Tekan & tahan gambar poster di atas lalu pilih <em>"Save to Photos" / "Simpan Gambar"</em>, atau gunakan tombol di bawah.
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
              <a
                href={posterPreview.url}
                download={posterPreview.filename}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--mandiri-gold) 0%, #d99b00 100%)',
                  color: '#0b132b',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(255,184,0,0.35)',
                  minWidth: '150px'
                }}
              >
                <Download size={16} />
                <span>Simpan / Unduh PNG</span>
              </a>
              <button
                type="button"
                onClick={() => setPosterPreview(null)}
                style={{
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.86rem',
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
