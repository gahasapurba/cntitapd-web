import React from 'react';
import { BarChart3, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight, ChevronsUpDown, Copy, Download, QrCode, RotateCcw, Search, Sparkles } from 'lucide-react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function StatsView() {
  const {
    activeDiagramFieldId,
    activeView,
    choiceFields,
    connectedForm,
    copySuccess,
    currentPage,
    diagramData,
    dropdownFields,
    dropdownFilters,
    event,
    filteredSubmissions,
    formSubmissions,
    getDropdownOptions,
    handleCopyLink,
    handleExportCsv,
    handleGeneratePoster,
    handleHeaderSort,
    handleResetFilters,
    hasActiveFilters,
    isDark,
    isFormClosed,
    isGeneratingPoster,
    isLuckyDrawEnabled,
    pageSize,
    paginatedSubmissions,
    qrCodeDataUrl,
    searchPlaceholder,
    searchQuery,
    setActiveDiagramFieldId,
    setCurrentPage,
    setDropdownFilters,
    setPageSize,
    setSearchQuery,
    setWinnerFilter,
    sortConfig,
    totalFiltered,
    totalPages,
    winnerFilter,
    wonIdsSet
  } = useRegistrationStats();

  return (
    <>
      {(!isLuckyDrawEnabled || activeView === 'stats') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                    {choiceFields.map((cf: any) => (
                      <button
                        key={cf.id}
                        type="button"
                        onClick={() => {
                          setActiveDiagramFieldId(cf.id);
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
                    {diagramData.items.map((item: any, idx: any) => (
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
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              background: 'var(--input-bg)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Dynamic Search Input (Fills left space) */}
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 'min(100%, 180px)', maxWidth: '100%' }}>
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
                    fontSize: '0.78rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Right-aligned filters group: Dropdowns + Undian + Reset */}
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
                {/* Dynamic Choice/Dropdown Filters from Form */}
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
                        value={dropdownFilters[df.id] || 'ALL'}
                        onChange={(e) => setDropdownFilters((prev: any) => ({ ...prev, [df.id]: e.target.value }))}
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: '0 0 auto',
                    minWidth: 0,
                    maxWidth: '100%'
                  }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      Undian:
                    </span>
                    <select
                      value={winnerFilter}
                      onChange={(e) => setWinnerFilter(e.target.value)}
                      style={{
                        width: '150px',
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

            {/* Table */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '10px', fontWeight: 700, width: '45px' }}>No</th>

                    {/* Dynamic Form Custom Fields Columns */}
                    {(connectedForm?.fields || []).map((f: any) => (
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
                    paginatedSubmissions.map((sub: any, idx: any) => {
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
                          {(connectedForm?.fields || []).map((f: any, colIdx: any) => {
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
                    onClick={() => setCurrentPage((p: any) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage((p: any) => Math.min(totalPages, p + 1))}
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
    </>
  );
}
