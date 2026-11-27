import React from 'react';
import { Copy, Download, Search } from 'lucide-react';
import { formatWibTimestamp } from '../../utils/dateUtils';
import { soundFx } from '../../utils/audio';
import { formatWaPhone } from '../adminShared';
import { useAdminPortal } from '../AdminPortalContext';

export default function SubmissionsTab() {
  const {
    activeTab,
    applications,
    forms,
    luckyDraws,
    onDeleteSubmission,
    onUpdateSubmission,
    selectedSubFilter,
    setDeleteConfirm,
    setSelectedSubFilter,
    setSubCurrentPage,
    setSubSearchQuery,
    setSubStatusFilter,
    setSubTenureFilter,
    showToast,
    subCurrentPage,
    subSearchQuery,
    subStatusFilter,
    subTenureFilter,
    submissions,
    tenures
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'submissions' && (() => {
        const statusMeta: Record<string, any> = {
          Submitted: { label: 'Baru Masuk', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)' },
          Reviewed: { label: 'Direview', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
          Interview: { label: 'Wawancara', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
          Accepted: { label: 'Diterima ✓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)' },
          Rejected: { label: 'Ditolak / Arsip', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' }
        };

        const resolveFormTitle = (sub: any) => {
          if (!sub) return 'Formulir';
          const matched = forms.find((f: any) => f.id === sub.formId);
          return matched?.title || sub.formTitle || 'Formulir';
        };

        const resolveFormTenure = (sub: any) => {
          if (sub?.tenureId) return sub.tenureId;
          const matched = forms.find((f: any) => f.id === sub?.formId);
          return matched?.tenureId || '';
        };

        const filteredSubmissions = submissions.filter((s: any) => {
          const matchesTenure = subTenureFilter === 'all' || resolveFormTenure(s) === subTenureFilter;
          const matchesForm = selectedSubFilter === 'all' || s.formId === selectedSubFilter;
          const currentStat = s.status || 'Submitted';
          const matchesStatus = subStatusFilter === 'all' || currentStat === subStatusFilter;
          const q = subSearchQuery.trim().toLowerCase();
          const dataString = JSON.stringify(s.data || {}).toLowerCase();
          const formTitleStr = resolveFormTitle(s).toLowerCase();
          const matchesSearch = !q ||
            (s.id || '').toLowerCase().includes(q) ||
            dataString.includes(q) ||
            formTitleStr.includes(q) ||
            (s.adminNotes || '').toLowerCase().includes(q);
          return matchesTenure && matchesForm && matchesStatus && matchesSearch;
        });

        const SUBS_PER_PAGE = 3;
        const totalSubPages = Math.ceil(filteredSubmissions.length / SUBS_PER_PAGE) || 1;
        const safeSubPage = Math.min(Math.max(1, subCurrentPage), totalSubPages);
        const paginatedSubmissions = filteredSubmissions.slice(
          (safeSubPage - 1) * SUBS_PER_PAGE,
          safeSubPage * SUBS_PER_PAGE
        );

        const extractApplicantPhone = (dataObj: Record<string, any> = {}) => {
          for (const [k, v] of Object.entries(dataObj)) {
            if (/wa|whatsapp|phone|telp|hp/i.test(k) && v) {
              return formatWaPhone(v);
            }
          }
          return '';
        };

        const extractApplicantName = (sub: any) => {
          const d = sub?.data || {};
          return d['f-fullName'] || d['f-teamName'] || d['f-name'] || d['f-captainName'] || d.fullName || 'Peserta';
        };

        return (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Data Pengisian Form ({filteredSubmissions.length} dari {submissions.length + applications.length})
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Kelola data respon pengisian formulir pendaftar, ubah status seleksi, tambahkan catatan, hubungi via WhatsApp 1-klik, atau unduh laporan CSV.
                </p>
              </div>

              {/* Filter Dropdown & Export Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0, maxWidth: '100%' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama, ID submission, NIP, divisi..."
                    value={subSearchQuery}
                    onChange={(e) => {
                      setSubSearchQuery(e.target.value);
                      setSubCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px 8px 30px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>

                <select
                  value={subTenureFilter}
                  onChange={(e) => {
                    setSubTenureFilter(e.target.value);
                    setSelectedSubFilter('all');
                    setSubCurrentPage(1);
                  }}
                  style={{
                    flex: '1 1 160px',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textOverflow: 'ellipsis'
                  }}
                >
                  <option value="all">Semua Periode ({submissions.length + applications.length})</option>
                  {tenures.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      Periode {t.code || t.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSubFilter}
                  onChange={(e) => {
                    setSelectedSubFilter(e.target.value);
                    setSubCurrentPage(1);
                  }}
                  style={{
                    flex: '1 1 180px',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textOverflow: 'ellipsis'
                  }}
                >
                  <option value="all">Semua Formulir</option>
                  {(subTenureFilter === 'all'
                    ? forms
                    : forms.filter((f: any) => f.tenureId === subTenureFilter)
                  ).map((f: any) => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const itemsToExport = filteredSubmissions;
                    
                    if (itemsToExport.length === 0) {
                      showToast('Tidak ada data pengisian untuk diexport.', 'error');
                      return;
                    }

                    const dynamicKeys: string[] = Array.from(
                      new Set<string>(
                        itemsToExport.flatMap((s: any) => s.data ? Object.keys(s.data) : ['fullName', 'nip', 'unitSquad', 'div1', 'div2', 'whatsapp', 'email', 'motivation'])
                      )
                    );

                    const getCsvHeaderLabel = (k: any) => {
                      for (const f of forms) {
                        const m = f.fields?.find((fld: any) => fld.id === k || fld.id === `f-${k}`);
                        if (m?.label) return m.label;
                      }
                      return k.replace(/^f-/, '').toUpperCase();
                    };

                    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                    const headerRow = ['ID Berkas', 'Judul Formulir', 'Status Seleksi', 'Catatan Admin', 'Waktu Submit', ...dynamicKeys.map(getCsvHeaderLabel), 'Lampiran File'].map(escapeCsv).join(',');

                    const dataRows = itemsToExport.map((s: any) => {
                      const baseCols = [
                        s.id,
                        resolveFormTitle(s),
                        s.status || 'Submitted',
                        s.adminNotes || '',
                        formatWibTimestamp(s.createdAt || s.submittedAt).exact || s.submittedAt || s.createdAt || ''
                      ];
                      const fieldCols = dynamicKeys.map(k => {
                        if (s.data) return s.data[k] ?? '';
                        return s[k] ?? '';
                      });
                      const fileCol = s.files ? Object.values(s.files as Record<string, any>).map(f => f.name).join('; ') : '';
                      return [...baseCols, ...fieldCols, fileCol].map(escapeCsv).join(',');
                    });

                    const csvString = '\uFEFF' + [headerRow, ...dataRows].join('\n');
                    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `data_pengisian_form_cnt_it_apd_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast(`Berhasil mengunduh ${itemsToExport.length} data pengisian ke CSV!`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(14, 165, 233, 0.15)',
                    border: '1px solid #0ea5e9',
                    color: '#0ea5e9',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `Semua Status (${submissions.length})` },
                { id: 'Submitted', label: `Baru Masuk (${submissions.filter((s: any) => (s.status || 'Submitted') === 'Submitted').length})` },
                { id: 'Reviewed', label: `Direview (${submissions.filter((s: any) => s.status === 'Reviewed').length})` },
                { id: 'Interview', label: `Wawancara (${submissions.filter((s: any) => s.status === 'Interview').length})` },
                { id: 'Accepted', label: `Diterima (${submissions.filter((s: any) => s.status === 'Accepted').length})` },
                { id: 'Rejected', label: `Ditolak (${submissions.filter((s: any) => s.status === 'Rejected').length})` },
              ].map(st => {
                const active = subStatusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSubStatusFilter(st.id);
                      setSubCurrentPage(1);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: active ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                      background: active ? 'rgba(255, 184, 0, 0.15)' : 'var(--input-bg)',
                      color: active ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            {/* Submissions List */}
            {filteredSubmissions.length === 0 && applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                Tidak ada data pengisian formulir yang sesuai dengan filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {paginatedSubmissions.map((sub: any) => {
                  const curStatus = sub.status || 'Submitted';
                  const stInfo = statusMeta[curStatus] || statusMeta.Submitted;
                  const applicantName = extractApplicantName(sub);
                  const applicantWa = extractApplicantPhone(sub.data);
                  const formTitle = resolveFormTitle(sub);
                  const waMessage = encodeURIComponent(
                    `Halo ${applicantName}, kami dari Pengurus Culture Network Team (CNT) IT APD Bank Mandiri ingin menindaklanjuti pendaftaran Anda pada "${formTitle}".`
                  );

                  return (
                    <div key={sub.id} style={{
                      padding: '18px 20px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)',
                      borderLeft: `4px solid ${stInfo.color}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>{formTitle}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard?.writeText(sub.id);
                              showToast(`ID Submission "${sub.id}" berhasil disalin!`);
                            }}
                            title="Klik untuk menyalin ID Submission pendaftar ini"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 184, 0, 0.12)',
                              border: '1px solid rgba(255, 184, 0, 0.35)',
                              color: 'var(--mandiri-gold)',
                              fontFamily: 'monospace',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              letterSpacing: '0.3px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 184, 0, 0.22)';
                              e.currentTarget.style.borderColor = 'var(--mandiri-gold)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 184, 0, 0.12)';
                              e.currentTarget.style.borderColor = 'rgba(255, 184, 0, 0.35)';
                            }}
                          >
                            <Copy size={11} />
                            <span>ID: {sub.id}</span>
                          </button>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.98rem' }}>
                            {applicantName}
                          </strong>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: stInfo.bg,
                            color: stInfo.color,
                            border: `1px solid ${stInfo.color}`
                          }}>
                            {stInfo.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • {formatWibTimestamp(sub.submittedAt || sub.createdAt).exact || sub.submittedAt}
                          </span>
                        </div>

                        {/* Status Selector, 1-Click WA & Delete Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <select
                            value={curStatus}
                            onChange={(e) => {
                              const nextStat = e.target.value;
                              if (onUpdateSubmission) {
                                onUpdateSubmission({ ...sub, status: nextStat });
                                showToast(`Status berkas "${applicantName}" diubah menjadi ${statusMeta[nextStat]?.label || nextStat}`);
                              }
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--input-bg)',
                              border: `1px solid ${stInfo.color}`,
                              color: 'var(--text-main)',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Submitted">Status: Baru Masuk</option>
                            <option value="Reviewed">Status: Direview</option>
                            <option value="Interview">Status: Wawancara</option>
                            <option value="Accepted">Status: Diterima ✓</option>
                            <option value="Rejected">Status: Ditolak</option>
                          </select>

                          {applicantWa && (
                            <a
                              href={`https://wa.me/${applicantWa}?text=${waMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                background: 'rgba(37, 211, 102, 0.16)',
                                border: '1px solid #25d366',
                                color: '#25d366',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textDecoration: 'none'
                              }}
                              title="Hubungi pendaftar langsung via WhatsApp"
                            >
                              <span>💬 Hubungi WA</span>
                            </a>
                          )}

                          {onDeleteSubmission && (
                            <button
                              type="button"
                              onClick={() => {
                                const wonDraw = (luckyDraws || []).find((ld: any) => ld.submissionId === sub.id);
                                if (wonDraw) {
                                  setDeleteConfirm({
                                    type: 'submission',
                                    id: sub.id,
                                    name: `Berkas ${applicantName}`,
                                    isBlocked: true,
                                    drawPrize: wonDraw.prizeName,
                                    drawnAt: wonDraw.drawnAt
                                  });
                                } else {
                                  setDeleteConfirm({ type: 'submission', id: sub.id, name: `Berkas ${applicantName}` });
                                }
                              }}
                              style={{
                                background: 'rgba(244, 63, 94, 0.12)',
                                border: '1px solid rgba(244, 63, 94, 0.35)',
                                color: '#f43f5e',
                                padding: '5px 10px',
                                borderRadius: 'var(--radius-full)',
                                cursor: 'pointer',
                                fontSize: '0.74rem',
                                fontWeight: 700
                              }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Data Fields Preview */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '10px',
                        background: 'var(--input-bg)',
                        padding: '14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem'
                      }}>
                        {(() => {
                          const parentForm = forms.find((f: any) => f.id === sub.formId);
                          const schemaFields = parentForm?.fields || [];

                          const getLabel = (k: any) => {
                            const match = schemaFields.find((f: any) => f.id === k || f.id === `f-${k}`);
                            if (match?.label) return match.label;
                            for (const f of forms) {
                              const m = f.fields?.find((fld: any) => fld.id === k || fld.id === `f-${k}`);
                              if (m?.label) return m.label;
                            }
                            return k.replace(/^f-/, '').replace(/([A-Z])/g, ' $1').trim();
                          };

                          const dataKeys = Object.keys(sub.data || {});
                          const orderedKeys = [
                            ...schemaFields.map((f: any) => f.id).filter((id: any) => dataKeys.includes(id)),
                            ...dataKeys.filter(k => !schemaFields.some((f: any) => f.id === k))
                          ];

                          return [
                            <div key="sub-id-meta" style={{ wordBreak: 'break-word', background: 'rgba(255, 184, 0, 0.05)', padding: '8px 12px', borderRadius: '6px', border: '1px dashed rgba(255, 184, 0, 0.3)' }}>
                              <span style={{ color: 'var(--mandiri-gold)', display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px' }}>
                                🆔 ID SUBMISSION
                              </span>
                              <strong style={{ color: 'var(--mandiri-gold)', fontSize: '0.84rem', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                {sub.id}
                              </strong>
                            </div>,
                            ...orderedKeys.map((key) => {
                            const val = sub.data?.[key];
                            if (val === undefined || val === null || val === '') return null;
                            const label = getLabel(key);
                            return (
                              <div key={key} style={{ wordBreak: 'break-word', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: '3px' }}>
                                  {label}
                                </span>
                                <strong style={{ color: 'var(--text-main)', fontSize: '0.84rem', lineHeight: 1.4 }}>
                                  {typeof val === 'object' && val !== null ? (val.name || JSON.stringify(val)) : String(val)}
                                </strong>
                              </div>
                            );
                          })];
                        })()}
                        {/* Attached File Preview */}
                        {sub.files && Object.entries(sub.files as Record<string, any>).map(([key, fileObj]) => (
                          <div key={key} style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>DOKUMEN TERLAMPIR</span>
                            <a 
                              href={fileObj.dataUrl} 
                              download={fileObj.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--mandiri-gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                            >
                              <Download size={13} />
                              <span>Download / Buka {fileObj.name} ({fileObj.size})</span>
                            </a>
                          </div>
                        ))}
                      </div>

                      {/* Admin Notes Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Tambahkan catatan review pengurus (misal: Jadwal interview Kamis 14.00 WIB)..."
                          defaultValue={sub.adminNotes || ''}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (sub.adminNotes || '') && onUpdateSubmission) {
                              onUpdateSubmission({ ...sub, adminNotes: val });
                              showToast('Catatan seleksi berhasil disimpan!');
                            }
                          }}
                          style={{
                            flex: 1,
                            minWidth: '220px',
                            padding: '7px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.78rem'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalSubPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-card)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Menampilkan <strong>{(safeSubPage - 1) * SUBS_PER_PAGE + 1} - {Math.min(safeSubPage * SUBS_PER_PAGE, filteredSubmissions.length)}</strong> dari <strong>{filteredSubmissions.length}</strong> data pengisian
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={safeSubPage === 1}
                    onClick={() => setSubCurrentPage((prev: any) => Math.max(1, prev - 1))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeSubPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: safeSubPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: safeSubPage === 1 ? 0.45 : 1
                    }}
                  >
                    ← Sebelumnya
                  </button>

                  {Array.from({ length: totalSubPages }, (_, i) => i + 1).map((pg) => {
                    if (
                      pg === 1 || 
                      pg === totalSubPages || 
                      (pg >= safeSubPage - 1 && pg <= safeSubPage + 1)
                    ) {
                      const isActive = pg === safeSubPage;
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setSubCurrentPage(pg)}
                          style={{
                            minWidth: '32px',
                            height: '32px',
                            padding: '0 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                            color: isActive ? '#040914' : 'var(--text-main)',
                            border: isActive ? 'none' : '1px solid var(--border-card)',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {pg}
                        </button>
                      );
                    }
                    if (pg === safeSubPage - 2 || pg === safeSubPage + 2) {
                      return <span key={pg} style={{ color: 'var(--text-dim)', fontSize: '0.8rem', padding: '0 2px' }}>...</span>;
                    }
                    return null;
                  })}

                  <button
                    type="button"
                    disabled={safeSubPage === totalSubPages}
                    onClick={() => setSubCurrentPage((prev: any) => Math.min(totalSubPages, prev + 1))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeSubPage === totalSubPages ? 'var(--text-dim)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: safeSubPage === totalSubPages ? 'not-allowed' : 'pointer',
                      opacity: safeSubPage === totalSubPages ? 0.45 : 1
                    }}
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
