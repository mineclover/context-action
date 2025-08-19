/**
 * @fileoverview Action Guard system for debouncing, throttling and blocking
 * 
 * Provides rate limiting and user experience optimization for actions through
 * debouncing (wait for pause) and throttling (limit frequency) mechanisms.
 * Used internally by ActionRegister to control action execution timing.
 */


/**
 * Action guard state tracking for debouncing and throttling
 * 
 * Tracks timing and execution state for action execution control.
 * Maintains separate state for each action to enable independent
 * rate limiting per action type.
 * 
 * @internal
 */
interface GuardState {
  /** Timestamp of last successful execution for throttling calculations */
  lastExecuted: number;
  
  /** Active debounce timer - cleared when new debounce requests arrive */
  debounceTimer?: NodeJS.Timeout;
  
  /** Active throttle timer - tracks when throttle period will end */
  throttleTimer?: NodeJS.Timeout;
  
  /** Flag indicating if action is currently in throttled state */
  isThrottled: boolean;
  
  /** Current debounce promise - reused for concurrent calls */
  debouncePromise?: Promise<boolean>;
  
  /** Resolve function for current debounce promise */
  debounceResolve?: (value: boolean) => void;
}

/**
 * Action Guard system for managing action execution timing
 * 
 * Provides performance optimization and user experience enhancement through
 * debouncing and throttling mechanisms. Debouncing waits for a pause in calls
 * before executing, while throttling limits execution frequency.
 * 
 * @example Debouncing Search Input
 * ```typescript
 * const guard = new ActionGuard()
 * 
 * // Wait 300ms after user stops typing before searching
 * register.register('searchUsers', async (payload, controller) => {
 *   const query = payload.query
 *   if (query.length < 2) return
 *   
 *   const results = await userService.search(query)
 *   controller.setResult(results)
 * }, {
 *   debounce: 300,  // Built into ActionRegister via ActionGuard
 *   tags: ['search', 'user-input']
 * })
 * ```
 * 
 * @example Throttling High-Frequency Events
 * ```typescript
 * // Limit scroll position updates to once per 100ms
 * register.register('updateScrollPosition', (payload, controller) => {
 *   scrollState.setValue(payload.position)
 * }, {
 *   throttle: 100,  // Built into ActionRegister via ActionGuard
 *   tags: ['scroll', 'performance']
 * })
 * ```
 * 
 * @example Manual Usage (Advanced)
 * ```typescript
 * const guard = new ActionGuard()
 * 
 * // Manual debouncing
 * if (await guard.debounce('search', 300)) {
 *   performSearch()  // Only executes after 300ms pause
 * }
 * 
 * // Manual throttling
 * if (guard.throttle('scroll', 100)) {
 *   updateUI()  // Max once per 100ms
 * }
 * ```
 * 
 * @internal
 */
export class ActionGuard {
  private guards = new Map<string, GuardState>();

  constructor() {
    // ActionGuard without logger
  }

  /**
   * Apply debouncing to an action
   * 
   * Debouncing waits for a specified delay after the last call before allowing
   * execution. Each new call resets the timer. Useful for search inputs, resize
   * handlers, and other high-frequency user interactions.
   * 
   * @param actionKey - Unique identifier for the action being debounced
   * @param debounceMs - Delay in milliseconds to wait after the last call
   * 
   * @returns Promise resolving to true if execution should proceed, false if cancelled
   * 
   * @example Search Input Debouncing
   * ```typescript
   * // Only search after user stops typing for 300ms
   * if (await guard.debounce('userSearch', 300)) {
   *   performSearch(query)
 * }
   * ```
   * 
   * @internal
   */
  async debounce(actionKey: string, debounceMs: number): Promise<boolean> {

    /** Get or create guard state for this action */
    let state = this.guards.get(actionKey);
    if (!state) {
      /** Initialize new guard state with default values */
      state = {
        lastExecuted: 0,
        isThrottled: false
      };
      this.guards.set(actionKey, state);
    }

    /** Clear any existing debounce timer to restart the delay period */
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      // Resolve previous debounce with false if exists
      if (state.debounceResolve) {
        state.debounceResolve(false);
        state.debounceResolve = undefined;
      }
    }

