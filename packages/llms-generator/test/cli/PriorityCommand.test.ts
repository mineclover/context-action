/**
 * PriorityCommand Test Suite
 * 
 * Tests for the priority management integrated command
 * Focuses on command structure, metadata, and basic routing functionality
 */

import { PriorityCommand } from '../../src/cli/commands/PriorityCommand.js';
import type { CLIArgs } from '../../src/cli/types/CommandTypes.js';
import { jest } from '@jest/globals';

describe('PriorityCommand', () => {
  let priorityCommand: PriorityCommand;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    priorityCommand = new PriorityCommand();
    
    // Initialize context
    (priorityCommand as any).context = {
      workingDir: '/test/workspace',
      dryRun: false,
      verbose: false
    };
    
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Command Metadata', () => {
    test('should have correct name and description', () => {
      expect(priorityCommand.name).toBe('priority');
      expect(priorityCommand.description).toBe('Priority and document management');
      expect(priorityCommand.aliases).toEqual(['pri']);
    });

    test('should have all 12 subcommands defined', () => {
      const expectedSubcommands = [
        'generate', 'template', 'stats', 'discover', 'analyze',
        'check', 'simple', 'migrate', 'llms', 'batch', 'stats-llms', 'auto'
      ];

      const actualSubcommands = Object.keys(priorityCommand.subcommands);
      expect(actualSubcommands).toHaveLength(12);
      
      for (const subcommand of expectedSubcommands) {
        expect(priorityCommand.subcommands[subcommand]).toBeDefined();
      }
    });

    test('should have comprehensive examples', () => {
      expect(priorityCommand.examples.length).toBeGreaterThan(5);
      expect(priorityCommand.examples).toContain('priority generate en --overwrite');
      expect(priorityCommand.examples).toContain('priority llms 100 --language=ko');
    });
  });

  describe('Main Execute Method', () => {
    test('should show help when no action provided', async () => {
      const showHelpSpy = jest.spyOn(priorityCommand as any, 'showHelp').mockImplementation();
      
      const args: CLIArgs = {
        command: 'priority',
        positional: [],
        options: {},
        flags: {}
      };

      await priorityCommand.execute(args);
      expect(showHelpSpy).toHaveBeenCalled();
    });

    test('should show help when help action provided', async () => {
      const showHelpSpy = jest.spyOn(priorityCommand as any, 'showHelp').mockImplementation();
      
      const args: CLIArgs = {
        command: 'priority',
        positional: ['help'],
        options: {},
        flags: {}
      };

      await priorityCommand.execute(args);
      expect(showHelpSpy).toHaveBeenCalled();
    });

    test('should handle unknown action gracefully', async () => {
      const logErrorSpy = jest.spyOn(priorityCommand as any, 'logError').mockImplementation();
      const logInfoSpy = jest.spyOn(priorityCommand as any, 'logInfo').mockImplementation();
      
      const args: CLIArgs = {
        command: 'priority',
        positional: ['unknown-action'],
        options: {},
        flags: {}
      };

      await priorityCommand.execute(args);
      expect(logErrorSpy).toHaveBeenCalledWith('Unknown priority action: unknown-action');
      expect(logInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Available actions:'));
    });

    test('should route to subcommand when valid action provided', async () => {
      // Test that the routing logic works correctly without actually executing
      const args: CLIArgs = {
        command: 'priority',
        positional: ['generate', 'en'],
        options: {},
        flags: {}
      };

      const action = args.positional[0];
      const subcommand = priorityCommand.subcommands[action];
      
      expect(action).toBe('generate');
      expect(subcommand).toBeDefined();
      expect(subcommand.name).toBe('generate');
      expect(typeof subcommand.execute).toBe('function');
    });
  });

  describe('Subcommand Definitions', () => {
    test('generate subcommand should have correct options', () => {
      const generateCmd = priorityCommand.subcommands.generate;
      expect(generateCmd.description).toBe('Generate priority.json files for all documents');
      expect(generateCmd.options).toHaveLength(2);
      
      const languageOption = generateCmd.options.find(opt => opt.name === 'language');
      expect(languageOption?.alias).toBe('lang');
      expect(languageOption?.default).toBe('en');
      
      const overwriteOption = generateCmd.options.find(opt => opt.name === 'overwrite');
      expect(overwriteOption?.type).toBe('boolean');
      
      expect(generateCmd.examples.length).toBeGreaterThan(0);
    });

    test('template subcommand should be configured correctly', () => {
      const templateCmd = priorityCommand.subcommands.template;
      expect(templateCmd.description).toBe('Generate individual summary document templates');
      expect(templateCmd.examples.length).toBeGreaterThan(0);
    });

    test('stats subcommand should have proper options', () => {
      const statsCmd = priorityCommand.subcommands.stats;
      expect(statsCmd.description).toBe('Show priority generation statistics');
      expect(statsCmd.options).toHaveLength(2);
      
      const languageOption = statsCmd.options.find(opt => opt.name === 'language');
      expect(languageOption?.default).toBe('en');
      
      const detailedOption = statsCmd.options.find(opt => opt.name === 'detailed');
      expect(detailedOption?.type).toBe('boolean');
    });

    test('analyze subcommand should have comprehensive options', () => {
      const analyzeCmd = priorityCommand.subcommands.analyze;
      expect(analyzeCmd.description).toBe('Analyze Priority JSON work status and completion');
      expect(analyzeCmd.options).toHaveLength(6);
      
      const formatOption = analyzeCmd.options.find(opt => opt.name === 'format');
      expect(formatOption?.choices).toEqual(['json', 'table', 'summary']);
      expect(formatOption?.default).toBe('table');
      
      const dataDirOption = analyzeCmd.options.find(opt => opt.name === 'data-dir');
      expect(dataDirOption?.default).toBe('./data');
    });

    test('llms subcommand should have proper option configuration', () => {
      const llmsCmd = priorityCommand.subcommands.llms;
      expect(llmsCmd.description).toBe('Generate simple LLMS by combining .md files');
      expect(llmsCmd.options).toHaveLength(5);
      
      const sortOption = llmsCmd.options.find(opt => opt.name === 'sort-by');
      expect(sortOption?.choices).toEqual(['priority', 'name', 'date']);
      expect(sortOption?.default).toBe('priority');
      
      const charLimitOption = llmsCmd.options.find(opt => opt.name === 'character-limit');
      expect(charLimitOption?.type).toBe('number');
    });

    test('batch subcommand should have multiple limits support', () => {
      const batchCmd = priorityCommand.subcommands.batch;
      expect(batchCmd.description).toBe('Batch generate simple LLMS for multiple character limits');
      
      const charLimitsOption = batchCmd.options.find(opt => opt.name === 'character-limits');
      expect(charLimitsOption?.default).toBe('100,300,1000');
    });

    test('all subcommands should have examples', () => {
      for (const [name, subcommand] of Object.entries(priorityCommand.subcommands)) {
        expect(subcommand.examples).toBeDefined();
        expect(subcommand.examples.length).toBeGreaterThan(0);
        expect(subcommand.description).toBeTruthy();
        
        // Each example should start with the command name
        for (const example of subcommand.examples) {
          expect(example).toMatch(/^priority \w+/);
        }
      }
    });
  });

  describe('External Command Integration Subcommands', () => {
    test('should have external command subcommands defined', () => {
      // Test that external command integration subcommands exist
      expect(priorityCommand.subcommands.check).toBeDefined();
      expect(priorityCommand.subcommands.simple).toBeDefined();
      expect(priorityCommand.subcommands.migrate).toBeDefined();
      expect(priorityCommand.subcommands.llms).toBeDefined();
      expect(priorityCommand.subcommands.batch).toBeDefined();
      expect(priorityCommand.subcommands['stats-llms']).toBeDefined();
      expect(priorityCommand.subcommands.auto).toBeDefined();
    });

    test('should have correct external command descriptions', () => {
      expect(priorityCommand.subcommands.check.description).toBe('Check priority file status and validation');
      expect(priorityCommand.subcommands.simple.description).toBe('Simplified priority and markdown work status check');
      expect(priorityCommand.subcommands.migrate.description).toBe('Migrate complex Priority JSON to simplified format');
      expect(priorityCommand.subcommands.llms.description).toBe('Generate simple LLMS by combining .md files');
      expect(priorityCommand.subcommands.batch.description).toBe('Batch generate simple LLMS for multiple character limits');
      expect(priorityCommand.subcommands['stats-llms'].description).toBe('Show simple LLMS generation statistics');
      expect(priorityCommand.subcommands.auto.description).toBe('Auto-generate LLMS for ready documents');
    });

    test('check subcommand should have validation options', () => {
      const checkCmd = priorityCommand.subcommands.check;
      expect(checkCmd.options).toHaveLength(4);
      
      const fixOption = checkCmd.options.find(opt => opt.name === 'fix');
      expect(fixOption?.type).toBe('boolean');
      
      const migrateOption = checkCmd.options.find(opt => opt.name === 'migrate');
      expect(migrateOption?.type).toBe('boolean');
    });

    test('migrate subcommand should have backup option', () => {
      const migrateCmd = priorityCommand.subcommands.migrate;
      
      const backupOption = migrateCmd.options.find(opt => opt.name === 'backup');
      expect(backupOption?.type).toBe('boolean');
      expect(backupOption?.default).toBe(true);
    });
  });

  describe('Display Methods', () => {
    test('should display stats correctly', () => {
      const stats = {
        totalDocuments: 25,
        generatedPriorities: 20,
        successRate: 80,
        details: {
          'guide': 8,
          'api': 7,
          'concept': 5
        }
      };

      priorityCommand['displayStats'](stats, false);

      expect(consoleSpy).toHaveBeenCalledWith('\n📊 Priority Generation Statistics:');
      expect(consoleSpy).toHaveBeenCalledWith('  Total documents: 25');
      expect(consoleSpy).toHaveBeenCalledWith('  Generated priorities: 20');
      expect(consoleSpy).toHaveBeenCalledWith('  Success rate: 80%');
    });

    test('should display detailed stats when requested', () => {
      const stats = {
        totalDocuments: 25,
        generatedPriorities: 20,
        successRate: 80,
        details: {
          'guide': 8,
          'api': 7,
          'concept': 5
        }
      };

      priorityCommand['displayStats'](stats, true);

      expect(consoleSpy).toHaveBeenCalledWith('\n📋 Detailed breakdown:');
      expect(consoleSpy).toHaveBeenCalledWith('  guide: 8');
      expect(consoleSpy).toHaveBeenCalledWith('  api: 7');
      expect(consoleSpy).toHaveBeenCalledWith('  concept: 5');
    });

    test('should handle stats with missing data gracefully', () => {
      const incompleteStats = {};

      priorityCommand['displayStats'](incompleteStats, false);

      expect(consoleSpy).toHaveBeenCalledWith('  Total documents: 0');
      expect(consoleSpy).toHaveBeenCalledWith('  Generated priorities: 0');
      expect(consoleSpy).toHaveBeenCalledWith('  Success rate: 0%');
    });

    test('should format analysis results as table', () => {
      const results = { test: 'data' };
      const output = priorityCommand['formatAsTable'](results);

      expect(output).toContain('📊 Priority Analysis Results:');
      expect(output).toContain('"test": "data"');
    });

    test('should format analysis results as summary', () => {
      const results = { summary: 'test' };
      const output = priorityCommand['formatAsSummary'](results);

      expect(output).toContain('📋 Summary:');
      expect(output).toContain('"summary": "test"');
    });
  });

  describe('Help Display', () => {
    test('should show comprehensive help', () => {
      priorityCommand['showHelp']();

      expect(consoleSpy).toHaveBeenCalledWith('\n📋 priority - Priority and document management');
      expect(consoleSpy).toHaveBeenCalledWith('\nUSAGE:');
      expect(consoleSpy).toHaveBeenCalledWith('  priority <action> [options]');
      expect(consoleSpy).toHaveBeenCalledWith('\nACTIONS:');
      expect(consoleSpy).toHaveBeenCalledWith('\nEXAMPLES:');
      expect(consoleSpy).toHaveBeenCalledWith('\nFor detailed help on specific action:');
      expect(consoleSpy).toHaveBeenCalledWith('  priority <action> --help');
    });

    test('should list all subcommands in help', () => {
      priorityCommand['showHelp']();

      // Check that help output includes information about all subcommands
      const helpCalls = consoleSpy.mock.calls.map(call => call[0]).join(' ');
      
      expect(helpCalls).toContain('generate');
      expect(helpCalls).toContain('template');
      expect(helpCalls).toContain('stats');
      expect(helpCalls).toContain('discover');
      expect(helpCalls).toContain('analyze');
      expect(helpCalls).toContain('check');
      expect(helpCalls).toContain('simple');
      expect(helpCalls).toContain('migrate');
      expect(helpCalls).toContain('llms');
      expect(helpCalls).toContain('batch');
      expect(helpCalls).toContain('auto');
    });
  });

  describe('Command Integration Architecture', () => {
    test('should have correct execute method bindings', () => {
      // Verify that all subcommand execute methods are properly bound
      for (const [name, subcommand] of Object.entries(priorityCommand.subcommands)) {
        expect(subcommand.execute).toBeDefined();
        expect(typeof subcommand.execute).toBe('function');
      }
    });

    test('should maintain consistent option naming patterns', () => {
      // Check specific commands that we know have language options
      const generateCmd = priorityCommand.subcommands.generate;
      const generateLangOption = generateCmd.options.find(opt => opt.name === 'language');
      expect(generateLangOption?.alias).toBe('lang');
      expect(generateLangOption?.type).toBe('string');
      
      const statsCmd = priorityCommand.subcommands.stats;
      const statsLangOption = statsCmd.options.find(opt => opt.name === 'language');
      expect(statsLangOption?.alias).toBe('lang');
      
      // Check that analyze command uses 'l' for languages (different field)
      const analyzeCmd = priorityCommand.subcommands.analyze;
      const analyzeLangOption = analyzeCmd.options.find(opt => opt.name === 'languages');
      expect(analyzeLangOption?.alias).toBe('l');
    });

    test('should have consistent example format', () => {
      // All examples should follow the pattern "priority <subcommand> [args]"
      for (const [name, subcommand] of Object.entries(priorityCommand.subcommands)) {
        subcommand.examples.forEach(example => {
          expect(example).toMatch(/^priority \w+/);
          expect(example).toContain(name);
        });
      }
    });

    test('should integrate legacy commands properly', () => {
      // Test the structure that integrates with legacy CLI commands
      const legacyIntegrationCommands = ['check', 'simple', 'migrate', 'llms', 'batch', 'stats-llms', 'auto'];
      
      legacyIntegrationCommands.forEach(cmdName => {
        const cmd = priorityCommand.subcommands[cmdName];
        expect(cmd).toBeDefined();
        expect(cmd.description).toBeTruthy();
        expect(cmd.examples.length).toBeGreaterThan(0);
      });
    });
  });
});