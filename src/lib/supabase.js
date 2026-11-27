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
// Kolom mengikuti skema produksi (lihat supabase_schema.sql).
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
      sort_order: Number(item.sortOrder ?? idx)
    }),
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
        sort_order: Number(item.sortOrder ?? idx)
      };
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
        sort_order: Number(item.sortOrder ?? idx)
      };
      row.role_id = item.roleId || null;
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
        sort_order: Number(item.sortOrder ?? idx)
      };
      row.is_limited = Boolean(item.isLimited);
      row.max_quota = Number(item.maxQuota || item.quota || 0);
      row.is_public = Boolean(item.isPublic);
      row.category = catVal;
      row.peserta = pesertaVal;
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
        sort_order: Number(item.sortOrder ?? idx)
      };
      row.division_id = item.divisionId || null;
      row.event_id = item.eventId || null;
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
      sort_order: Number(item.sortOrder ?? idx)
    }),
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
      sort_order: Number(item.sortOrder ?? idx)
    }),
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
          _isLuckyDraw: isLuckyDrawVal,
          _notes: item.notes || ''
        };
      }

      const row = {
        id: String(item.id),
        title: item.title || '',
        subtitle: item.subtitle || '',
        category: item.category || 'Kegiatan & Event',
        // Kolom TIMESTAMPTZ menyimpan digit jam WIB apa adanya (lihat form_deadline_wib di migration)
        deadline: item.deadline ? toDatetimeLocalSecondsValue(item.deadline) : null,
        is_open: item.isOpen !== false,
        fields: rawFields,
        sort_order: Number(item.sortOrder ?? idx)
      };
      row.requires_tracking = item.requiresTracking !== false;
      row.tenure_id = item.tenureId || item.tenure_id || null;
      row.is_show_accepted = showAnnouncementVal;
      row.is_limited = isLimitedVal;
      row.max_quota = maxQuotaVal;
      row.is_event_connected = isEventConnectedVal;
      row.event_id = eventIdVal || null;
      row.is_lucky_draw = isLuckyDrawVal;
      row.notes = item.notes !== undefined && item.notes !== null ? item.notes : null;
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

      let notesVal = '';
      if (row.notes !== undefined && row.notes !== null) {
        notesVal = row.notes;
      } else if (rawFields.length > 0 && rawFields[0]?._notes !== undefined && rawFields[0]?._notes !== null) {
        notesVal = rawFields[0]._notes;
      }

      return {
        id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
        notes: notesVal || '',
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
      sortOrder: Number(row.sort_order ?? 0),
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
      sort_order: Number(item.sortOrder ?? idx)
    }),
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
        sort_order: Number(item.sortOrder ?? idx)
      };
      row.department_id = deptVal || null;
      return row;
    },
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
      sort_order: Number(item.sortOrder ?? idx)
    }),
    fromDb: (row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order ?? 0),
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
        form_id: item.formId || null,
        prize_name: item.prizeTitle || item.prizeName || 'Doorprize Utama',
        drawn_at: item.drawnAt || new Date().toISOString(),
        sort_order: Number(item.sortOrder ?? idx)
      };
      row.details = {
        winnerName: item.winnerName || '',
        winnerDepartment: item.winnerDepartment || item.winnerUnit || '',
        winnerIdentifier: item.winnerIdentifier || item.winnerPhone || '',
        drawNumber: Number(item.drawNumber || 0),
        source: item.source || '',
        drawnFieldLabel: item.drawnFieldLabel || '',
        drawnFieldValue: item.drawnFieldValue || ''
      };
      return row;
    },
    fromDb: (row) => {
      const details = row.details || {};
      return {
        id: row.id,
        eventId: row.event_id || '',
        submissionId: row.submission_id || '',
        formId: row.form_id || '',
        winnerName: details.winnerName || row.winner_name || '',
        winnerUnit: details.winnerDepartment || row.winner_unit || '',
        winnerDepartment: details.winnerDepartment || row.winner_unit || '',
        winnerPhone: details.winnerIdentifier || row.winner_phone || '',
        winnerIdentifier: details.winnerIdentifier || row.winner_phone || '',
        drawNumber: Number(details.drawNumber || 0),
        source: details.source || '',
        drawnFieldLabel: details.drawnFieldLabel || '',
        drawnFieldValue: details.drawnFieldValue || '',
        prizeName: row.prize_name || 'Doorprize Utama',
        prizeTitle: row.prize_name || 'Doorprize Utama',
        drawnAt: row.drawn_at || row.created_at || '',
        sortOrder: Number(row.sort_order || 0)
      };
    }
  }
};
// ============================================================================
// DATA FETCHING
// ============================================================================

