import { createClient } from '@supabase/supabase-js';

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

export const rowMappers = {
  tenures: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      code: item.code || '2026',
      title: item.title || '',
      theme_tagline: item.themeTagline || '',
      hero_headline: item.heroHeadline || 'COMMITTED TO CULTIVATE',
      hero_highlight: item.heroHighlight || 'EXCELLENCE & SYNERGY',
      visi: item.visi || '',
      misi: Array.isArray(item.misi) ? item.misi : [],
      is_active: Boolean(item.isActive),
      start_date: item.startDate || null,
      end_date: item.endDate || null,
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
      startDate: row.start_date,
      endDate: row.end_date
    })
  },

  divisions: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      tenure_id: item.tenureId || 'tenure-2026',
      name: item.name || '',
      slug: item.slug || '',
      lead_name: item.leadName || '',
      lead_role: item.leadRole || '',
      badge: item.badge || '',
      color: item.color || '#0284c7',
      icon: item.icon || 'Activity',
      motto: item.motto || '',
      description: item.description || '',
      focus_areas: Array.isArray(item.focusAreas) ? item.focusAreas : [],
      requirements: Array.isArray(item.requirements) ? item.requirements : [],
      is_recruiting: item.isRecruiting !== false,
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id || 'tenure-2026',
      name: row.name,
      slug: row.slug,
      leadName: row.lead_name,
      leadRole: row.lead_role,
      badge: row.badge,
      color: row.color || '#0284c7',
      icon: row.icon || 'Activity',
      motto: row.motto,
      description: row.description,
      focusAreas: Array.isArray(row.focus_areas) ? row.focus_areas : [],
      requirements: Array.isArray(row.requirements) ? row.requirements : [],
      isRecruiting: row.is_recruiting !== false
    })
  },

  members: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      tenure_id: item.tenureId || 'tenure-2026',
      division_id: item.divisionId || null,
      category: item.category || 'anggota',
      name: item.name || '',
      short_name: item.shortName || (item.name ? item.name.split(' ')[0] : ''),
      role: item.role || '',
      title: item.title || '',
      image: item.image || '',
      badge: item.badge || '',
      color: item.color || '#FFB800',
      whatsapp: item.whatsapp || '',
      motto: item.motto || '',
      responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : [],
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id || 'tenure-2026',
      divisionId: row.division_id || undefined,
      category: row.category,
      name: row.name,
      shortName: row.short_name,
      role: row.role,
      title: row.title,
      image: row.image || '',
      badge: row.badge,
      color: row.color || '#FFB800',
      whatsapp: row.whatsapp || '',
      motto: row.motto || '',
      responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : []
    })
  },

  events: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      tenure_id: item.tenureId || 'tenure-2026',
      division_id: item.divisionId || null,
      division_name: item.divisionName || '',
      title: item.title || '',
      date: item.date || '',
      start_date: item.startDate || '',
      end_date: item.endDate || '',
      badge: item.badge || 'Program Budaya',
      location: item.location || '',
      kpi: item.kpi || '',
      description: item.description || '',
      total_rab: Number(item.totalRab || 0),
      status: item.status || 'Upcoming',
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id || 'tenure-2026',
      divisionId: row.division_id,
      divisionName: row.division_name,
      title: row.title,
      date: row.date,
      startDate: row.start_date,
      endDate: row.end_date,
      badge: row.badge,
      location: row.location,
      kpi: row.kpi,
      description: row.description,
      totalRab: Number(row.total_rab || 0),
      status: row.status || 'Upcoming'
    })
  },

  galleries: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      tenure_id: item.tenureId || 'tenure-2026',
      title: item.title || '',
      date: item.date || '',
      division: item.division || '',
      description: item.description || '',
      photos: Array.isArray(item.photos) ? item.photos : [],
      doc_links: Array.isArray(item.docLinks) ? item.docLinks : [],
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id || 'tenure-2026',
      title: row.title,
      date: row.date,
      division: row.division,
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
      date: item.date || 'Baru saja',
      exact_timestamp: item.exactTimestamp || item.date || '',
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      sender: row.sender,
      recipient: row.recipient,
      category: row.category || 'Kolaboratif',
      message: row.message,
      likes: Number(row.likes ?? 1),
      date: row.date || 'Baru saja',
      exactTimestamp: row.exact_timestamp || row.date || ''
    })
  },

  aspirasiList: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      sender: item.sender || 'Anonim',
      title: item.title || item.text || '',
      category: item.category || 'Kegiatan & Event',
      description: item.description || item.text || '',
      text: item.text || item.description || item.title || '',
      submitted_at: item.submittedAt || '',
      status: item.status || 'Menunggu Review',
      admin_reply: item.adminReply || '',
      is_public: item.isPublic !== false,
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      sender: row.sender || 'Anonim',
      title: row.title || row.text || '',
      category: row.category || 'Kegiatan & Event',
      description: row.description || row.text || '',
      text: row.text || row.description || row.title || '',
      submittedAt: row.submitted_at,
      status: row.status || 'Menunggu Review',
      adminReply: row.admin_reply || '',
      isPublic: row.is_public !== false
    })
  },

  forms: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      title: item.title || '',
      subtitle: item.subtitle || '',
      category: item.category || 'Kegiatan & Event',
      batch: item.batch || '',
      deadline: item.deadline || '',
      is_open: item.isOpen !== false,
      banner_image: item.bannerImage || '',
      description: item.description || '',
      fields: Array.isArray(item.fields) ? item.fields : [],
      timeline: Array.isArray(item.timeline) ? item.timeline : [],
      benefits: Array.isArray(item.benefits) ? item.benefits : [],
      sort_order: idx
    }),
    fromDb: (row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      category: row.category,
      batch: row.batch,
      deadline: row.deadline,
      isOpen: row.is_open !== false,
      bannerImage: row.banner_image || '',
      description: row.description || '',
      fields: Array.isArray(row.fields) ? row.fields : [],
      timeline: Array.isArray(row.timeline) ? row.timeline : [],
      benefits: Array.isArray(row.benefits) ? row.benefits : []
    })
  },

  submissions: {
    toDb: (item) => ({
      id: String(item.id),
      form_id: item.formId || 'form-oprec-2026',
      form_title: item.formTitle || 'Formulir',
      submitted_at: item.submittedAt || '',
      status: item.status || 'Submitted',
      admin_notes: item.adminNotes || '',
      data: item.data || {},
      files: item.files || {}
    }),
    fromDb: (row) => ({
      id: row.id,
      formId: row.form_id,
      formTitle: row.form_title,
      submittedAt: row.submitted_at,
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
      badge: row.badge || 'Official Asset'
    })
  },

  eventRsvps: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      event_id: item.eventId || '',
      event_title: item.eventTitle || '',
      attendee_name: item.attendeeName || '',
      squad_unit: item.squadUnit || '',
      attendance_mode: item.attendanceMode || 'Hadir Onsite',
      notes: item.notes || '',
      submitted_at: item.submittedAt || '',
      sort_order: idx,
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      eventId: row.event_id || '',
      eventTitle: row.event_title || '',
      attendeeName: row.attendee_name || '',
      squadUnit: row.squad_unit || '',
      attendanceMode: row.attendance_mode || 'Hadir Onsite',
      notes: row.notes || '',
      submittedAt: row.submitted_at || ''
    })
  },

  faqs: {
    toDb: (item, idx = 0) => ({
      id: String(item.id),
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || 'Umum',
      asked_by: item.askedBy || 'Admin CNT',
      submitted_at: item.submittedAt || '',
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
      submittedAt: row.submitted_at || '',
      isPublished: row.is_published !== false
    })
  }
};

