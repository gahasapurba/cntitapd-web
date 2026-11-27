import { describe, expect, it } from 'vitest';
import { toDatetimeLocalValue } from '../../utils/dateUtils';
import {
  brandAssetCreateSchema,
  collectFieldErrors,
  departmentCreateSchema,
  divisionCreateSchema,
  editItemError,
  eventCreateSchema,
  faqCreateSchema,
  formCreateSchema,
  galleryCreateSchema,
  loginSchema,
  memberCreateSchema,
  roleCreateSchema,
  tenureCreateSchema,
  adminAccountSchema
} from './schemas';

/*
 * Each schema is compared with a verbatim copy of the hand-written checks it replaced
 * (AdminPortal.jsx, FormsTab.tsx, EditItemModal.tsx, AdminAccountsPanel.jsx before Fase 2 step 5)
 * on deterministic pseudo-random input.
 */

let seed = 20261127;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];
const TEXTS = ['', ' ', '  \n ', 'a', ' x ', 'Judul', '0', 'abc def'] as const;
const NUMS = ['', ' ', '0', '-1', '1', '5', '12', 'abc', '3.5', '-0', '1e3', undefined, null, 0, 7, -2] as const;
const BOOLS = [true, false, undefined, 1, 0, ''] as const;
const DATES = ['', '2026-11-17T09:00', '2026-11-17T11:00', '2026-11-18', '2026-11-17 10:30', '2026-11-17T09:00:00Z', 'x'] as const;
const URLS = ['', ' ', 'http://a.b', 'https://x.y/z.png', '/assets/a.png', 'ftp://x', 'www.example.com', ' https://a.b '] as const;
const EMAILS = ['', ' ', 'a@b', 'a@b.c', ' admin@bankmandiri.co.id ', 'no-at.com', 'x@y.z w'] as const;
const IDS = ['', 'div-1', 'div-2', 'div-x'] as const;
const N = 3000;

const eq = (a: unknown, b: unknown) => expect(a).toEqual(b);

