/**
 * Configuration Manager - Discovers and loads user configuration
 */

import { readFile, writeFile, access } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { UserConfig, ResolvedConfig } from '../types/user-config.js';
import { DEFAULT_USER_CONFIG } from '../types/user-config.js';
import { CHARACTER_LIMIT_PRESETS } from '../types/user-config.js';

export class ConfigManager {
  private static readonly CONFIG_FILE_NAMES = [
    'llms-generator.config.json',
    'llms-generator.config.js',
    '.llms-generator.json',
    '.llmsgeneratorrc.json',
    '.llmsgeneratorrc'
  ];

  private static readonly PACKAGE_JSON_FIELD = 'llms-generator';

  /**
   * Find and load configuration from project root
   */
  static async findAndLoadConfig(startDir?: string): Promise<ResolvedConfig> {
    const projectRoot = await this.findProjectRoot(startDir || process.cwd());
    const configResult = await this.loadConfigFromDirectory(projectRoot);

    return this.resolveConfig(configResult.config, projectRoot, configResult.configFile);
  }

  /**
   * Find project root by looking for package.json
   */
  private static async findProjectRoot(startDir: string): Promise<string> {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      
      if (existsSync(packageJsonPath)) {
        return currentDir;
      }
      
      currentDir = path.dirname(currentDir);
    }

