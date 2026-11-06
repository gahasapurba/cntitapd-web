/**
 * Member Quota & Role Validation Utilities for CNT IT APD
 * Default Quotas per Tenure (Dapat dikonfigurasi dinamis per periode):
 * 1. Pembina: Default 1 orang (Tahun Ini)
 * 2. Ketua: Default 1 orang
 * 3. Wakil Ketua: Default 1 orang
 * 4. Pimpro (Ketua Divisi): Default 1 orang per masing-masing divisi
 * 5. Sekretaris & Bendahara: Default 2 orang
 * 6. Role / Jabatan Kustom (e.g. Penasehat, Sekretaris Jenderal, dll.): Fleksibel per periode
 * 7. Anggota Divisi: Tidak terbatas (unlimited)
 */

export const DEFAULT_QUOTAS = {
  pembina: 1,
  pembinaName: 'Pembina',
  ketua: 1,
  ketuaName: 'Ketua',
  wakilKetua: 1,
  wakilKetuaName: 'Wakil Ketua',
  disableWakil: false,
  sekben: 2,
  sekbenName: 'Sekretaris Bendahara',
  disableSekben: false,
  pimproPerDivisi: 1,
  customRoles: []
};

export function getTenureQuotas(tenureId, roleQuotas = {}) {
  const config = (roleQuotas && typeof roleQuotas === 'object' && roleQuotas[tenureId])
    ? roleQuotas[tenureId]
    : ((roleQuotas && typeof roleQuotas === 'object' && roleQuotas.default) || DEFAULT_QUOTAS);

  const customRoles = Array.isArray(config?.customRoles) ? config.customRoles : [];
  const disableSekben = Boolean(config?.disableSekben || config?.sekben === 0);
  const disableWakil = Boolean(config?.disableWakil || config?.wakilKetua === 0);

  return {
    pembina: config?.pembina !== undefined ? Math.max(1, Number(config.pembina)) : DEFAULT_QUOTAS.pembina,
    pembinaName: config?.pembinaName || DEFAULT_QUOTAS.pembinaName,
    ketua: config?.ketua !== undefined ? Math.max(1, Number(config.ketua)) : DEFAULT_QUOTAS.ketua,
    ketuaName: config?.ketuaName || DEFAULT_QUOTAS.ketuaName,
    wakilKetua: disableWakil ? 0 : (config?.wakilKetua !== undefined ? Math.max(0, Number(config.wakilKetua)) : DEFAULT_QUOTAS.wakilKetua),
    wakilKetuaName: config?.wakilKetuaName || DEFAULT_QUOTAS.wakilKetuaName,
    disableWakil,
    sekben: disableSekben ? 0 : (config?.sekben !== undefined ? Math.max(0, Number(config.sekben)) : DEFAULT_QUOTAS.sekben),
    sekbenName: config?.sekbenName || DEFAULT_QUOTAS.sekbenName,
    disableSekben,
    pimproPerDivisi: config?.pimproPerDivisi !== undefined ? Math.max(1, Number(config.pimproPerDivisi)) : DEFAULT_QUOTAS.pimproPerDivisi,
    customRoles
  };
}

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

/**
 * Returns summary of current filled positions and quotas for a given tenure.
 */
