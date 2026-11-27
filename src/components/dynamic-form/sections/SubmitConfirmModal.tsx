import React from 'react';
import { HelpCircle, Send, Upload, X } from 'lucide-react';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function SubmitConfirmModal() {
  const {
    currentForm,
    fileData,
    formData,
    handleConfirmSubmit,
    isConfirmOpen,
    isSubmitting,
    setIsConfirmOpen
  } = useDynamicFormContext();

  return (
    <>
      {isConfirmOpen && currentForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            border: '1.5px solid var(--mandiri-gold)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 184, 0, 0.15)',
                  color: 'var(--mandiri-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Konfirmasi Isian Formulir
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Pastikan seluruh data yang Anda masukkan sudah benar sebelum dikirim
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Info Box */}
            <div style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '0.85rem'
            }}>
              <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Formulir Terkait:</span>
                <div style={{ fontWeight: 800, color: 'var(--mandiri-gold)', fontSize: '0.95rem' }}>
                  {currentForm.title}
                </div>
              </div>

              {/* Dynamic Preview of All Filled Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(currentForm.fields || []).map((field: any) => {
                  const val = formData[field.id];
                  const file = fileData[field.id];
                  if (!val && !file) return null;

                  return (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {field.label}:
                      </span>
                      {field.type === 'file' && file ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                          <Upload size={14} />
                          <span>{file.name} ({file.size})</span>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-main)', fontWeight: 600, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                          {String(val)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note & Advisory */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}>
              💡 <em>Catatan:</em> Data pendaftaran Anda akan langsung diteruskan ke panitia penyelenggara dan tersimpan di database resmi Group IT APD.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cek Ulang
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                style={{
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: isSubmitting ? 'var(--input-bg)' : 'var(--mandiri-gold)',
                  border: 'none',
                  color: isSubmitting ? 'var(--text-muted)' : '#040914',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(255, 184, 0, 0.3)'
                }}
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Mengirim...' : 'Ya, Kirim Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
