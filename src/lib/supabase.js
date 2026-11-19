import { createClient } from '@supabase/supabase-js';
import { formatWibEventRange, toDatetimeLocalSecondsValue, toDatetimeLocalValue } from '../utils/dateUtils.js';
import { getCategoryFromLevel } from '../utils/memberQuotaUtils.js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://xarcxbfgeoetyhpqsick.supabase.co';
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcmN4YmZnZW9ldHlocHFzaWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MTM1MjMsImV4cCI6MjEwOTE4OTUyM30.xQzKu3bL9Pzp3OeL6s2s9sEtTBQukr1y0XQSf21bzWI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_PREFIX = 'cnt_it_apd_v2_';

export function loadLocalCache(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    if (raw !== null && raw !== undefined) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore storage errors
  }
  return fallbackValue;
}

export function saveLocalCache(key, value) {
  try {
    localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // ignore quota errors
  }
}

// ============================================================================
// ROW MAPPERS: Web State (camelCase) <-> Dedicated Supabase Tables (snake_case)
// ============================================================================

const TABLE_MAP = {
  tenures: 'tenures',
  divisions: 'divisions',
  departments: 'departments',
  members: 'members',
  events: 'events',
  galleries: 'galleries',
  kudosList: 'kudos',
  aspirasiList: 'aspirasi',
  forms: 'forms',
  submissions: 'submissions',
  brandAssets: 'brand_assets',
  eventRsvps: 'event_rsvps',
  faqs: 'faqs',
  tenureRoles: 'tenure_roles',
  luckyDraws: 'lucky_draws'
};

let isGalleryDivisionIdChecked = false;
let isGalleryDivisionIdSupported = false;
let isGalleryDivisionColSupported = false;

export async function checkGalleryDivisionIdColumn() {
  if (isGalleryDivisionIdChecked) return isGalleryDivisionIdSupported;
  try {
    const { error: idErr } = await supabase.from('galleries').select('division_id').limit(1);
    isGalleryDivisionIdSupported = !idErr;
    const { error: divErr } = await supabase.from('galleries').select('division').limit(1);
    isGalleryDivisionColSupported = !divErr;
    isGalleryDivisionIdChecked = true;
  } catch (e) {
    isGalleryDivisionIdSupported = false;
  }
  return isGalleryDivisionIdSupported;
}

let isGalleryEventIdChecked = false;
let isGalleryEventIdSupported = false;

export async function checkGalleryEventIdColumn() {
  if (isGalleryEventIdChecked) return isGalleryEventIdSupported;
  try {
    const { error } = await supabase.from('galleries').select('event_id').limit(1);
    isGalleryEventIdSupported = !error;
    isGalleryEventIdChecked = true;
  } catch (e) {
    isGalleryEventIdSupported = false;
  }
  return isGalleryEventIdSupported;
}

let isFormsTrackingColChecked = false;
let isFormsTrackingColSupported = false;

export async function checkFormsTrackingColumn() {
  if (isFormsTrackingColChecked) return isFormsTrackingColSupported;
  try {
    const { error } = await supabase.from('forms').select('requires_tracking').limit(1);
    isFormsTrackingColSupported = !error;
    isFormsTrackingColChecked = true;
  } catch (e) {
    isFormsTrackingColSupported = false;
  }
  return isFormsTrackingColSupported;
}

let isFormsTenureColChecked = false;
let isFormsTenureColSupported = false;

export async function checkFormsTenureColumn() {
  if (isFormsTenureColChecked) return isFormsTenureColSupported;
  try {
    const { error } = await supabase.from('forms').select('tenure_id').limit(1);
    isFormsTenureColSupported = !error;
    isFormsTenureColChecked = true;
  } catch (e) {
    isFormsTenureColSupported = false;
  }
  return isFormsTenureColSupported;
}

let isFormsAnnouncementColChecked = false;
let formsAnnouncementColName = null; // 'is_show_accepted' | 'show_announcement' | null

export async function checkFormsAnnouncementColumn() {
  if (isFormsAnnouncementColChecked) return formsAnnouncementColName;
  try {
    const { error: err1 } = await supabase.from('forms').select('is_show_accepted').limit(1);
    if (!err1) {
      formsAnnouncementColName = 'is_show_accepted';
      isFormsAnnouncementColChecked = true;
      return formsAnnouncementColName;
    }
    const { error: err2 } = await supabase.from('forms').select('show_announcement').limit(1);
    if (!err2) {
      formsAnnouncementColName = 'show_announcement';
      isFormsAnnouncementColChecked = true;
      return formsAnnouncementColName;
    }
  } catch (e) {
    formsAnnouncementColName = null;
  }
  isFormsAnnouncementColChecked = true;
  return formsAnnouncementColName;
}

let isFormsLimitedColChecked = false;
let isFormsLimitedColSupported = false;
let isFormsMaxQuotaColChecked = false;
let isFormsMaxQuotaColSupported = false;

let isFormsEventConnectedColChecked = false;
let isFormsEventConnectedColSupported = false;
let isFormsEventIdColChecked = false;
let isFormsEventIdColSupported = false;
let isFormsLuckyDrawColChecked = false;
let isFormsLuckyDrawColSupported = false;

export async function checkFormsLuckyDrawColumn() {
  if (isFormsLuckyDrawColChecked) return isFormsLuckyDrawColSupported;
  try {
    const { error } = await supabase.from('forms').select('is_lucky_draw').limit(1);
    isFormsLuckyDrawColSupported = !error;
    isFormsLuckyDrawColChecked = true;
  } catch (e) {
    isFormsLuckyDrawColSupported = false;
  }
  return isFormsLuckyDrawColSupported;
}

export async function checkFormsEventColumns() {
  if (isFormsEventConnectedColChecked && isFormsEventIdColChecked) {
    return { isEventConnectedSupported: isFormsEventConnectedColSupported, isEventIdSupported: isFormsEventIdColSupported };
  }
  try {
    const { error: err1 } = await supabase.from('forms').select('is_event_connected').limit(1);
    isFormsEventConnectedColSupported = !err1;
    isFormsEventConnectedColChecked = true;
  } catch (e) {
    isFormsEventConnectedColSupported = false;
  }
  try {
    const { error: err2 } = await supabase.from('forms').select('event_id').limit(1);
    isFormsEventIdColSupported = !err2;
    isFormsEventIdColChecked = true;
  } catch (e) {
    isFormsEventIdColSupported = false;
  }
  return { isEventConnectedSupported: isFormsEventConnectedColSupported, isEventIdSupported: isFormsEventIdColSupported };
}

