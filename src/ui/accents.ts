// Division accents follow the AKHLAK palette in a fixed order, so division 01–06 keeps the
// same colour on every page. Class names are written out in full for Tailwind's scanner.
export const DIVISION_ACCENTS = ['amanah', 'loyal', 'adaptif', 'harmonis', 'kompeten', 'kolaboratif'] as const;
export type DivisionAccent = (typeof DIVISION_ACCENTS)[number];

export const ACCENT_TEXT: Record<DivisionAccent, string> = {
  amanah: 'text-amanah-ink', loyal: 'text-loyal-ink', adaptif: 'text-adaptif-ink',
  harmonis: 'text-harmonis-ink', kompeten: 'text-kompeten-ink', kolaboratif: 'text-kolaboratif-ink'
};
export const ACCENT_BORDER: Record<DivisionAccent, string> = {
  amanah: 'border-t-amanah', loyal: 'border-t-loyal', adaptif: 'border-t-adaptif',
  harmonis: 'border-t-harmonis', kompeten: 'border-t-kompeten', kolaboratif: 'border-t-kolaboratif'
};
export const ACCENT_BG: Record<DivisionAccent, string> = {
  amanah: 'bg-amanah', loyal: 'bg-loyal', adaptif: 'bg-adaptif',
  harmonis: 'bg-harmonis', kompeten: 'bg-kompeten', kolaboratif: 'bg-kolaboratif'
};

export function divisionAccent(index: number): DivisionAccent {
  return DIVISION_ACCENTS[((index % DIVISION_ACCENTS.length) + DIVISION_ACCENTS.length) % DIVISION_ACCENTS.length];
}
