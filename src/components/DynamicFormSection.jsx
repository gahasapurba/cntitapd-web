import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  Send, 
  CheckCircle2, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  ChevronRight, 
  Layers, 
  Calendar,
  Sparkles,
  ArrowLeft,
  X,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DynamicFormSection({ 
  forms = [], 
  divisions = [], 
  events = [], 
  onSubmitSubmission, 
  theme 
}) {
  const isDark = theme === 'dark';

  // Active form selection
  const activeForms = forms.filter(f => f.isOpen !== false);
  const [selectedFormId, setSelectedFormId] = useState(activeForms[0]?.id || forms[0]?.id || null);

  // Current active form object
  const currentForm = forms.find(f => f.id === selectedFormId);

  // Submission form state: { [fieldId]: value }
  const [formData, setFormData] = useState({});
  const [fileData, setFileData] = useState({}); // { [fieldId]: { name, size, base64 } }
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle Input Changes
  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  // Handle File Upload with Base64 preview
  const handleFileUpload = (fieldId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [fieldId]: 'Ukuran file maksimal 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFileData(prev => ({
        ...prev,
        [fieldId]: {
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type,
          dataUrl: uploadEvent.target.result
        }
      }));
      setFormData(prev => ({ ...prev, [fieldId]: file.name }));
      if (errors[fieldId]) {
        setErrors(prev => ({ ...prev, [fieldId]: null }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Dynamic Validation
  const validate = () => {
    if (!currentForm) return false;
    const newErrors = {};

    (currentForm.fields || []).forEach(field => {
      const val = formData[field.id];
      if (field.required) {
        if (!val || (typeof val === 'string' && !val.trim())) {
          newErrors[field.id] = `${field.label} wajib diisi`;
        } else if (field.type === 'email' && !/\S+@\S+\.\S+/.test(val)) {
          newErrors[field.id] = 'Format email tidak valid';
        } else if (field.type === 'textarea' && val.trim().length < 10) {
          newErrors[field.id] = `${field.label} minimal 10 karakter`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getExactTimestamp = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submission = {
      id: 'sub-' + Date.now(),
      formId: currentForm.id,
      formTitle: currentForm.title,
      submittedAt: getExactTimestamp(),
      data: { ...formData },
      files: { ...fileData }
    };

    if (onSubmitSubmission) {
      onSubmitSubmission(submission);
    }

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.55 }
    });

    setIsSubmitted(true);
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--input-bg)',
    border: `1.5px solid ${hasError ? '#f43f5e' : 'var(--input-border)'}`,
    color: 'var(--text-main)',
    outline: 'none',
    fontSize: '0.88rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: hasError ? '0 0 8px rgba(244, 63, 94, 0.25)' : 'none'
  });

  // CASE 1: No active forms available
  if (activeForms.length === 0) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto 80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div className="glass-panel" style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255, 184, 0, 0.15)',
            color: 'var(--mandiri-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px'
          }}>
            <Clock size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Pendaftaran Sedang Ditutup
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Saat ini belum ada formulir pendaftaran, registrasi kegiatan, ataupun open recruitment yang sedang aktif. Pantau terus pengumuman resmi di <strong>Channel MS Teams Group IT APD</strong>!
          </p>
          <div style={{ marginTop: '8px', padding: '8px 16px', background: 'var(--input-bg)', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Status: Hub Pendaftaran Standby
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '80px' }}>
      
      {/* 1. Header Hub */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-gold">
            Hub Registrasi & Formulir
          </span>
          <span className="badge-cyan">
            {activeForms.length} Formulir Dibuka
          </span>
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', lineHeight: 1.2 }}>
          Pusat Pendaftaran & Inisiatif Budaya
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Pilih dan lengkapi formulir inisiatif, open recruitment, turnamen, atau kegiatan budaya kerja Group IT Application Delivery yang ingin Anda ikuti.
        </p>
      </div>

      {/* 2. Form Switcher / Catalog Cards (Jika ada lebih dari 1 form aktif) */}
      {activeForms.length > 1 && (
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pilih Formulir yang Ingin Diisi:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {activeForms.map((f) => {
              const isSelected = f.id === selectedFormId;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    setSelectedFormId(f.id);
                    setFormData({});
                    setFileData({});
                    setErrors({});
                    setIsSubmitted(false);
                  }}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                    background: isSelected ? (isDark ? 'rgba(255,184,0,0.08)' : '#fffbeb') : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 8px 24px rgba(255,184,0,0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                      {f.category || 'Formulir'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Deadline: {f.deadline}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                    {f.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, flex: 1 }}>
                    {f.subtitle || f.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-card)', fontSize: '0.78rem', fontWeight: 700, color: isSelected ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                    <span>{isSelected ? '✓ Sedang Dibuka' : 'Buka Formulir'}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. The Active Dynamic Form View */}
      {currentForm && (
        <section style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{
            padding: '40px',
            border: '1.5px solid var(--border-card)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-lg)'
          }}>
            {isSubmitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
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
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                  Formulir Berhasil Dikirim! 🎉
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                  Terima kasih! Isian formulir untuk <strong>"{currentForm.title}"</strong> telah tersimpan aman di database sistem CNT IT APD.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({});
                      setFileData({});
                    }}
                    style={{
                      padding: '10px 24px',
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
                    {currentForm.subtitle || currentForm.description}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', marginTop: '8px', fontWeight: 600 }}>
                    📅 Batas Akhir: {currentForm.deadline}
                  </div>
                </div>

                {/* Dynamic Form Generator */}
                <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {(currentForm.fields || []).map((field) => {
                    const hasError = !!errors[field.id];

                    // Options logic (database source or static)
                    let options = field.options || [];
                    if (field.source === 'divisions') {
                      options = divisions.map(d => d.name);
                    } else if (field.source === 'events') {
                      options = events.map(e => `${e.title} (${e.date})`);
                    }

                    return (
                      <div key={field.id}>
                        <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                          {field.label} {field.required && <span style={{ color: '#f43f5e' }}>*</span>}
                        </label>

                        {/* TEXT / EMAIL / NUMBER */}
                        {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                          <input
                            type={field.type}
                            placeholder={field.placeholder || ''}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            style={inputStyle(hasError)}
                          />
                        )}

                        {/* TEXTAREA */}
                        {field.type === 'textarea' && (
                          <textarea
                            rows={4}
                            placeholder={field.placeholder || ''}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            style={{ ...inputStyle(hasError), resize: 'vertical' }}
                          />
                        )}

                        {/* SELECT (DYNAMIC DB OPTIONS / MANUAL) */}
                        {field.type === 'select' && (
                          <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            style={inputStyle(hasError)}
                          >
                            <option value="">-- Pilih {field.label} --</option>
                            {options.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
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
                                  accept={field.accept || '*'}
                                  onChange={(e) => handleFileUpload(field.id, e)}
                                  style={{ display: 'none' }}
                                />
                                {fileData[field.id] ? (
                                  <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>
                                    ✓ {fileData[field.id].name} ({fileData[field.id].size})
                                  </span>
                                ) : (
                                  <span>Klik untuk memilih berkas ({field.accept || 'PDF, PNG, JPG, max 5MB'})</span>
                                )}
                              </label>
                              {fileData[field.id] && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFileData(prev => {
                                      const copy = { ...prev };
                                      delete copy[field.id];
                                      return copy;
                                    });
                                    setFormData(prev => {
                                      const copy = { ...prev };
                                      delete copy[field.id];
                                      return copy;
                                    });
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
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
                    <span>Kirim Formulir Pendaftaran</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
