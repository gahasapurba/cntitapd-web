// Date utilities for Indonesian locale & form deadlines

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Parses an Indonesian date string (e.g. "31 Maret 2026") or ISO string ("2026-03-31")
 * into a valid ISO string "YYYY-MM-DD". Returns empty string if invalid.
 */
export function parseDateToIso(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (match) {
    const day = String(parseInt(match[1], 10)).padStart(2, '0');
    const monthKey = match[2].toLowerCase();
    const year = match[3];
    const monthIdx = INDONESIAN_MONTHS.findIndex(m => m.toLowerCase() === monthKey);
    if (monthIdx !== -1) {
      const month = String(monthIdx + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback try standard JS Date
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return '';
}

/**
 * Formats an ISO string (YYYY-MM-DD) into Indonesian date string ("31 Maret 2026").
 */
export function formatToIndonesianDate(isoOrDateStr) {
  if (!isoOrDateStr) return '';
  const str = String(isoOrDateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;
  }
  return str;
}

/**
 * Evaluates the status of a form deadline string.
 * Considers end of the deadline day (23:59:59).
 */
/**
 * Format deadline string into human-readable Indonesian text with Day Name and WIB Time.
 * Example: "Kamis, 05 November 2026 - 17.00 WIB"
 */
export function formatDeadlineWib(deadlineStr) {
  if (!deadlineStr) return 'Tanpa batas waktu';
  const trimmed = String(deadlineStr).trim();
  if (!trimmed || trimmed.toLowerCase() === 'menyesuaikan' || trimmed.toLowerCase() === 'tanpa batas' || trimmed.toLowerCase() === 'tanpa batas waktu') {
    return 'Tanpa batas waktu';
  }

  // Direct local ISO match: YYYY-MM-DD or YYYY-MM-DDTHH:mm(:ss)
  // Extracts the clock digits directly so NO timezone shift (+7) occurs,
  // regardless of whether the string ends with Z, +00:00, +07:00, or has no offset.
  const dtMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dtMatch) {
    const y = parseInt(dtMatch[1], 10);
    const mo = parseInt(dtMatch[2], 10);
    const dNum = parseInt(dtMatch[3], 10);
    const h = dtMatch[4] !== undefined ? dtMatch[4] : '23';
    const mi = dtMatch[5] !== undefined ? dtMatch[5] : '59';
    const s = dtMatch[6] !== undefined ? dtMatch[6] : '59';

    const localDayObj = new Date(y, mo - 1, dNum);
    const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const weekday = INDO_DAYS[localDayObj.getDay()] || '';
    const day = String(dNum).padStart(2, '0');
    const month = INDONESIAN_MONTHS[mo - 1] || '';
    const year = String(y);

    const timeStr = (s && s !== '00' && s !== '59') 
      ? `${h}.${mi}.${s} WIB`
      : `${h}.${mi} WIB`;

    return `${weekday}, ${day} ${month} ${year} - ${timeStr}`;
  }

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) {
    return trimmed;
  }

  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const m = {};
  parts.forEach(p => { m[p.type] = p.value; });

  const weekday = m.weekday || '';
  const day = m.day || '';
  const month = m.month || '';
  const year = m.year || '';
  const hour = m.hour || '00';
  const minute = m.minute || '00';
  const second = m.second || '00';

  const timeStr = (second && second !== '00') 
    ? `${hour}.${minute}.${second} WIB`
    : `${hour}.${minute} WIB`;

  return `${weekday}, ${day} ${month} ${year} - ${timeStr}`;
}

/**
 * Converts date or timestamptz string into HTML5 <input type="datetime-local" step="1"> value
 * strictly in Asia/Jakarta (WIB) timezone: YYYY-MM-DDTHH:mm:ss.
 */
export function toDatetimeLocalSecondsValue(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  // Directly extracts calendar date and clock time from the ISO prefix.
  // Preserves user-entered WIB clock digits without +7 shift even if string has Z or +00:00 offset.
  const directMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/);
  if (directMatch) {
    const sec = directMatch[3] !== undefined ? directMatch[3] : '00';
    return `${directMatch[1]}T${directMatch[2]}:${sec}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T23:59:59`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const m = {};
    parts.forEach(p => { m[p.type] = p.value; });
    if (m.year && m.month && m.day) {
      return `${m.year}-${m.month}-${m.day}T${m.hour || '00'}:${m.minute || '00'}:${m.second || '00'}`;
    }
  }
  return '';
}

