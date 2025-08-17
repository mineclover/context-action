#!/usr/bin/env node

/**
 * Init Command - Complete project initialization based on config
 * 
 * Integrates the following steps:
 * 1. Document discovery (discover)
 * 2. Priority JSON generation (priority-generate) 
 * 3. Template creation (template-generate)
 * 
 * Note: Final LLMS file generation is separate and not included in init
 */

import { Command } from 'commander';
import { PriorityGenerator } from '../../core/PriorityGenerator.js';
import { TemplateGenerator } from '../../core/TemplateGenerator.js';
import type { ResolvedConfig } from '../../types/user-config.js';

export interface InitOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  quiet?: boolean;
  skipDiscovery?: boolean;
  skipPriority?: boolean;
  skipTemplates?: boolean;
}

export class InitCommand {
  constructor(private config: ResolvedConfig) {}

  async execute(options: InitOptions = {}): Promise<void> {
    const { dryRun = false, overwrite = false, quiet = false } = options;
    
    if (!quiet) {
      console.log('🚀 Starting project initialization (discovery → priority → templates)...');
      console.log(`📁 Project: ${this.config.paths.docsDir}`);
      console.log(`🌐 Languages: ${this.config.generation.supportedLanguages.join(', ')}`);
      console.log(`📏 Character Limits: ${this.config.generation.characterLimits.join(', ')}`);
      console.log(`${dryRun ? '🔍 [DRY RUN MODE]' : '✨ [LIVE MODE]'}\n`);
    }

    try {
      // Step 1: Document Discovery
      if (!options.skipDiscovery) {
        await this.runDiscovery(quiet, dryRun);
      }

      // Step 2: Priority JSON Generation
      if (!options.skipPriority) {
        await this.runPriorityGeneration(quiet, dryRun, overwrite);
      }

      // Step 3: Template Generation
      if (!options.skipTemplates) {
        await this.runTemplateGeneration(quiet, dryRun);
      }

      if (!quiet) {
        console.log('\n🎉 Project initialization completed successfully!');
        console.log('💡 Ready for LLMS generation! Use `simple-llms-batch` when ready.');
        this.showSummary();
      }

    } catch (error) {
      console.error('\n❌ Initialization failed:', error);
      throw error;
    }
  }

  private async runDiscovery(quiet: boolean, dryRun: boolean): Promise<void> {
    if (!quiet) console.log('🔍 Step 1: Document Discovery');
    
    const priorityGenerator = new PriorityGenerator(this.config);
    await priorityGenerator.initialize();

    for (const language of this.config.generation.supportedLanguages) {
      if (!quiet) console.log(`  📚 Discovering ${language} documents...`);
      
      const documents = await priorityGenerator.discoverDocuments(language);
      
      if (!quiet) {
        console.log(`     Found ${documents.length} documents`);
        
        // Show category breakdown
        const byCategory = documents.reduce((acc, doc) => {
          acc[doc.category] = (acc[doc.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        Object.entries(byCategory).forEach(([category, count]) => {
          console.log(`     - ${category}: ${count} docs`);
        });
      }
    }
    
    if (!quiet) console.log('   ✅ Discovery completed\n');
  }

  private async runPriorityGeneration(quiet: boolean, dryRun: boolean, overwrite: boolean): Promise<void> {
    if (!quiet) console.log('📊 Step 2: Priority JSON Generation');
    
    const priorityGenerator = new PriorityGenerator(this.config);
    await priorityGenerator.initialize();

    for (const language of this.config.generation.supportedLanguages) {
      if (!quiet) console.log(`  🏷️  Generating priority files for ${language}...`);
      
      const result = await priorityGenerator.bulkGeneratePriorities({
        languages: [language],
        dryRun,
        overwriteExisting: overwrite
      });

      if (!quiet) {
        console.log(`     Generated: ${result.summary.totalGenerated}`);
        console.log(`     Skipped: ${result.summary.totalSkipped}`);
        if (result.summary.totalErrors > 0) {
          console.log(`     Errors: ${result.summary.totalErrors}`);
        }
      }

      if (result.errors.length > 0 && !quiet) {
        console.log('     ⚠️  Errors:');
        result.errors.slice(0, 3).forEach(error => {
          console.log(`       - ${error.document.documentId}: ${error.error}`);
        });
        if (result.errors.length > 3) {
          console.log(`       ... and ${result.errors.length - 3} more`);
        }
      }
    }
    
    if (!quiet) console.log('   ✅ Priority generation completed\n');
  }

  private async runTemplateGeneration(quiet: boolean, dryRun: boolean): Promise<void> {
    if (!quiet) console.log('📝 Step 3: Template Generation');
    
    if (dryRun) {
      if (!quiet) {
        console.log(`  📋 Would generate ${this.config.generation.characterLimits.length} templates per document`);
        console.log(`     Character limits: ${this.config.generation.characterLimits.join(', ')}`);
      }
    } else {
      const templateGenerator = new TemplateGenerator(this.config);
      
      if (!quiet) console.log('  📋 Generating individual summary templates...');
      await templateGenerator.generateAllTemplates();
    }
    
    if (!quiet) console.log('   ✅ Template generation completed\n');
  }


  private showSummary(): void {
    console.log('📋 Summary:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│  Component           Status              │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│  📚 Document Discovery   ✅ Completed     │');
    console.log('│  📊 Priority Generation  ✅ Completed     │');
    console.log('│  📝 Template Creation    ✅ Completed     │');
    console.log('└─────────────────────────────────────────┘');
    
    console.log('\n📁 Output Structure:');
    console.log(`${this.config.paths.llmContentDir}/`);
    console.log('├── en/');
    console.log('│   ├── document-id/');
    console.log('│   │   ├── priority.json');
    console.log('│   │   ├── 100chars.md');
    console.log('│   │   ├── 200chars.md');
    console.log('│   │   └── ...');
    console.log('└── ko/');
    console.log('    └── (same structure)');
    
    console.log('\n🚀 Next Steps:');
    console.log('  1. Review generated priority.json files');
    console.log('  2. Edit summary templates (*.md files) as needed');
    console.log('  3. Run `simple-llms-batch` to generate final LLMS files');
    console.log('  4. Use work-status commands to track progress');
  }
}

export function createInitCommand(): Command {
  const command = new Command('init');
  
  command
    .description('Initialize complete project based on config (discovery + priority + templates + generation)')
    .option('--dry-run', 'Preview what would be created without making changes')
    .option('--overwrite', 'Overwrite existing priority.json files')
    .option('--quiet', 'Reduce output verbosity')
    .option('--skip-discovery', 'Skip document discovery step')
    .option('--skip-priority', 'Skip priority JSON generation step')
    .option('--skip-templates', 'Skip template generation step')
    .action(async (options: InitOptions) => {
      // Note: config will be injected when this command is used
      // This is handled in the main CLI router
      console.error('❌ Init command must be called through main CLI router');
      process.exit(1);
    });

  return command;
}