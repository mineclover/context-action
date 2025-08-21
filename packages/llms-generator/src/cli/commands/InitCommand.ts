/**
 * Init Command
 * 
 * Complete project initialization: 
 * 1. Scan all documentation and create priority.json files
 * 2. Generate templates for all documents
 */

import { promises as fs } from 'fs';
import path from 'path';
import { CLIConfig } from '../types/CLITypes.js';
import { GenerateTemplatesCommand } from './GenerateTemplatesCommand.js';

export interface InitOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  quiet?: boolean;
  skipPriority?: boolean;
  skipTemplates?: boolean;
  language?: string;
}

export class InitCommand {
  constructor(private config: CLIConfig) {}

  async execute(options: InitOptions = {}): Promise<void> {
    const { dryRun = false, quiet = false } = options;
    
    if (!quiet) {
      console.log('🚀 Initializing LLMS Generator project...\n');
    }
    
    if (dryRun) {
      console.log('🔍 DRY RUN - No files will be created\n');
    }

    let totalPriorityFiles = 0;
    let totalTemplateFiles = 0;

    // Step 1: Create priority.json files
    if (!options.skipPriority) {
      if (!quiet) {
        console.log('📊 Step 1: Creating priority.json files for all documents');
      }
      
      const priorityResult = await this.createPriorityFiles(options);
      totalPriorityFiles = priorityResult.created;
      
      if (!quiet) {
        console.log(`   ✅ Created: ${priorityResult.created} priority.json files`);
        console.log(`   ⏭️  Skipped: ${priorityResult.skipped} (already exist)`);
        if (priorityResult.errors > 0) {
          console.log(`   ❌ Errors: ${priorityResult.errors}`);
        }
        console.log();
      }
    }

    // Step 2: Generate templates
    if (!options.skipTemplates && !dryRun) {
      if (!quiet) {
        console.log('📝 Step 2: Generating templates from priority.json files');
      }
      
      const templateResult = await this.generateTemplates(options);
      totalTemplateFiles = templateResult.created;
      
      if (!quiet) {
        console.log(`   ✅ Templates created: ${templateResult.created}`);
        console.log(`   ⏭️  Templates skipped: ${templateResult.skipped}`);
        console.log();
      }
    }

    // Summary
    if (!quiet) {
      console.log('📊 Initialization Summary:');
      console.log(`   📋 Priority files: ${totalPriorityFiles}`);
      console.log(`   📝 Template files: ${totalTemplateFiles}`);
      console.log('\n✨ Project initialization completed!');
    }
  }

  private async createPriorityFiles(options: InitOptions): Promise<{ created: number; skipped: number; errors: number }> {
    const docsDir = this.config.paths?.docsDir || './docs';
    const llmsDataDir = this.config.paths?.llmContentDir || './llmsData';
    
    const languages = options.language ? [options.language] : ['en', 'ko'];
    
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const language of languages) {
      const langDocsDir = path.join(docsDir, language);
      
      try {
        await fs.access(langDocsDir);
      } catch {
        if (!options.quiet) {
          console.warn(`⚠️  Warning: ${language} documentation directory not found: ${langDocsDir}`);
        }
        continue;
      }
      
      const files = await this.findMarkdownFiles(langDocsDir);
      
      for (const filePath of files) {
        try {
          const result = await this.createPriorityFile(filePath, docsDir, llmsDataDir, options);
          if (result) {
            created++;
          } else {
            skipped++;
          }
        } catch (error) {
          errors++;
          if (!options.quiet) {
            console.error(`❌ Error processing ${filePath}: ${error instanceof Error ? error.message : error}`);
          }
        }
      }
    }

