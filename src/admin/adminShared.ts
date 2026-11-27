// Helpers & constants shared by AdminPortal and the components in src/admin.

export function formatWaPhone(raw: unknown = ''): string {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

export const SYNC_BADGE: Record<string, { label: string; color: string; background: string }> = {
  syncing: { label: 'Menyinkronkan Cloud...', color: 'var(--mandiri-gold)', background: 'rgba(255, 184, 0, 0.15)' },
  synced: { label: 'Cloud Sync Aktif (Multi-Device)', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' },
  error: { label: 'Sebagian data gagal dimuat dari Cloud', color: '#dc2626', background: 'rgba(220, 38, 38, 0.12)' }
};

export const DIVISION_ADMIN_TABS: string[] = ['members', 'events', 'forms', 'submissions', 'gallery'];
