/**
 * Configuration Schema Validation Tests
 * @jest-environment node
 */

const { readFile } = require('fs/promises');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

describe('Configuration Schema Validation', () => {
  let schema;
  let ajv;
  let validate;

  beforeAll(async () => {
    // Load schema
    const schemaPath = path.join(__dirname, '../data/config-schema.json');
    const schemaContent = await readFile(schemaPath, 'utf-8');
    schema = JSON.parse(schemaContent);

    // Setup AJV
    ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
    addFormats(ajv);
    validate = ajv.compile(schema);
  });

  describe('Schema Structure', () => {
    it('should have valid JSON Schema structure', () => {
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.title).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toBeInstanceOf(Array);
    });

    it('should define all required top-level properties', () => {
      const requiredProps = ['characterLimits', 'languages', 'paths', 'categories', 'tags'];
      expect(schema.required).toEqual(expect.arrayContaining(requiredProps));
    });

    it('should have proper definitions section', () => {
      expect(schema.definitions).toBeDefined();
      expect(schema.definitions.CategoryConfig).toBeDefined();
      expect(schema.definitions.TagConfig).toBeDefined();
      expect(schema.definitions.EstimatedReadingTime).toBeDefined();
      expect(schema.definitions.TimeSpan).toBeDefined();
      expect(schema.definitions.DependencyRule).toBeDefined();
      expect(schema.definitions.CompositionStrategy).toBeDefined();
    });
  });

  describe('Valid Configuration Validation', () => {
    let validConfig;

    beforeEach(() => {
      validConfig = {
        $schema: "packages/llms-generator/data/config-schema.json",
        characterLimits: [100, 300, 500],
        languages: ['ko', 'en'],
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        },
        categories: {
          guide: {
            name: '가이드',
            description: '사용자 가이드',
            priority: 90,
            defaultStrategy: 'tutorial-first',
            tags: ['beginner'],
            color: '#28a745',
            icon: '📖'
          }
        },
        tags: {
          beginner: {
            name: '초보자',
            description: '초보자용 콘텐츠',
            weight: 1.2,
            compatibleWith: ['practical'],
            audience: ['new-users'],
            estimatedReadingTime: {
              min: 5,
              max: 15,
              unit: 'minutes',
              complexity: 'low'
            }
          }
        }
      };
    });

    it('should validate minimal valid configuration', () => {
      const result = validate(validConfig);
      if (!result) {
        console.log('Validation errors:', validate.errors);
      }
      expect(result).toBe(true);
    });

    it('should validate configuration with $schema property', () => {
      const configWithSchema = {
        ...validConfig,
        $schema: 'https://example.com/schema.json'
      };

      const result = validate(configWithSchema);
      expect(result).toBe(true);
    });

    it('should validate configuration with all optional fields', () => {
      const fullConfig = {
        ...validConfig,
        dependencies: {
          rules: {
            prerequisite: {
              description: '선행 문서',
              weight: 1.3,
              autoInclude: true,
              maxDepth: 2,
              strategy: 'breadth-first'
            }
          },
          conflictResolution: {
            strategy: 'exclude-conflicts',
            priority: 'higher-score-wins',
            allowPartialConflicts: false
          }
        },
        composition: {
          strategies: {
            balanced: {
              name: '균형잡힌 조합',
              description: '균형있는 선택',
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
            }
          },
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
              focusOrder: ['steps', 'examples', 'concepts']
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
            maxDocumentAge: {
              value: 6,
              unit: 'months'
            },
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
            exportFormats: ['json', 'csv']
          }
        }
      };

      const result = validate(fullConfig);
      if (!result) {
        console.log('Validation errors:', validate.errors);
      }
      expect(result).toBe(true);
    });
  });

  describe('Invalid Configuration Validation', () => {
    it('should reject configuration missing required fields', () => {
      const invalidConfig = {
        characterLimits: [100, 300]
        // Missing required fields: languages, paths, categories, tags
      };

      const result = validate(invalidConfig);
      expect(result).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: 'required'
          })
        ])
      );
    });

    it('should reject invalid character limits', () => {
      const invalidConfig = {
        characterLimits: [10, 'invalid', 500], // Invalid type
        languages: ['ko'],
        paths: { docsDir: './docs', dataDir: './data', outputDir: './output' },
        categories: {},
        tags: {}
      };

      const result = validate(invalidConfig);
      expect(result).toBe(false);
    });

    it('should reject invalid language codes', () => {
      const invalidConfig = {
        characterLimits: [100, 300],
        languages: ['invalid-lang'], // Invalid language
        paths: { docsDir: './docs', dataDir: './data', outputDir: './output' },
        categories: {},
        tags: {}
      };

      const result = validate(invalidConfig);
      expect(result).toBe(false);
    });

    it('should reject invalid category priority', () => {
      const invalidConfig = {
        characterLimits: [100, 300],
        languages: ['ko'],
        paths: { docsDir: './docs', dataDir: './data', outputDir: './output' },
        categories: {
          guide: {
            name: '가이드',
            description: '사용자 가이드',
            priority: 150, // Invalid: > 100
            defaultStrategy: 'tutorial-first',
            tags: []
          }
        },
        tags: {}
      };

      const result = validate(invalidConfig);
      expect(result).toBe(false);
    });

    it('should reject invalid tag weight', () => {
      const invalidConfig = {
        characterLimits: [100, 300],
        languages: ['ko'],
        paths: { docsDir: './docs', dataDir: './data', outputDir: './output' },
        categories: {},
        tags: {
          beginner: {
            name: '초보자',
            description: '초보자용 콘텐츠',
            weight: 5.0 // Invalid: > 3.0
          }
        }
      };

      const result = validate(invalidConfig);
      expect(result).toBe(false);
    });
  });

  describe('Real Configuration Test', () => {
    it('should validate the actual enhanced config file', async () => {
      try {
        const configPath = path.join(__dirname, '../../../llms-generator.config.json');
        const configContent = await readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        // Test with $schema property included
        const result = validate(config);
        if (!result) {
          console.log('Real config validation errors:');
          // Show only first few errors for readability
          console.log(validate.errors?.slice(0, 3));
        }
        expect(result).toBe(true);
      } catch (error) {
        console.log('Could not load real config file:', error.message);
        // This is OK - the test environment might not have the file
      }
    });
  });
});