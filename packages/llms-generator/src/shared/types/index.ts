/**
 * Shared Types - Central export for all shared types
 */

// Core domain types
export * from './CoreTypes.js';

// Configuration types
export * from './ConfigTypes.js';

// Result types for better error handling
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface OperationResult<T = void> extends Result<T> {
  message?: string;
  timestamp: Date;
}

// Common utility types
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}