/**
 * @fileoverview Translation status checker for multi-language documentation
 * 
 * 역할: docs/ 디렉토리의 다국어 문서 동기화 상태 검사
 * - 링크 구조 기반 번역 상태 추적
 * - 파일 수정 시간 기반 동기화 필요성 판단
 * - 번역 우선순위 제안
 * 
 * 경계:
 * - 오직 docs/ 디렉토리만 대상 (코드 스캔하지 않음)
 * - 용어 검증하지 않음 (validator와 구분)
 * - 구현 상태 분석하지 않음 (scanner와 구분)
 */

import fs from 'fs';
import path from 'path';

/**
 * Translation checker configuration
 */
export interface TranslationConfig {
  /** Base language (reference) */
  baseLanguage: string;
  /** Target languages to check */
  targetLanguages: string[];
  /** File patterns to check */
  filePatterns: string[];
  /** Patterns to exclude */
  excludePatterns: string[];
  /** Priority weights by category */
  priorityWeights: Record<string, number>;
  /** Root directory containing docs/ */
  rootDir: string;
}

/**
 * File analysis result
 */
export interface FileAnalysis {
  relativePath: string;
  category: string;
  priority: number;
  baseFile: {
    exists: boolean;
    modifiedTime: Date | null;
    size: number;
  };
  targetFile: {
    exists: boolean;
    modifiedTime: Date | null;
    size: number;
  };
  status: 'missing' | 'outdated' | 'upToDate';
  daysBehind: number;
  needsUpdate: boolean;
}

/**
 * Language pair status
 */
export interface LanguageStatus {
  language: string;
  files: FileAnalysis[];
  summary: {
    total: number;
    translated: number;
    outdated: number;
    missing: number;
    upToDate: number;
  };
}

/**
 * Translation summary report
 */
export interface TranslationSummary {
  timestamp: string;
  baseLanguage: string;
  totalFiles: number;
  languages: Record<string, {
    total: number;
    translated: number;
    outdated: number;
    missing: number;
    upToDate: number;
    completionRate: string;
  }>;
  priorities: {
    high: Array<{
      language: string;
      file: string;
      category: string;
      priority: number;
      status: string;
      daysBehind: number;
    }>;
    medium: Array<{
      language: string;
      file: string;
      category: string;
      priority: number;
      status: string;
      daysBehind: number;
    }>;
    low: Array<{
      language: string;
      file: string;
      category: string;
      priority: number;
      status: string;
      daysBehind: number;
    }>;
  };
}

/**
 * Default translation checker configuration
 */
const DEFAULT_CONFIG: Omit<TranslationConfig, 'rootDir'> = {
  baseLanguage: 'en',
  targetLanguages: ['ko'],
  filePatterns: ['**/*.md'],
  excludePatterns: [
    'index.md',           // Language selection page
    'public/**',          // Static assets
    '**/node_modules/**', 
    '**/dist/**'
  ],
  priorityWeights: {
    guide: 3,        // Learning guides have high priority
    api: 2,          // API docs have medium priority  
    examples: 2,     // Examples have medium priority
    other: 1         // Others have low priority
  }
};

/**
 * Translation status checker
 */
export class TranslationChecker {
  private config: TranslationConfig;
  private docsDir: string;

  constructor(config: Partial<TranslationConfig> & { rootDir: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.docsDir = path.join(this.config.rootDir, 'docs');
  }

  /**
   * Check translation status for all target languages
   */
  async check(): Promise<TranslationSummary> {
    // 1. Scan base language files
    const baseFiles = await this.scanLanguageFiles(this.config.baseLanguage);
    
    // 2. Check each target language
    const translationStatus: Record<string, LanguageStatus> = {};
    
    for (const lang of this.config.targetLanguages) {
      translationStatus[lang] = await this.checkLanguagePair(baseFiles, lang);
    }
    
    // 3. Generate summary
    return this.generateSummary(baseFiles, translationStatus);
  }

  /**
   * Scan files for a specific language
   */
  private async scanLanguageFiles(language: string): Promise<Array<{
    fullPath: string;
    relativePath: string;
    category: string;
    stats: fs.Stats;
  }>> {
    const langDir = path.join(this.docsDir, language);
    
    if (!fs.existsSync(langDir)) {
      return [];
    }
    
    const files = this.walkDirectory(langDir, this.config.filePatterns, this.config.excludePatterns);
    
    return files.map(file => ({
      fullPath: file,
      relativePath: path.relative(langDir, file),
      category: this.inferFileCategory(file),
      stats: fs.statSync(file)
    }));
  }

  /**
   * Walk directory and find matching files
   */
  private walkDirectory(dir: string, patterns: string[], excludes: string[] = []): string[] {
    const files: string[] = [];
    
    const walk = (currentDir: string) => {
      if (!fs.existsSync(currentDir)) return;
      
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);
        
        // Check exclude patterns
        if (excludes.some(exclude => relativePath.includes(exclude.replace('**/', '')))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          // Pattern matching (simple *.md matching)
          if (patterns.some(pattern => {
            const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
            return new RegExp(regex).test(relativePath);
          })) {
            files.push(fullPath);
          }
        }
      }
    };
    
