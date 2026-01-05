/**
 * Layout Context
 *
 * React context for custom keyboard layouts.
 * Provides layout state and actions throughout the application.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { useLayouts, type UseLayoutsResult } from './useLayouts';

/**
 * Context for layout management.
 */
const LayoutContext = createContext<UseLayoutsResult | null>(null);

/**
 * Props for LayoutProvider.
 */
interface LayoutProviderProps {
  children: ReactNode;
}

/**
 * Provider component for layout context.
 * Wraps the application to provide layout state to all components.
 */
export function LayoutProvider({ children }: LayoutProviderProps) {
  const layouts = useLayouts();

  return (
    <LayoutContext.Provider value={layouts}>{children}</LayoutContext.Provider>
  );
}

/**
 * Hook to access layout context.
 * @throws Error if used outside LayoutProvider
 */
export function useLayoutContext(): UseLayoutsResult {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }

  return context;
}
