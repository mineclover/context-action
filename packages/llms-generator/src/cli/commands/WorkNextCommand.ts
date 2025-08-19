import { promises as fs } from 'fs';
import path from 'path';
import { EnhancedLLMSConfig } from '../../types/config.js';

export interface WorkItem {
  documentId: string;
  category: string;
  language: string;
  characterLimit: number;
  status: 'missing_priority' | 'missing_template' | 'needs_content' | 'completed';
  priority: number;
  paths: {
    sourceDocument: string;
    priorityJson: string;
    templateFile: string;
  };
  metadata: {
    sourceExists: boolean;
    priorityExists: boolean;
    templateExists: boolean;
    hasContent: boolean;
    sourceSize?: number;
    lastModified?: string;
  };
}

export interface WorkNextOptions {
  language?: string;
  characterLimit?: number;
  category?: string;
  showCompleted?: boolean;
  limit?: number;
  sortBy?: 'priority' | 'category' | 'status' | 'modified';
}

export class WorkNextCommand {
  constructor(private config: EnhancedLLMSConfig) {}

  async execute(options: WorkNextOptions = {}): Promise<void> {
    console.log('🔍 Analyzing document work status...\n');

    const workItems = await this.scanWorkItems(options);
    const filteredItems = this.filterAndSort(workItems, options);

    if (filteredItems.length === 0) {
      console.log('🎉 No pending work items found!');
      console.log('   All documents are completed or no documents match your criteria.\n');
      return;
    }

    const nextItem = filteredItems[0];
    this.displayNextWorkItem(nextItem);
    
    if (options.limit && options.limit > 1) {
      this.displayWorkQueue(filteredItems.slice(1, options.limit), options);
    }

    this.displaySummaryStats(workItems);
  }

  private async scanWorkItems(options: WorkNextOptions): Promise<WorkItem[]> {
    const workItems: WorkItem[] = [];
    const languages = options.language ? [options.language] : this.config.generation.supportedLanguages;
    const characterLimits = options.characterLimit ? [options.characterLimit] : this.config.generation.characterLimits;

    for (const language of languages) {
      const languageDir = path.join(this.config.paths.llmContentDir, language);
      
      try {
        await fs.access(languageDir);
      } catch {
        continue; // Skip if language directory doesn't exist
      }

      const documentDirs = await fs.readdir(languageDir, { withFileTypes: true });
      
      for (const docDir of documentDirs) {
        if (!docDir.isDirectory()) continue;

        const documentId = docDir.name;
        const category = this.extractCategory(documentId);
        
        if (options.category && category !== options.category) continue;

        for (const charLimit of characterLimits) {
          const workItem = await this.analyzeWorkItem(documentId, category, language, charLimit);
          if (workItem) {
            workItems.push(workItem);
          }
        }
      }
    }

    return workItems;
  }

  private async analyzeWorkItem(
    documentId: string,
    category: string,
    language: string,
    characterLimit: number
  ): Promise<WorkItem | null> {
    const basePath = path.join(this.config.paths.llmContentDir, language, documentId);
    const sourceDocPath = this.resolveSourceDocumentPath(documentId, language);
    const priorityJsonPath = path.join(basePath, 'priority.json');
    const templatePath = path.join(basePath, `${documentId}-${characterLimit}.md`);

    try {
      // Check file existence
      const [sourceExists, priorityExists, templateExists] = await Promise.all([
        this.fileExists(sourceDocPath),
        this.fileExists(priorityJsonPath),
        this.fileExists(templatePath)
      ]);

      // Get metadata
      const metadata: WorkItem['metadata'] = {
        sourceExists,
        priorityExists,
        templateExists,
        hasContent: false
      };

      if (sourceExists) {
        const sourceStat = await fs.stat(sourceDocPath);
        metadata.sourceSize = sourceStat.size;
        metadata.lastModified = sourceStat.mtime.toISOString();
      }

      if (templateExists) {
        metadata.hasContent = await this.checkTemplateHasContent(templatePath);
      }

      // Determine status
      let status: WorkItem['status'];
      if (!sourceExists) {
        return null; // Skip if source document doesn't exist
      } else if (!priorityExists) {
        status = 'missing_priority';
      } else if (!templateExists) {
        status = 'missing_template';
      } else if (!metadata.hasContent) {
        status = 'needs_content';
      } else {
        status = 'completed';
      }

      // Get priority from config or priority.json
      let priority = this.config.categories?.[category]?.priority || 50;
      if (priorityExists) {
        try {
          const priorityData = JSON.parse(await fs.readFile(priorityJsonPath, 'utf-8'));
          priority = priorityData.priority?.score || priority;
        } catch {
          // Use default priority if JSON is malformed
        }
      }

      return {
        documentId,
        category,
        language,
        characterLimit,
        status,
        priority,
        paths: {
          sourceDocument: sourceDocPath,
          priorityJson: priorityJsonPath,
          templateFile: templatePath
        },
        metadata
      };
    } catch (error) {
      console.warn(`⚠️  Error analyzing ${documentId} (${language}/${characterLimit}):`, error);
      return null;
    }
  }

