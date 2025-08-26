import { promises as fs } from 'fs';
import path from 'path';
import { EnhancedLLMSConfig } from '../../types/config.js';

export interface PriorityTask {
  documentId: string;
  language: string;
  category: string;
  taskType: 'missing' | 'outdated' | 'invalid' | 'needs_review' | 'needs_update';
  priority: number;
  issue: string;
  recommendation: string;
  sourceDocument?: string;
  lastModified?: Date;
  metadata?: Record<string, any>;
}

export interface PriorityTasksOptions {
  language?: string;
  category?: string;
  taskType?: string;
  limit?: number;
  verbose?: boolean;
  fix?: boolean;
  dryRun?: boolean;
}

export class PriorityTasksCommand {
  constructor(private config: EnhancedLLMSConfig) {}

  async execute(options: PriorityTasksOptions = {}): Promise<void> {
    console.log('🔍 Analyzing priority.json tasks...\n');

    const tasks = await this.scanPriorityTasks(options);
    
    if (tasks.length === 0) {
      console.log('✅ All priority.json files are up to date!');
      return;
    }

    this.displayPriorityTasks(tasks, options);

    if (options.fix && !options.dryRun) {
      await this.fixPriorityTasks(tasks, options);
    }
  }

  private async scanPriorityTasks(options: PriorityTasksOptions): Promise<PriorityTask[]> {
    const tasks: PriorityTask[] = [];
    const languages = options.language ? [options.language] : this.config.generation.supportedLanguages;

    for (const language of languages) {
      const languageDir = path.join(this.config.paths.llmContentDir, language);
      
      try {
        await fs.access(languageDir);
      } catch {
        continue;
      }

      const documentDirs = await fs.readdir(languageDir, { withFileTypes: true });
      
      for (const docDir of documentDirs) {
        if (!docDir.isDirectory()) continue;
        
        const documentId = docDir.name;
        
        // Skip non-document directories
        if (documentId === 'guide' || documentId === 'examples' || documentId === 'concept') {
          continue;
        }

        const category = this.extractCategory(documentId);
        
        if (options.category && category !== options.category) {
          continue;
        }

        const priorityTask = await this.analyzePriorityFile(documentId, language, category);
        if (priorityTask && (!options.taskType || priorityTask.taskType === options.taskType)) {
          tasks.push(priorityTask);
        }
      }
    }

    // Also check for missing priority.json files in source docs
    await this.checkMissingPriorityFiles(tasks, languages, options);

    // Sort by priority (high to low) and task severity
    tasks.sort((a, b) => {
      const severityOrder = { missing: 1, invalid: 2, outdated: 3, needs_update: 4, needs_review: 5 };
      if (a.taskType !== b.taskType) {
        return severityOrder[a.taskType] - severityOrder[b.taskType];
      }
      return b.priority - a.priority;
    });

    return options.limit ? tasks.slice(0, options.limit) : tasks;
  }

