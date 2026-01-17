/**
 * Keyboard Navigation Context
 *
 * React context for keyboard-based navigation throughout the application.
 * Manages focus areas, navigation between areas, and keyboard event handling.
 *
 * Navigation Keys:
 * - Arrow Up/Down: Navigate within a focus area
 * - Arrow Left/Right: Switch between focus areas
 * - Enter: Activate the currently focused item
 * - Escape: Go back (close modal, return to previous view)
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

/**
 * Layout type for navigation within a focus area.
 */
export type FocusAreaLayout = 'vertical' | 'horizontal' | 'grid';

/**
 * A focusable item within an area.
 */
export interface FocusableItem {
  id: string;
  onActivate?: () => void;
  disabled?: boolean;
}

/**
 * Configuration for a focus area.
 */
export interface FocusArea {
  id: string;
  items: FocusableItem[];
  layout: FocusAreaLayout;
  gridColumns?: number;
  onEscape?: () => void;
  /** Adjacent area to focus when pressing Left */
  leftArea?: string;
  /** Adjacent area to focus when pressing Right */
  rightArea?: string;
}

/**
 * Navigation state.
 */
interface KeyboardNavigationState {
  /** Currently active focus area ID */
  activeAreaId: string | null;
  /** Index of the focused item within the active area */
  focusIndex: number;
  /** Registered focus areas */
  areas: Map<string, FocusArea>;
  /** Stack of previously active areas for back navigation */
  backStack: string[];
  /** Whether keyboard navigation mode is active */
  isKeyboardNavActive: boolean;
}

/**
 * Actions for the navigation reducer.
 */
type NavigationAction =
  | { type: 'REGISTER_AREA'; area: FocusArea }
  | { type: 'UNREGISTER_AREA'; areaId: string }
  | { type: 'UPDATE_AREA_ITEMS'; areaId: string; items: FocusableItem[] }
  | { type: 'SET_ACTIVE_AREA'; areaId: string | null; pushToStack?: boolean }
  | { type: 'SET_FOCUS_INDEX'; index: number }
  | { type: 'MOVE_FOCUS'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'GO_BACK' }
  | { type: 'SET_KEYBOARD_NAV_ACTIVE'; active: boolean }
  | { type: 'CLEAR_BACK_STACK' };

/**
 * Initial navigation state.
 */
const initialState: KeyboardNavigationState = {
  activeAreaId: null,
  focusIndex: 0,
  areas: new Map(),
  backStack: [],
  isKeyboardNavActive: false,
};

/**
 * Calculate new focus index based on movement direction and layout.
 */
function calculateNewIndex(
  currentIndex: number,
  itemCount: number,
  direction: 'up' | 'down' | 'left' | 'right',
  layout: FocusAreaLayout,
  gridColumns: number = 3,
  wrapAround: boolean = true
): number {
  if (itemCount === 0) return 0;

  let newIndex = currentIndex;

  if (layout === 'vertical') {
    if (direction === 'up') {
      newIndex = currentIndex - 1;
    } else if (direction === 'down') {
      newIndex = currentIndex + 1;
    }
  } else if (layout === 'horizontal') {
    if (direction === 'left') {
      newIndex = currentIndex - 1;
    } else if (direction === 'right') {
      newIndex = currentIndex + 1;
    }
  } else if (layout === 'grid') {
    if (direction === 'up') {
      newIndex = currentIndex - gridColumns;
    } else if (direction === 'down') {
      newIndex = currentIndex + gridColumns;
    } else if (direction === 'left') {
      newIndex = currentIndex - 1;
    } else if (direction === 'right') {
      newIndex = currentIndex + 1;
    }
  }

  // Handle wrap-around
  if (wrapAround) {
    if (newIndex < 0) {
      newIndex = itemCount - 1;
    } else if (newIndex >= itemCount) {
      newIndex = 0;
    }
  } else {
    newIndex = Math.max(0, Math.min(newIndex, itemCount - 1));
  }

  return newIndex;
}

