import { EnhancedConfigManager } from '../../src/core/EnhancedConfigManager';
import { DocumentScorer } from '../../src/core/DocumentScorer';
import { TagBasedDocumentFilter } from '../../src/core/TagBasedDocumentFilter';
import { AdaptiveDocumentSelector } from '../../src/core/AdaptiveDocumentSelector';
import { EnhancedLLMSConfig } from '../../src/types/config';
import { TestDataGenerator } from '../helpers/test-data-generator';
import fs from 'fs';
import path from 'path';

describe('Configuration Integration', () => {
  let configManager: EnhancedConfigManager;
  let testConfigPath: string;

  beforeEach(() => {
    configManager = new EnhancedConfigManager();
    testConfigPath = path.join(__dirname, '../temp/test-config.json');
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('Configuration Loading and Validation', () => {
    it('should load and validate all preset configurations', async () => {
      const presets = ['standard', 'minimal', 'extended', 'blog'];

      for (const preset of presets) {
        const config = await configManager.initializeConfig(preset as any);
        
        expect(config).toBeDefined();
        expect(config.paths).toBeDefined();
        expect(config.generation).toBeDefined();
        expect(config.categories).toBeDefined();
        expect(config.tags).toBeDefined();
        
        // Validate config structure
        expect(config.generation.defaultCharacterLimits).toHaveLength(3);
        expect(config.generation.qualityThreshold).toBeGreaterThan(0);
        expect(Object.keys(config.categories).length).toBeGreaterThan(0);
        expect(Object.keys(config.tags).length).toBeGreaterThan(0);
      }
    });

    it('should properly inherit and override configuration values', async () => {
      const standardConfig = await configManager.initializeConfig('standard');
      const minimalConfig = await configManager.initializeConfig('minimal');
      const extendedConfig = await configManager.initializeConfig('extended');

      // Standard should be the baseline
      expect(standardConfig.generation.qualityThreshold).toBe(70);
      
      // Minimal should have reduced features
      expect(Object.keys(minimalConfig.categories).length).toBeLessThanOrEqual(
        Object.keys(standardConfig.categories).length
      );
      
      // Extended should have more features
      expect(Object.keys(extendedConfig.tags).length).toBeGreaterThanOrEqual(
        Object.keys(standardConfig.tags).length
      );
    });

    it('should validate configuration consistency across components', async () => {
      const config = await configManager.initializeConfig('standard');

      // Test that all components can be initialized with the config
      expect(() => new DocumentScorer(config, 'balanced')).not.toThrow();
      expect(() => new TagBasedDocumentFilter(config)).not.toThrow();
      expect(() => new AdaptiveDocumentSelector(config)).not.toThrow();

      // Test that category and tag references are consistent
      Object.values(config.categories).forEach(category => {
        if (category.tags) {
          category.tags.forEach(tagName => {
            expect(config.tags[tagName]).toBeDefined();
          });
        }
      });

      // Test that tag compatibility references are valid
      Object.values(config.tags).forEach(tag => {
        if (tag.compatibleWith) {
          tag.compatibleWith.forEach(compatibleTag => {
            expect(config.tags[compatibleTag]).toBeDefined();
          });
        }
        if (tag.incompatibleWith) {
          tag.incompatibleWith.forEach(incompatibleTag => {
            expect(config.tags[incompatibleTag]).toBeDefined();
          });
        }
      });
    });
  });

  describe('Dynamic Configuration Updates', () => {
    it('should update configuration and propagate changes to components', async () => {
      const config = await configManager.initializeConfig('standard');
      const originalThreshold = config.generation.qualityThreshold;

      // Create components with original config
      const scorer = new DocumentScorer(config, 'balanced');
      const selector = new AdaptiveDocumentSelector(config);

      // Update configuration
      config.generation.qualityThreshold = originalThreshold + 10;

      // Test that components reflect the change
      const testDocuments = TestDataGenerator.generateDocuments(3);
      const constraints = {
        maxCharacters: 1000,
        targetCharacterLimit: 1000,
        context: {
          targetTags: ['beginner'],
          tagWeights: { beginner: 1.0 },
          selectedDocuments: [],
          maxCharacters: 1000,
          targetCharacterLimit: 1000,
          qualityThreshold: config.generation.qualityThreshold
        }
      };

      const result = await selector.selectDocuments(testDocuments, constraints);
      expect(result.optimization.qualityThreshold).toBe(originalThreshold + 10);
    });

    it('should validate configuration updates', async () => {
      const config = await configManager.initializeConfig('standard');

      // Test invalid updates
      const invalidUpdates = [
        { path: 'generation.qualityThreshold', value: -10 }, // Negative threshold
        { path: 'generation.defaultCharacterLimits', value: [] }, // Empty limits
        { path: 'dependencies.maxDepth', value: -1 }, // Invalid depth
      ];

      invalidUpdates.forEach(update => {
        const configCopy = JSON.parse(JSON.stringify(config));
        const pathParts = update.path.split('.');
        let current = configCopy;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = update.value;

        expect(() => configManager.validateConfig(configCopy)).toThrow();
      });
    });

    it('should handle partial configuration merging', async () => {
      const baseConfig = await configManager.initializeConfig('minimal');
      
      const partialConfig = {
        tags: {
          'custom-tag': {
            name: '커스텀',
            description: 'Custom tag for testing',
            weight: 1.0,
            compatibleWith: ['beginner'],
            audience: ['test-users']
          }
        },
        categories: {
          'custom-category': {
            name: '커스텀 카테고리',
            description: 'Custom category for testing',
            priority: 70,
            defaultStrategy: 'balanced',
            tags: ['custom-tag']
          }
        }
      };

      const mergedConfig = configManager.mergeConfigurations(baseConfig, partialConfig);

      // Should contain both base and partial config elements
      expect(mergedConfig.tags['custom-tag']).toBeDefined();
      expect(mergedConfig.categories['custom-category']).toBeDefined();
      expect(Object.keys(mergedConfig.tags).length).toBeGreaterThan(Object.keys(baseConfig.tags).length);
    });
  });

  describe('Configuration Persistence', () => {
    it('should save and load custom configurations', async () => {
      const config = await configManager.initializeConfig('standard');
      
      // Modify configuration
      config.generation.qualityThreshold = 85;
      config.tags['test-tag'] = {
        name: '테스트',
        description: 'Test tag',
        weight: 1.5,
        compatibleWith: ['beginner'],
        audience: ['testers']
      };

      // Save configuration
      await configManager.saveConfig(testConfigPath, config);
      expect(fs.existsSync(testConfigPath)).toBe(true);

      // Load saved configuration
      const loadedConfig = await configManager.loadConfig(testConfigPath);
      
      expect(loadedConfig.generation.qualityThreshold).toBe(85);
      expect(loadedConfig.tags['test-tag']).toBeDefined();
      expect(loadedConfig.tags['test-tag'].weight).toBe(1.5);
    });

    it('should handle configuration file corruption gracefully', async () => {
      // Create corrupted config file
      fs.writeFileSync(testConfigPath, '{ invalid json content }');

      await expect(configManager.loadConfig(testConfigPath)).rejects.toThrow();
    });

    it('should create backup configurations during updates', async () => {
      const config = await configManager.initializeConfig('standard');
      await configManager.saveConfig(testConfigPath, config);

      // Update configuration
      config.generation.qualityThreshold = 90;
      await configManager.updateConfig(testConfigPath, config, { createBackup: true });

      const backupPath = testConfigPath.replace('.json', '.backup.json');
      expect(fs.existsSync(backupPath)).toBe(true);

      // Clean up backup
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
    });
  });

  describe('Environment-Specific Configurations', () => {
    it('should load different configurations for different environments', async () => {
      const environments = ['development', 'testing', 'production'];
      
      for (const env of environments) {
        process.env.NODE_ENV = env;
        const config = await configManager.initializeConfig('standard');
        
        // Configurations should adapt to environment
        if (env === 'production') {
          expect(config.validation.strictMode).toBe(true);
          expect(config.generation.qualityThreshold).toBeGreaterThanOrEqual(80);
        } else if (env === 'development') {
          expect(config.validation.strictMode).toBe(false);
        }
      }

      // Reset environment
      delete process.env.NODE_ENV;
    });

    it('should handle missing environment configurations gracefully', async () => {
      process.env.NODE_ENV = 'unknown-environment';
      
      // Should fallback to default configuration
      const config = await configManager.initializeConfig('standard');
      expect(config).toBeDefined();
      expect(config.generation).toBeDefined();

      delete process.env.NODE_ENV;
    });
  });

  describe('Configuration Integration with Document Processing', () => {
    it('should process documents consistently across different configurations', async () => {
      const testDocuments = TestDataGenerator.generateDocuments(10, {
        categories: ['guide', 'api', 'concept'],
        tags: ['beginner', 'advanced', 'practical']
      });

      const configurations = ['minimal', 'standard', 'extended'];
      const results: any[] = [];

      for (const configName of configurations) {
        const config = await configManager.initializeConfig(configName as any);
        const selector = new AdaptiveDocumentSelector(config);
        
        const constraints = {
          maxCharacters: 1500,
          targetCharacterLimit: 1500,
          context: {
            targetTags: ['beginner'],
            tagWeights: { beginner: 1.0 },
            selectedDocuments: [],
            maxCharacters: 1500,
            targetCharacterLimit: 1500
          }
        };

        const result = await selector.selectDocuments(testDocuments, constraints);
        results.push({ config: configName, result });
      }

      // All configurations should produce valid results
      results.forEach(({ config, result }) => {
        expect(result.selectedDocuments.length).toBeGreaterThan(0);
        expect(result.optimization.qualityScore).toBeGreaterThan(0);
        
        // Extended configuration should generally produce higher quality results
        if (config === 'extended') {
          const minimalResult = results.find(r => r.config === 'minimal')!.result;
          expect(result.optimization.qualityScore).toBeGreaterThanOrEqual(
            minimalResult.optimization.qualityScore * 0.9
          );
        }
      });
    });

    it('should handle configuration-specific feature availability', async () => {
      const minimalConfig = await configManager.initializeConfig('minimal');
      const extendedConfig = await configManager.initializeConfig('extended');

      // Test feature availability
      expect(minimalConfig.dependencies.enabled).toBe(false);
      expect(extendedConfig.dependencies.enabled).toBe(true);

      expect(minimalConfig.extraction.enableSmartExtraction).toBe(false);
      expect(extendedConfig.extraction.enableSmartExtraction).toBe(true);

      // Components should adapt to configuration features
      const minimalSelector = new AdaptiveDocumentSelector(minimalConfig);
      const extendedSelector = new AdaptiveDocumentSelector(extendedConfig);

      const minimalStrategies = minimalSelector.getAvailableStrategies();
      const extendedStrategies = extendedSelector.getAvailableStrategies();

      expect(extendedStrategies.length).toBeGreaterThanOrEqual(minimalStrategies.length);
    });
  });

  describe('Configuration Validation and Error Handling', () => {
    it('should detect and report configuration inconsistencies', async () => {
      const config = await configManager.initializeConfig('standard');

      // Create inconsistent configuration
      const inconsistentConfig = {
        ...config,
        tags: {
          ...config.tags,
          'orphaned-tag': {
            name: '고아 태그',
            description: 'Tag with invalid references',
            weight: 1.0,
            compatibleWith: ['non-existent-tag'], // Invalid reference
            audience: ['unknown-audience']
          }
        }
      };

      const validation = configManager.validateConfig(inconsistentConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide helpful error messages for common configuration mistakes', async () => {
      const config = await configManager.initializeConfig('standard');

      // Common mistakes
      const mistakes = [
        {
          description: 'Missing required fields',
          config: { ...config, generation: undefined },
          expectedError: /generation.*required/i
        },
        {
          description: 'Invalid quality threshold',
          config: { ...config, generation: { ...config.generation, qualityThreshold: 150 } },
          expectedError: /qualityThreshold.*range/i
        },
        {
          description: 'Circular tag dependencies',
          config: {
            ...config,
            tags: {
              ...config.tags,
              'tag-a': { ...config.tags.beginner, compatibleWith: ['tag-b'] },
              'tag-b': { ...config.tags.advanced, compatibleWith: ['tag-a'] }
            }
          },
          expectedError: /circular.*dependency/i
        }
      ];

      mistakes.forEach(({ description, config: testConfig, expectedError }) => {
        expect(() => configManager.validateConfig(testConfig)).toThrow(expectedError);
      });
    });

    it('should recover from partial configuration corruption', async () => {
      const validConfig = await configManager.initializeConfig('standard');
      
      // Simulate partial corruption
      const partiallyCorruptedConfig = {
        ...validConfig,
        tags: undefined, // Corrupted section
        categories: validConfig.categories // Valid section
      };

      // Should recover by using defaults for corrupted sections
      const recoveredConfig = configManager.recoverConfiguration(partiallyCorruptedConfig, 'standard');
      
      expect(recoveredConfig.tags).toBeDefined();
      expect(Object.keys(recoveredConfig.tags).length).toBeGreaterThan(0);
      expect(recoveredConfig.categories).toEqual(validConfig.categories);
    });
  });
});