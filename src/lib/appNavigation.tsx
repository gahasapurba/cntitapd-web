import { createContext, useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * URL scheme of the site. Kept identical to the pre-router links so that shared links,
 * printed QR posters and bookmarks keep working:
 *   /#<tab>                     a public page (home, organisasi, event, ...)
 *   /?event=<id>#event          event detail      /?form=<id>#form       a form
 *   /?gallery=<id>#galeri       a gallery         /?stats=<id>#event-stats
 *   /admin  (or /#admin)        the admin portal
 */

export const PUBLIC_PAGE_IDS = ['home', 'organisasi', 'event', 'galeri', 'kudos', 'assets', 'form'] as const;
export const VALID_TABS: readonly string[] = [...PUBLIC_PAGE_IDS, 'program', 'oprec', 'admin', 'event-stats'];

export interface LocationLike {
  pathname: string;
  search: string;
  hash: string;
}

export interface AppRoute {
  tab: string;
  formId: string | null;
  eventId: string | null;
  galleryId: string | null;
}

function normalizePath(pathname: string): string {
  return (pathname || '').replace(/\/+$/, '');
}

export function parseLocationRoute({ pathname, search, hash }: LocationLike): AppRoute {
  const rawHash = (hash || '').replace(/^#/, '');
  const [hashTab, hashQuery] = rawHash.split('?');
  const params = new URLSearchParams(hashQuery || search || '');
  const formId = params.get('form') || params.get('formId') || null;
  const eventId = params.get('eventId') || params.get('event') || null;
  // `galeri` is what older event pages generated; accept it alongside `gallery`.
  const galleryId = params.get('gallery') || params.get('galleryId') || params.get('galeri') || null;
  const statsParam = params.get('stats') || params.get('statsEventId') || null;

  if (normalizePath(pathname) === '/admin' || hashTab === 'admin') {
    return { tab: 'admin', formId, eventId, galleryId };
  }
  if (statsParam || hashTab === 'event-stats') {
    return { tab: 'event-stats', formId: null, eventId: statsParam || eventId, galleryId: null };
  }
  if (formId) {
    return { tab: 'form', formId, eventId: null, galleryId: null };
  }
  if (eventId) {
    return { tab: 'event', formId: null, eventId, galleryId: null };
  }
  if (galleryId) {
    return { tab: 'galeri', formId: null, eventId: null, galleryId };
  }
  if (hashTab) {
    if (hashTab === 'program' || hashTab === 'event') {
      return { tab: 'event', formId, eventId, galleryId };
    }
    if (hashTab === 'oprec' || hashTab === 'form') {
      return { tab: 'form', formId, eventId, galleryId };
    }
    if (VALID_TABS.includes(hashTab)) {
      return { tab: hashTab, formId, eventId, galleryId };
    }
  }
  return { tab: 'home', formId: null, eventId: null, galleryId: null };
}

export interface TabTarget {
  tab: string;
  formId?: string | null;
  eventId?: string | null;
  galleryId?: string | null;
}

/** Builds the URL for a page, with the same precedence the old `setCurrentTab` used. */
export function buildTabUrl({ tab, formId = null, eventId = null, galleryId = null }: TabTarget, currentPathname: string): string {
  let targetTab = tab;
  if (targetTab === 'program') targetTab = 'event';
  if (targetTab === 'oprec') targetTab = 'form';
  if (!VALID_TABS.includes(targetTab)) targetTab = 'home';

  if (formId) return `/?form=${encodeURIComponent(formId)}#form`;
  if (targetTab === 'event-stats') return `/?stats=${encodeURIComponent(eventId || '')}#event-stats`;
  if (eventId) return `/?event=${encodeURIComponent(eventId)}#event`;
  if (galleryId) return `/?gallery=${encodeURIComponent(galleryId)}#galeri`;
  if (targetTab === 'admin') return normalizePath(currentPathname) === '/admin' ? '/admin' : '/#admin';
  return `/#${targetTab}`;
}

interface NavState {
  /** URL of the in-app entry this one was pushed from. */
  prev?: string;
}

function hasDetailId(route: AppRoute): boolean {
  return Boolean(route.formId || route.eventId || route.galleryId);
}

export interface NavigateOptions {
  scroll?: boolean;
}

export type AppNavigate = (url: string, options?: NavigateOptions) => void;

/**
 * Returns a navigate function that pushes history entries (so the browser Back button works)
 * and coalesces several calls made in the same tick into one: handlers such as
 * "close the event modal, then open its form" end up as a single navigation to the form.
 *
 * Closing a detail view (same page, id removed) steps back in history when the previous entry
 * is exactly that page, so Back afterwards does not reopen the detail that was just closed.
 */
export function useQueuedNavigation(): AppNavigate {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);
  navigateRef.current = navigate;
  locationRef.current = location;
  const pending = useRef<{ url: string; scroll: boolean } | null>(null);

  return useCallback<AppNavigate>((url, { scroll = true } = {}) => {
    const isFirstInTick = pending.current === null;
    pending.current = { url, scroll };
    if (!isFirstInTick) return;

    queueMicrotask(() => {
      const next = pending.current!;
      pending.current = null;
      const loc = locationRef.current;
      const current = `${loc.pathname}${loc.search}${loc.hash}`;

      if (next.url !== current) {
        const from = parseLocationRoute(loc);
        const to = parseLocationRoute(new URL(next.url, window.location.origin));
        const isClosingDetail = from.tab === to.tab && hasDetailId(from) && !hasDetailId(to);
        if (isClosingDetail && (loc.state as NavState | null)?.prev === next.url) {
          navigateRef.current(-1);
        } else {
          navigateRef.current(next.url, { state: { prev: current } satisfies NavState });
        }
      }
      if (next.scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);
}

export const AppNavigationContext = createContext<AppNavigate | null>(null);

/** In-app navigation for components below `App` (falls back to a full page load outside it). */
export function useAppNavigate(): AppNavigate {
  const navigateTo = useContext(AppNavigationContext);
  return navigateTo ?? ((url: string) => { window.location.href = url; });
}