describe('create forms match the original checks', () => {
  it('FAQ', () => {
    for (let i = 0; i < N; i++) {
      const v = { faqCategory: pick(TEXTS), faqQuestion: pick(TEXTS), faqAnswer: pick(TEXTS) };
      const errs: Record<string, string> = {};
      if (!v.faqCategory.trim()) errs.faqCategory = 'Kategori Topik FAQ wajib dipilih / diisi';
      if (!v.faqQuestion.trim()) errs.faqQuestion = 'Pertanyaan FAQ wajib diisi';
      if (!v.faqAnswer.trim()) errs.faqAnswer = 'Jawaban / penjelasan FAQ wajib diisi';
      eq(collectFieldErrors(faqCreateSchema, v), errs);
    }
  });

  it('tenure, division', () => {
    for (let i = 0; i < N; i++) {
      const t = { newTenureCode: pick(TEXTS), newTenureTitle: pick(TEXTS) };
      const errors: Record<string, string> = {};
      if (!t.newTenureCode.trim()) errors.newTenureCode = 'Kode Tahun Kepengurusan wajib diisi';
      if (!t.newTenureTitle.trim()) errors.newTenureTitle = 'Nama Periode Kepengurusan wajib diisi';
      eq(collectFieldErrors(tenureCreateSchema, t), errors);
      const d = pick(TEXTS);
      eq(collectFieldErrors(divisionCreateSchema, { newDivName: d }), d.trim() ? {} : { newDivName: 'Nama Divisi wajib diisi' });
    }
  });

  it('role and department (with duplicates)', () => {
    const NAMES = ['', ' ', 'Ketua', ' ketua ', 'KETUA', 'Anggota', 'Dept A', 'dept a'] as const;
    for (let i = 0; i < N; i++) {
      const roleName = pick(NAMES);
      const existingRoles = ['Ketua', 'Pimpro'].filter(() => rand() > 0.3);
      let expected: Record<string, string> = {};
      if (!roleName.trim()) expected = { newRoleName: 'Nama Jabatan / Role wajib diisi' };
      else if (existingRoles.some((r) => r.toLowerCase().trim() === roleName.toLowerCase().trim())) {
        expected = { newRoleName: 'Role dengan nama ini sudah terdaftar pada periode tersebut' };
      }
      eq(collectFieldErrors(roleCreateSchema({ takenNames: existingRoles.map((r) => r.toLowerCase().trim()) }), { newRoleName: roleName }), expected);

      const deptName = pick(NAMES);
      const depts = ['Dept A', 'IT Ops'].filter(() => rand() > 0.3);
      let dExpected: Record<string, string> = {};
      if (!deptName.trim()) dExpected = { newDeptName: 'Nama Departemen wajib diisi' };
      else if (depts.some((d) => d.toLowerCase().trim() === deptName.toLowerCase().trim())) dExpected = { newDeptName: 'Nama Departemen sudah terdaftar' };
      eq(collectFieldErrors(departmentCreateSchema({ takenNames: depts.map((d) => d.toLowerCase().trim()) }), { newDeptName: deptName }), dExpected);
    }
  });

  it('event', () => {
    for (let i = 0; i < N; i++) {
      const v = {
        eventTitle: pick(TEXTS), eventCategory: pick(TEXTS), eventStartDate: pick(DATES), eventEndDate: pick(DATES),
        eventDesc: pick(TEXTS), eventRab: pick(NUMS), eventIsLimited: pick(BOOLS), eventMaxQuota: pick(NUMS), eventDivId: pick(IDS)
      };
      const available = ['div-1', 'div-2'].filter(() => rand() > 0.3);
      const errs: Record<string, string> = {};
      if (!v.eventTitle.trim()) errs.eventTitle = 'Nama Event wajib diisi';
      if (!v.eventCategory.trim()) errs.eventCategory = 'Kategori Kegiatan wajib dipilih';
      if (!v.eventStartDate) errs.eventStartDate = 'Tanggal & Jam Mulai wajib dipilih';
      if (!v.eventEndDate) errs.eventEndDate = 'Tanggal & Jam Berakhir wajib dipilih';
      if (v.eventStartDate && v.eventEndDate) {
        const normStart = toDatetimeLocalValue(v.eventStartDate);
        const normEnd = toDatetimeLocalValue(v.eventEndDate);
        if (normStart && normEnd && normStart > normEnd) {
          errs.eventStartDate = 'Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir';
          errs.eventEndDate = 'Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai';
        }
      }
      if (!v.eventDesc.trim()) errs.eventDesc = 'Deskripsi Event wajib diisi';
      const eventRab: any = v.eventRab;
      if (eventRab === '' || eventRab === undefined || eventRab === null || isNaN(Number(eventRab)) || Number(eventRab) < 0) {
        errs.eventRab = 'Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)';
      }
      if (v.eventIsLimited) {
        const m: any = v.eventMaxQuota;
        if (!m || isNaN(Number(m)) || Number(m) <= 0) errs.eventMaxQuota = 'Batas maksimal kuota wajib diisi angka lebih dari 0';
      }
      if (available.length === 0) errs.eventDivId = 'Divisi masih kosong pada periode ini. Silakan buat divisi baru terlebih dahulu di tab Divisi.';
      else if (!v.eventDivId || !available.includes(v.eventDivId)) errs.eventDivId = 'Divisi penyelenggara wajib dipilih';
      eq(collectFieldErrors(eventCreateSchema({ divisionIds: available }), v), errs);
    }
  });

  it('member (structure)', () => {
    for (let i = 0; i < N; i++) {
      const memName = pick(TEXTS);
      const memDivisionId = pick(IDS);
      const roleCount = pick([0, 1, 3]);
      const selectedRole = roleCount > 0 && rand() > 0.2 ? { name: pick(['Ketua', 'Pimpro']), requiresDivision: rand() > 0.5 } : null;
      const divs = ['div-1', 'div-2'].filter(() => rand() > 0.3);
      const errs: Record<string, string> = {};
      if (!memName.trim()) errs.memName = 'Nama Lengkap pengurus/anggota wajib diisi';
      if (roleCount === 0) errs.memRole = 'Role kepengurusan masih kosong pada periode ini. Silakan buat role baru terlebih dahulu di menu Kelola Role & Jabatan.';
      if (!selectedRole && roleCount > 0) errs.memRole = 'Jabatan / Role wajib dipilih';
      if (selectedRole?.requiresDivision) {
        if (divs.length === 0) errs.memDivisionId = 'Divisi masih kosong pada periode ini. Silakan buat divisi terlebih dahulu.';
        else if (!memDivisionId || !divs.includes(memDivisionId)) errs.memDivisionId = `Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`;
      }
      eq(collectFieldErrors(memberCreateSchema({ roleCount, selectedRole, divisionIds: divs }), { memName, memDivisionId }), errs);
    }
  });

  it('brand asset', () => {
    for (let i = 0; i < N; i++) {
      const v = {
        assetTitle: pick(TEXTS), assetCategory: pick(TEXTS), assetFileType: pick(TEXTS),
        assetFileUrl: pick(URLS), assetPreviewUrl: pick(URLS), hasPendingAssetFile: rand() > 0.7, hasPendingPreviewFile: rand() > 0.7
      };
      const errs: Record<string, string> = {};
      if (!v.assetTitle.trim()) errs.assetTitle = 'Judul Asset / Template wajib diisi';
      if (!v.assetCategory.trim()) errs.assetCategory = 'Kategori Asset wajib dipilih';
      if (!v.assetFileType.trim()) errs.assetFileType = 'Format File Asset wajib diisi';
      if (!v.hasPendingAssetFile && !v.hasPendingPreviewFile && !v.assetFileUrl.trim() && !v.assetPreviewUrl.trim()) {
        errs.assetFileUrl = 'File atau URL Download wajib dipilih / diisi';
      }
      if (v.assetFileUrl.trim() && !v.hasPendingAssetFile) {
        const ok = /^https?:\/\/.+/i.test(v.assetFileUrl.trim()) || v.assetFileUrl.trim().startsWith('/');
        if (!ok) errs.assetFileUrl = 'URL file harus berupa tautan web yang valid (diawali http:// atau https://)';
      }
      if (v.assetPreviewUrl.trim() && !v.hasPendingPreviewFile) {
        const ok = /^https?:\/\/.+/i.test(v.assetPreviewUrl.trim()) || v.assetPreviewUrl.trim().startsWith('/');
        if (!ok) errs.assetPreviewUrl = 'URL preview harus berupa tautan web yang valid (diawali http:// atau https://)';
      }
      eq(collectFieldErrors(brandAssetCreateSchema, v), errs);
    }
  });

  it('gallery', () => {
    for (let i = 0; i < N; i++) {
      const galTitle = pick(TEXTS); const galDesc = pick(TEXTS);
      const divisionCount = pick([0, 1, 2]); const hasSelectedDivision = rand() > 0.4;
      const photoUrlCount = pick([0, 1, 3]); const pendingFileCount = pick([0, 2]);
      const errs: Record<string, string> = {};
      if (!galTitle.trim()) errs.galTitle = 'Judul Kegiatan wajib diisi';
      if (!galDesc.trim()) errs.galDesc = 'Deskripsi Singkat Acara wajib diisi';
      if (divisionCount === 0) errs.galDivision = 'Divisi masih kosong pada periode ini. Silakan buat divisi baru terlebih dahulu di tab Divisi.';
      else if (!hasSelectedDivision) errs.galDivision = 'Divisi penyelenggara wajib dipilih';
      if (!(pendingFileCount > 0) && !(photoUrlCount > 0)) errs.galPhotos = 'Wajib memilih salah satu: unggah file foto dari komputer ATAU masukkan tautan foto yang valid';
      eq(collectFieldErrors(galleryCreateSchema({ divisionCount, hasSelectedDivision }), { galTitle, galDesc, photoUrlCount, pendingFileCount }), errs);
    }
  });

  it('form', () => {
    for (let i = 0; i < N; i++) {
      const v = {
        newFormTitle: pick(TEXTS), newFormCategory: pick(TEXTS), newFormDeadline: pick(TEXTS),
        newFormIsLimited: pick(BOOLS), newFormMaxQuota: pick(NUMS), newFormIsEventConnected: pick(BOOLS), newFormEventId: pick(IDS)
      };
      const errs: Record<string, string> = {};
      if (!v.newFormTitle.trim()) errs.newFormTitle = 'Judul Formulir wajib diisi';
      if (!v.newFormCategory.trim()) errs.newFormCategory = 'Kategori Formulir wajib dipilih';
      if (!v.newFormDeadline.trim()) errs.newFormDeadline = 'Batas Akhir / Deadline Pendaftaran wajib ditentukan';
      const mq: any = v.newFormMaxQuota;
      if (v.newFormIsLimited && (!mq || parseInt(mq, 10) <= 0)) errs.newFormMaxQuota = 'Maksimal kuota harus lebih dari 0 jika kuota dibatasi';
      if (v.newFormIsEventConnected && !v.newFormEventId) errs.newFormEventId = 'Silakan pilih event / acara yang terhubung';
      eq(collectFieldErrors(formCreateSchema, v), errs);
    }
  });
});

