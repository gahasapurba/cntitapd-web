/**
 * Member Quota & Role Validation Utilities for CNT IT APD
 * Rules per Tenure (Periode Kepengurusan):
 * 1. Pembina: Maksimal 1 orang
 * 2. Ketua: Maksimal 1 orang
 * 3. Wakil Ketua: Maksimal 1 orang
 * 4. Pimpro (Ketua Divisi): Maksimal 1 orang per masing-masing divisi
 * 5. Sekretaris & Bendahara (Sekben 1 & Sekben 2): Maksimal 2 orang
 * 6. Anggota Divisi: Tidak terbatas (unlimited)
 */

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
export function getTenureQuotaSummary(tenureId, members = [], divisions = []) {
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
      max: 1,
      members: pimpros
    };
  });

  return {
    pembina: { current: pembinas.length, max: 1, members: pembinas },
    ketua: { current: ketuas.length, max: 1, members: ketuas },
    wakilKetua: { current: wakilKetuas.length, max: 1, members: wakilKetuas },
    sekben: { current: sekbens.length, max: 2, members: sekbens },
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
  divisions = []
) {
  const targetTenureId = tenureId || '';
  const roleType = getMemberRoleType(category, role, title);

  // 1. Pembina: Maksimal 1 orang per kepengurusan
  if (category === 'pembina' || roleType === 'pembina') {
    const existing = (members || []).filter(m => 
      (!targetTenureId || m.tenureId === targetTenureId) &&
      m.id !== excludeMemberId &&
      m.category === 'pembina'
    );
    if (existing.length >= 1) {
      return {
        isValid: false,
        field: 'memCategory',
        error: `Batas kuota Pembina telah terpenuhi (maksimal 1 Pembina per periode kepengurusan). Saat ini sudah diisi oleh "${existing[0].name}".`
      };
    }
  }

  // 2. Pengurus Inti
  if (category === 'inti') {
    // 2a. Ketua: Maksimal 1 orang per kepengurusan
    if (roleType === 'ketua') {
      const existing = (members || []).filter(m => 
        (!targetTenureId || m.tenureId === targetTenureId) &&
        m.id !== excludeMemberId &&
        getMemberRoleType(m.category, m.role, m.title) === 'ketua'
      );
      if (existing.length >= 1) {
        return {
          isValid: false,
          field: 'memRole',
          error: `Batas kuota Ketua telah terpenuhi (maksimal 1 Ketua per periode kepengurusan). Saat ini sudah diisi oleh "${existing[0].name}".`
        };
      }
    }

    // 2b. Wakil Ketua: Maksimal 1 orang per kepengurusan
    if (roleType === 'wakil_ketua') {
      const existing = (members || []).filter(m => 
        (!targetTenureId || m.tenureId === targetTenureId) &&
        m.id !== excludeMemberId &&
        getMemberRoleType(m.category, m.role, m.title) === 'wakil_ketua'
      );
      if (existing.length >= 1) {
        return {
          isValid: false,
          field: 'memRole',
          error: `Batas kuota Wakil Ketua telah terpenuhi (maksimal 1 Wakil Ketua per periode kepengurusan). Saat ini sudah diisi oleh "${existing[0].name}".`
        };
      }
    }

    // 2c. Sekretaris & Bendahara (Sekben): Maksimal 2 orang per kepengurusan
    if (roleType === 'sekben') {
      const existing = (members || []).filter(m => 
        (!targetTenureId || m.tenureId === targetTenureId) &&
        m.id !== excludeMemberId &&
        getMemberRoleType(m.category, m.role, m.title) === 'sekben'
      );
      if (existing.length >= 2) {
        const names = existing.map(e => `"${e.name}"`).join(' dan ');
        return {
          isValid: false,
          field: 'memRole',
          error: `Batas kuota Sekretaris & Bendahara telah terpenuhi (maksimal 2 orang per periode kepengurusan: Sekben 1 & Sekben 2). Saat ini sudah diisi oleh ${names}.`
        };
      }
    }
  }

  // 3. Pimpro / Ketua Divisi: Maksimal 1 orang per divisi dalam kepengurusan
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

    if (existing.length >= 1) {
      const divObj = (divisions || []).find(d => d.id === divisionId);
      const divName = divObj?.name || 'divisi ini';
      return {
        isValid: false,
        field: 'memDivisionId',
        error: `Batas kuota Pimpro untuk divisi "${divName}" telah terpenuhi (masing-masing divisi maksimal 1 Pimpro). Saat ini sudah diisi oleh "${existing[0].name}".`
      };
    }
  }

  return { isValid: true, error: null };
}
