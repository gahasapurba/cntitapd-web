import { createContext, useContext } from 'react';

/** Values returned by useDynamicForm (state, derived data, handlers), shared with the sections of DynamicFormSection. */
export type DynamicFormContextValue = Record<string, any>;

export const DynamicFormContext = createContext<DynamicFormContextValue | null>(null);

export function useDynamicFormContext(): DynamicFormContextValue {
  const value = useContext(DynamicFormContext);
  if (!value) throw new Error('useDynamicFormContext must be used inside DynamicFormSection');
  return value;
}