// Data pribadi pendaftar & isi aspirasi: hanya dibaca admin berwenang dan tidak pernah
// disimpan di cache browser.
const PRIVATE_KEYS = ['submissions', 'eventRsvps', 'luckyDraws', 'aspirasiList'];
PRIVATE_KEYS.forEach((key) => {
  try { localStorage.removeItem(LOCAL_PREFIX + key); } catch (e) { /* storage unavailable */ }
});

const FETCH_ORDER = {
  tenures: 'sort_order',
  divisions: 'sort_order',
  departments: 'sort_order',
  members: 'sort_order',
  events: 'sort_order',
  galleries: 'sort_order',
  kudosList: 'created_at',
  aspirasiList: 'created_at',
  forms: 'sort_order',
  submissions: 'created_at',
  brandAssets: 'sort_order',
  eventRsvps: 'created_at',
  faqs: 'sort_order',
  tenureRoles: 'sort_order',
  luckyDraws: 'drawn_at'
};
const DESCENDING_ORDER = new Set(['created_at', 'drawn_at']);

const SETTING_KEYS = {
  pageVisibility: 'page_visibility',
  activeTenureId: 'active_tenure_id',
  announcementBar: 'announcement_bar',
  roleQuotas: 'role_quotas'
};

function enrichMembersAndDivisions(result) {
  // Lengkapi pengurus dengan kategori, jabatan & divisi dari tenure_roles
  if (Array.isArray(result.members)) {
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
  }

  // Ketua divisi ditentukan dari level jabatan pengurus di divisi tersebut
  if (Array.isArray(result.divisions)) {
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
  }
}

/**
 * Memuat seluruh tabel publik, ditambah tabel pribadi bila admin sedang login.
 * Pengunjung menerima jumlah pendaftar (agregat) & aspirasi publik lewat RPC.
 * Hanya data yang berhasil dimuat yang ada di hasil, sehingga kegagalan request
 * tidak pernah disangka sebagai tabel kosong.
 */
