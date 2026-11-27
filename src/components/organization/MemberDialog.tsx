import { CalendarDays, Check, CheckCircle2, Copy, Download } from 'lucide-react';
import { Button, Chip, Dialog } from '../../ui';
import { MemberAvatar, WhatsAppLink } from './MemberCard';

type Org = Record<string, any>;

/** Profile of one committee member: contact actions, motto, responsibilities and division events. */
export default function MemberDialog({ org }: { org: Org }) {
  const { copiedPhone, handleCloseModal, handleCopyPhone, handleDownloadVCard, onNavigateProgram, relatedEventsFor, selectedMember, setSelectedMember } = org;
  const member = selectedMember;
  const related = member ? relatedEventsFor(member) : { events: [], divisionName: '' };

  return (
    <Dialog open={Boolean(member)} onClose={handleCloseModal} eyebrow="Profil pengurus" title={member?.name || ''} size="md">
      {member && (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <MemberAvatar member={member} size={88} />
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Chip tone="gold">{member.role || 'Anggota'}</Chip>
                {member.title && member.title !== member.role && <Chip tone="neutral">{member.title}</Chip>}
              </div>
              <div className="flex flex-wrap gap-2">
                {member.whatsapp && <WhatsAppLink phone={member.whatsapp} label="Chat WhatsApp" className="min-h-9 px-3.5 text-[0.84rem]" />}
                <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={() => handleDownloadVCard(member)}
                  title="Simpan kontak ke ponsel atau Outlook (.vcf)">
                  Simpan kontak
                </Button>
                {member.whatsapp && (
                  <Button size="sm" variant="secondary" onClick={() => handleCopyPhone(member.whatsapp)}
                    icon={copiedPhone ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}>
                    {copiedPhone ? 'Nomor tersalin' : 'Salin nomor'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {member.motto && (
            <blockquote className="m-0 rounded-r-xl border-l-4 border-l-gold bg-subtle px-4 py-3 text-[0.95rem] italic leading-relaxed text-ink">
              "{member.motto}"
            </blockquote>
          )}

          {Array.isArray(member.responsibilities) && member.responsibilities.length > 0 && (
            <section aria-labelledby="member-duties">
              <h3 id="member-duties" className="m-0 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted">Tanggung jawab utama</h3>
              <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                {member.responsibilities.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2.5 text-[0.92rem] leading-relaxed text-ink">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-kolaboratif-ink" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {related.events.length > 0 && (
            <section aria-labelledby="member-events" className="flex flex-col gap-2 border-t border-line pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="member-events" className="m-0 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted">
                  Acara {related.divisionName} ({related.events.length})
                </h3>
                {onNavigateProgram && (
                  <Button size="sm" variant="ghost" icon={<CalendarDays size={14} aria-hidden="true" />}
                    onClick={() => { setSelectedMember(null); onNavigateProgram(); }}>
                    Lihat kalender
                  </Button>
                )}
              </div>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {related.events.map((ev: Org) => (
                  <li key={ev.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-subtle px-3.5 py-2.5 text-[0.88rem]">
                    <span className="font-bold text-ink">{ev.title}</span>
                    <span className="shrink-0 text-[0.8rem] text-muted">{ev.date}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Dialog>
  );
}