export function getTenureQuotaSummary(tenureId, members = [], divisions = [], roleQuotas = {}) {
  const quotas = getTenureQuotas(tenureId, roleQuotas);
  const targetMembers = (members || []).filter(m => !tenureId || m.tenureId === tenureId);
  const targetDivisions = (divisions || []).filter(d => !tenureId || d.tenureId === tenureId);

  const penasehats = targetMembers.filter(m => getMemberRoleType(m.category, m.role, m.title) === 'penasehat');
  const pembinas = targetMembers.filter(m => m.category === 'pembina' && !penasehats.includes(m));
  const ketuas = targetMembers.filter(m => getMemberRoleType(m.category, m.role, m.title) === 'ketua');
  const wakilKetuas = targetMembers.filter(m => getMemberRoleType(m.category, m.role, m.title) === 'wakil_ketua');
  const sekbens = targetMembers.filter(m => getMemberRoleType(m.category, m.role, m.title) === 'sekben');

  const pimproByDivision = {};
  targetDivisions.forEach(div => {
    const pimpros = targetMembers.filter(m => 
      m.category === 'pimpro' && 
      (m.divisionId === div.id || (!m.divisionId && div.leadName && m.name && m.name.toLowerCase() === div.leadName.toLowerCase()))
    );
    pimproByDivision[div.id] = {
      divisionId: div.id,
      divisionName: div.name,
      current: pimpros.length,
      max: quotas.pimproPerDivisi,
      members: pimpros
    };
  });

  // Calculate dynamic custom role quotas
  const customRoleSummaries = {};
  (quotas.customRoles || []).forEach(cr => {
    if (!cr || !cr.name) return;
    const search = cr.name.toLowerCase().trim();
    const matched = targetMembers.filter(m => {
      const r = (m.role || '').toLowerCase();
      const cat = (m.category || '').toLowerCase();
      if (search === 'penasehat' || search === 'penasihat') {
        return cat === 'penasehat' || r.includes('penasehat') || r.includes('penasihat');
      }
      return r.includes(search) || (cr.category && cat === cr.category.toLowerCase() && r.includes(search));
    });
    customRoleSummaries[cr.id || cr.name] = {
      id: cr.id || cr.name,
      name: cr.name,
      current: matched.length,
      max: Number(cr.max || 1),
      category: cr.category || 'inti',
      members: matched
    };
  });

  const penasehatRoleObj = (quotas.customRoles || []).find(r => r.name.toLowerCase().includes('penasehat') || r.name.toLowerCase().includes('penasihat'));
  const hasPenasehatInQuota = Boolean(penasehatRoleObj && Number(penasehatRoleObj.max) > 0);

  return {
    quotas,
    hasPenasehatInQuota,
    penasehat: { current: penasehats.length, max: penasehatRoleObj ? Number(penasehatRoleObj.max) : 0, members: penasehats },
    pembina: { current: pembinas.length, max: quotas.pembina, members: pembinas },
    ketua: { current: ketuas.length, max: quotas.ketua, members: ketuas },
    wakilKetua: { current: wakilKetuas.length, max: quotas.wakilKetua, members: wakilKetuas },
    sekben: { current: sekbens.length, max: quotas.sekben, members: sekbens },
    pimproByDivision,
    customRoleSummaries
  };
}

/**
 * Validates whether adding or updating a member satisfies the quota constraints.
 * Returns { isValid: boolean, error: string | null }
 */
