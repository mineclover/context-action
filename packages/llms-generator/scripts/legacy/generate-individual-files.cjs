#!/usr/bin/env node

/**
 * Generate individual character-limited files using AdaptiveComposer
 * This replaces the template-based generation with real content extraction
 */

const path = require('path');

async function generateIndividualFiles() {
  console.log('🚀 Generating individual character-limited files from original documents...\n');
  
  // Import the AdaptiveComposer (using dynamic import for ES module)
  const { AdaptiveComposer } = await import('./dist/src-DOXAUL9a.js');
  
  // Load config
  const configPath = path.resolve(__dirname, '../../llms-generator.config.json');
  const config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'));
  
  // Configure paths
  const llmsConfig = {
    paths: {
      docsDir: path.resolve(__dirname, '../../docs'),
      llmContentDir: path.resolve(__dirname, 'data'),
      dataDir: path.resolve(__dirname, 'data')
    },
    generation: {
      defaultLanguage: 'en'
    }
  };
  
  const composer = new AdaptiveComposer(llmsConfig);
  
  const languages = config.languages || ['en', 'ko', 'ja'];
  const characterLimits = config.characterLimits || [100, 200, 300, 400];
  
  for (const language of languages) {
    console.log(`\n🌐 Processing language: ${language}`);
    
    try {
      await composer.generateIndividualCharacterLimited(characterLimits, language);
    } catch (error) {
      console.error(`❌ Error processing ${language}:`, error.message);
    }
  }
  
  console.log('\n🎉 Individual file generation completed!');
}

// Run if called directly
if (require.main === module) {
  generateIndividualFiles().catch(console.error);
}

module.exports = { generateIndividualFiles };