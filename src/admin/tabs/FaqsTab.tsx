import React from 'react';
import { ChevronLeft, ChevronRight, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib, formatWibTimestamp } from '../../utils/dateUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function FaqsTab() {
  const {
    activeTab,
    adminFaqPage,
    clearFieldError,
    faqAnswer,
    faqCatFilter,
    faqQuestion,
    faqSearchQuery,
    faqs,
    formErrors,
    handleCreateFaq,
    onUpdateFaq,
    renderFieldError,
    setAdminFaqPage,
    setDeleteConfirm,
    setEditingItem,
    setFaqAnswer,
    setFaqCatFilter,
    setFaqQuestion,
    setFaqSearchQuery
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'faqs' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Kelola Pusat Panduan & Tanya Jawab (FAQ) Budaya CNT
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tambahkan atau perbarui daftar pertanyaan umum seputar kegiatan olahraga/komunitas, pengajuan dana Sekben, aspirasi, hingga alur seleksi Oprec. Tersinkronisasi langsung dengan tabel <code>public.faqs</code> di Supabase.
            </p>
          </div>

          <form onSubmit={handleCreateFaq} noValidate style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div className="mobile-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Pertanyaan (Question) <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bagaimana cara mengusulkan turnamen atau komunitas olahraga baru?"
                  value={faqQuestion}
                  onChange={(e) => {
                    setFaqQuestion(e.target.value);
                    clearFieldError('faqQuestion');
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${formErrors.faqQuestion ? '#f43f5e' : 'var(--border-card)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                {renderFieldError('faqQuestion')}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Jawaban & Penjelasan Lengkap (Answer) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan penjelasan lengkap yang jelas dan membantu insan IT APD..."
                value={faqAnswer}
                onChange={(e) => {
                  setFaqAnswer(e.target.value);
                  clearFieldError('faqAnswer');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.faqAnswer ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  resize: 'vertical'
                }}
              />
              {renderFieldError('faqAnswer')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Tambah Pertanyaan FAQ</span>
              </button>
            </div>
          </form>

          {/* List of FAQs with Search, Filter & Pagination */}
          {(() => {
            const ADMIN_FAQS_PER_PAGE = 10;
            const filteredAdminFaqs = faqs.filter((f: any) => {
              const q = faqSearchQuery.trim().toLowerCase();
              const matchesSearch = !q ||
                (f.question || '').toLowerCase().includes(q) ||
                (f.answer || '').toLowerCase().includes(q);
              const matchesCat = faqCatFilter === 'all' || f.category === faqCatFilter;
              return matchesSearch && matchesCat;
            });

            const totalAdminFaqPages = Math.ceil(filteredAdminFaqs.length / ADMIN_FAQS_PER_PAGE) || 1;
            const safeAdminFaqPage = Math.min(Math.max(1, adminFaqPage), totalAdminFaqPages);
            const paginatedAdminFaqs = filteredAdminFaqs.slice(
              (safeAdminFaqPage - 1) * ADMIN_FAQS_PER_PAGE,
              safeAdminFaqPage * ADMIN_FAQS_PER_PAGE
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Daftar Pertanyaan FAQ ({filteredAdminFaqs.length} dari {faqs.length}):
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 340px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Cari pertanyaan/jawaban..."
                        value={faqSearchQuery}
                        onChange={(e) => {
                          setFaqSearchQuery(e.target.value);
                          setAdminFaqPage(1);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px 7px 30px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem'
                        }}
                      />
                    </div>

                    <select
                      value={faqCatFilter}
                      onChange={(e) => {
                        setFaqCatFilter(e.target.value);
                        setAdminFaqPage(1);
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.76rem',
                        fontWeight: 600
                      }}
                    >
                      <option value="all">Semua Kategori</option>
                      <option value="Tentang CNT">Tentang CNT</option>
                      <option value="Kegiatan & Event">Kegiatan & Event</option>
                      <option value="Operasional & Sekben">Operasional & Sekben</option>
                      <option value="Aspirasi & Usulan">Aspirasi & Usulan</option>
                      <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>

                {filteredAdminFaqs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                    Tidak ada pertanyaan FAQ yang cocok dengan pencarian / filter.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {paginatedAdminFaqs.map((f: any) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-card)',
                      borderLeft: `4px solid ${f.isPublished !== false ? 'var(--mandiri-gold)' : '#64748b'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span className="badge-cyan" style={{ fontSize: '0.66rem', padding: '2px 8px' }}>
                            {f.category || 'Umum'}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: f.isPublished !== false ? '#10b981' : '#f59e0b'
                          }}>
                            {f.isPublished !== false ? '● Ditampilkan di Publik' : '⏳ Menunggu Jawaban / Draft'}
                          </span>
                          {f.askedBy && f.askedBy !== 'Admin CNT' && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: 'rgba(255, 184, 0, 0.14)',
                              border: '1px solid rgba(255, 184, 0, 0.4)',
                              color: 'var(--mandiri-gold)'
                            }}>
                              💬 Ditanyakan oleh: {f.askedBy} {(f.createdAt || f.submittedAt) ? `• ${formatWibTimestamp(f.createdAt || f.submittedAt).exact || f.createdAt || f.submittedAt}` : ''}
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                          {f.question}
                        </h4>
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                          {f.answer}
                        </p>
                        {f.updatedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                            {formatLastUpdatedWib(f.updatedAt)}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => onUpdateFaq && onUpdateFaq({ ...f, isPublished: f.isPublished === false ? true : false })}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-muted)',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {f.isPublished === false ? 'Tampilkan' : 'Sembunyikan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ type: 'faq', item: { ...f } })}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(14, 165, 233, 0.12)',
                            border: '1px solid #0284c7',
                            color: '#0284c7',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ type: 'faq', id: f.id, name: f.question })}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(244, 63, 94, 0.12)',
                            border: '1px solid #f43f5e',
                            color: '#f43f5e',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                )}

                {totalAdminFaqPages > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    marginTop: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Menampilkan <strong>{(safeAdminFaqPage - 1) * ADMIN_FAQS_PER_PAGE + 1} - {Math.min(safeAdminFaqPage * ADMIN_FAQS_PER_PAGE, filteredAdminFaqs.length)}</strong> dari <strong>{filteredAdminFaqs.length}</strong> pertanyaan FAQ
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={safeAdminFaqPage === 1}
                        onClick={() => setAdminFaqPage((p: any) => Math.max(1, p - 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminFaqPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminFaqPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: safeAdminFaqPage === 1 ? 0.45 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      {Array.from({ length: totalAdminFaqPages }, (_, i) => i + 1).map((pg) => {
                        const isActive = pg === safeAdminFaqPage;
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setAdminFaqPage(pg)}
                            style={{
                              minWidth: '28px',
                              height: '28px',
                              padding: '0 6px',
                              borderRadius: 'var(--radius-sm)',
                              background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                              color: isActive ? '#040914' : 'var(--text-main)',
                              border: isActive ? 'none' : '1px solid var(--border-card)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {pg}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        disabled={safeAdminFaqPage === totalAdminFaqPages}
                        onClick={() => setAdminFaqPage((p: any) => Math.min(totalAdminFaqPages, p + 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminFaqPage === totalAdminFaqPages ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminFaqPage === totalAdminFaqPages ? 'not-allowed' : 'pointer',
                          opacity: safeAdminFaqPage === totalAdminFaqPages ? 0.45 : 1
                        }}
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
