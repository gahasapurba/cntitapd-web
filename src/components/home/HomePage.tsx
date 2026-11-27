import { ArrowRight, CalendarDays, ClipboardList, Lightbulb, MapPin, Users } from 'lucide-react';
import { getDeadlineStatus, isEventPassed, formatDeadlineWib } from '../../utils/dateUtils';
import { getMemberLevel, getDivisionLead } from '../../utils/memberQuotaUtils';
import { AKHLAK_VALUES } from '../../utils/akhlak';
import { AkhlakBand, Button, Card, Chip, Container, Eyebrow, SectionHeader, akhlakTone, cn } from '../../ui';

type AppItem = Record<string, any>;

interface HomePageProps {
  activeTenure: AppItem | null;
  divisions: AppItem[];
  events: AppItem[];
  members: AppItem[];
  forms: AppItem[];
  kudosList: AppItem[];
  aspirasiList?: AppItem[];
  tenureRoles: AppItem[];
  pageVisibility: Record<string, unknown>;
  setCurrentTab: (tab: string, formId?: string | null, eventId?: string | null) => void;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const DIVISION_ACCENTS = ['amanah', 'loyal', 'adaptif', 'harmonis', 'kompeten', 'kolaboratif'] as const;
const ACCENT_TEXT: Record<string, string> = {
  amanah: 'text-amanah-ink', loyal: 'text-loyal-ink', adaptif: 'text-adaptif-ink',
  harmonis: 'text-harmonis-ink', kompeten: 'text-kompeten-ink', kolaboratif: 'text-kolaboratif-ink'
};
const ACCENT_BORDER: Record<string, string> = {
  amanah: 'border-t-amanah', loyal: 'border-t-loyal', adaptif: 'border-t-adaptif',
  harmonis: 'border-t-harmonis', kompeten: 'border-t-kompeten', kolaboratif: 'border-t-kolaboratif'
};

/** "COMMITTED TO CULTIVATE" -> "Committed to cultivate" (all-caps copy reads as shouting). */
function sentenceCase(text: string, capitalize: boolean): string {
  const t = String(text || '').trim();
  if (!t || t !== t.toUpperCase()) return t;
  const lower = t.toLowerCase();
  return capitalize ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
}

function eventDay(startDate: string): { day: string; month: string } | null {
  const m = String(startDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { day: String(Number(m[3])), month: MONTHS[Number(m[2]) - 1] || '' };
}

function eventTime(evt: AppItem): string {
  const s = String(evt.startDate || '').match(/T(\d{2}:\d{2})/)?.[1];
  const e = String(evt.endDate || '').match(/T(\d{2}:\d{2})/)?.[1];
  if (!s) return '';
  return `${s.replace(':', '.')}${e ? `–${e.replace(':', '.')}` : ''} WIB`;
}

function initials(name: string): string {
  return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Avatar({ person }: { person: AppItem }) {
  return person.image ? (
    <img src={person.image} alt="" className="size-14 shrink-0 rounded-2xl object-cover" loading="lazy" />
  ) : (
    <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-pill text-[1rem] font-extrabold text-pill-ink">
      {initials(person.name)}
    </span>
  );
}

export default function HomePage({
  activeTenure,
  divisions,
  events,
  members,
  forms,
  kudosList,
  aspirasiList = [],
  tenureRoles,
  pageVisibility,
  setCurrentTab
}: HomePageProps) {
  const visible = (id: string) => {
    if (id === 'event') return pageVisibility.event !== false && pageVisibility.program !== false;
    if (id === 'form') return pageVisibility.form !== false && pageVisibility.oprec !== false;
    return pageVisibility[id] !== false;
  };
  const go = (tab: string, formId: string | null = null, eventId: string | null = null) => {
    if (visible(tab)) setCurrentTab(tab, formId, eventId);
  };

  const tenureId = activeTenure?.id;
  const activeDivisions = divisions.filter((d) => d.tenureId === tenureId);
  const activeMembers = members.filter((m) => m.tenureId === tenureId);
  const activeEvents = events.filter((e) => e.tenureId === tenureId && e.isPublic === true);
  const upcomingEvents = activeEvents
    .filter((e) => e.status !== 'Completed' && !isEventPassed(e.startDate, e.endDate))
    .sort((a, b) => String(a.startDate || '9999').localeCompare(String(b.startDate || '9999')));
  const lastEvent = [...activeEvents].sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')))[0];
  const featuredEvent = upcomingEvents[0] || lastEvent || null;
  const openForms = visible('form')
    ? forms.filter((f) => f.isOpen !== false && (!tenureId || !f.tenureId || f.tenureId === tenureId) && !getDeadlineStatus(f.deadline).isExpired)
    : [];
  const leaders = activeMembers
    .filter((m) => getMemberLevel(m, tenureRoles) <= 2)
    .sort((a, b) => getMemberLevel(a, tenureRoles) - getMemberLevel(b, tenureRoles));
  const latestKudos = kudosList[0] || null;
  const latestAspirasi = aspirasiList.find((a) => a.isPublic !== false) || null;
  const misi: string[] = Array.isArray(activeTenure?.misi) ? activeTenure.misi : [];

  const headline = sentenceCase(activeTenure?.heroHeadline || 'Committed to cultivate', true);
  const highlight = sentenceCase(activeTenure?.heroHighlight || 'excellence & synergy', false);
  const stats = [
    { value: activeMembers.length, label: 'Pengurus & anggota' },
    { value: activeDivisions.length, label: 'Divisi' },
    { value: upcomingEvents.length, label: upcomingEvents.length === 1 ? 'Acara mendatang' : 'Acara mendatang' },
    { value: kudosList.length, label: 'Kudos terkirim' }
  ];

  return (
    <div className="flex flex-col gap-16 pb-20 pt-6 sm:pt-8">
      {/* Hero */}
      <Container>
        <section aria-labelledby="home-title" className="overflow-hidden rounded-[28px] bg-hero text-hero-ink">
          <div className="grid items-end gap-9 px-6 pb-10 pt-10 sm:px-12 sm:pt-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              <p className="m-0 text-[0.8rem] font-bold uppercase tracking-[0.08em] text-gold">
                Culture Network Team{activeTenure?.code ? ` · Kepengurusan ${activeTenure.code}` : ''}
              </p>
              <h1 id="home-title" className="m-0 text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                {headline} <span className="text-gold">{highlight}.</span>
              </h1>
              {activeTenure?.themeTagline && (
                <p className="m-0 text-[1.05rem] font-semibold text-hero-ink">“{activeTenure.themeTagline}”</p>
              )}
              <p className="m-0 max-w-[58ch] text-[1rem] leading-relaxed text-hero-muted">
                Penggerak budaya kerja Group IT Application Delivery, Direktorat IT Bank Mandiri: kebersamaan, kesejahteraan, cerita, dan bakat setiap insan.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {openForms.length > 0 ? (
                  <Button variant="gold" size="lg" iconRight={<ArrowRight size={18} aria-hidden="true" />} onClick={() => openForms.length === 1 ? go('form', openForms[0].id) : go('form')}>
                    {openForms.length === 1 ? `Daftar: ${openForms[0].title}` : `${openForms.length} formulir dibuka`}
                  </Button>
                ) : visible('event') ? (
                  <Button variant="gold" size="lg" iconRight={<ArrowRight size={18} aria-hidden="true" />} onClick={() => go('event')}>Lihat agenda</Button>
                ) : null}
                {visible('kudos') && <Button variant="onHero" size="lg" onClick={() => go('kudos')}>Kirim kudos</Button>}
                {!visible('kudos') && visible('organisasi') && <Button variant="onHero" size="lg" onClick={() => go('organisasi')}>Kenali pengurus</Button>}
              </div>
            </div>
            <dl className="m-0 grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-hero-tile p-5">
                  <dd className="m-0 text-[2.2rem] font-extrabold leading-none">{s.value}</dd>
                  <dt className="mt-2 text-[0.88rem] text-hero-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <AkhlakBand thickness={10} />
        </section>
      </Container>

      {/* Highlights */}
      <Container>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible('event') && (
            <Card as="section" aria-labelledby="home-agenda" className="flex flex-col gap-4">
              <Eyebrow id="home-agenda">{upcomingEvents.length > 0 ? 'Acara terdekat' : 'Acara terakhir'}</Eyebrow>
              {featuredEvent ? (
                <button type="button" onClick={() => go('event', null, featuredEvent.id)} className="flex cursor-pointer items-start gap-4 border-0 bg-transparent p-0 text-left">
                  {eventDay(featuredEvent.startDate) && (
                    <span className="w-16 shrink-0 rounded-xl bg-pill py-2 text-center text-pill-ink">
                      <span className="block text-[1.4rem] font-extrabold leading-none">{eventDay(featuredEvent.startDate)!.day}</span>
                      <span className="mt-1 block text-[0.74rem] font-bold">{eventDay(featuredEvent.startDate)!.month}</span>
                    </span>
                  )}
                  <span className="flex flex-col gap-1">
                    <span className="text-[1.08rem] font-extrabold text-ink">{featuredEvent.title}</span>
                    {eventTime(featuredEvent) && <span className="text-[0.88rem] text-muted">{eventTime(featuredEvent)}</span>}
                    {featuredEvent.location && <span className="flex items-center gap-1.5 text-[0.88rem] text-muted"><MapPin size={14} aria-hidden="true" />{featuredEvent.location}</span>}
                    {upcomingEvents.length === 0 && <Chip className="mt-1 self-start">Selesai</Chip>}
                  </span>
                </button>
              ) : (
                <p className="m-0 text-[0.92rem] text-muted">Belum ada acara pada periode ini.</p>
              )}
              {upcomingEvents.length === 0 && featuredEvent && (
                <p className="m-0 border-t border-line pt-4 text-[0.9rem] text-muted">Belum ada acara mendatang. Pantau kalender untuk agenda berikutnya.</p>
              )}
              <button type="button" onClick={() => go('event')} className="mt-auto cursor-pointer self-start border-0 bg-transparent p-0 text-[0.9rem] font-bold text-navy underline">Buka kalender →</button>
            </Card>
          )}

          {visible('kudos') && (
            <section aria-labelledby="home-kudos" className="flex flex-col gap-3 rounded-[20px] bg-gold p-6 text-gold-on">
              <div className="flex items-center justify-between gap-2">
                <p id="home-kudos" className="m-0 text-[0.75rem] font-bold uppercase tracking-[0.08em]">Kudos terbaru</p>
                {latestKudos?.category && <span className="rounded-full bg-[rgba(26,19,0,0.1)] px-3 py-1.5 text-[0.8rem] font-bold leading-none">{latestKudos.category}</span>}
              </div>
              {latestKudos ? (
                <>
                  <p className="m-0 text-[1.5rem] font-extrabold leading-snug">“{latestKudos.message}”</p>
                  <p className="m-0 text-[0.9rem]">Untuk {latestKudos.recipient} · dari {latestKudos.sender || 'Anonim'}</p>
                </>
              ) : (
                <p className="m-0 text-[1.15rem] font-bold">Jadilah yang pertama mengapresiasi rekan kerja.</p>
              )}
              <button type="button" onClick={() => go('kudos')} className="mt-auto cursor-pointer self-start border-0 bg-transparent p-0 text-[0.9rem] font-bold text-gold-on underline">Apresiasi rekanmu →</button>
            </section>
          )}

          {openForms.length > 0 ? (
            <Card as="section" aria-labelledby="home-forms" className="flex flex-col gap-3">
              <Eyebrow id="home-forms">Formulir dibuka</Eyebrow>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {openForms.slice(0, 3).map((f) => (
                  <li key={f.id}>
                    <button type="button" onClick={() => go('form', f.id)} className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-line bg-subtle p-3 text-left">
                      <ClipboardList size={18} className="mt-0.5 shrink-0 text-navy" aria-hidden="true" />
                      <span>
                        <span className="block text-[0.95rem] font-bold text-ink">{f.title}</span>
                        {f.deadline && <span className="block text-[0.82rem] text-muted">Tenggat {formatDeadlineWib(f.deadline)}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => go('form')} className="mt-auto cursor-pointer self-start border-0 bg-transparent p-0 text-[0.9rem] font-bold text-navy underline">Semua formulir →</button>
            </Card>
          ) : visible('kudos') && (
            <Card as="section" aria-labelledby="home-aspirasi" className="flex flex-col gap-3">
              <Eyebrow id="home-aspirasi">Aspirasi</Eyebrow>
              {latestAspirasi ? (
                <>
                  <p className="m-0 text-[1.08rem] font-extrabold text-ink">{latestAspirasi.title || latestAspirasi.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {latestAspirasi.category && <Chip tone="kompeten">{latestAspirasi.category}</Chip>}
                    <Chip>{latestAspirasi.status || 'Menunggu tinjauan'}</Chip>
                  </div>
                </>
              ) : (
                <p className="m-0 text-[1rem] font-bold text-ink">Belum ada aspirasi publik.</p>
              )}
              <p className="m-0 text-[0.9rem] leading-relaxed text-muted">Punya ide kegiatan untuk insan IT APD? Sampaikan langsung ke pengurus.</p>
              <button type="button" onClick={() => go('kudos')} className="mt-auto cursor-pointer self-start border-0 bg-transparent p-0 text-[0.9rem] font-bold text-navy underline">Sampaikan ide →</button>
            </Card>
          )}
        </div>
      </Container>

      {/* Visi & misi */}
      {(activeTenure?.visi || misi.length > 0) && (
        <Container>
          <Card as="section" aria-labelledby="home-visi" padding="lg" className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col gap-3">
              <Eyebrow id="home-visi">Visi {activeTenure?.code}</Eyebrow>
              <p className="m-0 text-[clamp(1.25rem,2.4vw,1.6rem)] font-extrabold leading-snug text-ink">{activeTenure?.visi}</p>
            </div>
            {misi.length > 0 && (
              <div className="flex flex-col gap-3">
                <Eyebrow>Misi</Eyebrow>
                <ol className="m-0 flex list-none flex-col gap-4 p-0">
                  {misi.map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-pill text-[0.85rem] font-extrabold text-pill-ink">{i + 1}</span>
                      <span className="text-[0.95rem] leading-relaxed text-muted">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        </Container>
      )}

      {/* Leadership */}
      {visible('organisasi') && leaders.length > 0 && (
        <Container className="flex flex-col gap-6">
          <SectionHeader
            title="Pimpinan kepengurusan"
            action={<button type="button" onClick={() => go('organisasi')} className="cursor-pointer border-0 bg-transparent p-0 text-[0.92rem] font-bold text-navy underline">Struktur organisasi →</button>}
          />
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => go('organisasi')} className="flex w-full cursor-pointer items-center gap-4 rounded-[20px] border border-line bg-surface p-4 text-left hover:border-line-strong">
                  <Avatar person={p} />
                  <span className="min-w-0">
                    <span className="block truncate text-[1rem] font-extrabold text-ink">{p.name}</span>
                    <span className="block text-[0.86rem] text-muted">{p.role}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* Divisions */}
      {activeDivisions.length > 0 && (
        <Container className="flex flex-col gap-6">
          <SectionHeader
            title={activeDivisions.length === 4 ? 'Empat divisi, satu semangat.' : 'Divisi Culture Network Team'}
            action={visible('organisasi') ? <button type="button" onClick={() => go('organisasi')} className="cursor-pointer border-0 bg-transparent p-0 text-[0.92rem] font-bold text-navy underline">Lihat semua pengurus →</button> : undefined}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeDivisions.map((div, i) => {
              const accent = DIVISION_ACCENTS[i % DIVISION_ACCENTS.length];
              const lead = getDivisionLead(div, members, tenureRoles);
              return (
                <Card as="article" key={div.id} className={cn('flex flex-col gap-3 border-t-[5px]', ACCENT_BORDER[accent])}>
                  <p className={cn('m-0 text-[2.4rem] font-extrabold leading-none', ACCENT_TEXT[accent])}>{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="m-0 text-[1.1rem] font-extrabold text-ink">{div.name}</h3>
                  {div.motto && <p className="m-0 text-[0.9rem] leading-relaxed text-muted">{div.motto}</p>}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    {lead?.name && <span className="flex items-center gap-1.5 text-[0.82rem] font-semibold text-dim"><Users size={14} aria-hidden="true" />{lead.name}</span>}
                    {div.isRecruiting && <Chip tone="success">Membuka anggota</Chip>}
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      )}

      {/* AKHLAK */}
      <Container>
        <Card as="section" aria-labelledby="home-akhlak" padding="lg" className="grid items-center gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Eyebrow>Nilai inti BUMN</Eyebrow>
            <h2 id="home-akhlak" className="m-0 text-[1.7rem] font-extrabold text-ink">AKHLAK dalam setiap kudos</h2>
            <p className="m-0 text-[0.95rem] leading-relaxed text-muted">Setiap apresiasi untuk rekan kerja diberikan pada salah satu dari enam nilai ini.</p>
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {AKHLAK_VALUES.map((v) => (
              <li key={v.value}><Chip tone={akhlakTone(v.value)} title={v.description}>{v.value}</Chip></li>
            ))}
          </ul>
        </Card>
      </Container>

      {/* Short-cuts to the other pages */}
      <Container>
        <div className="grid gap-4 sm:grid-cols-3">
          {visible('event') && (
            <button type="button" onClick={() => go('event')} className="flex cursor-pointer items-center gap-3 rounded-[20px] border border-line bg-surface p-5 text-left hover:border-line-strong">
              <CalendarDays size={22} className="text-navy" aria-hidden="true" /><span className="font-bold text-ink">Kalender acara</span>
            </button>
          )}
          {visible('faq') && (
            <button type="button" onClick={() => go('faq')} className="flex cursor-pointer items-center gap-3 rounded-[20px] border border-line bg-surface p-5 text-left hover:border-line-strong">
              <Lightbulb size={22} className="text-navy" aria-hidden="true" /><span className="font-bold text-ink">Pertanyaan umum (FAQ)</span>
            </button>
          )}
          {visible('organisasi') && (
            <button type="button" onClick={() => go('organisasi')} className="flex cursor-pointer items-center gap-3 rounded-[20px] border border-line bg-surface p-5 text-left hover:border-line-strong">
              <Users size={22} className="text-navy" aria-hidden="true" /><span className="font-bold text-ink">Struktur organisasi</span>
            </button>
          )}
        </div>
      </Container>
    </div>
  );
}
