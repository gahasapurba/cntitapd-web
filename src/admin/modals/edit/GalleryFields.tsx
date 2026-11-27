import React from 'react';
import { Link2, Plus, Trash2, Upload } from 'lucide-react';
import { buildFlexibleDate, formatWibDateTime, parseFlexibleDate } from '../../../utils/dateUtils';
import { soundFx } from '../../../utils/audio';
import { useAdminPortal } from '../../AdminPortalContext';

export default function GalleryFields({ activeTenure, divisions, editingItem, events, handleAddPhotoLinkToEditModal, handlePhotoUpload, isDark, isUploadingMedia, setDeleteConfirm, setEditingItem, showToast, tenures }: { activeTenure: any; divisions: any; editingItem: any; events: any; handleAddPhotoLinkToEditModal: any; handlePhotoUpload: any; isDark: any; isUploadingMedia: any; setDeleteConfirm: any; setEditingItem: any; showToast: any; tenures: any }) {

  return (
    <>
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
    </>
  );
}
