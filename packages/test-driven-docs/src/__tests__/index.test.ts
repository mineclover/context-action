/**
 * @fileoverview Tests for main exports
 */

import * as testDrivenDocs from '../index.js';

describe('Test-driven-docs exports', () => {
  describe('main exports', () => {
    it('should export DocumentationGenerator', () => {
      expect(testDrivenDocs.DocumentationGenerator).toBeDefined();
      expect(typeof testDrivenDocs.DocumentationGenerator).toBe('function');
    });

    it('should export AnnotationExtractor', () => {
      expect(testDrivenDocs.AnnotationExtractor).toBeDefined();
      expect(typeof testDrivenDocs.AnnotationExtractor).toBe('function');
    });

    it('should export ConsistencyValidator', () => {
      expect(testDrivenDocs.ConsistencyValidator).toBeDefined();
      expect(typeof testDrivenDocs.ConsistencyValidator).toBe('function');
    });

    it('should export EnhancedMarkdownGenerator', () => {
      expect(testDrivenDocs.EnhancedMarkdownGenerator).toBeDefined();
      expect(typeof testDrivenDocs.EnhancedMarkdownGenerator).toBe('function');
    });

    it('should export TestParser', () => {
      expect(testDrivenDocs.TestParser).toBeDefined();
      expect(typeof testDrivenDocs.TestParser).toBe('function');
    });

    it('should export CodeCleaner', () => {
      expect(testDrivenDocs.CodeCleaner).toBeDefined();
      expect(typeof testDrivenDocs.CodeCleaner).toBe('function');
    });

    it('should export TestMetadataExtractor', () => {
      expect(testDrivenDocs.TestMetadataExtractor).toBeDefined();
      expect(typeof testDrivenDocs.TestMetadataExtractor).toBe('function');
    });
  });

  describe('utility exports', () => {
    it('should export utility functions', () => {
      expect(testDrivenDocs.formatApiName).toBeDefined();
      expect(typeof testDrivenDocs.formatApiName).toBe('function');

      expect(testDrivenDocs.validateConfig).toBeDefined();
      expect(typeof testDrivenDocs.validateConfig).toBe('function');

      expect(testDrivenDocs.generateExampleId).toBeDefined();
      expect(typeof testDrivenDocs.generateExampleId).toBe('function');
    });
  });

  describe('type exports', () => {
    it('should export type interfaces (runtime check)', () => {
      // We can't directly test TypeScript types at runtime,
      // but we can test that the module structure is correct
      expect(typeof testDrivenDocs).toBe('object');
      expect(Object.keys(testDrivenDocs).length).toBeGreaterThan(0);
    });
  });

  describe('module integrity', () => {
    it('should not have undefined exports', () => {
      const exportedValues = Object.values(testDrivenDocs);
      const undefinedExports = exportedValues.filter(value => value === undefined);

      expect(undefinedExports).toHaveLength(0);
    });

    it('should export expected number of items', () => {
      const exportKeys = Object.keys(testDrivenDocs);

      // We expect to have at least the main classes and utilities
      expect(exportKeys.length).toBeGreaterThanOrEqual(10);
    });

    it('should have consistent export names', () => {
      const exportKeys = Object.keys(testDrivenDocs);

      // Check for expected patterns in export names
      const classExports = exportKeys.filter(key =>
        key.includes('Generator') ||
        key.includes('Extractor') ||
        key.includes('Validator') ||
        key.includes('Parser') ||
        key.includes('Cleaner')
      );

      expect(classExports.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('class instantiation', () => {
    it('should be able to instantiate DocumentationGenerator', () => {
      const config = {
        packagesDir: './packages',
        packages: ['test'],
        outputDir: './docs',
        languages: ['en']
      };

      expect(() => {
        new testDrivenDocs.DocumentationGenerator(config);
      }).not.toThrow();
    });

    it('should be able to instantiate AnnotationExtractor', () => {
      expect(() => {
        new testDrivenDocs.AnnotationExtractor();
      }).not.toThrow();
    });

    it('should be able to instantiate ConsistencyValidator', () => {
      const config = {
        packagesDir: './packages',
        packages: ['test']
      };

      expect(() => {
        new testDrivenDocs.ConsistencyValidator(config);
      }).not.toThrow();
    });

    it('should be able to instantiate EnhancedMarkdownGenerator', () => {
      expect(() => {
        new testDrivenDocs.EnhancedMarkdownGenerator({});
      }).not.toThrow();
    });

    it('should be able to instantiate TestParser', () => {
      expect(() => {
        new testDrivenDocs.TestParser();
      }).not.toThrow();
    });

    it('should be able to instantiate CodeCleaner', () => {
      expect(() => {
        new testDrivenDocs.CodeCleaner();
      }).not.toThrow();
    });

    it('should be able to instantiate TestMetadataExtractor', () => {
      expect(() => {
        new testDrivenDocs.TestMetadataExtractor();
      }).not.toThrow();
    });
  });
});