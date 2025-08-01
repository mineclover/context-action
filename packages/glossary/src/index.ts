/**
 * @fileoverview Context-Action Glossary Mapping System
 * Provides tools for mapping code implementations to glossary terms using standard JSDoc
 * 
 * @module @context-action/glossary
 */

export * from './types.js';
export * from './parser.js';
export * from './scanner.js';
export * from './validator.js';
export * from './config.js';

import { GlossaryParser } from './parser.js';
import { GlossaryScanner } from './scanner.js';
import { GlossaryValidator } from './validator.js';
import { loadConfig, validateConfig, printConfigSummary } from './config.js';
import type { GlossaryParserOptions, GlossaryMappings, ValidationReport } from './types.js';

/**
 * Main API for glossary mapping operations
 */
export class GlossaryAPI {
  private options: GlossaryParserOptions;

  constructor(options: GlossaryParserOptions) {
    this.options = options;
  }

  /**
   * Scan source files and extract glossary mappings
   * @returns {Promise<GlossaryMappings>} The extracted mappings
   */
  async scan(): Promise<GlossaryMappings> {
    const scanner = new GlossaryScanner(this.options);
    return scanner.scan();
  }

  /**
   * Validate mappings against glossary definitions
   * @param {GlossaryMappings} mappings - The mappings to validate
   * @returns {Promise<ValidationReport>} Validation report
   */
  async validate(mappings: GlossaryMappings): Promise<ValidationReport> {
    const validator = new GlossaryValidator(this.options);
    return validator.validate(mappings);
  }

  /**
   * Scan and validate in one operation
   * @returns {Promise<{ mappings: GlossaryMappings; validation: ValidationReport }>} Results
   */
  async scanAndValidate(): Promise<{
    mappings: GlossaryMappings;
    validation: ValidationReport;
  }> {
    const mappings = await this.scan();
    const validation = await this.validate(mappings);
    return { mappings, validation };
  }
}

/**
 * Create a new glossary API instance with configuration loading
 * @param {Partial<GlossaryParserOptions> | string} optionsOrConfigPath - Configuration options or config file path
 * @returns {Promise<GlossaryAPI>} API instance
 */
export async function createGlossaryAPI(
  optionsOrConfigPath?: Partial<GlossaryParserOptions> | string
): Promise<GlossaryAPI> {
  let options: GlossaryParserOptions;
  
  if (typeof optionsOrConfigPath === 'string') {
    // Load from config file
    options = await loadConfig(optionsOrConfigPath);
  } else if (optionsOrConfigPath && typeof optionsOrConfigPath === 'object') {
    // Merge with loaded config for backward compatibility
    const defaultConfig = await loadConfig();
    options = { ...defaultConfig, ...optionsOrConfigPath };
  } else {
    // Load default config
    options = await loadConfig();
  }
  
  // Validate configuration
  const errors = validateConfig(options);
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  // Print configuration summary if debug mode
  if (options.debug) {
    printConfigSummary(options);
  }
  
  return new GlossaryAPI(options);
}

/**
 * Create a new glossary API instance with direct options (legacy support)
 * @param {GlossaryParserOptions} options - Configuration options
 * @returns {GlossaryAPI} API instance
 */
export function createGlossaryAPISync(options: GlossaryParserOptions): GlossaryAPI {
  return new GlossaryAPI(options);
}