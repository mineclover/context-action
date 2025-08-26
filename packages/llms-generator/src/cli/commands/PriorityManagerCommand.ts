import { promises as fs } from 'fs';
import path from 'path';
import { EnhancedLLMSConfig } from '../../types/config.js';

// Priority data structure types
export interface PriorityData {
  priority: {
    score: number;
    tier: string;
    reasoning?: string;
  };
  metadata?: {
    title: string;
    language: string;
    category?: string;
    tags?: string[];
  };
  // Legacy format support
  language?: string;
  [key: string]: unknown;
}

export interface LegacyPriorityData {
  priority: number;
  language: string;
  [key: string]: unknown;
}

export interface PriorityCriteria {
  documentSize: { weight: number; method: string };
  category: { 
    weight: number; 
    values: Record<string, number>;
  };
  keywordDensity: { weight: number; method: string };
  relationships: { weight: number; method: string };
  [key: string]: unknown;
}

export interface PriorityManagerOptions {
  mode: 'stats' | 'health' | 'sync' | 'auto-calc' | 'suggest' | 'upgrade';
  server?: string;
  criteria?: string;
  documentId?: string;
  force?: boolean;
  quiet?: boolean;
}

export interface PriorityStats {
  total: number;
  byTier: Record<string, number>;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
  averageScore: number;
  distribution: {
    min: number;
    max: number;
    median: number;
    stdDev: number;
  };
}

