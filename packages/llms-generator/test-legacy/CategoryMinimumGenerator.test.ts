/**
 * CategoryMinimumGenerator Tests - Basic functionality only
 */

import { CategoryMinimumGenerator, type CategoryMinimumOptions } from '../../../src/core/CategoryMinimumGenerator.js';

describe('CategoryMinimumGenerator', () => {
  describe('Constructor', () => {
    it('should initialize with minimal options', () => {
      // Use default options that don't require existing directories
      const generator = new CategoryMinimumGenerator();
      expect(generator).toBeInstanceOf(CategoryMinimumGenerator);
    });

    it('should be properly configured', () => {
      const generator = new CategoryMinimumGenerator();
      expect(generator).toBeDefined();
    });
  });

  describe('Basic functionality', () => {
    let generator: CategoryMinimumGenerator;
    
    beforeEach(() => {
      generator = new CategoryMinimumGenerator();
    });

    it('should have required methods', () => {
      expect(typeof generator.generateCategoryMinimum).toBe('function');
      expect(typeof generator.getAvailableCategories).toBe('function');
      expect(typeof generator.getAvailableDocuments).toBe('function');
      expect(typeof generator.getCategoryStats).toBe('function');
    });

    it('should handle method calls without crashing', () => {
      expect(() => {
        generator.getAvailableCategories();
      }).not.toThrow();
    });

    it('should handle stats requests', () => {
      expect(() => {
        generator.getCategoryStats('guide', 'en');
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid options gracefully', () => {
      expect(() => {
        const options: CategoryMinimumOptions = {
          categories: [], // Empty array should be fine
          languages: ['en']
        };
        new CategoryMinimumGenerator(options);
      }).not.toThrow();
    });

    it('should handle method calls with invalid parameters', () => {
      const generator = new CategoryMinimumGenerator();
      
      expect(() => {
        generator.generateCategoryMinimum('nonexistent', 'en');
      }).not.toThrow();
    });
  });
});