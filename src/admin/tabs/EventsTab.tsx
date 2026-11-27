import React from 'react';
import { Calendar, CalendarDays, ChevronLeft, ChevronRight, Download, Edit2, Grid, Plus, Search, Trash2, X } from 'lucide-react';
import EventCalendarView from '../../components/EventCalendarView';
import { formatLastUpdatedWib, formatWibEventRange, formatWibTimestamp, toDatetimeLocalValue } from '../../utils/dateUtils';
import { getUnifiedEventAttendees } from '../../utils/quotaUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function EventsTab() {
  const {
    activeTab,
    activeTenure,
    adminEventPage,
    adminEventViewMode,
    adminRsvpPage,
    clearFieldError,
    departments,
    divisions,
    eventCatFilter,
    eventCategory,
    eventDesc,
    eventDivFilter,
    eventDivId,
    eventEndDate,
    eventIsLimited,
    eventIsPublic,
    eventKpi,
    eventLocation,
    eventMaxQuota,
    eventPublicFilter,
    eventRab,
    eventRsvps,
    eventSearchQuery,
    eventStartDate,
    eventStatus,
    eventStatusFilter,
    eventTenureFilter,
    eventTenureId,
    eventTitle,
    events,
    formErrors,
    forms,
    handleCreateEvent,
    handleDeleteEventClick,
    isDark,
    onDeleteEvent,
    onDeleteEventRsvp,
    onUpdateEvent,
    registrationCounts,
    renderFieldError,
    rsvpEventFilter,
    rsvpModeFilter,
    rsvpSearchQuery,
    setAdminEventPage,
    setAdminEventViewMode,
    setAdminRsvpPage,
    setDeleteConfirm,
    setEditingItem,
    setEventCatFilter,
    setEventCategory,
    setEventDesc,
    setEventDivFilter,
    setEventDivId,
    setEventEndDate,
    setEventIsLimited,
    setEventIsPublic,
    setEventKpi,
    setEventLocation,
    setEventMaxQuota,
    setEventPublicFilter,
    setEventRab,
    setEventSearchQuery,
    setEventStartDate,
    setEventStatus,
    setEventStatusFilter,
    setEventTenureFilter,
    setEventTenureId,
    setEventTitle,
    setFormErrors,
    setRsvpEventFilter,
    setRsvpModeFilter,
    setRsvpSearchQuery,
    showToast,
    tenures,
    theme
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'events' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Tambah Event Baru
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Setiap agenda dilengkapi <strong>Tanggal Mulai</strong> dan <strong>Tanggal Berakhir</strong> agar tersorot rapi dalam Kalender Budaya bulanan dan menampilkan popup interaktif saat di-hover.
            </p>
          </div>

          <form onSubmit={handleCreateEvent} noValidate className="admin-form-two-col" style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Event <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: APD E-Sports Championship"
                value={eventTitle}
                onChange={(e) => {
                  setEventTitle(e.target.value);
                  clearFieldError('eventTitle');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventTitle ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('eventTitle')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Periode Kepengurusan *
              </label>
              <select
                value={eventTenureId || activeTenure?.id || ''}
                onChange={(e) => {
                  setEventTenureId(e.target.value);
                  setEventDivId('');
                  clearFieldError('eventDivId');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              >
                {tenures.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                ))}
              </select>
            </div>

            {(() => {
              const availableDivsForEvent = divisions.filter((d: any) => d.tenureId === (eventTenureId || activeTenure?.id));
              return (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Divisi Penyelenggara <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={eventDivId}
                    onChange={(e) => {
                      setEventDivId(e.target.value);
                      clearFieldError('eventDivId');
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: `1.5px solid ${formErrors.eventDivId ? '#f43f5e' : 'var(--border-card)'}`,
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {availableDivsForEvent.length === 0 ? (
                      <option value="" disabled>-- Divisi masih kosong di periode ini. Silakan buat divisi baru pada tahun kepengurusan yang dipilih --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Divisi Penyelenggara * --</option>
                        {availableDivsForEvent.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {availableDivsForEvent.length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                      ⚠️ <strong>Divisi masih kosong</strong> pada periode kepengurusan ini. Silakan buat divisi baru terlebih dahulu di tab <strong>Divisi</strong>.
                    </div>
                  )}
                  {renderFieldError('eventDivId')}
                </div>
              );
            })()}

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                📅 Tanggal & Jam Mulai (WIB) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(eventStartDate)}
                max={eventEndDate ? toDatetimeLocalValue(eventEndDate) : undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  setEventStartDate(val);
                  const normStart = toDatetimeLocalValue(val);
                  const normEnd = toDatetimeLocalValue(eventEndDate);
                  if (normStart && normEnd && normStart > normEnd) {
                    setFormErrors((prev: any) => ({
                      ...prev,
                      eventStartDate: 'Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir'
                    }));
                  } else {
                    clearFieldError('eventStartDate');
                    clearFieldError('eventEndDate');
                  }
                }}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventStartDate ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('eventStartDate')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                📅 Tanggal & Jam Berakhir (WIB) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(eventEndDate)}
                min={eventStartDate ? toDatetimeLocalValue(eventStartDate) : undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  setEventEndDate(val);
                  const normStart = toDatetimeLocalValue(eventStartDate);
                  const normEnd = toDatetimeLocalValue(val);
                  if (normStart && normEnd && normEnd < normStart) {
                    setFormErrors((prev: any) => ({
                      ...prev,
                      eventEndDate: 'Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai'
                    }));
                  } else {
                    clearFieldError('eventEndDate');
                    clearFieldError('eventStartDate');
                  }
                }}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventEndDate ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('eventEndDate')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Lokasi / Venue
              </label>
              <input
                type="text"
                placeholder="Contoh: Plaza Mandiri Lt. 3 / Online Server"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Peserta
              </label>
              <input
                type="text"
                placeholder="Contoh: 150+ Peserta Officer IT APD"
                value={eventKpi}
                onChange={(e) => setEventKpi(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                💰 Estimasi Total RAB (Rp) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="number"
                placeholder="Contoh: 15000000 (tanpa titik)"
                value={eventRab}
                onChange={(e) => {
                  setEventRab(e.target.value);
                  clearFieldError('eventRab');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventRab ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('eventRab')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                🏷️ Kategori Kegiatan <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                value={eventCategory}
                onChange={(e) => {
                  setEventCategory(e.target.value);
                  clearFieldError('eventCategory');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventCategory ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="">-- Pilih Kategori Kegiatan * --</option>
                <option value="Program Budaya">Program Budaya</option>
                <option value="Workshop & Sharing Session">Workshop & Sharing Session</option>
                <option value="Social & Engagement">Social & Engagement</option>
                <option value="Olahraga & Well-being">Olahraga & Well-being</option>
                <option value="Kompetisi & Inovasi">Kompetisi & Inovasi</option>
                <option value="Apresiasi & Rekognisi">Apresiasi & Rekognisi</option>
                <option value="Townhall & Perayaan">Townhall & Perayaan</option>
              </select>
              {renderFieldError('eventCategory')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Status Pelaksanaan
              </label>
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Upcoming">Upcoming (Akan Datang)</option>
                <option value="Ongoing">Ongoing (Sedang Berjalan)</option>
                <option value="Completed">Completed (Selesai)</option>
              </select>
            </div>

            <div style={{
              gridColumn: 'span 2',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 184, 0, 0.06)',
              border: '1px solid rgba(255, 184, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={eventIsLimited}
                  onChange={(e) => setEventIsLimited(e.target.checked)}
                  style={{ accentColor: 'var(--mandiri-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  🔒 Batasi Kuota Pendaftaran RSVP untuk Event Ini?
                </span>
              </label>

              {eventIsLimited && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Batas Maksimal Kuota Peserta (Orang) <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 100"
                    value={eventMaxQuota}
                    onChange={(e) => {
                      setEventMaxQuota(e.target.value);
                      clearFieldError('eventMaxQuota');
                    }}
                    style={{
                      maxWidth: '220px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: `1.5px solid ${formErrors.eventMaxQuota ? '#f43f5e' : 'var(--border-card)'}`,
                      color: 'var(--text-main)',
                      fontSize: '0.84rem'
                    }}
                  />
                  {renderFieldError('eventMaxQuota')}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    RSVP akan ditutup otomatis ketika jumlah peserta yang mendaftar telah mencapai angka ini.
                  </span>
                </div>
              )}
            </div>

            <div style={{
              gridColumn: 'span 2',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🌐 Status Publikasi di Web Publik</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Default <strong>Draft / Privat</strong> agar tidak langsung muncul di web publik sebelum siap.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEventIsPublic(!eventIsPublic)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: 'none',
                  background: eventIsPublic ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.18)',
                  color: eventIsPublic ? '#10b981' : '#f43f5e',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {eventIsPublic ? '● Publik di Web' : '○ Draft / Privat (Hanya Admin)'}
              </button>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Deskripsi Event <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan tujuan dan gambaran pelaksanaan event..."
                value={eventDesc}
                onChange={(e) => {
                  setEventDesc(e.target.value);
                  clearFieldError('eventDesc');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventDesc ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  resize: 'vertical'
                }}
              />
              {renderFieldError('eventDesc')}
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Simpan Event Baru</span>
              </button>
            </div>
          </form>

          {/* List Event */}
          <div>
            {(() => {
              const ADMIN_EVENTS_PER_PAGE = 8;
              const filteredAdminEvents = events.filter((evt: any) => {
                const q = eventSearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (evt.title || '').toLowerCase().includes(q) ||
                  (evt.location || '').toLowerCase().includes(q) ||
                  (evt.description || '').toLowerCase().includes(q) ||
                  (evt.category || evt.badge || '').toLowerCase().includes(q);
                const evtTenure = evt.tenureId || divisions.find((d: any) => d.id === evt.divisionId)?.tenureId;
                const matchesTenure = eventTenureFilter === 'all' || evtTenure === eventTenureFilter;
                const matchesCat = eventCatFilter === 'all' || (evt.category || evt.badge) === eventCatFilter;
                const matchesDiv = eventDivFilter === 'all' || evt.divisionId === eventDivFilter;
                const matchesStat = eventStatusFilter === 'all' || evt.status === eventStatusFilter;
                const matchesPublic = eventPublicFilter === 'all' ||
                  (eventPublicFilter === 'public' && evt.isPublic === true) ||
                  (eventPublicFilter === 'draft' && !evt.isPublic);
                return matchesSearch && matchesTenure && matchesCat && matchesDiv && matchesStat && matchesPublic;
              });

              const totalAdminEventPages = Math.ceil(filteredAdminEvents.length / ADMIN_EVENTS_PER_PAGE) || 1;
              const safeAdminEventPage = Math.min(Math.max(1, adminEventPage), totalAdminEventPages);
              const paginatedAdminEvents = filteredAdminEvents.slice(
                (safeAdminEventPage - 1) * ADMIN_EVENTS_PER_PAGE,
                safeAdminEventPage * ADMIN_EVENTS_PER_PAGE
              );

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        Daftar Event ({filteredAdminEvents.length} dari {events.length}):
                      </h4>
                      {/* View Mode Switcher: List Event vs Kalender Tahunan */}
                      <div style={{
                        display: 'inline-flex',
                        background: 'var(--input-bg)',
                        padding: '3px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-card)'
                      }}>
                        <button
                          type="button"
                          onClick={() => setAdminEventViewMode('list')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            border: 'none',
                            background: adminEventViewMode === 'list' ? 'var(--mandiri-blue)' : 'transparent',
                            color: adminEventViewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Grid size={13} />
                          <span>List Event</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminEventViewMode('calendar')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            border: 'none',
                            background: adminEventViewMode === 'calendar' ? 'var(--mandiri-blue)' : 'transparent',
                            color: adminEventViewMode === 'calendar' ? '#ffffff' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <CalendarDays size={13} />
                          <span>Kalender Tahunan</span>
                        </button>
                      </div>
                    </div>

                    {/* Search & Filter Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                          type="text"
                          placeholder="Cari nama, lokasi..."
                          value={eventSearchQuery}
                          onChange={(e) => {
                            setEventSearchQuery(e.target.value);
                            setAdminEventPage(1);
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
                        value={eventPublicFilter}
                        onChange={(e) => {
                          setEventPublicFilter(e.target.value);
                          setAdminEventPage(1);
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
                        <option value="all">Semua Publikasi</option>
                        <option value="public">● Publik ({events.filter((e: any) => e.isPublic === true).length})</option>
                        <option value="draft">○ Draft / Privat ({events.filter((e: any) => !e.isPublic).length})</option>
                      </select>

                      <select
                        value={eventTenureFilter}
                        onChange={(e) => {
                          setEventTenureFilter(e.target.value);
                          setEventDivFilter('all');
                          setAdminEventPage(1);
                          setAdminRsvpPage(1);
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
                        <option value="all">Semua Periode ({events.length})</option>
                        {tenures.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            Periode {t.code || t.title}
                          </option>
                        ))}
                      </select>

                      <select
                        value={eventCatFilter}
                        onChange={(e) => {
                          setEventCatFilter(e.target.value);
                          setAdminEventPage(1);
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
                        <option value="Program Budaya">Program Budaya</option>
                        <option value="Workshop & Sharing Session">Workshop & Sharing Session</option>
                        <option value="Social & Engagement">Social & Engagement</option>
                        <option value="Olahraga & Well-being">Olahraga & Well-being</option>
                        <option value="Kompetisi & Inovasi">Kompetisi & Inovasi</option>
                        <option value="Apresiasi & Rekognisi">Apresiasi & Rekognisi</option>
                        <option value="Townhall & Perayaan">Townhall & Perayaan</option>
                      </select>

                      <select
                        value={eventDivFilter}
                        onChange={(e) => {
                          setEventDivFilter(e.target.value);
                          setAdminEventPage(1);
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
                        <option value="all">Semua Divisi</option>
                        {(eventTenureFilter === 'all'
                          ? divisions
                          : divisions.filter((d: any) => d.tenureId === eventTenureFilter)
                        ).map((d: any) => {
                          const tObj = tenures.find((t: any) => t.id === d.tenureId);
                          const yearLabel = tObj ? ` (${tObj.code || tObj.title})` : '';
                          return (
                            <option key={d.id} value={d.id}>{d.name}{yearLabel}</option>
                          );
                        })}
                      </select>

                      <select
                        value={eventStatusFilter}
                        onChange={(e) => {
                          setEventStatusFilter(e.target.value);
                          setAdminEventPage(1);
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
                        <option value="all">Semua Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {adminEventViewMode === 'calendar' ? (
                    <EventCalendarView
                      events={filteredAdminEvents}
                      divisions={divisions}
                      forms={forms}
                      registrationCounts={registrationCounts}
                      theme={theme}
                      activeTenure={eventTenureFilter !== 'all' ? tenures.find((t: any) => t.id === eventTenureFilter) : activeTenure}
                      onSelectEvent={(evt: any) => setEditingItem({ type: 'event', item: { ...evt } })}
                      onEditEvent={(evt: any) => setEditingItem({ type: 'event', item: { ...evt } })}
                      isAdmin={true}
                    />
                  ) : filteredAdminEvents.length === 0 ? (
                    <div style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      color: 'var(--text-dim)',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--border-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Calendar size={32} color="var(--text-dim)" />
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Tidak ada event yang sesuai dengan pencarian / filter.
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Coba ubah kata kunci pencarian atau reset filter.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                    {paginatedAdminEvents.map((evt: any) => {
                      const divObj = divisions.find((d: any) => d.id === evt.divisionId);
                      const divColor = divObj?.color || 'var(--mandiri-gold)';
                      const attendeeInfo = getUnifiedEventAttendees(evt, forms, registrationCounts);
                      const isDraft = evt.isPublic !== true;

                      return (
                        <div
                          key={evt.id}
                          style={{
                            background: isDraft
                              ? (isDark
                                  ? `repeating-linear-gradient(135deg, ${divColor}08, ${divColor}08 8px, ${divColor}14 8px, ${divColor}14 16px)`
                                  : `repeating-linear-gradient(135deg, ${divColor}12, ${divColor}12 8px, ${divColor}22 8px, ${divColor}22 16px)`)
                              : 'rgba(255,255,255,0.02)',
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            border: isDraft ? `2px dashed ${divColor}` : '1px solid var(--border-card)',
                            borderLeft: isDraft ? `6px dashed ${divColor}` : `4px solid ${divColor}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px',
                            boxShadow: isDraft ? `0 2px 10px ${divColor}18` : 'none'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ fontSize: '0.7rem', color: divObj?.color || 'var(--mandiri-gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                                {evt.divisionName || divObj?.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onUpdateEvent) {
                                      const updated = { ...evt, isPublic: !evt.isPublic };
                                      onUpdateEvent(updated);
                                      showToast(`Status "${evt.title}" diubah menjadi ${!evt.isPublic ? 'Publik' : 'Draft / Privat'}`);
                                    }
                                  }}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.64rem',
                                    fontWeight: 800,
                                    border: 'none',
                                    background: evt.isPublic ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)',
                                    color: evt.isPublic ? '#10b981' : '#f43f5e',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="Klik untuk mengubah status publikasi event"
                                >
                                  {evt.isPublic ? '● Publik' : '○ Draft'}
                                </button>
                                {(evt.category || evt.badge) && (
                                  <span className="badge-cyan" style={{ fontSize: '0.64rem', padding: '2px 8px' }}>
                                    {evt.category || evt.badge}
                                  </span>
                                )}
                                <span className="badge-gold" style={{ fontSize: '0.66rem' }}>
                                  {evt.status}
                                </span>
                              </div>
                            </div>
                            <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '4px' }}>
                              {evt.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                              📅 {formatWibEventRange(evt.startDate, evt.endDate, evt.date)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                              <span>📍 {evt.location}</span>
                              <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>
                                💰 Rp {Number(evt.totalRab || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{
                                color: (evt.isLimited && attendeeInfo.isFull)
                                  ? (isDark ? '#f43f5e' : '#be123c')
                                  : (isDark ? 'var(--neon-cyan)' : '#0284c7'),
                                fontWeight: 700
                              }}>
                                👥 {attendeeInfo.isConnected ? 'Peserta Terdaftar' : 'RSVP'}: {attendeeInfo.count}{evt.isLimited && Number(evt.maxQuota) > 0 ? ` / ${evt.maxQuota} ${attendeeInfo.isFull ? '(Penuh)' : '(Terbatas)'}` : ' (Bebas)'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setRsvpEventFilter(evt.id);
                                  setAdminRsvpPage(1);
                                  showToast(`Filter RSVP disetel ke "${evt.title}"`);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--mandiri-gold)',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                Filter RSVP ➔
                              </button>
                            </div>
                            {evt.updatedAt && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                {formatLastUpdatedWib(evt.updatedAt)}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingItem({ type: 'event', item: { ...evt } })}
                              title="Edit Event"
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid var(--mandiri-blue)',
                                color: 'var(--neon-cyan)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>

                            {onDeleteEvent && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEventClick(evt)}
                                title="Hapus Event"
                                style={{
                                  padding: '6px 12px',
                                  background: 'rgba(244, 63, 94, 0.1)',
                                  border: '1px solid #f43f5e',
                                  color: '#f43f5e',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalAdminEventPages > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Menampilkan <strong>{(safeAdminEventPage - 1) * ADMIN_EVENTS_PER_PAGE + 1} - {Math.min(safeAdminEventPage * ADMIN_EVENTS_PER_PAGE, filteredAdminEvents.length)}</strong> dari <strong>{filteredAdminEvents.length}</strong> event
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={safeAdminEventPage === 1}
                          onClick={() => setAdminEventPage((p: any) => Math.max(1, p - 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminEventPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminEventPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: safeAdminEventPage === 1 ? 0.45 : 1
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        {Array.from({ length: totalAdminEventPages }, (_, i) => i + 1).map((pg) => {
                          const isActive = pg === safeAdminEventPage;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setAdminEventPage(pg)}
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
                          disabled={safeAdminEventPage === totalAdminEventPages}
                          onClick={() => setAdminEventPage((p: any) => Math.min(totalAdminEventPages, p + 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminEventPage === totalAdminEventPages ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminEventPage === totalAdminEventPages ? 'not-allowed' : 'pointer',
                            opacity: safeAdminEventPage === totalAdminEventPages ? 0.45 : 1
                          }}
                        >
                          <span>Selanjutnya</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                )}
                </div>
              );
            })()}
          </div>

          {/* Daftar Hadir & Konfirmasi RSVP Kegiatan (public.event_rsvps) */}
          {(() => {
            const selectedRsvpTenureObj = eventTenureFilter !== 'all' ? tenures.find((t: any) => t.id === eventTenureFilter) : null;
            const rsvpAvailableEvents = events.filter((e: any) => {
              if (eventTenureFilter === 'all') return true;
              const evtTenure = e.tenureId || divisions.find((d: any) => d.id === e.divisionId)?.tenureId || '';
              return evtTenure === eventTenureFilter;
            });

            const filteredAdminRsvps = eventRsvps.filter((rsvp: any) => {
              const evt = events.find((e: any) => e.id === rsvp.eventId);
              if (eventTenureFilter !== 'all') {
                if (!evt) return false;
                const evtTenure = evt.tenureId || divisions.find((d: any) => d.id === evt.divisionId)?.tenureId || '';
                if (evtTenure !== eventTenureFilter) return false;
              }
              if (rsvpEventFilter !== 'all' && rsvp.eventId !== rsvpEventFilter) {
                return false;
              }
              if (rsvpModeFilter !== 'all') {
                const mode = String(rsvp.attendanceMode || '').toLowerCase();
                if (rsvpModeFilter === 'onsite' && !mode.includes('onsite')) return false;
                if (rsvpModeFilter === 'online' && !mode.includes('online')) return false;
              }
              if (rsvpSearchQuery.trim()) {
                const q = rsvpSearchQuery.toLowerCase();
                const name = String(rsvp.attendeeName || '').toLowerCase();
                const notes = String(rsvp.notes || '').toLowerCase();
                const eventTitle = String(evt?.title || rsvp.eventTitle || '').toLowerCase();
                const deptObj = departments.find((d: any) => d.id === rsvp.departmentId || d.id === rsvp.department || (d.name && d.name === rsvp.department));
                const deptName = String(deptObj ? deptObj.name : (rsvp.department || rsvp.squadUnit || '')).toLowerCase();
                if (!name.includes(q) && !notes.includes(q) && !eventTitle.includes(q) && !deptName.includes(q)) {
                  return false;
                }
              }
              return true;
            });

            const ADMIN_RSVPS_PER_PAGE = 10;
            const totalAdminRsvpPages = Math.ceil(filteredAdminRsvps.length / ADMIN_RSVPS_PER_PAGE) || 1;
            const safeAdminRsvpPage = Math.min(Math.max(1, adminRsvpPage), totalAdminRsvpPages);
            const paginatedAdminRsvps = filteredAdminRsvps.slice(
              (safeAdminRsvpPage - 1) * ADMIN_RSVPS_PER_PAGE,
              safeAdminRsvpPage * ADMIN_RSVPS_PER_PAGE
            );

            return (
              <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>📋 Daftar Hadir & Konfirmasi RSVP Kegiatan ({filteredAdminRsvps.length}{eventTenureFilter !== 'all' || rsvpEventFilter !== 'all' || rsvpSearchQuery || rsvpModeFilter !== 'all' ? ` dari ${eventRsvps.length}` : ''})</span>
                      {selectedRsvpTenureObj && (
                        <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                          Periode {selectedRsvpTenureObj.code || selectedRsvpTenureObj.title}
                        </span>
                      )}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Data kehadiran pegawai yang mengisi form RSVP Cepat pada kartu Event{selectedRsvpTenureObj ? ` (Periode ${selectedRsvpTenureObj.code || selectedRsvpTenureObj.title})` : ''}.
                    </p>
                  </div>

                  {filteredAdminRsvps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                        const header = ['ID RSVP', 'ID Event', 'Nama Kegiatan', 'Nama Peserta', 'Departemen', 'Mode Kehadiran', 'Catatan', 'Waktu Konfirmasi'].map(escapeCsv).join(',');
                        const rows = filteredAdminRsvps.map((r: any) => {
                          const deptObj = departments.find((d: any) => d.id === r.departmentId || d.id === r.department || (d.name && d.name === r.department));
                          const deptName = deptObj ? deptObj.name : (r.department || r.squadUnit || '-');
                          return [
                            r.id,
                            r.eventId,
                            events.find((e: any) => e.id === r.eventId)?.title || r.eventTitle || 'Kegiatan',
                            r.attendeeName,
                            deptName,
                            r.attendanceMode,
                            r.notes || '',
                            formatWibTimestamp(r.createdAt || r.submittedAt).exact || r.submittedAt || r.createdAt || ''
                          ].map(escapeCsv).join(',');
                        });
                        const csvString = '\uFEFF' + [header, ...rows].join('\n');
                        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `daftar_hadir_rsvp_cnt_it_apd_${Date.now()}.csv`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        showToast(`Berhasil mengunduh ${filteredAdminRsvps.length} data RSVP ke CSV!`);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={14} />
                      <span>Export CSV Daftar Hadir RSVP ({filteredAdminRsvps.length})</span>
                    </button>
                  )}
                </div>

                {/* RSVP Search & Dynamic Event & Attendance Mode Filters */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)'
                }}>
                  {/* Search Query */}
                  <div style={{ flex: '1 1 200px', minWidth: '180px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Cari nama peserta, catatan, dept..."
                      value={rsvpSearchQuery}
                      onChange={(e) => {
                        setRsvpSearchQuery(e.target.value);
                        setAdminRsvpPage(1);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        paddingLeft: '32px',
                        paddingRight: rsvpSearchQuery ? '28px' : '12px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                    <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    {rsvpSearchQuery && (
                      <button
                        type="button"
                        onClick={() => { setRsvpSearchQuery(''); setAdminRsvpPage(1); }}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filter by Event (Dinamis sesuai event periode yang dipilih) */}
                  <select
                    value={rsvpEventFilter}
                    onChange={(e) => {
                      setRsvpEventFilter(e.target.value);
                      setAdminRsvpPage(1);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: rsvpEventFilter !== 'all' ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                      color: rsvpEventFilter !== 'all' ? 'var(--mandiri-gold)' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: rsvpEventFilter !== 'all' ? 700 : 500,
                      cursor: 'pointer',
                      maxWidth: '280px'
                    }}
                  >
                    <option value="all">🎯 Semua Kegiatan ({rsvpAvailableEvents.length} Event)</option>
                    {rsvpAvailableEvents.map((ev: any) => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>

                  {/* Filter by Mode Kehadiran */}
                  <select
                    value={rsvpModeFilter}
                    onChange={(e) => {
                      setRsvpModeFilter(e.target.value);
                      setAdminRsvpPage(1);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: rsvpModeFilter !== 'all' ? '1.5px solid var(--neon-cyan)' : '1px solid var(--border-card)',
                      color: rsvpModeFilter !== 'all' ? 'var(--neon-cyan)' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: rsvpModeFilter !== 'all' ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">👥 Semua Mode Kehadiran</option>
                    <option value="onsite">📍 Hadir Onsite</option>
                    <option value="online">💻 Hadir Online</option>
                  </select>

                  {/* Reset Filter Button */}
                  {(rsvpSearchQuery || rsvpEventFilter !== 'all' || rsvpModeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setRsvpSearchQuery('');
                        setRsvpEventFilter('all');
                        setRsvpModeFilter('all');
                        setAdminRsvpPage(1);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                {filteredAdminRsvps.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                    {eventTenureFilter !== 'all'
                      ? `Belum ada konfirmasi kehadiran RSVP pada event di periode ${selectedRsvpTenureObj?.code || selectedRsvpTenureObj?.title || 'terpilih'}.`
                      : 'Belum ada konfirmasi kehadiran RSVP pada event.'}
                  </div>
                ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {paginatedAdminRsvps.map((rsvp: any) => {
                      const deptObj = departments.find((d: any) => d.id === rsvp.departmentId || d.id === rsvp.department || (d.name && d.name === rsvp.department));
                      const deptName = deptObj ? deptObj.name : (rsvp.department || rsvp.squadUnit || '-');

                      return (
                        <div
                          key={rsvp.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px'
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {events.find((e: any) => e.id === rsvp.eventId)?.title || rsvp.eventTitle || 'Kegiatan'}
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {rsvp.attendeeName} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>• {deptName}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {rsvp.attendanceMode} {rsvp.notes ? `• "${rsvp.notes}"` : ''} • {formatWibTimestamp(rsvp.submittedAt || rsvp.createdAt).exact || rsvp.submittedAt}
                            </div>
                          </div>

                          {onDeleteEventRsvp && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({
                                type: 'event_rsvp',
                                id: rsvp.id,
                                name: `Data RSVP "${rsvp.attendeeName}" (${deptName})`
                              })}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                background: 'rgba(244, 63, 94, 0.12)',
                                border: '1px solid rgba(244, 63, 94, 0.35)',
                              color: '#f43f5e',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title="Hapus konfirmasi kehadiran RSVP ini"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {totalAdminRsvpPages > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Menampilkan <strong>{(safeAdminRsvpPage - 1) * ADMIN_RSVPS_PER_PAGE + 1} - {Math.min(safeAdminRsvpPage * ADMIN_RSVPS_PER_PAGE, filteredAdminRsvps.length)}</strong> dari <strong>{filteredAdminRsvps.length}</strong> data RSVP
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={safeAdminRsvpPage === 1}
                          onClick={() => setAdminRsvpPage((p: any) => Math.max(1, p - 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminRsvpPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminRsvpPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: safeAdminRsvpPage === 1 ? 0.45 : 1
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        {Array.from({ length: totalAdminRsvpPages }, (_, i) => i + 1).map((pg) => {
                          const isActive = pg === safeAdminRsvpPage;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setAdminRsvpPage(pg)}
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
                          disabled={safeAdminRsvpPage === totalAdminRsvpPages}
                          onClick={() => setAdminRsvpPage((p: any) => Math.min(totalAdminRsvpPages, p + 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminRsvpPage === totalAdminRsvpPages ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminRsvpPage === totalAdminRsvpPages ? 'not-allowed' : 'pointer',
                            opacity: safeAdminRsvpPage === totalAdminRsvpPages ? 0.45 : 1
                          }}
                        >
                          <span>Selanjutnya</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
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