    return { created, skipped, errors };
  }

  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip certain directories
          if (entry.name === 'llms' || entry.name === 'api' || entry.name === 'generated') continue;
          
          const subFiles = await this.findMarkdownFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore directories we can't read
    }
    
    return files;
  }

  private async createPriorityFile(
    filePath: string, 
    docsDir: string, 
    llmsDataDir: string, 
    options: InitOptions
  ): Promise<boolean> {
    const documentId = this.getDocumentId(filePath, docsDir);
    if (!documentId) {
      return false;
    }
    
    const relativePath = path.relative(docsDir, filePath);
    const pathParts = relativePath.split(path.sep);
    const language = pathParts[0];
    const category = pathParts[1];
    
    // Create output directory
    const outputDir = path.join(llmsDataDir, language, documentId);
    if (!options.dryRun) {
      await fs.mkdir(outputDir, { recursive: true });
    }
    
    const priorityPath = path.join(outputDir, 'priority.json');
    
    // Skip if already exists and not overwriting
    if (!options.overwrite) {
      try {
        await fs.access(priorityPath);
        return false; // Already exists, skipped
      } catch {
        // File doesn't exist, proceed
      }
    }

    if (options.dryRun) {
      return true; // Would create
    }

    // Read source content
    const content = await fs.readFile(filePath, 'utf-8');
    const title = await this.extractTitle(filePath);
    const tags = this.extractTags(content);
    const priority = this.getCategoryPriority(category);
    
    // Extract first paragraph as description
    const description = this.extractDescription(content);
    
    const priorityData = {
      document: {
        id: documentId,
        title: title,
        category: category,
        source_path: this.getSourcePath(filePath, docsDir)
      },
      priority: {
        score: priority,
        tier: priority >= 90 ? 'high' : priority >= 80 ? 'medium' : 'low'
      },
      purpose: {
        primary_goal: `Learn about ${title.toLowerCase()}`,
        use_cases: [`Understanding ${category}`, `Implementing ${title.toLowerCase()}`, `Framework learning`],
        target_audience: ['framework-users', 'developers']
      },
      keywords: {
        technical: tags,
        functional: [category, 'framework', 'context-action']
      },
      metadata: {
        description: description || `${title} documentation`,
        language: language,
        created_at: new Date().toISOString()
      }
    };
    
    await fs.writeFile(priorityPath, JSON.stringify(priorityData, null, 2));
    return true;
  }

  private async generateTemplates(options: InitOptions): Promise<{ created: number; skipped: number }> {
    const generateTemplatesCommand = new GenerateTemplatesCommand(this.config);
    
    const languages = options.language ? [options.language] : ['en', 'ko'];
    let totalCreated = 0;
    let totalSkipped = 0;
    
    for (const language of languages) {
      // Temporarily capture console output to count results
      const originalLog = console.log;
      let output = '';
      
      if (options.quiet) {
        console.log = (message: string) => {
          output += message + '\n';
        };
      }
      
      try {
        await generateTemplatesCommand.execute({
          language,
          overwrite: options.overwrite,
          dryRun: false,
          verbose: false
        });
        
        // Parse results from output if quiet mode
        if (options.quiet) {
          const createdMatch = output.match(/✅ Templates Created: (\d+)/);
          const skippedMatch = output.match(/⏭️ {2}Templates Skipped: (\d+)/);
          
          if (createdMatch) totalCreated += parseInt(createdMatch[1]);
          if (skippedMatch) totalSkipped += parseInt(skippedMatch[1]);
        }
        
      } finally {
        console.log = originalLog;
      }
    }
    
    return { created: totalCreated, skipped: totalSkipped };
  }

  private getDocumentId(filePath: string, docsDir: string): string | null {
    const relativePath = path.relative(docsDir, filePath);
    const pathParts = relativePath.split(path.sep);
    
    if (pathParts.length < 3) return null;
    
    const category = pathParts[1]; // guide, concept, api, etc
    const fileName = path.basename(filePath, '.md');
    
    // Create document ID in format: category--filename
    return `${category}--${fileName}`;
  }

  private getSourcePath(filePath: string, docsDir: string): string {
    return path.relative(docsDir, filePath);
  }

  private getCategoryPriority(category: string): number {
    const priorities: Record<string, number> = {
      'guide': 95,
      'concept': 85,
      'api': 90,
      'examples': 80,
      'patterns': 88
    };
    
    return priorities[category] || 75;
  }

  private async extractTitle(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^#\s+(.+)$/);
        if (match) {
          return match[1].trim();
        }
      }
      
      // Fallback to filename
      return path.basename(filePath, '.md');
    } catch {
      return path.basename(filePath, '.md');
    }
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n');
    let foundTitle = false;
    
    for (const line of lines) {
      if (line.match(/^#\s+/)) {
        foundTitle = true;
        continue;
      }
      
      if (foundTitle && line.trim() && !line.match(/^#{2,}/)) {
        return line.trim();
      }
    }
    
    return '';
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract from code fence languages
    const codeFences = content.match(/```(\w+)/g);
    if (codeFences) {
      const languages = codeFences.map(fence => fence.replace('```', '').toLowerCase());
      tags.push(...[...new Set(languages)]);
    }
    
    // Extract common keywords
    const commonPatterns = [
      /\b(typescript|javascript|react|vue|angular|node|npm|yarn|pnpm)\b/gi,
      /\b(api|rest|graphql|websocket|http|https)\b/gi,
      /\b(component|hook|context|state|props|jsx|tsx)\b/gi
    ];
    
    for (const pattern of commonPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        tags.push(...matches.map(m => m.toLowerCase()));
      }
    }
    
    return [...new Set(tags)].slice(0, 8);
  }
}