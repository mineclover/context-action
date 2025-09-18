/**
 * Utility functions for the test-driven documentation system
 */

import path from 'path';
import { ExampleCategory, ComplexityLevel } from '../types/index.js';

/**
 * Format API name for file output
 */
export function formatApiName(apiName: string): string {
  return apiName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: ExampleCategory): string {
  const categoryNames: Record<ExampleCategory, string> = {
    'basic-usage': 'Basic Usage',
    'advanced-patterns': 'Advanced Patterns',
    'error-handling': 'Error Handling',
    'performance': 'Performance',
    'integration': 'Integration',
    'async-patterns': 'Async Patterns'
  };

  return categoryNames[category] || category;
}

/**
 * Get category description for documentation
 */
export function getCategoryDescription(category: ExampleCategory): string {
  const descriptions: Record<ExampleCategory, string> = {
    'basic-usage': 'Simple, everyday usage patterns for getting started',
    'advanced-patterns': 'Complex scenarios and advanced use cases',
    'error-handling': 'Proper error handling and recovery patterns',
    'performance': 'Performance optimization and best practices',
    'integration': 'Integration with other systems and libraries',
    'async-patterns': 'Asynchronous operations and Promise handling'
  };

  return descriptions[category] || 'Additional usage patterns';
}

/**
 * Get complexity description
 */
export function getComplexityDescription(complexity: ComplexityLevel): string {
  const descriptions: Record<ComplexityLevel, string> = {
    simple: 'Easy to understand and implement',
    moderate: 'Intermediate level with some complexity',
    complex: 'Advanced usage requiring careful consideration'
  };

  return descriptions[complexity];
}

/**
 * Sanitize file path for cross-platform compatibility
 */
export function sanitizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * Extract package name from file path
 */
export function extractPackageName(filePath: string): string {
  const parts = filePath.split('/');
  const packagesIndex = parts.indexOf('packages');

  if (packagesIndex !== -1 && packagesIndex + 1 < parts.length) {
    return parts[packagesIndex + 1];
  }

  return 'unknown';
}

/**
 * Generate relative path between two files
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(path.dirname(from), to).replace(/\\/g, '/');
}

/**
 * Check if a string is a valid API pattern
 */
export function isValidApiPattern(code: string): boolean {
  const apiPatterns = [
    /ActionRegister/,
    /createActionContext/,
    /createStoreContext/,
    /useActionHandler/,
    /useStoreValue/,
    /useStoreSelector/,
    /createStore/,
    /StoreManager/
  ];

  return apiPatterns.some(pattern => pattern.test(code));
}

/**
 * Extract meaningful code lines (remove empty lines and comments)
 */
export function extractMeaningfulLines(code: string): string[] {
  return code
    .split('\\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      if (line.startsWith('//')) return false;
      if (line.startsWith('/*') || line.startsWith('*')) return false;
      return true;
    });
}

/**
 * Calculate code metrics
 */
export function calculateCodeMetrics(code: string): {
  lines: number;
  meaningfulLines: number;
  asyncOperations: number;
  conditionals: number;
  loops: number;
} {
  const lines = code.split('\\n').length;
  const meaningfulLines = extractMeaningfulLines(code).length;
  const asyncOperations = (code.match(/await|Promise|async/g) || []).length;
  const conditionals = (code.match(/if|else|switch|case|\?/g) || []).length;
  const loops = (code.match(/for|while|forEach|map|filter|reduce/g) || []).length;

  return {
    lines,
    meaningfulLines,
    asyncOperations,
    conditionals,
    loops
  };
}

/**
 * Validate configuration object
 */
export function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.packagesDir || typeof config.packagesDir !== 'string') {
    errors.push('packagesDir must be a valid string path');
  }

  if (!config.packages || !Array.isArray(config.packages) || config.packages.length === 0) {
    errors.push('packages must be a non-empty array of package names');
  }

  if (!config.outputDir || typeof config.outputDir !== 'string') {
    errors.push('outputDir must be a valid string path');
  }

  if (!config.languages || !Array.isArray(config.languages) || config.languages.length === 0) {
    errors.push('languages must be a non-empty array of language codes');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate unique identifier for examples
 */
export function generateExampleId(description: string, packageName: string): string {
  const cleanDesc = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

  return `${packageName}-${cleanDesc}`;
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  Object.keys(source).forEach(key => {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  });

  return result;
}