export async function fetchAllCloudState({ includePrivate = false } = {}) {
  const keys = Object.keys(FETCH_ORDER).filter((key) => includePrivate || !PRIVATE_KEYS.includes(key));
  const [settingsRes, countsRes, publicAspirasiRes, ...tableResults] = await Promise.all([
    supabase.from('page_settings').select('*'),
    includePrivate ? Promise.resolve(null) : supabase.rpc('get_registration_counts'),
    supabase.rpc('get_public_aspirasi'),
    ...keys.map((key) => {
      const column = FETCH_ORDER[key];
      let query = supabase.from(TABLE_MAP[key]).select('*').order(column, { ascending: !DESCENDING_ORDER.has(column) });
      if (column === 'sort_order') query = query.order('created_at', { ascending: true });
      return query;
    })
  ]);

  const result = {};
  const failed = [];

  tableResults.forEach((res, idx) => {
    const key = keys[idx];
    if (res.error || !Array.isArray(res.data)) {
      failed.push(key);
      return;
    }
    result[key] = res.data.map(rowMappers[key].fromDb);
  });

  if (countsRes) {
    if (countsRes.error || !Array.isArray(countsRes.data)) {
      failed.push('registrationCounts');
    } else {
      const counts = { forms: {}, events: {} };
      countsRes.data.forEach(({ kind, ref_id: refId, total }) => {
        if (kind === 'form') counts.forms[refId] = total;
        if (kind === 'event') counts.events[refId] = total;
      });
      result.registrationCounts = counts;
    }
  }

  // Super admin membaca seluruh aspirasi; pengunjung & admin divisi melihat aspirasi publik saja.
  if (publicAspirasiRes.error || !Array.isArray(publicAspirasiRes.data)) {
    if (!result.aspirasiList) failed.push('publicAspirasi');
  } else if (!result.aspirasiList || result.aspirasiList.length === 0) {
    result.aspirasiList = publicAspirasiRes.data.map((row) => ({ ...rowMappers.aspirasiList.fromDb(row), isPublic: true }));
  }

  if (settingsRes.error || !Array.isArray(settingsRes.data)) {
    failed.push('pageSettings');
  } else {
    for (const row of settingsRes.data) {
      if (!row.value) continue;
      if (row.key === SETTING_KEYS.pageVisibility) {
        result.pageVisibility = { ...row.value, _updatedAt: row.updated_at };
      } else if (row.key === SETTING_KEYS.activeTenureId && row.value.id) {
        result.activeTenureId = row.value.id;
      } else if (row.key === SETTING_KEYS.announcementBar) {
        result.announcementBar = { ...row.value, _updatedAt: row.updated_at };
      } else if (row.key === SETTING_KEYS.roleQuotas) {
        result.roleQuotas = row.value;
      }
    }
  }

  enrichMembersAndDivisions(result);

  Object.keys(result).forEach((key) => {
    if (!PRIVATE_KEYS.includes(key) && key !== 'registrationCounts') saveLocalCache(key, result[key]);
  });

  if (failed.length > 0) {
    console.error('Gagal memuat sebagian data dari Supabase:', failed.join(', '));
  }
  result.failed = failed;
  return result;
}

// ============================================================================
// ROW-LEVEL WRITES
// Setiap penulisan menyasar baris tertentu dan melempar error bila Supabase menolak,
// sehingga pemanggil dapat membatalkan perubahan atau memberi tahu pengguna.
// ============================================================================

const WRITE_CHUNK_SIZE = 200;
const DELETE_CHUNK_SIZE = 100;

function tableFor(key) {
  const table = TABLE_MAP[key];
  if (!table) throw new Error(`Tabel untuk "${key}" tidak dikenal`);
  return table;
}

function assertOk(response, action) {
  if (response.error) {
    throw new Error(`${action}: ${response.error.message}`);
  }
}

function chunk(list, size) {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
  return chunks;
}

/** Urutan berikutnya untuk item baru (di akhir daftar, atau di awal bila position = 'start'). */
export function nextSortOrder(list = [], position = 'end') {
  const orders = (Array.isArray(list) ? list : []).map((item) => Number(item?.sortOrder ?? 0));
  if (orders.length === 0) return 0;
  return position === 'start' ? Math.min(...orders) - 1 : Math.max(...orders) + 1;
}

/** Membuat atau memperbarui satu baris berdasarkan id. */
export async function saveRow(key, item) {
  const table = tableFor(key);
  assertOk(
    await supabase.from(table).upsert(rowMappers[key].toDb(item), { onConflict: 'id' }),
    `Gagal menyimpan data ${table}`
  );
}

/** Membuat atau memperbarui beberapa baris. Tidak pernah menghapus baris yang tidak ada di daftar. */
export async function saveRows(key, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const table = tableFor(key);
  for (const part of chunk(items, WRITE_CHUNK_SIZE)) {
    assertOk(
      await supabase.from(table).upsert(part.map((item) => rowMappers[key].toDb(item)), { onConflict: 'id' }),
      `Gagal menyimpan data ${table}`
    );
  }
}

