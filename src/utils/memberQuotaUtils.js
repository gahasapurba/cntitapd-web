/**
 * Member Quota & Role Validation Utilities for CNT IT APD
 * Default Quotas per Tenure (Dapat dikonfigurasi dinamis per periode):
 * 1. Pembina: Default 1 orang (Tahun Ini)
 * 2. Ketua: Default 1 orang
 * 3. Wakil Ketua: Default 1 orang
 * 4. Pimpro (Ketua Divisi): Default 1 orang per masing-masing divisi
 * 5. Sekretaris & Bendahara: Default 2 orang
 * 6. Anggota Divisi: Tidak terbatas (unlimited)
 */

export const DEFAULT_QUOTAS = {
  pembina: 1,
  ketua: 1,
  wakilKetua: 1,
  sekben: 2,
  pimproPerDivisi: 1
};

export function getTenureQuotas(tenureId, roleQuotas = {}) {
  const config = (roleQuotas && typeof roleQuotas === 'object' && roleQuotas[tenureId])
    ? roleQuotas[tenureId]
    : ((roleQuotas && typeof roleQuotas === 'object' && roleQuotas.default) || DEFAULT_QUOTAS);

  return {
    pembina: Math.max(1, Number(config?.pembina ?? DEFAULT_QUOTAS.pembina)),
    ketua: Math.max(1, Number(config?.ketua ?? DEFAULT_QUOTAS.ketua)),
    wakilKetua: Math.max(0, Number(config?.wakilKetua ?? DEFAULT_QUOTAS.wakilKetua)),
    sekben: Math.max(1, Number(config?.sekben ?? DEFAULT_QUOTAS.sekben)),
    pimproPerDivisi: Math.max(1, Number(config?.pimproPerDivisi ?? DEFAULT_QUOTAS.pimproPerDivisi))
  };
}

export function getMemberRoleType(category = '', role = '', title = '') {
  const cat = String(category || '').toLowerCase().trim();
  const text = `${role} ${title}`.toLowerCase();

  if (cat === 'pembina') return 'pembina';
  if (cat === 'pimpro') return 'pimpro';
  if (cat === 'anggota') return 'anggota';

  if (cat === 'inti') {
    if (text.includes('wakil')) return 'wakil_ketua';
    if (text.includes('ketua')) return 'ketua';
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

  const pembinas = targetMembers.filter(m => m.category === 'pembina');
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

  return {
    quotas,
    pembina: { current: pembinas.length, max: quotas.pembina, members: pembinas },
    ketua: { current: ketuas.length, max: quotas.ketua, members: ketuas },
    wakilKetua: { current: wakilKetuas.length, max: quotas.wakilKetua, members: wakilKetuas },
    sekben: { current: sekbens.length, max: quotas.sekben, members: sekbens },
    pimproByDivision
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

  // 1. Pembina: Maksimal sesuai kuota periode
  if (category === 'pembina' || roleType === 'pembina') {
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
        error: `Batas kuota Pembina telah terpenuhi (maksimal ${quotas.pembina} Pembina untuk periode ini). Saat ini sudah diisi oleh ${names}.`
      };
    }
  }

  // 2. Pengurus Inti
  if (category === 'inti') {
    // 2a. Ketua
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
          error: `Batas kuota Ketua telah terpenuhi (maksimal ${quotas.ketua} Ketua untuk periode ini). Saat ini sudah diisi oleh "${existing[0].name}".`
        };
      }
    }

    // 2b. Wakil Ketua
    if (roleType === 'wakil_ketua') {
      const existing = (members || []).filter(m => 
        (!targetTenureId || m.tenureId === targetTenureId) &&
        m.id !== excludeMemberId &&
        getMemberRoleType(m.category, m.role, m.title) === 'wakil_ketua'
      );
      if (existing.length >= quotas.wakilKetua) {
        return {
          isValid: false,
          field: 'memRole',
          error: `Batas kuota Wakil Ketua telah terpenuhi (maksimal ${quotas.wakilKetua} Wakil Ketua untuk periode ini). Saat ini sudah diisi oleh "${existing[0].name}".`
        };
      }
    }

    // 2c. Sekretaris & Bendahara (Sekben)
    if (roleType === 'sekben') {
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
          error: `Batas kuota Sekretaris Bendahara telah terpenuhi (maksimal ${quotas.sekben} orang untuk periode ini). Saat ini sudah diisi oleh ${names}.`
        };
      }
    }
  }

  // 3. Pimpro / Ketua Divisi: Maksimal kuota per divisi dalam kepengurusan
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
