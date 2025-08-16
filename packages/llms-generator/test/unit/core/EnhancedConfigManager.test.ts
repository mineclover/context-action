import { EnhancedConfigManager } from '../../../src/core/EnhancedConfigManager';
import { EnhancedLLMSConfig } from '../../../src/types/config';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedFsSync = require('fs');
mockedFsSync.existsSync = jest.fn();

describe('EnhancedConfigManager', () => {
  let configManager: EnhancedConfigManager;
  const testConfigPath = '/test/config.json';

  beforeEach(() => {
    configManager = new EnhancedConfigManager(testConfigPath);
    jest.clearAllMocks();
    // Setup default mocks
    mockedFsSync.existsSync.mockReturnValue(true);
    mockedFs.readFile.mockResolvedValue('{}');
  });

  describe('Constructor', () => {
    it('should initialize with default config path when none provided', () => {
      const manager = new EnhancedConfigManager();
      expect(manager).toBeInstanceOf(EnhancedConfigManager);
    });

    it('should initialize with custom config path', () => {
      const customPath = '/custom/path/config.json';
      const manager = new EnhancedConfigManager(customPath);
      expect(manager).toBeInstanceOf(EnhancedConfigManager);
    });
  });

  describe('loadConfig()', () => {
    it('should load existing enhanced configuration', async () => {
      const mockEnhancedConfig: EnhancedLLMSConfig = {
        paths: {
          docs: 'docs',
          output: 'generated',
          priority: 'priority'
        },
        generation: {
          defaultCharacterLimits: [100, 300, 1000],
          qualityThreshold: 70,
          defaultStrategy: 'concept-first'
        },
        categories: {
          guide: {
            name: '가이드',
            description: 'Step-by-step guides',
            priority: 90,
            defaultStrategy: 'tutorial-first',
            tags: ['beginner', 'step-by-step', 'practical']
          }
        },
        tags: {
          beginner: {
            name: '초보자',
            description: 'Beginner-friendly content',
            weight: 1.2,
            compatibleWith: ['step-by-step', 'practical'],
            audience: ['new-users']
          }
        },
        dependencies: {
          enabled: true,
          maxDepth: 3,
          includeOptional: false,
          conflictResolution: 'exclude-conflicts'
        },
        composition: {
          strategies: {
            balanced: {
              name: 'Balanced Strategy',
              algorithm: 'hybrid',
              criteria: {
                categoryWeight: 0.4,
                tagWeight: 0.3,
                dependencyWeight: 0.2,
                priorityWeight: 0.1
              }
            }
          },
          defaultStrategy: 'balanced'
        },
        extraction: {
          enableSmartExtraction: true,
          contextAwareExtraction: true,
          preserveCodeBlocks: true
        },
        validation: {
          enabled: true,
          strictMode: false,
          validateDependencies: true
        },
        ui: {
          language: 'ko',
          theme: 'default'
        }
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockEnhancedConfig));
      
      const config = await configManager.loadConfig();
      
      expect(mockedFs.readFile).toHaveBeenCalledWith(testConfigPath, 'utf8');
      expect(config).toEqual(mockEnhancedConfig);
      expect(config.categories).toBeDefined();
      expect(config.tags).toBeDefined();
      expect(config.dependencies).toBeDefined();
    });

    it('should auto-enhance basic configuration', async () => {
      const basicConfig = {
        paths: {
          docs: 'docs',
          output: 'generated'
        },
        generation: {
          defaultCharacterLimits: [100, 300, 1000]
        }
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify(basicConfig));
      
      const config = await configManager.loadConfig();
      
      // Should have enhanced properties
      expect(config.categories).toBeDefined();
      expect(config.tags).toBeDefined();
      expect(config.dependencies).toBeDefined();
      expect(config.composition).toBeDefined();
      
      // Should preserve original properties
      expect(config.paths.docs).toBe('docs');
      expect(config.generation.defaultCharacterLimits).toEqual([100, 300, 1000]);
    });

    it('should throw error for missing config file', async () => {
      const error = new Error('Config file not found');
      error.code = 'ENOENT';
      mockedFs.readFile.mockRejectedValue(error);
      
      await expect(configManager.loadConfig()).rejects.toThrow('Configuration file not found');
    });

    it('should handle malformed JSON gracefully', async () => {
      mockedFs.readFile.mockResolvedValue('{ invalid json }');
      
      await expect(configManager.loadConfig()).rejects.toThrow('Invalid JSON in configuration file');
    });

    it('should handle file read permission errors', async () => {
      const error = new Error('Permission denied');
      error.code = 'EACCES';
      mockedFs.readFile.mockRejectedValue(error);
      
      await expect(configManager.loadConfig()).rejects.toThrow('Permission denied reading configuration file');
    });
  });

  describe('initializeConfig()', () => {
    it('should initialize standard preset correctly', async () => {
      mockedFs.writeFile.mockResolvedValue(undefined);
      
      const config = await configManager.initializeConfig('standard');
      
      expect(config.categories).toBeDefined();
      expect(config.categories.guide).toBeDefined();
      expect(config.categories.api).toBeDefined();
      expect(config.categories.concept).toBeDefined();
      expect(config.categories.example).toBeDefined();
      
      expect(config.tags).toBeDefined();
      expect(config.tags.beginner).toBeDefined();
      expect(config.tags.intermediate).toBeDefined();
      expect(config.tags.advanced).toBeDefined();
      
      expect(config.composition.defaultStrategy).toBe('balanced');
      
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        testConfigPath,
        expect.stringContaining('"categories"'),
        'utf8'
      );
    });

    it('should initialize minimal preset with reduced features', async () => {
      mockedFs.writeFile.mockResolvedValue(undefined);
      
      const config = await configManager.initializeConfig('minimal');
      
      expect(config.categories).toBeDefined();
      expect(Object.keys(config.categories)).toHaveLength(3); // guide, api, concept only
      
      expect(config.tags).toBeDefined();
      expect(Object.keys(config.tags)).toHaveLength(3); // basic tags only
      
      expect(config.composition.strategies).toBeDefined();
      expect(Object.keys(config.composition.strategies)).toHaveLength(2); // balanced, quality-focused only
    });

    it('should initialize extended preset with LLM category', async () => {
      mockedFs.writeFile.mockResolvedValue(undefined);
      
      const config = await configManager.initializeConfig('extended');
      
      expect(config.categories.llms).toBeDefined();
      expect(config.categories.llms.name).toBe('LLMs');
      expect(config.categories.llms.defaultStrategy).toBe('concept-first');
      
      expect(config.tags['llm-optimized']).toBeDefined();
      expect(config.composition.strategies.comprehensive).toBeDefined();
    });

    it('should initialize blog preset correctly', async () => {
      mockedFs.writeFile.mockResolvedValue(undefined);
      
      const config = await configManager.initializeConfig('blog');
      
      expect(config.categories.article).toBeDefined();
      expect(config.categories.tutorial).toBeDefined();
      
      expect(config.tags['blog-style']).toBeDefined();
      expect(config.tags['reader-friendly']).toBeDefined();
      
      expect(config.composition.defaultStrategy).toBe('beginner-friendly');
    });

    it('should throw error for unknown preset', async () => {
      await expect(configManager.initializeConfig('unknown-preset')).rejects.toThrow('Unknown preset: unknown-preset');
    });

    it('should handle file write errors', async () => {
      const error = new Error('Permission denied');
      mockedFs.writeFile.mockRejectedValue(error);
      
      await expect(configManager.initializeConfig('standard')).rejects.toThrow('Failed to write configuration file');
    });
  });

  describe('getConfigPreset()', () => {
    it('should return standard preset configuration', () => {
      const preset = configManager.getConfigPreset('standard');
      
      expect(preset.name).toBe('Standard');
      expect(preset.description).toContain('comprehensive');
      expect(preset.categories).toBeDefined();
      expect(preset.tags).toBeDefined();
      expect(preset.composition).toBeDefined();
    });

    it('should return minimal preset configuration', () => {
      const preset = configManager.getConfigPreset('minimal');
      
      expect(preset.name).toBe('Minimal');
      expect(preset.description).toContain('lightweight');
      expect(Object.keys(preset.categories)).toHaveLength(3);
    });

    it('should return extended preset configuration', () => {
      const preset = configManager.getConfigPreset('extended');
      
      expect(preset.name).toBe('Extended');
      expect(preset.description).toContain('LLM');
      expect(preset.categories.llms).toBeDefined();
    });

    it('should return blog preset configuration', () => {
      const preset = configManager.getConfigPreset('blog');
      
      expect(preset.name).toBe('Blog');
      expect(preset.description).toContain('blog');
      expect(preset.categories.article).toBeDefined();
    });

    it('should throw error for unknown preset', () => {
      expect(() => configManager.getConfigPreset('invalid')).toThrow('Unknown preset: invalid');
    });
  });

  describe('enhanceBasicConfig()', () => {
    it('should preserve existing enhanced properties', async () => {
      const existingEnhanced: Partial<EnhancedLLMSConfig> = {
        paths: { docs: 'docs', output: 'output' },
        categories: {
          custom: {
            name: 'Custom Category',
            description: 'Custom description',
            priority: 50,
            defaultStrategy: 'concept-first',
            tags: ['custom-tag']
          }
        },
        tags: {
          'custom-tag': {
            name: 'Custom Tag',
            description: 'Custom tag description',
            weight: 1.0,
            compatibleWith: [],
            audience: ['all-users']
          }
        }
      };

      const enhanced = await configManager.enhanceBasicConfig(existingEnhanced);
      
      // Should preserve custom properties
      expect(enhanced.categories.custom).toEqual(existingEnhanced.categories!.custom);
      expect(enhanced.tags['custom-tag']).toEqual(existingEnhanced.tags!['custom-tag']);
      
      // Should add default enhanced properties
      expect(enhanced.categories.guide).toBeDefined();
      expect(enhanced.tags.beginner).toBeDefined();
      expect(enhanced.dependencies).toBeDefined();
      expect(enhanced.composition).toBeDefined();
    });

    it('should validate enhanced configuration structure', async () => {
      const basicConfig = {
        paths: { docs: 'docs', output: 'output' }
      };

      const enhanced = await configManager.enhanceBasicConfig(basicConfig);
      
      // Validate required enhanced properties
      expect(enhanced.categories).toBeDefined();
      expect(enhanced.tags).toBeDefined();
      expect(enhanced.dependencies).toBeDefined();
      expect(enhanced.composition).toBeDefined();
      expect(enhanced.extraction).toBeDefined();
      expect(enhanced.validation).toBeDefined();
      expect(enhanced.ui).toBeDefined();
      
      // Validate structure completeness
      expect(enhanced.composition.strategies).toBeDefined();
      expect(enhanced.composition.defaultStrategy).toBeDefined();
      expect(enhanced.dependencies.conflictResolution).toBeDefined();
    });

    it('should handle undefined input gracefully', async () => {
      const enhanced = await configManager.enhanceBasicConfig({});
      
      expect(enhanced).toBeDefined();
      expect(enhanced.categories).toBeDefined();
      expect(enhanced.tags).toBeDefined();
    });
  });

  describe('Configuration validation', () => {
    it('should validate category structure', async () => {
      const config = await configManager.initializeConfig('standard');
      
      Object.values(config.categories).forEach(category => {
        expect(category.name).toBeDefined();
        expect(category.priority).toBeGreaterThan(0);
        expect(category.priority).toBeLessThanOrEqual(100);
        expect(category.defaultStrategy).toBeDefined();
        expect(Array.isArray(category.tags)).toBe(true);
      });
    });

    it('should validate tag structure', async () => {
      const config = await configManager.initializeConfig('standard');
      
      Object.values(config.tags).forEach(tag => {
        expect(tag.name).toBeDefined();
        expect(tag.weight).toBeGreaterThan(0);
        expect(Array.isArray(tag.compatibleWith)).toBe(true);
        expect(Array.isArray(tag.audience)).toBe(true);
      });
    });

    it('should validate composition strategies', async () => {
      const config = await configManager.initializeConfig('standard');
      
      Object.values(config.composition.strategies).forEach(strategy => {
        expect(strategy.criteria).toBeDefined();
        expect(strategy.criteria.categoryWeight).toBeGreaterThanOrEqual(0);
        expect(strategy.criteria.tagWeight).toBeGreaterThanOrEqual(0);
        expect(strategy.criteria.dependencyWeight).toBeGreaterThanOrEqual(0);
        expect(strategy.criteria.priorityWeight).toBeGreaterThanOrEqual(0);
        
        // Weights should sum to approximately 1.0
        const total = strategy.criteria.categoryWeight + 
                     strategy.criteria.tagWeight + 
                     strategy.criteria.dependencyWeight + 
                     strategy.criteria.priorityWeight;
        expect(total).toBeCloseTo(1.0, 1);
      });
    });
  });

  describe('Error handling', () => {
    it('should provide detailed error messages for config issues', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('Unexpected error'));
      
      await expect(configManager.loadConfig()).rejects.toThrow();
    });

    it('should handle concurrent config operations', async () => {
      mockedFs.readFile.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('{}'), 100))
      );
      
      // Start multiple concurrent operations
      const promises = [
        configManager.loadConfig(),
        configManager.loadConfig(),
        configManager.loadConfig()
      ];
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => expect(result).toBeDefined());
    });
  });
});