export async function deleteRow(key, id) {
  const table = tableFor(key);
  assertOk(await supabase.from(table).delete().eq('id', String(id)), `Gagal menghapus data ${table}`);
}

export async function deleteRows(key, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const table = tableFor(key);
  for (const part of chunk(ids.map(String), DELETE_CHUNK_SIZE)) {
    assertOk(await supabase.from(table).delete().in('id', part), `Gagal menghapus data ${table}`);
  }
}

export async function deleteRowsWhere(key, column, value) {
  const table = tableFor(key);
  assertOk(await supabase.from(table).delete().eq(column, value), `Gagal menghapus data ${table}`);
}

export async function saveSetting(key, value) {
  const settingKey = SETTING_KEYS[key];
  if (!settingKey) throw new Error(`Pengaturan "${key}" tidak dikenal`);
  let storedValue = key === 'activeTenureId' ? { id: value } : value;
  if (storedValue && typeof storedValue === 'object' && '_updatedAt' in storedValue) {
    storedValue = { ...storedValue };
    delete storedValue._updatedAt;
  }
  assertOk(
    await supabase.from('page_settings').upsert({ key: settingKey, value: storedValue, updated_at: new Date().toISOString() }),
    `Gagal menyimpan pengaturan ${settingKey}`
  );
  saveLocalCache(key, value);
}

// ============================================================================
// PUBLIC RPC (pendaftaran & kiriman publik lewat fungsi database yang memeriksa
// tenggat, kuota, keunikan & panjang isian secara atomik)
// ============================================================================

const RPC_ERROR_MESSAGES = {
  FORM_NOT_FOUND: 'Formulir tidak ditemukan atau sudah dihapus.',
  FORM_CLOSED: 'Formulir ini sedang ditutup.',
  FORM_DEADLINE_PASSED: 'Batas waktu pendaftaran formulir ini telah berakhir.',
  FORM_QUOTA_FULL: 'Maaf, kuota pendaftaran formulir ini telah terpenuhi.',
  FORM_DUPLICATE: 'Data pada isian unik sudah pernah didaftarkan sebelumnya.',
  EVENT_NOT_FOUND: 'Acara tidak ditemukan atau tidak dibuka untuk umum.',
  RSVP_QUOTA_FULL: 'Maaf, kuota kehadiran acara ini telah terpenuhi.',
  KUDOS_NOT_FOUND: 'Kudos tidak ditemukan atau sudah dihapus.',
  INVALID_CATEGORY: 'Pilih salah satu dari 6 nilai AKHLAK.',
  INVALID_PAYLOAD: 'Data yang dikirim tidak valid. Periksa kembali panjang isian.',
  PAYLOAD_TOO_LARGE: 'Data yang dikirim terlalu besar.',
  NOT_AUTHORIZED: 'Anda tidak memiliki izin untuk tindakan ini.',
  USER_NOT_FOUND: 'Email belum terdaftar di Supabase Authentication. Buat akunnya terlebih dahulu.',
  CANNOT_DEMOTE_SELF: 'Anda tidak dapat menurunkan peran akun Anda sendiri.',
  CANNOT_REVOKE_SELF: 'Anda tidak dapat mencabut akses akun Anda sendiri.'
};

/** Error dari RPC, membawa kode mesin & pesan untuk pengguna. */
export class RpcError extends Error {
  constructor(code, detail, rawMessage) {
    const isKnown = Object.prototype.hasOwnProperty.call(RPC_ERROR_MESSAGES, code);
    super(isKnown ? RPC_ERROR_MESSAGES[code] : (rawMessage || 'Terjadi kesalahan pada server.'));
    // Hanya penolakan aturan bisnis yang memiliki kode; kegagalan jaringan/izin tidak.
    this.code = isKnown ? code : null;
    this.detail = detail;
  }
}

