import { z } from 'zod';
import { toDatetimeLocalValue } from '../../utils/dateUtils';

/**
 * Validation rules of the Admin Portal forms (Culture Network Team).
 *
 * Messages and conditions mirror the hand-written checks they replace, including their quirks
 * (some fields are "empty after trim", others only "falsy"); schemas.test.ts compares every
 * schema with a copy of the original checks on fuzzed input. Field rules never abort parsing, so
 * cross-field rules in `superRefine` still run and every problem is reported at once.
 *
 * Rules that need other data stay business functions: role quota (`validateMemberQuota`),
 * unique-field duplicates of a form, and photo link reachability.
 */

// Inputs are controlled React state: strings, but tolerate a missing value as ''.
const text = z.preprocess((v) => (v === undefined || v === null ? '' : v), z.string());
/** Not blank once surrounding whitespace is removed. */
const requiredText = (message: string) => text.refine((v) => v.trim() !== '', { message });
/** Not an empty string (whitespace counts as a value). */
const presentText = (message: string) => text.refine((v) => v !== '', { message });

const blankAfterTrim = (v: unknown) => !String(v ?? '').trim();
const WEB_URL = /^https?:\/\/.+/i;
const isWebUrl = (v: string) => WEB_URL.test(v.trim()) || v.trim().startsWith('/');
const isInvalidRab = (rab: unknown) => rab === '' || rab === undefined || rab === null || isNaN(Number(rab)) || Number(rab) < 0;

export type FieldErrors = Record<string, string>;

/**
 * Validates and returns `{ field: message }`. When several rules fail on one field the later
 * rule wins, like the assignments in the original handlers.
 */
export function collectFieldErrors(schema: z.ZodType, values: unknown): FieldErrors {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) errors[String(issue.path[0] ?? '')] = issue.message;
  return errors;
}

/** Message of the first failing rule, for dialogs that show one error at a time. */
export function firstError(schema: z.ZodType, values: unknown): string | null {
  const result = schema.safeParse(values);
  return result.success ? null : result.error.issues[0]?.message ?? null;
}

// ---------------------------------------------------------------------------------------------
// Sign-in
// ---------------------------------------------------------------------------------------------

// Forms driven by react-hook-form always hold strings, so these use z.string() directly.
export const loginSchema = z.object({
  loginEmail: z.string().refine((v) => /\S+@\S+\.\S+/.test(v.trim()), {
    message: 'Email admin wajib diisi dengan format yang valid'
  }),
  loginPassword: z.string().refine((v) => v !== '', { message: 'Password wajib diisi' })
});
export type LoginValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------------------------
// "Tambah" forms of the admin tabs
// ---------------------------------------------------------------------------------------------

export const faqCreateSchema = z.object({
  faqCategory: requiredText('Kategori Topik FAQ wajib dipilih / diisi'),
  faqQuestion: requiredText('Pertanyaan FAQ wajib diisi'),
  faqAnswer: requiredText('Jawaban / penjelasan FAQ wajib diisi')
});

export const tenureCreateSchema = z.object({
  newTenureCode: requiredText('Kode Tahun Kepengurusan wajib diisi'),
  newTenureTitle: requiredText('Nama Periode Kepengurusan wajib diisi')
});

export const divisionCreateSchema = z.object({
  newDivName: requiredText('Nama Divisi wajib diisi')
});

export const ROLE_NAME_DUPLICATE = 'Role dengan nama ini sudah terdaftar pada periode tersebut';
/** `takenNames`: lower-cased, trimmed role names already used in the target tenure. */
export function roleCreateSchema({ takenNames }: { takenNames: string[] }) {
  return z.object({ newRoleName: requiredText('Nama Jabatan / Role wajib diisi') }).superRefine((v, ctx) => {
    const name = v.newRoleName.toLowerCase().trim();
    if (name && takenNames.includes(name)) ctx.addIssue({ code: 'custom', path: ['newRoleName'], message: ROLE_NAME_DUPLICATE });
  });
}

/** `takenNames`: lower-cased, trimmed names of the existing departments. */
export function departmentCreateSchema({ takenNames }: { takenNames: string[] }) {
  return z.object({ newDeptName: requiredText('Nama Departemen wajib diisi') }).superRefine((v, ctx) => {
    const name = v.newDeptName.toLowerCase().trim();
    if (name && takenNames.includes(name)) ctx.addIssue({ code: 'custom', path: ['newDeptName'], message: 'Nama Departemen sudah terdaftar' });
  });
}

