import React from 'react';
import { ChevronLeft, ChevronRight, Edit2, Image as ImageIcon, Link2, Plus, Search, Trash2 } from 'lucide-react';
import { buildFlexibleDate, formatLastUpdatedWib, formatWibDateTime } from '../../utils/dateUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function GalleryTab() {
  const {
    activeTab,
    activeTenure,
    addDocLinkField,
    adminGalleryPage,
    clearFieldError,
    divisions,
    events,
    formErrors,
    galDateMode,
    galDateVal,
    galDates,
    galDesc,
    galDivision,
    galDivisionId,
    galDocLinks,
    galEndDate,
    galEventId,
    galMonth,
    galPhotos,
    galStartDate,
    galTenureId,
    galTitle,
    galYear,
    galleries,
    galleryDivFilter,
    gallerySearchQuery,
    galleryTenureFilter,
    handleCreateGallery,
    handleDeleteGalleryClick,
    handlePhotoUpload,
    isDark,
    pendingGalFiles,
    removeDocLinkField,
    removeUploadedPhoto,
    renderFieldError,
    setAdminGalleryPage,
    setEditingItem,
    setFormErrors,
    setGalDateMode,
    setGalDateVal,
    setGalDates,
    setGalDesc,
    setGalDivision,
    setGalDivisionId,
    setGalEndDate,
    setGalEventId,
    setGalMonth,
    setGalPhotos,
    setGalStartDate,
    setGalTenureId,
    setGalTitle,
    setGalYear,
    setGalleryDivFilter,
    setGallerySearchQuery,
    setGalleryTenureFilter,
    tenures,
    updateDocLinkField,
    uploadedPhotos
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'gallery' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Tambah Dokumentasi Kegiatan Baru
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tambahkan judul, tanggal, deskripsi kegiatan, dan link foto (otomatis tampil dalam bentuk Carousel di halaman Galeri).
            </p>
          </div>

          <form onSubmit={handleCreateGallery} noValidate className="admin-form-two-col" style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Judul Kegiatan <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: IT APD Fun Run 5K Gelora Mandiri"
                value={galTitle}
                onChange={(e) => {
                  setGalTitle(e.target.value);
                  clearFieldError('galTitle');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${formErrors.galTitle ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('galTitle')}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      onClick={() => setGalDateMode(m.id)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '5px',
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: galDateMode === m.id ? 'var(--mandiri-gold)' : 'rgba(255, 255, 255, 0.05)',
                        color: galDateMode === m.id ? '#040914' : 'var(--text-muted)',
                        borderColor: galDateMode === m.id ? 'var(--mandiri-gold)' : 'var(--border-card)'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs based on galDateMode */}
              {galDateMode === 'date' && (
                <input
                  type="date"
                  value={galDateVal}
                  onChange={(e) => setGalDateVal(e.target.value)}
                  style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              )}

              {galDateMode === 'dates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '100%' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Pilih dua atau lebih tanggal pelaksanaan kegiatan (otomatis diurutkan secara kronologis):
                  </div>
                  {galDates.map((dVal: any, dIdx: any) => (
                    <div key={dIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '100%' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', minWidth: '65px', flexShrink: 0 }}>
                        Hari ke-{dIdx + 1}:
                      </span>
                      <input
                        type="date"
                        value={dVal}
                        onChange={(e) => {
                          const next = [...galDates];
                          next[dIdx] = e.target.value;
                          setGalDates(next);
                        }}
                        style={{ flex: 1, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                      />
                      {galDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setGalDates(galDates.filter((_: any, i: any) => i !== dIdx))}
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
                      onClick={() => setGalDates([...galDates, new Date().toISOString().split('T')[0]])}
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

              {galDateMode === 'range' && (
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Tanggal Mulai</span>
                    <input
                      type="date"
                      value={galStartDate}
                      onChange={(e) => setGalStartDate(e.target.value)}
                      style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Tanggal Selesai</span>
                    <input
                      type="date"
                      value={galEndDate}
                      onChange={(e) => setGalEndDate(e.target.value)}
                      style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              )}

              {galDateMode === 'month' && (
                <input
                  type="month"
                  value={galMonth}
                  onChange={(e) => setGalMonth(e.target.value)}
                  style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              )}

              {galDateMode === 'year' && (
                <input
                  type="number"
                  min="2000"
                  max="2099"
                  placeholder="Contoh: 2026"
                  value={galYear}
                  onChange={(e) => setGalYear(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              )}

              {/* Live Preview Pill (Kontras Jelas & Nyaman di Light & Dark Mode) */}
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
                  {formatWibDateTime(buildFlexibleDate(galDateMode, { date: galDateVal, dates: galDates, startDate: galStartDate, endDate: galEndDate, month: galMonth, year: galYear }))}
                </strong>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Periode Kepengurusan *
              </label>
              <select
                value={galTenureId || activeTenure?.id || ''}
                onChange={(e) => {
                  setGalTenureId(e.target.value);
                  setGalDivision('');
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

            {(() => {
              const availableDivsForGal = divisions.filter((d: any) => d.tenureId === (galTenureId || activeTenure?.id));
              const currentGalDivId = galDivisionId || availableDivsForGal.find((d: any) => d.name === galDivision)?.id || '';
              return (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Divisi Penyelenggara <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={currentGalDivId}
                    onChange={(e) => {
                      const divId = e.target.value;
                      setGalDivisionId(divId);
                      const found = availableDivsForGal.find((d: any) => d.id === divId);
                      setGalDivision(found ? found.name : '');
                      clearFieldError('galDivision');
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: `1.5px solid ${formErrors.galDivision ? '#f43f5e' : 'var(--border-card)'}`,
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {availableDivsForGal.length === 0 ? (
                      <option value="" disabled>-- Divisi masih kosong di periode ini. Silakan buat divisi baru pada tahun kepengurusan yang dipilih --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Divisi Penyelenggara (Wajib) --</option>
                        {availableDivsForGal.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {renderFieldError('galDivision')}
                  {availableDivsForGal.length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                      ⚠️ <strong>Divisi masih kosong</strong> pada periode kepengurusan ini. Silakan buat divisi baru terlebih dahulu di tab <strong>Divisi</strong>.
                    </div>
                  )}
                </div>
              );
            })()}

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                🔗 Hubungkan ke Program / Acara (Opsional)
              </label>
              <select
                value={galEventId}
                onChange={(e) => setGalEventId(e.target.value)}
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
                <option value="">-- Tidak Terhubung ke Acara Tertentu --</option>
                {(events || [])
                  .filter((ev: any) => !galTenureId || ev.tenureId === galTenureId)
                  .map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.date || 'Tanpa Tanggal'})
                    </option>
                  ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                Jika dipilih, album dokumentasi ini akan terhubung langsung ke halaman acara tersebut di Program Kerja.
              </span>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Deskripsi Singkat Acara <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ceritakan keseruan acara dan antusiasme insan IT APD..."
                value={galDesc}
                onChange={(e) => {
                  setGalDesc(e.target.value);
                  clearFieldError('galDesc');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${formErrors.galDesc ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('galDesc')}
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Foto Dokumentasi Kegiatan (Wajib salah satu: Unggah File ATAU Masukkan Link Foto) <span style={{ color: '#f43f5e' }}>*</span>
              </label>

              {/* File upload input */}
              <div style={{
                border: `2px dashed ${formErrors.galPhotos && pendingGalFiles.length === 0 ? '#f43f5e' : 'var(--border-card)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                textAlign: 'center',
                background: formErrors.galPhotos && pendingGalFiles.length === 0 ? 'rgba(244, 63, 94, 0.04)' : 'var(--input-bg)',
                marginBottom: '12px'
              }}>
                <input
                  type="file"
                  id="galFileInput"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="galFileInput" 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--mandiri-blue)',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ImageIcon size={15} />
                  <span>Pilih File Foto dari Komputer</span>
                </label>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                  Opsi A: Unggah file foto dari komputer (bisa pilih banyak sekaligus: JPG, PNG, WebP)
                </div>
              </div>

              {renderFieldError('galPhotos')}

              {/* Uploaded Photos Thumbnails Preview */}
              {uploadedPhotos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {uploadedPhotos.map((p: any, idx: any) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img 
                        src={p} 
                        alt="Preview" 
                        style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--mandiri-gold)' }} 
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedPhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#f43f5e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Opsi B: Masukkan Link Foto Web (wajib jika tidak mengunggah file foto dari komputer):
              </label>
              <textarea
                rows={2}
                placeholder="https://...link-foto-1.jpg&#10;https://...link-foto-2.png"
                value={galPhotos}
                onChange={(e) => {
                  setGalPhotos(e.target.value);
                  if (formErrors.galPhotos && e.target.value.trim()) {
                    setFormErrors((prev: any) => ({ ...prev, galPhotos: null }));
                  }
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1px solid ${formErrors.galPhotos && pendingGalFiles.length === 0 ? '#f43f5e' : 'var(--input-border)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                * Sistem akan otomatis memverifikasi tautan untuk memastikan URL mengarah ke file gambar yang aktif sebelum disimpan.
              </div>
            </div>

            {/* DYNAMIC DOCUMENTATION LINKS (Link & Link Text) */}
            <div style={{
              gridColumn: 'span 2',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 61, 121, 0.04)',
              border: '1px solid var(--border-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link2 size={16} color="var(--mandiri-blue)" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Link Dokumentasi Full (Google Drive / OneDrive / Teams)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addDocLinkField}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(0, 61, 121, 0.08)',
                    color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)',
                    border: isDark ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(0, 61, 121, 0.25)',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} />
                  <span>Tambah Link Lain</span>
                </button>
              </div>

              <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: 0 }}>
                Masukkan URL penyimpanan cloud beserta nama tombol (misal: "Download Foto HD GDrive" atau "Materi Presentasi & Notulensi").
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {galDocLinks.map((linkItem: any, lIdx: any) => (
                  <div key={lIdx} style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: '1 1 180px' }}>
                      <input
                        type="text"
                        placeholder="Nama Teks (misal: Dokumentasi GDrive)"
                        value={linkItem.text}
                        onChange={(e) => updateDocLinkField(lIdx, 'text', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                    <div style={{ flex: '1.4 1 220px' }}>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={linkItem.url}
                        onChange={(e) => updateDocLinkField(lIdx, 'url', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                    {galDocLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDocLinkField(lIdx)}
                        title="Hapus Link"
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid #f43f5e',
                          color: '#f43f5e',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
                <span>Publikasikan ke Galeri</span>
              </button>
            </div>
          </form>

          {/* Existing Galleries List */}
          <div>
            {(() => {
              const ADMIN_GALLERY_PER_PAGE = 8;
              const filteredAdminGalleries = galleries.filter((gal: any) => {
                const q = gallerySearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (gal.title || '').toLowerCase().includes(q) ||
                  (gal.description || '').toLowerCase().includes(q);
                const galTenure = gal.tenureId || divisions.find((d: any) => d.id === gal.divisionId || d.name === gal.division)?.tenureId;
                const matchesTenure = galleryTenureFilter === 'all' || galTenure === galleryTenureFilter;
                const matchesDiv = galleryDivFilter === 'all' || gal.divisionId === galleryDivFilter || gal.division === galleryDivFilter;
                return matchesSearch && matchesTenure && matchesDiv;
              });

              const totalAdminGalleryPages = Math.ceil(filteredAdminGalleries.length / ADMIN_GALLERY_PER_PAGE) || 1;
              const safeAdminGalleryPage = Math.min(Math.max(1, adminGalleryPage), totalAdminGalleryPages);
              const paginatedAdminGalleries = filteredAdminGalleries.slice(
                (safeAdminGalleryPage - 1) * ADMIN_GALLERY_PER_PAGE,
                safeAdminGalleryPage * ADMIN_GALLERY_PER_PAGE
              );

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      Arsip Galeri ({filteredAdminGalleries.length} dari {galleries.length}):
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 320px', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                          type="text"
                          placeholder="Cari dokumentasi..."
                          value={gallerySearchQuery}
                          onChange={(e) => {
                            setGallerySearchQuery(e.target.value);
                            setAdminGalleryPage(1);
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
                        value={galleryTenureFilter}
                        onChange={(e) => {
                          setGalleryTenureFilter(e.target.value);
                          setGalleryDivFilter('all');
                          setAdminGalleryPage(1);
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
                        <option value="all">Semua Periode ({galleries.length})</option>
                        {tenures.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            Periode {t.code || t.title}
                          </option>
                        ))}
                      </select>

                      <select
                        value={galleryDivFilter}
                        onChange={(e) => {
                          setGalleryDivFilter(e.target.value);
                          setAdminGalleryPage(1);
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
                        <option value="all">Semua Divisi</option>
                        {(galleryTenureFilter === 'all'
                          ? divisions
                          : divisions.filter((d: any) => d.tenureId === galleryTenureFilter)
                        ).map((d: any) => {
                          const tObj = tenures.find((t: any) => t.id === d.tenureId);
                          const yearLabel = tObj ? ` (${tObj.code || tObj.title})` : '';
                          return (
                            <option key={d.id} value={d.id}>{d.name}{yearLabel}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {filteredAdminGalleries.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                      Tidak ada arsip dokumentasi yang cocok dengan pencarian / filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {paginatedAdminGalleries.map((gal: any) => (
                    <div key={gal.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{gal.title}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {(() => {
                            const divObj = divisions.find((d: any) => d.id === gal.divisionId);
                            const displayDiv = divObj?.name || gal.divisionName || gal.division || 'Umum';
                            return `${formatWibDateTime(gal.date)} • ${displayDiv} • ${gal.photos?.length || 0} Foto`;
                          })()}
                        </div>
                        {gal.eventId && (() => {
                          const connectedEvt = (events || []).find((e: any) => String(e.id) === String(gal.eventId));
                          return (
                            <div style={{ fontSize: '0.74rem', color: 'var(--neon-cyan)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🔗 Acara: <strong>{connectedEvt?.title || gal.eventId}</strong></span>
                            </div>
                          );
                        })()}
                        {gal.updatedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {formatLastUpdatedWib(gal.updatedAt)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>Aktif di Web</span>

                        <button
                          type="button"
                          onClick={() => setEditingItem({ type: 'gallery', item: { ...gal } })}
                          title="Edit Galeri Kegiatan"
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
                          onClick={() => handleDeleteGalleryClick(gal)}
                          title="Hapus Galeri"
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
                  ))}

                  {totalAdminGalleryPages > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      marginTop: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Menampilkan <strong>{(safeAdminGalleryPage - 1) * ADMIN_GALLERY_PER_PAGE + 1} - {Math.min(safeAdminGalleryPage * ADMIN_GALLERY_PER_PAGE, filteredAdminGalleries.length)}</strong> dari <strong>{filteredAdminGalleries.length}</strong> galeri
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={safeAdminGalleryPage === 1}
                          onClick={() => setAdminGalleryPage((p: any) => Math.max(1, p - 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminGalleryPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminGalleryPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: safeAdminGalleryPage === 1 ? 0.45 : 1
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        {Array.from({ length: totalAdminGalleryPages }, (_, i) => i + 1).map((pg) => {
                          const isActive = pg === safeAdminGalleryPage;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setAdminGalleryPage(pg)}
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
                          disabled={safeAdminGalleryPage === totalAdminGalleryPages}
                          onClick={() => setAdminGalleryPage((p: any) => Math.min(totalAdminGalleryPages, p + 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminGalleryPage === totalAdminGalleryPages ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminGalleryPage === totalAdminGalleryPages ? 'not-allowed' : 'pointer',
                            opacity: safeAdminGalleryPage === totalAdminGalleryPages ? 0.45 : 1
                          }}
                        >
                          <span>Selanjutnya</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
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