async function callRpc(name, params) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    const [code, detail] = String(error.message || '').split(':');
    throw new RpcError(code, detail, error.message);
  }
  return data;
}

/** Mengirim formulir publik. Mengembalikan id pendaftaran dari database. */
export function submitFormRegistration(formId, data, files = {}) {
  return callRpc('submit_form', { p_form_id: formId, p_data: data, p_files: files });
}

/** Mengirim RSVP publik. Mengembalikan id RSVP dari database. */
export function submitEventRsvp(eventId, attendeeName, attendanceMode, notes = '', departmentId = null) {
  return callRpc('submit_rsvp', {
    p_event_id: eventId,
    p_attendee_name: attendeeName,
    p_attendance_mode: attendanceMode,
    p_notes: notes,
    p_department_id: departmentId || null
  });
}

export async function fetchEventAttendees(eventId) {
  const rows = await callRpc('get_event_attendees', { p_event_id: eventId });
  return (rows || []).map((row) => ({
    id: row.id,
    eventId,
    attendeeName: row.attendee_name,
    departmentId: row.department_id || '',
    department: row.department_id || '',
    attendanceMode: row.attendance_mode,
    createdAt: row.created_at,
    submittedAt: row.created_at
  }));
}

export function isSubmissionValueTaken(formId, fieldId, value) {
  return callRpc('is_submission_value_taken', { p_form_id: formId, p_field_id: fieldId, p_value: value });
}

export async function trackSubmissions(query) {
  const rows = await callRpc('track_submissions', { p_query: query });
  return (rows || []).map((row) => ({
    id: row.id,
    formId: row.form_id,
    status: row.status,
    adminNotes: row.admin_notes || '',
    data: row.data || {},
    files: {},
    createdAt: row.created_at,
    submittedAt: row.created_at
  }));
}

export async function fetchAcceptedSubmissions(formId) {
  const rows = await callRpc('get_accepted_submissions', { p_form_id: formId });
  return (rows || []).map((row) => ({
    id: row.id,
    formId: row.form_id,
    createdAt: row.created_at,
    submittedAt: row.created_at,
    adminNotes: row.admin_notes || '',
    participantName: row.participant_name,
    participantDetail: row.participant_detail
  }));
}

export function submitKudos({ sender, recipient, category, message }) {
  return callRpc('submit_kudos', {
    p_sender: sender || '',
    p_recipient: recipient || '',
    p_category: category,
    p_message: message || ''
  });
}

const DEVICE_ID_KEY = 'cnt_device_id';

/** Id acak per perangkat untuk membatasi satu like per kudos (bukan data pribadi). */
export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id || id.length < 8) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** Like / batal like. Mengembalikan { liked, likes } dari database. */
export async function toggleKudosLike(kudosId) {
  const rows = await callRpc('toggle_kudos_like', { p_kudos_id: kudosId, p_device_id: getDeviceId() });
  const row = Array.isArray(rows) ? rows[0] : rows;
  return { liked: Boolean(row?.liked), likes: Number(row?.likes ?? 1) };
}

export function submitAspirasi({ sender, title, category, description, isPublic = true }) {
  return callRpc('submit_aspirasi', {
    p_sender: sender || '',
    p_title: title || '',
    p_category: category || '',
    p_description: description || '',
    p_is_public: isPublic !== false
  });
}

/** Pertanyaan FAQ dari pengunjung (belum terbit sampai dijawab admin). */
export async function submitPublicFaqQuestion(item) {
  const row = rowMappers.faqs.toDb({ ...item, isPublished: false });
  assertOk(await supabase.from('faqs').insert(row), 'Gagal mengirim pertanyaan');
}

// ============================================================================
// ADMIN AUTHENTICATION (Supabase Auth + peran di admin_profiles)
// ============================================================================

function mapAdminProfile(row) {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name || '',
    role: row.role,
    divisionId: row.division_id || null
  };
}