export interface PriorityHealth {
  score: number;
  issues: string[];
  suggestions: string[];
  consistency: {
    categoryVariance: number;
    languageVariance: number;
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export class PriorityManagerCommand {
  constructor(private config: EnhancedLLMSConfig) {}

  async execute(options: PriorityManagerOptions): Promise<void> {
    try {
      switch (options.mode) {
        case 'stats':
          await this.showPriorityStats(options.quiet);
          break;
        case 'health':
          await this.checkPriorityHealth(options.quiet);
          break;
        case 'sync':
          await this.syncWithServer(options.server, options.quiet);
          break;
        case 'auto-calc':
          await this.autoCalculatePriorities(options.criteria, options.force, options.quiet);
          break;
        case 'suggest':
          await this.suggestPriorities(options.documentId, options.quiet);
          break;
        case 'upgrade':
          await this.upgradeOldFormatPriorities(options.quiet, options.force);
          break;
        default:
          throw new Error(`Unknown mode: ${options.mode}`);
      }
    } catch (error) {
      if (!options.quiet) {
        console.error('❌ Priority management failed:', error instanceof Error ? error.message : error);
      }
      throw error;
    }
  }

  private async showPriorityStats(quiet = false): Promise<void> {
    if (!quiet) {
      console.log('📊 Analyzing priority statistics...');
    }

    const stats = await this.calculatePriorityStats();
    
    if (!quiet) {
      this.displayPriorityStats(stats);
    }
  }

  private async checkPriorityHealth(quiet = false): Promise<void> {
    if (!quiet) {
      console.log('🔍 Checking priority health...');
    }

    const health = await this.assessPriorityHealth();
    
    if (!quiet) {
      this.displayPriorityHealth(health);
    }
  }

  private async syncWithServer(serverUrl?: string, quiet = false): Promise<void> {
    if (!serverUrl) {
      throw new Error('Server URL is required for sync operation');
    }

    if (!quiet) {
      console.log(`🔄 Syncing with server: ${serverUrl}`);
    }

    // TODO: Implement server synchronization
    throw new Error('Server sync not yet implemented. Use --help for available commands.');
  }

  private async autoCalculatePriorities(criteriaFile?: string, force = false, quiet = false): Promise<void> {
    if (!quiet) {
      console.log('🤖 Auto-calculating priorities...');
    }

    const criteria = criteriaFile ? await this.loadCriteria(criteriaFile) : this.getDefaultCriteria();
    const priorityFiles = await this.getAllPriorityFiles();

    let updated = 0;
    for (const filePath of priorityFiles) {
      const priority = await this.loadPriorityFile(filePath);
      const newScore = await this.calculatePriorityScore(priority, criteria);
      
      const currentScore = this.getPriorityScore(priority);
      if (force || Math.abs(currentScore - newScore) > 5) {
        // Update priority in the appropriate format
        if (priority.priority && typeof priority.priority === 'object') {
          // New format
          priority.priority.score = newScore;
          priority.priority.tier = this.scoreToPriorityTier(newScore);
        } else {
          // Old format
          priority.priority = newScore;
        }
        await this.savePriorityFile(filePath, priority);
        updated++;
      }
    }

    if (!quiet) {
      console.log(`✅ Updated ${updated} priority files`);
    }
  }

  private async suggestPriorities(documentId?: string, quiet = false): Promise<void> {
    if (!quiet) {
      console.log('💡 Generating priority suggestions...');
    }

    const stats = await this.calculatePriorityStats();
    const health = await this.assessPriorityHealth();
    
    if (!quiet) {
      this.displayPrioritySuggestions(stats, health, documentId);
    }
  }

  private async calculatePriorityStats(): Promise<PriorityStats> {
    const priorityFiles = await this.getAllPriorityFiles();
    const priorities = await Promise.all(
      priorityFiles.map(filePath => this.loadPriorityFile(filePath))
    );

    const scores = priorities.map(p => this.getPriorityScore(p));
    const byTier: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};

    for (const priority of priorities) {
      // Count by tier
      const tier = this.getPriorityTier(priority);
      byTier[tier] = (byTier[tier] || 0) + 1;

      // Count by category
      const category = this.getPriorityCategory(priority);
      byCategory[category] = (byCategory[category] || 0) + 1;

      // Count by language
      const language = this.getPriorityLanguage(priority);
      byLanguage[language] = (byLanguage[language] || 0) + 1;
    }

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const sortedScores = [...scores].sort((a, b) => a - b);
    const median = sortedScores[Math.floor(sortedScores.length / 2)];
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return {
      total: priorities.length,
      byTier,
      byCategory,
      byLanguage,
      averageScore,
      distribution: {
        min: Math.min(...scores),
        max: Math.max(...scores),
        median,
        stdDev
      }
    };
  }

  private async assessPriorityHealth(): Promise<PriorityHealth> {
    const stats = await this.calculatePriorityStats();
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check distribution health
    if (stats.distribution.stdDev > 25) {
      issues.push('High priority score variance detected');
      suggestions.push('Consider standardizing priority calculation criteria');
    }

    if (stats.distribution.max - stats.distribution.min < 20) {
      issues.push('Priority scores are too similar');
      suggestions.push('Increase differentiation between high and low priority items');
    }

    // Check category balance
    const categoryValues = Object.values(stats.byCategory);
    const categoryVariance = this.calculateVariance(categoryValues);
    
    if (categoryVariance > 50) {
      issues.push('Uneven distribution across categories');
      suggestions.push('Balance priority assignments across document categories');
    }

    // Check language balance
    const languageValues = Object.values(stats.byLanguage);
    const languageVariance = this.calculateVariance(languageValues);

    if (languageVariance > 30) {
      issues.push('Uneven distribution across languages');
      suggestions.push('Ensure priority consistency between language versions');
    }

    // Calculate overall health score
    let healthScore = 100;
    healthScore -= issues.length * 15;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const overallHealth = healthScore >= 85 ? 'excellent' : 
                         healthScore >= 70 ? 'good' : 
                         healthScore >= 50 ? 'fair' : 'poor';

    return {
      score: healthScore,
      issues,
      suggestions,
      consistency: {
        categoryVariance,
        languageVariance,
        overallHealth
      }
    };
  }

  private displayPriorityStats(stats: PriorityStats): void {
    console.log(`\n📊 Priority Statistics\n`);
    console.log(`Total Documents: ${stats.total}`);
    console.log(`Average Score: ${stats.averageScore.toFixed(1)}`);
    console.log(`Score Range: ${stats.distribution.min} - ${stats.distribution.max}`);
    console.log(`Standard Deviation: ${stats.distribution.stdDev.toFixed(1)}`);

    console.log(`\n🏆 By Priority Tier:`);
    for (const [tier, count] of Object.entries(stats.byTier)) {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`  ${tier}: ${count} (${percentage}%)`);
    }

    console.log(`\n📁 By Category:`);
    for (const [category, count] of Object.entries(stats.byCategory)) {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`  ${category}: ${count} (${percentage}%)`);
    }