export async function checkFormsQuotaColumns() {
  if (isFormsLimitedColChecked && isFormsMaxQuotaColChecked) {
    return { isLimitedSupported: isFormsLimitedColSupported, isMaxQuotaSupported: isFormsMaxQuotaColSupported };
  }
  try {
    const { error: errLim } = await supabase.from('forms').select('is_limited').limit(1);
    isFormsLimitedColSupported = !errLim;
    isFormsLimitedColChecked = true;
  } catch (e) {
    isFormsLimitedColSupported = false;
  }
  try {
    const { error: errQuota } = await supabase.from('forms').select('max_quota').limit(1);
    isFormsMaxQuotaColSupported = !errQuota;
    isFormsMaxQuotaColChecked = true;
  } catch (e) {
    isFormsMaxQuotaColSupported = false;
  }
  return { isLimitedSupported: isFormsLimitedColSupported, isMaxQuotaSupported: isFormsMaxQuotaColSupported };
}

let isDepartmentsTableChecked = false;
let isDepartmentsTableSupported = false;

export async function checkDepartmentsTable() {
  try {
    const { error } = await supabase.from('departments').select('id').limit(1);
    isDepartmentsTableSupported = !error;
    isDepartmentsTableChecked = true;
  } catch (e) {
    isDepartmentsTableSupported = false;
  }
  return isDepartmentsTableSupported;
}

let isTenureRolesTableChecked = false;
let isTenureRolesTableSupported = false;

let isMembersRoleIdChecked = false;
let isMembersRoleIdSupported = false;

export async function checkMembersRoleIdColumn() {
  if (isMembersRoleIdChecked) return isMembersRoleIdSupported;
  try {
    const { error } = await supabase.from('members').select('role_id').limit(1);
    isMembersRoleIdSupported = !error;
    isMembersRoleIdChecked = true;
  } catch (e) {
    isMembersRoleIdSupported = false;
  }
  return isMembersRoleIdSupported;
}

let isLegacyMemberColsChecked = false;
let isLegacyMemberColsSupported = true;

export async function checkLegacyMemberColumns() {
  if (isLegacyMemberColsChecked) return isLegacyMemberColsSupported;
  try {
    const { error } = await supabase.from('members').select('category, role, title').limit(1);
    isLegacyMemberColsSupported = !error;
    isLegacyMemberColsChecked = true;
  } catch (e) {
    isLegacyMemberColsSupported = false;
  }
  return isLegacyMemberColsSupported;
}

export async function checkTenureRolesTable() {
  try {
    const { error } = await supabase.from('tenure_roles').select('id').limit(1);
    isTenureRolesTableSupported = !error;
    isTenureRolesTableChecked = true;
  } catch (e) {
    isTenureRolesTableSupported = false;
  }
  return isTenureRolesTableSupported;
}

let isLuckyDrawsTableChecked = false;
let isLuckyDrawsTableSupported = false;

export async function checkLuckyDrawsTable() {
  if (isLuckyDrawsTableChecked) return isLuckyDrawsTableSupported;
  try {
    const { error } = await supabase.from('lucky_draws').select('id').limit(1);
    isLuckyDrawsTableSupported = !error;
    isLuckyDrawsTableChecked = true;
  } catch (e) {
    isLuckyDrawsTableSupported = false;
  }
  return isLuckyDrawsTableSupported;
}

let isLuckyDrawsLegacyColsChecked = false;
let isLuckyDrawsLegacyColsSupported = true;

export async function checkLuckyDrawsLegacyColumns() {
  if (isLuckyDrawsLegacyColsChecked) return isLuckyDrawsLegacyColsSupported;
  try {
    const { error } = await supabase.from('lucky_draws').select('winner_name').limit(1);
    isLuckyDrawsLegacyColsSupported = !error;
    isLuckyDrawsLegacyColsChecked = true;
  } catch (e) {
    isLuckyDrawsLegacyColsSupported = false;
  }
  return isLuckyDrawsLegacyColsSupported;
}

const supportedUpdatedAtTables = new Set(['brand_assets', 'event_rsvps', 'faqs', 'tenure_roles', 'lucky_draws']);

export async function checkTableUpdatedAtColumn(tableName) {
  if (!tableName) return false;
  if (supportedUpdatedAtTables.has(tableName)) return true;
  try {
    const { error } = await supabase.from(tableName).select('updated_at').limit(1);
    if (!error) {
      supportedUpdatedAtTables.add(tableName);
      return true;
    }
  } catch (e) {
    // Ignore and fallback
  }
  return false;
}

let isRsvpsDepartmentColChecked = true;
let isRsvpsDepartmentColSupported = true;
let isRsvpsDepartmentIdColChecked = false;
let isRsvpsDepartmentIdColSupported = false;

export async function checkRsvpsDepartmentColumn() {
  try {
    const { error: errDept } = await supabase.from('event_rsvps').select('department').limit(1);
    isRsvpsDepartmentColSupported = !errDept;
    isRsvpsDepartmentColChecked = true;
  } catch (e) {
    isRsvpsDepartmentColSupported = true;
  }

  try {
    const { error: errId } = await supabase.from('event_rsvps').select('department_id').limit(1);
    isRsvpsDepartmentIdColSupported = !errId;
    isRsvpsDepartmentIdColChecked = true;
  } catch (e) {
    isRsvpsDepartmentIdColSupported = false;
  }

  return {
    isDepartmentColSupported: isRsvpsDepartmentColSupported,
    isDepartmentIdColSupported: isRsvpsDepartmentIdColSupported
  };
}

let isDivisionsSlugColChecked = false;
let isDivisionsSlugColSupported = false;
let isDivisionsMemberIdColChecked = false;
let isDivisionsMemberIdColSupported = false;
let isDivisionsLeadNameColChecked = false;
let isDivisionsLeadNameColSupported = true;

export async function checkDivisionsSchema() {
  try {
    const { error: errSlug } = await supabase.from('divisions').select('slug').limit(1);
    isDivisionsSlugColSupported = !errSlug;
    isDivisionsSlugColChecked = true;
  } catch (e) {
    isDivisionsSlugColSupported = false;
  }

  try {
    const { error: errMemberId } = await supabase.from('divisions').select('member_id').limit(1);
    isDivisionsMemberIdColSupported = !errMemberId;
    isDivisionsMemberIdColChecked = true;
  } catch (e) {
    isDivisionsMemberIdColSupported = false;
  }

  try {
    const { error: errLeadName } = await supabase.from('divisions').select('lead_name').limit(1);
    isDivisionsLeadNameColSupported = !errLeadName;
    isDivisionsLeadNameColChecked = true;
  } catch (e) {
    isDivisionsLeadNameColSupported = false;
  }

  return {
    isSlugSupported: isDivisionsSlugColSupported,
    isMemberIdSupported: isDivisionsMemberIdColSupported,
    isLeadNameSupported: isDivisionsLeadNameColSupported
  };
}

export async function checkDivisionsSlugColumn() {
  return checkDivisionsSchema().then(m => m.isSlugSupported);
}

let isEventsSchemaChecked = false;
let eventsSchemaMeta = {
  hasDate: true,
  categoryCol: 'badge', // 'kategori' | 'category' | 'badge'
  pesertaCol: 'kpi',    // 'peserta' | 'kpi'
  hasDivisionName: false,
  hasIsLimited: false,
  hasMaxQuota: false,
  hasIsPublic: false
};

