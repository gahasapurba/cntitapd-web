import React from 'react';
import { ChevronLeft, ChevronRight, Edit2, Plus, Search, Trash2, Upload } from 'lucide-react';
import { LEVEL_OPTIONS, findMatchingRole, getCategoryFromLevel, getTenureRoles } from '../../utils/memberQuotaUtils';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { formatWaPhone } from '../adminShared';
import { useAdminPortal } from '../AdminPortalContext';

export default function MembersTab() {
  const {
    activeTab,
    activeTenure,
    adminMemCatFilter,
    adminMemDivFilter,
    adminMemPage,
    adminMemSearch,
    adminMemTenureFilter,
    clearFieldError,
    divisions,
    formErrors,
    handleCreateMember,
    handleDeleteMemberClick,
    handleMemberPhotoUpload,
    isDark,
    memDivisionId,
    memImage,
    memMotto,
    memName,
    memRole,
    memRoleId,
    memTenureId,
    memWhatsapp,
    members,
    renderFieldError,
    roleQuotas,
    setAdminMemCatFilter,
    setAdminMemDivFilter,
    setAdminMemPage,
    setAdminMemSearch,
    setAdminMemTenureFilter,
    setEditingItem,
    setMemCategory,
    setMemDivisionId,
    setMemImage,
    setMemMotto,
    setMemName,
    setMemRole,
    setMemRoleId,
    setMemTenureId,
    setMemWhatsapp,
    setPendingMemberPhoto,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'members' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Tambah Pengurus & Anggota Divisi Dinamis
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tambahkan jajaran pimpinan, pembina, pimpro, maupun anggota divisi ke dalam struktur hierarki organigram lengkap dengan nomor WhatsApp untuk kemudahan koordinasi.
            </p>
          </div>

          <form onSubmit={handleCreateMember} noValidate className="admin-form-two-col" style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Lengkap <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Raden Bagus Prakoso"
                value={memName}
                onChange={(e) => {
                  setMemName(e.target.value);
                  clearFieldError('memName');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${formErrors.memName ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('memName')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nomor WhatsApp (Opsional) 💬
              </label>
              <input
                type="text"
                placeholder="Contoh: 08123456789 atau 628123456789"
                value={memWhatsapp}
                onChange={(e) => setMemWhatsapp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Periode Kepengurusan *
              </label>
              <select
                value={memTenureId || activeTenure?.id || ''}
                onChange={(e) => {
                  setMemTenureId(e.target.value);
                  setMemDivisionId('');
                  clearFieldError('memDivisionId');
                }}
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
                Jabatan / Role Pengurus <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              {(() => {
                const currentTenureId = memTenureId || activeTenure?.id || '';
                const availableRoles = getTenureRoles(currentTenureId, roleQuotas, tenureRoles);
                const currentRoleObj = availableRoles.find(r => r.id === memRoleId) || 
                  availableRoles.find(r => r.name.toLowerCase() === (memRole || '').toLowerCase()) ||
                  null;

                return (
                  <div>
                    <select
                      value={currentRoleObj?.id || ''}
                      onChange={(e) => {
                        const rId = e.target.value;
                        const rObj = availableRoles.find(r => r.id === rId);
                        if (rObj) {
                          setMemRoleId(rObj.id);
                          setMemRole(rObj.name);
                          setMemCategory(getCategoryFromLevel(rObj.level));
                          if (!rObj.requiresDivision) {
                            setMemDivisionId('');
                          }
                        } else {
                          setMemRoleId('');
                          setMemRole('');
                        }
                        clearFieldError('memRole');
                        clearFieldError('memDivisionId');
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)',
                        border: `1.5px solid ${formErrors.memRole ? '#f43f5e' : 'var(--border-card)'}`,
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {availableRoles.length === 0 ? (
                        <option value="" disabled>-- Role kepengurusan masih kosong di periode ini. Silakan buat role baru di menu Kelola Role & Jabatan --</option>
                      ) : (
                        <>
                          <option value="">-- Pilih Jabatan / Role --</option>
                          {availableRoles.map((r) => {
                            const levelInfo = LEVEL_OPTIONS.find(l => l.level === r.level);
                            const quotaText = r.max > 0 ? `Maks ${r.max}` : 'Unlimited';
                            const divText = r.requiresDivision ? ' • Butuh Divisi' : '';
                            return (
                              <option key={r.id} value={r.id}>
                                {r.name} ({levelInfo?.shortLabel || `Level ${r.level}`} • {quotaText}{divText})
                              </option>
                            );
                          })}
                        </>
                      )}
                    </select>
                    {availableRoles.length === 0 && (
                      <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                        ⚠️ <strong>Role kepengurusan masih kosong</strong> pada periode kepengurusan ini. Silakan buat role baru terlebih dahulu di menu <strong>Kelola Role & Jabatan</strong>.
                      </div>
                    )}
                    {renderFieldError('memRole')}
                  </div>
                );
              })()}
            </div>

            {/* DIVISI PENUGASAN: HANYA MUNCUL JIKA ROLE MEMBUTUHKAN DIVISI */}
            {(() => {
              const currentTenureId = memTenureId || activeTenure?.id || '';
              const availableRoles = getTenureRoles(currentTenureId, roleQuotas, tenureRoles);
              const currentRoleObj = availableRoles.find(r => r.id === memRoleId) || 
                availableRoles.find(r => r.name.toLowerCase() === (memRole || '').toLowerCase()) ||
                null;

              if (!currentRoleObj || !currentRoleObj.requiresDivision) {
                return null;
              }

              const availableDivsForMember = divisions.filter((d: any) => d.tenureId === currentTenureId);
              return (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Divisi Penugasan <span style={{ color: '#f43f5e' }}>*</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)', marginLeft: '6px' }}>
                      (Wajib untuk jabatan "{currentRoleObj.name}")
                    </span>
                  </label>
                  <select
                    value={memDivisionId}
                    onChange={(e) => {
                      setMemDivisionId(e.target.value);
                      clearFieldError('memDivisionId');
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: `1.5px solid ${formErrors.memDivisionId ? '#f43f5e' : 'var(--border-card)'}`,
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {availableDivsForMember.length === 0 ? (
                      <option value="" disabled>-- Divisi masih kosong di periode ini. Silakan buat divisi baru di tab Divisi --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Divisi / Squad (Wajib) --</option>
                        {availableDivsForMember.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {availableDivsForMember.length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                      ⚠️ <strong>Divisi masih kosong</strong> pada periode kepengurusan ini. Silakan buat divisi baru terlebih dahulu di tab <strong>Divisi</strong>.
                    </div>
                  )}
                  {renderFieldError('memDivisionId')}
                </div>
              );
            })()}

            {/* RINGKASAN STATUS KUOTA PERIODE (COMPACT & RAPI) */}
            {(() => {
              const currentTenureId = memTenureId || activeTenure?.id || '';
              const availableRoles = getTenureRoles(currentTenureId, roleQuotas, tenureRoles);
              if (availableRoles.length === 0) {
                return null;
              }
              const tenureObj = tenures.find((t: any) => t.id === currentTenureId);
              const tenureName = tenureObj?.title || tenureObj?.code || 'Periode Ini';
              const targetMembers = members.filter((m: any) => !currentTenureId || m.tenureId === currentTenureId);

              return (
                <div style={{
                  gridColumn: 'span 2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: isDark ? 'rgba(56, 189, 248, 0.04)' : '#f0f9ff',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #bae6fd'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        🛡️ Status Kuota Kepengurusan: {tenureName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ({targetMembers.length} anggota terdaftar)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {availableRoles.map(role => {
                      const matched = targetMembers.filter((m: any) => {
                        if (m.roleId && m.roleId === role.id) return true;
                        const mRole = String(m.role || '').toLowerCase().trim();
                        const rName = role.name.toLowerCase().trim();
                        return mRole === rName || (role.requiresDivision && mRole.startsWith(rName));
                      });
                      const count = matched.length;
                      const isFull = role.max > 0 && count >= role.max;
                      const occNames = matched.map((m: any) => m.name).join(', ');

                      return (
                        <div
                          key={role.id}
                          title={occNames ? `Terisi oleh: ${occNames}` : (role.max > 0 ? `Tersedia ${role.max - count} slot` : 'Tanpa batas')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isFull ? 'rgba(255, 184, 0, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            border: `1px solid ${isFull ? 'rgba(255, 184, 0, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: isFull ? 'var(--mandiri-gold)' : '#10b981'
                          }}
                        >
                          <span>{role.name}: <strong>{count}{role.max > 0 ? `/${role.max}` : ''}</strong></span>
                          {isFull && <span style={{ fontSize: '0.64rem', opacity: 0.9 }}>(Penuh)</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Motto / Pesan Semangat
              </label>
              <input
                type="text"
                placeholder="Contoh: Siap berkontribusi aktif memajukan budaya kolaborasi IT APD"
                value={memMotto}
                onChange={(e) => setMemMotto(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Foto Profil Pengurus (Upload File atau URL Gambar Opsional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {memImage && (
                  <img
                    src={memImage}
                    alt="Preview"
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mandiri-gold)' }}
                  />
                )}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid var(--neon-cyan)',
                    color: 'var(--neon-cyan)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={14} />
                  <span>Upload Foto</span>
                  <input type="file" accept="image/*" onChange={(e) => handleMemberPhotoUpload(e, false)} style={{ display: 'none' }} />
                </label>
                <input
                  type="text"
                  placeholder="Atau tempel URL foto (https://...)"
                  value={memImage}
                  onChange={(e) => {
                    setMemImage(e.target.value);
                    clearFieldError('memImage');
                  }}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${formErrors.memImage ? '#f43f5e' : 'var(--border-card)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.83rem'
                  }}
                />
                {memImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemImage('');
                      setPendingMemberPhoto(null);
                      clearFieldError('memImage');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
              {renderFieldError('memImage')}
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Simpan ke Database Organisasi</span>
              </button>
            </div>
          </form>

          {/* Members List with Search & Filter */}
          {(() => {
            const ADMIN_MEM_PER_PAGE = 12;
            const memberFilterRoles = (adminMemTenureFilter === 'all'
              ? tenures.flatMap((t: any) => getTenureRoles(t.id, roleQuotas, tenureRoles))
              : getTenureRoles(adminMemTenureFilter, roleQuotas, tenureRoles)
            ).sort((a: any, b: any) => a.level - b.level || a.sortOrder - b.sortOrder);

            const filteredAdminMembers = members.filter((m: any) => {
              const q = adminMemSearch.trim().toLowerCase();
              const matchesSearch = !q ||
                (m.name || '').toLowerCase().includes(q) ||
                (m.role || '').toLowerCase().includes(q) ||
                (m.title || '').toLowerCase().includes(q) ||
                (m.whatsapp || '').toLowerCase().includes(q);
              const matchesTenure = adminMemTenureFilter === 'all' || m.tenureId === adminMemTenureFilter;
              const matchesCat = adminMemCatFilter === 'all' || (() => {
                const targetRole = memberFilterRoles.find((r: any) => r.id === adminMemCatFilter);
                if (!targetRole) return m.roleId === adminMemCatFilter || m.category === adminMemCatFilter;
                if (m.tenureId && targetRole.tenureId && m.tenureId !== targetRole.tenureId) return false;
                if (m.roleId && m.roleId === targetRole.id) return true;
                const matched = findMatchingRole(m, getTenureRoles(m.tenureId, roleQuotas, tenureRoles));
                return matched
                  ? matched.id === targetRole.id
                  : (m.role || '').toLowerCase().trim() === targetRole.name.toLowerCase().trim();
              })();
              const matchesDiv = adminMemDivFilter === 'all' || m.divisionId === adminMemDivFilter;
              return matchesSearch && matchesTenure && matchesCat && matchesDiv;
            });

            const totalAdminMemPages = Math.ceil(filteredAdminMembers.length / ADMIN_MEM_PER_PAGE) || 1;
            const safeAdminMemPage = Math.min(Math.max(1, adminMemPage), totalAdminMemPages);
            const paginatedAdminMembers = filteredAdminMembers.slice(
              (safeAdminMemPage - 1) * ADMIN_MEM_PER_PAGE,
              safeAdminMemPage * ADMIN_MEM_PER_PAGE
            );

            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Personel Terdaftar ({filteredAdminMembers.length} dari {members.length}):
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '260px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Cari nama atau jabatan..."
                        value={adminMemSearch}
                        onChange={(e) => {
                          setAdminMemSearch(e.target.value);
                          setAdminMemPage(1);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px 7px 30px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem'
                        }}
                      />
                    </div>

                    {/* Filter selects grouped right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <select
                        value={adminMemTenureFilter}
                        onChange={(e) => {
                          setAdminMemTenureFilter(e.target.value);
                          setAdminMemCatFilter('all');
                          setAdminMemDivFilter('all');
                          setAdminMemPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          minWidth: 0,
                          maxWidth: 'min(100%, 200px)',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <option value="all">Semua Periode ({members.length})</option>
                        {tenures.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            Periode {t.code || t.title}
                          </option>
                        ))}
                      </select>

                      <select
                        value={adminMemCatFilter}
                        onChange={(e) => {
                          setAdminMemCatFilter(e.target.value);
                          setAdminMemPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          minWidth: 0,
                          maxWidth: 'min(100%, 200px)',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <option value="all">Semua Role / Jabatan</option>
                        {memberFilterRoles.map((r: any) => {
                          const tObj = tenures.find((t: any) => t.id === r.tenureId);
                          const yearLabel = adminMemTenureFilter === 'all' && tObj ? ` (${tObj.code || tObj.title})` : '';
                          return (
                            <option key={r.id} value={r.id}>
                              {r.name}{yearLabel}
                            </option>
                          );
                        })}
                      </select>

                      <select
                        value={adminMemDivFilter}
                        onChange={(e) => {
                          setAdminMemDivFilter(e.target.value);
                          setAdminMemPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          minWidth: 0,
                          maxWidth: 'min(100%, 200px)',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <option value="all">Semua Divisi</option>
                        {(adminMemTenureFilter === 'all'
                          ? divisions
                          : divisions.filter((d: any) => d.tenureId === adminMemTenureFilter)
                        ).map((d: any) => {
                          const tObj = tenures.find((t: any) => t.id === d.tenureId);
                          const yearLabel = adminMemTenureFilter === 'all' && tObj ? ` (${tObj.code || tObj.title})` : '';
                          return (
                            <option key={d.id} value={d.id}>{d.name}{yearLabel}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {paginatedAdminMembers.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                      Tidak ada personel yang sesuai dengan kriteria pencarian/filter.
                    </div>
                  ) : (
                    paginatedAdminMembers.map((m: any) => (
                    <div key={m.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-card)',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {m.image ? (
                          <img
                            src={m.image}
                            alt={m.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${m.color || 'var(--mandiri-gold)'}`, flexShrink: 0 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(() => {
                              const roleObj = findMatchingRole(m, tenureRoles);
                              const roleName = roleObj?.name || m.role || 'Anggota';
                              const divObj = (divisions || []).find((d: any) => d.id === m.divisionId);
                              if (divObj && !roleName.toLowerCase().includes(divObj.name.toLowerCase())) {
                                return `${roleName} • ${divObj.name}`;
                              }
                              return roleName;
                            })()}
                          </div>
                          {m.updatedAt && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {formatLastUpdatedWib(m.updatedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {m.whatsapp ? (
                          <a
                            href={`https://wa.me/${formatWaPhone(m.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.7rem', background: 'rgba(37, 211, 102, 0.15)', color: '#25d366', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, textDecoration: 'none' }}
                          >
                            💬 WA
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Tanpa WA
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingItem({
                            type: 'member',
                            item: {
                              ...m,
                              rawResponsibilities: Array.isArray(m.responsibilities) ? m.responsibilities.join('\n') : (m.responsibilities || '')
                            }
                          })}
                          title="Edit Data Personel"
                          style={{
                            padding: '6px',
                            background: 'rgba(14, 165, 233, 0.1)',
                            border: '1px solid #0284c7',
                            color: '#0284c7',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMemberClick(m)}
                          title="Hapus Personel"
                          style={{
                            padding: '6px',
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid #f43f5e',
                            color: '#f43f5e',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )))}
                </div>

                {totalAdminMemPages > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    marginTop: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Menampilkan <strong>{(safeAdminMemPage - 1) * ADMIN_MEM_PER_PAGE + 1} - {Math.min(safeAdminMemPage * ADMIN_MEM_PER_PAGE, filteredAdminMembers.length)}</strong> dari <strong>{filteredAdminMembers.length}</strong> personel
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={safeAdminMemPage === 1}
                        onClick={() => setAdminMemPage((p: any) => Math.max(1, p - 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminMemPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminMemPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: safeAdminMemPage === 1 ? 0.45 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      {Array.from({ length: totalAdminMemPages }, (_, i) => i + 1).map((pg) => {
                        const isActive = pg === safeAdminMemPage;
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setAdminMemPage(pg)}
                            style={{
                              minWidth: '28px',
                              height: '28px',
                              padding: '0 6px',
                              borderRadius: 'var(--radius-sm)',
                              background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                              color: isActive ? '#040914' : 'var(--text-main)',
                              border: isActive ? 'none' : '1px solid var(--border-card)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {pg}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        disabled={safeAdminMemPage === totalAdminMemPages}
                        onClick={() => setAdminMemPage((p: any) => Math.min(totalAdminMemPages, p + 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminMemPage === totalAdminMemPages ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminMemPage === totalAdminMemPages ? 'not-allowed' : 'pointer',
                          opacity: safeAdminMemPage === totalAdminMemPages ? 0.45 : 1
                        }}
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