export function validateMemberQuota(
  { tenureId, category, role = '', title = '', divisionId, excludeMemberId = null },
  members = [],
  divisions = [],
  roleQuotas = {}
) {
  const targetTenureId = tenureId || '';
  const quotas = getTenureQuotas(targetTenureId, roleQuotas);
  const roleType = getMemberRoleType(category, role, title);
  const roleLower = String(role || '').toLowerCase();

  // 0. Penasehat: HANYA BOLEH diinput jika jabatan Penasehat telah didaftarkan di "⚙️ Atur Kuota"
  if (category === 'penasehat' || roleType === 'penasehat') {
    const penasehatRole = (quotas.customRoles || []).find(
      cr => cr.name.toLowerCase().includes('penasehat') || cr.name.toLowerCase().includes('penasihat')
    );
    if (!penasehatRole || Number(penasehatRole.max) <= 0) {
      return {
        isValid: false,
        field: 'memCategory',
        error: 'Jabatan / Kategori Penasehat belum didaftarkan di "⚙️ Atur Kuota" untuk periode ini. Silakan tambahkan role Penasehat dan tentukan kuotanya terlebih dahulu di panel Atur Kuota.'
      };
    }
  }

  // 1. Cek Kuota Custom Roles Terdaftar Terlebih Dahulu
  for (const cr of (quotas.customRoles || [])) {
    if (!cr || !cr.name) continue;
    const crNameLower = cr.name.toLowerCase().trim();
    const isCustomMatch = roleLower.includes(crNameLower) || 
      ((crNameLower.includes('penasehat') || crNameLower.includes('penasihat')) && (category === 'penasehat' || roleLower.includes('penasehat') || roleLower.includes('penasihat')));

    if (isCustomMatch) {
      const existing = (members || []).filter(m => 
        (!targetTenureId || m.tenureId === targetTenureId) &&
        m.id !== excludeMemberId &&
        ((m.role || '').toLowerCase().includes(crNameLower) || 
          ((crNameLower.includes('penasehat') || crNameLower.includes('penasihat')) && (m.category === 'penasehat' || (m.role || '').toLowerCase().includes('penasehat') || (m.role || '').toLowerCase().includes('penasihat'))))
      );
      if (existing.length >= Number(cr.max || 1)) {
        const names = existing.map(e => `"${e.name}"`).join(' dan ');
        return {
          isValid: false,
          field: 'memRole',
          error: `Batas kuota ${cr.name} telah terpenuhi (maksimal ${cr.max} orang untuk periode ini). Saat ini sudah diisi oleh ${names}.`
        };
      }
    }
  }

  // 2. Pembina: Maksimal sesuai kuota periode (jika bukan custom role terpisah)
  if ((category === 'pembina' || roleType === 'pembina') && roleType !== 'penasehat') {
    const existing = (members || []).filter(m => 
      (!targetTenureId || m.tenureId === targetTenureId) &&
      m.id !== excludeMemberId &&
      m.category === 'pembina'
    );
    if (existing.length >= quotas.pembina) {
      const names = existing.map(e => `"${e.name}"`).join(' dan ');
      return {
        isValid: false,
        field: 'memCategory',
        error: `Batas kuota ${quotas.pembinaName || 'Pembina'} telah terpenuhi (maksimal ${quotas.pembina} orang untuk periode ini). Saat ini sudah diisi oleh ${names}.`
      };
    }
  }

  // 3. Pengurus Inti
  if (category === 'inti') {
    // 3a. Ketua
    if (roleType === 'ketua') {
      const existing = (members || []).filter(m => 
        (!targetTenureId || m.tenureId === targetTenureId) &&
        m.id !== excludeMemberId &&
        getMemberRoleType(m.category, m.role, m.title) === 'ketua'
      );
      if (existing.length >= quotas.ketua) {
        return {
          isValid: false,
          field: 'memRole',
          error: `Batas kuota ${quotas.ketuaName || 'Ketua'} telah terpenuhi (maksimal ${quotas.ketua} orang untuk periode ini). Saat ini sudah diisi oleh "${existing[0].name}".`
        };
      }
    }

    // 3b. Wakil Ketua
    if (roleType === 'wakil_ketua') {
      if (quotas.disableWakil || quotas.wakilKetua === 0) {
        return {
          isValid: false,
          field: 'memRole',
          error: `Jabatan ${quotas.wakilKetuaName || 'Wakil Ketua'} dinonaktifkan/tidak digunakan pada periode kepengurusan ini.`
        };
      }
      const existing = (members || []).filter(m => 
        (!targetTenureId || m.tenureId === targetTenureId) &&
        m.id !== excludeMemberId &&
        getMemberRoleType(m.category, m.role, m.title) === 'wakil_ketua'
      );
      if (existing.length >= quotas.wakilKetua) {
        return {
          isValid: false,
          field: 'memRole',
          error: `Batas kuota ${quotas.wakilKetuaName || 'Wakil Ketua'} telah terpenuhi (maksimal ${quotas.wakilKetua} orang untuk periode ini). Saat ini sudah diisi oleh "${existing[0].name}".`
        };
      }
    }

    // 3c. Sekretaris & Bendahara (Sekben) - Cek bila bukan custom role khusus
    if (roleType === 'sekben') {
      const hasSpecificCustomRole = (quotas.customRoles || []).some(cr => roleLower.includes(cr.name.toLowerCase()));
      if (!hasSpecificCustomRole) {
        if (quotas.disableSekben || quotas.sekben === 0) {
          return {
            isValid: false,
            field: 'memRole',
            error: `Jabatan ${quotas.sekbenName || 'Sekretaris Bendahara'} telah dihapus/dinonaktifkan pada periode kepengurusan ini.`
          };
        }
        const existing = (members || []).filter(m => 
          (!targetTenureId || m.tenureId === targetTenureId) &&
          m.id !== excludeMemberId &&
          getMemberRoleType(m.category, m.role, m.title) === 'sekben'
        );
        if (existing.length >= quotas.sekben) {
          const names = existing.map(e => `"${e.name}"`).join(' dan ');
          return {
            isValid: false,
            field: 'memRole',
            error: `Batas kuota ${quotas.sekbenName || 'Sekretaris Bendahara'} telah terpenuhi (maksimal ${quotas.sekben} orang untuk periode ini). Saat ini sudah diisi oleh ${names}.`
          };
        }
      }
    }
  }

  // 4. Pimpro / Ketua Divisi: Maksimal kuota per divisi dalam kepengurusan
  if (category === 'pimpro') {
    if (!divisionId) {
      return {
        isValid: false,
        field: 'memDivisionId',
        error: 'Divisi wajib dipilih untuk posisi Pimpro / Ketua Divisi.'
      };
    }

    const existing = (members || []).filter(m => 
      (!targetTenureId || m.tenureId === targetTenureId) &&
      m.id !== excludeMemberId &&
      m.category === 'pimpro' &&
      m.divisionId === divisionId
    );

    if (existing.length >= quotas.pimproPerDivisi) {
      const divObj = (divisions || []).find(d => d.id === divisionId);
      const divName = divObj?.name || 'divisi ini';
      return {
        isValid: false,
        field: 'memDivisionId',
        error: `Divisi "${divName}" sudah memiliki Ketua Divisi / Pimpro (maksimal ${quotas.pimproPerDivisi}). Saat ini dijabat oleh "${existing[0].name}".`
      };
    }
  }

  return { isValid: true, error: null };
}
