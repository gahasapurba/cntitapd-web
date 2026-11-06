import { createClient } from '@supabase/supabase-js';
import { formatWibEventRange } from '../utils/dateUtils.js';

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
  faqs: 'faqs'
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

const supportedUpdatedAtTables = new Set(['brand_assets', 'event_rsvps', 'faqs']);

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
  hasDivisionName: false
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
    const [dateRes, divNameRes, katRes, catRes, pesRes] = await Promise.all([
      supabase.from('events').select('date').limit(1),
      supabase.from('events').select('division_name').limit(1),
      supabase.from('events').select('kategori').limit(1),
      supabase.from('events').select('category').limit(1),
      supabase.from('events').select('peserta').limit(1)
    ]);
    eventsSchemaMeta.hasDate = !dateRes.error;
    eventsSchemaMeta.hasDivisionName = !divNameRes.error;
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
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      tenure_id: item.tenureId || null,
      division_id: item.divisionId || null,
      category: item.category || 'anggota',
      name: item.name || '',
      role: item.role || '',
      title: item.title || '',
      image: item.image || '',
      color: item.color || '#FFB800',
      whatsapp: item.whatsapp || '',
      motto: item.motto || '',
      responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : [],
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      divisionId: row.division_id || undefined,
      category: row.category,
      name: row.name,
      role: row.role,
      title: row.title,
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
      const catVal = item.kategori || item.category || item.badge || 'Program Budaya';
      const pesertaVal = item.peserta || item.kpi || 'Officer IT APD';
      const row = {
        id: String(item.id),
        tenure_id: item.tenureId || null,
        division_id: item.divisionId || null,
        title: item.title || '',
        start_date: item.startDate || '',
        end_date: item.endDate || '',
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
      startDate: row.start_date,
      endDate: row.end_date,
      kategori: row.kategori || row.category || row.badge || 'Program Budaya',
      category: row.kategori || row.category || row.badge || 'Program Budaya',
      badge: row.kategori || row.category || row.badge || 'Program Budaya',
      location: row.location,
      peserta: row.peserta || row.kpi || 'Officer IT APD',
      kpi: row.peserta || row.kpi || 'Officer IT APD',
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
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      divisionId: row.division_id || undefined,
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
      // Persist requiresTracking & tenureId inside fields[0] as resilient fallback if database column does not exist yet
      if (rawFields.length > 0) {
        rawFields[0] = {
          ...rawFields[0],
          _requiresTracking: item.requiresTracking !== false,
          _tenureId: item.tenureId || item.tenure_id || ''
        };
      }

      const row = {
        id: String(item.id),
        title: item.title || '',
        subtitle: item.subtitle || '',
        category: item.category || 'Kegiatan & Event',
        deadline: item.deadline || '',
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

      const tenureIdVal = row.tenure_id || (rawFields.length > 0 && rawFields[0]?._tenureId) || '';

      return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle || row.description || '',
        category: row.category,
        deadline: row.deadline,
        isOpen: row.is_open !== false,
        requiresTracking: isTracking,
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
      file_url: item.fileUrl || item.previewUrl || '',
      preview_url: item.previewUrl || item.fileUrl || '',
      file_type: item.fileType || 'PNG / ZIP',
      file_size: item.fileSize || '',
      badge: item.badge || 'Official Asset',
      sort_order: idx,
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      title: row.title,
      category: row.category || 'Logo & Brand',
      description: row.description || '',
      fileUrl: row.file_url || '',
      previewUrl: row.preview_url || row.file_url || '',
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
        sort_order: idx,
        updated_at: new Date().toISOString()
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
      sort_order: idx,
      updated_at: new Date().toISOString()
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
  }
};

/**
 * Fetch all dedicated tables from Supabase and sync to LocalStorage cache
 */
export async function fetchAllCloudState() {
  try {
    await Promise.all([
      checkGalleryDivisionIdColumn(),
      detectEventsSchema(),
      checkFormsTrackingColumn(),
      checkFormsTenureColumn(),
      checkRsvpsDepartmentColumn(),
      checkDivisionsSchema(),
      checkDepartmentsTable()
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
      }
    }

    return result;
  } catch (e) {
    return null;
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

    const tableName = TABLE_MAP[key];
    const mapper = rowMappers[key];
    if (!tableName || !mapper || !Array.isArray(value)) {
      return false;
    }

    if (key === 'divisions') {
      await checkDivisionsSchema();
    }
    if (key === 'galleries') {
      await checkGalleryDivisionIdColumn();
    }
    if (key === 'events') {
      await detectEventsSchema();
    }
    if (key === 'forms') {
      await checkFormsTrackingColumn();
      await checkFormsTenureColumn();
    }
    if (key === 'eventRsvps') {
      await checkRsvpsDepartmentColumn();
    }
    if (key === 'departments') {
      const supported = await checkDepartmentsTable();
      if (!supported) return true;
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
        row.updated_at = new Date().toISOString();
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
