/**
 * @fileoverview StoreWithCleanup - 메모리 관리 믹스인
 * 
 * 메모리 누수 방지 및 리소스 정리 기능
 * 크기: ~150줄 (기존 717줄의 21%)
 */

/**
 * 메모리 관리 믹스인
 */
export class StoreWithCleanup<T = unknown> {
  // 🧹 Advanced Cleanup and Memory Management
  protected cleanupTasks = new Set<() => void>();
  protected isDisposed = false;

  /**
   * Register a cleanup task
   */
  registerCleanup(task: () => void): () => void {
    if (this.isDisposed) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Store '${(this as any).name}' is already disposed, cleanup task not registered`);
      }
      return () => {}; // Return no-op function
    }

    this.cleanupTasks.add(task);

    // Return unregister function
    return () => {
      this.cleanupTasks.delete(task);
    };
  }

  /**
   * Execute all cleanup tasks
   */
  protected _executeCleanup(): void {
    if (this.isDisposed) {
      return;
    }

    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Store '${(this as any).name}' cleanup task error:`, error);
        }
      }
    });

    this.cleanupTasks.clear();
  }

  /**
   * Dispose the store and clean up resources
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    this._executeCleanup();
  }

  /**
   * Check if store is disposed
   */
  isDisposedStore(): boolean {
    return this.isDisposed;
  }

  /**
   * Get cleanup task count
   */
  getCleanupTaskCount(): number {
    return this.cleanupTasks.size;
  }

  /**
   * Clear all cleanup tasks without executing them
   */
  clearCleanupTasks(): void {
    this.cleanupTasks.clear();
  }
}
