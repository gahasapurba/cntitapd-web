import React from 'react';
import { LEVEL_OPTIONS, formatLevelOptionLabel } from '../../utils/memberQuotaUtils';
import { X } from 'lucide-react';
import { useAdminPortal } from '../AdminPortalContext';

export default function RoleFormModal() {
  const {
    activeTenure,
    handleSaveRole,
    roleModal,
    selectedOrgTenureId,
    setRoleModal,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <>
      {roleModal.isOpen && (
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
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {roleModal.mode === 'add' ? '➕ Tambah Role / Jabatan Baru' : '✏️ Edit Role / Jabatan'}
              </h4>
              <button
                type="button"
                onClick={() => setRoleModal({ ...roleModal, isOpen: false })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Jabatan / Role *
              </label>
              <input
                type="text"
                placeholder="Contoh: Sekretaris Jenderal, Wakil Pimpro, Dewan Penasehat"
                value={roleModal.role.name}
                onChange={(e) => setRoleModal({ ...roleModal, role: { ...roleModal.role, name: e.target.value } })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Tingkatan di Bagan Organigram *
              </label>
              <select
                value={roleModal.role.level ?? 5}
                onChange={(e) => setRoleModal({ ...roleModal, role: { ...roleModal.role, level: Number(e.target.value) } })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              >
                {LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl.level} value={lvl.level}>
                    {formatLevelOptionLabel(lvl, tenureRoles, roleModal.tenureId || selectedOrgTenureId || activeTenure?.id || tenures[0]?.id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Batas Maksimal Kuota Personel
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0 = Unlimited"
                  value={roleModal.role.max ?? 0}
                  onChange={(e) => setRoleModal({ ...roleModal, role: { ...roleModal.role, max: parseInt(e.target.value) || 0 } })}
                  style={{
                    width: '100px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontWeight: 700
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {Number(roleModal.role.max) > 0 ? 'orang (dibatasi)' : 'orang (Tanpa Batas / Unlimited)'}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Isi 0 jika tidak ada kuota maksimal (misal untuk Anggota Divisi).
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-card)'
            }}>
              <input
                type="checkbox"
                id="modalRequireDiv"
                checked={Boolean(roleModal.role.requiresDivision)}
                onChange={(e) => setRoleModal({ ...roleModal, role: { ...roleModal.role, requiresDivision: e.target.checked } })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="modalRequireDiv" style={{ fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer', lineHeight: 1.4 }}>
                <strong>Memerlukan Pilihan Divisi</strong>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Centang jika personel dengan role ini wajib ditempatkan di divisi tertentu (contoh: Pimpro, Anggota Divisi).
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setRoleModal({ ...roleModal, isOpen: false })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveRole(roleModal.tenureId, roleModal.role)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Simpan Role
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