/** Verbatim copy of the pre-upload checks of the edit dialog's save button. */
function originalEditError(type: string, it: any): string | null {
  if ((type === 'member' || type === 'division' || type === 'department' || type === 'role') && !(it.name || '').trim()) return 'Nama wajib diisi sebelum menyimpan perubahan';
  if ((type === 'gallery' || type === 'tenure' || type === 'form' || type === 'event' || type === 'brand_asset') && !(it.title || '').trim()) return 'Judul wajib diisi sebelum menyimpan perubahan';
  if (type === 'tenure' && !(it.code || '').trim()) return 'Kode tahun periode wajib diisi';
  if (type === 'faq') {
    if (!(it.category || '').trim()) return 'Kategori topik FAQ wajib dipilih';
    if (!(it.question || '').trim() || !(it.answer || '').trim()) return 'Pertanyaan dan jawaban FAQ wajib diisi';
  }
  if (type === 'form') {
    if (!(it.category || '').trim()) return 'Kategori formulir wajib dipilih';
    if (!(it.deadline || '').trim()) return 'Batas Akhir / Deadline Pendaftaran wajib ditentukan';
    if (it.isLimited && (!it.maxQuota || parseInt(it.maxQuota, 10) <= 0)) return 'Maksimal kuota responden harus lebih dari 0 jika kuota dibatasi';
    if (it.isEventConnected && !it.eventId) return 'Silakan pilih Acara / Event yang terhubung';
  }
  if (type === 'kudos' && (!(it.sender || '').trim() || !(it.recipient || '').trim() || !(it.message || '').trim())) return 'Pengirim, penerima, dan pesan apresiasi wajib diisi';
  if (type === 'gallery') {
    if (!it.divisionId && !it.division) return 'Divisi penyelenggara wajib dipilih untuk galeri';
    if (!(it.description || '').trim()) return 'Deskripsi kegiatan wajib diisi untuk galeri';
  }
  if (type === 'event') {
    const catVal = (it.kategori || it.category || it.badge || '').trim();
    if (!catVal) return 'Kategori program/kegiatan wajib dipilih';
    if (!it.divisionId) return 'Divisi penyelenggara wajib dipilih untuk Event';
    if (!it.startDate) return 'Tanggal & Jam Mulai event wajib diisi';
    if (!it.endDate) return 'Tanggal & Jam Berakhir event wajib diisi';
    if (toDatetimeLocalValue(it.startDate) > toDatetimeLocalValue(it.endDate)) return 'Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir';
    if (!(it.description || '').trim()) return 'Deskripsi kegiatan event wajib diisi';
    if (it.isLimited) {
      const mq = Number(it.maxQuota || 0);
      if (!mq || mq <= 0) return 'Batas maksimal kuota wajib diisi angka lebih dari 0';
    }
    if (it.totalRab === '' || it.totalRab === undefined || it.totalRab === null || isNaN(Number(it.totalRab)) || Number(it.totalRab) < 0) return 'Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)';
  }
  if (type === 'brand_asset') {
    if (!(it.category || '').trim()) return 'Kategori katalog asset wajib dipilih';
    if (!(it.fileType || '').trim()) return 'Format file asset wajib diisi';
  }
  return null;
}

