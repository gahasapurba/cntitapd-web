import React, { useState, useMemo, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { generateFormQrPoster } from '../utils/qrPosterGenerator';
import { formatWibTimestamp, formatDeadlineWib, formatToIndonesianDate, formatWibEventRange } from '../utils/dateUtils';
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

  // View state: 'stats' | 'luckydraw'
  const [activeView, setActiveView] = useState('stats');

  // Submissions strictly from the connected form
  const formSubmissions = useMemo(() => {
    if (!connectedForm) return [];
    return submissions.filter(s => String(s.formId) === String(connectedForm.id));
  }, [submissions, connectedForm]);

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
  // TABLE FILTERING, MULTI-FILTER, SORTING & PAGINATION
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [optionFilter, setOptionFilter] = useState('ALL');
  const [winnerFilter, setWinnerFilter] = useState('ALL');

  // Multi-sorting: { key, direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10, 25, 50, 'all'

  // Existing Lucky Draw Winners for this event
  const eventWinners = useMemo(() => {
    if (!eventId) return [];
    return (luckyDraws || []).filter(ld => ld.eventId === eventId);
  }, [luckyDraws, eventId]);

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

    // 1. Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(sub => {
        const info = getSubmissionInfo(sub);
        const dataValues = Object.values(sub.data || {}).map(v => String(v || '')).join(' ').toLowerCase();
        return info.name.toLowerCase().includes(q) ||
          info.department.toLowerCase().includes(q) ||
          info.identifier.toLowerCase().includes(q) ||
          dataValues.includes(q);
      });
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter(sub => {
        const st = sub.status || 'Submitted';
        return st === statusFilter;
      });
    }

    // 3. Option Filter (for active choice field)
    if (optionFilter !== 'ALL' && activeChoiceField) {
      const fLabel = activeChoiceField.label;
      const fId = activeChoiceField.id;
      result = result.filter(sub => {
        const val = String(sub.data?.[fLabel] ?? sub.data?.[fId] ?? '').trim();
        return val === optionFilter;
      });
    }

    // 4. Winner Status Filter
    if (winnerFilter === 'WINNERS') {
      result = result.filter(sub => wonIdsSet.has(sub.id));
    } else if (winnerFilter === 'NOT_WINNERS') {
      result = result.filter(sub => !wonIdsSet.has(sub.id));
    }

    // 5. Sorting
    result.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === 'createdAt') {
        valA = new Date(a.createdAt || a.created_at || 0).getTime();
        valB = new Date(b.createdAt || b.created_at || 0).getTime();
      } else if (sortConfig.key === 'status') {
        valA = (a.status || 'Submitted').toLowerCase();
        valB = (b.status || 'Submitted').toLowerCase();
      } else if (sortConfig.key === 'name') {
        valA = getSubmissionInfo(a).name.toLowerCase();
        valB = getSubmissionInfo(b).name.toLowerCase();
      } else if (sortConfig.key === 'department') {
        valA = getSubmissionInfo(a).department.toLowerCase();
        valB = getSubmissionInfo(b).department.toLowerCase();
      } else {
        // Dynamic field key
        valA = String(a.data?.[sortConfig.key] ?? '').toLowerCase();
        valB = String(b.data?.[sortConfig.key] ?? '').toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [formSubmissions, searchQuery, statusFilter, optionFilter, winnerFilter, sortConfig, activeChoiceField, wonIdsSet]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, optionFilter, winnerFilter, pageSize]);

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

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setOptionFilter('ALL');
    setWinnerFilter('ALL');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || optionFilter !== 'ALL' || winnerFilter !== 'ALL';

  // Export Table Data to CSV
  const handleExportCsv = () => {
    if (formSubmissions.length === 0) return;
    const baseHeaders = ['No', 'ID Pendaftar', 'Nama Lengkap', 'Departemen', 'Kontak / NIP', 'Status Pendaftaran', 'Pemenang Doorprize', 'Waktu Pengisian'];
    const fieldHeaders = (connectedForm?.fields || []).map(f => f.label || 'Field');
    const allHeaders = [...baseHeaders, ...fieldHeaders];

    const rows = filteredSubmissions.map((sub, idx) => {
      const info = getSubmissionInfo(sub);
      const isWinner = wonIdsSet.has(sub.id) ? 'Ya (Pemenang)' : 'Tidak';
      const fieldVals = (connectedForm?.fields || []).map(f => {
        const val = sub.data?.[f.label] ?? sub.data?.[f.id] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [
        idx + 1,
        `"${sub.id}"`,
        `"${info.name.replace(/"/g, '""')}"`,
        `"${info.department.replace(/"/g, '""')}"`,
        `"${info.identifier.replace(/"/g, '""')}"`,
        `"${sub.status || 'Submitted'}"`,
        `"${isWinner}"`,
        `"${info.submittedAt}"`,
        ...fieldVals
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
  // LUCKY DRAW / DOORPRIZE LOGIC
  // =========================================================================
  const [prizeName, setPrizeName] = useState('Doorprize Utama');
  const [drawCount, setDrawCount] = useState(1);
  const [selectedDrawFieldId, setSelectedDrawFieldId] = useState('__name__'); // Field to draw/display
  const [isRolling, setIsRolling] = useState(false);
  const [rollingName, setRollingName] = useState('Siap Mengundi...');
  const [latestWinners, setLatestWinners] = useState([]);
  const [showLatestWinnersModal, setShowLatestWinnersModal] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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
  const getCandidateDrawDisplay = (candidate) => {
    if (!candidate) return '';
    if (selectedDrawFieldId === '__name__') {
      return candidate.name;
    }
    const fObj = (connectedForm?.fields || []).find(f => f.id === selectedDrawFieldId);
    const fLabel = fObj?.label || selectedDrawFieldId;
    const customVal = candidate.raw?.data?.[selectedDrawFieldId] ?? candidate.raw?.data?.[fLabel] ?? candidate.raw?.[selectedDrawFieldId];
    if (customVal !== undefined && customVal !== null && String(customVal).trim() !== '') {
      return `${String(customVal).trim()} — ${candidate.name}`;
    }
    return candidate.name;
  };

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

  // Run Lucky Draw Spin
  const handleRunLuckyDraw = () => {
    if (isRolling || eligiblePool.length === 0) return;
    const requestedCount = Math.min(Math.max(1, parseInt(drawCount, 10) || 1), eligiblePool.length);

    setIsRolling(true);
    setLatestWinners([]);

    let iterations = 0;
    const maxIterations = 32;
    const intervalTime = 75;

    const rollTimer = setInterval(() => {
      iterations++;
      const randomCandidate = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
      setRollingName(randomCandidate ? getCandidateDrawDisplay(randomCandidate) : 'Mengundi...');

      if (iterations >= maxIterations) {
        clearInterval(rollTimer);

        // Pick winners randomly without replacement
        const shuffled = [...eligiblePool].sort(() => 0.5 - Math.random());
        const chosen = shuffled.slice(0, requestedCount);

        const nowIso = new Date().toISOString();
        const fObj = (connectedForm?.fields || []).find(f => f.id === selectedDrawFieldId);
        const fLabel = fObj?.label || 'Nama Lengkap';

        const newWinners = chosen.map((c, idx) => {
          const customFieldVal = selectedDrawFieldId !== '__name__'
            ? String(c.raw?.data?.[selectedDrawFieldId] ?? c.raw?.data?.[fLabel] ?? '')
            : '';

          return {
            id: `draw-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            eventId: event.id,
            formId: connectedForm?.id || '',
            submissionId: c.submissionId || c.id,
            winnerName: c.name,
            winnerIdentifier: c.identifier || '-',
            winnerDepartment: c.department || 'Direktorat IT APD',
            prizeTitle: prizeName.trim() || 'Doorprize Utama',
            drawNumber: (eventWinners.length + idx + 1),
            source: c.source,
            drawnAt: nowIso,
            drawnFieldLabel: fLabel,
            drawnFieldValue: customFieldVal
          };
        });

        if (onAddLuckyDraw) {
          onAddLuckyDraw(newWinners);
        }

        setLatestWinners(newWinners);
        setIsRolling(false);
        setShowLatestWinnersModal(true);

        try {
          confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    }, intervalTime);
  };

  if (!event) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center', padding: '24px' }}>
        <AlertCircle size={48} color="#f43f5e" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Acara / Event Tidak Ditemukan
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Data event yang Anda tuju mungkin telah dihapus atau dipindahkan.
        </p>
        <button
          onClick={onBack}
          style={{
            padding: '10px 24px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--mandiri-gold)',
            color: '#040914',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Kembali ke Daftar Event
        </button>
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
              onClick={() => onNavigateForm && onNavigateForm(connectedForm.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={13} />
              <span>Buka Form</span>
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
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              maxWidth: '340px',
              width: '100%'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>
                🔗 Formulir Pendaftaran Terhubung
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                {connectedForm.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {effectiveIsLimited && effectiveMaxQuota > 0 ? `Kuota Form: ${effectiveMaxQuota} Peserta` : 'Kuota Form: Tanpa Batas'} • {connectedForm.isOpen !== false ? '🟢 Pendaftaran Dibuka' : '🔴 Ditutup'}
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
          padding: '22px 28px',
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
              <span style={{ fontSize: 'clamp(2.4rem, 5vw, 3.4rem)', fontWeight: 900, color: 'var(--mandiri-gold)', lineHeight: 1 }}>
                {totalPendaftar}
              </span>
              {effectiveIsLimited && effectiveMaxQuota > 0 ? (
                <span style={{ fontSize: 'clamp(0.95rem, 2vw, 1.25rem)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  / {effectiveMaxQuota} Target Peserta
                </span>
              ) : (
                <span style={{ fontSize: 'clamp(0.95rem, 2vw, 1.2rem)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Peserta Terdaftar
                </span>
              )}
            </div>
          </div>

          {/* Right: Tingkat Partisipasi (if limited) OR Unlimited Badge */}
          {effectiveIsLimited && effectiveMaxQuota > 0 ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Tingkat Partisipasi
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '2px' }}>
                <span style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--mandiri-gold)', lineHeight: 1 }}>
                  {participationRate}%
                </span>
                <div style={{
                  width: '46px',
                  height: '46px',
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
          padding: '6px',
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
              gap: '8px',
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: activeView === 'stats' ? 'var(--mandiri-gold)' : 'transparent',
              color: activeView === 'stats' ? '#040914' : 'var(--text-muted)',
              boxShadow: activeView === 'stats' ? '0 4px 12px rgba(255,184,0,0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Statistik & QR Presensi</span>
          </button>

          <button
            onClick={() => setActiveView('luckydraw')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: activeView === 'luckydraw' ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : 'transparent',
              color: activeView === 'luckydraw' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeView === 'luckydraw' ? '0 4px 14px rgba(168,85,247,0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Trophy size={16} />
            <span>Undian Doorprize ({eventWinners.length})</span>
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

          {/* 5. MIDDLE 2-COLUMN SECTION: QR CODE (LEFT) & DYNAMIC DIAGRAM (RIGHT) (IMAGE 3 STYLE) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
            alignItems: 'stretch'
          }}>
            {/* LEFT COLUMN: SCAN QR DI LAYAR */}
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              {/* Search Input */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Cari nama, NIP, jawaban..."
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

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700 }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  <option value="ALL">Semua Status</option>
                  <option value="Accepted">Diterima</option>
                  <option value="Submitted">Menunggu Review</option>
                  <option value="Rejected">Ditolak</option>
                </select>
              </div>

              {/* Option Filter (if choice field exists) */}
              {activeChoiceField && diagramData.items.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700 }}>{activeChoiceField.label}:</span>
                  <select
                    value={optionFilter}
                    onChange={(e) => setOptionFilter(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      maxWidth: '180px'
                    }}
                  >
                    <option value="ALL">Semua {activeChoiceField.label}</option>
                    {diagramData.items.map((opt, i) => (
                      <option key={i} value={opt.label}>
                        {opt.label} ({opt.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Winner Status Filter (if Lucky Draw is enabled) */}
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
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '10px', fontWeight: 700, width: '45px' }}>No</th>

                    <th
                      onClick={() => handleHeaderSort('name')}
                      style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>Nama Lengkap</span>
                        {sortConfig.key === 'name' ? (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                        ) : (
                          <ChevronsUpDown size={13} color="var(--text-dim)" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleHeaderSort('department')}
                      style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>Departemen / Unit</span>
                        {sortConfig.key === 'department' ? (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                        ) : (
                          <ChevronsUpDown size={13} color="var(--text-dim)" />
                        )}
                      </div>
                    </th>

                    <th style={{ padding: '10px', fontWeight: 700 }}>Kontak / Identitas</th>

                    {/* Dynamic Form Custom Fields Columns */}
                    {(connectedForm?.fields || []).map(f => (
                      <th
                        key={f.id}
                        onClick={() => handleHeaderSort(f.label || f.id)}
                        style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{f.label}</span>
                          {sortConfig.key === (f.label || f.id) ? (
                            sortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                          ) : (
                            <ChevronsUpDown size={13} color="var(--text-dim)" />
                          )}
                        </div>
                      </th>
                    ))}

                    <th
                      onClick={() => handleHeaderSort('status')}
                      style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>Status</span>
                        {sortConfig.key === 'status' ? (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--mandiri-gold)" /> : <ChevronDown size={14} color="var(--mandiri-gold)" />
                        ) : (
                          <ChevronsUpDown size={13} color="var(--text-dim)" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleHeaderSort('createdAt')}
                      style={{ padding: '10px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
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
                      const info = getSubmissionInfo(sub);
                      const isWinner = wonIdsSet.has(sub.id) || wonIdsSet.has(info.name.toLowerCase().trim());
                      const rowIndex = pageSize === 'all' ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;

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
                          <td style={{ padding: '10px', fontWeight: 800, color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{info.name}</span>
                              {isWinner && (
                                <span style={{
                                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                  color: '#fff',
                                  fontSize: '0.62rem',
                                  padding: '1px 7px',
                                  borderRadius: 'var(--radius-full)',
                                  fontWeight: 800,
                                  boxShadow: '0 0 10px rgba(168,85,247,0.4)'
                                }}>
                                  🏆 Pemenang
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{info.department}</td>
                          <td style={{ padding: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {info.identifier}
                          </td>

                          {/* Dynamic Custom Fields Values */}
                          {(connectedForm?.fields || []).map(f => {
                            const val = sub.data?.[f.label] ?? sub.data?.[f.id] ?? '-';
                            return (
                              <td key={f.id} style={{ padding: '10px', color: 'var(--text-main)' }}>
                                {String(val)}
                              </td>
                            );
                          })}

                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: sub.status === 'Accepted'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : (sub.status === 'Rejected' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 184, 0, 0.15)'),
                              color: sub.status === 'Accepted'
                                ? '#10b981'
                                : (sub.status === 'Rejected' ? '#f43f5e' : 'var(--mandiri-gold)')
                            }}>
                              {sub.status === 'Accepted' ? 'Diterima' : (sub.status === 'Rejected' ? 'Ditolak' : 'Menunggu Review')}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-dim)', fontSize: '0.74rem' }}>
                            {info.submittedAt ? formatWibTimestamp(info.submittedAt).shortDate : '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6 + (connectedForm?.fields?.length || 0)} style={{ padding: '36px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
            padding: '28px',
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
                  Mesin Undian Berputar (Lucky Draw)
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
                <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '6px 14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#c084fc' }}>SUDAH MENANG</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#c084fc' }}>{eventWinners.length}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '6px 14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#10b981' }}>SIAP DIUNDI</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>{eligiblePool.length}</div>
                </div>
              </div>
            </div>

            {/* Input Controls Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                  <option value="__name__">Nama Lengkap Peserta (Default)</option>
                  {(connectedForm?.fields || []).map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label} ({f.type || 'text'})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Nilai field ini akan berputar saat pengundian berlangsung
                </div>
              </div>
            </div>

            {/* ROLLING STAGE (SLOT MACHINE / SPINNER CARD) */}
            <div style={{
              background: 'radial-gradient(ellipse at center, #0b1a3d 0%, #030814 100%)',
              border: isRolling ? '2px solid var(--mandiri-gold)' : '2px dashed var(--mandiri-blue)',
              borderRadius: 'var(--radius-lg)',
              padding: '42px 20px',
              textAlign: 'center',
              boxShadow: isRolling ? '0 0 45px rgba(255, 184, 0, 0.45)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '0.85rem', color: isRolling ? 'var(--mandiri-gold)' : 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                {isRolling ? '🎰 MEMUTAR DATA PENDAFTAR FORMULIR...' : `SESI UNDIAN: ${prizeName.toUpperCase()}`}
              </div>

              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.8rem)',
                fontWeight: 900,
                color: isRolling ? '#FFB800' : 'var(--text-main)',
                minHeight: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textShadow: isRolling ? '0 0 25px rgba(255, 184, 0, 0.6)' : 'none'
              }}>
                {isRolling ? rollingName : (
                  eligiblePool.length === 0 ? 'Semua Pendaftar Form Sudah Menang!' : 'Siap Mengundi'
                )}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {eligiblePool.length} kandidat dari pendaftar formulir siap diundi
              </div>

              {/* Start Draw Button */}
              <div style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={handleRunLuckyDraw}
                  disabled={isRolling || eligiblePool.length === 0}
                  style={{
                    padding: '14px 44px',
                    borderRadius: 'var(--radius-full)',
                    background: eligiblePool.length === 0 ? 'var(--input-bg)' : 'linear-gradient(135deg, #FFB800 0%, #e0a300 100%)',
                    color: eligiblePool.length === 0 ? 'var(--text-dim)' : '#040914',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    border: 'none',
                    cursor: eligiblePool.length > 0 && !isRolling ? 'pointer' : 'not-allowed',
                    boxShadow: eligiblePool.length > 0 && !isRolling ? '0 0 30px rgba(255, 184, 0, 0.4)' : 'none',
                    transform: isRolling ? 'scale(0.96)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isRolling ? 'Sedang Mengundi...' : `🎰 Putar & Undi (${drawCount} Pemenang)`}
                </button>
              </div>
            </div>

            {/* WINNERS LIST TABLE */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="var(--mandiri-gold)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Daftar Pemenang Undian ({eventWinners.length})
                  </h3>
                </div>

                {eventWinners.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.35)',
                      color: '#f43f5e',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset Semua Pemenang</span>
                  </button>
                )}
              </div>

              {eventWinners.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-dim)' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>No</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Nama Pemenang</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Departemen</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Kontak / NIP</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Hadiah / Sesi</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Waktu Menang</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventWinners.map((winner, idx) => (
                        <tr key={winner.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 10px', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                            #{winner.drawNumber || idx + 1}
                          </td>
                          <td style={{ padding: '10px 10px', fontWeight: 800, color: 'var(--text-main)' }}>
                            <div>
                              <span>{winner.winnerName}</span>
                              {winner.drawnFieldValue && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--mandiri-gold)', fontWeight: 600 }}>
                                  {winner.drawnFieldLabel || 'Field'}: {winner.drawnFieldValue}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>
                            {winner.winnerDepartment}
                          </td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {winner.winnerIdentifier}
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{
                              background: 'rgba(255, 184, 0, 0.15)',
                              border: '1px solid var(--mandiri-gold)',
                              color: 'var(--mandiri-gold)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              {winner.prizeTitle}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                            {winner.drawnAt ? formatWibTimestamp(winner.drawnAt).shortDate : '-'}
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <button
                              type="button"
                              onClick={() => onDeleteLuckyDraw && onDeleteLuckyDraw(winner.id)}
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
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
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
                  Belum ada pemenang yang diundi untuk acara ini. Tekan tombol <strong>Putar & Undi</strong> di atas untuk memulai doorprize!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: LATEST WINNERS POPUP CELEBRATION
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
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            border: '2px solid var(--mandiri-gold)',
            boxShadow: '0 25px 60px rgba(255, 184, 0, 0.35)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFB800 0%, #e0a300 100%)',
              color: '#040914',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 0 25px rgba(255, 184, 0, 0.5)'
            }}>
              <Trophy size={34} />
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--mandiri-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                SELAMAT KEPADA PEMENANG!
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                {prizeName}
              </h2>
            </div>

            {/* List of Newly Drawn Winners */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {latestWinners.map((w, idx) => (
                <div
                  key={w.id || idx}
                  style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.4)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                      {w.winnerName}
                    </div>
                    {w.drawnFieldValue && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--mandiri-gold)', fontWeight: 700 }}>
                        {w.drawnFieldLabel || 'Field'}: {w.drawnFieldValue}
                      </div>
                    )}
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {w.winnerDepartment} • {w.winnerIdentifier}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                    Pemenang #{w.drawNumber}
                  </span>
                </div>
              ))}
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
            padding: '24px',
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
    </div>
  );
}
