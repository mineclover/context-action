/**
 * @fileoverview Source code scanner for glossary mapping
 * Scans TypeScript/JavaScript files and extracts glossary mappings
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { GlossaryParser } from './parser.js';
import type { 
  GlossaryParserOptions, 
  GlossaryMappings, 
  CodeImplementation,
  ParsedComment 
} from './types.js';

/**
 * Scanner for extracting glossary mappings from source code
 */
export class GlossaryScanner {
  private parser: GlossaryParser;
  private options: GlossaryParserOptions;
  private mappings: GlossaryMappings;

  constructor(options: GlossaryParserOptions) {
    this.parser = new GlossaryParser();
    this.options = options;
    this.mappings = this.initializeMappings();
  }

  /**
   * Initialize empty mappings structure
   * @private
   */
  private initializeMappings(): GlossaryMappings {
    return {
      terms: {},
      categories: {},
      files: {},
      statistics: {
        totalTerms: 0,
        mappedTerms: 0,
        unmappedTerms: 0,
        totalFiles: 0,
        taggedFiles: 0,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * Scan all source files and extract mappings
   * @returns {Promise<GlossaryMappings>} The extracted mappings
   */
  async scan(): Promise<GlossaryMappings> {
    if (this.options.debug) {
      console.log('🔍 Starting glossary scan...');
    }

    const files = await this.findSourceFiles();
    
    if (this.options.debug) {
      console.log(`Found ${files.length} files to scan`);
    }

    for (const file of files) {
      await this.scanFile(file);
    }

    this.calculateStatistics();

    if (this.options.debug) {
      console.log('✅ Scan completed');
      this.printSummary();
    }

    return this.mappings;
  }

  /**
   * Find all source files to scan
   * @private
   */
  private async findSourceFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.options.scanPaths) {
      const files = await glob(pattern, {
        cwd: this.options.rootDir,
        ignore: this.options.excludePaths,
        absolute: true
      });
      allFiles.push(...files);
    }

    // Remove duplicates
    return [...new Set(allFiles)];
  }

  /**
   * Scan a single file for glossary mappings
   * @private
   */
  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.options.rootDir, filePath);
      
      // Parse the file
      const parsedComments = this.parser.parseFile(content);
      
      // Extract declarations (simplified - in real implementation would use AST)
      const declarations = this.extractDeclarations(content, parsedComments);
      
      if (declarations.length > 0) {
        this.addFileMappings(relativePath, declarations);
        
        if (this.options.debug) {
          console.log(`✓ ${relativePath}: ${declarations.length} mappings`);
        }
      }
      