  private resolveSourceDocumentPath(documentId: string, language: string): string {
    // Convert document ID back to file path
    // api--action-only -> api/action-only.md
    // concept--architecture-guide -> concept/architecture-guide.md
    
    const parts = documentId.split('--');
    if (parts.length >= 2) {
      const [category, ...nameParts] = parts;
      const fileName = nameParts.join('-') + '.md';
      return path.join(this.config.paths.docsDir, language, category, fileName);
    }
    
    // Fallback: try direct mapping
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

  private async checkTemplateHasContent(templatePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      
      // Check if template has actual content beyond the generated template structure
      const contentSection = this.extractContentSection(content);
      
      if (!contentSection) return false;
      
      // Remove comments and whitespace for analysis
      const cleanContent = contentSection
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
        .replace(/^\s*\n/gm, '') // Remove empty lines
        .trim();
      
      // Look for actual summary content (not just template instructions)
      const hasRealContent = cleanContent.length > 30 && 
        !cleanContent.includes('여기에') && 
        !cleanContent.includes('작성하세요') &&
        !cleanContent.includes('Provide comprehensive guidance on') && // Template placeholder text
        !cleanContent.includes('의 핵심 개념과 Context-Action 프레임워크에서의 역할을 간단히 설명'); // Korean placeholder
        
      return hasRealContent;
    } catch {
      return false;
    }
  }

  private extractContentSection(templateContent: string): string {
    // Extract content from the "템플릿 내용" section
    const contentMatch = templateContent.match(/## 템플릿 내용[^]*?```markdown\s*([\s\S]*?)\s*```/);
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1].trim();
    }
    
