/**
 * Config Loader - Handles configuration loading and merging
 */

import path from 'path';
import { existsSync } from 'fs';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { DEFAULT_CONFIG } from '../../shared/config/DefaultConfig.js';
import { CLIConfig } from '../types/CLITypes.js';

export class ConfigLoader {
  async load(): Promise<CLIConfig> {
    const enhancedConfigPath = path.join(process.cwd(), 'llms-generator.config.json');
    
    if (existsSync(enhancedConfigPath)) {
      return this.loadEnhancedConfig(enhancedConfigPath);
    }
    
    return DEFAULT_CONFIG;
  }

  private async loadEnhancedConfig(configPath: string): Promise<CLIConfig> {
    const enhancedConfigManager = new EnhancedConfigManager(configPath);
    const enhancedConfig = await enhancedConfigManager.loadConfig();
    
    const projectRoot = process.cwd();
    return {
      ...DEFAULT_CONFIG,
      paths: {
        docsDir: path.resolve(projectRoot, enhancedConfig.paths?.docsDir || './docs'),
        llmContentDir: path.resolve(projectRoot, enhancedConfig.paths?.llmContentDir || './data'),
        outputDir: path.resolve(projectRoot, enhancedConfig.paths?.outputDir || './docs/llms'),
        templatesDir: path.resolve(projectRoot, enhancedConfig.paths?.templatesDir || './templates'),
        instructionsDir: path.resolve(projectRoot, enhancedConfig.paths?.instructionsDir || './instructions')
      },
      generation: {
        ...DEFAULT_CONFIG.generation,
        supportedLanguages: enhancedConfig.generation?.supportedLanguages || DEFAULT_CONFIG.generation.supportedLanguages,
        characterLimits: enhancedConfig.generation?.characterLimits || DEFAULT_CONFIG.generation.characterLimits,
        defaultLanguage: enhancedConfig.generation?.defaultLanguage || DEFAULT_CONFIG.generation.defaultLanguage,
        outputFormat: enhancedConfig.generation?.outputFormat || DEFAULT_CONFIG.generation.outputFormat
      },
      quality: enhancedConfig.quality || DEFAULT_CONFIG.quality,
      categories: enhancedConfig.categories
    };
  }
}