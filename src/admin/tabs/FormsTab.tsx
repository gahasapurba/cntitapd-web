import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Edit2, MessageCircle, Plus, Search, Share2, Trash2 } from 'lucide-react';
import { formatDeadlineWib, formatLastUpdatedWib, formatToIndonesianDate, getDeadlineStatus, toDatetimeLocalSecondsValue } from '../../utils/dateUtils';
import { getPublicBaseUrl } from '../../utils/urlUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function FormsTab() {
  const {
    activeTab,
    activeTenure,
    clearFieldError,
    divisions,
    events,
    formCatFilter,
    formErrors,
    formPage,
    formSearchQuery,
    formStatusFilter,
    formTenureFilter,
    forms,
    handleDeleteFormClick,
    isDark,
    newFormCategory,
    newFormDeadline,
    newFormEventId,
    newFormIsEventConnected,
    newFormIsLimited,
    newFormIsLuckyDraw,
    newFormMaxQuota,
    newFormNotes,
    newFormRequiresTracking,
    newFormShowAnnouncement,
    newFormSubtitle,
    newFormTenureId,
    newFormTitle,
    onAddForm,
    onUpdateForm,
    renderFieldError,
    setEditingItem,
    setFormCatFilter,
    setFormErrors,
    setFormPage,
    setFormSearchQuery,
    setFormStatusFilter,
    setFormTenureFilter,
    setNewFormCategory,
    setNewFormDeadline,
    setNewFormEventId,
    setNewFormIsEventConnected,
    setNewFormIsLimited,
    setNewFormIsLuckyDraw,
    setNewFormMaxQuota,
    setNewFormNotes,
    setNewFormRequiresTracking,
    setNewFormShowAnnouncement,
    setNewFormSubtitle,
    setNewFormTenureId,
    setNewFormTitle,
    showToast,
    submissions,
    tenures
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'forms' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Manajemen Formulir & Pendaftaran Dinamis ({forms.length})
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Buat formulir registrasi baru, atur deadline, aktifkan/tutup form dari website, serta kelola pertanyaan.
              </p>
            </div>
            <span className="badge-gold" style={{ fontSize: '0.72rem' }}>
              Form Engine V2
            </span>
          </div>

          {/* Form Creator */}
          <form 
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const errs: Record<string, any> = {};
              if (!newFormTitle.trim()) errs.newFormTitle = 'Judul Formulir wajib diisi';
              if (!newFormCategory.trim()) errs.newFormCategory = 'Kategori Formulir wajib dipilih';
              if (!newFormDeadline.trim()) errs.newFormDeadline = 'Batas Akhir / Deadline Pendaftaran wajib ditentukan';
              if (newFormIsLimited && (!newFormMaxQuota || parseInt(newFormMaxQuota, 10) <= 0)) {
                errs.newFormMaxQuota = 'Maksimal kuota harus lebih dari 0 jika kuota dibatasi';
              }
              if (newFormIsEventConnected && !newFormEventId) {
                errs.newFormEventId = 'Silakan pilih event / acara yang terhubung';
              }
              if (Object.keys(errs).length > 0) {
                setFormErrors((prev: any) => ({ ...prev, ...errs }));
                showToast('Mohon lengkapi kolom wajib pada form Formulir', 'error');
                return;
              }

              const targetTenureId = newFormTenureId || activeTenure?.id || tenures[0]?.id || '';
              const newForm = {
                id: 'form-' + Date.now(),
                title: newFormTitle.trim(),
                subtitle: newFormSubtitle.trim() || '',
                notes: newFormNotes.trim() || '',
                category: newFormCategory.trim(),
                deadline: toDatetimeLocalSecondsValue(newFormDeadline.trim()) || '',
                isOpen: true,
                requiresTracking: newFormRequiresTracking,
                showAnnouncement: newFormShowAnnouncement,
                isLimited: newFormIsLimited,
                maxQuota: newFormIsLimited ? (parseInt(newFormMaxQuota, 10) || 0) : 0,
                tenureId: targetTenureId,
                isEventConnected: newFormIsEventConnected,
                eventId: newFormIsEventConnected ? newFormEventId : '',
                isLuckyDraw: newFormIsEventConnected && newFormIsLuckyDraw,
                fields: newFormRequiresTracking ? [
                  { id: 'f-name', label: 'Nama Lengkap (HCM Mandiri)', type: 'text', placeholder: 'Nama sesuai HCM Mandiri', required: true, isSearchIndex: false, isUnique: false },
                  { id: 'f-nip', label: 'NIP / Employee ID', type: 'text', placeholder: 'NIP Mandiri', required: true, isSearchIndex: true, isUnique: true },
                  { id: 'f-squad', label: 'Departemen', type: 'select', source: 'departments', required: true, isSearchIndex: false, isUnique: false },
                  { id: 'f-wa', label: 'Nomor WhatsApp Aktif', type: 'text', placeholder: '0812xxxxxxxx', required: true, isSearchIndex: false, isUnique: false },
                  { id: 'f-divisi', label: 'Pilihan Divisi Terkait', type: 'select', source: 'divisions', required: true, isSearchIndex: false, isUnique: false },
                  { id: 'f-notes', label: 'Catatan / Alasan Pendaftaran', type: 'textarea', placeholder: 'Tuliskan keterangan pendukung...', required: true, isSearchIndex: false, isUnique: false },
                  { id: 'f-doc', label: 'Upload Dokumen / File Pendukung', type: 'file', accept: '.pdf,.png,.jpg,.jpeg', required: false, isSearchIndex: false, isUnique: false }
                ] : [
                  { id: 'f-name', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama pengisi formulir', required: true, isSearchIndex: false, isUnique: false },
                  { id: 'f-unit', label: 'Departemen', type: 'select', source: 'departments', required: true, isSearchIndex: false, isUnique: false },
                  { id: 'f-feedback', label: 'Tanggapan / Isian', type: 'textarea', placeholder: 'Tuliskan respon Anda...', required: true, isSearchIndex: false, isUnique: false }
                ]
              };

              if (onAddForm) onAddForm(newForm);
              setNewFormTitle('');
              setNewFormSubtitle('');
              setNewFormNotes('');
              setNewFormDeadline('');
              setNewFormCategory('');
              setNewFormRequiresTracking(true);
              setNewFormShowAnnouncement(false);
              setNewFormIsLimited(false);
              setNewFormMaxQuota('');
              setNewFormIsEventConnected(false);
              setNewFormEventId('');
              setNewFormIsLuckyDraw(false);
              showToast(`Formulir "${newForm.title}" berhasil dibuat & dipublikasikan!`);
            }}
            className="admin-form-two-col"
            style={{
              gap: '12px',
              background: 'rgba(255,255,255,0.03)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)'
            }}
          >
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--mandiri-gold)', marginBottom: '4px' }}>
                + Buat Formulir Registrasi Baru
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Judul Formulir <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Pendaftaran Workshop AI Agent Mandiri"
                value={newFormTitle}
                onChange={(e) => {
                  setNewFormTitle(e.target.value);
                  clearFieldError('newFormTitle');
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.newFormTitle ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
              {renderFieldError('newFormTitle')}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                📅 Periode Kepengurusan (Tenure) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                value={newFormTenureId || activeTenure?.id || tenures[0]?.id || ''}
                onChange={(e) => {
                  const newT = e.target.value;
                  setNewFormTenureId(newT);
                  if (newFormEventId) {
                    const ev = (events || []).find((x: any) => x.id === newFormEventId);
                    const evTenure = ev?.tenureId || divisions.find((d: any) => d.id === ev?.divisionId)?.tenureId;
                    if (evTenure && evTenure !== newT) {
                      setNewFormEventId('');
                      showToast('Periode form diubah. Pilihan acara di-reset agar sesuai periode baru.', 'info');
                    }
                  }
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                {tenures.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.title || `Kepengurusan CNT ${t.code}`} {t.id === activeTenure?.id ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Kategori Formulir <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                value={newFormCategory}
                onChange={(e) => {
                  setNewFormCategory(e.target.value);
                  clearFieldError('newFormCategory');
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.newFormCategory ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                <option value="">-- Pilih Kategori Formulir (Wajib) --</option>
                <option value="Kegiatan & Event">Kegiatan & Event</option>
                <option value="Rekrutmen">Rekrutmen & Oprec</option>
                <option value="Turnamen & Olahraga">Turnamen & Olahraga</option>
                <option value="Survei & Aspirasi">Survei & Aspirasi</option>
                <option value="Workshop & Sharing">Workshop & Sharing</option>
              </select>
              {renderFieldError('newFormCategory')}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                📅 Batas Akhir / Deadline Pendaftaran (WIB) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '100%' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: '100%' }}>
                  <input
                    type="datetime-local"
                    step="1"
                    value={toDatetimeLocalSecondsValue(newFormDeadline)}
                    onChange={(e) => {
                      setNewFormDeadline(e.target.value);
                      setFormErrors((prev: any) => ({ ...prev, newFormDeadline: undefined }));
                    }}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      padding: '9px 12px 9px 36px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: formErrors.newFormDeadline ? '1.5px solid #f43f5e' : '1px solid var(--input-border)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
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
                {newFormDeadline && (
                  <button
                    type="button"
                    onClick={() => setNewFormDeadline('')}
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
              {formErrors.newFormDeadline ? (
                <div style={{ fontSize: '0.72rem', color: '#f43f5e', marginTop: '4px', fontWeight: 600 }}>
                  ⚠️ {formErrors.newFormDeadline}
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--mandiri-gold)', marginTop: '4px', fontWeight: 600 }}>
                  {newFormDeadline ? `Tampilan di Web: ${formatDeadlineWib(newFormDeadline)}` : 'Pilih tanggal & waktu deadline (wajib)'}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Deskripsi Singkat / Subtitle
              </label>
              <input
                type="text"
                placeholder="Penjelasan singkat tujuan pendaftaran"
                value={newFormSubtitle}
                onChange={(e) => setNewFormSubtitle(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                📝 Catatan / Pesan Pasca Pengisian Formulir (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Terima kasih sudah mendaftar! Harap bergabung ke WhatsApp Group koordinasi melalui tautan berikut: https://chat.whatsapp.com/xxx"
                value={newFormNotes}
                onChange={(e) => setNewFormNotes(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem', resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px', display: 'block' }}>
                💡 Catatan ini akan ditampilkan khusus kepada peserta setelah mereka berhasil mengirimkan formulir (misalnya link WhatsApp Group, arahan teknis, atau info langkah selanjutnya). Tautan URL otomatis dapat diklik dan disalin oleh peserta.
              </span>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: newFormRequiresTracking ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={newFormRequiresTracking}
                  onChange={(e) => setNewFormRequiresTracking(e.target.checked)}
                />
                <span>Memerlukan Responden untuk Tracking Progres (Status Seleksi / Pendaftaran)</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                {newFormRequiresTracking
                  ? 'Aktif: Responden akan diberikan ID Pendaftaran & dapat memantau status di website melalui Indeks Pencarian atau ID Pendaftaran.'
                  : 'Nonaktif: Formulir reguler (kuesioner, absensi, survei) tanpa pelacakan status. Himbauan tracking & card pencarian tidak akan dimunculkan.'}
              </span>
            </div>

            {/* Option: Show Announcement */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: newFormShowAnnouncement ? '#10b981' : 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={newFormShowAnnouncement}
                  onChange={(e) => setNewFormShowAnnouncement(e.target.checked)}
                />
                <span>🎉 Tampilkan Papan Pengumuman Peserta Terpilih (Hall of Welcome) di Halaman Web</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                {newFormShowAnnouncement
                  ? 'Aktif: Daftar peserta yang berstatus "Accepted / Diterima" akan dipublikasikan secara terbuka pada section Hall of Welcome di halaman formulir.'
                  : 'Nonaktif: Hasil seleksi tidak dipublikasikan ke publik di halaman formulir (hanya dapat dicek secara mandiri oleh responden jika tracking aktif).'}
              </span>
            </div>

            {/* Option: Batasi Kuota Responden */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: newFormIsLimited ? '#06b6d4' : 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={newFormIsLimited}
                  onChange={(e) => {
                    setNewFormIsLimited(e.target.checked);
                    if (!e.target.checked) {
                      setNewFormMaxQuota('');
                      clearFieldError('newFormMaxQuota');
                    }
                  }}
                />
                <span>🔒 Batasi Kuota Responden / Pengisian Formulir</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                {newFormIsLimited
                  ? 'Aktif: Formulir akan otomatis ditutup bila total data yang mengisi/submit telah mencapai batas kuota maksimal.'
                  : 'Nonaktif: Formulir terbuka tanpa batasan kuota responden (hanya dibatasi oleh deadline).'}
              </span>
              {newFormIsLimited && (
                <div style={{ marginLeft: '24px', marginTop: '2px', maxWidth: '280px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Maksimal Kuota Responden <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 100"
                    value={newFormMaxQuota}
                    onChange={(e) => {
                      setNewFormMaxQuota(e.target.value);
                      clearFieldError('newFormMaxQuota');
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.newFormMaxQuota ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                  {renderFieldError('newFormMaxQuota')}
                </div>
              )}
            </div>

            {/* Option: Hubungkan ke Event / Acara */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: newFormIsEventConnected ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={newFormIsEventConnected}
                  onChange={(e) => {
                    setNewFormIsEventConnected(e.target.checked);
                    if (!e.target.checked) {
                      setNewFormEventId('');
                      clearFieldError('newFormEventId');
                    }
                  }}
                />
                <span>🎪 Hubungkan Formulir ini ke Acara / Event</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                {newFormIsEventConnected
                  ? 'Aktif: Formulir ini akan menggantikan form RSVP standar pada modal event terkait, dan pendaftar formulir ini akan dianalisis di statistik & undian doorprize event.'
                  : 'Nonaktif: Formulir mandiri biasa yang tidak terikat secara khusus pada event kalender.'}
              </span>
              {newFormIsEventConnected && (
                <div style={{ marginLeft: '24px', marginTop: '2px', maxWidth: '420px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Pilih Acara / Event Terhubung <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={newFormEventId}
                    onChange={(e) => {
                      setNewFormEventId(e.target.value);
                      clearFieldError('newFormEventId');
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.newFormEventId ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Pilih Event yang Ada di Database --</option>
                    {(() => {
                      const targetTenure = newFormTenureId || activeTenure?.id;
                      const filteredEvents = (events || []).filter((evt: any) => {
                        const evtTenure = evt.tenureId || divisions.find((d: any) => d.id === evt.divisionId)?.tenureId;
                        return !targetTenure || !evtTenure || evtTenure === targetTenure;
                      });

                      if (filteredEvents.length === 0) {
                        return <option value="" disabled>-- Belum ada acara pada periode kepengurusan ini --</option>;
                      }

                      return filteredEvents.map((evt: any) => {
                        const existingConnectedForm = (forms || []).find((f: any) =>
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
                  {renderFieldError('newFormEventId')}

                  {(() => {
                    if (!newFormEventId) return null;
                    const conflictForm = (forms || []).find((f: any) =>
                      (f.isEventConnected || f.fields?.[0]?._isEventConnected) &&
                      String(f.eventId || f.fields?.[0]?._eventId) === String(newFormEventId)
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
                        Acara ini saat ini sedang terhubung ke formulir <strong>"{conflictForm.title}"</strong>. Menyimpan formulir baru ini akan <strong>mengalihkan koneksi acara secara otomatis</strong> ke formulir ini. Formulir <em>"{conflictForm.title}"</em> otomatis kembali menjadi formulir mandiri tanpa menghapus data pendaftar yang sudah masuk.
                      </div>
                    );
                  })()}

                  {/* Option: Butuh Pengundian Doorprize */}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-card)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem', color: newFormIsLuckyDraw ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                      <input
                        type="checkbox"
                        checked={newFormIsLuckyDraw}
                        onChange={(e) => setNewFormIsLuckyDraw(e.target.checked)}
                      />
                      <span>🎁 Butuh Pengundian Doorprize (Lucky Draw)</span>
                    </label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px', display: 'block', marginTop: '3px' }}>
                      {newFormIsLuckyDraw
                        ? 'Aktif: Tombol statistik di modal event akan memuat opsi Undian Doorprize, dan modul undian Lucky Draw akan ditampilkan pada halaman statistik acara.'
                        : 'Nonaktif: Hanya menampilkan statistik & analitik pendaftar. Modul dan tombol undian doorprize disembunyikan.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  padding: '9px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Publikasikan Form</span>
              </button>
            </div>
          </form>

          {/* Existing Forms List with Search, Filter & Pagination */}
          <div>
            {(() => {
              const ADMIN_FORMS_PER_PAGE = 6;
              const filteredForms = forms.filter((f: any) => {
                const q = formSearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (f.title || '').toLowerCase().includes(q) ||
                  (f.subtitle || '').toLowerCase().includes(q) ||
                  (f.category || '').toLowerCase().includes(q);
                const fTenure = f.tenureId || f.tenure_id || (f.fields?.[0]?._tenureId) || '';
                const matchesTenure = formTenureFilter === 'all' || fTenure === formTenureFilter;
                const matchesCat = formCatFilter === 'all' || f.category === formCatFilter;
                const matchesStat = formStatusFilter === 'all' ||
                  (formStatusFilter === 'open' && Boolean(f.isOpen)) ||
                  (formStatusFilter === 'closed' && !Boolean(f.isOpen));
                return matchesSearch && matchesTenure && matchesCat && matchesStat;
              });

              const totalAdminFormPages = Math.ceil(filteredForms.length / ADMIN_FORMS_PER_PAGE) || 1;
              const safeAdminFormPage = Math.min(Math.max(1, formPage), totalAdminFormPages);
              const paginatedForms = filteredForms.slice(
                (safeAdminFormPage - 1) * ADMIN_FORMS_PER_PAGE,
                safeAdminFormPage * ADMIN_FORMS_PER_PAGE
              );

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Daftar Formulir ({filteredForms.length} dari {forms.length}):
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                          type="text"
                          placeholder="Cari formulir..."
                          value={formSearchQuery}
                          onChange={(e) => {
                            setFormSearchQuery(e.target.value);
                            setFormPage(1);
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

                      <select
                        value={formTenureFilter}
                        onChange={(e) => {
                          setFormTenureFilter(e.target.value);
                          setFormPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600
                        }}
                      >
                        <option value="all">Semua Periode</option>
                        {tenures.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            Periode {t.code || t.title}{t.isActive ? ' (Aktif)' : ''}
                          </option>
                        ))}
                      </select>

                      <select
                        value={formCatFilter}
                        onChange={(e) => {
                          setFormCatFilter(e.target.value);
                          setFormPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600
                        }}
                      >
                        <option value="all">Semua Kategori</option>
                        <option value="Kegiatan & Event">Kegiatan & Event</option>
                        <option value="Rekrutmen">Rekrutmen & Oprec</option>
                        <option value="Turnamen & Olahraga">Turnamen & Olahraga</option>
                        <option value="Survei & Aspirasi">Survei & Aspirasi</option>
                        <option value="Workshop & Sharing">Workshop & Sharing</option>
                      </select>

                      <select
                        value={formStatusFilter}
                        onChange={(e) => {
                          setFormStatusFilter(e.target.value);
                          setFormPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600
                        }}
                      >
                        <option value="all">Semua Status</option>
                        <option value="open">● Dibuka di Web</option>
                        <option value="closed">○ Ditutup</option>
                      </select>
                    </div>
                  </div>

                  {filteredForms.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                      Tidak ada formulir yang cocok dengan pencarian / filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {paginatedForms.map((f: any) => {
                        const subCount = submissions.filter((s: any) => s.formId === f.id).length;
                        return (
                <div key={f.id} style={{
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>{f.category || 'Formulir'}</span>
                      {(() => {
                        const formTenure = tenures.find((t: any) => t.id === f.tenureId);
                        if (formTenure) {
                          return (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                              📅 {formTenure.code || formTenure.title}
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.96rem' }}>{f.title}</strong>
                      {f.requiresTracking !== false ? (
                        <span className="badge-gold" style={{ fontSize: '0.65rem' }}>🎯 Tracking Aktif</span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '2px 7px', borderRadius: '4px' }}>📋 Form Reguler</span>
                      )}
                      {(() => {
                        const uniqueCount = (f.fields || []).filter((fld: any) => fld.isUnique).length;
                        if (uniqueCount > 0) {
                          return (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                background: 'rgba(6, 182, 212, 0.14)',
                                color: 'var(--neon-cyan)',
                                border: '1px solid rgba(6, 182, 212, 0.4)',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontWeight: 700
                              }}
                              title={`Formulir ini memiliki ${uniqueCount} pertanyaan dengan validasi unik (anti-duplikat)`}
                            >
                              🛡️ {uniqueCount} Unik
                            </span>
                          );
                        }
                        return null;
                      })()}
                      {f.showAnnouncement ? (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                          🎉 Pengumuman Aktif
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', border: '1px solid var(--border-card)', padding: '2px 7px', borderRadius: '4px' }}>
                          🔒 Pengumuman Tertutup
                        </span>
                      )}
                      {f.isLimited && (
                        <span style={{
                          fontSize: '0.65rem',
                          background: subCount >= (f.maxQuota || 0)
                            ? (isDark ? 'rgba(244, 63, 94, 0.15)' : '#ffe4e6')
                            : (isDark ? 'rgba(6, 182, 212, 0.15)' : '#e0f2fe'),
                          color: subCount >= (f.maxQuota || 0)
                            ? (isDark ? '#f43f5e' : '#be123c')
                            : (isDark ? '#06b6d4' : '#0369a1'),
                          border: `1px solid ${subCount >= (f.maxQuota || 0)
                            ? (isDark ? 'rgba(244, 63, 94, 0.4)' : '#fca5a5')
                            : (isDark ? 'rgba(6, 182, 212, 0.4)' : '#7dd3fc')}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          {subCount >= (f.maxQuota || 0) ? `🔒 Kuota Penuh (${subCount}/${f.maxQuota})` : `👥 Kuota: ${subCount}/${f.maxQuota} Terisi`}
                        </span>
                      )}
                      {(() => {
                        const dl = getDeadlineStatus(f.deadline);
                        if (dl.isExpired) {
                          return <span className="badge-red" style={{ fontSize: '0.65rem' }}>Expired (Lewat Batas)</span>;
                        }
                        if (dl.isToday) {
                          return <span className="badge-gold" style={{ fontSize: '0.65rem' }}>⚠️ Hari Terakhir!</span>;
                        }
                        return null;
                      })()}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Deadline: {f.deadline ? formatDeadlineWib(f.deadline) : 'Tanpa batas waktu'} • {f.fields?.length || 0} Pertanyaan • <strong>{subCount} Data Pengisian</strong>
                    </div>
                    {f.updatedAt && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {formatLastUpdatedWib(f.updatedAt)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Copy Direct Link */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${getPublicBaseUrl()}/?form=${encodeURIComponent(f.id)}#form`;
                        navigator.clipboard?.writeText(url);
                        showToast(`Link langsung formulir "${f.title}" berhasil disalin!`);
                      }}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid var(--neon-cyan)',
                        color: 'var(--neon-cyan)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Salin link langsung ke formulir ini untuk dibagikan"
                    >
                      <Share2 size={12} />
                      <span>Salin Link</span>
                    </button>

                    {/* Share to WhatsApp */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${getPublicBaseUrl()}/?form=${encodeURIComponent(f.id)}#form`;
                        const dl = f.deadline ? formatDeadlineWib(f.deadline) : 'Tanpa batas waktu';
                        const text = `📋 *Formulir Registrasi CNT IT APD*\n*${f.title}*\n⏳ Batas Pengisian: ${dl}\n\nSilakan isi formulir melalui tautan resmi berikut:\n${url}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                      }}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(37, 211, 102, 0.12)',
                        border: '1px solid rgba(37, 211, 102, 0.4)',
                        color: '#25D366',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Bagikan formulir ini ke WhatsApp"
                    >
                      <MessageCircle size={12} />
                      <span>WhatsApp</span>
                    </button>

                    {/* Switch Buka/Tutup */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateForm) {
                          onUpdateForm({ ...f, isOpen: !f.isOpen });
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: f.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: f.isOpen ? '#10b981' : '#f43f5e'
                      }}
                    >
                      {f.isOpen ? '● Dibuka di Web' : '○ Ditutup'}
                    </button>

                    {/* Toggle Pengumuman Terpilih */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateForm) {
                          const nextShow = !f.showAnnouncement;
                          onUpdateForm({ ...f, showAnnouncement: nextShow });
                          showToast(nextShow ? `Papan pengumuman terpilih untuk "${f.title}" diaktifkan!` : `Papan pengumuman terpilih untuk "${f.title}" disembunyikan.`);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: f.showAnnouncement ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: f.showAnnouncement ? '#10b981' : 'var(--text-muted)'
                      }}
                      title="Klik untuk mengubah visibilitas papan pengumuman peserta terpilih di web"
                    >
                      {f.showAnnouncement ? '🎉 Pengumuman: Tampil' : '🔒 Pengumuman: Tertutup'}
                    </button>

                    {/* Edit Form */}
                    <button
                      type="button"
                      onClick={() => setEditingItem({ type: 'form', item: { ...f } })}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(255,184,0,0.12)',
                        border: '1px solid var(--mandiri-gold)',
                        color: 'var(--mandiri-gold)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Delete Form */}
                    <button
                      type="button"
                      onClick={() => handleDeleteFormClick(f)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(244,63,94,0.12)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalAdminFormPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Menampilkan <strong>{(safeAdminFormPage - 1) * ADMIN_FORMS_PER_PAGE + 1} - {Math.min(safeAdminFormPage * ADMIN_FORMS_PER_PAGE, filteredForms.length)}</strong> dari <strong>{filteredForms.length}</strong> formulir
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={safeAdminFormPage === 1}
                onClick={() => setFormPage((p: any) => Math.max(1, p - 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: safeAdminFormPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: safeAdminFormPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: safeAdminFormPage === 1 ? 0.45 : 1
                }}
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>
              {Array.from({ length: totalAdminFormPages }, (_, i) => i + 1).map((pg) => {
                const isActive = pg === safeAdminFormPage;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setFormPage(pg)}
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
                disabled={safeAdminFormPage === totalAdminFormPages}
                onClick={() => setFormPage((p: any) => Math.min(totalAdminFormPages, p + 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: safeAdminFormPage === totalAdminFormPages ? 'var(--text-dim)' : 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: safeAdminFormPage === totalAdminFormPages ? 'not-allowed' : 'pointer',
                  opacity: safeAdminFormPage === totalAdminFormPages ? 0.45 : 1
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
        </div>
      )}
    </>
  );
}
