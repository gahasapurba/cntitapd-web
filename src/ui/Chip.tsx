import type { HTMLAttributes } from 'react';
import { cn } from './cn';
import { AKHLAK_VALUES } from '../utils/akhlak';

export type ChipTone = 'neutral' | 'navy' | 'gold' | 'success' | 'danger' | 'amanah' | 'kompeten' | 'harmonis' | 'loyal' | 'adaptif' | 'kolaboratif';

const tones: Record<ChipTone, string> = {
  neutral: 'bg-subtle text-muted border border-line',
  navy: 'bg-pill text-pill-ink',
  gold: 'bg-harmonis-tint text-harmonis-ink',
  success: 'bg-kolaboratif-tint text-kolaboratif-ink',
  danger: 'bg-loyal-tint text-loyal-ink',
  amanah: 'bg-amanah-tint text-amanah-ink',
  kompeten: 'bg-kompeten-tint text-kompeten-ink',
  harmonis: 'bg-harmonis-tint text-harmonis-ink',
  loyal: 'bg-loyal-tint text-loyal-ink',
  adaptif: 'bg-adaptif-tint text-adaptif-ink',
  kolaboratif: 'bg-kolaboratif-tint text-kolaboratif-ink'
};

export function Chip({ tone = 'neutral', className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] font-bold leading-none', tones[tone], className)} {...rest} />;
}

/** Chip tone for an AKHLAK value name ("Harmonis" -> 'harmonis'); neutral for anything else. */
export function akhlakTone(value: string | null | undefined): ChipTone {
  const key = String(value || '').toLowerCase();
  return AKHLAK_VALUES.some((v) => v.value.toLowerCase() === key) ? (key as ChipTone) : 'neutral';
}
