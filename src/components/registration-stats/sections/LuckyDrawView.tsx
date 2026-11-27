import React from 'react';
import { Award, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight, ChevronsUpDown, Clock, Download, Loader2, RotateCcw, Search, Sparkles, Trash2, Trophy } from 'lucide-react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function LuckyDrawView() {
  const {
    activeView,
    allCandidates,
    connectedForm,
    countdown,
    drawCount,
    dropdownFields,
    eligiblePool,
    eventWinners,
    filteredWinners,
    getDropdownOptions,
    handleDrawCountChange,
    handleExportWinnersCsv,
    handleResetWinnerFilters,
    handleRunLuckyDraw,
    handleWinnerHeaderSort,
    hasActiveWinnerFilters,
    isDark,
    isLuckyDrawEnabled,
    isRolling,
    paginatedWinners,
    prizeName,
    rollingName,
    selectedDrawFieldId,
    setPrizeName,
    setResetConfirmOpen,
    setSelectedDrawFieldId,
    setWinnerCurrentPage,
    setWinnerDropdownFilters,
    setWinnerPageSize,
    setWinnerPrizeFilter,
    setWinnerSearchQuery,
    setWinnerToDelete,
    totalFilteredWinners,
    totalWinnerPages,
    uniquePrizeNames,
    winnerCurrentPage,
    winnerDropdownFilters,
    winnerPageSize,
    winnerPrizeFilter,
    winnerSearchPlaceholder,
    winnerSearchQuery,
    winnerSortConfig
  } = useRegistrationStats();

  return (
    <>
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
                  {(connectedForm?.fields || []).map((f: any) => (
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
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '16px',
                  background: 'var(--input-bg)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}>
                  {/* Dynamic Search Input for Winners (Fills left space) */}
                  <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 'min(100%, 180px)', maxWidth: '100%' }}>
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
                        fontSize: '0.78rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Right-aligned filters group: Prize Filter + Dropdowns + Reset */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginLeft: 'auto',
                    minWidth: 0,
                    maxWidth: '100%'
                  }}>
                    {/* Filter by Prize / Session Name */}
                    {uniquePrizeNames.length > 1 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flex: '0 0 auto',
                        minWidth: 0,
                        maxWidth: '100%'
                      }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          Hadiah:
                        </span>
                        <select
                          value={winnerPrizeFilter}
                          onChange={(e) => setWinnerPrizeFilter(e.target.value)}
                          style={{
                            width: '170px',
                            padding: '6px 26px 6px 12px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            minWidth: 0,
                            maxWidth: '100%',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="ALL">Semua Sesi Hadiah</option>
                          {uniquePrizeNames.map((p: any, i: any) => (
                            <option key={i} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Dynamic Form Dropdown Filters for Winners */}
                    {dropdownFields.map((df: any) => {
                      const options = getDropdownOptions(df);
                      return (
                        <div
                          key={df.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flex: '0 0 auto',
                            minWidth: 0,
                            maxWidth: '100%'
                          }}
                        >
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {df.label}:
                          </span>
                          <select
                            value={winnerDropdownFilters[df.id] || 'ALL'}
                            onChange={(e) => setWinnerDropdownFilters((prev: any) => ({ ...prev, [df.id]: e.target.value }))}
                            style={{
                              width: '180px',
                              padding: '6px 26px 6px 12px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              minWidth: 0,
                              maxWidth: '100%',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              boxSizing: 'border-box'
                            }}
                          >
                            <option value="ALL">Semua {df.label}</option>
                            {options.map((opt: any, i: any) => (
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
                          flex: '0 0 auto',
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
                        {(connectedForm?.fields || []).map((f: any) => (
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
                        paginatedWinners.map((winner: any, idx: any) => {
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
                              {(connectedForm?.fields || []).map((f: any, colIdx: any) => {
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
                        onClick={() => setWinnerCurrentPage((p: any) => Math.max(1, p - 1))}
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
                        onClick={() => setWinnerCurrentPage((p: any) => Math.min(totalWinnerPages, p + 1))}
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
    </>
  );
}
