// Logic of EventRegistrationStats, moved verbatim from the component. Returns every value the view uses.
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { DIAGRAM_COLORS } from './registrationStatsShared';
import { useAppNavigate } from '../../lib/appNavigation';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { generateFormQrPoster } from '../../utils/qrPosterGenerator';
import { formatWibTimestamp, getDeadlineStatus } from '../../utils/dateUtils';
import { getPublicBaseUrl } from '../../utils/urlUtils';

export function useEventRegistrationStats({
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
  const navigateTo = useAppNavigate();
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

  return {
    activeAlert,
    activeChoiceField,
    activeDiagramFieldId,
    activeView,
    allCandidates,
    choiceFields,
    connectedForm,
    copySuccess,
    countdown,
    countdownIntervalRef,
    currentPage,
    departments,
    diagramData,
    directFormUrl,
    divisions,
    drawCount,
    dropdownFields,
    dropdownFilters,
    effectiveIsLimited,
    effectiveMaxQuota,
    eligiblePool,
    event,
    eventId,
    eventRsvps,
    eventWinners,
    events,
    extractParticipantName,
    filteredSubmissions,
    filteredWinners,
    formSubmissions,
    forms,
    getCandidateDrawDisplay,
    getDropdownOptions,
    getSubmissionInfo,
    getWinnerDisplayName,
    handleCopyLink,
    handleDrawCountChange,
    handleExportCsv,
    handleExportWinnersCsv,
    handleGeneratePoster,
    handleHeaderSort,
    handleResetFilters,
    handleResetWinnerFilters,
    handleRunLuckyDraw,
    handleWinnerHeaderSort,
    hasActiveFilters,
    hasActiveWinnerFilters,
    initialRsvps,
    isDark,
    isFirstLoadRef,
    isFormClosed,
    isGeneratingPoster,
    isLuckyDrawEnabled,
    isRolling,
    latestWinners,
    luckyDraws,
    navigateTo,
    onAddLuckyDraw,
    onBack,
    onDeleteLuckyDraw,
    onNavigateForm,
    onResetLuckyDraw,
    pageSize,
    paginatedSubmissions,
    paginatedWinners,
    participationRate,
    posterModal,
    prizeName,
    qrCodeDataUrl,
    resetConfirmOpen,
    rollIntervalRef,
    rollingName,
    searchPlaceholder,
    searchQuery,
    seenSubIdsRef,
    selectedDrawFieldId,
    setActiveAlert,
    setActiveDiagramFieldId,
    setActiveView,
    setCopySuccess,
    setCountdown,
    setCurrentPage,
    setDrawCount,
    setDropdownFilters,
    setIsGeneratingPoster,
    setIsRolling,
    setLatestWinners,
    setPageSize,
    setPosterModal,
    setPrizeName,
    setQrCodeDataUrl,
    setResetConfirmOpen,
    setRollingName,
    setSearchQuery,
    setSelectedDrawFieldId,
    setShowLatestWinnersModal,
    setSortConfig,
    setWelcomeQueue,
    setWinnerCurrentPage,
    setWinnerDropdownFilters,
    setWinnerFilter,
    setWinnerPageSize,
    setWinnerPrizeFilter,
    setWinnerSearchQuery,
    setWinnerSortConfig,
    setWinnerToDelete,
    showLatestWinnersModal,
    sortConfig,
    submissions,
    theme,
    totalFiltered,
    totalFilteredWinners,
    totalPages,
    totalPendaftar,
    totalWinnerPages,
    uniquePrizeNames,
    welcomeQueue,
    winnerCurrentPage,
    winnerDropdownFilters,
    winnerFilter,
    winnerPageSize,
    winnerPrizeFilter,
    winnerSearchPlaceholder,
    winnerSearchQuery,
    winnerSortConfig,
    winnerToDelete,
    wonIdsSet
  };
}
