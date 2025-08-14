/**
 * Utility functions for LLMS Generator
 */

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format execution time in human readable format
 */
export function formatExecutionTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Validate language code
 */
export function isValidLanguage(language: string, supportedLanguages: string[]): boolean {
  return supportedLanguages.includes(language);
}

/**
 * Validate character limit
 */
export function isValidCharacterLimit(limit: number, supportedLimits: number[]): boolean {
  return supportedLimits.includes(limit) || (limit >= 100 && limit <= 50000);
}

/**
 * Generate unique timestamp ID
 */
export function generateTimestampId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}