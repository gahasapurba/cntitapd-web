import React from 'react';
import { ArrowDown, ArrowUp, Building2, Calendar, GripVertical, Layers, Plus, Trash2 } from 'lucide-react';
import { formatDeadlineWib, formatToIndonesianDate, toDatetimeLocalSecondsValue } from '../../../utils/dateUtils';
import { useAdminPortal } from '../../AdminPortalContext';

export default function FormFields({ activeTenure, departments, divisions, dragOverFieldIndex, draggedFieldIndex, editingItem, events, forms, handleMoveField, setDragOverFieldIndex, setDraggedFieldIndex, setEditingItem, showToast, submissions, tenures }: { activeTenure: any; departments: any; divisions: any; dragOverFieldIndex: any; draggedFieldIndex: any; editingItem: any; events: any; forms: any; handleMoveField: any; setDragOverFieldIndex: any; setDraggedFieldIndex: any; setEditingItem: any; showToast: any; submissions: any; tenures: any }) {

  return (
    <>
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
    </>
  );
}
