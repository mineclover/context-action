/**
 * Markdown with Frontmatter Generator
 * Generates templates as Markdown files with YAML frontmatter
 */

import fs from 'fs/promises';
import path from 'path';
import type { EnhancedLLMSConfig } from '../types/config';

export interface FrontmatterTemplate {
  document: {
    path: string;
    title: string;
    id: string;
    category: string;
  };
  priority: {
    score: number;
    tier: string;
  };
  summary: {
    character_limit: number;
    focus: string;
    strategy: string;
    language: string;
  };
  work_status: {
    created: string;
    modified: string;
    edited: boolean;
    needs_update: boolean;
  };
}

export interface GenerationConfig {
  languages: string[];
  characterLimits: number[];
  categories: string[];
  outputDirectory: string;
  templateDirectory: string;
  batchSize: number;
  priorityUpdateMode: 'preserve' | 'recalculate' | 'update-only';
}

export interface GenerationResult {
  success: boolean;
  totalGenerated: number;
  totalSkipped: number;
  totalErrors: number;
  generatedFiles: string[];
  errors: string[];
  processingTimeMs: number;
}

export class MarkdownFrontmatterGenerator {
  constructor(private config: EnhancedLLMSConfig) {}

  /**
   * Generate all templates as Markdown with frontmatter
   */
  async generateAllTemplates(generationConfig: GenerationConfig): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      success: false,
      totalGenerated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      generatedFiles: [],
      errors: [],
      processingTimeMs: 0
    };

    console.log('🚀 Starting Markdown with Frontmatter generation...');
    console.log(`📊 Config: ${generationConfig.languages.length} languages, ${generationConfig.characterLimits.length} character limits`);

    try {
      // Ensure output directory exists
      await fs.mkdir(generationConfig.outputDirectory, { recursive: true });

      // Discover documents
      const documents = await this.getSampleDocuments();
      console.log(`📄 Found ${documents.length} documents to process`);

      // Generate templates for each combination
      for (const lang of generationConfig.languages) {
        for (const doc of documents) {
          for (const charLimit of generationConfig.characterLimits) {
            try {
              const outputPath = await this.generateSingleTemplate(
                doc,
                lang,
                charLimit,
                generationConfig
              );
              
              result.generatedFiles.push(outputPath);
              result.totalGenerated++;
              
              // Log progress every 10 files
              if (result.totalGenerated % 10 === 0) {
                console.log(`📈 Generated ${result.totalGenerated} files...`);
              }
              
            } catch (error) {
              const errorMsg = `Failed to generate ${doc.documentId}-${charLimit}.md: ${error}`;
              result.errors.push(errorMsg);
              result.totalErrors++;
              console.warn(`⚠️  ${errorMsg}`);
            }
          }
        }
      }

      result.success = result.totalErrors === 0 || result.totalGenerated > 0;
      result.processingTimeMs = Date.now() - startTime;

      console.log(`✅ Generation completed in ${result.processingTimeMs}ms`);
      console.log(`📊 Results: ${result.totalGenerated} generated, ${result.totalSkipped} skipped, ${result.totalErrors} errors`);

      return result;

    } catch (error) {
      result.errors.push(`Generation failed: ${error}`);
      result.processingTimeMs = Date.now() - startTime;
      console.error('❌ Generation failed:', error);
      return result;
    }
  }

  /**
   * Generate single template as Markdown with frontmatter
   */
  private async generateSingleTemplate(
    doc: any,
    language: string,
    characterLimit: number,
    config: GenerationConfig
  ): Promise<string> {
    const outputPath = path.join(
      config.outputDirectory,
      language,
      doc.category,
      `${doc.documentId}-${characterLimit}.md`
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Check if file already exists
    try {
      await fs.access(outputPath);
      return outputPath; // File exists, skip
    } catch {
      // File doesn't exist, create it
    }

    const template: FrontmatterTemplate = {
      document: {
        path: doc.sourcePath,
        title: doc.title,
        id: doc.documentId,
        category: doc.category
      },
      priority: {
        score: doc.priority.score,
        tier: doc.priority.tier
      },
      summary: {
        character_limit: characterLimit,
        focus: '기본 개념',
        strategy: 'concept-first',
        language: language
      },
      work_status: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        edited: false,
        needs_update: true
      }
    };

    const markdownContent = this.formatAsMarkdownWithFrontmatter(
      template,
      `${doc.title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`
    );
    
    await fs.writeFile(outputPath, markdownContent, 'utf-8');

    console.log(`✅ Generated: ${path.relative('.', outputPath)}`);
    return outputPath;
  }

  /**
   * Format template as Markdown with YAML frontmatter
   */
  private formatAsMarkdownWithFrontmatter(template: FrontmatterTemplate, content: string): string {
    const lines: string[] = [];
    
    // Start frontmatter
    lines.push('---');
    
    // Document section
    lines.push('document:');
    lines.push(`  path: "${template.document.path}"`);
    lines.push(`  title: "${template.document.title}"`);
    lines.push(`  id: "${template.document.id}"`);
    lines.push(`  category: "${template.document.category}"`);
    
    // Priority section
    lines.push('priority:');
    lines.push(`  score: ${template.priority.score}`);
    lines.push(`  tier: "${template.priority.tier}"`);
    
    // Summary section
    lines.push('summary:');
    lines.push(`  character_limit: ${template.summary.character_limit}`);
    lines.push(`  focus: "${template.summary.focus}"`);
    lines.push(`  strategy: "${template.summary.strategy}"`);
    lines.push(`  language: "${template.summary.language}"`);
    
    // Work status section
    lines.push('work_status:');
    lines.push(`  created: "${template.work_status.created}"`);
    lines.push(`  modified: "${template.work_status.modified}"`);
    lines.push(`  edited: ${template.work_status.edited}`);
    lines.push(`  needs_update: ${template.work_status.needs_update}`);
    
    // End frontmatter
    lines.push('---');
    lines.push('');
    
    // Add markdown content
    lines.push('# ' + template.document.title);
    lines.push('');
    lines.push(content);
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * Update priorities in existing Markdown files
   */
  async updatePriorities(
    templatesDirectory: string,
    priorityUpdates: Record<string, { score: number; tier: string }>
  ): Promise<void> {
    console.log('🔄 Updating priorities in Markdown files...');

    const mdFiles = await this.findMarkdownFiles(templatesDirectory);
    let updatedCount = 0;

    for (const mdFile of mdFiles) {
      try {
        const { frontmatter, content } = await this.parseMarkdownWithFrontmatter(mdFile);
        if (!frontmatter) continue;

        const updateKey = frontmatter.document.id;
        if (priorityUpdates[updateKey]) {
          const update = priorityUpdates[updateKey];
          
          // Update priority values
          frontmatter.priority.score = update.score;
          frontmatter.priority.tier = update.tier;
          frontmatter.work_status.modified = new Date().toISOString();
          frontmatter.work_status.needs_update = false;

          // Rewrite the file with updated frontmatter
          const updatedContent = this.formatAsMarkdownWithFrontmatter(frontmatter, content);
          await fs.writeFile(mdFile, updatedContent, 'utf-8');
          updatedCount++;
          
          console.log(`✅ Updated priority for ${updateKey}: score=${update.score}, tier=${update.tier}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to update ${mdFile}:`, error);
      }
    }

    console.log(`📊 Updated priorities in ${updatedCount} files`);
  }

  /**
   * Batch process templates with priority-based selection
   */
  async batchProcessTemplates(
    templatesDirectory: string,
    outputDirectory: string,
    minPriorityScore: number = 70
  ): Promise<string[]> {
    console.log(`🔥 Batch processing Markdown templates with priority ≥ ${minPriorityScore}...`);

    const mdFiles = await this.findMarkdownFiles(templatesDirectory);
    const processedFiles: string[] = [];

    await fs.mkdir(outputDirectory, { recursive: true });

    for (const mdFile of mdFiles) {
      try {
        const { frontmatter, content } = await this.parseMarkdownWithFrontmatter(mdFile);
        if (!frontmatter) continue;

        // Check priority threshold
        if (frontmatter.priority.score >= minPriorityScore) {
          const outputPath = path.join(
            outputDirectory,
            `${frontmatter.document.id}-${frontmatter.summary.character_limit}-processed.md`
          );

          // Process and save (in real implementation, this would apply LLM processing)
          const processedContent = `[PROCESSED] ${content}`;
          frontmatter.work_status.modified = new Date().toISOString();
          frontmatter.work_status.needs_update = false;

          const processedMarkdown = this.formatAsMarkdownWithFrontmatter(frontmatter, processedContent);
          await fs.writeFile(outputPath, processedMarkdown, 'utf-8');
          processedFiles.push(outputPath);

          console.log(`✅ Processed ${frontmatter.document.id} (priority: ${frontmatter.priority.score})`);
        } else {
          console.log(`⏭️  Skipped ${frontmatter?.document.id} (priority: ${frontmatter?.priority.score} < ${minPriorityScore})`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process ${mdFile}:`, error);
      }
    }

    console.log(`📊 Processed ${processedFiles.length} files based on priority`);
    return processedFiles;
  }

  /**
   * Parse Markdown file with frontmatter
   */
  private async parseMarkdownWithFrontmatter(filePath: string): Promise<{ frontmatter: FrontmatterTemplate | null; content: string }> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      // Extract frontmatter
      const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
      
      if (!frontmatterMatch) {
        return { frontmatter: null, content: fileContent };
      }
      
      const YAML = await import('yaml');
      const frontmatter = YAML.parse(frontmatterMatch[1]) as FrontmatterTemplate;
      const content = frontmatterMatch[2].replace(/^# .*\n\n/, '').trim();
      
      return { frontmatter, content };
    } catch (error) {
      console.error(`❌ Failed to parse Markdown file ${filePath}:`, error);
      return { frontmatter: null, content: '' };
    }
  }

  /**
   * Find all Markdown files recursively
   */
  private async findMarkdownFiles(directory: string): Promise<string[]> {
    const mdFiles: string[] = [];

    const scan = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            mdFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Cannot scan directory ${dir}:`, error);
      }
    };

    await scan(directory);
    return mdFiles;
  }

  /**
   * Get sample documents for demo
   */
  private async getSampleDocuments() {
    return [
      {
        documentId: 'guide-action-handlers',
        title: '액션 핸들러',
        category: 'guide',
        sourcePath: 'ko/guide/action-handlers.md',
        priority: { score: 90, tier: 'essential' }
      },
      {
        documentId: 'guide-store-integration',
        title: '스토어 통합',
        category: 'guide',
        sourcePath: 'ko/guide/store-integration.md',
        priority: { score: 85, tier: 'important' }
      },
      {
        documentId: 'api-action-context',
        title: '액션 컨텍스트 API',
        category: 'api',
        sourcePath: 'ko/api/action-context.md',
        priority: { score: 80, tier: 'useful' }
      }
    ];
  }
}