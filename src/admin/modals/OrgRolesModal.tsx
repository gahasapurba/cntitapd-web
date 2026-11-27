import React from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { LEVEL_OPTIONS, getTenureRoles } from '../../utils/memberQuotaUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function OrgRolesModal() {
  const {
    activeTenure,
    handleDeleteRole,
    isOrgRolesOpen,
    members,
    roleQuotas,
    selectedOrgTenureId,
    setIsOrgRolesOpen,
    setRoleModal,
    setSelectedOrgTenureId,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <>
      {isOrgRolesOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '860px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏛️</span>
                  <span>Pengaturan Struktur Organisasi & Role</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Kelola daftar jabatan, kuota maksimal, tingkatan organigram, dan kebutuhan divisi untuk tiap periode kepengurusan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrgRolesOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tenure Selector & Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-card)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    Kepengurusan:
                  </label>
                  <select
                    value={selectedOrgTenureId || activeTenure?.id || ''}
                    onChange={(e) => setSelectedOrgTenureId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  >
                    {tenures.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const curTenure = selectedOrgTenureId || activeTenure?.id || tenures[0]?.id;
                      setRoleModal({
                        isOpen: true,
                        mode: 'add',
                        tenureId: curTenure,
                        role: { id: '', name: '', level: 5, max: 0, requiresDivision: true }
                      });
                    }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--mandiri-gold)',
                      color: '#040914',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Tambah Role Baru</span>
                  </button>

                </div>
              </div>

              {/* Roles Table */}
              {(() => {
                const curTenureId = selectedOrgTenureId || activeTenure?.id || tenures[0]?.id || '';
                const roles = getTenureRoles(curTenureId, roleQuotas, tenureRoles);
                const tenureMembers = members.filter((m: any) => !curTenureId || m.tenureId === curTenureId);

                return (
                  <div style={{
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-card)' }}>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Jabatan / Role</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Tingkat Organigram</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Kuota Maks</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Perlu Divisi?</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Terisi</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => {
                          const levelInfo = LEVEL_OPTIONS.find(l => l.level === role.level);
                          const matched = tenureMembers.filter((m: any) => {
                            if (m.roleId && m.roleId === role.id) return true;
                            const mRole = String(m.role || '').toLowerCase().trim();
                            const rName = role.name.toLowerCase().trim();
                            return mRole === rName || (role.requiresDivision && mRole.startsWith(rName));
                          });
                          const isFull = role.max > 0 && matched.length >= role.max;
                          const occNames = matched.map((m: any) => m.name).join(', ');

                          return (
                            <tr key={role.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                              <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                                {role.name}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: role.level <= 1 ? 'rgba(255, 184, 0, 0.15)' : (role.level <= 3 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                                  color: role.level <= 1 ? 'var(--mandiri-gold)' : (role.level <= 3 ? 'var(--neon-cyan)' : 'var(--text-muted)'),
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  {levelInfo?.shortLabel || `Level ${role.level}`}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--text-main)' }}>
                                {role.max > 0 ? (
                                  <span style={{ fontWeight: 700 }}>{role.max} orang</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Unlimited</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                {role.requiresDivision ? (
                                  <span style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem', fontWeight: 600 }}>
                                    ✓ Ya (Per Divisi)
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    — Tidak (Global)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span
                                  title={occNames ? `Terisi oleh: ${occNames}` : 'Belum ada anggota'}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    background: isFull ? 'rgba(255, 184, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isFull ? 'var(--mandiri-gold)' : '#10b981',
                                    fontWeight: 700,
                                    fontSize: '0.72rem'
                                  }}
                                >
                                  {matched.length}{role.max > 0 ? `/${role.max}` : ''} {isFull && '(Penuh)'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRoleModal({
                                        isOpen: true,
                                        mode: 'edit',
                                        tenureId: curTenureId,
                                        role: { ...role }
                                      });
                                    }}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'rgba(56, 189, 248, 0.1)',
                                      border: '1px solid rgba(56, 189, 248, 0.3)',
                                      color: 'var(--neon-cyan)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600
                                    }}
                                    title="Edit Role ini"
                                  >
                                    <Edit2 size={12} />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRole(curTenureId, role)}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'rgba(244, 63, 94, 0.1)',
                                      border: '1px solid rgba(244, 63, 94, 0.3)',
                                      color: '#f43f5e',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600
                                    }}
                                    title="Hapus Role ini"
                                  >
                                    <Trash2 size={12} />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {roles.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Belum ada role/jabatan terdaftar untuk periode ini. Silakan klik tombol <strong>Tambah Role Baru</strong> di atas untuk membuat role.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-card)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <button
                type="button"
                onClick={() => setIsOrgRolesOpen(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
