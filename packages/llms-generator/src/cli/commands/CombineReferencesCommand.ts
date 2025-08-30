/**
 * Combine References Command
 * 
 * Parses a source document to find cross-references and combines all referenced documents
 * into a single unified document. Supports Markdown link parsing and flexible reference patterns.
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { CLIConfig } from '../types/CLITypes.js';

export interface CombineReferencesOptions {
  sourceDocument: string;
  outputPath?: string;
  includeSource?: boolean;
  maxDepth?: number;
  pattern?: 'standard' | 'clean' | 'minimal';
  dryRun?: boolean;
  verbose?: boolean;
  followNestedReferences?: boolean;
}

export interface ParsedReference {
  text: string;
  url: string;
  type: 'local' | 'relative' | 'absolute';
  resolvedPath?: string;
  exists?: boolean;
  content?: string;
}

export interface CombineResult {
  sourceDocument: string;
  outputPath?: string;
  totalReferences: number;
  validReferences: number;
  combinedContent: string;
  references: ParsedReference[];
  errors: string[];
}

export class CombineReferencesCommand {
  constructor(private config: CLIConfig) {}

  async execute(options: CombineReferencesOptions): Promise<void> {
    console.log('🔗 Combining referenced documents...\n');

    if (options.dryRun) {
      console.log('🔍 DRY RUN - No files will be created\n');
    }

    const validatedOptions = this.validateOptions(options);
    
    try {
      const result = await this.combineReferences(validatedOptions);
      
      if (options.verbose || options.dryRun) {
        this.displayReferences(result.references);
      }

      if (options.dryRun) {
        this.displayDryRunSummary(result, validatedOptions);
        return;
      }

      if (result.outputPath) {
        await this.writeOutput(result.combinedContent, result.outputPath);
        this.displayResults(result);
      }

    } catch (error) {
      console.error('❌ Error combining references:', error);
      throw error;
    }
  }

  private validateOptions(options: CombineReferencesOptions): Required<CombineReferencesOptions> {
    if (!options.sourceDocument) {
      throw new Error('Source document path is required');
    }

    const includeSource = options.includeSource !== false;
    const maxDepth = options.maxDepth || 1;
    const pattern = options.pattern || 'standard';
    const dryRun = options.dryRun || false;
    const verbose = options.verbose || false;
    const followNestedReferences = options.followNestedReferences || false;

    // Generate output path if not provided
    let outputPath = options.outputPath;
    if (!outputPath) {
      const sourceBasename = path.basename(options.sourceDocument, '.md');
      // Use llms/ directory with -combined suffix
      const llmsDir = 'llms';
      outputPath = path.join(llmsDir, `${sourceBasename}-combined.md`);
    }

    return {
      sourceDocument: options.sourceDocument,
      outputPath,
      includeSource,
      maxDepth,
      pattern,
      dryRun,
      verbose,
      followNestedReferences
    };
  }

  private async combineReferences(options: Required<CombineReferencesOptions>): Promise<CombineResult> {
    const errors: string[] = [];
    const processedPaths = new Set<string>();
    
    // Read source document
    const sourceContent = await this.readDocument(options.sourceDocument);
    if (!sourceContent) {
      throw new Error(`Cannot read source document: ${options.sourceDocument}`);
    }

    // Parse references from source document
    const references = this.parseReferences(sourceContent, options.sourceDocument);
    
    // Resolve and load referenced documents
    const resolvedReferences = await this.resolveReferences(references, options.sourceDocument);
    
    // Load content for valid references
    const loadedReferences: ParsedReference[] = [];
    for (const ref of resolvedReferences) {
      if (ref.exists && ref.resolvedPath && !processedPaths.has(ref.resolvedPath)) {
        try {
          const content = await this.readDocument(ref.resolvedPath);
          if (content) {
            ref.content = content;
            loadedReferences.push(ref);
            processedPaths.add(ref.resolvedPath);

            // Process nested references if enabled
            if (options.followNestedReferences && options.maxDepth > 1) {
              const nestedRefs = await this.processNestedReferences(
                ref.resolvedPath, 
                content, 
                options.maxDepth - 1, 
                processedPaths
              );
              loadedReferences.push(...nestedRefs);
            }
          }
        } catch (error) {
          errors.push(`Failed to load ${ref.resolvedPath}: ${error}`);
        }
      }
    }

    // Generate combined content
    const combinedContent = this.generateCombinedContent(
      sourceContent,
      loadedReferences,
      options
    );

    return {
      sourceDocument: options.sourceDocument,
      outputPath: options.outputPath,
      totalReferences: references.length,
      validReferences: loadedReferences.length,
      combinedContent,
      references: resolvedReferences,
      errors
    };
  }

  private async readDocument(filePath: string): Promise<string | null> {
    try {
      let fullPath = filePath;
      
      // If not absolute, try different resolution strategies
      if (!path.isAbsolute(fullPath)) {
        // First try relative to current working directory
        let resolvedPath = path.resolve(process.cwd(), filePath);
        try {
          await fs.access(resolvedPath);
          fullPath = resolvedPath;
        } catch {
          // Then try relative to docs directory
          const docsDir = path.resolve(process.cwd(), this.config.paths.docsDir);
          resolvedPath = path.resolve(docsDir, filePath);
          try {
            await fs.access(resolvedPath);
            fullPath = resolvedPath;
          } catch {
            // Use original path as fallback
            fullPath = filePath;
          }
        }
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      return null;
    }
  }

  private parseReferences(content: string, sourcePath: string): ParsedReference[] {
    const references: ParsedReference[] = [];
    
    // Parse markdown links: [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = markdownLinkRegex.exec(content)) !== null) {
      const [, text, url] = match;
      
      // Skip if url or text is undefined
      if (!url || !text) {
        continue;
      }
      
      // Skip external URLs, anchors, and email links
      if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:')) {
        continue;
      }

      // Classify reference type
      let type: 'local' | 'relative' | 'absolute' = 'relative';
      if (url.startsWith('/')) {
        type = 'absolute';
      } else if (url.includes('/')) {
        type = 'relative';
      } else {
        type = 'local';
      }

      references.push({
        text: text.trim(),
        url: url.trim(),
        type
      });
    }

    // Parse additional patterns (if needed)
    // Example: **[Pattern Name](path/to/file.md)** - Description
    const patternRegex = /\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*-\s*([^.\n]*)/g;
    while ((match = patternRegex.exec(content)) !== null) {
      const [, text, url] = match;
      
      // Skip if url or text is undefined
      if (!url || !text) {
        continue;
      }
      
      if (!url.startsWith('http') && !url.startsWith('#') && !url.startsWith('mailto:')) {
        let type: 'local' | 'relative' | 'absolute' = 'relative';
        if (url.startsWith('/')) {
          type = 'absolute';
        } else if (url.includes('/')) {
          type = 'relative';
        } else {
          type = 'local';
        }

        references.push({
          text: text.trim(),
          url: url.trim(),
          type
        });
      }
    }

    return references;
  }

  private async resolveReferences(
    references: ParsedReference[], 
    sourceDocPath: string
  ): Promise<ParsedReference[]> {
    const resolved: ParsedReference[] = [];

    for (const ref of references) {
      const resolvedRef = { ...ref };
      
      try {
        let resolvedPath: string;
        
        // Ensure we have the absolute source doc path
        let absoluteSourcePath = sourceDocPath;
        if (!path.isAbsolute(absoluteSourcePath)) {
          absoluteSourcePath = path.resolve(process.cwd(), sourceDocPath);
        }
        
        const sourceDir = path.dirname(absoluteSourcePath);

        if (ref.type === 'absolute') {
          // Absolute path from docs root
          const docsDir = path.resolve(process.cwd(), this.config.paths.docsDir);
          resolvedPath = path.resolve(docsDir, ref.url.substring(1));
        } else if (ref.type === 'relative') {
          // Relative to source document directory
          resolvedPath = path.resolve(sourceDir, ref.url);
        } else {
          // Local (same directory as source)
          resolvedPath = path.resolve(sourceDir, ref.url);
        }

        resolvedRef.resolvedPath = resolvedPath;
        
        // Check if file exists
        try {
          await fs.access(resolvedPath);
          resolvedRef.exists = true;
        } catch {
          resolvedRef.exists = false;
        }
      } catch (error) {
        resolvedRef.exists = false;
      }

      resolved.push(resolvedRef);
    }

    return resolved;
  }

  private async processNestedReferences(
    documentPath: string,
    content: string,
    remainingDepth: number,
    processedPaths: Set<string>
  ): Promise<ParsedReference[]> {
    if (remainingDepth <= 0) return [];

    const nestedRefs = this.parseReferences(content, documentPath);
    const resolvedNested = await this.resolveReferences(nestedRefs, documentPath);
    const loadedNested: ParsedReference[] = [];

    for (const ref of resolvedNested) {
      if (ref.exists && ref.resolvedPath && !processedPaths.has(ref.resolvedPath)) {
        try {
          const refContent = await this.readDocument(ref.resolvedPath);
          if (refContent) {
            ref.content = refContent;
            loadedNested.push(ref);
            processedPaths.add(ref.resolvedPath);

            // Recursively process nested references
            if (remainingDepth > 1) {
              const deeperRefs = await this.processNestedReferences(
                ref.resolvedPath,
                refContent,
                remainingDepth - 1,
                processedPaths
              );
              loadedNested.push(...deeperRefs);
            }
          }
        } catch (error) {
          // Skip errors in nested processing
        }
      }
    }

    return loadedNested;
  }

  private generateCombinedContent(
    sourceContent: string,
    references: ParsedReference[],
    options: Required<CombineReferencesOptions>
  ): string {
    let combinedContent = '';

    // Header
    const sourceBasename = path.basename(options.sourceDocument, '.md');
    combinedContent += `# Combined Documentation: ${sourceBasename}\n\n`;
    combinedContent += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
    combinedContent += `Pattern: ${options.pattern}\n`;
    combinedContent += `Total References: ${references.length}\n\n`;

    // Include source document if requested
    if (options.includeSource) {
      combinedContent += `## Source Document\n\n`;
      combinedContent += this.processContent(sourceContent, options.pattern);
      combinedContent += '\n\n';
    }

    // Add referenced documents
    combinedContent += `## Referenced Documents\n\n`;
    
    references.forEach((ref, index) => {
      if (ref.content) {
        const filename = ref.resolvedPath ? path.basename(ref.resolvedPath, '.md') : ref.url;
        
        combinedContent += `### ${index + 1}. ${ref.text}\n\n`;
        if (options.pattern !== 'minimal') {
          combinedContent += `**Source**: \`${ref.url}\`\n\n`;
        }
        
        combinedContent += this.processContent(ref.content, options.pattern);
        combinedContent += '\n\n';
      }
    });

    // Footer
    combinedContent += `---\n\n`;
    combinedContent += `*Combined automatically on ${new Date().toISOString().split('T')[0]} by LLMS Generator*\n`;

    return combinedContent;
  }

  private processContent(content: string, pattern: string): string {
    // Parse frontmatter and get content
    const parsed = matter(content);
    let processedContent = parsed.content;

    switch (pattern) {
      case 'clean':
        // Remove comments and excessive whitespace
        processedContent = processedContent
          .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
          .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
          .trim();
        break;
      
      case 'minimal':
        // Keep only essential content, remove headers
        processedContent = processedContent
          .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
          .replace(/^#+\s/gm, '') // Remove markdown headers
          .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
          .trim();
        break;
      
      case 'standard':
      default:
        // Keep content as-is but remove comments
        processedContent = processedContent
          .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
          .trim();
        break;
    }

    return processedContent;
  }

  private async writeOutput(content: string, outputPath: string): Promise<void> {
    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write combined content
    await fs.writeFile(outputPath, content, 'utf-8');
  }

  private displayReferences(references: ParsedReference[]): void {
    console.log(`🔗 Found ${references.length} references:\n`);
    
    references.forEach((ref, index) => {
      console.log(`${index + 1}. "${ref.text}"`);
      console.log(`   📄 URL: ${ref.url}`);
      console.log(`   📁 Type: ${ref.type}`);
      console.log(`   ✅ Exists: ${ref.exists ? 'Yes' : 'No'}`);
      if (ref.resolvedPath) {
        console.log(`   📂 Resolved: ${ref.resolvedPath}`);
      }
      if (ref.content) {
        console.log(`   📏 Content: ${ref.content.length} characters`);
      }
      console.log();
    });
  }

  private displayDryRunSummary(
    result: CombineResult, 
    options: Required<CombineReferencesOptions>
  ): void {
    console.log('📊 Dry Run Summary:');
    console.log(`   Would combine ${result.validReferences} valid references`);
    console.log(`   Source: ${result.sourceDocument}`);
    console.log(`   Output: ${result.outputPath}`);
    console.log(`   Pattern: ${options.pattern}`);
    console.log(`   Include Source: ${options.includeSource}`);
    console.log(`   Max Depth: ${options.maxDepth}`);
    console.log(`   Follow Nested: ${options.followNestedReferences}`);
    console.log(`   Total Characters: ${result.combinedContent.length.toLocaleString()}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Potential Issues:');
      result.errors.forEach(error => console.log(`   • ${error}`));
    }
    console.log();
  }

  private displayResults(result: CombineResult): void {
    console.log('\n✅ References combined successfully!\n');
    console.log('📊 Combination Summary:');
    console.log(`   📄 Output: ${result.outputPath}`);
    console.log(`   📚 References Found: ${result.totalReferences}`);
    console.log(`   ✅ Valid References: ${result.validReferences}`);
    console.log(`   📏 Total Characters: ${result.combinedContent.length.toLocaleString()}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Issues Encountered:');
      result.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log();
  }
}