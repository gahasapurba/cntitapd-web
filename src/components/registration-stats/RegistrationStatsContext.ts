import { createContext, useContext } from 'react';

/** Values returned by useEventRegistrationStats (state, derived data, handlers), shared with the sections of EventRegistrationStats. */
export type RegistrationStatsContextValue = Record<string, any>;

export const RegistrationStatsContext = createContext<RegistrationStatsContextValue | null>(null);

export function useRegistrationStats(): RegistrationStatsContextValue {
  const value = useContext(RegistrationStatsContext);
  if (!value) throw new Error('useRegistrationStats must be used inside EventRegistrationStats');
  return value;
}