/**
 * Returns deadline status: isExpired, isToday, daysLeft, hoursLeft, and Indonesian formatted string.
 */
export function getDeadlineStatus(deadlineStr) {
  if (!deadlineStr || typeof deadlineStr !== 'string') {
    return {
      isValidDate: false,
      isExpired: false,
      isToday: false,
      daysLeft: null,
      hoursLeft: null,
      isoDate: '',
      formatted: 'Tanpa batas waktu',
      statusText: 'Tanpa batas waktu',
      statusBadge: null
    };
  }

  const trimmed = deadlineStr.trim();
  if (!trimmed || trimmed.toLowerCase() === 'menyesuaikan' || trimmed.toLowerCase() === 'tanpa batas' || trimmed.toLowerCase() === 'tanpa batas waktu') {
    return {
      isValidDate: false,
      isExpired: false,
      isToday: false,
      daysLeft: null,
      hoursLeft: null,
      isoDate: '',
      formatted: 'Tanpa batas waktu',
      statusText: 'Tanpa batas waktu',
      statusBadge: null
    };
  }

  let deadlineDate = null;
  const dtMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dtMatch) {
    const y = parseInt(dtMatch[1], 10);
    const mo = parseInt(dtMatch[2], 10);
    const dNum = parseInt(dtMatch[3], 10);
    const h = dtMatch[4] !== undefined ? parseInt(dtMatch[4], 10) : 23;
    const mi = dtMatch[5] !== undefined ? parseInt(dtMatch[5], 10) : 59;
    const s = dtMatch[6] !== undefined ? parseInt(dtMatch[6], 10) : 59;
    deadlineDate = new Date(y, mo - 1, dNum, h, mi, s);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, dNum] = trimmed.split('-').map(Number);
    deadlineDate = new Date(y, m - 1, dNum, 23, 59, 59, 999);
  } else {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      deadlineDate = d;
    }
  }

  if (!deadlineDate) {
    const iso = parseDateToIso(trimmed);
    if (iso) {
      const [y, m, dNum] = iso.split('-').map(Number);
      deadlineDate = new Date(y, m - 1, dNum, 23, 59, 59, 999);
    }
  }

  if (!deadlineDate) {
    return {
      isValidDate: false,
      isExpired: false,
      isToday: false,
      daysLeft: null,
      hoursLeft: null,
      isoDate: '',
      formatted: trimmed,
      statusText: trimmed,
      statusBadge: null
    };
  }

  const now = new Date();
  const isExpired = now.getTime() > deadlineDate.getTime();
  const formatted = formatDeadlineWib(trimmed);

  // Check same day in Asia/Jakarta
  const nowParts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const mNow = {};
  nowParts.forEach(p => { mNow[p.type] = p.value; });

  const dlParts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(deadlineDate);
  const mDl = {};
  dlParts.forEach(p => { mDl[p.type] = p.value; });

  const isToday = mNow.year === mDl.year && mNow.month === mDl.month && mNow.day === mDl.day;
  const msDiff = deadlineDate.getTime() - now.getTime();
  const hoursLeft = Math.floor(msDiff / (1000 * 60 * 60));
  const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

  let statusText = formatted;
  let statusBadge = null;

  if (isExpired) {
    statusText = `Ditutup (${formatted})`;
    statusBadge = 'expired';
  } else if (isToday) {
    if (hoursLeft > 0) {
      statusText = `Hari Terakhir! Sisa ${hoursLeft} jam (${formatted})`;
    } else {
      statusText = `Hari Terakhir! (${formatted})`;
    }
    statusBadge = 'today';
  } else if (daysLeft > 0 && daysLeft <= 3) {
    statusText = `Sisa ${daysLeft} hari (${formatted})`;
    statusBadge = 'urgent';
  }

  return {
    isValidDate: true,
    isExpired,
    isToday,
    daysLeft,
    hoursLeft,
    isoDate: deadlineDate.toISOString(),
    formatted,
    statusText,
    statusBadge
  };
}

/**
 * Dynamically formats an ISO timestamp into Indonesian relative time and exact WIB time.
 * Example: "1 Hari yang lalu (Rabu, 04 November 2026 - 18:32 WIB)"
 */