    // Fallback: look for any markdown content blocks
    const fallbackMatch = templateContent.match(/```markdown\s*([\s\S]*?)\s*```/);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1].trim();
    }
    
    return '';
  }

  private filterAndSort(workItems: WorkItem[], options: WorkNextOptions): WorkItem[] {
    let filtered = workItems;

    // Filter by completion status
    if (!options.showCompleted) {
      filtered = filtered.filter(item => item.status !== 'completed');
    }

    // Sort by specified criteria
    const sortBy = options.sortBy || 'priority';
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          // Higher priority first, then by status severity
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return this.getStatusPriority(a.status) - this.getStatusPriority(b.status);
        
        case 'category':
          return a.category.localeCompare(b.category);
        
        case 'status':
          return this.getStatusPriority(a.status) - this.getStatusPriority(b.status);
        
        case 'modified': {
          const aTime = a.metadata.lastModified || '0';
          const bTime = b.metadata.lastModified || '0';
          return aTime.localeCompare(bTime);
        }
        
        default:
          return 0;
      }
    });

    return filtered;
  }

  private getStatusPriority(status: WorkItem['status']): number {
    const priorities = {
      'missing_priority': 1,
      'missing_template': 2,
      'needs_content': 3,
      'completed': 4
    };
    return priorities[status] || 99;
  }

  private displayNextWorkItem(item: WorkItem): void {
    console.log('🎯 Next Work Item\n');
    console.log(`📄 Document: ${item.documentId}`);
    console.log(`📁 Category: ${item.category}`);
    console.log(`🌐 Language: ${item.language}`);
    console.log(`📏 Character Limit: ${item.characterLimit}`);
    console.log(`⭐ Priority: ${item.priority}`);
    console.log(`📊 Status: ${this.getStatusEmoji(item.status)} ${this.getStatusDescription(item.status)}`);
    
    if (item.metadata.sourceSize) {
      console.log(`📖 Source Size: ${this.formatFileSize(item.metadata.sourceSize)}`);
    }
    
    console.log('\n📂 File Paths:');
    console.log(`   📄 Source: ${item.paths.sourceDocument}`);
    console.log(`   🏷️  Priority: ${item.paths.priorityJson}`);
    console.log(`   📝 Template: ${item.paths.templateFile}`);

    console.log('\n🔧 Recommended Actions:');
    this.displayRecommendedActions(item);
    console.log();
  }

  private displayRecommendedActions(item: WorkItem): void {
    switch (item.status) {
      case 'missing_priority':
        console.log('   1. Generate priority.json:');
        console.log(`      npx @context-action/llms-generator priority-generate ${item.language} --document-id ${item.documentId}`);
        console.log('   2. Then re-run work-next to see next steps');
        break;
      
      case 'missing_template':
        console.log('   1. Generate template file:');
        console.log(`      npx @context-action/llms-generator template-generate --document-id ${item.documentId} --character-limit ${item.characterLimit}`);
        console.log('   2. Then edit the template content');
        break;
      
      case 'needs_content':
        console.log('   1. Read the source document:');
        console.log(`      # Source document (${this.formatFileSize(item.metadata.sourceSize || 0)})`);
        console.log(`      cat "${item.paths.sourceDocument}"`);
        console.log('   2. Edit the template file:');
        console.log(`      # Template file`);
        console.log(`      code "${item.paths.templateFile}"`);
        console.log('   3. Write a concise summary in the "템플릿 내용" section');
        console.log(`   4. Keep it under ${item.characterLimit} characters`);
        break;
      
      case 'completed':
        console.log('   ✅ This item is completed!');
        console.log('   You can review or update the content if needed.');
        break;
    }
  }

  private displayWorkQueue(items: WorkItem[], _options: WorkNextOptions): void {
    if (items.length === 0) return;

    console.log(`📋 Work Queue (Next ${items.length} items)\n`);
    
    items.forEach((item, index) => {
      const statusIcon = this.getStatusEmoji(item.status);
      console.log(`${index + 2}. ${statusIcon} ${item.documentId} (${item.language}/${item.characterLimit})`);
      console.log(`   Priority: ${item.priority} | Category: ${item.category}`);
    });
    
    console.log();
  }

  private displaySummaryStats(workItems: WorkItem[]): void {
    const stats = {
      total: workItems.length,
      byStatus: {} as Record<WorkItem['status'], number>,
      byLanguage: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    workItems.forEach(item => {
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      stats.byLanguage[item.language] = (stats.byLanguage[item.language] || 0) + 1;
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    });

    console.log('📊 Summary Statistics\n');
    console.log(`Total Items: ${stats.total}`);
    
    console.log('\nBy Status:');
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      const emoji = this.getStatusEmoji(status as WorkItem['status']);
      console.log(`  ${emoji} ${this.getStatusDescription(status as WorkItem['status'])}: ${count}`);
    });
    
    console.log('\nBy Language:');
    Object.entries(stats.byLanguage).forEach(([lang, count]) => {
      console.log(`  🌐 ${lang}: ${count}`);
    });
    
    console.log('\nBy Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`  📁 ${category}: ${count}`);
    });
    
    console.log();
  }

  private getStatusEmoji(status: WorkItem['status']): string {
    const emojis = {
      'missing_priority': '🔴',
      'missing_template': '🟡',
      'needs_content': '🟠',
      'completed': '✅'
    };
    return emojis[status] || '❓';
  }

  private getStatusDescription(status: WorkItem['status']): string {
    const descriptions = {
      'missing_priority': 'Missing Priority JSON',
      'missing_template': 'Missing Template',
      'needs_content': 'Needs Content',
      'completed': 'Completed'
    };
    return descriptions[status] || 'Unknown';
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}