/**
 * Navigation reducer.
 */
function navigationReducer(
  state: KeyboardNavigationState,
  action: NavigationAction
): KeyboardNavigationState {
  switch (action.type) {
    case 'REGISTER_AREA': {
      const newAreas = new Map(state.areas);
      newAreas.set(action.area.id, action.area);

      // If no active area, set this as active
      const activeAreaId = state.activeAreaId ?? action.area.id;

      return {
        ...state,
        areas: newAreas,
        activeAreaId,
        focusIndex: activeAreaId === action.area.id ? 0 : state.focusIndex,
      };
    }

    case 'UNREGISTER_AREA': {
      const newAreas = new Map(state.areas);
      newAreas.delete(action.areaId);

      // If unregistering the active area, try to find another
      let newActiveAreaId = state.activeAreaId;
      if (state.activeAreaId === action.areaId) {
        const remainingAreas = Array.from(newAreas.keys());
        newActiveAreaId = remainingAreas.length > 0 ? remainingAreas[0] : null;
      }

      return {
        ...state,
        areas: newAreas,
        activeAreaId: newActiveAreaId,
        focusIndex: newActiveAreaId !== state.activeAreaId ? 0 : state.focusIndex,
      };
    }

    case 'UPDATE_AREA_ITEMS': {
      const existingArea = state.areas.get(action.areaId);
      if (!existingArea) return state;

      const newAreas = new Map(state.areas);
      newAreas.set(action.areaId, { ...existingArea, items: action.items });

      // Clamp focus index if needed
      let newFocusIndex = state.focusIndex;
      if (state.activeAreaId === action.areaId) {
        newFocusIndex = Math.min(state.focusIndex, Math.max(0, action.items.length - 1));
      }

      return {
        ...state,
        areas: newAreas,
        focusIndex: newFocusIndex,
      };
    }

    case 'SET_ACTIVE_AREA': {
      const newBackStack = action.pushToStack && state.activeAreaId
        ? [...state.backStack, state.activeAreaId]
        : state.backStack;

      return {
        ...state,
        activeAreaId: action.areaId,
        focusIndex: 0,
        backStack: newBackStack,
        isKeyboardNavActive: true,
      };
    }

    case 'SET_FOCUS_INDEX': {
      return {
        ...state,
        focusIndex: action.index,
        isKeyboardNavActive: true,
      };
    }

    case 'MOVE_FOCUS': {
      const activeArea = state.activeAreaId ? state.areas.get(state.activeAreaId) : null;
      if (!activeArea) return state;

      const enabledItems = activeArea.items.filter(item => !item.disabled);
      if (enabledItems.length === 0) return state;

      // For area switching (left/right in vertical layout, up/down could be used for grid areas)
      if (activeArea.layout === 'vertical') {
        if (action.direction === 'left' && activeArea.leftArea) {
          // Only switch if the target area is registered
          if (state.areas.has(activeArea.leftArea)) {
            return {
              ...state,
              activeAreaId: activeArea.leftArea,
              focusIndex: 0,
              isKeyboardNavActive: true,
            };
          }
        }
        if (action.direction === 'right' && activeArea.rightArea) {
          // Only switch if the target area is registered
          if (state.areas.has(activeArea.rightArea)) {
            return {
              ...state,
              activeAreaId: activeArea.rightArea,
              focusIndex: 0,
              isKeyboardNavActive: true,
            };
          }
        }
      }

      // For horizontal layout, left/right switches areas when at edges
      if (activeArea.layout === 'horizontal') {
        if (action.direction === 'left' && state.focusIndex === 0 && activeArea.leftArea) {
          // Only switch if the target area is registered
          if (state.areas.has(activeArea.leftArea)) {
            return {
              ...state,
              activeAreaId: activeArea.leftArea,
              focusIndex: 0,
              isKeyboardNavActive: true,
            };
          }
        }
        const lastIndex = enabledItems.length - 1;
        if (action.direction === 'right' && state.focusIndex === lastIndex && activeArea.rightArea) {
          // Only switch if the target area is registered
          if (state.areas.has(activeArea.rightArea)) {
            return {
              ...state,
              activeAreaId: activeArea.rightArea,
              focusIndex: 0,
              isKeyboardNavActive: true,
            };
          }
        }
      }

      // Calculate new index within the current area
      const newIndex = calculateNewIndex(
        state.focusIndex,
        enabledItems.length,
        action.direction,
        activeArea.layout,
        activeArea.gridColumns,
        true // wrap around
      );

      // Skip disabled items
      let finalIndex = newIndex;
      const originalIndex = newIndex;
      const itemsCount = activeArea.items.length;
      let attempts = 0;

      while (activeArea.items[finalIndex]?.disabled && attempts < itemsCount) {
        if (action.direction === 'up' || action.direction === 'left') {
          finalIndex = finalIndex - 1 < 0 ? itemsCount - 1 : finalIndex - 1;
        } else {
          finalIndex = (finalIndex + 1) % itemsCount;
        }
        attempts++;
      }

      // If all items are disabled, stay at current
      if (attempts >= itemsCount) {
        finalIndex = originalIndex;
      }

      return {
        ...state,
        focusIndex: finalIndex,
        isKeyboardNavActive: true,
      };
    }

    case 'GO_BACK': {
      if (state.backStack.length > 0) {
        const previousArea = state.backStack[state.backStack.length - 1];
        return {
          ...state,
          activeAreaId: previousArea,
          focusIndex: 0,
          backStack: state.backStack.slice(0, -1),
        };
      }
      return state;
    }

    case 'SET_KEYBOARD_NAV_ACTIVE': {
      return {
        ...state,
        isKeyboardNavActive: action.active,
      };
    }

    case 'CLEAR_BACK_STACK': {
      return {
        ...state,
        backStack: [],
      };
    }

    default:
      return state;
  }
}

