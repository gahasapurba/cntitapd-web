import React from 'react';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { LEVEL_OPTIONS, canDeleteRole, formatLevelOptionLabel } from '../../utils/memberQuotaUtils';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function RolesTab() {
  const {
    activeTab,
    activeTenure,
    clearFieldError,
    formErrors,
    handleCreateRole,
    members,
    newRoleLevel,
    newRoleMax,
    newRoleName,
    newRoleRequiresDivision,
    newRoleTenureId,
    renderFieldError,
    roleLevelFilter,
    rolePage,
    roleSearchQuery,
    roleTenureFilter,
    setDeleteConfirm,
    setEditingItem,
    setNewRoleLevel,
    setNewRoleMax,
    setNewRoleName,
    setNewRoleRequiresDivision,
    setNewRoleTenureId,
    setRoleLevelFilter,
    setRolePage,
    setRoleSearchQuery,
    setRoleTenureFilter,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'roles' && (() => {
        const ROLES_PER_PAGE = 8;
        const filteredRoles = (tenureRoles || []).filter((r: any) => {
          const matchQuery = (r.name || '').toLowerCase().includes(roleSearchQuery.toLowerCase());
          const matchTenure = roleTenureFilter === 'all' || r.tenureId === roleTenureFilter;
          const matchLevel = roleLevelFilter === 'all' || String(r.level) === String(roleLevelFilter);
          return matchQuery && matchTenure && matchLevel;
        });

        const totalRolePages = Math.ceil(filteredRoles.length / ROLES_PER_PAGE) || 1;
        const safeRolePage = Math.min(Math.max(1, rolePage), totalRolePages);
        const paginatedRoles = filteredRoles.slice(
          (safeRolePage - 1) * ROLES_PER_PAGE,
          safeRolePage * ROLES_PER_PAGE
        );

        return (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                Manajemen Struktur Role & Batasan Kuota ({tenureRoles.length})
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Kelola jabatan/role organisasi per periode kepengurusan lengkap dengan kuota maksimal, tingkatan organigram (Level 0–5), dan kewajiban penugasan divisi.
              </p>
            </div>

            {/* Form Tambah Role Baru */}
            <form onSubmit={handleCreateRole} noValidate className="admin-form-two-col" style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
              gap: '14px'
            }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nama Jabatan / Role <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sekretaris Jenderal, Wakil Pimpro, Dewan Penasehat"
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    clearFieldError('newRoleName');
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${formErrors.newRoleName ? '#f43f5e' : 'var(--input-border)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                {renderFieldError('newRoleName')}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Periode Kepengurusan <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  value={newRoleTenureId || activeTenure?.id || tenures[0]?.id || ''}
                  onChange={(e) => setNewRoleTenureId(e.target.value)}
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
                  {tenures.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Tingkatan di Bagan Organigram <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  value={newRoleLevel}
                  onChange={(e) => setNewRoleLevel(Number(e.target.value))}
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
                  {LEVEL_OPTIONS.map(lvl => (
                    <option key={lvl.level} value={lvl.level}>
                      {formatLevelOptionLabel(lvl, tenureRoles, newRoleTenureId || activeTenure?.id || tenures[0]?.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Batas Maksimal Kuota Personel (0 = Tanpa Batas)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0 = Unlimited"
                    value={newRoleMax}
                    onChange={(e) => setNewRoleMax(parseInt(e.target.value) || 0)}
                    style={{
                      width: '110px',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {newRoleMax > 0 ? `orang per ${newRoleRequiresDivision ? 'divisi' : 'periode'}` : 'orang (Tanpa Batas / Unlimited)'}
                  </span>
                </div>
              </div>

              <div style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-card)'
              }}>
                <input
                  type="checkbox"
                  id="newRoleRequiresDiv"
                  checked={newRoleRequiresDivision}
                  onChange={(e) => setNewRoleRequiresDivision(e.target.checked)}
                  style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                />
                <label htmlFor="newRoleRequiresDiv" style={{ fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer', lineHeight: 1.4 }}>
                  <strong>Memerlukan Pilihan Divisi Penugasan</strong>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Centang opsi ini jika personel dengan jabatan ini wajib ditempatkan di divisi tertentu (contoh: Pimpro, Anggota Divisi).
                  </span>
                </label>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--mandiri-gold)',
                    border: 'none',
                    color: '#040914',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(255, 184, 0, 0.35)'
                  }}
                >
                  <Plus size={16} />
                  <span>Tambah Role Baru</span>
                </button>
              </div>
            </form>

            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Cari nama jabatan / role..."
                  value={roleSearchQuery}
                  onChange={(e) => {
                    setRoleSearchQuery(e.target.value);
                    setRolePage(1);
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
                {roleSearchQuery && (
                  <button
                    type="button"
                    onClick={() => { setRoleSearchQuery(''); setRolePage(1); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Periode:</label>
                  <select
                    value={roleTenureFilter}
                    onChange={(e) => { setRoleTenureFilter(e.target.value); setRolePage(1); }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="all">Semua Periode ({tenureRoles.length})</option>
                    {tenures.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.title || t.code}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tingkat:</label>
                  <select
                    value={roleLevelFilter}
                    onChange={(e) => { setRoleLevelFilter(e.target.value); setRolePage(1); }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="all">Semua Tingkat</option>
                    {LEVEL_OPTIONS.map(lvl => (
                      <option key={lvl.level} value={String(lvl.level)}>
                        {formatLevelOptionLabel(lvl, tenureRoles, roleTenureFilter === 'all' ? null : roleTenureFilter, true)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table Daftar Role */}
            <div style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-card)' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Jabatan / Role</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Kepengurusan</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Tingkat Organigram</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Kuota Maks</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Perlu Divisi?</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Terisi</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Terakhir Diperbarui</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoles.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Tidak ada role yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedRoles.map((role: any) => {
                      const levelInfo = LEVEL_OPTIONS.find(l => l.level === role.level);
                      const tObj = tenures.find((t: any) => t.id === role.tenureId);
                      const targetMembers = members.filter((m: any) => (!role.tenureId || m.tenureId === role.tenureId));
                      const matched = targetMembers.filter((m: any) => {
                        if (m.roleId && m.roleId === role.id) return true;
                        const mRole = String(m.role || '').toLowerCase().trim();
                        const rName = role.name.toLowerCase().trim();
                        return mRole === rName || (role.requiresDivision && mRole.startsWith(rName));
                      });
                      const count = matched.length;
                      const maxQ = Number(role.maxQuota ?? role.max ?? 0);
                      const isFull = maxQ > 0 && count >= maxQ;
                      const occNames = matched.map((m: any) => m.name).join(', ');

                      return (
                        <tr key={role.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {role.name}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255,255,255,0.05)',
                              color: 'var(--text-main)',
                              fontSize: '0.74rem',
                              fontWeight: 600
                            }}>
                              {tObj?.code || tObj?.title || 'Global'}
                            </span>
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
                            {maxQ > 0 ? (
                              <span style={{ fontWeight: 700 }}>{maxQ} orang</span>
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
                              title={occNames ? `Terisi oleh: ${occNames}` : (maxQ > 0 ? `Tersedia ${maxQ - count} slot` : 'Tanpa batas')}
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
                              {count}{maxQ > 0 ? `/${maxQ}` : ''} {isFull && '(Penuh)'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                            {formatLastUpdatedWib(role.updatedAt || role.createdAt)}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingItem({ type: 'role', item: { ...role } })}
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
                                onClick={() => {
                                  const check = canDeleteRole(role, role.tenureId, members);
                                  setDeleteConfirm({
                                    type: 'role',
                                    id: role.id,
                                    name: role.name,
                                    tenureId: role.tenureId,
                                    isBlocked: !check.canDelete,
                                    dependentMembers: check.members,
                                    dependentCount: check.count,
                                    reason: check.reason
                                  });
                                }}
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
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalRolePages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Menampilkan {(safeRolePage - 1) * ROLES_PER_PAGE + 1} - {Math.min(safeRolePage * ROLES_PER_PAGE, filteredRoles.length)} dari {filteredRoles.length} role
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={safeRolePage <= 1}
                    onClick={() => setRolePage((prev: any) => Math.max(1, prev - 1))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeRolePage <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      cursor: safeRolePage <= 1 ? 'not-allowed' : 'pointer',
                      opacity: safeRolePage <= 1 ? 0.5 : 1
                    }}
                  >
                    « Prev
                  </button>

                  {Array.from({ length: totalRolePages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setRolePage(pg)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: 'var(--radius-sm)',
                        background: safeRolePage === pg ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: safeRolePage === pg ? '#040914' : 'var(--text-main)',
                        fontSize: '0.78rem',
                        fontWeight: safeRolePage === pg ? 800 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safeRolePage >= totalRolePages}
                    onClick={() => setRolePage((prev: any) => Math.min(totalRolePages, prev + 1))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeRolePage >= totalRolePages ? 'var(--text-muted)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      cursor: safeRolePage >= totalRolePages ? 'not-allowed' : 'pointer',
                      opacity: safeRolePage >= totalRolePages ? 0.5 : 1
                    }}
                  >
                    Next »
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
