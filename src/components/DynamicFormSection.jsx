import React, { useState, useEffect, useMemo } from 'react';
import { useAppNavigate } from '../lib/appNavigation';
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
  Search,
  MessageCircle,
  QrCode,
  Download,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { uploadMediaToCloud, isSubmissionValueTaken, trackSubmissions, fetchAcceptedSubmissions } from '../lib/supabase';
import { getDeadlineStatus, formatDeadlineWib, formatWibDateTime, formatWibTimestamp } from '../utils/dateUtils';
import { generateFormQrPoster } from '../utils/qrPosterGenerator';
import { getPublicBaseUrl } from '../utils/urlUtils';
import { getUnifiedFormQuota } from '../utils/quotaUtils';
import { useDynamicForm } from './dynamic-form/useDynamicForm';
import { DynamicFormContext } from './dynamic-form/DynamicFormContext';
import { DEFAULT_FILE_ACCEPT, MAX_FILE_BYTES, TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH, isFileAccepted } from './dynamic-form/dynamicFormShared';
import FormPageHeader from './dynamic-form/sections/FormPageHeader';
import FormUnavailableNotice from './dynamic-form/sections/FormUnavailableNotice';
import FormPicker from './dynamic-form/sections/FormPicker';
import FormEntry from './dynamic-form/sections/FormEntry';
import SubmitConfirmModal from './dynamic-form/sections/SubmitConfirmModal';
import StatusTracker from './dynamic-form/sections/StatusTracker';
import AcceptedAnnouncement from './dynamic-form/sections/AcceptedAnnouncement';
import FormPosterModal from './dynamic-form/sections/FormPosterModal';


// Limits for public registration input. The storage bucket rejects files above 20 MB.
// Checks a file against an accept list such as ".pdf,.png" or "image/*".
export default function DynamicFormSection(props) {
  const dynamicFormState = useDynamicForm(props);
  const {
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
  } = dynamicFormState;

  return (
    <DynamicFormContext.Provider value={dynamicFormState}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingTop: '48px', paddingBottom: '80px' }}>
      
      {/* 1. Header Hub */}
      <FormPageHeader />

      {/* CASE: Specific Form from URL Not Found or Deactivated */}
      <FormUnavailableNotice />

      {/* CASE 1: No active forms available */}
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
              Belum Ada Registrasi / Formulir Yang Sedang Dibuka
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Saat ini belum ada formulir pendaftaran atau kegiatan yang sedang dibuka untuk periode ini. Pantau terus kanal komunikasi kami untuk informasi kegiatan dan pembukaan formulir.
            </p>
          </div>
        </div>
      )}

      {/* 2. Form Switcher / Catalog Cards (Jika ada lebih dari 1 form aktif) */}
      <FormPicker />

      {/* 3. The Active Dynamic Form View */}
      <FormEntry />

      {/* CONFIRMATION PREVIEW MODAL SEBELUM SUBMIT */}
      <SubmitConfirmModal />

      {/* 4. SELF-SERVICE STATUS TRACKER ("CEK STATUS PENDAFTARAN SAYA") */}
      {/* Hanya muncul apabila ada formulir AKTIF yang MEMBUTUHKAN tracking progress */}
      <StatusTracker />

      {/* 5. PENGUMUMAN PESERTA / CREW TERPILIH (HALL OF WELCOME & ONBOARDING BOARD) */}
      <AcceptedAnnouncement />

      {/* MODAL PREVIEW POSTER QR UNTUK MOBILE / IPHONE */}
      <FormPosterModal />

    </div>
    </DynamicFormContext.Provider>
  );
}
