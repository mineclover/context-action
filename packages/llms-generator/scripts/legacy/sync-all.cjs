#!/usr/bin/env node

/**
 * Config-based bulk sync operation for LLMS Generator
 * Handles priority.json generation + all LLMS content generation
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Load config
const CONFIG_PATH = path.resolve(__dirname, '../../llms-generator.config.json');

async function loadConfig() {
  try {
    const configContent = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Failed to load config:', error.message);
    process.exit(1);
  }
}

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return null;
  }
}

async function syncAll() {
  console.log('🚀 Starting config-based bulk sync operation...\n');
  
  const config = await loadConfig();
  console.log(`📋 Config loaded: ${config.languages.length} languages, ${config.characterLimits.length} character limits`);
  
  const languages = config.languages;
  const characterLimits = config.characterLimits;
  
  let totalGenerated = 0;
  let totalErrors = 0;
  
  // Step 1: Generate all priority.json templates
  console.log('\n📝 Step 1: Generating priority.json templates...');
  for (const language of languages) {
    console.log(`\n🌐 Processing language: ${language}`);
    
    const output = runCommand(
      `node packages/llms-generator/bulk-priority-generator.cjs ${language}`,
      `Generate priority templates for ${language}`
    );
    
    if (output) {
      const match = output.match(/Generated: (\d+)/);
      if (match) {
        totalGenerated += parseInt(match[1]);
      }
    } else {
      totalErrors++;
    }
  }
  
  // Step 2: Generate individual character-limited files from original docs
  console.log('\n📝 Step 2: Generating individual character-limited files...');
  runCommand(
    'node packages/llms-generator/generate-individual-files.cjs',
    'Generate individual character-limited files from original documents'
  );

  // Step 3: Generate all LLMS content formats
  console.log('\n🔗 Step 3: Generating LLMS content...');
  for (const language of languages) {
    console.log(`\n🌐 Processing LLMS content for: ${language}`);
    
    // Generate minimum format
    runCommand(
      `node packages/llms-generator/dist/cli/index.js minimum ${language}`,
      `Generate minimum format for ${language}`
    );
    
    // Generate origin format
    runCommand(
      `node packages/llms-generator/dist/cli/index.js origin ${language}`,
      `Generate origin format for ${language}`
    );
    
    // Generate character-limited formats
    for (const limit of characterLimits) {
      runCommand(
        `node packages/llms-generator/dist/cli/index.js chars ${limit} ${language}`,
        `Generate ${limit}-char format for ${language}`
      );
    }
    
    // Generate batch (alternative approach)
    const charLimitsStr = characterLimits.join(',');
    runCommand(
      `node packages/llms-generator/dist/cli/index.js batch --lang=${language} --chars=${charLimitsStr}`,
      `Generate batch formats for ${language}`
    );
  }
  
  // Step 4: Extract to data directory (optional)
  console.log('\n📦 Step 4: Extracting to data directory...');
  for (const language of languages) {
    const charLimitsStr = characterLimits.join(',');
    runCommand(
      `node packages/llms-generator/dist/cli/index.js extract ${language} --chars=${charLimitsStr}`,
      `Extract content for ${language}`
    );
  }
  
  // Step 5: Generate status report
  console.log('\n📊 Step 5: Generating status report...');
  runCommand(
    'node packages/llms-generator/dist/cli/index.js status',
    'Generate status report'
  );
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 BULK SYNC OPERATION COMPLETED!');
  console.log('='.repeat(60));
  console.log(`📝 Priority templates generated: ${totalGenerated}`);
  console.log(`🌐 Languages processed: ${languages.join(', ')}`);
  console.log(`📏 Character limits: ${characterLimits.join(', ')}`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  console.log('\n✨ All LLMS content and priority templates are now synchronized!');
}

// Run if called directly
if (require.main === module) {
  syncAll().catch(console.error);
}

module.exports = { syncAll };