  private async analyzePriorityFile(
    documentId: string, 
    language: string, 
    category: string
  ): Promise<PriorityTask | null> {
    const basePath = path.join(this.config.paths.llmContentDir, language, documentId);
    const priorityPath = path.join(basePath, 'priority.json');
    const sourceDocPath = this.resolveSourceDocumentPath(documentId, language);

    try {
      // Check if priority.json exists
      const priorityExists = await this.fileExists(priorityPath);
      
      if (!priorityExists) {
        return {
          documentId,
          language,
          category,
          taskType: 'missing',
          priority: 100, // High priority for missing files
          issue: 'priority.json file is missing',
          recommendation: `Run: pnpm llms:sync-docs --changed-files ${sourceDocPath}`,
          sourceDocument: sourceDocPath
        };
      }

      // Read and validate priority.json
      const priorityContent = await fs.readFile(priorityPath, 'utf-8');
      const priorityData = JSON.parse(priorityContent);

      // Check for required fields
      const requiredFields = ['document', 'priority', 'metadata'];
      const missingFields = requiredFields.filter(field => !priorityData[field]);
      
      if (missingFields.length > 0) {
        return {
          documentId,
          language,
          category,
          taskType: 'invalid',
          priority: 90,
          issue: `Missing required fields: ${missingFields.join(', ')}`,
          recommendation: 'Update priority.json with missing fields',
          sourceDocument: sourceDocPath
        };
      }

      // Check priority score validity
      const score = priorityData.priority?.score;
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return {
          documentId,
          language,
          category,
          taskType: 'invalid',
          priority: 85,
          issue: `Invalid priority score: ${score}`,
          recommendation: 'Set priority score between 0-100',
          sourceDocument: sourceDocPath
        };
      }

      // Check if source document has been modified after priority.json
      if (await this.fileExists(sourceDocPath)) {
        const [sourceStat, priorityStat] = await Promise.all([
          fs.stat(sourceDocPath),
          fs.stat(priorityPath)
        ]);

        if (sourceStat.mtime > priorityStat.mtime) {
          return {
            documentId,
            language,
            category,
            taskType: 'outdated',
            priority: score,
            issue: 'Source document modified after priority.json',
            recommendation: `Update priority.json (last updated: ${priorityStat.mtime.toISOString()})`,
            sourceDocument: sourceDocPath,
            lastModified: sourceStat.mtime
          };
        }
      }

      // Check for inconsistent priority scores
      if (this.needsPriorityReview(priorityData, category)) {
        return {
          documentId,
          language,
          category,
          taskType: 'needs_review',
          priority: score,
          issue: `Priority score (${score}) may not align with category (${category}) standards`,
          recommendation: 'Review and adjust priority score if needed',
          sourceDocument: sourceDocPath,
          metadata: priorityData
        };
      }

      // Check for missing or outdated metadata
      if (this.needsMetadataUpdate(priorityData)) {
        return {
          documentId,
          language,
          category,
          taskType: 'needs_update',
          priority: score,
          issue: 'Metadata needs update (missing description or keywords)',
          recommendation: 'Add comprehensive metadata for better context',
          sourceDocument: sourceDocPath,
          metadata: priorityData
        };
      }

      return null; // No issues found
    } catch (error: any) {
      return {
        documentId,
        language,
        category,
        taskType: 'invalid',
        priority: 95,
        issue: `Error reading priority.json: ${error.message}`,
        recommendation: 'Fix JSON syntax or regenerate file',
        sourceDocument: sourceDocPath
      };
    }
  }

  private async checkMissingPriorityFiles(
    tasks: PriorityTask[], 
    languages: string[], 
    options: PriorityTasksOptions
  ): Promise<void> {
    for (const language of languages) {
      const docsDir = path.join(this.config.paths.docsDir, language);
      
      try {
        await this.scanSourceDirectory(docsDir, language, tasks, options);
      } catch {
        // Skip if docs directory doesn't exist
      }
    }
  }

  private async scanSourceDirectory(
    dir: string, 
    language: string, 
    tasks: PriorityTask[], 
    options: PriorityTasksOptions,
    category?: string
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Determine category from directory name
        const newCategory = category || entry.name;
        await this.scanSourceDirectory(fullPath, language, tasks, options, newCategory);
      } else if (entry.name.endsWith('.md')) {
        // Check if corresponding priority.json exists
        const docName = entry.name.replace('.md', '');
        const documentId = category ? `${category}--${docName}` : docName;
        const priorityDir = path.join(this.config.paths.llmContentDir, language, documentId);
        const priorityPath = path.join(priorityDir, 'priority.json');
        
        if (!(await this.fileExists(priorityPath))) {
          // Check if this document is already in tasks
          const existingTask = tasks.find(t => 
            t.documentId === documentId && t.language === language
          );
          
          if (!existingTask) {
            tasks.push({
              documentId,
              language,
              category: category || 'unknown',
              taskType: 'missing',
              priority: 100,
              issue: 'No priority.json for source document',
              recommendation: `Run: pnpm llms:sync-docs --changed-files ${fullPath}`,
              sourceDocument: fullPath
            });
          }
        }
      }
    }
  }

  private needsPriorityReview(priorityData: any, category: string): boolean {
    const score = priorityData.priority?.score || 0;
    
    // Category-based priority expectations
    const expectations: Record<string, [number, number]> = {
      'guide': [80, 100],
      'concept': [70, 90],
      'examples': [60, 80],
      'api': [70, 90],
      'reference': [60, 85]
    };

    const expected = expectations[category];
    if (expected) {
      return score < expected[0] || score > expected[1];
    }

    return false;
  }

  private needsMetadataUpdate(priorityData: any): boolean {
    const metadata = priorityData.metadata || {};
    
    // Check for essential metadata fields
    if (!metadata.description || metadata.description.length < 50) {
      return true;
    }
    
    const keywords = priorityData.keywords || {};
    if (!keywords.technical || keywords.technical.length < 2) {
      return true;
    }
    if (!keywords.functional || keywords.functional.length < 2) {
      return true;
    }

    return false;
  }

  private displayPriorityTasks(tasks: PriorityTask[], options: PriorityTasksOptions): void {
    console.log(`📋 Priority.json Tasks (${tasks.length} items)\n`);
    
    if (options.verbose) {
      // Detailed view
      tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${this.getTaskEmoji(task.taskType)} ${task.documentId} (${task.language})`);
        console.log(`   Type: ${this.getTaskTypeLabel(task.taskType)}`);
        console.log(`   Priority: ${task.priority}`);
        console.log(`   Issue: ${task.issue}`);
        console.log(`   Action: ${task.recommendation}`);
        if (task.sourceDocument) {
          console.log(`   Source: ${task.sourceDocument}`);
        }
        console.log();
      });
    } else {
      // Compact table view
      console.log('Type | Priority | Lang | Category | Document ID                  | Issue');
      console.log('-----|----------|------|----------|------------------------------|------');
      
      tasks.forEach(task => {
        const typeIcon = this.getTaskEmoji(task.taskType);
        const priority = String(task.priority).padStart(8);
        const lang = task.language.padEnd(4);
        const category = task.category.padEnd(8);
        const docId = task.documentId.substring(0, 28).padEnd(28);
        const issue = task.issue.substring(0, 40);
        
        console.log(`${typeIcon}    | ${priority} | ${lang} | ${category} | ${docId} | ${issue}`);
      });
    }

    // Summary by task type
    console.log('\n📊 Summary by Task Type:');
    const taskCounts = this.countByTaskType(tasks);
    Object.entries(taskCounts).forEach(([type, count]) => {
      console.log(`  ${this.getTaskEmoji(type as any)} ${this.getTaskTypeLabel(type as any)}: ${count}`);
    });

    console.log('\n🔧 Recommended Actions:');
    if (taskCounts.missing > 0) {
      console.log(`   • Generate missing priority.json files: pnpm llms:sync-docs`);
    }
    if (taskCounts.invalid > 0) {
      console.log(`   • Fix invalid JSON files manually or regenerate`);
    }
    if (taskCounts.outdated > 0) {
      console.log(`   • Update outdated files: pnpm llms:priority-auto --force`);
    }
    if (taskCounts.needs_review > 0 || taskCounts.needs_update > 0) {
      console.log(`   • Review and update metadata: pnpm llms:priority-suggest`);
    }
    console.log(`   • Auto-fix issues: add --fix flag`);
    console.log(`   • Preview changes: add --dry-run flag`);
  }

  private async fixPriorityTasks(tasks: PriorityTask[], _options: PriorityTasksOptions): Promise<void> {
    console.log('\n🔧 Fixing priority tasks...\n');
    
    let fixed = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        switch (task.taskType) {
          case 'missing':
            console.log(`Creating priority.json for ${task.documentId}...`);
            await this.createPriorityFile(task);
            fixed++;
            break;
            
          case 'outdated':
            console.log(`Updating priority.json for ${task.documentId}...`);
            await this.updatePriorityFile(task);
            fixed++;
            break;
            
          case 'needs_update':
            console.log(`Enhancing metadata for ${task.documentId}...`);
            await this.enhanceMetadata(task);
            fixed++;
            break;
            
          default:
            console.log(`⚠️  Cannot auto-fix ${task.taskType} for ${task.documentId}`);
            console.log(`   Please fix manually: ${task.recommendation}`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to fix ${task.documentId}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} tasks, ${failed} failed`);
  }

  private async createPriorityFile(task: PriorityTask): Promise<void> {
    const priorityDir = path.join(this.config.paths.llmContentDir, task.language, task.documentId);
    const priorityPath = path.join(priorityDir, 'priority.json');
    
    // Ensure directory exists
    await fs.mkdir(priorityDir, { recursive: true });
    
    // Create priority data
    const priorityData = {
      document: {
        id: task.documentId,
        title: this.generateTitle(task.documentId),
        category: task.category,
        source_path: `${task.language}/${task.category}/${task.documentId.split('--')[1]}.md`
      },
      priority: {
        score: this.calculateDefaultPriority(task.category),
        tier: this.getPriorityTier(this.calculateDefaultPriority(task.category))
      },
      purpose: {
        primary_goal: `Learn about ${this.generateTitle(task.documentId)}`,
        use_cases: [
          'Understanding guide',
          'Implementation reference',
          'Framework learning'
        ],
        target_audience: ['developers', 'framework-users']
      },
      keywords: {
        technical: ['typescript', 'react', 'context', 'action'],
        functional: [task.category, 'framework', 'context-action']
      },
      metadata: {
        description: `Documentation for ${this.generateTitle(task.documentId)} in the Context-Action framework`,
        language: task.language,
        created_at: new Date().toISOString()
      }
    };

    await fs.writeFile(priorityPath, JSON.stringify(priorityData, null, 2));
  }

  private async updatePriorityFile(task: PriorityTask): Promise<void> {
    const priorityPath = path.join(
      this.config.paths.llmContentDir, 
      task.language, 
      task.documentId, 
      'priority.json'
    );
    
    const content = await fs.readFile(priorityPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Update timestamp
    data.metadata = data.metadata || {};
    data.metadata.updated_at = new Date().toISOString();
    data.metadata.last_source_update = task.lastModified?.toISOString();
    
    await fs.writeFile(priorityPath, JSON.stringify(data, null, 2));
  }

  private async enhanceMetadata(task: PriorityTask): Promise<void> {
    const priorityPath = path.join(
      this.config.paths.llmContentDir, 
      task.language, 
      task.documentId, 
      'priority.json'
    );
    
    const content = await fs.readFile(priorityPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Enhance metadata
    if (!data.metadata?.description || data.metadata.description.length < 50) {
      data.metadata = data.metadata || {};
      data.metadata.description = `Comprehensive guide for ${this.generateTitle(task.documentId)} ` +
        `providing detailed information about implementation, best practices, and usage patterns ` +
        `in the Context-Action framework.`;
    }
    
    // Enhance keywords
    if (!data.keywords?.technical || data.keywords.technical.length < 2) {
      data.keywords = data.keywords || {};
      data.keywords.technical = ['typescript', 'react', 'state-management', 'context-api', 'hooks'];
    }
    
    if (!data.keywords?.functional || data.keywords.functional.length < 2) {
      data.keywords.functional = [task.category, 'documentation', 'guide', 'reference', 'framework'];
    }
    
    await fs.writeFile(priorityPath, JSON.stringify(data, null, 2));
  }

  private countByTaskType(tasks: PriorityTask[]): Record<string, number> {
    const counts: Record<string, number> = {
      missing: 0,
      outdated: 0,
      invalid: 0,
      needs_review: 0,
      needs_update: 0
    };
    
    tasks.forEach(task => {
      counts[task.taskType] = (counts[task.taskType] || 0) + 1;
    });
    
    return counts;
  }

  private getTaskEmoji(taskType: PriorityTask['taskType']): string {
    const emojis = {
      missing: '🔴',
      invalid: '❌',
      outdated: '🟡',
      needs_review: '🟠',
      needs_update: '🔵'
    };
    return emojis[taskType] || '❓';
  }

  private getTaskTypeLabel(taskType: PriorityTask['taskType']): string {
    const labels = {
      missing: 'Missing File',
      invalid: 'Invalid JSON',
      outdated: 'Outdated',
      needs_review: 'Needs Review',
      needs_update: 'Needs Update'
    };
    return labels[taskType] || 'Unknown';
  }

  private generateTitle(documentId: string): string {
    // Convert document-id to Title Case
    const parts = documentId.split('--');
    const title = parts[parts.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return title;
  }

  private calculateDefaultPriority(category: string): number {
    const defaults: Record<string, number> = {
      'guide': 85,
      'concept': 75,
      'examples': 65,
      'api': 75,
      'reference': 70
    };
    return defaults[category] || 70;
  }

  private getPriorityTier(score: number): string {
    if (score >= 90) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private resolveSourceDocumentPath(documentId: string, language: string): string {
    const parts = documentId.split('--');
    if (parts.length >= 2) {
      const [category, ...nameParts] = parts;
      const fileName = nameParts.join('-') + '.md';
      return path.join(this.config.paths.docsDir, language, category, fileName);
    }
    return path.join(this.config.paths.docsDir, language, documentId + '.md');
  }

  private extractCategory(documentId: string): string {
    const parts = documentId.split('--');
    return parts[0] || 'unknown';
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}