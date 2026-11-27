import React from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormPageHeader() {
  const {
    activeForms,
    activeTenure,
    forms,
    setTenureFilter,
    tenureFilter
  } = useDynamicFormContext();

  return (
    <>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-gold">
            Hub Registrasi & Formulir
          </span>
          <span className="badge-cyan">
            {activeForms.length} Formulir Dibuka
          </span>
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', lineHeight: 1.2 }}>
          Pusat Registrasi & Formulir Terbuka
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Pilih dan lengkapi formulir pendaftaran kepengurusan, survei, atau pendaftaran kegiatan CNT IT APD yang ingin Anda ikuti.
        </p>

        {/* Tenure Filter Buttons */}
        {activeTenure && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--input-bg)',
              padding: '3px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-card)'
            }}>
              <button
                type="button"
                onClick={() => setTenureFilter('active')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  background: tenureFilter === 'active' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                  color: tenureFilter === 'active' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Periode {activeTenure?.code || activeTenure?.title || ''}
              </button>
              <button
                type="button"
                onClick={() => setTenureFilter('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  background: tenureFilter === 'all' ? 'rgba(255, 184, 0, 0.2)' : 'transparent',
                  color: tenureFilter === 'all' ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Lintas Tahun ({forms.filter((f: any) => f.isOpen !== false).length})
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
