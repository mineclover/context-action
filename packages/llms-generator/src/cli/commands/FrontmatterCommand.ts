import { BaseCommand } from '../core/BaseCommand.js';
import type { EnhancedLLMSConfig } from '../../types/config.js';
import { FrontmatterUpdater } from '../hooks/update-frontmatter.js';
import { FrontmatterValidator } from '../hooks/validate-frontmatter.js';
import matter from 'gray-matter';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

interface FrontmatterCommandOptions {
  action: 'validate' | 'update' | 'sync' | 'status' | 'repair';
  language?: string;
  category?: string;
  documentId?: string;
  force?: boolean;
  dryRun?: boolean;
}

interface FrontmatterStats {
  total: number;
  byStatus: Record<string, number>;
  byStage: Record<string, number>;
  needsUpdate: number;
  errors: number;
}

export class FrontmatterCommand extends BaseCommand {
  constructor(config: EnhancedLLMSConfig) {
    super(config);
  }

  async execute(options: FrontmatterCommandOptions): Promise<void> {
    switch (options.action) {
      case 'validate':
        await this.validateFrontmatter(options);
        break;
      case 'update':
        await this.updateFrontmatter(options);
        break;
      case 'sync':
        await this.syncFrontmatter(options);
        break;
      case 'status':
        await this.showFrontmatterStatus(options);
        break;
      case 'repair':
        await this.repairFrontmatter(options);
        break;
      default:
        throw new Error(`Unknown action: ${options.action}`);
    }
  }

  private async validateFrontmatter(options: FrontmatterCommandOptions): Promise<void> {
    console.log('🔍 Validating frontmatter consistency...\n');
    
    const validator = new FrontmatterValidator();
    const isValid = await validator.validateAllTemplates();
    
    if (isValid) {
      console.log('\n✅ All frontmatter validation passed!');
    } else {
      console.log('\n❌ Frontmatter validation failed');
      if (!options.force) {
        process.exit(1);
      }
    }
  }

