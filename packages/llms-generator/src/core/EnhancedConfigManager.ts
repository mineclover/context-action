/**
 * Enhanced Configuration Manager - handles enhanced config with categories, tags, and composition strategies
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { 
  EnhancedLLMSConfig,
  CategoryConfig,
  TagConfig,
  CompositionStrategyConfig,
  ExtractStrategy,
  DependencyConfig,
  CompositionConfig,
  ExtractionConfig,
  ValidationConfig,
  UIConfig,
  // DocumentCategory - temporarily commented out
} from '../types/config.js';


export interface ConfigPreset {
  name: string;
  description: string;
  characterLimits: number[];
  languages: string[];
  categories: Record<string, CategoryConfig>;
  tags: Record<string, TagConfig>;
}

export class EnhancedConfigManager {
  private configPath: string;
  private config: EnhancedLLMSConfig | null = null;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'llms-generator.config.json');
  }

  /**
   * Load configuration from file
   */
  async loadConfig(customPath?: string): Promise<EnhancedLLMSConfig> {
    const configPath = customPath || this.configPath;
    
    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const configContent = await readFile(configPath, 'utf-8');
    const baseConfig = JSON.parse(configContent);

    // Enhance basic config with defaults if needed
    this.config = this.enhanceBasicConfig(baseConfig);
    
    return this.config;
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: EnhancedLLMSConfig, customPath?: string): Promise<void> {
    this.config = config;
    const jsonContent = JSON.stringify(config, null, 2);
    await writeFile(customPath || this.configPath, jsonContent, 'utf-8');
  }

  /**
   * Validate configuration structure
   */
  validateConfig(config: EnhancedLLMSConfig): void {
    // Validate paths
    if (!config.paths) {
      throw new Error('Missing paths configuration');
    }
    if (!config.paths.docsDir) {
      throw new Error('Missing docs directory path');
    }
    if (!config.paths.outputDir) {
      throw new Error('Missing output directory path');
    }

    // Validate generation config
    if (!config.generation) {
      throw new Error('Missing generation configuration section');
    }
    if (!config.generation.characterLimits) {
      throw new Error('Missing character limits in generation config');
    }

    // Validate categories
    if (config.categories) {
      for (const [key, category] of Object.entries(config.categories)) {
        if (!category.name) {
          throw new Error(`Category ${key} missing name`);
        }
        if (category.priority !== undefined && (category.priority < 0 || category.priority > 100)) {
          throw new Error(`Category ${key} priority must be between 0 and 100`);
        }
      }
    }

    // Validate tags
    if (config.tags) {
      for (const [key, tag] of Object.entries(config.tags)) {
        if (!tag.name) {
          throw new Error(`Tag ${key} missing name`);
        }
        if (tag.weight !== undefined && tag.weight < 0) {
          throw new Error(`Tag ${key} weight must be non-negative`);
        }
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EnhancedLLMSConfig | null {
    return this.config;
  }

  /**
   * Initialize configuration with preset
   */
  async initializeConfig(presetName: string): Promise<EnhancedLLMSConfig> {
    const preset = this.getConfigPreset(presetName);
    const config = this.createConfigFromPreset(preset);
    await this.saveConfig(config);
    return config;
  }

  /**
   * Get available configuration presets
   */
  getConfigPreset(presetName: string): ConfigPreset {
    const presets: Record<string, ConfigPreset> = {
      standard: {
        name: 'Standard Configuration',
        description: 'Balanced configuration for most documentation projects',
        characterLimits: [100, 300, 1000, 2000],
        languages: ['ko', 'en'],
        categories: this.getStandardCategories(),
        tags: this.getStandardTags()
      },
      
      minimal: {
        name: 'Minimal Configuration',
        description: 'Lightweight setup for small projects',
        characterLimits: [100, 500],
        languages: ['en'],
        categories: this.getMinimalCategories(),
        tags: this.getMinimalTags()
      },
      
      extended: {
        name: 'Extended Configuration',
        description: 'Comprehensive setup for large documentation systems',
        characterLimits: [50, 100, 300, 500, 1000, 2000, 4000],
        languages: ['ko', 'en', 'ja'],
        categories: this.getExtendedCategories(),
        tags: this.getExtendedTags()
      },
      
      blog: {
        name: 'Blog Configuration',
        description: 'Optimized for blog-style content',
        characterLimits: [200, 500, 1500],
        languages: ['en'],
        categories: this.getBlogCategories(),
        tags: this.getBlogTags()
      }
    };

    const preset = presets[presetName];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}. Available: ${Object.keys(presets).join(', ')}`);
    }

    return preset;
  }

  /**
   * Create enhanced config from preset
   */
  private createConfigFromPreset(preset: ConfigPreset): EnhancedLLMSConfig {
    return {
      // Basic configuration
      paths: {
        docsDir: './docs',
        llmContentDir: './packages/llms-generator/data',
        outputDir: './docs/llms',
        templatesDir: './packages/llms-generator/templates',
        instructionsDir: './packages/llms-generator/instructions'
      },
      
      generation: {
        supportedLanguages: preset.languages,
        characterLimits: preset.characterLimits,
        defaultLanguage: preset.languages[0] || 'en',
        outputFormat: 'txt' as const
      },
      
      quality: {
        minCompletenessThreshold: 0.8,
        enableValidation: true,
        strictMode: false
      },

      // Enhanced configuration
      categories: preset.categories,
      tags: preset.tags,
      
      dependencies: {
        rules: {
          prerequisite: {
            description: '선행 학습이 필요한 문서',
            weight: 1.3,
            autoInclude: true,
            maxDepth: 2,
            strategy: 'breadth-first'
          },
          reference: {
            description: '참조 관계의 문서',
            weight: 1.1,
            autoInclude: false,
            maxDepth: 1,
            strategy: 'selective'
          },
          followup: {
            description: '후속 학습 권장 문서',
            weight: 0.8,
            autoInclude: false,
            maxDepth: 1,
            strategy: 'optional'
          },
          complement: {
            description: '보완적 내용의 문서',
            weight: 0.9,
            autoInclude: false,
            maxDepth: 1,
            strategy: 'space-permitting'
          }
        },
        conflictResolution: {
          strategy: 'exclude-conflicts',
          priority: 'higher-score-wins',
          allowPartialConflicts: false
        }
      },

      composition: {
        strategies: this.getCompositionStrategies(),
        defaultStrategy: 'balanced',
        optimization: {
          spaceUtilizationTarget: 0.95,
          qualityThreshold: 0.8,
          diversityBonus: 0.1,
          redundancyPenalty: 0.2
        }
      },

      extraction: {
        defaultQualityThreshold: 0.8,
        autoTagExtraction: true,
        autoDependencyDetection: true,
        strategies: {
          'tutorial-first': {
            focusOrder: ['steps', 'examples', 'concepts', 'references']
          },
          'api-first': {
            focusOrder: ['signatures', 'parameters', 'examples', 'concepts']
          },
          'concept-first': {
            focusOrder: ['definitions', 'principles', 'examples', 'applications']
          },
          'example-first': {
            focusOrder: ['code', 'usage', 'explanations', 'concepts']
          },
          'reference-first': {
            focusOrder: ['complete-info', 'details', 'examples', 'context']
          }
        }
      },

      validation: {
        schema: {
          enforceTagConsistency: true,
          validateDependencies: true,
          checkCategoryAlignment: true
        },
        quality: {
          minPriorityScore: 50,
          maxDocumentAge: '6개월',
          requireMinimumContent: true
        }
      },

      ui: {
        dashboard: {
          enableTagCloud: true,
          showCategoryStats: true,
          enableDependencyGraph: true
        },
        reporting: {
          generateCompositionReports: true,
          includeQualityMetrics: true,
          exportFormats: ['json', 'csv', 'html']
        }
      }
    };
  }

  /**
   * Enhance basic configuration with defaults
   */
  private enhanceBasicConfig(baseConfig: Record<string, unknown>): EnhancedLLMSConfig {
    // If it's already fully enhanced, return as-is
    if (baseConfig.categories && baseConfig.tags && baseConfig.composition && baseConfig.dependencies) {
      return baseConfig as unknown as EnhancedLLMSConfig;
    }

    // Convert basic config to enhanced, merging with defaults
    const standardCategories = this.getStandardCategories();
    const standardTags = this.getStandardTags();
    
    const enhanced: EnhancedLLMSConfig = {
      ...(baseConfig as unknown as EnhancedLLMSConfig),
      categories: {
        ...standardCategories,
        ...(baseConfig.categories as unknown as Record<string, CategoryConfig>) // User categories override defaults
      },
      tags: {
        ...standardTags,
        ...(baseConfig.tags as unknown as Record<string, TagConfig>) // User tags override defaults
      },
      dependencies: (baseConfig.dependencies as unknown as DependencyConfig) || {
        rules: {
          prerequisite: {
            description: '선행 학습이 필요한 문서',
            weight: 1.3,
            autoInclude: true,
            maxDepth: 2,
            strategy: 'breadth-first'
          },
          reference: {
            description: '참조 관계의 문서',
            weight: 1.1,
            autoInclude: false
          },
          followup: {
            description: '후속 학습 권장 문서',
            weight: 0.8,
            autoInclude: false
          },
          complement: {
            description: '보완적 내용의 문서',
            weight: 0.9,
            autoInclude: false
          }
        },
        conflictResolution: {
          strategy: 'exclude-conflicts',
          priority: 'higher-score-wins',
          allowPartialConflicts: false
        }
      },
      composition: (baseConfig.composition as unknown as CompositionConfig) || {
        strategies: this.getCompositionStrategies(),
        defaultStrategy: 'balanced',
        optimization: {
          spaceUtilizationTarget: 0.95,
          qualityThreshold: 0.8,
          diversityBonus: 0.1,
          redundancyPenalty: 0.2
        }
      },
      extraction: (baseConfig.extraction as unknown as ExtractionConfig) || {
        defaultQualityThreshold: 0.8,
        autoTagExtraction: true,
        autoDependencyDetection: true,
        strategies: {
          'tutorial-first': { focusOrder: ['steps', 'examples', 'concepts', 'references'] },
          'api-first': { focusOrder: ['signatures', 'parameters', 'examples', 'concepts'] },
          'concept-first': { focusOrder: ['definitions', 'principles', 'examples', 'applications'] },
          'example-first': { focusOrder: ['code', 'usage', 'explanations', 'concepts'] },
          'reference-first': { focusOrder: ['complete-info', 'details', 'examples', 'context'] }
        }
      },
      validation: (baseConfig.validation as unknown as ValidationConfig) || {
        schema: {
          enforceTagConsistency: true,
          validateDependencies: true,
          checkCategoryAlignment: true
        },
        quality: {
          minPriorityScore: 50,
          maxDocumentAge: '6개월',
          requireMinimumContent: true
        }
      },
      ui: (baseConfig.ui as unknown as UIConfig) || {
        dashboard: {
          enableTagCloud: true,
          showCategoryStats: true,
          enableDependencyGraph: true
        },
        reporting: {
          generateCompositionReports: true,
          includeQualityMetrics: true,
          exportFormats: ['json', 'csv', 'html']
        }
      }
    };

    return enhanced;
  }

  /**
   * Standard categories configuration
   */
  private getStandardCategories(): Record<string, CategoryConfig> {
    return {
      guide: {
        name: '가이드',
        description: '사용자 가이드 및 튜토리얼',
        priority: 90,
        defaultStrategy: 'tutorial-first' as ExtractStrategy,
        tags: ['beginner', 'step-by-step', 'practical'],
        color: '#28a745',
        icon: '📖'
      },
      api: {
        name: 'API 참조',
        description: 'API 문서 및 참조 자료',
        priority: 85,
        defaultStrategy: 'api-first' as ExtractStrategy,
        tags: ['reference', 'technical', 'developer'],
        color: '#17a2b8',
        icon: '🔧'
      },
      concept: {
        name: '개념 설명',
        description: '핵심 개념 및 아키텍처',
        priority: 80,
        defaultStrategy: 'concept-first' as ExtractStrategy,
        tags: ['theory', 'architecture', 'design'],
        color: '#6f42c1',
        icon: '💡'
      },
      example: {
        name: '예제 코드',
        description: '실용적인 예제 및 샘플',
        priority: 75,
        defaultStrategy: 'example-first' as ExtractStrategy,
        tags: ['practical', 'code', 'sample'],
        color: '#fd7e14',
        icon: '💻'
      },
      reference: {
        name: '참조 자료',
        description: '상세 참조 문서',
        priority: 70,
        defaultStrategy: 'reference-first' as ExtractStrategy,
        tags: ['detailed', 'comprehensive', 'lookup'],
        color: '#6c757d',
        icon: '📚'
      }
    };
  }

  /**
   * Standard tags configuration
   */
  private getStandardTags(): Record<string, TagConfig> {
    return {
      beginner: {
        name: '초보자',
        description: '초보자를 위한 콘텐츠',
        weight: 1.2,
        compatibleWith: ['step-by-step', 'practical', 'tutorial'],
        audience: ['new-users', 'learners'],
      },
      intermediate: {
        name: '중급',
        description: '중급 사용자를 위한 콘텐츠',
        weight: 1.0,
        compatibleWith: ['practical', 'implementation', 'patterns'],
        audience: ['experienced-users'],
      },
      advanced: {
        name: '고급',
        description: '고급 사용자를 위한 콘텐츠',
        weight: 0.9,
        compatibleWith: ['technical', 'architecture', 'optimization'],
        audience: ['experts', 'contributors'],
      },
      core: {
        name: '핵심',
        description: '핵심 기능 및 개념',
        weight: 1.5,
        compatibleWith: ['essential', 'fundamental', 'architecture'],
        importance: 'critical',
        frequency: 'high'
      },
      optional: {
        name: '선택사항',
        description: '선택적 기능 및 확장',
        weight: 0.7,
        compatibleWith: ['advanced', 'extension', 'plugin'],
        importance: 'optional',
        frequency: 'low'
      },
      'quick-start': {
        name: '빠른 시작',
        description: '빠른 시작을 위한 콘텐츠',
        weight: 1.3,
        compatibleWith: ['beginner', 'practical', 'step-by-step'],
        audience: ['new-users'],
      },
      troubleshooting: {
        name: '문제 해결',
        description: '문제 해결 및 디버깅',
        weight: 1.1,
        compatibleWith: ['practical', 'solution', 'debugging'],
        audience: ['all-users'],
        urgency: 'high'
      },
      'step-by-step': {
        name: '단계별',
        description: '단계별 안내',
        weight: 1.1,
        compatibleWith: ['beginner', 'practical', 'tutorial']
      },
      practical: {
        name: '실용적',
        description: '실무에 바로 적용 가능한',
        weight: 1.0,
        compatibleWith: ['beginner', 'intermediate', 'step-by-step']
      },
      technical: {
        name: '기술적',
        description: '기술적 세부사항',
        weight: 0.9,
        compatibleWith: ['advanced', 'reference', 'developer']
      },
      reference: {
        name: '참조',
        description: '참조용 자료',
        weight: 0.8,
        compatibleWith: ['technical', 'api', 'lookup']
      }
    };
  }

  /**
   * Composition strategies configuration
   */
  private getCompositionStrategies(): Record<string, CompositionStrategyConfig> {
    return {
      balanced: {
        name: '균형잡힌 조합',
        description: '카테고리, 태그, 의존성을 균형있게 고려',
        weights: {
          categoryWeight: 0.4,
          tagWeight: 0.3,
          dependencyWeight: 0.2,
          priorityWeight: 0.1
        },
        constraints: {
          minCategoryRepresentation: 2,
          maxDocumentsPerCategory: 8,
          requireCoreTags: true
        }
      },
      'category-focused': {
        name: '카테고리 중심',
        description: '카테고리별 문서를 우선적으로 선택',
        weights: {
          categoryWeight: 0.6,
          tagWeight: 0.2,
          dependencyWeight: 0.1,
          priorityWeight: 0.1
        },
        constraints: {
          minCategoryRepresentation: 1,
          maxDocumentsPerCategory: 15,
          requireCoreTags: false
        }
      },
      'dependency-driven': {
        name: '의존성 기반',
        description: '문서 간 의존성을 최우선으로 고려',
        weights: {
          categoryWeight: 0.2,
          tagWeight: 0.2,
          dependencyWeight: 0.5,
          priorityWeight: 0.1
        },
        constraints: {
          minCategoryRepresentation: 1,
          maxDocumentsPerCategory: 12,
          requireCoreTags: false,
          includeDependencyChains: true
        }
      },
      'beginner-friendly': {
        name: '초보자 친화',
        description: '초보자를 위한 순차적 학습 경로',
        weights: {
          categoryWeight: 0.3,
          tagWeight: 0.4,
          dependencyWeight: 0.2,
          priorityWeight: 0.1
        },
        constraints: {
          minCategoryRepresentation: 2,
          maxDocumentsPerCategory: 6,
          requireCoreTags: true,
          preferredTags: ['beginner', 'step-by-step', 'practical']
        }
      }
    };
  }

  /**
   * Minimal preset configurations
   */
  private getMinimalCategories(): Record<string, CategoryConfig> {
    return {
      guide: {
        name: '가이드',
        description: '사용자 가이드',
        priority: 90,
        defaultStrategy: 'tutorial-first' as ExtractStrategy,
        tags: ['beginner', 'practical']
      },
      reference: {
        name: '참조',
        description: '참조 문서',
        priority: 70,
        defaultStrategy: 'reference-first' as ExtractStrategy,
        tags: ['reference', 'lookup']
      }
    };
  }

  private getMinimalTags(): Record<string, TagConfig> {
    return {
      beginner: {
        name: '초보자',
        description: '초보자용',
        weight: 1.2,
        compatibleWith: ['practical']
      },
      practical: {
        name: '실용적',
        description: '실무 적용',
        weight: 1.0,
        compatibleWith: ['beginner']
      },
      reference: {
        name: '참조',
        description: '참조용',
        weight: 0.8,
        compatibleWith: ['lookup']
      }
    };
  }

  /**
   * Extended and blog configurations (abbreviated for brevity)
   */
  private getExtendedCategories(): Record<string, CategoryConfig> {
    const standard = this.getStandardCategories();
    return {
      ...standard,
      llms: {
        name: 'LLM 콘텐츠',
        description: 'LLM 최적화 콘텐츠',
        priority: 95,
        defaultStrategy: 'reference-first' as ExtractStrategy,
        tags: ['llms', 'optimized', 'concise'],
        color: '#ff6b6b',
        icon: '🤖'
      }
    };
  }

  private getExtendedTags(): Record<string, TagConfig> {
    const standard = this.getStandardTags();
    return {
      ...standard,
      llms: {
        name: 'LLM 최적화',
        description: 'LLM 처리에 최적화된',
        weight: 1.0,
        compatibleWith: ['concise', 'structured']
      },
      optimized: {
        name: '최적화',
        description: '성능 최적화된',
        weight: 1.0,
        compatibleWith: ['advanced', 'technical']
      }
    };
  }

  private getBlogCategories(): Record<string, CategoryConfig> {
    return {
      guide: {
        name: '가이드',
        description: '블로그 가이드',
        priority: 85,
        defaultStrategy: 'tutorial-first' as ExtractStrategy,
        tags: ['blog', 'tutorial']
      },
      example: {
        name: '예제',
        description: '블로그 예제',
        priority: 80,
        defaultStrategy: 'example-first' as ExtractStrategy,
        tags: ['blog', 'code', 'sample']
      }
    };
  }

  private getBlogTags(): Record<string, TagConfig> {
    return {
      blog: {
        name: '블로그',
        description: '블로그 콘텐츠',
        weight: 1.0,
        compatibleWith: ['tutorial', 'example']
      },
      tutorial: {
        name: '튜토리얼',
        description: '튜토리얼 형식',
        weight: 1.1,
        compatibleWith: ['blog', 'step-by-step']
      },
      'step-by-step': {
        name: '단계별',
        description: '단계별 설명',
        weight: 1.0,
        compatibleWith: ['tutorial', 'practical']
      }
    };
  }

  /**
   * Merge multiple enhanced configurations
   */
  static mergeConfigurations(...configs: Partial<EnhancedLLMSConfig>[]): EnhancedLLMSConfig {
    const manager = new EnhancedConfigManager();
    const preset = manager.getConfigPreset('standard');
    let result = manager.createConfigFromPreset(preset);

    for (const config of configs) {
      if (!config) continue;

      result = {
        ...result,
        ...config,
        paths: {
          ...result.paths,
          ...config.paths
        },
        generation: {
          ...result.generation,
          ...config.generation
        },
        quality: {
          ...result.quality,
          ...config.quality
        },
        categories: {
          ...result.categories,
          ...config.categories
        },
        tags: {
          ...result.tags,
          ...config.tags
        },
        dependencies: config.dependencies ? {
          ...result.dependencies,
          ...config.dependencies,
          rules: {
            ...result.dependencies?.rules,
            ...config.dependencies.rules
          },
          conflictResolution: {
            ...result.dependencies?.conflictResolution,
            ...config.dependencies.conflictResolution
          }
        } : result.dependencies,
        composition: config.composition ? {
          ...result.composition,
          ...config.composition,
          strategies: {
            ...result.composition?.strategies,
            ...config.composition.strategies
          },
          optimization: {
            ...result.composition?.optimization,
            ...config.composition.optimization
          }
        } : result.composition,
        extraction: config.extraction ? {
          ...result.extraction,
          ...config.extraction,
          strategies: {
            ...result.extraction?.strategies,
            ...config.extraction.strategies
          }
        } : result.extraction,
        validation: config.validation ? {
          ...result.validation,
          ...config.validation,
          schema: {
            ...result.validation?.schema,
            ...config.validation.schema
          },
          quality: {
            ...result.validation?.quality,
            ...config.validation.quality
          }
        } : result.validation,
        ui: config.ui ? {
          ...result.ui,
          ...config.ui,
          dashboard: {
            ...result.ui?.dashboard,
            ...config.ui.dashboard
          },
          reporting: {
            ...result.ui?.reporting,
            ...config.ui.reporting
          }
        } : result.ui
      };
    }

    return result;
  }
}