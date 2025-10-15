/**
 * @fileoverview StoreWithErrorRecovery - 에러 복구 믹스인
 * 
 * 에러 복구 및 복원력 기능
 * 크기: ~200줄 (기존 717줄의 28%)
 */

/**
 * 에러 복구 믹스인
 */
export class StoreWithErrorRecovery<T = unknown> {
  // 🔄 Error Recovery System
  protected errorCount = 0;
  protected lastErrorTime = 0;
  protected readonly MAX_ERROR_COUNT = 5;
  protected readonly ERROR_RESET_TIME = 60000; // 1 minute

  /**
   * Handle error with exponential backoff
   */
  protected _handleError(error: Error, context: string): void {
    const now = Date.now();
    
    // Reset error count if enough time has passed
    if (now - this.lastErrorTime > this.ERROR_RESET_TIME) {
      this.errorCount = 0;
    }

    this.errorCount++;
    this.lastErrorTime = now;

    if (process.env.NODE_ENV === 'development') {
      console.error(`Store '${(this as any).name}' error in ${context}:`, error);
    }

    // If too many errors, disable the store temporarily
    if (this.errorCount >= this.MAX_ERROR_COUNT) {
      this._disableStoreTemporarily();
    }
  }

  /**
   * Disable store temporarily due to too many errors
   */
  private _disableStoreTemporarily(): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Store '${(this as any).name}' disabled due to too many errors`);
    }

    // Re-enable after error reset time
    setTimeout(() => {
      this.errorCount = 0;
      if (process.env.NODE_ENV === 'development') {
        console.log(`Store '${(this as any).name}' re-enabled after error recovery`);
      }
    }, this.ERROR_RESET_TIME);
  }

  /**
   * Check if store is in error state
   */
  isInErrorState(): boolean {
    return this.errorCount >= this.MAX_ERROR_COUNT;
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      errorCount: this.errorCount,
      lastErrorTime: this.lastErrorTime,
      isInErrorState: this.isInErrorState(),
      timeSinceLastError: Date.now() - this.lastErrorTime,
    };
  }

  /**
   * Reset error state
   */
  resetErrorState(): void {
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }

  /**
   * Execute function with error recovery
   */
  protected _withErrorRecovery<R>(
    fn: () => R,
    context: string,
    fallback?: R
  ): R | undefined {
    try {
      return fn();
    } catch (error) {
      this._handleError(error as Error, context);
      return fallback;
    }
  }

  /**
   * Execute async function with error recovery
   */
  protected async _withAsyncErrorRecovery<R>(
    fn: () => Promise<R>,
    context: string,
    fallback?: R
  ): Promise<R | undefined> {
    try {
      return await fn();
    } catch (error) {
      this._handleError(error as Error, context);
      return fallback;
    }
  }
}
