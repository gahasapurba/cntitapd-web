import { MessageCircle } from 'lucide-react';
import { Chip, cn, type ChipTone } from '../../ui';
import { formatWaNumber } from './useOrganization';

type Member = Record<string, any>;

function initials(name: string) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/**
 * Member photo. Drawn as a background image (not <img object-fit>) so the PDF export
 * (html2canvas, which ignores object-fit) crops it the same way as the page.
 */
export function MemberAvatar({ member, size }: { member: Member; size: number }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-pill font-extrabold text-pill-ink"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials(member.name)}
      {member.image && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${String(member.image).replace(/"/g, '%22')}")` }} />
      )}
    </div>
  );
}

export function WhatsAppLink({ phone, label = 'Hubungi WA', className }: { phone: string; label?: string; className?: string }) {
  return (
    <a
      href={`https://wa.me/${formatWaNumber(phone)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'relative z-10 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-kolaboratif-tint px-3 text-[0.78rem] font-bold text-kolaboratif-ink no-underline hover:brightness-95',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy',
        className
      )}
    >
      <MessageCircle size={13} aria-hidden="true" />
      {label}
    </a>
  );
}

/** Person card in the chart and directory. The whole card opens the profile; the WA link stays separate. */
export function MemberCard({ member, onOpen, compact = false, tone = 'navy' }: { member: Member; onOpen: () => void; compact?: boolean; tone?: ChipTone }) {
  return (
    <article
      data-org-card
      className={cn(
        'relative flex w-full items-center gap-3.5 rounded-2xl border border-line bg-surface text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong',
        'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy',
        compact ? 'p-3.5' : 'p-4'
      )}
    >
      <MemberAvatar member={member} size={compact ? 48 : 60} />
      <div className="min-w-0 flex-1">
        <Chip tone={tone} className="py-1! text-[0.72rem] leading-tight!">{member.role || 'Anggota'}</Chip>
        <h3 className={cn('m-0 mt-1.5 font-extrabold leading-snug text-ink', compact ? 'text-[0.95rem]' : 'text-[1.02rem]')}>
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Lihat profil ${member.name}${member.role ? `, ${member.role}` : ''}`}
            className="cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] text-ink outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
          >
            {member.name}
          </button>
        </h3>
        {member.motto && <p className="m-0 mt-1 line-clamp-2 text-[0.82rem] italic leading-snug text-muted">"{member.motto}"</p>}
        {member.whatsapp && <WhatsAppLink phone={member.whatsapp} className="mt-2" />}
      </div>
    </article>
  );
}
