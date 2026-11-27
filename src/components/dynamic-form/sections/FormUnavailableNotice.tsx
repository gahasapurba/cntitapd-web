import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormUnavailableNotice() {
  const {
    activeForms,
    isDark,
    isInitialFormDisabled,
    isInitialFormMissing,
    navigateTo,
    onSelectFormUrl,
    requestedForm,
    setSelectedFormId
  } = useDynamicFormContext();

  return (
    <>
      {(isInitialFormMissing || isInitialFormDisabled) && (
        <div style={{ maxWidth: '680px', margin: '0 auto 28px', width: '100%' }}>
          <div className="glass-panel" style={{
            padding: '36px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
            border: '1.5px solid rgba(244, 63, 94, 0.4)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(14, 25, 55, 0.95) 100%)'
              : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                {isInitialFormDisabled ? 'Formulir Telah Dinonaktifkan' : 'Formulir Tidak Ditemukan'}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                {isInitialFormDisabled
                  ? `Formulir pendaftaran "${requestedForm?.title || 'Terkait'}" saat ini sedang dinonaktifkan atau ditutup oleh pengelola web.`
                  : 'Tautan formulir pendaftaran yang Anda tuju tidak ditemukan atau telah dihapus oleh pengelola.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onSelectFormUrl) onSelectFormUrl(null);
                  navigateTo('/#home');
                }}
                style={{
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Kembali ke Beranda
              </button>

              {activeForms.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectFormUrl) onSelectFormUrl(activeForms[0].id);
                    setSelectedFormId(activeForms[0].id);
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Lihat Formulir Aktif ({activeForms.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