    /** Create new debounce promise */
    return new Promise<boolean>((resolve) => {
      // Store new resolve function
      state!.debounceResolve = resolve;
      
      // Set new timer
      state!.debounceTimer = setTimeout(() => {
        /** Clean up timer and resolver references */
        state!.debounceTimer = undefined;
        state!.debounceResolve = undefined;
        /** Update last execution timestamp */
        state!.lastExecuted = Date.now();
        resolve(true);
      }, debounceMs);
    });
  }

  /**
   * Apply throttling to an action
   * 
   * Throttling limits execution frequency by ensuring a minimum interval between
   * calls. Unlike debouncing, throttling executes immediately on the first call
   * and then blocks subsequent calls until the interval expires.
   * 
   * @param actionKey - Unique identifier for the action being throttled
   * @param throttleMs - Minimum interval in milliseconds between executions
   * 
   * @returns True if execution should proceed, false if currently throttled
   * 
   * @example Scroll Handler Throttling
   * ```typescript
   * // Update scroll position max once per 100ms
   * if (guard.throttle('scrollUpdate', 100)) {
   *   updateScrollPosition()
 * }
 * ```
   * 
   * @internal
   */
  throttle(actionKey: string, throttleMs: number): boolean {

    /** Get or create guard state for this action */
    let state = this.guards.get(actionKey);
    if (!state) {
      /** Initialize new guard state with default values */
      state = {
        lastExecuted: 0,
        isThrottled: false
      };
      this.guards.set(actionKey, state);
    }

    const now = Date.now();
    const timeSinceLastExecution = now - state.lastExecuted;

    /** Check if enough time has passed since last execution */
    /** If throttle period has elapsed, allow immediate execution */
    if (timeSinceLastExecution >= throttleMs) {
      /** Update execution timestamp and clear throttled state */
      state.lastExecuted = now;
      state.isThrottled = false;
      
      
      return true;
    }

    /** If already in throttled state, don't create duplicate timers */
    /** This prevents timer accumulation and unnecessary processing */
    if (state.isThrottled) {
      return false;
    }

    /** Set throttle timer to automatically clear the throttled state */
    /** Calculate remaining time until throttle period expires */
    state.isThrottled = true;
    const remainingTime = throttleMs - timeSinceLastExecution;
    
    /** Create timer to reset throttled state when period expires */
    state.throttleTimer = setTimeout(() => {
      /** Clear throttled state and timer reference */
      state!.isThrottled = false;
      state!.throttleTimer = undefined;
    }, remainingTime);


    return false;
  }

  /**
   * Clear all guard state for a specific action
   * 
   * Removes debounce and throttle timers for the specified action,
   * preventing memory leaks and allowing immediate re-execution.
   * 
   * @param actionKey - Action identifier to clear guards for
   * 
   * @internal
   */
  clearGuards(actionKey: string): void {
    
    const state = this.guards.get(actionKey);
    if (state) {
      /** Clear debounce timer if active to prevent memory leaks */
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
        // Cancel waiting debounce calls
        if (state.debounceResolve) {
          state.debounceResolve(false);
        }
      }
      /** Clear throttle timer if active to prevent memory leaks */
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
      }
      /** Remove guard state from memory */
      this.guards.delete(actionKey);
      
    }
  }

  /**
   * Clear all guard states for all actions
   * 
   * Removes all active debounce and throttle timers, useful for cleanup
   * when shutting down the action system or resetting state.
   * 
   * @internal
   */
  clearAll(): void {
    
    /** Iterate through all guard states and clear their timers */
    /** This prevents memory leaks when clearing the entire guard system */
    for (const [, state] of this.guards) {
      /** Clear any active debounce timers */
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
        // Cancel waiting debounce calls
        if (state.debounceResolve) {
          state.debounceResolve(false);
        }
      }
      /** Clear any active throttle timers */
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
      }
    }
    
    /** Remove all guard states from memory */
    this.guards.clear();
  }

  /**
   * Get current guard state for debugging purposes
   * 
   * Returns the internal state for a specific action, including timer
   * information and execution timestamps.
   * 
   * @param actionKey - Action identifier to inspect
   * @returns Guard state or undefined if no state exists
   * 
   * @internal
   */
  getGuardState(actionKey: string): GuardState | undefined {
    return this.guards.get(actionKey);
  }

  /**
   * Get all active guard states for debugging purposes
   * 
   * Returns a copy of all current guard states, useful for monitoring
   * and debugging rate limiting behavior across all actions.
   * 
   * @returns Map of action keys to their guard states
   * 
   * @internal
   */
  getAllGuardStates(): Map<string, GuardState> {
    return new Map(this.guards);
  }
}