describe('edit dialog matches the original checks', () => {
  const TYPES = ['member', 'division', 'department', 'role', 'tenure', 'faq', 'form', 'kudos', 'gallery', 'event', 'brand_asset', 'unknown'];
  it('first error per item type', () => {
    for (let i = 0; i < N * 4; i++) {
      const item: Record<string, any> = {};
      const maybe = (key: string, values: readonly unknown[]) => { if (rand() > 0.15) item[key] = pick(values); };
      maybe('name', TEXTS); maybe('title', TEXTS); maybe('code', TEXTS); maybe('category', TEXTS); maybe('kategori', TEXTS);
      maybe('badge', TEXTS); maybe('question', TEXTS); maybe('answer', TEXTS); maybe('deadline', TEXTS);
      maybe('isLimited', BOOLS); maybe('maxQuota', NUMS); maybe('isEventConnected', BOOLS); maybe('eventId', IDS);
      maybe('sender', TEXTS); maybe('recipient', TEXTS); maybe('message', TEXTS); maybe('divisionId', IDS); maybe('division', TEXTS);
      maybe('description', TEXTS); maybe('startDate', DATES); maybe('endDate', DATES); maybe('totalRab', NUMS); maybe('fileType', TEXTS);
      const type = pick(TYPES);
      eq(editItemError(type, item), originalEditError(type, item));
    }
  });
});

describe('sign-in and admin accounts match the original checks', () => {
  it('login', () => {
    for (let i = 0; i < N; i++) {
      const loginEmail = pick(EMAILS); const loginPassword = pick(TEXTS);
      const errs: Record<string, string> = {};
      if (!/\S+@\S+\.\S+/.test(loginEmail.trim())) errs.loginEmail = 'Email admin wajib diisi dengan format yang valid';
      if (!loginPassword) errs.loginPassword = 'Password wajib diisi';
      eq(collectFieldErrors(loginSchema, { loginEmail, loginPassword }), errs);
    }
  });

  it('admin account (first message, as the panel showed it)', () => {
    for (let i = 0; i < N; i++) {
      const v = { email: pick(EMAILS), displayName: pick(TEXTS), role: pick(['super_admin', 'division_admin'] as const), divisionId: pick(IDS) };
      let expected = '';
      if (!/\S+@\S+\.\S+/.test(v.email.trim())) expected = 'Masukkan email akun yang valid.';
      else if (v.role === 'division_admin' && !v.divisionId) expected = 'Pilih divisi untuk Admin Divisi.';
      const errs = collectFieldErrors(adminAccountSchema, v);
      eq(errs.email || errs.divisionId || '', expected);
    }
  });
});
