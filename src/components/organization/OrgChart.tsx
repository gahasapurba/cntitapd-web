import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { ACCENT_BG, ACCENT_BORDER, ACCENT_TEXT, cn, divisionAccent, type ChipTone } from '../../ui';
import { MessageCircle } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { formatWaNumber } from './useOrganization';

type Org = Record<string, any>;
type Member = Record<string, any>;
const GAP = 24; // px between cards in a tier; the connector bridge math below depends on it

/** Vertical connector between tiers (desktop only; phones read the chart as a stacked list). */
function Stem({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('hidden w-0.5 bg-line-strong lg:block', className || 'h-7')} />;
}

/**
 * A row of cards that hangs from one parent: a horizontal bridge joins the centres of the
 * first and last card, and each card has a short stem up to it.
 */
function Tier({ count, maxWidth, children, root = false }: { count: number; maxWidth: number; children: ReactNode; root?: boolean }) {
  const bridgeInset = `calc((100% - ${(count - 1) * GAP}px) / ${count * 2})`;
  return (
    <div className="relative w-full" style={{ maxWidth }}>
      {count > 1 && !root && (
        <div aria-hidden="true" className="absolute top-0 hidden h-0.5 bg-line-strong lg:block" style={{ left: bridgeInset, right: bridgeInset }} />
      )}
      <div
        className="grid grid-cols-1 gap-4 lg:gap-6 lg:[grid-template-columns:repeat(var(--tier-cols),minmax(0,1fr))]"
        style={{ '--tier-cols': count } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

function TierItem({ children, root }: { children: ReactNode; root: boolean }) {
  return (
    <div className="flex flex-col items-center">
      {!root && <Stem className="h-5" />}
      {children}
    </div>
  );
}

function PeopleTier({ people, onOpen, tone, root, maxPerRow = 440 }: { people: Member[]; onOpen: (m: Member) => void; tone: ChipTone; root: boolean; maxPerRow?: number }) {
  return (
    <Tier root={root} count={people.length} maxWidth={people.length === 1 ? maxPerRow : Math.min(people.length * 420, 1240)}>
      {people.map((p) => (
        <TierItem key={p.id} root={root}><MemberCard member={p} onOpen={() => onOpen(p)} tone={tone} /></TierItem>
      ))}
    </Tier>
  );
}

function DivisionColumn({ column, onOpen }: { column: Org; onOpen: (m: Member) => void }) {
  const { div, idx, leaders, members } = column;
  const accent = divisionAccent(idx);
  return (
    <div className="flex min-w-0 flex-col items-center">
      <Stem className="h-5" />
      <section aria-label={`Divisi ${div.name}`} className="flex w-full flex-col gap-3">
        <div className={cn('rounded-2xl border border-line border-t-[5px] bg-surface p-4', ACCENT_BORDER[accent])}>
          <p className={cn('m-0 text-[1.7rem] font-extrabold leading-none', ACCENT_TEXT[accent])}>{String(idx + 1).padStart(2, '0')}</p>
          <h3 className="m-0 mt-2 text-[1.02rem] font-extrabold leading-snug text-ink">{div.name}</h3>
          {div.motto && <p className="m-0 mt-1 text-[0.82rem] italic leading-snug text-muted">{div.motto}</p>}
        </div>

        {leaders.length > 0 ? (
          leaders.map((ldr: Member) => <MemberCard key={ldr.id} member={ldr} compact tone={accent} onOpen={() => onOpen(ldr)} />)
        ) : (
          <p className="m-0 rounded-2xl border border-dashed border-line px-4 py-4 text-center text-[0.86rem] text-muted">Belum ada pimpinan divisi</p>
        )}

        {members.length > 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-subtle p-3">
            <p className="m-0 flex items-center gap-2 px-1 pb-2 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-muted">
              <span aria-hidden="true" className={cn('size-2 rounded-full', ACCENT_BG[accent])} />
              Anggota divisi ({members.length})
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {members.map((m: Member) => {
                // "Anggota Divisi <name>" repeats the column title; only distinct roles are worth showing
                const role = String(m.role || '').trim();
                const showRole = role && !/^anggota(\s+divisi)?\b/i.test(role);
                return (
                  <li key={m.id} className="relative flex items-center gap-2 rounded-xl border border-line bg-surface py-2 pl-3 pr-2 hover:border-line-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy">
                    <div className="min-w-0 flex-1">
                      {showRole && <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-muted">{role}</p>}
                      <button
                        type="button"
                        onClick={() => onOpen(m)}
                        aria-label={`Lihat profil ${m.name}`}
                        className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-[0.9rem] font-bold leading-snug text-ink outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
                      >
                        {m.name}
                      </button>
                    </div>
                    {m.whatsapp && (
                      <a
                        href={`https://wa.me/${formatWaNumber(m.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Hubungi ${m.name} lewat WhatsApp`}
                        className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-kolaboratif-tint text-kolaboratif-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                      >
                        <MessageCircle size={14} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

/** The hierarchy chart; also the element exported to PDF (#org-tree-export-container). */
export default function OrgChart({ org }: { org: Org }) {
  const { currentTenure, displayLevel2, displayLevel3, divisionColumns, handleMemberClick, pembinas, penasehats } = org;
  const divCols = Math.min(divisionColumns.length, 4);
  // Advisers → patrons → chair & vice → board, skipping empty levels
  const tiers = ([
    { key: 'penasehat', people: penasehats, tone: 'gold' },
    { key: 'pembina', people: pembinas, tone: 'gold' },
    { key: 'ketua', people: displayLevel2, tone: 'navy' },
    { key: 'bph', people: displayLevel3, tone: 'navy' }
  ] as { key: string; people: Member[]; tone: ChipTone }[]).filter((t) => t.people.length > 0);
  const hasAbove = tiers.length > 0;

  return (
    <div id="org-tree-export-container" className="flex w-full flex-col items-center rounded-[24px] border border-line bg-page px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-4 flex flex-col items-center gap-1.5 text-center lg:mb-2">
        <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.1em] text-muted">Bank Mandiri · Direktorat IT · Group IT APD</p>
        <h2 className="m-0 text-[clamp(1.2rem,2.4vw,1.5rem)] font-extrabold tracking-[-0.01em] text-ink">Struktur Organisasi Culture Network Team</h2>
        <p className="m-0 text-[0.88rem] font-bold text-gold-ink">Periode {currentTenure?.title || currentTenure?.code || 'aktif'}</p>
      </header>

      {tiers.map((tier, i) => (
        <Fragment key={tier.key}>
          <PeopleTier people={tier.people} onOpen={handleMemberClick} tone={tier.tone} root={i === 0} />
          {(i < tiers.length - 1 || divisionColumns.length > 0) && <Stem />}
        </Fragment>
      ))}

      {divisionColumns.length > 0 && (
        <div className={cn('relative w-full', !hasAbove && 'mt-2')}>
          {divCols > 1 && divisionColumns.length <= 4 && (
            <div aria-hidden="true" className="absolute top-0 hidden h-0.5 bg-line-strong lg:block"
              style={{ left: `calc((100% - ${(divCols - 1) * GAP}px) / ${divCols * 2})`, right: `calc((100% - ${(divCols - 1) * GAP}px) / ${divCols * 2})` }} />
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--div-cols),minmax(0,1fr))]" style={{ '--div-cols': divCols } as CSSProperties}>
            {divisionColumns.map((col: Org) => <DivisionColumn key={col.div.id || col.idx} column={col} onOpen={handleMemberClick} />)}
          </div>
        </div>
      )}
    </div>
  );
}
