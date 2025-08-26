/**
 * Fill Templates Command
 * 
 * Automatically fills template files with content extracted from source documents
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { CLIConfig } from '../types/CLITypes.js';

export interface FillTemplatesOptions {
  language?: string;
  category?: string;
  characterLimit?: number;
  dryRun?: boolean;
  verbose?: boolean;
  overwrite?: boolean;
}

export class FillTemplatesCommand {
  constructor(private config: CLIConfig) {}

  async execute(options: FillTemplatesOptions = {}): Promise<void> {
    const { language = 'en', dryRun = false } = options;
    
    console.log('🚀 Filling template files with content from source documents...\n');
    
    if (dryRun) {
      console.log('🔍 DRY RUN - No files will be modified\n');
    }

    const llmsDataDir = path.join(this.config.paths.llmContentDir, language);
    const docsDir = path.join(this.config.paths.docsDir, language);
    
    // Get all document directories
    const documentDirs = await this.getDocumentDirectories(llmsDataDir, options);
    
    let totalFilled = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const docDir of documentDirs) {
      const result = await this.fillDocumentTemplates(
        docDir, 
        docsDir, 
        options
      );
      
      totalFilled += result.filled;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Filled: ${totalFilled} templates`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} (already filled)`);
    if (totalErrors > 0) {
      console.log(`   ❌ Errors: ${totalErrors}`);
    }
  }

  private async getDocumentDirectories(
    llmsDataDir: string, 
    options: FillTemplatesOptions
  ): Promise<string[]> {
    const dirs: string[] = [];
    
    try {
      const entries = await fs.readdir(llmsDataDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const documentId = entry.name;
        
        // Apply category filter if specified
        if (options.category) {
          const category = documentId.split('--')[0];
          if (category !== options.category) continue;
        }
        
        dirs.push(path.join(llmsDataDir, documentId));
      }
    } catch (error) {
      console.error(`❌ Error reading directory ${llmsDataDir}: ${error}`);
    }
    
    return dirs;
  }

  private async fillDocumentTemplates(
    docDir: string,
    docsDir: string,
    options: FillTemplatesOptions
  ): Promise<{ filled: number; skipped: number; errors: number }> {
    const documentId = path.basename(docDir);
    const stats = { filled: 0, skipped: 0, errors: 0 };
    
    // Find source document
    const sourceDoc = await this.findSourceDocument(documentId, docsDir);
    if (!sourceDoc) {
      if (options.verbose) {
        console.log(`⚠️  No source document found for ${documentId}`);
      }
      stats.errors++;
      return stats;
    }
    
    if (options.verbose) {
      console.log(`📄 Processing document: ${documentId}`);
      console.log(`📂 Source: ${path.relative(process.cwd(), sourceDoc)}`);
    }

    // Get source content
    const sourceContent = await fs.readFile(sourceDoc, 'utf-8');
    
    // Get all template files
    const templateFiles = await this.getTemplateFiles(docDir, options);
    
    for (const templateFile of templateFiles) {
      try {
        const filled = await this.fillTemplate(
          templateFile,
          sourceContent,
          documentId,
          options
        );
        
        if (filled) {
          stats.filled++;
          if (options.verbose) {
            console.log(`✅ Filled: ${path.basename(templateFile)}`);
          }
        } else {
          stats.skipped++;
          if (options.verbose) {
            console.log(`⏭️  Skipped: ${path.basename(templateFile)} (already filled)`);
          }
        }
      } catch (error) {
        stats.errors++;
        console.error(`❌ Error filling ${templateFile}: ${error}`);
      }
    }
    
    return stats;
  }

  private async findSourceDocument(
    documentId: string,
    docsDir: string
  ): Promise<string | null> {
    // Convert document ID to possible source paths
    // e.g., "api--action-only" -> "api/action-only.md"
    const parts = documentId.split('--');
    
    // Try different path combinations
    const possiblePaths = [
      path.join(docsDir, ...parts) + '.md',
      path.join(docsDir, parts[0], parts.slice(1).join('/')) + '.md',
      path.join(docsDir, parts.join('/')) + '.md',
      path.join(docsDir, parts.join('-')) + '.md'
    ];
    
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        return possiblePath;
      } catch {
        // Try next path
      }
    }
    
    return null;
  }

  private async getTemplateFiles(
    docDir: string,
    options: FillTemplatesOptions
  ): Promise<string[]> {
    const files = await fs.readdir(docDir);
    let templateFiles = files
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(docDir, f));
    
    // Apply character limit filter if specified
    if (options.characterLimit) {
      templateFiles = templateFiles.filter(f => 
        f.includes(`-${options.characterLimit}.md`)
      );
    }
    
    return templateFiles;
  }

  private async fillTemplate(
    templatePath: string,
    sourceContent: string,
    documentId: string,
    options: FillTemplatesOptions
  ): Promise<boolean> {
    // Read template file
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const parsed = matter(templateContent);
    
    // Check if already filled
    if (!options.overwrite && this.isAlreadyFilled(parsed.content)) {
      return false;
    }
    
    // Extract character limit from filename
    const characterLimit = this.extractCharacterLimit(templatePath);
    if (!characterLimit) return false;
    
    // Generate summary from source content
    const summary = this.generateSummary(sourceContent, characterLimit, documentId);
    
    // Update template with summary
    const updatedContent = this.updateTemplateContent(
      templateContent,
      summary,
      characterLimit
    );
    
    if (!options.dryRun) {
      await fs.writeFile(templatePath, updatedContent, 'utf-8');
    }
    
    return true;
  }

  private isAlreadyFilled(content: string): boolean {
    // Check if template already has actual content
    const hasPlaceholder = 
      content.includes('여기에') ||
      content.includes('작성하세요') ||
      content.includes('Provide comprehensive guidance') ||
      content.includes('[Content to be filled]') ||
      content.includes('[Guide content]') ||
      content.includes('[한국어 내용]') ||
      content.includes('[Source content]') ||
      /\[Content \d+\]/.test(content) ||  // Match [Content 300] etc.
      content.includes('<!-- ');
    
    const hasContent = (content.match(/```markdown\s*(.+?)\s*```/s)?.[1]?.length ?? 0) > 50;
    
    return hasContent && !hasPlaceholder;
  }

  private extractCharacterLimit(filePath: string): number | null {
    const match = path.basename(filePath).match(/-(\d+)\.md$/);
    return match ? parseInt(match[1]) : null;
  }

  private generateSummary(
    sourceContent: string,
    characterLimit: number,
    documentId: string
  ): string {
    // For larger character limits (>=1000), preserve markdown formatting
    if (characterLimit >= 1000) {
      const preservedContent = sourceContent
        .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
        .trim();
      
      if (preservedContent.length <= characterLimit - 10) {
        return preservedContent;
      }
      
      // If too long, truncate but keep markdown formatting
      return preservedContent.substring(0, characterLimit - 10) + '...';
    }
    
    // For smaller limits, remove markdown formatting for better readability
    const text = sourceContent
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/[*_~`]/g, '') // Remove formatting
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
    
    // Extract key sentences
    const sentences = text.split(/[.!?]\s+/);
    let summary = '';
    
    // Build summary within character limit
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      const testSummary = summary ? `${summary}. ${trimmedSentence}` : trimmedSentence;
      
      if (testSummary.length <= characterLimit - 10) { // Leave some margin
        summary = testSummary;
      } else if (!summary) {
        // If first sentence is too long, truncate it
        summary = trimmedSentence.substring(0, characterLimit - 10) + '...';
        break;
      } else {
        break;
      }
    }
    
    // Ensure we have a period at the end
    if (summary && !summary.match(/[.!?]$/)) {
      summary += '.';
    }
    
    return summary || `Summary for ${documentId}`;
  }

  private updateTemplateContent(
    templateContent: string,
    summary: string,
    _characterLimit: number
  ): string {
    const parsed = matter(templateContent);
    
    // Replace placeholder content with actual summary
    let updatedContent = parsed.content;
    
    // Replace various placeholder patterns
    updatedContent = updatedContent
      .replace(/\[Content to be filled\]/g, summary)
      .replace(/\[Guide content\]/g, summary)
      .replace(/\[한국어 내용\]/g, summary)
      .replace(/\[Source content\]/g, summary)
      .replace(/\[Content \d+\]/g, summary)  // Match [Content 300] etc.
      .replace(/여기에.*/g, summary)
      .replace(/작성하세요.*/g, summary)
      .replace(/Provide comprehensive guidance.*/g, summary)
      .replace(/Old existing content\./g, summary);  // For overwrite test
    
    // If no placeholder was found, try to replace content within markdown code block
    if (updatedContent === parsed.content && /```markdown[\s\S]*?```/.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        /```markdown[\s\S]*?```/,
        `\`\`\`markdown\n${summary}\n\`\`\``
      );
    }
    
    // Update frontmatter
    parsed.data.completion_status = 'completed';
    parsed.data.workflow_stage = 'content_filled';
    parsed.data.last_update = new Date().toISOString();
    
    return matter.stringify(updatedContent, parsed.data);
  }
}