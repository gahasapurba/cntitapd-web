// Logic of DynamicFormSection, moved verbatim from the component. Returns every value the view uses.
import React, { useState, useEffect, useMemo } from 'react';
import { TEXT_MAX_LENGTH, TEXTAREA_MAX_LENGTH, MAX_FILE_BYTES, DEFAULT_FILE_ACCEPT, isFileAccepted } from './dynamicFormShared';
import { useAppNavigate } from '../../lib/appNavigation';
import { ExternalLink, Share2, Check, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { uploadMediaToCloud, isSubmissionValueTaken, trackSubmissions, fetchAcceptedSubmissions } from '../../lib/supabase';
import { getDeadlineStatus } from '../../utils/dateUtils';
import { generateFormQrPoster } from '../../utils/qrPosterGenerator';
import { getPublicBaseUrl } from '../../utils/urlUtils';
import { getUnifiedFormQuota } from '../../utils/quotaUtils';

export function useDynamicForm({ 
  forms = [], 
  divisions = [], 
  departments = [],
  events = [], 
  registrationCounts,
  onSubmitSubmission, 
  theme,
  initialFormId = null,
  onSelectFormUrl,
  activeTenure = null,
  tenures = []
}) {
  const navigateTo = useAppNavigate();
  const isDark = theme === 'dark';

  const [tenureFilter, setTenureFilter] = useState('active'); // 'active' | 'all'

  // Active form selection scoped to activeTenure
  const activeForms = forms.filter(f => {
    if (f.isOpen === false) return false;
    if (tenureFilter === 'active' && activeTenure?.id) {
      const fTenure = f.tenureId || f.tenure_id || (f.fields?.[0]?._tenureId) || '';
      return !fTenure || fTenure === activeTenure.id;
    }
    return true;
  });
  const trackingActiveForms = activeForms.filter(f => f.requiresTracking !== false);

  const requestedForm = useMemo(() => {
    if (!initialFormId) return null;
    return (forms || []).find(f => f.id === initialFormId) || null;
  }, [initialFormId, forms]);

  const isInitialFormMissing = Boolean(initialFormId) && (forms || []).length > 0 && !requestedForm;
  const isInitialFormDisabled = Boolean(requestedForm) && (requestedForm.isOpen === false || Boolean(requestedForm.isClosed));

  const [selectedFormId, setSelectedFormId] = useState(() => {
    if (initialFormId && activeForms.some(f => f.id === initialFormId)) {
      return initialFormId;
    }
    return activeForms[0]?.id || null;
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSubId, setCopiedSubId] = useState(false);
  const [copiedWagLink, setCopiedWagLink] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [posterPreview, setPosterPreview] = useState(null);

  useEffect(() => {
    if (initialFormId) {
      const targetForm = forms.find(f => f.id === initialFormId);
      if (targetForm && targetForm.isOpen !== false && !targetForm.isClosed) {
        if (activeTenure?.id && targetForm.tenureId && targetForm.tenureId !== activeTenure.id) {
          setTenureFilter('all');
        }
        setSelectedFormId(initialFormId);
        return;
      }
    }
    if (activeForms.length > 0 && !activeForms.some(f => f.id === selectedFormId)) {
      setSelectedFormId(activeForms[0].id);
    }
  }, [initialFormId, forms, activeTenure]);

  // Current active form object
  const currentForm = activeForms.find(f => f.id === selectedFormId) || activeForms[0] || null;

  // Submission form state: { [fieldId]: value }
  const [formData, setFormData] = useState({});
  const [fileData, setFileData] = useState({}); // { [fieldId]: { name, size, type, dataUrl } }
  const [pendingFiles, setPendingFiles] = useState({}); // { [fieldId]: File }
  const [errors, setErrors] = useState({});
  // Unique fields whose current value is already registered: { [fieldId]: normalizedValue }
  const [uniqueConflicts, setUniqueConflicts] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('submitted') === 'true';
    }
    return false;
  });
  const [lastSubmittedId, setLastSubmittedId] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('submitted') === 'true') {
        return sp.get('subId') || 'REG-OPREC-88204';
      }
    }
    return '';
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypotVal, setHoneypotVal] = useState('');
  const [acceptedPage, setAcceptedPage] = useState(1);

  // Self-Service Status Tracker state
  const [statusQuery, setStatusQuery] = useState('');

  const getFormDirectUrl = (fId) => {
    return `${getPublicBaseUrl()}/?form=${encodeURIComponent(fId)}#form`;
  };

  const handleCopyFormLink = (targetForm = currentForm) => {
    if (!targetForm) return;
    const shareUrl = getFormDirectUrl(targetForm.id);
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareFormWa = (targetForm = currentForm) => {
    if (!targetForm) return;
    const shareUrl = getFormDirectUrl(targetForm.id);
    const dl = getDeadlineStatus(targetForm.deadline);
    const deadlineText = dl.isExpired ? 'Pendaftaran Ditutup' : (dl.formatted || 'Sesuai jadwal');
    const text = `📋 *Formulir Registrasi CNT IT APD*\n*${targetForm.title}*\n⏳ Batas Pengisian: ${deadlineText}\n\nSilakan isi formulir melalui tautan resmi berikut:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadQrPoster = async (targetForm = currentForm) => {
    if (!targetForm) return;
    setGeneratingPoster(true);
    try {
      const shareUrl = getFormDirectUrl(targetForm.id);
      const connectedEvent = (events || []).find(e => {
        const isConn = targetForm.isEventConnected || targetForm.fields?.[0]?._isEventConnected;
        const evtId = targetForm.eventId || targetForm.fields?.[0]?._eventId;
        return Boolean(isConn) && String(evtId) === String(e.id);
      }) || (events || []).find(e => String(e.id) === String(targetForm.eventId));

      const poster = await generateFormQrPoster({
        form: targetForm,
        event: connectedEvent,
        formUrl: shareUrl,
        title: targetForm.title,
        description: targetForm.description || targetForm.subtitle,
        category: targetForm.category,
        deadline: targetForm.deadline,
        tenureText: targetForm.tenure ? `Periode ${targetForm.tenure}` : undefined,
        baseUrl: getPublicBaseUrl()
      });

      // Check if Web Share API with file support is available (e.g. mobile Safari / Chrome)
      if (navigator.canShare && navigator.canShare({ files: [new File([poster.blob], poster.filename, { type: 'image/png' })] })) {
        try {
          await navigator.share({
            files: [new File([poster.blob], poster.filename, { type: 'image/png' })],
            title: `Poster QR ${targetForm.title}`,
            text: `Scan QR Code untuk mendaftar: ${targetForm.title}`
          });
          setGeneratingPoster(false);
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            setGeneratingPoster(false);
            return;
          }
        }
      }

      // Check if touch device / mobile (iPhone / Android) where a.download may be blocked
      const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 768;
      if (isMobileDevice) {
        setPosterPreview({
          url: poster.dataUrl,
          filename: poster.filename,
          title: targetForm.title
        });
      } else {
        // Desktop direct download
        const a = document.createElement('a');
        a.href = poster.dataUrl;
        a.download = poster.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to generate QR poster:', err);
      alert('Gagal membuat poster QR: ' + (err.message || 'Error'));
    } finally {
      setGeneratingPoster(false);
    }
  };

  const handleCopySubId = (subId) => {
    if (!subId) return;
    navigator.clipboard?.writeText(subId);
    setCopiedSubId(true);
    setTimeout(() => setCopiedSubId(false), 2500);
  };

  const renderPostSubmissionNotes = () => {
    if (!currentForm?.notes || !currentForm.notes.trim()) return null;

    const notesText = currentForm.notes.trim();
    // Check if there is a WhatsApp group / chat link
    const waMatch = notesText.match(/(https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/[^\s]+)/i);
    const waUrl = waMatch ? waMatch[0] : null;

    return (
      <div style={{
        maxWidth: '540px',
        margin: '0 auto 24px auto',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md, 12px)',
        background: isDark ? 'rgba(37, 211, 102, 0.08)' : 'rgba(37, 211, 102, 0.06)',
        border: '1.5px solid rgba(37, 211, 102, 0.35)',
        textAlign: 'left',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <MessageCircle size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Informasi & Petunjuk Pasca Pendaftaran
            </h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Harap perhatikan catatan penting berikut dari panitia
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text-main)',
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
          padding: '12px 14px',
          background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.7)',
          borderRadius: '8px',
          border: '1px solid rgba(37, 211, 102, 0.2)',
          marginBottom: waUrl ? '14px' : '0',
          wordBreak: 'break-word'
        }}>
          {notesText}
        </div>

        {waUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: 'var(--radius-full, 9999px)',
                background: '#25D366',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 3px 12px rgba(37, 211, 102, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <MessageCircle size={16} />
              <span>Gabung WhatsApp Group Peserta</span>
              <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(waUrl);
                setCopiedWagLink(true);
                setTimeout(() => setCopiedWagLink(false), 2500);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full, 9999px)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-card)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {copiedWagLink ? <Check size={14} color="#25D366" /> : <Share2 size={14} />}
              <span>{copiedWagLink ? 'Link Tersalin!' : 'Salin Link WA'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Handle Input Changes
  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  // Instant Unique Check on Blur (server-side lookup; the value is never compared against downloaded data)
  const normalizeUniqueValue = (val) => String(val ?? '').trim().toLowerCase();
  const duplicateMessage = (field, val) =>
    `${field.label} "${val}" sudah pernah terdaftar sebelumnya. Field ini bersifat unik dan tidak menerima data duplikat.`;
  const handleInputBlur = async (field) => {
    if (!field || !field.isUnique || !currentForm) return;
    const val = formData[field.id];
    const normalized = normalizeUniqueValue(val);
    if (!normalized) return;
    try {
      const taken = await isSubmissionValueTaken(currentForm.id, field.id, String(val));
      setUniqueConflicts(prev => {
        const next = { ...prev };
        if (taken) next[field.id] = normalized;
        else delete next[field.id];
        return next;
      });
      if (taken) setErrors(prev => ({ ...prev, [field.id]: duplicateMessage(field, val) }));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle File Selection - Deferred upload on Submit only (never prematurely on file pick)
  const handleFileUpload = (field, e) => {
    const fieldId = field.id;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setErrors(prev => ({ ...prev, [fieldId]: 'Ukuran file maksimal 20 MB' }));
      return;
    }
    if (!isFileAccepted(file, field.accept)) {
      setErrors(prev => ({ ...prev, [fieldId]: `Tipe berkas tidak didukung. Gunakan: ${field.accept || DEFAULT_FILE_ACCEPT}` }));
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
        } else if (field.type === 'textarea' && val.trim().length < 10) {
          newErrors[field.id] = `${field.label} minimal 10 karakter`;
        }
      }

      // Format & length checks apply to every filled field, required or not
      const textVal = typeof val === 'string' ? val.trim() : '';
      if (!newErrors[field.id] && textVal) {
        const maxLength = field.type === 'textarea' ? TEXTAREA_MAX_LENGTH : TEXT_MAX_LENGTH;
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textVal)) {
          newErrors[field.id] = 'Format email tidak valid';
        } else if (field.type === 'number' && !/^-?\d+([.,]\d+)?$/.test(textVal)) {
          newErrors[field.id] = `${field.label} harus berupa angka`;
        } else if (field.type !== 'file' && textVal.length > maxLength) {
          newErrors[field.id] = `${field.label} maksimal ${maxLength} karakter`;
        }
      }

      // Validasi Unique: nilai yang sudah ditandai terdaftar saat field ditinggalkan (onBlur)
      if (!newErrors[field.id] && field.isUnique && uniqueConflicts[field.id] && uniqueConflicts[field.id] === normalizeUniqueValue(val)) {
        newErrors[field.id] = duplicateMessage(field, val);
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
    const dl = getDeadlineStatus(currentForm?.deadline);
    if (dl.isExpired) {
      alert('Batas waktu pendaftaran formulir ini telah berakhir.');
      return;
    }
    const formQuota = getUnifiedFormQuota(currentForm, events, registrationCounts);
    if (formQuota.isFull) {
      alert(`Maaf, pendaftaran formulir ini telah ditutup karena kuota ${formQuota.isConnected ? 'acara (' + formQuota.connectedEvent?.title + ')' : 'pendaftaran'} telah terpenuhi (${formQuota.count}/${formQuota.maxQuota} peserta).`);
      return;
    }
    if (!validate()) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    const formQuota = getUnifiedFormQuota(currentForm, events, registrationCounts);
    if (formQuota.isFull) {
      setIsConfirmOpen(false);
      alert(`Maaf, pendaftaran formulir ini telah ditutup karena kuota ${formQuota.isConnected ? 'acara (' + formQuota.connectedEvent?.title + ')' : 'pendaftaran'} telah terpenuhi (${formQuota.count}/${formQuota.maxQuota} peserta).`);
      return;
    }

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

    let newSubId;
    try {
      newSubId = await onSubmitSubmission({ formId: currentForm.id, data: { ...formData }, files: uploadedFiles });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      if (err.code === 'FORM_DUPLICATE' && err.detail) {
        const field = (currentForm.fields || []).find(f => f.id === err.detail);
        if (field) {
          setUniqueConflicts(prev => ({ ...prev, [field.id]: normalizeUniqueValue(formData[field.id]) }));
          setErrors(prev => ({ ...prev, [field.id]: duplicateMessage(field, formData[field.id]) }));
        }
      }
      alert(err.code
        ? `Pendaftaran ditolak: ${err.message}`
        : 'Pendaftaran gagal dikirim ke server. Data Anda belum tersimpan, silakan periksa koneksi lalu coba lagi.');
      return;
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

  // Dynamic Search Keys Text based on configured index fields in active forms that require tracking
  const dynamicIndexLabels = React.useMemo(() => {
    const keys = new Set();
    const targetForms = trackingActiveForms;
    
    targetForms.forEach((f) => {
      (f.fields || []).forEach((fld) => {
        if (fld.isSearchIndex) {
          keys.add(fld.label || 'Indeks Pencarian');
        }
      });
    });

    return Array.from(keys);
  }, [trackingActiveForms]);

  const hasConfiguredIndex = dynamicIndexLabels.length > 0;
  const dynamicSearchKeysString = hasConfiguredIndex 
    ? dynamicIndexLabels.join(' / ') 
    : 'ID Pendaftaran (sub-...)';

  // Self-Service Status Tracker: exact match on registration ID or configured index fields, resolved by the server
  const trimmedStatusQuery = statusQuery.trim().toLowerCase();
  const [matchedSubmissions, setMatchedSubmissions] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  useEffect(() => {
    if (trimmedStatusQuery.length < 3) {
      setMatchedSubmissions([]);
      setIsTracking(false);
      return undefined;
    }
    let cancelled = false;
    setIsTracking(true);
    const timer = setTimeout(() => {
      trackSubmissions(trimmedStatusQuery)
        .then((list) => { if (!cancelled) setMatchedSubmissions(list); })
        .catch((err) => {
          console.error(err);
          if (!cancelled) setMatchedSubmissions([]);
        })
        .finally(() => { if (!cancelled) setIsTracking(false); });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedStatusQuery]);

  // Announcement of accepted participants for the selected form (names and short detail only)
  const [acceptedList, setAcceptedList] = useState([]);
  useEffect(() => {
    setAcceptedList([]);
    if (!currentForm?.id || !currentForm.showAnnouncement) return undefined;
    let cancelled = false;
    fetchAcceptedSubmissions(currentForm.id)
      .then((list) => { if (!cancelled) setAcceptedList(list); })
      .catch((err) => console.error(err));
    return () => { cancelled = true; };
  }, [currentForm?.id, currentForm?.showAnnouncement]);

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

  return {
    acceptedList,
    acceptedPage,
    activeForms,
    activeTenure,
    copiedLink,
    copiedSubId,
    copiedWagLink,
    currentForm,
    departments,
    divisions,
    duplicateMessage,
    dynamicIndexLabels,
    dynamicSearchKeysString,
    errors,
    events,
    fileData,
    formData,
    forms,
    generatingPoster,
    getExactTimestamp,
    getFormDirectUrl,
    getStatusBadgeStyle,
    handleConfirmSubmit,
    handleCopyFormLink,
    handleCopySubId,
    handleDownloadQrPoster,
    handleFileUpload,
    handleInputBlur,
    handleInputChange,
    handleShareFormWa,
    handleSubmit,
    hasConfiguredIndex,
    honeypotVal,
    initialFormId,
    inputStyle,
    isConfirmOpen,
    isDark,
    isInitialFormDisabled,
    isInitialFormMissing,
    isSubmitted,
    isSubmitting,
    isTracking,
    lastSubmittedId,
    matchedSubmissions,
    navigateTo,
    normalizeUniqueValue,
    onSelectFormUrl,
    onSubmitSubmission,
    pendingFiles,
    posterPreview,
    registrationCounts,
    renderPostSubmissionNotes,
    requestedForm,
    selectedFormId,
    setAcceptedList,
    setAcceptedPage,
    setCopiedLink,
    setCopiedSubId,
    setCopiedWagLink,
    setErrors,
    setFileData,
    setFormData,
    setGeneratingPoster,
    setHoneypotVal,
    setIsConfirmOpen,
    setIsSubmitted,
    setIsSubmitting,
    setIsTracking,
    setLastSubmittedId,
    setMatchedSubmissions,
    setPendingFiles,
    setPosterPreview,
    setSelectedFormId,
    setStatusQuery,
    setTenureFilter,
    setUniqueConflicts,
    setUploadingFieldId,
    statusQuery,
    tenureFilter,
    tenures,
    theme,
    trackingActiveForms,
    trimmedStatusQuery,
    uniqueConflicts,
    uploadingFieldId,
    validate
  };
}