export async function detectEventsSchema() {
  if (isEventsSchemaChecked) return eventsSchemaMeta;
  try {
    const { data, error } = await supabase.from('events').select('*').limit(1);
    if (!error && data) {
      const cols = data[0] ? Object.keys(data[0]) : [];
      if (cols.length > 0) {
        eventsSchemaMeta.hasDate = cols.includes('date');
        eventsSchemaMeta.hasDivisionName = cols.includes('division_name');
        eventsSchemaMeta.hasIsLimited = cols.includes('is_limited');
        eventsSchemaMeta.hasMaxQuota = cols.includes('max_quota');
        eventsSchemaMeta.hasIsPublic = cols.includes('is_public');
        if (cols.includes('kategori')) {
          eventsSchemaMeta.categoryCol = 'kategori';
        } else if (cols.includes('category')) {
          eventsSchemaMeta.categoryCol = 'category';
        } else {
          eventsSchemaMeta.categoryCol = 'badge';
        }
        if (cols.includes('peserta')) {
          eventsSchemaMeta.pesertaCol = 'peserta';
        } else {
          eventsSchemaMeta.pesertaCol = 'kpi';
        }
        isEventsSchemaChecked = true;
        return eventsSchemaMeta;
      }
    }
  } catch (e) {
    // fallback
  }

  try {
    const [dateRes, divNameRes, katRes, catRes, pesRes, limRes, quoRes, pubRes] = await Promise.all([
      supabase.from('events').select('date').limit(1),
      supabase.from('events').select('division_name').limit(1),
      supabase.from('events').select('kategori').limit(1),
      supabase.from('events').select('category').limit(1),
      supabase.from('events').select('peserta').limit(1),
      supabase.from('events').select('is_limited').limit(1),
      supabase.from('events').select('max_quota').limit(1),
      supabase.from('events').select('is_public').limit(1)
    ]);
    eventsSchemaMeta.hasDate = !dateRes.error;
    eventsSchemaMeta.hasDivisionName = !divNameRes.error;
    eventsSchemaMeta.hasIsLimited = !limRes.error;
    eventsSchemaMeta.hasMaxQuota = !quoRes.error;
    eventsSchemaMeta.hasIsPublic = !pubRes.error;
    if (!katRes.error) {
      eventsSchemaMeta.categoryCol = 'kategori';
    } else if (!catRes.error) {
      eventsSchemaMeta.categoryCol = 'category';
    } else {
      eventsSchemaMeta.categoryCol = 'badge';
    }
    eventsSchemaMeta.pesertaCol = !pesRes.error ? 'peserta' : 'kpi';
    isEventsSchemaChecked = true;
  } catch (e) {
    // keep default
  }
  return eventsSchemaMeta;
}

export async function checkEventDivisionNameColumn() {
  const meta = await detectEventsSchema();
  return meta.hasDivisionName;
}

export async function checkEventCategoryColumn() {
  const meta = await detectEventsSchema();
  return meta.categoryCol !== 'badge';
}

