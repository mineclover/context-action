/**
 * @fileoverview Action Guard system for debouncing, throttling and blocking
 * Provides rate limiting and user experience optimization for actions
 */

import type { Logger } from '@context-action/logger';

/**
 * Action guard state tracking for debouncing and throttling
 * @implements guard-state
 * @implements timing-control
 * @memberof core-concepts
 * @internal
 * @since 1.0.0
 * 
 * Tracks timing and execution state for action execution control
 * @implements timing-control
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
}

/**
 * Action Guard system for managing action execution timing
 * @implements action-guard
 * @implements performance-optimization  
 * @implements user-experience-optimization
 * @implements class-naming
 * @memberof core-concepts
 * @internal
 * @since 1.0.0
 * 
 * Manages action execution timing through debouncing and throttling
 * @implements performance-optimization
 * 
 * @example
 * ```typescript
 * const guard = new ActionGuard(logger);
 * 
 * // Debounce search input (wait 300ms after typing stops)
 * if (await guard.debounce('search', 300)) {
 *   executeSearch();  
 * }
 * 
 * // Throttle scroll handler (max once per 100ms)
 * if (guard.throttle('scroll', 100)) {
 *   updateScrollPosition();
 * }
 * ```
 */
export class ActionGuard {
  private guards = new Map<string, GuardState>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Check if action should be debounced
   * @param actionKey - Unique key for the action
   * @param debounceMs - Debounce delay in milliseconds
   * @returns Promise that resolves when debounce period is complete
   */
  async debounce(actionKey: string, debounceMs: number): Promise<boolean> {
    this.logger.trace(`Checking debounce for '${actionKey}'`, { debounceMs });

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
    /** This implements the "debounce" behavior where rapid calls reset the timer */
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      this.logger.trace(`Cleared existing debounce timer for '${actionKey}'`);
    }

    /** Create new debounce promise that resolves after the delay period */
    /** The promise will only resolve if no new debounce requests arrive */
    return new Promise((resolve) => {
      state!.debounceTimer = setTimeout(() => {
        this.logger.trace(`Debounce completed for '${actionKey}'`);
        /** Clean up timer reference to prevent memory leaks */
        state!.debounceTimer = undefined;
        /** Update last execution timestamp for throttling calculations */
        state!.lastExecuted = Date.now();
        resolve(true);
      }, debounceMs);
      
      this.logger.trace(`Set debounce timer for '${actionKey}'`, { delay: debounceMs });
    });
  }

  /**
   * Check if action should be throttled
   * @param actionKey - Unique key for the action
   * @param throttleMs - Throttle delay in milliseconds
   * @returns True if action should proceed, false if throttled
   */
  throttle(actionKey: string, throttleMs: number): boolean {
    this.logger.trace(`Checking throttle for '${actionKey}'`, { throttleMs });

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
      
      this.logger.trace(`Throttle passed for '${actionKey}'`, {
        timeSinceLastExecution,
        throttleMs
      });
      
      return true;
    }

    /** If already in throttled state, don't create duplicate timers */
    /** This prevents timer accumulation and unnecessary processing */
    if (state.isThrottled) {
      this.logger.trace(`Action '${actionKey}' is already throttled`);
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
      this.logger.trace(`Throttle period ended for '${actionKey}'`);
    }, remainingTime);

    this.logger.trace(`Action '${actionKey}' throttled`, {
      timeSinceLastExecution,
      remainingTime
    });

    return false;
  }

  /**
   * Clear all guards for an action
   * @param actionKey - Action key to clear
   */
  clearGuards(actionKey: string): void {
    this.logger.trace(`Clearing guards for '${actionKey}'`);
    
    const state = this.guards.get(actionKey);
    if (state) {
      /** Clear debounce timer if active to prevent memory leaks */
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
      }
      /** Clear throttle timer if active to prevent memory leaks */
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
      }
      /** Remove guard state from memory */
      this.guards.delete(actionKey);
      
      this.logger.debug(`Cleared guards for '${actionKey}'`);
    }
  }

  /**
   * Clear all guards
   */
  clearAll(): void {
    this.logger.trace('Clearing all action guards');
    
    /** Iterate through all guard states and clear their timers */
    /** This prevents memory leaks when clearing the entire guard system */
    for (const [, state] of this.guards) {
      /** Clear any active debounce timers */
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
      }
      /** Clear any active throttle timers */
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
      }
    }
    
    /** Remove all guard states from memory */
    this.guards.clear();
    this.logger.debug('Cleared all action guards');
  }

  /**
   * Get current guard state for debugging
   * @param actionKey - Action key to inspect
   */
  getGuardState(actionKey: string): GuardState | undefined {
    return this.guards.get(actionKey);
  }

  /**
   * Get all active guards for debugging
   */
  getAllGuardStates(): Map<string, GuardState> {
    return new Map(this.guards);
  }
}