    walk(dir);
    return files;
  }

  /**
   * Check translation status between language pair
   */
  private async checkLanguagePair(baseFiles: Array<{
    fullPath: string;
    relativePath: string;
    category: string;
    stats: fs.Stats;
  }>, targetLang: string): Promise<LanguageStatus> {
    const targetFiles = await this.scanLanguageFiles(targetLang);
    const targetFileMap = new Map(
      targetFiles.map(file => [file.relativePath, file])
    );
    
    const pairStatus: LanguageStatus = {
      language: targetLang,
      files: [],
      summary: {
        total: baseFiles.length,
        translated: 0,
        outdated: 0,
        missing: 0,
        upToDate: 0
      }
    };
    
    for (const baseFile of baseFiles) {
      const targetFile = targetFileMap.get(baseFile.relativePath);
      const fileStatus = this.analyzeFilePair(baseFile, targetFile);
      
      pairStatus.files.push(fileStatus);
      pairStatus.summary[fileStatus.status]++;
    }
    
    return pairStatus;
  }

  /**
   * Analyze individual file pair
   */
  private analyzeFilePair(baseFile: {
    fullPath: string;
    relativePath: string;
    category: string;
    stats: fs.Stats;
  }, targetFile?: {
    fullPath: string;
    relativePath: string;
    category: string;
    stats: fs.Stats;
  }): FileAnalysis {
    const analysis: FileAnalysis = {
      relativePath: baseFile.relativePath,
      category: baseFile.category,
      priority: this.calculateFilePriority(baseFile),
      baseFile: {
        exists: true,
        modifiedTime: baseFile.stats.mtime,
        size: baseFile.stats.size
      },
      targetFile: {
        exists: !!targetFile,
        modifiedTime: targetFile?.stats.mtime || null,
        size: targetFile?.stats.size || 0
      },
      status: 'missing',
      daysBehind: 0,
      needsUpdate: false
    };
    
    if (!targetFile) {
      analysis.status = 'missing';
      analysis.needsUpdate = true;
    } else {
      const timeDiff = baseFile.stats.mtime.getTime() - targetFile.stats.mtime.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      analysis.daysBehind = Math.max(0, daysDiff);
      
      if (daysDiff > 0) {
        analysis.status = 'outdated';
        analysis.needsUpdate = true;
      } else {
        analysis.status = 'upToDate';
        analysis.needsUpdate = false;
      }
    }
    
    return analysis;
  }

  /**
   * Infer file category from path
   */
  private inferFileCategory(filePath: string): string {
    const pathParts = filePath.toLowerCase().split('/');
    
    if (pathParts.includes('guide')) return 'guide';
    if (pathParts.includes('api')) return 'api';
    if (pathParts.includes('examples')) return 'examples';
    
    return 'other';
  }

  /**
   * Calculate file priority
   */
  private calculateFilePriority(file: {
    relativePath: string;
    category: string;
  }): number {
    const baseWeight = this.config.priorityWeights[file.category] || 1;
    
    // Additional weight based on file name
    const fileName = path.basename(file.relativePath, '.md').toLowerCase();
    let nameWeight = 1;
    
    if (fileName.includes('getting-started') || fileName === 'index') {
      nameWeight = 2; // High priority for getting started guides
    }
    
    return baseWeight * nameWeight;
  }

  /**
   * Generate translation summary
   */
  private generateSummary(baseFiles: Array<{
    fullPath: string;
    relativePath: string;
    category: string;
    stats: fs.Stats;
  }>, translationStatus: Record<string, LanguageStatus>): TranslationSummary {
    const summary: TranslationSummary = {
      timestamp: new Date().toISOString(),
      baseLanguage: this.config.baseLanguage,
      totalFiles: baseFiles.length,
      languages: {},
      priorities: {
        high: [],   // priority >= 6
        medium: [], // priority 3-5
        low: []     // priority < 3
      }
    };
    
    // Language summaries
    for (const [lang, status] of Object.entries(translationStatus)) {
      summary.languages[lang] = {
        ...status.summary,
        completionRate: ((status.summary.upToDate + status.summary.outdated) / status.summary.total * 100).toFixed(1)
      };
      
      // Priority classification
      for (const file of status.files) {
        if (!file.needsUpdate) continue;
        
        const item = {
          language: lang,
          file: file.relativePath,
          category: file.category,
          priority: file.priority,
          status: file.status,
          daysBehind: file.daysBehind
        };
        
        if (file.priority >= 6) {
          summary.priorities.high.push(item);
        } else if (file.priority >= 3) {
          summary.priorities.medium.push(item);
        } else {
          summary.priorities.low.push(item);
        }
      }
    }
    
    // Sort by priority
    for (const priority in summary.priorities) {
      summary.priorities[priority as keyof typeof summary.priorities].sort((a, b) => b.priority - a.priority);
    }
    
    return summary;
  }
}

/**
 * Create translation checker with default configuration
 */
export function createTranslationChecker(rootDir: string, config?: Partial<TranslationConfig>): TranslationChecker {
  return new TranslationChecker({ rootDir, ...config });
}