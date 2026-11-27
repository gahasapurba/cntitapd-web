import { createContext, useContext } from 'react';

/**
 * State, data and handlers owned by AdminPortal, shared with the tab and modal components in
 * src/admin. Kept in AdminPortal so filters and half-filled inputs survive tab switches.
 * Values are loosely typed for now; each tab gets typed props when it is redesigned.
 */
export type AdminPortalContextValue = Record<string, any>;

export const AdminPortalContext = createContext<AdminPortalContextValue | null>(null);

export function useAdminPortal(): AdminPortalContextValue {
  const value = useContext(AdminPortalContext);
  if (!value) throw new Error('useAdminPortal must be used inside AdminPortal');
  return value;
}
