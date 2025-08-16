/**
 * Config-based bulk sync operation for LLMS Generator
 * TypeScript migration of sync-all.cjs
 */

import { execSync } from 'child_process';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { generateIndividualFiles } from './generate.js';

export interface SyncOptions {
  configPath?: string;
  languages?: string[];
  characterLimits?: number[];
  skipGeneration?: boolean;
}

async function loadConfig(configPath: string) {
  try {
    const configContent = await readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Failed to load config:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function runCommand(command: string, description: string): string | null {
  console.log(`🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function syncAll(options: SyncOptions = {}): Promise<void> {
  console.log('🚀 Starting config-based bulk sync operation...\n');
  
  const configPath = options.configPath || resolve(process.cwd(), 'llms-generator.config.json');
  const config = await loadConfig(configPath);
  
  console.log(`📋 Config loaded: ${config.languages?.length || 0} languages, ${config.characterLimits?.length || 0} character limits`);
  
  const languages = options.languages || config.languages || ['en'];
  const characterLimits = options.characterLimits || config.characterLimits || [100, 200, 300, 400];
  
  let totalGenerated = 0;
  let totalErrors = 0;
  
  // Step 1: Priority.json generation (currently disabled - would need migration from missing scripts)
  console.log('\n📝 Step 1: Priority.json generation...');
  console.log('⚠️  Priority generation not yet migrated - skipping this step');
  
  // Step 2: Generate individual character-limited files
  if (!options.skipGeneration) {
    console.log('\n📝 Step 2: Generating individual character-limited files...');
    try {
      await generateIndividualFiles({
        languages,
        characterLimits,
        configPath
      });
      console.log('✅ Individual file generation completed');
    } catch (error) {
      console.error('❌ Individual file generation failed:', error instanceof Error ? error.message : String(error));
      totalErrors++;
    }
  }
  
  // Step 3: Generate LLMS content formats
  console.log('\n🔗 Step 3: Generating LLMS content...');
  for (const language of languages) {
    console.log(`\n🌐 Processing LLMS content for: ${language}`);
    
    for (const limit of characterLimits) {
      try {
        const output = runCommand(
          `npm run cli -- generate --language ${language} --limit ${limit}`,
          `Generate ${language} content with ${limit} character limit`
        );
        
        if (output) {
          const match = output.match(/Generated: (\\d+)/);
          if (match) {
            totalGenerated += parseInt(match[1]);
          }
        }
      } catch (error) {
        console.error(`❌ Error generating ${language}-${limit}:`, error instanceof Error ? error.message : String(error));
        totalErrors++;
      }
    }
  }
  
  // Summary
  console.log('\n📊 Sync Summary:');
  console.log(`✅ Total files generated: ${totalGenerated}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  console.log(`🌐 Languages processed: ${languages.join(', ')}`);
  console.log(`📏 Character limits: ${characterLimits.join(', ')}`);
  
  if (totalErrors === 0) {
    console.log('\n🎉 Bulk sync operation completed successfully!');
  } else {
    console.log(`\n⚠️  Bulk sync completed with ${totalErrors} errors`);
  }
}

// CLI integration
export default {
  command: 'sync [options]',
  description: 'Perform bulk sync operation for all languages and character limits',
  handler: syncAll
};