export const rowMappers = {
  tenures: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      code: item.code || '',
      title: item.title || '',
      theme_tagline: item.themeTagline || '',
      hero_headline: item.heroHeadline || '',
      hero_highlight: item.heroHighlight || '',
      visi: item.visi || '',
      misi: Array.isArray(item.misi) ? item.misi : [],
      is_active: Boolean(item.isActive),
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      themeTagline: row.theme_tagline,
      heroHeadline: row.hero_headline,
      heroHighlight: row.hero_highlight,
      visi: row.visi,
      misi: Array.isArray(row.misi) && row.misi.length > 0 ? row.misi : undefined,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  divisions: {
    toDb: (item, idx = 0) => {
      const row = {
        id: String(item.id),
        tenure_id: item.tenureId || null,
        name: item.name || '',
        color: item.color || '#0284c7',
        motto: item.motto || '',
        description: item.description || '',
        focus_areas: Array.isArray(item.focusAreas) ? item.focusAreas : [],
        is_recruiting: Boolean(item.isRecruiting),
        sort_order: idx
      };
      if (isDivisionsMemberIdColSupported) {
        row.member_id = item.memberId || null;
      }
      if (isDivisionsLeadNameColSupported) {
        row.lead_name = item.leadName || '';
      }
      if (isDivisionsSlugColSupported) {
        row.slug = item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : '');
      }
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      name: row.name,
      slug: row.slug || (row.name ? row.name.toLowerCase().replace(/\s+/g, '-') : ''),
      memberId: row.member_id || null,
      leadName: row.lead_name || '',
      color: row.color || '#0284c7',
      motto: row.motto,
      description: row.description,
      focusAreas: Array.isArray(row.focus_areas) ? row.focus_areas : [],
      isRecruiting: Boolean(row.is_recruiting),
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  tenureRoles: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      tenure_id: item.tenureId || 'tenure-2027',
      name: item.name || '',
      level: Number(item.level ?? 5),
      max_quota: Number(item.maxQuota ?? item.max ?? 0),
      requires_division: Boolean(item.requiresDivision),
      sort_order: Number(item.sortOrder ?? idx)
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id || '',
      name: row.name || '',
      level: Number(row.level ?? 5),
      max: Number(row.max_quota ?? 0),
      maxQuota: Number(row.max_quota ?? 0),
      requiresDivision: Boolean(row.requires_division),
      sortOrder: row.sort_order ?? 0,
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  departments: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      name: item.name || '',
      code: item.code || '',
      description: item.description || '',
      sort_order: Number(item.sortOrder ?? idx)
    }),
    fromDb: (row) => ({
      id: row.id,
      name: row.name || '',
      code: row.code || '',
      description: row.description || '',
      sortOrder: row.sort_order ?? 0,
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  members: {
    toDb: (item, idx = 0) => {
      const row = {
        id: String(item.id),
        tenure_id: item.tenureId || null,
        division_id: item.divisionId || null,
        name: item.name || '',
        image: item.image || '',
        color: item.color || '#FFB800',
        whatsapp: item.whatsapp || '',
        motto: item.motto || '',
        responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : [],
        sort_order: idx
      };
      if (isMembersRoleIdSupported) {
        row.role_id = item.roleId || null;
      }
      if (isLegacyMemberColsSupported) {
        row.category = item.category || 'anggota';
        row.role = item.role || '';
        row.title = item.title || '';
      }
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      divisionId: row.division_id || undefined,
      roleId: row.role_id || '',
      category: row.category || '',
      name: row.name,
      role: row.role || '',
      title: row.title || '',
      image: row.image || '',
      color: row.color || '#FFB800',
      whatsapp: row.whatsapp || '',
      motto: row.motto || '',
      responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  events: {
    toDb: (item, idx = 0) => {
      const catVal = item.kategori || item.category || item.badge || '';
      const pesertaVal = item.peserta || item.kpi || '';
      const row = {
        id: String(item.id),
        tenure_id: item.tenureId || null,
        division_id: item.divisionId || null,
        title: item.title || '',
        start_date: item.startDate ? toDatetimeLocalValue(item.startDate) : '',
        end_date: item.endDate ? toDatetimeLocalValue(item.endDate) : '',
        location: item.location || '',
        description: item.description || '',
        total_rab: Number(item.totalRab || 0),
        status: item.status || 'Upcoming',
        sort_order: idx
      };
      if (eventsSchemaMeta.hasDate) {
        row.date = item.date || item.startDate || '';
      }
      if (eventsSchemaMeta.hasDivisionName && item.divisionName) {
        row.division_name = item.divisionName;
      }
      if (eventsSchemaMeta.hasIsLimited) {
        row.is_limited = Boolean(item.isLimited);
      }
      if (eventsSchemaMeta.hasMaxQuota) {
        row.max_quota = Number(item.maxQuota || item.quota || 0);
      }
      if (eventsSchemaMeta.hasIsPublic) {
        row.is_public = Boolean(item.isPublic);
      }
      row[eventsSchemaMeta.categoryCol] = catVal;
      row[eventsSchemaMeta.pesertaCol] = pesertaVal;
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      divisionId: row.division_id,
      divisionName: row.division_name,
      title: row.title,
      date: row.date || formatWibEventRange(row.start_date, row.end_date),
      startDate: row.start_date ? toDatetimeLocalValue(row.start_date) : '',
      endDate: row.end_date ? toDatetimeLocalValue(row.end_date) : '',
      isLimited: Boolean(row.is_limited),
      maxQuota: Number(row.max_quota || row.quota || 0),
      isPublic: Boolean(row.is_public),
      kategori: row.kategori || row.category || row.badge || '',
      category: row.kategori || row.category || row.badge || '',
      badge: row.kategori || row.category || row.badge || '',
      location: row.location || '',
      peserta: row.peserta || row.kpi || '',
      kpi: row.peserta || row.kpi || '',
      description: row.description,
      totalRab: Number(row.total_rab || 0),
      status: row.status || 'Upcoming',
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  galleries: {
    toDb: (item, idx = 0) => {
      const row = {
        id: String(item.id),
        tenure_id: item.tenureId || null,
        title: item.title || '',
        date: item.date || '',
        description: item.description || '',
        photos: Array.isArray(item.photos) ? item.photos : [],
        doc_links: Array.isArray(item.docLinks) ? item.docLinks : [],
        sort_order: idx
      };
      if (isGalleryDivisionIdSupported) {
        row.division_id = item.divisionId || null;
      }
      if (isGalleryDivisionColSupported) {
        row.division = item.divisionName || item.division || '';
      }
      if (isGalleryEventIdSupported) {
        row.event_id = item.eventId || null;
      }
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      divisionId: row.division_id || undefined,
      eventId: row.event_id || undefined,
      title: row.title,
      date: row.date,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || row.created_at || null,
      division: row.division || undefined,
      divisionName: row.division || undefined,
      description: row.description,
      photos: Array.isArray(row.photos) ? row.photos : [],
      docLinks: Array.isArray(row.doc_links) ? row.doc_links : []
    })
  },

  kudosList: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      sender: item.sender || 'Anonim',
      recipient: item.recipient || '',
      category: item.category || 'Kolaboratif',
      message: item.message || '',
      likes: Number(item.likes ?? 1),
      created_at: item.createdAt || item.created_at || new Date().toISOString(),
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      sender: row.sender,
      recipient: row.recipient,
      category: row.category || 'Kolaboratif',
      message: row.message,
      likes: Number(row.likes ?? 1),
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  aspirasiList: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      sender: item.sender || 'Anonim',
      title: item.title || item.description || '',
      category: item.category || 'Kegiatan & Event',
      description: item.description || item.title || '',
      created_at: item.createdAt || new Date().toISOString(),
      status: item.status || 'Menunggu Review',
      admin_reply: item.adminReply || '',
      is_public: item.isPublic !== false,
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      sender: row.sender || 'Anonim',
      title: row.title || row.description || '',
      category: row.category || 'Kegiatan & Event',
      description: row.description || row.title || '',
      submittedAt: row.created_at || row.submitted_at || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || row.created_at || null,
      status: row.status || 'Menunggu Review',
      adminReply: row.admin_reply || '',
      isPublic: row.is_public !== false
    })
  },

  forms: {
    toDb: (item, idx = 0) => {
      const rawFields = Array.isArray(item.fields) ? [...item.fields] : [];
      const showAnnouncementVal = item.showAnnouncement === true;
      const isLimitedVal = item.isLimited === true;
      const maxQuotaVal = Math.max(0, parseInt(item.maxQuota, 10) || 0);
      const isEventConnectedVal = item.isEventConnected === true;
      const eventIdVal = String(item.eventId || item.event_id || '');
      const isLuckyDrawVal = item.isLuckyDraw === true;

      // Persist requiresTracking, tenureId, showAnnouncement, isLimited, maxQuota, isEventConnected, eventId & isLuckyDraw inside fields[0] as resilient fallback if database column does not exist yet
      if (rawFields.length > 0) {
        rawFields[0] = {
          ...rawFields[0],
          _requiresTracking: item.requiresTracking !== false,
          _tenureId: item.tenureId || item.tenure_id || '',
          _showAnnouncement: showAnnouncementVal,
          _isShowAccepted: showAnnouncementVal,
          _isLimited: isLimitedVal,
          _maxQuota: maxQuotaVal,
          _isEventConnected: isEventConnectedVal,
          _eventId: eventIdVal,
          _isLuckyDraw: isLuckyDrawVal
        };
      }

      const row = {
        id: String(item.id),
        title: item.title || '',
        subtitle: item.subtitle || '',
        category: item.category || 'Kegiatan & Event',
        deadline: item.deadline ? toDatetimeLocalSecondsValue(item.deadline) : '',
        is_open: item.isOpen !== false,
        fields: rawFields,
        sort_order: idx
      };
      if (isFormsTrackingColSupported) {
        row.requires_tracking = item.requiresTracking !== false;
      }
      if (isFormsTenureColSupported) {
        row.tenure_id = item.tenureId || item.tenure_id || null;
      }
      if (formsAnnouncementColName) {
        row[formsAnnouncementColName] = showAnnouncementVal;
      }
      if (isFormsLimitedColSupported) {
        row.is_limited = isLimitedVal;
      }
      if (isFormsMaxQuotaColSupported) {
        row.max_quota = maxQuotaVal;
      }
      if (isFormsEventConnectedColSupported) {
        row.is_event_connected = isEventConnectedVal;
      }
      if (isFormsEventIdColSupported) {
        row.event_id = eventIdVal || null;
      }
      if (isFormsLuckyDrawColSupported) {
        row.is_lucky_draw = isLuckyDrawVal;
      }
      return row;
    },
    fromDb: (row) => {
      const rawFields = Array.isArray(row.fields) ? row.fields : [];
      let isTracking = true;
      if (row.requires_tracking !== undefined && row.requires_tracking !== null) {
        isTracking = row.requires_tracking !== false;
      } else if (rawFields.length > 0 && rawFields[0]?._requiresTracking !== undefined) {
        isTracking = rawFields[0]._requiresTracking !== false;
      }

      let showAnnouncement = false;
      if (row.is_show_accepted !== undefined && row.is_show_accepted !== null) {
        showAnnouncement = row.is_show_accepted === true;
      } else if (row.show_announcement !== undefined && row.show_announcement !== null) {
        showAnnouncement = row.show_announcement === true;
      } else if (rawFields.length > 0 && (rawFields[0]?._showAnnouncement !== undefined || rawFields[0]?._isShowAccepted !== undefined)) {
        showAnnouncement = (rawFields[0]._showAnnouncement === true || rawFields[0]._isShowAccepted === true);
      }

      let isLimited = false;
      if (row.is_limited !== undefined && row.is_limited !== null) {
        isLimited = row.is_limited === true;
      } else if (rawFields.length > 0 && rawFields[0]?._isLimited !== undefined) {
        isLimited = rawFields[0]._isLimited === true;
      }

      let maxQuota = 0;
      if (row.max_quota !== undefined && row.max_quota !== null) {
        maxQuota = Math.max(0, parseInt(row.max_quota, 10) || 0);
      } else if (rawFields.length > 0 && rawFields[0]?._maxQuota !== undefined) {
        maxQuota = Math.max(0, parseInt(rawFields[0]._maxQuota, 10) || 0);
      }

      let isEventConnected = false;
      if (row.is_event_connected !== undefined && row.is_event_connected !== null) {
        isEventConnected = row.is_event_connected === true;
      } else if (rawFields.length > 0 && rawFields[0]?._isEventConnected !== undefined) {
        isEventConnected = rawFields[0]._isEventConnected === true;
      }

      let eventId = '';
      if (row.event_id !== undefined && row.event_id !== null) {
        eventId = String(row.event_id);
      } else if (rawFields.length > 0 && rawFields[0]?._eventId) {
        eventId = String(rawFields[0]._eventId);
      }

      let isLuckyDraw = false;
      if (row.is_lucky_draw !== undefined && row.is_lucky_draw !== null) {
        isLuckyDraw = row.is_lucky_draw === true;
      } else if (rawFields.length > 0 && rawFields[0]?._isLuckyDraw !== undefined) {
        isLuckyDraw = rawFields[0]._isLuckyDraw === true;
      }

      const tenureIdVal = row.tenure_id || (rawFields.length > 0 && rawFields[0]?._tenureId) || '';

      return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle || row.description || '',
        category: row.category,
        deadline: row.deadline ? toDatetimeLocalSecondsValue(row.deadline) : '',
        isOpen: row.is_open !== false,
        requiresTracking: isTracking,
        showAnnouncement: showAnnouncement,
        isLimited: isLimited,
        maxQuota: maxQuota,
        isEventConnected: isEventConnected,
        eventId: eventId,
        isLuckyDraw: isLuckyDraw,
        tenureId: tenureIdVal,
        fields: rawFields,
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || row.created_at || null
      };
    }
  },

  submissions: {
    toDb: (item) => ({
      id: String(item.id),
      form_id: item.formId || null,
      status: item.status || 'Submitted',
      admin_notes: item.adminNotes || '',
      data: item.data || {},
      files: item.files || {}
    }),
    fromDb: (row) => ({
      id: row.id,
      formId: row.form_id,
      formTitle: row.form_title || '',
      submittedAt: row.created_at || row.submitted_at || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || row.created_at || null,
      status: row.status || 'Submitted',
      adminNotes: row.admin_notes || '',
      data: row.data || {},
      files: row.files || {}
    })
  },

  brandAssets: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      title: item.title || '',
      category: item.category || 'Logo & Brand',
      description: item.description || '',
      file_url: item.fileUrl || '',
      preview_url: item.previewUrl || '',
      file_type: item.fileType || 'PNG / ZIP',
      file_size: item.fileSize || '',
      badge: item.badge || 'Official Asset',
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      title: row.title,
      category: row.category || 'Logo & Brand',
      description: row.description || '',
      fileUrl: row.file_url || '',
      previewUrl: row.preview_url || '',
      fileType: row.file_type || 'PNG / ZIP',
      fileSize: row.file_size || '',
      badge: row.badge || 'Official Asset',
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  eventRsvps: {
    toDb: (item, idx = 0) => {
      const deptVal = item.departmentId || item.department || item.squadUnit || item.departemen || '';
      const row = {
        id: String(item.id),
        event_id: item.eventId || null,
        attendee_name: item.attendeeName || '',
        attendance_mode: item.attendanceMode || 'Hadir Onsite',
        notes: item.notes || '',
        sort_order: idx
      };
      if (isRsvpsDepartmentIdColSupported) {
        row.department_id = deptVal || null;
      }
      if (isRsvpsDepartmentColSupported) {
        row.department = deptVal;
      }
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      eventId: row.event_id || '',
      attendeeName: row.attendee_name || '',
      departmentId: row.department_id || row.department || row.squad_unit || '',
      department: row.department || row.department_id || row.squad_unit || '',
      squadUnit: row.department || row.department_id || row.squad_unit || '',
      attendanceMode: row.attendance_mode || 'Hadir Onsite',
      notes: row.notes || '',
      submittedAt: row.created_at || row.submitted_at || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || row.created_at || null
    })
  },

  faqs: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || 'Umum',
      asked_by: item.askedBy || 'Admin CNT',
      is_published: item.isPublished !== false,
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      question: row.question || '',
      answer: row.answer || '',
      category: row.category || 'Umum',
      askedBy: row.asked_by || 'Admin CNT',
      submittedAt: row.created_at || row.submitted_at || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || row.created_at || null,
      isPublished: row.is_published !== false
    })
  },

  luckyDraws: {
    toDb: (item, idx = 0) => {
      const row = {
        id: String(item.id),
        event_id: item.eventId || '',
        submission_id: item.submissionId || '',
        form_id: item.formId || '',
        prize_name: item.prizeTitle || item.prizeName || 'Doorprize Utama',
        drawn_at: item.drawnAt || new Date().toISOString(),
        sort_order: idx
      };
      // Only attach redundant legacy columns if they still exist in the database table
      if (isLuckyDrawsLegacyColsSupported) {
        row.winner_name = item.winnerName || '';
        row.winner_unit = item.winnerDepartment || item.winnerUnit || '';
        row.winner_phone = item.winnerIdentifier || item.winnerPhone || '';
      }
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      eventId: row.event_id || '',
      submissionId: row.submission_id || '',
      formId: row.form_id || '',
      winnerName: row.winner_name || '',
      winnerUnit: row.winner_unit || '',
      winnerDepartment: row.winner_unit || '',
      winnerPhone: row.winner_phone || '',
      winnerIdentifier: row.winner_phone || '',
      prizeName: row.prize_name || 'Doorprize Utama',
      prizeTitle: row.prize_name || 'Doorprize Utama',
      drawnAt: row.drawn_at || row.created_at || ''
    })
  }
};

