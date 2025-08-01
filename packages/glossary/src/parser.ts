/**
 * @fileoverview JSDoc parser for glossary mapping system
 * Uses comment-parser to extract standard JSDoc tags
 */

import { parse, Block, Spec } from 'comment-parser';
import type { ParsedComment } from './types.js';

/**
 * Custom spec for parsing @implements tags
 */
const implementsSpec: Spec = {
  tag: 'implements',
  name: 'namepath',
  type: '',
  optional: false,
  description: '',
  problems: [],
  source: []
};

/**
 * Custom spec for parsing @memberof tags
 */
const memberOfSpec: Spec = {
  tag: 'memberof',
  name: 'namepath',
  type: '',
  optional: false,
  description: '',
  problems: [],
  source: []
};

/**
 * Parses JSDoc comments to extract glossary-related information
 */
export class GlossaryParser {
  /**
   * Parse a JSDoc comment block
   * @param {string} comment - The JSDoc comment string
   * @returns {ParsedComment | null} Parsed comment data or null if invalid
   */
  parseComment(comment: string): ParsedComment | null {
    try {
      const parsed = parse(comment, {
        spacing: 'preserve'
      });

      if (!parsed.length) {
        return null;
      }

      const block = parsed[0];
      return this.extractGlossaryInfo(block);
    } catch (error) {
      console.warn('Failed to parse comment:', error);
      return null;
    }
  }

  /**
   * Extract glossary information from a parsed comment block
   * @private
   */
  private extractGlossaryInfo(block: Block): ParsedComment {
    const result: ParsedComment = {
      source: block,
      description: block.description,
      implements: [],
      memberOf: [],
      examples: [],
      tags: {}
    };

    for (const tag of block.tags) {
      switch (tag.tag) {
        case 'implements':
          // Extract term from @implements {TermName} or @implements TermName
          // If type is set, use it (for @implements {TypeName} format)
          // Otherwise use name (for @implements TypeName format)
          const termSource = tag.type || tag.name;
          if (termSource) {
            const term = this.normalizeTermName(termSource);
            result.implements.push(term);
          }
          break;

        case 'memberof':
        case 'memberOf':
          // Extract category from @memberof CategoryName
          if (tag.name) {
            const category = this.normalizeCategoryName(tag.name);
            result.memberOf.push(category);
          }
          break;

        case 'example':
          // Collect example code blocks
          const exampleContent = [tag.name, tag.description].filter(Boolean).join(' ');
          if (exampleContent) {
            result.examples.push(exampleContent);
          }
          break;

        case 'since':
          // Version information
          result.since = tag.name || tag.description;
          break;

        default:
          // Collect other tags
          if (!result.tags[tag.tag]) {
            result.tags[tag.tag] = [];
          }
          const value = [tag.name, tag.description].filter(Boolean).join(' ');
          if (value) {
            result.tags[tag.tag].push(value);
          }
      }
    }

    // Also check for custom @glossary tags for backward compatibility
    if (result.tags.glossary) {
      for (const terms of result.tags.glossary) {
        const termList = terms.split(',').map(t => this.normalizeTermName(t.trim()));
        result.implements.push(...termList);
      }
    }

    if (result.tags.category) {
      for (const categories of result.tags.category) {
        const catList = categories.split(',').map(c => this.normalizeCategoryName(c.trim()));
        result.memberOf.push(...catList);
      }
    }

    return result;
  }

  /**
   * Debug helper to log all tags found in a comment
   * @param {Block} block - Parsed comment block
   * @param {boolean} verbose - Whether to show detailed tag content
   */
  debugTags(block: Block, verbose: boolean = false): void {
    console.log('\n🏷️  JSDoc Tags Debug:');
    console.log(`Total tags found: ${block.tags.length}`);
    
    if (block.tags.length === 0) {
      console.log('   No tags found in this comment');
      return;
    }

    // Group tags by type
    const tagGroups: Record<string, any[]> = {};
    for (const tag of block.tags) {
      if (!tagGroups[tag.tag]) {
        tagGroups[tag.tag] = [];
      }
      tagGroups[tag.tag].push(tag);
    }

    // Display grouped tags
    for (const [tagType, tags] of Object.entries(tagGroups)) {
      console.log(`   @${tagType} (${tags.length}):`, 
        tags.map(t => verbose ? 
          `{name: "${t.name}", type: "${t.type}", desc: "${t.description}"}` : 
          (t.type || t.name || t.description)
        ).join(', ')
      );
    }
  }

  /**
   * Normalize a term name to kebab-case
   * @private
   */
  private normalizeTermName(term: string): string {
    return term
      .trim()
      // Convert PascalCase/camelCase to kebab-case
      .replace(/([A-Z])/g, (match, letter, index) => {
        return index === 0 ? letter.toLowerCase() : '-' + letter.toLowerCase();
      })
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Normalize a category name to kebab-case
   * @private
   */
  private normalizeCategoryName(category: string): string {
    return category
      .trim()
      // Convert PascalCase/camelCase to kebab-case
      .replace(/([A-Z])/g, (match, letter, index) => {
        return index === 0 ? letter.toLowerCase() : '-' + letter.toLowerCase();
      })
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Extract all JSDoc comments from source code
   * @param {string} source - Source code content
   * @returns {string[]} Array of JSDoc comment strings
   */
  extractComments(source: string): string[] {
    const comments: string[] = [];
    const jsDocPattern = /\/\*\*[\s\S]*?\*\//g;
    
    let match;
    while ((match = jsDocPattern.exec(source)) !== null) {
      comments.push(match[0]);
    }
    
    return comments;
  }

  /**
   * Parse all comments in a source file
   * @param {string} source - Source code content
   * @param {boolean} debugMode - Enable debug output for all JSDoc tags
   * @param {boolean} collectStats - Collect tag statistics even without debug mode
   * @returns {object} Object containing parsed comments and tag statistics
   */
  parseFile(source: string, debugMode: boolean = false, collectStats: boolean = false): {
    comments: ParsedComment[];
    tagStats: Record<string, number>;
  } {
    const comments = this.extractComments(source);
    const parsed: ParsedComment[] = [];
    const allTagStats: Record<string, number> = {};

    if (debugMode) {
      console.log(`\n📄 Parsing ${comments.length} JSDoc comments...`);
    }

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const result = this.parseComment(comment);
      
      if (result) {
        if (debugMode) {
          console.log(`\n--- Comment ${i + 1} ---`);
          this.debugTags(result.source);
        }
        
        // Always collect tag statistics when requested
        if (debugMode || collectStats) {
          for (const tag of result.source.tags) {
            allTagStats[tag.tag] = (allTagStats[tag.tag] || 0) + 1;
          }
        }

        if (result.implements.length > 0 || result.memberOf.length > 0) {
          parsed.push(result);
        }
      }
    }

    if (debugMode && Object.keys(allTagStats).length > 0) {
      console.log('\n📊 JSDoc Tag Statistics:');
      const sortedStats = Object.entries(allTagStats)
        .sort(([,a], [,b]) => b - a);
      
      for (const [tag, count] of sortedStats) {
        console.log(`   @${tag}: ${count} occurrences`);
      }
    }

    return {
      comments: parsed,
      tagStats: allTagStats
    };
  }
}