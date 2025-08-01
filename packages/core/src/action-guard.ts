/**
 * @fileoverview Action Guard system for debouncing, throttling and blocking
 * Provides rate limiting and user experience optimization for actions
 */

import type { Logger } from '@context-action/logger';

/**
 * Action guard state tracking
 * @internal
 */
interface GuardState {
  lastExecuted: number;
  debounceTimer?: NodeJS.Timeout;
  throttleTimer?: NodeJS.Timeout;
  isThrottled: boolean;
}

/**
 * Action Guard system for managing action execution timing
 * @internal
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

    let state = this.guards.get(actionKey);
    if (!state) {
      state = {
        lastExecuted: 0,
        isThrottled: false
      };
      this.guards.set(actionKey, state);
    }

    // Clear existing debounce timer
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      this.logger.trace(`Cleared existing debounce timer for '${actionKey}'`);
    }

    // Create new debounce promise
    return new Promise((resolve) => {
      state!.debounceTimer = setTimeout(() => {
        this.logger.trace(`Debounce completed for '${actionKey}'`);
        state!.debounceTimer = undefined;
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

    let state = this.guards.get(actionKey);
    if (!state) {
      state = {
        lastExecuted: 0,
        isThrottled: false
      };
      this.guards.set(actionKey, state);
    }

    const now = Date.now();
    const timeSinceLastExecution = now - state.lastExecuted;

    // If enough time has passed, allow execution
    if (timeSinceLastExecution >= throttleMs) {
      state.lastExecuted = now;
      state.isThrottled = false;
      
      this.logger.trace(`Throttle passed for '${actionKey}'`, {
        timeSinceLastExecution,
        throttleMs
      });
      
      return true;
    }

    // If already throttled, don't set another timer
    if (state.isThrottled) {
      this.logger.trace(`Action '${actionKey}' is already throttled`);
      return false;
    }

    // Set throttle timer for future execution
    state.isThrottled = true;
    const remainingTime = throttleMs - timeSinceLastExecution;
    
    state.throttleTimer = setTimeout(() => {
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
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
      }
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
      }
      this.guards.delete(actionKey);
      
      this.logger.debug(`Cleared guards for '${actionKey}'`);
    }
  }

  /**
   * Clear all guards
   */
  clearAll(): void {
    this.logger.trace('Clearing all action guards');
    
    for (const [, state] of this.guards) {
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
      }
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
      }
    }
    
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