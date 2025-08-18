/**
 * Validation Utils - Common validation functions
 */

export class ValidationUtils {
  static isValidLanguage(language: string, supportedLanguages: string[]): boolean {
    return supportedLanguages.includes(language);
  }

  static isValidCharacterLimit(limit: number, validLimits: number[]): boolean {
    return validLimits.includes(limit);
  }

  static isValidPattern(pattern: string, validPatterns: string[]): boolean {
    return validPatterns.includes(pattern);
  }

  static validateRequired<T>(value: T | undefined | null, fieldName: string): T {
    if (value === undefined || value === null) {
      throw new Error(`${fieldName} is required`);
    }
    return value;
  }

  static validateFileExists(filePath: string): boolean {
    try {
      const fs = require('fs');
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  static validateRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}, got ${value}`);
    }
  }
}