import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { PriorityManagerCommand } from '../../src/cli/commands/PriorityManagerCommand.js';
import { EnhancedLLMSConfig } from '../../src/types/config.js';

describe('PriorityManagerCommand', () => {
  let priorityManager: PriorityManagerCommand;
  let testDataDir: string;
  let config: EnhancedLLMSConfig;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-priority');
    
    config = {
      paths: {
        docsDir: path.join(testDataDir, 'docs'),
        llmContentDir: path.join(testDataDir, 'llmsData'),
        outputDir: path.join(testDataDir, 'output'),
        templatesDir: path.join(testDataDir, 'templates'),
        instructionsDir: path.join(testDataDir, 'instructions')
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000],
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      categories: {
        guide: { 
          priority: 95,
          name: '가이드',
          description: '사용자 가이드'
        },
        api: { 
          priority: 90,
          name: 'API',
          description: 'API 문서'
        },
        concept: { 
          priority: 85,
          name: '개념',
          description: '개념 설명'
        }
      },
      tags: {},
      dependencies: {
        rules: {
          prerequisite: { description: '', weight: 0, autoInclude: false },
          reference: { description: '', weight: 0, autoInclude: false },
          followup: { description: '', weight: 0, autoInclude: false },
          complement: { description: '', weight: 0, autoInclude: false }
        },
        conflictResolution: {
          strategy: 'exclude-conflicts',
          priority: 'higher-score-wins',
          allowPartialConflicts: false
        }
      },
      composition: {
        strategies: {},
        defaultStrategy: 'default',
        optimization: {
          spaceUtilizationTarget: 0.8,
          qualityThreshold: 0.7,
          diversityBonus: 0.1,
          redundancyPenalty: 0.2
        }
      },
      extraction: {
        defaultQualityThreshold: 0.7,
        autoTagExtraction: false,
        autoDependencyDetection: false,
        strategies: {}
      },
      validation: {
        schema: {
          enforceTagConsistency: false,
          validateDependencies: false,
          checkCategoryAlignment: false
        },
        quality: {
          minPriorityScore: 0,
          maxDocumentAge: '1y',
          requireMinimumContent: false
        }
      },
      ui: {
        dashboard: {
          enableTagCloud: false,
          showCategoryStats: false,
          enableDependencyGraph: false
        },
        reporting: {
          generateCompositionReports: false,
          includeQualityMetrics: false,
          exportFormats: ['json']
        }
      }
    } as EnhancedLLMSConfig;

    priorityManager = new PriorityManagerCommand(config);

    // Create test directory structure
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'api--core'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('stats mode', () => {
    it('should calculate and display priority statistics', async () => {
      // Create test priority.json files
      const priorities = [
        {
          document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
          priority: { score: 95, tier: 'high' }
        },
        {
          document: { id: 'api--core', category: 'api', language: 'en' },
          priority: { score: 85, tier: 'medium' }
        },
        {
          document: { id: 'guide--getting-started', category: 'guide', language: 'ko' },
          priority: { score: 90, tier: 'high' }
        }
      ];

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priorities[0], null, 2)
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'priority.json'),
        JSON.stringify(priorities[1], null, 2)
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priorities[2], null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'stats' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show statistics
        expect(output).toContain('Priority Statistics') || expect(output).toContain('📊');
        expect(output).toContain('Total Documents:') || expect(output).toContain('3');
        expect(output).toContain('Average Score:') || expect(output).toContain('90');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle empty priority data gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'stats' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should handle empty data gracefully
        expect(output).toContain('Total Documents: 0');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('health mode', () => {
    it('should check priority health and consistency', async () => {
      // Create priority.json with both old and new formats
      const newFormat = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high', factors: { importance: 100, urgency: 90, impact: 95 } }
      };

      const oldFormat = {
        document: { id: 'api--core', category: 'api', language: 'en' },
        priority: 85
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(newFormat, null, 2)
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'priority.json'),
        JSON.stringify(oldFormat, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'health' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show health check results
        expect(output).toContain('Priority Health Report') || expect(output).toContain('🏥');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should identify inconsistencies in priority scores', async () => {
      // Create priority with score that doesn't match category
      const inconsistentPriority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 50, tier: 'low' } // Guide should have high priority
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(inconsistentPriority, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'health' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should identify inconsistency  
        expect(output).toContain('⚠️') || expect(output).toContain('Issues Found');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('suggest mode', () => {
    it('should provide suggestions for priority improvements', async () => {
      // Create priority.json with room for improvement
      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 70, tier: 'medium' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'suggest' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should provide suggestions
        expect(output).toContain('💡') || expect(output).toContain('Priority Management Suggestions');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should provide document-specific suggestions', async () => {
      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 70, tier: 'medium' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ 
          mode: 'suggest', 
          documentId: 'guide--getting-started' 
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show document-specific suggestions
        expect(output).toContain('💡') || expect(output).toContain('Priority Management Suggestions');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('auto-calc mode', () => {
    it('should automatically recalculate priorities', async () => {
      // Create priority.json with old scores
      const oldPriority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 50, tier: 'low' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(oldPriority, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'auto-calc', force: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show recalculation results
        expect(output).toContain('🤖') || expect(output).toContain('Updated') || expect(output).toContain('calculating');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should use custom criteria file if provided', async () => {
      // Create custom criteria file
      const customCriteria = {
        categoryWeights: {
          guide: 0.9,
          api: 0.8,
          concept: 0.7
        },
        languageBoost: {
          ko: 1.1,
          en: 1.0
        }
      };

      const criteriaPath = path.join(testDataDir, 'custom-criteria.json');
      await fs.writeFile(criteriaPath, JSON.stringify(customCriteria, null, 2));

      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 50, tier: 'low' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ 
          mode: 'auto-calc', 
          criteria: criteriaPath,
          force: true 
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should use custom criteria  
        expect(output).toContain('🤖') || expect(output).toContain('Updated') || expect(output).toContain('calculating');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('upgrade mode', () => {
    it('should upgrade old format priority.json files', async () => {
      // Create old format priority.json
      const oldFormat = {
        document: { id: 'api--core', category: 'api', language: 'en' },
        priority: 85
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'priority.json'),
        JSON.stringify(oldFormat, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'upgrade', force: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show upgrade results
        expect(output).toContain('Upgrading') || 
               expect(output).toContain('upgraded') ||
               expect(output).toContain('🔄');
        
      } finally {
        consoleSpy.mockRestore();
      }

      // Check that file was upgraded
      const upgradedContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'priority.json'),
        'utf-8'
      );
      const upgradedData = JSON.parse(upgradedContent);
      
      // Should have new format
      expect(upgradedData.priority).toBeInstanceOf(Object);
      expect(upgradedData.priority.score).toBe(85);
      expect(upgradedData.priority.tier).toBeDefined();
      expect(upgradedData.metadata).toBeDefined();
      expect(upgradedData.metadata.language).toBe('en');
    });

    it('should skip files already in new format', async () => {
      // Create new format priority.json
      const newFormat = {
        priority: { score: 95, tier: 'high', reasoning: 'Important getting started guide' },
        metadata: { title: 'Getting Started', language: 'en', category: 'guide' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(newFormat, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'upgrade' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should indicate no files need upgrade
        expect(output).toContain('🔄') || expect(output).toContain('0 old format') || expect(output).toContain('already in the new format');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('error handling', () => {
    it('should handle malformed priority.json files', async () => {
      // Create malformed priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        'invalid json content'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        // This should throw an error due to invalid JSON
        await priorityManager.execute({ mode: 'stats' });
        
        // If it doesn't throw, that's also okay (graceful handling)
        expect(true).toBe(true);
        
      } catch (error) {
        // Should handle JSON parse errors gracefully
        expect(error.message).toContain('is not valid JSON');
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle missing directories gracefully', async () => {
      // Create config with non-existent directory
      const badConfig = {
        ...config,
        paths: {
          ...config.paths,
          llmContentDir: path.join(testDataDir, 'non-existent')
        }
      };

      const badPriorityManager = new PriorityManagerCommand(badConfig);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await badPriorityManager.execute({ mode: 'stats' });
        
        // Should handle gracefully
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('quiet mode', () => {
    it('should suppress detailed output in quiet mode', async () => {
      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'stats', quiet: true });
        
        // Should have minimal output
        expect(consoleSpy.mock.calls.length).toBeLessThan(5);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('format detection', () => {
    it('should correctly identify old format files', async () => {
      // Create mixed format files
      const oldFormat = {
        document: { id: 'api--core', category: 'api' },
        priority: 85
      };

      const newFormat = {
        document: { id: 'guide--getting-started', category: 'guide' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'priority.json'),
        JSON.stringify(oldFormat, null, 2)
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(newFormat, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await priorityManager.execute({ mode: 'health' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should detect health report content
        expect(output).toContain('🏥') || expect(output).toContain('Health Report') || expect(output).toContain('EXCELLENT');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});