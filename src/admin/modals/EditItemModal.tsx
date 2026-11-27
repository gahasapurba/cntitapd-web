import React from 'react';
import { AKHLAK_VALUES, DEFAULT_AKHLAK_VALUE } from '../../utils/akhlak';
import { AlertCircle, ArrowDown, ArrowUp, Building2, Calendar, Edit2, GripVertical, Image as ImageIcon, Layers, Link2, Plus, Trash2, Upload, X } from 'lucide-react';
import { LEVEL_OPTIONS, formatLevelOptionLabel, getCategoryFromLevel, getTenureRoles, validateMemberQuota } from '../../utils/memberQuotaUtils';
import { buildFlexibleDate, formatDeadlineWib, formatToIndonesianDate, formatWibDateTime, formatWibEventRange, parseFlexibleDate, toDatetimeLocalSecondsValue, toDatetimeLocalValue } from '../../utils/dateUtils';
import { soundFx } from '../../utils/audio';
import { uploadMediaToCloud } from '../../lib/supabase';
import { useAdminPortal } from '../AdminPortalContext';

export default function EditItemModal() {
  const {
    activeTenure,
    departments,
    divisions,
    dragOverFieldIndex,
    draggedFieldIndex,
    editModalError,
    editingItem,
    events,
    forms,
    handleAddPhotoLinkToEditModal,
    handleBrandAssetUpload,
    handleMemberPhotoUpload,
    handleMoveField,
    handlePhotoUpload,
    isDark,
    isUploadingMedia,
    members,
    onUpdateBrandAsset,
    onUpdateDepartment,
    onUpdateDivision,
    onUpdateEvent,
    onUpdateFaq,
    onUpdateForm,
    onUpdateGallery,
    onUpdateKudos,
    onUpdateMember,
    onUpdateTenure,
    onUpdateTenureRole,
    roleQuotas,
    setDeleteConfirm,
    setDragOverFieldIndex,
    setDraggedFieldIndex,
    setEditModalError,
    setEditingItem,
    setIsUploadingMedia,
    showToast,
    submissions,
    tenureRoles,
    tenures,
    verifyImageUrl
  } = useAdminPortal();

  return (
    <>
      {editingItem && (
        <div 
          onClick={() => setEditingItem(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel modal-container modal-structured" 
            style={{
              maxWidth: editingItem.type === 'form' ? '680px' : '580px',
              width: '100%',
              maxHeight: 'min(90vh, 780px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0,
              border: '1.5px solid var(--mandiri-gold)',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.75)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {/* Pinned Sticky Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 22px',
              borderBottom: '1px solid var(--border-card)',
              background: 'var(--bg-card)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--mandiri-gold)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Edit {
                    editingItem.type === 'member' ? 'Data Personel' :
                    editingItem.type === 'role' ? 'Data Role & Struktur' :
                    editingItem.type === 'division' ? 'Data Divisi' :
                    editingItem.type === 'department' ? 'Data Departemen' :
                    editingItem.type === 'gallery' ? 'Dokumentasi Galeri' :
                    editingItem.type === 'kudos' ? 'Apresiasi / Kudos' :
                    editingItem.type === 'form' ? 'Formulir Pendaftaran' :
                    editingItem.type === 'event' ? 'Event' :
                    editingItem.type === 'brand_asset' ? 'Asset & Template' :
                    editingItem.type === 'faq' ? 'Pertanyaan FAQ' :
                    'Periode Kepengurusan'
                  }
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditModalError('');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title="Tutup (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inline Error Alert if Required Validation Fails */}
            {editModalError && (
              <div style={{
                margin: '14px 22px 0 22px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid #f43f5e',
                color: '#f43f5e',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{editModalError}</span>
              </div>
            )}

            {/* Scrollable Modal Content */}
            <div style={{
              padding: '20px 22px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>

            {/* Edit Member Form (Complete Fields) */}
            {editingItem.type === 'member' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Lengkap <span style={{ color: '#f43f5e' }}>*</span></label>
                    <input
                      type="text"
                      value={editingItem.item.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan <span style={{ color: '#f43f5e' }}>*</span></label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter((d: any) => d.tenureId === newTenure);
                        const keepDiv = validDivs.some((d: any) => d.id === editingItem.item.divisionId);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? editingItem.item.divisionId : undefined
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ROLE & DIVISI SELECTION IN EDIT MODAL */}
                {(() => {
                  const editMemberTenureId = editingItem.item.tenureId || activeTenure?.id || '';
                  const availableRoles = getTenureRoles(editMemberTenureId, roleQuotas, tenureRoles);
                  const selectedRole = availableRoles.find(r => r.id === editingItem.item.roleId) ||
                    availableRoles.find(r => r.name.toLowerCase() === (editingItem.item.role || '').toLowerCase()) ||
                    null;
                  const requiresDiv = selectedRole ? selectedRole.requiresDivision : (editingItem.item.category === 'anggota' || editingItem.item.category === 'pimpro');
                  const editMemberDivs = divisions.filter((d: any) => d.tenureId === editMemberTenureId);

                  return (
                    <div className="mobile-two-col" style={{ gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Jabatan / Role <span style={{ color: '#f43f5e' }}>*</span>
                        </label>
                        <select
                          value={selectedRole?.id || ''}
                          onChange={(e) => {
                            const rId = e.target.value;
                            const rObj = availableRoles.find(r => r.id === rId);
                            if (rObj) {
                              const newCat = getCategoryFromLevel(rObj.level);
                              setEditingItem({
                                ...editingItem,
                                item: {
                                  ...editingItem.item,
                                  roleId: rObj.id,
                                  role: rObj.name,
                                  category: newCat,
                                  divisionId: rObj.requiresDivision ? editingItem.item.divisionId : undefined
                                }
                              });
                            }
                          }}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
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
                      </div>

                      {requiresDiv ? (
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Divisi Penugasan <span style={{ color: '#f43f5e' }}>*</span>
                          </label>
                          <select
                            value={editingItem.item.divisionId || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, divisionId: e.target.value || undefined } })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                          >
                            <option value="">-- Pilih Divisi / Squad --</option>
                            {editMemberDivs.map((d: any) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          {editMemberDivs.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '3px' }}>
                              ⚠️ Periode ini belum memiliki divisi.
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Lingkup Tugas
                          </label>
                          <div style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            Lintas Divisi / Tidak Memerlukan Divisi Khusus
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nomor WhatsApp (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 08123456789 atau 628123456789"
                      value={editingItem.item.whatsapp || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, whatsapp: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Motto / Pesan Semangat (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Siap berkontribusi aktif memajukan budaya kolaborasi IT APD"
                      value={editingItem.item.motto || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, motto: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggung Jawab Utama (1 baris per poin)</label>
                  <textarea
                    rows={3}
                    placeholder="Tulis tanggung jawab utama (satu poin per baris)..."
                    value={editingItem.item.rawResponsibilities !== undefined ? editingItem.item.rawResponsibilities : (Array.isArray(editingItem.item.responsibilities) ? editingItem.item.responsibilities.join('\n') : '')}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          rawResponsibilities: textVal,
                          responsibilities: textVal.split('\n').map(s => s.trim()).filter(Boolean)
                        }
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Foto Profil Personel (Cloud Storage)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {editingItem.item.image && (
                      <img
                        src={editingItem.item.image}
                        alt="Avatar"
                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mandiri-gold)' }}
                      />
                    )}
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid var(--neon-cyan)',
                        color: 'var(--neon-cyan)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={13} />
                      <span>{editingItem.pendingPhoto ? 'Ganti Foto Pilihan' : 'Pilih Foto Baru'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleMemberPhotoUpload(e, true)} style={{ display: 'none' }} />
                    </label>
                    <input
                      type="text"
                      placeholder="URL Foto (https://...)"
                      value={editingItem.item.image || ''}
                      onChange={(e) => {
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, image: e.target.value } });
                        if (editModalError) setEditModalError('');
                      }}
                      style={{ flex: 1, minWidth: '150px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    />
                  </div>
                  {editingItem.pendingPhoto && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px dashed var(--neon-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)'
                    }}>
                      <span>👤 Foto baru: <strong>{editingItem.pendingPhoto.name}</strong> &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
                      <button
                        type="button"
                        onClick={() => setEditingItem((prev: any) => prev ? ({ ...prev, pendingPhoto: null, item: { ...prev.item, image: '' } }) : null)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Batalkan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edit Division Form (Complete Fields) */}
            {editingItem.type === 'division' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Divisi</label>
                    <input
                      type="text"
                      value={editingItem.item.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter((d: any) => d.tenureId === newTenure);
                        const keepDiv = validDivs.some((d: any) => d.id === editingItem.item.divisionId);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? editingItem.item.divisionId : undefined
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status Rekrutmen Divisi (Publik)</label>
                    <select
                      value={Boolean(editingItem.item.isRecruiting) ? 'open' : 'closed'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, isRecruiting: e.target.value === 'open' } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="open">● Membuka Rekrutmen (Rekrutmen Buka)</option>
                      <option value="closed">○ Ditutup (Badge Hilang di Web)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Warna Identitas Divisi</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={editingItem.item.color || '#0284c7'}
                        onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, color: e.target.value } })}
                        style={{ width: '40px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={editingItem.item.color || '#0284c7'}
                        onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, color: e.target.value } })}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Motto Divisi</label>
                  <input
                    type="text"
                    value={editingItem.item.motto || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, motto: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Peran</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fokus Area (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    value={editingItem.item.rawFocusAreas !== undefined ? editingItem.item.rawFocusAreas : (Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas.join(', ') : '')}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      const parsed = textVal.split(',').map(s => s.trim()).filter(Boolean);
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          rawFocusAreas: textVal,
                          focusAreas: parsed
                        }
                      });
                    }}
                    placeholder="Contoh: Internal Engagement, Wellness, Learning"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                  />
                  <div style={{ marginTop: '5px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {Array.isArray(editingItem.item.focusAreas) && editingItem.item.focusAreas.length > 0 ? (
                      <span>Fokus aktif ({editingItem.item.focusAreas.length}): <strong style={{ color: 'var(--neon-cyan)' }}>{editingItem.item.focusAreas.join(' • ')}</strong></span>
                    ) : (
                      <span>Ketik fokus area dipisahkan koma (contoh: <code>Internal Engagement, Wellness, Learning</code>)</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Gallery Form (Complete with Photos & DocLinks management) */}
            {editingItem.type === 'gallery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Acara</label>
                    <input
                      type="text"
                      value={editingItem.item.title || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter((d: any) => d.tenureId === newTenure);
                        const keepDiv = validDivs.find((d: any) => d.id === editingItem.item.divisionId || d.name === editingItem.item.division);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? keepDiv.id : '',
                            division: keepDiv ? keepDiv.name : '',
                            divisionName: keepDiv ? keepDiv.name : ''
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(() => {
                      const currentParsed = parseFlexibleDate(editingItem.item.date);
                      const activeMode = editingItem.item._dateMode || currentParsed.mode;
                      const activeDates = editingItem.item._dates || currentParsed.dates || [currentParsed.date, currentParsed.date];
                      
                      const setMode = (newMode: any) => {
                        const newDateStr = buildFlexibleDate(newMode, {
                          date: editingItem.item._dateVal !== undefined ? editingItem.item._dateVal : currentParsed.date,
                          dates: activeDates,
                          startDate: editingItem.item._startDate !== undefined ? editingItem.item._startDate : currentParsed.startDate,
                          endDate: editingItem.item._endDate !== undefined ? editingItem.item._endDate : currentParsed.endDate,
                          month: editingItem.item._month !== undefined ? editingItem.item._month : currentParsed.month,
                          year: editingItem.item._year !== undefined ? editingItem.item._year : currentParsed.year
                        });
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            _dateMode: newMode,
                            _dates: activeDates,
                            date: newDateStr
                          }
                        });
                      };

                      const updateField = (key: any, val: any) => {
                        const nextDates = key === 'dates' ? val : (editingItem.item._dates || currentParsed.dates || [currentParsed.date]);
                        const stateObj = {
                          date: editingItem.item._dateVal !== undefined ? editingItem.item._dateVal : currentParsed.date,
                          dates: nextDates,
                          startDate: editingItem.item._startDate !== undefined ? editingItem.item._startDate : currentParsed.startDate,
                          endDate: editingItem.item._endDate !== undefined ? editingItem.item._endDate : currentParsed.endDate,
                          month: editingItem.item._month !== undefined ? editingItem.item._month : currentParsed.month,
                          year: editingItem.item._year !== undefined ? editingItem.item._year : currentParsed.year,
                          [key]: val
                        };
                        const newDateStr = buildFlexibleDate(activeMode, stateObj);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            [`_${key}`]: val,
                            date: newDateStr
                          }
                        });
                      };

                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              📅 Format & Waktu Pelaksanaan
                            </label>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {[
                                { id: 'date', label: 'Tanggal Lengkap' },
                                { id: 'dates', label: 'Pilih Tanggal' },
                                { id: 'range', label: 'Rentang Tanggal' },
                                { id: 'month', label: 'Bulan & Tahun' },
                                { id: 'year', label: 'Tahun Saja' }
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setMode(m.id)}
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    borderRadius: '5px',
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    background: activeMode === m.id ? 'var(--mandiri-gold)' : 'rgba(255, 255, 255, 0.05)',
                                    color: activeMode === m.id ? '#040914' : 'var(--text-muted)',
                                    borderColor: activeMode === m.id ? 'var(--mandiri-gold)' : 'var(--border-card)'
                                  }}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {activeMode === 'date' && (
                            <input
                              type="date"
                              value={editingItem.item._dateVal !== undefined ? editingItem.item._dateVal : currentParsed.date}
                              onChange={(e) => updateField('date', e.target.value)}
                              style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            />
                          )}

                          {activeMode === 'dates' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '100%' }}>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                Pilih dua atau lebih tanggal pelaksanaan kegiatan (otomatis diurutkan secara kronologis):
                              </div>
                              {activeDates.map((dVal: any, dIdx: any) => (
                                <div key={dIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '100%' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', minWidth: '65px', flexShrink: 0 }}>
                                    Hari ke-{dIdx + 1}:
                                  </span>
                                  <input
                                    type="date"
                                    value={dVal}
                                    onChange={(e) => {
                                      const next = [...activeDates];
                                      next[dIdx] = e.target.value;
                                      updateField('dates', next);
                                    }}
                                    style={{ flex: 1, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                  />
                                  {activeDates.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = activeDates.filter((_: any, i: any) => i !== dIdx);
                                        updateField('dates', next);
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px', flexShrink: 0 }}
                                      title="Hapus tanggal ini"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...activeDates, new Date().toISOString().split('T')[0]];
                                    updateField('dates', next);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '5px 12px',
                                    borderRadius: 'var(--radius-full)',
                                    background: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 61, 121, 0.08)',
                                    color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)',
                                    border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(0, 61, 121, 0.25)',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Plus size={13} />
                                  <span>Tambah Tanggal Pelaksanaan</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {activeMode === 'range' && (
                            <div className="mobile-two-col" style={{ gap: '10px' }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Tanggal Mulai</span>
                                <input
                                  type="date"
                                  value={editingItem.item._startDate !== undefined ? editingItem.item._startDate : currentParsed.startDate}
                                  onChange={(e) => updateField('startDate', e.target.value)}
                                  style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Tanggal Selesai</span>
                                <input
                                  type="date"
                                  value={editingItem.item._endDate !== undefined ? editingItem.item._endDate : currentParsed.endDate}
                                  onChange={(e) => updateField('endDate', e.target.value)}
                                  style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                />
                              </div>
                            </div>
                          )}

                          {activeMode === 'month' && (
                            <input
                              type="month"
                              value={editingItem.item._month !== undefined ? editingItem.item._month : currentParsed.month}
                              onChange={(e) => updateField('month', e.target.value)}
                              style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            />
                          )}

                          {activeMode === 'year' && (
                            <input
                              type="number"
                              min="2000"
                              max="2099"
                              placeholder="Contoh: 2026"
                              value={editingItem.item._year !== undefined ? editingItem.item._year : currentParsed.year}
                              onChange={(e) => updateField('year', e.target.value)}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            />
                          )}

                          <div style={{ fontSize: '0.75rem', color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700 }}>👁️ Tampilan di Web:</span>
                            <strong style={{
                              color: isDark ? '#ffffff' : 'var(--mandiri-blue)',
                              background: isDark ? 'rgba(56, 189, 248, 0.18)' : '#e0f2fe',
                              border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #7dd3fc',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              display: 'inline-block'
                            }}>
                              {formatWibDateTime(editingItem.item.date)}
                            </strong>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Divisi Penyelenggara</label>
                    {(() => {
                      const editGalTenure = editingItem.item.tenureId || activeTenure?.id || '';
                      const editGalDivs = divisions.filter((d: any) => d.tenureId === editGalTenure);
                      const currentDivId = editingItem.item.divisionId || editGalDivs.find((d: any) => d.name === editingItem.item.division)?.id || '';
                      return (
                        <>
                          <select
                            value={currentDivId}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const selectedD = editGalDivs.find((d: any) => d.id === selectedId);
                              setEditingItem({
                                ...editingItem,
                                item: {
                                  ...editingItem.item,
                                  divisionId: selectedId,
                                  division: selectedD ? selectedD.name : '',
                                  divisionName: selectedD ? selectedD.name : ''
                                }
                              });
                            }}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                          >
                            {editGalDivs.length === 0 ? (
                              <option value="" disabled>-- Divisi masih kosong di periode ini --</option>
                            ) : (
                              <>
                                <option value="">-- Pilih Divisi Penyelenggara --</option>
                                {editGalDivs.map((d: any) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </>
                            )}
                          </select>
                          {editGalDivs.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '3px' }}>
                              ⚠️ Periode ini belum memiliki divisi. Silakan buat divisi baru di tab Divisi.
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      🔗 Hubungkan ke Program / Acara (Opsional)
                    </label>
                    {(() => {
                      const editGalTenure = editingItem.item.tenureId || activeTenure?.id || '';
                      const availableEvents = (events || []).filter((ev: any) => !editGalTenure || ev.tenureId === editGalTenure);
                      return (
                        <select
                          value={editingItem.item.eventId || ''}
                          onChange={(e) => {
                            setEditingItem({
                              ...editingItem,
                              item: {
                                ...editingItem.item,
                                eventId: e.target.value || null
                              }
                            });
                          }}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                        >
                          <option value="">-- Tidak Terhubung ke Acara Tertentu --</option>
                          {availableEvents.map((ev: any) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.title} ({ev.date || 'Tanpa Tanggal'})
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Kegiatan</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>

                {/* Photos Manager in Edit Modal */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Foto Carousel ({(editingItem.item.photos || []).length})
                    </label>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid var(--neon-cyan)',
                      color: 'var(--neon-cyan)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}>
                      <Upload size={12} />
                      <span>+ Pilih Foto Baru</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => handlePhotoUpload(e, true)} style={{ display: 'none' }} />
                    </label>
                  </div>
                  {editingItem.pendingPhotos && editingItem.pendingPhotos.length > 0 && (
                    <div style={{
                      marginBottom: '8px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px dashed var(--neon-cyan)',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>📷 <strong>{editingItem.pendingPhotos.length} foto baru</strong> dipilih &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentPhotos = (editingItem.item.photos || []).filter((p: any) => typeof p === 'string' && !p.startsWith('blob:'));
                          setEditingItem({ ...editingItem, pendingPhotos: [], item: { ...editingItem.item, photos: currentPhotos } });
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Batalkan Foto Baru
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(() => {
                      const totalPhotos = (editingItem.item.photos || []).length;
                      const isOnlyOne = totalPhotos <= 1;

                      return (editingItem.item.photos || []).map((photoUrl: any, pIdx: any) => (
                        <div key={pIdx} style={{ position: 'relative', width: '68px', height: '52px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isOnlyOne) {
                                soundFx?.playError?.();
                                showToast('Dokumentasi harus memiliki minimal 1 foto! Tidak dapat menghapus foto terakhir.', 'error');
                                return;
                              }
                              soundFx?.playClick?.();
                              setDeleteConfirm({
                                type: 'gallery_photo',
                                id: photoUrl,
                                photoIdx: pIdx,
                                name: `Foto ke-${pIdx + 1}`
                              });
                            }}
                            title={isOnlyOne ? "Dokumentasi wajib memiliki minimal 1 foto (tidak dapat dihapus)" : `Hapus Foto ke-${pIdx + 1}`}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isOnlyOne ? 'rgba(100, 116, 139, 0.7)' : 'rgba(244, 63, 94, 0.9)',
                              border: 'none',
                              color: '#fff',
                              fontSize: '0.7rem',
                              cursor: isOnlyOne ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: isOnlyOne ? 0.6 : 1
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Option B: Input Tambah Link URL Foto */}
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Link2 size={13} color="var(--mandiri-gold)" />
                      <span>Atau Tambah Foto via Link URL Web:</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea
                        rows={2}
                        placeholder="https://...link-foto-1.jpg&#10;https://...link-foto-2.png"
                        value={editingItem.photoUrlInput || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, photoUrlInput: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddPhotoLinkToEditModal}
                        disabled={isUploadingMedia || !(editingItem.photoUrlInput || '').trim()}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: (editingItem.photoUrlInput || '').trim() ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                          color: (editingItem.photoUrlInput || '').trim() ? '#040914' : 'var(--text-dim)',
                          border: '1px solid var(--border-card)',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          cursor: (editingItem.photoUrlInput || '').trim() ? 'pointer' : 'not-allowed',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          height: 'fit-content'
                        }}
                      >
                        <Plus size={13} />
                        <span>Tambah Link</span>
                      </button>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      * Link diverifikasi aktif sebelum masuk ke carousel. Bisa masukkan beberapa link dipisahkan baris baru.
                    </div>
                  </div>
                </div>

                {/* DocLinks Manager in Edit Modal */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Tautan Dokumentasi / Google Drive ({(editingItem.item.docLinks || []).length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLinks = [...(editingItem.item.docLinks || []), { text: 'Dokumentasi GDrive', url: '' }];
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, docLinks: nextLinks } });
                      }}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(0, 61, 121, 0.08)',
                        border: isDark ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(0, 61, 121, 0.25)',
                        color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={13} />
                      <span>Tambah Link Lain</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(editingItem.item.docLinks || []).map((lnk: any, lIdx: any) => (
                      <div key={lIdx} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Label tombol"
                          value={lnk.text || ''}
                          onChange={(e) => {
                            const nextLinks = (editingItem.item.docLinks || []).map((item: any, i: any) => i === lIdx ? { ...item, text: e.target.value } : item);
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, docLinks: nextLinks } });
                          }}
                          style={{ flex: '1 1 130px', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                        />
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={lnk.url || ''}
                          onChange={(e) => {
                            const nextLinks = (editingItem.item.docLinks || []).map((item: any, i: any) => i === lIdx ? { ...item, url: e.target.value } : item);
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, docLinks: nextLinks } });
                          }}
                          style={{ flex: '1.4 1 160px', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextLinks = (editingItem.item.docLinks || []).filter((_: any, i: any) => i !== lIdx);
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, docLinks: nextLinks } });
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Tenure Form */}
            {editingItem.type === 'tenure' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Kepengurusan <span style={{ color: '#f43f5e' }}>*</span></label>
                    <input
                      type="text"
                      value={editingItem.item.title || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tagline Budaya</label>
                    <input
                      type="text"
                      value={editingItem.item.themeTagline || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, themeTagline: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Headline Hero</label>
                    <input
                      type="text"
                      value={editingItem.item.heroHeadline || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, heroHeadline: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Highlight Hero</label>
                    <input
                      type="text"
                      value={editingItem.item.heroHighlight || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, heroHighlight: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Visi CNT IT (Dinamis)</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.visi || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, visi: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Misi CNT IT (1 baris per misi)</label>
                  <textarea
                    rows={4}
                    placeholder="Tulis poin misi (satu baris per misi)..."
                    value={editingItem.item.rawMisi !== undefined ? editingItem.item.rawMisi : (Array.isArray(editingItem.item.misi) ? editingItem.item.misi.join('\n') : (editingItem.item.misi || ''))}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          rawMisi: textVal,
                          misi: textVal.split('\n').map(s => s.trim()).filter(Boolean)
                        }
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Kudos Form */}
            {editingItem.type === 'kudos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Pengirim</label>
                  <input
                    type="text"
                    value={editingItem.item.sender || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, sender: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Penerima</label>
                  <input
                    type="text"
                    value={editingItem.item.recipient || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, recipient: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Nilai Budaya</label>
                  <select
                    value={editingItem.item.category || DEFAULT_AKHLAK_VALUE}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    {AKHLAK_VALUES.map(v => (
                      <option key={v.value} value={v.value}>{v.value} ({v.description})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pesan Apresiasi</label>
                  <textarea
                    rows={4}
                    value={editingItem.item.message || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, message: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Form Fields (With Custom Field Builder) */}
            {editingItem.type === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Formulir</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Formulir</label>
                    <select
                      value={editingItem.item.category || 'Kegiatan & Event'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="Kegiatan & Event">Kegiatan & Event</option>
                      <option value="Rekrutmen">Rekrutmen & Oprec</option>
                      <option value="Turnamen & Olahraga">Turnamen & Olahraga</option>
                      <option value="Survei & Aspirasi">Survei & Aspirasi</option>
                      <option value="Workshop & Sharing">Workshop & Sharing</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      📅 Batas Akhir / Deadline (WIB)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '100%' }}>
                      <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: '100%' }}>
                        <input
                          type="datetime-local"
                          step="1"
                          value={toDatetimeLocalSecondsValue(editingItem.item.deadline || '')}
                          onChange={(e) => {
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, deadline: e.target.value } });
                          }}
                          style={{
                            width: '100%',
                            maxWidth: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box',
                            padding: '9px 12px 9px 36px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--input-border)',
                            color: 'var(--text-main)',
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        />
                        <Calendar 
                          size={16} 
                          style={{ 
                            position: 'absolute', 
                            left: '10px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            color: 'var(--mandiri-gold)',
                            pointerEvents: 'none' 
                          }} 
                        />
                      </div>
                      {editingItem.item.deadline && (
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, item: { ...editingItem.item, deadline: '' } })}
                          title="Hapus deadline / Tanpa batas waktu"
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--mandiri-gold)', marginTop: '4px', fontWeight: 600 }}>
                      {editingItem.item.deadline ? `Tampilan di Web: ${formatDeadlineWib(editingItem.item.deadline)}` : 'Pilih tanggal & waktu deadline'}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Singkat / Subtitle</label>
                  <textarea
                    rows={2}
                    value={editingItem.item.subtitle || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, subtitle: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    📝 Catatan / Pesan Pasca Pengisian (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Terima kasih sudah mendaftar! Harap bergabung ke WhatsApp Group peserta melalui link berikut: https://chat.whatsapp.com/xxx"
                    value={editingItem.item.notes || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, notes: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px', display: 'block' }}>
                    💡 Catatan ini akan ditampilkan khusus kepada peserta sesaat setelah berhasil submit formulir (misal: link WhatsApp Group, arahan teknis, atau langkah selanjutnya). Tautan URL otomatis dapat diklik dan disalin oleh peserta.
                  </span>
                </div>

                {/* Option: Tenure Relation */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    📅 Periode Kepengurusan (Tenure) <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={editingItem.item.tenureId || activeTenure?.id || tenures[0]?.id || ''}
                    onChange={(e) => {
                      const newTenure = e.target.value;
                      const currentEvt = (events || []).find((ev: any) => ev.id === editingItem.item.eventId);
                      const currentEvtTenure = currentEvt ? (currentEvt.tenureId || divisions.find((d: any) => d.id === currentEvt.divisionId)?.tenureId) : null;
                      const isEventMatchNewTenure = currentEvtTenure === newTenure;

                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          tenureId: newTenure,
                          eventId: isEventMatchNewTenure ? editingItem.item.eventId : '',
                          isEventConnected: isEventMatchNewTenure ? Boolean(editingItem.item.isEventConnected) : false
                        }
                      });
                      if (!isEventMatchNewTenure && editingItem.item.eventId) {
                        showToast('Periode form diubah. Tautan acara lama dilepas otomatis agar sesuai periode baru.', 'info');
                      }
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    {tenures.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.title || `Kepengurusan CNT ${t.code}`} {t.id === activeTenure?.id ? '(Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px', display: 'block' }}>
                    Opsi pertanyaan "Dropdown Divisi" pada formulir ini akan otomatis menampilkan divisi dari periode yang dipilih.
                  </span>
                </div>

                {/* Option: Requires Tracking */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: editingItem.item.requiresTracking !== false ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={editingItem.item.requiresTracking !== false}
                      onChange={(e) => {
                        const isTracking = e.target.checked;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            requiresTracking: isTracking
                          }
                        });
                      }}
                    />
                    <span>Memerlukan Responden untuk Tracking Progres (Status Seleksi / Pendaftaran)</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                    {editingItem.item.requiresTracking !== false
                      ? 'Aktif: Responden dapat melacak progres via ID Pendaftaran atau field Indeks Pencarian. Card pencarian di web akan muncul jika form ini aktif.'
                      : 'Nonaktif: Formulir reguler tanpa fitur pelacakan status. Responden tidak diminta tracking dan indeks pencarian dinonaktifkan.'}
                  </span>
                </div>

                {/* Option: Show Announcement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: editingItem.item.showAnnouncement ? '#10b981' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={!!editingItem.item.showAnnouncement}
                      onChange={(e) => {
                        const isShow = e.target.checked;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            showAnnouncement: isShow
                          }
                        });
                      }}
                    />
                    <span>🎉 Tampilkan Papan Pengumuman Peserta Terpilih (Hall of Welcome) di Halaman Web</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                    {editingItem.item.showAnnouncement
                      ? 'Aktif: Daftar peserta yang berstatus "Accepted / Diterima" akan dipublikasikan secara terbuka pada section Hall of Welcome di halaman formulir.'
                      : 'Nonaktif: Hasil seleksi tidak dipublikasikan ke publik di halaman formulir (hanya dapat dicek secara mandiri oleh responden jika tracking aktif).'}
                  </span>
                </div>

                {/* Option: Batasi Kuota Responden */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: editingItem.item.isLimited ? '#06b6d4' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={!!editingItem.item.isLimited}
                      onChange={(e) => {
                        const isLim = e.target.checked;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            isLimited: isLim,
                            maxQuota: isLim ? (editingItem.item.maxQuota || 50) : 0
                          }
                        });
                      }}
                    />
                    <span>🔒 Batasi Kuota Responden / Pengisian Formulir</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                    {editingItem.item.isLimited
                      ? 'Aktif: Formulir akan otomatis ditutup bila total data yang mengisi/submit telah mencapai batas kuota maksimal.'
                      : 'Nonaktif: Formulir terbuka tanpa batasan kuota responden (hanya dibatasi oleh deadline).'}
                  </span>
                  {editingItem.item.isLimited && (
                    <div style={{ marginLeft: '24px', marginTop: '2px', maxWidth: '280px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Maksimal Kuota Responden <span style={{ color: '#f43f5e' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 100"
                        value={editingItem.item.maxQuota || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingItem({
                            ...editingItem,
                            item: {
                              ...editingItem.item,
                              maxQuota: val === '' ? '' : parseInt(val, 10) || 0
                            }
                          });
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                      />
                    </div>
                  )}
                </div>

                {/* Option: Hubungkan ke Event / Acara */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: editingItem.item.isEventConnected ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={!!editingItem.item.isEventConnected}
                      onChange={(e) => {
                        const isConn = e.target.checked;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            isEventConnected: isConn,
                            eventId: isConn ? (editingItem.item.eventId || '') : ''
                          }
                        });
                      }}
                    />
                    <span>🎪 Hubungkan Formulir ini ke Acara / Event</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                    {editingItem.item.isEventConnected
                      ? 'Aktif: Formulir ini akan menggantikan form RSVP standar pada modal event terkait, dan pendaftar formulir ini akan dianalisis di statistik & undian doorprize event.'
                      : 'Nonaktif: Formulir mandiri biasa yang tidak terikat secara khusus pada event kalender.'}
                  </span>
                  {editingItem.item.isEventConnected && (
                    <div style={{ marginLeft: '24px', marginTop: '2px', maxWidth: '420px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Pilih Acara / Event Terhubung <span style={{ color: '#f43f5e' }}>*</span>
                      </label>
                      <select
                        value={editingItem.item.eventId || ''}
                        onChange={(e) => {
                          setEditingItem({
                            ...editingItem,
                            item: {
                              ...editingItem.item,
                              eventId: e.target.value
                            }
                          });
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                      >
                        <option value="">-- Pilih Event yang Ada di Database --</option>
                        {(() => {
                          const formTenure = editingItem.item.tenureId || activeTenure?.id;
                          const filteredEvents = (events || []).filter((evt: any) => {
                            const evtTenure = evt.tenureId || divisions.find((d: any) => d.id === evt.divisionId)?.tenureId;
                            return !formTenure || !evtTenure || evtTenure === formTenure || evt.id === editingItem.item.eventId;
                          });

                          if (filteredEvents.length === 0) {
                            return <option value="" disabled>-- Belum ada acara pada periode kepengurusan ini --</option>;
                          }

                          return filteredEvents.map((evt: any) => {
                            const existingConnectedForm = (forms || []).find((f: any) =>
                              f.id !== editingItem.item.id &&
                              (f.isEventConnected || f.fields?.[0]?._isEventConnected) &&
                              String(f.eventId || f.fields?.[0]?._eventId) === String(evt.id)
                            );
                            return (
                              <option key={evt.id} value={evt.id}>
                                {evt.title} ({evt.startDate ? formatToIndonesianDate(evt.startDate.split('T')[0]) : (evt.date || 'Tanpa Tanggal')})
                                {existingConnectedForm ? ` ⚠️ (Sedang terhubung ke: "${existingConnectedForm.title}")` : ''}
                              </option>
                            );
                          });
                        })()}
                      </select>

                      {(() => {
                        if (!editingItem.item.eventId) return null;
                        const conflictForm = (forms || []).find((f: any) =>
                          f.id !== editingItem.item.id &&
                          (f.isEventConnected || f.fields?.[0]?._isEventConnected) &&
                          String(f.eventId || f.fields?.[0]?._eventId) === String(editingItem.item.eventId)
                        );
                        if (!conflictForm) return null;
                        return (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              color: '#fbbf24',
                              fontSize: '0.78rem',
                              lineHeight: '1.45',
                              wordBreak: 'break-word'
                            }}
                          >
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                              <span>⚠️ Pengalihan Koneksi Acara (Smart Takeover)</span>
                            </div>
                            Acara ini saat ini sedang terhubung ke formulir <strong>"{conflictForm.title}"</strong>. Menyimpan perubahan ini akan <strong>mengalihkan koneksi acara secara otomatis</strong> ke formulir ini. Formulir <em>"{conflictForm.title}"</em> otomatis kembali menjadi formulir mandiri tanpa menghapus data pendaftar yang sudah ada.
                          </div>
                        );
                      })()}

                      {/* Option: Butuh Pengundian Doorprize */}
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-card)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem', color: editingItem.item.isLuckyDraw ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                          <input
                            type="checkbox"
                            checked={editingItem.item.isLuckyDraw === true}
                            onChange={(e) => {
                              setEditingItem({
                                ...editingItem,
                                item: {
                                  ...editingItem.item,
                                  isLuckyDraw: e.target.checked
                                }
                              });
                            }}
                          />
                          <span>🎁 Butuh Pengundian Doorprize (Lucky Draw)</span>
                        </label>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px', display: 'block', marginTop: '3px' }}>
                          {editingItem.item.isLuckyDraw === true
                            ? 'Aktif: Tombol statistik di modal event akan memuat opsi Undian Doorprize, dan modul undian Lucky Draw akan ditampilkan pada halaman statistik acara.'
                            : 'Nonaktif: Hanya menampilkan statistik & analitik pendaftar. Modul dan tombol undian doorprize disembunyikan.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Field Builder */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                        Daftar Pertanyaan / Field ({(editingItem.item.fields || []).length})
                      </label>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>
                        Drag ikon grip atau klik panah untuk menentukan urutan pertanyaan
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextFields = [
                          ...(editingItem.item.fields || []),
                          {
                            id: 'f-custom-' + Date.now(),
                            label: 'Pertanyaan Baru',
                            type: 'text',
                            placeholder: 'Masukkan jawaban...',
                            required: false,
                            isSearchIndex: false,
                            isUnique: false
                          }
                        ];
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={12} />
                      <span>Tambah Pertanyaan</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(editingItem.item.fields || []).map((fld: any, idx: any) => (
                      <div
                        key={fld.id || idx}
                        draggable
                        onDragStart={(e) => {
                          setDraggedFieldIndex(idx);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(idx));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverFieldIndex !== idx) {
                            setDragOverFieldIndex(idx);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverFieldIndex === idx) setDragOverFieldIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromIdx = draggedFieldIndex !== null ? draggedFieldIndex : Number(e.dataTransfer.getData('text/plain'));
                          handleMoveField(fromIdx, idx);
                          setDraggedFieldIndex(null);
                          setDragOverFieldIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggedFieldIndex(null);
                          setDragOverFieldIndex(null);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: dragOverFieldIndex === idx && draggedFieldIndex !== idx
                            ? 'rgba(56, 189, 248, 0.12)'
                            : (draggedFieldIndex === idx ? 'rgba(255, 184, 0, 0.05)' : 'rgba(255,255,255,0.03)'),
                          border: dragOverFieldIndex === idx && draggedFieldIndex !== idx
                            ? '2px dashed var(--neon-cyan)'
                            : (draggedFieldIndex === idx ? '1px dashed var(--mandiri-gold)' : '1px solid var(--border-card)'),
                          opacity: draggedFieldIndex === idx ? 0.4 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Row 1: Grip, Index, Up/Down, Label Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '100%' }}>
                          {/* Drag Handle & Item Position */}
                          <div 
                            title="Tahan & geser untuk mengubah urutan field"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'grab', color: 'var(--text-dim)', userSelect: 'none', flexShrink: 0 }}
                          >
                            <GripVertical size={16} />
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--mandiri-gold)', minWidth: '18px' }}>
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Quick Up/Down Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveField(idx, idx - 1)}
                              title="Pindahkan ke atas"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-card)',
                                borderRadius: '4px',
                                color: idx === 0 ? 'var(--text-dim)' : 'var(--text-main)',
                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                padding: '3px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: idx === 0 ? 0.3 : 1
                              }}
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (editingItem.item.fields?.length || 0) - 1}
                              onClick={() => handleMoveField(idx, idx + 1)}
                              title="Pindahkan ke bawah"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-card)',
                                borderRadius: '4px',
                                color: idx === (editingItem.item.fields?.length || 0) - 1 ? 'var(--text-dim)' : 'var(--text-main)',
                                cursor: idx === (editingItem.item.fields?.length || 0) - 1 ? 'not-allowed' : 'pointer',
                                padding: '3px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: idx === (editingItem.item.fields?.length || 0) - 1 ? 0.3 : 1
                              }}
                            >
                              <ArrowDown size={11} />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={fld.label || ''}
                            placeholder="Label pertanyaan"
                            onChange={(e) => {
                              const nextFields = editingItem.item.fields.map((item: any, i: any) =>
                                i === idx ? { ...item, label: e.target.value } : item
                              );
                              setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                            }}
                            style={{ flex: 1, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                          />
                        </div>

                        {/* Row 2: Type Dropdown, Toggles, and Delete Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
                          <select
                            value={
                              fld.type === 'select' && fld.source === 'departments'
                                ? 'select_department'
                                : (fld.type === 'select' && fld.source === 'divisions'
                                    ? 'select_division'
                                    : (fld.type || 'text'))
                            }
                            onChange={(e) => {
                              const selectedVal = e.target.value;
                              const nextFields = editingItem.item.fields.map((item: any, i: any) => {
                                if (i === idx) {
                                  if (selectedVal === 'select_department') {
                                    return {
                                      ...item,
                                      type: 'select',
                                      source: 'departments',
                                      options: [],
                                      rawOptions: undefined
                                    };
                                  } else if (selectedVal === 'select_division') {
                                    return {
                                      ...item,
                                      type: 'select',
                                      source: 'divisions',
                                      options: [],
                                      rawOptions: undefined
                                    };
                                  } else {
                                    const updated = { ...item, type: selectedVal, source: undefined };
                                    if (selectedVal === 'radio' && (!item.options || item.options.length === 0)) {
                                      updated.options = ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
                                      updated.rawOptions = 'Pilihan 1, Pilihan 2, Pilihan 3';
                                    } else if (selectedVal === 'select' && (!item.options || item.options.length === 0)) {
                                      updated.options = ['Opsi 1', 'Opsi 2', 'Opsi 3'];
                                      updated.rawOptions = 'Opsi 1, Opsi 2, Opsi 3';
                                    }
                                    return updated;
                                  }
                                }
                                return item;
                              });
                              setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                            }}
                            style={{ flex: '1 1 160px', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                          >
                            <option value="text">Teks Singkat</option>
                            <option value="textarea">Paragraf</option>
                            <option value="radio">Pilihan Ganda (1 Jawaban)</option>
                            <option value="select">Dropdown Pilihan (Ketik Opsi Manual)</option>
                            <option value="select_department">🏢 Dropdown Departemen (Otomatis dari DB)</option>
                            <option value="select_division">👥 Dropdown Divisi (Otomatis dari DB)</option>
                            <option value="email">Email</option>
                            <option value="number">Angka</option>
                            <option value="file">Upload File</option>
                          </select>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(fld.required)}
                              onChange={(e) => {
                                const nextFields = editingItem.item.fields.map((item: any, i: any) =>
                                  i === idx ? { ...item, required: e.target.checked } : item
                                );
                                setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                              }}
                            />
                            <span>Wajib</span>
                          </label>

                          {/* Search Index Toggle (Hanya tampil jika form memerlukan tracking) */}
                          {editingItem.item.requiresTracking !== false && (
                            <label
                              title="Jadikan Indeks Pencarian: Centang jika field ini dijadikan kredensial pendaftar untuk mencari & mengecek status pendaftaran/seleksi di web. Jika tidak ada field yang dicentang, pelacakan default menggunakan ID Pendaftaran."
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                color: fld.isSearchIndex ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                                background: fld.isSearchIndex ? 'rgba(255, 184, 0, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                                border: fld.isSearchIndex ? '1px solid rgba(255, 184, 0, 0.45)' : '1px solid var(--border-card)',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: fld.isSearchIndex ? 700 : 500,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(fld.isSearchIndex)}
                                onChange={(e) => {
                                  const nextFields = editingItem.item.fields.map((item: any, i: any) =>
                                    i === idx ? { ...item, isSearchIndex: e.target.checked } : item
                                  );
                                  setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                                }}
                              />
                              <span>🔍 Indeks Pencarian</span>
                            </label>
                          )}

                          {/* Unique Validation Toggle */}
                          <label
                            title="Validasi Unique: Centang jika nilai pada field ini harus unik dan tidak boleh ada pengisi lain yang mendaftarkan nilai yang sama (misal: NIP, No HP, Email)."
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              color: fld.isUnique ? 'var(--neon-cyan)' : 'var(--text-muted)',
                              background: fld.isUnique ? 'rgba(6, 182, 212, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                              border: fld.isUnique ? '1px solid rgba(6, 182, 212, 0.45)' : '1px solid var(--border-card)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: fld.isUnique ? 700 : 500,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(fld.isUnique)}
                              onChange={(e) => {
                                const nextVal = e.target.checked;
                                if (nextVal) {
                                  // Check existing submissions for duplicate answers on this field
                                  const formSubs = submissions.filter((s: any) => s.formId === editingItem.item.id);
                                  const valCounts: Record<string, any> = {};
                                  formSubs.forEach((s: any) => {
                                    const rawVal = s.data?.[fld.id] ?? s[fld.id] ?? s.answers?.[fld.id];
                                    if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
                                      const normVal = String(rawVal).trim().toLowerCase();
                                      valCounts[normVal] = (valCounts[normVal] || 0) + 1;
                                    }
                                  });
                                  const duplicates = Object.entries(valCounts).filter(([_, count]) => count > 1);
                                  if (duplicates.length > 0) {
                                    const dupListStr = duplicates.map(([val, count]) => `• "${val}" (${count} responden)`).join('\n');
                                    alert(
                                      `⚠️ Tidak dapat mengaktifkan "Validasi Unique" pada field "${fld.label}"!\n\n` +
                                      `Ditemukan ${duplicates.length} data duplikat pada pengisian responden sebelumnya:\n` +
                                      dupListStr +
                                      `\n\nUntuk menerapkan validasi unik, silakan buka tab Responden lalu hapus data duplikat hingga setiap nilai hanya tersisa 1 responden saja.`
                                    );
                                    return;
                                  }
                                }
                                const nextFields = editingItem.item.fields.map((item: any, i: any) =>
                                  i === idx ? { ...item, isUnique: nextVal } : item
                                );
                                setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                              }}
                            />
                            <span>🛡️ Validasi Unique</span>
                          </label>

                          {/* Field Delete Button with Confirmation if data exists */}
                          {(() => {
                            const subCount = submissions.filter((s: any) => s.formId === editingItem.item.id).length;

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (subCount > 0) {
                                    const ok = window.confirm(
                                      `Formulir ini sudah memiliki ${subCount} berkas pendaftar.\n\n` +
                                      `Menghapus field "${fld.label}" TIDAK AKAN MENGHAPUS data pendaftar yang sudah ada di database, namun pertanyaan ini tidak akan muncul lagi bagi pendaftar baru.\n\n` +
                                      `Lanjutkan menghapus pertanyaan ini?`
                                    );
                                    if (!ok) return;
                                  }

                                  const nextFields = editingItem.item.fields.filter((_: any, i: any) => i !== idx);
                                  setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#f43f5e',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  opacity: 0.85
                                }}
                                title={subCount > 0 ? "Form ini sudah ada pendaftar (konfirmasi akan muncul)" : "Hapus pertanyaan"}
                              >
                                <Trash2 size={14} />
                              </button>
                            );
                          })()}
                        </div>

                        {/* Option Editor for Custom Dropdown & Multiple Choice (Radio) */}
                        {(fld.type === 'select' || fld.type === 'radio') && fld.source !== 'divisions' && fld.source !== 'departments' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', paddingLeft: '24px' }}>
                            <input
                              type="text"
                              placeholder={fld.type === 'radio'
                                ? "Pilihan jawaban (pisahkan dengan koma, misal: Pilihan A, Pilihan B, Pilihan C)"
                                : "Opsi dropdown (pisahkan dengan koma, misal: Opsi 1, Opsi 2, Opsi 3)"}
                              value={fld.rawOptions !== undefined ? fld.rawOptions : (Array.isArray(fld.options) ? fld.options.join(', ') : '')}
                              onChange={(e) => {
                                const textVal = e.target.value;
                                const opts = textVal.split(',').map(s => s.trim()).filter(Boolean);
                                const nextFields = editingItem.item.fields.map((item: any, i: any) =>
                                  i === idx ? { ...item, options: opts, rawOptions: textVal } : item
                                );
                                setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                              }}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {Array.isArray(fld.options) && fld.options.length > 0 ? (
                                <span>
                                  Opsi aktif ({fld.options.length}): <strong style={{ color: 'var(--neon-cyan)' }}>{fld.options.join(' • ')}</strong>
                                </span>
                              ) : (
                                <span>Ketik opsi dipisahkan koma (contoh: <code>Opsi 1, Opsi 2, Opsi 3</code>)</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Automatic Departments Dropdown Info */}
                        {fld.type === 'select' && fld.source === 'departments' && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '2px',
                            padding: '7px 12px',
                            marginLeft: '24px',
                            borderRadius: '6px',
                            background: 'rgba(255, 184, 0, 0.08)',
                            border: '1px solid rgba(255, 184, 0, 0.3)',
                            fontSize: '0.75rem',
                            color: 'var(--mandiri-gold)'
                          }}>
                            <Building2 size={14} style={{ flexShrink: 0 }} />
                            <span>
                              Opsi dropdown otomatis diambil dari <strong>{departments.length} Departemen</strong> di database (Kelola Departemen). Pilihan akan selalu sinkron otomatis tanpa perlu mengetik manual.
                            </span>
                          </div>
                        )}

                        {/* Automatic Divisions Dropdown Info */}
                        {fld.type === 'select' && fld.source === 'divisions' && (() => {
                          const formTenureId = editingItem.item.tenureId || activeTenure?.id;
                          const currentTenure = tenures.find((t: any) => t.id === formTenureId) || activeTenure;
                          const tenureDivs = (divisions || []).filter((d: any) => !formTenureId || d.tenureId === formTenureId);

                          return (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '2px',
                              padding: '7px 12px',
                              marginLeft: '24px',
                              borderRadius: '6px',
                              background: 'rgba(56, 189, 248, 0.08)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              fontSize: '0.75rem',
                              color: 'var(--neon-cyan)'
                            }}>
                              <Layers size={14} style={{ flexShrink: 0 }} />
                              <span>
                                Opsi dropdown otomatis diambil dari <strong>{tenureDivs.length} Divisi</strong> pada periode <strong>{currentTenure?.title || currentTenure?.code || 'Aktif'}</strong> di database.
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Event Form */}
            {editingItem.type === 'event' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Event</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      📅 Tanggal & Jam Mulai (WIB) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(editingItem.item.startDate)}
                      max={editingItem.item.endDate ? toDatetimeLocalValue(editingItem.item.endDate) : undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sVal = val;
                        const eVal = editingItem.item.endDate || val;
                        const normStart = toDatetimeLocalValue(sVal);
                        const normEnd = toDatetimeLocalValue(editingItem.item.endDate);
                        if (normStart && normEnd && normStart > normEnd) {
                          setEditModalError('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir');
                        } else {
                          setEditModalError('');
                        }
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            startDate: sVal,
                            date: formatWibEventRange(sVal, eVal)
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: `1px solid ${(editingItem.item.startDate && editingItem.item.endDate && toDatetimeLocalValue(editingItem.item.startDate) > toDatetimeLocalValue(editingItem.item.endDate)) ? '#f43f5e' : 'var(--input-border)'}`,
                        color: 'var(--text-main)',
                        fontSize: '0.86rem'
                      }}
                    />
                    {editingItem.item.startDate && editingItem.item.endDate && toDatetimeLocalValue(editingItem.item.startDate) > toDatetimeLocalValue(editingItem.item.endDate) && (
                      <div style={{ fontSize: '0.72rem', color: '#f43f5e', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      📅 Tanggal & Jam Berakhir (WIB) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(editingItem.item.endDate)}
                      min={editingItem.item.startDate ? toDatetimeLocalValue(editingItem.item.startDate) : undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sVal = editingItem.item.startDate || val;
                        const eVal = val;
                        const normStart = toDatetimeLocalValue(editingItem.item.startDate);
                        const normEnd = toDatetimeLocalValue(eVal);
                        if (normStart && normEnd && normEnd < normStart) {
                          setEditModalError('Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai');
                        } else {
                          setEditModalError('');
                        }
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            endDate: eVal,
                            date: formatWibEventRange(sVal, eVal)
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: `1px solid ${(editingItem.item.startDate && editingItem.item.endDate && toDatetimeLocalValue(editingItem.item.endDate) < toDatetimeLocalValue(editingItem.item.startDate)) ? '#f43f5e' : 'var(--input-border)'}`,
                        color: 'var(--text-main)',
                        fontSize: '0.86rem'
                      }}
                    />
                    {editingItem.item.startDate && editingItem.item.endDate && toDatetimeLocalValue(editingItem.item.endDate) < toDatetimeLocalValue(editingItem.item.startDate) && (
                      <div style={{ fontSize: '0.72rem', color: '#f43f5e', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Preview of Dynamic Date in WIB */}
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.78rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Tampilan Jadwal di Web:</span>
                  <strong>{formatWibEventRange(editingItem.item.startDate, editingItem.item.endDate, editingItem.item.date || 'TBD')}</strong>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter((d: any) => d.tenureId === newTenure);
                        const keepDiv = validDivs.some((d: any) => d.id === editingItem.item.divisionId);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? editingItem.item.divisionId : '',
                            divisionName: keepDiv ? editingItem.item.divisionName : ''
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Divisi Penyelenggara</label>
                    {(() => {
                      const editEventTenure = editingItem.item.tenureId || activeTenure?.id || '';
                      const editEventDivs = divisions.filter((d: any) => d.tenureId === editEventTenure);
                      return (
                        <>
                          <select
                            value={editingItem.item.divisionId || ''}
                            onChange={(e) => {
                              const selDiv = editEventDivs.find((d: any) => d.id === e.target.value);
                              setEditingItem({
                                ...editingItem,
                                item: {
                                  ...editingItem.item,
                                  divisionId: e.target.value,
                                  divisionName: selDiv?.name || editingItem.item.divisionName || ''
                                }
                              });
                            }}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                          >
                            {editEventDivs.length === 0 ? (
                              <option value="" disabled>-- Divisi masih kosong di periode ini --</option>
                            ) : (
                              <>
                                <option value="">-- Pilih Divisi Penyelenggara --</option>
                                {editEventDivs.map((d: any) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </>
                            )}
                          </select>
                          {editEventDivs.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '3px' }}>
                              ⚠️ Periode ini belum memiliki divisi. Silakan buat divisi baru di tab Divisi.
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status Pelaksanaan</label>
                    <select
                      value={editingItem.item.status || 'Upcoming'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, status: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="Upcoming">Upcoming (Akan Datang)</option>
                      <option value="Ongoing">Ongoing (Sedang Berjalan)</option>
                      <option value="Completed">Completed (Selesai)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      💰 Estimasi Total RAB (Rp) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 15000000 (wajib diisi)"
                      value={editingItem.item.totalRab !== undefined && editingItem.item.totalRab !== null ? editingItem.item.totalRab : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, totalRab: v === '' ? '' : Number(v) } });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Lokasi Kegiatan</label>
                    <input
                      type="text"
                      value={editingItem.item.location || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, location: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Peserta</label>
                    <input
                      type="text"
                      placeholder="Contoh: 150+ Peserta Officer IT APD"
                      value={editingItem.item.peserta !== undefined ? editingItem.item.peserta : (editingItem.item.kpi || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            peserta: val,
                            kpi: val
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    🏷️ Kategori Program / Kegiatan <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  {(() => {
                    const currentCat = editingItem.item.kategori || editingItem.item.category || editingItem.item.badge || '';
                    const standardCats = [
                      'Program Budaya',
                      'Workshop & Sharing Session',
                      'Social & Engagement',
                      'Olahraga & Well-being',
                      'Kompetisi & Inovasi',
                      'Apresiasi & Rekognisi',
                      'Townhall & Perayaan'
                    ];
                    const hasCustomCat = currentCat && !standardCats.includes(currentCat);
                    return (
                      <select
                        value={currentCat}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingItem({
                            ...editingItem,
                            item: {
                              ...editingItem.item,
                              kategori: val,
                              category: val,
                              badge: val
                            }
                          });
                        }}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                      >
                        <option value="">-- Pilih Kategori Kegiatan * --</option>
                        {standardCats.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        {hasCustomCat && (
                          <option value={currentCat}>{currentCat}</option>
                        )}
                      </select>
                    );
                  })()}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Kegiatan</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 184, 0, 0.06)',
                  border: '1px solid rgba(255, 184, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(editingItem.item.isLimited)}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          isLimited: e.target.checked
                        }
                      })}
                      style={{ accentColor: 'var(--mandiri-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      🔒 Batasi Kuota Pendaftaran RSVP untuk Event Ini?
                    </span>
                  </label>

                  {editingItem.item.isLimited && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Batas Maksimal Kuota Peserta (Orang) <span style={{ color: '#f43f5e' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 100"
                        value={editingItem.item.maxQuota !== undefined && editingItem.item.maxQuota !== null ? editingItem.item.maxQuota : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditingItem({
                            ...editingItem,
                            item: {
                              ...editingItem.item,
                              maxQuota: v === '' ? '' : Number(v)
                            }
                          });
                        }}
                        style={{
                          maxWidth: '220px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        RSVP akan ditutup otomatis ketika jumlah peserta yang mendaftar telah mencapai angka ini.
                      </span>
                    </div>
                  )}
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🌐 Status Publikasi di Web Publik</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Jika <strong>Draft / Privat</strong>, event hanya tampil di Admin Portal dan tidak terlihat oleh pengguna umum di web.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingItem({
                      ...editingItem,
                      item: {
                        ...editingItem.item,
                        isPublic: !editingItem.item.isPublic
                      }
                    })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      border: 'none',
                      background: editingItem.item.isPublic ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.18)',
                      color: editingItem.item.isPublic ? '#10b981' : '#f43f5e',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {editingItem.item.isPublic ? '● Publik di Web' : '○ Draft / Privat (Hanya Admin)'}
                  </button>
                </div>
              </div>
            )}

            {/* Edit Brand Asset Form */}
            {editingItem.type === 'brand_asset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Asset / Template</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori</label>
                    <select
                      value={editingItem.item.category || 'Logo & Brand'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="Logo & Brand">Logo & Brand</option>
                      <option value="Template Presentasi">Template Presentasi (PPT)</option>
                      <option value="Virtual Background">Virtual Background (Teams / Zoom)</option>
                      <option value="Media & Publikasi">Media, Twibbon & Publikasi</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Label Kategori Tambahan / Tag</label>
                    <input
                      type="text"
                      value={editingItem.item.badge || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, badge: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Format File</label>
                    <input
                      type="text"
                      value={editingItem.item.fileType || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileType: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ukuran File</label>
                    <input
                      type="text"
                      value={editingItem.item.fileSize || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileSize: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>File Asset / Template (Cloud Storage)</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid var(--neon-cyan)',
                      color: 'var(--neon-cyan)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      <Upload size={13} />
                      <span>{editingItem.pendingFile ? 'Ganti File Pilihan' : 'Pilih File Baru'}</span>
                      <input
                        type="file"
                        accept="*/*,.zip,.rar,.7z,.pdf,.pptx,.ppt,.png,.jpg,.jpeg,.svg,.docx,.xlsx"
                        onChange={(e) => handleBrandAssetUpload(e, 'fileUrl', true)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Atau tempel URL file langsung"
                      value={editingItem.item.fileUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileUrl: e.target.value } })}
                      style={{ flex: 1, minWidth: '180px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                  {editingItem.pendingFile && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px dashed var(--neon-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)'
                    }}>
                      <span>📦 File baru: <strong>{editingItem.pendingFile.name}</strong> ({editingItem.item.fileSize}) &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
                      <button
                        type="button"
                        onClick={() => setEditingItem((prev: any) => prev ? ({ ...prev, pendingFile: null, item: { ...prev.item, fileUrl: prev.originalFileUrl || '' } }) : null)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Batalkan
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Preview Thumbnail Gambar (Opsional)</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {editingItem.item.previewUrl && (
                      <img src={editingItem.item.previewUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-card)' }} />
                    )}
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 184, 0, 0.12)',
                      border: '1px solid var(--mandiri-gold)',
                      color: 'var(--mandiri-gold)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      <ImageIcon size={13} />
                      <span>{editingItem.pendingPreviewFile ? 'Ganti Preview' : 'Pilih Gambar'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleBrandAssetUpload(e, 'previewUrl', true)} style={{ display: 'none' }} />
                    </label>
                    <input
                      type="text"
                      placeholder="URL Gambar Thumbnail..."
                      value={editingItem.item.previewUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, previewUrl: e.target.value } })}
                      style={{ flex: 1, minWidth: '180px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                  {editingItem.pendingPreviewFile && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 184, 0, 0.08)',
                      border: '1px dashed var(--mandiri-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)'
                    }}>
                      <span>🖼️ Preview baru: <strong>{editingItem.pendingPreviewFile.name}</strong> &bull; <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
                      <button
                        type="button"
                        onClick={() => setEditingItem((prev: any) => prev ? ({ ...prev, pendingPreviewFile: null, item: { ...prev.item, previewUrl: '' } }) : null)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Batalkan
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            {/* Edit FAQ Form */}
            {editingItem.type === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Topik</label>
                  <select
                    value={editingItem.item.category || 'Umum'}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    <option value="Tentang CNT">Tentang CNT</option>
                    <option value="Kegiatan & Event">Kegiatan & Event</option>
                    <option value="Operasional & Sekben">Operasional & Sekben</option>
                    <option value="Aspirasi & Usulan">Aspirasi & Usulan</option>
                    <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pertanyaan (Question)</label>
                  <input
                    type="text"
                    value={editingItem.item.question || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, question: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Jawaban Lengkap (Answer)</label>
                  <textarea
                    rows={4}
                    value={editingItem.item.answer || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, answer: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Role Form */}
            {editingItem.type === 'role' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Nama Jabatan / Role <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.item.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                    placeholder="Contoh: Sekretaris Jenderal"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Periode Kepengurusan
                  </label>
                  <select
                    value={editingItem.item.tenureId || activeTenure?.id || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, tenureId: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    {tenures.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Tingkatan di Bagan Organigram
                  </label>
                  <select
                    value={editingItem.item.level ?? 5}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, level: Number(e.target.value) } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    {LEVEL_OPTIONS.map(lvl => (
                      <option key={lvl.level} value={lvl.level}>
                        {formatLevelOptionLabel(lvl, tenureRoles, editingItem.item.tenureId || activeTenure?.id || tenures[0]?.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Batas Maksimal Kuota Personel (0 = Tanpa Batas / Unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem.item.max ?? editingItem.item.maxQuota ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditingItem({ ...editingItem, item: { ...editingItem.item, max: val, maxQuota: val } });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
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
                    id="editRoleRequireDiv"
                    checked={Boolean(editingItem.item.requiresDivision)}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, requiresDivision: e.target.checked } })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="editRoleRequireDiv" style={{ fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <strong>Memerlukan Pilihan Divisi</strong> (Personel dengan role ini wajib memilih divisi)
                  </label>
                </div>
              </div>
            )}

            {/* Edit Department Form */}
            {editingItem.type === 'department' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Nama Departemen <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.item.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                    placeholder="Contoh: Digital Banking Delivery"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Kode / Singkatan
                  </label>
                  <input
                    type="text"
                    value={editingItem.item.code || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, code: e.target.value.toUpperCase() } })}
                    placeholder="Contoh: DBD"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Deskripsi / Keterangan Fungsi (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    placeholder="Deskripsi tugas atau ruang lingkup delivery departemen..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            </div>

            {/* Pinned Sticky Footer Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 22px',
              borderTop: '1px solid var(--border-card)',
              background: 'var(--bg-card)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditModalError('');
                }}
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
                Batal
              </button>
              <button
                type="button"
                disabled={isUploadingMedia}
                onClick={async () => {
                  setEditModalError('');
                  const it = editingItem.item || {};
                  if ((editingItem.type === 'member' || editingItem.type === 'division' || editingItem.type === 'department' || editingItem.type === 'role') && !(it.name || '').trim()) {
                    setEditModalError('Nama wajib diisi sebelum menyimpan perubahan');
                    showToast('Nama wajib diisi sebelum menyimpan perubahan', 'error');
                    return;
                  }
                  if ((editingItem.type === 'gallery' || editingItem.type === 'tenure' || editingItem.type === 'form' || editingItem.type === 'event' || editingItem.type === 'brand_asset') && !(it.title || '').trim()) {
                    setEditModalError('Judul wajib diisi sebelum menyimpan perubahan');
                    showToast('Judul wajib diisi sebelum menyimpan perubahan', 'error');
                    return;
                  }
                  if (editingItem.type === 'tenure' && !(it.code || '').trim()) {
                    setEditModalError('Kode tahun periode wajib diisi');
                    showToast('Kode tahun periode wajib diisi', 'error');
                    return;
                  }
                  if (editingItem.type === 'faq') {
                    if (!(it.category || '').trim()) {
                      setEditModalError('Kategori topik FAQ wajib dipilih');
                      showToast('Kategori topik FAQ wajib dipilih', 'error');
                      return;
                    }
                    if (!(it.question || '').trim() || !(it.answer || '').trim()) {
                      setEditModalError('Pertanyaan dan jawaban FAQ wajib diisi');
                      showToast('Pertanyaan dan jawaban FAQ wajib diisi', 'error');
                      return;
                    }
                  }
                  if (editingItem.type === 'form') {
                    if (!(it.category || '').trim()) {
                      setEditModalError('Kategori formulir wajib dipilih');
                      showToast('Kategori formulir wajib dipilih', 'error');
                      return;
                    }
                    if (!(it.deadline || '').trim()) {
                      setEditModalError('Batas Akhir / Deadline Pendaftaran wajib ditentukan');
                      showToast('Batas Akhir / Deadline Pendaftaran wajib ditentukan', 'error');
                      return;
                    }
                    if (it.isLimited && (!it.maxQuota || parseInt(it.maxQuota, 10) <= 0)) {
                      setEditModalError('Maksimal kuota responden harus lebih dari 0 jika kuota dibatasi');
                      showToast('Maksimal kuota responden harus lebih dari 0 jika kuota dibatasi', 'error');
                      return;
                    }
                    if (it.isEventConnected && !it.eventId) {
                      setEditModalError('Silakan pilih Acara / Event yang terhubung');
                      showToast('Silakan pilih Acara / Event yang terhubung', 'error');
                      return;
                    }

                    // Validasi Integritas Unik: Periksa apakah ada field isUnique yang memiliki data duplikat di riwayat pengisian responden
                    const formFields = it.fields || [];
                    const uniqueFields = formFields.filter((f: any) => f.isUnique);
                    if (uniqueFields.length > 0) {
                      const formSubs = submissions.filter((s: any) => s.formId === it.id);
                      for (const uf of uniqueFields) {
                        const valCounts: Record<string, any> = {};
                        formSubs.forEach((s: any) => {
                          const rawVal = s.data?.[uf.id] ?? s[uf.id] ?? s.answers?.[uf.id];
                          if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
                            const normVal = String(rawVal).trim().toLowerCase();
                            valCounts[normVal] = (valCounts[normVal] || 0) + 1;
                          }
                        });
                        const duplicates = Object.entries(valCounts).filter(([_, count]) => count > 1);
                        if (duplicates.length > 0) {
                          const dupDetails = duplicates.map(([val, count]) => `"${val}" (${count}x)`).join(', ');
                          const errMsg = `Field "${uf.label}" tidak dapat dijadikan Unik karena memiliki ${duplicates.length} data duplikat pada respon responden: ${dupDetails}. Hapus data duplikat di tab Responden terlebih dahulu.`;
                          setEditModalError(errMsg);
                          showToast(errMsg, 'error');
                          return;
                        }
                      }
                    }
                  }
                  if (editingItem.type === 'kudos' && (!(it.sender || '').trim() || !(it.recipient || '').trim() || !(it.message || '').trim())) {
                    setEditModalError('Pengirim, penerima, dan pesan apresiasi wajib diisi');
                    showToast('Pengirim, penerima, dan pesan apresiasi wajib diisi', 'error');
                    return;
                  }

                  if (editingItem.type === 'member' && onUpdateMember) {
                    const targetTenureId = editingItem.item.tenureId || activeTenure?.id || '';
                    const availableRoles = getTenureRoles(targetTenureId, roleQuotas, tenureRoles);
                    if (availableRoles.length === 0) {
                      setEditModalError('Role kepengurusan masih kosong pada periode ini. Silakan buat role baru terlebih dahulu di menu Kelola Role & Jabatan.');
                      showToast('Role kepengurusan masih kosong pada periode ini.', 'error');
                      return;
                    }
                    const selectedRole = availableRoles.find(r => r.id === editingItem.item.roleId) ||
                      availableRoles.find(r => r.name.toLowerCase() === (editingItem.item.role || '').toLowerCase()) ||
                      null;

                    if (!selectedRole) {
                      setEditModalError('Jabatan / Role wajib dipilih');
                      showToast('Jabatan / Role wajib dipilih', 'error');
                      return;
                    }

                    if (selectedRole?.requiresDivision && !editingItem.item.divisionId) {
                      setEditModalError(`Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`);
                      showToast(`Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`, 'error');
                      return;
                    }

                    // Validasi Ketat Kuota Kepengurusan saat edit
                    const quotaCheck = validateMemberQuota(
                      {
                        tenureId: targetTenureId,
                        roleId: selectedRole?.id,
                        role: selectedRole?.name || editingItem.item.role,
                        divisionId: selectedRole?.requiresDivision ? editingItem.item.divisionId : undefined,
                        excludeMemberId: editingItem.item.id
                      },
                      members,
                      divisions,
                      roleQuotas,
                      tenureRoles
                    );

                    if (!quotaCheck.isValid) {
                      setEditModalError(quotaCheck.error);
                      showToast(quotaCheck.error, 'error');
                      return;
                    }
                    let finalImage = (editingItem.item.image || '').trim();

                    // Validasi URL foto jika diinput dalam bentuk tautan web
                    if (finalImage && !editingItem.pendingPhoto && !finalImage.startsWith('blob:')) {
                      setIsUploadingMedia(true);
                      showToast('Memverifikasi tautan foto profil...');
                      const check = await verifyImageUrl(finalImage, { requireHttps: true, allowRelative: false });
                      if (!check.valid) {
                        setIsUploadingMedia(false);
                        setEditModalError(`Tautan foto tidak valid: ${check.error}`);
                        showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }

                    if (editingItem.pendingPhoto) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah foto "${editingItem.pendingPhoto.name}" ke Cloud Storage...`);
                      try {
                        const cloudUrl = await uploadMediaToCloud(editingItem.pendingPhoto, 'members');
                        if (cloudUrl) finalImage = cloudUrl;
                      } catch (err: any) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah foto: ' + (err.message || 'Error jaringan'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    const finalResp = editingItem.item.rawResponsibilities !== undefined
                      ? editingItem.item.rawResponsibilities.split('\n').map((s: any) => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.responsibilities) ? editingItem.item.responsibilities : []);
                    const { rawResponsibilities, ...cleanItem } = editingItem.item;
                    const finalCat = getCategoryFromLevel(selectedRole?.level ?? 5);
                    const divObj = selectedRole?.requiresDivision ? divisions.find((d: any) => d.id === cleanItem.divisionId) : null;
                    const finalRoleName = selectedRole?.requiresDivision && selectedRole?.name.toLowerCase() === 'pimpro' && divObj
                      ? `Pimpro ${divObj.name}`
                      : (selectedRole?.name || cleanItem.role || '');

                    onUpdateMember({
                      ...cleanItem,
                      roleId: selectedRole?.id,
                      role: finalRoleName,
                      title: divObj?.name || '',
                      category: finalCat,
                      divisionId: selectedRole?.requiresDivision ? cleanItem.divisionId : undefined,
                      image: finalImage,
                      responsibilities: finalResp
                    });
                  }
                  if (editingItem.type === 'division' && onUpdateDivision) {
                    const finalFocus = editingItem.item.rawFocusAreas !== undefined
                      ? editingItem.item.rawFocusAreas.split(',').map((s: any) => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas : []);
                    const { rawFocusAreas, ...cleanItem } = editingItem.item;
                    const selMem = members.find((m: any) => m.id === cleanItem.memberId);
                    const finalLeadName = selMem ? selMem.name : (cleanItem.leadName || '');
                    onUpdateDivision({ ...cleanItem, leadName: finalLeadName, focusAreas: finalFocus });
                  }
                  if (editingItem.type === 'gallery' && onUpdateGallery) {
                    if (!editingItem.item.divisionId && !editingItem.item.division) {
                      setEditModalError('Divisi penyelenggara wajib dipilih untuk galeri');
                      showToast('Divisi penyelenggara wajib dipilih untuk galeri', 'error');
                      return;
                    }
                    if (!(editingItem.item.description || '').trim()) {
                      setEditModalError('Deskripsi kegiatan wajib diisi untuk galeri');
                      showToast('Deskripsi kegiatan wajib diisi untuk galeri', 'error');
                      return;
                    }
                    let finalPhotos = Array.isArray(editingItem.item.photos) ? [...editingItem.item.photos] : [];
                    if (editingItem.pendingPhotos && editingItem.pendingPhotos.length > 0) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah ${editingItem.pendingPhotos.length} foto ke Cloud Storage...`);
                      try {
                        for (const pFile of editingItem.pendingPhotos) {
                          const cloudUrl = await uploadMediaToCloud(pFile, 'gallery');
                          if (cloudUrl) {
                            const blobIdx = finalPhotos.findIndex(u => typeof u === 'string' && u.startsWith('blob:'));
                            if (blobIdx !== -1) {
                              finalPhotos[blobIdx] = cloudUrl;
                            } else {
                              finalPhotos.push(cloudUrl);
                            }
                          }
                        }
                      } catch (err: any) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah foto galeri: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    finalPhotos = finalPhotos.filter(u => typeof u === 'string' && !u.startsWith('blob:'));

                    // Auto-include any pending photo links entered in the textarea
                    const pendingRawUrls = (editingItem.photoUrlInput || '').trim();
                    if (pendingRawUrls) {
                      const urls = pendingRawUrls.split(/[\n,]+/).map((s: any) => s.trim()).filter(Boolean);
                      for (const u of urls) {
                        const check = await verifyImageUrl(u);
                        if (!check.valid) {
                          setEditModalError(`Tautan foto "${u}" tidak valid: ${check.error}`);
                          showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
                          return;
                        }
                        if (!finalPhotos.includes(u)) {
                          finalPhotos.push(u);
                        }
                      }
                    }

                    if (finalPhotos.length === 0) {
                      setEditModalError('Dokumentasi kegiatan wajib memiliki minimal 1 foto!');
                      showToast('Dokumentasi kegiatan wajib memiliki minimal 1 foto!', 'error');
                      return;
                    }
                    const {
                      _dateMode,
                      _dateVal,
                      _startDate,
                      _endDate,
                      _month,
                      _year,
                      ...cleanGalItem
                    } = editingItem.item;
                    onUpdateGallery({ ...cleanGalItem, photos: finalPhotos });
                  }
                  if (editingItem.type === 'tenure' && onUpdateTenure) {
                    const finalMisi = editingItem.item.rawMisi !== undefined
                      ? editingItem.item.rawMisi.split('\n').map((s: any) => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.misi) ? editingItem.item.misi : []);
                    const { rawMisi, ...cleanItem } = editingItem.item;
                    onUpdateTenure({ ...cleanItem, misi: finalMisi });
                  }
                  if (editingItem.type === 'kudos' && onUpdateKudos) onUpdateKudos(editingItem.item);
                  if (editingItem.type === 'form') {
                    const fields = editingItem.item.fields || [];
                    if (onUpdateForm) {
                      const cleanFields = fields.map(({ rawOptions, ...rest }: any) => rest);
                      const cleanDeadline = editingItem.item.deadline ? toDatetimeLocalSecondsValue(editingItem.item.deadline) : '';
                      const isLimitedVal = editingItem.item.isLimited === true;
                      const maxQuotaVal = isLimitedVal ? (parseInt(editingItem.item.maxQuota, 10) || 0) : 0;
                      const isEventConnectedVal = editingItem.item.isEventConnected === true;
                      const eventIdVal = isEventConnectedVal ? (editingItem.item.eventId || '') : '';
                      const isLuckyDrawVal = isEventConnectedVal && editingItem.item.isLuckyDraw === true;
                      onUpdateForm({
                        ...editingItem.item,
                        deadline: cleanDeadline,
                        fields: cleanFields,
                        isLimited: isLimitedVal,
                        maxQuota: maxQuotaVal,
                        isEventConnected: isEventConnectedVal,
                        eventId: eventIdVal,
                        isLuckyDraw: isLuckyDrawVal
                      });
                    }
                  }
                  if (editingItem.type === 'event' && onUpdateEvent) {
                    const catVal = (editingItem.item.kategori || editingItem.item.category || editingItem.item.badge || '').trim();
                    if (!catVal) {
                      setEditModalError('Kategori program/kegiatan wajib dipilih');
                      showToast('Kategori program/kegiatan wajib dipilih', 'error');
                      return;
                    }
                    if (!editingItem.item.divisionId) {
                      setEditModalError('Divisi penyelenggara wajib dipilih untuk Event');
                      showToast('Divisi penyelenggara wajib dipilih untuk Event', 'error');
                      return;
                    }
                    if (!editingItem.item.startDate) {
                      setEditModalError('Tanggal & Jam Mulai event wajib diisi');
                      showToast('Tanggal & Jam Mulai event wajib diisi', 'error');
                      return;
                    }
                    if (!editingItem.item.endDate) {
                      setEditModalError('Tanggal & Jam Berakhir event wajib diisi');
                      showToast('Tanggal & Jam Berakhir event wajib diisi', 'error');
                      return;
                    }
                    if (toDatetimeLocalValue(editingItem.item.startDate) > toDatetimeLocalValue(editingItem.item.endDate)) {
                      setEditModalError('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir');
                      showToast('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir', 'error');
                      return;
                    }
                    if (!(editingItem.item.description || '').trim()) {
                      setEditModalError('Deskripsi kegiatan event wajib diisi');
                      showToast('Deskripsi kegiatan event wajib diisi', 'error');
                      return;
                    }
                    if (editingItem.item.isLimited) {
                      const mq = Number(editingItem.item.maxQuota || 0);
                      if (!mq || mq <= 0) {
                        setEditModalError('Batas maksimal kuota wajib diisi angka lebih dari 0');
                        showToast('Batas maksimal kuota wajib diisi angka lebih dari 0', 'error');
                        return;
                      }
                    }
                    if (editingItem.item.totalRab === '' || editingItem.item.totalRab === undefined || editingItem.item.totalRab === null || isNaN(Number(editingItem.item.totalRab)) || Number(editingItem.item.totalRab) < 0) {
                      setEditModalError('Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)');
                      showToast('Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)', 'error');
                      return;
                    }
                    const pesertaVal = (editingItem.item.peserta || editingItem.item.kpi || '').trim();
                    const calculatedDate = formatWibEventRange(editingItem.item.startDate, editingItem.item.endDate);
                    onUpdateEvent({
                      ...editingItem.item,
                      kategori: catVal,
                      category: catVal,
                      badge: catVal,
                      peserta: pesertaVal,
                      kpi: pesertaVal,
                      totalRab: Number(editingItem.item.totalRab),
                      isPublic: Boolean(editingItem.item.isPublic),
                      isLimited: Boolean(editingItem.item.isLimited),
                      maxQuota: editingItem.item.isLimited ? Number(editingItem.item.maxQuota || 0) : 0,
                      date: calculatedDate || (editingItem.item.date || '').trim() || ''
                    });
                  }
                  if (editingItem.type === 'brand_asset' && onUpdateBrandAsset) {
                    const assetCat = (editingItem.item.category || '').trim();
                    if (!assetCat) {
                      setEditModalError('Kategori katalog asset wajib dipilih');
                      showToast('Kategori katalog asset wajib dipilih', 'error');
                      return;
                    }
                    const assetFType = (editingItem.item.fileType || '').trim();
                    if (!assetFType) {
                      setEditModalError('Format file asset wajib diisi');
                      showToast('Format file asset wajib diisi', 'error');
                      return;
                    }
                    let finalFileUrl = editingItem.item.fileUrl || '';
                    let finalPreviewUrl = editingItem.item.previewUrl || '';
                    if (editingItem.pendingFile) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah file "${editingItem.pendingFile.name}" ke Cloud Storage...`);
                      try {
                        const cloudUrl = await uploadMediaToCloud(editingItem.pendingFile, 'assets');
                        if (cloudUrl) finalFileUrl = cloudUrl;
                      } catch (err: any) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah file asset: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    if (editingItem.pendingPreviewFile) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah preview "${editingItem.pendingPreviewFile.name}"...`);
                      try {
                        if (editingItem.pendingPreviewFile === editingItem.pendingFile) {
                          finalPreviewUrl = finalFileUrl;
                        } else {
                          const previewCloudUrl = await uploadMediaToCloud(editingItem.pendingPreviewFile, 'assets');
                          if (previewCloudUrl) finalPreviewUrl = previewCloudUrl;
                        }
                      } catch (err: any) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah gambar preview: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    const isValidUrl = (url: any) => /^https?:\/\/.+/i.test(url.trim()) || url.trim().startsWith('/');
                    if (finalFileUrl && !editingItem.pendingFile && !isValidUrl(finalFileUrl)) {
                      setEditModalError('URL file harus berupa tautan web yang valid (diawali http:// atau https://)');
                      showToast('URL file harus berupa tautan web yang valid', 'error');
                      return;
                    }
                    if (finalPreviewUrl && !editingItem.pendingPreviewFile && !isValidUrl(finalPreviewUrl)) {
                      setEditModalError('URL preview harus berupa tautan web yang valid (diawali http:// atau https://)');
                      showToast('URL preview harus berupa tautan web yang valid', 'error');
                      return;
                    }
                    const isImageFile = (url: any) => /\.(png|jpe?g|svg|webp|gif|avif)($|\?)/i.test(url) || (url || '').startsWith('data:image/');
                    const effectiveFileUrl = finalFileUrl || (isImageFile(finalPreviewUrl) ? finalPreviewUrl : '');
                    const effectivePreviewUrl = finalPreviewUrl || (isImageFile(finalFileUrl) ? finalFileUrl : '');
                    if (!effectiveFileUrl) {
                      setEditModalError('File asset wajib diunggah atau memiliki tautan file aktif');
                      showToast('File asset wajib diunggah', 'error');
                      return;
                    }
                    onUpdateBrandAsset({
                      ...editingItem.item,
                      fileUrl: effectiveFileUrl,
                      previewUrl: effectivePreviewUrl
                    });
                  }
                  if (editingItem.type === 'role' && onUpdateTenureRole) onUpdateTenureRole(editingItem.item);
                  if (editingItem.type === 'department' && onUpdateDepartment) onUpdateDepartment(editingItem.item);
                  if (editingItem.type === 'faq' && onUpdateFaq) onUpdateFaq(editingItem.item);
                  setEditingItem(null);
                  setEditModalError('');
                  showToast('Perubahan data berhasil disimpan & disinkronkan ke Cloud!');
                }}
                style={{
                  padding: '9px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: isUploadingMedia ? 'var(--input-bg)' : 'var(--mandiri-gold)',
                  border: 'none',
                  color: isUploadingMedia ? 'var(--text-muted)' : '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: isUploadingMedia ? 'not-allowed' : 'pointer',
                  boxShadow: isUploadingMedia ? 'none' : '0 4px 14px rgba(255, 184, 0, 0.35)'
                }}
              >
                {isUploadingMedia ? 'Mengunggah & Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
