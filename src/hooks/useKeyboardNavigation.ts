/**
 * useKeyboardNavigation Hook
 *
 * A reusable hook for integrating keyboard navigation into components.
 * Handles focus area registration, item management, and provides props
 * for rendering focusable items.
 *
 * @module hooks/useKeyboardNavigation
 */

import { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  useKeyboardNavigationContext,
  type FocusAreaLayout,
  type FocusableItem,
} from './KeyboardNavigationContext';

/**
 * Item configuration for keyboard navigation.
 */
export interface NavigationItem {
  /** Unique identifier for the item */
  id: string;
  /** Callback when the item is activated (Enter key or click) */
  onActivate?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
}

/**
 * Options for useKeyboardNavigation hook.
 */
export interface UseKeyboardNavigationOptions {
  /** Unique ID for this focus area */
  areaId: string;
  /** Layout type for navigation within this area */
  layout: FocusAreaLayout;
  /** Number of columns for grid layout */
  gridColumns?: number;
  /** Items that can be focused in this area */
  items: NavigationItem[];
  /** Custom handler for Escape key */
  onEscape?: () => void;
  /** Whether navigation wraps around at edges (default: true) */
  wrapAround?: boolean;
  /** Whether keyboard navigation is enabled for this area (default: true) */
  enabled?: boolean;
  /** Adjacent area ID when pressing Left */
  leftArea?: string;
  /** Adjacent area ID when pressing Right */
  rightArea?: string;
}

/**
 * Props returned by getItemProps to spread on focusable elements.
 */
export interface ItemProps {
  /** Data attribute indicating keyboard focus state */
  'data-keyboard-focus': boolean;
  /** CSS class for styling */
  className: string;
  /** Tab index for focus management */
  tabIndex: number;
  /** Click handler that activates the item */
  onClick: () => void;
  /** Accessibility: indicates selection state */
  'aria-selected'?: boolean;
  /** Accessibility: indicates disabled state */
  'aria-disabled'?: boolean;
}

/**
 * Result of useKeyboardNavigation hook.
 */
export interface UseKeyboardNavigationResult {
  /** Get props to spread on a focusable item element */
  getItemProps: (itemId: string, additionalClassName?: string) => ItemProps;
  /** The ID of the currently focused item, or null */
  focusedItemId: string | null;
  /** Whether this area is currently active */
  isAreaActive: boolean;
  /** Whether keyboard navigation mode is active */
  isKeyboardNavActive: boolean;
  /** Manually set this area as active */
  activate: () => void;
}

/**
 * Hook for integrating keyboard navigation into a component.
 *
 * @example
 * ```tsx
 * function MyList({ items, onSelect }) {
 *   const navItems = items.map(item => ({
 *     id: item.id,
 *     onActivate: () => onSelect(item),
 *     disabled: item.disabled,
 *   }));
 *
 *   const { getItemProps, focusedItemId } = useKeyboardNavigation({
 *     areaId: 'my-list',
 *     layout: 'vertical',
 *     items: navItems,
 *   });
 *
 *   return (
 *     <ul>
 *       {items.map(item => (
 *         <li key={item.id} {...getItemProps(item.id)}>
 *           {item.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useKeyboardNavigation({
  areaId,
  layout,
  gridColumns,
  items,
  onEscape,
  wrapAround = true,
  enabled = true,
  leftArea,
  rightArea,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationResult {
  const {
    state,
    registerArea,
    unregisterArea,
    updateAreaItems,
    setActiveArea,
    isItemFocused,
  } = useKeyboardNavigationContext();

  // Track if this is the first render to handle initial registration
  const isRegisteredRef = useRef(false);

  // Convert items to FocusableItem format
  const focusableItems: FocusableItem[] = useMemo(() => {
    return items.map(item => ({
      id: item.id,
      onActivate: item.onActivate,
      disabled: item.disabled,
    }));
  }, [items]);

  // Store the latest focusableItems and onEscape in refs to avoid re-registration
  // when these values change (which would cause focus to jump away from this area)
  const focusableItemsRef = useRef(focusableItems);
  focusableItemsRef.current = focusableItems;

  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  // Track whether onEscape is provided (for dependency purposes)
  const hasOnEscape = !!onEscape;

  // Create a stable onEscape wrapper that calls the latest ref value
  const stableOnEscape = useCallback(() => {
    onEscapeRef.current?.();
  }, []);

  // Register area on mount, unregister on unmount
  // Note: We use refs for focusableItems and onEscape to avoid re-registering
  // when these values change (which would cause focus to jump away from this area)
  useEffect(() => {
    if (!enabled) {
      if (isRegisteredRef.current) {
        unregisterArea(areaId);
        isRegisteredRef.current = false;
      }
      return;
    }

    registerArea({
      id: areaId,
      items: focusableItemsRef.current,
      layout,
      gridColumns,
      onEscape: hasOnEscape ? stableOnEscape : undefined,
      leftArea,
      rightArea,
    });
    isRegisteredRef.current = true;

    return () => {
      unregisterArea(areaId);
      isRegisteredRef.current = false;
    };
  }, [areaId, enabled, layout, gridColumns, leftArea, rightArea, registerArea, unregisterArea, stableOnEscape, hasOnEscape]);

  // Update items when they change (after initial registration)
  useEffect(() => {
    if (enabled && isRegisteredRef.current) {
      updateAreaItems(areaId, focusableItems);
    }
  }, [areaId, focusableItems, updateAreaItems, enabled]);

  // Check if this area is active
  const isAreaActive = state.activeAreaId === areaId;
  const isKeyboardNavActive = state.isKeyboardNavActive;

  // Find the currently focused item ID
  const focusedItemId = useMemo(() => {
    if (!isAreaActive || !isKeyboardNavActive) return null;

    const area = state.areas.get(areaId);
    if (!area) return null;

    const enabledItems = area.items.filter(item => !item.disabled);
    const focusedItem = enabledItems[state.focusIndex];
    return focusedItem?.id ?? null;
  }, [isAreaActive, isKeyboardNavActive, state.areas, state.focusIndex, areaId]);

  // Activate this area
  const activate = useCallback(() => {
    setActiveArea(areaId);
  }, [setActiveArea, areaId]);

  // Get props for a focusable item
  const getItemProps = useCallback((itemId: string, additionalClassName?: string): ItemProps => {
    const item = items.find(i => i.id === itemId);
    const isFocused = isItemFocused(areaId, itemId);
    const isDisabled = item?.disabled ?? false;

    const classNames = ['keyboard-focus'];
    if (additionalClassName) {
      classNames.push(additionalClassName);
    }

    return {
      'data-keyboard-focus': isFocused,
      className: classNames.join(' '),
      tabIndex: -1, // Managed focus, not browser tab focus
      onClick: () => {
        if (!isDisabled && item?.onActivate) {
          item.onActivate();
        }
      },
      'aria-selected': isFocused,
      'aria-disabled': isDisabled,
    };
  }, [items, isItemFocused, areaId]);

  return {
    getItemProps,
    focusedItemId,
    isAreaActive,
    isKeyboardNavActive,
    activate,
  };
}

export default useKeyboardNavigation;
