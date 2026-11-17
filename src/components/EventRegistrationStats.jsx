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
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateFormQrPoster } from '../utils/qrPosterGenerator';
import { formatWibTimestamp, formatDeadlineWib, formatToIndonesianDate, formatWibEventRange } from '../utils/dateUtils';
import { getPublicBaseUrl } from '../utils/urlUtils';

export default function EventRegistrationStats({
  eventId,
  events = [],
  forms = [],
  submissions = [],
  eventRsvps = [],
  luckyDraws = [],
  onAddLuckyDraw,
  onDeleteLuckyDraw,
  onResetLuckyDraw,
  onBack,
  onNavigateForm,
  theme = 'dark'
}) {
  const isDark = theme === 'dark';

  // 1. Identify Target Event & Connected Form
  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
  const connectedForm = useMemo(() => {
    if (!eventId) return null;
    return forms.find(f => f.isEventConnected && f.eventId === eventId) ||
      forms.find(f => f.eventId === eventId);
  }, [forms, eventId]);

  const isLuckyDrawEnabled = connectedForm ? Boolean(connectedForm.isLuckyDraw) : false;

  // View state: 'stats' | 'luckydraw'
  const [activeView, setActiveView] = useState('stats');

  // Filter & Search in Stats Table
  const [searchQuery, setSearchQuery] = useState('');
  const [includeInitialRsvpsInDraw, setIncludeInitialRsvpsInDraw] = useState(true);

  // Poster QR state
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterModal, setPosterModal] = useState(null);

  // Lucky Draw State
  const [prizeName, setPrizeName] = useState('Doorprize Utama');
  const [drawCount, setDrawCount] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingName, setRollingName] = useState('Siap Mengundi...');
  const [latestWinners, setLatestWinners] = useState([]);
  const [showLatestWinnersModal, setShowLatestWinnersModal] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // 2. Data Filtering: Form Submissions & Initial RSVPs
  const formSubmissions = useMemo(() => {
    if (!connectedForm) return [];
    return submissions.filter(s => s.formId === connectedForm.id);
  }, [submissions, connectedForm]);

  const initialRsvps = useMemo(() => {
    if (!eventId) return [];
    return eventRsvps.filter(r => r.eventId === eventId);
  }, [eventRsvps, eventId]);

  // Existing Lucky Draw Winners for this event
  const eventWinners = useMemo(() => {
    if (!eventId) return [];
    return (luckyDraws || []).filter(ld => ld.eventId === eventId);
  }, [luckyDraws, eventId]);

  // Winner lookup set by ID and normalized name
  const wonIdsSet = useMemo(() => {
    const s = new Set();
    eventWinners.forEach(w => {
      if (w.submissionId) s.add(w.submissionId);
      if (w.winnerName) s.add(w.winnerName.toLowerCase().trim());
      if (w.winnerIdentifier) s.add(w.winnerIdentifier.toLowerCase().trim());
    });
    return s;
  }, [eventWinners]);

  // Helper to extract clean applicant name & department from a submission
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

  // Compile all candidates for Lucky Draw
  const allCandidates = useMemo(() => {
    const pool = [];
    const seen = new Set();

    // 1. Add form submissions
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

    // 2. Add initial RSVPs if toggle enabled
    if (includeInitialRsvpsInDraw) {
      initialRsvps.forEach(rsvp => {
        const name = (rsvp.name || 'Peserta RSVP').trim();
        const ident = (rsvp.phone || rsvp.email || rsvp.department || '').trim();
        const key = (name + '|' + ident).toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          pool.push({
            id: rsvp.id,
            submissionId: rsvp.id,
            name: name,
            department: rsvp.department || 'Insan IT APD',
            identifier: ident || rsvp.phone || '-',
            source: 'RSVP Bawaan Awal',
            raw: rsvp
          });
        }
      });
    }

    return pool;
  }, [formSubmissions, initialRsvps, includeInitialRsvpsInDraw]);

  // Eligible candidates who have NOT won yet
  const eligiblePool = useMemo(() => {
    return allCandidates.filter(c => {
      if (wonIdsSet.has(c.id)) return false;
      if (c.submissionId && wonIdsSet.has(c.submissionId)) return false;
      if (c.name && wonIdsSet.has(c.name.toLowerCase().trim())) return false;
      if (c.identifier && c.identifier !== '-' && wonIdsSet.has(c.identifier.toLowerCase().trim())) return false;
      return true;
    });
  }, [allCandidates, wonIdsSet]);

  // Dynamic Form Field Analytics
  const fieldAnalytics = useMemo(() => {
    if (!connectedForm?.fields || !Array.isArray(connectedForm.fields)) return [];

    return connectedForm.fields.map(field => {
      const fLabel = field.label || 'Field';
      const fType = field.type || 'text';
      const answersMap = {};
      let totalAnswered = 0;

      formSubmissions.forEach(sub => {
        const val = sub.data?.[fLabel] ?? sub.data?.[field.id] ?? '';
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          totalAnswered += 1;
          const ansKey = String(val).trim();
          answersMap[ansKey] = (answersMap[ansKey] || 0) + 1;
        }
      });

      const optionsBreakdown = Object.entries(answersMap)
        .map(([opt, count]) => ({
          option: opt,
          count,
          percentage: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      return {
        id: field.id,
        label: fLabel,
        type: fType,
        totalAnswered,
        optionsBreakdown,
        isChoice: ['select', 'radio', 'checkbox'].includes(fType) || optionsBreakdown.length <= 8
      };
    });
  }, [connectedForm, formSubmissions]);

  // Filtered Submissions for Table view
  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return formSubmissions;
    return formSubmissions.filter(sub => {
      const info = getSubmissionInfo(sub);
      const dataStr = Object.values(sub.data || {}).join(' ').toLowerCase();
      return info.name.toLowerCase().includes(q) ||
        info.department.toLowerCase().includes(q) ||
        info.identifier.toLowerCase().includes(q) ||
        dataStr.includes(q);
    });
  }, [formSubmissions, searchQuery]);

  // Handle Download / Share QR Poster Card
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

      // On mobile try Web Share API
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

      // If mobile or download fails, display preview modal
      if (isMobile) {
        setPosterModal(result);
        setIsGeneratingPoster(false);
        return;
      }

      // Desktop direct download
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

  // Handle Lucky Draw Spin & Selection
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
      setRollingName(randomCandidate ? `${randomCandidate.name} (${randomCandidate.department})` : 'Mengundi...');

      if (iterations >= maxIterations) {
        clearInterval(rollTimer);

        // Pick winners randomly without replacement
        const shuffled = [...eligiblePool].sort(() => 0.5 - Math.random());
        const chosen = shuffled.slice(0, requestedCount);

        const nowIso = new Date().toISOString();
        const newWinners = chosen.map((c, idx) => ({
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
          drawnAt: nowIso
        }));

        if (onAddLuckyDraw) {
          onAddLuckyDraw(newWinners);
        }

        setLatestWinners(newWinners);
        setIsRolling(false);
        setShowLatestWinnersModal(true);

        // Celebratory Confetti!
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    }, intervalTime);
  };

  // Export Table Data to CSV
  const handleExportCsv = () => {
    if (formSubmissions.length === 0) return;
    const headers = ['No', 'Nama Pendaftar', 'Departemen', 'Waktu Pengisian', 'Status'];
    const fieldHeaders = (connectedForm?.fields || []).map(f => f.label || 'Field');
    const allHeaders = [...headers, ...fieldHeaders];

    const rows = formSubmissions.map((sub, idx) => {
      const info = getSubmissionInfo(sub);
      const fieldVals = (connectedForm?.fields || []).map(f => {
        const val = sub.data?.[f.label] ?? sub.data?.[f.id] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [
        idx + 1,
        `"${info.name.replace(/"/g, '""')}"`,
        `"${info.department.replace(/"/g, '""')}"`,
        `"${info.submittedAt}"`,
        `"${sub.status || 'Submitted'}"`,
        ...fieldVals
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [allHeaders.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data-pendaftar-${event?.title ? event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 12px 80px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* 1. TOP NAV & QUICK ACTION BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 0',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {connectedForm && (
            <button
              onClick={handleGeneratePoster}
              disabled={isGeneratingPoster}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1.5px solid rgba(56, 189, 248, 0.45)',
                color: 'var(--neon-cyan)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: isGeneratingPoster ? 'wait' : 'pointer'
              }}
              title="Unduh Poster QR Code beresolusi tinggi untuk dicetak atau dibagikan"
            >
              <QrCode size={15} />
              <span>{isGeneratingPoster ? 'Menyiapkan Poster...' : 'Unduh Poster QR (PNG)'}</span>
            </button>
          )}

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
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={14} />
              <span>Buka Formulir Pendaftaran</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. EVENT & FORM HERO HEADER */}
      <div className="glass-panel" style={{
        padding: '24px',
        border: '1.5px solid var(--mandiri-blue)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
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

          {/* Connected Form Badge */}
          {connectedForm ? (
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              maxWidth: '340px',
              width: '100%'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                🔗 Formulir Pendaftaran Terhubung
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                {connectedForm.title}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Kategori: {connectedForm.category} • {connectedForm.isOpen !== false ? '🟢 Pendaftaran Dibuka' : '🔴 Ditutup'}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 184, 0, 0.08)',
              border: '1px dashed var(--mandiri-gold)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.78rem',
              color: 'var(--mandiri-gold)'
            }}>
              ⚠️ Event ini belum terhubung ke Formulir Pendaftaran khusus. Pendaftaran saat ini menggunakan RSVP standar bawaan event.
            </div>
          )}
        </div>

        {/* 3. KEY METRICS STATS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          paddingTop: '8px'
        }}>
          <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--mandiri-gold)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Total Pendaftar (Form)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
              {formSubmissions.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Orang</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Melalui formulir pendaftaran khusus
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Pendaftar Diterima
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981', margin: '2px 0' }}>
              {formSubmissions.filter(s => s.status === 'Accepted').length}
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}> / {formSubmissions.length}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {formSubmissions.filter(s => !s.status || s.status === 'Submitted').length} status menunggu review
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--neon-cyan)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              RSVP Bawaan Awal
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
              {initialRsvps.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Peserta</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Data RSVP sebelum form dihubungkan
            </div>
          </div>

          {isLuckyDrawEnabled && (
            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Pemenang Undian
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a855f7', margin: '2px 0' }}>
                {eventWinners.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pemenang</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {eligiblePool.length} kandidat siap diundi
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. SUB-PAGE TAB SWITCHER: 'stats' vs 'luckydraw' */}
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
            <span>Statistik & Responden</span>
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
          VIEW A: DYNAMIC FIELD STATS & RESPONDENT LIST
          ========================================================================= */}
      {(!isLuckyDrawEnabled || activeView === 'stats') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Initial RSVP Alert Banner */}
          {initialRsvps.length > 0 && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={20} color="var(--neon-cyan)" />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Terdapat {initialRsvps.length} Pendaftar Awal dari RSVP Bawaan Event
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Data ini didaftarkan sebelum formulir khusus dihubungkan. Data tetap aman dan dapat diikutsertakan ke dalam undian.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Field Breakdown Cards (Aggregations) */}
          {fieldAnalytics.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
                📊 Analisis Pilihan & Jawaban Form Dinamis
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px'
              }}>
                {fieldAnalytics.filter(f => f.isChoice && f.optionsBreakdown.length > 0).map(f => (
                  <div
                    key={f.id}
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {f.label}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {f.totalAnswered} respon
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {f.optionsBreakdown.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{opt.option}</span>
                            <span style={{ color: 'var(--mandiri-gold)', fontWeight: 800 }}>
                              {opt.count} ({opt.percentage}%)
                            </span>
                          </div>
                          {/* Visual Progress Bar */}
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${opt.percentage}%`,
                              height: '100%',
                              background: oIdx === 0 ? 'var(--mandiri-gold)' : (oIdx === 1 ? 'var(--neon-cyan)' : '#a855f7'),
                              borderRadius: '3px',
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Respondent Data Table */}
          <div className="glass-panel" style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                  Daftar Pendaftar Terkonfirmasi ({formSubmissions.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Seluruh respon yang masuk melalui formulir terhubung
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama, departemen, data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '7px 12px 7px 30px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      width: '200px'
                    }}
                  />
                </div>

                <button
                  onClick={handleExportCsv}
                  disabled={formSubmissions.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
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
                  <Download size={13} />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 700 }}>No</th>
                    <th style={{ padding: '8px 10px', fontWeight: 700 }}>Nama Lengkap</th>
                    <th style={{ padding: '8px 10px', fontWeight: 700 }}>Departemen / Unit</th>
                    <th style={{ padding: '8px 10px', fontWeight: 700 }}>Kontak / Identitas</th>
                    {/* Render Form Custom Fields as Columns */}
                    {(connectedForm?.fields || []).slice(0, 4).map(f => (
                      <th key={f.id} style={{ padding: '8px 10px', fontWeight: 700 }}>
                        {f.label}
                      </th>
                    ))}
                    <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '8px 10px', fontWeight: 700 }}>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((sub, idx) => {
                      const info = getSubmissionInfo(sub);
                      const isWinner = wonIdsSet.has(sub.id) || wonIdsSet.has(info.name.toLowerCase().trim());

                      return (
                        <tr
                          key={sub.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: isWinner ? 'rgba(168, 85, 247, 0.07)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '10px 10px', color: 'var(--text-dim)' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 10px', fontWeight: 800, color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{info.name}</span>
                              {isWinner && (
                                <span style={{
                                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                  color: '#fff',
                                  fontSize: '0.62rem',
                                  padding: '1px 6px',
                                  borderRadius: '8px',
                                  fontWeight: 800
                                }}>
                                  🏆 Menang
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{info.department}</td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {info.identifier}
                          </td>
                          {/* Custom Fields values */}
                          {(connectedForm?.fields || []).slice(0, 4).map(f => (
                            <td key={f.id} style={{ padding: '10px 10px', color: 'var(--text-main)' }}>
                              {String(sub.data?.[f.label] ?? sub.data?.[f.id] ?? '-')}
                            </td>
                          ))}
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: sub.status === 'Accepted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 184, 0, 0.15)',
                              color: sub.status === 'Accepted' ? '#10b981' : 'var(--mandiri-gold)'
                            }}>
                              {sub.status || 'Submitted'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                            {info.submittedAt ? formatWibTimestamp(info.submittedAt).shortDate : '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ padding: '32px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Belum ada responden yang mendaftar pada formulir ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: LUCKY DRAW / DOORPRIZE SYSTEM
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
              </div>

              {/* Pool Statistics Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-card)', padding: '6px 14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>TOTAL PENDAFTAR</div>
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

            {/* Input Controls */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)'
            }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  🎁 Sesi Hadiah / Nama Doorprize:
                </label>
                <input
                  type="text"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  placeholder="Contoh: Grand Prize, Smart Watch, Hadiah Hiburan"
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

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  👥 Jumlah Pemenang Kali Ini:
                </label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, eligiblePool.length)}
                  value={drawCount}
                  onChange={(e) => setDrawCount(e.target.value)}
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

              {/* Toggle to include initial RSVPs if exist */}
              {initialRsvps.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={includeInitialRsvpsInDraw}
                      onChange={(e) => setIncludeInitialRsvpsInDraw(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--mandiri-gold)' }}
                    />
                    <span>Sertakan {initialRsvps.length} peserta RSVP bawaan awal</span>
                  </label>
                </div>
              )}
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
                {isRolling ? '🎰 MEMUTAR DATA PENDAFTAR ACARA...' : `SESI UNDIAN: ${prizeName.toUpperCase()}`}
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
                  eligiblePool.length === 0 ? 'Semua Peserta Sudah Menang!' : 'Siap Mengundi'
                )}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {eligiblePool.length} kandidat yang memenuhi syarat siap diundi
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
                            {winner.winnerName}
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
                Tindakan ini akan menghapus seluruh data {eventWinners.length} pemenang undian pada acara ini dan mengembalikan semua pendaftar ke dalam pool undian.
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