    // Fallback to start directory if no package.json found
    return startDir;
  }

  /**
   * Load configuration from a specific directory
   */
  private static async loadConfigFromDirectory(dir: string): Promise<{
    config: UserConfig;
    configFile: string;
  }> {
    // Try dedicated config files first
    for (const fileName of this.CONFIG_FILE_NAMES) {
      const configPath = path.join(dir, fileName);
      
      if (existsSync(configPath)) {
        try {
          const config = await this.loadConfigFile(configPath);
          return { config, configFile: configPath };
        } catch (error) {
          console.warn(`Warning: Failed to load config from ${configPath}:`, error);
        }
      }
    }

    // Try package.json field
    const packageJsonPath = path.join(dir, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
        
        if (packageJson[this.PACKAGE_JSON_FIELD]) {
          return {
            config: this.mergeWithDefaults(packageJson[this.PACKAGE_JSON_FIELD]),
            configFile: packageJsonPath
          };
        }
      } catch (error) {
        console.warn(`Warning: Failed to load config from package.json:`, error);
      }
    }

    // Return default configuration
    return {
      config: this.getDefaultConfig(),
      configFile: ''
    };
  }

  /**
   * Load configuration from a specific file
   */
  private static async loadConfigFile(configPath: string): Promise<UserConfig> {
    const ext = path.extname(configPath);
    
    if (ext === '.js') {
      // Dynamic import for ES modules
      const configModule = await import(configPath);
      const config = configModule.default || configModule;
      return this.mergeWithDefaults(config);
    } else {
      // JSON file
      const configContent = await readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      return this.mergeWithDefaults(config);
    }
  }

  /**
   * Merge user config with defaults
   */
  private static mergeWithDefaults(userConfig: Partial<UserConfig>): UserConfig {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      ...defaultConfig,
      ...userConfig,
      extraction: {
        ...defaultConfig.extraction,
        ...userConfig.extraction,
        characterLimits: userConfig.extraction?.characterLimits || defaultConfig.extraction.characterLimits
      },
      composition: {
        ...defaultConfig.composition,
        ...userConfig.composition
      },
      paths: {
        ...defaultConfig.paths,
        ...userConfig.paths
      },
      workflows: {
        ...defaultConfig.workflows,
        ...userConfig.workflows
      }
    };
  }

  /**
   * Get default configuration
   */
  private static getDefaultConfig(): UserConfig {
    return JSON.parse(JSON.stringify(DEFAULT_USER_CONFIG));
  }

  /**
   * Resolve relative paths to absolute paths
   */
  private static resolveConfig(config: UserConfig, projectRoot: string, configFile: string): ResolvedConfig {
    const resolvedPaths = {
      projectRoot,
      configFile,
      docsDir: path.resolve(projectRoot, config.paths?.docsDir || './docs'),
      dataDir: path.resolve(projectRoot, config.paths?.dataDir || './packages/llms-generator/data'),
      outputDir: path.resolve(projectRoot, config.paths?.outputDir || './docs/llms')
    };

    return {
      ...config,
      resolvedPaths
    };
  }

  /**
   * Generate a sample configuration file
   */
  static generateSampleConfig(preset: 'minimal' | 'standard' | 'extended' | 'blog' | 'documentation' = 'standard'): UserConfig {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      ...defaultConfig,
      extraction: {
        ...defaultConfig.extraction,
        characterLimits: CHARACTER_LIMIT_PRESETS[preset].map(limit => ({
          ...limit,
          enabled: true
        }))
      },
      workflows: {
        presets: {
          'quick-100': {
            name: 'Quick 100-character summaries',
            description: 'Generate and check 100-character summaries for all documents',
            commands: [
              { command: 'discover', args: { language: 'ko' }, description: 'Discover available documents' },
              { command: 'priority-generate', args: { language: 'ko', overwrite: true }, description: 'Generate priority files' },
              { command: 'extract', args: { language: 'ko', chars: [100] }, description: 'Extract 100-char summaries' },
              { command: 'work-list', args: { language: 'ko', chars: 100 }, description: 'Show work status' }
            ]
          },
          'full-extraction': {
            name: 'Full content extraction',
            description: 'Extract all configured character limits',
            commands: [
              { command: 'priority-generate', args: { language: 'ko', overwrite: true } },
              { command: 'extract-all', args: { languages: ['ko'], overwrite: true } },
              { command: 'compose-stats', args: { language: 'ko' } }
            ]
          },
          'quality-check': {
            name: 'Quality assurance workflow',
            description: 'Check and validate all generated content',
            commands: [
              { command: 'work-status', args: { language: 'ko' } },
              { command: 'compose', args: { language: 'ko', chars: 5000, priority: 70 } },
              { command: 'compose-batch', args: { language: 'ko', chars: [1000, 3000, 5000, 10000] } }
            ]
          }
        }
      }
    };
  }

  /**
   * Save configuration to file
   */
  static async saveConfig(config: UserConfig, filePath: string): Promise<void> {
    const configContent = JSON.stringify(config, null, 2);
    await writeFile(filePath, configContent, 'utf-8');
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: UserConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate character limits
    if (!config.extraction?.characterLimits || config.extraction.characterLimits.length === 0) {
      errors.push('At least one character limit must be defined');
    } else {
      const limits = config.extraction.characterLimits;
      const enabledLimits = limits.filter(l => l.enabled !== false);
      
      if (enabledLimits.length === 0) {
        errors.push('At least one character limit must be enabled');
      }

      // Check for duplicate limits
      const limitValues = enabledLimits.map(l => l.limit);
      const uniqueLimits = new Set(limitValues);
      if (limitValues.length !== uniqueLimits.size) {
        errors.push('Duplicate character limits found');
      }

      // Check for invalid limits
      enabledLimits.forEach((limit, index) => {
        if (!limit.limit || limit.limit <= 0) {
          errors.push(`Invalid character limit at index ${index}: must be greater than 0`);
        }
        if (limit.limit > 10000) {
          errors.push(`Character limit at index ${index} is too large: ${limit.limit} (max: 10000)`);
        }
      });
    }

    // Validate languages
    if (!config.extraction?.languages || config.extraction.languages.length === 0) {
      errors.push('At least one language must be defined');
    }

    // Validate composition settings
    if (config.composition?.targetUtilization && 
        (config.composition.targetUtilization <= 0 || config.composition.targetUtilization > 1)) {
      errors.push('Target utilization must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get character limits from config (enabled only)
   */
  static getEnabledCharacterLimits(config: ResolvedConfig): number[] {
    return config.extraction.characterLimits
      .filter(limit => limit.enabled !== false)
      .map(limit => limit.limit)
      .sort((a, b) => a - b);
  }

  /**
   * Get character limit configuration for a specific limit
   */
  static getCharacterLimitConfig(config: ResolvedConfig, limit: number) {
    return config.extraction.characterLimits.find(l => l.limit === limit);
  }
}