/**
 * Configuration Schema Validation Tests
 * @jest-environment node
 */

import { readFile } from 'fs/promises';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

describe('Configuration Schema Validation', () => {
  let schema: any;
  let ajv: Ajv;
  let validate: any;

  beforeAll(async () => {
    // Load schema
    const schemaPath = path.join(__dirname, '../../data/config-schema.json');
    const schemaContent = await readFile(schemaPath, 'utf-8');
    schema = JSON.parse(schemaContent);

    // Setup AJV validator
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    validate = ajv.compile(schema);
  });

  describe('Schema Structure', () => {
    test('should have valid schema structure', () => {
      expect(schema).toBeDefined();
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.title).toBe('LLMS Generator Configuration');
      expect(schema.type).toBe('object');
    });

    test('should have required properties defined', () => {
      expect(schema.properties).toBeDefined();
      expect(schema.properties.paths).toBeDefined();
      expect(schema.properties.generation).toBeDefined();
      expect(schema.properties.quality).toBeDefined();
    });
  });

  describe('Valid Configuration Validation', () => {
    test('should validate minimal valid configuration', () => {
      const validConfig = {
        paths: {
          docsDir: './docs',
          llmContentDir: './data',
          outputDir: './data',
          templatesDir: './templates',
          instructionsDir: './instructions'
        },
        generation: {
          supportedLanguages: ['en', 'ko'],
          characterLimits: [100, 300, 1000],
          defaultLanguage: 'en',
          outputFormat: 'md'
        },
        quality: {
          minCompletenessThreshold: 0.7,
          enableValidation: true,
          strictMode: false
        }
      };

      const valid = validate(validConfig);
      if (!valid) {
        console.log('Validation errors:', validate.errors);
      }
      expect(valid).toBe(true);
    });

    test('should validate extended configuration', () => {
      const extendedConfig = {
        paths: {
          docsDir: './docs',
          llmContentDir: './data',
          outputDir: './data',
          templatesDir: './templates',
          instructionsDir: './instructions'
        },
        generation: {
          supportedLanguages: ['en', 'ko', 'ja'],
          characterLimits: [100, 200, 300, 500, 1000, 2000],
          defaultLanguage: 'en',
          outputFormat: 'txt'
        },
        quality: {
          minCompletenessThreshold: 0.8,
          enableValidation: true,
          strictMode: true
        },
        optimization: {
          enableCaching: true,
          parallelProcessing: true,
          maxConcurrency: 4
        },
        advanced: {
          customStrategies: true,
          experimental: {
            aiOptimization: false,
            dynamicPriority: true
          }
        }
      };

      const valid = validate(extendedConfig);
      if (!valid) {
        console.log('Validation errors:', validate.errors);
      }
      expect(valid).toBe(true);
    });
  });

  describe('Invalid Configuration Validation', () => {
    test('should reject configuration with missing required paths', () => {
      const invalidConfig = {
        generation: {
          supportedLanguages: ['en'],
          characterLimits: [100],
          defaultLanguage: 'en',
          outputFormat: 'md'
        }
      };

      const valid = validate(invalidConfig);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '',
          schemaPath: '#/required',
          keyword: 'required',
          params: { missingProperty: 'paths' }
        })
      );
    });

    test('should reject configuration with invalid character limits', () => {
      const invalidConfig = {
        paths: {
          docsDir: './docs',
          llmContentDir: './data',
          outputDir: './data',
          templatesDir: './templates',
          instructionsDir: './instructions'
        },
        generation: {
          supportedLanguages: ['en'],
          characterLimits: ['invalid'], // Should be numbers
          defaultLanguage: 'en',
          outputFormat: 'md'
        },
        quality: {
          minCompletenessThreshold: 0.7,
          enableValidation: true,
          strictMode: false
        }
      };

      const valid = validate(invalidConfig);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/generation/characterLimits/0',
          schemaPath: '#/properties/generation/properties/characterLimits/items/type',
          keyword: 'type'
        })
      );
    });

    test('should reject configuration with invalid language codes', () => {
      const invalidConfig = {
        paths: {
          docsDir: './docs',
          llmContentDir: './data',
          outputDir: './data',
          templatesDir: './templates',
          instructionsDir: './instructions'
        },
        generation: {
          supportedLanguages: ['invalid-lang'], // Should be valid language codes
          characterLimits: [100],
          defaultLanguage: 'en',
          outputFormat: 'md'
        },
        quality: {
          minCompletenessThreshold: 0.7,
          enableValidation: true,
          strictMode: false
        }
      };

      const valid = validate(invalidConfig);
      expect(valid).toBe(false);
    });

    test('should reject configuration with invalid output format', () => {
      const invalidConfig = {
        paths: {
          docsDir: './docs',
          llmContentDir: './data',
          outputDir: './data',
          templatesDir: './templates',
          instructionsDir: './instructions'
        },
        generation: {
          supportedLanguages: ['en'],
          characterLimits: [100],
          defaultLanguage: 'en',
          outputFormat: 'invalid' // Should be 'md' or 'txt'
        },
        quality: {
          minCompletenessThreshold: 0.7,
          enableValidation: true,
          strictMode: false
        }
      };

      const valid = validate(invalidConfig);
      expect(valid).toBe(false);
    });

    test('should reject configuration with invalid quality threshold', () => {
      const invalidConfig = {
        paths: {
          docsDir: './docs',
          llmContentDir: './data',
          outputDir: './data',
          templatesDir: './templates',
          instructionsDir: './instructions'
        },
        generation: {
          supportedLanguages: ['en'],
          characterLimits: [100],
          defaultLanguage: 'en',
          outputFormat: 'md'
        },
        quality: {
          minCompletenessThreshold: 1.5, // Should be between 0 and 1
          enableValidation: true,
          strictMode: false
        }
      };

      const valid = validate(invalidConfig);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/quality/minCompletenessThreshold',
          schemaPath: '#/properties/quality/properties/minCompletenessThreshold/maximum',
          keyword: 'maximum'
        })
      );
    });
  });

  describe('Schema Coverage', () => {
    test('should cover all configuration options', () => {
      const requiredProperties = ['paths', 'generation', 'quality'];
      const optionalProperties = ['optimization', 'advanced'];
      
      requiredProperties.forEach(prop => {
        expect(schema.properties[prop]).toBeDefined();
      });
      
      optionalProperties.forEach(prop => {
        expect(schema.properties[prop]).toBeDefined();
      });
      
      expect(schema.required).toEqual(expect.arrayContaining(requiredProperties));
    });

    test('should have proper type definitions for all properties', () => {
      const properties = Object.keys(schema.properties);
      
      properties.forEach(prop => {
        const propSchema = schema.properties[prop];
        expect(propSchema.type).toBeDefined();
        expect(['object', 'array', 'string', 'number', 'boolean']).toContain(propSchema.type);
      });
    });
  });
});