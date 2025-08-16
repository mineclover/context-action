/**
 * Generate individual character-limited files using AdaptiveComposer
 * TypeScript migration of generate-individual-files.cjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AdaptiveComposer } from '../../core/AdaptiveComposer.js';
import type { LLMSConfig } from '../../types/config.js';

export interface GenerateOptions {
  languages?: string[];
  characterLimits?: number[];
  configPath?: string;
}

export async function generateIndividualFiles(options: GenerateOptions = {}): Promise<void> {
  console.log('🚀 Generating individual character-limited files from original documents...\n');
  
  // Load config
  const configPath = options.configPath || resolve(process.cwd(), 'llms-generator.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  
  // Configure paths
  const llmsConfig: LLMSConfig = {
    paths: {
      docsDir: resolve(process.cwd(), 'docs'),
      llmContentDir: resolve(process.cwd(), 'data'),
      outputDir: resolve(process.cwd(), 'data'),
      templatesDir: resolve(process.cwd(), 'templates'),
      instructionsDir: resolve(process.cwd(), 'instructions')
    },
    generation: {
      supportedLanguages: config.languages || ['en', 'ko'],
      characterLimits: config.characterLimits || [100, 200, 300, 400],
      defaultLanguage: 'en',
      outputFormat: 'md'
    },
    quality: {
      minCompletenessThreshold: 0.7,
      enableValidation: true,
      strictMode: false
    }
  };
  
  const composer = new AdaptiveComposer(llmsConfig);
  
  const languages = options.languages || config.languages || ['en', 'ko'];
  const characterLimits = options.characterLimits || config.characterLimits || [100, 200, 300, 400];
  
  for (const language of languages) {
    console.log(`\n🌐 Processing language: ${language}`);
    
    try {
      await composer.generateIndividualCharacterLimited(characterLimits, language);
    } catch (error) {
      console.error(`❌ Error processing ${language}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log('\n🎉 Individual file generation completed!');
}

// CLI integration
export default {
  command: 'generate [options]',
  description: 'Generate individual character-limited files from original documents',
  handler: generateIndividualFiles
};