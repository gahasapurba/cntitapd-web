import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppNavigate } from '../lib/appNavigation';
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
import { useEventRegistrationStats } from './registration-stats/useEventRegistrationStats';
import { RegistrationStatsContext } from './registration-stats/RegistrationStatsContext';
import { DIAGRAM_COLORS } from './registration-stats/registrationStatsShared';
import StatsHeader from './registration-stats/sections/StatsHeader';
import EventSummaryCard from './registration-stats/sections/EventSummaryCard';
import RegistrationKpis from './registration-stats/sections/RegistrationKpis';
import ViewSwitcher from './registration-stats/sections/ViewSwitcher';
import StatsView from './registration-stats/sections/StatsView';
import LuckyDrawView from './registration-stats/sections/LuckyDrawView';
import LatestWinnersModal from './registration-stats/sections/LatestWinnersModal';
import ResetDrawModal from './registration-stats/sections/ResetDrawModal';
import DeleteWinnerModal from './registration-stats/sections/DeleteWinnerModal';
import PosterModal from './registration-stats/sections/PosterModal';
import StatsAlert from './registration-stats/sections/StatsAlert';


// Palette of 12 distinct vibrant colors for dynamic diagrams
export default function EventRegistrationStats(props) {
  const eventRegistrationStatsState = useEventRegistrationStats(props);
  const {
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
  } = eventRegistrationStatsState;

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
                navigateTo('/#home');
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
    <RegistrationStatsContext.Provider value={eventRegistrationStatsState}>
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '0 14px 80px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '22px'
    }}>
      {/* 1. TOP NAV & REALTIME STATUS BAR */}
      <StatsHeader />

      {/* 2. EVENT & FORM HERO HEADER */}
      <EventSummaryCard />

      {/* 3. REPLACED METRICS: SINGLE WIDE BANNER CARD (IMAGE 2 STYLE) */}
      <RegistrationKpis />

      {/* 4. SUB-PAGE TAB SWITCHER: 'stats' vs 'luckydraw' (if isLuckyDraw is enabled) */}
      <ViewSwitcher />

      {/* =========================================================================
          VIEW A: QR CODE SCAN + DYNAMIC DIAGRAM + RESPONDENT TABLE
          ========================================================================= */}
      <StatsView />

      {/* =========================================================================
          VIEW B: LUCKY DRAW / DOORPRIZE SYSTEM (STRICTLY FORM REGISTRANTS)
          ========================================================================= */}
      <LuckyDrawView />

      {/* =========================================================================
          MODAL 1: LATEST WINNERS POPUP CELEBRATION (DISPLAYS ALL SUBMITTED DATA)
          ========================================================================= */}
      <LatestWinnersModal />

      {/* =========================================================================
          MODAL 2: RESET CONFIRMATION
          ========================================================================= */}
      <ResetDrawModal />

      {/* =========================================================================
          MODAL 3: DELETE SINGLE WINNER CONFIRMATION
          ========================================================================= */}
      <DeleteWinnerModal />

      {/* =========================================================================
          MODAL 3: POSTER QR PREVIEW (OPTIMAL MOBILE & DESKTOP)
          ========================================================================= */}
      <PosterModal />

      {/* =========================================================================
          REALTIME WELCOME ALERT (BOTTOM-RIGHT SEQUENTIAL FIFO TOAST)
          ========================================================================= */}
      <StatsAlert />
    </div>
    </RegistrationStatsContext.Provider>
  );
}