/**
 * Fetch all dedicated tables from Supabase and sync to LocalStorage cache
 */
export async function fetchAllCloudState() {
  try {
    await Promise.all([
      checkGalleryDivisionIdColumn(),
      checkGalleryEventIdColumn(),
      detectEventsSchema(),
      checkFormsTrackingColumn(),
      checkFormsTenureColumn(),
      checkFormsAnnouncementColumn(),
      checkFormsQuotaColumns(),
      checkFormsEventColumns(),
      checkFormsLuckyDrawColumn(),
      checkRsvpsDepartmentColumn(),
      checkDivisionsSchema(),
      checkDepartmentsTable(),
      checkTenureRolesTable(),
      checkLuckyDrawsTable(),
      checkLuckyDrawsLegacyColumns(),
      checkMembersRoleIdColumn(),
      checkLegacyMemberColumns()
    ]);
    const [
      tenuresRes,
      divisionsRes,
      membersRes,
      eventsRes,
      galleriesRes,
      kudosRes,
      aspirasiRes,
      formsRes,
      submissionsRes,
      brandAssetsRes,
      eventRsvpsRes,
      faqsRes,
      departmentsRes,
      tenureRolesRes,
      luckyDrawsRes,
      settingsRes
    ] = await Promise.all([
      supabase.from('tenures').select('*').order('sort_order', { ascending: true }),
      supabase.from('divisions').select('*').order('sort_order', { ascending: true }),
      supabase.from('members').select('*').order('sort_order', { ascending: true }),
      supabase.from('events').select('*').order('sort_order', { ascending: true }),
      supabase.from('galleries').select('*').order('sort_order', { ascending: true }),
      supabase.from('kudos').select('*').order('created_at', { ascending: false }),
      supabase.from('aspirasi').select('*').order('created_at', { ascending: false }),
      supabase.from('forms').select('*').order('sort_order', { ascending: true }),
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('brand_assets').select('*').order('sort_order', { ascending: true }),
      supabase.from('event_rsvps').select('*').order('created_at', { ascending: false }),
      supabase.from('faqs').select('*').order('sort_order', { ascending: true }),
      isDepartmentsTableSupported ? supabase.from('departments').select('*').order('sort_order', { ascending: true }) : Promise.resolve({ data: null, error: null }),
      isTenureRolesTableSupported ? supabase.from('tenure_roles').select('*').order('sort_order', { ascending: true }) : Promise.resolve({ data: null, error: null }),
      isLuckyDrawsTableSupported ? supabase.from('lucky_draws').select('*').order('drawn_at', { ascending: false }) : Promise.resolve({ data: null, error: null }),
      supabase.from('page_settings').select('*')
    ]);

    const result = {};

    if (!tenuresRes.error && Array.isArray(tenuresRes.data) && tenuresRes.data.length > 0) {
      result.tenures = tenuresRes.data.map(rowMappers.tenures.fromDb);
      saveLocalCache('tenures', result.tenures);
    }
    if (!divisionsRes.error && Array.isArray(divisionsRes.data) && divisionsRes.data.length > 0) {
      result.divisions = divisionsRes.data.map(rowMappers.divisions.fromDb);
      saveLocalCache('divisions', result.divisions);
    }
    if (!membersRes.error && Array.isArray(membersRes.data) && membersRes.data.length > 0) {
      result.members = membersRes.data.map(rowMappers.members.fromDb);
      saveLocalCache('members', result.members);
    }
    if (!eventsRes.error && Array.isArray(eventsRes.data)) {
      result.events = eventsRes.data.map(rowMappers.events.fromDb);
      saveLocalCache('events', result.events);
    }
    if (!galleriesRes.error && Array.isArray(galleriesRes.data)) {
      result.galleries = galleriesRes.data.map(rowMappers.galleries.fromDb);
      saveLocalCache('galleries', result.galleries);
    }
    if (!kudosRes.error && Array.isArray(kudosRes.data)) {
      result.kudosList = kudosRes.data.map(rowMappers.kudosList.fromDb);
      saveLocalCache('kudosList', result.kudosList);
    }
    if (!aspirasiRes.error && Array.isArray(aspirasiRes.data)) {
      result.aspirasiList = aspirasiRes.data.map(rowMappers.aspirasiList.fromDb);
      saveLocalCache('aspirasiList', result.aspirasiList);
    }
    if (!formsRes.error && Array.isArray(formsRes.data)) {
      result.forms = formsRes.data.map(rowMappers.forms.fromDb);
      saveLocalCache('forms', result.forms);
    }
    if (!submissionsRes.error && Array.isArray(submissionsRes.data)) {
      result.submissions = submissionsRes.data.map(rowMappers.submissions.fromDb);
      saveLocalCache('submissions', result.submissions);
    }
    if (!brandAssetsRes.error && Array.isArray(brandAssetsRes.data)) {
      result.brandAssets = brandAssetsRes.data.map(rowMappers.brandAssets.fromDb);
      saveLocalCache('brandAssets', result.brandAssets);
    }
    if (!eventRsvpsRes.error && Array.isArray(eventRsvpsRes.data)) {
      result.eventRsvps = eventRsvpsRes.data.map(rowMappers.eventRsvps.fromDb);
      saveLocalCache('eventRsvps', result.eventRsvps);
    }
    if (!faqsRes.error && Array.isArray(faqsRes.data)) {
      result.faqs = faqsRes.data.map(rowMappers.faqs.fromDb);
      saveLocalCache('faqs', result.faqs);
    }
    if (departmentsRes && !departmentsRes.error && Array.isArray(departmentsRes.data)) {
      result.departments = departmentsRes.data.map(rowMappers.departments.fromDb);
      saveLocalCache('departments', result.departments);
    }
    if (tenureRolesRes && !tenureRolesRes.error && Array.isArray(tenureRolesRes.data) && tenureRolesRes.data.length > 0) {
      result.tenureRoles = tenureRolesRes.data.map(rowMappers.tenureRoles.fromDb);
      saveLocalCache('tenureRoles', result.tenureRoles);
    }
    if (luckyDrawsRes && !luckyDrawsRes.error && Array.isArray(luckyDrawsRes.data)) {
      result.luckyDraws = luckyDrawsRes.data.map(rowMappers.luckyDraws.fromDb);
      saveLocalCache('luckyDraws', result.luckyDraws);
    }
    if (!settingsRes.error && Array.isArray(settingsRes.data)) {
      for (const row of settingsRes.data) {
        if (row.key === 'page_visibility' && row.value) {
          const valWithUpdated = {
            ...row.value,
            _updatedAt: row.updated_at
          };
          result.pageVisibility = valWithUpdated;
          saveLocalCache('pageVisibility', valWithUpdated);
        }
        if (row.key === 'active_tenure_id' && row.value?.id) {
          result.activeTenureId = row.value.id;
          saveLocalCache('activeTenureId', row.value.id);
        }
        if (row.key === 'announcement_bar' && row.value) {
          const valWithUpdated = {
            ...row.value,
            _updatedAt: row.updated_at
          };
          result.announcementBar = valWithUpdated;
          saveLocalCache('announcementBar', valWithUpdated);
        }
        if (row.key === 'role_quotas' && row.value) {
          result.roleQuotas = row.value;
          saveLocalCache('roleQuotas', row.value);
        }
      }
    }

    // Enrich and reconcile members with role_id, divisions, and category
    if (result.members && Array.isArray(result.members)) {
      const rList = result.tenureRoles || [];
      const dList = result.divisions || [];
      result.members = result.members.map(m => {
        const roleObj = rList.find(r => r.id === m.roleId) ||
          rList.find(r => String(r.name || '').toLowerCase() === String(m.role || '').toLowerCase());
        const divObj = dList.find(d => d.id === m.divisionId);
        const level = roleObj ? Number(roleObj.level) : 5;
        const cat = roleObj ? getCategoryFromLevel(level) : (m.category || 'anggota');

        let roleName = m.role || '';
        let titleName = m.title || '';

        if (roleObj) {
          const rName = roleObj.name || '';
          const dName = divObj?.name || '';
          if (roleObj.requiresDivision && divObj && dName) {
            roleName = rName.toLowerCase().includes(dName.toLowerCase())
              ? rName
              : `${rName} ${dName}`;
            titleName = dName;
          } else {
            roleName = roleName || rName;
            titleName = divObj?.name || (titleName && titleName.toLowerCase() !== roleName.toLowerCase() ? titleName : '');
          }
        }

        return {
          ...m,
          roleId: roleObj?.id || m.roleId || '',
          category: cat,
          role: roleName || 'Anggota',
          title: titleName || ''
        };
      });
      saveLocalCache('members', result.members);
    }

    // Reconcile divisions with lead resolved directly from DB roles & members
    if (result.divisions && Array.isArray(result.divisions)) {
      const memList = result.members || [];
      const rList = result.tenureRoles || [];
      result.divisions = result.divisions.map(d => {
        const divMems = memList.filter(m => m.divisionId === d.id);
        let bestLead = null;
        if (divMems.length > 0) {
          const mapped = divMems.map(m => {
            const roleObj = rList.find(r => r.id === m.roleId) ||
              rList.find(r => String(r.name || '').toLowerCase().trim() === String(m.role || '').toLowerCase().trim());
            const level = roleObj ? Number(roleObj.level) : 5;
            const sortOrder = roleObj ? Number(roleObj.sortOrder ?? 0) : 999;
            return { member: m, level, sortOrder };
          });
          mapped.sort((a, b) => (a.level - b.level) || (a.sortOrder - b.sortOrder));
          bestLead = mapped[0]?.member || null;
        }
        return {
          ...d,
          memberId: bestLead ? bestLead.id : (d.memberId || null),
          leadName: bestLead ? bestLead.name : (d.leadName || '')
        };
      });
      saveLocalCache('divisions', result.divisions);
    }

    return result;
  } catch (e) {
    return null;
  }
}

