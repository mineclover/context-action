/**
 * @fileoverview Validator for glossary mappings
 * Validates mappings against glossary definitions and checks for issues
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type {
  GlossaryMappings,
  GlossaryTerm,
  GlossaryParserOptions,
  ValidationIssue,
  ValidationReport
} from './types.js';

/**
 * Validator for glossary mappings
 */
export class GlossaryValidator {
  private options: GlossaryParserOptions;
  private glossaryTerms: Map<string, GlossaryTerm>;
  private validCategories: Set<string>;
  private errors: ValidationIssue[];
  private warnings: ValidationIssue[];

  constructor(options: GlossaryParserOptions) {
    this.options = options;
    this.glossaryTerms = new Map();
    this.validCategories = new Set();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate mappings against glossary definitions
   * @param {GlossaryMappings} mappings - The mappings to validate
   * @returns {Promise<ValidationReport>} Validation report
   */
  async validate(mappings: GlossaryMappings): Promise<ValidationReport> {
    // Reset state
    this.errors = [];
    this.warnings = [];
    this.glossaryTerms.clear();
    this.validCategories.clear();

    // Load glossary terms
    await this.loadGlossaryTerms();

    // Run validations
    this.validateTermExistence(mappings);
    this.validateCategories(mappings);
    this.validateDuplicates(mappings);
    this.validateOrphanedTerms(mappings);

    // Generate report
    return this.generateReport(mappings);
  }

  /**
   * Load glossary terms from markdown files
   * @private
   */
  private async loadGlossaryTerms(): Promise<void> {
    for (const [category, relativePath] of Object.entries(this.options.glossaryPaths)) {
      this.validCategories.add(category);
      
      const fullPath = path.resolve(this.options.rootDir, relativePath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const parsed = matter(content);
        
        const terms = this.extractTermsFromMarkdown(parsed.content, category);
        for (const term of terms) {
          this.glossaryTerms.set(term.slug, term);
        }
      } else {
        this.warnings.push({
          type: 'ORPHANED_TERM',
          severity: 'warning',
          message: `Glossary file not found: ${relativePath}`
        });
      }
    }
  }

  /**
   * Extract terms from markdown content
   * @private
   */
  private extractTermsFromMarkdown(content: string, category: string): GlossaryTerm[] {
    const terms: GlossaryTerm[] = [];
    const lines = content.split('\n');
    
    let currentTerm: string | null = null;
    let currentDefinition: string[] = [];
    
    for (const line of lines) {
      // ## headers indicate terms
      if (line.startsWith('## ') && !line.startsWith('### ')) {
        // Save previous term
        if (currentTerm) {
          const slug = this.termToSlug(currentTerm);
          terms.push({
            slug,
            name: currentTerm,
            definition: currentDefinition.join(' ').trim() || 'No definition provided.',
            category
          });
        }
        
        // Start new term
        currentTerm = line.substring(3).trim();
        currentDefinition = [];
      } else if (currentTerm && line.trim() && !line.startsWith('#')) {
        currentDefinition.push(line.trim());
      }
    }
    
    // Save last term
    if (currentTerm) {
      const slug = this.termToSlug(currentTerm);
      terms.push({
        slug,
        name: currentTerm,
        definition: currentDefinition.join(' ').trim() || 'No definition provided.',
        category
      });
    }
    
    return terms;
  }

  /**
   * Convert term name to slug
   * @private
   */
  private termToSlug(term: string): string {
    return term
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Validate that all mapped terms exist in glossary
   * @private
   */
  private validateTermExistence(mappings: GlossaryMappings): void {
    for (const [term, implementations] of Object.entries(mappings.terms)) {
      if (!this.glossaryTerms.has(term)) {
        for (const impl of implementations) {
          this.errors.push({
            type: 'TERM_NOT_FOUND',
            severity: 'error',
            file: impl.file,
            line: impl.line,
            method: impl.name,
            term,
            message: `Term '${term}' is not defined in glossary`
          });
        }
      }
    }
  }

  /**
   * Validate that all categories are valid
   * @private
   */
  private validateCategories(mappings: GlossaryMappings): void {
    for (const [term, implementations] of Object.entries(mappings.terms)) {
      for (const impl of implementations) {
        for (const category of impl.memberOf) {
          if (!this.validCategories.has(category)) {
            this.errors.push({
              type: 'INVALID_CATEGORY',
              severity: 'error',
              file: impl.file,
              line: impl.line,
              method: impl.name,
              term: category,
              message: `Invalid category '${category}'. Valid categories: ${Array.from(this.validCategories).join(', ')}`
            });
          }
        }
      }
    }
  }

  /**
   * Check for duplicate mappings
   * @private
   */
  private validateDuplicates(mappings: GlossaryMappings): void {
    const seen = new Map<string, string[]>();
    
    for (const [term, implementations] of Object.entries(mappings.terms)) {
      for (const impl of implementations) {
        const key = `${impl.file}:${impl.name}`;
        
        if (!seen.has(key)) {
          seen.set(key, []);
        }
        
        seen.get(key)!.push(term);
      }
    }
    
    // Report duplicates
    for (const [key, terms] of seen) {
      if (terms.length > 1) {
        const [file, method] = key.split(':');
        this.warnings.push({
          type: 'DUPLICATE_MAPPING',
          severity: 'warning',
          file,
          method,
          message: `${method} in ${file} implements multiple terms: ${terms.join(', ')}`
        });
      }
    }
  }

  /**
   * Find glossary terms with no implementations
   * @private
   */
  private validateOrphanedTerms(mappings: GlossaryMappings): void {
    const mappedTerms = new Set(Object.keys(mappings.terms));
    
    for (const [slug, term] of this.glossaryTerms) {
      if (!mappedTerms.has(slug)) {
        this.warnings.push({
          type: 'ORPHANED_TERM',
          severity: 'info',
          term: slug,
          message: `Glossary term '${term.name}' has no implementations`
        });
      }
    }
  }

  /**
   * Generate validation report
   * @private
   */
  private generateReport(mappings: GlossaryMappings): ValidationReport {
    const totalGlossaryTerms = this.glossaryTerms.size;
    const mappedTerms = Object.keys(mappings.terms).length;
    const implementationRate = totalGlossaryTerms > 0
      ? Math.round((mappedTerms / totalGlossaryTerms) * 100)
      : 0;

    return {
      success: this.errors.length === 0,
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        totalIssues: this.errors.length + this.warnings.length,
        glossaryTerms: totalGlossaryTerms,
        mappedTerms,
        implementationRate
      },
      details: {
        errors: this.errors,
        warnings: this.warnings
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Print validation report to console
   * @param {ValidationReport} report - The validation report
   */
  printReport(report: ValidationReport): void {
    console.log('\n📋 Validation Report:');
    
    if (report.success) {
      console.log('✅ All validations passed!');
    } else {
      console.log(`❌ Found ${report.summary.errors} errors`);
    }
    
    if (report.summary.warnings > 0) {
      console.log(`⚠️  Found ${report.summary.warnings} warnings`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Glossary terms: ${report.summary.glossaryTerms}`);
    console.log(`  Mapped terms: ${report.summary.mappedTerms} (${report.summary.implementationRate}%)`);
    
    // Print errors
    if (report.details.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of report.details.errors.slice(0, 10)) {
        console.log(`  ${error.file}:${error.line} - ${error.message}`);
      }
      if (report.details.errors.length > 10) {
        console.log(`  ... and ${report.details.errors.length - 10} more`);
      }
    }
    
    // Print warnings
    if (report.details.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of report.details.warnings.slice(0, 5)) {
        console.log(`  ${warning.message}`);
      }
      if (report.details.warnings.length > 5) {
        console.log(`  ... and ${report.details.warnings.length - 5} more`);
      }
    }
  }
}