  private async updateFrontmatter(options: FrontmatterCommandOptions): Promise<void> {
    console.log('🔄 Updating frontmatter...\n');
    
    const updater = new FrontmatterUpdater();
    const templateFiles = await this.getTemplateFiles(options);
    
    let updatedCount = 0;
    
    for (const filePath of templateFiles) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would update: ${path.relative(process.cwd(), filePath)}`);
        continue;
      }
      
      try {
        await this.updateSingleTemplate(filePath);
        updatedCount++;
        console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
      } catch (error) {
        console.error(`❌ Failed to update ${filePath}: ${error}`);
      }
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`   Templates processed: ${templateFiles.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Errors: ${templateFiles.length - updatedCount}`);
  }

  private async syncFrontmatter(options: FrontmatterCommandOptions): Promise<void> {
    console.log('🔄 Synchronizing frontmatter with source documents...\n');
    
    const sourceFiles = await this.getSourceFiles(options);
    const updater = new FrontmatterUpdater();
    
    for (const sourceFile of sourceFiles) {
      const relativePath = path.relative(process.cwd(), sourceFile);
      
      if (options.dryRun) {
        console.log(`[DRY RUN] Would sync templates for: ${relativePath}`);
        continue;
      }
      
      try {
        await updater.updateSourceChanged([relativePath]);
        console.log(`✅ Synced templates for: ${relativePath}`);
      } catch (error) {
        console.error(`❌ Failed to sync ${relativePath}: ${error}`);
      }
    }
  }

  private async showFrontmatterStatus(options: FrontmatterCommandOptions): Promise<void> {
    console.log('📊 Frontmatter Status Report\n');
    
    const templateFiles = await this.getTemplateFiles(options);
    const stats = await this.analyzeTemplates(templateFiles);
    
    console.log(`Total Templates: ${stats.total}`);
    console.log('');
    
    console.log('📋 By Completion Status:');
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      const emoji = this.getStatusEmoji(status);
      console.log(`   ${emoji} ${status}: ${count} (${percentage}%)`);
    });
    
    console.log('');
    console.log('🔄 By Workflow Stage:');
    Object.entries(stats.byStage).forEach(([stage, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`   📍 ${stage}: ${count} (${percentage}%)`);
    });
    
    console.log('');
    console.log('⚠️  Issues:');
    console.log(`   Needs Update: ${stats.needsUpdate}`);
    console.log(`   Errors: ${stats.errors}`);
    
    if (stats.needsUpdate > 0) {
      console.log('');
      console.log('💡 Recommendations:');
      console.log('   Run: npx llms-generator frontmatter update --dry-run');
      console.log('   Then: npx llms-generator frontmatter update');
    }
  }

  private async repairFrontmatter(options: FrontmatterCommandOptions): Promise<void> {
    console.log('🔧 Repairing frontmatter issues...\n');
    
    const templateFiles = await this.getTemplateFiles(options);
    let repairedCount = 0;
    
    for (const filePath of templateFiles) {
      try {
        const wasRepaired = await this.repairSingleTemplate(filePath, options.dryRun);
        if (wasRepaired) {
          repairedCount++;
          const relativePath = path.relative(process.cwd(), filePath);
          console.log(`🔧 Repaired: ${relativePath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to repair ${filePath}: ${error}`);
      }
    }
    
    console.log(`\n📊 Repair Summary:`);
    console.log(`   Templates checked: ${templateFiles.length}`);
    console.log(`   Issues repaired: ${repairedCount}`);
  }

  private async getTemplateFiles(options: FrontmatterCommandOptions): Promise<string[]> {
    let pattern = 'data/**/*.md';
    
    if (options.language) {
      pattern = `data/${options.language}/**/*.md`;
    }
    
    const files = await glob(pattern, { 
      cwd: process.cwd(),
      absolute: true 
    });
    
    if (options.category) {
      return files.filter(file => file.includes(`/${options.category}--`));
    }
    
    if (options.documentId) {
      return files.filter(file => file.includes(`/${options.documentId}/`));
    }
    
    return files;
  }

  private async getSourceFiles(options: FrontmatterCommandOptions): Promise<string[]> {
    let pattern = 'docs/**/*.md';
    
    if (options.language) {
      pattern = `docs/${options.language}/**/*.md`;
    }
    
    return await glob(pattern, { 
      cwd: process.cwd(),
      absolute: true 
    });
  }

  private async analyzeTemplates(templateFiles: string[]): Promise<FrontmatterStats> {
    const stats: FrontmatterStats = {
      total: templateFiles.length,
      byStatus: {},
      byStage: {},
      needsUpdate: 0,
      errors: 0
    };
    
    for (const filePath of templateFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const frontmatter = parsed.data;
        
        // Count by status
        const status = frontmatter.completion_status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        
        // Count by stage
        const stage = frontmatter.workflow_stage || 'unknown';
        stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
        
        // Check if needs update
        if (frontmatter.update_status === 'source_updated') {
          stats.needsUpdate++;
        }
        
      } catch (error) {
        stats.errors++;
      }
    }
    
    return stats;
  }

  private async updateSingleTemplate(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    
    // Update timestamp
    const updates = {
      last_update: new Date().toISOString()
    };
    
    // Add any missing required fields
    if (!parsed.data.completion_status) {
      updates.completion_status = 'template';
      updates.workflow_stage = 'template_generation';
    }
    
    const updatedFrontmatter = {
      ...parsed.data,
      ...updates
    };
    
    const updatedContent = matter.stringify(parsed.content, updatedFrontmatter);
    await fs.writeFile(filePath, updatedContent, 'utf-8');
  }

  private async repairSingleTemplate(filePath: string, dryRun?: boolean): Promise<boolean> {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const frontmatter = parsed.data;
    
    let needsRepair = false;
    const repairs: Record<string, any> = {};
    
    // Check for missing required fields
    const requiredFields = [
      'document_id', 'category', 'source_path', 'character_limit',
      'completion_status', 'workflow_stage', 'priority_score'
    ];
    
    for (const field of requiredFields) {
      if (!frontmatter[field]) {
        needsRepair = true;
        // Add default values based on file path
        if (field === 'document_id') {
          repairs[field] = this.extractDocumentIdFromPath(filePath);
        } else if (field === 'category') {
          repairs[field] = this.extractCategoryFromPath(filePath);
        } else if (field === 'completion_status') {
          repairs[field] = 'template';
        } else if (field === 'workflow_stage') {
          repairs[field] = 'template_generation';
        } else if (field === 'priority_score') {
          repairs[field] = 50;
        }
      }
    }
    
    // Validate and fix enum values
    const validStatuses = ['template', 'draft', 'review', 'completed'];
    if (frontmatter.completion_status && !validStatuses.includes(frontmatter.completion_status)) {
      needsRepair = true;
      repairs.completion_status = 'template';
    }
    
    if (needsRepair && !dryRun) {
      const repairedFrontmatter = {
        ...frontmatter,
        ...repairs,
        last_update: new Date().toISOString()
      };
      
      const repairedContent = matter.stringify(parsed.content, repairedFrontmatter);
      await fs.writeFile(filePath, repairedContent, 'utf-8');
    }
    
    return needsRepair;
  }

  private extractDocumentIdFromPath(filePath: string): string {
    const pathParts = filePath.split(path.sep);
    const fileName = path.basename(filePath, '.md');
    
    // Extract from parent directory name (should be the document ID)
    for (let i = pathParts.length - 2; i >= 0; i--) {
      if (pathParts[i].includes('--')) {
        return pathParts[i];
      }
    }
    
    return fileName.replace(/-\d+$/, ''); // Remove character limit suffix
  }

  private extractCategoryFromPath(filePath: string): string {
    const pathParts = filePath.split(path.sep);
    for (const part of pathParts) {
      if (part.includes('--')) {
        const category = part.split('--')[0];
        if (['guide', 'api', 'concept', 'examples'].includes(category)) {
          return category;
        }
      }
    }
    return 'guide'; // default
  }

  private getStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
      'template': '📋',
      'draft': '✏️',
      'review': '👀', 
      'completed': '✅',
      'unknown': '❓'
    };
    
    return emojiMap[status] || '❓';
  }
}