/** `divisionIds`: divisions of the event's tenure. */
export function eventCreateSchema({ divisionIds }: { divisionIds: string[] }) {
  return z
    .object({
      eventTitle: requiredText('Nama Event wajib diisi'),
      eventCategory: requiredText('Kategori Kegiatan wajib dipilih'),
      eventStartDate: presentText('Tanggal & Jam Mulai wajib dipilih'),
      eventEndDate: presentText('Tanggal & Jam Berakhir wajib dipilih'),
      eventDesc: text,
      eventRab: z.unknown().optional(),
      eventIsLimited: z.unknown().optional(),
      eventMaxQuota: z.unknown().optional(),
      eventDivId: text
    })
    .superRefine((v, ctx) => {
      if (v.eventStartDate && v.eventEndDate) {
        const start = toDatetimeLocalValue(v.eventStartDate);
        const end = toDatetimeLocalValue(v.eventEndDate);
        if (start && end && start > end) {
          ctx.addIssue({ code: 'custom', path: ['eventStartDate'], message: 'Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir' });
          ctx.addIssue({ code: 'custom', path: ['eventEndDate'], message: 'Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai' });
        }
      }
      if (!v.eventDesc.trim()) ctx.addIssue({ code: 'custom', path: ['eventDesc'], message: 'Deskripsi Event wajib diisi' });
      if (isInvalidRab(v.eventRab)) {
        ctx.addIssue({ code: 'custom', path: ['eventRab'], message: 'Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)' });
      }
      if (v.eventIsLimited) {
        const max = v.eventMaxQuota;
        if (!max || isNaN(Number(max)) || Number(max) <= 0) {
          ctx.addIssue({ code: 'custom', path: ['eventMaxQuota'], message: 'Batas maksimal kuota wajib diisi angka lebih dari 0' });
        }
      }
      if (divisionIds.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['eventDivId'], message: 'Divisi masih kosong pada periode ini. Silakan buat divisi baru terlebih dahulu di tab Divisi.' });
      } else if (!v.eventDivId || !divisionIds.includes(v.eventDivId)) {
        ctx.addIssue({ code: 'custom', path: ['eventDivId'], message: 'Divisi penyelenggara wajib dipilih' });
      }
    });
}

interface RoleForValidation {
  name: string;
  requiresDivision?: boolean;
}

/**
 * Structural checks of a new member. The role quota is checked separately by
 * `validateMemberQuota` (it needs every member of the tenure).
 */
export function memberCreateSchema({
  roleCount,
  selectedRole,
  divisionIds
}: {
  roleCount: number;
  selectedRole: RoleForValidation | null;
  divisionIds: string[];
}) {
  return z
    .object({ memName: requiredText('Nama Lengkap pengurus/anggota wajib diisi'), memDivisionId: text })
    .superRefine((v, ctx) => {
      if (roleCount === 0) {
        ctx.addIssue({ code: 'custom', path: ['memRole'], message: 'Role kepengurusan masih kosong pada periode ini. Silakan buat role baru terlebih dahulu di menu Kelola Role & Jabatan.' });
      }
      if (!selectedRole && roleCount > 0) {
        ctx.addIssue({ code: 'custom', path: ['memRole'], message: 'Jabatan / Role wajib dipilih' });
      }
      if (selectedRole?.requiresDivision) {
        if (divisionIds.length === 0) {
          ctx.addIssue({ code: 'custom', path: ['memDivisionId'], message: 'Divisi masih kosong pada periode ini. Silakan buat divisi terlebih dahulu.' });
        } else if (!v.memDivisionId || !divisionIds.includes(v.memDivisionId)) {
          ctx.addIssue({ code: 'custom', path: ['memDivisionId'], message: `Divisi wajib dipilih untuk jabatan "${selectedRole.name}"` });
        }
      }
    });
}

