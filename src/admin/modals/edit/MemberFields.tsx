import React from 'react';
import { LEVEL_OPTIONS, getCategoryFromLevel, getTenureRoles } from '../../../utils/memberQuotaUtils';
import { Upload } from 'lucide-react';
import { useAdminPortal } from '../../AdminPortalContext';

export default function MemberFields({ activeTenure, divisions, editModalError, editingItem, handleMemberPhotoUpload, roleQuotas, setEditModalError, setEditingItem, tenureRoles, tenures }: { activeTenure: any; divisions: any; editModalError: any; editingItem: any; handleMemberPhotoUpload: any; roleQuotas: any; setEditModalError: any; setEditingItem: any; tenureRoles: any; tenures: any }) {

  return (
    <>
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
    </>
  );
}