export function formatWibTimestamp(isoStr) {
  if (!isoStr) return { relative: 'Baru saja', exact: '', full: 'Baru saja' };
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return { relative: String(isoStr), exact: String(isoStr), full: String(isoStr) };

  // Enforce Asia/Jakarta (WIB, UTC+7) regardless of local browser timezone
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const partMap = {};
  parts.forEach(p => { partMap[p.type] = p.value; });

  const weekday = partMap.weekday || '';
  const day = (partMap.day || '').padStart(2, '0');
  const month = partMap.month || '';
  const year = partMap.year || '';
  const hour = (partMap.hour || '00').padStart(2, '0');
  const minute = (partMap.minute || '00').padStart(2, '0');

  const exact = `${weekday}, ${day} ${month} ${year} - ${hour}:${minute} WIB`;
  const shortDate = `${day} ${month.slice(0, 3)} ${year}, ${hour}:${minute} WIB`;

  // Relative time calculation
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));

  let relative = 'Baru saja';
  if (diffSec < 60) {
    relative = 'Baru saja';
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    relative = `${mins} Menit yang lalu`;
  } else if (diffSec < 86400) {
    const hrs = Math.floor(diffSec / 3600);
    relative = `${hrs} Jam yang lalu`;
  } else if (diffSec < 86400 * 30) {
    const days = Math.floor(diffSec / 86400);
    relative = `${days} Hari yang lalu`;
  } else if (diffSec < 86400 * 365) {
    const months = Math.floor(diffSec / (86400 * 30));
    relative = `${months} Bulan yang lalu`;
  } else {
    const years = Math.floor(diffSec / (86400 * 365));
    relative = `${years} Tahun yang lalu`;
  }

  return {
    relative,
    exact,
    shortDate,
    full: `${relative} (${exact})`
  };
}

/**
 * Convert any date / datetime / ISO string into standard HTML <input type="datetime-local"> value (YYYY-MM-DDTHH:mm)
 * strictly evaluated in WIB (Asia/Jakarta) timezone.
 */
export function toDatetimeLocalValue(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  // Directly extracts calendar date and clock time (HH:mm) from the ISO prefix.
  // Preserves user-entered WIB clock digits without +7 shift even if string has Z or +00:00 offset.
  const directMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (directMatch) {
    return `${directMatch[1]}T${directMatch[2]}`;
  }
  // Plain YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T09:00`;
  }
  // Try Date parsing in Asia/Jakarta
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const m = {};
    parts.forEach(p => { m[p.type] = p.value; });
    if (m.year && m.month && m.day) {
      return `${m.year}-${m.month}-${m.day}T${m.hour || '00'}:${m.minute || '00'}`;
    }
  }
  // Try parseDateToIso
  const iso = parseDateToIso(trimmed);
  if (iso) return `${iso}T09:00`;
  return '';
}

/**
 * Convert any date / datetime / legacy string into standard HTML <input type="date"> value (YYYY-MM-DD).
 */
export function toDateInputValue(str) {
  if (!str) return '';
  const dt = toDatetimeLocalValue(str);
  if (dt) return dt.split('T')[0];
  return parseDateToIso(str) || '';
}

/**
 * Format flexible date string into Indonesian text with WIB timezone.
 * Supports 5 modes:
 * 1. Tahun Saja: "2026" -> "2026"
 * 2. Bulan & Tahun: "2026-05" -> "Mei 2026"
 * 3. Rentang Tanggal: "2026-08-18/2026-08-20" -> "18 - 20 Agustus 2026"
 * 4. Tanggal Lengkap: "2026-03-10" -> "10 Maret 2026"
 * 5. Pilih Tanggal (Multiple): "2026-11-23, 2026-11-25" -> "23, 25 November 2026"
 * Also supports ISO datetime / timestamptz with hours (e.g. "2026-03-10T14:30" -> "10 Maret 2026 • 14:30 WIB")
 */
