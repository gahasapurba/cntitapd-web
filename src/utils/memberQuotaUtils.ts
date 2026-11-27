/**
 * Dynamic Organization Roles & Quota Management for CNT IT APD
 * 
 * Arsitektur Terpadu Pengaturan Organisasi per Kepengurusan (Tenure):
 * Setiap kepengurusan memiliki daftar role/jabatan dengan 4 atribut utama:
 * 1. name: Nama Jabatan (misal: "Pembina", "Ketua", "Sekretaris Jenderal", "Pimpro", dll.)
 * 2. level: Tingkatan di Organigram (0: Penasehat, 1: Pembina, 2: Ketua/Wakil, 3: BPH/Inti, 4: Pimpro, 5: Anggota)
 * 3. max: Batas Maksimal Kuota (0 = Unlimited / Tanpa Batas)
 * 4. requiresDivision: Boolean (apakah memerlukan pilihan divisi penugasan)
 */

import type { AppItem } from '../lib/supabase';

export type MemberCategory = 'penasehat' | 'pembina' | 'inti' | 'pimpro' | 'anggota';

/** A role normalized from tenure_roles rows or the legacy role_quotas setting. */
export interface TenureRole {
  id: string;
  tenureId: string | null | undefined;
  name: string;
  level: number;
  max: number;
  maxQuota: number;
  requiresDivision: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface MemberAssignment {
  tenureId?: string | null;
  roleId?: string | null;
  role?: string;
  divisionId?: string | null;
  excludeMemberId?: string | null;
}

export type QuotaValidation =
  | { isValid: true; error: null; roleObj: TenureRole }
  | { isValid: false; field: 'memRole' | 'memDivisionId' | 'memSubDivisionId'; error: string };

export const LEVEL_OPTIONS: { level: number; label: string; shortLabel: string; defaultCategory: MemberCategory }[] = [
  { level: 0, label: 'Level 0 (Tingkat Puncak Bagan)', shortLabel: 'Level 0', defaultCategory: 'penasehat' },
  { level: 1, label: 'Level 1 (Tingkat Pembina / Advisor)', shortLabel: 'Level 1', defaultCategory: 'pembina' },
  { level: 2, label: 'Level 2 (Tingkat Pimpinan)', shortLabel: 'Level 2', defaultCategory: 'inti' },
  { level: 3, label: 'Level 3 (Tingkat BPH / Pengurus Harian)', shortLabel: 'Level 3', defaultCategory: 'inti' },
  { level: 4, label: 'Level 4 (Tingkat Pimpinan Divisi)', shortLabel: 'Level 4', defaultCategory: 'pimpro' },
  { level: 5, label: 'Level 5 (Tingkat Anggota Divisi)', shortLabel: 'Level 5', defaultCategory: 'anggota' }
];

export function getCategoryFromLevel(level: unknown): MemberCategory {
  switch (Number(level)) {
    case 0: return 'penasehat';
    case 1: return 'pembina';
    case 2: return 'inti';
    case 3: return 'inti';
    case 4: return 'pimpro';
    case 5:
    default:
      return 'anggota';
  }
}

/**
 * Format label dropdown tingkatan organigram dengan menampilkan role database setelah tanda titik dua (:).
 * Jika di database belum ada role pada level tersebut, menampilkan "(Belum ada role)" - tanpa teks role bawaan.
 */
export function formatLevelOptionLabel(
  lvl: number | string | { level: number },
  tenureRoles: AppItem[] = [],
  targetTenureId: string | null = null,
  short = false
): string {
  const levelNum = typeof lvl === 'object' ? lvl.level : Number(lvl);

  const rolesInTenure = targetTenureId
    ? (tenureRoles || []).filter(r => r.tenureId === targetTenureId)
    : (tenureRoles || []);
  const matched = rolesInTenure.filter(r => Number(r.level) === levelNum);
  const roleNames = Array.from(new Set(matched.map(r => String(r.name || '').trim()).filter(Boolean)));

  if (roleNames.length > 0) {
    return short 
      ? `Level ${levelNum} (${roleNames.join(', ')})`
      : `Level ${levelNum}: ${roleNames.join(', ')}`;
  }

  // Jika di database belum ada role terdaftar untuk level ini pada periode terpilih:
  return short 
    ? `Level ${levelNum}` 
    : `Level ${levelNum}: (Belum ada role)`;
}

/**
 * Mengambil daftar role resmi untuk tenure tertentu dari database (tenureRoles) atau konfigurasi cloud.
 * Jika belum ada role terdaftar untuk periode ini, TETAP KOSONG ([]) - TANPA FALLBACK DEFAULT.
 */
export function getTenureRoles(
  tenureId: string | null | undefined,
  roleQuotas: AppItem | AppItem[] | null = {},
  tenureRoles: AppItem[] | null = []
): TenureRole[] {
  // 1. Jika argumen roleQuotas berupa array langsung (daftar tenureRoles)
  if (Array.isArray(roleQuotas)) {
    const fromArray = roleQuotas.filter(r => !tenureId || r.tenureId === tenureId);
    return fromArray.map((r, idx) => ({
      id: r.id || `role-${idx}`,
      tenureId: r.tenureId || tenureId,
      name: String(r.name || 'Jabatan').trim(),
      level: Number(r.level ?? 5),
      max: Number(r.max ?? r.maxQuota ?? 0),
      maxQuota: Number(r.maxQuota ?? r.max ?? 0),
      requiresDivision: Boolean(r.requiresDivision),
      sortOrder: Number(r.sortOrder ?? idx),
      createdAt: r.createdAt || '',
      updatedAt: r.updatedAt || r.createdAt || null
    }));
  }

  // 2. Jika argumen ke-3 tenureRoles berupa array dari database
  if (Array.isArray(tenureRoles)) {
    const fromArray = tenureRoles.filter(r => !tenureId || r.tenureId === tenureId);
    return fromArray.map((r, idx) => ({
      id: r.id || `role-${idx}`,
      tenureId: r.tenureId || tenureId,
      name: String(r.name || 'Jabatan').trim(),
      level: Number(r.level ?? 5),
      max: Number(r.max ?? r.maxQuota ?? 0),
      maxQuota: Number(r.maxQuota ?? r.max ?? 0),
      requiresDivision: Boolean(r.requiresDivision),
      sortOrder: Number(r.sortOrder ?? idx),
      createdAt: r.createdAt || '',
      updatedAt: r.updatedAt || r.createdAt || null
    }));
  }

  const config = (roleQuotas && typeof roleQuotas === 'object' && (roleQuotas as AppItem)[String(tenureId)])
    ? (roleQuotas as AppItem)[String(tenureId)]
    : null;

  // 3. Jika format array roles di roleQuotas
  if (config && Array.isArray(config.roles)) {
    return config.roles.map((r: AppItem, idx: number) => ({
      id: r.id || `role-${idx}-${Date.now()}`,
      tenureId: r.tenureId || tenureId,
      name: String(r.name || 'Jabatan').trim(),
      level: Number(r.level ?? 5),
      max: Number(r.max ?? r.maxQuota ?? 0),
      maxQuota: Number(r.maxQuota ?? r.max ?? 0),
      requiresDivision: Boolean(r.requiresDivision),
      sortOrder: Number(r.sortOrder ?? idx),
      createdAt: r.createdAt || '',
      updatedAt: r.updatedAt || r.createdAt || null
    }));
  }

  // Jika belum ada role di database/konfigurasi, TIDAK ADA fallback default role: tetap kosong
  return [];
}

/**
 * Mencari kecocokan objek role dari identitas roleId atau teks nama role member.
 */
export function findMatchingRole<R extends AppItem>(member: AppItem | null | undefined, tenureRoles: R[] = []): R | null {
  if (!member) return null;
  const roleId = member.roleId;
  const roleName = String(member.role || '').toLowerCase().trim();
  const category = String(member.category || '').toLowerCase().trim();

  // 1. Cocokkan by roleId langsung
  if (roleId) {
    const found = tenureRoles.find(r => r.id === roleId);
    if (found) return found;
  }

  // 2. Cocokkan by nama eksak
  const exact = tenureRoles.find(r => r.name.toLowerCase().trim() === roleName);
  if (exact) return exact;

  // 3. Cocokkan parsial (prioritaskan nama role yang lebih panjang/spesifik terlebih dahulu)
  const sortedRoles = [...tenureRoles].sort((a, b) => (b.name || '').length - (a.name || '').length);
  const byPrefix = sortedRoles.find(r => roleName.startsWith(r.name.toLowerCase().trim()));
  if (byPrefix) return byPrefix;

  const partial = sortedRoles.find(r => {
    const rLower = r.name.toLowerCase().trim();
    return roleName.includes(rLower) || rLower.includes(roleName);
  });
  if (partial) return partial;

  // 4. Fallback by category
  if (category === 'penasehat') return tenureRoles.find(r => r.level === 0) || null;
  if (category === 'pembina') return tenureRoles.find(r => r.level === 1) || null;
  if (category === 'pimpro') return tenureRoles.find(r => r.level === 4) || null;
  if (category === 'anggota') return tenureRoles.find(r => r.level === 5) || null;
  if (category === 'inti') return tenureRoles.find(r => r.level === 2 || r.level === 3) || null;

  return null;
}

/**
 * Mendapatkan tingkatan level organigram (0 s/d 5) untuk anggota tertentu.
 */
export function getMemberLevel(member: AppItem | null | undefined, tenureRoles: AppItem[] = []): number {
  const matched = findMatchingRole(member, tenureRoles);
  if (matched) return matched.level;

  const role = String(member?.role || '').toLowerCase();
  const cat = String(member?.category || '').toLowerCase();

  if (cat === 'penasehat' || role.includes('penasehat') || role.includes('penasihat')) return 0;
  if (cat === 'pembina' || role.includes('pembina')) return 1;
  if (cat === 'inti') {
    if (role.includes('ketua') || role.includes('wakil')) return 2;
    return 3;
  }
  if (cat === 'pimpro' || role.includes('pimpro')) return 4;
  return 5;
}

/**
 * Validasi Hapus Role: Cek apakah masih ada member yang menggunakan role ini.
 */
export function canDeleteRole(
  role: AppItem | null | undefined,
  tenureId: string | null | undefined,
  members: AppItem[] = []
): { canDelete: boolean; count: number; members: AppItem[]; reason?: string } {
  if (!role) return { canDelete: true, count: 0, members: [] };
  const targetMembers = (members || []).filter(m => (!tenureId || m.tenureId === tenureId));
  const roleNameLower = String(role.name || '').toLowerCase().trim();

  const dependentMembers = targetMembers.filter(m => {
    if (m.roleId && m.roleId === role.id) return true;
    const mRole = String(m.role || '').toLowerCase().trim();
    if (mRole === roleNameLower) return true;
    if (role.requiresDivision && mRole.startsWith(roleNameLower)) return true;
    return false;
  });

  if (dependentMembers.length > 0) {
    const sampleNames = dependentMembers.slice(0, 3).map(m => `"${m.name}"`).join(', ');
    const more = dependentMembers.length > 3 ? ` dan ${dependentMembers.length - 3} lainnya` : '';
    return {
      canDelete: false,
      count: dependentMembers.length,
      members: dependentMembers,
      reason: `Tidak dapat menghapus role "${role.name}" karena masih digunakan oleh ${dependentMembers.length} anggota (${sampleNames}${more}). Harap ubah role anggota terkait terlebih dahulu sebelum menghapus role ini.`
    };
  }

  return { canDelete: true, count: 0, members: [] };
}

/**
 * Validasi penugasan member terhadap daftar role resmi & kuota organisasi.
 */
export function validateMemberQuota(
  { tenureId, roleId, role = '', divisionId, excludeMemberId = null }: MemberAssignment,
  members: AppItem[] = [],
  divisions: AppItem[] = [],
  roleQuotas: AppItem | AppItem[] | null = {},
  tenureRoles: AppItem[] | null = []
): QuotaValidation {
  const targetTenureId = tenureId || '';
  const resolvedRoles = getTenureRoles(targetTenureId, roleQuotas, tenureRoles);

  // Cari role yang dimaksud
  const roleObj = resolvedRoles.find(r => 
    (roleId && r.id === roleId) ||
    (role && r.name.toLowerCase().trim() === role.toLowerCase().trim()) ||
    (role && (r.name.toLowerCase().startsWith(role.toLowerCase()) || role.toLowerCase().startsWith(r.name.toLowerCase())))
  );

  if (!roleObj) {
    return {
      isValid: false,
      field: 'memRole',
      error: `Jabatan / Role "${role || 'yang dipilih'}" belum didaftarkan di Pengaturan Organisasi untuk periode ini.`
    };
  }

  // 1. Validasi Keharusan Pilihan Divisi
  if (roleObj.requiresDivision && !divisionId) {
    return {
      isValid: false,
      field: 'memDivisionId',
      error: `Jabatan "${roleObj.name}" memerlukan pilihan Divisi Penugasan.`
    };
  }

  // 2. Validasi Batas Maksimal Kuota (jika max > 0)
  const maxQuota = Number(roleObj.max || 0);
  if (maxQuota > 0) {
    const targetMembers = (members || []).filter(m => 
      (!targetTenureId || m.tenureId === targetTenureId) &&
      m.id !== excludeMemberId
    );

    if (roleObj.requiresDivision) {
      // Kuota per divisi
      const existingInDiv = targetMembers.filter(m => {
        const matchesThisRole = (m.roleId === roleObj.id) || 
          String(m.role || '').toLowerCase().startsWith(roleObj.name.toLowerCase());
        return matchesThisRole && m.divisionId === divisionId;
      });

      if (existingInDiv.length >= maxQuota) {
        const divObj = (divisions || []).find(d => d.id === divisionId);
        const divName = divObj?.name || 'divisi ini';
        const names = existingInDiv.map(e => `"${e.name}"`).join(', ');
        return {
          isValid: false,
          field: 'memDivisionId',
          error: `Divisi "${divName}" sudah mencapai batas maksimal untuk jabatan "${roleObj.name}" (maksimal ${maxQuota} orang). Saat ini diisi oleh: ${names}.`
        };
      }
    } else {
      // Kuota global periode
      const existingGlobal = targetMembers.filter(m => {
        return (m.roleId === roleObj.id) ||
          String(m.role || '').toLowerCase().trim() === roleObj.name.toLowerCase().trim();
      });

      if (existingGlobal.length >= maxQuota) {
        const names = existingGlobal.map(e => `"${e.name}"`).join(', ');
        return {
          isValid: false,
          field: 'memRole',
          error: `Batas kuota untuk jabatan "${roleObj.name}" telah terpenuhi (maksimal ${maxQuota} orang untuk periode ini). Saat ini diisi oleh: ${names}.`
        };
      }
    }
  }

  return { isValid: true, error: null, roleObj };
}

/**
 * Ringkasan status keterisian semua role dalam suatu kepengurusan.
 */
export function getTenureQuotaSummary(
  tenureId: string | null | undefined,
  members: AppItem[] = [],
  divisions: AppItem[] = [],
  roleQuotas: AppItem | AppItem[] | null = {},
  tenureRoles: AppItem[] | null = []
) {
  const roles = getTenureRoles(tenureId, roleQuotas, tenureRoles);
  const targetMembers = (members || []).filter(m => !tenureId || m.tenureId === tenureId);
  const targetDivisions = (divisions || []).filter(d => !tenureId || d.tenureId === tenureId);

  const roleSummaries = roles.map(role => {
    const matched = targetMembers.filter(m => {
      if (m.roleId && m.roleId === role.id) return true;
      const mRole = String(m.role || '').toLowerCase().trim();
      const rName = role.name.toLowerCase().trim();
      return mRole === rName || (role.requiresDivision && mRole.startsWith(rName));
    });

    return {
      ...role,
      current: matched.length,
      members: matched
    };
  });

  return {
    roles: roleSummaries,
    totalMembers: targetMembers.length,
    totalDivisions: targetDivisions.length
  };
}

/**
 * Backward compatibility helper for legacy code
 */
export function getMemberRoleType(category: string | null = '', role: string | null = '', title: string | null = ''): string {
  const cat = String(category || '').toLowerCase().trim();
  const text = `${role} ${title}`.toLowerCase();

  if (cat === 'penasehat' || text.includes('penasehat') || text.includes('penasihat')) return 'penasehat';
  if (cat === 'pembina') return 'pembina';
  if (cat === 'pimpro') return 'pimpro';
  if (cat === 'anggota') return 'anggota';

  if (cat === 'inti') {
    if (text.includes('wakil')) return 'wakil_ketua';
    if (text.includes('ketua')) return 'ketua';
    if (text.includes('sekretaris jenderal') || text.includes('sekjen')) return 'sekjen';
    if (text.includes('sekben') || text.includes('sekretaris') || text.includes('bendahara')) return 'sekben';
    return 'inti_lainnya';
  }

  return 'anggota';
}

/**
 * Mengelompokkan anggota divisi menjadi pimpinan (leaders) dan anggota biasa (members)
 * murni berdasarkan data relasional DB: role_id, level, requires_division, dan sort_order.
 * Tanpa hardcoded string/kata kunci teks.
 */
export function getDivisionStructure(
  division: AppItem | null | undefined,
  members: AppItem[] = [],
  tenureRoles: AppItem[] = []
): { leaders: AppItem[]; members: AppItem[] } {
  if (!division) return { leaders: [], members: [] };
  const divMembers = (members || []).filter(m => m.divisionId === division.id);
  if (divMembers.length === 0) return { leaders: [], members: [] };

  // Map setiap member ke role DB-nya
  const mapped = divMembers.map(m => {
    const roleObj = findMatchingRole(m, tenureRoles);
    const level = roleObj ? Number(roleObj.level) : 5;
    const roleSortOrder = roleObj ? Number(roleObj.sortOrder ?? 0) : 999;
    const memberSortOrder = Number(m.sortOrder ?? 0);
    return {
      member: m,
      roleObj,
      roleName: roleObj?.name || m.role || '',
      level,
      roleSortOrder,
      memberSortOrder
    };
  });

  // Cari level tertinggi (angka terkecil) di divisi ini dari database
  const minLevel = Math.min(...mapped.map(item => item.level));

  // Semua anggota yang memegang role di tingkatan tertinggi divisi (minLevel) adalah pimpinan (leaders).
  // Jika sama-sama Level 3 atau sama-sama Level 4, otomatis keduanya setara sebagai pimpinan!
  const leaderItems = mapped.filter(item => item.level === minLevel);
  // Anggota divisi dengan tingkatan level di bawahnya (angka level lebih besar) masuk ke members
  const memberItems = mapped.filter(item => item.level > minLevel);

  // Pengurutan leaders di bagan murni berdasarkan sort_order dari DB (tenure_roles.sort_order lalu members.sort_order)
  leaderItems.sort((a, b) => (a.roleSortOrder - b.roleSortOrder) || (a.memberSortOrder - b.memberSortOrder));
  memberItems.sort((a, b) => (a.roleSortOrder - b.roleSortOrder) || (a.memberSortOrder - b.memberSortOrder));

  return {
    leaders: leaderItems.map(l => l.member),
    members: memberItems.map(m => m.member)
  };
}

/**
 * Menemukan pimpinan utama divisi secara dinamis dari database.
 * Diambil dari pimpinan tertinggi (level terkecil) dengan sort_order pertama di DB.
 * Murni berbasis data DB tanpa pengecekan string manual.
 */
export function getDivisionLead(
  division: AppItem | null | undefined,
  members: AppItem[] = [],
  tenureRoles: AppItem[] = []
): { member: AppItem | null; name: string; roleName: string } {
  if (!division) return { member: null, name: '', roleName: '' };
  const { leaders } = getDivisionStructure(division, members, tenureRoles);
  if (leaders.length > 0) {
    const primary = leaders[0];
    const roleObj = findMatchingRole(primary, tenureRoles);
    return {
      member: primary,
      name: primary.name,
      roleName: roleObj?.name || primary.role || 'Pimpinan'
    };
  }

  const byId = (members || []).find(m => m.id === division.memberId);
  if (byId) {
    const roleObj = findMatchingRole(byId, tenureRoles);
    return {
      member: byId,
      name: byId.name,
      roleName: roleObj?.name || byId.role || 'Pimpinan'
    };
  }

  return {
    member: null,
    name: division.leadName || '',
    roleName: ''
  };
}
