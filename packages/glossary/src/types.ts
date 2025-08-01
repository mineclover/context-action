/**
 * @fileoverview Type definitions for the glossary mapping system
 */

import type { Block } from 'comment-parser';

/**
 * Represents a glossary term definition
 */
export interface GlossaryTerm {
  /** The term identifier (kebab-case) */
  slug: string;
  /** The human-readable term name */
  name: string;
  /** The term definition */
  definition: string;
  /** The category this term belongs to */
  category: string;
}

/**
 * Represents a code implementation that maps to glossary terms
 */
export interface CodeImplementation {
  /** File path relative to project root */
  file: string;
  /** Method, class, or constant name */
  name: string;
  /** Implementation type */
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum';
  /** Line number in the file */
  line: number;
  /** Optional description from JSDoc */
  description?: string;
  /** Glossary terms this implements */
  implements: string[];
  /** Category memberships */
  memberOf: string[];
  /** Optional code examples */
  examples: string[];
  /** Version when this was added */
  since?: string;
  /** Function or class signature */
  signature?: string;
  /** Last modified timestamp */
  lastModified: string;
}

/**
 * Mapping data structure for all glossary mappings
 */
export interface GlossaryMappings {
  /** Mappings by term slug */
  terms: Record<string, CodeImplementation[]>;
  /** Terms by category */
  categories: Record<string, string[]>;
  /** Files and their mapped terms */
  files: Record<string, {
    terms: string[];
    lastScanned: string;
  }>;
  /** Overall statistics */
  statistics: {
    totalTerms: number;
    mappedTerms: number;
    unmappedTerms: number;
    totalFiles: number;
    taggedFiles: number;
    lastUpdate: string;
  };
}

/**
 * Options for the glossary parser
 */
export interface GlossaryParserOptions {
  /** Paths to scan for source files */
  scanPaths: string[];
  /** Paths to exclude from scanning */
  excludePaths: string[];
  /** Glossary file paths by category */
  glossaryPaths: Record<string, string>;
  /** Root directory for resolving paths */
  rootDir: string;
  /** Whether to include examples in output */
  includeExamples?: boolean;
  /** Whether to parse function signatures */
  parseSignatures?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Parsed JSDoc comment with glossary information
 */
export interface ParsedComment {
  /** Original comment block */
  source: Block;
  /** Main description */
  description: string;
  /** Implements tags (glossary terms) */
  implements: string[];
  /** MemberOf tags (categories) */
  memberOf: string[];
  /** Example code blocks */
  examples: string[];
  /** Since version */
  since?: string;
  /** Additional tags */
  tags: Record<string, string[]>;
}

/**
 * Validation error or warning
 */
export interface ValidationIssue {
  /** Issue type */
  type: 'TERM_NOT_FOUND' | 'INVALID_CATEGORY' | 'DUPLICATE_MAPPING' | 'ORPHANED_TERM';
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** File where issue was found */
  file?: string;
  /** Line number */
  line?: number;
  /** Method or class name */
  method?: string;
  /** Related term or category */
  term?: string;
  /** Error message */
  message: string;
}

/**
 * Validation report
 */
export interface ValidationReport {
  /** Whether validation passed without errors */
  success: boolean;
  /** Summary statistics */
  summary: {
    errors: number;
    warnings: number;
    totalIssues: number;
    glossaryTerms: number;
    mappedTerms: number;
    implementationRate: number;
  };
  /** Detailed issues */
  details: {
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
  };
  /** Timestamp */
  timestamp: string;
}