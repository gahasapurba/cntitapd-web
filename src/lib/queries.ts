import { useCallback, useEffect } from 'react';
import { QueryClient, useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  supabase,
  fetchPageSettings,
  fetchPublicAspirasi,
  fetchRegistrationCounts,
  fetchTableRows,
  isPrivateTableKey,
  loadCachedPageSettings,
  loadLocalCache,
  PRIVATE_TABLE_KEYS,
  TABLE_KEY_BY_DB_TABLE,
  type AppItem,
  type PageSettings,
  type RegistrationCounts,
  type TableKey
} from './supabase';

/** Safety-net refresh; realtime change events are the primary update signal. */
const POLL_INTERVAL_MS = 60_000;
/** A burst of row changes on one table triggers a single reload of that table. */
const REALTIME_DEBOUNCE_MS = 1_000;
const STALE_TIME_MS = 30_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: POLL_INTERVAL_MS, // paused while the tab is hidden
      refetchOnWindowFocus: true,
      // Fresh data is not refetched again on focus for 30 s (avoids a second load right after the
      // first one). Realtime invalidations still refetch immediately.
      staleTime: STALE_TIME_MS,
      retry: 1
    }
  }
});

export const queryKeys = {
  table: (key: TableKey) => ['table', key] as const,
  settings: ['settings'] as const,
  publicAspirasi: ['publicAspirasi'] as const,
  registrationCounts: ['registrationCounts'] as const
};

type Updater<T> = T | ((prev: T) => T);

const EMPTY_ROWS: AppItem[] = [];
const EMPTY_COUNTS: RegistrationCounts = { forms: {}, events: {} };
const EMPTY_SETTINGS: PageSettings = {};

function resolve<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
}

/**
 * Optimistic local edit of cached server data. An in-flight refetch is cancelled first so a
 * response that predates the edit cannot overwrite it; the next refetch (realtime, poll or
 * invalidation after a failed write) reconciles with the server.
 */
function useCacheSetter<T>(queryKey: readonly unknown[], empty: T) {
  const client = useQueryClient();
  const keyId = JSON.stringify(queryKey);
  return useCallback((updater: Updater<T>) => {
    client.cancelQueries({ queryKey, exact: true });
    client.setQueryData<T>(queryKey, (prev) => resolve(updater, prev ?? empty));
    // Keyed on keyId: the queryKey array itself is recreated on every render.
  }, [client, keyId, empty]);
}

/**
 * One table as `[rows, setRows, dataUpdatedAt]`, shaped like `useState` so existing handlers keep
 * their `setRows(prev => ...)` updates. Public tables start from the localStorage copy.
 */
export function useTableData(key: TableKey, { enabled = true }: { enabled?: boolean } = {}) {
  const queryKey = queryKeys.table(key);
  const isPrivate = isPrivateTableKey(key);
  const query = useQuery({
    queryKey,
    queryFn: () => fetchTableRows(key),
    enabled,
    // The cached copy is shown immediately but treated as stale, so it is refetched on mount.
    initialData: isPrivate ? undefined : () => loadLocalCache<AppItem[]>(key, EMPTY_ROWS),
    initialDataUpdatedAt: 0
  });
  const setRows = useCacheSetter<AppItem[]>(queryKey, EMPTY_ROWS);
  return [query.data ?? EMPTY_ROWS, setRows, query.dataUpdatedAt] as const;
}

export function usePageSettings() {
  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: fetchPageSettings,
    initialData: loadCachedPageSettings,
    initialDataUpdatedAt: 0
  });
  const setSettings = useCacheSetter<PageSettings>(queryKeys.settings, EMPTY_SETTINGS);
  const updateSettings = useCallback(
    (patch: Partial<PageSettings>) => setSettings((prev) => ({ ...prev, ...patch })),
    [setSettings]
  );
  return [query.data, updateSettings] as const;
}

export function useRegistrationCounts({ enabled = true }: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: queryKeys.registrationCounts,
    queryFn: fetchRegistrationCounts,
    enabled
  });
  const setCounts = useCacheSetter<RegistrationCounts>(queryKeys.registrationCounts, EMPTY_COUNTS);
  return [query.data ?? EMPTY_COUNTS, setCounts] as const;
}

/** Aspirasi bertanda publik untuk pengunjung & admin divisi (super admin membaca tabelnya langsung). */
export function usePublicAspirasi({ enabled = true }: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: queryKeys.publicAspirasi,
    queryFn: fetchPublicAspirasi,
    enabled
  });
  const setRows = useCacheSetter<AppItem[]>(queryKeys.publicAspirasi, EMPTY_ROWS);
  return [query.data ?? EMPTY_ROWS, setRows] as const;
}

/** Drops registrants' personal data from memory (on admin sign-out). */
export function removePrivateTableData(): void {
  PRIVATE_TABLE_KEYS.forEach((key) => queryClient.removeQueries({ queryKey: queryKeys.table(key), exact: true }));
}

/** Refetches everything currently shown. Resolves when the reload has finished. */
export function refreshAllData(): Promise<void> {
  return queryClient.invalidateQueries();
}

/** 'syncing' while any request runs, 'error' when the last load of some data failed. */
export function useSyncStatus(): 'syncing' | 'synced' | 'error' {
  const fetching = useIsFetching();
  if (fetching > 0) return 'syncing';
  const hasError = queryClient.getQueryCache().getAll().some((q) => q.state.status === 'error');
  return hasError ? 'error' : 'synced';
}

const COUNT_SOURCE_TABLES = new Set(['submissions', 'event_rsvps', 'forms', 'events']);

/** Subscribes to database changes and reloads only the data that changed. */
export function useRealtimeInvalidation(): void {
  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const schedule = (queryKey: readonly unknown[]) => {
      const id = JSON.stringify(queryKey);
      clearTimeout(timers.get(id));
      timers.set(id, setTimeout(() => {
        timers.delete(id);
        queryClient.invalidateQueries({ queryKey, exact: true });
      }, REALTIME_DEBOUNCE_MS));
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel('cnt-cloud-sync-live')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          const table = payload.table;
          if (table === 'page_settings') schedule(queryKeys.settings);
          const key = TABLE_KEY_BY_DB_TABLE[table];
          if (key) schedule(queryKeys.table(key));
          if (table === 'aspirasi') schedule(queryKeys.publicAspirasi);
          if (COUNT_SOURCE_TABLES.has(table)) schedule(queryKeys.registrationCounts);
        })
        .subscribe();
    } catch (e) {
      console.error('Realtime subscription failed:', e);
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
      if (channel) supabase.removeChannel(channel);
    };
  }, []);
}
