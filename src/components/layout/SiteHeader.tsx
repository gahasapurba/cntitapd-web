import { useEffect, useState } from 'react';
import { ClipboardList, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { getDeadlineStatus } from '../../utils/dateUtils';
import { AkhlakBand, cn } from '../../ui';

type AppItem = Record<string, any>;

interface SiteHeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  tenures: AppItem[];
  activeTenure: AppItem | null;
  onSelectTenure: (tenure: AppItem) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  forms?: AppItem[];
  pageVisibility?: Record<string, unknown>;
  onOpenQuickSearch?: () => void;
}

export const NAV_ITEMS = [
  { id: 'home', label: 'Beranda' },
  { id: 'organisasi', label: 'Organisasi' },
  { id: 'event', label: 'Acara' },
  { id: 'galeri', label: 'Galeri' },
  { id: 'kudos', label: 'Kudos & Aspirasi' },
  { id: 'assets', label: 'Aset' }
] as const;

export function isPageVisible(pageVisibility: Record<string, unknown>, id: string): boolean {
  if (id === 'event' || id === 'program') return pageVisibility.event !== false && pageVisibility.program !== false;
  if (id === 'form' || id === 'oprec') return pageVisibility.form !== false && pageVisibility.oprec !== false;
  return pageVisibility[id] !== false;
}

/** Forms a visitor can still fill in for the tenure being browsed. */
export function countOpenForms(forms: AppItem[], activeTenure: AppItem | null): number {
  return forms.filter((f) => {
    if (f.isOpen === false) return false;
    if (getDeadlineStatus(f.deadline).isExpired) return false;
    if (activeTenure?.id) {
      const formTenure = f.tenureId || f.tenure_id || f.fields?.[0]?._tenureId || '';
      return !formTenure || formTenure === activeTenure.id;
    }
    return true;
  }).length;
}

export default function SiteHeader({
  currentTab,
  setCurrentTab,
  tenures,
  activeTenure,
  onSelectTenure,
  theme,
  onToggleTheme,
  forms = [],
  pageVisibility = {},
  onOpenQuickSearch
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === 'dark';
  const navItems = NAV_ITEMS.filter((item) => isPageVisible(pageVisibility, item.id));
  const formsVisible = isPageVisible(pageVisibility, 'form');
  const openForms = countOpenForms(forms, activeTenure);
  const isFormTab = currentTab === 'form' || currentTab === 'oprec';

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (tab: string) => {
    setCurrentTab(tab);
    setMenuOpen(false);
  };
  const goHome = () => {
    if (pageVisibility.home !== false) go('home');
    else if (navItems.length > 0) go(navItems[0].id);
    else if (formsVisible) go('form');
  };

  const tenureSelect = (id: string) => (
    tenures.length > 1 ? (
      <label className="flex items-center">
        <span className="sr-only">Periode kepengurusan</span>
        <select
          id={id}
          value={activeTenure?.id || ''}
          onChange={(e) => {
            const selected = tenures.find((t) => t.id === e.target.value);
            if (selected) onSelectTenure(selected);
          }}
          className="h-11 rounded-xl border border-line bg-surface px-3 text-[0.88rem] font-semibold text-ink"
        >
          {tenures.map((t) => <option key={t.id} value={t.id}>{t.code || t.title}</option>)}
        </select>
      </label>
    ) : null
  );

  const formsButton = (full: boolean) => formsVisible ? (
    <button
      type="button"
      onClick={() => go('form')}
      aria-current={isFormTab ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-[0.88rem] font-bold whitespace-nowrap',
        openForms > 0 ? 'bg-gold text-gold-on' : 'border border-line bg-surface text-ink',
        full && 'w-full justify-center'
      )}
    >
      <ClipboardList size={16} aria-hidden="true" />
      <span>Formulir</span>
      {openForms > 0
        ? <span className="rounded-full bg-[rgba(26,19,0,0.12)] px-2 py-0.5 text-[0.72rem]">{openForms} dibuka</span>
        : <span className="rounded-full bg-subtle px-2 py-0.5 text-[0.72rem] text-muted">ditutup</span>}
    </button>
  ) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-surface">
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        <button type="button" onClick={goHome} className="flex shrink-0 cursor-pointer items-center gap-3 border-0 bg-transparent p-0" aria-label="Culture Network Team, ke Beranda">
          <img
            src={isDark ? '/assets/apd-logo-white.png' : '/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png'}
            alt=""
            className="h-8 w-auto"
          />
          <span className="hidden border-l border-line pl-3 text-left text-[0.86rem] font-extrabold leading-tight text-ink sm:block">
            Culture Network Team
            <span className="block text-[0.72rem] font-medium text-muted">Group IT Application Delivery</span>
          </span>
        </button>

        <nav aria-label="Menu utama" className="hidden flex-1 items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = currentTab === item.id || (item.id === 'event' && currentTab === 'program');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'min-h-11 cursor-pointer rounded-full border-0 px-3.5 text-[0.9rem] font-semibold whitespace-nowrap',
                  active ? 'bg-pill text-pill-ink' : 'bg-transparent text-muted hover:text-ink'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:block">{formsButton(false)}</div>
          <div className="hidden md:block">{tenureSelect('header-tenure')}</div>
          {onOpenQuickSearch && (
            <button
              type="button"
              onClick={onOpenQuickSearch}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-subtle px-3 text-[0.88rem] text-muted"
              aria-label="Cari di situs (Ctrl+K)"
            >
              <Search size={16} aria-hidden="true" />
              <span className="hidden xl:inline">Cari…</span>
              <kbd className="hidden rounded-md border border-line px-1.5 text-[0.72rem] font-semibold xl:inline">⌘K</kbd>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            className="grid size-11 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-ink"
            aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
          >
            {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-11 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-ink lg:hidden"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <AkhlakBand />

      {menuOpen && (
        <div id="mobile-menu" className="border-b border-line bg-surface lg:hidden">
          <nav aria-label="Menu utama (ponsel)" className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-4 sm:px-6">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'min-h-12 cursor-pointer rounded-xl border-0 px-4 text-left text-[1rem] font-semibold',
                    active ? 'bg-pill text-pill-ink' : 'bg-transparent text-ink hover:bg-subtle'
                  )}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="mt-3 flex flex-col gap-3 border-t border-line pt-4">
              {formsButton(true)}
              <div className="md:hidden">{tenureSelect('mobile-tenure')}</div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
