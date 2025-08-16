/**
 * CLI command for validating configuration files
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { ConfigSchemaManager } from '../../core/ConfigSchemaManager.js';

export interface ValidateConfigOptions {
  configPath: string;
  schemaPath?: string;
  strict?: boolean;
  output?: 'json' | 'table' | 'summary';
  fix?: boolean;
}

export async function validateConfigCommand(options: ValidateConfigOptions): Promise<void> {
  const {
    configPath,
    schemaPath,
    strict = false,
    output = 'summary',
    fix = false
  } = options;

  try {
    // Resolve paths
    const resolvedConfigPath = path.resolve(configPath);
    
    if (!existsSync(resolvedConfigPath)) {
      console.error(`❌ Configuration file not found: ${resolvedConfigPath}`);
      process.exit(1);
    }

    // Determine schema path
    let resolvedSchemaPath: string;
    if (schemaPath) {
      resolvedSchemaPath = path.resolve(schemaPath);
    } else {
      // Try to find schema in common locations
      const possibleSchemaPaths = [
        path.join(path.dirname(resolvedConfigPath), 'data', 'config-schema.json'),
        path.join(path.dirname(resolvedConfigPath), 'packages', 'llms-generator', 'data', 'config-schema.json'),
        path.join(process.cwd(), 'packages', 'llms-generator', 'data', 'config-schema.json')
      ];
      
      resolvedSchemaPath = possibleSchemaPaths.find(p => existsSync(p)) || possibleSchemaPaths[0];
    }

    const dataDir = path.dirname(resolvedSchemaPath);
    const manager = new ConfigSchemaManager(dataDir);

    // Load schema
    console.log(`📋 Loading schema from: ${resolvedSchemaPath}`);
    await manager.loadSchema();

    // Validate configuration
    console.log(`🔍 Validating configuration: ${resolvedConfigPath}`);
    const result = await manager.validateConfig(resolvedConfigPath);

    // Output results
    await outputValidationResult(result, output, strict);

    // Auto-fix if requested
    if (fix && !result.valid && result.config) {
      await attemptAutoFix(resolvedConfigPath, result);
    }

    // Exit with appropriate code
    if (!result.valid) {
      process.exit(strict || result.errors.length > 0 ? 1 : 0);
    }

    console.log('✅ Configuration validation completed successfully');

  } catch (error) {
    console.error(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function outputValidationResult(
  result: any,
  format: 'json' | 'table' | 'summary',
  strict: boolean
): Promise<void> {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'table':
      await outputTableFormat(result);
      break;
      
    case 'summary':
    default:
      await outputSummaryFormat(result, strict);
      break;
  }
}

async function outputSummaryFormat(result: any, strict: boolean): Promise<void> {
  console.log('\n📊 Validation Summary');
  console.log('━'.repeat(50));
  
  if (result.valid) {
    console.log('✅ Status: VALID');
  } else {
    console.log('❌ Status: INVALID');
  }
  
  console.log(`📋 Errors: ${result.errors.length}`);
  console.log(`⚠️  Warnings: ${result.warnings?.length || 0}`);
  
  if (result.errors.length > 0) {
    console.log('\n🚨 Errors:');
    for (const error of result.errors) {
      console.log(`  • ${error}`);
    }
  }
  
  if (result.warnings && result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of result.warnings) {
      console.log(`  • ${warning}`);
    }
    
    if (strict) {
      console.log('\n❌ Validation failed due to warnings (strict mode)');
    }
  }
}

async function outputTableFormat(result: any): Promise<void> {
  const issues = [
    ...result.errors.map((error: string) => ({ type: 'ERROR', message: error })),
    ...(result.warnings || []).map((warning: string) => ({ type: 'WARNING', message: warning }))
  ];

  if (issues.length === 0) {
    console.log('\n✅ No issues found');
    return;
  }

  console.log('\n📋 Validation Issues:');
  console.log('┌─────────┬─────────────────────────────────────────────────────────────────┐');
  console.log('│ Type    │ Message                                                         │');
  console.log('├─────────┼─────────────────────────────────────────────────────────────────┤');
  
  for (const issue of issues) {
    const type = issue.type.padEnd(7);
    const message = issue.message.length > 63 
      ? issue.message.substring(0, 60) + '...' 
      : issue.message.padEnd(63);
    console.log(`│ ${type} │ ${message} │`);
  }
  
  console.log('└─────────┴─────────────────────────────────────────────────────────────────┘');
}

async function attemptAutoFix(configPath: string, result: any): Promise<void> {
  console.log('\n🔧 Attempting auto-fix...');
  
  try {
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    let modified = false;
    
    // Fix character limits ordering
    if (config.characterLimits && !isArraySorted(config.characterLimits)) {
      config.characterLimits.sort((a: number, b: number) => a - b);
      modified = true;
      console.log('  ✅ Fixed character limits ordering');
    }
    
    // Fix composition strategy weights
    if (config.composition?.strategies) {
      for (const [strategyName, strategy] of Object.entries(config.composition.strategies) as any) {
        const weightSum = Object.values(strategy.weights).reduce((sum: number, weight: number) => sum + weight, 0);
        if (Math.abs(weightSum - 1.0) > 0.01) {
          // Normalize weights to sum to 1.0
          const factor = 1.0 / weightSum;
          for (const [key, value] of Object.entries(strategy.weights)) {
            (strategy.weights as any)[key] = Number(((value as number) * factor).toFixed(3));
          }
          modified = true;
          console.log(`  ✅ Fixed weights for strategy "${strategyName}"`);
        }
      }
    }
    
    if (modified) {
      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('📝 Configuration file updated with fixes');
    } else {
      console.log('ℹ️  No automatic fixes available');
    }
    
  } catch (error) {
    console.log(`❌ Auto-fix failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function isArraySorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) {
      return false;
    }
  }
  return true;
}

// Helper function for importing in other modules
export function createValidateConfigCommand() {
  return async (
    configPath: string,
    options: Omit<ValidateConfigOptions, 'configPath'> = {}
  ) => {
    await validateConfigCommand({ configPath, ...options });
  };
}