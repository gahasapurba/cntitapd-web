import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  HelpCircle,
  Share2,
  Check,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { uploadMediaToCloud } from '../lib/supabase';
import { getDeadlineStatus } from '../utils/dateUtils';

export default function DynamicFormSection({ 
  forms = [], 
  divisions = [], 
  events = [], 
  submissions = [],
  onSubmitSubmission, 
  theme,
  initialFormId = null,
  onSelectFormUrl
}) {
  const isDark = theme === 'dark';

  // Active form selection
  const activeForms = forms.filter(f => f.isOpen !== false);
  const [selectedFormId, setSelectedFormId] = useState(() => {
    if (initialFormId && activeForms.some(f => f.id === initialFormId)) {
      return initialFormId;
    }
    return activeForms[0]?.id || null;
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState(null);

  useEffect(() => {
    if (initialFormId && activeForms.some(f => f.id === initialFormId)) {
      setSelectedFormId(initialFormId);
    } else if (activeForms.length > 0 && !activeForms.some(f => f.id === selectedFormId)) {
      setSelectedFormId(activeForms[0].id);
    }
  }, [initialFormId, forms]);

  // Current active form object
  const currentForm = activeForms.find(f => f.id === selectedFormId) || activeForms[0] || null;

  // Submission form state: { [fieldId]: value }
  const [formData, setFormData] = useState({});
  const [fileData, setFileData] = useState({}); // { [fieldId]: { name, size, type, dataUrl } }
  const [pendingFiles, setPendingFiles] = useState({}); // { [fieldId]: File }
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypotVal, setHoneypotVal] = useState('');

  // Self-Service Status Tracker state
  const [statusQuery, setStatusQuery] = useState('');

  const handleCopyFormLink = () => {
    if (!currentForm) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#oprec?form=${encodeURIComponent(currentForm.id)}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Input Changes
  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  // Handle File Selection - Deferred upload on Submit only (never prematurely on file pick)
  const handleFileUpload = (fieldId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [fieldId]: 'Ukuran file maksimal 25MB' }));
      return;
    }

    setPendingFiles(prev => ({ ...prev, [fieldId]: file }));
    setFileData(prev => ({
      ...prev,
      [fieldId]: {
        name: file.name,
        size: file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'file',
        dataUrl: '' // Will be populated when form is submitted
      }
    }));
    setFormData(prev => ({ ...prev, [fieldId]: file.name }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  // Dynamic Validation
  const validate = () => {
    if (!currentForm) return false;
    const newErrors = {};

    (currentForm.fields || []).forEach(field => {
      const val = formData[field.id];
      if (field.required) {
        if (!val || (typeof val === 'string' && !val.trim())) {
          newErrors[field.id] = (field.type === 'select' || field.type === 'radio') 
            ? `${field.label} wajib dipilih` 
            : `${field.label} wajib diisi`;
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
    // Anti-spam Bot Protection: silent rejection if honeypot is filled
    if (honeypotVal && honeypotVal.trim()) {
      return;
    }
    if (!validate()) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const uploadedFiles = { ...fileData };
    try {
      for (const [fieldId, file] of Object.entries(pendingFiles)) {
        if (file) {
          setUploadingFieldId(fieldId);
          const cloudUrl = await uploadMediaToCloud(file, 'submissions');
          if (cloudUrl) {
            uploadedFiles[fieldId] = {
              ...uploadedFiles[fieldId],
              dataUrl: cloudUrl
            };
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setUploadingFieldId(null);
      alert('Gagal mengunggah berkas lampiran ke Cloud Storage. Silakan periksa koneksi dan coba lagi: ' + (err.message || 'Error'));
      return;
    }
    setUploadingFieldId(null);

    const newSubId = 'sub-' + Date.now();
    const submission = {
      id: newSubId,
      formId: currentForm.id,
      formTitle: currentForm.title,
      submittedAt: getExactTimestamp(),
      status: 'Submitted',
      adminNotes: '',
      data: { ...formData },
      files: uploadedFiles
    };

    if (onSubmitSubmission) {
      onSubmitSubmission(submission);
    }

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.55 }
    });

    setLastSubmittedId(newSubId);
    setPendingFiles({});
    setIsConfirmOpen(false);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitting(false), 600);
  };

  // Dynamic Search Keys Text based on configured index fields in active/selected forms
  const dynamicIndexLabels = React.useMemo(() => {
    const keys = new Set();
    const targetForms = currentForm ? [currentForm] : (activeForms.length > 0 ? activeForms : forms);
    
    targetForms.forEach((f) => {
      (f.fields || []).forEach((fld) => {
        if (fld.isSearchIndex) {
          keys.add(fld.label || 'Kunci Pendaftaran');
        }
      });
    });

    if (keys.size === 0) {
      keys.add('NIP');
    }

    return Array.from(keys);
  }, [currentForm, activeForms, forms]);

  const dynamicSearchKeysString = dynamicIndexLabels.join(' / ');

  // Filtered submissions for Self-Service Status Tracker (strictly EXACT matching Index Keys & Registration ID only)
  const trimmedStatusQuery = statusQuery.trim().toLowerCase();
  const cleanStatusQuery = trimmedStatusQuery.replace(/\s+/g, '');
  const digitsStatusQuery = cleanStatusQuery.replace(/\D/g, '');

  const isExactFieldMatch = (rawVal) => {
    if (!rawVal) return false;
    const strVal = String(rawVal).trim().toLowerCase();
    // 1. Direct trimmed string exact match
    if (strVal === trimmedStatusQuery) return true;
    // 2. Whitespace-insensitive exact match (e.g. "2402 1234" vs "24021234")
    if (strVal.replace(/\s+/g, '') === cleanStatusQuery) return true;
    // 3. For numeric IDs like NIP / Phone numbers, match exact normalized digits (min 4 digits)
    if (digitsStatusQuery.length >= 4) {
      const digitsVal = strVal.replace(/\D/g, '');
      if (digitsVal === digitsStatusQuery) return true;
    }
    return false;
  };

  const matchedSubmissions = trimmedStatusQuery.length >= 3
    ? submissions.filter((sub) => {
        // 1. Exact match on unique Registration ID (sub.id)
        const subIdLower = (sub.id || '').trim().toLowerCase();
        if (subIdLower === trimmedStatusQuery || subIdLower.replace(/\s+/g, '') === cleanStatusQuery) {
          return true;
        }

        // 2. Identify the parent form schema for this submission
        const parentForm = forms.find((f) => f.id === sub.formId);
        const formFields = parentForm?.fields || [];

        // 3. Find field IDs designated as search index keys
        const indexFieldIds = formFields
          .filter((fld) => fld.isSearchIndex === true)
          .map((fld) => fld.id);

        if (indexFieldIds.length > 0) {
          // Strictly ONLY check designated index fields (e.g. NIP) using EXACT match
          return indexFieldIds.some((fid) => isExactFieldMatch(sub.data?.[fid]));
        }

        // 4. Safe Fallback: if form has no field explicitly flagged yet,
        // protect privacy by only matching fields labeled NIP/Employee ID
        const nipFields = formFields
          .filter((fld) => {
            const l = (fld.label || '').toLowerCase();
            return l.includes('nip') || l.includes('employee id') || l.includes('nomor induk');
          })
          .map((fld) => fld.id);

        if (nipFields.length > 0) {
          return nipFields.some((fid) => isExactFieldMatch(sub.data?.[fid]));
        }

        // Strict fallback if form has neither: match only phone or email, NEVER general name
        const contactFields = formFields
          .filter((fld) => {
            const l = (fld.label || '').toLowerCase();
            return l.includes('whatsapp') || l.includes('email') || l.includes('telepon');
          })
          .map((fld) => fld.id);

        return contactFields.some((fid) => isExactFieldMatch(sub.data?.[fid]));
      })
    : [];

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Accepted':
      case 'Diterima':
      case 'Diterima ✓':
        return { label: 'Diterima ✓', bg: 'rgba(16, 185, 129, 0.16)', border: '#10b981', color: '#10b981', icon: '🎉' };
      case 'Interview':
      case 'Wawancara':
        return { label: 'Wawancara', bg: 'rgba(168, 85, 247, 0.16)', border: '#a855f7', color: '#a855f7', icon: '🎙️' };
      case 'Reviewed':
      case 'Direview':
        return { label: 'Direview', bg: 'rgba(255, 184, 0, 0.16)', border: 'var(--mandiri-gold)', color: 'var(--mandiri-gold)', icon: '🔎' };
      case 'Rejected':
      case 'Ditolak':
        return { label: 'Ditolak', bg: 'rgba(244, 63, 94, 0.16)', border: '#f43f5e', color: '#f43f5e', icon: '✕' };
      default:
        return { label: 'Baru Masuk', bg: 'rgba(56, 189, 248, 0.16)', border: 'var(--neon-cyan)', color: 'var(--neon-cyan)', icon: '📥' };
    }
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

      {/* CASE 1: No active forms available (tetap tampilkan informasi standby + Cek Status Pendaftaran di bawahnya) */}
      {activeForms.length === 0 && (
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '44px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 184, 0, 0.15)',
              color: 'var(--mandiri-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <Clock size={32} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Pendaftaran Sedang Ditutup
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Saat ini belum ada formulir pendaftaran baru yang sedang dibuka. Bagi Anda yang sudah pernah mendaftar, silakan gunakan fitur <strong>Cek Status Pendaftaran & Seleksi Saya</strong> di bawah ini!
            </p>
            <div style={{ marginTop: '4px', padding: '8px 16px', background: 'var(--input-bg)', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Status: Hub Pendaftaran Standby • Pelacakan Seleksi Aktif
            </div>
          </div>
        </div>
      )}

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
                    if (onSelectFormUrl) onSelectFormUrl(f.id);
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                      {f.category || 'Formulir'}
                    </span>
                    {(() => {
                      const dl = getDeadlineStatus(f.deadline);
                      if (dl.isExpired) {
                        return (
                          <span className="badge-red" style={{ fontSize: '0.66rem' }}>
                            Ditutup ({dl.formatted})
                          </span>
                        );
                      }
                      if (dl.isToday) {
                        return (
                          <span className="badge-gold" style={{ fontSize: '0.66rem' }}>
                            ⚠️ Hari Terakhir!
                          </span>
                        );
                      }
                      return (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          Deadline: {f.deadline}
                        </span>
                      );
                    })()}
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                    {f.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, flex: 1 }}>
                    {f.subtitle}
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 14px auto', lineHeight: 1.6 }}>
                  Terima kasih! Isian formulir untuk <strong>"{currentForm.title}"</strong> telah tersimpan aman di database sistem CNT IT APD.
                </p>
                {lastSubmittedId && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.78rem',
                    color: 'var(--neon-cyan)',
                    fontWeight: 700,
                    marginBottom: '20px'
                  }}>
                    <span>ID Pendaftaran: {lastSubmittedId}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                  {lastSubmittedId && (
                    <button
                      type="button"
                      onClick={() => setStatusQuery(lastSubmittedId)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--input-bg)',
                        color: 'var(--neon-cyan)',
                        border: '1px solid var(--neon-cyan)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      🔍 Cek Status Pendaftaran Saya
                    </button>
                  )}
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
                    {currentForm.subtitle}
                  </p>
                  {(() => {
                    const dl = getDeadlineStatus(currentForm.deadline);
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                            📅 Batas Akhir: {currentForm.deadline}
                          </span>
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
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={handleCopyFormLink}
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
                      <span>{copiedLink ? 'Link Formulir Tersalin!' : 'Salin Link Langsung Formulir Ini'}</span>
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
                  {(currentForm.fields || []).map((field) => {
                    const hasError = !!errors[field.id];

                    // Options logic (database source or static)
                    let options = field.options || [];
                    if (field.source === 'divisions') {
                      options = (divisions || []).map(d => d.name);
                    } else if (field.source === 'events') {
                      options = (events || []).map(e => `${e.title} (${e.date})`);
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

                        {/* MULTIPLE CHOICE / RADIO (PILIHAN GANDA - 1 JAWABAN) */}
                        {field.type === 'radio' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                            {options.map((opt, oIdx) => {
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
                                  accept={field.accept || '*/*,.zip,.rar,.7z,.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx'}
                                  onChange={(e) => handleFileUpload(field.id, e)}
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
                                  <span>Klik untuk memilih berkas ({field.accept || 'ZIP, PDF, PNG, JPG, Dokumen max 25MB'})</span>
                                )}
                              </label>
                              {fileData[field.id] && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingFiles(prev => {
                                      const copy = { ...prev };
                                      delete copy[field.id];
                                      return copy;
                                    });
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
                  ) : (
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
                  )}
                </form>
              </>
            )}
          </div>
        </section>
      )}

      {/* CONFIRMATION PREVIEW MODAL SEBELUM SUBMIT */}
      {isConfirmOpen && currentForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            border: '1.5px solid var(--mandiri-gold)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 184, 0, 0.15)',
                  color: 'var(--mandiri-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Konfirmasi Isian Formulir
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Pastikan seluruh data yang Anda masukkan sudah benar sebelum dikirim
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Info Box */}
            <div style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '0.85rem'
            }}>
              <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Formulir Target:</span>
                <div style={{ fontWeight: 800, color: 'var(--mandiri-gold)', fontSize: '0.95rem' }}>
                  {currentForm.title}
                </div>
              </div>

              {/* Dynamic Preview of All Filled Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(currentForm.fields || []).map((field) => {
                  const val = formData[field.id];
                  const file = fileData[field.id];
                  if (!val && !file) return null;

                  return (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {field.label}:
                      </span>
                      {field.type === 'file' && file ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                          <Upload size={14} />
                          <span>{file.name} ({file.size})</span>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-main)', fontWeight: 600, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                          {String(val)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note & Advisory */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}>
              💡 <em>Catatan:</em> Data pendaftaran Anda akan langsung diteruskan ke panitia penyelenggara dan tersimpan di database resmi Group IT APD.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
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
                Cek Ulang
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                style={{
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: isSubmitting ? 'var(--input-bg)' : 'var(--mandiri-gold)',
                  border: 'none',
                  color: isSubmitting ? 'var(--text-muted)' : '#040914',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(255, 184, 0, 0.3)'
                }}
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Mengirim...' : 'Ya, Kirim Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SELF-SERVICE STATUS TRACKER ("CEK STATUS PENDAFTARAN SAYA") */}
      <section style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '32px',
          border: '1.5px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="badge-cyan" style={{ fontSize: '0.68rem', marginBottom: '6px' }}>
                Transparansi Seleksi & Registrasi
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
                🔍 Cek Status Pendaftaran & Seleksi Saya
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Sudah pernah mengisi formulir? Ketik <strong>{dynamicSearchKeysString} lengkap atau ID Pendaftaran (sub-...)</strong> Anda untuk melihat progres seleksi & catatan panitia.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '0.74rem',
                lineHeight: 1.45,
                color: 'var(--neon-cyan)',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}>🔒</span>
                <span><strong>Privasi Terjamin:</strong> Sistem menggunakan pencarian eksak (Exact Match) pada Kunci Indeks Resmi ({dynamicSearchKeysString}) & ID Unik pendaftaran. Pencarian parsial atau Nama Umum sengaja diblokir demi melindungi privasi seluruh pelamar.</span>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={17} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={`Ketik ${dynamicSearchKeysString} lengkap Anda atau ID Pendaftaran (sub-...)`}
              value={statusQuery}
              onChange={(e) => setStatusQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 38px 12px 42px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--input-bg)',
                border: '1.5px solid var(--input-border)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {statusQuery && (
              <button
                type="button"
                onClick={() => setStatusQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {statusQuery.trim().length > 0 && statusQuery.trim().length < 3 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: '6px' }}>
              Ketik minimal 3 karakter {dynamicSearchKeysString} atau ID Pendaftaran Anda...
            </div>
          )}

          {trimmedStatusQuery.length >= 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matchedSubmissions.length === 0 ? (
                <div style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--input-bg)',
                  border: '1px dashed var(--border-card)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  Tidak ditemukan data pendaftaran dengan kunci <strong>"{statusQuery}"</strong>. Sistem menggunakan pencarian eksak (Exact Match), pastikan Anda memasukkan {dynamicSearchKeysString} lengkap atau ID Pendaftaran (sub-...) yang persis sesuai saat mendaftar.
                </div>
              ) : (
                matchedSubmissions.map((sub) => {
                  const statusText = sub.status || 'Baru Masuk';
                  const badge = getStatusBadgeStyle(statusText);
                  const dataEntries = Object.entries(sub.data || {});
                  const primaryIdentity = dataEntries.slice(0, 3).map(([, v]) => String(v)).filter(Boolean).join(' • ');

                  return (
                    <div
                      key={sub.id}
                      style={{
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--input-bg)',
                        border: `1.5px solid ${badge.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                            ID: {sub.id} • {sub.submittedAt}
                          </span>
                          <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                            {sub.formTitle}
                          </h4>
                        </div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontSize: '0.78rem',
                          fontWeight: 800
                        }}>
                          <span>{badge.icon}</span>
                          <span>Status: {badge.label}</span>
                        </span>
                      </div>

                      {primaryIdentity && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <strong>Pendaftar:</strong> {primaryIdentity}
                        </div>
                      )}

                      {sub.adminNotes ? (
                        <div style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: isDark ? 'rgba(56, 189, 248, 0.08)' : '#f0f9ff',
                          borderLeft: '3px solid var(--neon-cyan)',
                          fontSize: '0.82rem',
                          color: 'var(--text-main)',
                          lineHeight: 1.5
                        }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: '2px' }}>
                            💬 Catatan / Informasi dari Panitia CNT IT APD:
                          </div>
                          <div>{sub.adminNotes}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Belum ada catatan tambahan dari panitia. Pantau secara berkala untuk pembaruan jadwal wawancara atau pengumuman seleksi.
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5. PENGUMUMAN PESERTA / CREW TERPILIH (HALL OF WELCOME & ONBOARDING BOARD) */}
      {(() => {
        const acceptedList = (submissions || []).filter(
          (s) => s.status === 'Accepted' || s.status === 'Diterima'
        );
        if (acceptedList.length === 0) return null;

        return (
          <section style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
            <div
              className="glass-panel"
              style={{
                padding: '32px',
                border: '1.5px solid rgba(16, 185, 129, 0.45)',
                background: isDark
                  ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.08), rgba(15, 29, 53, 0.9))'
                  : 'linear-gradient(145deg, #ecfdf5, #ffffff)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.16)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      color: '#10b981',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      marginBottom: '6px'
                    }}
                  >
                    🎉 Hall of Welcome • Pengumuman Resmi
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
                    Selamat Datang Peserta & Crew Terpilih ({acceptedList.length})
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                    Daftar rekan-rekan Insan IT APD yang telah resmi dinyatakan <strong>Lolos Seleksi / Terdaftar</strong> pada program dan rekrutmen CNT IT APD.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px'
                }}
              >
                {acceptedList.map((sub) => {
                  const entries = Object.entries(sub.data || {});
                  const nameEntry = entries.find(([k]) => /nama|name|squad|tim/i.test(k));
                  const unitEntry = entries.find(([k]) => /unit|department|dept|divisi|pilihan|cabor/i.test(k) && k !== nameEntry?.[0]);
                  const participantName = nameEntry ? String(nameEntry[1]) : (entries[0] ? String(entries[0][1]) : 'Peserta Terpilih');
                  const participantDetail = unitEntry ? String(unitEntry[1]) : (entries[1] ? String(entries[1][1]) : '');

                  return (
                    <div
                      key={sub.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderLeft: '4px solid #10b981',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                        boxShadow: 'var(--shadow-card)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: 'rgba(16, 185, 129, 0.14)',
                              color: '#10b981'
                            }}
                          >
                            ✓ Diterima
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {sub.submittedAt}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2px' }}>
                          {participantName}
                        </div>

                        {participantDetail && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--mandiri-gold)', fontWeight: 700, marginBottom: '4px' }}>
                            {participantDetail}
                          </div>
                        )}

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          📋 {sub.formTitle}
                        </div>
                      </div>

                      {sub.adminNotes && (
                        <div
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
                            border: '1px dashed rgba(16, 185, 129, 0.35)',
                            fontSize: '0.75rem',
                            color: 'var(--text-main)',
                            lineHeight: 1.45
                          }}
                        >
                          <strong style={{ color: '#10b981', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>
                            📌 Info Onboarding:
                          </strong>
                          {sub.adminNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

    </div>
  );
}
