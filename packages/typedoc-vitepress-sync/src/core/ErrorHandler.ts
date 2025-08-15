/**
 * @fileoverview Comprehensive error handling with recovery strategies
 */

import type { 
  ErrorInfo, 
  WarningInfo, 
  ErrorSummary, 
  ErrorRecoveryStrategies,
  Logger 
} from '../types/index.js'

export class ErrorHandler {
  private errors: ErrorInfo[] = []
  private warnings: WarningInfo[] = []
  private logger?: Logger

  private recoveryStrategies: ErrorRecoveryStrategies = {
    'ENOENT': {
      message: 'File or directory not found',
      action: () => null // Skip and continue
    },
    'EACCES': {
      message: 'Permission denied',
      action: () => {
        this.logger?.warn('💡 Tip: Check file permissions or run with appropriate privileges')
        return null
      }
    },
    'ENOSPC': {
      message: 'No space left on device',
      action: () => {
        this.logger?.error('💡 Tip: Free up disk space and try again')
        process.exit(1)
      }
    },
    'EMFILE': {
      message: 'Too many open files',
      action: () => {
        this.logger?.warn('💡 Tip: Reduce batch size or increase system file limits')
        return null
      }
    },
    'EISDIR': {
      message: 'Expected file but found directory',
      action: () => {
        this.logger?.warn('💡 Tip: Check file paths in configuration')
        return null
      }
    },
    'ENOTDIR': {
      message: 'Expected directory but found file',
      action: () => {
        this.logger?.warn('💡 Tip: Check directory paths in configuration')
        return null
      }
    }
  }

  constructor(logger?: Logger) {
    this.logger = logger
  }

  /**
   * Handle error with context and recovery strategy
   */
  handleError(error: Error, context: string): any {
    const errorInfo: ErrorInfo = {
      message: error.message,
      code: (error as any).code,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    }

    this.errors.push(errorInfo)
    this.logger?.error(`❌ ${context}: ${error.message}`)

    // Attempt recovery if strategy exists
    const strategy = this.getRecoveryStrategy(errorInfo.code)
    if (strategy) {
      this.logger?.info(`🔧 Recovery: ${strategy.message}`)
      return strategy.action()
    }

    return null
  }

  /**
   * Add warning with context
   */
  addWarning(message: string, context: string): void {
    const warningInfo: WarningInfo = {
      message,
      context,
      timestamp: new Date().toISOString()
    }

    this.warnings.push(warningInfo)
    this.logger?.warn(`⚠️ ${context}: ${message}`)
  }

  /**
   * Get recovery strategy for error code
   */
  private getRecoveryStrategy(errorCode?: string): ErrorRecoveryStrategies[string] | undefined {
    if (!errorCode) return undefined
    return this.recoveryStrategies[errorCode]
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(errorCode: string, strategy: ErrorRecoveryStrategies[string]): void {
    this.recoveryStrategies[errorCode] = strategy
  }

  /**
   * Get error and warning summary
   */
  getSummary(): ErrorSummary {
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
      details: {
        errors: this.errors,
        warnings: this.warnings
      }
    }
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * Check if there are any warnings
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0
  }

  /**
   * Get errors by context
   */
  getErrorsByContext(context: string): ErrorInfo[] {
    return this.errors.filter(error => error.context === context)
  }

  /**
   * Get warnings by context
   */
  getWarningsByContext(context: string): WarningInfo[] {
    return this.warnings.filter(warning => warning.context === context)
  }

  /**
   * Clear all errors and warnings
   */
  clear(): void {
    this.errors = []
    this.warnings = []
  }

  /**
   * Get most recent errors
   */
  getRecentErrors(count: number = 5): ErrorInfo[] {
    return this.errors.slice(-count)
  }

  /**
   * Get most recent warnings
   */
  getRecentWarnings(count: number = 5): WarningInfo[] {
    return this.warnings.slice(-count)
  }

  /**
   * Filter errors by error code
   */
  getErrorsByCode(code: string): ErrorInfo[] {
    return this.errors.filter(error => error.code === code)
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { [code: string]: number } {
    const stats: { [code: string]: number } = {}
    
    for (const error of this.errors) {
      const code = error.code || 'UNKNOWN'
      stats[code] = (stats[code] || 0) + 1
    }
    
    return stats
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: Error): boolean {
    const code = (error as any).code
    return code ? this.recoveryStrategies.hasOwnProperty(code) : false
  }

  /**
   * Format error for display
   */
  formatError(error: ErrorInfo): string {
    const timestamp = new Date(error.timestamp).toLocaleTimeString()
    return `[${timestamp}] ${error.context}: ${error.message}${error.code ? ` (${error.code})` : ''}`
  }

  /**
   * Format warning for display
   */
  formatWarning(warning: WarningInfo): string {
    const timestamp = new Date(warning.timestamp).toLocaleTimeString()
    return `[${timestamp}] ${warning.context}: ${warning.message}`
  }

  /**
   * Export errors and warnings to JSON
   */
  export(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      timestamp: new Date().toISOString()
    }, null, 2)
  }
}