export const brandAssetCreateSchema = z
  .object({
    assetTitle: requiredText('Judul Asset / Template wajib diisi'),
    assetCategory: requiredText('Kategori Asset wajib dipilih'),
    assetFileType: requiredText('Format File Asset wajib diisi'),
    assetFileUrl: text,
    assetPreviewUrl: text,
    hasPendingAssetFile: z.boolean(),
    hasPendingPreviewFile: z.boolean()
  })
  .superRefine((v, ctx) => {
    const fileUrl = v.assetFileUrl.trim();
    const previewUrl = v.assetPreviewUrl.trim();
    if (!v.hasPendingAssetFile && !v.hasPendingPreviewFile && !fileUrl && !previewUrl) {
      ctx.addIssue({ code: 'custom', path: ['assetFileUrl'], message: 'File atau URL Download wajib dipilih / diisi' });
    }
    if (fileUrl && !v.hasPendingAssetFile && !isWebUrl(fileUrl)) {
      ctx.addIssue({ code: 'custom', path: ['assetFileUrl'], message: 'URL file harus berupa tautan web yang valid (diawali http:// atau https://)' });
    }
    if (previewUrl && !v.hasPendingPreviewFile && !isWebUrl(previewUrl)) {
      ctx.addIssue({ code: 'custom', path: ['assetPreviewUrl'], message: 'URL preview harus berupa tautan web yang valid (diawali http:// atau https://)' });
    }
  });

/**
 * `divisionCount` / `hasSelectedDivision`: divisions of the gallery's tenure and whether one of
 * them is selected. Photo links are checked for reachability separately (asynchronously).
 */
export function galleryCreateSchema({ divisionCount, hasSelectedDivision }: { divisionCount: number; hasSelectedDivision: boolean }) {
  return z
    .object({
      galTitle: requiredText('Judul Kegiatan wajib diisi'),
      galDesc: requiredText('Deskripsi Singkat Acara wajib diisi'),
      photoUrlCount: z.number(),
      pendingFileCount: z.number()
    })
    .superRefine((v, ctx) => {
      if (divisionCount === 0) {
        ctx.addIssue({ code: 'custom', path: ['galDivision'], message: 'Divisi masih kosong pada periode ini. Silakan buat divisi baru terlebih dahulu di tab Divisi.' });
      } else if (!hasSelectedDivision) {
        ctx.addIssue({ code: 'custom', path: ['galDivision'], message: 'Divisi penyelenggara wajib dipilih' });
      }
      if (v.pendingFileCount === 0 && v.photoUrlCount === 0) {
        ctx.addIssue({ code: 'custom', path: ['galPhotos'], message: 'Wajib memilih salah satu: unggah file foto dari komputer ATAU masukkan tautan foto yang valid' });
      }
    });
}

export const formCreateSchema = z
  .object({
    newFormTitle: requiredText('Judul Formulir wajib diisi'),
    newFormCategory: requiredText('Kategori Formulir wajib dipilih'),
    newFormDeadline: requiredText('Batas Akhir / Deadline Pendaftaran wajib ditentukan'),
    newFormIsLimited: z.unknown().optional(),
    newFormMaxQuota: z.unknown().optional(),
    newFormIsEventConnected: z.unknown().optional(),
    newFormEventId: z.unknown().optional()
  })
  .superRefine((v, ctx) => {
    if (v.newFormIsLimited && (!v.newFormMaxQuota || parseInt(String(v.newFormMaxQuota), 10) <= 0)) {
      ctx.addIssue({ code: 'custom', path: ['newFormMaxQuota'], message: 'Maksimal kuota harus lebih dari 0 jika kuota dibatasi' });
    }
    if (v.newFormIsEventConnected && !v.newFormEventId) {
      ctx.addIssue({ code: 'custom', path: ['newFormEventId'], message: 'Silakan pilih event / acara yang terhubung' });
    }
  });

// ---------------------------------------------------------------------------------------------
// Edit dialog: checks that run before any upload, one message at a time, in the original order
// ---------------------------------------------------------------------------------------------

type Check = (item: Record<string, any>) => string | null;
const NAME_REQUIRED: Check = (it) => (blankAfterTrim(it.name) ? 'Nama wajib diisi sebelum menyimpan perubahan' : null);
const TITLE_REQUIRED: Check = (it) => (blankAfterTrim(it.title) ? 'Judul wajib diisi sebelum menyimpan perubahan' : null);

