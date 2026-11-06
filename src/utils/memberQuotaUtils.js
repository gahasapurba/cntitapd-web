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

export const LEVEL_OPTIONS = [
  { level: 0, label: 'Level 0: Dewan Penasehat (Puncak Tertinggi Bagan)', shortLabel: 'Level 0 (Penasehat)', defaultCategory: 'penasehat' },
  { level: 1, label: 'Level 1: Pembina / Advisor', shortLabel: 'Level 1 (Pembina)', defaultCategory: 'pembina' },
  { level: 2, label: 'Level 2: Ketua & Wakil Ketua (Pimpinan Inti)', shortLabel: 'Level 2 (Ketua/Wakil)', defaultCategory: 'inti' },
  { level: 3, label: 'Level 3: BPH / Pengurus Harian (Sekben, Sekjen, Bendahara, dll.)', shortLabel: 'Level 3 (BPH/Inti)', defaultCategory: 'inti' },
  { level: 4, label: 'Level 4: Pimpinan Divisi / Pimpro / Koordinator', shortLabel: 'Level 4 (Pimpro)', defaultCategory: 'pimpro' },
  { level: 5, label: 'Level 5: Anggota Divisi / Staff', shortLabel: 'Level 5 (Anggota)', defaultCategory: 'anggota' }
];

export const DEFAULT_TENURE_ROLES = [
  { id: 'role-pembina', name: 'Pembina', level: 1, max: 1, requiresDivision: false },
  { id: 'role-ketua', name: 'Ketua', level: 2, max: 1, requiresDivision: false },
  { id: 'role-wakil-ketua', name: 'Wakil Ketua', level: 2, max: 1, requiresDivision: false },
  { id: 'role-sekben', name: 'Sekretaris Bendahara', level: 3, max: 2, requiresDivision: false },
  { id: 'role-pimpro', name: 'Pimpro', level: 4, max: 1, requiresDivision: true },
  { id: 'role-anggota', name: 'Anggota Divisi', level: 5, max: 0, requiresDivision: true }
];

export function getCategoryFromLevel(level) {
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
 */
export function formatLevelOptionLabel(lvl, tenureRoles = [], targetTenureId = null, short = false) {
  const levelNum = typeof lvl === 'object' ? lvl.level : Number(lvl);
  const baseLvlObj = LEVEL_OPTIONS.find(l => l.level === levelNum) || { level: levelNum, label: `Level ${levelNum}`, shortLabel: `Level ${levelNum}` };

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

  return short ? baseLvlObj.shortLabel : baseLvlObj.label;
}

/**
 * Mengambil daftar role resmi untuk tenure tertentu dari database (tenureRoles) atau konfigurasi cloud.
 * Jika belum ada role terdaftar untuk periode ini, TETAP KOSONG ([]) - TANPA FALLBACK DEFAULT.
 */
export function getTenureRoles(tenureId, roleQuotas = {}, tenureRoles = []) {
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

  const config = (roleQuotas && typeof roleQuotas === 'object' && roleQuotas[tenureId])
    ? roleQuotas[tenureId]
    : null;

  // 3. Jika format array roles di roleQuotas
  if (config && Array.isArray(config.roles)) {
    return config.roles.map((r, idx) => ({
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
export function findMatchingRole(member, tenureRoles = []) {
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

  // 3. Cocokkan parsial (misal: "Pimpro Experience" -> role "Pimpro")
  const partial = tenureRoles.find(r => {
    const rLower = r.name.toLowerCase().trim();
    return roleName.startsWith(rLower) || roleName.includes(rLower) || rLower.includes(roleName);
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
export function getMemberLevel(member, tenureRoles = []) {
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
export function canDeleteRole(role, tenureId, members = []) {
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
  { tenureId, roleId, role = '', divisionId, excludeMemberId = null },
  members = [],
  divisions = [],
  roleQuotas = {},
  tenureRoles = []
) {
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
export function getTenureQuotaSummary(tenureId, members = [], divisions = [], roleQuotas = {}, tenureRoles = []) {
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
export function getMemberRoleType(category = '', role = '', title = '') {
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