/**
 * Context value interface.
 */
export interface KeyboardNavigationContextValue {
  /** Current navigation state */
  state: KeyboardNavigationState;
  /** Register a focus area */
  registerArea: (area: FocusArea) => void;
  /** Unregister a focus area */
  unregisterArea: (areaId: string) => void;
  /** Update items in an area */
  updateAreaItems: (areaId: string, items: FocusableItem[]) => void;
  /** Set the active focus area */
  setActiveArea: (areaId: string | null, pushToStack?: boolean) => void;
  /** Set focus index directly */
  setFocusIndex: (index: number) => void;
  /** Move focus in a direction */
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
  /** Activate the currently focused item */
  activateCurrentItem: () => void;
  /** Go back to the previous area */
  goBack: () => void;
  /** Clear the back navigation stack */
  clearBackStack: () => void;
  /** Check if an item is currently keyboard-focused */
  isItemFocused: (areaId: string, itemId: string) => boolean;
}

/**
 * Keyboard navigation context.
 */
const KeyboardNavigationContext = createContext<KeyboardNavigationContextValue | null>(null);

/**
 * Props for KeyboardNavigationProvider.
 */
interface KeyboardNavigationProviderProps {
  children: ReactNode;
}

/**
 * Provider component for keyboard navigation context.
 */