const editChecks: Record<string, Check[]> = {
  member: [NAME_REQUIRED],
  division: [NAME_REQUIRED],
  department: [NAME_REQUIRED],
  role: [NAME_REQUIRED],
  tenure: [TITLE_REQUIRED, (it) => (blankAfterTrim(it.code) ? 'Kode tahun periode wajib diisi' : null)],
  faq: [
    (it) => (blankAfterTrim(it.category) ? 'Kategori topik FAQ wajib dipilih' : null),
    (it) => (blankAfterTrim(it.question) || blankAfterTrim(it.answer) ? 'Pertanyaan dan jawaban FAQ wajib diisi' : null)
  ],
  form: [
    TITLE_REQUIRED,
    (it) => (blankAfterTrim(it.category) ? 'Kategori formulir wajib dipilih' : null),
    (it) => (blankAfterTrim(it.deadline) ? 'Batas Akhir / Deadline Pendaftaran wajib ditentukan' : null),
    (it) => (it.isLimited && (!it.maxQuota || parseInt(it.maxQuota, 10) <= 0) ? 'Maksimal kuota responden harus lebih dari 0 jika kuota dibatasi' : null),
    (it) => (it.isEventConnected && !it.eventId ? 'Silakan pilih Acara / Event yang terhubung' : null)
  ],
  kudos: [
    (it) => (blankAfterTrim(it.sender) || blankAfterTrim(it.recipient) || blankAfterTrim(it.message) ? 'Pengirim, penerima, dan pesan apresiasi wajib diisi' : null)
  ],
  gallery: [
    TITLE_REQUIRED,
    (it) => (!it.divisionId && !it.division ? 'Divisi penyelenggara wajib dipilih untuk galeri' : null),
    (it) => (blankAfterTrim(it.description) ? 'Deskripsi kegiatan wajib diisi untuk galeri' : null)
  ],
  event: [
    TITLE_REQUIRED,
    (it) => (blankAfterTrim(it.kategori || it.category || it.badge || '') ? 'Kategori program/kegiatan wajib dipilih' : null),
    (it) => (!it.divisionId ? 'Divisi penyelenggara wajib dipilih untuk Event' : null),
    (it) => (!it.startDate ? 'Tanggal & Jam Mulai event wajib diisi' : null),
    (it) => (!it.endDate ? 'Tanggal & Jam Berakhir event wajib diisi' : null),
    (it) => (toDatetimeLocalValue(it.startDate) > toDatetimeLocalValue(it.endDate) ? 'Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir' : null),
    (it) => (blankAfterTrim(it.description) ? 'Deskripsi kegiatan event wajib diisi' : null),
    (it) => {
      if (!it.isLimited) return null;
      const mq = Number(it.maxQuota || 0);
      return !mq || mq <= 0 ? 'Batas maksimal kuota wajib diisi angka lebih dari 0' : null;
    },
    (it) => (isInvalidRab(it.totalRab) ? 'Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)' : null)
  ],
  brand_asset: [
    TITLE_REQUIRED,
    (it) => (blankAfterTrim(it.category) ? 'Kategori katalog asset wajib dipilih' : null),
    (it) => (blankAfterTrim(it.fileType) ? 'Format file asset wajib diisi' : null)
  ]
};

/**
 * Edit-dialog item as a zod schema: each check becomes one issue, and `firstError` returns the
 * first one, which is the message the original dialog showed.
 */
const editSchemas: Record<string, z.ZodType> = Object.fromEntries(
  Object.entries(editChecks).map(([type, checks]) => [
    type,
    z.record(z.string(), z.any()).superRefine((item, ctx) => {
      for (const check of checks) {
        const message = check(item);
        if (message) ctx.addIssue({ code: 'custom', message });
      }
    })
  ])
);

/** First problem with an edited item of the given type, or null when its fields are valid. */
export function editItemError(type: string, item: Record<string, unknown>): string | null {
  const schema = editSchemas[type];
  return schema ? firstError(schema, item || {}) : null;
}

// ---------------------------------------------------------------------------------------------
// Admin accounts
// ---------------------------------------------------------------------------------------------

export const adminAccountSchema = z
  .object({
    email: z.string().refine((v) => /\S+@\S+\.\S+/.test(v.trim()), { message: 'Masukkan email akun yang valid.' }),
    displayName: z.string(),
    role: z.enum(['super_admin', 'division_admin']),
    divisionId: z.string()
  })
  .superRefine((v, ctx) => {
    if (v.role === 'division_admin' && !v.divisionId) {
      ctx.addIssue({ code: 'custom', path: ['divisionId'], message: 'Pilih divisi untuk Admin Divisi.' });
    }
  });
export type AdminAccountValues = z.infer<typeof adminAccountSchema>;