      this.mappings.statistics.totalFiles++;
      
    } catch (error) {
      if (this.options.debug) {
        console.warn(`⚠ Failed to scan ${filePath}:`, error);
      }
    }
  }

  /**
   * Extract declarations from parsed comments
   * @private
   */
  private extractDeclarations(
    content: string, 
    comments: ParsedComment[]
  ): CodeImplementation[] {
    const implementations: CodeImplementation[] = [];
    const lines = content.split('\n');

    for (const comment of comments) {
      // Find the declaration after the comment
      const commentEndLine = this.getCommentEndLine(content, comment.source.source);
      const declaration = this.findDeclarationAfterLine(lines, commentEndLine);
      
      if (declaration) {
        const impl: CodeImplementation = {
          file: '', // Will be set by addFileMappings
          name: declaration.name,
          type: declaration.type,
          line: declaration.line,
          description: comment.description,
          implements: comment.implements,
          memberOf: comment.memberOf,
          examples: comment.examples,
          since: comment.since,
          signature: declaration.signature,
          lastModified: new Date().toISOString()
        };
        
        implementations.push(impl);
      }
    }

    return implementations;
  }

  /**
   * Get the line number where a comment ends
   * @private
   */
  private getCommentEndLine(content: string, commentSource: any): number {
    const lines = content.split('\n');
    
    // Handle different comment source formats
    let sourceText: string;
    if (typeof commentSource === 'string') {
      sourceText = commentSource;
    } else if (commentSource && Array.isArray(commentSource.source)) {
      // comment-parser Block has source as array of source lines
      sourceText = commentSource.source.map((s: any) => s.source).join('\n');
    } else if (commentSource && typeof commentSource.source === 'string') {
      sourceText = commentSource.source;
    } else {
      // Fallback: search for comment patterns
      return 0;
    }
    
    if (!sourceText) return 0;
    
    const commentLines = sourceText.split('\n');
    const lastCommentLine = commentLines[commentLines.length - 1];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(lastCommentLine)) {
        return i + 1;
      }
    }
    
    return 0;
  }

  /**
   * Find declaration after a given line
   * @private
   */
  private findDeclarationAfterLine(
    lines: string[], 
    startLine: number
  ): { name: string; type: CodeImplementation['type']; line: number; signature?: string } | null {
    // Simple regex-based detection (in real implementation would use AST)
    const patterns = [
      { regex: /export\s+function\s+(\w+)/, type: 'function' as const },
      { regex: /export\s+const\s+(\w+)/, type: 'const' as const },
      { regex: /export\s+class\s+(\w+)/, type: 'class' as const },
      { regex: /export\s+interface\s+(\w+)/, type: 'interface' as const },
      { regex: /export\s+type\s+(\w+)/, type: 'type' as const },
      { regex: /export\s+enum\s+(\w+)/, type: 'enum' as const },
      { regex: /function\s+(\w+)/, type: 'function' as const },
      { regex: /const\s+(\w+)/, type: 'const' as const },
      { regex: /class\s+(\w+)/, type: 'class' as const },
      { regex: /interface\s+(\w+)/, type: 'interface' as const },
      { regex: /type\s+(\w+)/, type: 'type' as const },
      { regex: /enum\s+(\w+)/, type: 'enum' as const }
    ];

    for (let i = startLine; i < Math.min(startLine + 10, lines.length); i++) {
      const line = lines[i];
      
      for (const { regex, type } of patterns) {
        const match = line.match(regex);
        if (match) {
          return {
            name: match[1],
            type,
            line: i + 1,
            signature: this.options.parseSignatures ? line.trim() : undefined
          };
        }
      }
    }

    return null;
  }

  /**
   * Add file mappings to the overall mappings
   * @private
   */
  private addFileMappings(filePath: string, implementations: CodeImplementation[]): void {
    this.mappings.files[filePath] = {
      terms: [],
      lastScanned: new Date().toISOString()
    };

    for (const impl of implementations) {
      impl.file = filePath;
      
      // Add to term mappings
      for (const term of impl.implements) {
        if (!this.mappings.terms[term]) {
          this.mappings.terms[term] = [];
        }
        this.mappings.terms[term].push(impl);
        this.mappings.files[filePath].terms.push(term);
      }
      
      // Add to category mappings
      for (const category of impl.memberOf) {
        if (!this.mappings.categories[category]) {
          this.mappings.categories[category] = [];
        }
        
        for (const term of impl.implements) {
          if (!this.mappings.categories[category].includes(term)) {
            this.mappings.categories[category].push(term);
          }
        }
      }
    }

    if (implementations.length > 0) {
      this.mappings.statistics.taggedFiles++;
    }
  }

  /**
   * Calculate final statistics
   * @private
   */
  private calculateStatistics(): void {
    this.mappings.statistics.mappedTerms = Object.keys(this.mappings.terms).length;
    this.mappings.statistics.lastUpdate = new Date().toISOString();
  }

  /**
   * Print scan summary
   * @private
   */
  private printSummary(): void {
    const stats = this.mappings.statistics;
    console.log('\n📊 Scan Summary:');
    console.log(`Files scanned: ${stats.totalFiles}`);
    console.log(`Files with mappings: ${stats.taggedFiles}`);
    console.log(`Terms mapped: ${stats.mappedTerms}`);
    console.log(`Categories: ${Object.keys(this.mappings.categories).length}`);
  }
}