export async function pushRoleQuotas(quotas) {
  try {
    saveLocalCache('roleQuotas', quotas);
    await supabase.from('page_settings').upsert({
      key: 'role_quotas',
      value: quotas,
      updated_at: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error('Failed to push role quotas:', e);
    return false;
  }
}

/**
 * Synchronize a collection or setting directly to its dedicated Supabase table
 */
export async function pushCloudState(key, value) {
  saveLocalCache(key, value);

  try {
    // Handle global settings in `public.page_settings`
    if (key === 'pageVisibility') {
      const cleanValue = { ...value };
      delete cleanValue._updatedAt;
      await supabase.from('page_settings').upsert({
        key: 'page_visibility',
        value: cleanValue,
        updated_at: new Date().toISOString()
      });
      return true;
    }

    if (key === 'activeTenureId') {
      await supabase.from('page_settings').upsert({
        key: 'active_tenure_id',
        value: { id: value },
        updated_at: new Date().toISOString()
      });
      return true;
    }

    if (key === 'announcementBar') {
      const cleanValue = { ...value };
      delete cleanValue._updatedAt;
      await supabase.from('page_settings').upsert({
        key: 'announcement_bar',
        value: cleanValue,
        updated_at: new Date().toISOString()
      });
      return true;
    }

    if (key === 'luckyDraws') {
      const isTableOk = await checkLuckyDrawsTable();
      if (!isTableOk) return false;
      await checkLuckyDrawsLegacyColumns();
      const rows = (Array.isArray(value) ? value : []).map(rowMappers.luckyDraws.toDb);
      if (rows.length === 0) {
        await supabase.from('lucky_draws').delete().neq('id', '___dummy___');
      } else {
        const ids = rows.map(r => r.id);
        await supabase.from('lucky_draws').delete().not('id', 'in', `(${ids.map(id => `"${id}"`).join(',')})`);
        await supabase.from('lucky_draws').upsert(rows);
      }
      return true;
    }

    const tableName = TABLE_MAP[key];
    const mapper = rowMappers[key];
    if (!tableName || !mapper || !Array.isArray(value)) {
      return false;
    }

    if (key === 'divisions') {
      await checkDivisionsSchema();
    }
    if (key === 'members') {
      await checkMembersRoleIdColumn();
      await checkLegacyMemberColumns();
    }
    if (key === 'galleries') {
      await checkGalleryDivisionIdColumn();
      await checkGalleryEventIdColumn();
    }
    if (key === 'events') {
      await detectEventsSchema();
    }
    if (key === 'forms') {
      await checkFormsTrackingColumn();
      await checkFormsTenureColumn();
      await checkFormsAnnouncementColumn();
      await checkFormsQuotaColumns();
      await checkFormsEventColumns();
      await checkFormsLuckyDrawColumn();
      await checkFormsEventColumns();
      await checkFormsLuckyDrawColumn();
    }
    if (key === 'eventRsvps') {
      await checkRsvpsDepartmentColumn();
    }
    if (key === 'departments') {
      const supported = await checkDepartmentsTable();
      if (!supported) return true;
    }
    if (key === 'tenureRoles') {
      const supported = await checkTenureRolesTable();
      if (!supported) {
        // Fallback sync to page_settings.role_quotas
        const grouped = {};
        (value || []).forEach(r => {
          const tId = r.tenureId || 'default';
          if (!grouped[tId]) grouped[tId] = { roles: [] };
          grouped[tId].roles.push(r);
        });
        await pushRoleQuotas(grouped);
        return true;
      }
    }

    // Automatically sort tenures descending by code (e.g. 2028 -> 2027 -> 2026) so sort_order aligns chronologically
    let preparedValue = value;
    if (key === 'tenures') {
      preparedValue = [...value].sort((a, b) => {
        const numA = parseInt(a.code || a.id?.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.code || b.id?.replace(/\D/g, '') || '0', 10);
        if (numB !== numA) return numB - numA;
        return (b.title || '').localeCompare(a.title || '');
      });
    }

    const hasUpdatedAt = await checkTableUpdatedAtColumn(tableName);
    const dbRows = preparedValue.map((item, idx) => {
      const row = mapper.toDb(item, idx);
      if (hasUpdatedAt && row.updated_at === undefined) {
        // Strictly preserve each individual item's updatedAt timestamp.
        // NEVER fallback to new Date() here to prevent untouched items from having their last-update timestamp changed during batch synchronization.
        const existingTimestamp = item.updatedAt || item.createdAt;
        if (existingTimestamp) {
          row.updated_at = existingTimestamp;
        }
      }
      return row;
    });
    const currentIds = dbRows.map((r) => r.id);

    // Fetch existing IDs in table to remove deleted rows
    const { data: existingRows } = await supabase.from(tableName).select('id');
    if (Array.isArray(existingRows)) {
      const idsToDelete = existingRows
        .map((r) => r.id)
        .filter((id) => !currentIds.includes(id));

      if (idsToDelete.length > 0) {
        await supabase.from(tableName).delete().in('id', idsToDelete);
      }
    }

    // Upsert all current rows into their dedicated table
    if (dbRows.length > 0) {
      const { error } = await supabase.from(tableName).upsert(dbRows, { onConflict: 'id' });
      if (error) {
        console.error('pushCloudState error on', tableName, error);
        return false;
      }
    }

    return true;
  } catch (e) {
    console.error('pushCloudState exception on', key, e);
    return false;
  }
}

/**
 * Atomic single-row insert into a dedicated table (`submissions`, `kudos`, `aspirasi`)
 * and return the refreshed list from Supabase
 */
export async function mergeAndPushCloudList(key, newItem, currentLocalList = []) {
  const tableName = TABLE_MAP[key];
  const mapper = rowMappers[key];

  const optimisticList = [newItem, ...currentLocalList.filter((i) => i.id !== newItem.id)];
  saveLocalCache(key, optimisticList);

  if (!tableName || !mapper) return optimisticList;

  if (key === 'eventRsvps') {
    await checkRsvpsDepartmentColumn();
  }
  if (key === 'forms') {
    await checkFormsTrackingColumn();
    await checkFormsTenureColumn();
    await checkFormsAnnouncementColumn();
    await checkFormsQuotaColumns();
    await checkFormsEventColumns();
    await checkFormsLuckyDrawColumn();
  }

  try {
    const hasUpdatedAt = await checkTableUpdatedAtColumn(tableName);
    const dbRow = mapper.toDb(newItem, 0);
    if (hasUpdatedAt && dbRow.updated_at === undefined) {
      dbRow.updated_at = new Date().toISOString();
    }
    const { error: upsertErr } = await supabase.from(tableName).upsert(dbRow, { onConflict: 'id' });
    if (upsertErr) {
      console.error(`[mergeAndPushCloudList] Error upserting ${key}:`, upsertErr);
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const mapped = data.map(mapper.fromDb);
      saveLocalCache(key, mapped);
      return mapped;
    }
  } catch (e) {
    // fallback to optimistic list
  }
  return optimisticList;
}

/**
 * Resolve correct MIME type by file extension or browser type
 * Ensures ZIP, RAR, PDF, Office, and media formats upload properly
 */
export function getFileMimeType(file) {
  if (!file) return 'application/octet-stream';
  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  const mimeMap = {
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    mp4: 'video/mp4'
  };
  if (ext && mimeMap[ext]) return mimeMap[ext];
  return file.type || 'application/octet-stream';
}

/**
 * Upload a File/Blob to Supabase Storage bucket `cnt-media` and return its public CDN URL.
 * Mengikuti arsitektur quick-drop (upsert: false) dengan fallback multi-tier:
 * 1. Direct Supabase Storage upload
 * 2. Same-origin reverse proxy (/storage-proxy) jika direct access diblokir CORS/VPN
 * 3. Base64 dataURL untuk file < 5MB agar data selalu tersimpan ke Supabase
 */
export async function uploadMediaToCloud(file, folder = 'uploads') {
  if (!file) throw new Error('File tidak valid atau tidak ditemukan');

  const originalName = file.name || 'file';
  const parts = originalName.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const baseName = parts.join('.').replace(/[^a-zA-Z0-9_-]/g, '_').slice(-40) || 'file';
  const cleanExt = (ext || 'dat').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `${Date.now()}_${baseName}.${cleanExt}`;
  const path = `${folder}/${fileName}`;

  // 1. Direct Supabase SDK upload (sama persis dengan arsitektur quick-drop: upsert: false tanpa override header)
  try {
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('cnt-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (!uploadErr && uploadData) {
      const { data: pubData } = supabase.storage.from('cnt-media').getPublicUrl(path);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }

    if (uploadErr) {
      console.warn('Direct Supabase upload failed, falling back to same-origin reverse proxy...', uploadErr);
    }
  } catch (err) {
    console.warn('Direct upload exception, trying same-origin proxy...', err);
  }

  // 2. Fallback: Same-Origin Reverse Proxy Netlify (/storage-proxy)
  // Menembus blokir jaringan kantor/VPN dan bypass pemeriksaan CORS browser
  try {
    const proxyUrl = `/storage-proxy/object/cnt-media/${path}`;
    const proxyRes = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      },
      body: file
    });

    if (proxyRes.ok) {
      const { data: pubData } = supabase.storage.from('cnt-media').getPublicUrl(path);
      return pubData?.publicUrl || `/storage-proxy/object/public/cnt-media/${path}`;
    }
  } catch (proxyErr) {
    console.warn('Proxy upload failed:', proxyErr);
  }

  // 3. Fallback: Base64 dataURL untuk file < 5MB (menjamin data tetap masuk ke database Supabase)
  if (file.size < 5 * 1024 * 1024) {
    console.info('Menggunakan Base64 dataURL fallback untuk memastikan data tersimpan...');
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  throw new Error('Gagal mengunggah berkas. Pastikan ukuran berkas di bawah batas kapasitas.');
}

/**
 * Extract bucket-relative path from a Supabase Storage public CDN URL
 */
export function extractStoragePath(url, bucketName = 'cnt-media') {
  if (!url || typeof url !== 'string') return null;
  const markers = [
    `/storage/v1/object/public/${bucketName}/`,
    `/storage-proxy/object/public/${bucketName}/`,
    `/storage-proxy/object/${bucketName}/`
  ];
  for (const marker of markers) {
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(url.substring(idx + marker.length));
    }
  }
  return null;
}

/**
 * Delete a file from Supabase Storage bucket `cnt-media` given its public CDN URL.
 * Silently ignores local assets (/assets/...) or external links.
 */
export async function deleteMediaFromCloud(url, bucketName = 'cnt-media') {
  const path = extractStoragePath(url, bucketName);
  if (!path) return false;

  try {
    const { error } = await supabase.storage.from(bucketName).remove([path]);
    return !error;
  } catch (e) {
    return false;
  }
}
