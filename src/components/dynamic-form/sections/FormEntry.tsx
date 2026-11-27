import React from 'react';
import { AlertCircle, Check, CheckCircle2, Clock, Loader2, MessageCircle, QrCode, Search, Send, Share2, Upload, X } from 'lucide-react';
import { formatDeadlineWib, getDeadlineStatus } from '../../../utils/dateUtils';
import { getUnifiedFormQuota } from '../../../utils/quotaUtils';
import { DEFAULT_FILE_ACCEPT, TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '../dynamicFormShared';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormEntry() {
  const {
    copiedLink,
    copiedSubId,
    currentForm,
    departments,
    divisions,
    errors,
    events,
    fileData,
    formData,
    generatingPoster,
    handleCopyFormLink,
    handleCopySubId,
    handleDownloadQrPoster,
    handleFileUpload,
    handleInputBlur,
    handleInputChange,
    handleShareFormWa,
    handleSubmit,
    honeypotVal,
    inputStyle,
    isDark,
    isSubmitted,
    lastSubmittedId,
    registrationCounts,
    renderPostSubmissionNotes,
    setFileData,
    setFormData,
    setHoneypotVal,
    setIsSubmitted,
    setPendingFiles,
    setStatusQuery,
    uploadingFieldId
  } = useDynamicFormContext();

  return (
    <>
      {currentForm && (
        <section style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{
            padding: '40px',
            border: '1.5px solid var(--border-card)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-lg)'
          }}>
            {isSubmitted ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '2px solid #10b981',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto'
                }}>
                  <CheckCircle2 size={36} />
                </div>

                {currentForm?.requiresTracking !== false ? (
                  <>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                      Formulir Berhasil Dikirim! 🎉
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
                      Terima kasih! Isian formulir untuk <strong>"{currentForm.title}"</strong> telah tersimpan aman di database sistem CNT IT APD.
                    </p>

                    {/* ID Pendaftaran Card with One-Click Copy */}
                    <div style={{
                      maxWidth: '480px',
                      margin: '0 auto 16px auto',
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1.5px solid var(--neon-cyan)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ID Pendaftaran Anda:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: 'var(--neon-cyan)',
                          letterSpacing: '1px'
                        }}>
                          {lastSubmittedId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySubId(lastSubmittedId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            background: copiedSubId ? '#10b981' : 'var(--input-bg)',
                            border: `1px solid ${copiedSubId ? '#10b981' : 'var(--neon-cyan)'}`,
                            color: copiedSubId ? '#ffffff' : 'var(--neon-cyan)',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title="Salin ID Pendaftaran ke Clipboard"
                        >
                          {copiedSubId ? <Check size={13} /> : <Share2 size={13} />}
                          <span>{copiedSubId ? 'Tersalin ✓' : 'Salin ID'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Himbauan Penting Card */}
                    <div style={{
                      maxWidth: '540px',
                      margin: '0 auto 24px auto',
                      padding: '12px 18px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 184, 0, 0.1)',
                      border: '1.5px solid rgba(255, 184, 0, 0.45)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      textAlign: 'left'
                    }}>
                      <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '2px' }}>📌</span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--mandiri-gold)' }}>Himbauan Penting:</strong>
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                          Harap catat atau salin <strong>ID Pendaftaran</strong> di atas! ID ini digunakan untuk memantau progres seleksi, status verifikasi berkas, dan catatan panitia melalui fitur <strong>Cek Status Pendaftaran</strong> pada website ini.
                        </div>
                      </div>
                    </div>

                    {/* Post-Submission Notes Card (e.g. WhatsApp Group link) */}
                    {renderPostSubmissionNotes()}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({});
                          setFileData({});
                        }}
                        style={{
                          padding: '10px 22px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-card)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Kirim Formulir Lainnya
                      </button>
                      {lastSubmittedId && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusQuery(lastSubmittedId);
                            const trackerEl = document.getElementById('status-tracker-section');
                            if (trackerEl) {
                              trackerEl.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 24px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--mandiri-gold)',
                            color: '#040914',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(255,184,0,0.3)'
                          }}
                        >
                          <Search size={15} />
                          <span>Cek Status Pendaftaran Saya Sekarang</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                      Terima Kasih, Formulir Telah Terkirim! 🎉
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 16px auto', lineHeight: 1.6 }}>
                      Isian formulir untuk <strong>"{currentForm.title}"</strong> telah berhasil kami terima dan tersimpan dengan aman di sistem.
                    </p>
                    <div style={{
                      maxWidth: '460px',
                      margin: '0 auto 24px auto',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-card)',
                      fontSize: '0.8rem',
                      color: 'var(--text-dim)'
                    }}>
                      Formulir ini tidak memerlukan pelacakan status mandiri. Tim kami akan memproses tanggapan Anda sesuai ketentuan yang berlaku.
                    </div>

                    {/* Post-Submission Notes Card (e.g. WhatsApp Group link) */}
                    {renderPostSubmissionNotes()}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({});
                          setFileData({});
                        }}
                        style={{
                          padding: '10px 26px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--mandiri-gold)',
                          color: '#040914',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Kirim Formulir Lainnya
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <span className="badge-gold" style={{ marginBottom: '8px' }}>
                    {currentForm.category || 'Pendaftaran Resmi'}
                  </span>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 8px 0' }}>
                    {currentForm.title}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto' }}>
                    {currentForm.subtitle}
                  </p>
                  {(() => {
                    const dl = getDeadlineStatus(currentForm.deadline);
                    const formQuota = getUnifiedFormQuota(currentForm, events, registrationCounts);
                    const isCurrentQuotaFull = formQuota.isFull;

                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                            📅 Batas Akhir: {formatDeadlineWib(currentForm.deadline)}
                          </span>
                          {formQuota.isLimited && formQuota.maxQuota > 0 && (
                            <span style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '2px 9px',
                              borderRadius: 'var(--radius-full)',
                              background: isCurrentQuotaFull
                                ? (isDark ? 'rgba(244, 63, 94, 0.15)' : '#ffe4e6')
                                : (isDark ? 'rgba(6, 182, 212, 0.15)' : '#e0f2fe'),
                              color: isCurrentQuotaFull
                                ? (isDark ? '#f43f5e' : '#be123c')
                                : (isDark ? '#06b6d4' : '#0369a1'),
                              border: `1px solid ${isCurrentQuotaFull
                                ? (isDark ? 'rgba(244, 63, 94, 0.4)' : '#fca5a5')
                                : (isDark ? 'rgba(6, 182, 212, 0.4)' : '#7dd3fc')}`
                            }}>
                              👥 {formQuota.isConnected ? '🎪 Kuota Acara: ' : 'Kuota Pendaftaran: '}
                              {formQuota.count} / {formQuota.maxQuota} {isCurrentQuotaFull ? '(Kuota Penuh)' : `(Sisa ${formQuota.remaining})`}
                            </span>
                          )}
                          {dl.isToday && (
                            <span className="badge-gold" style={{ fontSize: '0.72rem' }}>
                              ⚠️ Hari Terakhir Pendaftaran!
                            </span>
                          )}
                          {dl.isExpired && (
                            <span className="badge-red" style={{ fontSize: '0.72rem' }}>
                              Ditutup (Batas Waktu Berakhir)
                            </span>
                          )}
                        </div>

                        {isCurrentQuotaFull && !dl.isExpired && (
                          <div style={{
                            margin: '16px auto 0 auto',
                            maxWidth: '620px',
                            padding: '12px 18px',
                            borderRadius: 'var(--radius-md)',
                            background: isDark ? 'rgba(244, 63, 94, 0.12)' : '#fff1f2',
                            border: isDark ? '1.5px solid rgba(244, 63, 94, 0.4)' : '1.5px solid #fecdd3',
                            color: isDark ? '#f43f5e' : '#be123c',
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center',
                            lineHeight: 1.5
                          }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>
                              {formQuota.isConnected
                                ? `Mohon maaf, kuota pendaftaran untuk kegiatan "${formQuota.connectedEvent?.title}" telah penuh (${formQuota.count}/${formQuota.maxQuota} peserta). Pendaftaran formulir resmi telah ditutup.`
                                : `Mohon maaf, kuota pendaftaran formulir ini telah penuh (${formQuota.count}/${formQuota.maxQuota} responden). Pendaftaran telah resmi ditutup.`
                              }
                            </span>
                          </div>
                        )}

                        {dl.isExpired && (
                          <div style={{
                            margin: '16px auto 0 auto',
                            maxWidth: '620px',
                            padding: '12px 18px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(244, 63, 94, 0.12)',
                            border: '1.5px solid rgba(244, 63, 94, 0.4)',
                            color: '#f43f5e',
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center',
                            lineHeight: 1.5
                          }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>Batas waktu pendaftaran untuk formulir ini telah berakhir pada {dl.formatted}. Formulir ini sudah tidak menerima pengiriman berkas baru.</span>
                          </div>
                        )}

                        {dl.isToday && (
                          <div style={{
                            margin: '16px auto 0 auto',
                            maxWidth: '620px',
                            padding: '12px 18px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(255, 184, 0, 0.14)',
                            border: '1.5px solid var(--mandiri-gold)',
                            color: 'var(--mandiri-gold)',
                            fontSize: '0.86rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center',
                            lineHeight: 1.5
                          }}>
                            <Clock size={18} style={{ flexShrink: 0 }} />
                            <span>Perhatian: Hari ini adalah hari terakhir pendaftaran ({dl.formatted}). Segera lengkapi dan kirim berkas sebelum pukul 23:59 WIB!</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyFormLink(currentForm)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: copiedLink ? 'rgba(16,185,129,0.15)' : 'var(--input-bg)',
                        border: copiedLink ? '1px solid #10b981' : '1px solid var(--border-card)',
                        color: copiedLink ? '#10b981' : 'var(--text-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedLink ? <Check size={13} /> : <Share2 size={13} />}
                      <span>{copiedLink ? 'Link Formulir Tersalin!' : 'Salin Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareFormWa(currentForm)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(37, 211, 102, 0.12)',
                        border: '1px solid rgba(37, 211, 102, 0.4)',
                        color: '#25D366',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <MessageCircle size={13} />
                      <span>Bagikan ke WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadQrPoster(currentForm)}
                      disabled={generatingPoster}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255, 184, 0, 0.12)',
                        border: '1px solid rgba(255, 184, 0, 0.4)',
                        color: 'var(--mandiri-gold)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: generatingPoster ? 'wait' : 'pointer'
                      }}
                      title="Unduh Poster QR Resolusi Tinggi (PNG) untuk Dibagikan atau Dicetak"
                    >
                      {generatingPoster ? <Loader2 size={13} className="spin" /> : <QrCode size={13} />}
                      <span>{generatingPoster ? 'Menyiapkan Poster...' : 'Unduh Poster QR (PNG)'}</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Form Generator */}
                <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Honeypot Anti-Bot Security Field (Hidden from humans) */}
                  <div style={{ position: 'absolute', opacity: 0, zIndex: -1, pointerEvents: 'none', height: 0, overflow: 'hidden' }} aria-hidden="true">
                    <input
                      type="text"
                      name="mandiri_corp_security_check"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypotVal}
                      onChange={(e) => setHoneypotVal(e.target.value)}
                    />
                  </div>
                  {(currentForm.fields || []).map((field: any) => {
                    const hasError = !!errors[field.id];

                    // Options logic (database source or static)
                    let options = field.options || [];
                    if (field.source === 'divisions') {
                      const formTenureId = currentForm?.tenureId || currentForm?.tenure_id;
                      const matchedDivisions = formTenureId
                        ? (divisions || []).filter((d: any) => d.tenureId === formTenureId)
                        : (divisions || []);
                      const finalDivs = matchedDivisions.length > 0 ? matchedDivisions : (divisions || []);
                      options = finalDivs.map((d: any) => d.name);
                    } else if (field.source === 'departments') {
                      options = (departments && departments.length > 0)
                        ? departments.map((d: any) => d.name)
                        : (field.options || []);
                    } else if (field.source === 'events') {
                      options = (events || []).filter((e: any) => e.isPublic === true).map((e: any) => `${e.title} (${e.date})`);
                    }

                    return (
                      <div key={field.id}>
                        <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                          {field.label} {field.required && <span style={{ color: '#f43f5e' }}>*</span>}
                          {field.isUnique && (
                            <span 
                              style={{ 
                                marginLeft: '8px', 
                                fontSize: '0.68rem', 
                                fontWeight: 700, 
                                color: 'var(--neon-cyan)',
                                background: 'rgba(6, 182, 212, 0.1)',
                                border: '1px solid rgba(6, 182, 212, 0.35)',
                                padding: '1px 7px',
                                borderRadius: 'var(--radius-full)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Field ini wajib unik (tidak boleh ada data duplikat antar responden)"
                            >
                              🛡️ Unik / 1x Pendaftaran
                            </span>
                          )}
                        </label>

                        {/* TEXT / EMAIL / NUMBER */}
                        {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                          <input
                            type={field.type}
                            placeholder={field.placeholder || ''}
                            maxLength={TEXT_MAX_LENGTH}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            onBlur={() => handleInputBlur(field)}
                            style={inputStyle(hasError)}
                          />
                        )}

                        {/* TEXTAREA */}
                        {field.type === 'textarea' && (
                          <textarea
                            rows={4}
                            placeholder={field.placeholder || ''}
                            maxLength={TEXTAREA_MAX_LENGTH}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            onBlur={() => handleInputBlur(field)}
                            style={{ ...inputStyle(hasError), resize: 'vertical' }}
                          />
                        )}

                        {/* SELECT (DYNAMIC DB OPTIONS / MANUAL) */}
                        {field.type === 'select' && (
                          <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            onBlur={() => handleInputBlur(field)}
                            style={inputStyle(hasError)}
                          >
                            <option value="">-- Pilih {field.label} --</option>
                            {options.map((opt: any, oIdx: any) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* MULTIPLE CHOICE / RADIO (PILIHAN GANDA - 1 JAWABAN) */}
                        {field.type === 'radio' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                            {options.map((opt: any, oIdx: any) => {
                              const isSelected = formData[field.id] === opt;
                              return (
                                <label
                                  key={oIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '11px 16px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: isSelected 
                                      ? (isDark ? 'rgba(255, 184, 0, 0.12)' : '#fffbeb') 
                                      : 'var(--input-bg)',
                                    border: `1.5px solid ${isSelected ? 'var(--mandiri-gold)' : (hasError ? '#f43f5e' : 'var(--input-border)')}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`field-${field.id}`}
                                    value={opt}
                                    checked={isSelected}
                                    onChange={() => handleInputChange(field.id, opt)}
                                    style={{
                                      accentColor: 'var(--mandiri-gold)',
                                      cursor: 'pointer',
                                      width: '17px',
                                      height: '17px',
                                      margin: 0,
                                      flexShrink: 0
                                    }}
                                  />
                                  <span style={{
                                    fontSize: '0.88rem',
                                    color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                                    fontWeight: isSelected ? 700 : 500
                                  }}>
                                    {opt}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* FILE UPLOAD WITH PREVIEW */}
                        {field.type === 'file' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--input-bg)',
                              border: `1.5px dashed ${hasError ? '#f43f5e' : 'var(--input-border)'}`,
                              cursor: 'pointer'
                            }}>
                              <Upload size={18} color="var(--mandiri-gold)" />
                              <label style={{ cursor: 'pointer', flex: 1, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <input
                                  type="file"
                                  accept={field.accept || DEFAULT_FILE_ACCEPT}
                                  onChange={(e) => handleFileUpload(field, e)}
                                  style={{ display: 'none' }}
                                />
                                {uploadingFieldId === field.id ? (
                                  <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>
                                    ⏳ Mengunggah berkas ke Cloud Storage...
                                  </span>
                                ) : fileData[field.id] ? (
                                  <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>
                                    ✓ {fileData[field.id].name} ({fileData[field.id].size}) &bull; Siap dikirim saat klik Kirim
                                  </span>
                                ) : (
                                  <span>Klik untuk memilih berkas ({field.accept || 'PDF, gambar, dokumen Office, ZIP'} • maks. 20 MB)</span>
                                )}
                              </label>
                              {fileData[field.id] && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingFiles((prev: any) => {
                                      const copy = { ...prev };
                                      delete copy[field.id];
                                      return copy;
                                    });
                                    setFileData((prev: any) => {
                                      const copy = { ...prev };
                                      delete copy[field.id];
                                      return copy;
                                    });
                                    setFormData((prev: any) => {
                                      const copy = { ...prev };
                                      delete copy[field.id];
                                      return copy;
                                    });
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                                  title="Batalkan / Hapus file pilihan"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Error Warning */}
                        {hasError && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                            <AlertCircle size={12} />
                            <span>{errors[field.id]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {getDeadlineStatus(currentForm.deadline).isExpired ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: 'var(--input-bg)',
                        color: 'var(--text-muted)',
                        padding: '14px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        border: '1px solid var(--border-card)',
                        marginTop: '12px',
                        cursor: 'not-allowed'
                      }}
                    >
                      <AlertCircle size={18} color="#f43f5e" />
                      <span>Pendaftaran Ditutup (Batas Waktu Berakhir)</span>
                    </div>
                  ) : (() => {
                    const formQuota = getUnifiedFormQuota(currentForm, events, registrationCounts);
                    const isQuotaFull = formQuota.isFull;
                    if (isQuotaFull) {
                      return (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            background: isDark ? 'var(--input-bg)' : '#f8fafc',
                            color: isDark ? 'var(--text-muted)' : '#64748b',
                            padding: '14px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            border: isDark ? '1.5px solid rgba(244, 63, 94, 0.4)' : '1.5px solid #fca5a5',
                            marginTop: '12px',
                            cursor: 'not-allowed'
                          }}
                        >
                          <AlertCircle size={18} color={isDark ? '#f43f5e' : '#be123c'} />
                          <span>Pendaftaran Ditutup ({formQuota.isConnected ? 'Kuota Acara Penuh' : 'Kuota Penuh'}: {formQuota.count}/{formQuota.maxQuota})</span>
                        </div>
                      );
                    }
                    return (
                      <button
                        type="submit"
                        className="pulse-glow"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          background: 'var(--mandiri-gold)',
                          color: '#0a1128',
                          padding: '15px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 800,
                          fontSize: '0.96rem',
                          border: 'none',
                          cursor: 'pointer',
                          marginTop: '12px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 15px rgba(255, 184, 0, 0.35)'
                        }}
                      >
                        <Send size={18} />
                        <span>Kirim Berkas Pendaftaran</span>
                      </button>
                    );
                  })()}
                </form>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
