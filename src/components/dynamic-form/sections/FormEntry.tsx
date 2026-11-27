import { AlertCircle, CalendarClock, Check, CheckCircle2, ExternalLink, Lock, MessageCircle, QrCode, Search, Send, Share2, Upload, X } from 'lucide-react';
import { formatDeadlineWib, getDeadlineStatus } from '../../../utils/dateUtils';
import { getUnifiedFormQuota } from '../../../utils/quotaUtils';
import { Button, Card, Chip, Eyebrow, cn } from '../../../ui';
import { DEFAULT_FILE_ACCEPT, TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '../dynamicFormShared';
import { useDynamicFormContext } from '../DynamicFormContext';
import { Notice, fieldClass } from './formUi';

/** Instructions the committee wrote for after submitting (e.g. a WhatsApp group link). */
function PostSubmissionNotes() {
  const { currentForm, copiedWagLink, setCopiedWagLink } = useDynamicFormContext();
  const notesText = String(currentForm?.notes || '').trim();
  if (!notesText) return null;
  const waUrl = notesText.match(/(https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/[^\s]+)/i)?.[0] || null;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3 rounded-2xl border border-line bg-subtle p-5 text-left">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-kolaboratif-tint text-kolaboratif-ink">
          <MessageCircle size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="m-0 font-bold text-ink">Petunjuk setelah mendaftar</p>
          <p className="m-0 text-[0.84rem] text-muted">Catatan penting dari panitia</p>
        </div>
      </div>
      <p className="m-0 whitespace-pre-line break-words text-[0.92rem] leading-relaxed text-ink">{notesText}</p>
      {waUrl && (
        <div className="flex flex-wrap gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#128c4a] px-5 text-[0.92rem] font-bold text-white no-underline hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Gabung grup WhatsApp peserta
            <ExternalLink size={14} aria-hidden="true" />
          </a>
          <Button
            variant="secondary"
            icon={copiedWagLink ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
            onClick={() => {
              navigator.clipboard?.writeText(waUrl);
              setCopiedWagLink(true);
              setTimeout(() => setCopiedWagLink(false), 2500);
            }}
          >
            {copiedWagLink ? 'Tautan tersalin' : 'Salin tautan grup'}
          </Button>
        </div>
      )}
    </div>
  );
}

function SubmittedView() {
  const { copiedSubId, currentForm, handleCopySubId, lastSubmittedId, setFileData, setFormData, setIsSubmitted, setStatusQuery } = useDynamicFormContext();
  const resetForm = () => { setIsSubmitted(false); setFormData({}); setFileData({}); };
  const tracked = currentForm?.requiresTracking !== false;

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-kolaboratif-tint text-kolaboratif-ink">
        <CheckCircle2 size={32} aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-[1.6rem] font-extrabold leading-tight text-ink">
          {tracked ? 'Formulir berhasil dikirim' : 'Terima kasih, formulir sudah terkirim'}
        </h2>
        <p className="m-0 mx-auto max-w-[52ch] text-[0.95rem] leading-relaxed text-muted">
          Isian untuk <strong className="text-ink">"{currentForm.title}"</strong> sudah tersimpan.
        </p>
      </div>

      {tracked ? (
        <>
          <div className="flex w-full max-w-[480px] flex-col items-center gap-2 rounded-2xl border border-line bg-subtle p-5">
            <Eyebrow>ID pendaftaran Anda</Eyebrow>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="break-all font-mono text-[1.25rem] font-extrabold tracking-wide text-ink">{lastSubmittedId}</span>
              <Button size="sm" variant="secondary" onClick={() => handleCopySubId(lastSubmittedId)}
                icon={copiedSubId ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}>
                {copiedSubId ? 'Tersalin' : 'Salin ID'}
              </Button>
            </div>
          </div>
          <Notice tone="warning" title="Simpan ID ini" className="w-full max-w-[560px]">
            ID pendaftaran dipakai untuk memantau progres seleksi, verifikasi berkas, dan catatan panitia lewat <strong>Cek status pendaftaran</strong> di halaman ini.
          </Notice>
          <PostSubmissionNotes />
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={resetForm}>Kirim formulir lainnya</Button>
            {lastSubmittedId && (
              <Button variant="gold" icon={<Search size={16} aria-hidden="true" />}
                onClick={() => {
                  setStatusQuery(lastSubmittedId);
                  document.getElementById('status-tracker-section')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                Cek status pendaftaran
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="m-0 max-w-[52ch] rounded-2xl border border-line bg-subtle px-4 py-3 text-[0.88rem] text-muted">
            Formulir ini tidak memakai pelacakan status. Panitia akan memproses tanggapan Anda sesuai ketentuan.
          </p>
          <PostSubmissionNotes />
          <Button variant="gold" onClick={resetForm}>Kirim formulir lainnya</Button>
        </>
      )}
    </div>
  );
}

/** Options for a select/radio field: fixed list or taken from divisions, departments or events. */
function fieldOptions(field: any, currentForm: any, divisions: any[], departments: any[], events: any[]): string[] {
  if (field.source === 'divisions') {
    const formTenureId = currentForm?.tenureId || currentForm?.tenure_id;
    const matched = formTenureId ? (divisions || []).filter((d) => d.tenureId === formTenureId) : (divisions || []);
    return (matched.length > 0 ? matched : (divisions || [])).map((d) => d.name);
  }
  if (field.source === 'departments') {
    return departments && departments.length > 0 ? departments.map((d) => d.name) : (field.options || []);
  }
  if (field.source === 'events') {
    return (events || []).filter((e) => e.isPublic === true).map((e) => `${e.title} (${e.date})`);
  }
  return field.options || [];
}

function FieldLabelText({ field }: { field: any }) {
  return (
    <>
      {field.label}
      {field.required && <span className="text-loyal-ink" aria-hidden="true"> *</span>}
      {field.required && <span className="sr-only"> (wajib)</span>}
      {field.isUnique && (
        <Chip tone="amanah" className="ml-2 align-middle py-1! text-[0.72rem]" title="Nilai ini tidak boleh sama dengan pendaftar lain">
          Unik · 1× pendaftaran
        </Chip>
      )}
    </>
  );
}

function FormField({ field }: { field: any }) {
  const {
    currentForm, departments, divisions, errors, events, fileData, formData, handleFileUpload, handleInputBlur, handleInputChange,
    setFileData, setFormData, setPendingFiles, uploadingFieldId
  } = useDynamicFormContext();
  const hasError = Boolean(errors[field.id]);
  const inputId = `form-field-${field.id}`;
  const errorId = `${inputId}-error`;
  const describedBy = hasError ? errorId : undefined;
  const options = fieldOptions(field, currentForm, divisions, departments, events);
  const labelClass = 'mb-2 block text-[0.9rem] font-bold text-ink';

  const removeFile = () => {
    const drop = (prev: any) => { const copy = { ...prev }; delete copy[field.id]; return copy; };
    setPendingFiles(drop);
    setFileData(drop);
    setFormData(drop);
  };

  const errorText = hasError && (
    <p id={errorId} className="m-0 mt-1.5 flex items-center gap-1.5 text-[0.84rem] font-semibold text-loyal-ink">
      <AlertCircle size={14} aria-hidden="true" />
      {errors[field.id]}
    </p>
  );

  if (field.type === 'radio') {
    return (
      <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={describedBy}>
        <legend className={cn(labelClass, 'p-0')}><FieldLabelText field={field} /></legend>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => {
            const checked = formData[field.id] === opt;
            return (
              <label key={i} className={cn(
                'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-[0.92rem]',
                checked ? 'border-gold bg-harmonis-tint font-bold text-ink' : hasError ? 'border-loyal bg-field text-muted' : 'border-field-line bg-field text-muted hover:text-ink'
              )}>
                <input type="radio" name={`field-${field.id}`} value={opt} checked={checked}
                  onChange={() => handleInputChange(field.id, opt)} className="m-0 size-[18px] shrink-0 cursor-pointer accent-[#0a3e80]" />
                {opt}
              </label>
            );
          })}
        </div>
        {errorText}
      </fieldset>
    );
  }

  if (field.type === 'file') {
    const file = fileData[field.id];
    return (
      <div>
        <p className={labelClass} id={`${inputId}-label`}><FieldLabelText field={field} /></p>
        <div className={cn(
          'flex items-center gap-3 rounded-xl border border-dashed bg-field px-4 py-3 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-navy',
          hasError ? 'border-loyal' : 'border-field-line'
        )}>
          <Upload size={18} className="shrink-0 text-gold-ink" aria-hidden="true" />
          <label className="min-w-0 flex-1 cursor-pointer text-[0.9rem] text-muted">
            <input type="file" className="sr-only" accept={field.accept || DEFAULT_FILE_ACCEPT}
              aria-labelledby={`${inputId}-label`} aria-describedby={describedBy} onChange={(e) => handleFileUpload(field, e)} />
            {uploadingFieldId === field.id ? (
              <span className="font-bold text-gold-ink">Mengunggah berkas…</span>
            ) : file ? (
              <span className="break-words font-bold text-ink">✓ {file.name} ({file.size}) · siap dikirim</span>
            ) : (
              <span>Pilih berkas ({field.accept || 'PDF, gambar, dokumen Office, ZIP'} · maks. 20 MB)</span>
            )}
          </label>
          {file && (
            <button type="button" onClick={removeFile} aria-label="Hapus berkas yang dipilih"
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-loyal-ink hover:bg-loyal-tint">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        {errorText}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className={labelClass}><FieldLabelText field={field} /></label>
      {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
        <input id={inputId} type={field.type} placeholder={field.placeholder || ''} maxLength={TEXT_MAX_LENGTH}
          value={formData[field.id] || ''} aria-invalid={hasError || undefined} aria-describedby={describedBy}
          onChange={(e) => handleInputChange(field.id, e.target.value)} onBlur={() => handleInputBlur(field)}
          className={fieldClass(hasError)} />
      )}
      {field.type === 'textarea' && (
        <textarea id={inputId} rows={4} placeholder={field.placeholder || ''} maxLength={TEXTAREA_MAX_LENGTH}
          value={formData[field.id] || ''} aria-invalid={hasError || undefined} aria-describedby={describedBy}
          onChange={(e) => handleInputChange(field.id, e.target.value)} onBlur={() => handleInputBlur(field)}
          className={fieldClass(hasError, 'resize-y leading-relaxed')} />
      )}
      {field.type === 'select' && (
        <select id={inputId} value={formData[field.id] || ''} aria-invalid={hasError || undefined} aria-describedby={describedBy}
          onChange={(e) => handleInputChange(field.id, e.target.value)} onBlur={() => handleInputBlur(field)}
          className={fieldClass(hasError, 'cursor-pointer')}>
          <option value="">Pilih {String(field.label || '').toLowerCase()}</option>
          {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
      )}
      {errorText}
    </div>
  );
}

export default function FormEntry() {
  const {
    copiedLink, currentForm, events, generatingPoster, handleCopyFormLink, handleDownloadQrPoster, handleShareFormWa,
    handleSubmit, honeypotVal, isSubmitted, registrationCounts, setHoneypotVal
  } = useDynamicFormContext();
  if (!currentForm) return null;

  const deadline = getDeadlineStatus(currentForm.deadline);
  const quota = getUnifiedFormQuota(currentForm, events, registrationCounts);
  const isClosed = deadline.isExpired || quota.isFull;

  return (
      <Card as="section" padding="lg" className="w-full" aria-label={currentForm.title}>
        {isSubmitted ? <SubmittedView /> : (
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
              <div><Chip tone="gold">{currentForm.category || 'Pendaftaran resmi'}</Chip></div>
              <h2 className="m-0 text-[clamp(1.5rem,3vw,1.9rem)] font-extrabold leading-tight text-ink">{currentForm.title}</h2>
              {currentForm.subtitle && <p className="m-0 text-[0.98rem] leading-relaxed text-muted">{currentForm.subtitle}</p>}
              <div className="flex flex-wrap items-center gap-2 text-[0.88rem]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                  <CalendarClock size={16} className="text-muted" aria-hidden="true" />
                  Batas akhir: {formatDeadlineWib(currentForm.deadline)}
                </span>
                {quota.isLimited && quota.maxQuota > 0 && (
                  <Chip tone={quota.isFull ? 'danger' : 'neutral'}>
                    {quota.isConnected ? 'Kuota acara' : 'Kuota'}: {quota.count}/{quota.maxQuota} {quota.isFull ? '· penuh' : `· sisa ${quota.remaining}`}
                  </Chip>
                )}
                {deadline.isToday && <Chip tone="gold">Hari terakhir</Chip>}
                {deadline.isExpired && <Chip tone="danger">Ditutup</Chip>}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => handleCopyFormLink(currentForm)}
                  icon={copiedLink ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}>
                  {copiedLink ? 'Tautan tersalin' : 'Salin tautan'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleShareFormWa(currentForm)} icon={<MessageCircle size={14} aria-hidden="true" />}>
                  Bagikan ke WhatsApp
                </Button>
                <Button size="sm" variant="secondary" loading={generatingPoster} onClick={() => handleDownloadQrPoster(currentForm)}
                  icon={<QrCode size={14} aria-hidden="true" />} title="Unduh poster QR (PNG) untuk dibagikan atau dicetak">
                  {generatingPoster ? 'Menyiapkan poster…' : 'Poster QR'}
                </Button>
              </div>
            </header>

            {deadline.isToday && !isClosed && (
              <Notice tone="warning" title="Hari ini hari terakhir pendaftaran">
                Batas waktu {deadline.formatted}. Lengkapi dan kirim sebelum ditutup.
              </Notice>
            )}

            {isClosed ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-subtle px-6 py-8 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-loyal-tint text-loyal-ink"><Lock size={20} aria-hidden="true" /></span>
                <p className="m-0 text-[1.05rem] font-bold text-ink">
                  {deadline.isExpired ? 'Pendaftaran sudah ditutup' : `Pendaftaran ditutup: ${quota.isConnected ? 'kuota acara' : 'kuota'} penuh`}
                </p>
                <p className="m-0 max-w-[56ch] text-[0.92rem] leading-relaxed text-muted">
                  {deadline.isExpired
                    ? `Batas waktu formulir ini berakhir ${deadline.formatted}, jadi formulir tidak lagi menerima pendaftaran.`
                    : quota.isConnected
                      ? `Kuota kegiatan "${quota.connectedEvent?.title}" sudah terisi ${quota.count}/${quota.maxQuota} peserta.`
                      : `Kuota formulir ini sudah terisi ${quota.count}/${quota.maxQuota} pendaftar.`}
                  {' '}Sudah mendaftar? Cek status Anda di bawah.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {/* Honeypot against bots: hidden from people and assistive tech */}
                <div className="pointer-events-none absolute -z-10 h-0 overflow-hidden opacity-0" aria-hidden="true">
                  <input type="text" name="mandiri_corp_security_check" tabIndex={-1} autoComplete="off" value={honeypotVal} onChange={(e) => setHoneypotVal(e.target.value)} />
                </div>
                {(currentForm.fields || []).map((field: any) => <FormField key={field.id} field={field} />)}
                <Button type="submit" variant="gold" size="lg" className="mt-2 w-full" icon={<Send size={18} aria-hidden="true" />}>
                  Kirim pendaftaran
                </Button>
              </form>
            )}
          </div>
        )}
      </Card>
  );
}
