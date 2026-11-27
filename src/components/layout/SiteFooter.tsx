import { AkhlakBand, Container } from '../../ui';

const CURRENT_YEAR_WIB = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(new Date());

export default function SiteFooter({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <AkhlakBand />
      <Container className="flex flex-col gap-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <img
              src={isDark ? '/assets/apd-logo-white.png' : '/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png'}
              alt="IT Application Delivery"
              className="h-9 w-auto"
            />
            <div>
              <p className="m-0 text-[0.95rem] font-extrabold text-ink">Culture Network Team</p>
              <p className="m-0 text-[0.8rem] text-muted">Group IT Application Delivery · Direktorat IT Bank Mandiri</p>
            </div>
          </div>
          <img
            src={isDark ? '/assets/Mandiri/04-Mandiri White Color Alternative Logo.png' : '/assets/mandiri-logo.png'}
            alt="Bank Mandiri"
            className="h-6 w-auto"
          />
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-[0.82rem] text-muted">
          <span>© {CURRENT_YEAR_WIB} Culture Network Team · Group IT Application Delivery, Bank Mandiri</span>
          <span>Satu Hati, Satu Mandiri.</span>
        </div>
      </Container>
    </footer>
  );
}
