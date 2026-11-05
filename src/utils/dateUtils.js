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
export function getDeadlineStatus(deadlineStr) {
  if (!deadlineStr || typeof deadlineStr !== 'string') {
    return {
      isValidDate: false,
      isExpired: false,
      isToday: false,
      daysLeft: null,
      isoDate: '',
      formatted: 'Menyesuaikan',
      statusText: 'Menyesuaikan',
      statusBadge: null
    };
  }

  const trimmed = deadlineStr.trim();
  if (!trimmed || trimmed.toLowerCase() === 'menyesuaikan' || trimmed.toLowerCase() === 'tanpa batas') {
    return {
      isValidDate: false,
      isExpired: false,
      isToday: false,
      daysLeft: null,
      isoDate: '',
      formatted: trimmed || 'Menyesuaikan',
      statusText: trimmed || 'Menyesuaikan',
      statusBadge: null
    };
  }

  const iso = parseDateToIso(trimmed);
  if (!iso) {
    return {
      isValidDate: false,
      isExpired: false,
      isToday: false,
      daysLeft: null,
      isoDate: '',
      formatted: trimmed,
      statusText: trimmed,
      statusBadge: null
    };
  }

  const [y, m, d] = iso.split('-').map(Number);
  const deadlineEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
  const now = new Date();

  const isToday = now.getFullYear() === y && (now.getMonth() + 1) === m && now.getDate() === d;
  const isExpired = now.getTime() > deadlineEnd.getTime();
  const msDiff = deadlineEnd.getTime() - now.getTime();
  const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
  const formatted = `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;

  let statusText = formatted;
  let statusBadge = null;

  if (isExpired) {
    statusText = `Ditutup (${formatted})`;
    statusBadge = 'expired';
  } else if (isToday) {
    statusText = `Hari Terakhir! (${formatted})`;
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
    isoDate: iso,
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
    full: `${relative} (${exact})`
  };
}


