import React from 'react';
import { formatWibEventRange, toDatetimeLocalValue } from '../../../utils/dateUtils';
import { useAdminPortal } from '../../AdminPortalContext';

export default function EventFields({ activeTenure, divisions, editingItem, setEditModalError, setEditingItem, tenures }: { activeTenure: any; divisions: any; editingItem: any; setEditModalError: any; setEditingItem: any; tenures: any }) {

  return (
    <>
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
    </>
  );
}