/**
 * Fetch all dedicated tables from Supabase and sync to LocalStorage cache
 */
export async function fetchAllCloudState() {
  try {
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
    if (!settingsRes.error && Array.isArray(settingsRes.data)) {
      for (const row of settingsRes.data) {
        if (row.key === 'page_visibility' && row.value) {
          result.pageVisibility = row.value;
          saveLocalCache('pageVisibility', row.value);
        }
        if (row.key === 'active_tenure_id' && row.value?.id) {
          result.activeTenureId = row.value.id;
          saveLocalCache('activeTenureId', row.value.id);
        }
        if (row.key === 'announcement_bar' && row.value) {
          result.announcementBar = row.value;
          saveLocalCache('announcementBar', row.value);
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
      await supabase.from('page_settings').upsert({
        key: 'page_visibility',
        value,
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
      await supabase.from('page_settings').upsert({
        key: 'announcement_bar',
        value,
        updated_at: new Date().toISOString()
      });
      return true;
    }

    const tableName = TABLE_MAP[key];
    const mapper = rowMappers[key];
    if (!tableName || !mapper || !Array.isArray(value)) {
      return false;
    }

    const dbRows = value.map((item, idx) => mapper.toDb(item, idx));
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
      if (error) return false;
    }

    return true;
  } catch (e) {
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

  try {
    const dbRow = mapper.toDb(newItem, 0);
    await supabase.from(tableName).upsert(dbRow, { onConflict: 'id' });

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
 * Falls back to Base64 dataURL for small offline files.
 */
export async function uploadMediaToCloud(file, folder = 'uploads') {
  if (!file) return null;

  const ext = (file.name || '').split('.').pop() || '';
  const baseName = (file.name || 'file').slice(0, -(ext.length ? ext.length + 1 : 0));
  const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-60);
  const safeName = ext ? `${safeBase}.${ext.toLowerCase()}` : safeBase;
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;

  const resolvedMime = getFileMimeType(file);

  try {
    const { data: uploadData, error } = await supabase.storage
      .from('cnt-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: resolvedMime
      });

    if (!error && uploadData) {
      const { data: pubData } = supabase.storage.from('cnt-media').getPublicUrl(path);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }

    if (error) {
      console.error('Supabase Storage error:', error);
      throw error;
    }
  } catch (e) {
    console.error('Upload exception:', e);
    // If small file (< 2MB) and offline, fallback to Base64
    if (file.size < 2 * 1024 * 1024) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    }
    throw e;
  }

  return null;
}

/**
 * Extract bucket-relative path from a Supabase Storage public CDN URL
 */
export function extractStoragePath(url, bucketName = 'cnt-media') {
  if (!url || typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + marker.length));
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
