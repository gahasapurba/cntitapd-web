import { cn } from './cn';

const BAND = ['bg-amanah', 'bg-kompeten', 'bg-harmonis', 'bg-loyal', 'bg-adaptif', 'bg-kolaboratif'];

/** The six AKHLAK colours as a horizontal band (decorative). */
export function AkhlakBand({ className, thickness = 4 }: { className?: string; thickness?: number }) {
  return (
    <div aria-hidden="true" className={cn('grid grid-cols-6 w-full', className)} style={{ height: thickness }}>
      {BAND.map((c) => <span key={c} className={c} />)}
    </div>
  );
}