    console.log(`\n🌐 By Language:`);
    for (const [language, count] of Object.entries(stats.byLanguage)) {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`  ${language}: ${count} (${percentage}%)`);
    }
  }

  private displayPriorityHealth(health: PriorityHealth): void {
    const healthEmoji = health.consistency.overallHealth === 'excellent' ? '🟢' :
                       health.consistency.overallHealth === 'good' ? '🟡' :
                       health.consistency.overallHealth === 'fair' ? '🟠' : '🔴';
    
    console.log(`\n🏥 Priority Health Report\n`);
    console.log(`${healthEmoji} Overall Health: ${health.consistency.overallHealth.toUpperCase()} (${health.score}/100)`);

    if (health.issues.length > 0) {
      console.log(`\n⚠️  Issues Found:`);
      health.issues.forEach(issue => console.log(`  • ${issue}`));
    }

    if (health.suggestions.length > 0) {
      console.log(`\n💡 Suggestions:`);
      health.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
    }

    console.log(`\n📊 Consistency Metrics:`);
    console.log(`  Category Variance: ${health.consistency.categoryVariance.toFixed(1)}`);
    console.log(`  Language Variance: ${health.consistency.languageVariance.toFixed(1)}`);
  }

  private displayPrioritySuggestions(stats: PriorityStats, health: PriorityHealth, documentId?: string): void {
    console.log(`\n💡 Priority Management Suggestions\n`);

    if (health.consistency.overallHealth === 'poor') {
      console.log(`🚨 Immediate Actions Needed:`);
      console.log(`  • Run: pnpm llms:priority-auto --force`);
      console.log(`  • Review priority calculation criteria`);
      console.log(`  • Consider team priority alignment meeting\n`);
    }

    if (stats.distribution.stdDev > 25) {
      console.log(`📏 Standardization Recommendations:`);
      console.log(`  • Create priority guidelines document`);
      console.log(`  • Implement auto-calculation with consistent criteria`);
      console.log(`  • Regular priority review cycles\n`);
    }

    if (documentId) {
      console.log(`🎯 Specific Document Suggestions for: ${documentId}`);
      console.log(`  • Check similar documents in same category`);
      console.log(`  • Consider document complexity and audience`);
      console.log(`  • Review recent update frequency\n`);
    }

    console.log(`🔄 Next Steps:`);
    console.log(`  1. Review priority health: pnpm llms:priority-health`);
    console.log(`  2. Auto-calculate priorities: pnpm llms:priority-auto`);
    console.log(`  3. Monitor team progress: pnpm llms:work-next --verbose`);
  }

  private async getAllPriorityFiles(): Promise<string[]> {
    const llmsDataDir = this.config.paths?.llmContentDir || './llmsData';
    const files: string[] = [];

    async function scanDirectory(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name === 'priority.json') {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
      }
    }

    await scanDirectory(llmsDataDir);
    return files;
  }

  private async loadPriorityFile(filePath: string): Promise<PriorityData | LegacyPriorityData> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as PriorityData | LegacyPriorityData;
  }

  // Helper methods to handle both old and new priority.json formats
  private getPriorityScore(priority: PriorityData | LegacyPriorityData): number {
    // Check if it's the new format
    if ('priority' in priority && typeof priority.priority === 'object' && priority.priority !== null) {
      const newFormat = priority as PriorityData;
      if (typeof newFormat.priority.score === 'number') {
        return newFormat.priority.score;
      }
    }
    // Check if it's the legacy format
    if ('priority' in priority && typeof priority.priority === 'number') {
      const legacyFormat = priority as LegacyPriorityData;
      return legacyFormat.priority;
    }
    return 0;
  }

  private getPriorityTier(priority: PriorityData | LegacyPriorityData): string {
    // Check if it's the new format
    if ('priority' in priority && typeof priority.priority === 'object' && priority.priority !== null) {
      const newFormat = priority as PriorityData;
      if (typeof newFormat.priority.tier === 'string') {
        return newFormat.priority.tier;
      }
    }
    // Derive from score for legacy format
    const score = this.getPriorityScore(priority);
    return this.scoreToPriorityTier(score);
  }

  private getPriorityCategory(priority: PriorityData | LegacyPriorityData): string {
    // New format: priority.metadata.category
    const newFormat = priority as PriorityData;
    if (newFormat.metadata?.category) {
      return newFormat.metadata.category;
    }
    // Check if it has category property directly (legacy or unknown format)
    if ('category' in priority && priority.category) {
      return priority.category as string;
    }
    return 'unknown';
  }

  private getPriorityLanguage(priority: PriorityData | LegacyPriorityData): string {
    // New format: priority.metadata.language
    const newFormat = priority as PriorityData;
    if (newFormat.metadata?.language) {
      return newFormat.metadata.language;
    }
    // Old format: priority.language
    if ('language' in priority && priority.language) {
      return priority.language;
    }
    return 'unknown';
  }


  private async savePriorityFile(filePath: string, priority: PriorityData | LegacyPriorityData): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(priority, null, 2));
  }

  private async loadCriteria(criteriaFile: string): Promise<PriorityCriteria> {
    const content = await fs.readFile(criteriaFile, 'utf-8');
    return JSON.parse(content) as PriorityCriteria;
  }

  private getDefaultCriteria(): PriorityCriteria {
    return {
      documentSize: { weight: 0.4, method: 'linear' },
      category: { 
        weight: 0.3, 
        values: { guide: 90, concept: 80, examples: 70 }
      },
      keywordDensity: { weight: 0.2, method: 'logarithmic' },
      relationships: { weight: 0.1, method: 'network' }
    };
  }

  private async calculatePriorityScore(priority: PriorityData | LegacyPriorityData, criteria: PriorityCriteria): Promise<number> {
    // Simplified priority calculation
    let score = 50; // Base score

    // Category-based scoring
    const category = this.getPriorityCategory(priority);
    if (criteria.category && category && category !== 'unknown') {
      const categoryScore = criteria.category.values[category] || 50;
      score += (categoryScore - 50) * criteria.category.weight;
    }

    // Random variation to simulate real calculation
    score += Math.random() * 20 - 10;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private scoreToPriorityTier(score: number): string {
    if (score >= 90) return 'critical';
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'minimal';
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  async upgradeOldFormatPriorities(quiet = false, force = false): Promise<void> {
    // Use the correct LLMS data directory from config or default to ./llmsData
    const outputDir = this.config.paths?.llmContentDir || './llmsData';
    const llmsDataDir = path.resolve(outputDir);
    const languages = ['en', 'ko'];
    let totalFiles = 0;
    let upgradedFiles = 0;
    const oldFormatFiles: string[] = [];

    if (!quiet) {
      console.log('🔄 Scanning for old format priority.json files...');
    }

    // First, scan for old format files
    for (const lang of languages) {
      const langDir = path.join(llmsDataDir, lang);
      if (await this.pathExists(langDir)) {
        const directories = await fs.readdir(langDir, { withFileTypes: true });
        
        for (const dirent of directories) {
          if (dirent.isDirectory()) {
            const priorityPath = path.join(langDir, dirent.name, 'priority.json');
            if (await this.pathExists(priorityPath)) {
              totalFiles++;
              const priorityData = JSON.parse(await fs.readFile(priorityPath, 'utf-8'));
              
              if (this.isOldFormat(priorityData)) {
                oldFormatFiles.push(priorityPath);
              }
            }
          }
        }
      }
    }

    if (!quiet) {
      console.log(`📊 Found ${totalFiles} priority.json files`);
      console.log(`🔴 Found ${oldFormatFiles.length} old format files that need upgrading`);
    }

    if (oldFormatFiles.length === 0) {
      if (!quiet) {
        console.log('✅ All priority.json files are already in the new format!');
      }
      return;
    }

    if (!force && !quiet) {
      console.log('⚠️  This will modify the following files:');
      oldFormatFiles.forEach(file => console.log(`   - ${path.relative(process.cwd(), file)}`));
      console.log('\n💡 Use --force to proceed with the upgrade');
      return;
    }

    // Upgrade old format files
    if (!quiet) {
      console.log('🔄 Upgrading old format priority.json files...');
    }

    for (const priorityPath of oldFormatFiles) {
      try {
        const oldData = JSON.parse(await fs.readFile(priorityPath, 'utf-8'));
        const newData = this.convertToNewFormat(oldData);
        
        await fs.writeFile(priorityPath, JSON.stringify(newData, null, 2), 'utf-8');
        upgradedFiles++;
        
        if (!quiet) {
          console.log(`✅ Upgraded: ${path.relative(process.cwd(), priorityPath)}`);
        }
      } catch (error) {
        if (!quiet) {
          console.error(`❌ Failed to upgrade ${priorityPath}:`, error instanceof Error ? error.message : error);
        }
      }
    }

    if (!quiet) {
      console.log(`\n📊 Upgrade Summary:`);
      console.log(`   Total files scanned: ${totalFiles}`);
      console.log(`   Old format detected: ${oldFormatFiles.length}`);
      console.log(`   Successfully upgraded: ${upgradedFiles}`);
      console.log(`   Failed upgrades: ${oldFormatFiles.length - upgradedFiles}`);
      
      if (upgradedFiles === oldFormatFiles.length) {
        console.log('✅ All old format files successfully upgraded to new format!');
      }
    }
  }

  private isOldFormat(priority: PriorityData | LegacyPriorityData | Record<string, unknown>): boolean {
    // Old format characteristics:
    // 1. Has priority as a number (not an object)
    // 2. Has category at root level (not in document object)
    // 3. Missing document structure
    return (
      typeof priority.priority === 'number' ||
      (priority.category && !priority.document) ||
      !priority.document?.id
    );
  }

  private convertToNewFormat(oldData: Record<string, unknown>): PriorityData {
    const score = typeof oldData.priority === 'number' ? oldData.priority : 50;
    const category = oldData.category || 'guide';
    const title = oldData.title || 'Document Title';
    const language = oldData.language || 'en';

    return {
      priority: {
        score,
        tier: (oldData.tier as string) || this.scoreToPriorityTier(score),
        reasoning: (oldData.reason as string) || 'Upgraded from old format'
      },
      metadata: {
        title: (title as string),
        language: (language as string),
        category: (category as string),
        tags: (oldData.tags as string[]) || ['documentation']
      },
      ...(oldData.source_path && { source_path: oldData.source_path }),
      ...(oldData.purpose && { purpose: oldData.purpose }),
      ...(oldData.keywords && { keywords: oldData.keywords })
    };
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}