export function formatWibDateTime(str, options = {}) {
  if (!str) return '';
  const trimmed = String(str).trim();

  // 0. Multiple Dates (dipisahkan koma, contoh: "2026-11-23, 2026-11-25" atau "2026-10-25, 2026-11-25")
  if (trimmed.includes(',')) {
    const rawParts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    if (rawParts.length > 1 && rawParts.every(p => /^\d{4}-\d{2}-\d{2}/.test(p))) {
      return formatMultipleDates(rawParts);
    }
  }

  // 1. Tahun saja (YYYY)
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Bulan & Tahun (YYYY-MM)
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [y, m] = trimmed.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      return `${INDONESIAN_MONTHS[m - 1]} ${y}`;
    }
  }

  // 3. Rentang Tanggal (YYYY-MM-DD/YYYY-MM-DD atau YYYY-MM-DD to YYYY-MM-DD)
  if (trimmed.includes('/') || /\sto\s/i.test(trimmed)) {
    const parts = trimmed.split(/[\/]|\sto\s/i).map(s => s.trim());
    if (parts.length === 2 && /^\d{4}-\d{2}-\d{2}/.test(parts[0]) && /^\d{4}-\d{2}-\d{2}/.test(parts[1])) {
      return formatWibEventRange(parts[0], parts[1]);
    }
  }

  // 4. If plain YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;
  }

  // Check if timestamptz was created from date-only (midnight UTC) or has actual time
  const isMidnightUtc = /T00:00(:00)?(\.0+)?(Z|\+00:?00)?$/i.test(trimmed);
  const isPlainDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const hasTime = !isMidnightUtc && !isPlainDate && (trimmed.includes('T') || /:\d{2}/.test(trimmed));

  // If it has date and time in ISO format: extract directly to prevent +7 hours jumping
  const dtMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dtMatch && hasTime && dtMatch[4] !== undefined) {
    const y = parseInt(dtMatch[1], 10);
    const mo = parseInt(dtMatch[2], 10);
    const dNum = parseInt(dtMatch[3], 10);
    const h = dtMatch[4];
    const mi = dtMatch[5] || '00';

    const localDayObj = new Date(y, mo - 1, dNum);
    const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const weekday = INDO_DAYS[localDayObj.getDay()] || '';
    const day = String(dNum);
    const month = INDONESIAN_MONTHS[mo - 1] || '';
    const year = String(y);

    let res = `${day} ${month} ${year}`;
    if (options.includeWeekday && weekday) {
      res = `${weekday}, ${res}`;
    }
    res = `${res} • ${h}:${mi} WIB`;
    return res;
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: options.includeWeekday ? 'long' : undefined,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: hasTime ? '2-digit' : undefined,
      minute: hasTime ? '2-digit' : undefined,
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const m = {};
    parts.forEach(p => { m[p.type] = p.value; });

    let res = `${m.day || ''} ${m.month || ''} ${m.year || ''}`.trim();
    if (options.includeWeekday && m.weekday) {
      res = `${m.weekday}, ${res}`;
    }
    if (hasTime && m.hour && m.minute) {
      res = `${res} • ${m.hour}:${m.minute} WIB`;
    }
    return res;
  }

  return trimmed;
}

/**
 * Parse an existing date string into components and active mode.
 * Modes: 'date' (Tanggal Lengkap), 'range' (Rentang Tanggal), 'month' (Bulan & Tahun), 'year' (Tahun Saja)
 */
