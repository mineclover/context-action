/**
 * QualityEvaluator Tests - Basic functionality only
 */

import { QualityEvaluator } from '../../../src/core/QualityEvaluator.js';
import type { EnhancedLLMSConfig } from '../../../src/types/config.js';

describe('QualityEvaluator', () => {
  let mockConfig: EnhancedLLMSConfig;

  beforeEach(() => {
    // Minimal viable config
    mockConfig = {
      paths: { docs: 'docs', output: 'output', priority: 'priority' },
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
          tags: ['beginner']
        }
      },
      tags: {
        beginner: {
          name: '초보자',
          description: 'Beginner-friendly content',
          weight: 1.2,
          compatibleWith: ['practical'],
          audience: ['new-users']
        }
      },
      composition: {
        strategies: {
          balanced: {
            name: 'Balanced',
            description: 'Balanced approach',
            weights: { category: 0.3, tag: 0.3, dependency: 0.2, priority: 0.2 }
          }
        },
        defaultStrategy: 'balanced',
        optimization: {
          spaceUtilizationTarget: 0.8,
          minEfficiency: 0.6
        }
      },
      dependencies: {
        enabled: true,
        maxDepth: 3,
        includeOptional: false,
        conflictResolution: 'exclude-conflicts'
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
    } as EnhancedLLMSConfig;
  });

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      const evaluator = new QualityEvaluator(mockConfig);
      expect(evaluator).toBeInstanceOf(QualityEvaluator);
    });

    it('should be properly configured', () => {
      const evaluator = new QualityEvaluator(mockConfig);
      expect(evaluator).toBeDefined();
    });
  });

  describe('Basic functionality', () => {
    it('should have evaluateQuality method', () => {
      const evaluator = new QualityEvaluator(mockConfig);
      expect(typeof evaluator.evaluateQuality).toBe('function');
    });

    it('should handle method calls without crashing', () => {
      const evaluator = new QualityEvaluator(mockConfig);
      
      // Call with empty parameters should not crash
      expect(() => {
        const constraints = {
          maxCharacters: 1000,
          targetCharacterLimit: 1000,
          characterLimit: 1000
        } as any;
        
        evaluator.evaluateQuality([], constraints);
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid inputs gracefully', () => {
      const evaluator = new QualityEvaluator(mockConfig);
      
      expect(() => {
        const invalidConstraints = {} as any;
        evaluator.evaluateQuality([], invalidConstraints);
      }).not.toThrow();
    });

    it('should handle null/undefined inputs', () => {
      const evaluator = new QualityEvaluator(mockConfig);
      
      expect(() => {
        evaluator.evaluateQuality(null as any, null as any);
      }).not.toThrow();
    });
  });
});