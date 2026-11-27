import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAdminPortal } from '../AdminPortalContext';

export default function RoleDeleteWarningModal() {
  const {
    roleDeleteWarning,
    setRoleDeleteWarning
  } = useAdminPortal();

  return (
    <>
      {roleDeleteWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px -12px rgba(244, 63, 94, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
                flexShrink: 0
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f43f5e' }}>
                  Tidak Dapat Menghapus Role
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Role "{roleDeleteWarning.role.name}" masih memiliki ketergantungan personel
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Role ini tidak dapat dihapus karena masih digunakan oleh <strong>{roleDeleteWarning.members.length} anggota</strong> pada kepengurusan ini:
            </p>

            <div style={{
              maxHeight: '160px',
              overflowY: 'auto',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {roleDeleteWarning.members.map((m: any, idx: any) => (
                <div key={m.id || idx} style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>•</span>
                  <span><strong>{m.name}</strong> ({m.role})</span>
                </div>
              ))}
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              💡 <em>Silakan ubah terlebih dahulu jabatan personel di atas ke role lain melalui tombol edit di tabel personel sebelum menghapus role ini.</em>
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setRoleDeleteWarning(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