/** Profil admin untuk user yang login, atau null bila user bukan admin. */
export async function fetchAdminProfile(userId) {
  const { data, error } = await supabase.from('admin_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Gagal memuat profil admin: ${error.message}`);
  return data ? mapAdminProfile(data) : null;
}

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(email || '').trim(), password });
  if (error) {
    throw new Error(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message);
  }
  const profile = await fetchAdminProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('Akun ini belum memiliki akses admin. Hubungi super admin.');
  }
  return profile;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function listAdminProfiles() {
  const { data, error } = await supabase.from('admin_profiles').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(`Gagal memuat daftar admin: ${error.message}`);
  return data.map(mapAdminProfile);
}

export function assignAdminRole(email, role, divisionId, displayName = '') {
  return callRpc('assign_admin_role', {
    p_email: email,
    p_role: role,
    p_division_id: divisionId || null,
    p_display_name: displayName
  });
}

export function revokeAdminRole(userId) {
  return callRpc('revoke_admin_role', { p_user_id: userId });
}

// ============================================================================
// MEDIA STORAGE (bucket cnt-media)
// ============================================================================

const MEDIA_BUCKET = 'cnt-media';
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const SUBMISSION_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar'];

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

function uniqueSuffix() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Mengunggah berkas ke bucket `cnt-media` dan mengembalikan URL publiknya.
 * Bila akses langsung ke Supabase diblokir jaringan kantor, dicoba lewat reverse proxy
 * same-origin Netlify (/storage-proxy) dengan token sesi yang sama.
 */
export async function uploadMediaToCloud(file, folder = 'uploads') {
  if (!file) throw new Error('File tidak valid atau tidak ditemukan');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Ukuran berkas melebihi batas 20 MB.');

  const originalName = file.name || 'file';
  const parts = originalName.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const baseName = parts.join('.').replace(/[^a-zA-Z0-9_-]/g, '_').slice(-40) || 'file';
  const cleanExt = (ext || 'dat').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (folder === 'submissions' && !SUBMISSION_FILE_EXTENSIONS.includes(cleanExt)) {
    throw new Error(`Format berkas .${cleanExt} tidak didukung. Gunakan: ${SUBMISSION_FILE_EXTENSIONS.join(', ')}.`);
  }
  const path = `${folder}/${uniqueSuffix()}_${baseName}.${cleanExt}`;
  const contentType = getFileMimeType(file);

  let directError = null;
  try {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType
    });
    if (!error) {
      return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    }
    directError = error;
    // Penolakan izin/ukuran dari server tidak akan berubah lewat proxy
    const status = Number(error.statusCode || error.status || 0);
    if (status === 400 || status === 403 || status === 413) {
      throw new Error(`Gagal mengunggah berkas: ${error.message}`);
    }
  } catch (err) {
    if (String(err?.message || '').startsWith('Gagal mengunggah')) throw err;
    directError = err;
  }

  console.warn('Unggah langsung gagal, mencoba lewat proxy same-origin...', directError);
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || supabaseAnonKey;
  const proxyRes = await fetch(`/storage-proxy/object/${MEDIA_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
      'x-upsert': 'false'
    },
    body: file
  });
  if (!proxyRes.ok) {
    throw new Error('Gagal mengunggah berkas. Periksa koneksi lalu coba lagi.');
  }
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Extract bucket-relative path from a Supabase Storage public CDN URL
 */
export function extractStoragePath(url, bucketName = MEDIA_BUCKET) {
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

/** Menghapus berkas (best effort). Mengembalikan false bila berkas tidak dapat dihapus. */
export async function deleteMediaFromCloud(url, bucketName = MEDIA_BUCKET) {
  const path = extractStoragePath(url, bucketName);
  if (!path) return false;
  const { error } = await supabase.storage.from(bucketName).remove([path]);
  if (error) {
    console.error('Gagal menghapus berkas media:', error.message);
    return false;
  }
  return true;
}