export function parseFlexibleDate(str) {
  const curYear = new Date().getFullYear();
  const curMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const today = new Date().toISOString().split('T')[0];

  if (!str) {
    return {
      mode: 'date',
      date: today,
      startDate: today,
      endDate: today,
      month: `${curYear}-${curMonth}`,
      year: String(curYear)
    };
  }

  const trimmed = String(str).trim();

  // Mode 5: Pilih Tanggal / Multiple Dates (dipisahkan koma, contoh: "2026-11-23, 2026-11-25")
  if (trimmed.includes(',')) {
    const rawParts = trimmed.split(',').map(s => s.trim().split('T')[0]).filter(Boolean);
    if (rawParts.length > 1 && rawParts.every(p => /^\d{4}-\d{2}-\d{2}/.test(p))) {
      const sorted = Array.from(new Set(rawParts)).sort();
      const first = sorted[0] || today;
      const last = sorted[sorted.length - 1] || first;
      return {
        mode: 'dates',
        dates: sorted,
        date: first,
        startDate: first,
        endDate: last,
        month: first.slice(0, 7) || `${curYear}-${curMonth}`,
        year: first.slice(0, 4) || String(curYear)
      };
    }
  }

  // Mode 4: Year only (e.g. "2026")
  if (/^\d{4}$/.test(trimmed)) {
    return {
      mode: 'year',
      year: trimmed,
      date: `${trimmed}-01-01`,
      startDate: `${trimmed}-01-01`,
      endDate: `${trimmed}-12-31`,
      month: `${trimmed}-01`,
      dates: [`${trimmed}-01-01`]
    };
  }

  // Mode 1: Month & Year (e.g. "2026-05")
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [y] = trimmed.split('-');
    return {
      mode: 'month',
      month: trimmed,
      year: y,
      date: `${trimmed}-01`,
      startDate: `${trimmed}-01`,
      endDate: `${trimmed}-28`,
      dates: [`${trimmed}-01`]
    };
  }

  // Mode 3: Date range (e.g. "2026-08-18/2026-08-20")
  if (trimmed.includes('/') || /\sto\s/i.test(trimmed)) {
    const parts = trimmed.split(/[\/]|\sto\s/i).map(s => s.trim());
    const sDate = parts[0]?.split('T')[0] || today;
    const eDate = parts[1]?.split('T')[0] || sDate;
    return {
      mode: 'range',
      startDate: sDate,
      endDate: eDate,
      date: sDate,
      month: sDate.slice(0, 7) || `${curYear}-${curMonth}`,
      year: sDate.slice(0, 4) || String(curYear),
      dates: [sDate, eDate]
    };
  }

  // Mode 2: Specific date (YYYY-MM-DD or timestamptz)
  const dVal = trimmed.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dVal)) {
    return {
      mode: 'date',
      date: dVal,
      startDate: dVal,
      endDate: dVal,
      month: dVal.slice(0, 7) || `${curYear}-${curMonth}`,
      year: dVal.slice(0, 4) || String(curYear),
      dates: [dVal]
    };
  }

  // Legacy string fallback (e.g. "Mei 2026" or "10 Maret 2026")
  const isoMatch = parseDateToIso(trimmed);
  if (isoMatch) {
    return {
      mode: 'date',
      date: isoMatch,
      startDate: isoMatch,
      endDate: isoMatch,
      month: isoMatch.slice(0, 7),
      year: isoMatch.slice(0, 4),
      dates: [isoMatch]
    };
  }

  return {
    mode: 'date',
    date: today,
    startDate: today,
    endDate: today,
    month: `${curYear}-${curMonth}`,
    year: String(curYear),
    dates: [today]
  };
}

/**
 * Format multiple arbitrary ISO dates into human Indonesian text.
 * Examples:
 * - 23 & 25 Nov 2026 -> "23, 25 November 2026"
 * - 25 Okt & 25 Nov 2026 -> "25 Oktober, 25 November 2026"
 * - 21 Mar 2025 & 25 Agu 2027 -> "21 Maret 2025, 25 Agustus 2027"
 */
