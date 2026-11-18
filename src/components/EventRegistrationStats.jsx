import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Sparkles,
  Trophy,
  Download,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  QrCode,
  FileSpreadsheet,
  X,
  Share2,
  HelpCircle,
  RotateCcw,
  BarChart3,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Copy,
  Check,
  Radio,
  Layers,
  Activity,
  Info,
  Lock
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { generateFormQrPoster } from '../utils/qrPosterGenerator';
import { formatWibTimestamp, formatDeadlineWib, formatToIndonesianDate, formatWibEventRange, getDeadlineStatus } from '../utils/dateUtils';
import { getPublicBaseUrl } from '../utils/urlUtils';

// Palette of 12 distinct vibrant colors for dynamic diagrams
const DIAGRAM_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // gold/yellow
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#84cc16', // lime
  '#6366f1'  // indigo
];

export default function EventRegistrationStats({
  eventId,
  events = [],
  forms = [],
  submissions = [],
  eventRsvps = [],
  luckyDraws = [],
  departments = [],
  divisions = [],
  onAddLuckyDraw,
  onDeleteLuckyDraw,
  onResetLuckyDraw,
  onBack,
  onNavigateForm,
  theme = 'dark'
}) {
  const isDark = theme === 'dark';

  // 1. Target Event & Connected Form
  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
  const connectedForm = useMemo(() => {
    if (!eventId) return null;
    return forms.find(f => f.isEventConnected && f.eventId === eventId) ||
      forms.find(f => f.eventId === eventId);
  }, [forms, eventId]);

  const isLuckyDrawEnabled = connectedForm ? Boolean(connectedForm.isLuckyDraw) : false;

  const isFormClosed = useMemo(() => {
    if (!connectedForm) return false;
    if (connectedForm.isOpen === false || Boolean(connectedForm.isClosed)) return true;
    if (connectedForm.deadline && getDeadlineStatus(connectedForm.deadline).isExpired) return true;
    return false;
  }, [connectedForm]);

  // View state: 'stats' | 'luckydraw'
  const [activeView, setActiveView] = useState('stats');

  // Submissions strictly from the connected form
  const formSubmissions = useMemo(() => {
    if (!connectedForm) return [];
    return submissions.filter(s => String(s.formId) === String(connectedForm.id));
  }, [submissions, connectedForm]);

  // Realtime Welcome Alert Queue state
  const seenSubIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);
  const [welcomeQueue, setWelcomeQueue] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);

  // Helper to safely extract participant name for the toast alert
  const extractParticipantName = useCallback((sub) => {
    if (!sub) return 'Peserta Baru';
    const d = sub.data || {};

    // 1. Direct standard candidate keys
    const directCandidate = d['f-fullName'] || d['f-name'] || d['fullName'] || d['namaLengkap'] || d['nama'] || d['name'] || sub.name || sub.fullName;
    if (directCandidate && typeof directCandidate === 'string' && directCandidate.trim()) {
      return directCandidate.trim();
    }

    // 2. Check connectedForm field definitions for label/id containing 'nama' or 'name'
    if (connectedForm && Array.isArray(connectedForm.fields)) {
      for (const f of connectedForm.fields) {
        const idLower = (f.id || '').toLowerCase();
        const lblLower = (f.label || '').toLowerCase();
        if (lblLower.includes('nama') || lblLower.includes('name') || idLower.includes('nama') || idLower.includes('name')) {
          const val = d[f.id] ?? d[`f-${f.id}`];
          if (val && typeof val === 'string' && val.trim()) {
            return val.trim();
          }
        }
      }
    }

    // 3. Fallback: scan any key in data whose key name includes 'nama' or 'name'
    for (const [key, val] of Object.entries(d)) {
      const kLower = key.toLowerCase();
      if ((kLower.includes('nama') || kLower.includes('name')) && val && typeof val === 'string' && val.trim()) {
        return val.trim();
      }
    }

    // 4. Default graceful fallback when no name field exists or was left empty
    return 'Peserta Baru';
  }, [connectedForm]);

  // Realtime submission detector
  useEffect(() => {
    if (!formSubmissions || formSubmissions.length === 0) {
      return;
    }

    // First mount: seed existing submissions so they don't flood alerts
    if (isFirstLoadRef.current) {
      formSubmissions.forEach(s => {
        if (s.id) seenSubIdsRef.current.add(String(s.id));
      });
      isFirstLoadRef.current = false;
      return;
    }

    // Detect truly newly arrived submissions
    const newItems = formSubmissions.filter(s => s.id && !seenSubIdsRef.current.has(String(s.id)));
    if (newItems.length > 0) {
      newItems.forEach(s => seenSubIdsRef.current.add(String(s.id)));

      // Sort chronological FIFO (earlier submission first)
      const sortedNew = [...newItems].sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tA - tB;
      });

      const alertsToAdd = sortedNew.map(s => ({
        id: s.id || `alert-${Date.now()}-${Math.random()}`,
        name: extractParticipantName(s)
      }));

      setWelcomeQueue(prev => [...prev, ...alertsToAdd]);
    }
  }, [formSubmissions, extractParticipantName]);

  // FIFO Queue Consumer: display alerts one by one, no piling up
  useEffect(() => {
    if (activeAlert) return;
    if (welcomeQueue.length === 0) return;

    const nextAlert = welcomeQueue[0];
    setActiveAlert(nextAlert);
    setWelcomeQueue(prev => prev.slice(1));
  }, [activeAlert, welcomeQueue]);

  // Auto-dismiss active alert after 3.8 seconds
  useEffect(() => {
    if (!activeAlert) return;

    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 3800);

    return () => clearTimeout(timer);
  }, [activeAlert]);

  // Initial event RSVPs (preserved in DB/state, but NOT counted into stats or draw while form is connected)
  const initialRsvps = useMemo(() => {
    if (!eventId) return [];
    return eventRsvps.filter(r => String(r.eventId) === String(eventId));
  }, [eventRsvps, eventId]);

  const [showArchivedRsvps, setShowArchivedRsvps] = useState(false);

  // Authoritative Quota & Limits:
  // When form is connected, follow form's limits. When not connected, follow event's limits.
  const effectiveIsLimited = connectedForm ? Boolean(connectedForm.isLimited) : Boolean(event?.isLimited);
  const effectiveMaxQuota = connectedForm ? Number(connectedForm.maxQuota || 0) : Number(event?.maxQuota || 0);
  const totalPendaftar = connectedForm ? formSubmissions.length : initialRsvps.length;

  const participationRate = useMemo(() => {
    if (!effectiveIsLimited || effectiveMaxQuota <= 0) return 0;
    return Math.min(100, Math.round((totalPendaftar / effectiveMaxQuota) * 100));
  }, [effectiveIsLimited, effectiveMaxQuota, totalPendaftar]);

  // QR Code Generation
  const directFormUrl = useMemo(() => {
    if (!connectedForm) return '';
    return `${getPublicBaseUrl()}/?tab=form&formId=${encodeURIComponent(connectedForm.id)}`;
  }, [connectedForm]);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!directFormUrl) {
      setQrCodeDataUrl('');
      return;
    }
    QRCode.toDataURL(directFormUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#030814',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [directFormUrl]);

  const handleCopyLink = async () => {
    if (!directFormUrl) return;
    try {
      await navigator.clipboard.writeText(directFormUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  // Poster modal state
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterModal, setPosterModal] = useState(null);

  const handleGeneratePoster = async () => {
    if (!connectedForm) return;
    setIsGeneratingPoster(true);
    try {
      const result = await generateFormQrPoster({
        form: connectedForm,
        event: event,
        baseUrl: getPublicBaseUrl()
      });

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      if (typeof navigator !== 'undefined' && navigator.canShare && result.blob) {
        try {
          const file = new File([result.blob], result.fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Poster QR: ${connectedForm.title}`,
              text: `Pendaftaran Acara ${event?.title || ''} via Formulir CNT IT APD`
            });
            setIsGeneratingPoster(false);
            return;
          }
        } catch (shareErr) {
          if (shareErr && shareErr.name === 'AbortError') {
            setIsGeneratingPoster(false);
            return;
          }
        }
      }

      if (isMobile) {
        setPosterModal(result);
        setIsGeneratingPoster(false);
        return;
      }

      const blobUrl = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 3000);
    } catch (err) {
      console.error('Error generating QR poster:', err);
    }
    setIsGeneratingPoster(false);
  };

  // Helper to extract clean applicant info from a submission
  const getSubmissionInfo = (sub) => {
    const d = sub.data || {};
    let name = '';
    let dept = '';
    let emailOrPhone = '';

    for (const [key, val] of Object.entries(d)) {
      const k = key.toLowerCase();
      const strVal = String(val || '').trim();
      if (!name && (k.includes('nama') || k.includes('peserta') || k.includes('name'))) {
        name = strVal;
      }
      if (!dept && (k.includes('departemen') || k.includes('divisi') || k.includes('unit') || k.includes('dept'))) {
        dept = strVal;
      }
      if (!emailOrPhone && (k.includes('email') || k.includes('whatsapp') || k.includes('hp') || k.includes('telepon') || k.includes('nip'))) {
        emailOrPhone = strVal;
      }
    }

    return {
      id: sub.id,
      name: name || sub.name || `Pendaftar #${sub.id.slice(-4)}`,
      department: dept || sub.department || 'Direktorat IT APD',
      identifier: emailOrPhone || sub.email || sub.phone || sub.nip || '-',
      submittedAt: sub.createdAt || sub.created_at || '',
      source: 'Form Pendaftaran'
    };
  };

  // =========================================================================
  // DYNAMIC DIAGRAM LOGIC (Choice / Dropdown Fields)
  // =========================================================================
  const choiceFields = useMemo(() => {
    if (!connectedForm?.fields || !Array.isArray(connectedForm.fields)) return [];
    return connectedForm.fields.filter(f => {
      const type = (f.type || '').toLowerCase();
      return ['select', 'radio', 'dropdown', 'choice'].includes(type) ||
        Array.isArray(f.options) ||
        f.source === 'departments';
    });
  }, [connectedForm]);

  const [activeDiagramFieldId, setActiveDiagramFieldId] = useState('');

  // Default to first choice field when available
  useEffect(() => {
    if (choiceFields.length > 0) {
      if (!activeDiagramFieldId || !choiceFields.some(f => f.id === activeDiagramFieldId)) {
        setActiveDiagramFieldId(choiceFields[0].id);
      }
    } else {
      setActiveDiagramFieldId('');
    }
  }, [choiceFields, activeDiagramFieldId]);

  const activeChoiceField = useMemo(() => {
    if (!activeDiagramFieldId) return choiceFields[0] || null;
    return choiceFields.find(f => f.id === activeDiagramFieldId) || choiceFields[0] || null;
  }, [activeDiagramFieldId, choiceFields]);

  // Compute breakdown for the active choice field
  const diagramData = useMemo(() => {
    if (!activeChoiceField) {
      // Fallback: Status breakdown
      const statusMap = { 'Accepted': 0, 'Submitted': 0, 'Rejected': 0 };
      formSubmissions.forEach(s => {
        const st = s.status || 'Submitted';
        statusMap[st] = (statusMap[st] || 0) + 1;
      });
      const total = formSubmissions.length;
      const items = Object.entries(statusMap).map(([opt, count], idx) => ({
        label: opt === 'Accepted' ? 'Diterima' : (opt === 'Submitted' ? 'Menunggu Review' : 'Ditolak'),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: DIAGRAM_COLORS[idx % DIAGRAM_COLORS.length]
      }));
      return {
        fieldLabel: 'Status Pendaftaran',
        items,
        totalAnswered: total,
        filledCount: items.filter(i => i.count > 0).length,
        totalCategories: items.length
      };
    }

    const fId = activeChoiceField.id;
    const fLabel = activeChoiceField.label || 'Pilihan';
    const answersMap = {};
    let totalAnswered = 0;

    // Collect pre-defined options if available
    const definedOptionsSet = new Set();
    if (Array.isArray(activeChoiceField.options)) {
      activeChoiceField.options.forEach(opt => {
        const val = typeof opt === 'object' ? (opt.value || opt.label || '') : String(opt);
        if (val.trim()) definedOptionsSet.add(val.trim());
      });
    } else if (activeChoiceField.source === 'departments' && Array.isArray(departments) && departments.length > 0) {
      departments.forEach(d => {
        const dName = typeof d === 'object' ? (d.name || d.label || '') : String(d);
        if (dName.trim()) definedOptionsSet.add(dName.trim());
      });
    }

    // Initialize counts for defined options
    definedOptionsSet.forEach(opt => {
      answersMap[opt] = 0;
    });

    // Tally submission responses
    formSubmissions.forEach(sub => {
      const val = sub.data?.[fLabel] ?? sub.data?.[fId] ?? '';
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        totalAnswered += 1;
        const ansKey = String(val).trim();
        answersMap[ansKey] = (answersMap[ansKey] || 0) + 1;
      }
    });

    const items = Object.entries(answersMap).map(([opt, count], idx) => ({
      label: opt,
      count,
      percentage: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0,
      color: DIAGRAM_COLORS[idx % DIAGRAM_COLORS.length]
    })).sort((a, b) => b.count - a.count);

    return {
      fieldLabel: fLabel,
      items,
      totalAnswered,
      filledCount: items.filter(i => i.count > 0).length,
      totalCategories: items.length
    };
  }, [activeChoiceField, formSubmissions, departments]);

  // =========================================================================
  // TABLE FILTERING, DYNAMIC MULTI-FILTER, SORTING & PAGINATION
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownFilters, setDropdownFilters] = useState({});
  const [winnerFilter, setWinnerFilter] = useState('ALL');

  // Dynamic choice / dropdown fields from connected form
  const dropdownFields = useMemo(() => {
    if (!connectedForm?.fields || !Array.isArray(connectedForm.fields)) return [];
    return connectedForm.fields.filter(f => {
      const type = (f.type || '').toLowerCase();
      return ['select', 'radio', 'dropdown', 'choice'].includes(type) ||
        Array.isArray(f.options) ||
        f.source === 'departments';
    });
  }, [connectedForm]);

  // Extract distinct available options for any dropdown field
  const getDropdownOptions = useCallback((df) => {
    const opts = new Set();
    if (Array.isArray(df.options)) {
      df.options.forEach(o => {
        const val = typeof o === 'object' ? (o.value || o.label || '') : String(o);
        if (val.trim()) opts.add(val.trim());
      });
    } else if (df.source === 'departments' && Array.isArray(departments)) {
      departments.forEach(d => {
        const dName = typeof d === 'object' ? (d.name || d.label || '') : String(d);
        if (dName.trim()) opts.add(dName.trim());
      });
    }
    // Also include any value that appears in the submissions data
    formSubmissions.forEach(sub => {
      const val = sub.data?.[df.label] ?? sub.data?.[df.id];
      if (val !== undefined && val !== null && String(val).trim()) {
        opts.add(String(val).trim());
      }
    });
    return Array.from(opts);
  }, [departments, formSubmissions]);

  // Dynamic search placeholder based on form fields
  const searchPlaceholder = useMemo(() => {
    if (connectedForm?.fields && connectedForm.fields.length > 0) {
      const sample = connectedForm.fields.slice(0, 3).map(f => f.label).join(', ');
      return `Cari ${sample}...`;
    }
    return 'Cari data pendaftar...';
  }, [connectedForm]);

  // Multi-sorting: { key, direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10, 25, 50, 'all'

  // Existing Lucky Draw Winners for this event (dynamically enriched from form submissions)
  const eventWinners = useMemo(() => {
    if (!eventId) return [];
    const rawList = (luckyDraws || []).filter(ld => ld.eventId === eventId);
    return rawList.map((ld, idx) => {
      const sub = formSubmissions.find(s => s.id === ld.submissionId) ||
        formSubmissions.find(s => (s.name || '').toLowerCase() === (ld.winnerName || '').toLowerCase());
      const subData = ld.submissionData || sub?.data || {};

      let resolvedName = ld.winnerName || '';
      if (!resolvedName && sub) {
        if (sub.name && sub.name.trim()) {
          resolvedName = sub.name.trim();
        } else {
          const nameEntry = Object.entries(subData).find(([k]) => k.toLowerCase().includes('nama'));
          if (nameEntry && nameEntry[1]) {
            resolvedName = String(nameEntry[1]).trim();
          } else if (connectedForm?.fields?.[0]) {
            const firstF = connectedForm.fields[0];
            const val = subData[firstF.label] ?? subData[firstF.id];
            if (val) resolvedName = String(val).trim();
          } else {
            const firstVal = Object.values(subData)[0];
            if (firstVal) resolvedName = String(firstVal).trim();
          }
        }
      }

      return {
        ...ld,
        winnerName: resolvedName || ld.winnerName || 'Peserta',
        submissionData: subData,
        rawSubmission: sub || null
      };
    });
  }, [luckyDraws, eventId, formSubmissions, connectedForm]);

  const getWinnerDisplayName = (w) => {
    if (!w) return 'Peserta';
    if (w.winnerName && w.winnerName !== 'Peserta') return w.winnerName;
    const sub = formSubmissions.find(s => s.id === (w.submissionId || w.submission_id));
    if (sub) {
      if (sub.name && sub.name.trim()) return sub.name.trim();
      const data = w.submissionData || sub.data || {};
      const nameKey = Object.keys(data).find(k => k.toLowerCase().includes('nama'));
      if (nameKey && data[nameKey]) return String(data[nameKey]).trim();
      if (connectedForm?.fields?.[0]) {
        const firstField = connectedForm.fields[0];
        const val = data[firstField.label] ?? data[firstField.id];
        if (val) return String(val).trim();
      }
      const firstVal = Object.values(data)[0];
      if (firstVal) return String(firstVal).trim();
    }
    return w.winnerName || 'Peserta';
  };

  const wonIdsSet = useMemo(() => {
    const s = new Set();
    eventWinners.forEach(w => {
      if (w.submissionId) s.add(w.submissionId);
      if (w.winnerName) s.add(w.winnerName.toLowerCase().trim());
      if (w.winnerIdentifier) s.add(w.winnerIdentifier.toLowerCase().trim());
    });
    return s;
  }, [eventWinners]);

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...formSubmissions];

    // 1. Global Search (Dynamic across all form submission field values)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(sub => {
        const dataValues = Object.entries(sub.data || {}).map(([k, v]) => `${k} ${v}`).join(' ').toLowerCase();
        const rawTime = sub.createdAt || sub.created_at || sub.submittedAt || '';
        return dataValues.includes(q) || rawTime.toLowerCase().includes(q);
      });
    }

    // 2. Dynamic Dropdown Filters
    Object.entries(dropdownFilters).forEach(([fieldId, selectedVal]) => {
      if (selectedVal && selectedVal !== 'ALL') {
        const fObj = connectedForm?.fields?.find(f => f.id === fieldId);
        const fLabel = fObj?.label || fieldId;
        result = result.filter(sub => {
          const val = String(sub.data?.[fLabel] ?? sub.data?.[fieldId] ?? '').trim();
          return val === selectedVal;
        });
      }
    });

    // 3. Winner Status Filter (only if Lucky Draw is enabled)
    if (isLuckyDrawEnabled) {
      if (winnerFilter === 'WINNERS') {
        result = result.filter(sub => wonIdsSet.has(sub.id));
      } else if (winnerFilter === 'NOT_WINNERS') {
        result = result.filter(sub => !wonIdsSet.has(sub.id));
      }
    }

    // 4. Sorting
    result.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === 'createdAt') {
        valA = new Date(a.createdAt || a.created_at || a.submittedAt || 0).getTime();
        valB = new Date(b.createdAt || b.created_at || b.submittedAt || 0).getTime();
      } else {
        const fObj = connectedForm?.fields?.find(f => f.id === sortConfig.key || f.label === sortConfig.key);
        const fLabel = fObj?.label || sortConfig.key;
        const fId = fObj?.id || sortConfig.key;
        valA = String(a.data?.[fLabel] ?? a.data?.[fId] ?? '').toLowerCase();
        valB = String(b.data?.[fLabel] ?? b.data?.[fId] ?? '').toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [formSubmissions, searchQuery, dropdownFilters, winnerFilter, isLuckyDrawEnabled, sortConfig, connectedForm, wonIdsSet]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dropdownFilters, winnerFilter, pageSize]);

  // Paginated Rows
  const totalFiltered = filteredSubmissions.length;
  const paginatedSubmissions = useMemo(() => {
    if (pageSize === 'all') return filteredSubmissions;
    const start = (currentPage - 1) * pageSize;
    return filteredSubmissions.slice(start, start + pageSize);
  }, [filteredSubmissions, currentPage, pageSize]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));

  const handleHeaderSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: 'createdAt', direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const hasActiveFilters = useMemo(() => {
    if (searchQuery.trim() !== '') return true;
    if (isLuckyDrawEnabled && winnerFilter !== 'ALL') return true;
    for (const val of Object.values(dropdownFilters)) {
      if (val && val !== 'ALL') return true;
    }
    return false;
  }, [searchQuery, winnerFilter, dropdownFilters, isLuckyDrawEnabled]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDropdownFilters({});
    setWinnerFilter('ALL');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  };

  // Export Table Data to CSV (100% dynamic based on actual form fields)
  const handleExportCsv = () => {
    if (formSubmissions.length === 0) return;
    const formFields = connectedForm?.fields || [];
    const fieldHeaders = formFields.map(f => f.label || 'Field');
    const allHeaders = [
      'No',
      ...fieldHeaders,
      ...(isLuckyDrawEnabled ? ['Status Undian'] : []),
      'Waktu Pendaftaran'
    ];

    const rows = filteredSubmissions.map((sub, idx) => {
      const isWinner = wonIdsSet.has(sub.id) ? 'Pemenang Undian' : 'Belum Menang';
      const fieldVals = formFields.map(f => {
        const val = sub.data?.[f.label] ?? sub.data?.[f.id] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      const rawDate = sub.createdAt || sub.created_at || sub.submittedAt;
      const formattedDate = formatWibTimestamp(rawDate).shortDate || rawDate || '-';
      return [
        idx + 1,
        ...fieldVals,
        ...(isLuckyDrawEnabled ? [`"${isWinner}"`] : []),
        `"${formattedDate}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [allHeaders.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pendaftar-${event?.title ? event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // LUCKY DRAW WINNERS TABLE CONTROLS (SEARCH, FILTER, SORT, PAGINATION, CSV)
  // =========================================================================
  const [winnerSearchQuery, setWinnerSearchQuery] = useState('');
  const [winnerPrizeFilter, setWinnerPrizeFilter] = useState('ALL');
  const [winnerDropdownFilters, setWinnerDropdownFilters] = useState({});
  const [winnerSortConfig, setWinnerSortConfig] = useState({ key: 'drawNumber', direction: 'asc' });
  const [winnerCurrentPage, setWinnerCurrentPage] = useState(1);
  const [winnerPageSize, setWinnerPageSize] = useState(10); // 10, 25, 50, 'all'

  // Dynamic search placeholder for winners
  const winnerSearchPlaceholder = useMemo(() => {
    if (connectedForm?.fields && connectedForm.fields.length > 0) {
      const sample = connectedForm.fields.slice(0, 2).map(f => f.label).join(', ');
      return `Cari pemenang, ${sample}, hadiah...`;
    }
    return 'Cari nama, hadiah, atau data pemenang...';
  }, [connectedForm]);

  // Unique list of prize names among winners
  const uniquePrizeNames = useMemo(() => {
    const set = new Set();
    eventWinners.forEach(w => {
      const p = w.prizeTitle || w.prizeName;
      if (p && p.trim()) set.add(p.trim());
    });
    return Array.from(set);
  }, [eventWinners]);

  const hasActiveWinnerFilters = useMemo(() => {
    if (winnerSearchQuery.trim()) return true;
    if (winnerPrizeFilter !== 'ALL') return true;
    for (const val of Object.values(winnerDropdownFilters)) {
      if (val && val !== 'ALL') return true;
    }
    return false;
  }, [winnerSearchQuery, winnerPrizeFilter, winnerDropdownFilters]);

  const handleResetWinnerFilters = () => {
    setWinnerSearchQuery('');
    setWinnerPrizeFilter('ALL');
    setWinnerDropdownFilters({});
    setWinnerSortConfig({ key: 'drawNumber', direction: 'asc' });
    setWinnerCurrentPage(1);
  };

  // Filtered Winners
  const filteredWinners = useMemo(() => {
    let result = [...eventWinners];

    // 1. Search Query
    if (winnerSearchQuery.trim()) {
      const q = winnerSearchQuery.toLowerCase().trim();
      result = result.filter(w => {
        const subData = w.submissionData || {};
        const dataValues = Object.entries(subData).map(([k, v]) => `${k} ${v}`).join(' ').toLowerCase();
        const pName = (w.prizeTitle || w.prizeName || '').toLowerCase();
        const wName = (w.winnerName || '').toLowerCase();
        const rawTime = w.drawnAt || w.created_at || w.createdAt || '';
        const drawNum = String(w.drawNumber || '');
        return dataValues.includes(q) || pName.includes(q) || wName.includes(q) || rawTime.toLowerCase().includes(q) || drawNum.includes(q);
      });
    }

    // 2. Prize Filter
    if (winnerPrizeFilter !== 'ALL') {
      result = result.filter(w => (w.prizeTitle || w.prizeName || '').trim() === winnerPrizeFilter);
    }

    // 3. Form Dropdown Filters
    Object.entries(winnerDropdownFilters).forEach(([fieldId, selectedVal]) => {
      if (selectedVal && selectedVal !== 'ALL') {
        const fObj = connectedForm?.fields?.find(f => f.id === fieldId);
        const fLabel = fObj?.label || fieldId;
        result = result.filter(w => {
          const subData = w.submissionData || {};
          const val = String(subData[fLabel] ?? subData[fieldId] ?? '').trim();
          return val === selectedVal;
        });
      }
    });

    // 4. Sorting
    result.sort((a, b) => {
      let valA, valB;
      if (winnerSortConfig.key === 'drawNumber') {
        valA = a.drawNumber || 0;
        valB = b.drawNumber || 0;
      } else if (winnerSortConfig.key === 'prizeName') {
        valA = (a.prizeTitle || a.prizeName || '').toLowerCase();
        valB = (b.prizeTitle || b.prizeName || '').toLowerCase();
      } else if (winnerSortConfig.key === 'drawnAt') {
        valA = new Date(a.drawnAt || a.created_at || a.createdAt || 0).getTime();
        valB = new Date(b.drawnAt || b.created_at || b.createdAt || 0).getTime();
      } else {
        const fObj = connectedForm?.fields?.find(f => f.id === winnerSortConfig.key || f.label === winnerSortConfig.key);
        const fLabel = fObj?.label || winnerSortConfig.key;
        const fId = fObj?.id || winnerSortConfig.key;
        const subA = a.submissionData || {};
        const subB = b.submissionData || {};
        valA = String(subA[fLabel] ?? subA[fId] ?? (winnerSortConfig.key === connectedForm?.fields?.[0]?.id ? a.winnerName : '') ?? '').toLowerCase();
        valB = String(subB[fLabel] ?? subB[fId] ?? (winnerSortConfig.key === connectedForm?.fields?.[0]?.id ? b.winnerName : '') ?? '').toLowerCase();
      }

      if (valA < valB) return winnerSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return winnerSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [eventWinners, winnerSearchQuery, winnerPrizeFilter, winnerDropdownFilters, winnerSortConfig, connectedForm]);

  // Reset winner page when filters change
  useEffect(() => {
    setWinnerCurrentPage(1);
  }, [winnerSearchQuery, winnerPrizeFilter, winnerDropdownFilters, winnerPageSize]);

  // Pagination calculation for winners
  const totalFilteredWinners = filteredWinners.length;
  const totalWinnerPages = winnerPageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFilteredWinners / winnerPageSize));
  const paginatedWinners = useMemo(() => {
    if (winnerPageSize === 'all') return filteredWinners;
    const start = (winnerCurrentPage - 1) * winnerPageSize;
    return filteredWinners.slice(start, start + winnerPageSize);
  }, [filteredWinners, winnerCurrentPage, winnerPageSize]);

  const handleWinnerHeaderSort = (key) => {
    setWinnerSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: 'drawNumber', direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Export Winners CSV
  const handleExportWinnersCsv = () => {
    if (eventWinners.length === 0) return;

    const formFields = connectedForm?.fields || [];
    const fieldHeaders = formFields.map(f => f.label || 'Field');
    const allHeaders = [
      'No Undian',
      ...fieldHeaders,
      'Hadiah / Sesi',
      'Waktu Menang (WIB)'
    ];

    const rows = filteredWinners.map((w, idx) => {
      const subData = w.submissionData || {};
      const rawTime = w.drawnAt || w.created_at || w.createdAt;
      const formattedTime = formatWibTimestamp(rawTime).exact || '-';

      const fieldVals = formFields.map((f, colIdx) => {
        const val = subData[f.label] ?? subData[f.id] ?? (colIdx === 0 ? w.winnerName : '-');
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      return [
        `"#${w.drawNumber || idx + 1}"`,
        ...fieldVals,
        `"${String(w.prizeTitle || w.prizeName || 'Doorprize Utama').replace(/"/g, '""')}"`,
        `"${formattedTime}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [allHeaders.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pemenang-undian-${event?.title ? event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // LUCKY DRAW / DOORPRIZE LOGIC
  // =========================================================================
  const [prizeName, setPrizeName] = useState('Doorprize Utama');
  const [drawCount, setDrawCount] = useState(1);
  const [selectedDrawFieldId, setSelectedDrawFieldId] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [rollingName, setRollingName] = useState('Siap Mengundi...');
  const [latestWinners, setLatestWinners] = useState([]);
  const [showLatestWinnersModal, setShowLatestWinnersModal] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [winnerToDelete, setWinnerToDelete] = useState(null);

  const rollIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Automatically keep selectedDrawFieldId bound to the first or available field
  useEffect(() => {
    if (connectedForm?.fields && connectedForm.fields.length > 0) {
      if (!selectedDrawFieldId || !connectedForm.fields.some(f => f.id === selectedDrawFieldId)) {
        setSelectedDrawFieldId(connectedForm.fields[0].id);
      }
    }
  }, [connectedForm, selectedDrawFieldId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Candidates for Lucky Draw are STRICTLY from form submissions
  const allCandidates = useMemo(() => {
    const pool = [];
    const seen = new Set();

    formSubmissions.forEach(sub => {
      const info = getSubmissionInfo(sub);
      const key = (info.name + '|' + info.identifier).toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        pool.push({
          id: info.id,
          submissionId: info.id,
          name: info.name,
          department: info.department,
          identifier: info.identifier,
          source: 'Form Pendaftaran',
          raw: sub
        });
      }
    });

    return pool;
  }, [formSubmissions]);

  // Eligible pool: candidates who haven't won yet
  const eligiblePool = useMemo(() => {
    return allCandidates.filter(c => {
      if (wonIdsSet.has(c.id)) return false;
      if (c.submissionId && wonIdsSet.has(c.submissionId)) return false;
      if (c.name && wonIdsSet.has(c.name.toLowerCase().trim())) return false;
      if (c.identifier && c.identifier !== '-' && wonIdsSet.has(c.identifier.toLowerCase().trim())) return false;
      return true;
    });
  }, [allCandidates, wonIdsSet]);

  // Helper to get candidate display value based on selectedDrawFieldId
  const getCandidateDrawDisplay = useCallback((candidate) => {
    if (!candidate) return '';
    const fObj = (connectedForm?.fields || []).find(f => f.id === selectedDrawFieldId) || connectedForm?.fields?.[0];
    const fLabel = fObj?.label || '';
    const fId = fObj?.id || '';
    const customVal = candidate.raw?.data?.[fLabel] ?? candidate.raw?.data?.[fId];
    if (customVal !== undefined && customVal !== null && String(customVal).trim() !== '') {
      return String(customVal).trim();
    }
    return candidate.name || 'Kandidat';
  }, [connectedForm, selectedDrawFieldId]);

  // Safe draw count clamping
  const handleDrawCountChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      setDrawCount(1);
      return;
    }
    const maxAllowed = Math.max(1, eligiblePool.length);
    if (num > maxAllowed) {
      setDrawCount(maxAllowed);
    } else {
      setDrawCount(num);
    }
  };

  // Run Lucky Draw Spin with 10-Second Countdown
  const handleRunLuckyDraw = () => {
    if (isRolling || eligiblePool.length === 0) return;
    const requestedCount = Math.min(Math.max(1, parseInt(drawCount, 10) || 1), eligiblePool.length);

    setIsRolling(true);
    setCountdown(10);
    setLatestWinners([]);

    // Spin candidate names rapidly every 65ms
    rollIntervalRef.current = setInterval(() => {
      const randomCandidate = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
      setRollingName(randomCandidate ? getCandidateDrawDisplay(randomCandidate) : 'Mengundi...');
    }, 65);

    let currentSec = 10;
    countdownIntervalRef.current = setInterval(() => {
      currentSec -= 1;
      setCountdown(currentSec);

      if (currentSec <= 0) {
        clearInterval(countdownIntervalRef.current);
        clearInterval(rollIntervalRef.current);

        // Pick winners using Fisher-Yates (Knuth) Shuffle with cryptographic randomness
        const shuffled = [...eligiblePool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          let rand;
          if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            const buf = new Uint32Array(1);
            window.crypto.getRandomValues(buf);
            rand = buf[0] / (0xffffffff + 1);
          } else {
            rand = Math.random();
          }
          const j = Math.floor(rand * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const chosen = shuffled.slice(0, requestedCount);

        const nowIso = new Date().toISOString();
        const fObj = (connectedForm?.fields || []).find(f => f.id === selectedDrawFieldId) || connectedForm?.fields?.[0];
        const fLabel = fObj?.label || 'Field Undian';
        const fId = fObj?.id || '';

        const newWinners = chosen.map((c, idx) => {
          const customFieldVal = String(c.raw?.data?.[fLabel] ?? c.raw?.data?.[fId] ?? c.name ?? '');

          return {
            id: `draw-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            eventId: event.id,
            formId: connectedForm?.id || '',
            submissionId: c.submissionId || c.id,
            winnerName: c.name,
            winnerIdentifier: c.identifier || '-',
            winnerPhone: c.identifier || '-',
            winnerDepartment: c.department || '',
            winnerUnit: c.department || '',
            prizeTitle: prizeName.trim() || 'Doorprize Utama',
            prizeName: prizeName.trim() || 'Doorprize Utama',
            drawNumber: (eventWinners.length + idx + 1),
            source: c.source,
            drawnAt: nowIso,
            drawnFieldLabel: fLabel,
            drawnFieldValue: customFieldVal,
            submissionData: c.raw?.data || {}
          };
        });

        if (onAddLuckyDraw) {
          onAddLuckyDraw(newWinners);
        }

        setLatestWinners(newWinners);
        setIsRolling(false);
        setCountdown(10);
        setShowLatestWinnersModal(true);

        try {
          confetti({
            particleCount: 160,
            spread: 100,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    }, 1000);
  };

  if (!event) {
    return (
      <div style={{ maxWidth: '680px', margin: '48px auto', textAlign: 'center', padding: '16px', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '44px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          border: '1.5px solid rgba(244, 63, 94, 0.4)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(14, 25, 55, 0.95) 100%)'
            : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={34} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              Halaman Statistik Acara Tidak Ditemukan
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              Agenda kegiatan atau event yang Anda tuju mungkin telah dihapus, dipindahkan, atau tautan statistik tidak valid.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/#home';
              }}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--mandiri-gold)',
                color: '#040914',
                fontWeight: 800,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Kembali ke Beranda
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Kembali ke Daftar Event
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '0 14px 80px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '22px'
    }}>
      {/* 1. TOP NAV & REALTIME STATUS BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-card)'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Kalender Event</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Live Realtime Sync Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.74rem',
            color: '#10b981',
            fontWeight: 700
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }} />
            <span>Realtime Aktif</span>
          </div>

          {connectedForm && (
            <button
              onClick={() => {
                if (isFormClosed) return;
                onNavigateForm && onNavigateForm(connectedForm.id);
              }}
              disabled={isFormClosed}
              title={isFormClosed ? 'Formulir telah ditutup' : 'Buka formulir pendaftaran'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isFormClosed ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)',
                border: isFormClosed ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-card)',
                color: isFormClosed ? '#f87171' : 'var(--text-main)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: isFormClosed ? 'not-allowed' : 'pointer',
                opacity: isFormClosed ? 0.85 : 1
              }}
            >
              {isFormClosed ? <Lock size={13} /> : <ExternalLink size={13} />}
              <span>{isFormClosed ? 'Formulir Telah Ditutup' : 'Buka Form'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. EVENT & FORM HERO HEADER */}
      <div className="glass-panel" style={{
        padding: '22px 24px',
        border: '1.5px solid var(--mandiri-blue)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {(() => {
            const s = event?.startDate || event?.date || '';
            const e = event?.endDate || s;
            const sRawDate = s.slice(0, 10);
            const eRawDate = e.slice(0, 10);

            let eventDateDisplay = 'Tanggal Agenda';
            if (/^\d{4}-\d{2}-\d{2}$/.test(sRawDate) && /^\d{4}-\d{2}-\d{2}$/.test(eRawDate)) {
              if (sRawDate === eRawDate) {
                eventDateDisplay = formatToIndonesianDate(sRawDate);
              } else {
                eventDateDisplay = formatWibEventRange(sRawDate, eRawDate);
              }
            } else if (s || e) {
              eventDateDisplay = formatWibEventRange(s, e, event?.date || 'Tanggal Agenda');
            }

            let eventTimeDisplay = null;
            if (event?.time && event.time !== 'WIB') {
              eventTimeDisplay = event.time;
            } else {
              const sHasTime = s.includes('T') || /\d{2}:\d{2}/.test(s);
              if (sHasTime) {
                const sTime = s.includes('T') ? s.split('T')[1]?.slice(0, 5) : s.match(/\d{2}:\d{2}/)?.[0];
                const eTime = e.includes('T') ? e.split('T')[1]?.slice(0, 5) : e.match(/\d{2}:\d{2}/)?.[0];
                if (sTime && eTime && sTime !== eTime) {
                  eventTimeDisplay = `${sTime} - ${eTime} WIB`;
                } else if (sTime) {
                  eventTimeDisplay = `${sTime} WIB`;
                }
              }
            }

            return (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 184, 0, 0.15)', border: '1px solid var(--mandiri-gold)', color: 'var(--mandiri-gold)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  <Sparkles size={13} />
                  <span>{isLuckyDrawEnabled ? 'Dashboard Analitik & Undian Acara' : 'Dashboard Analitik Acara'}</span>
                </div>
                <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.25 }}>
                  {event.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--mandiri-gold)" />
                    <span>{eventDateDisplay}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--neon-cyan)" />
                    <span>{event.location || 'Direktorat IT Bank Mandiri'}</span>
                  </div>
                  {eventTimeDisplay && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#10b981" />
                      <span>{eventTimeDisplay}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Connected Form Pill Banner */}
          {connectedForm ? (
            <div style={{
              background: isFormClosed
                ? (isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2')
                : 'rgba(56, 189, 248, 0.08)',
              border: isFormClosed
                ? '1px solid rgba(239, 68, 68, 0.35)'
                : '1px solid rgba(56, 189, 248, 0.35)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              maxWidth: '340px',
              width: '100%'
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: isFormClosed ? '#f87171' : 'var(--neon-cyan)',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: '3px'
              }}>
                🔗 Formulir Pendaftaran Terhubung
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                {connectedForm.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {effectiveIsLimited && effectiveMaxQuota > 0 ? `Kuota Form: ${effectiveMaxQuota} Peserta` : 'Kuota Form: Tanpa Batas'} • {(() => {
                  if (isFormClosed) {
                    const dl = connectedForm.deadline ? getDeadlineStatus(connectedForm.deadline) : null;
                    if (dl?.isExpired) {
                      return <span style={{ color: '#f87171', fontWeight: 700 }}>🔴 Ditutup (Batas Waktu Berakhir)</span>;
                    }
                    return <span style={{ color: '#f87171', fontWeight: 700 }}>🔴 Formulir Ditutup</span>;
                  }
                  const isQuotaFull = effectiveIsLimited && effectiveMaxQuota > 0 && totalPendaftar >= effectiveMaxQuota;
                  if (isQuotaFull) {
                    return <span style={{ color: '#f87171', fontWeight: 700 }}>🔒 Kuota Penuh</span>;
                  }
                  return <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 Pendaftaran Dibuka</span>;
                })()}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 184, 0, 0.08)',
              border: '1px dashed var(--mandiri-gold)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.76rem',
              color: 'var(--mandiri-gold)'
            }}>
              ⚠️ Event ini belum terhubung ke Formulir Pendaftaran khusus.
            </div>
          )}
        </div>
      </div>

      {/* 3. REPLACED METRICS: SINGLE WIDE BANNER CARD (IMAGE 2 STYLE) */}
      <div
        className="glass-panel"
        style={{
          padding: 'clamp(16px, 3vw, 24px)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid rgba(255, 184, 0, 0.35)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(255, 184, 0, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%)'
            : 'linear-gradient(135deg, #fffbeb 0%, #ecfeff 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Left: Total Pendaftar Count */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              TOTAL PESERTA HADIR ({event.title.toUpperCase()})
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 900, color: 'var(--mandiri-gold)', lineHeight: 1 }}>
                {totalPendaftar}
              </span>
              {effectiveIsLimited && effectiveMaxQuota > 0 ? (
                <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  / {effectiveMaxQuota} Target Peserta
                </span>
              ) : (
                <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Peserta Terdaftar
                </span>
              )}
            </div>
          </div>

          {/* Right: Tingkat Partisipasi (if limited) OR Unlimited Badge */}
          {effectiveIsLimited && effectiveMaxQuota > 0 ? (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Tingkat Partisipasi
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--mandiri-gold)', lineHeight: 1 }}>
                  {participationRate}%
                </span>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 184, 0, 0.12)',
                  border: '1.5px solid rgba(255, 184, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(255, 184, 0, 0.2)'
                }}>
                  <Users size={22} color="var(--mandiri-gold)" />
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#10b981',
              fontSize: '0.82rem',
              fontWeight: 800
            }}>
              <CheckCircle2 size={16} />
              <span>Tanpa Batasan Kuota Peserta (Unlimited)</span>
            </div>
          )}
        </div>

        {/* Sleek Horizontal Progress Bar (Only when quota target exists) */}
        {effectiveIsLimited && effectiveMaxQuota > 0 && (
          <div style={{
            width: '100%',
            height: '7px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${participationRate}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--mandiri-gold) 0%, #fbbf24 100%)',
              borderRadius: '999px',
              boxShadow: '0 0 12px rgba(255, 184, 0, 0.5)',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        )}
      </div>

      {/* 4. SUB-PAGE TAB SWITCHER: 'stats' vs 'luckydraw' (if isLuckyDraw is enabled) */}
      {isLuckyDrawEnabled && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'var(--input-bg)',
          padding: '5px',
          borderRadius: 'var(--radius-full)',
          maxWidth: '460px',
          margin: '0 auto',
          width: '100%',
          border: '1px solid var(--border-card)'
        }}>
          <button
            onClick={() => setActiveView('stats')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px clamp(10px, 2.5vw, 16px)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: 'clamp(0.75rem, 2.4vw, 0.85rem)',
              fontWeight: 800,
              cursor: 'pointer',
              background: activeView === 'stats' ? 'var(--mandiri-gold)' : 'transparent',
              color: activeView === 'stats' ? '#040914' : 'var(--text-muted)',
              boxShadow: activeView === 'stats' ? '0 4px 12px rgba(255,184,0,0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Statistik & QR</span>
          </button>

          <button
            onClick={() => setActiveView('luckydraw')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px clamp(10px, 2.5vw, 16px)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: 'clamp(0.75rem, 2.4vw, 0.85rem)',
              fontWeight: 800,
              cursor: 'pointer',
              background: activeView === 'luckydraw' ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : 'transparent',
              color: activeView === 'luckydraw' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeView === 'luckydraw' ? '0 4px 14px rgba(168,85,247,0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Trophy size={15} />
            <span>Undian ({eventWinners.length})</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW A: QR CODE SCAN + DYNAMIC DIAGRAM + RESPONDENT TABLE
          ========================================================================= */}
      {(!isLuckyDrawEnabled || activeView === 'stats') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Initial RSVP Archived Notice (Safe preservation, excluded from stats/draw while form active) */}
          {initialRsvps.length > 0 && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={18} color="var(--neon-cyan)" />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Data RSVP Bawaan Awal ({initialRsvps.length} peserta) Tetap Tersimpan Aman
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Selama formulir pendaftaran ini terhubung, statistik dan kuota sepenuhnya mengacu ke data pendaftar formulir. Data RSVP lama tidak dihapus dan otomatis aktif kembali jika koneksi form dilepas.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowArchivedRsvps(!showArchivedRsvps)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: 'var(--neon-cyan)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {showArchivedRsvps ? 'Sembunyikan Arsip RSVP' : `Lihat ${initialRsvps.length} RSVP Bawaan`}
              </button>
            </div>
          )}

          {/* Archived RSVPs Dropdown Table */}
          {showArchivedRsvps && initialRsvps.length > 0 && (
            <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(56, 189, 248, 0.4)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: '8px' }}>
                Daftar RSVP Awal Bawaan Event (Diarsipkan)
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-dim)' }}>
                      <th style={{ padding: '6px' }}>No</th>
                      <th style={{ padding: '6px' }}>Nama</th>
                      <th style={{ padding: '6px' }}>Departemen</th>
                      <th style={{ padding: '6px' }}>Kontak</th>
                      <th style={{ padding: '6px' }}>Waktu RSVP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialRsvps.map((r, i) => (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px' }}>{i + 1}</td>
                        <td style={{ padding: '6px', fontWeight: 700, color: 'var(--text-main)' }}>{r.name}</td>
                        <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{r.department || '-'}</td>
                        <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{r.phone || r.email || '-'}</td>
                        <td style={{ padding: '6px', color: 'var(--text-dim)' }}>{r.createdAt ? formatWibTimestamp(r.createdAt).shortDate : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. MIDDLE SECTION: QR CODE (LEFT) & DYNAMIC DIAGRAM (RIGHT) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isFormClosed ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '18px',
            alignItems: 'stretch'
          }}>
            {/* LEFT COLUMN: SCAN QR DI LAYAR (Disembunyikan jika formulir ditutup) */}
            {!isFormClosed && (
              <div
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid rgba(255, 184, 0, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  background: isDark
                    ? 'radial-gradient(ellipse at top, rgba(255, 184, 0, 0.08) 0%, rgba(3, 8, 20, 0.95) 100%)'
                    : 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)'
                }}
              >
                <div style={{ width: '100%' }}>
                  {/* Gold Pill Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 184, 0, 0.12)',
                    border: '1px solid var(--mandiri-gold)',
                    color: 'var(--mandiri-gold)',
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '10px'
                  }}>
                    <QrCode size={13} />
                    <span>SCAN UNTUK ABSENSI & PENDAFTARAN</span>
                  </div>

                  {/* Header Title */}
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    color: 'var(--mandiri-gold)',
                    margin: '0 0 4px 0',
                    letterSpacing: '0.5px'
                  }}>
                    SCAN QR DI LAYAR
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Arahkan kamera smartphone ke QR Code di bawah
                  </p>
                </div>

                {/* QR Image Box with Yellow Glow */}
                <div style={{
                  background: '#ffffff',
                  padding: '14px',
                  borderRadius: '16px',
                  border: '2.5px solid var(--mandiri-gold)',
                  boxShadow: '0 0 28px rgba(255, 184, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: '240px',
                  width: '100%',
                  aspectRatio: '1/1'
                }}>
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code Pendaftaran"
                      style={{ width: '100%', height: '100%', display: 'block', borderRadius: '8px' }}
                    />
                  ) : (
                    <div style={{ color: '#030814', fontSize: '0.75rem', fontWeight: 700 }}>
                      Memuat QR...
                    </div>
                  )}
                </div>

                {/* Subtitle / Location */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  * {event.location || 'Mandiri Digital Tower Jakarta'}
                </div>

                {/* Quick Actions Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: copySuccess ? '#10b981' : 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: copySuccess ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copySuccess ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copySuccess ? 'Tersalin!' : 'Salin Tautan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGeneratePoster}
                    disabled={isGeneratingPoster}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--mandiri-gold)',
                      border: 'none',
                      color: '#040914',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: isGeneratingPoster ? 'wait' : 'pointer'
                    }}
                  >
                    <Download size={13} />
                    <span>{isGeneratingPoster ? 'Menyiapkan...' : 'Poster HD (PNG)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* RIGHT COLUMN: DYNAMIC DIAGRAM (IMAGE 3 STYLE) */}
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                background: isDark
                  ? 'radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.08) 0%, rgba(3, 8, 20, 0.95) 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
              }}
            >
              <div>
                {/* Header: Title + Choice Field Switcher */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 184, 0, 0.12)',
                      border: '1px solid rgba(255, 184, 0, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <BarChart3 size={18} color="var(--mandiri-gold)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                        DIAGRAM DISTRIBUSI: {diagramData.fieldLabel.toUpperCase()}
                      </h3>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Distribusi realtime peserta terdaftar dari {diagramData.totalCategories} pilihan
                      </div>
                    </div>
                  </div>

                  {/* Kategori Terisi Badge */}
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: 'var(--mandiri-gold)',
                    background: 'rgba(255, 184, 0, 0.1)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(255, 184, 0, 0.3)'
                  }}>
                    {diagramData.filledCount} / {diagramData.totalCategories} Kategori Terisi
                  </span>
                </div>

                {/* Multiple Choice Fields Selector Pills */}
                {choiceFields.length > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    margin: '10px 0 14px 0',
                    padding: '4px',
                    background: 'var(--input-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', padding: '0 6px', fontWeight: 700 }}>
                      Pilih Field:
                    </span>
                    {choiceFields.map(cf => (
                      <button
                        key={cf.id}
                        type="button"
                        onClick={() => {
                          setActiveDiagramFieldId(cf.id);
                          setOptionFilter('ALL');
                        }}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: activeDiagramFieldId === cf.id ? 'var(--mandiri-gold)' : 'transparent',
                          color: activeDiagramFieldId === cf.id ? '#040914' : 'var(--text-muted)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {cf.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2-Column Grid of Diagram Bars (Image 3 style) */}
                {diagramData.items.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                    gap: '12px',
                    marginTop: '12px'
                  }}>
                    {diagramData.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: item.color,
                              boxShadow: `0 0 8px ${item.color}`,
                              flexShrink: 0
                            }} />
                            <span style={{
                              fontWeight: 700,
                              color: 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={item.label}>
                              {item.label}
                            </span>
                          </div>
                          <span style={{ fontWeight: 800, color: 'var(--text-dim)', flexShrink: 0, marginLeft: '6px' }}>
                            <strong style={{ color: item.color }}>{item.count}</strong> ({item.percentage}%)
                          </span>
                        </div>

                        {/* Progress Bar Track */}
                        <div style={{
                          width: '100%',
                          height: '5px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${item.percentage}%`,
                            height: '100%',
                            background: item.color,
                            borderRadius: '3px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Belum ada data respon untuk pilihan ini.
                  </div>
                )}
              </div>

              {/* Bottom Realtime Update Notice */}
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={12} color="var(--mandiri-gold)" />
                <span>✦ Diagram otomatis terbarui secara realtime setiap ada peserta baru yang absen / mendaftar</span>
              </div>
            </div>
          </div>

          {/* 6. FULL-FEATURED DATA TABLE (SEARCH, MULTI-FILTER, MULTI-SORT, PAGINATION) */}
          <div className="glass-panel" style={{
            padding: '22px',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Header: Title + Export */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                  Daftar Pendaftar Terkonfirmasi ({filteredSubmissions.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Seluruh respon formulir terhubung dengan fungsi filter lengkap, sorting, dan pagination
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={formSubmissions.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--mandiri-gold)',
                    border: 'none',
                    color: '#040914',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: formSubmissions.length > 0 ? 'pointer' : 'not-allowed',
                    opacity: formSubmissions.length > 0 ? 1 : 0.6
                  }}
                >
                  <Download size={14} />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              background: 'var(--input-bg)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)'
            }}>
              {/* Dynamic Search Input */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem'
                  }}
                />
              </div>

              {/* Dynamic Choice/Dropdown Filters from Form */}
              {dropdownFields.map((df) => {
                const options = getDropdownOptions(df);
                return (
                  <div key={df.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700 }}>{df.label}:</span>
                    <select
                      value={dropdownFilters[df.id] || 'ALL'}
                      onChange={(e) => setDropdownFilters(prev => ({ ...prev, [df.id]: e.target.value }))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        maxWidth: '200px'
                      }}
                    >
                      <option value="ALL">Semua {df.label}</option>
                      {options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              {/* Winner Status Filter (only if Lucky Draw is enabled) */}
              {isLuckyDrawEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700 }}>Undian:</span>
                  <select
                    value={winnerFilter}
                    onChange={(e) => setWinnerFilter(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ALL">Semua Peserta</option>
                    <option value="WINNERS">Hanya Pemenang Undian</option>
                    <option value="NOT_WINNERS">Belum Menang</option>
                  </select>
                </div>
              )}

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    color: '#f43f5e',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '10px', fontWeight: 700, width: '45px' }}>No</th>

                    {/* Dynamic Form Custom Fields Columns */}
                    {(connectedForm?.fields || []).map(f => (
                      <th
                        key={f.id}
                        onClick={() => handleHeaderSort(f.id)}
                        style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{f.label}</span>
                          {sortConfig.key === f.id ? (
                            sortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                          ) : (
                            <ChevronsUpDown size={13} color="var(--text-dim)" />
                          )}
                        </div>
                      </th>
                    ))}

                    <th
                      onClick={() => handleHeaderSort('createdAt')}
                      style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>Waktu Pendaftaran</span>
                        {sortConfig.key === 'createdAt' ? (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                        ) : (
                          <ChevronsUpDown size={13} color="var(--text-dim)" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubmissions.length > 0 ? (
                    paginatedSubmissions.map((sub, idx) => {
                      const isWinner = wonIdsSet.has(sub.id);
                      const rowIndex = pageSize === 'all' ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                      const rawDate = sub.createdAt || sub.created_at || sub.submittedAt;
                      const formattedTime = formatWibTimestamp(rawDate).shortDate || formatWibTimestamp(rawDate).exact || '-';

                      return (
                        <tr
                          key={sub.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: isWinner ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          <td style={{ padding: '10px', color: 'var(--text-dim)' }}>{rowIndex}</td>

                          {/* Dynamic Custom Fields Values */}
                          {(connectedForm?.fields || []).map((f, colIdx) => {
                            const val = sub.data?.[f.label] ?? sub.data?.[f.id] ?? '-';
                            return (
                              <td key={f.id} style={{ padding: '10px', color: 'var(--text-main)', fontWeight: colIdx === 0 ? 800 : 500 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{String(val)}</span>
                                  {colIdx === 0 && isWinner && isLuckyDrawEnabled && (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                      color: '#fff',
                                      fontSize: '0.62rem',
                                      padding: '1px 7px',
                                      borderRadius: 'var(--radius-full)',
                                      fontWeight: 800,
                                      boxShadow: '0 0 10px rgba(168,85,247,0.4)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      🏆 Pemenang
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          <td style={{ padding: '10px', color: 'var(--text-dim)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                            {formattedTime}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2 + (connectedForm?.fields?.length || 0)} style={{ padding: '36px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {hasActiveFilters
                          ? 'Tidak ada data pendaftar yang sesuai dengan filter pencarian.'
                          : 'Belum ada responden yang mendaftar pada formulir ini.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Rows Per Page Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-card)'
            }}>
              {/* Left: Summary Count & Page Size Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Menampilkan {totalFiltered > 0 ? (pageSize === 'all' ? 1 : (currentPage - 1) * pageSize + 1) : 0} - {pageSize === 'all' ? totalFiltered : Math.min(currentPage * pageSize, totalFiltered)} dari {totalFiltered} data pendaftar
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Per Halaman:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPageSize(v === 'all' ? 'all' : parseInt(v, 10));
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value="all">Semua</option>
                  </select>
                </div>
              </div>

              {/* Right: Page Navigation Buttons */}
              {pageSize !== 'all' && totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="Halaman Pertama"
                    style={{
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: currentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronsLeft size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="Halaman Sebelumnya"
                    style={{
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: currentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {/* Numbered Page Buttons */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((pageNum, pIdx, arr) => {
                      const prevPage = arr[pIdx - 1];
                      const showEllipsis = prevPage && pageNum - prevPage > 1;

                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && (
                            <span style={{ padding: '0 4px', color: 'var(--text-dim)', fontSize: '0.74rem' }}>...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-card)',
                              background: currentPage === pageNum ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                              color: currentPage === pageNum ? '#040914' : 'var(--text-main)',
                              fontWeight: currentPage === pageNum ? 800 : 600,
                              fontSize: '0.76rem',
                              cursor: 'pointer'
                            }}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    title="Halaman Berikutnya"
                    style={{
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: currentPage === totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Halaman Terakhir"
                    style={{
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: currentPage === totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: LUCKY DRAW / DOORPRIZE SYSTEM (STRICTLY FORM REGISTRANTS)
          ========================================================================= */}
      {isLuckyDrawEnabled && activeView === 'luckydraw' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Lucky Draw Control Center */}
          <div className="glass-panel" style={{
            padding: 'clamp(16px, 3.5vw, 28px)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--mandiri-gold)',
            boxShadow: '0 12px 40px rgba(255, 184, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', color: '#fff', padding: '3px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Trophy size={13} />
                  <span>Sistem Pengundian Doorprize Resmi CNT IT APD</span>
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  Undian Doorprize (Lucky Draw)
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Kandidat undian diambil 100% dari data pendaftar formulir acara yang sah.
                </div>
              </div>

              {/* Pool Statistics Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-card)', padding: '6px 14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>TOTAL PENDAFTAR FORM</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{allCandidates.length}</div>
                </div>
                <div style={{
                  background: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(147, 51, 234, 0.08)',
                  border: isDark ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(147, 51, 234, 0.3)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', color: isDark ? '#c084fc' : '#7e22ce', fontWeight: 700 }}>SUDAH MENANG</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: isDark ? '#c084fc' : '#6b21a8' }}>{eventWinners.length}</div>
                </div>
                <div style={{
                  background: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                  border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', color: isDark ? '#10b981' : '#047857', fontWeight: 700 }}>SIAP DIUNDI</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: isDark ? '#10b981' : '#047857' }}>{eligiblePool.length}</div>
                </div>
              </div>
            </div>

            {/* Input Controls Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '14px',
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)'
            }}>
              {/* Input 1: Nama Sesi / Hadiah */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  🎁 Sesi Hadiah / Nama Doorprize:
                </label>
                <input
                  type="text"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  placeholder="Contoh: Grand Prize, Smart Watch, Hadiah Utama"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              {/* Input 2: Jumlah Undian / Pemenang */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  👥 Jumlah Pemenang Kali Ini:
                </label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, eligiblePool.length)}
                  value={drawCount}
                  onChange={(e) => handleDrawCountChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem'
                  }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Maksimal {eligiblePool.length} (kandidat yang belum menang)
                </div>
              </div>

              {/* Input 3: Field Yang Diundi / Ditampilkan */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  🎯 Field Yang Diundi / Ditampilkan:
                </label>
                <select
                  value={selectedDrawFieldId}
                  onChange={(e) => setSelectedDrawFieldId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  {(connectedForm?.fields || []).map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label} ({f.type || 'text'})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Nilai field ini akan diacak dan ditampilkan saat pengundian berlangsung
                </div>
              </div>
            </div>

            {/* ROLLING STAGE (SLOT MACHINE / SPINNER CARD) */}
            <div style={{
              background: isDark
                ? 'radial-gradient(ellipse at center, #0b1a3d 0%, #030814 100%)'
                : 'radial-gradient(ellipse at center, #0d1e47 0%, #050d22 100%)',
              border: isRolling
                ? '2px solid var(--mandiri-gold)'
                : (isDark ? '2px dashed rgba(255, 184, 0, 0.4)' : '2px dashed rgba(255, 184, 0, 0.65)'),
              borderRadius: 'var(--radius-lg)',
              padding: 'clamp(22px, 4.5vw, 36px) clamp(12px, 3vw, 20px)',
              textAlign: 'center',
              boxShadow: isRolling
                ? '0 0 45px rgba(255, 184, 0, 0.45)'
                : (isDark ? 'none' : '0 10px 30px rgba(10, 25, 61, 0.15)'),
              transition: 'all 0.3s ease',
              position: 'relative'
            }}>
              {isRolling && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 184, 0, 0.2)',
                  border: '1.5px solid var(--mandiri-gold)',
                  color: 'var(--mandiri-gold)',
                  fontSize: '0.92rem',
                  fontWeight: 900,
                  marginBottom: '14px',
                  boxShadow: '0 0 20px rgba(255, 184, 0, 0.3)'
                }}>
                  <Clock size={16} />
                  <span>COUNTDOWN:</span>
                  <span style={{ fontSize: '1.25rem', minWidth: '28px' }}>{countdown}s</span>
                </div>
              )}

              <div style={{ fontSize: '0.85rem', color: isRolling ? 'var(--mandiri-gold)' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                {isRolling ? `🎰 MENGACAK PENDAFTAR (${countdown} DETIK)...` : `SESI UNDIAN: ${prizeName.toUpperCase()}`}
              </div>

              <div style={{
                fontSize: 'clamp(1.4rem, 4vw, 2.6rem)',
                fontWeight: 900,
                color: isRolling ? '#FFB800' : '#ffffff',
                minHeight: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textShadow: isRolling ? '0 0 25px rgba(255, 184, 0, 0.6)' : '0 2px 10px rgba(0, 0, 0, 0.5)',
                wordBreak: 'break-word',
                padding: '0 10px'
              }}>
                {isRolling ? rollingName : (
                  eligiblePool.length === 0 ? 'Semua Pendaftar Form Sudah Menang!' : 'Siap Mengundi'
                )}
              </div>

              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '8px' }}>
                {eligiblePool.length} kandidat dari pendaftar formulir siap diundi
              </div>

              {/* Start Draw Button */}
              <div style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={handleRunLuckyDraw}
                  disabled={isRolling || eligiblePool.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px clamp(20px, 4vw, 44px)',
                    borderRadius: 'var(--radius-full)',
                    background: eligiblePool.length === 0 ? 'var(--input-bg)' : 'linear-gradient(135deg, #FFB800 0%, #e0a300 100%)',
                    color: eligiblePool.length === 0 ? 'var(--text-dim)' : '#040914',
                    fontWeight: 900,
                    fontSize: 'clamp(0.92rem, 2.5vw, 1.05rem)',
                    border: 'none',
                    cursor: eligiblePool.length > 0 && !isRolling ? 'pointer' : 'not-allowed',
                    boxShadow: eligiblePool.length > 0 && !isRolling ? '0 0 30px rgba(255, 184, 0, 0.4)' : 'none',
                    transform: isRolling ? 'scale(0.96)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    maxWidth: '100%',
                    textAlign: 'center'
                  }}
                >
                  {isRolling ? (
                    <>
                      <Loader2 size={18} className="spin animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Mengundi ({countdown}s)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Undi Pemenang ({drawCount} Pemenang)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* WINNERS LIST TABLE (FULL-FEATURED: SEARCH, PRIZE FILTER, FORM DROPDOWN FILTERS, SORTING, PAGINATION, CSV EXPORT) */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Header: Title, Total Badge, Export CSV, and Reset All */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={20} color="var(--mandiri-gold)" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                      Daftar Pemenang Undian ({filteredWinners.length})
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Daftar pemenang undian sah dilengkapi fitur pencarian, filter sesi hadiah, multi-sorting, dan pagination
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Ekspor CSV Pemenang */}
                  <button
                    type="button"
                    onClick={handleExportWinnersCsv}
                    disabled={eventWinners.length === 0}
                    title="Download rekap data seluruh pemenang dalam format CSV"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--mandiri-gold)',
                      border: 'none',
                      color: '#040914',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: eventWinners.length > 0 ? 'pointer' : 'not-allowed',
                      opacity: eventWinners.length > 0 ? 1 : 0.6
                    }}
                  >
                    <Download size={14} />
                    <span>Ekspor CSV Pemenang</span>
                  </button>

                  {/* Reset Semua Pemenang */}
                  {eventWinners.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setResetConfirmOpen(true)}
                      title="Reset seluruh pemenang undian pada acara ini"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.35)',
                        color: '#f43f5e',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>Reset Semua Pemenang</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Controls Bar (Search + Prize Filter + Form Dropdown Filters) */}
              {eventWinners.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                  background: 'var(--input-bg)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)'
                }}>
                  {/* Dynamic Search Input for Winners */}
                  <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      placeholder={winnerSearchPlaceholder}
                      value={winnerSearchQuery}
                      onChange={(e) => setWinnerSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 12px 7px 32px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>

                  {/* Filter by Prize / Session Name */}
                  {uniquePrizeNames.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700 }}>Hadiah:</span>
                      <select
                        value={winnerPrizeFilter}
                        onChange={(e) => setWinnerPrizeFilter(e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          maxWidth: '200px'
                        }}
                      >
                        <option value="ALL">Semua Sesi Hadiah</option>
                        {uniquePrizeNames.map((p, i) => (
                          <option key={i} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dynamic Form Dropdown Filters for Winners */}
                  {dropdownFields.map((df) => {
                    const options = getDropdownOptions(df);
                    return (
                      <div key={df.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700 }}>{df.label}:</span>
                        <select
                          value={winnerDropdownFilters[df.id] || 'ALL'}
                          onChange={(e) => setWinnerDropdownFilters(prev => ({ ...prev, [df.id]: e.target.value }))}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            maxWidth: '200px'
                          }}
                        >
                          <option value="ALL">Semua {df.label}</option>
                          {options.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}

                  {/* Reset Filters Button */}
                  {hasActiveWinnerFilters && (
                    <button
                      type="button"
                      onClick={handleResetWinnerFilters}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.35)',
                        color: '#f43f5e',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Reset Filter</span>
                    </button>
                  )}
                </div>
              )}

              {/* Table Container */}
              {eventWinners.length > 0 ? (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-dim)' }}>
                        <th
                          onClick={() => handleWinnerHeaderSort('drawNumber')}
                          style={{ padding: '10px', fontWeight: 700, width: '90px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>No Undian</span>
                            {winnerSortConfig.key === 'drawNumber' ? (
                              winnerSortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                            ) : (
                              <ChevronsUpDown size={13} color="var(--text-dim)" />
                            )}
                          </div>
                        </th>

                        {/* Dynamic Custom Fields Columns with Sorting */}
                        {(connectedForm?.fields || []).map(f => (
                          <th
                            key={f.id}
                            onClick={() => handleWinnerHeaderSort(f.id)}
                            style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span>{f.label}</span>
                              {winnerSortConfig.key === f.id ? (
                                winnerSortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                              ) : (
                                <ChevronsUpDown size={13} color="var(--text-dim)" />
                              )}
                            </div>
                          </th>
                        ))}

                        <th
                          onClick={() => handleWinnerHeaderSort('prizeName')}
                          style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>Hadiah / Sesi</span>
                            {winnerSortConfig.key === 'prizeName' ? (
                              winnerSortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                            ) : (
                              <ChevronsUpDown size={13} color="var(--text-dim)" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleWinnerHeaderSort('drawnAt')}
                          style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>Waktu Menang</span>
                            {winnerSortConfig.key === 'drawnAt' ? (
                              winnerSortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                            ) : (
                              <ChevronsUpDown size={13} color="var(--text-dim)" />
                            )}
                          </div>
                        </th>

                        <th style={{ padding: '10px', fontWeight: 700, textAlign: 'center', width: '60px' }}>
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedWinners.length > 0 ? (
                        paginatedWinners.map((winner, idx) => {
                          const subData = winner.submissionData || {};
                          const rawTime = winner.drawnAt || winner.created_at || winner.createdAt;
                          const formattedTime = formatWibTimestamp(rawTime).shortDate || formatWibTimestamp(rawTime).exact || '-';

                          return (
                            <tr
                              key={winner.id || idx}
                              style={{
                                borderBottom: '1px solid var(--border-card)',
                                transition: 'background 0.2s ease'
                              }}
                            >
                              <td style={{ padding: '10px', fontWeight: 800, color: 'var(--mandiri-gold)', whiteSpace: 'nowrap' }}>
                                #{winner.drawNumber || idx + 1}
                              </td>

                              {/* Dynamic Custom Fields Values */}
                              {(connectedForm?.fields || []).map((f, colIdx) => {
                                const val = subData[f.label] ?? subData[f.id] ?? (colIdx === 0 ? winner.winnerName : '-');
                                return (
                                  <td key={f.id} style={{ padding: '10px', color: 'var(--text-main)', fontWeight: colIdx === 0 ? 800 : 500 }}>
                                    {String(val || '-')}
                                  </td>
                                );
                              })}

                              <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  background: 'rgba(255, 184, 0, 0.15)',
                                  border: '1px solid var(--mandiri-gold)',
                                  color: 'var(--mandiri-gold)',
                                  padding: '3px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  {winner.prizeTitle || winner.prizeName || 'Doorprize Utama'}
                                </span>
                              </td>

                              <td style={{ padding: '10px', color: 'var(--text-dim)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                                {formattedTime}
                              </td>

                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setWinnerToDelete(winner)}
                                  title="Hapus pemenang ini (peserta dapat diundi kembali)"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#f43f5e',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'inline-flex'
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3 + (connectedForm?.fields?.length || 0)} style={{ padding: '36px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {hasActiveWinnerFilters
                              ? 'Tidak ada data pemenang undian yang sesuai dengan filter pencarian.'
                              : 'Belum ada pemenang yang diundi untuk acara ini.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  background: 'var(--input-bg)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem'
                }}>
                  Belum ada pemenang yang diundi untuk acara ini. Tekan tombol <strong>Undi Pemenang</strong> di atas untuk memulai doorprize!
                </div>
              )}

              {/* Pagination Controls for Winners Table */}
              {eventWinners.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-card)'
                }}>
                  {/* Left: Summary Count & Page Size Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Menampilkan {totalFilteredWinners > 0 ? (winnerPageSize === 'all' ? 1 : (winnerCurrentPage - 1) * winnerPageSize + 1) : 0} - {winnerPageSize === 'all' ? totalFilteredWinners : Math.min(winnerCurrentPage * winnerPageSize, totalFilteredWinners)} dari {totalFilteredWinners} pemenang
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Per Halaman:</span>
                      <select
                        value={winnerPageSize}
                        onChange={(e) => {
                          const v = e.target.value;
                          setWinnerPageSize(v === 'all' ? 'all' : parseInt(v, 10));
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value="all">Semua</option>
                      </select>
                    </div>
                  </div>

                  {/* Right: Page Navigation Buttons */}
                  {winnerPageSize !== 'all' && totalWinnerPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setWinnerCurrentPage(1)}
                        disabled={winnerCurrentPage === 1}
                        title="Halaman Pertama"
                        style={{
                          padding: '5px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: winnerCurrentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          cursor: winnerCurrentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ChevronsLeft size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setWinnerCurrentPage(p => Math.max(1, p - 1))}
                        disabled={winnerCurrentPage === 1}
                        title="Halaman Sebelumnya"
                        style={{
                          padding: '5px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: winnerCurrentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          cursor: winnerCurrentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>

                      {/* Numbered Page Buttons */}
                      {Array.from({ length: totalWinnerPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalWinnerPages || Math.abs(p - winnerCurrentPage) <= 1)
                        .map((pageNum, pIdx, arr) => {
                          const prevPage = arr[pIdx - 1];
                          const showEllipsis = prevPage && pageNum - prevPage > 1;

                          return (
                            <React.Fragment key={pageNum}>
                              {showEllipsis && (
                                <span style={{ padding: '0 4px', color: 'var(--text-dim)', fontSize: '0.74rem' }}>...</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setWinnerCurrentPage(pageNum)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-card)',
                                  background: winnerCurrentPage === pageNum ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                                  color: winnerCurrentPage === pageNum ? '#040914' : 'var(--text-main)',
                                  fontWeight: winnerCurrentPage === pageNum ? 800 : 500,
                                  fontSize: '0.74rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {pageNum}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        type="button"
                        onClick={() => setWinnerCurrentPage(p => Math.min(totalWinnerPages, p + 1))}
                        disabled={winnerCurrentPage === totalWinnerPages}
                        title="Halaman Berikutnya"
                        style={{
                          padding: '5px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: winnerCurrentPage === totalWinnerPages ? 'var(--text-dim)' : 'var(--text-main)',
                          cursor: winnerCurrentPage === totalWinnerPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setWinnerCurrentPage(totalWinnerPages)}
                        disabled={winnerCurrentPage === totalWinnerPages}
                        title="Halaman Terakhir"
                        style={{
                          padding: '5px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: winnerCurrentPage === totalWinnerPages ? 'var(--text-dim)' : 'var(--text-main)',
                          cursor: winnerCurrentPage === totalWinnerPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ChevronsRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: LATEST WINNERS POPUP CELEBRATION (DISPLAYS ALL SUBMITTED DATA)
          ========================================================================= */}
      {showLatestWinnersModal && latestWinners.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '580px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 'clamp(16px, 4vw, 24px)',
            border: '2px solid var(--mandiri-gold)',
            boxShadow: '0 25px 60px rgba(255, 184, 0, 0.35)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFB800 0%, #e0a300 100%)',
              color: '#040914',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 0 25px rgba(255, 184, 0, 0.5)'
            }}>
              <Trophy size={32} />
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--mandiri-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                SELAMAT KEPADA PEMENANG!
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                {prizeName}
              </h2>
            </div>

            {/* List of Newly Drawn Winners with ALL Submitted Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {latestWinners.map((w, idx) => {
                const sub = formSubmissions.find(s => s.id === w.submissionId) ||
                  formSubmissions.find(s => (s.name || '').toLowerCase() === (w.winnerName || '').toLowerCase());
                const subData = w.submissionData || sub?.data || {};

                return (
                  <div
                    key={w.id || idx}
                    style={{
                      background: isDark ? 'rgba(255, 184, 0, 0.08)' : 'rgba(255, 184, 0, 0.06)',
                      border: isDark ? '1.5px solid rgba(255, 184, 0, 0.45)' : '1.5px solid rgba(255, 184, 0, 0.45)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      boxShadow: isDark ? 'none' : '0 2px 8px rgba(255, 184, 0, 0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 184, 0, 0.2)', paddingBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🏆</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--mandiri-gold)' }}>
                          Pemenang #{w.drawNumber || idx + 1}
                        </span>
                      </div>
                      <span style={{
                        background: 'rgba(255, 184, 0, 0.2)',
                        border: '1px solid var(--mandiri-gold)',
                        color: 'var(--mandiri-gold)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 800
                      }}>
                        {w.prizeTitle || w.prizeName || 'Doorprize Utama'}
                      </span>
                    </div>

                    {/* All Form Fields Submitted by the Winner */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '8px' }}>
                      {(connectedForm?.fields || []).map(f => {
                        const val = subData[f.label] ?? subData[f.id] ?? (f.label.toLowerCase().includes('nama') ? w.winnerName : '-');
                        return (
                          <div
                            key={f.id}
                            style={{
                              background: isDark ? 'rgba(0, 0, 0, 0.35)' : '#ffffff',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 184, 0, 0.28)',
                              boxShadow: isDark ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.04)'
                            }}
                          >
                            <div style={{
                              fontSize: '0.68rem',
                              color: isDark ? 'var(--text-dim)' : '#64748b',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '3px'
                            }}>
                              {f.label}
                            </div>
                            <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 800, wordBreak: 'break-word' }}>
                              {String(val || '-')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowLatestWinnersModal(false)}
              style={{
                padding: '12px 28px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--mandiri-gold)',
                color: '#040914',
                fontWeight: 900,
                fontSize: '0.92rem',
                border: 'none',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Simpan & Tutup
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: RESET CONFIRMATION
          ========================================================================= */}
      {resetConfirmOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '440px',
            width: '100%',
            padding: 'clamp(16px, 4vw, 24px)',
            border: '1.5px solid #f43f5e',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <AlertCircle size={40} color="#f43f5e" style={{ margin: '0 auto' }} />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                Reset Semua Pemenang Undian?
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Tindakan ini akan menghapus seluruh data {eventWinners.length} pemenang undian pada acara ini dan mengembalikan semua pendaftar formulir ke dalam pool undian.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetLuckyDraw) onResetLuckyDraw(event.id);
                  setResetConfirmOpen(false);
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: '#f43f5e',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Ya, Reset Pemenang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: DELETE SINGLE WINNER CONFIRMATION
          ========================================================================= */}
      {winnerToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '440px',
            width: '100%',
            padding: 'clamp(16px, 4vw, 24px)',
            border: '1.5px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              border: '1px solid rgba(244, 63, 94, 0.3)'
            }}>
              <Trash2 size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                Hapus Pemenang Undian?
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Apakah Anda yakin ingin membatalkan/menghapus pemenang <strong>"{getWinnerDisplayName(winnerToDelete)}"</strong>? Setelah dihapus, peserta ini akan kembali berstatus belum menang dan dapat diundi lagi pada sesi berikutnya.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setWinnerToDelete(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteLuckyDraw) onDeleteLuckyDraw(winnerToDelete.id);
                  setWinnerToDelete(null);
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: '#f43f5e',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Ya, Hapus Pemenang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: POSTER QR PREVIEW (OPTIMAL MOBILE & DESKTOP)
          ========================================================================= */}
      {posterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '20px',
            border: '1.5px solid var(--mandiri-gold)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Poster Cetak QR Pendaftaran
              </h3>
              <button
                onClick={() => setPosterModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <img
              src={posterModal.dataUrl}
              alt="Poster QR Formulir"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                border: '1px solid rgba(255, 184, 0, 0.4)'
              }}
            />

            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              lineHeight: 1.5
            }}>
              💡 <strong>Petunjuk di HP / iPhone:</strong> Tekan & tahan (tahan jari) gambar poster di atas, lalu pilih <strong>"Simpan Gambar" (Save to Photos)</strong> atau bagikan ke WhatsApp.
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const blobUrl = URL.createObjectURL(posterModal.blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = posterModal.fileName;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                  }, 2000);
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Unduh File (PNG)
              </button>
              <button
                type="button"
                onClick={() => setPosterModal(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-card)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REALTIME WELCOME ALERT (BOTTOM-RIGHT SEQUENTIAL FIFO TOAST)
          ========================================================================= */}
      {activeAlert && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            maxWidth: '380px',
            width: 'calc(100vw - 32px)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(14, 25, 55, 0.98) 0%, rgba(6, 78, 59, 0.95) 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
            border: '1.5px solid #10b981',
            borderRadius: 'var(--radius-md)',
            boxShadow: isDark
              ? '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.35)'
              : '0 10px 30px rgba(16, 185, 129, 0.25)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideUpToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={20} color="#10b981" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <CheckCircle2 size={12} />
              <span>Pendaftar Baru Masuk</span>
            </div>
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Selamat Datang, {activeAlert.name}! 🎉
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            title="Tutup notifikasi"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