export function KeyboardNavigationProvider({ children }: KeyboardNavigationProviderProps) {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  const registerArea = useCallback((area: FocusArea) => {
    dispatch({ type: 'REGISTER_AREA', area });
  }, []);

  const unregisterArea = useCallback((areaId: string) => {
    dispatch({ type: 'UNREGISTER_AREA', areaId });
  }, []);

  const updateAreaItems = useCallback((areaId: string, items: FocusableItem[]) => {
    dispatch({ type: 'UPDATE_AREA_ITEMS', areaId, items });
  }, []);

  const setActiveArea = useCallback((areaId: string | null, pushToStack: boolean = false) => {
    dispatch({ type: 'SET_ACTIVE_AREA', areaId, pushToStack });
  }, []);

  const setFocusIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_FOCUS_INDEX', index });
  }, []);

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    dispatch({ type: 'MOVE_FOCUS', direction });
  }, []);

  const activateCurrentItem = useCallback(() => {
    const activeArea = state.activeAreaId ? state.areas.get(state.activeAreaId) : null;
    if (!activeArea) return;

    const enabledItems = activeArea.items.filter(item => !item.disabled);
    const currentItem = enabledItems[state.focusIndex];
    if (currentItem?.onActivate) {
      currentItem.onActivate();
    }
  }, [state.activeAreaId, state.areas, state.focusIndex]);

  const goBack = useCallback(() => {
    // First check if the current area has a custom escape handler
    const activeArea = state.activeAreaId ? state.areas.get(state.activeAreaId) : null;
    if (activeArea?.onEscape) {
      activeArea.onEscape();
      return;
    }

    // Otherwise, use the back stack
    dispatch({ type: 'GO_BACK' });
  }, [state.activeAreaId, state.areas]);

  const clearBackStack = useCallback(() => {
    dispatch({ type: 'CLEAR_BACK_STACK' });
  }, []);

  const isItemFocused = useCallback((areaId: string, itemId: string): boolean => {
    if (!state.isKeyboardNavActive) return false;
    if (state.activeAreaId !== areaId) return false;

    const area = state.areas.get(areaId);
    if (!area) return false;

    const enabledItems = area.items.filter(item => !item.disabled);
    const focusedItem = enabledItems[state.focusIndex];
    return focusedItem?.id === itemId;
  }, [state.activeAreaId, state.areas, state.focusIndex, state.isKeyboardNavActive]);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.isContentEditable;

      // For chord input, let it through
      if (isInputElement && !target.classList.contains('chord-input--hidden')) {
        return;
      }

      // Handle navigation keys
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveFocus('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus('right');
          break;
        case 'Enter':
          // Don't prevent default - let existing handlers work
          // Only activate if we have an active area and keyboard nav is active
          if (state.isKeyboardNavActive && state.activeAreaId) {
            activateCurrentItem();
          }
          break;
        case 'Escape':
          e.preventDefault();
          goBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveFocus, activateCurrentItem, goBack, state.isKeyboardNavActive, state.activeAreaId]);

  // Deactivate keyboard nav on mouse click
  useEffect(() => {
    const handleMouseDown = () => {
      dispatch({ type: 'SET_KEYBOARD_NAV_ACTIVE', active: false });
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const contextValue = useMemo((): KeyboardNavigationContextValue => ({
    state,
    registerArea,
    unregisterArea,
    updateAreaItems,
    setActiveArea,
    setFocusIndex,
    moveFocus,
    activateCurrentItem,
    goBack,
    clearBackStack,
    isItemFocused,
  }), [
    state,
    registerArea,
    unregisterArea,
    updateAreaItems,
    setActiveArea,
    setFocusIndex,
    moveFocus,
    activateCurrentItem,
    goBack,
    clearBackStack,
    isItemFocused,
  ]);

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      <div className={state.isKeyboardNavActive ? 'keyboard-navigation-active' : ''}>
        {children}
      </div>
      {/* Screen reader announcer */}
      <div
        id="keyboard-nav-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
    </KeyboardNavigationContext.Provider>
  );
}

/**
 * Hook to access keyboard navigation context.
 * @throws Error if used outside KeyboardNavigationProvider
 */
export function useKeyboardNavigationContext(): KeyboardNavigationContextValue {
  const context = useContext(KeyboardNavigationContext);

  if (!context) {
    throw new Error('useKeyboardNavigationContext must be used within a KeyboardNavigationProvider');
  }

  return context;
}