export function formatMultipleDates(dates = []) {
  const validDates = dates
    .map(d => String(d || '').trim().split('T')[0])
    .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));

  if (validDates.length === 0) return '';
  if (validDates.length === 1) {
    const [y, m, d] = validDates[0].split('-').map(Number);
    return `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;
  }

  // Sort dates chronologically ascending and remove duplicates
  const sorted = Array.from(new Set(validDates)).sort();

  // Group by Year -> Month -> Days
  const yearMap = new Map();
  for (const dateStr of sorted) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!yearMap.has(y)) {
      yearMap.set(y, new Map());
    }
    const monthMap = yearMap.get(y);
    if (!monthMap.has(m)) {
      monthMap.set(m, []);
    }
    monthMap.get(m).push(d);
  }

  const yearParts = [];
  for (const [year, monthMap] of yearMap.entries()) {
    const monthParts = [];
    for (const [monthNum, days] of monthMap.entries()) {
      const monthName = INDONESIAN_MONTHS[monthNum - 1];
      const daysText = days.join(', ');
      monthParts.push(`${daysText} ${monthName}`);
    }
    yearParts.push(`${monthParts.join(', ')} ${year}`);
  }

  return yearParts.join(', ');
}

/**
 * Builds the compact standard ISO string based on the chosen mode.
 */
export function buildFlexibleDate(mode, fields = {}) {
  const curYear = new Date().getFullYear();
  const curMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const today = new Date().toISOString().split('T')[0];

  if (mode === 'dates') {
    const list = Array.isArray(fields.dates) ? fields.dates : [];
    const valid = list
      .map(d => String(d || '').trim().split('T')[0])
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (valid.length > 0) {
      return Array.from(new Set(valid)).sort().join(', ');
    }
    return String(fields.date || today).trim();
  }

  if (mode === 'year') {
    return String(fields.year || curYear).trim();
  }
  if (mode === 'month') {
    return String(fields.month || `${curYear}-${curMonth}`).trim();
  }
  if (mode === 'range') {
    const s = String(fields.startDate || today).trim();
    const e = String(fields.endDate || s).trim();
    return `${s}/${e}`;
  }
  // Default mode: 'date'
  return String(fields.date || today).trim();
}

/**
 * Format event date range (start & end) in Indonesian WIB format.
 * Handles datetime-local (with hours) as well as date-only (YYYY-MM-DD).
 */
export function formatWibEventRange(startDateStr, endDateStr, fallback = '') {
  if (!startDateStr && !endDateStr) return fallback;
  const s = String(startDateStr || '').trim();
  const e = String(endDateStr || s).trim();
  if (!s && !e) return fallback;

  const sHasTime = s.includes('T') || /\d{2}:\d{2}/.test(s);
  const eHasTime = e.includes('T') || /\d{2}:\d{2}/.test(e);

  const sDt = toDatetimeLocalValue(s);
  const eDt = toDatetimeLocalValue(e);

  if (!sDt) return s || fallback;

  const [sDatePart, sTimePart] = sDt.split('T');
  const [eDatePart, eTimePart] = (eDt || sDt).split('T');

  const [sY, sM, sD] = sDatePart.split('-').map(Number);
  const [eY, eM, eD] = eDatePart.split('-').map(Number);

  const sMonth = INDONESIAN_MONTHS[sM - 1];
  const eMonth = INDONESIAN_MONTHS[eM - 1];

  // Same day
  if (sDatePart === eDatePart) {
    if (sHasTime && eHasTime && sTimePart !== eTimePart) {
      return `${sD} ${sMonth} ${sY}, ${sTimePart} - ${eTimePart} WIB`;
    }
    if (sHasTime) {
      return `${sD} ${sMonth} ${sY}, ${sTimePart} WIB`;
    }
    return `${sD} ${sMonth} ${sY}`;
  }

  // Same month & year
  if (sY === eY && sM === eM) {
    return `${sD} - ${eD} ${sMonth} ${sY}`;
  }

  // Different month, same year
  if (sY === eY) {
    return `${sD} ${sMonth} - ${eD} ${eMonth} ${sY}`;
  }

  // Different year
  return `${sD} ${sMonth} ${sY} - ${eD} ${eMonth} ${eY}`;
}

/**
 * Format updated_at timestamp into human-readable relative + WIB date-time.
 * Pattern: "Terakhir diubah : 2 hari yang lalu (04 November 2026 - 13.30 WIB)"
 */
export function formatLastUpdatedWib(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  let relativeText = 'Baru saja';
  if (diffMs > 0) {
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) {
      relativeText = 'Baru saja';
    } else if (diffMins < 60) {
      relativeText = `${diffMins} menit yang lalu`;
    } else if (diffHours < 24) {
      relativeText = `${diffHours} jam yang lalu`;
    } else if (diffDays < 30) {
      relativeText = `${diffDays} hari yang lalu`;
    } else if (diffMonths < 12) {
      relativeText = `${diffMonths} bulan yang lalu`;
    } else {
      relativeText = `${diffYears} tahun yang lalu`;
    }
  }

  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const m = {};
  parts.forEach(p => { m[p.type] = p.value; });

  const day = m.day || '01';
  const month = m.month || '';
  const year = m.year || '';
  const hour = m.hour || '00';
  const minute = m.minute || '00';

  const wibTime = `${day} ${month} ${year} - ${hour}.${minute} WIB`;

  return `Terakhir diubah : ${relativeText} (${wibTime})`;
}

/**
 * Check if an event has already ended / passed the current time in WIB.
 * If endDate has time (e.g. 2026-11-11T13:00), compares against exact timestamp.
 * If date only (e.g. 2026-11-11), considers passed after 23:59:59 WIB of that date.
 */
export function isEventPassed(startDateStr, endDateStr) {
  if (!startDateStr && !endDateStr) return false;
  const targetStr = String(endDateStr || startDateStr || '').trim();
  if (!targetStr) return false;

  const now = new Date();
  if (targetStr.includes('T')) {
    const d = new Date(targetStr);
    if (!isNaN(d.getTime())) {
      return now.getTime() > d.getTime();
    }
  }

  const dateOnly = targetStr.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const endOfDay = new Date(`${dateOnly}T23:59:59`);
    if (!isNaN(endOfDay.getTime())) {
      return now.getTime() > endOfDay.getTime();
    }
  }

  return false;
}




